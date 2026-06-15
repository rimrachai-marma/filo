import { Router } from "express";
import { auth } from "@/middleware/auth";
import { StatsController } from "@/controllers/stats";

const router = Router();
const controller = new StatsController();

router.get("/storage", auth, controller.getStorageStats);

export default router;