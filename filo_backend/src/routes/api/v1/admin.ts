import { Router } from "express";

import { AdminController } from "@/controllers/admin";
import { admin } from "@/middleware/auth";
import { validateRequestBody } from "@/middleware/validation";
import { addPackageSchema, adminLoginSchema, updatePackageSchema } from "@/schema";

const router = Router();

const adminController = new AdminController();

// ─── POST /api/v1/admin/login ────────────────────────────────────────────────────
router.post("/login", validateRequestBody(adminLoginSchema), adminController.login);

// ─── GET /api/v1/admin/verify ──────────────────────────────────────────────────
router.get("/verify", admin, adminController.verify);

// ─── POST /api/v1/admin/refresh ─────────────────────────────────────────────────
router.post("/refresh", adminController.refresh);

// ─── POST /api/v1/admin/logout ───────────────────────────────────────────────────
router.post("/logout", admin, adminController.logout);

// ─── POST /api/v1/admin/logout-all ───────────────────────────────────────────────
router.post("/logout-all", admin, adminController.logoutAll);

// ─── GET /api/v1/admin/packages ──────────────────────────────────────────────────
router.get("/packages", admin, adminController.getPackages);

// ─── POST /api/v1/admin/packages ─────────────────────────────────────────────────
router.post("/packages", admin, validateRequestBody(addPackageSchema), adminController.addPackage);

// ─── PATCH /api/v1/admin/packages/:id ────────────────────────────────────────────
router.patch("/packages/:id", admin, validateRequestBody(updatePackageSchema), adminController.updatePackage);

// ─── DELETE /api/v1/admin/packages/:id ───────────────────────────────────────────
router.delete("/packages/:id", admin, adminController.deletePackage);

// ─── GET /api/v1/admin/users ─────────────────────────────────────────────────────
router.get("/users", admin, adminController.getUsers);

export default router;
