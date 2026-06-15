import type { Response } from "express";

interface Pagination {
  page: number;
  pages: number;
  perPage: number;
  total: number;
}

interface Meta {
  timestamp: string;
  pagination?: Pagination;
}

export const sendSuccessQuery = <T>(res: Response, message: string, data: T, pagination?: Pagination) => {
  const meta: Meta = {
    timestamp: new Date().toISOString(),
    ...(pagination && { pagination }),
  };

  return res.status(200).json({
    status: "success",
    message,
    data,
    meta,
  });
};

export const sendSuccessMutation = <T>(res: Response, message: string, data?: T, statusCode = 200) => {
  const meta: Meta = {
    timestamp: new Date().toISOString(),
  };

  return res.status(statusCode).json({
    status: "success",
    message,
    ...(data !== undefined && { data }),
    meta
  });
};