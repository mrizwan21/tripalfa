# 🚀 Code Refactoring - Quick Implementation Guide

## Overview

All 8 critical code quality issues have been fixed across TripAlfa backend and frontend services. This
guide shows how to **use the new patterns** in your code.

---

## 1. Structured Error Handling

### ✅ How to Use

**Import the error handler:**

```typescript
import {
  createError,
  ErrorCode,
  logError,
  formatErrorResponse,
  withDatabaseErrorHandling,
  withCacheErrorHandling,
} from '../utils/error-handler.js';
```

**Create structured errors:**

```typescript
// ❌ OLD WAY
throw new Error('Payment failed');
res.status(500).json({ error: 'Something went wrong' });

// ✅ NEW WAY
const error = createError(ErrorCode.PAYMENT_FAILED, 'Insufficient balance for transaction', 422, {
  required: 100,
  available: 50,
});
res.status(error.statusCode).json(formatErrorResponse(error));
```

**Log errors properly:**

```typescript
// ❌ OLD WAY
console.error('Payment error:', error);

// ✅ NEW WAY
logError('[PaymentService]', error, {
  userId: req.user.id,
  orderId: req.params.orderId,
});
```

**Error response format:**

```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_BALANCE",
    "message": "Insufficient balance for transaction",
    "timestamp": "2026-03-15T10:30:00Z",
    "retryable": false,
    "details": {
      "required": 100,
      "available": 50
    }
  }
}
```

---

## 2. Input Validation

### ✅ How to Use

**Import validators:**

```typescript
import {
  validateRequest,
  validationErrorsToResponse,
  flightSliceValidationRules,
  passengerValidationRules,
} from '../utils/validators.js';
```

**Validate automatically:**

```typescript
// Validate flight search input
const errors = validateRequest(req.body.slice, flightSliceValidationRules);

if (errors.length > 0) {
  return res.status(400).json(validationErrorsToResponse(errors));
}

// Safe to use req.body.slice now
```

**Create custom validation rules:**

```typescript
const hotelValidationRules: ValidationRule[] = [
  {
    field: 'checkInDate',
    required: true,
    type: 'string',
    validator: CommonValidators.isValidISODate,
  },
  {
    field: 'nights',
    required: true,
    type: 'number',
    minLength: 1,
    maxLength: 30,
    validator: CommonValidators.isNonNegativeNumber,
  },
];

const errors = validateRequest(req.body, hotelValidationRules);
```

**Response when validation fails:**

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "timestamp": "2026-03-15T10:30:00Z",
    "details": [
      {
        "field": "origin",
        "reason": "Invalid format (pattern: /^[A-Z]{3}$/)",
        "value": "NYC_"
      },
      {
        "field": "departure_date",
        "reason": "Expected type string, got undefined",
        "value": null
      }
    ]
  }
}
```

---

## 3. Graceful Concurrent Operations

### ✅ How to Use

**Before (all-or-nothing):**

```typescript
// ❌ If count fails, findMany result is lost
const [items, count] = await Promise.all([
  db.item.findMany(...),
  db.item.count(...)
]);
```

**After (partial success):**

```typescript
// ✅ Get results even if one fails
const results = await Promise.allSettled([
  db.item.findMany(...),
  db.item.count(...)
]);

const items = results[0].status === "fulfilled" ? results[0].value : [];
const count = results[1].status === "fulfilled" ? results[1].value : 0;

// Optional: log failures
if (results[0].status === "rejected") {
  logError("listItems", results[0].reason);
}
```

---

## 4. Proper TypeScript Types

### ✅ How to Use

**Before (unsafe):**

```typescript
// ❌ Type is erased, IDE can't help
const execution = await (prisma as any).rule_execution.create({...});
```

**After (safe):**

```typescript
// ✅ Import types
import type { RuleExecution, Rule } from "../types/index.js";

// ✅ Fully typed and IDE-supported
const execution: RuleExecution = await prisma.rule_execution.create({...});

// ✅ IDE shows all available properties
execution.conditionMet // ✓ Type: boolean
execution.ruleId        // ✓ Type: string
execution.nestedProp    // ✗ IntelliSense catches typos
```

**Create types for new entities:**

```typescript
// File: src/types/payment.ts
export interface PaymentTransaction {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  status: "pending" | "completed" | "failed" | "refunded";
  method: "wallet" | "card";
  metadata?: Record<string, any>;
  createdAt: Date;
}

// Usage:
const txn: PaymentTransaction = await db.payment.create({...});
```

---

## 5. React Error Handling

### ✅ How to Use

**Wrap components in ErrorBoundary:**

```typescript
import { ErrorBoundary } from "./components/common/ErrorBoundary";

