# Booking Service - Comprehensive Code Audit Findings

## Executive Summary

This audit systematically examined all source code files in the booking-service module. The following categories of issues were identified:

- **Critical Bugs**: Issues that cause runtime failures or incorrect behavior
- **Security Vulnerabilities**: Potential security weaknesses
- **Performance Issues**: Code patterns that could lead to performance degradation
- **Type Safety Issues**: TypeScript typing problems
- **Code Quality Issues**: Style and maintainability concerns

---

## CRITICAL BUGS

### 1. Duplicate Property Declaration in WebhookDeliveryEvent Interface
**File**: `src/monitoring/webhook-delivery-monitor.ts` (Line 23-41)
**Severity**: Critical (TypeScript compilation error)
**Issue**: The `eventType` property is declared twice in the interface - once as a union type and once as a string.
```typescript
export interface WebhookDeliveryEvent {
  eventType: // FIRST DECLARATION - union type
    | 'delivery_created'
    | 'delivery_attempt'
    | 'delivery_success'
    | 'delivery_failure'
    | 'delivery_retry';
  deliveryId: string;
  provider: string;
  eventType: string; // SECOND DECLARATION - overwrites first
  // ...
}
```
**Fix**: Remove the duplicate `eventType: string` declaration.

### 2. Incorrect Response Type in webhook-delivery.controller.ts
**File**: `src/controllers/webhook-delivery.controller.ts` (Line 106, 247, 296, 336, 413)
**Severity**: Critical (Runtime error)
**Issue**: `formatErrorResponse()` returns an object without a `status` property, but controller tries to access `errorResponse.status`.
```typescript
const errorResponse = formatErrorResponse(error);
res.status(errorResponse.status || 500).json(errorResponse);
```
The `formatErrorResponse` function in `error-handler.ts` returns:
```typescript
{
  success: false,
  error: { code, message, timestamp, requestId, retryable, ...details }
}
```
There is no `status` property. This will always fall back to 500.
**Fix**: The error handler needs to return a status code, or controllers should use the original error's statusCode.

### 3. Missing logInfo/logWarn Export in error-handler.ts
**File**: `src/utils/error-handler.ts`
**Severity**: Critical (Import error)
**Issue**: `webhook-delivery.controller.ts` imports `logInfo` from `error-handler.js`, but only `logError` is exported.
**Fix**: Add `logInfo` and `logWarn` exports to error-handler.ts.

### 4. Type Mismatch in webhook-delivery.service.ts
**File**: `src/services/webhook-delivery.service.ts` (Line 183)
**Severity**: Critical (TypeScript error)
**Issue**: Uses global `Response` type which is the DOM Response type, not a proper HTTP response type.
```typescript
let response: Response; // This is ambiguous
```
**Fix**: Should use proper fetch response typing or remove the type annotation.

### 5. Invalid Status Code in webhook-delivery.controller.ts
**File**: `src/controllers/webhook-delivery.controller.ts` (Line 106, 247, 296, 336, 413)
**Severity**: High
**Issue**: `errorResponse.status` doesn't exist on the formatted error response, causing `res.status(undefined || 500)` which while functional, indicates a broken error handling pattern.

---

## SECURITY VULNERABILITIES

### 6. Hardcoded Secret in Development
**File**: `src/services/webhook-delivery.service.ts` (Line 26)
**Severity**: Medium
**Issue**: Default fallback to 'development_secret' if no WEBHOOK_SECRET is provided.
```typescript
this.webhookSecret = webhookSecret || process.env.WEBHOOK_SECRET || 'development_secret';
```
**Fix**: Throw error in production if WEBHOOK_SECRET is not set.

### 7. API Key Not Validated at Startup
**File**: `src/config/duffel.ts` (Line 13-14)
**Severity**: Medium
**Issue**: Only uses `console.warn` when DUFFEL_API_KEY is missing, not preventing startup in production.
**Fix**: Should throw error in production environment.

### 8. Potential Injection in SQL Queries
**File**: `src/services/hotelDataService.ts` (Line 454-556)
**Severity**: Low (parameterized queries used, but complex string building)
**Issue**: Dynamic SQL building with template literals, though parameters are properly parameterized.
**Fix**: Consider using a query builder for better safety.

---

## PERFORMANCE ISSUES

