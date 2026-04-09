import { Test, TestingModule } from '@nestjs/testing';
import { FxService } from './fx.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JournalService } from '../journal/journal.service';
import { Prisma, FxSource } from '@prisma/client';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('FxService', () => {
  let service: FxService;
  let prisma: PrismaService;

  const mockExchangeRate = {
    id: '1',
    fromCurrency: 'EUR',
    toCurrency: 'USD',
    rate: new Prisma.Decimal(1.10),
    date: new Date('2025-05-10'),
    source: FxSource.MANUAL,
  };

  const mockPrismaService = {
    exchangeRate: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
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
        FxService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JournalService, useValue: mockJournalService },
      ],
    }).compile();

    service = module.get<FxService>(FxService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  describe('setRate', () => {
    it('creates rate and auto-creates inverse', async () => {
      const dto = {
        fromCurrency: 'EUR',
        toCurrency: 'USD',
        rate: 1.10,
        date: '2025-05-10',
      };

      await service.setRate(dto);

      expect(mockPrismaService.exchangeRate.upsert).toHaveBeenCalledTimes(2);
      // First call (EUR to USD)
      expect(mockPrismaService.exchangeRate.upsert).toHaveBeenNthCalledWith(1, expect.objectContaining({
        where: { fromCurrency_toCurrency_date: { fromCurrency: 'EUR', toCurrency: 'USD', date: expect.any(Date) } },
        create: expect.objectContaining({ rate: new Prisma.Decimal(1.10) })
      }));
      // Second call (USD to EUR)
      expect(mockPrismaService.exchangeRate.upsert).toHaveBeenNthCalledWith(2, expect.objectContaining({
        where: { fromCurrency_toCurrency_date: { fromCurrency: 'USD', toCurrency: 'EUR', date: expect.any(Date) } },
        create: expect.objectContaining({ rate: new Prisma.Decimal(1).div(1.10) })
      }));
    });
  });

  describe('getRate', () => {
    it('returns exact rate for date', async () => {
      mockPrismaService.exchangeRate.findUnique.mockResolvedValue(mockExchangeRate);
      const rate = await service.getRate('EUR', 'USD', new Date('2025-05-10'));
      expect(rate.toNumber()).toBe(1.10);
      expect(mockPrismaService.exchangeRate.findUnique).toHaveBeenCalledTimes(1);
    });

    it('falls back up to 7 days for missing date', async () => {
      // Return null for first 2 days, then mock rate on 3rd day back (May 8)
      mockPrismaService.exchangeRate.findUnique
        .mockResolvedValueOnce(null) // May 10
        .mockResolvedValueOnce(null) // May 9
        .mockResolvedValueOnce(mockExchangeRate); // May 8

      const rate = await service.getRate('EUR', 'USD', new Date('2025-05-10'));
      expect(rate.toNumber()).toBe(1.10);
      expect(mockPrismaService.exchangeRate.findUnique).toHaveBeenCalledTimes(3);
    });

    it('throws NotFoundException after 7 days without a rate', async () => {
      mockPrismaService.exchangeRate.findUnique.mockResolvedValue(null);
      await expect(service.getRate('EUR', 'USD', new Date('2025-05-10'))).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.exchangeRate.findUnique).toHaveBeenCalledTimes(8); // Today + 7 days back
    });

    it('returns 1 when fromCurrency === toCurrency', async () => {
      const rate = await service.getRate('USD', 'USD', new Date());
      expect(rate.toNumber()).toBe(1);
      expect(mockPrismaService.exchangeRate.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('convert', () => {
    it('multiplies correctly', async () => {
      mockPrismaService.exchangeRate.findUnique.mockResolvedValue(mockExchangeRate);
      const result = await service.convert(100, 'EUR', 'USD', new Date());
      expect(result.toNumber()).toBe(110);
    });
  });
});
