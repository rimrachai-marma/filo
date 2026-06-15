import type { Request, Response } from "express";

import asyncHandler from "@/middleware/asyncHandler";
import { prisma } from "@/lib/prisma";
import { UploadService } from "@/services/upload";

export class UploadController {
  private uploadService: UploadService;

  constructor() {
    this.uploadService = new UploadService(prisma);
  }

  presignSimple = asyncHandler(async (req: Request, res: Response) => {
    const { folderId, fileName, mimeType, sizeBytes } = req.body;

    const result = await this.uploadService.presignSimpleUpload(
      req.user!.id,
      folderId,
      fileName,
      mimeType,
      sizeBytes,
    );

    res.json({
      status: "success",
      message: "Presigned URL generated. PUT your file to uploadUrl.",
      data: result,
    });
  });


  confirmSimple = asyncHandler(async (req: Request, res: Response) => {
    const { r2Key, folderId, fileName, mimeType, sizeBytes } = req.body;

    const file = await this.uploadService.confirmSimpleUpload(req.user!.id, {
      r2Key,
      folderId,
      fileName,
      mimeType,
      sizeBytes,
    });

    res.status(201).json({
      status: "success",
      message: "File registered successfully.",
      data: file,
    });
  });

  // ─── Multipart: init ───────────────────────────────────────────────────────
  initMultipart = asyncHandler(async (req: Request, res: Response) => {
    const { folderId, fileName, mimeType, sizeBytes } = req.body;

    const result = await this.uploadService.initMultipartUpload(
      req.user!.id,
      folderId,
      fileName,
      mimeType,
      sizeBytes,
    );

    res.json({
      status: "success",
      message: `Multipart upload initialised. Upload ${result.totalParts} parts in parallel.`,
      data: result,
    });
  });

  // ─── Multipart: resume ─────────────────────────────────────────────────────
  resumeMultipart = asyncHandler(async (req: Request, res: Response) => {
    const { sessionId } = req.params;

    const result = await this.uploadService.resumeMultipartUpload(req.user!.id, sessionId as string);

    res.json({
      status: "success",
      message: "Resume data ready. Re-upload parts where uploadedAt is absent.",
      data: result,
    });
  });

  // ─── Multipart: confirm one part ──────────────────────────────────────────
  confirmPart = asyncHandler(async (req: Request, res: Response) => {
    const { sessionId } = req.params;
    const { partNumber, etag, sizeBytes } = req.body;

    const progress = await this.uploadService.confirmPart(
      req.user!.id,
      sessionId as string,
      partNumber,
      etag,
      sizeBytes,
    );

    res.json({
      status: "success",
      message: `Part ${partNumber} confirmed.`,
      data: progress,
    });
  });

  // ─── Multipart: complete ───────────────────────────────────────────────────
  completeMultipart = asyncHandler(async (req: Request, res: Response) => {
    const { sessionId } = req.params;
    const { parts } = req.body;

    const file = await this.uploadService.confirmMultipartUpload(req.user!.id, {
      sessionId: sessionId as string,
      parts,
    });

    res.status(201).json({
      status: "success",
      message: "Multipart upload completed. File is now available.",
      data: file,
    });
  });

  // ─── Multipart: abort ─────────────────────────────────────────────────────
  abortMultipart = asyncHandler(async (req: Request, res: Response) => {
    const { sessionId } = req.params;

    await this.uploadService.abortMultipartUpload(req.user!.id, sessionId as string);

    res.json({
      status: "success",
      message: "Upload aborted and partial data cleaned up.",
    });
  });

  // ─── List pending sessions (resume picker) ────────────────────────────────
  listSessions = asyncHandler(async (req: Request, res: Response) => {
    const sessions = await this.uploadService.listPendingSessions(req.user!.id);

    res.json({
      status: "success",
      message: "Pending upload sessions retrieved.",
      data: sessions,
      meta: { total: sessions.length },
    });
  });

  
}