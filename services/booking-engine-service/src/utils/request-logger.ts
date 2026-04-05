/**
 * Request/Response Logger with PII Masking (Phase 4)
 * 
 * Features:
 * - Request/response logging with correlation IDs
 * - Automatic PII (Personally Identifiable Information) masking
 * - Performance metrics tracking
 * - Error detail capture
 */

import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

// Fields to mask (sensitive information)
const SENSITIVE_FIELDS = new Set([
  'password',
  'token',
  'apikey',
  'authorization',
  'secret',
  'creditcard',
  'cardnumber',
  'cvv',
  'cvc',
  'ssn',
  'email',
  'phone',
  'phonenumber',
  'dateofbirth',
  'dob',
  'passport',
  'license',
  'bankaccount',
]);

// Paths that contain sensitive operations
const SENSITIVE_PATHS = [
  /login/i,
  /password/i,
  /authenticate/i,
  /token/i,
  /payment/i,
  /card/i,
  /subscription/i,
];

/**
 * Check if a path is sensitive
 */
function isSensitivePath(path: string): boolean {
  return SENSITIVE_PATHS.some(pattern => pattern.test(path));
}

/**
 * Check if a field name is sensitive
 */
function isSensitiveField(fieldName: string): boolean {
  return SENSITIVE_FIELDS.has(fieldName.toLowerCase());
}

/**
 * Recursively mask sensitive data in objects
 */
export function maskSensitiveData(
  obj: any,
  depth: number = 0,
  maxDepth: number = 10
): any {
  if (depth > maxDepth || !obj) return obj;
  if (typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(item => maskSensitiveData(item, depth + 1, maxDepth));
  }

  const masked: any = {};

  for (const [key, value] of Object.entries(obj)) {
    if (isSensitiveField(key)) {
      // Mask sensitive fields
      masked[key] = '***MASKED***';
    } else if (typeof value === 'object' && value !== null) {
      // Recursively process nested objects
      masked[key] = maskSensitiveData(value, depth + 1, maxDepth);
    } else if (typeof value === 'string' && value.length > 50) {
      // Truncate long strings
      masked[key] = value.substring(0, 50) + '...';
    } else {
      // Keep as is
      masked[key] = value;
    }
  }

  return masked;
}

/**
 * Request logger middleware
 */
export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Generate or retrieve request ID
  const requestId = req.headers['x-request-id'] as string || `req_${randomUUID()}`;
  (req as any).requestId = requestId;

  // Set response header
  res.setHeader('X-Request-ID', requestId);

  const startTime = Date.now();
  const isSensitive = isSensitivePath(req.path);

  // Store original send method
  const originalSend = res.send;
  let responseBody: any;

  // Override send to capture response
  res.send = function(data: any) {
    responseBody = data;
    return originalSend.call(this, data);
  };

  // Log when response is sent
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;

    logRequest({
      requestId,
      method: req.method,
      path: req.path,
      statusCode,
      duration,
      query: isSensitive ? maskSensitiveData(req.query) : req.query,
      body: isSensitive ? maskSensitiveData(req.body) : req.body,
      headers: isSensitive ? maskHeaders(req.headers) : undefined,
      userId: (req as any).userId,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      responseSize: responseBody ? JSON.stringify(responseBody).length : 0,
    });
  });

  next();
}

/**
 * Log request details
 */
function logRequest(details: Record<string, any>): void {
  const { statusCode, duration } = details;

  let logLevel = 'info';
  if (statusCode >= 500) {
    logLevel = 'error';
  } else if (statusCode >= 400) {
    logLevel = 'warn';
  } else if (duration > 1000) {
    logLevel = 'warn';
  }

  const logEntry = {
    timestamp: new Date().toISOString(),
    ...details,
  };

  if (logLevel === 'error') {
    console.error('[Request]', logEntry);
  } else if (logLevel === 'warn') {
    console.warn('[Request]', logEntry);
  } else {
    console.info('[Request]', logEntry);
  }
}

/**
 * Mask sensitive headers
 */
function maskHeaders(headers: Record<string, any>): Record<string, any> {
  const masked: Record<string, any> = {};

  for (const [key, value] of Object.entries(headers)) {
    if (
      key.toLowerCase().includes('authorization') ||
      key.toLowerCase().includes('password') ||
      key.toLowerCase().includes('token') ||
      key.toLowerCase().includes('api')
    ) {
      masked[key] = '***MASKED***';
    } else {
      masked[key] = value;
    }
  }

  return masked;
}

/**
 * Error logger middleware
 */
function errorLogger(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const requestId = (req as any).requestId || 'unknown';

  console.error('[Error]', {
    requestId,
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    statusCode: res.statusCode,
    message: err?.message || 'Unknown error',
    stack: err?.stack,
    userId: (req as any).userId,
    ip: req.ip,
  });

  next(err);
}

/**
 * Request timing middleware (for performance monitoring)
 */
function requestTiming(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const startTime = process.hrtime.bigint();

  res.on('finish', () => {
    const endTime = process.hrtime.bigint();
    const durationNs = endTime - startTime;
    const durationMs = Number(durationNs) / 1000000;

    if (durationMs > 1000) {
      console.warn('[Performance] Slow request:', {
        path: req.path,
        method: req.method,
        durationMs: durationMs.toFixed(2),
        statusCode: res.statusCode,
      });
    }

    // Add timing header
    res.setHeader('X-Response-Time', `${durationMs.toFixed(2)}ms`);
  });

  next();
}

/**
 * Get masked request summary (for logs/debugging)
 */
function getMaskedRequestSummary(req: Request): Record<string, any> {
  return {
    requestId: (req as any).requestId,
    method: req.method,
    path: req.path,
    query: maskSensitiveData(req.query),
    headers: maskHeaders(req.headers as Record<string, any>),
    userId: (req as any).userId,
    ip: req.ip,
  };
}

/**
 * HTTP status code description
 */
export const STATUS_DESCRIPTIONS: Record<number, string> = {
  200: 'OK',
  201: 'Created',
  204: 'No Content',
  301: 'Moved Permanently',
  302: 'Found',
  304: 'Not Modified',
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  409: 'Conflict',
  429: 'Too Many Requests',
  500: 'Internal Server Error',
  501: 'Not Implemented',
  502: 'Bad Gateway',
  503: 'Service Unavailable',
  504: 'Gateway Timeout',
};

/**
 * Get human-readable status description
 */
function getStatusDescription(statusCode: number): string {
  return STATUS_DESCRIPTIONS[statusCode] || 'Unknown';
}
