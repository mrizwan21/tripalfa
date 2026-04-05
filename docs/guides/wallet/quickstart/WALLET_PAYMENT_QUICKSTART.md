# Wallet Payment Quick Start Guide

**Phase 2 Implementation** | **Status**: ✅ Complete (65 tests passing)

---

## 5-Minute Setup

### 1. Import the Service

```typescript
import { WalletPaymentService } from '@tripalfa/payment-service';
import { WalletManager } from '@tripalfa/wallet';
import { StripePaymentService } from '@tripalfa/payment-service';
import { IdempotencyService } from '@tripalfa/payment-service';
```

### 2. Initialize

```typescript
const service = new WalletPaymentService({
  walletManager: new WalletManager({ prisma: db }),
  stripePaymentService: stripeService,
  idempotencyService: idempotencyStore,
});
```

### 3. Process Payment

```typescript
// Full wallet payment
const result = await service.processWalletPayment({
  bookingId: 'booking_123',
  userId: 'user_456',
  amount: 150,
  currency: 'USD',
  idempotencyKey: 'req_unique_key',
  description: 'Hotel booking',
});

if (result.success) {
  console.log(`Paid $${result.walletDebit} from wallet`);
} else {
  console.error(result.error);
}
```

---

## Common Use Cases

### ✅ Full Wallet Payment

```typescript
await service.processWalletPayment({
  bookingId: 'booking_abc',
  userId: 'user_xyz',
  amount: 250,
  currency: 'USD',
  idempotencyKey: `wallet_${Date.now()}`,
  description: '5-star hotel booking',
});
```

### ✅ Hybrid Payment (Wallet + Card)

```typescript
await service.processHybridPayment({
  bookingId: 'booking_abc',
  userId: 'user_xyz',
  totalAmount: 500, // Total price
  walletAmount: 200, // From wallet
  cardAmount: 300, // From card
  currency: 'USD',
  customerId: 'cus_123',
  paymentMethodId: 'pm_456',
  idempotencyKey: `hybrid_${Date.now()}`,
  description: 'Hotel booking',
});
```

### ✅ Refund to Wallet

```typescript
await service.refundToWallet(
  'user_xyz',
  'USD',
  250, // Refund amount
  'booking_abc',
  'ref_stripe_123', // Optional Stripe refund ID
  'Booking cancelled'
);
```

### ✅ Currency Conversion

```typescript
await service.convertWalletBalance(
  'user_xyz',
  'USD', // From currency
  'EUR', // To currency
  100 // Amount in USD
);
```

### ✅ Check Payment Status

```typescript
const status = await service.getPaymentStatus('booking_abc', 'user_xyz');

console.log('Wallet balances:', status.wallets);
console.log('Last transactions:', status.recentTransactions);
```

---

## Error Handling

```typescript
const result = await service.processWalletPayment({...});

if (!result.success) {
  switch (true) {
    case result.error?.includes("Insufficient"):
      // Show "Please add funds to wallet" message
      break;
    case result.error?.includes("greater than 0"):
      // Show "Invalid amount" message
      break;
    case result.error?.includes("sum"):
      // Show "Amount calculation error" message
      break;
    default:
      // Show generic error with result.error
  }
}
```

---

## Response Types

### WalletPaymentResult

```typescript
{
  success: boolean;
  walletTransactionId?: string;    // ID of wallet debit
  stripePaymentIntentId?: string;  // ID of Stripe charge (hybrid only)
  walletDebit: number;              // Amount taken from wallet
  cardCharge: number;               // Amount charged to card
  currency: string;
  bookingId: string;
  timestamp: string;
  error?: string;                   // Only if success: false
}
```

---

## Testing

```bash
# Run all tests
npm run test --workspace=@tripalfa/payment-service

# Expected output:
# ✓ src/__tests__/wallet-payment.spec.ts (22 tests)
# ✓ src/__tests__/payment-service.spec.ts (19 tests)
# ✓ src/__tests__/payment-routes.spec.ts (24 tests)
# Total: 65 tests passing
```

---

## Best Practices

| ✅ Do                       | ❌ Don't                   |
| --------------------------- | -------------------------- |
| Use unique idempotency keys | Reuse same idempotency key |
| Check balance before hybrid | Assume sufficient balance  |
| Catch all error types       | Ignore error responses     |
| Log transaction IDs         | Process without tracking   |
| Validate amounts > 0        | Trust user input           |
| Use ISO currency codes      | Use custom codes           |

---

## Idempotency Example

```typescript
const key = `booking_${bookingId}_${userId}`;

// First attempt - processes payment
const result1 = await service.processWalletPayment({
  idempotencyKey: key,
  // ... other params
});

// Network fails, retry...
// Second attempt - returns SAME result (no duplicate charge)
const result2 = await service.processWalletPayment({
  idempotencyKey: key,
  // ... same params
});

// result1 === result2 ✅
```

---

## Integration Example

```typescript
// In booking controller
async createBooking(req: Request, res: Response) {
  const { hotelId, nights, paymentMethod } = req.body;
  const userId = req.user.id;

  // Calculate total price
  const totalPrice = calculateTotal(hotelId, nights);

  try {
    let paymentResult;

    if (paymentMethod === 'wallet') {
      paymentResult = await walletPaymentService.processWalletPayment({
        bookingId: uuidv4(),
        userId,
        amount: totalPrice,
        currency: "USD",
        idempotencyKey: `booking_${userId}_${Date.now()}`,
        description: `Booking hotel ${hotelId}`,
      });
    } else if (paymentMethod === 'hybrid') {
      const walletBalance = await getWalletBalance(userId, "USD");
      paymentResult = await walletPaymentService.processHybridPayment({
        bookingId: uuidv4(),
        userId,
        totalAmount: totalPrice,
        walletAmount: Math.min(walletBalance, totalPrice),
        cardAmount: Math.max(0, totalPrice - walletBalance),
        currency: "USD",
        // ... card details
      });
    }

    if (!paymentResult.success) {
      return res.status(402).json({ error: paymentResult.error });
    }

    // Create booking in database
    const booking = await db.booking.create({
      data: {
        hotelId,
        userId,
        nights,
        totalPrice,
        paymentTransactionId: paymentResult.walletTransactionId || paymentResult.stripePaymentIntentId,
        status: 'confirmed',
      },
    });

    return res.json({ success: true, booking });
  } catch (error) {
    console.error('Booking creation failed:', error);
    res.status(500).json({ error: 'Booking failed' });
  }
}
```

---

## Troubleshooting

| Problem                   | Solution                                    |
| ------------------------- | ------------------------------------------- |
| "is not a function"       | Verify service initialization               |
| "Undefined walletManager" | Check constructor params                    |
| Tests failing             | Run `npm install` and `npm run db:generate` |
| Idempotency not working   | Check Redis connection                      |
| High latency              | Check Stripe API status                     |

---

## Next Steps

1. **Read Full Documentation** → `WALLET_PAYMENT_PHASE2.md`
2. **Review Test Cases** → `src/__tests__/wallet-payment.spec.ts`
3. **Implement in Booking Service** → Use examples above
4. **Deploy to Staging** → Test with real Stripe keys
5. **Monitor in Production** → Track transaction metrics

---

## Support Commands

```bash
# Check service health
curl http://localhost:3007/health

# View API documentation
curl http://localhost:3007/payment/openapi.json

# Run with verbose logging
DEBUG=* npm run dev --workspace=@tripalfa/payment-service
```

---

**Questions?** Check the full guide: `docs/WALLET_PAYMENT_PHASE2.md`
