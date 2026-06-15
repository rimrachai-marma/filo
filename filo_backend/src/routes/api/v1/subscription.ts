import { Router } from "express";
import { auth } from "@/middleware/auth";
import { SubscriptionController } from "@/controllers/subscription";
import { createSubscriptionSchema } from "@/schema";
import { validateRequestBody } from "@/middleware/validation";

const router = Router();
const controller = new SubscriptionController();

router.get("/packages", auth, controller.getPackages);
router.get("/subscriptions", auth, controller.getUserSubscriptions);
router.post("/subscriptions", auth, validateRequestBody(createSubscriptionSchema), controller.createSubscription);

export default router;
