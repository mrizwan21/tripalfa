# Duffel API Testing - Complete Setup Guide

## Overview

You have three new test runners that work directly with the Duffel API:

1. **`test-duffel-config.ts`** - Discover available Duffel API keys
2. **`test-duffel-direct.ts`** - Test all booking flows with a single API key
3. **`test-duffel-all-keys.ts`** - Test all flows with all discovered API keys

## Quick Start (3 Steps)

### Step 1: Get a Duffel API Key

Visit: <https://duffel.com>

1. Sign up for an account
2. Go to Settings → API Tokens (or Dashboard)
3. Create a new test/sandbox token
4. Copy the token (looks like: `duffel_test_XXXXX...`)

### Step 2: Save Your API Key

Choose one method:

**Option A: Environment Variable (Recommended)**

```bash
export DUFFEL_API_KEY="duffel_test_XXXXX"
```

**Option B: Secrets File**

```bash
echo "duffel_test_XXXXX" > secrets/duffel_api_key.txt
```

**Option C: .env File**

```bash
echo "DUFFEL_API_KEY=duffel_test_XXXXX" >> .env
```

### Step 3: Run Tests

```bash
# Discover available keys
pnpm dlx tsx scripts/test-duffel-config.ts

# Test with the discovered key
pnpm dlx tsx scripts/test-duffel-direct.ts

# Or test with all discovered keys
pnpm dlx tsx scripts/test-duffel-all-keys.ts
```

## Detailed Commands

### Discover Available API Keys

```bash
pnpm dlx tsx scripts/test-duffel-config.ts
```

Output shows:

- All discovered Duffel API keys
- Their sources (environment variables, files, etc.)
- Validation status
- Setup instructions if none found

### Test Single API Key

```bash
# Use environment variable
DUFFEL_API_KEY="duffel_test_XXXXX" pnpm dlx tsx scripts/test-duffel-direct.ts

# Or use pre-existing key (auto-discovered)
pnpm dlx tsx scripts/test-duffel-direct.ts
```

Options:

- `DUFFEL_API_KEY` - Specify the API key to use
- `VERBOSE=true` - Enable detailed logging

### Test Multiple API Keys

```bash
pnpm dlx tsx scripts/test-duffel-all-keys.ts
```

This automatically:

1. Discovers all available API keys
2. Runs the complete test suite with each key
3. The tests run sequentially
4. Displays a summary comparing results

## What Gets Tested

Each test runner executes all 4 booking flows:

### 1. Basic Booking Flow

```
Flight Search
  ↓ Select offer
Get Offer Details
  ↓ Verify pricing
Get Available Services
  ↓ Optional add-ons
Create Hold Order
  ↓ Reserve flights
Get Order Details
  ↓ Confirm booking
Attempt Payment
```

**Expected Result**: ✓ Order created successfully

### 2. Wallet Payment Flow

```mermaid
Search Flights
  ↓ Find flights
Create Unpaid Hold Order
  ↓ Reserve inventory first
Customer Wallet Debit
  ↓ Customer transaction value debited before confirmation
Supplier Duffel Balance Debit (Create Payment)
  ↓ Net supplier value debited from supplier Duffel wallet
Verify Post-Settlement Confirmation
  ↓ Check order/ticket status
```

**Expected Result**: ✓ Order confirmed via wallet

Top-up options for supplier Duffel Balance:

- Bank transfer (Duffel Dashboard → Balance → Top-up balance)
- Duffel Payments settlement

### 3. Cancellation & Refund Flow

```
Create Booking
  ↓ Book flight
Initiate Cancellation
  ↓ Request cancellation
Confirm Cancellation
  ↓ Approve request
Verify Refund
  ↓ Check refund amount
```

**Expected Result**: ✓ Refund processed

### 4. Flight Amendment & Reissue Flow

```
Create Original Booking
  ↓ Book initial flight
Search Alternative Flights
  ↓ Find new dates
Request Amendment
  ↓ Submit change request
Confirm Amendment
  ↓ Process new itinerary
```

**Expected Result**: ✓ New order created with price adjustment

## Expected Output Example

