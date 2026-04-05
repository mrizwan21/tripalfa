# Payment Service - Testing & Implementation Quick Start

**Status**: Phase 1 Implementation Complete ✅

This guide provides quick reference for working with the payment service implementation.

---

## Quick Commands

### Testing

```bash
# Run all payment service tests
npm run test --workspace=@tripalfa/payment-service

# Run with coverage report
npm run test:coverage --workspace=@tripalfa/payment-service

# Watch mode (auto-rerun on changes)
npm run test:watch --workspace=@tripalfa/payment-service

# Run specific test file
npm run test --workspace=@tripalfa/payment-service -- stripe-payment.spec.ts
```

### Development

```bash
# Start payment service
npm run dev --workspace=@tripalfa/payment-service

# Type checking
npm run type-check --workspace=@tripalfa/payment-service

# Linting
npm run lint --workspace=@tripalfa/payment-service

# Build
npm run build --workspace=@tripalfa/payment-service
```

---

## Environment Setup

### Development (.env)

```bash
# Stripe Test Keys (from Stripe Dashboard)
STRIPE_SECRET_KEY=sk_test_51Ju3UkCxYxYxYxYxYxYxYx
STRIPE_PUBLISHABLE_KEY=pk_test_51Ju3UkCxYxYxYxYxYxYxYx
STRIPE_WEBHOOK_SECRET=whsec_test_1234567890

# Redis (optional - falls back to in-memory)
REDIS_URL=redis://localhost:6379
REDIS_IDEMPOTENCY_URL=redis://localhost:6379

# Service Config
PAYMENT_SERVICE_PORT=3007
NODE_ENV=development
```

### Production

```bash
# Live Stripe Keys (from Stripe Production Dashboard)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_test_...

# Production Redis
REDIS_URL=redis://redis-prod:6379

# Security
NODE_ENV=production
```

---

## Test Files

### Unit Tests: stripe-payment.spec.ts

- **Location**: `services/payment-service/src/__tests__/stripe-payment.spec.ts`
- **Tests**: 40+ test cases
- **Coverage**: Core service methods, validation, error handling
- **Run**: `npm run test -- stripe-payment.spec.ts`

### Integration Tests: payment-routes.spec.ts

- **Location**: `services/payment-service/src/__tests__/payment-routes.spec.ts`
- **Tests**: 20+ test cases
- **Coverage**: API endpoints, service mocking, request handling
- **Run**: `npm run test -- payment-routes.spec.ts`

---

## Implementation Files

### Core Service

| File                        | Purpose                              | Status      |
| --------------------------- | ------------------------------------ | ----------- |
| `stripe-payment.service.ts` | Main Stripe integration (12 methods) | ✅ Complete |
| `idempotency.service.ts`    | Request deduplication                | ✅ Complete |

### API Routes

| File                     | Purpose                      | Status            |
| ------------------------ | ---------------------------- | ----------------- |
| `routes/payments-new.ts` | Refactored payment endpoints | ✅ Complete       |
| `routes/payments.ts`     | Original (placeholder)       | 🟡 To be replaced |

### Configuration

| File                 | Purpose                | Status      |
| -------------------- | ---------------------- | ----------- |
| `vitest.config.ts`   | Test framework config  | ✅ Complete |
| `package.json`       | Dependencies & scripts | ✅ Updated  |
| `__tests__/setup.ts` | Test environment setup | ✅ Complete |

---

## API Endpoints

### Create Payment Intent

```bash
curl -X POST http://localhost:3007/api/payments/intent \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 1213,
    "currency": "USD",
    "bookingId": "BK-2026-001247",
    "paymentMethodId": "pm_xxx",
    "idempotencyKey": "idem_xxx"
  }'
```

### Process Payment

```bash
curl -X POST http://localhost:3007/api/payments/process \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 1213,
    "currency": "USD",
    "bookingId": "BK-2026-001247",
    "paymentMethodId": "pm_xxx",
    "idempotencyKey": "idem_xxx"
  }'
```

### Refund Payment

```bash
curl -X POST http://localhost:3007/api/payments/refund \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "paymentIntentId": "pi_xxx",
    "amount": 500,
    "reason": "requested_by_customer"
  }'
```

### Get Payment Intent

```bash
curl -X GET http://localhost:3007/api/payments/pi_xxx \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### Stripe Webhook (No Auth)

```bash
curl -X POST http://localhost:3007/api/payments/webhook \
  -H "stripe-signature: <SIGNATURE>" \
  -H "Content-Type: application/json" \
  -d '{...stripe webhook payload...}'
```

---

## Test Results Example

```
✓ src/__tests__/stripe-payment.spec.ts (40 tests)
  ✓ StripePaymentService (40)
    ✓ createPaymentIntent (7)
      ✓ should create a payment intent successfully
      ✓ should validate amount is positive
      ✓ should validate minimum amount
      ✓ should validate currency
      ✓ should validate bookingId is provided
      ✓ should validate customerId is provided
      ✓ should use idempotency key for duplicate requests
    ✓ confirmPaymentIntent (3)
    ✓ processPayment (2)
    ✓ refundPayment (3)
    ✓ getPaymentIntent (2)
    ✓ listPaymentIntents (2)
    ✓ handleWebhookEvent (2)
    ✓ Error handling (3)

