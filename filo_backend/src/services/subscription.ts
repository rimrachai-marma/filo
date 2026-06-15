import type { PrismaClient } from "@/generated/prisma/client";

export class SubscriptionService {
  constructor(private prisma: PrismaClient) {}

  async getPackages() {
    return this.prisma.subscriptionPackage.findMany({
      orderBy: { totalFileLimit: "asc" },
    });
  }

  async getUserSubscriptions(userId: string) {
    return this.prisma.userSubscription.findMany({
      where: { userId },
      include: { package: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async createSubscription(userId: string, packageId: string) {
    const pkg = await this.prisma.subscriptionPackage.findUnique({
      where: { id: packageId },
    });

    if (!pkg) {
      throw new Error("Package not found.");
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.userSubscription.updateMany({
        where: { userId, isActive: true },
        data: { isActive: false, endDate: new Date() },
      });

      return tx.userSubscription.create({
        data: {
          userId,
          packageId,
          isActive: true,
        },
        include: { package: true },
      });
    });
  }
}
