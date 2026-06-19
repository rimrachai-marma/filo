import type { Request, Response } from "express";
import asyncHandler from "@/middleware/asyncHandler";
import { prisma } from "@/lib/prisma";
import { AuthService } from "@/services/auth";
import { extractBearer } from "@/utils/helpers";

const REFRESH_COOKIE = "user_refresh_token";
const ACCESS_COOKIE = "user_access_token";

const baseCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  domain: process.env.NODE_ENV === "production" ? process.env.COOKIE_DOMAIN : undefined,
  path: "/",
};

const cookieOptions = (maxAgeMs: number) => ({ ...baseCookieOptions, maxAge: maxAgeMs });

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService(prisma);
  }

  signup = asyncHandler(async (req: Request, res: Response) => {
    const { name, email, password } = req.body;
    await this.authService.signup(name, email, password);
    res.status(201).json({
      status: "success",
      message: "Registration successful! Please verify your email before logging in.",
    });
  });

  verifyEmail = asyncHandler(async (req: Request, res: Response) => {
    const { token } = req.body;
    await this.authService.verifyEmail(token);
    res.json({
      status: "success",
      message: "Email verified successfully! You can now log in.",
    });
  });

  login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const userAgent = req.headers["user-agent"];
    const ipAddress = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ?? req.socket.remoteAddress;

    const { accessToken, refreshToken, user } = await this.authService.login(email, password, userAgent, ipAddress);

    res.cookie(ACCESS_COOKIE, accessToken, cookieOptions(15 * 60 * 1000)); // 15m
    res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions(30 * 24 * 60 * 60 * 1000)); // 30d

    res.json({
      status: "success",
      message: "Logged in successfully",
      data: {
        ...user,
        accessToken: { token: accessToken, tokenType: "Bearer" },
        refreshToken: { token: refreshToken, tokenType: "Bearer" },
      },
    });
  });

  verify = asyncHandler(async (req: Request, res: Response) => {
    res.json({
      status: "success",
      message: "Session is valid.",
      data: req.user,
    });
  });

  refresh = asyncHandler(async (req: Request, res: Response) => {
    const incomingToken: string | undefined = req.cookies?.[REFRESH_COOKIE];

    if (!incomingToken) {
      res.status(401).json({ status: "error", message: "No refresh token" });
      return;
    }

    const userAgent = req.headers["user-agent"];
    const ipAddress = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ?? req.socket.remoteAddress;

    const { accessToken, refreshToken } = await this.authService.refresh(incomingToken, userAgent, ipAddress);

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
    await this.authService.logout(refreshToken);

    res.clearCookie(ACCESS_COOKIE, baseCookieOptions);
    res.clearCookie(REFRESH_COOKIE, baseCookieOptions);

    res.json({ status: "success", message: "Logged out successfully" });
  });

  logoutAll = asyncHandler(async (req: Request, res: Response) => {
    await this.authService.logoutAll(req.user?.id!);

    res.clearCookie(ACCESS_COOKIE, baseCookieOptions);
    res.clearCookie(REFRESH_COOKIE, baseCookieOptions);

    res.json({ status: "success", message: "Logged out from all devices successfully" });
  });

  me = asyncHandler(async (req: Request, res: Response) => {
    const data = await this.authService.me(req.user?.id!);
    res.json({
      status: "success",
      message: "User retrieved successfully",
      data,
    });
  });

  forgotPassword = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;
    await this.authService.forgotPassword(email);
    res.json({
      status: "success",
      message: "If an account exists for this email, a reset link has been sent.",
    });
  });

  resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const { token, password } = req.body;
    await this.authService.resetPassword(token, password);
    res.json({ status: "success", message: "Password reset successfully. You can now log in." });
  });
}
