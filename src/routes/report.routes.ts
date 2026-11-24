import { Router } from "express";
import * as reportController from "../controllers/report.controller";

const router = Router();

router.get("/sales", reportController.getSalesReport);

export default router;
