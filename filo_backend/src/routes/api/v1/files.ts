import { Router } from "express";
import { FileController } from "@/controllers/files";
import { upload } from "@/middleware/upload";
import { auth } from "@/middleware/auth";
import { copyFileSchema, getFilesQuerySchema, moveFileSchema, renameFileSchema, uploadFileSchema } from "@/schema";
import { validateRequestBody, validateRequestQuery } from "@/middleware/validation";

const router = Router();
const fileController = new FileController();

// ─── GET  /api/files?folderId=<id> ────────────────────────────────────────────
router.get("/", auth, validateRequestQuery(getFilesQuerySchema), fileController.getFiles);

// ─── POST /api/files ──────────────────────────────────────────────────────────
router.post("/", auth, upload.single("file"), validateRequestBody(uploadFileSchema), fileController.uploadFile);

// ─── GET  /api/files/:id/download ─────────────────────────────────────────────
router.get("/:id/download", auth, fileController.downloadFile);

// ─── PATCH /api/files/:id ─────────────────────────────────────────────────────
router.patch("/:id", auth, validateRequestBody(renameFileSchema), fileController.renameFile);

// ─── POST /api/files/:id/move ─────────────────────────────────────────────────
router.post("/:id/move", auth, validateRequestBody(moveFileSchema), fileController.moveFile);

// ─── POST /api/files/:id/copy ─────────────────────────────────────────────────
router.post("/:id/copy", auth, validateRequestBody(copyFileSchema), fileController.copyFile);

// ─── DELETE /api/files/:id ────────────────────────────────────────────────────
router.delete("/:id", auth, fileController.deleteFile);
export default router;
