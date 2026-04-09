import { PrismaService } from '../../prisma/prisma.service';
import { ReportsService } from '../reports/reports.service';
import { ArService } from '../accounts-receivable/ar.service';
import { JournalService } from '../journal/journal.service';
import { FiscalPeriodService } from '../fiscal-period/fiscal-period.service';
import { BudgetService } from '../budget/budget.service';
import { AccountType, JournalStatus, BudgetStatus } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { Injectable } from '@nestjs/common';

export interface FinanceDashboardStats {
  asOf: Date;
  currentPeriod: { name: string; startDate: Date; endDate: Date };
  revenue: { mtd: number; priorMonthMtd: number; ytd: number; mtdGrowthPct: number };
  expenses: { mtd: number; ytd: number };
  netIncome: { mtd: number; ytd: number };
  cashPosition: number;
  ar: { totalOutstanding: number; current: number; overdue30: number; overdue60: number; overdue90plus: number };
  ap: { totalOutstanding: number };
  budget: { currentPeriodBudgetedRevenue: number; currentPeriodActualRevenue: number; utilizationPct: number; isOverBudget: boolean } | null;
  revenueTrend: { periodName: string; revenue: number; expense: number; netIncome: number }[];
  topProperties: { propertyId: string; propertyName: string; revenue: number; netProfit: number; occupancyRate: number }[];
  unrealizedFxExposure: number | null;
}

