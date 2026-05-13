// ============================================================
// ERROR HANDLING MIDDLEWARE
// ============================================================
// Centralized error handling for the REST API
// ============================================================

import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

// ============================================================
// HTTP Error Class
// ============================================================

export class HttpError extends Error {
  status: number;
  code: string;
  details?: any;
  requestId: string;

  constructor(message: string, status: number = 500, code: string = 'INTERNAL_SERVER_ERROR', details?: any) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.requestId = uuidv4();
  }
}

// ============================================================
// Error Handler Middleware
// ============================================================

export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Generate request ID if not present
  const requestId = error.requestId || uuidv4();

  // Determine status code
  const status = error.status || 500;
  const code = error.code || 'INTERNAL_SERVER_ERROR';

  // Log error (in production, this would go to a logging service)
  console.error(`[${new Date().toISOString()}] Error ${status}:`, {
    requestId,
    method: req.method,
    path: req.path,
    message: error.message,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    details: error.details,
  });

  // Build error response based on OpenAPI specification
  const errorResponse: any = {
    error: code,
    message: error.message || 'Internal Server Error',
    requestId,
  };

  // Add details in development mode
  if (process.env.NODE_ENV === 'development' && error.details) {
    errorResponse.details = error.details;
  }

  // Send appropriate response
  res.status(status).json(errorResponse);
};

// ============================================================
// Async Error Wrapper
// ============================================================

export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// ============================================================
// Common Error Factories
// ============================================================

export const notFound = (message: string = 'Resource not found') => {
  return new HttpError(message, 404, 'NOT_FOUND');
};

export const badRequest = (message: string = 'Bad Request', details?: any) => {
  return new HttpError(message, 400, 'VALIDATION_FAILED', details);
};

export const unauthorized = (message: string = 'Unauthorized') => {
  return new HttpError(message, 401, 'UNAUTHORIZED');
};

export const forbidden = (message: string = 'Forbidden') => {
  return new HttpError(message, 403, 'FORBIDDEN');
};

export const conflict = (message: string = 'Conflict') => {
  return new HttpError(message, 409, 'CONFLICT');
};

export const tooManyRequests = (message: string = 'Too Many Requests') => {
  return new HttpError(message, 429, 'RATE_LIMIT_EXCEEDED');
};

export default {
  HttpError,
  errorHandler,
  asyncHandler,
  notFound,
  badRequest,
  unauthorized,
  forbidden,
  conflict,
  tooManyRequests,
};