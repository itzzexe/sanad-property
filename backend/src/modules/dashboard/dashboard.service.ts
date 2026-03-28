import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

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
}
