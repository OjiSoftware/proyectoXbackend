import * as kpiRepo from '../repositories/kpi.repository';
import { CompletedSaleForKpi } from '../repositories/kpi.repository';
import {
  KpiGroupBy,
  SalesKpiFilters,
  SalesKpisResult,
  TransactionPeriodPoint,
} from '../types/kpi.types';

const DEFAULT_RANGE_DAYS = 30;

const round = (n: number): number => Math.round(n * 100) / 100;

/**
 * Variación porcentual contra el período anterior.
 * null si el período anterior fue 0 (no se puede dividir).
 */
const growthPercentage = (current: number, previous: number): number | null =>
  previous > 0 ? round(((current - previous) / previous) * 100) : null;

const resolveDateRange = (from?: Date, to?: Date) => {
  const end = to ?? new Date();
  const start =
    from ??
    new Date(
      end.getTime() - DEFAULT_RANGE_DAYS * 24 * 60 * 60 * 1000,
    );

  const durationMs = Math.max(end.getTime() - start.getTime(), 1);
  const previousTo = new Date(start.getTime() - 1);
  const previousFrom = new Date(previousTo.getTime() - durationMs);

  return { from: start, to: end, previousFrom, previousTo };
};

const ARG_OFFSET_MS = -3 * 60 * 60 * 1000;

const formatPeriodKey = (date: Date, groupBy: KpiGroupBy): string => {
  // Desplazamos a UTC-3 (Argentina) y leemos en UTC para no depender de la TZ del servidor
  const local = new Date(date.getTime() + ARG_OFFSET_MS);
  const year = local.getUTCFullYear();
  const month = String(local.getUTCMonth() + 1).padStart(2, '0');
  const day = String(local.getUTCDate()).padStart(2, '0');

  if (groupBy === 'month') {
    return `${year}-${month}`;
  }

  if (groupBy === 'week') {
    // Inicio de semana (lunes) en formato YYYY-MM-DD
    const dayOfWeek = local.getUTCDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    local.setUTCDate(local.getUTCDate() + diffToMonday);
    const wYear = local.getUTCFullYear();
    const wMonth = String(local.getUTCMonth() + 1).padStart(2, '0');
    const wDay = String(local.getUTCDate()).padStart(2, '0');
    return `${wYear}-${wMonth}-${wDay}`;
  }

  return `${year}-${month}-${day}`;
};

const summarizeSales = (sales: CompletedSaleForKpi[]) => {
  let totalSales = 0;
  let unitsSold = 0;

  for (const sale of sales) {
    for (const detail of sale.details) {
      totalSales += Number(detail.unitaryPrice) * detail.quantity;
      unitsSold += detail.quantity;
    }
  }

  return {
    totalSales,
    unitsSold,
    transactionsCount: sales.length,
  };
};

const groupTransactionsByPeriod = (
  sales: CompletedSaleForKpi[],
  groupBy: KpiGroupBy,
): TransactionPeriodPoint[] => {
  const buckets = new Map<string, { count: number; totalSales: number }>();

  for (const sale of sales) {
    const key = formatPeriodKey(sale.createdAt, groupBy);
    const current = buckets.get(key) ?? { count: 0, totalSales: 0 };

    let saleTotal = 0;
    for (const detail of sale.details) {
      saleTotal += Number(detail.unitaryPrice) * detail.quantity;
    }

    current.count += 1;
    current.totalSales += saleTotal;
    buckets.set(key, current);
  }

  return Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([period, data]) => ({
      period,
      count: data.count,
      totalSales: round(data.totalSales),
    }));
};

export const getSalesKpis = async (
  filters: SalesKpiFilters,
): Promise<SalesKpisResult> => {
  const groupBy: KpiGroupBy = filters.groupBy ?? 'day';
  const { from, to, previousFrom, previousTo } = resolveDateRange(
    filters.from,
    filters.to,
  );

  const [currentSales, previousSales] = await Promise.all([
    kpiRepo.findCompletedSalesInRange(from, to),
    kpiRepo.findCompletedSalesInRange(previousFrom, previousTo),
  ]);

  const current = summarizeSales(currentSales);
  const previous = summarizeSales(previousSales);

  const averageTicket =
    current.transactionsCount > 0
      ? round(current.totalSales / current.transactionsCount)
      : 0;

  const unitsPerTransaction =
    current.transactionsCount > 0
      ? round(current.unitsSold / current.transactionsCount)
      : 0;

  const previousAverageTicket =
    previous.transactionsCount > 0
      ? round(previous.totalSales / previous.transactionsCount)
      : 0;

  const previousUnitsPerTransaction =
    previous.transactionsCount > 0
      ? round(previous.unitsSold / previous.transactionsCount)
      : 0;

  const salesGrowthPercentage = growthPercentage(
    current.totalSales,
    previous.totalSales,
  );
  const ticketGrowthPercentage = growthPercentage(
    averageTicket,
    previousAverageTicket,
  );
  const transactionsGrowthPercentage = growthPercentage(
    current.transactionsCount,
    previous.transactionsCount,
  );
  const unitsPerTransactionGrowthPercentage = growthPercentage(
    unitsPerTransaction,
    previousUnitsPerTransaction,
  );

  return {
    period: {
      from,
      to,
      previousFrom,
      previousTo,
      groupBy,
    },
    totalSales: round(current.totalSales),
    transactionsCount: current.transactionsCount,
    averageTicket,
    unitsSold: current.unitsSold,
    unitsPerTransaction,
    previousPeriodTotalSales: round(previous.totalSales),
    salesGrowthPercentage,
    previousPeriodAverageTicket: previousAverageTicket,
    ticketGrowthPercentage,
    previousPeriodTransactionsCount: previous.transactionsCount,
    transactionsGrowthPercentage,
    previousPeriodUnitsPerTransaction: previousUnitsPerTransaction,
    unitsPerTransactionGrowthPercentage,
    transactionsByPeriod: groupTransactionsByPeriod(currentSales, groupBy),
  };
};
