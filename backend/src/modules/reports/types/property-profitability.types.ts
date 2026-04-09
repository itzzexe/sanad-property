export interface PropertyProfitabilityItem {
  propertyId: string;
  propertyName: string;
  propertyCode: string;
  revenue: number;
  expenses: number;
  netProfit: number;
  netProfitMarginPct: number;
  occupancyRate: number;
  unitCount: number;
  occupiedUnits: number;
}

export type PropertyProfitabilityReport = PropertyProfitabilityItem[];
