# Logging Standards

## Overview

All TripAlfa microservices must follow standardized logging practices to ensure consistency, performance, and effective log aggregation through Loki/Promtail.

## Logging Principles

1. **Structured Logging**: All logs must be in JSON format for easy parsing and querying
2. **Log to stdout/stderr**: Services should write logs to standard output/error streams for container collection
3. **Appropriate Log Levels**: Use correct severity levels for different types of events
4. **Contextual Information**: Include relevant context (service name, request ID, user ID, etc.)
5. **No Sensitive Data**: Never log passwords, tokens, credit card numbers, or PII
6. **Performance**: Logging should not significantly impact application performance

## Log Format

### Standard JSON Structure

All log entries must follow this structure:

```json
{
  "timestamp": "2025-03-27T16:09:13.123Z",
  "level": "info",
  "service": "booking-service",
  "message": "Booking created successfully",
  "traceId": "abc-123-def",
  "spanId": "span-456",
  "userId": "user_789",
  "bookingId": "book_012",
  "requestId": "req_345",
  "duration": 45.2,
  "additionalContext": {
    "key1": "value1",
    "key2": "value2"
  }
}
```

### Required Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `timestamp` | string | ISO 8601 timestamp with milliseconds | `"2025-03-27T16:09:13.123Z"` |
| `level` | string | Log level (trace, debug, info, warn, error, fatal) | `"info"` |
| `service` | string | Service name from package.json | `"booking-service"` |
| `message` | string | Human-readable log message | `"Booking created successfully"` |

### Optional Context Fields

| Field | Type | Description |
|-------|------|-------------|
| `traceId` | string | Distributed tracing ID (from OpenTelemetry/Sentry) |
| `spanId` | string | Span ID for distributed tracing |
| `userId` | string | User ID (if applicable) |
| `requestId` | string | Unique request identifier |
| `duration` | number | Operation duration in milliseconds |
| `error` | object | Error details (for error level logs) |
| `stack` | string | Stack trace (for error level logs) |
| `additionalContext` | object | Any service-specific context |

## Log Levels

Use the following log levels consistently across all services:

### TRACE (most verbose)
- Detailed debugging information
- Function entry/exit points
- Variable values during execution
- **Use sparingly** - can impact performance

**Example**:
```json
{
  "level": "trace",
  "service": "booking-service",
  "message": "Entering createBooking function",
  "params": {
    "flightId": "flight_123",
    "passengerCount": 2
  }
}
```

### DEBUG
- Debugging information useful during development
- State changes, decision points
- External API calls (without sensitive data)

**Example**:
```json
{
  "level": "debug",
  "service": "booking-service",
  "message": "Calling Duffel API to create order",
  "api": "POST /v1/orders",
  "requestId": "req_123"
}
```

### INFO
- Normal operational messages
- Service lifecycle events (startup, shutdown)
- Business events (booking created, payment processed)
- Successful operations

**Example**:
```json
{
  "level": "info",
  "service": "booking-service",
  "message": "Booking created successfully",
  "bookingId": "book_456",
  "userId": "user_789",
  "amount": 1250.00,
  "currency": "USD"
}
```

### WARN
- Unexpected but non-critical issues
- Retryable errors
- Deprecated feature usage
- Performance warnings (slow queries, high memory)

**Example**:
```json
{
  "level": "warn",
  "service": "booking-service",
  "message": "Duffel API response slow",
  "latency": 5000,
  "threshold": 3000,
  "api": "GET /v1/offers"
}
```

### ERROR
- Critical errors that prevent operation completion
- Failed external API calls (after retries)
- Database errors
- Validation failures
- Must include error details and stack trace

**Example**:
```json
{
  "level": "error",
  "service": "booking-service",
  "message": "Failed to create booking",
  "error": {
    "code": "PAYMENT_FAILED",
    "message": "Payment declined by Stripe"
  },
  "stack": "Error: Payment declined by Stripe\n    at processPayment(...)",
  "bookingId": "book_456",
  "userId": "user_789"
}
```

### FATAL
- Unrecoverable errors causing service crash
- Should trigger immediate alerting
- Service will exit after logging

**Example**:
```json
{
  "level": "fatal",
  "service": "booking-service",
  "message": "Database connection lost, exiting",
  "error": {
    "code": "DB_CONNECTION_LOST",
    "message": "All connection attempts failed"
  }
}
```

## Implementation Guidelines

### 1. Use a Structured Logger Library

Recommended logging libraries:

- **Pino**: High-performance JSON logger (preferred)
- **Winston**: Feature-rich with multiple transports
- **Bunyan**: JSON logger with good performance

