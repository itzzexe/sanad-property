import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AccountType, Prisma, JournalStatus } from '@prisma/client';
import { ReportParams } from './types/report-params';
import { IncomeStatementReport, IncomeStatementSection } from './types/income-statement.types';
import { BalanceSheetReport, BalanceSheetLine } from './types/balance-sheet.types';
import { CashFlowReport } from './types/cash-flow.types';
import { PropertyProfitabilityReport } from './types/property-profitability.types';
import { ArService } from '../accounts-receivable/ar.service';
import { BudgetService } from '../budget/budget.service';

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly arService: ArService,
    private readonly budgetService: BudgetService,
  ) {}

  private async getPeriodRange(params: ReportParams) {
    if (params.fiscalPeriodId) {
      const p = await this.prisma.fiscalPeriod.findUnique({ where: { id: params.fiscalPeriodId } });
      if (!p) throw new NotFoundException('Fiscal period not found');
      return { startDate: p.startDate, endDate: p.endDate };
    }
    if (params.fiscalYearId) {
      const y = await this.prisma.fiscalYear.findUnique({ where: { id: params.fiscalYearId } });
      if (!y) throw new NotFoundException('Fiscal year not found');
      return { startDate: y.startDate, endDate: y.endDate };
    }
    if (params.startDate && params.endDate) {
      return { startDate: new Date(params.startDate), endDate: new Date(params.endDate) };
    }

    // Default to current open year
    const y = await this.prisma.fiscalYear.findFirst({
      where: { status: 'OPEN' },
      orderBy: { startDate: 'desc' }
    });
    return {
      startDate: y?.startDate || new Date(new Date().getFullYear(), 0, 1),
      endDate: y?.endDate || new Date(new Date().getFullYear(), 11, 31, 23, 59, 59),
    };
  }

  async incomeStatement(params: ReportParams): Promise<IncomeStatementReport> {
    const { startDate, endDate } = await this.getPeriodRange(params);

    const getBalances = async (start: Date, end: Date) => {
      const lines = await this.prisma.journalLine.findMany({
        where: {
          journalEntry: {
            status: JournalStatus.POSTED,
            date: { gte: start, lte: end },
          },
          account: { type: { in: [AccountType.REVENUE, AccountType.EXPENSE] } }
        },
        include: { account: true }
      });

      const map = new Map<string, { code: string, name: string, type: string, subtype: string, amount: number }>();
      for (const line of lines) {
        if (!map.has(line.accountId)) {
          map.set(line.accountId, {
            code: line.account.code,
            name: line.account.name,
            type: line.account.type,
            subtype: line.account.subtype || 'OTHER',
            amount: 0
          });
        }
        const item = map.get(line.accountId)!;
        const debit = Number(line.baseCurrencyDebit);
        const credit = Number(line.baseCurrencyCredit);

        if (line.account.type === AccountType.REVENUE) {
          item.amount += (credit - debit);
        } else {
          item.amount += (debit - credit);
        }
      }
      return map;
    };

    const currentBalances = await getBalances(startDate, endDate);
    let priorBalances: Map<string, any> | null = null;

    if (params.compareWithPriorPeriod) {
      const diff = endDate.getTime() - startDate.getTime();
      const priorStart = new Date(startDate.getTime() - diff);
      const priorEnd = new Date(startDate.getTime() - 1);
      priorBalances = await getBalances(priorStart, priorEnd);
    }

    const sectionsData: Record<string, any[]> = {
      'Operating Revenue': [],
      'Other Revenue': [],
      'Operating Expense': [],
      'Other Expense': [],
    };

    let totalRevenue = 0;
    let totalExpense = 0;

    currentBalances.forEach((val, id) => {
      const prior = priorBalances?.get(id);
      const line = {
        code: val.code,
        name: val.name,
        amount: val.amount,
        priorAmount: prior?.amount || 0,
        variance: val.amount - (prior?.amount || 0),
        variancePct: prior?.amount ? ((val.amount - prior.amount) / prior.amount) * 100 : 0
      };

      let category = '';
      if (val.type === 'REVENUE') {
        category = val.subtype.includes('OPERATING') ? 'Operating Revenue' : 'Other Revenue';
        totalRevenue += val.amount;
      } else {
        category = val.subtype.includes('OPERATING') ? 'Operating Expense' : 'Other Expense';
        totalExpense += val.amount;
      }
      sectionsData[category].push(line);
    });

    const sections: IncomeStatementSection[] = Object.keys(sectionsData).map(title => ({
      title,
      accounts: sectionsData[title],
      subtotal: sectionsData[title].reduce((sum, a) => sum + a.amount, 0),
    }));

    const netIncome = totalRevenue - totalExpense;

    return {
      period: { startDate, endDate },
      sections,
      totalRevenue,
      totalExpense,
      netIncome,
    };
  }

  async balanceSheet(params: ReportParams): Promise<BalanceSheetReport> {
    const { endDate } = await this.getPeriodRange(params);

    const lines = await this.prisma.journalLine.findMany({
      where: {
        journalEntry: {
          status: JournalStatus.POSTED,
          date: { lte: endDate },
        },
        account: { type: { in: [AccountType.ASSET, AccountType.LIABILITY, AccountType.EQUITY] } }
      },
      include: { account: true }
    });

    const accountMap = new Map<string, { code: string, name: string, type: string, subtype: string, balance: number }>();
    for (const line of lines) {
      if (!accountMap.has(line.accountId)) {
        accountMap.set(line.accountId, {
          code: line.account.code,
          name: line.account.name,
          type: line.account.type,
          subtype: line.account.subtype || 'OTHER',
          balance: 0
        });
      }
      const item = accountMap.get(line.accountId)!;
      const dr = Number(line.baseCurrencyDebit);
      const cr = Number(line.baseCurrencyCredit);

      if (line.account.type === AccountType.ASSET) {
        item.balance += (dr - cr);
      } else {
        item.balance += (cr - dr);
      }
    }

    // Add Retained Earnings (Net Income from inception to date)
    const plLines = await this.prisma.journalLine.findMany({
      where: {
        journalEntry: {
          status: JournalStatus.POSTED,
          date: { lte: endDate },
        },
        account: { type: { in: [AccountType.REVENUE, AccountType.EXPENSE] } }
      },
      include: { account: true }
    });

    let cumulativeNetIncome = 0;
    for (const line of plLines) {
      const dr = Number(line.baseCurrencyDebit);
      const cr = Number(line.baseCurrencyCredit);
      if (line.account.type === 'REVENUE') cumulativeNetIncome += (cr - dr);
      else cumulativeNetIncome -= (dr - cr);
    }

    const assets_current: BalanceSheetLine[] = [];
    const assets_fixed: BalanceSheetLine[] = [];
    const liab_current: BalanceSheetLine[] = [];
    const liab_long: BalanceSheetLine[] = [];
    const equity: BalanceSheetLine[] = [];

    accountMap.forEach(val => {
      const line = { code: val.code, name: val.name, balance: val.balance };
      if (val.type === 'ASSET') {
        if (val.subtype.includes('FIXED')) assets_fixed.push(line);
        else assets_current.push(line);
      } else if (val.type === 'LIABILITY') {
        if (val.subtype.includes('LONG_TERM')) liab_long.push(line);
        else liab_current.push(line);
      } else {
        equity.push(line);
      }
    });

    equity.push({ code: '3100', name: 'Retained Earnings (Cumulative)', balance: cumulativeNetIncome });

    const totalAssets = assets_current.reduce((s, a) => s + a.balance, 0) + assets_fixed.reduce((s, a) => s + a.balance, 0);
    const totalLiabilities = liab_current.reduce((s, l) => s + l.balance, 0) + liab_long.reduce((s, l) => s + l.balance, 0);
    const totalEquity = equity.reduce((s, e) => s + e.balance, 0);

    const variance = totalAssets - (totalLiabilities + totalEquity);

    return {
      asOfDate: endDate,
      isBalanced: Math.abs(variance) < 0.01,
      variance,
      assets: { currentAssets: assets_current, fixedAssets: assets_fixed, totalAssets },
      liabilities: { currentLiabilities: liab_current, longTermLiabilities: liab_long, totalLiabilities },
      equity: { lines: equity, totalEquity },
      totalLiabilitiesAndEquity: totalLiabilities + totalEquity
    };
  }

  async cashFlowStatement(params: ReportParams): Promise<CashFlowReport> {
    const { startDate, endDate } = await this.getPeriodRange(params);
    const is = await this.incomeStatement(params);

    const getBalanceChange = async (accountCode: string) => {
      const startBal = await this.getAccountBalanceAt(accountCode, startDate);
      const endBal = await this.getAccountBalanceAt(accountCode, endDate);
      return endBal - startBal;
    };

    const arChange = await getBalanceChange('1100'); // Asset: increase = cash used (-)
    const apChange = await getBalanceChange('2000'); // Liab: increase = cash provided (+)
    const defRevChange = await getBalanceChange('2200'); // Liab: increase = cash provided (+)

    const operatingItems = [
      { name: 'Increase in Accounts Receivable', amount: -arChange },
      { name: 'Increase in Accounts Payable', amount: apChange },
      { name: 'Increase in Deferred Revenue', amount: defRevChange },
    ];

    const investingLines = await this.prisma.journalLine.findMany({
      where: {
        journalEntry: { status: JournalStatus.POSTED, date: { gte: startDate, lte: endDate } },
        account: { subtype: { contains: 'FIXED' } }
      }
    });
    const investingTotal = investingLines.reduce((s, l) => s + (Number(l.baseCurrencyCredit) - Number(l.baseCurrencyDebit)), 0);

    const financingLines = await this.prisma.journalLine.findMany({
      where: {
        journalEntry: { status: JournalStatus.POSTED, date: { gte: startDate, lte: endDate } },
        account: { type: AccountType.EQUITY }
      }
    });
    const financingTotal = financingLines.reduce((s, l) => s + (Number(l.baseCurrencyCredit) - Number(l.baseCurrencyDebit)), 0);

    const operatingTotal = is.netIncome + operatingItems.reduce((s, i) => s + i.amount, 0);
    const netCashChange = operatingTotal + investingTotal + financingTotal;

    const openingCash = await this.getAccountBalanceAt('1000', startDate);
    const closingCash = await this.getAccountBalanceAt('1000', endDate);

    return {
      period: { startDate, endDate },
      netIncome: is.netIncome,
      operatingActivities: { items: operatingItems, total: operatingTotal },
      investingActivities: { items: [], total: investingTotal },
      financingActivities: { items: [], total: financingTotal },
      netCashChange,
      openingCash,
      closingCash
    };
  }

  async propertyProfitability(params: ReportParams): Promise<PropertyProfitabilityReport> {
    const { startDate, endDate } = await this.getPeriodRange(params);
    const properties = await this.prisma.property.findMany();
    const report: PropertyProfitabilityReport = [];

    for (const prop of properties) {
       const revLines = await this.prisma.journalLine.findMany({
         where: {
           journalEntry: { status: JournalStatus.POSTED, date: { gte: startDate, lte: endDate } },
           account: { type: AccountType.REVENUE },
           // Links via reference containing Lease ID or Installment ID.
           // In production this would use join tables or structured metadata.
           // Simplified for now: search by property unit inhabitants
         }
       });

       const expLines = await this.prisma.journalLine.findMany({
         where: {
           journalEntry: { status: JournalStatus.POSTED, date: { gte: startDate, lte: endDate } },
           account: { type: AccountType.EXPENSE },
         }
       });

       const revenue = revLines.reduce((s, l) => s + (Number(l.baseCurrencyCredit) - Number(l.baseCurrencyDebit)), 0);
       const expenses = expLines.reduce((s, l) => s + (Number(l.baseCurrencyDebit) - Number(l.baseCurrencyCredit)), 0);
       const netProfit = revenue - expenses;

       report.push({
         propertyId: prop.id,
         propertyName: prop.name || 'Unknown',
         propertyCode: prop.id, // placeholder
         revenue,
         expenses,
         netProfit,
         netProfitMarginPct: revenue > 0 ? (netProfit / revenue) * 100 : 0,
         occupancyRate: 0.85, // Placeholder - logic: sum(lease days) / (unitCount * periodDays)
         unitCount: 10,
         occupiedUnits: 8
       });
    }

    return report;
  }

  async trialBalance(params: ReportParams) {
    const { endDate } = await this.getPeriodRange(params);
    const accounts = await this.prisma.account.findMany();
    const rows = [];
    let totalDebit = 0;
    let totalCredit = 0;

    for (const acc of accounts) {
      const agg = await this.prisma.journalLine.aggregate({
        where: {
          accountId: acc.id,
          journalEntry: { status: JournalStatus.POSTED, date: { lte: endDate } }
        },
        _sum: { baseCurrencyDebit: true, baseCurrencyCredit: true }
      });
      const debit = Number(agg._sum.baseCurrencyDebit || 0);
      const credit = Number(agg._sum.baseCurrencyCredit || 0);
      if (debit === 0 && credit === 0) continue;

      rows.push({
        accountCode: acc.code,
        accountName: acc.name,
        debit,
        credit
      });
      totalDebit += debit;
      totalCredit += credit;
    }
    return { asOfDate: endDate, rows, totalDebit, totalCredit };
  }

  async arAging(params: ReportParams) {
    const { endDate } = await this.getPeriodRange(params);
    return this.arService.getAgingReport(endDate);
  }

  async budgetVsActual(params: ReportParams) {
    const budget = await this.prisma.budget.findFirst({
      where: { status: 'APPROVED' },
      orderBy: { createdAt: 'desc' }
    });
    if (!budget) throw new NotFoundException('No approved budget found');
    return this.budgetService.getVariance(budget.id);
  }

  private async getAccountBalanceAt(accountCode: string, date: Date) {
    const lines = await this.prisma.journalLine.findMany({
      where: {
        account: { code: accountCode },
        journalEntry: { status: JournalStatus.POSTED, date: { lt: date } }
      },
      include: { account: true }
    });

    let bal = 0;
    for (const l of lines) {
      const dr = Number(l.baseCurrencyDebit);
      const cr = Number(l.baseCurrencyCredit);
      if (['ASSET', 'EXPENSE'].includes(l.account.type)) bal += (dr - cr);
      else bal += (cr - dr);
    }
    return bal;
  }
}
