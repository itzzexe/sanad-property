import { CreateJournalEntryDto } from '../journal/dto/create-journal-entry.dto';
// @ts-ignore
import { JournalSourceType } from '@prisma/client';

export function buildPaymentEntry(accounts: Map<string, string>, payload: any): CreateJournalEntryDto {
  return {
    date: new Date(),
    description: `Payment received #${payload.paymentId}`,
    sourceType: JournalSourceType.PAYMENT,
    reference: payload.paymentId,
    lines: [
      { accountId: accounts.get('1000')!, debit: payload.amount, credit: 0, currencyCode: payload.currency },
      { accountId: accounts.get('1100')!, debit: 0, credit: payload.amount, currencyCode: payload.currency },
    ],
  } as any;
}

export function buildLeaseEntry(accounts: Map<string, string>, payload: any): CreateJournalEntryDto {
  return {
    date: new Date(),
    description: `Lease created #${payload.leaseId}`,
    sourceType: JournalSourceType.LEASE_START,
    reference: payload.leaseId,
    lines: [
      { accountId: accounts.get('1100')!, debit: payload.totalRentAmount, credit: 0, currencyCode: payload.currency },
      { accountId: accounts.get('2200')!, debit: 0, credit: payload.totalRentAmount, currencyCode: payload.currency },
    ],
  } as any;
}

export function buildInstallmentEntry(accounts: Map<string, string>, payload: any): CreateJournalEntryDto {
  return {
    date: new Date(),
    description: `Revenue recognized for installment #${payload.installmentId}`,
    sourceType: JournalSourceType.INSTALLMENT,
    reference: payload.installmentId,
    lines: [
      { accountId: accounts.get('2200')!, debit: payload.amount, credit: 0, currencyCode: payload.currency },
      { accountId: accounts.get('4000')!, debit: 0, credit: payload.amount, currencyCode: payload.currency },
    ],
  } as any;
}

export function buildLateFeeEntry(accounts: Map<string, string>, payload: any): CreateJournalEntryDto {
  return {
    date: new Date(),
    description: `Late fee applied to installment #${payload.installmentId}`,
    sourceType: JournalSourceType.LATE_FEE,
    reference: payload.installmentId + '_FEE',
    lines: [
      { accountId: accounts.get('1100')!, debit: payload.lateFeeAmount, credit: 0, currencyCode: payload.currency },
      { accountId: accounts.get('4100')!, debit: 0, credit: payload.lateFeeAmount, currencyCode: payload.currency },
    ],
  } as any;
}

export function buildDepositInEntry(accounts: Map<string, string>, payload: any): CreateJournalEntryDto {
  return {
    date: new Date(),
    description: `Security deposit received #${payload.paymentId}`,
    sourceType: JournalSourceType.DEPOSIT_IN,
    reference: payload.paymentId + '_DEP_IN',
    lines: [
      { accountId: accounts.get('1000')!, debit: payload.amount, credit: 0, currencyCode: payload.currency },
      { accountId: accounts.get('2100')!, debit: 0, credit: payload.amount, currencyCode: payload.currency },
    ],
  } as any;
}

export function buildDepositOutEntry(accounts: Map<string, string>, payload: any): CreateJournalEntryDto {
  return {
    date: new Date(),
    description: `Security deposit returned #${payload.paymentId}`,
    sourceType: JournalSourceType.DEPOSIT_OUT,
    reference: payload.paymentId + '_DEP_OUT',
    lines: [
      { accountId: accounts.get('2100')!, debit: payload.amount, credit: 0, currencyCode: payload.currency },
      { accountId: accounts.get('1000')!, debit: 0, credit: payload.amount, currencyCode: payload.currency },
    ],
  } as any;
}

export function buildLeaseTerminationEntry(accounts: Map<string, string>, payload: any): CreateJournalEntryDto {
  return {
    date: new Date(),
    description: `Revenue recognized on lease termination #${payload.leaseId}`,
    sourceType: JournalSourceType.LEASE_END,
    reference: payload.leaseId + '_TERM',
    lines: [
      { accountId: accounts.get('2200')!, debit: payload.remainingDeferredAmount, credit: 0, currencyCode: payload.currency },
      { accountId: accounts.get('4000')!, debit: 0, credit: payload.remainingDeferredAmount, currencyCode: payload.currency },
    ],
  } as any;
}
