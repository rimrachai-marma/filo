import type { Request, Response, NextFunction } from "express";
import { jwtService } from "../lib/jwt";
import ErrorResponse from "@/utils/errorResponse";
import { extractBearer } from "@/utils/helpers";
import asyncHandler from "./asyncHandler";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
      };
      admin?: {
        id: string;
        email: string;
      };
    }
  }
}

export const auth = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies?.user_access_token || extractBearer(req);

  if (!token) {
    throw new ErrorResponse("Access denied. Authentication required", 401);
  }

  const payload = await jwtService.verify(token, "access");

  if (!payload || payload.role !== "user") {
    throw new ErrorResponse("Invalid or expired token.", 401);
  }

  req.user = {
    id: payload.id,
    email: payload.email,
  };

  next();
});

export const admin = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies?.admin_access_token || extractBearer(req);

  if (!token) {
    throw new ErrorResponse("Access denied. Admin authentication required", 401);
  }

  const payload = await jwtService.verify(token, "access");

  if (!payload || payload.role !== "admin") {
    throw new ErrorResponse("Invalid or expired admin token.", 401);
  }

  req.admin = {
    id: payload.id,
    email: payload.email,
  };

  next();
});