**Example with Pino**:

```typescript
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty'
  },
  serializers: {
    req: (req) => ({
      method: req.method,
      url: req.url,
      headers: {
        'user-agent': req.headers['user-agent'],
        'x-request-id': req.headers['x-request-id']
      }
    }),
    res: (res) => ({
      statusCode: res.statusCode
    }),
    err: pino.stdSerializers.err
  }
});

// Add service name
logger.child({ service: 'booking-service' });

// Usage
logger.info('Booking created', {
  bookingId: 'book_123',
  userId: 'user_456'
});

logger.error('Payment failed', {
  error: error,
  bookingId: 'book_123'
});
```

### 2. Request Context Correlation

Use async local storage or continuation-local storage to maintain request context:

```typescript
import { AsyncLocalStorage } from 'async_hooks';
import { v4 as uuidv4 } from 'uuid';

const asyncLocalStorage = new AsyncLocalStorage<Map<string, any>>();

// Middleware to create request context
app.use((req, res, next) => {
  const context = new Map([
    ['requestId', req.headers['x-request-id'] || uuidv4()],
    ['userId', req.user?.id || null],
    ['traceId', req.headers['x-trace-id'] || null]
  ]);
  
  asyncLocalStorage.run(context, () => {
    next();
  });
});

// Helper to get context
export function getContext(): Map<string, any> {
  return asyncLocalStorage.getStore() || new Map();
}

// Usage in service
const context = getContext();
logger.info('Processing booking', {
  requestId: context.get('requestId'),
  userId: context.get('userId')
});
```

### 3. Error Logging

Always log errors with full context:

```typescript
try {
  await createBooking(data);
} catch (error) {
  logger.error('Failed to create booking', {
    error: error,
    bookingId: data.bookingId,
    userId: data.userId,
    stack: error.stack,
    code: error.code
  });
  
  // Re-throw if needed
  throw error;
}
```

### 4. Sensitive Data Redaction

Never log sensitive information. Use a middleware or serializer to redact:

```typescript
const sensitiveFields = ['password', 'token', 'creditCard', 'cvv', 'ssn'];

function redactSensitiveData(obj: any): any {
  if (typeof obj !== 'object' || obj === null) return obj;
  
  const redacted = { ...obj };
  for (const key in redacted) {
    if (sensitiveFields.includes(key.toLowerCase())) {
      redacted[key] = '[REDACTED]';
    } else if (typeof redacted[key] === 'object') {
      redacted[key] = redactSensitiveData(redacted[key]);
    }
  }
  return redacted;
}

// Usage
logger.info('User login', {
  user: redactSensitiveData({
    id: user.id,
    email: user.email,
    password: req.body.password // Will be redacted
  })
});
```

### 5. External API Logging

Log external API calls with context but without sensitive data:

```typescript
const axios = require('axios').create();

// Request interceptor
axios.interceptors.request.use((config) => {
  const requestId = getContext().get('requestId');
  logger.debug('External API request', {
    requestId,
    method: config.method?.toUpperCase(),
    url: config.url,
    headers: {
      'content-type': config.headers['content-type'],
      'authorization': config.headers['authorization'] ? '[REDACTED]' : undefined
    }
  });
  return config;
});

// Response interceptor
axios.interceptors.response.use(
  (response) => {
    logger.debug('External API response', {
      requestId: getContext().get('requestId'),
      url: response.config.url,
      status: response.status,
      duration: response.duration
    });
    return response;
  },
  (error) => {
    logger.error('External API error', {
      requestId: getContext().get('requestId'),
      url: error.config?.url,
      status: error.response?.status,
      error: error.message
    });
    return Promise.reject(error);
  }
);
```

## Promtail Configuration

The Promtail configuration (`infrastructure/monitoring/promtail.yml`) expects logs in `/app/logs/**/*.log`:

```yaml
scrape_configs:
  - job_name: app-logs
    static_configs:
      - targets: [localhost]
        labels:
          job: app
          __path__: /app/logs/**/*.log
    pipeline_stages:
      - json:
          expressions:
            level: level
            message: message
            timestamp: timestamp
            service: service
      - labels:
          level:
          service:
      - timestamp:
          source: timestamp
          format: RFC3339Nano
```

### Service Log Output Configuration

Services should write JSON logs to files in `/app/logs/`:

```typescript
import pino from 'pino';
import { createWriteStream } from 'fs';

const logFile = createWriteStream('/app/logs/booking-service.log', { flags: 'a' });

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-http',
    options: {
      destination: logFile
    }
  }
});
```

