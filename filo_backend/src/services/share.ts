import { randomUUID,  } from "crypto";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { r2, R2_BUCKET } from "@/lib/r2";
import ErrorResponse from "@/utils/errorResponse";
import type { PrismaClient } from "@/generated/prisma/client";

const DOWNLOAD_URL_TTL_SECONDS = 3600;

export class ShareService {
  constructor(private prisma: PrismaClient) {}

  // ─── Owner-side management ────────────────────────────────────────────────
  async createFileShareLink(userId: string, fileId: string, expiresInHours?: number) {
    const file = await this.prisma.file.findFirst({ where: { id: fileId, userId } });

    if (!file) throw new ErrorResponse("File not found.", 404);

    const token = randomUUID().replace(/-/g, "");

    return this.prisma.shareLink.create({
      data: {
        token,
        userId,
        fileId,
        expiresAt: expiresInHours ? new Date(Date.now() + expiresInHours * 60 * 60 * 1000) : null,
      },
      include: { file: { select: { id: true, name: true } }, folder: true },
    });
  }

  async createFolderShareLink(userId: string, folderId: string, expiresInHours?: number) {
    const folder = await this.prisma.folder.findFirst({ where: { id: folderId, userId } });

    if (!folder) throw new ErrorResponse("Folder not found.", 404);

    const token = randomUUID().replace(/-/g, "");

    return this.prisma.shareLink.create({
      data: {
        token,
        userId,
        folderId,
        expiresAt: expiresInHours ? new Date(Date.now() + expiresInHours * 60 * 60 * 1000) : null,
      },
      include: { folder: { select: { id: true, name: true } }, file: true },
    });
  }

  async shareLinks(userId: string) {
    return this.prisma.shareLink.findMany({
      where: { userId },   
      include: {
        file: { select: { id: true, name: true } },
        folder: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async revokeShareLink(userId: string, shareId: string) {
    const link = await this.prisma.shareLink.findFirst({ where: { id: shareId, userId } });

    if (!link) throw new ErrorResponse("Share link not found.", 404);

    await this.prisma.shareLink.delete({ where: { id: shareId } });
  }

  // ─── Public access ─────────────────────────────────────────────────────────
  private async getValidLink(token: string) {
    const link = await this.prisma.shareLink.findUnique({ where: { token } });

    if (!link) throw new ErrorResponse("Share link not found.", 404);

    if (link.expiresAt && link.expiresAt < new Date()) {
      throw new ErrorResponse("This share link has expired.", 410);
    }

    return link;
  }

  async getPublicShareInfo(token: string) {
    const link = await this.getValidLink(token);

    if (link.fileId) {
      const file = await this.prisma.file.findUnique({
        where: { id: link.fileId },
        select: { id: true, name: true, sizeBytes: true, mimeType: true, type: true },
      });

      if (!file) throw new ErrorResponse("Shared file no longer exists.", 404);

      return { type: "file" as const, file };
    }

    if (link.folderId) {
      const folder = await this.prisma.folder.findUnique({
        where: { id: link.folderId },
        select: { id: true, name: true },
      });

      if (!folder) throw new ErrorResponse("Shared folder no longer exists.", 404);

      const [children, files] = await Promise.all([
        this.prisma.folder.findMany({
          where: { parentId: folder.id },
          select: { id: true, name: true, _count: { select: { children: true, files: true } } },
          orderBy: { name: "asc" },
        }),

        this.prisma.file.findMany({
          where: { folderId: folder.id },
          select: { id: true, name: true, sizeBytes: true, mimeType: true, type: true },
          orderBy: { name: "asc" },
        }),
      ]);

      return { type: "folder" as const, folder, children, files };
    }

    throw new ErrorResponse("Invalid share link.", 400);
  }

  // List contents of a sub-folder within a shared folder tree
  async getPublicFolderContents(token: string, folderId: string) {
    const link = await this.getValidLink(token);

    if (!link.folderId) throw new ErrorResponse("This share link does not point to a folder.", 400);

    const isWithin = await this.isWithinSharedFolder(link.folderId, link.userId, folderId);

    if (!isWithin) throw new ErrorResponse("Folder not found within this shared link.", 404);

    const folder = await this.prisma.folder.findUnique({
      where: { id: folderId },
      select: { id: true, name: true },
    });

    if (!folder) throw new ErrorResponse("Folder not found.", 404);

    const [children, files, breadcrumbs] = await Promise.all([
      this.prisma.folder.findMany({
        where: { parentId: folderId },
        select: { id: true, name: true, _count: { select: { children: true, files: true } } },
        orderBy: { name: "asc" },
      }),

      this.prisma.file.findMany({
        where: { folderId },
        select: { id: true, name: true, sizeBytes: true, mimeType: true, type: true },
        orderBy: { name: "asc" },
      }),

      // Walk from folderId up to the share root, then reverse to get root→current order
      this.prisma.$queryRaw<{ id: string; name: string; depth: number }[]>`
        WITH RECURSIVE ancestors AS (
          SELECT id, name, "parentId", 0 AS depth
          FROM "Folder"
          WHERE id = ${folderId}

          UNION ALL

          SELECT f.id, f.name, f."parentId", a.depth + 1
          FROM "Folder" f
          INNER JOIN ancestors a ON f.id = a."parentId"
          WHERE a.id != ${link.folderId}
        )
        SELECT id, name, depth FROM ancestors ORDER BY depth DESC
      `,
    ]);

    return {
      folder,
      children,
      files,
      // breadcrumbs goes from share root down to current folder
      breadcrumbs: breadcrumbs.map(({ id, name }) => ({ id, name })),
    };
  }

  // Presigned download for the shared file, or any file inside a shared folder tree
  async getPublicDownloadUrl(token: string, fileId: string) {
    const link = await this.getValidLink(token);

    let file;

    if (link.fileId) {
      if (fileId && fileId !== link.fileId) {
        throw new ErrorResponse("File not found within this shared link.", 404);
      }

      file = await this.prisma.file.findUnique({ where: { id: link.fileId } });
    } else if (link.folderId) {
      file = await this.prisma.file.findUnique({ where: { id: fileId } });

      if (!file) throw new ErrorResponse("File not found.", 404);

      const isWithin = await this.isWithinSharedFolder(link.folderId, link.userId, file.folderId);

      if (!isWithin) throw new ErrorResponse("File not found within this shared link.", 404);
    }

    if (!file) throw new ErrorResponse("File not found.", 404);

    const url = await getSignedUrl(
      r2,
      new GetObjectCommand({
        Bucket: R2_BUCKET,
        Key: file.path,
        ResponseContentDisposition: `attachment; filename="${encodeURIComponent(file.name)}"`,
      }),
      { expiresIn: DOWNLOAD_URL_TTL_SECONDS },
    );

    return { url, name: file.name, mimeType: file.mimeType };
  }

  // Checks that `folderId` is `rootId` itself or a descendant of it, owned by `userId`
  private async isWithinSharedFolder(rootId: string, userId: string, folderId: string): Promise<boolean> {
    if (folderId === rootId) return true;

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
      SELECT id FROM folder_tree WHERE id = ${rootId}
    `;

    return results.length > 0;
  }
}