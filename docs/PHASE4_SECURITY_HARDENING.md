# Phase 4: Security Hardening & Monitoring Implementation

**Date**: April 3, 2026  
**Status**: 📋 **READY FOR IMPLEMENTATION**  
**Phase**: 4 of 5 - Security Hardening & Monitoring  
**Estimated Duration**: 3-4 days  

---

## Executive Summary

Phase 4 fortifies the booking engine against security threats and implements comprehensive monitoring to ensure operational visibility and compliance. Key deliverables:

- **Authentication Enhancement**: Token validation, CORS enforcement, API key rotation support
- **Request/Response Logging**: Sensitive data masking, request tracing with correlation IDs
- **Rate Limiting**: Per-endpoint tuning, sliding window algorithm, client identification
- **Security Headers**: CSP, X-Frame-Options, HSTS, anti-clickjacking protection
- **Audit Logging**: User actions, sensitive operations, compliance tracking
- **Monitoring & Alerting**: Real-time metrics, anomaly detection, SLA monitoring

---

## 1. Authentication Middleware Enhancement

### Current State (Phase 2)
- JWT validation in `auth.ts`
- Basic Bearer token extraction
- Development fallback for JWT_SECRET

### Phase 4 Enhancements

**File**: `services/booking-engine-service/src/middlewares/auth-hardened.ts`

```typescript
/**
 * Enhanced Authentication Middleware
 * 
 * Phase 4 improvements:
 * - TokenBlacklist support (token revocation)
 * - API key validation with rotation
 * - Client certificate validation (mTLS)
 * - Comprehensive audit logging
 * - Rate limiting integration
 */

import { Request, Response, NextFunction } from 'express';
import { AuthenticationError } from './error-handler.js';
import { AuditLogger } from '../utils/audit-logger.js';

interface AuthContext {
  userId?: string;
  clientId?: string;
  tokenType: 'jwt' | 'apiKey' | 'clientCert';
  issuedAt: Date;
  expiresAt?: Date;
  scopes?: string[];
}

// Token Blacklist (in-memory for now, Redis for production)
const tokenBlacklist = new Set<string>();

/**
 * Enhanced authentication middleware with token validation
 */
export function authenticateRequest(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      throw new AuthenticationError('Missing Authorization header');
    }

    const [scheme, credentials] = authHeader.split(' ');

    let authContext: AuthContext;

    if (scheme === 'Bearer') {
      // JWT Token Validation
      authContext = validateJWTToken(credentials);
      
      // Check token blacklist (revocation list)
      if (tokenBlacklist.has(credentials)) {
        AuditLogger.log('AUTH_TOKEN_REVOKED', { userId: authContext.userId });
        throw new AuthenticationError('Token has been revoked');
      }
    } else if (scheme === 'ApiKey') {
      // API Key Validation
      authContext = validateAPIKey(credentials);
    } else if (scheme === 'Client-Cert') {
      // Client Certificate Validation
      authContext = validateClientCertificate(req);
    } else {
      throw new AuthenticationError(`Unsupported authentication scheme: ${scheme}`);
    }

    // Attach auth context to request
    (req as any).authContext = authContext;
    (req as any).userId = authContext.userId;
    (req as any).clientId = authContext.clientId;

    // Log successful authentication
    AuditLogger.log('AUTH_SUCCESS', {
      userId: authContext.userId,
      clientId: authContext.clientId,
      method: req.method,
      path: req.path,
      ip: req.ip,
    });

    next();
  } catch (error) {
    AuditLogger.log('AUTH_FAILED', {
      error: error instanceof Error ? error.message : String(error),
      path: req.path,
      ip: req.ip,
    });

    return res.status(401).json({
      success: false,
      error: 'Authentication failed',
      code: 'AUTHENTICATION_ERROR',
    });
  }
}

/**
 * JWT Token Validation with enhanced checks
 */
function validateJWTToken(token: string): AuthContext {
  const jwt = require('jsonwebtoken');
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      issuer: process.env.JWT_ISSUER || 'tripalfa',
      audience: process.env.JWT_AUDIENCE || 'api',
      algorithms: ['HS256', 'RS256'],
    });

    // Validate required claims
    if (!decoded.sub && !decoded.userId) {
      throw new Error('Missing user identifier in token');
    }

    // Check token exp claim
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
      throw new Error('Token has expired');
    }

    return {
      userId: decoded.sub || decoded.userId,
      clientId: decoded.client_id,
      tokenType: 'jwt',
      issuedAt: new Date(decoded.iat * 1000),
      expiresAt: decoded.exp ? new Date(decoded.exp * 1000) : undefined,
      scopes: decoded.scope ? decoded.scope.split(' ') : [],
    };
  } catch (error) {
    throw new AuthenticationError(`Invalid JWT token: ${error.message}`);
  }
}

/**
 * API Key Validation with rotation support
 */
function validateAPIKey(apiKey: string): AuthContext {
  // Lookup API key in database (with caching)
  const apiKeyRecord = lookupAPIKey(apiKey);

  if (!apiKeyRecord || !apiKeyRecord.isActive) {
    throw new AuthenticationError('Invalid or revoked API key');
  }

  // Check if key is expired
  if (apiKeyRecord.expiresAt && apiKeyRecord.expiresAt < new Date()) {
    throw new AuthenticationError('API key has expired');
  }

  // Update last used timestamp
  updateAPIKeyUsage(apiKey);

  return {
    userId: apiKeyRecord.userId,
    clientId: apiKeyRecord.clientId,
    tokenType: 'apiKey',
    issuedAt: apiKeyRecord.createdAt,
    expiresAt: apiKeyRecord.expiresAt,
    scopes: apiKeyRecord.scopes,
  };
}

/**
 * Client Certificate Validation (mTLS)
 */
function validateClientCertificate(req: Request): AuthContext {
  const cert = req.socket.getPeerCertificate?.();

  if (!cert || !cert.subject) {
    throw new AuthenticationError('Missing client certificate');
  }

  // Validate certificate chain
  if (!req.socket.authorized) {
    throw new AuthenticationError(`Certificate validation failed: ${req.socket.authorizationError}`);
  }

  return {
    clientId: cert.subject.CN,
    tokenType: 'clientCert',
    issuedAt: new Date(cert.validity.start),
    expiresAt: new Date(cert.validity.end),
  };
}

/**
 * Revoke token (logout, manual revocation)
 */
export function revokeToken(token: string): void {
  tokenBlacklist.add(token);
}

/**
 * Validate scope/permission
 */
export function requireScope(scope: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authContext = (req as any).authContext as AuthContext;

    if (!authContext?.scopes?.includes(scope)) {
      AuditLogger.log('SCOPE_DENIED', {
        userId: authContext?.userId,
        requiredScope: scope,
        availableScopes: authContext?.scopes,
      });

      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_SCOPE',
      });
    }

    next();
  };
}

// Helper functions (stubs - implement in actual codebase)
function lookupAPIKey(apiKey: string): any { return null; }
function updateAPIKeyUsage(apiKey: string): void {}
```

