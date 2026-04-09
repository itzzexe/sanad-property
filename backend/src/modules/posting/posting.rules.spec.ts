import { 
  buildPaymentEntry, 
  buildLeaseEntry, 
  buildInstallmentEntry, 
  buildLateFeeEntry, 
  buildDepositInEntry, 
  buildDepositOutEntry, 
  buildLeaseTerminationEntry 
} from './posting.rules';
import { JournalSourceType } from '@prisma/client';

describe('Posting Rules', () => {
  let accounts: Map<string, string>;

  beforeEach(() => {
    accounts = new Map<string, string>([
      ['1000', 'acc_1000'],
      ['1100', 'acc_1100'],
      ['2100', 'acc_2100'],
      ['2200', 'acc_2200'],
      ['4000', 'acc_4000'],
      ['4100', 'acc_4100'],
    ]);
  });

  const expectBalanced = (lines: any[]) => {
    const debits = lines.reduce((sum, line) => sum + (Number(line.debit) || 0), 0);
    const credits = lines.reduce((sum, line) => sum + (Number(line.credit) || 0), 0);
    expect(debits).toBeGreaterThan(0);
    expect(debits).toEqual(credits);
  };

  it('buildPaymentEntry creates balanced Cash DR / AR CR', () => {
    const entry = buildPaymentEntry(accounts, { paymentId: 'pay1', amount: 500, currency: 'USD' });
    expect(entry.sourceType).toBe(JournalSourceType.PAYMENT);
    expectBalanced(entry.lines);
    expect(entry.lines.find((l: any) => l.accountId === 'acc_1000')?.debit).toBe(500);
    expect(entry.lines.find((l: any) => l.accountId === 'acc_1100')?.credit).toBe(500);
  });

  it('buildLeaseEntry creates balanced AR DR / Deferred Revenue CR', () => {
    const entry = buildLeaseEntry(accounts, { leaseId: 'lse1', totalRentAmount: 12000, currency: 'USD' });
    expect(entry.sourceType).toBe(JournalSourceType.LEASE_START);
    expectBalanced(entry.lines);
    expect(entry.lines.find((l: any) => l.accountId === 'acc_1100')?.debit).toBe(12000);
    expect(entry.lines.find((l: any) => l.accountId === 'acc_2200')?.credit).toBe(12000);
  });

  it('buildInstallmentEntry creates balanced Deferred Revenue DR / Rental Revenue CR', () => {
    const entry = buildInstallmentEntry(accounts, { installmentId: 'inst1', amount: 1000, currency: 'USD' });
    expect(entry.sourceType).toBe(JournalSourceType.INSTALLMENT);
    expectBalanced(entry.lines);
    expect(entry.lines.find((l: any) => l.accountId === 'acc_2200')?.debit).toBe(1000);
    expect(entry.lines.find((l: any) => l.accountId === 'acc_4000')?.credit).toBe(1000);
  });

  it('buildLateFeeEntry creates balanced AR DR / Late Fee Revenue CR', () => {
    const entry = buildLateFeeEntry(accounts, { installmentId: 'inst1', lateFeeAmount: 50, currency: 'USD' });
    expect(entry.sourceType).toBe(JournalSourceType.LATE_FEE);
    expectBalanced(entry.lines);
    expect(entry.lines.find((l: any) => l.accountId === 'acc_1100')?.debit).toBe(50);
    expect(entry.lines.find((l: any) => l.accountId === 'acc_4100')?.credit).toBe(50);
  });

  it('buildDepositInEntry creates balanced Cash DR / Security Deposits Held CR', () => {
    const entry = buildDepositInEntry(accounts, { paymentId: 'dep1', amount: 2000, currency: 'USD' });
    expect(entry.sourceType).toBe(JournalSourceType.DEPOSIT_IN);
    expectBalanced(entry.lines);
    expect(entry.lines.find((l: any) => l.accountId === 'acc_1000')?.debit).toBe(2000);
    expect(entry.lines.find((l: any) => l.accountId === 'acc_2100')?.credit).toBe(2000);
  });

  it('buildDepositOutEntry creates balanced Security Deposits Held DR / Cash CR', () => {
    const entry = buildDepositOutEntry(accounts, { paymentId: 'depout1', amount: 2000, currency: 'USD' });
    expect(entry.sourceType).toBe(JournalSourceType.DEPOSIT_OUT);
    expectBalanced(entry.lines);
    expect(entry.lines.find((l: any) => l.accountId === 'acc_2100')?.debit).toBe(2000);
    expect(entry.lines.find((l: any) => l.accountId === 'acc_1000')?.credit).toBe(2000);
  });

  it('buildLeaseTerminationEntry creates balanced Deferred Revenue DR / Rental Revenue CR', () => {
    const entry = buildLeaseTerminationEntry(accounts, { leaseId: 'term1', remainingDeferredAmount: 3000, currency: 'USD' });
    expect(entry.sourceType).toBe(JournalSourceType.LEASE_END);
    expectBalanced(entry.lines);
    expect(entry.lines.find((l: any) => l.accountId === 'acc_2200')?.debit).toBe(3000);
    expect(entry.lines.find((l: any) => l.accountId === 'acc_4000')?.credit).toBe(3000);
  });
});
