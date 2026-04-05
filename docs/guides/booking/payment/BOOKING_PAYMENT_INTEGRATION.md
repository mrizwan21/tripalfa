# Booking Service Payment Integration - Implementation Guide

**Status**: ✅ Phase 2 Complete - Ready for Integration  
**Module**: `BookingPaymentService`  
**Location**: `services/booking-service/src/services/booking-payment.service.ts`

---

## Overview

The **BookingPaymentService** integrates wallet and Stripe payment processing into the booking workflow. It enables flexible payment options:

- **Wallet-Only** - Pay entirely from wallet balance
- **Hybrid** - Split payment (wallet + card)
- **Card-Only** - Traditional Stripe payment
- **Multi-Currency** - Support for USD, EUR, GBP, JPY, etc.

---

## Architecture

### Current Booking Flow

```
1. Hold Booking (Create reservation)
   ↓
2. Payment Processing ⭐ (NEW - WalletPaymentService)
   ├─ Check wallet balance
   ├─ Select payment method
   ├─ Process payment
   └─ Generate receipt
   ↓
3. Issue Ticket
   ↓
4. Customer Confirmation
```

### Payment Method Decision Tree

```
SELECT PAYMENT METHOD
    │
    ├─→ WALLET SELECTED
    │   └─→ Check balance
    │       ├─ Sufficient? → Debit wallet → Complete ✅
    │       └─ Low balance? → Suggest hybrid/top-up
    │
    ├─→ CARD SELECTED
    │   └─→ Charge card via Stripe → Complete ✅
    │
    └─→ HYBRID SELECTED
        └─→ Check wallet balance
            ├─ Has balance? → Split payment
            │   └─→ Debit wallet + Charge card → Complete ✅
            └─ No balance? → Charge entire amount to card
```

---

## Service Integration Points

### 1. Import Required Services

```typescript
// services/booking-service/src/index.ts
import { WalletPaymentService } from '@tripalfa/payment-service';
import { WalletManager } from '@tripalfa/wallet';
import { StripePaymentService } from '@tripalfa/payment-service';
import { IdempotencyService } from '@tripalfa/payment-service';
import { coreDb } from './database';

// Initialize wallet payment service
const walletManager = new WalletManager({ prisma: coreDb });
const walletPaymentService = new WalletPaymentService({
  walletManager,
  stripePaymentService: stripeService,
  idempotencyService: idempotencyStore,
});
```

### 2. Update Payment Route

```typescript
// services/booking-service/src/routes/flight-booking.ts

/**
 * POST /api/flight-booking/payment
 * Process payment for hold booking
 * Supports: wallet, card, hybrid payment methods
 */
router.post(
  '/payment',
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

      // Validate required fields
      if (!orderId || !workflowId || !amount || !currency || !paymentMethod) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields',
        });
      }

      const userId = (req as AuthRequest).user?.userId;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      // Get workflow state
      const workflowState = await getWorkflowState(workflowId);
      if (!workflowState) {
        return res.status(404).json({
          success: false,
          error: 'Workflow not found',
        });
      }

      // Process payment using BookingPaymentService
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
      workflowState.updatedAt = new Date();
      workflowState.steps.payment = {
        completed: true,
        timestamp: new Date(),
        data: {
          paymentReference: paymentResult.paymentReference,
          amount,
          currency,
          paymentMethod,
          walletDebit: paymentResult.walletDebit,
          cardCharge: paymentResult.cardCharge,
          stripePaymentIntentId: paymentResult.stripePaymentIntentId,
          walletTransactionId: paymentResult.walletTransactionId,
        },
      };

      // Generate receipt with payment details
      workflowState.documents!.receipt = generateReceiptHtml(
        { bookingReference: workflowState.bookingReference },
        workflowState.customer!,
        {
          total: amount,
          currency,
          paymentMethod,
          walletDebit: paymentResult.walletDebit,
          cardCharge: paymentResult.cardCharge,
        }
      );

      // Persist workflow state
      await saveWorkflowState(workflowState);

      return res.status(200).json({
        success: true,
        workflowId,
        orderId,
        paymentReference: paymentResult.paymentReference,
        paymentStatus: 'paid',
        paymentMethod,
        walletDebit: paymentResult.walletDebit,
        cardCharge: paymentResult.cardCharge,
        documents: {
          receipt: workflowState.documents!.receipt,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);
```

### 3. Add Refund Handling

