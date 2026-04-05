# Wallet Management End-to-End Testing Guide

## Overview

The Wallet Management End-to-End Testing Orchestrator provides comprehensive testing coverage for the
complete wallet lifecycle, including wallet creation, fund deposits (top-ups), payments, refunds,
transfers, and **global multi-currency operations across 65+ currencies**.

## Test Architecture

The testing framework is modeled after the Hotel Booking Workflow Orchestrator and includes:

- **Test Suite**: Comprehensive test cases for all wallet operations (now 52+ tests)
- **Global Currency Support**: Tests with 65+ ISO 4217 currencies across 5 major regions
- **Mock API Client**: Simulates wallet service API interactions
- **Transaction Tracking**: Records all transactions for reconciliation
- **Financial Reporting**: Generates detailed test reports with currency metrics
- **Coverage Analysis**: Validates all critical paths and features across all currencies

## Quick Start

### 1. Run Basic Wallet Tests

```bash
npm run test:api:wallet:orchestrator
```

### 2. Run Tests with Verbose Logging

```bash
VERBOSE=true npm run test:api:wallet:orchestrator
```

### 3. Run Full E2E Suite

```bash
npm run test:api:wallet:e2e
```

## Test Coverage

### 1. **Wallet Creation** ✓

Tests the ability to create wallets for users in 65+ global currencies.

- Create wallets for USD, EUR, GBP, JPY, AED, ZAR, AUD, CAD, CHF, CNY (10+ currencies tested)
- Verify initial balance is zero across all currencies
- Support for all 65+ global ISO 4217 currencies
- Regional currency support: Americas, Europe, Asia-Pacific, Middle East, Africa
- Multiple currency support per user

**Test File**: `scripts/wallet-management-orchestrator.ts` (Global Currency List: lines 477-530)

### 2. **Top-Up Flow (Deposit Funds)** ✓

Tests adding funds to wallets via different payment gateways.

- Stripe payment integration
- PayPal payment integration
- Card payment fallback
- Balance verification after deposits
- Cumulative balance tracking
- Idempotency guarantee (duplicate transactions)

**Test File**: `scripts/wallet-management-orchestrator.ts` (lines 602-654)

### 3. **Payment Processing** ✓

Tests wallet usage for booking and service payments.

- Debit wallet for bookings
- Multiple payment deductions
- Balance verification after payments
- Transaction history tracking
- Payment confirmation

**Test File**: `scripts/wallet-management-orchestrator.ts` (lines 656-708)

### 4. **Refund Processing** ✓

Tests refund flows for different scenarios.

- Booking cancellation refunds
- Dispute refunds
- Balance increase verification
- Refund reason tracking

**Test File**: `scripts/wallet-management-orchestrator.ts` (lines 710-740)

### 5. **Wallet Transfers** ✓

Tests peer-to-peer wallet transfers.

- Transfer between users
- Commission/fee handling
- Sender balance reduction
- Recipient balance increase

**Test File**: `scripts/wallet-management-orchestrator.ts` (lines 742-784)

### 6. **Multi-Currency Operations** ✓

Tests global currency handling and conversion across 65+ currencies.

- Multiple currencies per user across all supported global currencies
- Separate balance tracking per currency (no cross-contamination)
- Regional currency testing (Americas, Europe, Asia-Pacific, Middle East, Africa)
- Currency-specific transactions from 15+ different currencies
- Support for USD, EUR, GBP, JPY, AUD, CAD, CHF, CNY, INR, AED, SAR, ZAR, EGP, BRL, and 50+ more
- Exchange rate handling and currency isolation validation

**Test File**: `scripts/wallet-management-orchestrator.ts` (Global Currency Support: lines 477-530,
Multi-Currency Tests: lines 929-971)

### 7. **Financial Reconciliation** ✓

Tests transaction tracking and audit trail.

- Complete transaction history
- Duplicate prevention
- Transaction amount validation
- Summary report generation

**Test File**: `scripts/wallet-management-orchestrator.ts` (lines 815-844)

## Test Results & Reports

### Report Location

```text
test-reports/wallet-orchestrator-YYYY-MM-DD.json
```

### Report Contents