```
╔═══════════════════════════════════════════════════════════╗
║   DUFFEL API - DIRECT FLIGHT BOOKING FLOWS TEST           ║
╚═══════════════════════════════════════════════════════════╝

📍 Duffel API Configuration:
   Base URL: https://api.duffel.com
   API Key: duffel_test_XXXXX...
   Verbose: disabled

➤ Running: Basic Booking Flow...

  📍 STEP 1: Flight Search
  ✓ [200] POST /air/offer_requests
  ✓ Found 12 segment(s)

  📍 STEP 2: Get Offer Details
  ✓ [200] GET /air/offers/offer_XXXXX
  ✓ Offer retrieved
    Total: 850.00 GBP

  📍 STEP 3: Get Available Services
  ✓ [200] GET /air/available_services
    Found 5 services

  📍 STEP 4: Create Hold Order
  ✓ [201] POST /air/orders
  ✓ Order created: order_XXXXX
    Status: hold
    Total: 850.00 GBP

  📍 STEP 5: Get Order Details
  ✓ [200] GET /air/orders/order_XXXXX
  ✓ Order retrieved
    Status: hold

  📍 STEP 6: Attempt Payment Confirmation
  ✓ Payment confirmed

  ✓ Basic Booking Flow completed in 1245ms

➤ Running: Wallet Payment Confirmation...
  [continues for other flows]

╔═══════════════════════════════════════════════════════════╗
║              TEST EXECUTION SUMMARY                      ║
╚═══════════════════════════════════════════════════════════╝

Flow Results:
  ✓ Basic Booking Flow                        1245ms
  ✓ Wallet Payment Confirmation                890ms
  ✓ Cancellation & Refund                      756ms
  ✓ Flight Amendment & Reissue                1023ms

─────────────────────────────────────────────────────────────
Total Tests: 4 | ✓ 4 | ✗ 0
Total Duration: 3.91s
─────────────────────────────────────────────────────────────

╔═══════════════════════════════════════════════════════════╗
║     ALL BOOKING FLOW TESTS PASSED SUCCESSFULLY ✓          ║
╚═══════════════════════════════════════════════════════════╝
```

## Common API Responses

### Success Response (201 Created)

```json
{
  "data": {
    "id": "order_XXXXX",
    "type": "hold",
    "status": "pending",
    "passengers": [...],
    "total_amount": {
      "amount": "850.00",
      "currency": "GBP"
    }
  }
}
```

### Error Response (401 Unauthorized)

```json
{
  "errors": [
    {
      "code": "unauthorized",
      "message": "Invalid or expired API token",
      "status": 401
    }
  ]
}
```

## Troubleshooting

### Error: DUFFEL_API_KEY environment variable not set

**Solution**: Set your API key before running tests

```bash
export DUFFEL_API_KEY="your_token_here"
pnpm dlx tsx scripts/test-duffel-direct.ts
```

### Error: 401 Unauthorized

**Causes**:

- Invalid API key
- Expired token
- Token has wrong permissions

**Solutions**:

1. Verify token in Duffel dashboard
2. Generate a new token
3. Check token hasn't expired

### Error: 404 Not Found

**Causes**:

- Duffel API endpoint changed
- Incorrect API version

**Solutions**:

- Check Duffel API documentation
- Verify Duffel-Version header is set to "v1"

### Flight Search Returns No Results

**Causes**:

- Date in the past
- Route not served by Duffel
- Invalid airport codes

**Solutions**:

1. Use future dates (30+ days out)
2. Use major airport codes (LHR, CDG, JFK, etc.)
3. Verify route has flights available

## Advanced Usage

### Run with Verbose Logging

```bash
VERBOSE=true DUFFEL_API_KEY="your_token" pnpm dlx tsx scripts/test-duffel-direct.ts
```

Shows:

- Full HTTP request/response details
- API endpoint URLs
- HTTP status codes
- Response payload summaries

### Test Specific Airports

```bash
# Edit line 252 in test-duffel-direct.ts
// Change from:
origin: "LHR",
destination: "ORY",
// To your preferred airports:
origin: "LAS",  // Las Vegas
destination: "MIA", // Miami
```

### Change Test Dates

```bash
# Edit departurDate in each test method
departureDate: "2026-04-15",  // Change to your desired date
// Ensure date is 30+ days in future
```

### Configure Passenger Details

```bash
// In test methods, update passenger info:
given_name: "Your",
family_name: "Name",
email: "your@email.com",
phone_number: "+442071838750",
born_at: "1990-01-01",
```

## API Documentation

For complete Duffel API docs:

- Main: <https://duffel.com/docs>
- API Reference: <https://duffel.com/docs/api/reference>
- Air API: <https://duffel.com/docs/air>
- Testing: <https://duffel.com/docs/testing>

## Files Created

```
scripts/
├── test-duffel-config.ts      # Discover available API keys
├── test-duffel-direct.ts      # Test with single API key
├── test-duffel-all-keys.ts    # Test with all discovered keys
├── test-flight-booking-flows-mocked.ts  # Mock data tests
├── test-flight-booking-flows.ts         # Local gateway tests
└── docs/
    └── DUFFEL_API_TESTING_SETUP.md (this file)
```

## Next Steps

1. **Get an API Key**
   - Visit <https://duffel.com>
   - Create a test token

2. **Run Discovery**

   ```bash
   pnpm dlx tsx scripts/test-duffel-config.ts
   ```

3. **Run Tests**

   ```bash
   pnpm dlx tsx scripts/test-duffel-direct.ts
   ```

4. **Review Results**
   - All flows should pass (✓)
   - Check timing is reasonable
   - Verify API integration is working

5. **Integrate into CI/CD**
   - Add to GitHub Actions
   - Run on PR/commit
   - Monitor flight search performance

## Support

For issues:

1. Check test output for error messages
2. Verify API key is valid
3. Ensure dates are in future
4. Check Duffel API status: <https://status.duffel.com>
5. Review Duffel documentation

---

**Status**: ✓ Ready to test
**Last Updated**: 2026-02-28
**Test Frameworks**: Direct Duffel API v1, Axios HTTP Client
