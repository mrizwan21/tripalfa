/**
 * Custom error classes for the Offline Request Management System
 * Provides consistent error handling and HTTP status code mapping
 */

/**
 * Base class for all offline request errors
 */
export class OfflineRequestError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code: string,
    public details?: Record<string, any>,
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Convert error to API response format
   */
  toJSON() {
    return {
      error: this.code,
      message: this.message,
      statusCode: this.statusCode,
      ...(this.details && { details: this.details }),
    };
  }
}

/**
 * 400 Bad Request - Invalid request data
 */
export class ValidationError extends OfflineRequestError {
  constructor(message: string, details?: Record<string, any>) {
    super(400, message, "VALIDATION_ERROR", details);
  }
}

/**
 * 404 Not Found - Resource not found
 */
export class NotFoundError extends OfflineRequestError {
  constructor(message: string, details?: Record<string, any>) {
    super(404, message, "NOT_FOUND", details);
  }
}

/**
 * 409 Conflict - Invalid state transition or duplicate resource
 */
export class ConflictError extends OfflineRequestError {
  constructor(message: string, details?: Record<string, any>) {
    super(409, message, "CONFLICT", details);
  }
}

/**
 * 402 Payment Required - Payment processing failed
 */
export class PaymentError extends OfflineRequestError {
  constructor(message: string, details?: Record<string, any>) {
    super(402, message, "PAYMENT_FAILED", details);
  }
}

/**
 * 403 Forbidden - User lacks permission
 */
export class ForbiddenError extends OfflineRequestError {
  constructor(message: string, details?: Record<string, any>) {
    super(403, message, "FORBIDDEN", details);
  }
}

/**
 * 401 Unauthorized - Authentication required
 */
export class UnauthorizedError extends OfflineRequestError {
  constructor(message: string, details?: Record<string, any>) {
    super(401, message, "UNAUTHORIZED", details);
  }
}

/**
 * 422 Unprocessable Entity - Request understood but cannot be processed
 */
export class UnprocessableEntityError extends OfflineRequestError {
  constructor(message: string, details?: Record<string, any>) {
    super(422, message, "UNPROCESSABLE_ENTITY", details);
  }
}

/**
 * 429 Too Many Requests - Rate limit exceeded
 */
export class RateLimitError extends OfflineRequestError {
  constructor(
    message: string,
    retryAfter?: number,
    details?: Record<string, any>,
  ) {
    super(429, message, "RATE_LIMIT_EXCEEDED", {
      retryAfter,
      ...details,
    });
  }
}

/**
 * 500 Internal Server Error - Unexpected server error
 */
export class InternalServerError extends OfflineRequestError {
  constructor(message: string, details?: Record<string, any>) {
    super(500, message, "INTERNAL_SERVER_ERROR", details);
  }
}

/**
 * 503 Service Unavailable - Service temporarily unavailable
 */
export class ServiceUnavailableError extends OfflineRequestError {
  constructor(message: string, details?: Record<string, any>) {
    super(503, message, "SERVICE_UNAVAILABLE", details);
  }
}

/**
 * Check if an error is an OfflineRequestError
 */
export function isOfflineRequestError(
  error: any,
): error is OfflineRequestError {
  return error instanceof OfflineRequestError;
}

/**
 * Get HTTP status code from error
 */
export function getStatusCode(error: any): number {
  if (isOfflineRequestError(error)) {
    return error.statusCode;
  }
  return 500; // Default to internal server error
}

/**
 * Format error for API response
 */
export function formatErrorResponse(error: any) {
  if (isOfflineRequestError(error)) {
    return {
      success: false,
      error: error.code,
      message: error.message,
      ...(error.details && { details: error.details }),
    };
  }

  // Handle other error types
  if (error instanceof SyntaxError) {
    return {
      success: false,
      error: "VALIDATION_ERROR",
      message: "Invalid request format",
    };
  }

  return {
    success: false,
    error: "INTERNAL_SERVER_ERROR",
    message:
      process.env.NODE_ENV === "production"
        ? "An unexpected error occurred"
        : error.message,
  };
}

/**
 * Specific state transition errors
 */
export class InvalidStateTransitionError extends ConflictError {
  constructor(currentStatus: string, requestedAction: string) {
    super(
      `Cannot perform ${requestedAction} on request in ${currentStatus} status`,
      { currentStatus, requestedAction },
    );
  }
}

/**
 * Duplicate active request error
 */
export class DuplicateActiveRequestError extends ConflictError {
  constructor(bookingId: string) {
    super(`An active offline request already exists for booking ${bookingId}`, {
      bookingId,
    });
  }
}

/**
 * Missing pricing error
 */
export class MissingPricingError extends ConflictError {
  constructor(requestId: string) {
    super(`Pricing has not been submitted for request ${requestId}`, {
      requestId,
    });
  }
}

/**
 * Document generation error
 */
export class DocumentGenerationError extends InternalServerError {
  constructor(message: string, documentType?: string) {
    super(`Failed to generate ${documentType || "document"}: ${message}`, {
      documentType,
    });
  }
}

/**
 * Notification service error
 */
export class NotificationError extends ServiceUnavailableError {
  constructor(message: string, details?: Record<string, any>) {
    super(`Notification service error: ${message}`, details);
  }
}
