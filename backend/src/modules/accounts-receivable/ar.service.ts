import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JournalService } from '../journal/journal.service';
import { AccountService } from '../account/account.service';
import { JournalSourceType, Prisma } from '@prisma/client';

@Injectable()
export class ArService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly journalService: JournalService,
    private readonly accountService: AccountService,
  ) {}

  private async getTenantJournalReferences(tenantId: string): Promise<string[]> {
    const leases = await this.prisma.lease.findMany({
      where: { tenantId },
      include: { payments: true, installments: true },
    });
    
    const references: string[] = [tenantId];
    for (const lease of leases) {
      references.push(lease.id);
      for (const p of lease.payments) references.push(p.id);
      for (const i of lease.installments) references.push(i.id);
    }
    return references;
  }

  async getTenantBalance(tenantId: string): Promise<number> {
    const references = await this.getTenantJournalReferences(tenantId);
    if (references.length === 0) return 0;

    const arAccount = await this.prisma.account.findUnique({ where: { code: '1100' } });
    if (!arAccount) throw new NotFoundException('AR Account (1100) not found');

    const aggregations = await this.prisma.journalLine.aggregate({
      where: {
        accountId: arAccount.id,
        journalEntry: {
          reference: { in: references },
          status: 'POSTED',
        },
      },
      _sum: {
        baseCurrencyDebit: true,
        baseCurrencyCredit: true,
      },
    });

    const debit = Number(aggregations._sum.baseCurrencyDebit || 0);
    const credit = Number(aggregations._sum.baseCurrencyCredit || 0);
    return debit - credit;
  }

  async getTenantStatement(tenantId: string, filters: { startDate?: Date; endDate?: Date }) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tenant not found');

    const references = await this.getTenantJournalReferences(tenantId);
    const arAccount = await this.prisma.account.findUnique({ where: { code: '1100' } });
    if (!arAccount) throw new NotFoundException('AR Account (1100) not found');

    let openingBalance = 0;
    if (filters.startDate) {
      const pastAgg = await this.prisma.journalLine.aggregate({
        where: {
          accountId: arAccount.id,
          journalEntry: {
            reference: { in: references },
            status: 'POSTED',
            date: { lt: filters.startDate },
          },
        },
        _sum: { baseCurrencyDebit: true, baseCurrencyCredit: true },
      });
      openingBalance = Number(pastAgg._sum.baseCurrencyDebit || 0) - Number(pastAgg._sum.baseCurrencyCredit || 0);
    }

    const whereClause: any = {
      accountId: arAccount.id,
      journalEntry: {
        reference: { in: references },
        status: 'POSTED',
      },
    };

    if (filters.startDate || filters.endDate) {
      whereClause.journalEntry.date = {};
      if (filters.startDate) whereClause.journalEntry.date.gte = filters.startDate;
      if (filters.endDate) whereClause.journalEntry.date.lte = filters.endDate;
    }

    const lines = await this.prisma.journalLine.findMany({
      where: whereClause,
      include: {
        journalEntry: true,
      },
      orderBy: {
        journalEntry: {
          date: 'asc',
        },
      },
    });

    let runningBalance = openingBalance;
    const formattedLines = lines.map((line: any) => {
      const debit = Number(line.baseCurrencyDebit || 0);
      const credit = Number(line.baseCurrencyCredit || 0);
      runningBalance += (debit - credit);
      
      return {
        date: line.journalEntry.date,
        description: line.description || line.journalEntry.description,
        reference: line.journalEntry.reference,
        sourceType: line.journalEntry.sourceType,
        debit,
        credit,
        runningBalance,
      };
    });

    return {
      tenant: { id: tenant.id, name: `${tenant.firstName} ${tenant.lastName}`, email: tenant.email },
      openingBalance,
      closingBalance: runningBalance,
      lines: formattedLines,
    };
  }

  async getAgingReport(asOfDate?: Date) {
    const targetDate = asOfDate || new Date();
    
    const tenants = await this.prisma.tenant.findMany({
      include: {
        leases: {
          include: {
            installments: {
              where: {
                status: {
                  in: ['PENDING', 'OVERDUE', 'PARTIALLY_PAID']
                }
              }
            },
            unit: {
              include: {
                property: true
              }
            }
          }
        }
      }
    });

    const rows = [];
    let totalOutstanding = 0;

    for (const tenant of tenants) {
      const actualBalance = await this.getTenantBalance(tenant.id);
      if (actualBalance <= 0) continue;

      let bCurrent = 0;
      let b30 = 0;
      let b60 = 0;
      let b90 = 0;
      let b90plus = 0;

      let tenantTotal = 0;
      let propertyName = '';
      let unitNumber = '';

      for (const lease of tenant.leases) {
        if (!propertyName) propertyName = lease.unit.property.name;
        if (!unitNumber) unitNumber = lease.unit.unitNumber;

        for (const inst of lease.installments) {
          const unpaid = inst.amount - inst.paidAmount;
          if (unpaid <= 0) continue;

          tenantTotal += unpaid;
          
          const timeDiff = targetDate.getTime() - inst.dueDate.getTime();
          const daysOverdue = Math.floor(timeDiff / (1000 * 3600 * 24));

          if (daysOverdue <= 0) {
            bCurrent += unpaid;
          } else if (daysOverdue <= 30) {
            b30 += unpaid;
          } else if (daysOverdue <= 60) {
            b60 += unpaid;
          } else if (daysOverdue <= 90) {
            b90 += unpaid;
          } else {
            b90plus += unpaid;
          }
        }
      }

      if (tenantTotal > 0) {
        totalOutstanding += tenantTotal;
        rows.push({
          tenantId: tenant.id,
          tenantName: `${tenant.firstName} ${tenant.lastName}`,
          propertyName,
          unitNumber,
          current: bCurrent,
          bucket30: b30,
          bucket60: b60,
          bucket90: b90,
          bucket90plus: b90plus,
          total: tenantTotal,
        });
      }
    }

    return {
      asOfDate: targetDate,
      totalOutstanding,
      rows,
    };
  }

  async writeOff(dto: { tenantId: string; amount: number; reason: string; approvedById: string }) {
    if (dto.amount <= 0) throw new BadRequestException('Amount must be positive');

    const currentBalance = await this.getTenantBalance(dto.tenantId);
    if (currentBalance < dto.amount) {
      throw new BadRequestException('Cannot write off more than the current AR balance');
    }

    const arAccount = await this.prisma.account.findUnique({ where: { code: '1100' } });
    const badDebtAccount = await this.prisma.account.findUnique({ where: { code: '5400' } });

    if (!arAccount || !badDebtAccount) {
      throw new BadRequestException('System accounts 1100 or 5400 are missing');
    }

    const entry = await this.journalService.createAndPost({
      reference: dto.tenantId,
      date: new Date(),
      description: `AR write-off for tenant #${dto.tenantId}: ${dto.reason}`,
      sourceType: JournalSourceType.WRITE_OFF,
      lines: [
        {
          accountId: badDebtAccount.id,
          debit: dto.amount,
          credit: 0,
        },
        {
          accountId: arAccount.id,
          debit: 0,
          credit: dto.amount,
        }
      ]
    }, dto.approvedById);

    return (this.prisma as any).writeOff.create({
      data: {
        tenantId: dto.tenantId,
        amount: dto.amount,
        reason: dto.reason,
        journalEntryId: entry.id,
        approvedById: dto.approvedById,
      }
    });
  }

  async createCreditMemo(dto: { tenantId: string; amount: number; reason: string; createdById: string }) {
    if (dto.amount <= 0) throw new BadRequestException('Amount must be positive');

    const arAccount = await this.prisma.account.findUnique({ where: { code: '1100' } });
    const otherRevenueAccount = await this.prisma.account.findUnique({ where: { code: '4200' } });

    if (!arAccount || !otherRevenueAccount) {
      throw new BadRequestException('System accounts 1100 or 4200 are missing');
    }

    const entry = await this.journalService.createAndPost({
      reference: dto.tenantId,
      date: new Date(),
      description: `Credit memo for tenant #${dto.tenantId}: ${dto.reason}`,
      sourceType: JournalSourceType.CREDIT_MEMO,
      lines: [
        {
          accountId: arAccount.id,
          debit: dto.amount,
          credit: 0,
        },
        {
          accountId: otherRevenueAccount.id,
          debit: 0,
          credit: dto.amount,
        }
      ]
    }, dto.createdById);

    return (this.prisma as any).creditMemo.create({
      data: {
        tenantId: dto.tenantId,
        amount: dto.amount,
        reason: dto.reason,
        journalEntryId: entry.id,
        createdById: dto.createdById,
      }
    });
  }
}
