import type { Request, Response } from "express";
import asyncHandler from "@/middleware/asyncHandler";
import { prisma } from "@/lib/prisma";
import { AdminService } from "@/services/admin";
import { extractBearer } from "@/utils/helpers";

const REFRESH_COOKIE = "admin_refresh_token";
const ACCESS_COOKIE = "admin_access_token";

const cookieOptions = (maxAgeMs: number) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: maxAgeMs,
  domain: process.env.NODE_ENV === "production" ? process.env.COOKIE_DOMAIN : undefined,
  path: "/",
});

export class AdminController {
  private adminService: AdminService;

  constructor() {
    this.adminService = new AdminService(prisma);
  }

  login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const userAgent = req.headers["user-agent"];
    const ipAddress = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ?? req.socket.remoteAddress;

    const { accessToken, refreshToken, admin } = await this.adminService.login(email, password, userAgent, ipAddress);

    res.cookie(ACCESS_COOKIE, accessToken, cookieOptions(15 * 60 * 1000)); // 15m
    res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions(30 * 24 * 60 * 60 * 1000)); // 30d

    res.json({
      status: "success",
      message: "Admin logged in successfully",
      data: {
        ...admin,
        accessToken: { token: accessToken, tokenType: "Bearer" },
        refreshToken: { token: refreshToken, tokenType: "Bearer" },
      },
    });
  });

  verify = asyncHandler(async (req: Request, res: Response) => {
    res.json({
      status: "success",
      message: "Session is valid.",
      data: req.admin,
    });
  });

  refresh = asyncHandler(async (req: Request, res: Response) => {
    const incomingToken: string | undefined = req.cookies?.[REFRESH_COOKIE] ?? extractBearer(req);

    if (!incomingToken) {
      res.status(401).json({ status: "error", message: "Refresh token is required." });
      return;
    }

    const userAgent = req.headers["user-agent"];
    const ipAddress = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ?? req.socket.remoteAddress;

    const { accessToken, refreshToken } = await this.adminService.refresh(incomingToken, userAgent, ipAddress);

    res.cookie(ACCESS_COOKIE, accessToken, cookieOptions(15 * 60 * 1000)); // 15m
    res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions(30 * 24 * 60 * 60 * 1000)); // 30d

    res.json({
      status: "success",
      message: "Tokens refreshed successfully",
      data: {
        accessToken: { token: accessToken, tokenType: "Bearer" },
        refreshToken: { token: refreshToken, tokenType: "Bearer" },
      },
    });
  });

  logout = asyncHandler(async (req: Request, res: Response) => {
    const refreshToken: string | undefined = req.cookies?.[REFRESH_COOKIE] ?? extractBearer(req);
    await this.adminService.logout(refreshToken);

    res.clearCookie(ACCESS_COOKIE);
    res.clearCookie(REFRESH_COOKIE);

    res.json({ status: "success", message: "Logged out successfully" });
  });

  logoutAll = asyncHandler(async (req: Request, res: Response) => {
    await this.adminService.logoutAll(req.admin!.id);

    res.clearCookie(ACCESS_COOKIE);
    res.clearCookie(REFRESH_COOKIE);

    res.json({ status: "success", message: "Logged out from all devices successfully" });
  });

  getPackages = asyncHandler(async (_: Request, res: Response) => {
    const packages = await this.adminService.getPackages();
    res.json({
      status: "success",
      message: "Packages retrieved successfully",
      data: packages,
    });
  });

  addPackage = asyncHandler(async (req: Request, res: Response) => {
    const {
      name,
      displayName,
      maxFolders,
      maxNestingLevel,
      types,
      maxFileSizeBytes,
      totalFileLimit,
      filesPerFolder,
      storageLimitBytes,
      tierColor,
    } = req.body;

    const pkg = await this.adminService.addPackage(
      name,
      displayName,
      maxFolders,
      maxNestingLevel,
      types,
      maxFileSizeBytes,
      totalFileLimit,
      filesPerFolder,
      storageLimitBytes,
      tierColor,
    );

    res.status(201).json({
      status: "success",
      message: "Package created successfully",
      data: pkg,
    });
  });

  updatePackage = asyncHandler(async (req: Request, res: Response) => {
    const {
      displayName,
      maxFolders,
      maxNestingLevel,
      types,
      maxFileSizeBytes,
      totalFileLimit,
      filesPerFolder,
      storageLimitBytes,
      tierColor,
    } = req.body;

    const pkg = await this.adminService.updatePackage(
      req.params.id as string,
      displayName,
      maxFolders,
      maxNestingLevel,
      types,
      maxFileSizeBytes,
      totalFileLimit,
      filesPerFolder,
      storageLimitBytes,
      tierColor,
    );

    res.json({
      status: "success",
      message: "Package updated successfully",
      data: pkg,
    });
  });

  deletePackage = asyncHandler(async (req: Request, res: Response) => {
    await this.adminService.deletePackage(req.params.id as string);
    res.json({ status: "success", message: "Package deleted successfully" });
  });

  getUsers = asyncHandler(async (_: Request, res: Response) => {
    const users = await this.adminService.getUsers();
    res.json({
      status: "success",
      message: "Users retrieved successfully",
      data: users,
      meta: { total: users.length },
    });
  });
}
