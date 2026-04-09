import { Test, TestingModule } from '@nestjs/testing';
import { TrialBalanceService } from './trial-balance.service';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, JournalStatus, JournalSourceType } from '@prisma/client';

describe('TrialBalanceService', () => {
  let service: TrialBalanceService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      journalLine: {
        groupBy: jest.fn(),
      },
      account: {
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TrialBalanceService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<TrialBalanceService>(TrialBalanceService);
  });

  describe('generate', () => {
    it('returns correct rows grouped by account', async () => {
      prisma.journalLine.groupBy.mockResolvedValue([
        { accountId: 'acc1', _sum: { baseCurrencyDebit: new Prisma.Decimal(100), baseCurrencyCredit: new Prisma.Decimal(0) } },
      ]);
      prisma.account.findMany.mockResolvedValue([
        { id: 'acc1', code: '1000', name: 'Cash', type: 'ASSET', isActive: true },
        { id: 'acc2', code: '2000', name: 'Liability', type: 'LIABILITY', isActive: true },
      ]);

      const result = await service.generate();

      expect(result.rows).toHaveLength(1); // includeZeroBalance = false by default
      expect(result.rows[0].accountId).toBe('acc1');
      expect(result.rows[0].debitTotal).toEqual(new Prisma.Decimal(100));
    });

    it('correctly computes netBalance per account type', async () => {
      prisma.journalLine.groupBy.mockResolvedValue([
        { accountId: 'uuid1', _sum: { baseCurrencyDebit: new Prisma.Decimal(500), baseCurrencyCredit: new Prisma.Decimal(100) } },
        { accountId: 'uuid2', _sum: { baseCurrencyDebit: new Prisma.Decimal(200), baseCurrencyCredit: new Prisma.Decimal(600) } },
      ]);
      prisma.account.findMany.mockResolvedValue([
        { id: 'uuid1', code: '1000', type: 'ASSET', isActive: true },
        { id: 'uuid2', code: '2000', type: 'LIABILITY', isActive: true },
      ]);

      const result = await service.generate();

      const assetRow = result.rows.find(r => r.accountId === 'uuid1');
      const liabilityRow = result.rows.find(r => r.accountId === 'uuid2');

      // Asset net = Debit - Credit
      expect(assetRow?.netBalance).toEqual(new Prisma.Decimal(400));
      // Liability net = Credit - Debit
      expect(liabilityRow?.netBalance).toEqual(new Prisma.Decimal(400));
    });

    it('totalDebits equals totalCredits when data is valid', async () => {
      prisma.journalLine.groupBy.mockResolvedValue([
        { accountId: 'acc1', _sum: { baseCurrencyDebit: new Prisma.Decimal(500), baseCurrencyCredit: new Prisma.Decimal(0) } },
        { accountId: 'acc2', _sum: { baseCurrencyDebit: new Prisma.Decimal(0), baseCurrencyCredit: new Prisma.Decimal(500) } },
      ]);
      prisma.account.findMany.mockResolvedValue([
        { id: 'acc1', code: '1000', type: 'ASSET', isActive: true },
        { id: 'acc2', code: '2000', type: 'LIABILITY', isActive: true },
      ]);

      const result = await service.generate();

      expect(result.totalDebits).toEqual(new Prisma.Decimal(500));
      expect(result.totalCredits).toEqual(new Prisma.Decimal(500));
      expect(result.isBalanced).toBe(true);
      expect(result.variance).toEqual(new Prisma.Decimal(0));
    });

    it('isBalanced = false when there is a variance', async () => {
      prisma.journalLine.groupBy.mockResolvedValue([
        { accountId: 'acc1', _sum: { baseCurrencyDebit: new Prisma.Decimal(500), baseCurrencyCredit: new Prisma.Decimal(0) } },
        { accountId: 'acc2', _sum: { baseCurrencyDebit: new Prisma.Decimal(0), baseCurrencyCredit: new Prisma.Decimal(400) } },
      ]);
      prisma.account.findMany.mockResolvedValue([
        { id: 'acc1', code: '1000', type: 'ASSET', isActive: true },
        { id: 'acc2', code: '2000', type: 'LIABILITY', isActive: true },
      ]);

      const result = await service.generate();

      expect(result.isBalanced).toBe(false);
      expect(result.variance).toEqual(new Prisma.Decimal(100));
    });

    it('excludes CLOSING entries when adjusted = false', async () => {
      prisma.journalLine.groupBy.mockResolvedValue([]);
      prisma.account.findMany.mockResolvedValue([]);

      await service.generate({ adjusted: false });

      expect(prisma.journalLine.groupBy).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({
          journalEntry: expect.objectContaining({
            sourceType: { not: JournalSourceType.CLOSING },
          }),
        }),
      }));
    });

    it('filters zero-balance rows when includeZeroBalance = false', async () => {
      prisma.journalLine.groupBy.mockResolvedValue([
        { accountId: 'acc1', _sum: { baseCurrencyDebit: new Prisma.Decimal(0), baseCurrencyCredit: new Prisma.Decimal(0) } },
      ]);
      prisma.account.findMany.mockResolvedValue([
        { id: 'acc1', code: '1000', type: 'ASSET', isActive: true },
        { id: 'acc2', code: '2000', type: 'LIABILITY', isActive: true },
      ]);

      const result = await service.generate({ includeZeroBalance: false });

      expect(result.rows).toHaveLength(0);
    });
  });

  describe('validateBalance', () => {
    it('returns isBalanced = true for clean data', async () => {
      prisma.journalLine.groupBy.mockResolvedValue([
        { accountId: 'acc1', _sum: { baseCurrencyDebit: new Prisma.Decimal(999), baseCurrencyCredit: new Prisma.Decimal(0) } },
        { accountId: 'acc2', _sum: { baseCurrencyDebit: new Prisma.Decimal(0), baseCurrencyCredit: new Prisma.Decimal(999) } },
      ]);
      prisma.account.findMany.mockResolvedValue([
        { id: 'acc1', code: '1000', type: 'ASSET', isActive: true },
        { id: 'acc2', code: '2000', type: 'LIABILITY', isActive: true },
      ]);

      const result = await service.validateBalance();

      expect(result.isBalanced).toBe(true);
      expect(result.variance).toEqual(new Prisma.Decimal(0));
    });
  });
});
