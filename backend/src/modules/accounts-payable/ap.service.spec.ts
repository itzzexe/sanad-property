import { Test, TestingModule } from '@nestjs/testing';
import { ApService } from './ap.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JournalService } from '../journal/journal.service';
import { BillStatus, Prisma, JournalSourceType } from '@prisma/client';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';

describe('ApService', () => {
  let service: ApService;
  let prisma: PrismaService;
  let journalService: JournalService;

  const mockPrismaService = {
    vendor: {
      findUnique: jest.fn(),
    },
    bill: {
      count: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    billPayment: {
      create: jest.fn(),
    },
    account: {
      findFirst: jest.fn(),
    },
    $transaction: jest.fn().mockImplementation((cb) => cb(mockPrismaService)),
  };

  const mockJournalService = {
    createAndPost: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JournalService, useValue: mockJournalService },
      ],
    }).compile();

    service = module.get<ApService>(ApService);
    prisma = module.get<PrismaService>(PrismaService);
    journalService = module.get<JournalService>(JournalService);
    jest.clearAllMocks();
  });

  describe('createBill', () => {
    it('creates bill with auto-generated number and DRAFT status', async () => {
      mockPrismaService.vendor.findUnique.mockResolvedValue({ id: 'vendor1' });
      mockPrismaService.bill.count.mockResolvedValue(5);
      mockPrismaService.bill.create.mockImplementation((args) => Promise.resolve({ id: 'bill1', ...args.data }));

      const result = await service.createBill({
        vendorId: 'vendor1',
        billDate: '2025-05-10',
        dueDate: '2025-05-20',
        subtotal: 100,
        taxAmount: 15,
        expenseAccountId: 'acc1',
        description: 'Test bill',
      }, 'user1');

      expect(mockPrismaService.bill.count).toHaveBeenCalledWith({
        where: { billNumber: { startsWith: 'BILL-2025-' } }
      });
      expect(mockPrismaService.bill.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          billNumber: 'BILL-2025-0006',
          status: BillStatus.DRAFT,
          subtotal: new Prisma.Decimal(100),
          taxAmount: new Prisma.Decimal(15),
          totalAmount: new Prisma.Decimal(115),
        })
      });
      expect(result.status).toBe(BillStatus.DRAFT);
    });
  });

  describe('postBill', () => {
    it('creates correct journal entry, links it, sets status = POSTED', async () => {
      const mockBill = {
        id: 'bill1',
        status: BillStatus.DRAFT,
        expenseAccountId: 'exp1',
        subtotal: new Prisma.Decimal(100),
        taxAmount: new Prisma.Decimal(0),
        totalAmount: new Prisma.Decimal(100),
        description: 'Test',
        billNumber: 'BILL-2025-0001',
        vendorId: 'vendor1',
      };
      mockPrismaService.bill.findUnique.mockResolvedValue(mockBill);
      mockPrismaService.account.findFirst.mockResolvedValue({ id: 'ap_acc', code: '2000' });
      mockJournalService.createAndPost.mockResolvedValue({ id: 'je1' });
      mockPrismaService.bill.update.mockResolvedValue({ ...mockBill, status: BillStatus.POSTED, journalEntryId: 'je1' });

      const result = await service.postBill('bill1', 'user1');

      expect(mockJournalService.createAndPost).toHaveBeenCalledWith(
        expect.objectContaining({
          sourceType: JournalSourceType.BILL,
          lines: [
            { accountId: 'exp1', debit: 100, credit: 0, description: 'Test' },
            { accountId: 'ap_acc', debit: 0, credit: 100, description: 'AP for Bill BILL-2025-0001' }
          ]
        }),
        'user1'
      );
      expect(mockPrismaService.bill.update).toHaveBeenCalledWith({
        where: { id: 'bill1' },
        data: { status: BillStatus.POSTED, journalEntryId: 'je1' }
      });
      expect(result.status).toBe(BillStatus.POSTED);
    });

    it('throws on non-DRAFT bill', async () => {
      mockPrismaService.bill.findUnique.mockResolvedValue({ status: BillStatus.POSTED });
      await expect(service.postBill('bill1', 'user1')).rejects.toThrow(ConflictException);
    });
  });

  describe('payBill', () => {
    it('creates correct AP DR / Cash CR entry and sets status to PAID when fully paid', async () => {
      const mockBill = {
        id: 'bill1',
        status: BillStatus.POSTED,
        totalAmount: new Prisma.Decimal(100),
        paidAmount: new Prisma.Decimal(0),
        billNumber: 'B1',
      };
      mockPrismaService.bill.findUnique.mockResolvedValue(mockBill);
      mockPrismaService.account.findFirst.mockImplementation(async ({ where }) => {
        if (where.code === '2000') return { id: 'ap_acc' };
        if (where.code === '1000') return { id: 'cash_acc' };
        return null;
      });
      mockJournalService.createAndPost.mockResolvedValue({ id: 'je_pay' });
      mockPrismaService.billPayment.create.mockResolvedValue({ id: 'pay1' });

      await service.payBill('bill1', { amount: 100, paidAt: '2025-06-01', paymentMethod: 'CASH' }, 'user1');

      expect(mockJournalService.createAndPost).toHaveBeenCalledWith(
        expect.objectContaining({
          sourceType: JournalSourceType.BILL_PAYMENT,
          lines: [
            { accountId: 'ap_acc', debit: 100, credit: 0, description: expect.any(String) },
            { accountId: 'cash_acc', debit: 0, credit: 100, description: expect.any(String) },
          ]
        }),
        'user1'
      );
      expect(mockPrismaService.bill.update).toHaveBeenCalledWith({
        where: { id: 'bill1' },
        data: { paidAmount: expect.any(Prisma.Decimal), status: BillStatus.PAID }
      });
    });

    it('sets status to PARTIAL otherwise', async () => {
      const mockBill = {
        id: 'bill1',
        status: BillStatus.POSTED,
        totalAmount: new Prisma.Decimal(100),
        paidAmount: new Prisma.Decimal(0),
      };
      mockPrismaService.bill.findUnique.mockResolvedValue(mockBill);
      mockPrismaService.account.findFirst.mockResolvedValue({ id: 'acc' });

      await service.payBill('bill1', { amount: 40, paidAt: '2025-06-01', paymentMethod: 'CASH' }, 'user1');

      expect(mockPrismaService.bill.update).toHaveBeenCalledWith({
        where: { id: 'bill1' },
        data: { paidAmount: expect.any(Prisma.Decimal), status: BillStatus.PARTIAL }
      });
    });

    it('throws when payment exceeds remaining balance', async () => {
      mockPrismaService.bill.findUnique.mockResolvedValue({
        status: BillStatus.POSTED,
        totalAmount: new Prisma.Decimal(100),
        paidAmount: new Prisma.Decimal(20),
      });

      await expect(
        service.payBill('bill1', { amount: 90, paidAt: '2025-06-01', paymentMethod: 'CASH' }, 'user1')
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getApAgingReport', () => {
    it('buckets bills correctly by days overdue', async () => {
      const mockDate = new Date('2025-06-01T00:00:00Z');
      const mockBills = [
        {
          vendorId: 'v1',
          totalAmount: new Prisma.Decimal(100),
          paidAmount: new Prisma.Decimal(0),
          dueDate: new Date('2025-06-05T00:00:00Z'), // current (-4 days)
          vendor: { id: 'v1', name: 'Vendor 1' },
        },
        {
          vendorId: 'v1',
          totalAmount: new Prisma.Decimal(200),
          paidAmount: new Prisma.Decimal(50), // remaining 150
          dueDate: new Date('2025-05-15T00:00:00Z'), // 17 days
          vendor: { id: 'v1', name: 'Vendor 1' },
        },
        {
          vendorId: 'v2',
          totalAmount: new Prisma.Decimal(300),
          paidAmount: new Prisma.Decimal(0),
          dueDate: new Date('2025-03-01T00:00:00Z'), // > 90 days
          vendor: { id: 'v2', name: 'Vendor 2' },
        }
      ];

      mockPrismaService.bill.findMany.mockResolvedValue(mockBills);

      const report = await service.getApAgingReport(mockDate.toISOString());
      
      expect(report).toHaveLength(2);
      const v1Report = report.find((r: any) => r.vendorId === 'v1');
      expect(v1Report.current).toBe(100);
      expect(v1Report['1-30']).toBe(150);
      expect(v1Report.total).toBe(250);

      const v2Report = report.find((r: any) => r.vendorId === 'v2');
      expect(v2Report['90+']).toBe(300);
      expect(v2Report.total).toBe(300);
    });
  });
});
