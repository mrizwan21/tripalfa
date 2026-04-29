/**
 * Rate Limiter Middleware
 *
 * In-memory rate limiter using a sliding window algorithm.
 * Can be replaced with Redis-backed rate limiting in production.
 */

import { Request, Response, NextFunction } from 'express';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store: Map<string, RateLimitEntry> = new Map();

export interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: Request) => string;
  message?: string;
  statusCode?: number;
  skipSuccessfulRequests?: boolean;
}

export function createRateLimiter(options: RateLimitOptions) {
  const {
    windowMs = 60 * 1000,
    maxRequests = 30,
    message = 'Too many requests, please try again later.',
    statusCode = 429,
    skipSuccessfulRequests = false,
  } = options;

  const keyGenerator =
    options.keyGenerator ??
    ((req: Request) => {
      const ip = req.ip ?? req.socket.remoteAddress ?? 'unknown';
      return `ratelimit:${req.path}:${ip}`;
    });

  // Cleanup interval
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (entry.resetAt <= now) {
        store.delete(key);
      }
    }
  }, windowMs * 2);

  return function rateLimiter(req: Request, res: Response, next: NextFunction): void {
    const key = keyGenerator(req);
    const now = Date.now();

    let entry = store.get(key);

    if (!entry || entry.resetAt <= now) {
      entry = { count: 1, resetAt: now + windowMs };
      store.set(key, entry);
    } else {
      entry.count += 1;
    }

    const remaining = Math.max(0, maxRequests - entry.count);
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);

    // Set rate limit headers
    res.set({
      'X-RateLimit-Limit': String(maxRequests),
      'X-RateLimit-Remaining': String(remaining),
      'X-RateLimit-Reset': String(entry.resetAt),
    });

    if (entry.count > maxRequests) {
      res.set('Retry-After', String(retryAfter));
      res.status(statusCode).json({ error: message, retryAfter });
      return;
    }

    if (skipSuccessfulRequests) {
      const originalStatus = res.statusCode;
      res.on('finish', () => {
        if (originalStatus >= 200 && originalStatus < 400) {
          entry.count -= 1;
        }
      });
    }

    next();
  };
}

// Default rate limiters for different endpoint types
export const apiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 100,
  message: 'API rate limit exceeded. Please try again later.',
});

export const duffelApiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 30,
  message: 'Flight search rate limit exceeded. Please try again later.',
});

export const strictRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 10,
  message: 'Booking rate limit exceeded. Please try again later.',
});