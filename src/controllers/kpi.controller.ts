import { Request, Response } from 'express';
import * as kpiService from '../services/kpi.service';
import { KpiGroupBy, SalesKpiFilters } from '../types/kpi.types';

const toDate = (v: unknown, endOfDay: boolean): Date | undefined => {
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return undefined;
  const d = new Date(`${v}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}`);
  return isNaN(d.getTime()) ? undefined : d;
};

const toGroupBy = (v: unknown): KpiGroupBy | undefined => {
  if (v === 'day' || v === 'week' || v === 'month') return v;
  return undefined;
};

export const getSalesKpis = async (req: Request, res: Response) => {
  try {
    const q = req.query;
    const filters: SalesKpiFilters = {
      from: toDate(q.from, false),
      to: toDate(q.to, true),
      groupBy: toGroupBy(q.groupBy),
    };
    const kpis = await kpiService.getSalesKpis(filters);
    res.json(kpis);
  } catch (error) {
    res.status(500).json({ message: 'Error al calcular los KPIs de ventas' });
  }
};
