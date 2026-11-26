import { Router } from "express";
import * as reportController from "../controllers/report.controller";
import * as kpiController from "../controllers/kpi.controller";

const router = Router();

router.get("/sales", reportController.getSalesReport);
router.get("/kpis", kpiController.getSalesKpis);

export default router;
