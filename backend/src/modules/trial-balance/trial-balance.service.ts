import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AccountType, JournalStatus, JournalSourceType, Prisma } from '@prisma/client';

export interface TrialBalanceParams {
  asOfDate?: Date;
  fiscalPeriodId?: string;
  adjusted?: boolean;
  includeZeroBalance?: boolean;
}

export interface TrialBalanceRow {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: AccountType;
  debitTotal: Prisma.Decimal;
  creditTotal: Prisma.Decimal;
  netBalance: Prisma.Decimal;
}

export interface TrialBalanceReport {
  generatedAt: Date;
  asOfDate: Date;
  fiscalPeriodId?: string;
  adjusted: boolean;
  isBalanced: boolean;
  totalDebits: Prisma.Decimal;
  totalCredits: Prisma.Decimal;
  variance: Prisma.Decimal;
  rows: TrialBalanceRow[];
}

@Injectable()
export class TrialBalanceService {
  private readonly logger = new Logger(TrialBalanceService.name);

  constructor(private readonly prisma: PrismaService) {}

  async generate(params: TrialBalanceParams = {}): Promise<TrialBalanceReport> {
    const {
      asOfDate = new Date(),
      fiscalPeriodId,
      adjusted = false,
      includeZeroBalance = false,
    } = params;

    const whereParams: Prisma.JournalEntryWhereInput = {
      status: JournalStatus.POSTED,
    };

    if (fiscalPeriodId) {
      whereParams.fiscalPeriodId = fiscalPeriodId;
    } else {
      whereParams.date = { lte: asOfDate };
    }

    if (!adjusted) {
      whereParams.sourceType = { not: JournalSourceType.CLOSING };
    }

    const lineAggregations = await this.prisma.journalLine.groupBy({
      by: ['accountId'],
      where: {
        journalEntry: whereParams,
      },
      _sum: {
        baseCurrencyDebit: true,
        baseCurrencyCredit: true,
      },
    });

    const allAccounts = await this.prisma.account.findMany({
      where: { isActive: true },
    });
    
    let totalDebits = new Prisma.Decimal(0);
    let totalCredits = new Prisma.Decimal(0);
    
    const aggMap = new Map();
    for (const agg of lineAggregations) {
      aggMap.set(agg.accountId, {
        debit: agg._sum.baseCurrencyDebit || new Prisma.Decimal(0),
        credit: agg._sum.baseCurrencyCredit || new Prisma.Decimal(0),
      });
    }

    let rows: TrialBalanceRow[] = allAccounts.map(account => {
      const agg = aggMap.get(account.id) || { debit: new Prisma.Decimal(0), credit: new Prisma.Decimal(0) };
      const debitTotal = new Prisma.Decimal(agg.debit);
      const creditTotal = new Prisma.Decimal(agg.credit);
      
      let netBalance = new Prisma.Decimal(0);
      if (['ASSET', 'EXPENSE'].includes(account.type)) {
        netBalance = debitTotal.minus(creditTotal);
      } else {
        netBalance = creditTotal.minus(debitTotal);
      }
      
      return {
        accountId: account.id,
        accountCode: account.code,
        accountName: account.name,
        accountType: account.type,
        debitTotal,
        creditTotal,
        netBalance,
      };
    });

    if (!includeZeroBalance) {
      rows = rows.filter(row => !row.debitTotal.equals(0) || !row.creditTotal.equals(0));
    }

    rows.sort((a, b) => a.accountCode.localeCompare(b.accountCode));

    for (const row of rows) {
      totalDebits = totalDebits.plus(row.debitTotal);
      totalCredits = totalCredits.plus(row.creditTotal);
    }

    const variance = totalDebits.minus(totalCredits);
    const isBalanced = variance.equals(0);

    return {
      generatedAt: new Date(),
      asOfDate,
      fiscalPeriodId,
      adjusted,
      isBalanced,
      totalDebits,
      totalCredits,
      variance,
      rows,
    };
  }

  async validateBalance(): Promise<{ isBalanced: boolean; variance: Prisma.Decimal }> {
    const report = await this.generate({
      asOfDate: new Date(),
      adjusted: true,
      includeZeroBalance: true,
    });
    return {
      isBalanced: report.isBalanced,
      variance: report.variance,
    };
  }
}
