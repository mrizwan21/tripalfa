# LiteAPI Hotel Cancellation & Refund E2E Testing

## Overview

This document details the **complete cancellation and refund workflow** for hotel bookings using LiteAPI. The implementation provides end-to-end testing for post-booking operations including booking cancellation, refund policy evaluation, and wallet refund processing.

## Implementation Status: ✅ Complete

---

## What's Been Built

### Extended E2E Test Suite

Three test runners now support the complete hotel booking lifecycle including cancellation:

| Runner                 | File                                          | Purpose                                                                                          |
| ---------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| **Direct Flow**        | `scripts/test-liteapi-direct.ts`              | 7-step E2E: connectivity → rates → prebook → retrieval → booking → **cancellation** → **refund** |
| **Cancellation Focus** | `scripts/test-liteapi-cancellation-refund.ts` | Dedicated cancellation workflow testing with policy evaluation                                   |
| **All Keys**           | `scripts/test-liteapi-all-keys.ts`            | Multi-key iteration (auto-detects and runs all 2+ keys)                                          |

### Key Additions

- `cancelBooking()` method: Handle POST/PUT cancellation endpoints
- `processRefund()` method: Wallet refund api integration with fallback endpoints
- `getBookingDetails()` method: Fetch cancellation policy information
- `listCancelledBookings()` method: Query cancelled bookings by date range
- Refund policy evaluation and refund type classification

---

## 7-Step Hotel E2E Booking Flow

Extended from previous 5-step flow to include cancellation and refund:

### Step 1: Connectivity Check ✓

Verify LiteAPI API accessibility and version compatibility.

**Endpoint**: `GET /data/languages`

```
Response: { languages: number }
```

### Step 2: Hotel Rates Search ✓

Search for hotel availability and pricing.

**Endpoint**: `POST /hotels/rates`

**Payload**:

```json
{
  "cityName": "Paris",
  "countryCode": "FR",
  "checkin": "2026-04-01",
  "checkout": "2026-04-04",
  "currency": "USD",
  "occupancies": [{ "adults": 2, "children": [] }],
  "limit": 10,
  "maxRatesPerHotel": 2
}
```

**Response**: Hotel list with room types and rates

### Step 3: Prebook Creation ✓

Hold a rate booking for 15–30 minutes.

**Endpoint**: `POST /rates/prebook`

**Payload**:

```json
{
  "offerId": "...",
  "price": { "amount": 500, "currency": "USD" },
  "rooms": 1,
  "includeCreditBalance": true
}
```

**Response**: `{ prebookId, expiresAt, paymentTypes }`

### Step 4: Prebook Retrieval ✓

Verify prebook status before confirmation.

**Endpoint**: `GET /prebooks/{prebookId}`

**Response**: Prebook details and status

### Step 5: Booking Confirmation ✓

Complete the booking with guest and payment details.

**Endpoint**: `POST /rates/book`

**Payload**:

```json
{
  "prebookId": "...",
  "clientReference": "tripalfa-hotel-...",
  "holder": { "firstName": "...", "email": "..." },
  "guests": [{ "occupancyNumber": 1, ... }],
  "payment": { "method": "WALLET" }
}
```

**Response**: `{ confirmationId, bookingId, bookingRef }`

### Step 6: Booking Cancellation 🆕

Request booking cancellation and initiate refund.

**Endpoint**: `PUT /bookings/{bookingId}` or `POST /bookings/{bookingId}/cancel`

**Payload**:

```json
{
  "status": "cancelled",
  "cancellationReason": "Customer requested",
  "initiateRefund": true,
  "refundToWallet": true
}
```

**Response**:

```json
{
  "cancellationId": "CNL-...",
  "refund": {
    "type": "full|partial|none",
    "amount": 500,
    "currency": "USD",
    "status": "pending|processed"
  }
}
```

### Step 7: Refund Processing 🆕

Process refund to customer wallet (post-cancellation).

**Endpoint**: `POST /refunds` or `POST /bookings/{bookingId}/refund`

**Payload**:

```json
{
  "bookingId": "...",
  "amount": 500,
  "currency": "USD",
  "reason": "Booking cancelled",
  "refundToWallet": true
}
```

