# LiteAPI Hold Booking (Pay-Later) Flow

## Overview

This document details the **hold booking** (pay-later / pay-at-property) flow using LiteAPI. This feature allows customers to reserve hotel rooms without immediate payment, with payment collected later. **This feature is only available for refundable rates.**

---

## Summary of Endpoints

| Step | Endpoint                    | Description                           |
| ---- | --------------------------- | ------------------------------------- |
| 1    | `POST /rates/prebook`       | Create/check a hold (prebook session) |
| 2    | `GET /prebooks/{prebookId}` | (Optional) Retrieve a stored prebook  |
| 3    | `POST /rates/book`          | Confirm the hold (complete booking)   |
| 4    | `GET /bookings/{bookingId}` | Verify booking status/details         |

---

## Important Rule

> **Hold bookings are only available for refundable rates.** Non-refundable rates cannot use the hold/pay-later flow and must be paid immediately at booking time.

---

## Architecture

### Flow Diagram

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                        HOLD BOOKING FLOW                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌──────────┐     ┌──────────────┐     ┌───────────┐     ┌────────────┐ │
│   │  User    │────▶│  PREBOOK     │────▶│  HOLD     │────▶│  COMPLETE │ │
│   │ Selects  │     │  (Hold)      │     │  (Wait)   │     │  BOOKING  │ │
│   │ Refundable│     │              │     │            │     │            │ │
│   │  Rate    │     │  Price Hold  │     │  60 min   │     │  Payment  │ │
│   └──────────┘     └──────────────┘     └───────────┘     └────────────┘ │
│                         │                    │                  │          │
│                         │                    │                  │          │
│                    ┌────▼────┐          ┌────▼────┐        ┌───▼───────┐  │
│                    │ Validate│          │  User   │        │  Booking  │  │
│                    │ Refundable│         │  Pays   │        │ Confirmed │  │
│                    │  Rate    │          │  Later  │        │           │  │
│                    └─────────┘          └─────────┘        └───────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Database Schema

```text
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│   Prebook       │       │    Booking      │       │   Workflow      │
│   (60min TTL)   │       │   (Permanent)   │       │   (In-Memory)   │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ transactionId   │──────▶│ bookingRef      │       │ workflowId      │
│ offerId         │       │ status          │       │ status          │
│ price           │       │ metadata:       │       │ steps:         │
│ currency        │       │   liteApiPrebook│       │   hold          │
│ expiresAt       │       │   prebookExpiry │       │   payment       │
│ status          │       │   validationW   │       │   confirmation  │
└─────────────────┘       └─────────────────┘       └─────────────────┘
```

---

## Step-by-Step Implementation

### Step 1: Create Prebook (Hold)

**Endpoint:** `POST /rates/prebook`  
**Full URL:** `https://book.liteapi.travel/v3.0/rates/prebook`

The prebook creates a temporary hold on the rate. It validates the price and returns a transaction ID that can be used to complete the booking later.

#### Request Fields (from Prebook Response)

When calling prebook, ensure you check these fields in the response:

| Field                         | Type         | Description                              |
| ----------------------------- | ------------ | ---------------------------------------- |
| `transactionId`               | string       | The ID to use for completing the booking |
| `expiresAt`                   | string (ISO) | When the prebook expires                 |
| `data.priceDifferencePercent` | number       | Price change percentage                  |
| `data.cancellationChanged`    | boolean      | Cancellation policy changed              |
| `data.boardChanged`           | boolean      | Board type changed                       |
| `data.paymentTypes`           | string[]     | Available payment methods                |
| `data.creditLine`             | object       | Wallet credit information                |

#### Example Request

```json
{
  "offerId": "offer_abc123xyz",
  "price": {
    "amount": 450.0,
    "currency": "USD"
  },
  "rooms": 1,
  "guests": [
    {
      "firstName": "John",
      "lastName": "Doe"
    }
  ],
  "includeCreditBalance": true
}
```

#### Example Response: Prebook Created

```json
{
  "transactionId": "txn_hold_12345",
  "status": "pending",
  "expiresAt": "2026-02-25T14:30:00Z",
  "data": {
    "priceDifferencePercent": 0,
    "cancellationChanged": false,
    "boardChanged": false,
    "paymentTypes": ["ACC_CREDIT_CARD", "WALLET", "TRANSACTION"],
    "creditLine": {
      "remainingCredit": 500.0,
      "currency": "USD"
    }
  }
}
```