---

## 2. Request/Response Logging with Sensitive Data Masking

### Implementation: `utils/request-logger.ts`

```typescript
/**
 * Request/Response Logger with PII Masking
 * 
 * Logs all API requests and responses while:
 * - Masking sensitive fields (passwords, tokens, PII)
 * - Adding correlation IDs for tracing
 * - Recording error details for debugging
 * - Tracking performance metrics
 */

import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

const SENSITIVE_FIELDS = [
  'password',
  'token',
  'apiKey',
  'secret',
  'creditCard',
  'ssn',
  'email',
  'phone',
  'authorization',
  'x-api-key',
];

const SENSITIVE_PATHS = [
  /login/i,
  /password/i,
  /authenticate/i,
  /token/i,
  /payment/i,
  /card/i,
];

/**
 * Middleware for comprehensive request/response logging
 */
export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const requestId = req.headers['x-request-id'] as string || randomUUID();
  const startTime = Date.now();

  // Attach request ID to response
  res.setHeader('X-Request-ID', requestId);
  (req as any).requestId = requestId;

  // Store original send method
  const originalSend = res.send;

  // Override send to log response
  res.send = function(data: any) {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;

    logRequest(requestId, req, STATUS LABELS[statusCode] || 'UNKNOWN', duration, data);

    // Call original send
    return originalSend.call(this, data);
  };

  next();
}

/**
 * Mask sensitive fields in objects
 */
function maskSensitiveData(obj: any, depth = 0): any {
  if (depth > 5 || !obj || typeof obj !== 'object') return obj;

  const masked = Array.isArray(obj) ? [...obj] : { ...obj };

  for (const [key, value] of Object.entries(masked)) {
    // Mask sensitive fields
    if (SENSITIVE_FIELDS.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
      masked[key] = '***MASKED***';
    }
    // Recursively mask nested objects
    else if (typeof value === 'object') {
      masked[key] = maskSensitiveData(value, depth + 1);
    }
  }

  return masked;
}

/**
 * Log request with context
 */
function logRequest(
  requestId: string,
  req: Request,
  statusLabel: string,
  duration: number,
  response: any
): void {
  const logEntry = {
    timestamp: new Date().toISOString(),
    requestId,
    method: req.method,
    path: req.path,
    query: maskSensitiveData(req.query),
    body: maskSensitiveData(req.body),
    statusCode: response?.status || 200,
    statusLabel,
    duration,
    userId: (req as any).userId,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  };

  // Log based on severity
  if (response?.status >= 500) {
    console.error(`[${requestId}] [ERROR]`, logEntry);
  } else if (response?.status >= 400) {
    console.warn(`[${requestId}] [WARN]`, logEntry);
  } else {
    console.info(`[${requestId}] [INFO]`, logEntry);
  }
}

const STATUS_LABELS: Record<number, string> = {
  200: 'OK',
  201: 'CREATED',
  204: 'NO_CONTENT',
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  429: 'RATE_LIMITED',
  500: 'INTERNAL_ERROR',
  502: 'BAD_GATEWAY',
  503: 'UNAVAILABLE',
  504: 'TIMEOUT',
};
```

