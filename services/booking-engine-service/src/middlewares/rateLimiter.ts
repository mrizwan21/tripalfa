import rateLimit from 'express-rate-limit';

/**
 * Rate limiting middleware for booking-engine-service
 * Protects against API abuse and controls costs for external API calls
 */

// Default rate limiter for general endpoints
export const defaultRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests, please try again later',
  },
  standardHeaders: 'draft-7', // Use latest draft of RateLimit headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
});

// Strict rate limiter for search endpoints (expensive API calls)
export const searchRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 searches per minute
  message: {
    success: false,
    error: 'Search rate limit exceeded, please wait before searching again',
  },
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise fall back to IP
    return (req.body?.userId as string) || req.ip || 'unknown';
  },
});

// Very strict rate limiter for booking endpoints (prevents duplicate bookings)
export const bookingRateLimiter = rateLimit({
  windowMs: 30 * 1000, // 30 seconds
  max: 3, // Limit each IP to 3 bookings per 30 seconds
  message: {
    success: false,
    error: 'Booking rate limit exceeded, please wait before creating another booking',
  },
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req) => {
    return (req.body?.guestInfo?.id as string) || req.ip || 'unknown';
  },
});

// Rate limiter for offline request endpoints
export const offlineRequestRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // 20 requests per 5 minutes
  message: {
    success: false,
    error: 'Too many offline requests, please try again later',
  },
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});

// Rate limiter for static data endpoints (higher limits since these are cheap lookups)
export const staticDataRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 200, // 200 requests per minute
  message: {
    success: false,
    error: 'Static data rate limit exceeded',
  },
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});