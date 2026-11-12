import { Router } from "express";
import * as providerController from "../controllers/provider.controller";

const router = Router();

router.get("/", providerController.getProviders);
router.get("/:id", providerController.getProvider);
router.post("/", providerController.createProvider);
router.put("/:id", providerController.updateProvider);
router.delete("/:id", providerController.deleteProvider);

export default router;
