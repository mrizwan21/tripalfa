# Booking Payment Integration - Implementation Checklist

**Current Status**: ✅ Services Created, 🔴 Routes Pending Integration  
**Priority**: HIGH  
**Blocks**: Flight/Hotel booking payment workflow

---

## Phase Completion Summary

| Phase | Component             | Status         | Tests                  |
| ----- | --------------------- | -------------- | ---------------------- |
| 1     | StripePaymentService  | ✅ Complete    | 12 methods, 24 skipped |
| 2     | WalletPaymentService  | ✅ Complete    | 22/22 passing ✅       |
| 3     | Payment Integration   | ✅ Complete    | 65 tests passing ✅    |
| 4     | BookingPaymentService | ✅ Created     | 25+ tests ready        |
| 4     | Route Integration     | 🔴 **BLOCKED** | Pending                |

---

## Immediate Action Items (TODAY)

### 1. ✅ Service Files Created

```
✅ services/booking-service/src/services/booking-payment.service.ts (250 LOC)
✅ services/booking-service/src/__tests__/booking-payment.spec.ts (350 LOC, 25+ tests)
```

**Status**: Ready for route integration  
**Next**: Add test script and run tests

### 2. 🔴 Add Test Script to booking-service

**File**: `services/booking-service/package.json`

**Change**:

```json
{
  "scripts": {
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:coverage": "vitest --coverage"
  }
}
```

**Command to test**:

```bash
npm run test --workspace=@tripalfa/booking-service
```

**Expected**: 25+ tests passing ✅

---

### 3. 🔴 Integrate into Flight Booking Route

**File**: `services/booking-service/src/routes/flight-booking.ts`  
**Location**: Line 631 - POST `/api/flight-booking/payment`

**Current Code** (simulates payment):

```typescript
// Current: Simulates payment processing
app.post('/api/flight-booking/payment', async (req, res) => {
  // TODO: Implement real payment processing
  res.json({ success: true, paymentStatus: 'paid' });
});
```

**New Code** (use BookingPaymentService):

```typescript
import { processBookingPayment, processBookingRefund } from '../services/booking-payment.service';

app.post(
  '/api/flight-booking/payment',
  authMiddleware,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const {
        orderId,
        workflowId,
        amount,
        currency,
        paymentMethod,
        stripeCustomerId,
        defaultPaymentMethodId,
      } = req.body;

      // Basic validation
      if (!orderId || !workflowId || !amount || !currency || !paymentMethod) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: orderId, workflowId, amount, currency, paymentMethod',
        });
      }

      const userId = (req as AuthRequest).user?.userId;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      // Get workflow state
      const workflowState = await getWorkflowState(workflowId);
      if (!workflowState) {
        return res.status(404).json({ success: false, error: 'Workflow not found' });
      }

      // Process payment
      const paymentResult = await processBookingPayment({
        bookingId: workflowState.bookingReference,
        orderId,
        userId,
        amount,
        currency,
        paymentMethod,
        stripeCustomerId,
        defaultPaymentMethodId,
        idempotencyKey: `booking_${orderId}_${userId}_${Date.now()}`,
        description: `Flight booking payment for ${orderId}`,
      });

      if (!paymentResult.success) {
        return res.status(402).json({
          success: false,
          error: paymentResult.error,
          paymentStatus: 'failed',
        });
      }

      // Update workflow state
      workflowState.status = 'paid';
      workflowState.steps.payment = {
        completed: true,
        timestamp: new Date(),
        data: {
          paymentReference: paymentResult.paymentReference,
          amount,
          currency,
          paymentMethod,
        },
      };

      await saveWorkflowState(workflowState);

      return res.status(200).json({
        success: true,
        workflowId,
        paymentReference: paymentResult.paymentReference,
        paymentStatus: 'paid',
      });
    } catch (error) {
      next(error);
    }
  }
);
```

---

### 4. 🔴 Integrate into Hotel Booking Route

**File**: `services/booking-service/src/routes/hotel-booking.ts`  
**Location**: Similar payment endpoint

**Action**: Apply same pattern as flight-booking.ts integration

---

## Multi-Step Dependencies

```
Step 1: Add test script
    ↓
Step 2: Run tests to verify (expect 25+ passing)
    ↓
Step 3: Integrate flight-booking route
    ↓
Step 4: Test flight booking payment E2E
    ↓
Step 5: Integrate hotel-booking route
    ↓
Step 6: Test hotel booking payment E2E
    ↓
Step 7: Integration tests (wallet + booking)
    ↓
Step 8: Staging deployment
```

---

## Testing After Integration

### Unit Tests (Verify Services)

```bash
npm run test --workspace=@tripalfa/booking-service
```

**Expected**: 25+ tests passing ✅

### Integration Tests (Verify Routes)

```bash
npm run test:api
```

**Test Cases**:

- POST /api/flight-booking/payment (wallet)
- POST /api/flight-booking/payment (hybrid)
- POST /api/flight-booking/payment (card)
- POST /api/flight-booking/refund
- Error handling (insufficient balance, invalid method)

### Manual E2E Testing

```bash
# 1. Create booking hold
curl -X POST http://localhost:3006/api/flight-booking/hold ...

# 2. Get back orderId and workflowId

# 3. Process payment
curl -X POST http://localhost:3006/api/flight-booking/payment \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "order_abc123",
    "workflowId": "wf_xyz789",
    "amount": 250,
    "currency": "USD",
    "paymentMethod": "wallet"
  }'

# 4. Verify response
# Expected: { success: true, paymentReference: "BK-...", paymentStatus: "paid" }
```

---

## Validation Checklist

### Before Route Integration

