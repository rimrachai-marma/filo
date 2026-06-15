import path from "path";
import fs from "fs";
import { randomUUID } from "crypto";
import { createReadStream } from "fs";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PutObjectCommand, DeleteObjectCommand, GetObjectCommand, CopyObjectCommand } from "@aws-sdk/client-s3";

import { r2, R2_BUCKET } from "@/lib/r2";
import ErrorResponse from "@/utils/errorResponse";
import { PlanEnforcementService } from "./plan";
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
      fs.unlink(uploadedFile.path, (err) => {
        if (err) console.error("Failed to delete temp file:", uploadedFile.path, err);
      });

      throw new ErrorResponse("folderId is required.", 400);
    }

    const folder = await this.prisma.folder.findFirst({
      where: { id: folderId, userId },
    });

    if (!folder) {
      fs.unlink(uploadedFile.path, (err) => {
        if (err) console.error("Failed to delete temp file:", uploadedFile.path, err);
      });

      throw new ErrorResponse("Folder not found.", 404);
    }

    const check = await this.planEnforcement.checkFileUploadAllowed(
      userId,
      folderId,
      uploadedFile.mimetype,
      uploadedFile.size,
    );

    if (!check.allowed) {
      fs.unlink(uploadedFile.path, (err) => {
        if (err) console.error("Failed to delete temp file:", uploadedFile.path, err);
      });

      throw new ErrorResponse(check.reason || "Upload not allowed.", 403);
    }

    // Build a unique R2 object key scoped to the user
    const ext = path.extname(uploadedFile.originalname);
    const key = `${userId}/${randomUUID()}${ext}`;

    try {
      await r2.send(
        new PutObjectCommand({
          Bucket: R2_BUCKET,
          Key: key,
          Body: createReadStream(uploadedFile.path),
          ContentType: uploadedFile.mimetype,
          ContentLength: uploadedFile.size,
        }),
      );

      return await this.prisma.file.create({
        data: {
          name: uploadedFile.originalname,
          userId,
          folderId,
          type: check.fileType!,
          sizeBytes: uploadedFile.size,
          path: key,
          mimeType: uploadedFile.mimetype,
        },
      });
    } finally {
      fs.unlink(uploadedFile.path, (err) => {
        if (err) console.error("Failed to delete temp file:", uploadedFile.path, err);
      });
    }
  }

  async downloadFile(userId: string, fileId: string) {
    const file = await this.prisma.file.findFirst({
      where: { id: fileId, userId },
    });

    if (!file) {
      throw new ErrorResponse("File not found.", 404);
    }

    // Generate a time-limited presigned URL so the client downloads directly
    // from R2 — no proxying through Express server.
    const url = await getSignedUrl(
      r2,
      new GetObjectCommand({
        Bucket: R2_BUCKET,
        Key: file.path,
        ResponseContentDisposition: `attachment; filename="${encodeURIComponent(file.name)}"`,
      }),
      { expiresIn: 3600 }, // 1 hour
    );

    return {
      url,
      name: file.name,
      mimeType: file.mimeType,
    };
  }

  // ─── Rename (DB-only, no storage change needed) ────────────────────────────
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

    // Delete from R2 first, then remove the DB record
    await r2.send(
      new DeleteObjectCommand({
        Bucket: R2_BUCKET,
        Key: file.path,
      }),
    );

    await this.prisma.file.delete({
      where: { id: fileId },
    });
  }

  // ─── Move (DB-only, the R2 object key stays the same) ─────────────────────
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

    // Moving only changes the folder reference in the DB.
    // The R2 object key stays unchanged.
    return this.prisma.file.update({
      where: { id: fileId },
      data: { folderId: targetFolderId },
    });
  }

  // ─── Copy (new R2 object + DB record) ─────────────────────────────────────
  async copyFile(userId: string, fileId: string, targetFolderId: string) {
    const file = await this.prisma.file.findFirst({
      where: { id: fileId, userId },
    });

    if (!file) {
      throw new ErrorResponse("File not found.", 404);
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

    if (file.folderId === targetFolderId) {
      file.name = await this.generateCopyName(file.name, targetFolderId, userId)
    }

    // Build a new unique key for the copy
    const ext = path.extname(file.path);
    const newKey = `${userId}/${randomUUID()}${ext}`;

    // Server-side copy within R2 — no data leaves the bucket
    await r2.send(
      new CopyObjectCommand({
        Bucket: R2_BUCKET,
        CopySource: `${R2_BUCKET}/${file.path}`,
        Key: newKey,
      }),
    );

    try {
      return await this.prisma.file.create({
        data: {
          name: file.name,
          userId,
          folderId: targetFolderId,
          type: file.type,
          sizeBytes: file.sizeBytes,
          path: newKey,
          mimeType: file.mimeType,
        },
      });
    } catch (err) {
      // If the DB insert fails, clean up the orphaned R2 object
      await r2.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: newKey })).catch(() => {});
      throw err;
    }
  }


  private async generateCopyName( originalName: string, folderId: string, userId: string): Promise<string> {
    const ext = path.extname(originalName);
    const baseName = path.basename(originalName, ext);

    let copyNumber = 1;
    let newName = `${baseName} (${copyNumber})${ext}`;

    while (
      await this.prisma.file.findFirst({
        where: {
          userId,
          folderId,
          name: newName,
        },
        select: { id: true },
      })
    ) {
      copyNumber++;
      newName = `${baseName} (${copyNumber})${ext}`;
    }

    return newName;
  }
}
