import * as reportRepo from '../repositories/report.repository';
import {
  SalesReportFilters,
  SalesReportItem,
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
  client: ClientLike;
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

export const getSalesReport = async (
  filters: SalesReportFilters,
): Promise<SalesReportResult> => {
  const [rows, dbPaymentMethods] = await Promise.all([
    reportRepo.findCompletedSaleItems(filters),
    reportRepo.findDistinctPaymentMethods(),
  ]);

  const wantedPayment = filters.paymentMethod?.trim().toLowerCase();

  const items: SalesReportItem[] = [];
  const saleIds = new Set<number>();
  let totalSold = 0;
  let unitsSold = 0;
  let totalMargin = 0;

  for (const row of rows) {
    const payment = getPaymentLabel(row.sale);
    if (wantedPayment && payment.toLowerCase() !== wantedPayment) continue;

    const unitaryPrice = Number(row.unitaryPrice);
    const subtotal = unitaryPrice * row.quantity;
    const cost = Number(row.product.costPrice ?? 0);
    const margin = (unitaryPrice - cost) * row.quantity;
    const generic = isPosGenericClient(row.sale.client);

    saleIds.add(row.saleId);
    totalSold += subtotal;
    unitsSold += row.quantity;
    totalMargin += margin;

    items.push({
      id: row.id,
      saleId: row.saleId,
      date: row.sale.createdAt,
      clientName:
        generic || !row.sale.client
          ? 'Consumidor Final'
          : `${row.sale.client.surname}, ${row.sale.client.name}`,
      clientDni: generic ? null : row.sale.client?.dni ?? null,
      productName: row.product.name,
      categoryName: row.product.category?.name ?? '-',
      providerName:
        row.product.provider?.name || row.product.provider?.businessName || '-',
      brandName: row.product.brand?.name ?? '-',
      paymentMethod: payment,
      quantity: row.quantity,
      unitaryPrice,
      costPrice: cost,
      subtotal,
      margin,
    });
  }

  const salesCount = saleIds.size;
  const totalItems = items.length;
  const page = filters.page && filters.page > 0 ? filters.page : 1;
  const pageSize = filters.pageSize && filters.pageSize > 0 ? filters.pageSize : totalItems || 1;
  const paged = filters.pageSize
    ? items.slice((page - 1) * pageSize, page * pageSize)
    : items;

  return {
    kpis: {
      totalSold: round(totalSold),
      salesCount,
      averageTicket: salesCount > 0 ? round(totalSold / salesCount) : 0,
      unitsSold,
      totalMargin: round(totalMargin),
    },
    items: paged,
    totalItems,
    page,
    pageSize,
    paymentMethods: Array.from(new Set([...DEFAULT_PAYMENT_METHODS, ...dbPaymentMethods])),
  };
};
