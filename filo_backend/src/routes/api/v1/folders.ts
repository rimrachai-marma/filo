import { Router } from "express";
import { FolderController } from "@/controllers/folder";
import { auth } from "@/middleware/auth";
import { validateRequestBody } from "@/middleware/validation";
import { createFolderSchema, moveFolderSchema, renameFolderSchema } from "@/schema";

const router = Router();
const folderController = new FolderController();

// ─── GET    /api/folders ──────────────────────────────────────────────────────
router.get("/", auth, folderController.getFolders);

// ─── POST   /api/folders ──────────────────────────────────────────────────────
router.post("/", auth, validateRequestBody(createFolderSchema), folderController.createFolder);

// ─── GET    /api/folders/:id ──────────────────────────────────────────────────
router.get("/:id", auth, folderController.getFolderById);

// ─── PATCH  /api/folders/:id ──────────────────────────────────────────────────
router.patch("/:id", auth, validateRequestBody(renameFolderSchema), folderController.renameFolder);

// ─── POST   /api/folders/:id/move ─────────────────────────────────────────────
router.post("/:id/move", auth, validateRequestBody(moveFolderSchema), folderController.moveFolder);

// ─── DELETE /api/folders/:id ──────────────────────────────────────────────────
router.delete("/:id", auth, folderController.deleteFolder);

// ─── GET    /api/folders/:id/breadcrumbs ──────────────────────────────────────
router.get("/:id/breadcrumbs", auth, folderController.getFolderBreadcrumbs);

export default router;