```typescript
/**
 * POST /api/flight-booking/refund
 * Process refund for cancelled booking
 */
router.post(
  '/refund',
  authMiddleware,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { orderId, bookingId, amount, currency, reason } = req.body;

      const userId = (req as AuthRequest).user?.userId;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      // Process refund
      const refundResult = await processBookingRefund({
        bookingId,
        orderId,
        userId,
        amount,
        currency,
        paymentReference: `BK-${orderId}`,
        reason,
      });

      if (!refundResult.success) {
        return res.status(400).json({
          success: false,
          error: refundResult.error,
        });
      }

      return res.status(200).json({
        success: true,
        refundId: refundResult.refundId,
        refundStatus: 'processed',
        amountRefunded: amount,
      });
    } catch (error) {
      next(error);
    }
  }
);
```

---

## Payment Request/Response Examples

### 1. Wallet Payment

**Request:**

```bash
curl -X POST http://localhost:3006/api/flight-booking/payment \
  -H "Authorization: Bearer {jwt_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "order_abc123",
    "workflowId": "wf_xyz789",
    "amount": 250.00,
    "currency": "USD",
    "paymentMethod": "wallet"
  }'
```

**Response (200):**

```json
{
  "success": true,
  "workflowId": "wf_xyz789",
  "orderId": "order_abc123",
  "paymentReference": "BK-1710941234-order_abc123",
  "paymentStatus": "paid",
  "paymentMethod": "wallet",
  "walletDebit": 250.0,
  "cardCharge": 0,
  "documents": {
    "receipt": "<html>...</html>"
  }
}
```

### 2. Hybrid Payment

**Request:**

```bash
curl -X POST http://localhost:3006/api/flight-booking/payment \
  -H "Authorization: Bearer {jwt_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "order_def456",
    "workflowId": "wf_abc456",
    "amount": 400.00,
    "currency": "USD",
    "paymentMethod": "hybrid",
    "stripeCustomerId": "cus_test_123",
    "defaultPaymentMethodId": "pm_card_789"
  }'
```

**Response (200):**

```json
{
  "success": true,
  "workflowId": "wf_abc456",
  "orderId": "order_def456",
  "paymentReference": "BK-1710941500-order_def456",
  "paymentStatus": "paid",
  "paymentMethod": "hybrid",
  "walletDebit": 150.0,
  "cardCharge": 250.0,
  "stripePaymentIntentId": "pi_stripe_123",
  "walletTransactionId": "txn_wallet_456"
}
```

### 3. Card Payment

**Request:**

```bash
curl -X POST http://localhost:3006/api/flight-booking/payment \
  -H "Authorization: Bearer {jwt_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "order_ghi789",
    "workflowId": "wf_def789",
    "amount": 600.00,
    "currency": "USD",
    "paymentMethod": "card",
    "stripeCustomerId": "cus_test_123",
    "defaultPaymentMethodId": "pm_card_789"
  }'
```

**Response (200):**

```json
{
  "success": true,
  "paymentReference": "BK-1710941800-order_ghi789",
  "paymentStatus": "paid",
  "paymentMethod": "card",
  "walletDebit": 0,
  "cardCharge": 600.0,
  "stripePaymentIntentId": "pi_stripe_456"
}
```

### 4. Refund Request

**Request:**

```bash
curl -X POST http://localhost:3006/api/flight-booking/refund \
  -H "Authorization: Bearer {jwt_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "order_abc123",
    "bookingId": "booking_abc123",
    "amount": 250.00,
    "currency": "USD",
    "reason": "Customer cancelled booking"
  }'
```

**Response (200):**

```json
{
  "success": true,
  "refundId": "REF-1710942000-order_abc123",
  "refundStatus": "processed",
  "amountRefunded": 250.0
}
```

---

## Frontend Integration

### Payment Method Selector Component