### 9. N+1 Query Pattern in Hotel Search
**File**: `src/services/hotelDataService.ts` (Line 508-519)
**Severity**: High
**Issue**: Subqueries in the main SELECT are executed per row:
```sql
COALESCE(
  (SELECT json_agg(json_build_object('url', i.url)) FROM hotel.images i WHERE i.hotel_id = h.id AND i.is_main = true),
  '[]'::json
) as images,
```
**Fix**: Use JOINs with aggregation or CTEs for better performance.

### 10. Synchronous Cache Serialization
**File**: `src/cache/redis.ts` (Line 27)
**Severity**: Medium
**Issue**: `Buffer.from(JSON.stringify(params)).toString('base64')` for cache key generation can be slow for large objects.
**Fix**: Use hash-based key generation (e.g., SHA256) for complex objects.

### 11. Unbounded Event Buffer
**File**: `src/monitoring/webhook-delivery-monitor.ts` (Line 54)
**Severity**: Medium
**Issue**: Event buffer is stored in memory with size limit, but the slice operation `this.eventBuffer.slice(-this.config.bufferSize)` creates a new array each time.
**Fix**: Use a proper circular buffer implementation.

### 12. Fire-and-Forget Redis Cache Updates
**File**: `src/cache/redis.ts` (Line 166-168)
**Severity**: Low
**Issue**: `.catch(err => console.error(...))` pattern silently swallows errors.
```typescript
this.set(key, data, ttlSeconds).catch(err =>
  console.error(`[Cache] Failed to cache ${key}:`, err)
);
```
**Fix**: Use proper error tracking/logging.

---

## TYPE SAFETY ISSUES

### 13. Missing logInfo/logInfo/logWarn Functions
**File**: `src/utils/error-handler.ts`
**Issue**: Functions are imported but not defined/exported.

### 14. Any Type Usage Throughout
**File**: Multiple files
**Issue**: Extensive use of `any` type reduces type safety.

### 15. Missing INVALID_STATE ErrorCode
**File**: `src/utils/error-handler.ts`
**Issue**: `webhook-delivery.controller.ts` uses `ErrorCode.INVALID_STATE` which doesn't exist in the enum.

---

## CODE QUALITY ISSUES

### 16. Mixed Error Handling Patterns
**File**: Multiple files
**Issue**: Some functions throw Error objects, some return error objects, some use createError().

### 17. Inconsistent Response Format
**File**: Multiple route files
**Issue**: Some endpoints return `{ success: true, data }`, others return `{ success: true, order }`, etc.

### 18. Empty Files
**File**: `src/cache/error-handler.ts`
**Issue**: File exists but is empty.

---

## DETAILED FIXES REQUIRED

### Fix 1: WebhookDeliveryEvent Interface (CRITICAL)
```typescript
// BEFORE (Line 23-41)
export interface WebhookDeliveryEvent {
  eventType:
    | 'delivery_created'
    | 'delivery_attempt'
    | 'delivery_success'
    | 'delivery_failure'
    | 'delivery_retry';
  deliveryId: string;
  provider: string;
  eventType: string; // DUPLICATE!
  endpointUrl: string;
  // ...
}

// AFTER
export interface WebhookDeliveryEvent {
  eventType:
    | 'delivery_created'
    | 'delivery_attempt'
    | 'delivery_success'
    | 'delivery_failure'
    | 'delivery_retry';
  deliveryId: string;
  provider: string;
  endpointUrl: string;
  // ...
}
```

### Fix 2: Error Handler Exports
```typescript
// ADD to src/utils/error-handler.ts
export function logInfo(context: string, data: Record<string, any>) {
  logger.info(JSON.stringify({ level: 'info', timestamp: new Date().toISOString(), context, ...data }));
}

export function logWarn(context: string, data: Record<string, any>) {
  logger.warn(JSON.stringify({ level: 'warn', timestamp: new Date().toISOString(), context, ...data }));
}
```

### Fix 3: Add INVALID_STATE to ErrorCode
```typescript
// ADD to ErrorCode enum
INVALID_STATE = 'INVALID_STATE',
```

### Fix 4: Fix formatErrorResponse to include status
```typescript
// UPDATE formatErrorResponse
export function formatErrorResponse(error: ErrorDetails | Error) {
  if ('statusCode' in error) {
    return {
      success: false,
      status: error.statusCode,
      error: { /* ... */ }
    };
  }
  // Fallback for regular Error
  return {
    success: false,
    status: 500,
    error: { message: error.message }
  };
}