#### Important Validations

1. **Refundable Rate Check** (Critical)
   - Only allow hold for rates where `refundableTag === 'RFN'` or `isRefundable === true`
   - Return error for non-refundable rates

2. **Price Validation**
   - Check `priceDifferencePercent` - warn user if price changed
   - Re-confirm price if change > 0%

3. **Cancellation Policy**
   - Check `cancellationChanged` - inform user if policy modified
   - Display updated cancellation policy

4. **Expiry Warning**
   - Inform user when prebook expires
   - Typical expiry: 30-60 minutes

---

### Step 2: Retrieve Prebook (Optional)

**Endpoint:** `GET /prebooks/{prebookId}`  
**Full URL:** `https://book.liteapi.travel/v3.0/prebooks/{prebookId}`

Use this to check the status of a prebook or retrieve details.

#### Example Response: Prebook Details

```json
{
  "prebookId": "txn_hold_12345",
  "status": "pending",
  "expiresAt": "2026-02-25T14:30:00Z",
  "offerId": "offer_abc123xyz",
  "price": {
    "amount": 450.0,
    "currency": "USD"
  }
}
```

---

### Step 3: Complete Booking (Confirm Hold)

**Endpoint:** `POST /rates/book`  
**Full URL:** `https://book.liteapi.travel/v3.0/rates/book`

When the user is ready to pay, use the transaction ID from the prebook to complete the booking.

#### Request Fields

| Field              | Type   | Required | Description                       |
| ------------------ | ------ | -------- | --------------------------------- |
| `prebookId`        | string | Yes      | The transactionId from prebook    |
| `holder`           | object | Yes      | Guest contact information         |
| `holder.firstName` | string | Yes      | First name                        |
| `holder.lastName`  | string | Yes      | Last name                         |
| `holder.email`     | string | Yes      | Email address                     |
| `holder.phone`     | string | No       | Phone number                      |
| `guests`           | array  | No       | Array of guest details            |
| `payment`          | object | Yes      | Payment details                   |
| `payment.method`   | string | Yes      | `WALLET`, `ACC_CREDIT_CARD`, etc. |

#### Example Request: Complete Booking

```json
{
  "prebookId": "txn_hold_12345",
  "holder": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phone": "+1234567890"
  },
  "guests": [
    {
      "occupancyNumber": 1,
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "phone": "+1234567890"
    }
  ],
  "payment": {
    "method": "WALLET"
  }
}
```

#### Example Response: Booking Confirmed

```json
{
  "confirmationId": "LIT-20260224-ABC123",
  "status": "confirmed",
  "bookingRef": "LIT-20260224-ABC123",
  "hotelName": "Grand Plaza Hotel",
  "checkIn": "2026-03-01",
  "checkOut": "2026-03-05",
  "guestName": "John Doe",
  "totalAmount": 450.0,
  "currency": "USD"
}
```

---

### Step 4: Verify Booking Status

**Endpoint:** `GET /bookings/{bookingId}`  
**Full URL:** `https://book.liteapi.travel/v3.0/bookings/{bookingId}`

#### Example Response: Booking Details

```json
{
  "bookingId": "LIT-20260224-ABC123",
  "status": "confirmed",
  "hotel": {
    "name": "Grand Plaza Hotel",
    "address": "123 Main Street, Paris"
  },
  "guest": {
    "firstName": "John",
    "lastName": "Doe"
  },
  "checkIn": "2026-03-01",
  "checkOut": "2026-03-05",
  "roomType": "Deluxe King",
  "cancellationPolicy": "Free cancellation until 48 hours before check-in"
}
```

---

## TripAlfa Loyalty & Points Tier System

> **Important:** The Loyalty and Points Tier system described in this documentation is **TripAlfa's own loyalty program**, not LiteAPI's. It is **applicable for all bookings made through LiteAPI and Duffel**.

### Loyalty Program Overview

TripAlfa's loyalty program provides points and tier benefits for all bookings:

| Tier     | Points Multiplier | Benefits                                                        |
| -------- | ----------------- | --------------------------------------------------------------- |
| Bronze   | 1x                | 5% discount on bookings                                         |
| Silver   | 1.5x              | 10% discount + priority support                                 |
| Gold     | 2x                | 15% discount + priority support + free upgrades                 |
| Platinum | 3x                | 20% discount + priority support + free upgrades + lounge access |

### How It Works

1. **Earn Points:** All bookings (LiteAPI hotels, Duffel flights) earn loyalty points
2. **Tier Progression:** Points accumulate to unlock higher tiers
3. **Redeem Points:** Points can be redeemed for discounts on future bookings
4. **Tier Benefits:** Each tier provides additional benefits

### API Endpoints for Loyalty

| Endpoint                                       | Description                  |
| ---------------------------------------------- | ---------------------------- |
| `GET /api/loyalties`                           | Get loyalty program settings |
| `PUT /api/loyalties`                           | Update loyalty program       |
| `GET /api/loyalty/user/:userId`                | Get user's loyalty status    |
| `POST /api/loyalty/user/:userId/redeem-points` | Redeem points                |
| `GET /api/loyalty/transactions/:userId`        | Get loyalty transactions     |
| `GET /api/loyalty/tiers`                       | Get all tier information     |

---

## Integration in TripAlfa

### Backend Service (liteapi.ts)

The LiteAPI integration is in `services/booking-service/src/routes/liteapi.ts`:

```typescript
// POST /rates/prebook - Create checkout session
router.post("/rates/prebook", async (req: Request, res: Response) => {
  const {
    offerId,
    price,
    currency,
    guestDetails,
    rooms,
    userId,
    includeCreditBalance = true,
  } = req.body;

  // Build payload
  const payload = {
    offerId,
    price: { amount: price, currency: currency || "USD" },
    rooms: rooms || 1,
    includeCreditBalance,
  };

  if (guestDetails) {
    payload.guests = Array.isArray(guestDetails)
      ? guestDetails
      : [guestDetails];
  }

  const result = await liteApiBookRequest("/rates/prebook", "POST", payload);

  // Return with validation warnings
  res.json({ ...result, validationWarnings });
});

// POST /rates/book - Complete a booking
router.post("/rates/book", async (req: Request, res: Response) => {
  const { prebookId, holder, guests, paymentDetails } = req.body;

  const payload = {
    prebookId,
    holder: { firstName, lastName, email, phone },
    guests: guests || [],
    payment: { method: paymentDetails?.method || "WALLET" },
  };

  const result = await liteApiBookRequest("/rates/book", "POST", payload);
  res.json(result);
});
```

### Hotel Booking Orchestrator (hotel-booking.ts)

The hotel booking orchestrator at `services/booking-service/src/routes/hotel-booking.ts` implements the complete flow:

```typescript
// POST /api/hotel-booking/hold - Create hold booking
router.post("/hold", async (req: Request, res: Response) => {
  // 1. Check if hold is allowed (only for refundable rates)
  const isRefundable = req.body.isRefundable !== false;

  if (!isRefundable) {
    return res.status(400).json({
      error: "Hold booking is not available for non-refundable rates.",
      holdAvailable: false,
      reason: "non_refundable_rate",
    });
  }

  // 2. Create workflow state with status 'hold'
  const workflowState = {
    status: "hold",
    steps: {
      hold: { completed: true, timestamp: new Date() },
      payment: { completed: false },
    },
  };

  // 3. Return hold confirmation with expiry
  res.json({
    workflowId,
    bookingId,
    status: "hold",
    paymentRequiredBy: new Date(Date.now() + 12 * 60 * 60 * 1000),
  });
});

// POST /api/hotel-booking/payment - Process payment
router.post("/payment", async (req: Request, res: Response) => {
  // Complete the payment and update status to 'paid'
  workflowState.status = "paid";
  workflowState.steps.payment.completed = true;
});
```

---

## Validations

### 1. Refundable Rate Guard (Critical)

```typescript
// Check refundable status from rate/offer
const isRefundable =
  rate.refundableTag === "RFN" ||
  rate.isRefundable === true ||
  rate.refundable === true;

if (!isRefundable) {
  return {
    error: "Hold booking is not available for non-refundable rates.",
    holdAvailable: false,
    reason: "non_refundable_rate",
  };
}
```