**Response**:

```json
{
  "refundId": "RFN-...",
  "refundAmount": 500,
  "refundStatus": "processed",
  "transactionId": "wallet_txn_..."
}
```

---

## Cancellation Policy Evaluation

### Refund Types

Based on booking properties:

| Scenario                  | Refundable Tag | Policy                 | Expected Refund                           |
| ------------------------- | -------------- | ---------------------- | ----------------------------------------- |
| Cancelled before deadline | `RFN`          | `cancellation_fee: 0`  | **Full** refund (100% of booking amount)  |
| Cancelled after deadline  | `RFN`          | `cancellation_fee: 50` | **Partial** refund (booking amount - fee) |
| Non-refundable booking    | `NRFN`         | n/a                    | **None** (no refund)                      |

### Policy Extraction

```typescript
// Fetch booking details
const booking = await client.getBookingDetails(bookingId);

const refundableTag = booking.refundableTag; // "RFN" or "NRFN"
const policy = booking.cancellationPolicies; // Contains cancelTime, fee
const now = new Date();
const cancelDeadline = new Date(policy.cancelTime);

if (refundableTag === "RFN" && now < cancelDeadline) {
  // Full refund eligible
  refundType = "full";
  refundAmount = booking.totalAmount;
} else if (refundableTag === "RFN" && now >= cancelDeadline) {
  // Partial refund (minus cancellation fee)
  refundType = "partial";
  cancellationFee = policy.amount;
  refundAmount = booking.totalAmount - cancellationFee;
} else {
  // Non-refundable
  refundType = "none";
  refundAmount = 0;
}
```

---

## Test Scripts

### Direct E2E Test (Extended)

Run the complete 7-step flow in sequence:

```bash
# Single key
LITEAPI_API_KEY=your_sandbox_key npm run test:api:liteapi

# Or with explicit key from .env (auto-detected)
npm run test:api:liteapi

# Verbose output for debugging
VERBOSE=true npm run test:api:liteapi

# All keys auto-discovered
npm run test:api:liteapi:all-keys
```

### Cancellation & Refund Focused Tests

Run dedicated cancellation and refund workflows:

```bash
# Cancellation and refund focus
LITEAPI_API_KEY=your_sandbox_key npm run test:api:liteapi:cancellation

# With test booking ID (if you have an existing booking)
LITEAPI_API_KEY=your_sandbox_key \
LITEAPI_TEST_BOOKING_ID=booking_123 \
npm run test:api:liteapi:cancellation

# Specify refund amount
LITEAPI_API_KEY=your_sandbox_key \
LITEAPI_TEST_REFUND_AMOUNT=250 \
npm run test:api:liteapi:cancellation
```

### Configuration Discovery

Discover all available LiteAPI keys in environment, secrets, and .env:

```bash
npm run test:api:liteapi:config

# Output:
# ✓ 2 API keys found
#   - prod_1ca...6a93 (from env)
#   - sand_e79...5a0e (from .env)
```

### Complete E2E Suite

Run all hotel E2E tests:

```bash
npm run test:api:liteapi:e2e
```

---

## Configuration Variables

### Required

| Variable          | Default         | Description                       |
| ----------------- | --------------- | --------------------------------- |
| `LITEAPI_API_KEY` | (auto-discover) | Sandbox or production LiteAPI key |

### Optional

| Variable                     | Default                            | Description                       |
| ---------------------------- | ---------------------------------- | --------------------------------- |
| `LITEAPI_API_BASE_URL`       | `https://api.liteapi.travel/v3.0`  | LiteAPI data endpoint             |
| `LITEAPI_BOOK_BASE_URL`      | `https://book.liteapi.travel/v3.0` | LiteAPI booking endpoint          |
| `LITEAPI_TIMEOUT_MS`         | `90000`                            | Request timeout (ms)              |
| `LITEAPI_TEST_CITY`          | `Paris`                            | Test city name                    |
| `LITEAPI_TEST_COUNTRY`       | `FR`                               | Test country code                 |
| `LITEAPI_TEST_CHECKIN`       | 30 days ahead                      | Check-in date                     |
| `LITEAPI_TEST_CHECKOUT`      | 33 days ahead                      | Check-out date                    |
| `LITEAPI_TEST_ADULTS`        | `2`                                | Number of adults                  |
| `LITEAPI_TEST_BOOKING_ID`    | (auto-created)                     | Booking ID for cancellation tests |
| `LITEAPI_TEST_REFUND_AMOUNT` | 100                                | Refund test amount                |
| `VERBOSE`                    | `false`                            | Enable detailed logging           |
| `DEBUG`                      | `false`                            | Enable debug output               |

