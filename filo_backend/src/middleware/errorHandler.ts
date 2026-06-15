import ErrorResponse from "@/utils/errorResponse";
import type { Request, Response, NextFunction } from "express";

export const routeNotFound = (req: Request, _: Response, next: NextFunction) => {
  const error = new ErrorResponse(`Not Found - ${req.method} - ${req.originalUrl}`, 404);

  next(error);
};

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.log("Error: ", err);

  let message = "Internal server error";
  let statusCode = err?.statusCode ?? 500;
  let errors = err?.errors ?? null;
  if (err instanceof ErrorResponse) message = err.message;

  if (err.code === "P2025") {
    statusCode = 404;
    message = "Resource not found";
  }

  if (err.code === "P2002") {
    statusCode = 409;
    message = "Resource already exists";
  }

  res.status(statusCode).json({
    status: "error",
    message,
    ...(errors && { errors }),
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};
