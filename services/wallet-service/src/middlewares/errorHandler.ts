// src/middlewares/errorHandler.ts
// Global error handling middleware

import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger.js";

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  logger.error(`Error Handler: ${statusCode} - ${message}`, err);

  res.status(statusCode).json({
    success: false,
    error: message,
    code: err.code,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
}
