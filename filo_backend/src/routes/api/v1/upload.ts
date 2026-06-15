import { Router } from "express";
import { UploadController } from "@/controllers/upload";
import { auth } from "@/middleware/auth";
import { validateRequestBody } from "@/middleware/validation";
import {
  presignSimpleSchema,
  confirmSimpleSchema,
  initMultipartSchema,
  confirmPartSchema,
  completeMultipartSchema,
} from "@/schema";

const router = Router();
const uploadController = new UploadController();

router.use(auth);

// SIMPLE PRESIGNED UPLOAD  (files ≤ 100 MB)
// POST /api/v1/upload/presign
router.post(
  "/presign",
  validateRequestBody(presignSimpleSchema),
  uploadController.presignSimple,
);

// POST /api/v1/upload/confirm
router.post(
  "/confirm",
  validateRequestBody(confirmSimpleSchema),
  uploadController.confirmSimple,
);

// ════════════════════════════════════════════════════════════════════════════
// MULTIPART PRESIGNED UPLOAD  (files > 100 MB, up to 500 MB+)
//
//  1. POST /api/v1/upload/multipart/init
//     → validates plan, creates R2 multipart session, returns all part URLs
//
//  2. Client uploads each part in parallel (PUT to part URL, gets ETag back)
//
//  3. POST /api/v1/upload/multipart/:sessionId/parts   (per part)
//     → persists (partNumber, etag) to DB for resume support
//
//  4. POST /api/v1/upload/multipart/:sessionId/complete
//     → tells R2 to assemble the object, writes File record to DB
//
//  --- Resume flow ---
//  GET /api/v1/upload/multipart/:sessionId/resume
//     → returns fresh part URLs for unfinished parts only
//
//  --- Cancel ---
//  DELETE /api/v1/upload/multipart/:sessionId
//     → aborts the R2 multipart upload, marks session ABORTED
// ════════════════════════════════════════════════════════════════════════════

// GET /api/v1/upload/multipart/sessions  — list resumable sessions
router.get("/multipart/sessions", uploadController.listSessions);

// POST /api/v1/upload/multipart/init
router.post(
  "/multipart/init",
  validateRequestBody(initMultipartSchema),
  uploadController.initMultipart,
);

// GET /api/v1/upload/multipart/:sessionId/resume
router.get("/multipart/:sessionId/resume", uploadController.resumeMultipart);

// POST /api/v1/upload/multipart/:sessionId/parts
router.post(
  "/multipart/:sessionId/parts",
  validateRequestBody(confirmPartSchema),
  uploadController.confirmPart,
);

// POST /api/v1/upload/multipart/:sessionId/complete
router.post(
  "/multipart/:sessionId/complete",
  validateRequestBody(completeMultipartSchema),
  uploadController.completeMultipart,
);

// DELETE /api/v1/upload/multipart/:sessionId
router.delete("/multipart/:sessionId", uploadController.abortMultipart);

export default router;