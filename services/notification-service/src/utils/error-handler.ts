/**
 * Simplified error handling utility for notification service
 */

/**
 * Error code constants
 */
export const ErrorCode = {
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  INVALID_REQUEST: 'INVALID_REQUEST',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  BAD_REQUEST: 'BAD_REQUEST',
} as const;

type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode];

/**
 * Logger for errors with context
 */
function logError(context: string, error: unknown, additionalContext?: Record<string, any>) {
  const errorObj = error instanceof Error ? error : new Error(String(error));
  const logEntry = {
    level: 'error',
    timestamp: new Date().toISOString(),
    context,
    message: errorObj.message,
    stack: errorObj.stack,
    ...(additionalContext && { additionalContext }),
  };

  console.error(JSON.stringify(logEntry));
}

/**
 * Logger for informational messages
 */
function logInfo(context: string, details?: Record<string, any>) {
  const logEntry = {
    level: 'info',
    timestamp: new Date().toISOString(),
    context,
    ...details,
  };

  console.log(JSON.stringify(logEntry));
}

/**
 * Logger for warning messages
 */
function logWarn(context: string, details?: Record<string, any>) {
  const logEntry = {
    level: 'warn',
    timestamp: new Date().toISOString(),
    context,
    ...details,
  };

  console.warn(JSON.stringify(logEntry));
}

/**
 * Create a structured error object
 */
function createError(
  code: string,
  message: string,
  statusCode: number = 500,
  context?: Record<string, any>,
  originalError?: Error
) {
  return {
    code,
    message,
    statusCode,
    context,
    originalError,
    timestamp: new Date().toISOString(),
    retryable: statusCode >= 500,
  };
}

/**
 * Format error response for API
 */
function formatErrorResponse(error: any) {
  return {
    success: false,
    error: error.message || 'Internal Server Error',
    code: error.code || 'INTERNAL_ERROR',
    ...(error.context && { details: error.context }),
  };
}
