import { Test, TestingModule } from '@nestjs/testing';
import { ReportsService } from './reports.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ArService } from '../accounts-receivable/ar.service';
import { BudgetService } from '../budget/budget.service';
import { Prisma, AccountType, JournalStatus } from '@prisma/client';

describe('ReportsService', () => {
  let service: ReportsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    fiscalPeriod: { findUnique: jest.fn() },
    fiscalYear: { findUnique: jest.fn(), findFirst: jest.fn() },
    journalLine: { findMany: jest.fn() },
    account: { findMany: jest.fn(), findUnique: jest.fn() },
    property: { findMany: jest.fn() },
  };

  const mockArService = { getAgingReport: jest.fn() };
  const mockBudgetService = { getVariance: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ArService, useValue: mockArService },
        { provide: BudgetService, useValue: mockBudgetService },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  describe('incomeStatement', () => {
    it('calculates netIncome correctly (Revenue - Expense)', async () => {
      mockPrismaService.fiscalYear.findFirst.mockResolvedValue({ startDate: new Date('2025-01-01'), endDate: new Date('2025-12-31') });
      
      const lines = [
        { accountId: 'rev1', account: { code: '4000', name: 'Rent', type: AccountType.REVENUE, subtype: 'OPERATING_REVENUE' }, baseCurrencyDebit: 0, baseCurrencyCredit: 1000 },
        { accountId: 'exp1', account: { code: '5000', name: 'Maint', type: AccountType.EXPENSE, subtype: 'OPERATING_EXPENSE' }, baseCurrencyDebit: 300, baseCurrencyCredit: 0 },
      ];
      mockPrismaService.journalLine.findMany.mockResolvedValue(lines);

      const report = await service.incomeStatement({});

      expect(report.totalRevenue).toBe(1000);
      expect(report.totalExpense).toBe(300);
      expect(report.netIncome).toBe(700);
    });
  });

  describe('balanceSheet', () => {
    it('sums accounts correctly to date', async () => {
       mockPrismaService.fiscalYear.findFirst.mockResolvedValue({ startDate: new Date('2025-01-01'), endDate: new Date('2025-12-31') });
       
       const assetLines = [
         { accountId: 'a1', account: { code: '1000', name: 'Cash', type: AccountType.ASSET, subtype: 'CURRENT_ASSET' }, baseCurrencyDebit: 5000, baseCurrencyCredit: 1000 },
       ];
       mockPrismaService.journalLine.findMany
         .mockResolvedValueOnce(assetLines) // assets/liabs/equity
         .mockResolvedValueOnce([]); // revenue/expense for cumulative NI

       const report = await service.balanceSheet({});

       expect(report.assets.totalAssets).toBe(4000);
       expect(report.isBalanced).toBe(true);
    });

    it('sets isBalanced = false and variance when unequal', async () => {
      mockPrismaService.fiscalYear.findFirst.mockResolvedValue({ startDate: new Date('2025-01-01'), endDate: new Date('2025-12-31') });
      
      const assetLines = [{ accountId: 'a1', account: { code: '1000', name: 'Cash', type: AccountType.ASSET, subtype: 'ASSET' }, baseCurrencyDebit: 100, baseCurrencyCredit: 0 }];
      const equityLines = [{ accountId: 'e1', account: { code: '3000', name: 'Equity', type: AccountType.EQUITY, subtype: '' }, baseCurrencyDebit: 0, baseCurrencyCredit: 50 }];
       mockPrismaService.journalLine.findMany
         .mockResolvedValueOnce([...assetLines, ...equityLines])
         .mockResolvedValueOnce([]);

      const report = await service.balanceSheet({});
      expect(report.isBalanced).toBe(false);
      expect(report.variance).toBe(50);
    });
  });

  describe('cashFlowStatement', () => {
    it('calculates netCashChange from changes in accounts and netIncome', async () => {
      mockPrismaService.fiscalYear.findFirst.mockResolvedValue({ startDate: new Date('2025-01-01'), endDate: new Date('2025-12-31') });
      
      // Mock income statement
      jest.spyOn(service, 'incomeStatement').mockResolvedValue({
        netIncome: 1000,
        totalRevenue: 2000,
        totalExpense: 1000,
        period: { startDate: new Date(), endDate: new Date() },
        sections: []
      });

      // Mock account balance changes (simplified)
      mockPrismaService.journalLine.findMany.mockResolvedValue([]); // all balance calls return 0
      
      const report = await service.cashFlowStatement({});
      expect(report.netIncome).toBe(1000);
      expect(report.netCashChange).toBe(1000); // 1000 + 0 corrections
    });
  });
});
