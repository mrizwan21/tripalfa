# Phase 4 Integration Guide - Security Hardening

**Status**: ✅ Phase 4 Components Complete (1,355 lines)  
**Build Status**: ✅ Passing (Exit Code 0)  
**Last Updated**: April 3, 2026  
**Estimated Integration Time**: 2-3 hours

---

## Overview

Phase 4 introduces 5 security middleware components that must be integrated into the Express application boot sequence. This guide provides step-by-step integration instructions, configuration details, and validation procedures.

### Components Overview

| Component | File | Lines | Purpose |
|-----------|------|-------|---------|
| **Authentication Enhancement** | auth-hardened.ts | 350 | JWT, API key, mTLS validation |
| **Rate Limiting** | rate-limiter.ts | 280 | Per-endpoint sliding window limiting |
| **Security Headers** | security-headers.ts | 200 | OWASP header enforcement |
| **Audit Logging** | audit-logger.ts | 245 | Compliance event tracking |
| **Request Logging** | request-logger.ts | 280 | Tracing & PII masking |

---

## Part 1: Integration Steps

### Step 1: Import Phase 4 Modules

Add imports to `src/main.ts` or `src/app.ts`:

```typescript
// Security middleware imports (Phase 4)
import {
  requireAuth,
  validateJWT,
  requireScope,
  requireUserTier,
  rotateApiKey,
  blacklistToken,
  validateClientCertificate,
} from './middlewares/auth-hardened';

import {
  createRateLimiterMiddleware,
  rateLimitByUserId,
  rateLimitByIp,
} from './middlewares/rate-limiter';

import { securityHeadersMiddleware } from './middlewares/security-headers';

import { logAuditEvent, AuditEvent, AuditEventType } from './utils/audit-logger';

import {
  createRequestLoggerMiddleware,
  maskPII,
  getCorrelationId,
} from './utils/request-logger';
```

### Step 2: Order of Middleware Registration

**Critical**: Register middlewares in this order:

```typescript
import express, { Express } from 'express';
import redis from 'redis';

async function setupApp(app: Express) {
  // 1️⃣ Request correlation ID (must be first)
  app.use((req, res, next) => {
    (req as any).correlationId = require('uuid').v4();
    res.setHeader('X-Request-ID', (req as any).correlationId);
    next();
  });

  // 2️⃣ Request logging (before other processing)
  const requestLogger = createRequestLoggerMiddleware({
    enablePiiMasking: true,
    logLevel: process.env.LOG_LEVEL || 'info',
    excludePaths: ['/health', '/metrics'],
  });
  app.use(requestLogger);

  // 3️⃣ Security headers (applies globally)
  app.use(securityHeadersMiddleware);

  // 4️⃣ Global rate limiting (IP-based for unauthenticated)
  const redisClient = redis.createClient({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  });
  await redisClient.connect();

  app.use(createRateLimiterMiddleware(redisClient));

  // 5️⃣ Authentication middleware (validates tokens)
  app.use(requireAuth);

  // 6️⃣ Endpoint-specific rate limiting (user-based)
  app.post('/api/search', rateLimitByUserId(1000, 60000), handleSearch);
  app.post('/api/booking', rateLimitByUserId(50, 60000), handleBooking);
  app.post('/api/payment', rateLimitByUserId(20, 60000), handlePayment);

  // 7️⃣ Scope/tier requirements on protected routes
  app.post(
    '/api/admin',
    requireScope('admin'),
    requireUserTier('enterprise'),
    handleAdmin
  );

  return app;
}
```

### Step 3: Configure Redis for Rate Limiting

Create `src/config/redis-config.ts`:

```typescript
import redis, { RedisClientType } from 'redis';

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
  retryAttempts?: number;
  retryDelayMs?: number;
}

export async function initializeRedis(
  config: Partial<RedisConfig> = {}
): Promise<RedisClientType> {
  const finalConfig: RedisConfig = {
    host: config.host || process.env.REDIS_HOST || 'localhost',
    port: config.port || parseInt(process.env.REDIS_PORT || '6379'),
    password: config.password || process.env.REDIS_PASSWORD,
    db: config.db || 0,
    retryAttempts: config.retryAttempts || 3,
    retryDelayMs: config.retryDelayMs || 1000,
  };

  const client = redis.createClient({
    host: finalConfig.host,
    port: finalConfig.port,
    password: finalConfig.password,
    db: finalConfig.db,
  });

  // Retry logic
  let attempts = 0;
  while (attempts < finalConfig.retryAttempts!) {
    try {
      await client.connect();
      console.log('✅ Redis connected successfully');
      return client;
    } catch (error) {
      attempts++;
      if (attempts >= finalConfig.retryAttempts!) {
        throw error;
      }
      console.warn(
        `Redis connection attempt ${attempts} failed, retrying in ${finalConfig.retryDelayMs}ms...`
      );
      await new Promise(resolve => setTimeout(resolve, finalConfig.retryDelayMs));
    }
  }

  throw new Error('Could not connect to Redis');
}
```