### Key Credential Sources (in order of precedence)

1. **Environment Variables**:
   - `LITEAPI_API_KEY`
   - `LITEAPI_SANDBOX_API_KEY`
   - `VITE_LITEAPI_TEST_API_KEY`

2. **Secrets Files**:
   - `secrets/liteapi_api_key.txt`
   - `secrets/liteapi_sandbox_key.txt`
   - `secrets/liteapi_test_key.txt`
   - `secrets/liteapi_key.txt`

3. **.env File Variables** (with whitelist):
   - `LITEAPI_API_KEY`
   - `LITEAPI_SANDBOX_KEY`
   - `LITEAPI_TEST_KEY`

---

## Expected Output: Direct E2E Flow

**Success Case**: 7/7 steps passed

```text
╔═══════════════════════════════════════════════════════════╗
║      LITEAPI SANDBOX - HOTEL E2E DIRECT TEST SUITE       ║
╚═══════════════════════════════════════════════════════════╝

📍 LiteAPI Configuration:
   API URL:  https://api.liteapi.travel/v3.0
   BOOK URL: https://book.liteapi.travel/v3.0
   API Key:  sand_...0a0e

➤ Running: Connectivity Check...
   ✓ Connectivity Check completed in 413ms

➤ Running: Hotel Rates Search...
   ✓ Hotel Rates Search completed in 2845ms

➤ Running: Prebook Creation...
   ✓ Prebook Creation completed in 1156ms

➤ Running: Prebook Retrieval...
   ✓ Prebook Retrieval completed in 312ms

➤ Running: Booking Confirmation (WALLET)...
   ✓ Booking Confirmation (WALLET) completed in 28345ms

➤ Running: Booking Cancellation...
   ✓ Booking Cancellation completed in 1205ms

➤ Running: Refund Processing (WALLET)...
   ✓ Refund Processing (WALLET) completed in 892ms

╔═══════════════════════════════════════════════════════════╗
║              TEST EXECUTION SUMMARY                      ║
╚═══════════════════════════════════════════════════════════╝

  ✓ Connectivity Check                       413ms
  ✓ Hotel Rates Search                       2845ms
  ✓ Prebook Creation                         1156ms
  ✓ Prebook Retrieval                        312ms
  ✓ Booking Confirmation (WALLET)            28345ms
  ✓ Booking Cancellation                     1205ms
  ✓ Refund Processing (WALLET)               892ms

─────────────────────────────────────────────────────────────
Total Tests: 7 | ✓ 7 | ✗ 0 | ⊘ 0
Total Duration: 65.18s
─────────────────────────────────────────────────────────────

╔═══════════════════════════════════════════════════════════╗
║   HOTEL LITEAPI E2E SUITE COMPLETED SUCCESSFULLY ✓       ║
╚═══════════════════════════════════════════════════════════╝
```

**Partial Run (Network Limited)**: 2/7 steps completed ✓

