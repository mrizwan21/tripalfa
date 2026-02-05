# Wallet Service - Implementation Guide

## Overview

Complete production-ready TypeScript implementation of a multi-currency wallet service supporting customers, agencies, and travel suppliers with FX management, double-entry ledger, and settlement reconciliation.

**Technology Stack**:
- **Language**: TypeScript 5.3
- **Runtime**: Node.js 18+
- **Framework**: Express.js 4.18
- **Database**: PostgreSQL 15 on Neon (serverless)
- **Testing**: Jest with ts-jest
- **Validation**: Joi schemas
- **Logging**: Structured JSON logging
- **Authentication**: JWT tokens

## Project Structure

```
services/wallet-service/
├── src/
│   ├── app.ts                    # Express application setup
│   ├── server.ts                 # Server entry point (if needed)
│   ├── config/
│   │   └── db.ts                 # Neon Postgres connection pool
│   ├── types/
│   │   └── wallet.ts             # TypeScript types and enums
│   ├── services/
│   │   ├── fxService.ts          # FX snapshot and conversion
│   │   ├── walletService.ts      # Wallet operations (topup, purchase, settlement, refund)
│   │   └── reconciliationService.ts  # Settlement reconciliation
│   ├── routes/
│   │   ├── transferRoute.ts      # Currency transfers
│   │   ├── customerPurchaseRoute.ts  # Customer purchase flows
│   │   └── settlementRoute.ts    # Supplier settlement
│   ├── jobs/
│   │   ├── fxFetcher.ts          # Hourly FX snapshot fetcher
│   │   └── reconciliationJob.ts  # Daily reconciliation
│   ├── middlewares/
│   │   ├── auth.ts               # JWT authentication
│   │   └── errorHandler.ts       # Global error handling
│   └── utils/
│       └── logger.ts             # Structured logging
├── frontend/
│   ├── services/
│   │   └── walletApi.ts          # API client for React
│   └── components/
│       ├── WalletBalance.tsx      # Balance display component
│       └── TransferForm.tsx       # Transfer form component
├── tests/
│   ├── setup.ts                  # Test setup
│   ├── services/
│   │   ├── fxService.test.ts     # FX service unit tests
│   │   ├── walletService.test.ts # Wallet operations tests
│   │   └── multiUserFlows.test.ts # Multi-user flow tests
│   └── routes/
│       └── ... (route tests)
├── migrations/
│   └── 01_wallet_schema.sql      # Database schema
├── package.json
├── tsconfig.json
├── jest.config.js
├── .eslintrc.json
├── Dockerfile
├── docker-compose.dev.yml
├── .env.example
├── README.md
└── IMPLEMENTATION_GUIDE.md
```

## Setup Instructions

### 1. Prerequisites

- Node.js 18+
- npm 9+
- PostgreSQL 15 or Neon (serverless)
- OpenExchangeRates API key (for FX rates)

### 2. Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Update .env with your configuration
# - DATABASE_URL: Your Neon Postgres connection string
# - JWT_SECRET: Your secret key
# - OPEN_EXCHANGE_RATES_API_KEY: Your API key
```

### 3. Database Setup

```bash
# Run migrations
npm run migrations

# This creates all 13 tables with proper indexes and constraints
```

### 4. Development

```bash
# Start in development mode (watches .ts files)
npm run dev

# In another terminal, run scheduled jobs:
npm run fx:schedule     # Start hourly FX fetcher
npm run reconcile       # Run daily reconciliation (can schedule separately)
```

### 5. Build for Production

```bash
# Compile TypeScript to JavaScript
npm run build

# Output goes to ./dist/

# Run compiled version
npm start
```

## API Endpoints

### 1. Transfer Between Currencies
```http
POST /api/wallet/transfer
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>

{
  "fromCurrency": "USD",
  "toCurrency": "EUR",
  "amount": 100,
  "idempotencyKey": "550e8400-e29b-41d4-a716-446655440000"
}

