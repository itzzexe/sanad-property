import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ReportsService } from '../reports/reports.service';
import { ArService } from '../accounts-receivable/ar.service';
import { JournalService } from '../journal/journal.service';
import { FiscalPeriodService } from '../fiscal-period/fiscal-period.service';
import { BudgetService } from '../budget/budget.service';
import { JournalStatus, AccountType } from '@prisma/client';

describe('DashboardFinanceService', () => {
  let service: DashboardService;
  let prisma: PrismaService;

  const mockPrismaService = {
    journalLine: {
      aggregate: jest.fn(),
      findMany: jest.fn(),
    },
    fiscalPeriod: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    budget: {
      findFirst: jest.fn(),
    },
  };

  const mockReportsService = { propertyProfitability: jest.fn() };
  const mockArService = { getAgingReport: jest.fn() };
  const mockJournalService = {};
  const mockFiscalPeriodService = { findCurrentPeriod: jest.fn() };
  const mockBudgetService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ReportsService, useValue: mockReportsService },
        { provide: ArService, useValue: mockArService },
        { provide: JournalService, useValue: mockJournalService },
        { provide: FiscalPeriodService, useValue: mockFiscalPeriodService },
        { provide: BudgetService, useValue: mockBudgetService },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
    await service.invalidateFinanceCache();
  });

  it('returns all required keys in the response', async () => {
    mockFiscalPeriodService.findCurrentPeriod.mockResolvedValue({ id: 'p1', name: 'Jan 25', startDate: new Date(), endDate: new Date() });
    mockPrismaService.journalLine.findMany.mockResolvedValue([]);
    mockPrismaService.journalLine.aggregate.mockResolvedValue({ _sum: { baseCurrencyDebit: 0, baseCurrencyCredit: 0 } });
    mockArService.getAgingReport.mockResolvedValue({ totalOutstanding: 0, rows: [] });
    mockPrismaService.fiscalPeriod.findMany.mockResolvedValue([]);
    mockReportsService.propertyProfitability.mockResolvedValue([]);

    const stats = await service.getFinanceStats();

    expect(stats).toHaveProperty('revenue');
    expect(stats).toHaveProperty('cashPosition');
    expect(stats).toHaveProperty('ar');
    expect(stats).toHaveProperty('revenueTrend');
  });

  it('sums cash-type accounts for cashPosition', async () => {
     mockFiscalPeriodService.findCurrentPeriod.mockResolvedValue({ id: 'p1', name: 'Jan 25', startDate: new Date(), endDate: new Date() });
     mockPrismaService.journalLine.findMany.mockResolvedValue([]);
     mockPrismaService.journalLine.aggregate.mockResolvedValueOnce({ _sum: { baseCurrencyDebit: 5000, baseCurrencyCredit: 1000 } }); // Cash (today)
     mockArService.getAgingReport.mockResolvedValue({ totalOutstanding: 0, rows: [] });
     mockPrismaService.fiscalPeriod.findMany.mockResolvedValue([]);
     mockReportsService.propertyProfitability.mockResolvedValue([]);

     const stats = await service.getFinanceStats();
     expect(stats.cashPosition).toBe(4000);
  });

  it('returns cached result within 5 minutes', async () => {
    mockFiscalPeriodService.findCurrentPeriod.mockResolvedValue({ id: 'p1', name: 'Jan 25', startDate: new Date(), endDate: new Date() });
    mockPrismaService.journalLine.findMany.mockResolvedValue([]);
    mockPrismaService.journalLine.aggregate.mockResolvedValue({ _sum: {} });
    mockArService.getAgingReport.mockResolvedValue({ rows: [] });
    mockPrismaService.fiscalPeriod.findMany.mockResolvedValue([]);
    mockReportsService.propertyProfitability.mockResolvedValue([]);

    await service.getFinanceStats();
    await service.getFinanceStats();

    expect(mockFiscalPeriodService.findCurrentPeriod).toHaveBeenCalledTimes(1);
  });

  it('recomputes after cache invalidation', async () => {
    mockFiscalPeriodService.findCurrentPeriod.mockResolvedValue({ id: 'p1', name: 'Jan 25', startDate: new Date(), endDate: new Date() });
    mockPrismaService.journalLine.findMany.mockResolvedValue([]);
    mockPrismaService.journalLine.aggregate.mockResolvedValue({ _sum: {} });
    mockArService.getAgingReport.mockResolvedValue({ rows: [] });
    mockPrismaService.fiscalPeriod.findMany.mockResolvedValue([]);
    mockReportsService.propertyProfitability.mockResolvedValue([]);

    await service.getFinanceStats();
    await service.invalidateFinanceCache();
    await service.getFinanceStats();

    expect(mockFiscalPeriodService.findCurrentPeriod).toHaveBeenCalledTimes(2);
  });
});