---

## 3. Per-Endpoint Rate Limiting

### Configuration: `middlewares/rate-limiter.ts`

```typescript
/**
 * Per-Endpoint Rate Limiting
 * 
 * Applies different rate limits based on:
 * - Endpoint sensitivity (booking vs. search)
 * - User tier (free, premium, enterprise)
 * - Time of day (peak vs. off-peak)
 * - Geographic location (DDoS mitigation)
 */

import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { createClient } from 'redis';

const redisClient = createClient();

// Rate limit configurations per endpoint
const rateLimitConfigs = {
  // Search endpoints: Higher limits (read-only, safe)
  search: rateLimit({
    store: new RedisStore({
      client: redisClient as any,
      prefix: 'rl:search:',
    }),
    windowMs: 60 * 1000, // 1 minute
    max: 1000, // 1000 requests per minute
    message: 'Too many search requests',
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.method !== 'GET',
  }),

  // Booking endpoints: Medium limits (write, critical)
  booking: rateLimit({
    store: new RedisStore({
      client: redisClient as any,
      prefix: 'rl:booking:',
    }),
    windowMs: 60 * 1000,
    max: 50, // 50 bookings per minute
    message: 'Too many booking requests',
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        error: 'Too many booking requests',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: req.rateLimit?.resetTime,
      });
    },
  }),

  // Payment endpoints: Strictest limits (money involved)
  payment: rateLimit({
    store: new RedisStore({
      client: redisClient as any,
      prefix: 'rl:payment:',
    }),
    windowMs: 60 * 1000,
    max: 20, // 20 payments per minute
    message: 'Payment rate limit exceeded',
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        error: 'Payment rate limit exceeded',
        code: 'RATE_LIMIT_EXCEEDED',
      });
    },
  }),

  // Authentication: Strict limits (brute-force protection)
  auth: rateLimit({
    store: new RedisStore({
      client: redisClient as any,
      prefix: 'rl:auth:',
    }),
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 login attempts per 15 min
    skipSuccessfulRequests: true, // Don't count successful auth
    message: 'Too many login attempts',
  }),
};

// User tier-based multipliers
const tierMultipliers: Record<string, number> = {
  free: 1.0,
  premium: 5.0,
  enterprise: 50.0,
};

/**
 * Rate limit middleware factory with user tier support
 */
export function createRateLimiter(config: any) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userTier = (req as any).userTier || 'free';
    const multiplier = tierMultipliers[userTier] || 1.0;

    // Adjust max based on user tier
    config.max = Math.floor(config.max * multiplier);

    return config(req, res, next);
  };
}

export const rateLimiters = rateLimitConfigs;
```

---

## 4. Security Headers Implementation

### File: `middlewares/security-headers.ts`

