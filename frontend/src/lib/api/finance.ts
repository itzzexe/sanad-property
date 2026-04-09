import { api } from '../api';

// ── Types ──────────────────────────────────────────────

export interface ReportParams {
  startDate?: string;
  endDate?: string;
  fiscalPeriodId?: string;
  fiscalYearId?: string;
  propertyId?: string;
  compareWithPriorPeriod?: boolean;
}

export interface FinanceDashboardStats {
  asOf: string;
  currentPeriod: { name: string; startDate: string; endDate: string };
  revenue: { mtd: number; priorMonthMtd: number; ytd: number; mtdGrowthPct: number };
  expenses: { mtd: number; ytd: number };
  netIncome: { mtd: number; ytd: number };
  cashPosition: number;
  ar: { totalOutstanding: number; current: number; overdue30: number; overdue60: number; overdue90plus: number };
  ap: { totalOutstanding: number };
  budget: { currentPeriodBudgetedRevenue: number; currentPeriodActualRevenue: number; utilizationPct: number; isOverBudget: boolean } | null;
  revenueTrend: { periodName: string; revenue: number; expense: number; netIncome: number }[];
  topProperties: { propertyId: string; propertyName: string; revenue: number; netProfit: number; occupancyRate: number }[];
  unrealizedFxExposure: number | null;
}

export interface Account {
  id: string; code: string; name: string; type: string; subtype: string;
  parentId: string | null; currencyCode: string; isActive: boolean;
  description?: string; children?: Account[];
}

export interface JournalEntry {
  id: string; entryNumber: string; date: string; description: string;
  sourceType: string; status: string; reference?: string;
  lines: JournalLine[]; createdAt: string;
}

export interface JournalLine {
  id?: string; accountId: string; debit: number; credit: number;
  description?: string; account?: Account;
}

export interface FiscalPeriod {
  id: string; name: string; startDate: string; endDate: string;
  status: string; fiscalYearId: string;
}

export interface Budget {
  id: string; name: string; fiscalYearId: string; status: string;
  approvedAt?: string; approvedById?: string; lines?: BudgetLine[];
}

export interface BudgetLine {
  id: string; accountId: string; fiscalPeriodId: string; amount: number;
  account?: Account; fiscalPeriod?: FiscalPeriod;
}

export interface Vendor {
  id: string; name: string; contactEmail?: string; phone?: string;
  address?: string; taxId?: string; isActive: boolean;
}

export interface Bill {
  id: string; vendorId: string; billNumber: string; date: string;
  dueDate: string; subtotal: number; taxAmount: number; totalAmount: number;
  status: string; vendor?: Vendor;
}

// ── Finance Dashboard ──────────────────────────────────

