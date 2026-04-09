import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Cron } from '@nestjs/schedule';
import { JournalService } from '../journal/journal.service';
import { AccountService } from '../account/account.service';
import { PrismaService } from '../../prisma/prisma.service';
import { FxService } from '../fx/fx.service';
import { JournalSourceType } from '@prisma/client';
import { 
  buildPaymentEntry, 
  buildLeaseEntry, 
  buildInstallmentEntry, 
  buildLateFeeEntry, 
  buildDepositInEntry, 
  buildDepositOutEntry, 
  buildLeaseTerminationEntry 
} from './posting.rules';

@Injectable()
export class PostingService {
  private readonly logger = new Logger(PostingService.name);
  private accountsCache: Map<string, string> | null = null;
  private cacheTimestamp: number = 0;

  constructor(
    private readonly journalService: JournalService,
    private readonly accountService: AccountService,
    private readonly prisma: PrismaService,
    private readonly fxService: FxService,
  ) {}

  private async resolveAccounts(): Promise<Map<string, string>> {
    const now = Date.now();
    // Cache for 5 minutes
    if (this.accountsCache && (now - this.cacheTimestamp < 5 * 60 * 1000)) {
      return this.accountsCache;
    }

    const accounts = await this.accountService.findAll({ isActive: true });
    const map = new Map<string, string>();
    for (const acc of accounts) {
      map.set(acc.code, acc.id);
    }
    
    this.accountsCache = map;
    this.cacheTimestamp = now;
    return map;
  }

  private async handlePosting(referenceParam: string, builderFn: Function, payload: any) {
    let reference = referenceParam;
    
    // Check idempotency
    const existing = await this.journalService.findByReference(reference);
    if (existing) {
      this.logger.warn(`Journal entry already exists for reference ${reference}. Skipping.`);
      return;
    }

    try {
      const accountsMap = await this.resolveAccounts();
      const dto = builderFn(accountsMap, payload);
      // fallback in case rules didn't add it
      if (!dto.reference) dto.reference = reference;

      // Ensure exchange rates are set for foreign currency
      if (payload.currency && payload.currency !== 'USD') {
        const entryDate = payload.paidDate || payload.startDate || payload.dueDate || new Date();
        const rate = await this.fxService.getRate(payload.currency, 'USD', new Date(entryDate));
        
        for (const line of dto.lines) {
          if (line.currencyCode !== 'USD') {
             line.exchangeRate = rate.toNumber();
          }
        }
      }

      await this.journalService.createAndPost(dto, 'system');
    } catch (error) {
      this.logger.error(`Error posting journal entry for ${reference}:`, error);
      throw error;
    }
  }

  @OnEvent('payment.created')
  async handlePaymentCreated(payload: { paymentId: string; amount: number; currency: string; exchangeRate: number; method: string }) {
    await this.handlePosting(payload.paymentId, buildPaymentEntry, payload);
  }

  @OnEvent('lease.created')
  async handleLeaseCreated(payload: { leaseId: string; totalRentAmount: number; currency: string }) {
    await this.handlePosting(payload.leaseId, buildLeaseEntry, payload);
  }

  @OnEvent('installment.paid')
  async handleInstallmentPaid(payload: { installmentId: string; amount: number; currency: string; dueDate: Date }) {
    await this.handlePosting(payload.installmentId, buildInstallmentEntry, payload);
  }

  @OnEvent('installment.late_fee_applied')
  async handleInstallmentLateFeeApplied(payload: { installmentId: string; lateFeeAmount: number; currency: string }) {
    await this.handlePosting(payload.installmentId + '_FEE', buildLateFeeEntry, payload);
  }

  @OnEvent('payment.security_deposit')
  async handlePaymentSecurityDeposit(payload: { paymentId: string; amount: number; currency: string; tenantId: string }) {
    await this.handlePosting(payload.paymentId + '_DEP_IN', buildDepositInEntry, payload);
  }

  @OnEvent('payment.security_deposit_returned')
  async handlePaymentSecurityDepositReturned(payload: { paymentId: string; amount: number; currency: string; tenantId: string }) {
    await this.handlePosting(payload.paymentId + '_DEP_OUT', buildDepositOutEntry, payload);
  }

  @OnEvent('lease.terminated')
  async handleLeaseTerminated(payload: { leaseId: string; remainingDeferredAmount: number; currency: string }) {
    await this.handlePosting(payload.leaseId + '_TERM', buildLeaseTerminationEntry, payload);
  }

  @Cron('0 2 * * *')
  async recognizeOverdueInstallments() {
    this.logger.log('Running daily task to recognize overdue installments...');
    
    // Installments to consider: dueDate <= yesterday, status = PAID. Let's say yesterday is end of day before today.
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const installments = await this.prisma.installment.findMany({
      where: {
        dueDate: { lt: today },
        status: 'PAID',
      },
    });

    let count = 0;
    for (const inst of installments) {
      const existingEntry = await this.prisma.journalEntry.findFirst({
        where: {
          reference: inst.id,
          sourceType: JournalSourceType.INSTALLMENT,
        },
      });

      if (!existingEntry) {
        // Emit event to trigger handler
        await this.handleInstallmentPaid({
          installmentId: inst.id,
          amount: inst.amount,
          currency: inst.currency,
          dueDate: inst.dueDate,
        });
        count++;
      }
    }

    this.logger.log(`Created ${count} automated entries for overdue installments.`);
  }
}
