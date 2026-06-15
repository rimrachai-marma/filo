import { FileType, PrismaClient, type SubscriptionPackage } from "@/generated/prisma/client";
import { formatData } from "@/utils/formatter";

export class PlanEnforcementService {
  constructor(private prisma: PrismaClient) {}

  async getUserActivePackage(userId: string) {
    const sub = await this.prisma.userSubscription.findFirst({
      where: { userId, isActive: true },
      include: { package: true },
      orderBy: { createdAt: "desc" },
    });
    return sub?.package ?? null;
  }

  private checkFolderCreation(pkg: SubscriptionPackage, folderCount: number): { allowed: boolean; reason?: string } {
    if (folderCount >= pkg.maxFolders) {
      return {
        allowed: false,
        reason: `Your ${pkg.displayName} plan allows a maximum of ${pkg.maxFolders} folders.`,
      };
    }
    return { allowed: true };
  }

  async checkFolderCreationAllowed(userId: string) {
    const pkg = await this.getUserActivePackage(userId);
    if (!pkg) return { allowed: false, reason: "No active subscription." };

    const count = await this.prisma.folder.count({ where: { userId } });
    return this.checkFolderCreation(pkg, count);
  }

  /**
   * Checks whether placing a folder (or a subtree) under `parentId` is allowed
   * given the plan's maxNestingLevel.
   *
   * @param userId the owner's user id
   * @param parentId the target parent folder id, or null for root
   * @param extraDepth the height of the subtree being placed under `parentId`.
   *   - 0 for a brand-new leaf folder (createFolder default).
   *   - For moveFolder, this should be the height of the subtree rooted at the
   *     folder being moved (0 if it has no children, 1 if it has children but
   *     no grandchildren, etc.) so that the deepest descendant's resulting
   *     depth is checked, not just the target parent's depth.
   *
   * Depth convention: a root-level folder (parentId === null) has depth 1.
   * A folder placed under `parentId` has depth = depth(parentId) + 1.
   * The deepest resulting node has depth = depth(parentId) + 1 + extraDepth.
   * This must satisfy: depth(parentId) + 1 + extraDepth <= pkg.maxNestingLevel
   */
  async checkNestingAllowed(userId: string, parentId: string | null, extraDepth: number = 0) {
    const pkg = await this.getUserActivePackage(userId);
    if (!pkg) return { allowed: false, reason: "No active subscription." };

    if (!parentId) {
      // New/moved subtree would sit at root (depth 1), with descendants going
      // down to depth (1 + extraDepth).
      if (1 + extraDepth > pkg.maxNestingLevel) {
        return {
          allowed: false,
          reason: `Your ${pkg.displayName} plan allows a maximum nesting depth of ${pkg.maxNestingLevel}.`,
        };
      }
      return { allowed: true };
    }

    const result = await this.prisma.$queryRaw<{ depth: number }[]>`
      WITH RECURSIVE folder_tree AS (
        -- Anchor: start at the target folder, depth = 1
        SELECT id, "parentId", 1 AS depth
        FROM "Folder"
        WHERE id = ${parentId} AND "userId" = ${userId}

        UNION ALL

        -- Walk UPWARD to root (child -> parent)
        SELECT f.id, f."parentId", ft.depth + 1
        FROM "Folder" f
        INNER JOIN folder_tree ft ON f.id = ft."parentId"
      )
      SELECT MAX(depth) AS depth FROM folder_tree;
    `;

    const currentDepth = Number(result[0]?.depth ?? 1);

    // currentDepth is the depth of parentId from root.
    // The new/moved subtree's root will be at currentDepth + 1.
    // Its deepest descendant will be at currentDepth + 1 + extraDepth.
    // So if maxNestingLevel = 3, currentDepth + 1 + extraDepth must be <= 3.
    if (currentDepth + 1 + extraDepth > pkg.maxNestingLevel) {
      return {
        allowed: false,
        reason: `Your ${pkg.displayName} plan allows a maximum nesting depth of ${pkg.maxNestingLevel}.`,
      };
    }

    return { allowed: true };
  }

  mimeToFileType(mimeType: string): FileType | null {
    if (mimeType.startsWith("image/")) return FileType.IMAGE;
    if (mimeType.startsWith("video/")) return FileType.VIDEO;
    if (mimeType === "application/pdf") return FileType.PDF;
    if (mimeType.startsWith("audio/")) return FileType.AUDIO;
    return null;
  }

  async checkFileUploadAllowed(userId: string, folderId: string, mimeType: string, sizeBytes: number) {
    const pkg = await this.getUserActivePackage(userId);
    if (!pkg) return { allowed: false, reason: "No active subscription." };

    const fileType = this.mimeToFileType(mimeType);
    if (!fileType) return { allowed: false, reason: "Unsupported file type." };

    if (!pkg.allowedFileTypes.includes(fileType)) {
      return {
        allowed: false,
        reason: `Your ${pkg.displayName} plan does not allow ${fileType} files.`,
      };
    }

    if (sizeBytes > pkg.maxFileSizeBytes) {
      return {
        allowed: false,
        reason: `File exceeds the ${formatData(BigInt(pkg.maxFileSizeBytes))} per-file limit.`,
      };
    }

    const [totalFiles, folderFiles, storageResult] = await Promise.all([
      this.prisma.file.count({ where: { userId } }),
      this.prisma.file.count({ where: { folderId } }),
      this.prisma.file.aggregate({
        where: { userId },
        _sum: { sizeBytes: true },
      }),
    ]);

    if (totalFiles >= pkg.totalFileLimit) {
      return {
        allowed: false,
        reason: `You've reached the ${pkg.totalFileLimit} file limit.`,
      };
    }

    if (folderFiles >= pkg.filesPerFolder) {
      return {
        allowed: false,
        reason: `This folder has reached the ${pkg.filesPerFolder} file limit.`,
      };
    }

    // sizeBytes is Int so _sum returns number | null
    const usedBytes = storageResult._sum.sizeBytes ?? 0;
    const usedBytesTotal = BigInt(usedBytes) + BigInt(sizeBytes);

    if (usedBytesTotal > pkg.storageLimitBytes) {
      const remaining = pkg.storageLimitBytes - BigInt(usedBytes);
      const remainingClamped = remaining > BigInt(0) ? remaining : BigInt(0);
      return {
        allowed: false,
        reason: `Not enough storage. You have ${formatData(remainingClamped)} remaining on your ${pkg.displayName} plan.`,
      };
    }

    return { allowed: true, fileType };
  }
}
