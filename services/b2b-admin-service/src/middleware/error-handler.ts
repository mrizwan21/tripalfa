import { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";

// Custom error classes for better error handling
export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConflictError";
  }
}

export class ForbiddenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ForbiddenError";
  }
}

export class UnauthorizedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ServiceUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ServiceUnavailableError";
  }
}

// Enhanced error handler middleware
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  console.error("[B2BAdminService] Error:", {
    message: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  // Handle specific error types
  if (error instanceof ValidationError) {
    res.status(400).json({
      success: false,
      error: "Validation Error",
      message: error.message,
      field: error.field,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  if (error instanceof NotFoundError) {
    res.status(404).json({
      success: false,
      error: "Not Found",
      message: error.message,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  if (error instanceof ConflictError) {
    res.status(409).json({
      success: false,
      error: "Conflict",
      message: error.message,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  if (error instanceof ForbiddenError) {
    res.status(403).json({
      success: false,
      error: "Forbidden",
      message: error.message,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  if (error instanceof UnauthorizedError) {
    res.status(401).json({
      success: false,
      error: "Unauthorized",
      message: error.message,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  if (error instanceof ServiceUnavailableError) {
    res.status(503).json({
      success: false,
      error: "Service Unavailable",
      message: error.message,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Handle Prisma errors
  if (error.name === "PrismaClientKnownRequestError") {
    const prismaError = error as any;
    switch (prismaError.code) {
      case "P2002":
        res.status(409).json({
          success: false,
          error: "Duplicate Entry",
          message: "A record with this unique constraint already exists",
          field: prismaError.meta?.target,
          timestamp: new Date().toISOString(),
        });
        return;
      case "P2025":
        res.status(404).json({
          success: false,
          error: "Record Not Found",
          message: "The requested record does not exist",
          timestamp: new Date().toISOString(),
        });
        return;
      default:
        res.status(500).json({
          success: false,
          error: "Database Error",
          message: "An error occurred while accessing the database",
          timestamp: new Date().toISOString(),
        });
        return;
    }
  }

  // Handle JWT errors
  if (error.name === "JsonWebTokenError") {
    res.status(401).json({
      success: false,
      error: "Invalid Token",
      message: "The provided authentication token is invalid",
      timestamp: new Date().toISOString(),
    });
    return;
  }

  if (error.name === "TokenExpiredError") {
    res.status(401).json({
      success: false,
      error: "Token Expired",
      message: "The authentication token has expired",
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Default error response
  const isDev = process.env.NODE_ENV === "development";
  const exposeStackTraces = isDev && process.env.EXPOSE_STACK_TRACES !== "false";
  
  res.status(500).json({
    success: false,
    error: "Internal Server Error",
    message: isDev ? error.message : "An unexpected error occurred",
    ...(exposeStackTraces && {
      // Sanitize stack trace to remove absolute paths and reduce info leakage
      stack: error.stack
        ?.split("\n")
        .map((line) => {
          // Remove absolute paths, keep only relative paths from project root
          return line.replace(/\s+at\s+.*\s+\(([\/\\][^)]+)\)/g, (match, path) => {
            // Extract just the filename and relative path from 'services/' or 'packages/'
            const relativeMatch = path.match(/(services[\/\\][^)]+|packages[\/\\][^)]+|apps[\/\\][^)]+)/);
            return relativeMatch ? ` at (${relativeMatch[1]})` : " at (internal)";
          });
        })
        .join("\n"),
    }),
    timestamp: new Date().toISOString(),
    requestId: req.headers["x-request-id"] || "unknown",
  });
};

// Request logging middleware
export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const start = Date.now();
  
  // Log request
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`, {
    userAgent: req.get("User-Agent"),
    ip: req.ip,
    requestId: req.headers["x-request-id"],
  });

  // Log response
  res.on("finish", () => {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 400 ? "error" : "info";
    
    console[logLevel](`[${new Date().toISOString()}] ${res.statusCode} ${req.method} ${req.path}`, {
      duration: `${duration}ms`,
      requestId: req.headers["x-request-id"],
    });
  });

  next();
};

// Request ID middleware
export const requestId = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  // Use crypto.randomUUID() with fallback for older Node versions
  const generateUUID = (): string => {
    if (typeof randomUUID === "function") {
      return randomUUID();
    }
    // Fallback for Node < 14.17.0
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  };

  const requestId = (req.headers["x-request-id"] as string) || generateUUID();
  req.headers["x-request-id"] = requestId;
  res.setHeader("X-Request-ID", requestId);
  next();
};