import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

import { jwtService } from "@/lib/jwt";
import ErrorResponse from "@/utils/errorResponse";
import { EmailService } from "./email";
import type { PrismaClient } from "@/generated/prisma/client";

export class AuthService {
  private emailService: EmailService;

  constructor(private prisma: PrismaClient) {
    this.emailService = new EmailService();
  }

  async signup(name: string, email: string, password: string) {
    const existing = await this.prisma.user.findUnique({ where: { email } });

    if (existing) {
      throw new ErrorResponse("An account with this email already exists.", 409);
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await this.prisma.user.create({
      data: { name, email, password: hashed },
    });

    const token = randomUUID();
    await this.prisma.emailVerificationToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    await this.emailService.sendVerificationEmail(email, token, name);
  }

  async verifyEmail(token: string) {
    const record = await this.prisma.emailVerificationToken.findUnique({ where: { token } });

    if (!record || record.expiresAt < new Date()) {
      throw new ErrorResponse("Invalid or expired verification token.", 400);
    }

    await this.prisma.user.update({
      where: { id: record.userId },
      data: { emailVerified: true },
    });

    await this.prisma.emailVerificationToken.delete({ where: { token } });
  }

  async login(email: string, password: string, userAgent?: string, ipAddress?: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new ErrorResponse("Invalid credentials.", 401);
    }

    if (!user.emailVerified) {
      throw new ErrorResponse("Please verify your email before logging in.", 403);
    }

    const accessToken = await jwtService.sign(user.id, user.email, "user", "access");
    const refreshToken = await jwtService.sign(user.id, user.email, "user", "refresh");

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        userAgent: userAgent ?? null,
        ipAddress: ipAddress ?? null,
      },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    };
  }

  async refresh(incomingToken: string, userAgent?: string, ipAddress?: string) {
    const payload = await jwtService.verify(incomingToken, "refresh");

    if (!payload || payload.role !== "user") {
      throw new ErrorResponse("Invalid or expired refresh token.", 401);
    }

    // Look up in DB
    const record = await this.prisma.refreshToken.findUnique({
      where: { token: incomingToken },
    });

    if (!record || record.revokedAt !== null || record.expiresAt < new Date()) {
      // If token exists but is revoked, it may indicate token theft — revoke all for this user
      if (record && record.revokedAt === null) {
        await this.prisma.refreshToken.updateMany({
          where: { userId: payload.id, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      }
      throw new ErrorResponse("Refresh token is invalid, expired, or has been revoked.", 401);
    }

    // Rotate: revoke old token
    await this.prisma.refreshToken.update({
      where: { token: incomingToken },
      data: { revokedAt: new Date() },
    });

    // Issue new token pair
    const accessToken = await jwtService.sign(payload.id, payload.email, "user", "access");
    const newRefreshToken = await jwtService.sign(payload.id, payload.email, "user", "refresh");

    await this.prisma.refreshToken.create({
      data: {
        userId: payload.id,
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

    await this.prisma.refreshToken.updateMany({
      where: { token: refreshToken, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async logoutAll(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new ErrorResponse("User not found.", 404);
    }

    const subscription = await this.prisma.userSubscription.findFirst({
      where: { userId, isActive: true },
      include: { package: true },
      orderBy: { createdAt: "desc" },
    });

    return { user, subscription };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return;

    await this.prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

    const token = randomUUID();
    await this.prisma.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    await this.emailService.sendPasswordResetEmail(email, token);
  }

  async resetPassword(token: string, password: string) {
    if (!token || !password) {
      throw new ErrorResponse("Token and password are required.", 400);
    }

    if (password.length < 8) {
      throw new ErrorResponse("Password must be at least 8 characters.", 400);
    }

    const record = await this.prisma.passwordResetToken.findUnique({ where: { token } });

    if (!record || record.expiresAt < new Date()) {
      throw new ErrorResponse("Invalid or expired reset token.", 400);
    }

    const hashed = await bcrypt.hash(password, 10);

    await this.prisma.user.update({
      where: { id: record.userId },
      data: { password: hashed },
    });

    // Revoke all refresh tokens on password reset for security
    await this.prisma.refreshToken.updateMany({
      where: { userId: record.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    await this.prisma.passwordResetToken.delete({ where: { token } });
  }
}
