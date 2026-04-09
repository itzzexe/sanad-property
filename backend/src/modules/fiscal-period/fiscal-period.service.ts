import {
  Injectable,
  OnApplicationBootstrap,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  FiscalYear,
  FiscalPeriod,
  FiscalYearStatus,
  FiscalPeriodStatus,
} from '@prisma/client';
import { CreateFiscalYearDto } from './dto/create-fiscal-year.dto';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { ReportsService } from '../reports/reports.service';
import { JournalService } from '../journal/journal.service';
import { JournalSourceType } from '@prisma/client';
import { Inject, forwardRef } from '@nestjs/common';

@Injectable()
export class FiscalPeriodService implements OnApplicationBootstrap {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    @Inject(forwardRef(() => ReportsService))
    private readonly reportsService: ReportsService,
    @Inject(forwardRef(() => JournalService))
    private readonly journalService: JournalService,
  ) {}

  async onApplicationBootstrap() {
    await this.initializeCurrentYear();
  }

  async initializeCurrentYear(): Promise<FiscalYear> {
    const today = new Date();
    const currentYear = today.getFullYear();
    const name = `FY-${currentYear}`;

    // Check if any year exists containing today
    const existingYear = await this.prisma.fiscalYear.findFirst({
      where: {
        startDate: { lte: today },
        endDate: { gte: today },
      },
      include: {
        periods: {
          orderBy: { periodNumber: 'asc' },
        },
      },
    });

    if (existingYear) {
      return existingYear;
    }

    // Default: Jan 1 to Dec 31
    const startDate = new Date(Date.UTC(currentYear, 0, 1));
    const endDate = new Date(Date.UTC(currentYear, 11, 31, 23, 59, 59, 999));

    return this.createFiscalYear({
      name,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });
  }

  async createFiscalYear(dto: CreateFiscalYearDto): Promise<FiscalYear> {
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    // Overlap validation
    const overlap = await this.prisma.fiscalYear.findFirst({
      where: {
        OR: [
          { startDate: { lte: startDate }, endDate: { gte: startDate } },
          { startDate: { lte: endDate }, endDate: { gte: endDate } },
          {
            AND: [
              { startDate: { gte: startDate } },
              { endDate: { lte: endDate } },
            ],
          },
        ],
      },
    });

    if (overlap) {
      throw new ConflictException('Fiscal year overlaps with an existing period');
    }

    return this.prisma.$transaction(async (tx) => {
      const fiscalYear = await tx.fiscalYear.create({
        data: {
          name: dto.name,
          startDate,
          endDate,
          status: FiscalYearStatus.OPEN,
        },
      });

      const periods = [];
      const startMonth = startDate.getUTCMonth();
      const startYear = startDate.getUTCFullYear();

      for (let i = 1; i <= 12; i++) {
        const pStart = new Date(Date.UTC(startYear, startMonth + i - 1, 1));
        const pEnd = new Date(Date.UTC(startYear, startMonth + i, 0, 23, 59, 59, 999));

        periods.push({
          fiscalYearId: fiscalYear.id,
          periodNumber: i,
          name: pStart.toLocaleString('default', { month: 'short', year: 'numeric' }),
          startDate: pStart,
          endDate: pEnd,
          status: FiscalPeriodStatus.OPEN,
        });
      }

      await tx.fiscalPeriod.createMany({ data: periods });

      return tx.fiscalYear.findUnique({
        where: { id: fiscalYear.id },
        include: { periods: { orderBy: { periodNumber: 'asc' } } },
      }) as unknown as Promise<FiscalYear>;
    });
  }

  async findAllYears(): Promise<FiscalYear[]> {
    return this.prisma.fiscalYear.findMany({
      include: { periods: { orderBy: { periodNumber: 'asc' } } },
      orderBy: { startDate: 'desc' },
    });
  }

  async findYearById(id: string): Promise<FiscalYear> {
    const year = await this.prisma.fiscalYear.findUnique({
      where: { id },
      include: { periods: { orderBy: { periodNumber: 'asc' } } },
    });
    if (!year) throw new NotFoundException('Fiscal year not found');
    return year;
  }

  async findAllPeriods(filters?: {
    fiscalYearId?: string;
    status?: FiscalPeriodStatus;
  }): Promise<FiscalPeriod[]> {
    return this.prisma.fiscalPeriod.findMany({
      where: filters,
      orderBy: [{ fiscalYearId: 'asc' }, { periodNumber: 'asc' }],
    });
  }

  async findCurrentPeriod(): Promise<FiscalPeriod> {
    const today = new Date();
    const period = await this.prisma.fiscalPeriod.findFirst({
      where: {
        startDate: { lte: today },
        endDate: { gte: today },
        status: FiscalPeriodStatus.OPEN,
      },
    });

    if (!period) {
      throw new ConflictException('No open fiscal period found for current date. System misconfigured.');
    }

    return period;
  }

  async findPeriodForDate(date: Date): Promise<FiscalPeriod> {
    const period = await this.prisma.fiscalPeriod.findFirst({
      where: {
        startDate: { lte: date },
        endDate: { gte: date },
      },
    });

    if (!period) {
      throw new NotFoundException(`No fiscal period found for given date: ${date.toISOString()}`);
    }

    return period;
  }

  async validatePeriodOpen(periodId: string): Promise<void> {
    const period = await this.prisma.fiscalPeriod.findUnique({
      where: { id: periodId },
      select: { status: true },
    });

    if (!period) throw new NotFoundException('Fiscal period not found');
    if (period.status !== FiscalPeriodStatus.OPEN) {
      throw new ConflictException(`Fiscal period is NOT OPEN (current status: ${period.status})`);
    }
  }

  async closePeriod(periodId: string, closedBy: string): Promise<FiscalPeriod> {
    const period = await this.prisma.fiscalPeriod.findUnique({ where: { id: periodId } });
    if (!period) throw new NotFoundException('Fiscal period not found');
    if (period.status !== FiscalPeriodStatus.OPEN) {
      throw new ConflictException('Only OPEN periods can be closed');
    }

    // Phase 1: Set to CLOSING
    const updated = await this.prisma.fiscalPeriod.update({
      where: { id: periodId },
      data: { status: FiscalPeriodStatus.CLOSING },
    });

    // Phase 2: Emit event for async processing
    this.eventEmitter.emit('fiscal-period.closing', { periodId, closedBy });

    return updated;
  }

  @OnEvent('fiscal-period.closing', { async: true })
  async handlePeriodClosing(payload: { periodId: string; closedBy: string }) {
    // 1. Generate Closing Entries
    const is = await this.reportsService.incomeStatement({ fiscalPeriodId: payload.periodId });
    const closingLines = [];
    const retainedEarningsAccount = await this.prisma.account.findUnique({ where: { code: '3100' } });

    if (retainedEarningsAccount) {
      for (const section of is.sections) {
        for (const acc of section.accounts) {
          if (acc.amount === 0) continue;
          
          const account = await this.prisma.account.findUnique({ where: { code: acc.code } });
          if (!account) continue;

          if (account.type === 'REVENUE') {
            // Revenue DR [amount] / RE CR [amount]
            closingLines.push({ accountId: account.id, debit: acc.amount, credit: 0, description: `Closing ${account.code}` });
            closingLines.push({ accountId: retainedEarningsAccount.id, debit: 0, credit: acc.amount, description: `P&L Closing from ${account.code}` });
          } else {
            // RE DR [amount] / Expense CR [amount]
            closingLines.push({ accountId: retainedEarningsAccount.id, debit: acc.amount, credit: 0, description: `P&L Closing to ${account.code}` });
            closingLines.push({ accountId: account.id, debit: 0, credit: acc.amount, description: `Closing ${account.code}` });
          }
        }
      }

      if (closingLines.length > 0) {
        await this.journalService.createAndPost({
          date: is.period.endDate,
          description: `Period Closing Adjustment - ${payload.periodId}`,
          sourceType: JournalSourceType.CLOSING,
          lines: closingLines,
        }, payload.closedBy);
      }
    }

    // 2. Finalize Closure
    await this.prisma.fiscalPeriod.update({
      where: { id: payload.periodId },
      data: {
        status: FiscalPeriodStatus.CLOSED,
        closedAt: new Date(),
        closedBy: payload.closedBy,
      },
    });
  }

  async closeFiscalYear(fiscalYearId: string, closedBy: string): Promise<FiscalYear> {
    const year = await this.prisma.fiscalYear.findUnique({
      where: { id: fiscalYearId },
      include: { periods: true },
    });

    if (!year) throw new NotFoundException('Fiscal year not found');

    const openPeriods = year.periods.filter((p) => p.status !== FiscalPeriodStatus.CLOSED);
    if (openPeriods.length > 0) {
      throw new ConflictException(
        `Cannot close fiscal year. ${openPeriods.length} periods are not CLOSED.`,
      );
    }

    return this.prisma.fiscalYear.update({
      where: { id: fiscalYearId },
      data: { status: FiscalYearStatus.CLOSED },
      include: { periods: true },
    });
  }
}
