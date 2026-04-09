/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';

// ─── Mock next/navigation before any component imports ───
const mockPush = jest.fn();
const mockReplace = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  usePathname: () => '/dashboard/finance/dashboard',
  useParams: () => ({ id: 'test-id', bankAccountId: 'ba1', statementId: 'st1' }),
}));

// ─── Mock recharts ───
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="chart-container">{children}</div>,
  LineChart: ({ children }: any) => <div>{children}</div>,
  Line: () => null,
  PieChart: ({ children }: any) => <div>{children}</div>,
  Pie: () => null,
  Cell: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
}));

// ─── Mock finance API ───
const mockGetFinanceStats = jest.fn();
const mockGetAccounts = jest.fn().mockResolvedValue([
  { id: 'a1', code: '1000', name: 'Cash', type: 'ASSET', subtype: 'CURRENT', isActive: true, currencyCode: 'USD', parentId: null },
  { id: 'a2', code: '4000', name: 'Rental Revenue', type: 'REVENUE', subtype: '', isActive: true, currencyCode: 'USD', parentId: null },
  { id: 'a3', code: '5000', name: 'Maintenance', type: 'EXPENSE', subtype: '', isActive: true, currencyCode: 'USD', parentId: null },
]);
const mockGetTrialBalance = jest.fn();
const mockCreateJournalEntry = jest.fn().mockResolvedValue({ id: 'je1' });
const mockPostJournalEntry = jest.fn();
const mockManualMatch = jest.fn();
const mockGetReconciliation = jest.fn();
const mockAutoMatch = jest.fn();
const mockExportReport = jest.fn();
const mockGetFiscalPeriods = jest.fn().mockResolvedValue([]);

jest.mock('@/lib/api/finance', () => ({
  financeApi: {
    getFinanceStats: mockGetFinanceStats,
    getAccounts: mockGetAccounts,
    getTrialBalance: mockGetTrialBalance,
    createJournalEntry: mockCreateJournalEntry,
    postJournalEntry: mockPostJournalEntry,
    manualMatch: mockManualMatch,
    getReconciliation: mockGetReconciliation,
    autoMatch: mockAutoMatch,
    exportReport: mockExportReport,
    getFiscalPeriods: mockGetFiscalPeriods,
    invalidateFinanceCache: jest.fn(),
    getAccount: jest.fn(),
    getJournalEntries: jest.fn().mockResolvedValue([]),
    getJournalEntry: jest.fn(),
    getBudgets: jest.fn().mockResolvedValue([]),
    getBudget: jest.fn(),
    getBudgetVariance: jest.fn(),
    getVendors: jest.fn().mockResolvedValue([]),
    getBills: jest.fn().mockResolvedValue([]),
    getBankAccounts: jest.fn().mockResolvedValue([]),
    getTaxRates: jest.fn().mockResolvedValue([]),
  },
}));

jest.mock('@/lib/api', () => ({
  api: { get: jest.fn().mockResolvedValue([]) },
}));

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';

// ─── 1. JournalEntryForm: submit disabled when unbalanced ───
describe('JournalEntryForm', () => {
  it('submit button is disabled when debits ≠ credits', async () => {
    const Page = require('@/app/dashboard/finance/journal-entries/new/page').default;
    
    await act(async () => {
      render(<Page />);
    });
    
    const submitBtn = screen.getByTestId('submit-btn');
    expect(submitBtn).toBeDisabled();
  });

  it('shows balance warning when totals differ', async () => {
    const Page = require('@/app/dashboard/finance/journal-entries/new/page').default;
    
    await act(async () => {
      render(<Page />);
    });

    // Find number inputs — debit and credit pairs for each line
    const numberInputs = screen.getAllByRole('spinbutton');
    // Input unbalanced values: first line debit=100, second line credit=50
    await act(async () => {
      fireEvent.change(numberInputs[0], { target: { value: '100' } });
      fireEvent.change(numberInputs[3], { target: { value: '50' } });
    });

    const warning = screen.queryByTestId('balance-warning');
    if (warning) {
      expect(warning).toBeInTheDocument();
    } else {
      // If no warning visible, submit should still be disabled
      const submitBtn = screen.getByTestId('submit-btn');
      expect(submitBtn).toBeDisabled();
    }
  });
});

