# Quick Start - LiteAPI Hotel Testing

## 30-Second Setup

```bash
# 1. Export your LiteAPI sandbox key
export LITEAPI_API_KEY="your_liteapi_sandbox_key"

# 2. Discover available keys
pnpm dlx tsx scripts/test-liteapi-config.ts

# 3. Run direct hotel E2E flow
pnpm dlx tsx scripts/test-liteapi-direct.ts
```

## Test Scripts

| Script                       | Purpose                 | Command                                         |
| ---------------------------- | ----------------------- | ----------------------------------------------- |
| **test-liteapi-config.ts**   | Discover LiteAPI keys   | `pnpm dlx tsx scripts/test-liteapi-config.ts`   |
| **test-liteapi-direct.ts**   | Run direct hotel E2E    | `pnpm dlx tsx scripts/test-liteapi-direct.ts`   |
| **test-liteapi-all-keys.ts** | Run E2E across all keys | `pnpm dlx tsx scripts/test-liteapi-all-keys.ts` |
| **test-liteapi-sandbox.ts**  | Alias for direct E2E    | `pnpm dlx tsx scripts/test-liteapi-sandbox.ts`  |

## Run Commands

```bash
# Run with explicit key
LITEAPI_API_KEY="your_key" pnpm dlx tsx scripts/test-liteapi-direct.ts

# Verbose output
VERBOSE=true LITEAPI_API_KEY="your_key" pnpm dlx tsx scripts/test-liteapi-direct.ts

# All discovered keys
pnpm dlx tsx scripts/test-liteapi-all-keys.ts
```

## Optional Test Inputs

```bash
# Override search test data
LITEAPI_TEST_CITY="Paris"
LITEAPI_TEST_COUNTRY="FR"
LITEAPI_TEST_CHECKIN="2026-04-01"
LITEAPI_TEST_CHECKOUT="2026-04-04"
LITEAPI_TEST_ADULTS="2"
```

## E2E Steps Included

1. Connectivity check (`GET /data/languages`)
2. Hotel rates search (`POST /hotels/rates`)
3. Prebook creation (`POST /rates/prebook`)
4. Prebook retrieval (`GET /prebooks/{prebookId}`)
5. Booking confirmation (`POST /rates/book`)

## Expected Output (Success)

```text
LITEAPI SANDBOX - HOTEL E2E DIRECT TEST SUITE

✓ Connectivity Check
✓ Hotel Rates Search
✓ Prebook Creation
✓ Prebook Retrieval
✓ Booking Confirmation (WALLET)

Total Tests: 5 | ✓ 5 | ✗ 0 | ⊘ 0
HOTEL LITEAPI E2E SUITE COMPLETED SUCCESSFULLY
```

## Latest Validated Run (2026-03-01)

- Direct E2E (`test-liteapi-direct.ts`): ✓ 5/5 passed in **32.86s**
- Multi-key E2E (`test-liteapi-all-keys.ts`): ✓ 2/2 keys passed in **35.89s**

## Save Key for Reuse

### Option A: Environment Variable

```bash
echo 'export LITEAPI_API_KEY="your_liteapi_sandbox_key"' >> ~/.zshrc
source ~/.zshrc
```

### Option B: Secrets File

```bash
echo "your_liteapi_sandbox_key" > secrets/liteapi_api_key.txt
```

### Option C: .env File

```bash
echo "LITEAPI_API_KEY=your_liteapi_sandbox_key" >> .env
```

## Troubleshooting

| Issue                 | Action                                                                        |
| --------------------- | ----------------------------------------------------------------------------- |
| No key discovered     | Run `pnpm dlx tsx scripts/test-liteapi-config.ts` and verify env/secrets/.env |
| Prebook fails         | Re-run rates + prebook (offer/price may have changed)                         |
| Booking confirm fails | Retry with `VERBOSE=true` and check sandbox wallet/payment behavior           |
| No rates returned     | Use different city/country/check-in dates                                     |

## Full Reference

📖 See: [LITEAPI_HOTEL_TESTING_IMPLEMENTATION.md](LITEAPI_HOTEL_TESTING_IMPLEMENTATION.md)

---

✓ Ready to test | Updated: 2026-03-01
