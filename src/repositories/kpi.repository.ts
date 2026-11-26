import { prisma } from '../prisma';

export interface CompletedSaleForKpi {
  id: number;
  createdAt: Date;
  details: {
    quantity: number;
    unitaryPrice: unknown;
  }[];
}

/**
 * Obtiene ventas COMPLETED dentro de un rango de fechas con sus detalles
 * mínimos necesarios para calcular KPIs.
 */
export const findCompletedSalesInRange = async (
  from: Date,
  to: Date,
): Promise<CompletedSaleForKpi[]> => {
  try {
    return await prisma.sale.findMany({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: from,
          lte: to,
        },
      },
      select: {
        id: true,
        createdAt: true,
        details: {
          select: {
            quantity: true,
            unitaryPrice: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  } catch (error) {
    console.error('Error al obtener ventas para KPIs:', error);
    throw new Error('No se pudieron obtener las ventas para calcular KPIs');
  }
};
