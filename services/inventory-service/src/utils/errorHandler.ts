import { Request, Response, NextFunction } from 'express';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

// Error codes for consistent error handling
export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  TIMEOUT = 'TIMEOUT',
  SUPPLIER_ERROR = 'SUPPLIER_ERROR',
  PRICING_RULE_ERROR = 'PRICING_RULE_ERROR',
  INTEGRATION_ERROR = 'INTEGRATION_ERROR'
}

// Custom error classes
export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(
    message: string,
    code: ErrorCode,
    statusCode: number = 500,
    isOperational: boolean = true,
    details?: unknown
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, ErrorCode.VALIDATION_ERROR, 400, true, details);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found', details?: unknown) {
    super(message, ErrorCode.NOT_FOUND, 404, true, details);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, ErrorCode.CONFLICT, 409, true, details);
  }
}

export class SupplierError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, ErrorCode.SUPPLIER_ERROR, 502, true, details);
  }
}

export class PricingRuleError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, ErrorCode.PRICING_RULE_ERROR, 422, true, details);
  }
}

export class IntegrationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, ErrorCode.INTEGRATION_ERROR, 503, true, details);
  }
}

// Error response interface
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
    timestamp: string;
    requestId?: string;
  };
}

// Global error handler middleware
export function globalErrorHandler(
  error: Error | AppError | PrismaClientKnownRequestError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  let appError = error as AppError;

  // Handle Prisma errors
  if (error instanceof PrismaClientKnownRequestError) {
    appError = handlePrismaError(error);
  }
  // Handle validation errors
  else if (error.name === 'ValidationError') {
    appError = new ValidationError(error.message);
  }
  // Handle unknown errors
  else if (!(error instanceof AppError)) {
    appError = new AppError(
      'An unexpected error occurred',
      ErrorCode.INTERNAL_ERROR,
      500,
      false,
      { originalError: error.message }
    );
  }

  // Log error details
  console.error(`[${new Date().toISOString()}] ${appError.code}: ${appError.message}`, {
    stack: appError.stack,
    details: appError.details,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Send error response
  const errorResponse: ErrorResponse = {
    success: false,
    error: {
      code: appError.code,
      message: appError.message,
      details: appError.details,
      timestamp: new Date().toISOString()
    }
  };

  // Add request ID if available
  if (req.headers['x-request-id']) {
    errorResponse.error.requestId = req.headers['x-request-id'] as string;
  }

  res.status(appError.statusCode).json(errorResponse);
}

// Handle Prisma-specific errors
function handlePrismaError(error: PrismaClientKnownRequestError): AppError {
  switch (error.code) {
    case 'P2002':
      return new ConflictError(
        'A record with this unique constraint already exists',
        { field: error.meta?.target }
      );
    case 'P2025':
      return new NotFoundError(
        'The requested record was not found',
        { cause: error.meta?.cause }
      );
    case 'P2003':
      return new ValidationError(
        'Foreign key constraint violation',
        { field: error.meta?.field_name }
      );
    case 'P2011':
      return new ValidationError(
        'Null constraint violation',
        { field: error.meta?.target }
      );
    case 'P2010':
      return new AppError(
        'Database operation failed',
        ErrorCode.INTERNAL_ERROR,
        500,
        true,
        { operation: error.meta?.operation }
      );
    default:
      return new AppError(
        'Database error occurred',
        ErrorCode.INTERNAL_ERROR,
        500,
        true,
        { prismaCode: error.code, meta: error.meta }
      );
  }
}

// Async error wrapper for route handlers
export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void> | void) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Supplier-specific error handlers
export class SupplierErrorHandler {
  static handleSupplierNotFound(supplierId: string): never {
    throw new NotFoundError(`Supplier with ID ${supplierId} not found`);
  }

  static handleVendorNotFound(vendorId: string): never {
    throw new NotFoundError(`API Vendor with ID ${vendorId} not found`);
  }

  static handlePricingRuleNotFound(ruleId: string): never {
    throw new NotFoundError(`Pricing rule with ID ${ruleId} not found`);
  }

  static handleSupplierInactive(supplierId: string): never {
    throw new AppError(
      `Supplier ${supplierId} is inactive and cannot process requests`,
      ErrorCode.FORBIDDEN,
      403,
      true
    );
  }

  static handleSupplierTimeout(supplierId: string, timeout: number): never {
    throw new SupplierError(
      `Supplier ${supplierId} timed out after ${timeout}ms`,
      { supplierId, timeout }
    );
  }

  static handleSupplierAuthError(supplierId: string, error: string): never {
    throw new SupplierError(
      `Authentication failed for supplier ${supplierId}: ${error}`,
      { supplierId, error }
    );
  }

  static handlePricingRuleConflict(ruleName: string): never {
    throw new ConflictError(
      `A pricing rule with name "${ruleName}" already exists`,
      { ruleName }
    );
  }

  static handleInvalidPricingRule(ruleData: unknown): never {
    throw new PricingRuleError(
      'Invalid pricing rule configuration',
      { ruleData }
    );
  }
}

// Search-specific error handlers
export class SearchErrorHandler {
  static handleSearchValidationError(params: unknown): never {
    throw new ValidationError(
      'Invalid search parameters',
      { params }
    );
  }

  static handleNoActiveSuppliers(serviceType: string): never {
    throw new SupplierError(
      `No active suppliers available for ${serviceType}`,
      { serviceType }
    );
  }

  static handleSearchTimeout(serviceType: string, timeout: number): never {
    throw new SupplierError(
      `Search for ${serviceType} timed out after ${timeout}ms`,
      { serviceType, timeout }
    );
  }

  static handleSupplierSearchError(supplierId: string, error: string): never {
    throw new SupplierError(
      `Search failed for supplier ${supplierId}: ${error}`,
      { supplierId, error }
    );
  }
}

// Validation error helpers
export function createValidationError(field: string, message: string, value?: unknown): ValidationError {
  return new ValidationError(`${field}: ${message}`, { field, value });
}

export function createMultipleValidationErrors(errors: Array<{ field: string; message: string; value?: unknown }>): ValidationError {
  const errorDetails = errors.map(err => ({
    field: err.field,
    message: err.message,
    value: err.value
  }));

  return new ValidationError(
    `Multiple validation errors found`,
    { errors: errorDetails }
  );
}

// Rate limiting error handler
export function handleRateLimitError(identifier: string, resetTime: number): never {
  throw new AppError(
    `Rate limit exceeded for ${identifier}`,
    ErrorCode.FORBIDDEN,
    429,
    true,
    { resetTime, retryAfter: Math.ceil((resetTime - Date.now()) / 1000) }
  );
}