Response:
{
  "success": true,
  "transaction": {
    "id": "uuid",
    "type": "transfer",
    "amount": 100,
    "currency": "USD",
    "status": "completed",
    "fxRate": 0.92,
    "convertedAmount": 92,
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

### 2. Customer Purchase (with Agency & Supplier)
```http
POST /api/wallet/purchase
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>

{
  "amount": 500,
  "currency": "USD",
  "agencyId": "uuid",
  "supplierId": "uuid",
  "bookingId": "BK123456",
  "commissionRate": 10,
  "idempotencyKey": "550e8400-e29b-41d4-a716-446655440001"
}

Response:
{
  "success": true,
  "transactions": {
    "customer": { ... },
    "agency": { ... },
    "commission": { ... }
  },
  "summary": {
    "customerDebited": 500,
    "agencyCredited": 500,
    "commissionReserved": 50,
    "supplierPending": 450
  }
}
```

### 3. Supplier Settlement
```http
POST /api/wallet/settlement
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>

{
  "supplierId": "uuid",
  "settlementAmount": 450,
  "deductedCommission": 50,
  "currency": "USD",
  "invoiceId": "INV123456",
  "idempotencyKey": "550e8400-e29b-41d4-a716-446655440002"
}

Response:
{
  "success": true,
  "transaction": {
    "id": "uuid",
    "type": "supplier_settlement",
    "amount": 450,
    "status": "completed",
    "createdAt": "2024-01-15T10:35:00Z"
  },
  "summary": {
    "agencyDebited": 500,
    "supplierCredited": 450,
    "commissionDeducted": 50,
    "net": 450
  }
}
```

## Database Schema

### Key Tables

**users**
- Stores customer, agency, travel supplier, and admin accounts
- Fields: id, user_type (enum), email, company_name, tax_id, commission_rate, bank_account_info

**wallets**
- User account balances per currency
- Constraint: One wallet per user per currency (UNIQUE)
- Supports: USD, EUR, GBP, JPY, AUD, CAD, CHF, CNY, INR (configurable)

**transactions**
- All wallet operations with full audit trail
- Types: topup, debit, customer_purchase, agency_purchase, supplier_settlement, agency_commission, refund, chargeback, internal_transfer, fee, reversal
- Flows: customer_to_supplier, supplier_to_agency, agency_to_customer, internal
- Stores: payer_id, payee_id for multi-party transactions
- Stores: booking_id, invoice_id for business context
- Idempotency: idempotency_key (unique) prevents duplicate processing

**ledger_entries**
- Double-entry bookkeeping for every transaction
- Two entries per transaction (debit and credit)
- Immutable (audit trail)
- Account naming: wallet:{currency}:{walletId}, clearing:{gateway}:{currency}, commission:{currency}

**exchange_rate_snapshots**
- Hourly FX snapshots from OpenExchangeRates
- Single source of truth for all conversions
- Stores: base_currency, rates (JSON), fetched_at, is_active

**settlements**
- Settlement records with reconciliation status
- Links transactions to external payments/invoices
- Tracks FX P&L adjustments
- Status: pending, matched, reconciled, disputed

## Transaction Flows

### Customer Purchase Flow
```
Step 1: Customer deposits funds
  POST /api/wallet/topup
  Customer wallet: +$500

Step 2: Customer purchases through agency
  POST /api/wallet/purchase
  - Customer wallet: -$500 (type: customer_purchase)
  - Agency wallet: +$500 (type: agency_purchase)
  - Commission reserved: $50 (type: agency_commission)

Step 3: Agency settles with supplier
  POST /api/wallet/settlement
  - Agency wallet: -$550 ($500 settlement + $50 commission)
  - Supplier wallet: +$500
  - Commission deducted: $50

Result:
- Customer: -$500
- Agency: +$50 (net commission)
- Supplier: +$500
```

### Ledger Entries Example
```
For customer_purchase($500):
  DEBIT  wallet:USD:customer_id    $500
  CREDIT wallet:USD:agency_id       $500

For commission($50):
  DEBIT  commission:USD              $50
  CREDIT clearing:commission:USD     $50

For settlement($500, commission=$50):
  DEBIT  wallet:USD:agency_id       $550
  CREDIT wallet:USD:supplier_id     $500
  CREDIT commission:deducted:USD    $50
```

## Key Features

### Atomicity
- All multi-step operations use `SERIALIZABLE` isolation level
- Wallet locks (`FOR UPDATE`) prevent race conditions
- Transactions auto-rollback on error

### Idempotency
- All payment operations require `idempotencyKey`
- Cache prevents duplicate processing for 24 hours
- Safe to retry failed requests with same key

### Double-Entry Ledger
- Every transaction creates at least 2 ledger entries
- Immutable audit trail
- Easy reconciliation: `SUM(debits) = SUM(credits)`

### Precision
- Amounts: NUMERIC(24,6) - prevents rounding errors
- FX rates: NUMERIC(24,12) - precise to 12 decimal places
- Rates stored with every transaction for audit

### Multi-User Support
- Three user types: customer, agency, travel_supplier
- Commission-based settlement
- Support for post-sale refunds across multi-party transactions
- Proper flow tracking: who paid whom and why

### FX Management
- Hourly snapshots via OpenExchangeRates
- Automatic stale rate detection (>3 hours)
- FX P&L tracking for reconciliation
- All conversions traceable to specific snapshot

### Error Handling
| Status | Meaning | Recovery |
|--------|---------|----------|
| 400 | Validation error | Fix request |
| 402 | Insufficient funds | Topup wallet |
| 404 | Resource not found | Check IDs |
| 409 | Duplicate transaction | Idempotency safe |
| 503 | FX unavailable | Retry later |
| 500 | Server error | Check logs |

## Testing

### Unit Tests (FX Service)
```bash
npm test -- fxService.test.ts

Tests:
- Snapshot saving and retrieval
- Conversion math (USD→EUR, EUR→USD, cross-rates)
- Stale detection (>3 hours)
- Error cases (missing rates, invalid currencies)
```

### Integration Tests (Wallet Operations)
```bash
npm test -- walletService.test.ts

Tests:
- Topup and balance updates
- Idempotency (duplicate prevention)
- Ledger entry creation
- Refunds (full and partial)
- Insufficient funds error
```

### Multi-User Flow Tests
```bash
npm test -- multiUserFlows.test.ts

Tests:
- Complete purchase + settlement cycle
- Commission calculation
- Balance verification
- Ledger reconciliation
- End-to-end money flow
```

### Run All Tests
```bash
npm test                    # Run once
npm run test:watch         # Watch mode
npm test -- --coverage     # With coverage report
```

## Scheduled Jobs

### FX Fetcher (Hourly)
```bash
npm run fx:fetch --now     # Fetch immediately
npm run fx:schedule        # Start hourly scheduler

Behavior:
- Runs at :05 of every hour (configurable)
- Fetches rates from OpenExchangeRates
- Exponential backoff retries (max 3 attempts)
- Marks as active, deactivates previous snapshot
- Alerts on 3+ consecutive failures
```

### Reconciliation Job (Daily)
```bash
npm run reconcile --now    # Run immediately

Behavior:
- Runs at 02:00 UTC daily (configurable)
- Matches settlements to transactions
- Calculates FX gains/losses
- Creates adjustment ledger entries
- Flags unreconciled > 3 days
- Processes chargebacks
```

## Deployment

### Docker

```bash
# Build image
npm run docker:build

# Run container
docker run -e DATABASE_URL=postgres://... \
           -e JWT_SECRET=... \
           -e OPEN_EXCHANGE_RATES_API_KEY=... \
           -p 3007:3007 \
           wallet-service
```

### Docker Compose (Development)
```bash
docker-compose -f docker-compose.dev.yml up -d

# Access:
# Service: http://localhost:3007
# PgAdmin: http://localhost:5050
# Health: curl http://localhost:3007/health
```

### Production Deployment

1. **Database**: Use Neon (serverless Postgres)
   - Create project on neon.tech
   - Copy connection string to DATABASE_URL
   - Run migrations: `npm run migrations`

2. **Environment**:
   - Set NODE_ENV=production
   - Set JWT_SECRET to strong random string
   - Set OPEN_EXCHANGE_RATES_API_KEY
   - Configure external APIs (Stripe, PayPal, Wise)

3. **Deployment Platform** (Render, Railway, Heroku, etc.):
   - Build: `npm run build`
   - Start: `npm start`
   - Health check: `GET /health`
   - Readiness check: `GET /ready`

4. **Monitoring**:
   - Set up error tracking (Sentry)
   - Monitor logs via platform
   - Set up alerts for FX fetcher failures
   - Monitor reconciliation job completion

## Security Considerations

### Authentication
- JWT tokens required on all endpoints
- Token validated via authMiddleware
- Tokens should have 1-hour expiration
- Implement refresh token rotation

### Validation
- All inputs validated with Joi schemas
- Type-safe with TypeScript
- SQL injection prevented by parameterized queries

### Database
- SSL/TLS required for Neon connections
- Connection pool limited to 10 (serverless constraint)
- 30-second idle timeout
- No plaintext passwords in logs

### API
- Helmet.js for HTTP security headers
- CORS configured for trusted origins
- Rate limiting recommended at API gateway
- Request size limited to 10MB

### Secrets
- Store in environment variables or secret manager
- Never commit .env files
- Rotate keys regularly
- Use .env.example as template

## Performance Optimization

### Database
- Indexes on frequently queried columns
- Efficient queries with `FOR UPDATE` locks
- Connection pooling with min:2, max:10
- Prepared statements via pg driver

### Caching
- Idempotency cache: 24-hour TTL
- FX snapshots: reuse until stale (3+ hours)
- Wallet balances: computed fresh each query

### Pagination
- History endpoints should paginate (limit 20-100)
- Use offset/limit or cursor-based pagination
- Expensive joins should be limited

## Troubleshooting

### FX Snapshot Unavailable
```
Error: 503 FX rates unavailable
Solution: Check OPEN_EXCHANGE_RATES_API_KEY
         Check FX fetcher logs
         Manually trigger: npm run fx:fetch --now
```

### Insufficient Funds
```
Error: 402 Insufficient funds
Solution: Customer must topup wallet first
         Check balance: walletApi.getWalletBalance(currency)
```

### Idempotency Errors
```
Error: 409 Duplicate transaction detected
Solution: Use same idempotencyKey to retry
         Different key = new transaction
         Do NOT generate new key for retries
```

### Ledger Imbalance
```
Error: Ledger entries don't balance
Solution: Check double-entry logic in walletService
         Verify SUM(debits) = SUM(credits) per transaction
         Check reconciliation job logs
```

## Next Steps

### Phase 1 (Done)
- ✅ TypeScript conversion
- ✅ Multi-user support
- ✅ API endpoints
- ✅ Test suite
- ✅ Docker configuration

### Phase 2 (Recommended)
- Webhook handlers (Stripe, PayPal, Wise)
- Admin reconciliation UI
- Export/reporting (CSV, PDF)
- Audit log API

### Phase 3 (Enhancement)
- Multi-currency settlement optimization
- Machine learning for fraud detection
- Real-time balance notifications
- Mobile app integration

## Support

For questions or issues:
1. Check logs: `docker logs wallet-service`
2. Run tests: `npm test`
3. Check database: PgAdmin at http://localhost:5050
4. Review code: Look for TODOs and comments in src/

## License

MIT - See LICENSE file for details


# Database Migration: Docker PostgreSQL to Neon

This section provides a step-by-step guide to migrate your wallet service database from a local Dockerized PostgreSQL instance to Neon (serverless Postgres).

## 1. Export Data from Docker PostgreSQL

1. **Identify your running container:**
  ```bash
  docker ps
  # Find the container name or ID for your Postgres instance
  ```
2. **Export the schema and data:**
  ```bash
  docker exec -t <container_name_or_id> pg_dump -U <db_user> -d <db_name> -Fc -f /tmp/wallet_db.dump
  docker cp <container_name_or_id>:/tmp/wallet_db.dump ./wallet_db.dump
  ```
  - Replace `<db_user>` and `<db_name>` with your actual credentials.

## 2. Create a Neon Project and Database

1. Go to [neon.tech](https://neon.tech) and sign in.
2. Create a new project and database (PostgreSQL 15+).
3. Copy the connection string (with credentials) for later use.

## 3. Import Schema and Data into Neon

1. **Install `pg_restore` if not already available:**
  ```bash
  # On macOS
  brew install libpq
  export PATH="/usr/local/opt/libpq/bin:$PATH"
  ```
2. **Restore the dump to Neon:**
  ```bash
  pg_restore --no-owner --no-privileges -h <neon_host> -U <neon_user> -d <neon_db> -p <neon_port> wallet_db.dump
  ```
  - Use the connection details from your Neon dashboard.
  - If you encounter SSL errors, add `sslmode=require` to your connection string or use `PGSSLMODE=require`.

## 4. Update Environment Variables and Configs

1. In your `.env` file, update the `DATABASE_URL` to use the Neon connection string.
2. Ensure `sslmode=require` is set if needed.
3. Restart your wallet service and scheduled jobs.

## 5. Verify the Migration

1. Run integration tests:
  ```bash
  npm test -- walletService.test.ts
  npm test -- multiUserFlows.test.ts
  ```
2. Manually check balances and transactions via API endpoints or a Postgres client (e.g., TablePlus, DBeaver).
3. Confirm all scheduled jobs (FX fetcher, reconciliation) run successfully.

## 6. Rollback and Troubleshooting

- If issues arise, you can:
  - Revert the `DATABASE_URL` to your Docker instance.
  - Re-import the dump after fixing schema/data issues.
  - Use Neon’s point-in-time restore if available.
- Common issues:
  - **Encoding errors:** Ensure both source and target use UTF-8.
  - **Extension errors:** Install required extensions in Neon (e.g., `uuid-ossp`, `pgcrypto`).
  - **Permission errors:** Use the admin user provided by Neon.

## 7. Best Practices

- Always back up your data before migration.
- Test the migration in a staging environment first.
- Use idempotency keys to avoid duplicate transactions during cutover.
- Monitor logs and set up alerts for failed jobs or API errors.

---
