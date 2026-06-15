import fs from "fs/promises";

import ErrorResponse from "@/utils/errorResponse";
import { PlanEnforcementService } from "./plan";
import type { PrismaClient } from "@/generated/prisma/client";
import { DeleteObjectsCommand, type ObjectIdentifier } from "@aws-sdk/client-s3";
import { r2, R2_BUCKET } from "@/lib/r2";

export class FolderService {
  private planEnforcement: PlanEnforcementService;

  constructor(private prisma: PrismaClient) {
    this.planEnforcement = new PlanEnforcementService(prisma);
  }

  async getFolders(userId: string, parentId: string | null) {
    return this.prisma.folder.findMany({
      where: { userId, parentId },
      include: { _count: { select: { children: true, files: true } } },
      orderBy: { name: "asc" },
    });
  }

  async createFolder(userId: string, name: string, parentId?: string | null) {
    if (parentId) {
      const parent = await this.prisma.folder.findFirst({
        where: { id: parentId, userId },
      });
      if (!parent) throw new ErrorResponse("Parent folder not found.", 404);
    }

    const countCheck = await this.planEnforcement.checkFolderCreationAllowed(userId);
    if (!countCheck.allowed) {
      throw new ErrorResponse(countCheck.reason || "Limit reached.", 403);
    }

    const nestCheck = await this.planEnforcement.checkNestingAllowed(userId, parentId || null);
    if (!nestCheck.allowed) {
      throw new ErrorResponse(nestCheck.reason || "Nesting not allowed.", 403);
    }

    return this.prisma.folder.create({
      data: { name: name.trim(), userId, parentId: parentId || null },
      include: { _count: { select: { children: true, files: true } } },
    });
  }

  async getFolderById(userId: string, folderId: string) {
    const folder = await this.prisma.folder.findFirst({
      where: { id: folderId, userId },
      include: {
        parent: { select: { id: true, name: true } },
        children: {
          include: { _count: { select: { children: true, files: true } } },
        },
        files: true,
      },
    });

    if (!folder) throw new ErrorResponse("Folder not found.", 404);
    return folder;
  }

  async renameFolder(userId: string, folderId: string, name: string) {
    const exists = await this.prisma.folder.findFirst({
      where: { id: folderId, userId },
    });
    if (!exists) throw new ErrorResponse("Folder not found.", 404);

    return this.prisma.folder.update({
      where: { id: folderId },
      data: { name: name.trim() },
      include: { _count: { select: { children: true, files: true } } },
    });
  }

  async moveFolder(userId: string, folderId: string, targetParentId: string | null) {
    const folder = await this.prisma.folder.findFirst({
      where: { id: folderId, userId },
    });
    if (!folder) throw new ErrorResponse("Folder not found.", 404);

    if (folder.parentId === targetParentId) {
      throw new ErrorResponse("Folder is already in this location.", 400);
    }

    if (targetParentId === folderId) {
      throw new ErrorResponse("Cannot move a folder into itself.", 400);
    }

    if (targetParentId !== null) {
      const [targetFolder, isDescendant] = await Promise.all([
        this.prisma.folder.findFirst({ where: { id: targetParentId, userId } }),
        this.isFolderDescendant(userId, targetParentId, folderId),
      ]);

      if (!targetFolder) {
        throw new ErrorResponse("Target folder not found.", 404);
      }
      if (isDescendant) {
        throw new ErrorResponse("Cannot move a folder into one of its own subfolders.", 400);
      }
    }

    const subtreeHeight = await this.getSubtreeHeight(userId, folderId);
    const nestCheck = await this.planEnforcement.checkNestingAllowed(userId, targetParentId, subtreeHeight);
    
    if (!nestCheck.allowed) {
      throw new ErrorResponse(nestCheck.reason || "Nesting not allowed.", 403);
    }

    return this.prisma.folder.update({
      where: { id: folderId },
      data: { parentId: targetParentId },
      include: { _count: { select: { children: true, files: true } } },
    });
  }

  private async isFolderDescendant(userId: string, folderId: string, ancestorId: string): Promise<boolean> {
    const results = await this.prisma.$queryRaw<{ id: string }[]>`
      WITH RECURSIVE folder_tree AS (
        SELECT id, "parentId"
        FROM "Folder"
        WHERE id = ${folderId} AND "userId" = ${userId}

        UNION ALL

        SELECT f.id, f."parentId"
        FROM "Folder" f
        INNER JOIN folder_tree ft ON f.id = ft."parentId"
      )
      SELECT id FROM folder_tree WHERE id = ${ancestorId}
    `;

    return results.length > 0;
  }

  private async getSubtreeHeight(userId: string, folderId: string): Promise<number> {
    const result = await this.prisma.$queryRaw<{ height: number | null }[]>`
      WITH RECURSIVE folder_tree AS (
        SELECT id, 0 AS depth
        FROM "Folder"
        WHERE id = ${folderId} AND "userId" = ${userId}

        UNION ALL

        SELECT f.id, ft.depth + 1
        FROM "Folder" f
        INNER JOIN folder_tree ft ON f."parentId" = ft.id
      )
      SELECT MAX(depth) AS height FROM folder_tree
    `;

    return Number(result[0]?.height ?? 0);
  }

  async deleteFolder(userId: string, folderId: string) {
    const folder = await this.prisma.folder.findFirst({
      where: { id: folderId, userId },
    });
    if (!folder) throw new ErrorResponse("Folder not found.", 404);

    const files = await this.prisma.$queryRaw<{ path: string }[]>`
      WITH RECURSIVE folder_tree AS (
        SELECT id
        FROM "Folder"
        WHERE id = ${folderId} AND "userId" = ${userId}

        UNION ALL

        SELECT f.id
        FROM "Folder" f
        INNER JOIN folder_tree ft ON f."parentId" = ft.id
      )
      SELECT file.path
      FROM "File" file
      INNER JOIN folder_tree ft ON ft.id = file."folderId"
    `;

    await this.prisma.folder.delete({ where: { id: folderId } });

    if (files.length > 0) {
      const keys: ObjectIdentifier[] = files.map((f) => ({ Key: f.path }));
      const BATCH = 1000;

      for (let i = 0; i < keys.length; i += BATCH) {
        const batch = keys.slice(i, i + BATCH);
        await r2.send(
          new DeleteObjectsCommand({
            Bucket: R2_BUCKET,
            Delete: { Objects: batch, Quiet: true },
          }),
        ).catch((err) => {
          console.error("R2 batch delete partial failure:", err);
        });
      }
    }
  }

  async getFolderBreadcrumbs(userId: string, folderId: string): Promise<{ id: string; name: string }[]> {
    const results = await this.prisma.$queryRaw<{ id: string; name: string; depth: number }[]>`
      WITH RECURSIVE ancestors AS (
        SELECT id, name, "parentId", 0 AS depth
        FROM "Folder"
        WHERE id = ${folderId} AND "userId" = ${userId}

        UNION ALL

        SELECT f.id, f.name, f."parentId", a.depth + 1
        FROM "Folder" f
        INNER JOIN ancestors a ON f.id = a."parentId"
      )
      SELECT id, name, depth FROM ancestors ORDER BY depth DESC
    `;

    if (results.length === 0) throw new ErrorResponse("Folder not found.", 404);
    return results.map(({ id, name }) => ({ id, name }));
  }
}
