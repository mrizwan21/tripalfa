# LiteAPI Hotel Cancellation & Refund Testing — Quick Start

Get cancellation and refund testing running in **30 seconds**.

---

## 30-Second Setup

```bash
# 1. Ensure API key is available
cat .env | grep LITEAPI_API_KEY

# 2. Run cancellation test (uses auto-discovered key)
npm run test:api:liteapi:cancellation

# 3. Or run full E2E including cancellation
npm run test:api:liteapi:e2e
```

**Expected output**: ✓ 6 tests pass in ~2-3 seconds

---

## Script Matrix

| Script                | Command                                 | Purpose                                       | Duration   |
| --------------------- | --------------------------------------- | --------------------------------------------- | ---------- |
| **Direct E2E**        | `npm run test:api:liteapi`              | 7-step flow (booking → cancellation → refund) | ~35s       |
| **Cancellation Only** | `npm run test:api:liteapi:cancellation` | 6 dedicated cancellation tests                | ~2–3s      |
| **Config Discovery**  | `npm run test:api:liteapi:config`       | Find all available API keys                   | <1s        |
| **Multi-Key Runner**  | `npm run test:api:liteapi:all-keys`     | Run E2E with all discovered keys              | ~40s each  |
| **Full Suite**        | `npm run test:api:liteapi:e2e`          | Run direct E2E + cancellation                 | ~40s total |

---

## Common Commands

### Run Cancellation Tests

```bash
# Basic (auto-discovers key from .env)
npm run test:api:liteapi:cancellation

# With explicit key
LITEAPI_API_KEY=sand_xxxxx npm run test:api:liteapi:cancellation

# Verbose output (debug)
VERBOSE=true npm run test:api:liteapi:cancellation

# With test booking ID
LITEAPI_TEST_BOOKING_ID=booking_123 npm run test:api:liteapi:cancellation

# All options
LITEAPI_API_KEY=sand_xxxxx \
LITEAPI_TEST_BOOKING_ID=booking_123 \
LITEAPI_TEST_REFUND_AMOUNT=250 \
VERBOSE=true \
npm run test:api:liteapi:cancellation
```

### Run Full E2E with Cancellation

```bash
# Direct flow: connectivity → rates → prebook → booking → cancellation → refund (7 steps)
LITEAPI_API_KEY=sand_xxxxx npm run test:api:liteapi

# Or auto-detect key
npm run test:api:liteapi
```

### Discover Available Keys

```bash
npm run test:api:liteapi:config
```

**Output example**:

```
✓ Found 2 LiteAPI key(s):

1. prod_1ca...6a93 (from .env)
2. sand_e79...5a0e (from .env)
```

---

## 5 E2E Steps (Cancellation & Refund)

```
Step 1: ✓ Connectivity Check         (verify API access)
Step 2: ✓ Hotel Rates Search          (find hotels & pricing)
Step 3: ✓ Prebook Creation           (hold a rate)
Step 4: ✓ Prebook Retrieval          (verify status)
Step 5: ✓ Booking Confirmation       (complete booking with WALLET payment)
Step 6: ✓ Booking Cancellation       (cancel and initiate refund)
Step 7: ✓ Refund Processing          (process wallet refund)
```

---

## 6 Cancellation Test Cases

| #   | Test           | Purpose                  | Status on Failure |
| --- | -------------- | ------------------------ | ----------------- |
| 1   | Setup Booking  | Create test booking      | Skip (optional)   |
| 2   | Fetch Details  | Get cancellation policy  | Skip (optional)   |
| 3   | Cancel Booking | Request cancellation     | Skip (can retry)  |
| 4   | Process Refund | Credit wallet            | Skip (can retry)  |
| 5   | List Cancelled | Query by date range      | Skip (optional)   |
| 6   | Eval Policy    | Check refund eligibility | Always runs       |

---

## Environment Variables

Set in `.env` or export before running:

```bash
# Required
LITEAPI_API_KEY=sand_xxxxx

# Optional (with defaults)
LITEAPI_API_BASE_URL=https://api.liteapi.travel/v3.0
LITEAPI_BOOK_BASE_URL=https://book.liteapi.travel/v3.0
LITEAPI_TIMEOUT_MS=90000
LITEAPI_TEST_BOOKING_ID=<auto-created>
LITEAPI_TEST_REFUND_AMOUNT=100
LITEAPI_TEST_CITY=Paris
LITEAPI_TEST_COUNTRY=FR
LITEAPI_TEST_CHECKIN=<30 days ahead>
LITEAPI_TEST_CHECKOUT=<33 days ahead>
VERBOSE=false
DEBUG=false
```

---

## Key Discovery (Auto)

Keys are discovered in this order:

1. **Environment Variables**:
   - `LITEAPI_API_KEY`
   - `LITEAPI_SANDBOX_API_KEY`
   - `VITE_LITEAPI_TEST_API_KEY`

2. **Secrets Files**:
   - `secrets/liteapi_api_key.txt`
   - `secrets/liteapi_sandbox_key.txt`
   - `secrets/liteapi_test_key.txt`
   - `secrets/liteapi_key.txt`

