import * as reportRepo from '../repositories/report.repository';
import {
  SalesReportFilters,
  SalesReportItem,
  SalesReportKpis,
  SalesReportResult,
} from '../types/report.types';

const DEFAULT_PAYMENT_METHODS = ['Efectivo', 'Tarjeta', 'Mercado Pago'];

type ClientLike = { dni: string; name: string; surname: string } | null;

const isPosGenericClient = (client?: ClientLike) => {
  if (!client) return true;
  if (client.dni === '99999999') return true;
  const full = `${client.name || ''} ${client.surname || ''}`.trim().toLowerCase();
  return full === 'consumidor final';
};

/** Misma lógica que getSalePaymentLabel del frontend (helpers/saleExport.ts). */
const getPaymentLabel = (sale: {
  notes: string | null;
  client?: ClientLike;
  transaction: { paymentMethod: string | null } | null;
}): string => {
  if (sale.transaction?.paymentMethod) return sale.transaction.paymentMethod;
  const notes = (sale.notes || '').toLowerCase();
  if (notes.includes('pago con tarjeta') || notes.includes('recargo en pañales')) {
    return 'Tarjeta';
  }
  if (isPosGenericClient(sale.client)) return 'Efectivo';
  return 'Mercado Pago';
};

const round = (n: number) => Math.round(n * 100) / 100;

type ReportRow = Awaited<ReturnType<typeof reportRepo.findCompletedSaleItems>>[number];

const mapRowToReportItem = (row: ReportRow, paymentMethod: string): SalesReportItem => {
  const unitaryPrice = Number(row.unitaryPrice);
  const costPrice = Number(row.product.costPrice ?? 0);
  const subtotal = unitaryPrice * row.quantity;
  const margin = (unitaryPrice - costPrice) * row.quantity;
  // const generic = isPosGenericClient(row.sale.client);

  return {
    id: row.id,
    saleId: row.saleId,
    date: row.sale.createdAt,
    // clientName:
    //   generic || !row.sale.client
    //     ? 'Consumidor Final'
    //     : `${row.sale.client.surname}, ${row.sale.client.name}`,
    // clientDni: generic ? null : row.sale.client?.dni ?? null,
    productName: row.product.name,
    categoryName: row.product.category?.name ?? '-',
    providerName:
      row.product.provider?.name || row.product.provider?.businessName || '-',
    // brandName: row.product.brand?.name ?? '-',
    paymentMethod,
    quantity: row.quantity,
    unitaryPrice,
    costPrice,
    subtotal,
    margin,
  };
};

const calculateKpis = (items: SalesReportItem[]): SalesReportKpis => {
  const saleIds = new Set<number>();
  let totalSold = 0;
  let unitsSold = 0;
  let totalMargin = 0;

  for (const item of items) {
    saleIds.add(item.saleId);
    totalSold += item.subtotal;
    unitsSold += item.quantity;
    totalMargin += item.margin;
  }

  const salesCount = saleIds.size;

  return {
    totalSold: round(totalSold),
    salesCount,
    averageTicket: salesCount > 0 ? round(totalSold / salesCount) : 0,
    unitsSold,
    totalMargin: round(totalMargin),
  };
};

const paginateItems = <T>(items: T[], rawPage?: number, rawPageSize?: number) => {
  const totalItems = items.length;
  const page = rawPage && rawPage > 0 ? rawPage : 1;
  const pageSize = rawPageSize && rawPageSize > 0 ? rawPageSize : totalItems || 1;
  const paged = rawPageSize
    ? items.slice((page - 1) * pageSize, page * pageSize)
    : items;

  return { items: paged, totalItems, page, pageSize };
};

export const getSalesReport = async (
  filters: SalesReportFilters,
): Promise<SalesReportResult> => {
  const [rows, dbPaymentMethods] = await Promise.all([
    reportRepo.findCompletedSaleItems(filters),
    reportRepo.findDistinctPaymentMethods(),
  ]);

  const wantedPayment = filters.paymentMethod?.trim().toLowerCase();

  const items: SalesReportItem[] = [];
  for (const row of rows) {
    const payment = getPaymentLabel(row.sale);
    if (wantedPayment && payment.toLowerCase() !== wantedPayment) continue;
    items.push(mapRowToReportItem(row, payment));
  }

  const kpis = calculateKpis(items);
  const pagination = paginateItems(items, filters.page, filters.pageSize);

  return {
    kpis,
    ...pagination,
    paymentMethods: Array.from(new Set([...DEFAULT_PAYMENT_METHODS, ...dbPaymentMethods])),
  };
};
