import type { Request, Response } from "express";
import asyncHandler from "@/middleware/asyncHandler";
import { prisma } from "@/lib/prisma";
import { StatsService } from "@/services/stats";

export class StatsController {
  private statsService = new StatsService(prisma);

  getStorageStats = asyncHandler(async (req: Request, res: Response) => {
    const stats = await this.statsService.getStorageStats(req.user!.id);

    res.json({
      status: "success",
      message: "Storage stats retrieved successfully",
      data: stats,
    });
  });
}