```typescript
// apps/booking-engine/src/components/PaymentMethodSelector.tsx

interface PaymentMethodSelectorProps {
  totalAmount: number;
  currency: string;
  walletBalance: number;
  onMethodSelected: (method: PaymentMethod) => void;
}

export function PaymentMethodSelector({
  totalAmount,
  currency,
  walletBalance,
  onMethodSelected,
}: PaymentMethodSelectorProps) {
  return (
    <div className="payment-methods">
      {/* Show wallet option if balance > 0 */}
      {walletBalance > 0 && (
        <button
          onClick={() => onMethodSelected('wallet')}
          className={walletBalance >= totalAmount ? 'enabled' : 'limited'}
        >
          <span>Pay with Wallet</span>
          <span className="balance">Available: {walletBalance} {currency}</span>
          {walletBalance < totalAmount && (
            <span className="hint">Insufficient balance</span>
          )}
        </button>
      )}

      {/* Show hybrid if wallet partially covers */}
      {walletBalance > 0 && walletBalance < totalAmount && (
        <button
          onClick={() => onMethodSelected('hybrid')}
          className="hybrid-option"
        >
          <span>Wallet + Card</span>
          <span className="amount">
            {walletBalance} {currency} from wallet
            <br />
            {totalAmount - walletBalance} {currency} from card
          </span>
        </button>
      )}

      {/* Always show card option */}
      <button
        onClick={() => onMethodSelected('card')}
        className="card-option"
      >
        <span>Credit/Debit Card</span>
        <span className="amount">Full amount: {totalAmount} {currency}</span>
      </button>
    </div>
  );
}
```

### Payment Processing Flow

```typescript
// apps/booking-engine/src/services/bookingPaymentFlow.ts

async function processBookingPayment(
  bookingDetails: BookingDetails,
  paymentMethod: PaymentMethod
): Promise<PaymentResult> {
  try {
    // Call booking service payment endpoint
    const response = await api.post('/api/flight-booking/payment', {
      orderId: bookingDetails.orderId,
      workflowId: bookingDetails.workflowId,
      amount: bookingDetails.totalAmount,
      currency: bookingDetails.currency,
      paymentMethod,
      stripeCustomerId: authenticatedUser.stripeCustomerId,
      defaultPaymentMethodId: authenticatedUser.defaultPaymentMethodId,
    });

    if (!response.success) {
      if (response.error?.includes('Insufficient')) {
        // Show "Please add funds to wallet" prompt
        showWalletTopUpModal();
        return { success: false, requiresTopUp: true };
      }

      throw new Error(response.error);
    }

    // Store payment details
    storePaymentDetails({
      paymentReference: response.paymentReference,
      paymentMethod: response.paymentMethod,
      walletDebit: response.walletDebit,
      cardCharge: response.cardCharge,
    });

    // Display receipt
    downloadReceipt(response.documents.receipt);

    return {
      success: true,
      paymentReference: response.paymentReference,
      receipt: response.documents.receipt,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Payment failed',
    };
  }
}
```

---

## Error Handling

### Common Error Scenarios

| Status | Error                         | Solution                           |
| ------ | ----------------------------- | ---------------------------------- |
| 402    | "Insufficient wallet balance" | Show wallet top-up option          |
| 402    | "Card declined"               | Suggest alternative payment method |
| 400    | "Invalid payment method"      | Refresh page, try again            |
| 401    | "Unauthorized"                | Re-authenticate user               |
| 404    | "Workflow not found"          | Create booking hold first          |
| 500    | "Payment processing error"    | Retry with exponential backoff     |

### Error Response Format

```json
{
  "success": false,
  "error": "Insufficient wallet balance. Required: 250, Available: 100",
  "paymentStatus": "failed",
  "orderId": "order_abc123"
}
```

---

## Database Schema Updates

### Booking Table Extensions

```prisma
model Booking {
  id                      String      @id @default(cuid())
  orderId                 String      @unique
  userId                  String

  // Payment information
  paymentStatus           String      @default("pending")  // pending, paid, refunded
  totalAmount             Float
  paidAmount              Float       @default(0)
  paymentMethod           String      // wallet, card, hybrid

  // Payment references
  paymentReference        String?     // BK-{timestamp}-{orderId}
  stripePaymentIntentId   String?     @unique
  walletTransactionId     String?     @unique

  // Payment breakdown (for hybrid)
  walletDebit             Float       @default(0)
  cardCharge              Float       @default(0)

  // Refund information
  refundStatus            String?     // pending, processed, failed
  refundReference         String?
  amountRefunded          Float       @default(0)
  refundedAt              DateTime?

  // Timestamp
  createdAt               DateTime    @default(now())
  updatedAt               DateTime    @updatedAt

  user                    User        @relation(fields: [userId], references: [id])
}
```

### Migrations

