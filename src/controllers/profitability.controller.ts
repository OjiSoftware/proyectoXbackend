import { Request, Response } from 'express';
import * as profitabilityService from '../services/profitability.service';
import { ProfitabilityFilters } from '../types/profitability.types';

const toDate = (v: unknown, endOfDay: boolean): Date | undefined => {
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return undefined;
  const d = new Date(`${v}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}-03:00`);
  return isNaN(d.getTime()) ? undefined : d;
};

export const getProfitabilityReport = async (req: Request, res: Response) => {
  try {
    const q = req.query;
    const filters: ProfitabilityFilters = {
      from: toDate(q.from, false),
      to: toDate(q.to, true),
    };
    const report = await profitabilityService.getProfitabilityReport(filters);
    res.json(report);
  } catch (error) {
    res.status(500).json({ message: 'Error al calcular la rentabilidad' });
  }
};
