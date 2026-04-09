export interface CashFlowItem {
  name: string;
  amount: number;
}

export interface CashFlowSection {
  items: CashFlowItem[];
  total: number;
}

export interface CashFlowReport {
  period: { startDate: Date; endDate: Date };
  netIncome: number;
  operatingActivities: CashFlowSection;
  investingActivities: CashFlowSection;
  financingActivities: CashFlowSection;
  netCashChange: number;
  openingCash: number;
  closingCash: number;
}
