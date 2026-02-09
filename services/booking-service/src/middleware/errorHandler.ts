import { Request, Response, NextFunction } from 'express';
import { 
  ValidationError, 
  NotFoundError, 
  ConflictError, 
  ForbiddenError, 
  UnauthorizedError, 
  PaymentRequiredError, 
  TooManyRequestsError, 
  InternalServerError,
  ErrorResponse 
} from '../types/errors';

// Custom error classes for better error handling
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Error occurred:', error);

  // Handle specific error types
  if (error instanceof ValidationError) {
    res.status(400).json({
      success: false,
      error: error.message,
      code: 'VALIDATION_ERROR',
      details: { field: error.field },
      timestamp: new Date().toISOString(),
      path: req.path
    } as ErrorResponse);
    return;
  }

  if (error instanceof NotFoundError) {
    res.status(404).json({
      success: false,
      error: error.message,
      code: 'NOT_FOUND',
      details: { resource: error.resource },
      timestamp: new Date().toISOString(),
      path: req.path
    } as ErrorResponse);
    return;
  }

  if (error instanceof ConflictError) {
    res.status(409).json({
      success: false,
      error: error.message,
      code: 'CONFLICT',
      details: { resource: error.resource },
      timestamp: new Date().toISOString(),
      path: req.path
    } as ErrorResponse);
    return;
  }

  if (error instanceof ForbiddenError) {
    res.status(403).json({
      success: false,
      error: error.message,
      code: 'FORBIDDEN',
      timestamp: new Date().toISOString(),
      path: req.path
    } as ErrorResponse);
    return;
  }

  if (error instanceof UnauthorizedError) {
    res.status(401).json({
      success: false,
      error: error.message,
      code: 'UNAUTHORIZED',
      timestamp: new Date().toISOString(),
      path: req.path
    } as ErrorResponse);
    return;
  }

  if (error instanceof PaymentRequiredError) {
    res.status(402).json({
      success: false,
      error: error.message,
      code: 'PAYMENT_REQUIRED',
      timestamp: new Date().toISOString(),
      path: req.path
    } as ErrorResponse);
    return;
  }

  if (error instanceof TooManyRequestsError) {
    res.status(429).json({
      success: false,
      error: error.message,
      code: 'TOO_MANY_REQUESTS',
      timestamp: new Date().toISOString(),
      path: req.path
    } as ErrorResponse);
    return;
  }

  if (error instanceof InternalServerError) {
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'INTERNAL_SERVER_ERROR',
      details: error.originalError ? { originalError: error.originalError.message } : undefined,
      timestamp: new Date().toISOString(),
      path: req.path
    } as ErrorResponse);
    return;
  }

  // Handle Prisma errors
  if (error.name === 'PrismaClientKnownRequestError') {
    const prismaError = error as any;
    switch (prismaError.code) {
      case 'P2002':
        res.status(409).json({
          success: false,
          error: 'Unique constraint violation',
          code: 'DUPLICATE_ENTRY',
          details: { fields: prismaError.meta?.target },
          timestamp: new Date().toISOString(),
          path: req.path
        } as ErrorResponse);
        return;
      case 'P2025':
        res.status(404).json({
          success: false,
          error: 'Record not found',
          code: 'RECORD_NOT_FOUND',
          timestamp: new Date().toISOString(),
          path: req.path
        } as ErrorResponse);
        return;
      default:
        res.status(400).json({
          success: false,
          error: 'Database error',
          code: 'DATABASE_ERROR',
          details: { prismaCode: prismaError.code },
          timestamp: new Date().toISOString(),
          path: req.path
        } as ErrorResponse);
        return;
    }
  }

  // Handle validation errors from express-validator
  if (error.name === 'ValidationError') {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      code: 'VALIDATION_FAILED',
      details: { errors: error.message },
      timestamp: new Date().toISOString(),
      path: req.path
    } as ErrorResponse);
    return;
  }

  // Handle JSON parsing errors
  if (error.name === 'SyntaxError' && error.message.includes('JSON')) {
    res.status(400).json({
      success: false,
      error: 'Invalid JSON format',
      code: 'INVALID_JSON',
      timestamp: new Date().toISOString(),
      path: req.path
    } as ErrorResponse);
    return;
  }

  // Default error response
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : error.message,
    code: 'UNHANDLED_ERROR',
    details: process.env.NODE_ENV === 'development' ? { stack: error.stack } : undefined,
    timestamp: new Date().toISOString(),
    path: req.path
  } as ErrorResponse);
};

// Async error handler wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 404 Not Found handler
export const notFound = (req: Request, res: Response, next: NextFunction): void => {
  const error = new NotFoundError(`Route ${req.originalUrl} not found`);
  next(error);
};