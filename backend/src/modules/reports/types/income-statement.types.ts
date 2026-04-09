import { Prisma } from '@prisma/client';

export interface IncomeStatementLine {
  code: string;
  name: string;
  amount: number;
  priorAmount?: number;
  variance?: number;
  variancePct?: number;
}

export interface IncomeStatementSection {
  title: string;
  accounts: IncomeStatementLine[];
  subtotal: number;
}

export interface IncomeStatementReport {
  period: { startDate: Date; endDate: Date };
  sections: IncomeStatementSection[];
  totalRevenue: number;
  totalExpense: number;
  netIncome: number;
  priorNetIncome?: number;
  netIncomeVariance?: number;
  netIncomeVariancePct?: number;
}
