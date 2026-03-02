# Quick Start - Duffel API Testing

## 30-Second Setup

```bash
# 1. Get API Key from https://duffel.com (1 min)
# 2. Set environment variable
export DUFFEL_API_KEY="duffel_test_XXXXX"

# 3. Discover available keys
pnpm dlx tsx scripts/test-duffel-config.ts

# 4. Run tests
pnpm dlx tsx scripts/test-duffel-direct.ts
```

## Three Test Scripts

| Script                      | Purpose                  | Command                                        |
| --------------------------- | ------------------------ | ---------------------------------------------- |
| **test-duffel-config.ts**   | Find available API keys  | `pnpm dlx tsx scripts/test-duffel-config.ts`   |
| **test-duffel-direct.ts**   | Test single API key      | `pnpm dlx tsx scripts/test-duffel-direct.ts`   |
| **test-duffel-all-keys.ts** | Test all discovered keys | `pnpm dlx tsx scripts/test-duffel-all-keys.ts` |

## Run with API Key

```bash
# Using environment variable
DUFFEL_API_KEY="duffel_test_XXXXX" pnpm dlx tsx scripts/test-duffel-direct.ts

# Verbose mode
VERBOSE=true DUFFEL_API_KEY="duffel_test_XXXXX" pnpm dlx tsx scripts/test-duffel-direct.ts

# Using secrets file fallback (auto-loaded by script)
pnpm dlx tsx scripts/test-duffel-direct.ts
```

The direct test script now auto-loads the key from `secrets/duffel_api_key.txt` when
`DUFFEL_API_KEY` is not set in the current shell.

## Save API Key for Reuse

### Option A: Environment Variable (Best)

```bash
echo 'export DUFFEL_API_KEY="duffel_test_XXXXX"' >> ~/.zshrc
source ~/.zshrc
```

### Option B: Secrets File

```bash
echo "duffel_test_XXXXX" > secrets/duffel_api_key.txt
```

### Option C: .env File

```bash
echo "DUFFEL_API_KEY=duffel_test_XXXXX" >> .env
```

## Expected Test Output

```text
╔═══════════════════════════════════════════════════════════╗
║   DUFFEL API - DIRECT FLIGHT BOOKING FLOWS TEST           ║
╚═══════════════════════════════════════════════════════════╝

➤ Running: Basic Booking Flow...
  ✓ Flight search completed
  ✓ Order created: order_XXXXX

➤ Running: Wallet Payment Confirmation...
  ✓ Wallet balance checked
  ✓ Payment processed

➤ Running: Cancellation & Refund...
  ✓ Cancellation initiated
  ✓ Refund verified

➤ Running: Flight Amendment & Reissue...
  ✓ Amendment requested
  ✓ New order confirmed

Total Tests: 4 | ✓ 4 | ✗ 0
Total Duration: ~10-15s

✓ ALL TESTS PASSED SUCCESSFULLY
```

## Get API Key

1. Visit: https://duffel.com
2. Sign up / Log in
3. Go to Dashboard → API Tokens
4. Create test token → Copy token
5. Use in tests

## Test Flows Included

1. ✓ **Basic Booking** - Search → Hold → Payment
2. ✓ **Wallet Payment** - Balance check → Wallet payment
3. ✓ **Cancellation** - Cancel order → Refund verification
4. ✓ **Amendment** - Change flight → New order

## Troubleshooting

| Issue             | Solution                                     |
| ----------------- | -------------------------------------------- |
| API key not found | `pnpm dlx tsx scripts/test-duffel-config.ts` |
| 401 Unauthorized  | Check API key validity                       |
| No flights found  | Use future dates (30+ days)                  |
| Test hangs        | Increase timeout or check network            |

## Full Documentation

📖 See: [docs/DUFFEL_API_TESTING_SETUP.md](docs/DUFFEL_API_TESTING_SETUP.md)

## More Files Created

```
scripts/
├── test-duffel-config.ts         ← Discover keys
├── test-duffel-direct.ts         ← Test with one key
├── test-duffel-all-keys.ts       ← Test all keys
├── test-flight-booking-flows-mocked.ts
├── test-flight-booking-flows.ts

docs/
├── DUFFEL_API_TESTING_SETUP.md   ← Full guide
├── FLIGHT_BOOKING_FLOWS_TESTING_GUIDE.md
└── FLIGHT_MODULE_INTEGRATION_GUIDE.md
```

## Next: Run Tests

```bash
DUFFEL_API_KEY="your_token" pnpm dlx tsx scripts/test-duffel-direct.ts

# Service-level full flow suite (validated in this environment)
API_BASE_URL="http://localhost:3101/api" pnpm dlx tsx scripts/test-flight-booking-flows.ts
```

## Flight Confirmation Docs Smoke Test

```bash
# Uses BOOKING_SERVICE_URL if set, otherwise auto-detects:
# 1) http://localhost:3001
# 2) http://localhost:3101
npm run test:api:flight:confirmation-docs

# Optional explicit override
BOOKING_SERVICE_URL="http://localhost:3101" npm run test:api:flight:confirmation-docs
```

---

✓ Ready to test | Updated: 2026-03-01