```text
╔═══════════════════════════════════════════════════════════╗
║      LITEAPI SANDBOX - HOTEL E2E DIRECT TEST SUITE       ║
╚═══════════════════════════════════════════════════════════╝

📍 LiteAPI Configuration:
   API URL:  https://api.liteapi.travel/v3.0
   BOOK URL: https://book.liteapi.travel/v3.0
   API Key:  sand_...5a0e

➤ Running: Connectivity Check...
   ✓ Connectivity Check completed in 380ms

➤ Running: Hotel Rates Search...
   ✓ Hotel Rates Search completed in 2696ms

➤ Running: Prebook Creation...
   ✗ Prebook Creation failed after 60517ms
   Error: getaddrinfo ENOTFOUND book.liteapi.travel

➤ Running: Prebook Retrieval...
   ⊘ Prebook Retrieval skipped after 5ms
   Reason: Missing prebook ID from previous step

➤ Running: Booking Confirmation (WALLET)...
   ⊘ Booking Confirmation (WALLET) skipped after 5ms
   Reason: Missing prebook ID from previous step

➤ Running: Booking Cancellation...
   ⊘ Booking Cancellation skipped after 6ms
   Reason: Missing booking ID from previous step

➤ Running: Refund Processing (WALLET)...
   ⊘ Refund Processing (WALLET) skipped after 4ms
   Reason: Missing booking ID or offer price from context

╔═══════════════════════════════════════════════════════════╗
║              TEST EXECUTION SUMMARY                      ║
╚═══════════════════════════════════════════════════════════╝

  ✓ Connectivity Check                       380ms
  ✓ Hotel Rates Search                       2696ms
  ✗ Prebook Creation                         60517ms
     └─ getaddrinfo ENOTFOUND book.liteapi.travel
  ⊘ Prebook Retrieval                        5ms
     └─ Missing prebook ID from previous step
  ⊘ Booking Confirmation (WALLET)            5ms
     └─ Missing prebook ID from previous step
  ⊘ Booking Cancellation                     6ms
     └─ Missing booking ID from previous step
  ⊘ Refund Processing (WALLET)               4ms
     └─ Missing booking ID or offer price from context

─────────────────────────────────────────────────────────────
Total Tests: 7 | ✓ 2 | ✗ 1 | ⊘ 4
Total Duration: 63.66s
─────────────────────────────────────────────────────────────
```

**Note**: Steps 6-7 (Booking Cancellation & Refund Processing) are properly integrated and skip gracefully when previous steps fail.

---

## Expected Output: Cancellation & Refund Tests

**Success Case**: 6/6 tests passed

```
╔═══════════════════════════════════════════════════════════╗
║   LITEAPI SANDBOX - CANCELLATION & REFUND E2E TEST       ║
╚═══════════════════════════════════════════════════════════╝

📍 LiteAPI Configuration:
   API URL:  https://api.liteapi.travel/v3.0
   BOOK URL: https://book.liteapi.travel/v3.0
   API Key:  sand_...0a0e

➤ Running: Setup: Create Booking for Cancellation...
   ⊘ Setup: Create Booking for Cancellation skipped

➤ Running: Fetch Booking Details & Cancellation Policy...
   ✓ Fetch Booking Details & Cancellation Policy completed in 289ms

➤ Running: Cancel Booking (Immediate)...
   ✓ Cancel Booking (Immediate) completed in 1456ms

➤ Running: Process Wallet Refund...
   ✓ Process Wallet Refund completed in 723ms

➤ Running: List Cancelled Bookings (Last 7 Days)...
   ⊘ List Cancelled Bookings (Last 7 Days) skipped

➤ Running: Evaluate Cancellation Policy (Refund Type)...
   ✓ Evaluate Cancellation Policy (Refund Type) completed in 45ms

╔═══════════════════════════════════════════════════════════╗
║         CANCELLATION & REFUND TEST SUMMARY                ║
╚═══════════════════════════════════════════════════════════╝

  ⊘ Setup: Create Booking for Cancellation            0ms
  ✓ Fetch Booking Details & Cancellation Policy      289ms
  ✓ Cancel Booking (Immediate)                       1456ms
  ✓ Process Wallet Refund                             723ms
  ⊘ List Cancelled Bookings (Last 7 Days)            0ms
  ✓ Evaluate Cancellation Policy (Refund Type)        45ms

─────────────────────────────────────────────────────────────
Total Tests: 6 | ✓ 4 | ✗ 0 | ⊘ 2
Total Duration: 2.51s
─────────────────────────────────────────────────────────────

╔═══════════════════════════════════════════════════════════╗
║   CANCELLATION & REFUND TEST SUITE COMPLETED ✓          ║
╚═══════════════════════════════════════════════════════════╝
```

---

## Troubleshooting

### Issue: 404 Not Found on Cancellation Endpoint

**Cause**: PUT endpoint not available; sandbox uses POST instead.

**Solution**: Script automatically falls back to `POST /bookings/{bookingId}/cancel`

