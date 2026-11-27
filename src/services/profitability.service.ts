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
  return { from: start, to: end };
};

/**
 * Rentabilidad del período: margen bruto, margen por producto y utilidad neta.
 */
export const getProfitabilityReport = async (
  filters: ProfitabilityFilters,
): Promise<ProfitabilityResult> => {
  const { from, to } = resolveDateRange(filters.from, filters.to);
  const items = await profitabilityRepo.findCompletedSoldItemsInRange(from, to);

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

  return {
    period: { from, to },
    kpis: {
      totalSales: round(totalSales),
      totalCost: round(totalCost),
      grossProfit: round(grossProfit),
      grossMarginPercentage:
        totalSales > 0 ? round((grossProfit / totalSales) * 100) : 0,
      expenses,
      expensesLoaded: false,
      netProfit: round(totalSales - totalCost - expenses),
      productsWithoutCost: products.filter((p) => !p.hasCost).length,
    },
    products,
  };
};
