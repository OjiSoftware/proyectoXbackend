import * as profitabilityRepo from '../repositories/profitability.repository';
import {
  ProductMarginItem,
  ProfitabilityFilters,
  ProfitabilityResult,
} from '../types/profitability.types';

const DEFAULT_RANGE_DAYS = 30;

const round = (n: number): number => Math.round(n * 100) / 100;

const resolveDateRange = (from?: Date, to?: Date) => {
  const end = to ?? new Date();
  const start =
    from ?? new Date(end.getTime() - DEFAULT_RANGE_DAYS * 24 * 60 * 60 * 1000);

  // Período anterior: misma duración, pegado justo antes (igual que en kpi.service)
  const durationMs = Math.max(end.getTime() - start.getTime(), 1);
  const previousTo = new Date(start.getTime() - 1);
  const previousFrom = new Date(previousTo.getTime() - durationMs);

  return { from: start, to: end, previousFrom, previousTo };
};

/** Suma de ventas y costos de un conjunto de ítems vendidos. */
const sumSalesAndCost = (items: profitabilityRepo.SoldItemForProfitability[]) => {
  let sales = 0;
  let cost = 0;
  for (const item of items) {
    sales += Number(item.unitaryPrice) * item.quantity;
    cost += Number(item.product.costPrice ?? 0) * item.quantity;
  }
  return { sales, cost };
};

/**
 * Rentabilidad del período: margen bruto, margen por producto y utilidad neta.
 */
export const getProfitabilityReport = async (
  filters: ProfitabilityFilters,
): Promise<ProfitabilityResult> => {
  const { from, to, previousFrom, previousTo } = resolveDateRange(
    filters.from,
    filters.to,
  );
  const [items, previousItems] = await Promise.all([
    profitabilityRepo.findCompletedSoldItemsInRange(from, to),
    profitabilityRepo.findCompletedSoldItemsInRange(previousFrom, previousTo),
  ]);

  const byProduct = new Map<number, ProductMarginItem>();
  let totalSales = 0;
  let totalCost = 0;

  for (const item of items) {
    const hasCost = item.product.costPrice != null;
    const unitaryPrice = Number(item.unitaryPrice);
    const costPrice = Number(item.product.costPrice ?? 0);
    const revenue = unitaryPrice * item.quantity;
    const cost = costPrice * item.quantity;

    totalSales += revenue;
    totalCost += cost;

    const existing = byProduct.get(item.productId);
    if (existing) {
      existing.unitsSold += item.quantity;
      existing.revenue += revenue;
      existing.cost += cost;
      existing.profit += revenue - cost;
    } else {
      byProduct.set(item.productId, {
        productId: item.productId,
        productName: item.product.name,
        categoryName: item.product.category.name,
        unitsSold: item.quantity,
        revenue,
        cost,
        profit: revenue - cost,
        marginPercentage: null,
        hasCost,
      });
    }
  }

  const products = Array.from(byProduct.values())
    .map((p) => ({
      ...p,
      revenue: round(p.revenue),
      cost: round(p.cost),
      profit: round(p.profit),
      marginPercentage: p.revenue > 0 ? round((p.profit / p.revenue) * 100) : null,
    }))
    .sort((a, b) => b.profit - a.profit);

  const grossProfit = totalSales - totalCost;
  // Los gastos todavía no existen en el sistema: se suman acá cuando se definan.
  const expenses = 0;

  const grossMarginPercentage =
    totalSales > 0 ? round((grossProfit / totalSales) * 100) : 0;

  const previous = sumSalesAndCost(previousItems);
  const previousGrossMarginPercentage =
    previous.sales > 0
      ? round(((previous.sales - previous.cost) / previous.sales) * 100)
      : null;
  // Diferencia en puntos porcentuales; sin comparación si algún período no tuvo ventas
  const grossMarginChange =
    previousGrossMarginPercentage !== null && totalSales > 0
      ? round(grossMarginPercentage - previousGrossMarginPercentage)
      : null;

  return {
    period: { from, to, previousFrom, previousTo },
    kpis: {
      totalSales: round(totalSales),
      totalCost: round(totalCost),
      grossProfit: round(grossProfit),
      grossMarginPercentage,
      previousPeriodGrossMarginPercentage: previousGrossMarginPercentage,
      grossMarginChange,
      expenses,
      expensesLoaded: false,
      netProfit: round(totalSales - totalCost - expenses),
      productsWithoutCost: products.filter((p) => !p.hasCost).length,
    },
    products,
  };
};