```json
{
  "summary": {
    "timestamp": "2026-03-01T...",
    "totalTests": 29,
    "passedTests": 29,
    "failedTests": 0,
    "totalDuration": 2345,
    "coverage": {
      "walletCreation": true,
      "topup": true,
      "payment": true,
      "transfer": true,
      "refund": true,
      "multiCurrency": true,
      "reconciliation": true
    },
    "transactionsSummary": {
      "totalTransactions": 45,
      "byType": {
        "topup": 8,
        "payment": 15,
        "refund": 4,
        "transfer": 6,
        "commission": 0,
        "settlement": 0
      },
      "totalVolume": 2850.50,
      "totalFees": 12.50
    }
  },
  "results": [...],
  "transactions": [...]
}
```

## Integration with Wallet Service

### API Endpoints Tested

The orchestrator tests the following wallet endpoints:

```typescript
// Wallet Creation
POST / api / wallet / create;
GET / api / wallet / balance / { userId };
GET / api / wallet / transactions / { userId };

// Top-Up Operations
POST / api / wallet / topup;

// Payment Operations
POST / api / wallet / pay;

// Refund Operations
POST / api / wallet / refund;

// Transfer Operations
POST / api / wallet / transfer;
```

### Expected Request Format

```typescript
// Top-Up Request
{
  userId: string;
  currency: string;
  amount: number;
  gateway: 'stripe' | 'paypal' | 'card';
  gatewayReference: string;
  idempotencyKey: string;
}

// Payment Request
{
  userId: string;
  walletId: string;
  amount: number;
  bookingId: string;
  referenceId: string;
  idempotencyKey: string;
}

// Refund Request
{
  userId: string;
  walletId: string;
  amount: number;
  reason: 'booking_cancellation' | 'dispute' | 'refund_policy';
  originalTransactionId: string;
  idempotencyKey: string;
}

// Transfer Request
{
  fromUserId: string;
  toUserId: string;
  amount: number;
  currency: string;
  fee: number;
  reason: string;
  idempotencyKey: string;
}
```

## Running Tests Against Live Services

### Prerequisites

1. **Start Wallet Service**

```bash
npm run dev --workspace=@tripalfa/wallet-service
```

1. **Start API Gateway**

```bash
npm run dev --workspace=@tripalfa/api-gateway
```

1. **Run Tests**

```bash
npm run test:api:wallet:orchestrator
```

### Expected Output

When services are running, you should see:

```text
✓ Create USD wallet (25ms)
✓ Create EUR wallet (22ms)
✓ Create GBP wallet (19ms)
✓ Wallet initial balance is zero (18ms)
✓ Top-up with Stripe (100 USD) (45ms)
✓ Verify balance after top-up (12ms)
✓ Top-up with PayPal (50 USD) (38ms)
✓ Verify cumulative balance (10ms)
...
Tests: 29/29 passed (100%)
Duration: 2.3s
Transactions: 45 (Vol: $2,850.50)
```

## Test Scenarios

### Scenario 1: Customer Wallet Top-Up Journey

```typescript
// Customer creates wallet and adds funds
1. Create wallet (USD)
2. Top-up $100 via Stripe
3. Top-up $50 via PayPal
4. Verify balance = $150
```

### Scenario 2: Booking Payment Flow

```typescript
// Customer pays for booking using wallet
1. Create wallet with balance $250
2. Select wallet payment method
3. Debit $100 for flight booking
4. Debit $75 for hotel booking
5. Verify remaining balance = $75
```

### Scenario 3: Refund & Reversal

```typescript
// Handle booking cancellation with refund
1. Process payment ($200)
2. Cancel booking
3. Process refund ($200)
4. Verify balance restored
```

### Scenario 4: Multi-Currency Support

```typescript
// Manage wallets in multiple currencies
1. Create USD wallet
2. Top-up $100 USD
3. Create EUR wallet
4. Top-up €100 EUR
5. Create GBP wallet
6. Top-up £100 GBP
7. Verify separate balances: $100, €100, £100
```

### Scenario 5: Peer-to-Peer Transfer

```typescript
// Transfer funds between customers
1. Customer A has $500
2. Customer B has $100
3. A transfers $100 to B (with $2 fee)
4. A balance = $398, B balance = $200
```

## Performance Metrics

The orchestrator collects and reports:

- **Test Duration**: Per-test execution time
- **Total Test Duration**: Complete suite execution time
- **Transaction Throughput**: Transactions per second
- **API Response Times**: Endpoint-specific latencies
- **Success Rate**: Percentage of passed tests