export const financeApi = {
  // Dashboard
  getFinanceStats: (): Promise<FinanceDashboardStats> => api.get('/dashboard/finance-stats'),
  invalidateFinanceCache: () => api.post('/dashboard/finance-stats/invalidate'),

  // Accounts
  getAccounts: (): Promise<Account[]> => api.get('/accounts'),
  getAccount: (id: string): Promise<Account> => api.get(`/accounts/${id}`),
  createAccount: (data: Partial<Account>) => api.post('/accounts', data),
  updateAccount: (id: string, data: Partial<Account>) => api.put(`/accounts/${id}`, data),
  deactivateAccount: (id: string) => api.patch(`/accounts/${id}/deactivate`),

  // Journal Entries
  getJournalEntries: (params?: { page?: number; status?: string; sourceType?: string; startDate?: string; endDate?: string }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.status) q.set('status', params.status);
    if (params?.sourceType) q.set('sourceType', params.sourceType);
    if (params?.startDate) q.set('startDate', params.startDate);
    if (params?.endDate) q.set('endDate', params.endDate);
    return api.get(`/journal-entries?${q.toString()}`);
  },
  getJournalEntry: (id: string): Promise<JournalEntry> => api.get(`/journal-entries/${id}`),
  createJournalEntry: (data: any) => api.post('/journal-entries', data),
  postJournalEntry: (id: string) => api.post(`/journal-entries/${id}/post`),

  // Trial Balance
  getTrialBalance: (params?: ReportParams) => {
    const q = new URLSearchParams();
    if (params?.endDate) q.set('endDate', params.endDate);
    if (params?.fiscalPeriodId) q.set('fiscalPeriodId', params.fiscalPeriodId);
    return api.get(`/reports/trial-balance?${q.toString()}`);
  },

  // Reports
  getIncomeStatement: (params?: ReportParams) => {
    const q = new URLSearchParams();
    if (params?.startDate) q.set('startDate', params.startDate);
    if (params?.endDate) q.set('endDate', params.endDate);
    if (params?.fiscalPeriodId) q.set('fiscalPeriodId', params.fiscalPeriodId);
    if (params?.compareWithPriorPeriod) q.set('compareWithPriorPeriod', 'true');
    return api.get(`/reports/income-statement?${q.toString()}`);
  },
  getBalanceSheet: (params?: ReportParams) => {
    const q = new URLSearchParams();
    if (params?.endDate) q.set('endDate', params.endDate);
    return api.get(`/reports/balance-sheet?${q.toString()}`);
  },
  getCashFlow: (params?: ReportParams) => {
    const q = new URLSearchParams();
    if (params?.startDate) q.set('startDate', params.startDate);
    if (params?.endDate) q.set('endDate', params.endDate);
    return api.get(`/reports/cash-flow?${q.toString()}`);
  },
  getArAging: () => api.get('/reports/ar-aging'),
  getPropertyProfitability: (params?: ReportParams) => {
    const q = new URLSearchParams();
    if (params?.startDate) q.set('startDate', params.startDate);
    if (params?.endDate) q.set('endDate', params.endDate);
    return api.get(`/reports/property-profitability?${q.toString()}`);
  },

  // Budget
  getBudgets: (): Promise<Budget[]> => api.get('/budgets'),
  getBudget: (id: string): Promise<Budget> => api.get(`/budgets/${id}`),
  createBudget: (data: any) => api.post('/budgets', data),
  approveBudget: (id: string) => api.post(`/budgets/${id}/approve`),
  getBudgetVariance: (id: string) => api.get(`/budgets/${id}/variance`),

  // AR
  getTenantBalance: (tenantId: string) => api.get(`/ar/tenant/${tenantId}/balance`),
  getTenantStatement: (tenantId: string, params?: { startDate?: string; endDate?: string }) => {
    const q = new URLSearchParams();
    if (params?.startDate) q.set('startDate', params.startDate);
    if (params?.endDate) q.set('endDate', params.endDate);
    return api.get(`/ar/tenant/${tenantId}/statement?${q.toString()}`);
  },
  writeOff: (data: { tenantId: string; amount: number; reason: string }) => api.post('/ar/write-off', data),

  // AP
  getVendors: (): Promise<Vendor[]> => api.get('/ap/vendors'),
  getVendor: (id: string): Promise<Vendor> => api.get(`/ap/vendors/${id}`),
  createVendor: (data: Partial<Vendor>) => api.post('/ap/vendors', data),
  getBills: (params?: { status?: string }) => {
    const q = new URLSearchParams();
    if (params?.status) q.set('status', params.status);
    return api.get(`/ap/bills?${q.toString()}`);
  },
  getBill: (id: string): Promise<Bill> => api.get(`/ap/bills/${id}`),
  createBill: (data: any) => api.post('/ap/bills', data),
  payBill: (id: string, data: any) => api.post(`/ap/bills/${id}/pay`, data),

  // Reconciliation
  getBankAccounts: () => api.get('/reconciliation/bank-accounts'),
  getBankStatements: (bankAccountId: string) => api.get(`/reconciliation/bank-accounts/${bankAccountId}/statements`),
  getReconciliation: (statementId: string) => api.get(`/reconciliation/statements/${statementId}`),
  autoMatch: (statementId: string) => api.post(`/reconciliation/statements/${statementId}/auto-match`),
  manualMatch: (bankTransactionId: string, journalLineId: string) =>
    api.post('/reconciliation/match', { bankTransactionId, journalLineId }),

  // Tax
  getTaxRates: () => api.get('/tax/rates'),

  // Fiscal Periods
  getFiscalPeriods: (): Promise<FiscalPeriod[]> => api.get('/fiscal-periods'),
  closeFiscalPeriod: (id: string) => api.post(`/fiscal-periods/${id}/close`),

  // Export
  exportReport: (reportType: string, format: 'pdf' | 'excel', params?: ReportParams) =>
    api.post(`/reports/${reportType}/export`, { format, ...params }),
};