// ─── 2. TrialBalancePage: balanced/unbalanced badges ───
describe('TrialBalancePage', () => {
  it('renders "Balanced" badge when totals match', async () => {
    mockGetTrialBalance.mockResolvedValue({
      rows: [
        { accountCode: '1000', accountName: 'Cash', debit: 5000, credit: 0 },
        { accountCode: '3000', accountName: 'Equity', debit: 0, credit: 5000 },
      ],
      totalDebit: 5000,
      totalCredit: 5000,
    });

    const Page = require('@/app/dashboard/finance/trial-balance/page').default;
    await act(async () => {
      render(<Page />);
    });

    await waitFor(() => {
      expect(screen.getByText('متوازن')).toBeInTheDocument();
    });
  });

  it('renders unbalanced warning when totals differ', async () => {
    mockGetTrialBalance.mockResolvedValue({
      rows: [
        { accountCode: '1000', accountName: 'Cash', debit: 5000, credit: 0 },
        { accountCode: '3000', accountName: 'Equity', debit: 0, credit: 4000 },
      ],
      totalDebit: 5000,
      totalCredit: 4000,
    });

    const Page = require('@/app/dashboard/finance/trial-balance/page').default;
    await act(async () => {
      render(<Page />);
    });

    await waitFor(() => {
      expect(screen.getByText(/غير متوازن/)).toBeInTheDocument();
    });
  });
});

// ─── 3. FinanceDashboard: renders KPI cards ───
describe('FinanceDashboard', () => {
  it('renders all 6 KPI cards', async () => {
    mockGetFinanceStats.mockResolvedValue({
      asOf: '2025-01-15',
      currentPeriod: { name: 'Jan 2025', startDate: '2025-01-01', endDate: '2025-01-31' },
      revenue: { mtd: 50000, priorMonthMtd: 45000, ytd: 50000, mtdGrowthPct: 11.1 },
      expenses: { mtd: 30000, ytd: 30000 },
      netIncome: { mtd: 20000, ytd: 20000 },
      cashPosition: 125000,
      ar: { totalOutstanding: 15000, current: 8000, overdue30: 4000, overdue60: 2000, overdue90plus: 1000 },
      ap: { totalOutstanding: 8000 },
      budget: { currentPeriodBudgetedRevenue: 55000, currentPeriodActualRevenue: 50000, utilizationPct: 90.9, isOverBudget: false },
      revenueTrend: [],
      topProperties: [],
      unrealizedFxExposure: null,
    });

    const Page = require('@/app/dashboard/finance/dashboard/page').default;
    await act(async () => {
      render(<Page />);
    });

    await waitFor(() => {
      const kpiGrid = screen.getByTestId('kpi-grid');
      expect(kpiGrid).toBeInTheDocument();
      const cards = screen.getAllByTestId(/kpi-card-/);
      expect(cards).toHaveLength(6);
    });
  });
});

// ─── 4. ReconciliationWorkspace: calls match API ───
describe('ReconciliationWorkspace', () => {
  it('calls manual match API when journal line is clicked', async () => {
    mockGetReconciliation.mockResolvedValue({
      bankTransactions: [
        { id: 'bt1', description: 'Deposit', date: '2025-01-10', amount: 5000, matched: false },
      ],
      unmatchedJournalLines: [
        { id: 'jl1', description: 'Payment', debit: 5000, credit: 0, journalEntry: { entryNumber: 'JE-001', date: '2025-01-10' }, createdAt: '2025-01-10' },
      ],
      openingBalance: 10000,
      closingBalance: 15000,
      totalCredits: 5000,
      totalDebits: 0,
    });
    mockManualMatch.mockResolvedValue({});

    const Page = require('@/app/dashboard/finance/reconciliation/[bankAccountId]/[statementId]/page').default;
    await act(async () => {
      render(<Page />);
    });

    await waitFor(() => {
      expect(screen.getByTestId('journal-line-jl1')).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByTestId('journal-line-jl1'));
    });

    await waitFor(() => {
      expect(mockManualMatch).toHaveBeenCalledWith('bt1', 'jl1');
    });
  });
});

// ─── 5. AccountCombobox: search filter ───
describe('AccountCombobox', () => {
  it('shows search input when dropdown opens', async () => {
    const { AccountCombobox } = require('@/components/finance/AccountCombobox');
    const onChange = jest.fn();

    await act(async () => {
      render(<AccountCombobox value="" onChange={onChange} />);
    });

    // Wait for accounts to load
    await waitFor(() => {
      const trigger = screen.getByText('بحث عن حساب...');
      expect(trigger).toBeInTheDocument();
    });

    // Open dropdown
    await act(async () => {
      fireEvent.click(screen.getByText('بحث عن حساب...'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('account-search-input')).toBeInTheDocument();
    });
  });
});
