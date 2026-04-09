import { Test, TestingModule } from '@nestjs/testing';
import { JournalService } from './journal.service';
import { PrismaService } from '../../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { FiscalPeriodService } from '../fiscal-period/fiscal-period.service';
import { JournalEntryNumberService } from './journal-entry-number.service';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
// @ts-ignore
import { Prisma, JournalStatus, JournalSourceType } from '@prisma/client';

describe('JournalService', () => {
  let service: JournalService;
  let prisma: any;
  let fiscalPeriodService: any;
  let journalNumberService: any;
  let eventEmitter: any;

  beforeEach(async () => {
    prisma = {
      account: { findMany: jest.fn() },
      journalEntry: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      accountBalance: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(prisma)),
    };

    fiscalPeriodService = {
      findPeriodForDate: jest.fn(),
      validatePeriodOpen: jest.fn(),
    };

    journalNumberService = {
      generateNext: jest.fn(),
    };

    eventEmitter = {
      emit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JournalService,
        { provide: PrismaService, useValue: prisma },
        { provide: FiscalPeriodService, useValue: fiscalPeriodService },
        { provide: JournalEntryNumberService, useValue: journalNumberService },
        { provide: EventEmitter2, useValue: eventEmitter },
      ],
    }).compile();

    service = module.get<JournalService>(JournalService);
  });

  describe('create', () => {
    it('throws when fewer than 2 lines', async () => {
      await expect(service.create({ lines: [{ accountId: '1' }] } as any, 'user1'))
        .rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when debits !== credits', async () => {
      const dto = {
        lines: [
          { accountId: '1', debit: 100, credit: 0 },
          { accountId: '2', debit: 0, credit: 50 },
        ],
      } as any;
      await expect(service.create(dto, 'user1')).rejects.toThrow(BadRequestException);
    });

    it('throws when account does not exist or is inactive', async () => {
      const dto = {
        date: new Date(),
        description: 'Test',
        lines: [
          { accountId: '1', debit: 100, credit: 0 },
          { accountId: '2', debit: 0, credit: 100 },
        ],
      } as any;
      
      // Simulate account 1 is active, account 2 is missing
      prisma.account.findMany.mockResolvedValue([
        { id: '1', isActive: true }
      ]);
      await expect(service.create(dto, 'user1')).rejects.toThrow(BadRequestException);

      // Simulate account inactive
      prisma.account.findMany.mockResolvedValue([
        { id: '1', isActive: true },
        { id: '2', isActive: false },
      ]);
      await expect(service.create(dto, 'user1')).rejects.toThrow(BadRequestException);
    });

    it('succeeds with valid balanced entry', async () => {
      const dto = {
        date: new Date(),
        description: 'Test entry',
        sourceType: JournalSourceType.MANUAL,
        lines: [
          { accountId: '1', debit: 100, credit: 0 },
          { accountId: '2', debit: 0, credit: 100 },
        ],
      } as any;

      prisma.account.findMany.mockResolvedValue([
        { id: '1', isActive: true },
        { id: '2', isActive: true },
      ]);
      fiscalPeriodService.findPeriodForDate.mockResolvedValue({ id: 'p1', fiscalYearId: 'y1' });
      journalNumberService.generateNext.mockResolvedValue('JE-2025-0001');
      prisma.journalEntry.create.mockResolvedValue({ id: 'je1' });

      const result = await service.create(dto, 'user1');
      
      expect(result.id).toBe('je1');
      expect(prisma.journalEntry.create).toHaveBeenCalled();
    });
  });

  describe('post', () => {
    it('throws ConflictException on already-posted entry', async () => {
      prisma.journalEntry.findUnique.mockResolvedValue({ status: JournalStatus.POSTED });
      await expect(service.post('je1', 'user1')).rejects.toThrow(ConflictException);
    });

    it('changes status to POSTED, updates AccountBalance', async () => {
      prisma.journalEntry.findUnique.mockResolvedValue({
        id: 'je1',
        fiscalPeriodId: 'p1',
        status: JournalStatus.DRAFT,
        lines: [
          { accountId: '1', baseCurrencyDebit: new Prisma.Decimal(100), baseCurrencyCredit: new Prisma.Decimal(0), account: { type: 'ASSET' } },
          { accountId: '2', baseCurrencyDebit: new Prisma.Decimal(0), baseCurrencyCredit: new Prisma.Decimal(100), account: { type: 'REVENUE' } },
        ],
      });
      fiscalPeriodService.validatePeriodOpen.mockResolvedValue(true);
      prisma.accountBalance.findUnique.mockResolvedValue(null);
      prisma.accountBalance.create.mockResolvedValue({
        id: 'ab1', openingBalance: new Prisma.Decimal(0), debitTotal: new Prisma.Decimal(0), creditTotal: new Prisma.Decimal(0)
      });
      prisma.journalEntry.update.mockResolvedValue({ id: 'je1', status: JournalStatus.POSTED });

      const result = await service.post('je1', 'user1');

      expect(result.status).toBe(JournalStatus.POSTED);
      expect(prisma.accountBalance.update).toHaveBeenCalledTimes(2);
      expect(eventEmitter.emit).toHaveBeenCalledWith('journal-entry.posted', expect.anything());
    });
  });

  describe('reverse', () => {
    it('creates mirror entry with swapped amounts, marks original REVERSED', async () => {
      const originalEntry = {
        id: 'je1',
        entryNumber: 'JE-0001',
        status: JournalStatus.POSTED,
        fiscalPeriodId: 'p1',
        lines: [
          { accountId: '1', debit: new Prisma.Decimal(100), credit: new Prisma.Decimal(0), baseCurrencyDebit: new Prisma.Decimal(100), baseCurrencyCredit: new Prisma.Decimal(0) },
          { accountId: '2', debit: new Prisma.Decimal(0), credit: new Prisma.Decimal(100), baseCurrencyDebit: new Prisma.Decimal(0), baseCurrencyCredit: new Prisma.Decimal(100) },
        ],
      };
      
      prisma.journalEntry.findUnique
        .mockResolvedValueOnce(originalEntry) // 1st call: find original
        .mockResolvedValueOnce(null)          // 2nd call: checkReversed -> null
        .mockResolvedValueOnce({ status: JournalStatus.DRAFT, lines: [
            { baseCurrencyDebit: new Prisma.Decimal(0), baseCurrencyCredit: new Prisma.Decimal(100) },
            { baseCurrencyDebit: new Prisma.Decimal(100), baseCurrencyCredit: new Prisma.Decimal(0) }
        ]}); // inside post

      fiscalPeriodService.findPeriodForDate.mockResolvedValue({ id: 'p2', fiscalYearId: 'y1' });
      journalNumberService.generateNext.mockResolvedValue('JE-0002');
      
      prisma.journalEntry.create.mockResolvedValue({ id: 'je2' });
      prisma.journalEntry.update.mockResolvedValue({});
      
      // We stub post for test since we expect it to be called
      jest.spyOn(service, 'post').mockResolvedValue({ id: 'je2', status: JournalStatus.POSTED } as any);

      const result = await service.reverse('je1', 'Mistake', 'user1');
      
      expect(prisma.journalEntry.create).toHaveBeenCalled();
      expect(prisma.journalEntry.update).toHaveBeenCalledWith(expect.objectContaining({ data: { status: JournalStatus.REVERSED }}));
      expect(service.post).toHaveBeenCalledWith('je2', 'user1');
    });
  });

  describe('findByReference', () => {
    it('returns existing entry for idempotency check', async () => {
      prisma.journalEntry.findFirst.mockResolvedValue({ id: 'je1' });
      const result = await service.findByReference('ref123');
      expect(result!.id).toBe('je1');
    });
  });

  describe('delete', () => {
    it('throws ConflictException for a POSTED entry', async () => {
      prisma.journalEntry.findUnique.mockResolvedValue({ status: JournalStatus.POSTED });
      await expect(service.delete('je1')).rejects.toThrow(ConflictException);
    });

    it('deletes a DRAFT entry', async () => {
      prisma.journalEntry.findUnique.mockResolvedValue({ status: JournalStatus.DRAFT });
      await service.delete('je1');
      expect(prisma.journalEntry.delete).toHaveBeenCalled();
    });
  });
});
