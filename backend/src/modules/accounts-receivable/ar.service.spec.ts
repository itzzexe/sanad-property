import { Test, TestingModule } from '@nestjs/testing';
import { ArService } from './ar.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JournalService } from '../journal/journal.service';
import { AccountService } from '../account/account.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
// @ts-ignore
import { JournalStatus, JournalSourceType, Prisma } from '@prisma/client';

describe('ArService', () => {
  let service: ArService;
  let prisma: any;
  let journalService: any;

  beforeEach(async () => {
    prisma = {
      tenant: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
      lease: {
        findMany: jest.fn(),
      },
      account: {
        findUnique: jest.fn(),
      },
      journalLine: {
        aggregate: jest.fn(),
        findMany: jest.fn(),
      },
      $transaction: jest.fn(callback => callback(prisma)),
      writeOff: {
        create: jest.fn(),
      },
      creditMemo: {
        create: jest.fn(),
      },
    };

    journalService = {
      createAndPost: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArService,
        { provide: PrismaService, useValue: prisma },
        { provide: JournalService, useValue: journalService },
        { provide: AccountService, useValue: {} },
      ],
    }).compile();

    service = module.get<ArService>(ArService);
  });

  describe('getTenantBalance', () => {
    it('computes correct AR balance', async () => {
      prisma.lease.findMany.mockResolvedValue([
        { id: 'l1', payments: [{ id: 'p1' }], installments: [{ id: 'i1' }] }
      ]);
      prisma.account.findUnique.mockResolvedValue({ id: 'acc1100' });
      prisma.journalLine.aggregate.mockResolvedValue({
        _sum: {
          baseCurrencyDebit: new Prisma.Decimal(500),
          baseCurrencyCredit: new Prisma.Decimal(200),
        }
      });

      const res = await service.getTenantBalance('t1');
      expect(res).toBe(300); // 500 - 200
      expect(prisma.journalLine.aggregate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            journalEntry: expect.objectContaining({
              reference: { in: ['t1', 'l1', 'p1', 'i1'] }
            })
          })
        })
      );
    });
  });

  describe('getTenantStatement', () => {
    it('returns formatted lines with opening/closing balances', async () => {
      prisma.tenant.findUnique.mockResolvedValue({ id: 't1', firstName: 'John', lastName: 'Doe', email: 'j@d.com' });
      prisma.lease.findMany.mockResolvedValue([]);
      prisma.account.findUnique.mockResolvedValue({ id: 'acc1100' });

      // opening balance calculation
      prisma.journalLine.aggregate.mockResolvedValue({
        _sum: { baseCurrencyDebit: new Prisma.Decimal(100), baseCurrencyCredit: new Prisma.Decimal(0) }
      });

      // lines iteration
      prisma.journalLine.findMany.mockResolvedValue([
        { 
          baseCurrencyDebit: new Prisma.Decimal(50), 
          baseCurrencyCredit: new Prisma.Decimal(0),
          journalEntry: { date: new Date('2025-01-01'), description: 'd', reference: 'ref1', sourceType: 'MANUAL' },
        },
        { 
          baseCurrencyDebit: new Prisma.Decimal(0), 
          baseCurrencyCredit: new Prisma.Decimal(20),
          journalEntry: { date: new Date('2025-01-02'), description: 'd2', reference: 'ref2', sourceType: 'MANUAL' },
        }
      ]);

      const res = await service.getTenantStatement('t1', { startDate: new Date('2025-01-01') });
      
      expect(res.openingBalance).toBe(100);
      expect(res.closingBalance).toBe(130); // 100 + 50 - 20
      expect(res.lines.length).toBe(2);
      expect(res.lines[0].runningBalance).toBe(150);
      expect(res.lines[1].runningBalance).toBe(130);
    });
  });

  describe('getAgingReport', () => {
    it('returns bucketing per overdue day logic', async () => {
      const today = new Date('2025-01-15T00:00:00Z');
      
      prisma.tenant.findMany.mockResolvedValue([
        {
          id: 't1', firstName: 'A', lastName: 'B',
          leases: [
            {
              unit: { unitNumber: '1A', property: { name: 'Prop 1' } },
              installments: [
                { amount: 100, paidAmount: 0, dueDate: new Date('2025-01-20T00:00:00Z') }, // current
                { amount: 200, paidAmount: 50, dueDate: new Date('2025-01-05T00:00:00Z') }, // 10 days = b30
                { amount: 300, paidAmount: 0, dueDate: new Date('2024-11-20T00:00:00Z') }  // ~56 days = b60
              ]
            }
          ]
        }
      ]);

      // mock actual balance to > 0
      jest.spyOn(service, 'getTenantBalance').mockResolvedValue(550);

      const res = await service.getAgingReport(today);
      expect(res.totalOutstanding).toBe(550); // 100 + 150 + 300
      expect(res.rows[0].current).toBe(100);
      expect(res.rows[0].bucket30).toBe(150);
      expect(res.rows[0].bucket60).toBe(300);
      expect(res.rows[0].total).toBe(550);
    });
  });

  describe('writeOff', () => {
    it('succeeds and creates journal entry', async () => {
      jest.spyOn(service, 'getTenantBalance').mockResolvedValue(500);
      
      prisma.account.findUnique.mockImplementation(async ({ where }: any) => {
        if (where.code === '1100') return { id: 'acc1' };
        if (where.code === '5400') return { id: 'acc2' };
        return null;
      });

      journalService.createAndPost.mockResolvedValue({ id: 'je1' });
      prisma.writeOff.create.mockResolvedValue({ id: 'wo1' });

      const res = await service.writeOff({ tenantId: 't1', amount: 300, reason: 'r', approvedById: 'u1' });
      expect(res.id).toBe('wo1');
      expect(journalService.createAndPost).toHaveBeenCalledWith(
        expect.objectContaining({ sourceType: 'WRITE_OFF', reference: 't1' }),
        'u1'
      );
    });

    it('throws if amount > balance', async () => {
      jest.spyOn(service, 'getTenantBalance').mockResolvedValue(100);
      await expect(service.writeOff({ tenantId: 't1', amount: 300, reason: 'r', approvedById: 'u1' }))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('createCreditMemo', () => {
    it('succeeds and creates journal entry', async () => {
      prisma.account.findUnique.mockImplementation(async ({ where }: any) => {
        if (where.code === '1100') return { id: 'acc1' };
        if (where.code === '4200') return { id: 'acc2' };
        return null;
      });

      journalService.createAndPost.mockResolvedValue({ id: 'je1' });
      prisma.creditMemo.create.mockResolvedValue({ id: 'cm1' });

      const res = await service.createCreditMemo({ tenantId: 't1', amount: 300, reason: 'r', createdById: 'u1' });
      expect(res.id).toBe('cm1');
      expect(journalService.createAndPost).toHaveBeenCalledWith(
        expect.objectContaining({ sourceType: 'CREDIT_MEMO' }),
        'u1'
      );
    });
  });
});
