import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { CreateBillDto } from './dto/create-bill.dto';
import { PayBillDto } from './dto/pay-bill.dto';
import { Prisma, BillStatus, JournalSourceType } from '@prisma/client';
import { JournalService } from '../journal/journal.service';
import { TaxService } from '../tax/tax.service';

@Injectable()
export class ApService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly journalService: JournalService,
    private readonly taxService: TaxService,
  ) {}

  // 1. Vendor
  async createVendor(dto: CreateVendorDto) {
    return this.prisma.vendor.create({ data: dto });
  }

  async findAllVendors(filters: { isActive?: string }) {
    const where: any = {};
    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive === 'true';
    }
    return this.prisma.vendor.findMany({ where, include: { withholdingTaxRate: true || false } });
  }

  async findOneVendor(id: string) {
    const vendor = await this.prisma.vendor.findUnique({ where: { id }, include: { withholdingTaxRate: true } });
    if (!vendor) throw new NotFoundException('Vendor not found');
    return vendor;
  }

  async updateVendor(id: string, dto: UpdateVendorDto) {
    await this.findOneVendor(id);
    return this.prisma.vendor.update({ where: { id }, data: dto });
  }

  // 2. Bill
  async createBill(dto: CreateBillDto, createdById: string) {
    await this.findOneVendor(dto.vendorId);
    
    // Auto-generate billNumber "BILL-{YYYY}-{NNNN}"
    const billDate = new Date(dto.billDate);
    const yearStr = billDate.getFullYear().toString();
    const count = await this.prisma.bill.count({
      where: { billNumber: { startsWith: `BILL-${yearStr}-` } },
    });
    const nextNum = count + 1;
    const billNumber = `BILL-${yearStr}-${nextNum.toString().padStart(4, '0')}`;

    const subtotal = new Prisma.Decimal(dto.subtotal);
    const taxAmount = new Prisma.Decimal(dto.taxAmount || 0);
    const totalAmount = subtotal.add(taxAmount);

    return this.prisma.bill.create({
      data: {
        vendorId: dto.vendorId,
        propertyId: dto.propertyId,
        billNumber,
        billDate: new Date(dto.billDate),
        dueDate: new Date(dto.dueDate),
        subtotal,
        taxAmount,
        totalAmount,
        expenseAccountId: dto.expenseAccountId,
        description: dto.description,
        currency: dto.currency || 'USD',
        notes: dto.notes,
        createdById,
        status: BillStatus.DRAFT,
      },
    });
  }

  async postBill(billId: string, postedById: string) {
    const bill = await this.prisma.bill.findUnique({ where: { id: billId } });
    if (!bill) throw new NotFoundException('Bill not found');
    if (bill.status !== BillStatus.DRAFT) throw new ConflictException('Only DRAFT bills can be posted');

    const apAccount = await this.prisma.account.findFirst({ where: { code: '2000' } });
    if (!apAccount) throw new BadRequestException('Accounts Payable (2000) not found');

    const lines = [
      {
        accountId: bill.expenseAccountId,
        debit: bill.subtotal.toNumber(),
        credit: 0,
        description: bill.description,
      },
      {
        accountId: apAccount.id,
        debit: 0,
        credit: bill.totalAmount.toNumber(),
        description: `AP for Bill ${bill.billNumber}`,
      }
    ];

    if (bill.taxAmount.greaterThan(0)) {
      const taxAccount = await this.prisma.account.findFirst({ where: { code: '2300' } });
      if (!taxAccount) throw new BadRequestException('Tax Payable account (2300) not found');
      lines.push({
        accountId: taxAccount.id,
        debit: bill.taxAmount.toNumber(),
        credit: 0,
        description: `Tax for Bill ${bill.billNumber}`,
      });
    }

    // Create JournalEntry
    const journalEntry = await this.journalService.createAndPost(
      {
        date: bill.billDate,
        description: `Bill ${bill.billNumber} from Vendor ${bill.vendorId}`,
        reference: bill.id,
        sourceType: JournalSourceType.BILL,
        lines,
      },
      postedById
    );

    return this.prisma.bill.update({
      where: { id: bill.id },
      data: {
        status: BillStatus.POSTED,
        journalEntryId: journalEntry.id,
      },
    });
  }

  async payBill(billId: string, dto: PayBillDto, paidById: string) {
    const bill = await this.prisma.bill.findUnique({ 
      where: { id: billId },
      include: { vendor: { include: { withholdingTaxRate: true } } }
    });
    if (!bill) throw new NotFoundException('Bill not found');
    if (bill.status !== BillStatus.POSTED && bill.status !== BillStatus.PARTIAL) {
      throw new ConflictException('Bill is not POSTED or PARTIAL');
    }

    const amountToPayTotal = new Prisma.Decimal(dto.amount);
    const remainingBalance = bill.totalAmount.sub(bill.paidAmount);
    
    if (amountToPayTotal.greaterThan(remainingBalance)) {
      throw new BadRequestException('Payment amount exceeds remaining balance');
    }

    const accountsMap = await this.resolveSystemAccounts();
    const apAccount = accountsMap.get('2000');
    const cashAccount = accountsMap.get('1000');
    const taxPayableAccount = accountsMap.get('2300');
    
    if (!apAccount || !cashAccount || !taxPayableAccount) throw new BadRequestException('Required system accounts (1000, 2000, 2300) not found');

    let withholdingAmount = new Prisma.Decimal(0);
    const journalLines = [
      {
        accountId: apAccount,
        debit: amountToPayTotal.toNumber(),
        credit: 0,
        description: `AP Debit for Bill Payment ${bill.billNumber}`,
      }
    ];

    if (bill.vendor.withholdingTaxRate) {
      const whtRate = bill.vendor.withholdingTaxRate;
      withholdingAmount = amountToPayTotal.mul(whtRate.rate).toDecimalPlaces(4);
      
      if (withholdingAmount.gt(0)) {
        journalLines.push({
          accountId: taxPayableAccount,
          debit: 0,
          credit: withholdingAmount.toNumber(),
          description: `Withholding ${whtRate.name} on payment for ${bill.billNumber}`,
        });
      }
    }

    const cashAmountToPay = amountToPayTotal.sub(withholdingAmount);
    journalLines.push({
      accountId: cashAccount,
      debit: 0,
      credit: cashAmountToPay.toNumber(),
      description: `Cash Credit for Bill Payment ${bill.billNumber}`,
    });

    // Create JournalEntry
    const journalEntry = await this.journalService.createAndPost(
      {
        date: new Date(dto.paidAt),
        description: `Payment for Bill ${bill.billNumber}`,
        reference: bill.id,
        sourceType: JournalSourceType.BILL_PAYMENT,
        lines: journalLines
      },
      paidById
    );

    const billPayment = await this.prisma.billPayment.create({
      data: {
        billId: bill.id,
        amount: amountToPayTotal,
        paidAt: new Date(dto.paidAt),
        paymentMethod: dto.paymentMethod,
        reference: dto.reference,
        journalEntryId: journalEntry.id,
        createdById: paidById,
      }
    });

    if (withholdingAmount.gt(0) && bill.vendor.withholdingTaxRateId) {
      await this.prisma.taxLine.create({
        data: {
          journalEntryId: journalEntry.id,
          taxRateId: bill.vendor.withholdingTaxRateId,
          taxableAmount: amountToPayTotal,
          taxAmount: withholdingAmount,
          taxAccountId: taxPayableAccount,
          isInput: false, // Withholding is deducted from supplier payment
        }
      });
    }

    const newPaidAmount = bill.paidAmount.add(amountToPayTotal);
    const newStatus = newPaidAmount.equals(bill.totalAmount) ? BillStatus.PAID : BillStatus.PARTIAL;

    await this.prisma.bill.update({
      where: { id: bill.id },
      data: {
        paidAmount: newPaidAmount,
        status: newStatus,
      }
    });

    return billPayment;
  }

  private async resolveSystemAccounts() {
    const accounts = await this.prisma.account.findMany({
      where: { code: { in: ['1000', '1100', '2000', '2300'] } }
    });
    const map = new Map<string, string>();
    for (const acc of accounts) map.set(acc.code, acc.id);
    return map;
  }

  async findAllBills(filters: { vendorId?: string; propertyId?: string; status?: BillStatus; startDate?: string; endDate?: string }) {
    const where: any = {};
    if (filters.vendorId) where.vendorId = filters.vendorId;
    if (filters.propertyId) where.propertyId = filters.propertyId;
    if (filters.status) where.status = filters.status;
    if (filters.startDate || filters.endDate) {
      where.billDate = {};
      if (filters.startDate) where.billDate.gte = new Date(filters.startDate);
      if (filters.endDate) where.billDate.lte = new Date(filters.endDate);
    }
    return this.prisma.bill.findMany({ where, include: { vendor: true } });
  }

  async findOneBill(id: string) {
    const bill = await this.prisma.bill.findUnique({
      where: { id },
      include: {
        vendor: true,
        payments: true,
        journalEntry: { include: { lines: true } },
      }
    });
    if (!bill) throw new NotFoundException('Bill not found');
    return bill;
  }

  async getApAgingReport(asOfDate?: string) {
    const targetDate = asOfDate ? new Date(asOfDate) : new Date();
    const unpaidBills = await this.prisma.bill.findMany({
      where: {
        status: { in: [BillStatus.POSTED, BillStatus.PARTIAL] },
        dueDate: { lte: targetDate }
      },
      include: { vendor: true }
    });

    const report: Record<string, any> = {};
    for (const bill of unpaidBills) {
      const remaining = bill.totalAmount.sub(bill.paidAmount).toNumber();
      const daysOverdue = Math.floor((targetDate.getTime() - bill.dueDate.getTime()) / (1000 * 60 * 60 * 24));
      
      let bucket = 'current';
      if (daysOverdue > 90) bucket = '90+';
      else if (daysOverdue > 60) bucket = '60-90';
      else if (daysOverdue > 30) bucket = '30-60';
      else if (daysOverdue > 0) bucket = '1-30';

      if (!report[bill.vendorId]) {
        report[bill.vendorId] = {
          vendorId: bill.vendorId,
          vendorName: bill.vendor.name,
          current: 0,
          '1-30': 0,
          '30-60': 0,
          '60-90': 0,
          '90+': 0,
          total: 0
        };
      }
      report[bill.vendorId][bucket] += remaining;
      report[bill.vendorId].total += remaining;
    }
    return Object.values(report);
  }
}
