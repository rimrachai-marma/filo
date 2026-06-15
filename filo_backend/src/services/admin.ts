import bcrypt from "bcryptjs";
import { jwtService } from "@/lib/jwt";
import ErrorResponse from "@/utils/errorResponse";
import type { FileType, PrismaClient } from "@/generated/prisma/client";

export class AdminService {
  constructor(private prisma: PrismaClient) {}

  // AUTHENTICATION
  async login(email: string, password: string, userAgent?: string, ipAddress?: string) {
    const admin = await this.prisma.admin.findUnique({ where: { email } });

    if (!admin || !(await bcrypt.compare(password, admin.password))) {
      throw new ErrorResponse("Invalid credentials", 401);
    }
    const accessToken = await jwtService.sign(admin.id, admin.email, "admin", "access");
    const refreshToken = await jwtService.sign(admin.id, admin.email, "admin", "refresh");

    await this.prisma.adminRefreshToken.create({
      data: {
        adminId: admin.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        userAgent: userAgent ?? null,
        ipAddress: ipAddress ?? null,
      },
    });
    return { accessToken, refreshToken, admin };
  }

  async refresh(incomingToken: string, userAgent?: string, ipAddress?: string) {
    const payload = await jwtService.verify(incomingToken, "refresh");

    if (!payload || payload.role !== "admin") {
      throw new ErrorResponse("Invalid or expired refresh token.", 401);
    }

    // Look up in DB
    const record = await this.prisma.adminRefreshToken.findUnique({
      where: { token: incomingToken },
    });

    if (!record || record.revokedAt !== null || record.expiresAt < new Date()) {
      // If token exists but is revoked, it may indicate token theft — revoke all for this user
      if (record && record.revokedAt === null) {
        await this.prisma.adminRefreshToken.updateMany({
          where: { adminId: payload.id, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      }
      throw new ErrorResponse("Refresh token is invalid, expired, or has been revoked.", 401);
    }

    // Rotate: revoke old token
    await this.prisma.adminRefreshToken.update({
      where: { token: incomingToken },
      data: { revokedAt: new Date() },
    });

    // Issue new token pair
    const accessToken = await jwtService.sign(payload.id, payload.email, "admin", "access");
    const newRefreshToken = await jwtService.sign(payload.id, payload.email, "admin", "refresh");

    await this.prisma.adminRefreshToken.create({
      data: {
        adminId: payload.id,
        token: newRefreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        userAgent: userAgent ?? null,
        ipAddress: ipAddress ?? null,
      },
    });

    return { accessToken, refreshToken: newRefreshToken };
  }

  async logout(refreshToken?: string) {
    if (!refreshToken) return;

    await this.prisma.adminRefreshToken.updateMany({
      where: { token: refreshToken, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async logoutAll(adminId: string) {
    await this.prisma.adminRefreshToken.updateMany({
      where: { adminId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  // SUBSCRIPTION PACKAGES
  async getPackages() {
    return this.prisma.subscriptionPackage.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        _count: {
          select: { userSubscriptions: { where: { isActive: true } } },
        },
      },
    });
  }

  async addPackage(
    name: string,
    displayName: string,
    maxFolders: number,
    maxNestingLevel: number,
    types: FileType[],
    maxFileSizeBytes: number,
    totalFileLimit: number,
    filesPerFolder: number,
    storageLimitBytes: bigint,
    tierColor: string,
  ) {
    return await this.prisma.subscriptionPackage.create({
      data: {
        name: name.toUpperCase(),
        displayName,
        maxFolders,
        maxNestingLevel,
        allowedFileTypes: types,
        maxFileSizeBytes,
        totalFileLimit,
        filesPerFolder,
        storageLimitBytes,
        tierColor,
      },
    });
  }

  async updatePackage(
    id: string,
    displayName?: string,
    maxFolders?: number,
    maxNestingLevel?: number,
    types?: FileType[],
    maxFileSizeBytes?: number,
    totalFileLimit?: number,
    filesPerFolder?: number,
    storageLimitBytes?: bigint,
    tierColor?: string,
  ) {
    return await this.prisma.subscriptionPackage.update({
      where: { id },
      data: {
        ...(displayName !== undefined && { displayName }),
        ...(maxFolders !== undefined && { maxFolders }),
        ...(maxNestingLevel !== undefined && { maxNestingLevel }),
        ...(types !== undefined && types.length > 0 && { allowedFileTypes: types }),
        ...(maxFileSizeBytes !== undefined && { maxFileSizeBytes }),
        ...(totalFileLimit !== undefined && { totalFileLimit }),
        ...(filesPerFolder !== undefined && { filesPerFolder }),
        ...(storageLimitBytes !== undefined && { storageLimitBytes }),
        ...(tierColor !== undefined && { tierColor }),
      },
    });
  }

  async deletePackage(id: string) {
    // const activeCount = await this.prisma.userSubscription.count({
    //   where: { packageId: id, isActive: true },
    // });
    // if (activeCount > 0) {
    //   throw new ErrorResponse("Cannot delete package with active user subscriptions", 400);
    // }

    const activeCount = await this.prisma.userSubscription.count({
      where: { packageId: id },
    });
    if (activeCount > 0) {
      throw new ErrorResponse("Cannot delete package with existing subscriptions (active or historical)", 400);
    }

    await this.prisma.subscriptionPackage.delete({ where: { id } });
  }

  // USER MANAGEMENT
  async getUsers() {
    return await this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        createdAt: true,
        subscriptions: {
          where: { isActive: true },
          include: { package: true },
          take: 1,
        },
        _count: { select: { folders: true, files: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }
}
