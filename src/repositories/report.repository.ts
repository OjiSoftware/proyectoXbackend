// src/repositories/report.repository.ts
import { prisma } from '../prisma';
import { SalesReportFilters } from '../types/report.types';

/**
 * Obtiene los ítems vendidos (SaleDetails) de ventas COMPLETED aplicando
 * los filtros que se pueden resolver directamente en la base de datos.
 * El filtro por método de pago se aplica en el service porque la etiqueta
 * se infiere (efectivo / tarjeta / mercado pago) cuando no hay transacción.
 */
export const findCompletedSaleItems = async (filters: SalesReportFilters) => {
  try {
    const search = filters.search?.trim();

    const saleCreatedAt: { gte?: Date; lte?: Date } = {};
    if (filters.from) saleCreatedAt.gte = filters.from;
    if (filters.to) saleCreatedAt.lte = filters.to;

    return await prisma.saleDetails.findMany({
      where: {
        sale: {
          status: 'COMPLETED',
          ...(filters.from || filters.to ? { createdAt: saleCreatedAt } : {}),
        },
        product: {
          ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
          ...(filters.providerId ? { providerId: filters.providerId } : {}),
          // ...(filters.brandId ? { brandId: filters.brandId } : {}),
        },
        ...(search
          ? {
              OR: [
                { product: { name: { contains: search, mode: 'insensitive' } } },
                { product: { barcode: { contains: search, mode: 'insensitive' } } },
                // { sale: { client: { name: { contains: search, mode: 'insensitive' } } } },
                // { sale: { client: { surname: { contains: search, mode: 'insensitive' } } } },
                // { sale: { client: { dni: { contains: search } } } },
              ],
            }
          : {}),
      },
      include: {
        sale: { include: { /* client: true, */ transaction: true } },
        product: { include: { category: true, provider: true /* , brand: true */ } },
      },
      orderBy: [{ sale: { createdAt: 'desc' } }, { id: 'desc' }],
    });
  } catch (error) {
    console.error('Error al obtener ítems para el reporte de ventas:', error);
    throw new Error('No se pudo generar el reporte de ventas');
  }
};

/**
 * Métodos de pago registrados en transacciones (distintos).
 */
export const findDistinctPaymentMethods = async (): Promise<string[]> => {
  try {
    const rows = await prisma.transaction.findMany({
      where: { paymentMethod: { not: null } },
      select: { paymentMethod: true },
      distinct: ['paymentMethod'],
    });
    return rows.map((r) => r.paymentMethod as string);
  } catch (error) {
    console.error('Error al obtener métodos de pago:', error);
    return [];
  }
};