### Step 4: Configure Audit Logging

Create `src/config/audit-config.ts`:

```typescript
import { logAuditEvent } from '../utils/audit-logger';

export interface AuditConfig {
  enabled: boolean;
  persistToDb: boolean;
  webhookUrl?: string;
  webhookTimeout?: number;
  retentionDays?: number;
  criticalEventNotifications: boolean;
}

export const AUDIT_CONFIG: AuditConfig = {
  enabled: process.env.AUDIT_ENABLED !== 'false',
  persistToDb: process.env.AUDIT_DB_PERSIST === 'true',
  webhookUrl: process.env.AUDIT_WEBHOOK_URL,
  webhookTimeout: parseInt(process.env.AUDIT_WEBHOOK_TIMEOUT || '5000'),
  retentionDays: parseInt(process.env.AUDIT_RETENTION_DAYS || '365'),
  criticalEventNotifications: process.env.AUDIT_CRITICAL_NOTIFICATIONS !== 'false',
};

export async function logCriticalEvent(
  eventType: string,
  details: Record<string, any>,
  userId?: string
) {
  if (!AUDIT_CONFIG.enabled) return;

  const event = {
    eventId: require('uuid').v4(),
    eventType: eventType as any,
    userId: userId || 'SYSTEM',
    timestamp: new Date(),
    ipAddress: details.ipAddress || 'internal',
    details,
  };

  await logAuditEvent(event);
}
```

### Step 5: Configure Environment Variables

Create `.env.phase4.example`:

```bash
# Phase 4: Security Hardening Configuration

# Redis Configuration (Rate Limiting)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# JWT Configuration
JWT_SECRET=your-super-secure-jwt-secret-256-bits-minimum
JWT_EXPIRY=24h
JWT_ALGORITHM=HS256

# API Key Configuration
API_KEY_ROTATION_DAYS=90
API_KEY_MAX_AGE_DAYS=365
API_KEY_HASHING_ALGORITHM=sha256

# Rate Limiting Configuration
RATE_LIMIT_SEARCH_MAX=1000
RATE_LIMIT_SEARCH_WINDOW_MS=60000
RATE_LIMIT_BOOKING_MAX=50
RATE_LIMIT_BOOKING_WINDOW_MS=60000
RATE_LIMIT_PAYMENT_MAX=20
RATE_LIMIT_PAYMENT_WINDOW_MS=60000
RATE_LIMIT_AUTH_MAX=10
RATE_LIMIT_AUTH_WINDOW_MS=60000

# User Tier Multipliers
RATE_LIMIT_TIER_PREMIUM_MULTIPLIER=2
RATE_LIMIT_TIER_STANDARD_MULTIPLIER=1
RATE_LIMIT_TIER_TRIAL_MULTIPLIER=0.5

# Security Headers
CSP_ENABLED=true
CSP_REPORT_URI=/api/csp-report
HSTS_ENABLED=true
HSTS_MAX_AGE=31536000

# Audit Logging
AUDIT_ENABLED=true
AUDIT_DB_PERSIST=false
AUDIT_WEBHOOK_URL=https://webhook.example.com/audit
AUDIT_WEBHOOK_TIMEOUT=5000
AUDIT_RETENTION_DAYS=365
AUDIT_CRITICAL_NOTIFICATIONS=true

# Request Logging
REQUEST_LOG_ENABLED=true
REQUEST_LOG_LEVEL=info
REQUEST_LOG_MASK_PII=true
REQUEST_LOG_EXCLUDE_PATHS=/health,/metrics

# mTLS Configuration
MTLS_ENABLED=false
MTLS_CA_PATH=/etc/ssl/certs/ca.pem
MTLS_CERT_PATH=/etc/ssl/certs/client.pem
MTLS_KEY_PATH=/etc/ssl/private/client.key
```

---

## Part 2: Integration Validation

### Validation Checklist

After integration, verify:

- [ ] **Build passes**: `npm run build --workspace=@tripalfa/booking-engine-service`
- [ ] **No runtime errors**: All imports resolve
- [ ] **Redis connectivity**: Can connect to Redis on startup
- [ ] **Middleware ordering**: Request flows through all middlewares
- [ ] **Security headers present**: Check response headers include CSP, HSTS, etc.
- [ ] **Rate limiting works**: Exceeding limits returns 429 status
- [ ] **Audit logging active**: Events logged to console/database
- [ ] **PII masking functional**: Sensitive data masked in logs

### Test Commands

