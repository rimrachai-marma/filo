import type { Request, Response } from "express";
import asyncHandler from "@/middleware/asyncHandler";
import { prisma } from "@/lib/prisma";
import { SubscriptionService } from "@/services/subscription";

export class SubscriptionController {
  private service = new SubscriptionService(prisma);

  getPackages = asyncHandler(async (_req: Request, res: Response) => {
    const packages = await this.service.getPackages();

    res.json({
      status: "success",
      message: "Packages retrieved successfully",
      data: packages,
    });
  });

  getUserSubscriptions = asyncHandler(async (req: Request, res: Response) => {
    const subscriptions = await this.service.getUserSubscriptions(req.user?.id!);

    res.json({
      status: "success",
      message: "Subscriptions retrieved successfully",
      data: subscriptions,
    });
  });

  createSubscription = asyncHandler(async (req: Request, res: Response) => {
    const { packageId } = req.body;

    const subscription = await this.service.createSubscription(req.user?.id!, packageId);

    res.status(201).json({
      status: "success",
      message: "Subscription created successfully",
      data: subscription,
    });
  });
}