✓ src/__tests__/payment-routes.spec.ts (20 tests)
  ✓ Payment Routes (6)
  ✓ Payment Service - Method Mocking (4)
  ✓ API Health Check (2)

Test Files  2 passed (2)
Tests  60 passed (60)
```

---

## Service Methods Reference

### StripePaymentService

#### Payment Processing

- `createPaymentIntent(input)` - Create payment intent
- `confirmPaymentIntent(input)` - Confirm existing intent
- `processPayment(input)` - Full payment in one call
- `refundPayment(input)` - Refund (full or partial)

#### Payment Retrieval

- `getPaymentIntent(id)` - Get payment details
- `listPaymentIntents(options)` - List with filters

#### Webhooks

- `constructWebhookEvent(body, sig, secret)` - Verify webhook
- `handleWebhookEvent(event)` - Process event

### IdempotencyService

#### In-Memory Store (Development)

```typescript
const store = new InMemoryIdempotencyStore();
store.get(key); // Get cached value
store.set(key, value, ttl); // Cache value
store.stopCleanup(); // Stop cleanup interval
```

#### Redis Store (Production)

```typescript
const store = new RedisIdempotencyStore();
await store.get(key); // Get from Redis
await store.set(key, value, ttl); // Cache in Redis
await store.shutdown(); // Cleanup
```

#### Factory

```typescript
import { createIdempotencyStore } from './idempotency.service';
const store = createIdempotencyStore(); // Auto-selects Redis or in-memory
```

---

## Common Errors & Solutions

| Error                                   | Cause                     | Solution                                    |
| --------------------------------------- | ------------------------- | ------------------------------------------- |
| `Stripe API Key not configured`         | Missing STRIPE_SECRET_KEY | Set in .env                                 |
| `Webhook signature verification failed` | Invalid webhook secret    | Verify STRIPE_WEBHOOK_SECRET matches Stripe |
| `Amount must be a positive number`      | Invalid amount in request | Ensure amount > 0 and < 99999999            |
| `Unsupported currency`                  | Invalid currency code     | Use: USD, EUR, GBP, CAD, AUD, JPY           |
| `Payment intent not found`              | Wrong payment ID          | Verify pi\_ ID is correct                   |
| `Unauthorized`                          | Missing JWT token         | Add Authorization header                    |

---

## Coverage Report

```
% Coverage from v8
---------------------------------------------
File                    | % Stmts | % Branches
---------------------------------------------
All files              |   XX.XX |    XX.XX
stripe-payment.service |   XX.XX |    XX.XX
idempotency.service    |   XX.XX |    XX.XX
routes/payments-new    |   XX.XX |    XX.XX
---------------------------------------------
```

Run: `npm run test:coverage --workspace=@tripalfa/payment-service`

---

## Integration with Booking Service

The payment service is called from the booking workflow:

```typescript
// In booking-service
const paymentResponse = await fetch('http://payment-service/api/payments/process', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${bookingUserToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    amount: totalPrice * 100, // Convert to cents
    currency: 'USD',
    bookingId: booking.id,
    paymentMethodId: paymentMethodFromClient,
    idempotencyKey: generateUUID(),
  }),
});

const { transaction, paymentIntent } = await paymentResponse.json();

if (transaction.status === 'succeeded') {
  // Update booking status to "paid"
  // Trigger ticketing service
  // Send confirmation email
}
```

---

## Next Steps

### Phase 2: Wallet Integration

- [ ] Complete wallet service balance operations
- [ ] Add wallet as payment method
- [ ] Implement wallet-to-wallet transfers

### Phase 3: Settlement & Reconciliation

- [ ] Supplier payout system
- [ ] Transaction reconciliation
- [ ] Finance reporting

### Monitoring

- [ ] Set up payment event logging
- [ ] Configure error alerts
- [ ] Add transaction analytics

---

## Useful Links

- [Stripe API Keys](https://dashboard.stripe.com/account/apikeys)
- [Stripe Webhook Settings](https://dashboard.stripe.com/account/webhooks)
- [Stripe Test Cards](https://stripe.com/docs/testing#cards)
- [Payment Intents Docs](https://stripe.com/docs/payments/payment-intents)

---

## Support

**Issues?**

1. Check test output: `npm run test`
2. Review logs during `npm run dev`
3. Verify environment variables
4. Check Stripe dashboard for API errors

**Files to check:**

- Implementation: `services/payment-service/src/services/`
- Tests: `services/payment-service/src/__tests__/`
- Routes: `services/payment-service/src/routes/`
- Config: `services/payment-service/vitest.config.ts`

---

**Last Updated**: March 20, 2026  
**Status**: ✅ Phase 1 Complete