### 2. Prebook Validation Warnings

After creating a prebook, check for these warnings:

| Warning                       | Action                               |
| ----------------------------- | ------------------------------------ |
| `priceDifferencePercent > 0`  | Re-confirm price with user           |
| `cancellationChanged`         | Display new cancellation policy      |
| `boardChanged`                | Inform user about board type change  |
| `Insufficient wallet balance` | Prompt for additional payment method |

### 3. Expiry Handling

```typescript
const now = new Date();
const expiresAt = new Date(prebookResponse.expiresAt);
const timeRemaining = expiresAt.getTime() - now.getTime();

if (timeRemaining <= 0) {
  return { error: "Prebook has expired. Please create a new hold." };
}

// Warn if less than 10 minutes remaining
if (timeRemaining < 10 * 60 * 1000) {
  warnings.push("Prebook expires in less than 10 minutes");
}
```

---

## Common Error Cases

| Error Code            | Description               | Resolution                    |
| --------------------- | ------------------------- | ----------------------------- |
| `OFFER_NOT_FOUND`     | The offer ID is invalid   | Re-search for available rates |
| `OFFER_EXPIRED`       | Rate no longer available  | Re-search for current rates   |
| `PRICE_CHANGED`       | Price differs from quoted | Re-confirm with user          |
| `INSUFFICIENT_WALLET` | Not enough wallet balance | Use alternative payment       |
| `INVALID_CARD`        | Card payment failed       | Try different card            |
| `BOOKING_NOT_FOUND`   | Prebook doesn't exist     | Create new prebook            |

---

## Frontend Integration

### API Calls (api.ts)

```typescript
// Check if rate is refundable
const canHold = rate.refundable || rate.refundableTag === "RFN";

// Create hold booking
export async function holdHotelBooking(bookingData: any) {
  const res = await api.post("/api/hotel-booking/hold", bookingData);
  return res;
}

// Complete booking with payment
export async function confirmHotelBooking(paymentData: any) {
  const res = await api.post("/api/hotel-booking/payment", paymentData);
  return res;
}
```

### UI Display (PassengerDetails.tsx)

```tsx
// Show hold option only for refundable rates
{
  (isHotel ? summary?.hotel?.refundable : passedFlight?.refundable) ? (
    <button onClick={() => handleFormSubmit("hold")}>Pay Later (Hold)</button>
  ) : (
    <button disabled>Hold not available for non-refundable rates</button>
  );
}
```

---

## Environment Variables

```bash
# LiteAPI Booking API
LITEAPI_BOOK_BASE_URL=https://book.liteapi.travel/v3.0
LITEAPI_API_KEY=your_api_key
LITEAPI_PROD_API_KEY=your_production_key

# Cache settings (prebook TTL)
PREBOOK_SESSION_TTL=3600  # 60 minutes
```

---

## Testing Checklist

- [ ] Prebook creates successfully for refundable rate
- [ ] Prebook fails for non-refundable rate
- [ ] Prebook expiry is handled correctly
- [ ] Price change warnings are displayed
- [ ] Cancellation policy changes are shown
- [ ] Complete booking succeeds with valid prebook
- [ ] Complete booking fails with expired prebook
- [ ] Wallet payment works for hold bookings
- [ ] Card payment works for hold bookings
- [ ] Booking status is verified correctly
- [ ] Loyalty points are awarded after booking
- [ ] Tier benefits apply correctly

---

## Summary

| Component                              | Status                    |
| -------------------------------------- | ------------------------- |
| POST /rates/prebook                    | ✅ Implemented            |
| GET /prebooks/{prebookId}              | ✅ Implemented            |
| POST /rates/book                       | ✅ Implemented            |
| GET /bookings/{bookingId}              | ✅ Implemented            |
| Refundable validation                  | ✅ Implemented            |
| Wallet payment support                 | ✅ Implemented            |
| Expiry handling                        | ✅ Implemented            |
| Validation warnings                    | ✅ Implemented            |
| **TripAlfa Loyalty Program**           | ✅ **Own Implementation** |
| Loyalty applicable to LiteAPI & Duffel | ✅                        |

---

**Last Updated:** February 24, 2026  
**LiteAPI Documentation:** <https://docs.liteapi.travel/reference/overview>