3. **.env Files** (with variable whitelist):
   - `LITEAPI_API_KEY`
   - `LITEAPI_SANDBOX_KEY`
   - `LITEAPI_TEST_KEY`

**To add a key manually**:

```bash
# Option A: Environment variable
export LITEAPI_API_KEY=sand_xxxxx

# Option B: .env file
echo "LITEAPI_API_KEY=sand_xxxxx" >> .env

# Option C: Secrets directory
mkdir -p secrets
echo "sand_xxxxx" > secrets/liteapi_api_key.txt
```

---

## Expected Output

### Full E2E Flow (7/7 steps)

```text
╔═══════════════════════════════════════════════════════════╗
║      LITEAPI SANDBOX - HOTEL E2E DIRECT TEST SUITE       ║
╚═══════════════════════════════════════════════════════════╝

  ✓ Connectivity Check                       413ms
  ✓ Hotel Rates Search                      2845ms
  ✓ Prebook Creation                        1156ms
  ✓ Prebook Retrieval                        312ms
  ✓ Booking Confirmation (WALLET)           28345ms
  ✓ Booking Cancellation                    1205ms
  ✓ Refund Processing (WALLET)               892ms

─────────────────────────────────────────────────────────────
Total Tests: 7 | ✓ 7 | ✗ 0 | ⊘ 0
Total Duration: 65.18s

✓ HOTEL LITEAPI E2E SUITE COMPLETED SUCCESSFULLY
```

### Cancellation Only Tests (6/6 tests)

```text
╔═══════════════════════════════════════════════════════════╗
║   LITEAPI SANDBOX - CANCELLATION & REFUND E2E TEST       ║
╚═══════════════════════════════════════════════════════════╝

  ⊘ Setup: Create Booking                    0ms
  ✓ Fetch Booking Details                  289ms
  ✓ Cancel Booking (Immediate)             1456ms
  ✓ Process Wallet Refund                   723ms
  ⊘ List Cancelled Bookings                  0ms
  ✓ Evaluate Cancellation Policy             45ms

─────────────────────────────────────────────────────────────
Total Tests: 6 | ✓ 4 | ✗ 0 | ⊘ 2
Total Duration: 2.51s

✓ CANCELLATION & REFUND TEST SUITE COMPLETED
```

---

## Troubleshooting

### Error: "API Key not found"

**Solution**: Ensure your key is available via one of the discovery methods above.

```bash
# Quick check
npm run test:api:liteapi:config
```

### Error: "getaddrinfo ENOTFOUND book.liteapi.travel"

**Cause**: Network connectivity issue to LiteAPI booking endpoint.

**Solution**: Check internet connection; if in restricted network, update endpoint URL:

```bash
LITEAPI_BOOK_BASE_URL=https://your-proxy/v3.0 npm run test:api:liteapi
```

### Error: "Booking already cancelled"

**Cause**: Attempted to cancel same booking twice.

**Solution**: Fresh bookings are created per test run; retry with new test.

### Error: "Refund not available" (NRFN)

**Cause**: Non-refundable booking (cancellation policy forbids refund).

**Solution**: Test with refundable rates; policy determines eligibility.

### Timeout on Booking Step

**Cause**: Slow backend or network latency (booking confirmation takes 20–30s).

**Solution**: Increase timeout:

```bash
LITEAPI_TIMEOUT_MS=120000 npm run test:api:liteapi
```

---

## Test Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│           DIRECT E2E CANCELLATION FLOW                  │
└─────────────────────────────────────────────────────────┘

    Connectivity Check (API available?)
            ↓
    ✓ Hotel Rates Search (find hotels)
            ↓
    ✓ Prebook Creation (lock rate)
            ↓
    ✓ Prebook Retrieval (verify)
            ↓
    ✓ Booking Confirmation (pay via WALLET)
            ↓
    ✓ Booking Cancellation (request cancellation)
            ↓
    ✓ Refund Processing (credit wallet)
            ↓
    ✓ Complete

┌─────────────────────────────────────────────────────────┐
│        CANCELLATION TEST FOCUS FLOW                     │
└─────────────────────────────────────────────────────────┘

    (Option 1: Use existing booking ID)
    ↓
    Fetch Booking Details & Policy
            ↓
    ✓ Cancel Booking
            ↓
    ✓ Process Refund
            ↓
    ✓ Evaluate Policy (RFN/NRFN)
            ↓
    ✓ Complete
```

---

## Related Documentation

- [Full Implementation Guide](./LITEAPI_CANCELLATION_REFUND_E2E.md) — Detailed reference
- [Hotel Testing Implementation](./LITEAPI_HOTEL_TESTING_IMPLEMENTATION.md) — Full E2E overview
- [LiteAPI API Docs](https://docs.liteapi.travel) — Official reference

---

## Next Steps

1. **Run a test**: `npm run test:api:liteapi:cancellation`
2. **Check results**: Review test output for pass/fail/skip
3. **Debug if needed**: Add `VERBOSE=true` for detailed logs
4. **Integrate into CI/CD**: Schedule regular test runs

---
