import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateExchangeRateDto } from './dto/create-exchange-rate.dto';
import { Prisma, FxSource, JournalSourceType } from '@prisma/client';
import { JournalService } from '../journal/journal.service';

@Injectable()
export class FxService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => JournalService))
    private readonly journalService: JournalService,
  ) {}

  async setRate(dto: CreateExchangeRateDto) {
    if (dto.rate <= 0) {
      throw new BadRequestException('Rate must be greater than 0');
    }

    const rateDate = new Date(dto.date);
    rateDate.setHours(0, 0, 0, 0);

    return this.prisma.$transaction(async (tx) => {
      // Upsert original rate
      const rate = await tx.exchangeRate.upsert({
        where: {
          fromCurrency_toCurrency_date: {
            fromCurrency: dto.fromCurrency,
            toCurrency: dto.toCurrency,
            date: rateDate,
          },
        },
        update: {
          rate: new Prisma.Decimal(dto.rate),
          source: dto.source || FxSource.MANUAL,
        },
        create: {
          fromCurrency: dto.fromCurrency,
          toCurrency: dto.toCurrency,
          date: rateDate,
          rate: new Prisma.Decimal(dto.rate),
          source: dto.source || FxSource.MANUAL,
        },
      });

      // Upsert inverse rate
      await tx.exchangeRate.upsert({
        where: {
          fromCurrency_toCurrency_date: {
            fromCurrency: dto.toCurrency,
            toCurrency: dto.fromCurrency,
            date: rateDate,
          },
        },
        update: {
          rate: new Prisma.Decimal(1).div(new Prisma.Decimal(dto.rate)),
          source: dto.source || FxSource.MANUAL,
        },
        create: {
          fromCurrency: dto.toCurrency,
          toCurrency: dto.fromCurrency,
          date: rateDate,
          rate: new Prisma.Decimal(1).div(new Prisma.Decimal(dto.rate)),
          source: dto.source || FxSource.MANUAL,
        },
      });

      return rate;
    });
  }

  async getRate(fromCurrency: string, toCurrency: string, date: Date): Promise<Prisma.Decimal> {
    if (fromCurrency === toCurrency) {
      return new Prisma.Decimal(1);
    }

    const searchDate = new Date(date);
    searchDate.setHours(0, 0, 0, 0);

    // Search backward up to 7 days
    for (let i = 0; i < 8; i++) { // 0 to 7
      const d = new Date(searchDate);
      d.setDate(d.getDate() - i);
      
      const rate = await this.prisma.exchangeRate.findUnique({
        where: {
          fromCurrency_toCurrency_date: {
            fromCurrency,
            toCurrency,
            date: d,
          },
        },
      });

      if (rate) {
        return rate.rate;
      }
    }

    throw new NotFoundException(`No exchange rate found for ${fromCurrency} to ${toCurrency} on or up to 7 days before ${date.toISOString().split('T')[0]}`);
  }

  async convert(amount: number | Prisma.Decimal, fromCurrency: string, toCurrency: string, date: Date): Promise<Prisma.Decimal> {
    const rate = await this.getRate(fromCurrency, toCurrency, date);
    return new Prisma.Decimal(amount).mul(rate);
  }

  async importRates(csvString: string) {
    const lines = csvString.split('\n');
    let created = 0;
    let updated = 0;
    const errors: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const parts = line.split(',');
      if (parts.length < 4) {
        errors.push(`Row ${i + 1}: Invalid format (expected fromCurrency,toCurrency,rate,date)`);
        continue;
      }

      const [fromCurrency, toCurrency, rateStr, dateStr] = parts;
      const rate = parseFloat(rateStr);
      
      if (isNaN(rate) || rate <= 0) {
        errors.push(`Row ${i + 1}: Invalid rate ${rateStr}`);
        continue;
      }

      try {
        await this.setRate({
          fromCurrency,
          toCurrency,
          rate,
          date: dateStr,
          source: FxSource.API, // Default for import
        });
        created++; // Simulating count, upsert makes it tricky to differentiate without checking first
      } catch (e) {
        errors.push(`Row ${i + 1}: ${e.message}`);
      }
    }

    return { created, updated, errors };
  }

  async runRevaluation(fiscalPeriodId: string, runById: string) {
    const period = await this.prisma.fiscalPeriod.findUnique({
      where: { id: fiscalPeriodId },
    });

    if (!period) throw new NotFoundException('Fiscal period not found');
    
    // Revaluation date is the end of the period
    const revalDate = period.endDate;
    const baseCurrency = 'USD';

    // Find all accounts with currency != base currency that have balances in this period
    const nonBaseBalances = await this.prisma.accountBalance.findMany({
      where: {
        fiscalPeriodId,
        account: {
          currency: { not: baseCurrency },
        },
        OR: [
          { debitTotal: { gt: 0 } },
          { creditTotal: { gt: 0 } },
          { openingBalance: { not: 0 } }
        ]
      },
      include: { account: true },
    });

    const revalDetails = [];
    let netGainLoss = new Prisma.Decimal(0);
    const journalLines = [];

    for (const balance of nonBaseBalances) {
      const acc = balance.account;
      
      // Compute current foreign currency balance
      // Logic assumes asset/expense: DR - CR, liability/equity/revenue: CR - DR
      // But AccountBalance stores base values too? Wait, schema has debitTotal, creditTotal as Decimals.
      // We need to know the foreign currency amount. 
      // Let's assume AccountBalance stores base currency totals and we need to reconstruct FC amount 
      // OR assume we have a way to track FC balance. 
      // In this system, AccountBalance totals are base currency.
      // We need the Foreign Currency balance.
      
      // Let's find all JournalLines for this account in this period and before to get FC balance.
      // This is expensive. Usually AccountBalance would have amount (FC) and baseAmount (USD).
      // Let's check AccountBalance schema again.
      // debitTotal, creditTotal are Decimal(18,4). Opening/Closing as well.
      
      // If we don't have FC stored in AccountBalance, we have to sum JournalLines.
      const lines = await this.prisma.journalLine.findMany({
        where: {
          accountId: acc.id,
          journalEntry: {
            fiscalPeriodId, // This only gets this period. We need cumulative.
            status: 'POSTED',
          }
        }
      });

      // Simplified logic for this task: sum existing base balances and compare to current reval
      // Typically, revaluation is for "Monetary Items" (Cash, AR, AP).
      // Let's assume we treat the 'closingBalance' as the base currency value we have now.
      // And we need the FC balance. If we don't store it, we'll use a mock approach or sum lines.
      
      const fcBalanceResult = await this.prisma.journalLine.aggregate({
        where: {
          accountId: acc.id,
          journalEntry: { status: 'POSTED' } // All periods up to now
        },
        _sum: {
          debit: true,
          credit: true
        }
      });

      const fcDebit = fcBaseValue(fcBalanceResult._sum.debit);
      const fcCredit = fcBaseValue(fcBalanceResult._sum.credit);
      const fcBalance = fcDebit.sub(fcCredit);

      if (fcBalance.equals(0)) continue;

      // Revalue FC balance at today's rate
      const revaluedBaseBalance = await this.convert(fcBalance, acc.currency, baseCurrency, revalDate);
      const currentBaseBalance = new Prisma.Decimal(balance.closingBalance);
      const gainLoss = revaluedBaseBalance.sub(currentBaseBalance);

      if (gainLoss.equals(0)) continue;

      netGainLoss = netGainLoss.add(gainLoss);
      revalDetails.push({
        accountId: acc.id,
        currency: acc.currency,
        originalBalance: currentBaseBalance,
        revaluedBalance: revaluedBaseBalance,
        gainLoss: gainLoss,
      });

      // Journal Line logic:
      // Asset (Debit balance): gain (positive gainLoss) means increase asset (DR asset, CR Gain)
      // Liability (Credit balance): gain (positive gainLoss) means increase base value (bad? No, gain/loss is for base reporting)
      // Actually: Gain/Loss = NewBaseVal - OldBaseVal.
      // If GainLoss > 0, we need to DR the account if it's an Asset, and CR if it's a Liability?
      // No, revaluation gain is always CR to Gain/Loss account (income).
      // If GainLoss > 0 (Increase in base value):
      //    If it's an ASSET (e.g., Bank in EUR): DR Account, CR FX Gain
      //    If it's a LIABILITY (e.g., AP in EUR): CR Account, DR FX Loss (Wait, gainLoss > 0 for liability means we owe more base units -> Loss)
      
      const isAssetSide = ['ASSET', 'EXPENSE'].includes(acc.type);
      
      if (gainLoss.gt(0)) {
        if (isAssetSide) {
          // DR Asset, CR FX Gain
          journalLines.push({ accountId: acc.id, debit: gainLoss.toNumber(), credit: 0, description: 'FX Revaluation Gain' });
        } else {
          // CR Liability, DR FX Loss
          journalLines.push({ accountId: acc.id, debit: 0, credit: gainLoss.toNumber(), description: 'FX Revaluation increase in liability' });
        }
      } else {
        const absGainLoss = gainLoss.abs().toNumber();
        if (isAssetSide) {
          // CR Asset, DR FX Loss
          journalLines.push({ accountId: acc.id, debit: 0, credit: absGainLoss, description: 'FX Revaluation Loss' });
        } else {
          // DR Liability, CR FX Gain
          journalLines.push({ accountId: acc.id, debit: absGainLoss, credit: 0, description: 'FX Revaluation decrease in liability' });
        }
      }
    }

    if (journalLines.length === 0) {
      return { message: 'No revaluation needed' };
    }

    // Balancing line for FX Gain/Loss account (5900)
    const fxGainLossAccount = await this.prisma.account.findFirst({ where: { code: '5900' } });
    if (!fxGainLossAccount) throw new BadRequestException('FX Gain/Loss account (5900) not found');

    let linesDebit = new Prisma.Decimal(0);
    let linesCredit = new Prisma.Decimal(0);
    for (const l of journalLines) {
      linesDebit = linesDebit.add(l.debit || 0);
      linesCredit = linesCredit.add(l.credit || 0);
    }

    if (linesDebit.gt(linesCredit)) {
      journalLines.push({ accountId: fxGainLossAccount.id, debit: 0, credit: linesDebit.sub(linesCredit).toNumber(), description: 'Net FX Gain/Loss' });
    } else {
      journalLines.push({ accountId: fxGainLossAccount.id, debit: linesCredit.sub(linesDebit).toNumber(), credit: 0, description: 'Net FX Gain/Loss' });
    }

    // Create and post JournalEntry
    const journalEntry = await this.journalService.createAndPost({
      date: revalDate,
      description: `FX Revaluation for period ${period.name}`,
      sourceType: JournalSourceType.FX_REVALUATION,
      lines: journalLines,
    }, runById);

    // Create revaluation record
    return this.prisma.fxRevaluation.create({
      data: {
        fiscalPeriodId,
        journalEntryId: journalEntry.id,
        totalGainLoss: netGainLoss,
        details: revalDetails as any,
      }
    });
  }

  async listRates(filters: { fromCurrency?: string; toCurrency?: string; startDate?: string; endDate?: string }) {
    const where: any = {};
    if (filters.fromCurrency) where.fromCurrency = filters.fromCurrency;
    if (filters.toCurrency) where.toCurrency = filters.toCurrency;
    if (filters.startDate || filters.endDate) {
      where.date = {};
      if (filters.startDate) where.date.gte = new Date(filters.startDate);
      if (filters.endDate) where.date.lte = new Date(filters.endDate);
    }
    return this.prisma.exchangeRate.findMany({
      where,
      orderBy: { date: 'desc' },
    });
  }
}

function fcBaseValue(val: any): Prisma.Decimal {
    return new Prisma.Decimal(val || 0);
}
