import express from "express";

import adminRoutes from "./admin";
import authRoutes from "./auth";
import folderRoutes from "./folders";
import fileRoutes from "./files";
import subscriptionRoutes from "./subscription";
import uploadRoutes from "./upload";
import statsRoutes from "./stats";
import shareRoutes from "./share";
import publicShareRoutes from "./public-share";

const router = express.Router();

// ─── Auth ─────────────────────────────────────────────────────────────────────
router.use("/auth", authRoutes);

// ─── Admin ────────────────────────────────────────────────────────────────────
router.use("/admin", adminRoutes);

// ─── Folders ──────────────────────────────────────────────────────────────────
router.use("/folders", folderRoutes);

// ─── Files ────────────────────────────────────────────────────────────────────
router.use("/files", fileRoutes);

// ─── Presigned / Multipart Upload ─────────────────────────────────────────────
router.use("/upload", uploadRoutes);

// ─── Packages + Subscriptions (mounted at root so paths become /packages, /subscriptions)
router.use("/", subscriptionRoutes);

router.use("/stats", statsRoutes);

router.use("/share", shareRoutes);
router.use("/public/share", publicShareRoutes);

export default router;