function App() {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error("Component error:", error);
        // Send to error tracking service
      }}
      fallback={(error) => (
        <div className="error-screen">
          <h1>Something went wrong</h1>
          <p>{error.message}</p>
          <button onClick={() => window.location.reload()}>
            Reload Page
          </button>
        </div>
      )}
    >
      <PaymentForm />
    </ErrorBoundary>
  );
}
```

**Handle payment errors properly:**

```typescript
import { parsePaymentError, retryWithBackoff } from '../utils/paymentErrorHandling';

async function processPayment(orderId: string) {
  try {
    const response = await fetch('/api/payment', {
      method: 'POST',
      body: JSON.stringify({ orderId }),
    });

    if (!response.ok) {
      const error = parsePaymentError(await response.json());

      if (error.type === PaymentErrorType.PRICE_CHANGED) {
        // Ask user to review new price
        showModal('Price Changed', error.message);
      } else if (error.retryable) {
        // Offer retry
        setTimeout(() => processPayment(orderId), error.retryAfterMs);
      } else {
        // Terminal error
        showError(error.message);
      }
      return;
    }

    showSuccess('Payment processed');
  } catch (err) {
    showError('Network error. Please check your connection.');
  }
}
```

---

## 6. Common Patterns & Best Practices

### Pattern: Safe Database Operations

```typescript
import { withDatabaseErrorHandling } from '../utils/error-handler.js';

const user = await withDatabaseErrorHandling(
  () => db.user.findUnique({ where: { id } }),
  '[UserService]',
  'findUnique'
);
```

### Pattern: Non-Critical Cache Operations

```typescript
import { withCacheErrorHandling } from "../utils/error-handler.js";

// Cache failure doesn't break feature (non-critical = isCritical: false)
const cachedData = await withCacheErrorHandling(
  () => cache.get(cacheKey),
  "[DataService]",
  "getCachedData",
  false // Non-critical - fallback to DB
);

if (!cachedData) {
  // Fallback to database
  return await db.data.findUnique({...});
}
```

### Pattern: Retry Logic

```typescript
import { retryWithBackoff } from '../utils/paymentErrorHandling';

const result = await retryWithBackoff(
  () => externalApi.charge(amount),
  3, // max retries
  1000 // base delay (1s, 2s, 4s)
);
```

### Pattern: Never Use Silent Catches

```typescript
// ❌ NEVER DO THIS
await operation().catch(() => {});

// ✅ ALWAYS DO THIS
try {
  await operation();
} catch (error) {
  if (isExpectedError(error)) {
    // Handle expected cases
  } else {
    logError('[Context]', error);
    // Rethrow or handle
  }
}
```

---

## 7. Testing the New Patterns

### Test Error Handling

```typescript
// Example test
describe('Payment API', () => {
  it('returns ERROR code for price changes', async () => {
    const res = await request(app).post('/api/payment').send({ orderId: 'test-123', amount: 100 });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
    expect(res.body.error.retryable).toBe(true);
  });
});
```

### Test Validation

```typescript
describe('Flight validation', () => {
  it('catches invalid airport codes', () => {
    const errors = validateRequest(
      { origin: 'INVALID', destination: 'JFK' },
      flightSliceValidationRules
    );

    expect(errors).toHaveLength(1);
    expect(errors[0].field).toBe('origin');
  });
});
```

---

## 8. Migration Checklist

When refactoring existing code, follow this checklist:

### Errors

- [ ] Replace `console.error()` with `logError()`
- [ ] Use error codes instead of plain messages
- [ ] Return `formatErrorResponse()` for API errors
- [ ] Never use `.catch(() => {})`

### Validation

- [ ] Add validation rules at API entry points
- [ ] Return `validationErrorsToResponse()` on failure
- [ ] Validate nested objects (slices, passengers)
- [ ] Test validation with edge cases

### Concurrency

- [ ] Replace `Promise.all()` with `Promise.allSettled()`
- [ ] Handle partial failures gracefully
- [ ] Log failures but don't crash

### Types

- [ ] Create type files for entities
- [ ] Replace `any` with concrete types
- [ ] Add type imports with `type` keyword
- [ ] Update JSDoc return types

### Frontend

- [ ] Wrap page components in `ErrorBoundary`
- [ ] Use `parsePaymentError()` for API errors
- [ ] Implement retry logic where applicable
- [ ] Show user-friendly error messages

---

## ✅ Verification

Before pushing to production:

```bash
# Type check
npx tsc -p tsconfig.json --noEmit

# Lint
npm run lint

# Build
npm run build

# Run tests
npm test
```

---

**Need Help?**  
See [CODE_REFACTORING_COMPLETE.md](./CODE_REFACTORING_COMPLETE.md) for detailed implementation notes.
