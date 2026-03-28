import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Currency, ExpenseCategory } from '@prisma/client';

@Injectable()
export class FinancialService {
  constructor(private prisma: PrismaService) {}

  // ─── EXPENSES ──────────────────────────────────────────────

  async createExpense(data: any) {
    return this.prisma.expense.create({
      data: {
        title: data.title,
        amount: data.amount,
        currency: data.currency || Currency.IQD,
        category: data.category || ExpenseCategory.OTHER,
        description: data.description,
        propertyId: data.propertyId,
        unitId: data.unitId,
        date: data.date ? new Date(data.date) : new Date(),
      },
    });
  }

  async getExpenses(query: { propertyId?: string; startDate?: string; endDate?: string }) {
    return this.prisma.expense.findMany({
      where: {
        propertyId: query.propertyId,
        date: {
          gte: query.startDate ? new Date(query.startDate) : undefined,
          lte: query.endDate ? new Date(query.endDate) : undefined,
        },
      },
      include: {
        property: { select: { name: true } },
        unit: { select: { unitNumber: true } },
      },
      orderBy: { date: 'desc' },
    });
  }

  async deleteExpense(id: string) {
    return this.prisma.expense.delete({ where: { id } });
  }

  // ─── SHAREHOLDERS & DISTRIBUTIONS ──────────────────────────

  async getShareholders(propertyId: string) {
    return this.prisma.shareholder.findMany({
      where: { propertyId },
      include: { distributions: true },
    });
  }

  async addShareholder(data: any) {
    return this.prisma.shareholder.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        sharePercent: data.sharePercent,
        propertyId: data.propertyId,
      },
    });
  }

  async calculateProfit(propertyId: string, startDate: string, endDate: string) {
    const sDate = new Date(startDate);
    const eDate = new Date(endDate);

    // Get system settings for exchange rate
    const settings = await this.prisma.systemSettings.findFirst();
    const rate = settings?.exchangeRateUSD || 1460.0;

    // Get all rental income (COMPLETED payments)
    const payments = await this.prisma.payment.findMany({
      where: {
        lease: { unit: { propertyId } },
        status: 'COMPLETED',
        paidDate: { gte: sDate, lte: eDate },
      },
      select: { amount: true, currency: true },
    });

    const totalIncome = payments.reduce((acc, p) => {
      // Normalize to IQD
      const val = p.currency === 'USD' ? p.amount * rate : p.amount;
      return acc + val;
    }, 0);

    // Get all expenses
    const expenses = await this.prisma.expense.findMany({
      where: {
        propertyId,
        date: { gte: sDate, lte: eDate },
      },
      select: { amount: true, currency: true },
    });

    const totalExpenses = expenses.reduce((acc, e) => {
       const val = e.currency === 'USD' ? e.amount * rate : e.amount;
       return acc + val;
    }, 0);
    
    // Get depreciation for this period
    const assets = await this.prisma.asset.findMany({ where: { propertyId, isActive: true } });
    let totalDepreciation = 0;
    const daysInPeriod = (eDate.getTime() - sDate.getTime()) / (1000 * 3600 * 24);
    
    assets.forEach(asset => {
       // Values are assumed to be in the same currency as defined (usually IQD in schema default)
       // If asset currency is USD, conversion should be handled
       const assetVal = asset.currency === 'USD' ? asset.value * rate : asset.value;
       const dailyDep = (assetVal * (asset.depreciationRate / 100)) / 365;
       totalDepreciation += dailyDep * daysInPeriod;
    });

    const netProfit = totalIncome - totalExpenses - totalDepreciation;

    return {
      revenue: totalIncome,
      expenses: totalExpenses,
      depreciation: totalDepreciation,
      netProfit,
    };
  }

  async distributeProfit(propertyId: string, data: { amount: number; periodStart: string; periodEnd: string }) {
    const shareholders = await this.prisma.shareholder.findMany({ where: { propertyId } });
    
    const records = shareholders.map(sh => ({
      shareholderId: sh.id,
      propertyId,
      amount: (data.amount * sh.sharePercent) / 100,
      periodStart: new Date(data.periodStart),
      periodEnd: new Date(data.periodEnd),
      status: 'PAID',
    }));

    return this.prisma.profitDistribution.createMany({ data: records });
  }

  // ─── ASSETS & DEPRECIATION ───────────────────────────────

  async createAsset(data: any) {
    return this.prisma.asset.create({
      data: {
        name: data.name,
        value: data.value,
        purchaseDate: new Date(data.purchaseDate),
        depreciationRate: data.depreciationRate,
        usefulLifeYears: data.usefulLifeYears,
        propertyId: data.propertyId,
        description: data.description,
      },
    });
  }

  async getAssets(propertyId: string) {
    const assets = await this.prisma.asset.findMany({ where: { propertyId, isActive: true } });
    
    // Calculate current book value for each asset
    return assets.map(asset => {
       const yearsOwned = (new Date().getTime() - new Date(asset.purchaseDate).getTime()) / (1000 * 3600 * 24 * 365);
       const accumulatedDep = Math.min(asset.value, asset.value * (asset.depreciationRate / 100) * yearsOwned);
       return {
          ...asset,
          accumulatedDepreciation: accumulatedDep,
          bookValue: asset.value - accumulatedDep,
       };
    });
  }
}