**Alternative**: Write to stdout and let Docker/container runtime handle file rotation:

```typescript
const logger = pino({
  level: process.env.LOG_LEVEL || 'info'
});

// stdout is automatically captured by container logs
console.log(logger);
```

## Log Rotation and Retention

### Local Development

Use `logrotate` or similar tool for log rotation:

```bash
# /etc/logrotate.d/tripalfa-apps
/app/logs/*.log {
  daily
  rotate 7
  compress
  delaycompress
  missingok
  notifempty
  create 644 user group
  sharedscripts
  postrotate
    # Signal services to reopen log files
    kill -USR1 `cat /var/run/tripalfa.pid`
  endscript
}
```

### Production (Loki)

Loki handles retention automatically based on `retention_period` in `loki.yml` (31 days configured).

## Monitoring and Alerting

### Log-based Alerts

Create Promtail alerts for error patterns:

```yaml
# In alert-rules.yml
- alert: HighErrorRate
  expr: sum(rate({service="booking-service"} |= "level=error" [5m])) by (service) > 0.1
  for: 2m
  labels:
    severity: warning
  annotations:
    description: "High error rate in {{ $labels.service }}: > 10%"
    summary: "Error rate elevated in {{ $labels.service }}"
```

### Log Query Examples

**Find all errors in booking service**:
```
{service="booking-service"} |= "level=error"
```

**Find logs with specific booking ID**:
```
{service="booking-service"} | json | .bookingId="book_123"
```

**Error rate by service**:
```
sum(rate({level=~"error|fatal"}[5m])) by (service)
```

## Compliance and Security

### PII and Sensitive Data

**NEVER log**:
- Passwords or tokens
- Credit card numbers or CVV
- Social Security Numbers
- Full addresses (city/country is OK)
- Phone numbers (last 4 digits only)
- Email addresses (domain only)
- API keys or secrets

**Acceptable**:
- User IDs (not email)
- Booking references
- Non-sensitive metadata
- Aggregated metrics

### Audit Logging

For compliance, maintain separate audit logs for critical operations:

```typescript
// Audit logger (separate from application logs)
const auditLogger = pino({
  level: 'info',
  transport: {
    target: 'pino-http',
    options: {
      destination: createWriteStream('/app/logs/audit.log')
    }
  }
});

// Log audit events
auditLogger.info('User permission changed', {
  timestamp: new Date().toISOString(),
  actor: 'admin_user_123',
  target: 'user_456',
  action: 'permission_change',
  changes: {
    old: ['user:read'],
    new: ['user:read', 'user:write']
  },
  ip: req.ip,
  userAgent: req.headers['user-agent']
});
```

## Testing Logging

### Unit Tests

```typescript
import { test, expect } from 'vitest';
import { logger } from '../logger';

test('should log with correct format', () => {
  const logSpy = vi.spyOn(logger, 'info');
  
  logger.info('Test message', { key: 'value' });
  
  expect(logSpy).toHaveBeenCalledWith(
    'Test message',
    expect.objectContaining({
      key: 'value',
      service: 'test-service'
    })
  );
});
```

### Integration Tests

```typescript
import { readFileSync } from 'fs';

test('logs should be valid JSON', () => {
  const logFile = readFileSync('/app/logs/test-service.log', 'utf-8');
  const logLines = logFile.split('\n').filter(line => line.trim());
  
  for (const line of logLines) {
    const logEntry = JSON.parse(line);
    expect(logEntry).toHaveProperty('timestamp');
    expect(logEntry).toHaveProperty('level');
    expect(logEntry).toHaveProperty('service');
    expect(logEntry).toHaveProperty('message');
  }
});
```

## Checklist

- [ ] All logs are in JSON format
- [ ] Required fields present: timestamp, level, service, message
- [ ] No sensitive data in logs (passwords, tokens, PII)
- [ ] Appropriate log level used (trace/debug/info/warn/error/fatal)
- [ ] Errors include stack traces
- [ ] Request context included (requestId, userId, traceId)
- [ ] Health checks excluded from logs
- [ ] Logs written to stdout or /app/logs/
- [ ] Log rotation configured
- [ ] Log-based alerts configured in Prometheus/Alertmanager
- [ ] Audit logging implemented for critical operations
- [ ] Logging tests added to test suite

## References

- [Pino Logger](https://getpino.io/)
- [Winston Logger](https://github.com/winstonjs/winston)
- [Loki LogQL Queries](https://grafana.com/docs/loki/latest/logql/)
- [Structured Logging Best Practices](https://www.honeybadger.io/blog/structured-logging/)