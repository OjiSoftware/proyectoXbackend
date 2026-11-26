export type KpiGroupBy = 'day' | 'week' | 'month';

export interface SalesKpiFilters {
  from?: Date;
  to?: Date;
  groupBy?: KpiGroupBy;
}

export interface TransactionPeriodPoint {
  period: string;
  count: number;
  totalSales: number;
}

export interface SalesKpisResult {
  period: {
    from: Date;
    to: Date;
    previousFrom: Date;
    previousTo: Date;
    groupBy: KpiGroupBy;
  };
  totalSales: number;
  transactionsCount: number;
  averageTicket: number;
  unitsSold: number;
  unitsPerTransaction: number;
  previousPeriodTotalSales: number;
  salesGrowthPercentage: number | null;
  transactionsByPeriod: TransactionPeriodPoint[];
}
