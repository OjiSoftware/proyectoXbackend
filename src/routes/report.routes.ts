import { Router } from "express";
import * as reportController from "../controllers/report.controller";
import * as kpiController from "../controllers/kpi.controller";
import * as profitabilityController from "../controllers/profitability.controller";

const router = Router();

router.get("/sales", reportController.getSalesReport);
router.get("/kpis", kpiController.getSalesKpis);
router.get("/profitability", profitabilityController.getProfitabilityReport);

export default router;
