# Flight Booking Flows - Comprehensive Testing Guide

## Overview

This guide documents the comprehensive flight booking flows integrated into the testing suite:

1. **Basic Booking Flow** - Hold order → Payment confirmation
2. **Wallet Payment Flow** - Wallet balance check → Wallet payment processing
3. **Cancellation & Refund Flow** - Cancellation initiation → Confirmation → Refund verification
4. **Flight Amendment & Reissue Flow** - Amendment request → Confirmation → New itinerary

## Architecture

<!-- markdownlint-disable MD013 -->

```mermaid
┌──────────────────────────────────────┐
│   Test Runner                        │
│   (test-flight-booking-flows.ts)     │
└────────────────┬─────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────┐
│   DuffelFlightIntegrationTests           │
│   - testCompleteBookingFlow()            │
│   - testWalletPaymentFlow()              │
│   - testCancellationAndRefundFlow()      │
│   - testFlightAmendmentFlow()            │
└────────────────┬─────────────────────────┘
                 │
        ┌────────┴─────────┬───────────────┐
        ▼                  ▼               ▼
   ┌─────────────┐  ┌──────────────┐  ┌──────────────┐
   │ API Client  │  │ API Gateway  │  │ Booking Svc  │
   └─────────────┘  └──────────────┘  └──────────────┘
        │                  │                  │
        └──────────────────┴──────────────────┘
                 │
        ┌────────▼────────┐
        │  Duffel API     │
        └─────────────────┘
```

<!-- markdownlint-enable MD013 -->

## Flow Details

### 1. Basic Booking Flow

**Purpose**: Verify complete flight booking workflow from search to hold order creation.

**Steps**:

```
1. Flight Search
   └─ Query available flights for route/dates

2. Get Offer Details
   └─ Retrieve complete offer pricing and terms

3. Get Seat Maps
   └─ Retrieve available seating

4. Create Hold Order
   └─ Reserve inventory without payment

5. Get Order Details
   └─ Verify booking details

6. Get Available Services
   └─ List ancillary services (baggage, meals, seats)
```

**Expected Outcomes**:

- ✓ Offer search returns available flights
- ✓ Offer details include pricing and terms
- ✓ Hold order created successfully
- ✓ Order status is "pending" or "hold"
- ✓ Available services are retrievable

**Data Flow**:

```
User Input
    ↓
DuffelFlightSearch component
    ↓
useDuffelFlights hook
    ↓
duffelFlightService.searchFlights()
    ↓
duffelApiManager.post('/offer-requests')
    ↓
API Gateway → Booking Service → Duffel API
    ↓
Results cached in Redis
    ↓
Display in DuffelFlightResults component
```

### 2. Wallet Payment Flow

**Purpose**: Verify booking confirmation through wallet payment.

**Steps**:

```
1. Flight Search
   └─ Query available flights

2. Create Hold Order
   └─ Reserve inventory

3. Check Wallet Balance
   └─ Verify sufficient funds

4. Process Wallet Payment
   └─ Deduct from wallet balance

5. Verify Order Confirmation
   └─ Confirm order is confirmed after payment
```

**Expected Outcomes**:

- ✓ Wallet balance retrieved successfully
- ✓ Payment processed without errors
- ✓ Order status changed from "hold" to "confirmed"
- ✓ Transaction ID generated
- ✓ Balance updated

**Response Example**:

```json
{
  "success": true,
  "orderId": "order_abc123",
  "walletBalance": {
    "balance": 5000,
    "currency": "GBP",
    "status": "active"
  },
  "payment": {
    "status": "confirmed",
    "transaction_id": "txn_xyz789",
    "amount_deducted": 850.0
  }
}
```

### 3. Cancellation & Refund Flow

**Purpose**: Verify complete cancellation workflow with refund processing.

**Steps**:

```
1. Flight Search
   └─ Query flights

2. Create Hold Order
   └─ Reserve inventory

3. Get Initial Order Details
   └─ Record original amount

4. Initiate Cancellation
   └─ Request order cancellation

5. Confirm Cancellation
   └─ Approve and process cancellation

6. Verify Refund
   └─ Verify refund amount and status
```

**Expected Outcomes**:

