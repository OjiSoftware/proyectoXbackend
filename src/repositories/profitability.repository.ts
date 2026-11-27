import { prisma } from '../prisma';

export interface SoldItemForProfitability {
  productId: number;
  quantity: number;
  unitaryPrice: unknown;
  product: {
    name: string;
    costPrice: unknown;
    category: { name: string };
  };
}

/**
 * Obtiene los ítems vendidos (SaleDetails) de ventas COMPLETED dentro de un
 * rango de fechas, con los datos mínimos del producto para calcular márgenes.
 */
export const findCompletedSoldItemsInRange = async (
  from: Date,
  to: Date,
): Promise<SoldItemForProfitability[]> => {
  try {
    return await prisma.saleDetails.findMany({
      where: {
        sale: {
          status: 'COMPLETED',
          createdAt: {
            gte: from,
            lte: to,
          },
        },
      },
      select: {
        productId: true,
        quantity: true,
        unitaryPrice: true,
        product: {
          select: {
            name: true,
            costPrice: true,
            category: { select: { name: true } },
          },
        },
      },
    });
  } catch (error) {
    console.error('Error al obtener ítems vendidos para rentabilidad:', error);
    throw new Error('No se pudieron obtener las ventas para calcular la rentabilidad');
  }
};