```sql
-- Add payment tracking columns
ALTER TABLE booking ADD COLUMN IF NOT EXISTS paymentReference VARCHAR(50);
ALTER TABLE booking ADD COLUMN IF NOT EXISTS stripePaymentIntentId VARCHAR(100);
ALTER TABLE booking ADD COLUMN IF NOT EXISTS walletTransactionId VARCHAR(100);
ALTER TABLE booking ADD COLUMN IF NOT EXISTS walletDebit DECIMAL(12,2) DEFAULT 0;
ALTER TABLE booking ADD COLUMN IF NOT EXISTS cardCharge DECIMAL(12,2) DEFAULT 0;

-- Create indexes for payment lookups
CREATE INDEX idx_booking_payment_reference ON booking(paymentReference);
CREATE INDEX idx_booking_stripe_intent ON booking(stripePaymentIntentId);
CREATE INDEX idx_booking_wallet_transaction ON booking(walletTransactionId);
```

---

## Testing Strategy

### Unit Tests

- Payment service layer logic
- Error handling scenarios
- Response formatting
- Idempotency verification

### Integration Tests

- End-to-end booking payment flow
- Wallet + Stripe coordination
- Refund processing
- Multi-currency support

### E2E Tests (Staging)

- Real Stripe integration
- Wallet balance verification
- Payment receipt generation
- UI/UX workflow

---

## Performance Considerations

| Operation      | Latency   | Notes                                   |
| -------------- | --------- | --------------------------------------- |
| Wallet payment | 50-150ms  | Direct wallet debit                     |
| Card payment   | 200-500ms | Includes Stripe API call                |
| Hybrid payment | 300-700ms | Both wallet + Stripe                    |
| Refund         | 100-300ms | Wallet credit + potential Stripe refund |

### Optimization Tips

1. **Cache wallet balance** - Reduce DB lookups
2. **Batch payment operations** - Handle multiple bookings together
3. **Async refunds** - Process refunds in background jobs
4. **Pre-authorize cards** - Speed up card payment processing

---

## Deployment Checklist

- [ ] Update booking-service dependencies
- [ ] Run database migrations
- [ ] Configure environment variables (STRIPE_SECRET_KEY, REDIS_URL)
- [ ] Update booking routes with wallet integration
- [ ] Test payment flow in staging
- [ ] Update API documentation
- [ ] Configure monitoring/alerts
- [ ] Train customer support team
- [ ] Deploy to production
- [ ] Monitor transaction logs

---

## Configuration

### Environment Variables

```bash
# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Redis (for idempotency)
REDIS_URL=redis://localhost:6379

# Wallet
WALLET_DEFAULT_CURRENCY=USD
WALLET_TRANSACTION_TTL=86400  # 24 hours
```

### Feature Flags

```typescript
const PAYMENT_FEATURES = {
  walletPayments: true, // Enable wallet-only payments
  hybridPayments: true, // Enable wallet + card splits
  cardPayments: true, // Enable card-only payments
  multiCurrency: true, // Enable currency conversion
  idempotency: true, // Enable safe retries
};
```

---

## Monitoring & Alerts

### Key Metrics

- Payment success rate (target: 99%+)
- Average payment processing time
- Wallet vs. card payment ratio
- Refund processing time
- Error rates by type

### Alert Thresholds

- [ ] Payment success rate < 95%
- [ ] Average latency > 1 second
- [ ] wallet service unavailable
- [ ] Stripe API errors > 5%

---

## Support & Troubleshooting

### Checking Payment Status

```bash
# View workflow state
GET /api/flight-booking/:orderId?workflowId=wf_xyz

# View payment details
SELECT * FROM booking WHERE orderId = 'order_abc123';

# Check wallet balance
GET /api/wallet/balance?currency=USD
```

### Common Issues

1. **"Insufficient balance" error**
   - Verify wallet balance is sufficient
   - Check for concurrent deductions

2. **Duplicate charge**
   - Verify idempotency key is unique
   - Check Redis connection for caching

3. **Refund not appearing in wallet**
   - Verify refund was processed successfully
   - Check transaction history in wallet service

---

## Related Documentation

- [WALLET_PAYMENT_PHASE2.md](./WALLET_PAYMENT_PHASE2.md) - Wallet service spec
- [PAYMENT_PHASE1_IMPLEMENTATION.md](./PAYMENT_PHASE1_IMPLEMENTATION.md) - Stripe integration
- [BOOKING_SERVICE_EXPLORATION.md](./BOOKING_SERVICE_EXPLORATION.md) - Service architecture