- ✓ Cancellation initiated successfully
- ✓ Cancellation ID generated
- ✓ Refund amount calculated correctly
- ✓ Refund status is "processed" or "pending"
- ✓ Original amount matches or refund is marked as partial

**Response Example**:

```json
{
  "success": true,
  "orderId": "order_abc123",
  "cancellationId": "cancel_def456",
  "originalAmount": 850.0,
  "refund": {
    "status": "processed",
    "refund_amount": 850.0,
    "refund_currency": "GBP",
    "refund_status": "completed",
    "processing_date": "2026-02-28"
  }
}
```

### 4. Flight Amendment & Reissue Flow

**Purpose**: Verify complete flight amendment workflow for date/time changes.

**Steps**:

```
1. Initial Flight Search
   └─ Query original route/dates

2. Create Hold Order
   └─ Reserve original flights

3. Search Alternative Flights
   └─ Query new dates/times

4. Request Flight Amendment
   └─ Submit amendment request with new offer

5. Confirm Amendment
   └─ Approve amendment and generate new order
```

**Expected Outcomes**:

- ✓ Amendment request created successfully
- ✓ Price difference calculated
- ✓ Amendment confirmed
- ✓ New order ID generated
- ✓ Old order replaced with new itinerary

**Response Example**:

```json
{
  "success": true,
  "originalOrderId": "order_abc123",
  "amendmentId": "amend_ghi789",
  "amendment": {
    "status": "confirmed",
    "price_difference": -45.0,
    "new_order_id": "order_jkl012",
    "reason": "date_change"
  }
}
```

## Running the Tests

### Quick Start

```bash
# Install dependencies
pnpm install

# Run all booking flow tests
pnpm dlx tsx scripts/test-flight-booking-flows.ts

# With verbose output
VERBOSE=true pnpm dlx tsx scripts/test-flight-booking-flows.ts

# With debug logging
DEBUG=true pnpm dlx tsx scripts/test-flight-booking-flows.ts
```

### Individual Flow Testing

```bash
# Test basic booking only
pnpm dlx tsx -e "
import { DuffelFlightIntegrationTests } from './apps/booking-engine/tests/api-integration/duffel-flight-integration.test';
const tester = new DuffelFlightIntegrationTests({
  apiBaseUrl: 'http://localhost:3000/api',
  duffelApiUrl: 'https://api.duffel.com'
});
tester.testCompleteBookingFlow();
"

# Test wallet payment flow
# Test cancellation & refund flow
# Test amendment flow
# (Use same pattern above with different test method)
```

## Environment Variables

```bash
# API Gateway
API_GATEWAY_URL=http://localhost:3000/api

# Duffel API
DUFFEL_API_URL=https://api.duffel.com
DUFFEL_API_KEY=<your_duffel_token>

# Testing
VERBOSE=false           # Detailed output
DEBUG=false             # Debug logging
TEST_MODE=true          # Enable test mode
```

## Expected Test Results

### Success Scenario

<!-- markdownlint-disable MD013 -->

```
╔═══════════════════════════════════════════════════════════╗
║     COMPREHENSIVE FLIGHT BOOKING FLOWS TEST SUITE          ║
╚═══════════════════════════════════════════════════════════╝

➤ Running: Basic Booking Flow...
   ✓ Basic Booking Flow completed in 1245ms

➤ Running: Wallet Payment Confirmation...
   ✓ Wallet Payment Confirmation completed in 890ms

➤ Running: Cancellation & Refund...
   ✓ Cancellation & Refund completed in 756ms

➤ Running: Flight Amendment & Reissue...
   ✓ Flight Amendment & Reissue completed in 1023ms

╔═══════════════════════════════════════════════════════════╗
║              TEST EXECUTION SUMMARY                      ║
╚═══════════════════════════════════════════════════════════╝

Flow Results:
  ✓ Basic Booking Flow                        1245ms
  ✓ Wallet Payment Confirmation                890ms
  ✓ Cancellation & Refund                      756ms
  ✓ Flight Amendment & Reissue                1023ms

─────────────────────────────────────────────────────────────
Total Tests: 4 | ✓ 4 | ✗ 0 | ⊘ 0
Total Duration: 3.91s
─────────────────────────────────────────────────────────────

╔═══════════════════════════════════════════════════════════╗
║     ALL BOOKING FLOW TESTS PASSED SUCCESSFULLY ✓          ║
╚═══════════════════════════════════════════════════════════╝
```