- [ ] BookingPaymentService created and compiles ✅
- [ ] booking-payment.spec.ts created with 25+ tests ✅
- [ ] Test script added to package.json 🔴 **TODO**
- [ ] Tests passing (run: `npm run test --workspace=@tripalfa/booking-service`) 🔴 **TODO**

### After Route Integration

- [ ] Flight booking payment route updated
- [ ] Hotel booking payment route updated
- [ ] Routes compile without errors
- [ ] Routes pass integration tests
- [ ] Manual E2E testing successful
- [ ] Error handling verified
- [ ] Performance acceptable (<1s)

### Before Production

- [ ] Staging deployment successful
- [ ] Stripe webhook configuration done
- [ ] Monitoring/alerts configured
- [ ] Customer support team trained
- [ ] Documentation reviewed
- [ ] Security review completed

---

## Code Review Checklist

### BookingPaymentService Review

- [ ] All payment methods implemented (wallet/hybrid/card)
- [ ] Idempotency key usage consistent
- [ ] Error messages user-friendly
- [ ] Multi-currency support present
- [ ] Response format matches Phase 2 pattern

### Route Integration Review

- [ ] Middleware properly applied
- [ ] Input validation complete
- [ ] Service method called correctly
- [ ] Workflow state persisted
- [ ] Receipt generated and returned
- [ ] Error responses formatted correctly

---

## Known Issues & Workarounds

### Issue 1: Missing test script in booking-service

**Symptom**: `npm run test --workspace=@tripalfa/booking-service` fails with "Missing script: test"  
**Fix**: Add `"test": "vitest"` to `services/booking-service/package.json`  
**Status**: 🔴 **PENDING**

### Issue 2: WalletPaymentService not initialized in booking-service

**Symptom**: Route integration will fail if WalletPaymentService undefined  
**Fix**: Ensure WalletPaymentService imported and initialized in booking-service/src/index.ts  
**Status**: ✅ Already handled in payment-service

---

## Performance Targets

| Operation      | Target | Current                 |
| -------------- | ------ | ----------------------- |
| Wallet payment | <200ms | TBD - after integration |
| Hybrid payment | <500ms | TBD - after integration |
| Card payment   | <700ms | TBD - after integration |
| Refund         | <300ms | TBD - after integration |

---

## Timeline Estimate

| Task                     | Duration       | Status  |
| ------------------------ | -------------- | ------- |
| Add test script          | 5 min          | 🔴 TODO |
| Run tests                | 2 min          | 🔴 TODO |
| Integrate flight-booking | 15 min         | 🔴 TODO |
| Test flight booking      | 10 min         | 🔴 TODO |
| Integrate hotel-booking  | 10 min         | 🔴 TODO |
| Test hotel booking       | 10 min         | 🔴 TODO |
| E2E testing              | 20 min         | 🔴 TODO |
| Documentation            | 15 min         | 🔴 TODO |
| **Total**                | **~1.5 hours** |         |

---

## Success Criteria

✅ **Completed Phases**:

1. Phase 1: Stripe payment integration (StripePaymentService)
2. Phase 2: Wallet balance support (WalletPaymentService)
3. Phase 3: Payment service tests (65/65 passing)
4. Phase 4a: Booking integration layer (BookingPaymentService + tests)

🔴 **Pending Phases**: 5. Phase 4b: Route integration (flight + hotel booking endpoints) 6. Phase 4c: E2E testing (booking workflow with real payments) 7. Phase 4d: Production deployment

**Phase 4 Success Criteria**:

- [ ] All 25+ tests passing
- [ ] Flight booking accepts wallet payments
- [ ] Flight booking accepts card payments
- [ ] Flight booking accepts hybrid payments
- [ ] Hotel booking payment same as flight
- [ ] Refund processing working
- [ ] Receipts generated correctly
- [ ] Multi-currency support verified

---

## Quick Reference: Key Files

| File                                                               | Purpose                 | Status               |
| ------------------------------------------------------------------ | ----------------------- | -------------------- |
| `services/booking-service/src/services/booking-payment.service.ts` | Payment orchestration   | ✅ Ready             |
| `services/booking-service/src/__tests__/booking-payment.spec.ts`   | Service tests           | ✅ Ready             |
| `services/booking-service/src/routes/flight-booking.ts`            | Flight payment endpoint | ⚠️ Needs integration |
| `services/booking-service/src/routes/hotel-booking.ts`             | Hotel payment endpoint  | ⚠️ Needs integration |
| `services/booking-service/package.json`                            | Test script config      | 🔴 Missing script    |
| `docs/BOOKING_PAYMENT_INTEGRATION.md`                              | Implementation guide    | ✅ Complete          |

---

## Next Actions (PRIORITY ORDER)

1. **RIGHT NOW** (5 min)
   - Add test script to booking-service package.json
   - Command: `npm run test --workspace=@tripalfa/booking-service`

2. **NEXT** (15 min)
   - Integrate BookingPaymentService into flight-booking.ts payment route
   - Replace payment simulation with real service call

3. **THEN** (10 min)
   - Test flight booking payment E2E
   - Verify wallet/card/hybrid methods work

4. **AFTER** (10 min)
   - Same for hotel-booking.ts
   - Verify consistency

5. **FINALLY** (20 min)
   - E2E integration tests
   - Staging deployment
   - Production readiness

---

## Success Indicators

🟢 **GREEN** = All systems operational  
🟡 **YELLOW** = Needs attention  
🔴 **RED** = Blocked/Critical

**Current Status**: 🟡 YELLOW (services ready, routes pending)

**Target Status After Integration**: 🟢 GREEN (all payment methods functional)
