import { Injectable, BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { FiscalPeriodService } from '../fiscal-period/fiscal-period.service';
import { JournalEntryNumberService } from './journal-entry-number.service';
import { CreateJournalEntryDto } from './dto/create-journal-entry.dto';
import { JournalStatus, JournalSourceType, Prisma } from '@prisma/client';
import { FxService } from '../fx/fx.service';
import { Inject, forwardRef } from '@nestjs/common';

@Injectable()
export class JournalService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => FiscalPeriodService))
    private readonly fiscalPeriodService: FiscalPeriodService,
    private readonly journalNumberService: JournalEntryNumberService,
    private readonly eventEmitter: EventEmitter2,
    @Inject(forwardRef(() => FxService))
    private readonly fxService: FxService,
  ) {}

  async create(dto: CreateJournalEntryDto, createdById: string) {
    if (dto.lines.length < 2) {
      throw new BadRequestException('At least 2 lines are required.');
    }

    let totalDebit = new Prisma.Decimal(0);
    let totalCredit = new Prisma.Decimal(0);

    for (const line of dto.lines) {
      const debit = new Prisma.Decimal(line.debit || 0);
      const credit = new Prisma.Decimal(line.credit || 0);

      const hasDebit = debit.greaterThan(0);
      const hasCredit = credit.greaterThan(0);

      if ((hasDebit && hasCredit) || (!hasDebit && !hasCredit)) {
        throw new BadRequestException('Each line must have exactly one of debit or credit > 0');
      }

      totalDebit = totalDebit.add(debit);
      totalCredit = totalCredit.add(credit);
    }

    if (!totalDebit.equals(totalCredit)) {
      throw new BadRequestException(`Journal entry is unbalanced: debits=${totalDebit.toNumber()} credits=${totalCredit.toNumber()}`);
    }

    // Validate accounts
    const accountIds = dto.lines.map((l) => l.accountId);
    const accounts = await this.prisma.account.findMany({
      where: { id: { in: accountIds } },
    });

    if (accounts.length !== new Set(accountIds).size) {
      throw new BadRequestException('One or more accounts do not exist.');
    }

    for (const acc of accounts) {
      if (!acc.isActive) {
        throw new BadRequestException(`Account ${acc.code} is inactive.`);
      }
    }

    const fiscalPeriod = await this.fiscalPeriodService.findPeriodForDate(dto.date);
    const entryNumber = await this.journalNumberService.generateNext(fiscalPeriod.fiscalYearId);

    return this.prisma.journalEntry.create({
      data: {
        entryNumber,
        date: dto.date,
        description: dto.description,
        reference: dto.reference,
        sourceType: dto.sourceType as JournalSourceType,
        notes: dto.notes,
        fiscalPeriodId: fiscalPeriod.id,
        createdById,
        status: JournalStatus.DRAFT,
        lines: {
          create: await Promise.all(dto.lines.map(async (l) => {
            let exchangeRate = new Prisma.Decimal(l.exchangeRate || 1);
            const currencyCode = l.currencyCode || 'USD';
            
            if (currencyCode !== 'USD' && exchangeRate.equals(1)) {
              try {
                exchangeRate = await this.fxService.getRate(currencyCode, 'USD', new Date(dto.date));
              } catch (e) {
                throw new BadRequestException(`No exchange rate found for ${currencyCode} to USD on ${dto.date}`);
              }
            }

            const amount = l.debit && Number(l.debit) > 0 ? l.debit : l.credit || 0;
            const baseAmount = new Prisma.Decimal(amount).mul(exchangeRate);
            
            return {
              accountId: l.accountId,
              debit: l.debit || 0,
              credit: l.credit || 0,
              description: l.description,
              currencyCode,
              exchangeRate,
              baseCurrencyDebit: (l.debit || 0) > 0 ? baseAmount : 0,
              baseCurrencyCredit: (l.credit || 0) > 0 ? baseAmount : 0,
            };
          })),
        },
      },
      include: { lines: true },
    });
  }

  async createAndPost(dto: CreateJournalEntryDto, createdById: string) {
    const entry = await this.create(dto, createdById);
    return this.post(entry.id, createdById);
  }

  async findAll(
    filters: { status?: JournalStatus; sourceType?: JournalSourceType; startDate?: Date; endDate?: Date; fiscalPeriodId?: string; reference?: string },
    pagination: { page: number; limit: number }
  ) {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const where: Prisma.JournalEntryWhereInput = {};
    if (filters.status) where.status = filters.status;
    if (filters.sourceType) where.sourceType = filters.sourceType;
    if (filters.fiscalPeriodId) where.fiscalPeriodId = filters.fiscalPeriodId;
    if (filters.reference) where.reference = filters.reference;
    
    if (filters.startDate || filters.endDate) {
      where.date = {};
      if (filters.startDate) where.date.gte = filters.startDate;
      if (filters.endDate) where.date.lte = filters.endDate;
    }

    const [data, total] = await Promise.all([
      this.prisma.journalEntry.findMany({
        where,
        skip,
        take: limit,
        include: {
          lines: {
            include: { account: true },
          },
        },
        orderBy: { date: 'desc' },
      }),
      this.prisma.journalEntry.count({ where }),
    ]);

    return { data, total };
  }

  async findOne(id: string) {
    const entry = await this.prisma.journalEntry.findUnique({
      where: { id },
      include: { lines: { include: { account: true } } },
    });
    if (!entry) throw new NotFoundException('Journal entry not found');
    return entry;
  }

  async findByReference(reference: string) {
    return this.prisma.journalEntry.findFirst({
      where: { reference },
    });
  }

  async post(id: string, postedById: string) {
    return this.prisma.$transaction(async (tx: any) => {
      const entry = await tx.journalEntry.findUnique({
        where: { id },
        include: { lines: { include: { account: true } } },
      });

      if (!entry) throw new NotFoundException('Journal entry not found');
      if (entry.status !== JournalStatus.DRAFT) throw new ConflictException('Only DRAFT entries can be posted');

      await this.fiscalPeriodService.validatePeriodOpen(entry.fiscalPeriodId);

      // Re-validate balance safety check
      let totalDebit = new Prisma.Decimal(0);
      let totalCredit = new Prisma.Decimal(0);
      for (const line of entry.lines) {
        totalDebit = totalDebit.add(line.baseCurrencyDebit);
        totalCredit = totalCredit.add(line.baseCurrencyCredit);
      }

      if (!totalDebit.equals(totalCredit)) {
        throw new ConflictException('Journal entry is unbalanced, cannot post');
      }

      const postedEntry = await tx.journalEntry.update({
        where: { id },
        data: {
          status: JournalStatus.POSTED,
          postedById,
          postedAt: new Date(),
        },
        include: { lines: { include: { account: true } } },
      });

      // Update AccountBalances
      for (const line of entry.lines) {
        let accountBalance = await tx.accountBalance.findUnique({
          where: {
            accountId_fiscalPeriodId: {
              accountId: line.accountId,
              fiscalPeriodId: entry.fiscalPeriodId,
            },
          },
        });

        if (!accountBalance) {
          accountBalance = await tx.accountBalance.create({
            data: {
              accountId: line.accountId,
              fiscalPeriodId: entry.fiscalPeriodId,
              openingBalance: 0,
              debitTotal: 0,
              creditTotal: 0,
              closingBalance: 0,
            },
          });
        }

        const debitTotal = new Prisma.Decimal(accountBalance.debitTotal).add(line.baseCurrencyDebit);
        const creditTotal = new Prisma.Decimal(accountBalance.creditTotal).add(line.baseCurrencyCredit);
        const openingBalance = new Prisma.Decimal(accountBalance.openingBalance);

        let closingBalance = new Prisma.Decimal(0);
        if (['ASSET', 'EXPENSE'].includes(line.account.type)) {
          closingBalance = openingBalance.add(debitTotal).sub(creditTotal);
        } else {
          closingBalance = openingBalance.add(creditTotal).sub(debitTotal);
        }

        await tx.accountBalance.update({
          where: { id: accountBalance.id },
          data: {
            debitTotal,
            creditTotal,
            closingBalance,
          },
        });
      }

      this.eventEmitter.emit('journal-entry.posted', postedEntry);

      return postedEntry;
    });
  }

  async reverse(id: string, reason: string, reversedById: string) {
    const reversalId = await this.prisma.$transaction(async (tx: any) => {
      const originalEntry = await tx.journalEntry.findUnique({
        where: { id },
        include: { lines: true, fiscalPeriod: true },
      });

      if (!originalEntry) throw new NotFoundException('Journal entry not found');
      if (originalEntry.status !== JournalStatus.POSTED) throw new ConflictException('Only POSTED entries can be reversed');
      if (originalEntry.reversalOfId) throw new ConflictException('Cannot reverse a reversal entry');
      
      const checkReversed = await tx.journalEntry.findUnique({ where: { reversalOfId: id } });
      if (checkReversed) throw new ConflictException('Entry is already reversed');

      const today = new Date();
      const currentPeriod = await this.fiscalPeriodService.findPeriodForDate(today);

      const entryNumber = await this.journalNumberService.generateNext(currentPeriod.fiscalYearId);

      const reversalEntry = await tx.journalEntry.create({
        data: {
          entryNumber,
          date: today,
          description: `Reversal of ${originalEntry.entryNumber}: ${reason}`,
          sourceType: JournalSourceType.REVERSAL,
          status: JournalStatus.DRAFT,
          fiscalPeriodId: currentPeriod.id,
          reversalOfId: id,
          createdById: reversedById,
          lines: {
            create: originalEntry.lines.map((l: any) => ({
              accountId: l.accountId,
              debit: l.credit,
              credit: l.debit,
              description: l.description,
              currencyCode: l.currencyCode,
              exchangeRate: l.exchangeRate,
              baseCurrencyDebit: l.baseCurrencyCredit,
              baseCurrencyCredit: l.baseCurrencyDebit,
            })),
          },
        },
      });

      await tx.journalEntry.update({
        where: { id },
        data: { status: JournalStatus.REVERSED },
      });

      return reversalEntry.id;
    });

    return this.post(reversalId, reversedById);
  }

  async delete(id: string) {
    const entry = await this.prisma.journalEntry.findUnique({ where: { id } });
    if (!entry) throw new NotFoundException('Journal entry not found');
    if (entry.status !== JournalStatus.DRAFT) {
      throw new ConflictException('Only DRAFT entries can be deleted');
    }

    await this.prisma.journalEntry.delete({ where: { id } });
  }
}
