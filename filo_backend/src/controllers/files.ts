import type { Request, Response } from "express";
import asyncHandler from "@/middleware/asyncHandler";
import { prisma } from "@/lib/prisma";
import { FileService } from "@/services/file";

export class FileController {
  private fileService: FileService;

  constructor() {
    this.fileService = new FileService(prisma);
  }

  getFiles = asyncHandler(async (req: Request, res: Response) => {
    const { folderId } = req.query;

    const files = await this.fileService.getFiles(req.user!.id, String(folderId));

    res.json({
      status: "success",
      message: "Files retrieved successfully",
      data: files,
    });
  });

  uploadFile = asyncHandler(async (req: Request, res: Response) => {
    const file = await this.fileService.uploadFile(req.user!.id, req.file, req.body.folderId);

    res.status(201).json({
      status: "success",
      message: "File uploaded successfully",
      data: file,
    });
  });

  // downloadFile = asyncHandler(async (req: Request, res: Response) => {
  //   const streamData = await this.fileService.downloadFile(req.user!.id, req.params.id);

  //   res.setHeader("Content-Type", streamData.mimeType);
  //   res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(streamData.name)}"`);

  //   streamData.stream.pipe(res);
  // });

  downloadFile = asyncHandler(async (req: Request, res: Response) => {
    const fileObject = await this.fileService.downloadFile(req.user!.id, req.params.id as string);
    res.json({
      status: "success",
      message: "File download URL retrieved successfully",
      data: fileObject,
    });
  });

  renameFile = asyncHandler(async (req: Request, res: Response) => {
    const file = await this.fileService.renameFile(req.user!.id, req.params.id as string, req.body.name);

    res.json({
      status: "success",
      message: "File renamed successfully",
      data: file,
    });
  });

  moveFile = asyncHandler(async (req: Request, res: Response) => {
    const file = await this.fileService.moveFile(req.user!.id, req.params.id as string, req.body.targetFolderId);

    res.json({
      status: "success",
      message: "File moved successfully",
      data: file,
    });
  });

  copyFile = asyncHandler(async (req: Request, res: Response) => {
    const file = await this.fileService.copyFile(req.user!.id, req.params.id as string, req.body.targetFolderId);

    res.status(201).json({
      status: "success",
      message: "File copied successfully",
      data: file,
    });
  });

  deleteFile = asyncHandler(async (req: Request, res: Response) => {
    await this.fileService.deleteFile(req.user!.id, req.params.id as string);

    res.json({
      status: "success",
      message: "File deleted successfully",
    });
  });
}
