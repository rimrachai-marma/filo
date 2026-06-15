import fs from "fs";
import fsPromises from "fs/promises";
import path from "path";

import ErrorResponse from "@/utils/errorResponse";
import { PlanEnforcementService } from "./plan";
import { randomUUID } from "crypto";
import type { PrismaClient } from "@/generated/prisma/client";

export class FileService {
  private planEnforcement: PlanEnforcementService;
  constructor(private prisma: PrismaClient) {
    this.planEnforcement = new PlanEnforcementService(prisma);
  }

  async getFiles(userId: string, folderId: string) {
    const folder = await this.prisma.folder.findFirst({
      where: { id: folderId, userId },
    });

    if (!folder) {
      throw new ErrorResponse("Folder not found.", 404);
    }

    return this.prisma.file.findMany({
      where: { folderId, userId },
      orderBy: { name: "asc" },
    });
  }

  async uploadFile(userId: string, uploadedFile: Express.Multer.File | undefined, folderId: string) {
    if (!uploadedFile) {
      throw new ErrorResponse("No file uploaded.", 400);
    }

    if (!folderId) {
      await fsPromises.unlink(uploadedFile.path).catch(() => {});
      throw new ErrorResponse("folderId is required.", 400);
    }

    const folder = await this.prisma.folder.findFirst({
      where: { id: folderId, userId },
    });

    if (!folder) {
      await fsPromises.unlink(uploadedFile.path).catch(() => {});
      throw new ErrorResponse("Folder not found.", 404);
    }

    const check = await this.planEnforcement.checkFileUploadAllowed(
      userId,
      folderId,
      uploadedFile.mimetype,
      uploadedFile.size,
    );

    if (!check.allowed) {
      await fsPromises.unlink(uploadedFile.path).catch(() => {});
      throw new ErrorResponse(check.reason || "Upload not allowed.", 403);
    }

    return this.prisma.file.create({
      data: {
        name: uploadedFile.originalname,
        userId,
        folderId,
        type: check.fileType!,
        sizeBytes: uploadedFile.size,
        path: uploadedFile.path,
        mimeType: uploadedFile.mimetype,
      },
    });
  }

  async downloadFile(userId: string, fileId: string) {
    const file = await this.prisma.file.findFirst({
      where: { id: fileId, userId },
    });

    if (!file) {
      throw new ErrorResponse("File not found.", 404);
    }

    if (!fs.existsSync(file.path)) {
      throw new ErrorResponse("File not found on disk.", 404);
    }

    return {
      stream: fs.createReadStream(file.path),
      name: file.name,
      mimeType: file.mimeType,
    };
  }

  async renameFile(userId: string, fileId: string, name: string) {
    const exists = await this.prisma.file.findFirst({
      where: { id: fileId, userId },
    });

    if (!exists) {
      throw new ErrorResponse("File not found.", 404);
    }

    return this.prisma.file.update({
      where: { id: fileId },
      data: { name: name.trim() },
    });
  }

  async deleteFile(userId: string, fileId: string) {
    const file = await this.prisma.file.findFirst({
      where: { id: fileId, userId },
    });

    if (!file) {
      throw new ErrorResponse("File not found.", 404);
    }

    try {
      await fsPromises.unlink(file.path);
    } catch {
      // file missing on disk is acceptable
    }

    await this.prisma.file.delete({
      where: { id: fileId },
    });
  }

  async moveFile(userId: string, fileId: string, targetFolderId: string) {
    const file = await this.prisma.file.findFirst({
      where: { id: fileId, userId },
    });

    if (!file) {
      throw new ErrorResponse("File not found.", 404);
    }

    if (file.folderId === targetFolderId) {
      throw new ErrorResponse("File is already in this folder.", 400);
    }

    const targetFolder = await this.prisma.folder.findFirst({
      where: { id: targetFolderId, userId },
    });

    if (!targetFolder) {
      throw new ErrorResponse("Target folder not found.", 404);
    }

    const check = await this.planEnforcement.checkFileUploadAllowed(
      userId,
      targetFolderId,
      file.mimeType,
      file.sizeBytes,
    );

    if (!check.allowed) {
      throw new ErrorResponse(check.reason || "Move not allowed.", 403);
    }

    return this.prisma.file.update({
      where: { id: fileId },
      data: { folderId: targetFolderId },
    });
  }

  async copyFile(userId: string, fileId: string, targetFolderId: string) {
    const file = await this.prisma.file.findFirst({
      where: { id: fileId, userId },
    });

    if (!file) {
      throw new ErrorResponse("File not found.", 404);
    }

    if (!fs.existsSync(file.path)) {
      throw new ErrorResponse("File not found on disk.", 404);
    }

    const targetFolder = await this.prisma.folder.findFirst({
      where: { id: targetFolderId, userId },
    });

    if (!targetFolder) {
      throw new ErrorResponse("Target folder not found.", 404);
    }

    const check = await this.planEnforcement.checkFileUploadAllowed(
      userId,
      targetFolderId,
      file.mimeType,
      file.sizeBytes,
    );

    if (!check.allowed) {
      throw new ErrorResponse(check.reason || "Copy not allowed.", 403);
    }

    // Build a new unique path for the copied file on disk
    const ext = path.extname(file.path);
    const dir = path.dirname(file.path);
    const newDiskPath = path.join(dir, `${randomUUID()}${ext}`);

    await fsPromises.copyFile(file.path, newDiskPath);

    try {
      return await this.prisma.file.create({
        data: {
          name: file.name,
          userId,
          folderId: targetFolderId,
          type: file.type,
          sizeBytes: file.sizeBytes,
          path: newDiskPath,
          mimeType: file.mimeType,
        },
      });
    } catch (err) {
      // Clean up copied file on disk if DB insert fails
      await fsPromises.unlink(newDiskPath).catch(() => {});
      throw err;
    }
  }
}
