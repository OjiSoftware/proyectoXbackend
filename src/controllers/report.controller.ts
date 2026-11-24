import { Request, Response } from 'express';
import * as reportService from '../services/report.service';
import { SalesReportFilters } from '../types/report.types';

const toInt = (v: unknown): number | undefined => {
  const n = Number(v);
  return v !== undefined && v !== '' && Number.isInteger(n) && n > 0 ? n : undefined;
};

const toDate = (v: unknown, endOfDay: boolean): Date | undefined => {
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return undefined;
  const d = new Date(`${v}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}`);
  return isNaN(d.getTime()) ? undefined : d;
};

/**
 * Reporte de ventas COMPLETED con filtros por query string.
 * Sin `pageSize` devuelve todos los ítems (usado para exportar).
 */
export const getSalesReport = async (req: Request, res: Response) => {
  try {
    const q = req.query;
    const filters: SalesReportFilters = {
      from: toDate(q.from, false),
      to: toDate(q.to, true),
      categoryId: toInt(q.categoryId),
      providerId: toInt(q.providerId),
      brandId: toInt(q.brandId),
      paymentMethod: typeof q.paymentMethod === 'string' ? q.paymentMethod : undefined,
      search: typeof q.search === 'string' ? q.search : undefined,
      page: toInt(q.page),
      pageSize: toInt(q.pageSize),
    };
    const report = await reportService.getSalesReport(filters);
    res.json(report);
  } catch (error: any) {
    res.status(500).json({ message: 'Error al generar el reporte de ventas' });
  }
};
