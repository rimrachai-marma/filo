import type { PrismaClient, FileType } from "@/generated/prisma/client";
import { PlanEnforcementService } from "./plan";

export class StatsService {
  private plan: PlanEnforcementService;

  constructor(private prisma: PrismaClient) {
    this.plan = new PlanEnforcementService(prisma);
  }

  async getStorageStats(userId: string) {
    const pkg = await this.plan.getUserActivePackage(userId);

    const [byType, totals, folderCount, topFiles] = await Promise.all([
      this.prisma.file.groupBy({
        by: ["type"],
        where: { userId },
        _sum: { sizeBytes: true },
        _count: { _all: true },
      }),

      this.prisma.file.aggregate({
        where: { userId },
        _sum: { sizeBytes: true },
        _count: { _all: true },
      }),

      this.prisma.folder.count({ where: { userId } }),
      
      this.prisma.file.findMany({
        where: { userId },
        orderBy: { sizeBytes: "desc" },
        take: 5,
        select: { id: true, name: true, sizeBytes: true, type: true, folderId: true },
      }),
    ]);

    const usedBytes = BigInt(totals._sum.sizeBytes ?? 0);
    const limitBytes = pkg?.storageLimitBytes ?? BigInt(0);

    const breakdown: Record<FileType, { sizeBytes: number; count: number }> = {
      IMAGE: { sizeBytes: 0, count: 0 },
      VIDEO: { sizeBytes: 0, count: 0 },
      PDF: { sizeBytes: 0, count: 0 },
      AUDIO: { sizeBytes: 0, count: 0 },
    };

    for (const row of byType) {
      breakdown[row.type] = {
        sizeBytes: row._sum.sizeBytes ?? 0,
        count: row._count._all,
      };
    }

    return {
      usedBytes: usedBytes.toString(),
      limitBytes: limitBytes.toString(),
      percentUsed: limitBytes > 0n ? Number((usedBytes * BigInt(10000)) / limitBytes) / 100 : 0,
      totalFiles: totals._count._all,
      totalFolders: folderCount,
      byType: breakdown,
      topFiles,
      package: pkg ? { name: pkg.name, displayName: pkg.displayName, tierColor: pkg.tierColor } : null,
    };
  }
}