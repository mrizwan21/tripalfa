/**
 * Error Handler Middleware
 * Centralized error handling for all routes
 */

import { Request, Response, NextFunction } from 'express';
import { DocumentError } from '../models/types';

/**
 * Custom error response structure
 */
interface ErrorResponse {
  error: string;
  message: string;
  code?: string;
  statusCode?: number;
  details?: any;
  timestamp: string;
  path?: string;
}

/**
 * Global error handler middleware
 */
export function errorHandler(error: Error | DocumentError, req: Request, res: Response, _next: NextFunction): void {
  console.error('[ErrorHandler] Error:', error);

  const errorResponse: ErrorResponse = {
    error: error.name || 'Error',
    message: error.message || 'An unexpected error occurred',
    timestamp: new Date().toISOString(),
    path: req.path,
  };

  // Handle custom DocumentError exceptions
  if (error instanceof DocumentError) {
    errorResponse.code = error.code;
    errorResponse.statusCode = error.statusCode;

    res.status(error.statusCode).json(errorResponse);
    return;
  }

  // Handle validation errors
  if (error.name === 'ValidationError') {
    res.status(400).json({
      ...errorResponse,
      statusCode: 400,
      details: error instanceof Error ? error.message : error,
    });
    return;
  }

  // Handle database errors
  if (error.name === 'PrismaClientKnownRequestError') {
    const prismaError = error as any;

    switch (prismaError.code) {
      case 'P2002':
        res.status(409).json({
          ...errorResponse,
          message: 'Unique constraint violation',
          details: `Field already exists: ${prismaError.meta?.target}`,
          statusCode: 409,
        });
        return;

      case 'P2025':
        res.status(404).json({
          ...errorResponse,
          message: 'Record not found',
          statusCode: 404,
        });
        return;

      default:
        res.status(500).json({
          ...errorResponse,
          message: 'Database error',
          code: prismaError.code,
          statusCode: 500,
        });
        return;
    }
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    res.status(401).json({
      ...errorResponse,
      message: 'Invalid token',
      statusCode: 401,
    });
    return;
  }

  if (error.name === 'TokenExpiredError') {
    res.status(401).json({
      ...errorResponse,
      message: 'Token expired',
      statusCode: 401,
    });
    return;
  }

  // Handle Handlebars template errors
  if (error.name === 'SyntaxError' && error.message.includes('Parse error')) {
    res.status(400).json({
      ...errorResponse,
      message: 'Template syntax error',
      details: error.message,
      statusCode: 400,
    });
    return;
  }

  // Default to 500 Internal Server Error
  res.status(500).json({
    ...errorResponse,
    statusCode: 500,
    message: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : error.message,
  });
}

/**
 * 404 Not Found handler
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: 'Not Found',
    message: `Route not found: ${req.method} ${req.path}`,
    timestamp: new Date().toISOString(),
    statusCode: 404,
  });
}

/**
 * Request logging middleware
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;
    const level = statusCode >= 400 ? 'error' : 'info';

    console.log(`[${level.toUpperCase()}] ${req.method} ${req.path} - ${statusCode} (${duration}ms)`);
  });

  next();
}

/**
 * Request validation middleware
 */
export function validateContentType(req: Request, res: Response, next: NextFunction): void {
  // Only validate for POST, PATCH requests with body
  if (['POST', 'PATCH'].includes(req.method) && req.body && Object.keys(req.body).length > 0) {
    const contentType = req.headers['content-type'];

    if (!contentType || !contentType.includes('application/json')) {
      res.status(415).json({
        error: 'Unsupported Media Type',
        message: 'Content-Type must be application/json',
        timestamp: new Date().toISOString(),
        statusCode: 415,
      });
      return;
    }
  }

  next();
}

/**
 * Request sanitization middleware - prevent large payloads
 */
export function sanitizeRequest(req: Request, res: Response, next: NextFunction): void {
  // Limit JSON payload size
  const maxPayloadSize = 10 * 1024 * 1024; // 10MB

  if (req.headers['content-length']) {
    const contentLength = parseInt(req.headers['content-length']);

    if (contentLength > maxPayloadSize) {
      res.status(413).json({
        error: 'Payload Too Large',
        message: `Request body exceeds maximum size of ${maxPayloadSize} bytes`,
        timestamp: new Date().toISOString(),
        statusCode: 413,
      });
      return;
    }
  }

  next();
}
