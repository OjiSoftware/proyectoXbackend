export interface ProfitabilityFilters {
  from?: Date;
  to?: Date;
}

export interface ProductMarginItem {
  productId: number;
  productName: string;
  categoryName: string;
  unitsSold: number;
  revenue: number;
  cost: number;
  profit: number;
  /** (ganancia ÷ ventas) × 100. null si el producto no tuvo ventas. */
  marginPercentage: number | null;
  /** false si el producto no tiene costPrice cargado (el margen queda inflado). */
  hasCost: boolean;
}

export interface ProfitabilityKpis {
  totalSales: number;
  totalCost: number;
  grossProfit: number;
  /** (ventas − costo) ÷ ventas × 100 */
  grossMarginPercentage: number;
  /** Gastos del período. Todavía no existen en el sistema: siempre 0. */
  expenses: number;
  expensesLoaded: boolean;
  /** ventas − costos − gastos */
  netProfit: number;
  productsWithoutCost: number;
}

export interface ProfitabilityResult {
  period: {
    from: Date;
    to: Date;
  };
  kpis: ProfitabilityKpis;
  products: ProductMarginItem[];
}