```bash
# 1. Build verification
npm run build --workspace=@tripalfa/booking-engine-service

# 2. Start service with Phase 4
npm run dev --workspace=@tripalfa/booking-engine-service

# 3. Test authentication
curl -H "Authorization: Bearer invalid" http://localhost:3001/api/booking

# 4. Test rate limiting (hit endpoint 1001 times in 60s)
for i in {1..1001}; do
  curl http://localhost:3001/api/search
done

# 5. Check security headers
curl -i http://localhost:3001/health | grep -E "Content-Security-Policy|Strict-Transport-Security"

# 6. Check request logs for correlation ID
tail -f logs/request.log | grep "X-Request-ID"
```

---

## Part 3: Configuration by Environment

### Development Environment

```typescript
const PHASE4_CONFIG_DEV = {
  auth: {
    validateSignature: true,
    requireHttps: false,
  },
  rateLimit: {
    enabled: true,
    strictMode: false, // Allow burst traffic
  },
  securityHeaders: {
    cspReportOnly: true, // Don't block resources
  },
  auditLogging: {
    persistToDb: false, // Log to console only
    webhookNotifications: false,
  },
};
```

### Staging Environment

```typescript
const PHASE4_CONFIG_STAGING = {
  auth: {
    validateSignature: true,
    requireHttps: true,
  },
  rateLimit: {
    enabled: true,
    strictMode: true,
  },
  securityHeaders: {
    cspReportOnly: false, // Enforce CSP
  },
  auditLogging: {
    persistToDb: true,
    webhookNotifications: true,
  },
};
```

### Production Environment

```typescript
const PHASE4_CONFIG_PROD = {
  auth: {
    validateSignature: true,
    requireHttps: true,
    requireMtls: true, // Service-to-service
  },
  rateLimit: {
    enabled: true,
    strictMode: true,
    distributedMode: true, // Multi-server
  },
  securityHeaders: {
    cspReportOnly: false,
  },
  auditLogging: {
    persistToDb: true,
    webhookNotifications: true,
    encryptionEnabled: true,
  },
};
```

---

## Part 4: Monitoring & Troubleshooting

### Key Metrics to Monitor

1. **Authentication Failures**:
   - Invalid JWT tokens
   - Expired tokens
   - Missing API keys
   - Target: < 1% of requests

2. **Rate Limiting Activations**:
   - 429 responses per endpoint
   - Per-user vs per-IP limit hits
   - By user tier
   - Target: < 0.1% for premium, < 1% for standard

3. **Security Header Compliance**:
   - CSP violation reports
   - HSTS adoption rate
   - Response header presence
   - Target: 100% of responses

4. **Audit Event Volume**:
   - AUTH events per minute
   - BOOKING events per minute
   - PAYMENT events per minute
   - Storage capacity remaining
   - Target: < 10GB/month

### Common Issues & Solutions

**Issue 1: Redis Connection Failures**
```
Error: connect ECONNREFUSED 127.0.0.1:6379
Solution: Verify Redis is running and port is correct
$ redis-cli ping  # Should return PONG
```

**Issue 2: JWT Token Always Invalid**
```
Error: Invalid token signature
Solution: Verify JWT_SECRET matches between token creation and validation
Check: echo $JWT_SECRET | wc -c  # Should be >= 32 characters
```

**Issue 3: Rate Limiting Not Working**
```
Error: No rate limit errors even with heavy traffic
Solution: Check Redis connectivity in rate limiting middleware
Debug: redis-cli INFO stats  # Check connected_clients
```

**Issue 4: PII Not Being Masked**
```
Error: Sensitive data visible in logs
Solution: Ensure REQUEST_LOG_MASK_PII=true in environment
Verify: grep -r "maskPII" src/utils/request-logger.ts  # Check patterns
```

---

## Part 5: Next Steps After Integration

1. **Integration Testing** (2-3 hours)
   - Run Phase 4 test suite (PHASE4_TESTING_PLAN.md)
   - Test all authentication scenarios
   - Validate rate limiting algorithms
   - Verify audit log compliance

2. **Staging Deployment** (4-6 hours)
   - Deploy to staging environment
   - Enable Phase 4 middleware
   - Run load testing
   - Monitor metrics for anomalies

3. **Production Canary** (24+ hours)
   - Deploy Phase 4 to 5% of traffic
   - Monitor error rates and latency
   - Scale to 25%, 50%, 100%
   - Maintain 24-hour observation period

4. **Documentation & Runbooks**
   - Create Phase 4 troubleshooting guide
   - Document custom configuration
   - Create alert rules for monitoring
   - Train ops team on Phase 4 components

---

## Summary

✅ **Phase 4 Components**: All 5 files created and compiled  
🔄 **Integration Status**: Ready for implementation  
📊 **Build Status**: Passing (Exit Code 0)  
⏰ **Estimated Time to Production**: 48-72 hours from integration start

**Next Command**: Follow Part 1 steps to integrate components into Express app.
