import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTaxRateDto } from './dto/create-tax-rate.dto';
import { Prisma, TaxType, JournalStatus, JournalSourceType } from '@prisma/client';
import { JournalService } from '../journal/journal.service';

@Injectable()
export class TaxService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly journalService: JournalService,
  ) {}

  async createTaxRate(dto: CreateTaxRateDto) {
    if (dto.rate <= 0 || dto.rate >= 1) {
      throw new BadRequestException('Rate must be between 0 and 1 exclusive');
    }

    return this.prisma.$transaction(async (tx) => {
      if (dto.isDefault) {
        // Unset previous default of same type
        await tx.taxRate.updateMany({
          where: { type: dto.type, isDefault: true },
          data: { isDefault: false },
        });
      }

      return tx.taxRate.create({
        data: {
          name: dto.name,
          code: dto.code,
          rate: new Prisma.Decimal(dto.rate),
          type: dto.type,
          jurisdiction: dto.jurisdiction,
          accountId: dto.accountId,
          applicableFrom: new Date(dto.applicableFrom),
          applicableTo: dto.applicableTo ? new Date(dto.applicableTo) : null,
          isDefault: dto.isDefault || false,
          description: dto.description,
        },
      });
    });
  }

  async findAll(filters: { type?: TaxType; isActive?: boolean; jurisdiction?: string }) {
    const where: any = {};
    if (filters.type) where.type = filters.type;
    if (filters.isActive !== undefined) where.isActive = filters.isActive;
    if (filters.jurisdiction) where.jurisdiction = filters.jurisdiction;
    
    return this.prisma.taxRate.findMany({ where, orderBy: { name: 'asc' } });
  }

  async findOne(id: string) {
    const rate = await this.prisma.taxRate.findUnique({ where: { id } });
    if (!rate) throw new NotFoundException('Tax rate not found');
    return rate;
  }

  async getDefaultRate(type: TaxType) {
    return this.prisma.taxRate.findFirst({
      where: { type, isDefault: true, isActive: true },
    });
  }

  calculateTax(amount: number | Prisma.Decimal, rate: number | Prisma.Decimal) {
    const taxableAmount = new Prisma.Decimal(amount);
    const taxRate = new Prisma.Decimal(rate);
    const taxAmount = taxableAmount.mul(taxRate).toDecimalPlaces(4);
    const totalAmount = taxableAmount.add(taxAmount);

    return { taxableAmount, taxAmount, totalAmount };
  }

  async applyTaxToJournalEntry(journalEntryId: string, taxRateId: string, taxableAmount: number, isInput: boolean, createdById: string) {
    const je = await this.prisma.journalEntry.findUnique({
      where: { id: journalEntryId },
      include: { lines: true }
    });

    if (!je) throw new NotFoundException('Journal entry not found');
    if (je.status !== JournalStatus.POSTED) throw new BadRequestException('Can only apply tax to POSTED journal entries');

    const taxRate = await this.findOne(taxRateId);
    const { taxAmount } = this.calculateTax(taxableAmount, taxRate.rate);

    if (taxAmount.equals(0)) {
      throw new BadRequestException('Tax amount is zero');
    }

    // Determine accounts
    const accountsMap = await this.resolveSystemAccounts();
    const apAccount = accountsMap.get('2000');
    const arAccount = accountsMap.get('1100');
    const taxPayableAccount = taxRate.accountId; // Use account assigned to the tax rate

    if (!apAccount || !arAccount) throw new BadRequestException('Required system accounts (2000 or 1100) not found');

    const journalLines = [];
    if (isInput) {
      // Input VAT: Reclaimable from gov
      // Tax Receivable (DR) / AP (CR) or Cash (CR)
      // Per instructions: Tax Payable (2300) DR / AP (2000) CR
      journalLines.push({ accountId: taxPayableAccount, debit: taxAmount.toNumber(), credit: 0, description: `Input ${taxRate.name} on ${je.entryNumber}` });
      journalLines.push({ accountId: apAccount, debit: 0, credit: taxAmount.toNumber(), description: `Tax offset for ${je.entryNumber}` });
    } else {
      // Output VAT: Owed to gov
      // AR (DR) / Tax Payable (CR)
      journalLines.push({ accountId: arAccount, debit: taxAmount.toNumber(), credit: 0, description: `Tax offset for ${je.entryNumber}` });
      journalLines.push({ accountId: taxPayableAccount, debit: 0, credit: taxAmount.toNumber(), description: `Output ${taxRate.name} on ${je.entryNumber}` });
    }

    const taxJE = await this.journalService.createAndPost({
      date: je.date,
      description: `Tax application for ${je.entryNumber}: ${taxRate.name}`,
      reference: je.id,
      sourceType: JournalSourceType.ADJUSTMENT,
      lines: journalLines,
    }, createdById);

    return this.prisma.taxLine.create({
      data: {
        journalEntryId: je.id,
        taxRateId: taxRate.id,
        taxableAmount: new Prisma.Decimal(taxableAmount),
        taxAmount,
        taxAccountId: taxPayableAccount,
        isInput,
      }
    });
  }

  async getVatReturn(startDate: string, endDate: string) {
    const lines = await this.prisma.taxLine.findMany({
      where: {
        taxRate: { type: TaxType.VAT },
        journalEntry: {
          date: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
          status: JournalStatus.POSTED,
        }
      },
      include: {
        taxRate: true,
        journalEntry: true,
      }
    });

    let outputTax = new Prisma.Decimal(0);
    let inputTax = new Prisma.Decimal(0);
    const reportLines = [];

    for (const line of lines) {
      if (line.isInput) {
        inputTax = inputTax.add(line.taxAmount);
      } else {
        outputTax = outputTax.add(line.taxAmount);
      }

      reportLines.push({
        date: line.journalEntry.date,
        reference: line.journalEntry.entryNumber,
        description: line.journalEntry.description,
        taxableAmount: line.taxableAmount,
        taxAmount: line.taxAmount,
        taxRateName: line.taxRate.name,
        taxRateCode: line.taxRate.code,
        isInput: line.isInput,
      });
    }

    return {
      startDate,
      endDate,
      outputTax,
      inputTax,
      netVatPayable: outputTax.sub(inputTax),
      lines: reportLines,
    };
  }

  async getWithholdingSummary(startDate: string, endDate: string) {
    const lines = await this.prisma.taxLine.findMany({
      where: {
        taxRate: { type: TaxType.WITHHOLDING },
        journalEntry: {
          date: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
          status: JournalStatus.POSTED,
        }
      },
      include: { taxRate: true }
    });

    const summary: Record<string, any> = {};
    for (const line of lines) {
      if (!summary[line.taxRateId]) {
        summary[line.taxRateId] = {
          taxRateId: line.taxRateId,
          name: line.taxRate.name,
          code: line.taxRate.code,
          totalWithheld: new Prisma.Decimal(0),
        };
      }
      summary[line.taxRateId].totalWithheld = summary[line.taxRateId].totalWithheld.add(line.taxAmount);
    }

    return Object.values(summary);
  }

  private async resolveSystemAccounts() {
    const accounts = await this.prisma.account.findMany({
      where: { code: { in: ['1100', '2000', '2300'] } }
    });
    const map = new Map<string, string>();
    for (const acc of accounts) map.set(acc.code, acc.id);
    return map;
  }
}
