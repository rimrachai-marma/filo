import type { Request, Response } from "express";
import asyncHandler from "@/middleware/asyncHandler";
import { prisma } from "@/lib/prisma";
import { FolderService } from "@/services/folder";

export class FolderController {
  private folderService: FolderService;

  constructor() {
    this.folderService = new FolderService(prisma);
  }

  getFolders = asyncHandler(async (req: Request, res: Response) => {
    const parentId = (req.query.parentId as string) || null;

    const folders = await this.folderService.getFolders(req.user?.id!, parentId);

    res.json({
      status: "success",
      message: "Folders retrieved successfully",
      data: folders,
    });
  });

  createFolder = asyncHandler(async (req: Request, res: Response) => {
    const { name, parentId } = req.body;

    const folder = await this.folderService.createFolder(req.user?.id!, name, parentId);

    res.status(201).json({
      status: "success",
      message: "Folder created successfully",
      data: folder,
    });
  });

  getFolderById = asyncHandler(async (req: Request, res: Response) => {
    const folder = await this.folderService.getFolderById(req.user?.id!, req.params.id as string);

    res.json({
      status: "success",
      message: "Folder retrieved successfully",
      data: folder,
    });
  });

  renameFolder = asyncHandler(async (req: Request, res: Response) => {
    const folder = await this.folderService.renameFolder(req.user?.id!, req.params.id as string, req.body.name);

    res.json({
      status: "success",
      message: "Folder renamed successfully",
      data: folder,
    });
  });

  moveFolder = asyncHandler(async (req: Request, res: Response) => {
    // targetParentId can be null to move the folder to the root level
    const targetParentId = req.body.targetParentId ?? null;

    const folder = await this.folderService.moveFolder(req.user?.id!, req.params.id as string, targetParentId);

    res.json({
      status: "success",
      message: "Folder moved successfully",
      data: folder,
    });
  });

  deleteFolder = asyncHandler(async (req: Request, res: Response) => {
    await this.folderService.deleteFolder(req.user?.id!, req.params.id as string);

    res.json({
      status: "success",
      message: "Folder deleted successfully",
    });
  });

  getFolderBreadcrumbs = asyncHandler(async (req: Request, res: Response) => {
    const crumbs = await this.folderService.getFolderBreadcrumbs(req.user?.id!, req.params.id as string);
    res.json({
      status: "success",
      message: "Breadcrumbs retrieved successfully",
      data: crumbs,
    });
  });
}