```typescript
/**
 * Security Headers Middleware
 * 
 * Implements OWASP recommended security headers
 */

import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';

export function securityHeaders(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Content Security Policy
  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://cdn.example.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://api.example.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ')
  );

  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions Policy (formerly Feature Policy)
  res.setHeader(
    'Permissions-Policy',
    [
      'camera=()',
      'microphone=()',
      'geolocation=()',
      'payment=(self)',
    ].join(', ')
  );

  // HSTS (HTTP Strict Transport Security)
  if (process.env.NODE_ENV === 'production') {
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  // Remove server header
  res.removeHeader('Server');
  res.removeHeader('X-Powered-By');

  next();
}

// Use helmet for additional protection
export const helmetMiddleware = helmet({
  contentSecurityPolicy: false, // We define our own CSP above
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginOpenerPolicy: true,
  dnsPrefetchControl: { allow: false },
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  ieNoOpen: true,
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
});
```

---

## 5. Audit Logging System

### File: `utils/audit-logger.ts`

```typescript
/**
 * Comprehensive Audit Logging
 * 
 * Tracks:
 * - User actions (login, logout, data access)
 * - Sensitive operations (payment, booking changes)
 * - Administrative actions (user management, config changes)
 * - Security events (failed auth, rate limit violations)
 * - Compliance events (data export, retention)
 */

import { opsDb } from '../database.js';

interface AuditLogEntry {
  eventType: string;
  userId?: string;
  clientId?: string;
  action: string;
  resource: string;
  changes?: Record<string, any>;
  result: 'success' | 'failure';
  errorCode?: string;
  ipAddress: string;
  userAgent?: string;
  timestamp: Date;
}

export class AuditLogger {
  /**
   * Log an audit event
   */
  static async log(
    eventType: string,
    context: Record<string, any>,
    req?: any
  ): Promise<void> {
    const entry: AuditLogEntry = {
      eventType,
      userId: context.userId || req?.userId,
      clientId: context.clientId || req?.clientId,
      action: context.action || eventType,
      resource: context.resource || 'unknown',
      changes: context.changes,
      result: context.error ? 'failure' : 'success',
      errorCode: context.errorCode,
      ipAddress: req?.ip || 'unknown',
      userAgent: req?.get('user-agent'),
      timestamp: new Date(),
    };

    try {
      // Write to audit log database
      if (opsDb) {
        await opsDb.auditLog.create({
          data: {
            eventType: entry.eventType,
            userId: entry.userId,
            clientId: entry.clientId,
            action: entry.action,
            resource: entry.resource,
            changes: entry.changes,
            result: entry.result,
            errorCode: entry.errorCode,
            ipAddress: entry.ipAddress,
            userAgent: entry.userAgent,
            createdAt: entry.timestamp,
          },
        });
      }

      // Also log to stdout for real-time monitoring
      const logLevel = entry.result === 'success' ? 'info' : 'warn';
      console[logLevel as any](`[AUDIT] ${entry.eventType}:`, entry);
    } catch (error) {
      console.error('[AUDIT] Failed to log event:', error);
    }
  }

  /**
   * Query audit logs (for compliance reports)
   */
  static async query(filters: {
    eventType?: string;
    userId?: string;
    dateRange?: { start: Date; end: Date };
    limit?: number;
  }): Promise<AuditLogEntry[]> {
    if (!opsDb) return [];

    const logs = await opsDb.auditLog.findMany({
      where: {
        eventType: filters.eventType,
        userId: filters.userId,
        createdAt: {
          gte: filters.dateRange?.start,
          lte: filters.dateRange?.end,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: filters.limit || 100,
    });

    return logs as any;
  }
}

// Common audit event types
export const AUDIT_EVENTS = {
  // Authentication
  AUTH_SUCCESS: 'AUTH_SUCCESS',
  AUTH_FAILED: 'AUTH_FAILED',
  AUTH_TOKEN_REVOKED: 'AUTH_TOKEN_REVOKED',
  LOGOUT: 'LOGOUT',

  // Bookings
  BOOKING_CREATED: 'BOOKING_CREATED',
  BOOKING_MODIFIED: 'BOOKING_MODIFIED',
  BOOKING_CANCELLED: 'BOOKING_CANCELLED',
  BOOKING_PAID: 'BOOKING_PAID',

  // Payments
  PAYMENT_PROCESSED: 'PAYMENT_PROCESSED',
  PAYMENT_REFUNDED: 'PAYMENT_REFUNDED',
  PAYMENT_FAILED: 'PAYMENT_FAILED',

  // Data Access
  DATA_EXPORTED: 'DATA_EXPORTED',
  REPORT_GENERATED: 'REPORT_GENERATED',

  // Admin Actions
  USER_CREATED: 'USER_CREATED',
  USER_UPDATED: 'USER_UPDATED',
  USER_DELETED: 'USER_DELETED',
  CONFIGURATION_CHANGED: 'CONFIGURATION_CHANGED',

  // Security
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  SUSPICIOUS_ACTIVITY: 'SUSPICIOUS_ACTIVITY',
  SECURITY_ALERT: 'SECURITY_ALERT',
};
```

