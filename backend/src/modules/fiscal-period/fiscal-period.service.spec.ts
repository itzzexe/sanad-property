import { Test, TestingModule } from '@nestjs/testing';
import { FiscalPeriodService } from './fiscal-period.service';
import { PrismaService } from '../../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { FiscalPeriodStatus } from '@prisma/client';

describe('FiscalPeriodService', () => {
  let service: FiscalPeriodService;
  let prisma: PrismaService;
  let eventEmitter: EventEmitter2;

  const mockPrismaService: any = {
    fiscalYear: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    fiscalPeriod: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      createMany: jest.fn(),
    },
    $transaction: jest.fn((cb: any) => cb(mockPrismaService)),
  };

  const mockEventEmitter = {
    emit: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FiscalPeriodService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    service = module.get<FiscalPeriodService>(FiscalPeriodService);
    prisma = module.get<PrismaService>(PrismaService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('initializeCurrentYear', () => {
    it('should create year and 12 periods when none exist', async () => {
      mockPrismaService.fiscalYear.findFirst.mockResolvedValue(null);
      mockPrismaService.fiscalYear.create.mockResolvedValue({ id: 'fy1', name: 'FY-2025' });
      mockPrismaService.fiscalYear.findUnique.mockResolvedValue({ id: 'fy1', periods: new Array(12) });

      const result = await service.initializeCurrentYear();

      expect(mockPrismaService.fiscalYear.create).toHaveBeenCalled();
      expect(mockPrismaService.fiscalPeriod.createMany).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should be idempotent (does nothing if year exists)', async () => {
      mockPrismaService.fiscalYear.findFirst.mockResolvedValue({ id: 'existing' });

      const result = await service.initializeCurrentYear();

      expect(mockPrismaService.fiscalYear.create).not.toHaveBeenCalled();
      expect(result.id).toBe('existing');
    });
  });

  describe('findPeriodForDate', () => {
    it('returns correct period', async () => {
      const date = new Date('2025-01-15');
      mockPrismaService.fiscalPeriod.findFirst.mockResolvedValue({ id: 'p1' });

      const result = await service.findPeriodForDate(date);
      expect(result.id).toBe('p1');
    });

    it('throws NotFoundException for out-of-range date', async () => {
      mockPrismaService.fiscalPeriod.findFirst.mockResolvedValue(null);
      await expect(service.findPeriodForDate(new Date())).rejects.toThrow(NotFoundException);
    });
  });

  describe('validatePeriodOpen', () => {
    it('throws ConflictException for CLOSED period', async () => {
      mockPrismaService.fiscalPeriod.findUnique.mockResolvedValue({ 
        status: 'CLOSED' as any 
      });
      await expect(service.validatePeriodOpen('p1')).rejects.toThrow(ConflictException);
    });
  });

  describe('closePeriod', () => {
    it('transitions OPEN -> CLOSING and emits event', async () => {
      mockPrismaService.fiscalPeriod.findUnique.mockResolvedValue({ 
        status: 'OPEN' as any 
      });
      mockPrismaService.fiscalPeriod.update.mockResolvedValue({ 
        id: 'p1', 
        status: 'CLOSING' as any 
      });

      await service.closePeriod('p1', 'user1');

      expect(mockPrismaService.fiscalPeriod.update).toHaveBeenCalledWith({
        where: { id: 'p1' },
        data: { status: 'CLOSING' },
      });
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('fiscal-period.closing', expect.anything());
    });
  });

  describe('closeFiscalYear', () => {
    it('throws if any period is still OPEN', async () => {
      mockPrismaService.fiscalYear.findUnique.mockResolvedValue({
        periods: [
          { status: 'CLOSED' }, 
          { status: 'OPEN' }
        ],
      });

      await expect(service.closeFiscalYear('fy1', 'user1')).rejects.toThrow(ConflictException);
    });
  });
});
