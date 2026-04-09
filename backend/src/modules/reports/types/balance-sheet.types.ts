export interface BalanceSheetLine {
  code: string;
  name: string;
  balance: number;
}

export interface BalanceSheetSection {
  currentAssets: number;
  fixedAssets: number;
  totalAssets: number;
  currentLiabilities: number;
  longTermLiabilities: number;
  totalLiabilities: number;
  equityItems: BalanceSheetLine[];
  totalEquity: number;
}

export interface BalanceSheetReport {
  asOfDate: Date;
  isBalanced: boolean;
  variance?: number;
  assets: {
    currentAssets: BalanceSheetLine[];
    fixedAssets: BalanceSheetLine[];
    totalAssets: number;
  };
  liabilities: {
    currentLiabilities: BalanceSheetLine[];
    longTermLiabilities: BalanceSheetLine[];
    totalLiabilities: number;
  };
  equity: {
    lines: BalanceSheetLine[];
    totalEquity: number;
  };
  totalLiabilitiesAndEquity: number;
}
