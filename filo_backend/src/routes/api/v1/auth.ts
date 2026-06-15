import { Router } from "express";
import { AuthController } from "@/controllers/auth";
import { auth } from "@/middleware/auth";
import { validateRequestBody } from "@/middleware/validation";
import { forgotPasswordSchema, loginSchema, resetPasswordSchema, signupSchema, verifyEmailSchema } from "@/schema";

const router = Router();
const authController = new AuthController();

// ─── POST /api/auth/register ─────────────────────────────
router.post("/register", validateRequestBody(signupSchema), authController.signup);

// ─── POST /api/auth/verify-email ─────────────────────────
router.post("/verify-email", validateRequestBody(verifyEmailSchema), authController.verifyEmail);

// ─── POST /api/auth/login ────────────────────────────────
router.post("/login", validateRequestBody(loginSchema), authController.login);

// ─── GET /api/auth/verify ────────────────────────────────
router.get("/verify", auth, authController.verify);

// ─── POST /api/auth/refresh ──────────────────────────────
router.post("/refresh", authController.refresh);

// ─── POST /api/auth/logout ───────────────────────────────
router.post("/logout", auth, authController.logout);

// ─── POST /api/auth/logout-all ───────────────────────────
router.post("/logout-all", auth, authController.logoutAll);

// ─── GET /api/auth/me ────────────────────────────────────
router.get("/me", auth, authController.me);

// ─── POST /api/auth/forgot-password ──────────────────────
router.post("/forgot-password", validateRequestBody(forgotPasswordSchema), authController.forgotPassword);

// ─── POST /api/auth/reset-password ───────────────────────
router.post("/reset-password", validateRequestBody(resetPasswordSchema), authController.resetPassword);

export default router;