Example metrics:

```text
Test Duration Breakdown:
├─ Wallet Creation: 82ms (4 tests)
├─ Top-Up Flow: 245ms (6 tests)
├─ Payment Processing: 189ms (4 tests)
├─ Refund Processing: 156ms (3 tests)
├─ Transfer Flow: 198ms (3 tests)
├─ Multi-Currency: 167ms (4 tests)
└─ Reconciliation: 94ms (5 tests)

Total: 1,131ms for 29 tests
Average per test: 39ms
```

## Troubleshooting

### Issue: "Cannot connect to API"

**Solution**: Ensure wallet service and API gateway are running:

```bash
npm run dev
```

### Issue: "Transaction not found"

**Solution**: Verify wallet exists and has sufficient balance:

```bash
curl http://localhost:3000/api/wallet/balance/USER_ID?currency=USD
```

### Issue: "Idempotency key already used"

**Solution**: This is expected behavior. The test validates idempotency:

```text
✓ Idempotency: duplicate topup returns same transaction
```

### Issue: "Insufficient balance"

**Solution**: Test logic ensures sufficient funds before payments. If this fails, check wallet balance endpoints.

## Advanced Usage

### Custom Test Configuration

Extend the test suite for specific scenarios:

```typescript
// In wallet-management-orchestrator.ts
async testCustomScenario(): Promise<void> {
  console.log("\n🎯 Testing: Custom Scenario");

  await this.test("Custom operation", async () => {
    // Your custom test logic
    return true;
  });
}

// Call in runAllTests()
await this.testCustomScenario();
```

### Environment Variables

```bash
# Verbose logging
VERBOSE=true npm run test:api:wallet:orchestrator

# Custom base URL
WALLET_API_URL=http://custom-host:8080 npm run test:api:wallet:orchestrator
```

## Comparison with LiteAPI Orchestrator

Similar to the Hotel Booking Workflow Orchestrator (`booking-workflow-orchestrator.ts`), the Wallet
Management Orchestrator:

<!-- markdownlint-disable MD013 -->

| Feature           | Booking                            | Wallet                            |
| ----------------- | ---------------------------------- | --------------------------------- |
| **Type**          | E2E workflow test                  | E2E transaction test              |
| **Coverage**      | Complete booking lifecycle         | Complete wallet lifecycle         |
| **Flows**         | Confirmation, cancellation, refund | Top-up, payment, transfer, refund |
| **Reports**       | PDF documents                      | JSON transaction logs             |
| **Idempotency**   | Booking references                 | Idempotency keys                  |
| **Multi-entity**  | Hotel + customer                   | User + wallet                     |
| **Report Format** | `booking-workflow-*.json`          | `wallet-orchestrator-*.json`      |

<!-- markdownlint-enable MD013 -->

## CI/CD Integration

### GitHub Actions Example

```yaml
- name: Run Wallet E2E Tests
  run: npm run test:api:wallet:orchestrator

- name: Check Test Reports
  if: always()
  run: |
    if [ -f test-reports/wallet-orchestrator-*.json ]
    then
      echo "Tests completed - see test-reports/"
    fi
```

## Best Practices

1. **Always verify idempotency** - Use unique idempotency keys per test
2. **Test isolation** - Each test should be independent
3. **Clean state** - Use fresh user IDs for each test run
4. **Rate limiting** - Tests respect API rate limits
5. **Error handling** - All operations include error validation
6. **Logging** - Use VERBOSE flag for debugging

## Related Documentation

- [Wallet API Contract](./api/WALLET_API_CONTRACT.md)
- [API Integration Testing Guide](./API_INTEGRATION_TESTING_GUIDE.md)
- [Wallet API Contract](./api/WALLET_API_CONTRACT.md)
- [Hotel Booking Orchestrator](../scripts/booking-workflow-orchestrator.ts) (similar pattern)

## Support & Contact

For issues or questions about wallet testing:

1. Check test reports in `test-reports/`
2. Review verbose logs: `VERBOSE=true npm run test:api:wallet:orchestrator`
3. Check wallet service logs: `npm run dev --workspace=@tripalfa/wallet-service`
4. Review API Gateway logs: `npm run dev --workspace=@tripalfa/api-gateway`
