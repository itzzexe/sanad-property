import { Test, TestingModule } from '@nestjs/testing';
import { TaxService } from './tax.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JournalService } from '../journal/journal.service';
import { Prisma, TaxType, JournalStatus } from '@prisma/client';

describe('TaxService', () => {
  let service: TaxService;
  let prisma: PrismaService;

  const mockTaxRate = {
    id: 'tax1',
    name: 'VAT 15%',
    code: 'VAT_15',
    rate: new Prisma.Decimal(0.15),
    type: TaxType.VAT,
    accountId: 'acc_tax',
    isDefault: true,
  };

  const mockPrismaService = {
    taxRate: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      updateMany: jest.fn(),
    },
    taxLine: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    journalEntry: {
      findUnique: jest.fn(),
    },
    account: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn().mockImplementation((cb) => cb(mockPrismaService)),
  };

  const mockJournalService = {
    createAndPost: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaxService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JournalService, useValue: mockJournalService },
      ],
    }).compile();

    service = module.get<TaxService>(TaxService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  describe('createTaxRate', () => {
    it('creates rate and unsets previous default of same type', async () => {
      const dto: any = {
        name: 'New VAT',
        code: 'VAT_NEW',
        rate: 0.10,
        type: TaxType.VAT,
        isDefault: true,
        accountId: 'acc1',
        applicableFrom: '2025-01-01',
      };

      await service.createTaxRate(dto);

      expect(mockPrismaService.taxRate.updateMany).toHaveBeenCalledWith({
        where: { type: TaxType.VAT, isDefault: true },
        data: { isDefault: false },
      });
      expect(mockPrismaService.taxRate.create).toHaveBeenCalled();
    });
  });

  describe('calculateTax', () => {
    it('correct computation and rounding', () => {
      const result = service.calculateTax(100.5555, 0.15);
      expect(result.taxAmount.toNumber()).toBe(15.0833);
      expect(result.totalAmount.toNumber()).toBe(115.6388);
    });
  });

  describe('getVatReturn', () => {
    it('correctly separates input and output tax, nets them', async () => {
      const mockLines = [
        { isInput: true, taxAmount: new Prisma.Decimal(50), taxableAmount: new Prisma.Decimal(333), journalEntry: { date: new Date(), entryNumber: 'JE1' }, taxRate: { name: 'V1', code: 'C1' } },
        { isInput: false, taxAmount: new Prisma.Decimal(150), taxableAmount: new Prisma.Decimal(1000), journalEntry: { date: new Date(), entryNumber: 'JE2' }, taxRate: { name: 'V1', code: 'C1' } },
      ];
      mockPrismaService.taxLine.findMany.mockResolvedValue(mockLines);

      const result = await service.getVatReturn('2025-01-01', '2025-01-31');

      expect(result.inputTax.toNumber()).toBe(50);
      expect(result.outputTax.toNumber()).toBe(150);
      expect(result.netVatPayable.toNumber()).toBe(100);
    });
  });

  describe('applyTaxToJournalEntry', () => {
    it('creates correct journal entry and TaxLine', async () => {
      mockPrismaService.journalEntry.findUnique.mockResolvedValue({ id: 'je1', status: JournalStatus.POSTED, date: new Date(), entryNumber: 'JE100' });
      mockPrismaService.taxRate.findUnique.mockResolvedValue(mockTaxRate);
      mockPrismaService.account.findMany.mockResolvedValue([
        { code: '1100', id: 'ar_id' },
        { code: '2000', id: 'ap_id' },
      ]);
      mockJournalService.createAndPost.mockResolvedValue({ id: 'tax_je_id' });

      await service.applyTaxToJournalEntry('je1', 'tax1', 1000, false, 'user1');

      expect(mockJournalService.createAndPost).toHaveBeenCalledWith(
        expect.objectContaining({
          lines: expect.arrayContaining([
            expect.objectContaining({ accountId: 'ar_id', debit: 150 }),
            expect.objectContaining({ accountId: 'acc_tax', credit: 150 }),
          ]),
        }),
        'user1'
      );
      expect(mockPrismaService.taxLine.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ taxAmount: new Prisma.Decimal(150) }),
        })
      );
    });
  });
});
