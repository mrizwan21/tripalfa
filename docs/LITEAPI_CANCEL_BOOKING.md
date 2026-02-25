# LiteAPI Cancel Booking Implementation

This document details the complete LiteAPI cancellation → refund → reconciliation flow implemented in the TripAlfa booking system.

## Implementation Status: ✅ Complete

---

## End-to-End Cancellation Flow

### Step 1: Customer Requests Cancellation

Customer or agent initiates cancellation request via API.

### Step 2: Fetch Booking Details from LiteAPI

The system fetches booking details including:

- `cancellationPolicies` - cancellation deadline and fees
- `refundableTag` - "RFN" (refundable) or "NRFN" (non-refundable)
- `payment_transaction_id` - original payment reference
- `voucher_id`, `voucher_total_amount` - if voucher was used

### Step 3: Calculate Refundable Amount

Based on cancellation policy:

- **RFN + Before deadline:** Full refund
- **RFN + After deadline:** Refund minus cancellation fee
- **NRFN:** No refund (or partial based on policy)

### Step 4: Process Refunds

- **Wallet payments:** Credit wallet balance via Wallet Service
- **Card payments:** Initiate refund via Payment Gateway
- **Vouchers:** Reverse voucher redemption

### Step 5: Update Booking Record

Store refund details in booking metadata:

- `refundType`: "full" | "partial" | "none"
- `refundableAmount`, `cancellationFee`
- `refundProcessed`, `refundResult`

### Step 6: Send Notification

Notify customer of cancellation and refund status.

---

## API Endpoint

### Cancel Booking

- **Method:** `PUT`
- **Path:** `/api/liteapi/bookings/:bookingId`
- **LiteAPI Endpoint:** `https://book.liteapi.travel/v3.0/bookings/{bookingId}`

### Request Parameters

| Parameter | Type | Required | Description |
| --------- | ------ | -------- | ----------- |
| `bookingId` | string | Yes | The internal booking ID |
| `status` | string | Yes | Set to `'cancelled'` |
| `cancellationReason` | string | No | Reason for cancellation |
| `initiateRefund` | boolean | No | Whether to process refund (default: true) |
| `refundToWallet` | boolean | No | Whether to refund to wallet (default: true) |

### Example Request

```json
{
  "status": "cancelled",
  "cancellationReason": "Customer request",
  "initiateRefund": true,
  "refundToWallet": true
}
```text

### Example Response

```json
{
  "success": true,
  "bookingId": "booking_123",
  "bookingRef": "LITE-ABC123",
  "status": "cancelled",
  "refund": {
    "type": "full",
    "refundable": true,
    "amount": 500.00,
    "cancellationFee": 0,
    "currency": "USD",
    "processed": true,
    "details": {
      "type": "wallet_refund",
      "amount": 500.00,
      "currency": "USD",
      "status": "completed",
      "transactionId": "wallet_txn_123"
    }
  }
}
```text

---

## Refund Calculation Logic

### Flow Diagram

```text
1. Fetch booking from LiteAPI
   ↓
2. Check refundableTag (RFN/NRFN)
   ↓
3. If RFN, check cancellation policy
   ├─ Before cancelTime → Full refund
   └─ After cancelTime → Partial refund (minus fee)
   ↓
4. If NRFN → No refund
```text

### Implementation

```javascript
// Extract from services/booking-service/src/routes/liteapi.ts
const refundableTag = bookingDetails.refundableTag;
const cancelPolicy = bookingDetails.cancellationPolicies?.cancelPolicyInfos?.[0];

if (refundableTag === 'RFN' && cancelPolicy) {
  const now = new Date();
  const cancelTime = new Date(cancelPolicy.cancelTime);
  
  if (now < cancelTime) {
    // Full refund before deadline
    refundableAmount = booking.totalAmount;
    refundType = 'full';
  } else {
    // Partial refund after deadline
    cancellationFee = cancelPolicy.amount;
    refundableAmount = booking.totalAmount - cancellationFee;
    refundType = refundableAmount > 0 ? 'partial' : 'none';
  }
}
```text

---

## Wallet Refund Integration

### Refund to Wallet

When a booking was paid via WALLET:

1. Call Wallet Service: `POST /wallet/refund`
2. Pass: `userId`, `amount`, `currency`, `bookingId`, `originalTransactionId`
3. Create refund transaction linked to original charge

### Ledger Recording

```typescript
// Wallet ledger must record:
{
  transaction_type: 'REFUND',
  amount: refunded_amount,  // positive for credits
  currency: 'USD',
  booking_id: bookingId,
  reference: original_payment_transaction_id,
  source_txn_id: original_wallet_charge_transaction_id,
  status: 'completed',
  balance_before: 100.00,
  balance_after: 600.00  // original 100 + refund 500
}
```text

---

## Reconciliation

### Pull Cancelled Bookings

```bash
GET /bookings?startDate=2026-02-01&endDate=2026-02-02&status=cancelled
```text

### Match Against Wallet Ledger

- Primary: `booking.payment_transaction_id` → `ledger.source_txn_id`
- Verify: `booking.amount_refunded` = `ledger.REFUND.amount`
- Verify: Timestamps within tolerance (±1 hour)

---

## Webhook Handling

### Supported Events

| Event | Description | Status |
|-------|-------------|--------|
| `booking.confirmed` | Hotel booking confirmed | ✅ |
| `booking.cancelled` | Hotel booking cancelled | ✅ |
| `booking.modified` | Hotel booking amended | ✅ |
| `booking.pending` | Hotel booking pending | ✅ |

### Webhook Processing

When `booking.cancelled` event received:

1. Find booking by `booking_id`
2. Update status to `cancelled`
3. Record `refund_amount`, `currency`, `cancellation_id`
4. Send notification to user

---

## Related Files

| File | Purpose |
|------|---------|
| `services/booking-service/src/routes/liteapi.ts` | Main LiteAPI routes including full cancellation + refund flow |
| `services/booking-service/src/routes/webhooks.ts` | Webhook handlers for cancellation events |
| `services/wallet-service/src/services/walletService.ts` | Wallet credit/debit operations |

---

## LiteAPI Documentation Reference

- **Cancel Booking:** <https://docs.liteapi.travel/docs/canceling-a-booking>
- **API Reference:** <https://docs.liteapi.travel/reference/overview>

---

**Last Updated:** February 24, 2026