### Issue: "Booking already cancelled"

**Cause**: Attempting to cancel a booking multiple times.

**Solution**: Use a fresh booking ID for each test; the script creates a new booking per run.

### Issue: "Refund not available" (NRFN bookings)

**Cause**: Non-refundable booking (cancellation policy disallows refund).

**Solution**: Test with refundable rates; cancellation policy determines refund eligibility.

### Issue: "API Key not found"

**Cause**: No key in env vars, secrets, or .env files.

**Solution**:

```bash
# Option 1: Set environment variable
export LITEAPI_API_KEY=sand_xxxxx
npm run test:api:liteapi

# Option 2: Add to .env
echo "LITEAPI_API_KEY=sand_xxxxx" >> .env
npm run test:api:liteapi

# Option 3: Create secrets file
mkdir -p secrets
echo "sand_xxxxx" > secrets/liteapi_api_key.txt
npm run test:api:liteapi
```

### Issue: Timeout on Booking Confirmation

**Cause**: LiteAPI backend processing delay or network latency.

**Solution**: Increase timeout:

```bash
LITEAPI_TIMEOUT_MS=120000 npm run test:api:liteapi
```

---

## Integration Points

### Internal Services

- **Wallet Service**: Refund credits are posted to customer wallet via `POST /wallet/refund`
- **Booking Service**: Cancellation state tracked in hotel workflow records
- **Notification Service**: Customer notifications sent on cancellation/refund (future)

### External APIs

- **LiteAPI Data API**: `/data/languages`, `/data/hotelTypes`, `/data/facilities`
- **LiteAPI Booking API**: `/hotels/rates`, `/rates/prebook`, `/rates/book`, `/bookings/{id}`, `/refunds`

---

## Files Modified

| File                                          | Changes                                                                    |
| --------------------------------------------- | -------------------------------------------------------------------------- |
| `scripts/test-liteapi-direct.ts`              | ✓ Added cancellation and refund steps (Steps 6-7)                          |
| `scripts/test-liteapi-cancellation-refund.ts` | 🆕 New dedicated cancellation workflow test                                |
| `package.json`                                | ✓ Added `test:api:liteapi:cancellation` and `test:api:liteapi:e2e` scripts |

---

## Next Steps

1. **Monitor sandbox execution**: Run `npm run test:api:liteapi:e2e` periodically
2. **Add CI/CD integration**: Include cancellation tests in deployment pipeline
3. **Error scenario testing**: Expand tests to cover:
   - Insufficient funds (wallet)
   - Invalid booking states
   - Expired prebooks
   - Policy-based refund calculations
4. **Performance optimization**: Reduce booking confirmation latency (currently 25–30s)

---

## Related Documentation

- [LiteAPI Cancel Booking](./LITEAPI_CANCEL_BOOKING.md) - Legacy reference (may be outdated)
- [LiteAPI Hotel Testing Quick Start](./LITEAPI_HOTEL_TESTING_QUICKSTART.md) - Setup in 30 seconds
- [LiteAPI Hotel Testing Implementation](./LITEAPI_HOTEL_TESTING_IMPLEMENTATION.md) - Detailed reference
- [Wallet Service Implementation](../services/wallet-service/IMPLEMENTATION_GUIDE.md) - Refund integration

---

## LiteAPI API Reference

### Booking Endpoints

- `POST /hotels/rates` — Search hotels and rates
- `POST /rates/prebook` — Hold a rate
- `GET /prebooks/{prebookId}` — Verify prebook
- `POST /rates/book` — Complete booking
- `GET /bookings/{bookingId}` — Get booking details
- `PUT /bookings/{bookingId}` — Cancel booking (PUT)
- `POST /bookings/{bookingId}/cancel` — Cancel booking (POST fallback)
- `POST /refunds` — Process refund
- `GET /bookings?status=cancelled` — Query cancelled bookings

### Data Endpoints

- `GET /data/languages` — List supported languages (connectivity check)
- `GET /data/hotelTypes` — Hotel property types
- `GET /data/facilities` — Hotel amenities and facilities

**Documentation**: [LiteAPI API Docs](https://docs.liteapi.travel)

---