---

## 6. Monitoring & Alerting Configuration

### File: `monitoring/metrics.ts`

```typescript
/**
 * Prometheus Metrics for Monitoring
 * 
 * Tracks:
 * - Request latency (p50, p95, p99)
 * - Error rates by endpoint
 * - Database query performance
 * - External API latency
 * - Cache hit rates
 * - Transaction volumes
 */

import { register, Counter, Histogram, Gauge } from 'prom-client';

// Request metrics
export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request latency in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.001, 0.01, 0.05, 0.1, 0.5, 1, 2, 5],
});

export const httpRequestTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status'],
});

// Error metrics
export const errorCounter = new Counter({
  name: 'errors_total',
  help: 'Total errors',
  labelNames: ['type', 'endpoint'],
});

// Database metrics
export const dbQueryDuration = new Histogram({
  name: 'db_query_duration_seconds',
  help: 'Database query duration',
  labelNames: ['query_type', 'table'],
  buckets: [0.001, 0.01, 0.1, 0.5, 1],
});

// Transaction metrics
export const bookingCounter = new Counter({
  name: 'bookings_total',
  help: 'Total bookings',
  labelNames: ['status'],
});

export const paymentCounter = new Counter({
  name: 'payments_total',
  help: 'Total payments',
  labelNames: ['status'],
});

// Connection pool metrics
export const dbConnectionPoolSize = new Gauge({
  name: 'db_connection_pool_size',
  help: 'Database connection pool size',
  labelNames: ['database'],
});

export const dbConnectionActive = new Gauge({
  name: 'db_connection_active',
  help: 'Active database connections',
  labelNames: ['database'],
});

// Middleware to collect metrics
export function metricsMiddleware(req: any, res: any, next: any) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestDuration.labels(req.method, req.route?.path || req.path, res.statusCode).observe(duration);
    httpRequestTotal.labels(req.method, req.route?.path || req.path, res.statusCode).inc();
  });

  next();
}

// Export Prometheus metrics endpoint
export function metricsEndpoint(req: any, res: any) {
  res.set('Content-Type', register.contentType);
  res.end(register.metrics());
}
```

---

## 7. Deployment Checklist

### Pre-Deployment

- [ ] Review all security headers in production environment
- [ ] Configure rate limiting thresholds for each endpoint
- [ ] Set up Redis for distributed rate limiting
- [ ] Configure audit log retention policies
- [ ] Test token revocation mechanism
- [ ] Verify API key rotation process
- [ ] Set up monitoring dashboards

### Deployment Steps

```bash
# 1. Deploy Phase 4 code
git pull origin develop
npm run build

# 2. Migrate database schema for audit logs
npm run db:migrate

# 3. Configure environment variables
cp .env.phase4.example .env
# Edit with production values

# 4. Enable security headers
npm run deploy:security-hardening

# 5. Configure alerting
npm run setup:alerts

# 6. Verify monitoring metrics
curl http://localhost:3000/metrics
```

---

## 8. Rollback Plan

If Phase 4 causes issues:

```bash
# Disable specific security features
# In index.ts, comment out:
// app.use(securityHeaders);
// app.use(rateLimiters.booking);

# Or full rollback
git revert HEAD
npm run build
npm run deploy:staging
```

---

## Success Criteria

- ✅ All API requests have audit logs
- ✅ Sensitive data masked in logs
- ✅ Rate limiting enforced per endpoint
- ✅ Security headers present on all responses
- ✅ Token revocation working
- ✅ Metrics endpoint accessible
- ✅ Alerting configured for High-risk events

---

**Phase 4 Status**: 📋 **READY FOR IMPLEMENTATION**  
**Estimated Start**: April 4, 2026  
**Next**: Phase 5 - Testing & Documentation

