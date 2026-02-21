/**
 * @tripalfa/notifications - Middleware
 * Middleware for notification routes (auth, validation, error handling)
 */

import { Request, Response, NextFunction } from 'express';
import { Logger } from 'pino';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role?: string;
    permissions?: string[];
  };
}

/**
 * Authentication middleware stub
 * To be used with actual auth implementation
 */
export function createAuthMiddleware(logger: Logger) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader) {
        return res.status(401).json({ error: 'Missing authorization header' });
      }

      // JWT verification would happen here
      // This is a stub - implement with your auth library
      const token = authHeader.split(' ')[1];

      if (!token) {
        return res.status(401).json({ error: 'Invalid authorization header' });
      }

      // In production, decode and verify the JWT
      // For now, we'll extract user info from the token claim
      req.user = {
        id: 'user-placeholder', // Extract from decoded JWT
        role: 'user',
      };

      return next();
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Authentication error');
      return res.status(401).json({ error: 'Authentication failed' });
    }
  };
}

/**
 * Authorization middleware factory
 */
export function createAuthorizationMiddleware(allowedRoles: string[], logger: Logger) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!req.user.role || !allowedRoles.includes(req.user.role)) {
      logger.warn(
        { userId: req.user.id, userRole: req.user.role, allowedRoles },
        'Authorization denied'
      );
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    return next();
  };
}

/**
 * Error handling middleware
 */
export function createErrorHandler(logger: Logger) {
  return (err: any, req: Request, res: Response, next: NextFunction) => {
    logger.error({ error: err }, 'Request error');

    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal server error';

    res.status(statusCode).json({
      error: message,
      code: err.code,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
  };
}

/**
 * Request logging middleware
 */
export function createRequestLogger(logger: Logger) {
  return (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;
      logger.info(
        {
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          duration,
        },
        'HTTP request completed'
      );
    });

    next();
  };
}

/**
 * Validation middleware for notification payload
 */
export function validateNotificationPayload(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const { userId, type, title, message, channels } = req.body;

  const errors: string[] = [];

  if (!userId) errors.push('userId is required');
  if (!type) errors.push('type is required');
  if (!title || !title.trim()) errors.push('title is required and cannot be empty');
  if (!message || !message.trim()) errors.push('message is required and cannot be empty');
  if (!channels || !Array.isArray(channels) || channels.length === 0) {
    errors.push('channels is required and must be a non-empty array');
  }

  if (errors.length > 0) {
    return res.status(400).json({ errors, message: 'Validation failed' });
  }

  return next();
}

/**
 * Rate limiting middleware (stub)
 * Implement with rate limiter library
 */
export function createRateLimitMiddleware(
  maxRequests: number = 100,
  windowMs: number = 60000, // 1 minute
  logger: Logger
) {
  const requests = new Map<string, number[]>();

  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user?.id || req.ip || 'anonymous';
    const now = Date.now();
    const windowStart = now - windowMs;

    // Get requests for this user
    let userRequests = requests.get(userId) || [];

    // Filter out old requests (outside the window)
    userRequests = userRequests.filter((timestamp) => timestamp > windowStart);

    // Check if limit exceeded
    if (userRequests.length >= maxRequests) {
      logger.warn({ userId, requestCount: userRequests.length }, 'Rate limit exceeded');
      return res.status(429).json({ error: 'Too many requests' });
    }

    // Add current request
    userRequests.push(now);
    requests.set(userId, userRequests);

    // Clean up old entries periodically
    if (requests.size > 1000) {
      const oldestTime = now - windowMs * 2;
      for (const [key, reqs] of requests.entries()) {
        const activeReqs = reqs.filter((t) => t > oldestTime);
        if (activeReqs.length === 0) {
          requests.delete(key);
        } else {
          requests.set(key, activeReqs);
        }
      }
    }

    return next();
  };
}

/**
 * CORS configuration
 */
export const corsConfig = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
