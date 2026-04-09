import { Test, TestingModule } from '@nestjs/testing';
import { BudgetService } from './budget.service';
import { AccountService } from '../account/account.service';
import { FiscalPeriodService } from '../fiscal-period/fiscal-period.service';
import { PrismaService } from '../../prisma/prisma.service';
import { BudgetStatus, JournalStatus, Prisma } from '@prisma/client';
import { ConflictException } from '@nestjs/common';

describe('BudgetService', () => {
  let service: BudgetService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      budget: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
      },
      budgetLine: {
        upsert: jest.fn(),
        findMany: jest.fn(),
      },
      account: {
        findUnique: jest.fn(),
      },
      journalLine: {
        aggregate: jest.fn(),
      },
      $transaction: jest.fn(callback => callback(prisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BudgetService,
        { provide: PrismaService, useValue: prisma },
        { provide: AccountService, useValue: {} },
        { provide: FiscalPeriodService, useValue: {} },
      ],
    }).compile();

    service = module.get<BudgetService>(BudgetService);
  });

  describe('create', () => {
    it('creates budget with DRAFT status', async () => {
      prisma.budget.create.mockResolvedValue({ id: 'b1', status: BudgetStatus.DRAFT });
      const res = await service.create({ name: 'Test', fiscalYearId: 'fy1' }, 'u1');
      expect(prisma.budget.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ status: BudgetStatus.DRAFT }),
      }));
      expect(res.status).toBe(BudgetStatus.DRAFT);
    });
  });

  describe('upsertLines', () => {
    it('creates new lines, updates existing, skips ASSET/LIABILITY accounts', async () => {
      prisma.budget.findUnique.mockResolvedValue({
        id: 'b1', status: BudgetStatus.DRAFT,
        fiscalYear: { periods: [{ id: 'p1' }] },
      });
      prisma.account.findUnique.mockResolvedValue({ id: 'acc1', type: 'REVENUE' });

      await service.upsertLines('b1', [{ accountId: 'acc1', fiscalPeriodId: 'p1', amount: 1000 }]);

      expect(prisma.budgetLine.upsert).toHaveBeenCalled();
    });

    it('throws ConflictException for ASSET account', async () => {
      prisma.budget.findUnique.mockResolvedValue({
        id: 'b1', status: BudgetStatus.DRAFT,
        fiscalYear: { periods: [{ id: 'p1' }] },
      });
      prisma.account.findUnique.mockResolvedValue({ id: 'acc1', type: 'ASSET' });

      await expect(service.upsertLines('b1', [{ accountId: 'acc1', fiscalPeriodId: 'p1', amount: 1000 }]))
        .rejects.toThrow(ConflictException);
    });

    it('throws ConflictException for APPROVED budget', async () => {
      prisma.budget.findUnique.mockResolvedValue({ id: 'b1', status: BudgetStatus.APPROVED });
      await expect(service.upsertLines('b1', [])).rejects.toThrow(ConflictException);
    });
  });

  describe('approve', () => {
    it('succeeds', async () => {
      prisma.budget.findUnique.mockResolvedValue({
        id: 'b1', createdById: 'u1', lines: [{ id: 'l1' }]
      });
      prisma.budget.update.mockResolvedValue({ id: 'b1', status: BudgetStatus.APPROVED });

      const res = await service.approve('b1', 'u2');
      expect(res.status).toBe(BudgetStatus.APPROVED);
    });

    it('throws when creator = approver', async () => {
      prisma.budget.findUnique.mockResolvedValue({
        id: 'b1', createdById: 'u1', lines: [{ id: 'l1' }]
      });
      await expect(service.approve('b1', 'u1')).rejects.toThrow(ConflictException);
    });

    it('throws when no lines', async () => {
      prisma.budget.findUnique.mockResolvedValue({
        id: 'b1', createdById: 'u1', lines: []
      });
      await expect(service.approve('b1', 'u2')).rejects.toThrow(ConflictException);
    });
  });

  describe('getVariance', () => {
    it('correctly computes actual vs budgeted, isOverBudget flag', async () => {
      // Mock findUnique to return a budget with lines
      prisma.budget.findUnique.mockResolvedValue({
        id: 'b1', name: 'Budget 1', 
        fiscalYear: { name: 'FY-2025' },
        lines: [
          { 
            accountId: 'acc1', fiscalPeriodId: 'p1', amount: new Prisma.Decimal(1000),
            account: { type: 'EXPENSE', code: '5000', name: 'Maint' },
            fiscalPeriod: { name: 'Jan' },
          }
        ]
      });

      // Mock aggregate to return actuals (e.g. 1200 debit, 0 credit) => 1200 actual expense
      prisma.journalLine.aggregate.mockResolvedValue({
        _sum: { baseCurrencyDebit: new Prisma.Decimal(1200), baseCurrencyCredit: new Prisma.Decimal(0) }
      });

      const res = await service.getVariance('b1');
      
      expect(res.lines[0].budgeted).toBe(1000);
      expect(res.lines[0].actual).toBe(1200);
      // variance = 1000 - 1200 = -200
      expect(res.lines[0].variance).toBe(-200);
      expect(res.lines[0].isOverBudget).toBe(true);
    });
  });

  describe('importFromCsv', () => {
    it('parses valid rows, returns errors for invalid account codes', async () => {
      const csv = `accountCode,periodName,amount,notes\n5000,Jan,1000,test\nINVALID,Jan,1000,test`;
      
      prisma.budget.findUnique.mockResolvedValue({
        id: 'b1', status: BudgetStatus.DRAFT,
        fiscalYear: { periods: [{ id: 'p1', name: 'Jan', periodNumber: 1 }] }
      });
      
      let callCount = 0;
      prisma.account.findUnique.mockImplementation(({ where }: any) => {
        if (where.code === '5000') return Promise.resolve({ id: 'acc1', type: 'EXPENSE', code: '5000' });
        return Promise.resolve(null);
      });

      // mock upsertLines behavior
      jest.spyOn(service, 'upsertLines').mockResolvedValue([] as any);

      const res = await service.importFromCsv('b1', csv);
      
      expect(res.created).toBe(1);
      expect(res.errors.length).toBe(1);
      expect(res.errors[0]).toContain('INVALID not found');
      expect(service.upsertLines).toHaveBeenCalledWith('b1', expect.arrayContaining([
        expect.objectContaining({ accountId: 'acc1', amount: 1000 })
      ]));
    });
  });
});
