import type { Request, Response } from "express";
import asyncHandler from "@/middleware/asyncHandler";
import { prisma } from "@/lib/prisma";
import { ShareService } from "@/services/share";

export class ShareController {
  private shareService = new ShareService(prisma);

  // ── Owner-side ──────────────────────────────────────────────────────────
  createFileShare = asyncHandler(async (req: Request, res: Response) => {
    const { fileId, expiresInHours } = req.body;

    const link = await this.shareService.createFileShareLink(req.user!.id, fileId, expiresInHours);

    res.status(201).json({
      status: "success",
      message: "File share link created successfully",
      data: link,
    });
  });

  createFolderShare = asyncHandler(async (req: Request, res: Response) => {
    const { folderId, expiresInHours } = req.body;

    const link = await this.shareService.createFolderShareLink(req.user!.id, folderId, expiresInHours);

    res.status(201).json({
      status: "success",
      message: "Folder share link created successfully",
      data: link,
    });
  });

  shareLinks = asyncHandler(async (req: Request, res: Response) => {
    const links = await this.shareService.shareLinks(req.user!.id);

    res.json({
      status: "success",
      message: "Share links retrieved successfully",
      data: links,
      meta: { total: links.length },
    });
  });

  revoke = asyncHandler(async (req: Request, res: Response) => {
    await this.shareService.revokeShareLink(req.user!.id, req.params.id as string);

    res.json({ status: "success", message: "Share link revoked successfully" });
  });

  // ── Public (no auth) ────────────────────────────────────────────────────
  getInfo = asyncHandler(async (req: Request, res: Response) => {
    const info = await this.shareService.getPublicShareInfo(req.params.token as string);

    res.json({ status: "success", message: "Share info retrieved successfully", data: info });
  });

  getFolderContents = asyncHandler(async (req: Request, res: Response) => {
    const contents = await this.shareService.getPublicFolderContents(
      req.params.token as string,
      req.params.folderId as string,
    );

    res.json({ status: "success", message: "Folder contents retrieved successfully", data: contents });
  });

  download = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.shareService.getPublicDownloadUrl(
      req.params.token as string,
      req.params.fileId as string,
    );

    res.json({ status: "success", message: "Download URL retrieved successfully", data: result });
  });
}