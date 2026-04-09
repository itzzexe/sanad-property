import { Test, TestingModule } from '@nestjs/testing';
import { ReconciliationService } from './reconciliation.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JournalService } from '../journal/journal.service';
import { Prisma, ReconciliationStatus, BankTxnType } from '@prisma/client';
import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';

describe('ReconciliationService', () => {
  let service: ReconciliationService;
  let prisma: PrismaService;

  const mockBankAccount = {
    id: 'ba1',
    name: 'Main Account',
    glAccountId: 'gl1',
  };

  const mockPrismaService = {
    bankAccount: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    bankStatement: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    bankTransaction: {
      update: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
    },
    journalLine: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn().mockImplementation((cb) => cb(mockPrismaService)),
  };

  const mockJournalService = {
    createAndPost: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReconciliationService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JournalService, useValue: mockJournalService },
      ],
    }).compile();

    service = module.get<ReconciliationService>(ReconciliationService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  describe('importStatement', () => {
    it('parses CSV and creates transactions', async () => {
      mockPrismaService.bankAccount.findUnique.mockResolvedValue(mockBankAccount);
      const csv = '2025-01-01,Test,Ref1,100,CREDIT';
      
      mockPrismaService.bankStatement.create.mockResolvedValue({ id: 's1' });
      mockPrismaService.bankStatement.findUnique.mockResolvedValue({ id: 's1', transactions: [] });

      await service.importStatement({
        bankAccountId: 'ba1',
        csvString: csv,
        statementDate: '2025-01-31',
        openingBalance: 1000,
        closingBalance: 1100
      });

      expect(mockPrismaService.bankStatement.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          openingBalance: new Prisma.Decimal(1000),
          transactions: expect.objectContaining({
            create: [expect.objectContaining({ amount: new Prisma.Decimal(100) })]
          })
        })
      }));
    });
  });

  describe('autoMatch', () => {
    it('matches by amount and date proximity', async () => {
      const txn = { id: 't1', amount: new Prisma.Decimal(100), type: BankTxnType.CREDIT, transactionDate: new Date('2025-01-05') };
      mockPrismaService.bankStatement.findUnique.mockResolvedValue({
        id: 's1',
        bankAccount: { glAccountId: 'gl1' },
        transactions: [txn]
      });

      const line = { id: 'l1', debit: 0, credit: new Prisma.Decimal(100) };
      mockPrismaService.journalLine.findMany.mockResolvedValue([line]);

      await service.autoMatch('s1');

      expect(mockPrismaService.bankTransaction.update).toHaveBeenCalledWith({
        where: { id: 't1' },
        data: expect.objectContaining({ matchedJournalLineId: 'l1' })
      });
    });

    it('skips if multiple matches found', async () => {
      const txn = { id: 't1', amount: new Prisma.Decimal(100), type: BankTxnType.CREDIT, transactionDate: new Date('2025-01-05') };
      mockPrismaService.bankStatement.findUnique.mockResolvedValue({
        id: 's1',
        bankAccount: { glAccountId: 'gl1' },
        transactions: [txn]
      });

      mockPrismaService.journalLine.findMany.mockResolvedValue([{ id: 'l1' }, { id: 'l2' }]);

      await service.autoMatch('s1');
      expect(mockPrismaService.bankTransaction.update).not.toHaveReturned();
    });
  });

  describe('manualMatch', () => {
    it('sets matchedJournalLineId', async () => {
      mockPrismaService.bankTransaction.findUnique.mockResolvedValue({ id: 't1' });
      mockPrismaService.journalLine.findUnique.mockResolvedValue({ id: 'l1' });

      await service.manualMatch('t1', 'l1', 'u1');

      expect(mockPrismaService.bankTransaction.update).toHaveBeenCalledWith({
        where: { id: 't1' },
        data: expect.objectContaining({ matchedJournalLineId: 'l1', matchedById: 'u1' })
      });
    });

    it('throws if already matched', async () => {
      mockPrismaService.bankTransaction.findUnique.mockResolvedValue({ id: 't1', matchedJournalLineId: 'old' });
      await expect(service.manualMatch('t1', 'l1', 'u1')).rejects.toThrow(ConflictException);
    });
  });

  describe('createJournalEntryFromTransaction', () => {
    it('creates correct DR/CR for CREDIT txn', async () => {
      const txn = {
        id: 't1',
        amount: new Prisma.Decimal(100),
        type: BankTxnType.CREDIT,
        transactionDate: new Date(),
        description: 'Bank Credit',
        bankStatement: { bankAccount: { glAccountId: 'cash_gl' } }
      };
      mockPrismaService.bankTransaction.findUnique.mockResolvedValue(txn);
      mockJournalService.createAndPost.mockResolvedValue({
        lines: [{ id: 'l_cash', accountId: 'cash_gl' }, { id: 'l_rev', accountId: 'rev_gl' }]
      });

      await service.createJournalEntryFromTransaction('t1', { description: 'Fee', accountId: 'rev_gl' }, 'u1');

      expect(mockJournalService.createAndPost).toHaveBeenCalledWith(
        expect.objectContaining({
          lines: [
            { accountId: 'cash_gl', debit: 100, credit: 0 },
            { accountId: 'rev_gl', debit: 0, credit: 100 }
          ]
        }),
        'u1'
      );
    });
  });

  describe('completeReconciliation', () => {
    it('succeeds with zero variance', async () => {
      const statement = {
        id: 's1',
        openingBalance: new Prisma.Decimal(1000),
        closingBalance: new Prisma.Decimal(1100),
        transactions: [
          { type: BankTxnType.CREDIT, amount: new Prisma.Decimal(150), matchedJournalLineId: 'l1' },
          { type: BankTxnType.DEBIT, amount: new Prisma.Decimal(50), matchedJournalLineId: 'l2' },
        ]
      };
      mockPrismaService.bankStatement.findUnique.mockResolvedValue(statement);

      const result = await service.completeReconciliation('s1', 'u1');
      expect(result.success).toBe(true);
      expect(mockPrismaService.bankStatement.update).toHaveBeenCalledWith({
        where: { id: 's1' },
        data: expect.objectContaining({ status: ReconciliationStatus.RECONCILED })
      });
    });

    it('fails with non-zero variance', async () => {
       const statement = {
        id: 's1',
        openingBalance: new Prisma.Decimal(1000),
        closingBalance: new Prisma.Decimal(1200), // Should be 1100
        transactions: [
          { type: BankTxnType.CREDIT, amount: new Prisma.Decimal(100), matchedJournalLineId: 'l1' },
        ]
      };
      mockPrismaService.bankStatement.findUnique.mockResolvedValue(statement);
      const result = await service.completeReconciliation('s1', 'u1');
      expect(result.success).toBe(false);
      expect(result.variance.toNumber()).toBe(-100);
    });

    it('throws if unmatched transactions remain', async () => {
      const statement = {
        id: 's1',
        transactions: [{ matchedJournalLineId: null }]
      };
      mockPrismaService.bankStatement.findUnique.mockResolvedValue(statement);
      await expect(service.completeReconciliation('s1', 'u1')).rejects.toThrow(BadRequestException);
    });
  });
});