<!-- markdownlint-enable MD013 -->

### Error Handling

If a flow fails:

```
➤ Running: Wallet Payment Confirmation...
   ✗ Wallet Payment Confirmation failed after 1200ms
   Error: Failed to get wallet balance: Endpoint not found

✗ Wallet Payment Flow failed (optional: may not be fully supported)
ℹ Wallet balance unavailable (expected if not configured)
```

**Common Errors & Solutions**:

| Error                   | Cause                       | Solution                     |
| ----------------------- | --------------------------- | ---------------------------- |
| API Gateway not running | Port 3000 not listening     | `pnpm dev` to start services |
| ECONNREFUSED            | Duffel API unreachable      | Check internet connection    |
| No available flights    | Invalid route/dates         | Use future dates for search  |
| Insufficient balance    | Wallet emptied              | Reset wallet balance         |
| Order already cancelled | Double cancellation attempt | Use fresh order              |
| Amendment not supported | API version mismatch        | Update Duffel SDK            |

## Performance Metrics

Expected performance for each flow:

| Flow           | Average Duration | Max Duration | Notes                       |
| -------------- | ---------------- | ------------ | --------------------------- |
| Basic Booking  | 1.0-1.5s         | 2.0s         | Includes multiple API calls |
| Wallet Payment | 0.8-1.2s         | 1.5s         | Wallet check + payment      |
| Cancellation   | 0.7-1.1s         | 1.5s         | Initiate + confirm refund   |
| Amendment      | 1.2-1.8s         | 2.5s         | includes new search         |

## Troubleshooting

### Test Hangs/Timeout

```bash
# Check if API Gateway is running
curl http://localhost:3000/health

# Increase timeout
timeout 60s pnpm dlx tsx scripts/test-flight-booking-flows.ts
```

### Wallet Balance Returns Null

```bash
# This is expected if wallet is not fully configured
# The test gracefully handles this with optional chaining
ℹ Wallet balance unavailable (expected if not configured)
```

### Amendment Not Confirmed

```bash
# This is expected if the Duffel API doesn't support amendments
ℹ Amendment flow not fully supported in this environment
# The test continues and marks as skipped
```

### Refund Not Processed Immediately

```bash
# Refunds may be asynchronous
# Check refund_status field for webhook updates
# Poll order after 5-10 minutes for processed status
```

## Data Validation

Each flow validates:

1. **Request Data**:
   - Passenger details complete
   - Dates valid and in future
   - Routes supported by Duffel

2. **Response Data**:
   - Required fields present
   - Amounts are positive numbers
   - Statuses are valid enum values
   - IDs are non-empty strings

3. **State Transitions**:
   - Order progresses through states
   - Cancellations can't happen twice
   - Amendments don't lose original order ID
   - Refunds appear after cancellation

## Integration with CI/CD

### GitHub Actions Setup

```yaml
name: Flight Booking Flow Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
      redis:
        image: redis:7
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: pnpm install
      - run: pnpm dev &
      - run: sleep 10 # Wait for services
      - run: pnpm dlx tsx scripts/test-flight-booking-flows.ts
```

## logging & Monitoring

Enable comprehensive logging:

```bash
# Enable all logging
DEBUG=true VERBOSE=true pnpm dlx tsx scripts/test-flight-booking-flows.ts 2>&1 | tee test-results.log

# Monitor in real-time
tail -f test-results.log

# Search for errors
grep -i "error\|failed" test-results.log
```

## Next Steps

After running tests successfully:

1. **Deploy to Staging**

   ```bash
   npm run build
   npm run deploy:staging
   ```

2. **Monitor Production**
   - Check booking success rate
   - Monitor refund processing
   - Track amendment usage

3. **Gather Metrics**
   - Average booking time
   - Payment success rate
   - Cancellation patterns
   - Amendment popularity

## Support

For issues or questions:

1. Check logs for error messages
2. Review [FLIGHT_MODULE_INTEGRATION_GUIDE.md](./FLIGHT_MODULE_INTEGRATION_GUIDE.md)
3. Check Duffel API documentation
4. Review test implementation in `duffel-flight-integration.test.ts`