@Injectable()
export class DashboardService {
  private financeCache: { data: FinanceDashboardStats; cachedAt: number } | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly reportsService: ReportsService,
    private readonly arService: ArService,
    private readonly journalService: JournalService,
    private readonly fiscalPeriodService: FiscalPeriodService,
    private readonly budgetService: BudgetService,
  ) {}

  async getStats() {
    const [
      totalProperties,
      totalUnits,
      rentedUnits,
      availableUnits,
      maintenanceUnits,
      totalTenants,
      activeLeases,
      totalPayments,
      totalRevenue,
      pendingInstallments,
      overdueInstallments,
      totalExpenses,
      assetsInfo
    ] = await Promise.all([
      this.prisma.property.count({ where: { deletedAt: null } }),
      this.prisma.unit.count({ where: { deletedAt: null } }),
      this.prisma.unit.count({ where: { status: 'RENTED', deletedAt: null } }),
      this.prisma.unit.count({ where: { status: 'AVAILABLE', deletedAt: null } }),
      this.prisma.unit.count({ where: { status: 'MAINTENANCE', deletedAt: null } }),
      this.prisma.tenant.count({ where: { deletedAt: null } }),
      this.prisma.lease.count({ where: { status: 'ACTIVE', deletedAt: null } }),
      this.prisma.payment.count({ where: { deletedAt: null } }),
      this.prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: 'COMPLETED', deletedAt: null },
      }),
      this.prisma.installment.count({ where: { status: 'PENDING' } }),
      this.prisma.installment.count({ where: { status: 'OVERDUE' } }),
      this.prisma.expense.aggregate({
        _sum: { amount: true },
      }),
      this.prisma.asset.findMany({ where: { isActive: true } })
    ]);

    // Calculate total depreciation for all assets
    let totalDepreciation = 0;
    const now = new Date();
    assetsInfo.forEach(asset => {
       const yearsOwned = (now.getTime() - new Date(asset.purchaseDate).getTime()) / (1000 * 3600 * 24 * 365);
       const accumulatedDep = Math.min(asset.value, asset.value * (asset.depreciationRate / 100) * Math.max(0, yearsOwned));
       totalDepreciation += accumulatedDep;
    });

    const occupancyRate = totalUnits > 0 ? ((rentedUnits / totalUnits) * 100).toFixed(1) : '0';

    return {
      properties: totalProperties,
      units: {
        total: totalUnits,
        rented: rentedUnits,
        available: availableUnits,
        maintenance: maintenanceUnits,
      },
      tenants: totalTenants,
      leases: { active: activeLeases },
      payments: {
        total: totalPayments,
        revenue: totalRevenue._sum.amount || 0,
      },
      installments: {
        pending: pendingInstallments,
        overdue: overdueInstallments,
      },
      expenses: {
         total: totalExpenses._sum.amount || 0
      },
      assets: {
         depreciation: totalDepreciation
      },
      occupancyRate: parseFloat(occupancyRate),
    };
  }

  async getRevenueChart(months: number = 12) {
    const monthsNum = parseInt(String(months)) || 12;
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - monthsNum);

    const payments = await this.prisma.payment.findMany({
      where: {
        status: 'COMPLETED',
        paidDate: { gte: startDate },
        deletedAt: null,
      },
      select: { amount: true, paidDate: true, currency: true },
      orderBy: { paidDate: 'asc' },
    });

    // Group by month
    const monthly: Record<string, number> = {};
    payments.forEach((p: any) => {
      const key = `${p.paidDate.getFullYear()}-${String(p.paidDate.getMonth() + 1).padStart(2, '0')}`;
      monthly[key] = (monthly[key] || 0) + p.amount;
    });

    return Object.entries(monthly).map(([month, amount]) => ({ month, amount }));
  }

  async getRecentPayments(limit: number = 5) {
    const take = parseInt(String(limit)) || 5;
    return this.prisma.payment.findMany({
      where: { deletedAt: null },
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        lease: { include: { tenant: true, unit: { include: { property: true } } } },
      },
    });
  }

  async getExpiringLeases(days: number = 30) {
    const daysNum = parseInt(String(days)) || 30;
    const now = new Date();
    const future = new Date();
    future.setDate(future.getDate() + daysNum);

    return this.prisma.lease.findMany({
      where: {
        status: 'ACTIVE',
        endDate: { gte: now, lte: future },
        deletedAt: null,
      },
      include: {
        tenant: true,
        unit: { include: { property: true } },
      },
      orderBy: { endDate: 'asc' },
    });
  }

  async getFinanceStats(): Promise<FinanceDashboardStats> {
    const CACHE_TTL = 5 * 60 * 1000; // 5 mins
    if (this.financeCache && (Date.now() - this.financeCache.cachedAt) < CACHE_TTL) {
      return this.financeCache.data;
    }

    const now = new Date();
    const currentPeriod = await this.fiscalPeriodService.findCurrentPeriod();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfPriorMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfPriorMonthMtd = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

    // 1. Revenue/Expense MTD & Prior
    const [mtdActuals, priorMtdActuals, ytdActuals] = await Promise.all([
      this.getGlTotals(startOfMonth, now),
      this.getGlTotals(startOfPriorMonth, endOfPriorMonthMtd),
      this.getGlTotals(new Date(now.getFullYear(), 0, 1), now),
    ]);

    // 2. Cash Position
    const cashAccounts = await this.prisma.journalLine.aggregate({
      where: {
        account: { code: { startsWith: '1' }, subtype: 'CURRENT_ASSET' },
        journalEntry: { status: JournalStatus.POSTED }
      },
      _sum: { baseCurrencyDebit: true, baseCurrencyCredit: true }
    });
    const cashPosition = Number(cashAccounts._sum.baseCurrencyDebit || 0) - Number(cashAccounts._sum.baseCurrencyCredit || 0);

    // 3. AR Aging
    const arAging = await this.arService.getAgingReport(now);

    // 4. AP Total
    const apLines = await this.prisma.journalLine.aggregate({
      where: { account: { code: '2000' }, journalEntry: { status: JournalStatus.POSTED } },
      _sum: { baseCurrencyDebit: true, baseCurrencyCredit: true }
    });
    const apTotal = Number(apLines._sum.baseCurrencyCredit || 0) - Number(apLines._sum.baseCurrencyDebit || 0);

    // 5. Budget Variance
    const budget = await this.getBudgetMetrics(currentPeriod.id);

    // 6. Trend
    const trend = await this.getFinanceTrend();

    // 7. Top Properties
    const topProperties = await this.getTopProperties(currentPeriod.startDate, currentPeriod.endDate);

    const stats: FinanceDashboardStats = {
      asOf: now,
      currentPeriod: { name: currentPeriod.name, startDate: currentPeriod.startDate, endDate: currentPeriod.endDate },
      revenue: {
        mtd: mtdActuals.revenue,
        priorMonthMtd: priorMtdActuals.revenue,
        ytd: ytdActuals.revenue,
        mtdGrowthPct: priorMtdActuals.revenue > 0 ? ((mtdActuals.revenue - priorMtdActuals.revenue) / priorMtdActuals.revenue) * 100 : 0
      },
      expenses: { mtd: mtdActuals.expense, ytd: ytdActuals.expense },
      netIncome: { mtd: mtdActuals.revenue - mtdActuals.expense, ytd: ytdActuals.revenue - ytdActuals.expense },
      cashPosition,
      ar: {
        totalOutstanding: arAging.totalOutstanding,
        current: arAging.rows.reduce((sum, r) => sum + r.current, 0),
        overdue30: arAging.rows.reduce((sum, r) => sum + r.bucket30, 0),
        overdue60: arAging.rows.reduce((sum, r) => sum + r.bucket60, 0),
        overdue90plus: arAging.rows.reduce((sum, r) => sum + r.bucket90 + r.bucket90plus, 0),
      },
      ap: { totalOutstanding: apTotal },
      budget,
      revenueTrend: trend,
      topProperties,
      unrealizedFxExposure: null, // Logic requires FxRevaluation join
    };

    this.financeCache = { data: stats, cachedAt: Date.now() };
    return stats;
  }

  async invalidateFinanceCache() {
    this.financeCache = null;
  }

  private async getGlTotals(start: Date, end: Date) {
    const lines = await this.prisma.journalLine.findMany({
      where: {
        journalEntry: { status: JournalStatus.POSTED, date: { gte: start, lte: end } },
        account: { type: { in: [AccountType.REVENUE, AccountType.EXPENSE] } }
      },
      include: { account: true }
    });

    let revenue = 0;
    let expense = 0;
    for (const l of lines) {
      const dr = Number(l.baseCurrencyDebit);
      const cr = Number(l.baseCurrencyCredit);
      if (l.account.type === AccountType.REVENUE) revenue += (cr - dr);
      else expense += (dr - cr);
    }
    return { revenue, expense };
  }

  private async getBudgetMetrics(periodId: string) {
    const budget = await this.prisma.budget.findFirst({
      where: { status: BudgetStatus.APPROVED },
      orderBy: { createdAt: 'desc' },
      include: { lines: { where: { fiscalPeriodId: periodId } } }
    });
    if (!budget) return null;

    const budgetedRevenue = budget.lines.reduce((sum, l) => sum + Number(l.amount), 0);
    const period = await this.prisma.fiscalPeriod.findUnique({ where: { id: periodId } });
    if (!period) return null;
    const actuals = await this.getGlTotals(period.startDate, period.endDate);

    return {
      currentPeriodBudgetedRevenue: budgetedRevenue,
      currentPeriodActualRevenue: actuals.revenue,
      utilizationPct: budgetedRevenue > 0 ? (actuals.revenue / budgetedRevenue) * 100 : 0,
      isOverBudget: actuals.revenue < budgetedRevenue // For revenue, lower than budget is "over" target
    };
  }

  private async getFinanceTrend() {
    const periods = await this.prisma.fiscalPeriod.findMany({
      take: 12,
      orderBy: { startDate: 'desc' },
    });
    periods.reverse();

    const stats = await this.prisma.journalLine.groupBy({
      by: ['accountId'], // Logic simplified for grouping strategy
      where: {
        journalEntry: { fiscalPeriodId: { in: periods.map(p => p.id) }, status: JournalStatus.POSTED }
      },
      _sum: { baseCurrencyDebit: true, baseCurrencyCredit: true }
    });

    // In a real scenario, we perform a join or group by periodId as requested.
    // Simplified: calling incomeStatement logic or bulk query.
    const result = [];
    for (const p of periods) {
      const totals = await this.getGlTotals(p.startDate, p.endDate);
      result.push({
        periodName: p.name,
        revenue: totals.revenue,
        expense: totals.expense,
        netIncome: totals.revenue - totals.expense
      });
    }
    return result;
  }

  private async getTopProperties(start: Date, end: Date) {
     const report = await this.reportsService.propertyProfitability({ startDate: start, endDate: end });
     return report
       .sort((a, b) => b.revenue - a.revenue)
       .slice(0, 5)
       .map(p => ({
         propertyId: p.propertyId,
         propertyName: p.propertyName,
         revenue: p.revenue,
         netProfit: p.netProfit,
         occupancyRate: p.occupancyRate
       }));
  }
}
