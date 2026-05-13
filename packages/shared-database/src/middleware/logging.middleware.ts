// ============================================================
// REQUEST LOGGING MIDDLEWARE
// ============================================================
// Structured logging for all API requests
// ============================================================

import { Request, Response, NextFunction } from 'express';

// ============================================================
// Request Logger
// ============================================================

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    
    const logData = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      query: req.query,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      requestId: req.headers['x-request-id'] || 'N/A',
    };

    // Color coding based on status code
    if (res.statusCode >= 500) {
      console.error(`[ERROR] ${JSON.stringify(logData)}`);
    } else if (res.statusCode >= 400) {
      console.warn(`[WARN] ${JSON.stringify(logData)}`);
    } else {
      console.log(`[INFO] ${JSON.stringify(logData)}`);
    }
  });

  next();
};

// ============================================================
// Request ID Middleware
// ============================================================

import { v4 as uuidv4 } from 'uuid';

export const requestId = (req: Request, res: Response, next: NextFunction) => {
  req.headers['x-request-id'] = uuidv4();
  res.setHeader('X-Request-ID', req.headers['x-request-id'] as string);
  next();
};

export default {
  requestLogger,
  requestId,
};