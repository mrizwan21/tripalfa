# Wallet Service - TypeScript Implementation

## Neon Database Migration & Integration

This service is designed to run on Neon (serverless Postgres). To migrate your data from a local Docker PostgreSQL instance to Neon:

1. Export your Docker database as described in the implementation guide.
2. Use the provided migration script:

  ```bash
  ./scripts/migrate_to_neon.sh <NEON_DATABASE_URL> wallet_db.dump
  ```

- Replace `<NEON_DATABASE_URL>` with your Neon connection string (see .env.example).

1. Update your `.env` file:

- Set `DATABASE_URL` to your Neon connection string (with `sslmode=require`).

1. Run migrations if needed:

  ```bash
  npm run migrations
  ```

1. Start the service and verify all endpoints and jobs.

See `IMPLEMENTATION_GUIDE.md` for full migration and troubleshooting details.

Multi-currency wallet service supporting customers, agencies, and travel suppliers with complete transaction cycles from selling through purchase to post-sale settlement and refunds.

## Architecture

### Core Components

1. **Database**: PostgreSQL on Neon with 13 tables
   - `wallets`: User account balances by currency
   - `transactions`: All transaction records
   - `ledger_entries`: Double-entry bookkeeping audit trail
   - `exchange_rate_snapshots`: Hourly FX snapshots (single source of truth)
   - `settlements`: Settlement records with reconciliation status
   - `disputes`: Chargeback disputes
   - `idempotency_cache`: Prevents duplicate processing (24h TTL)

2. **Services**: TypeScript modules for core operations
   - `fxService.ts`: FX snapshot management and currency conversion
   - `walletService.ts`: Atomic wallet operations (topup, debit, refund, purchase flows)
   - `reconciliationService.ts`: Settlement matching and FX P&L adjustments

3. **Routes**: Express endpoints for user-facing operations
   - `POST /api/wallet/transfer`: Transfer between currencies
   - `POST /api/wallet/purchase`: Customer purchase with agency intermediary
   - `POST /api/wallet/settlement`: Agency settlement with supplier

4. **Jobs**: Scheduled tasks
   - `fxFetcher.ts`: Hourly FX snapshot fetching from OpenExchangeRates with retries
   - `reconciliationJob.ts`: Daily settlement reconciliation and P&L adjustment

## User Types & Transaction Flows

### Customer Purchase Flow (CUSTOMER_TO_SUPPLIER)

```text
Customer Purchase → Customer Wallet (debit) → Agency Wallet (credit)
                  ↓
            Commission Calculated (deductedCommission)
                  ↓
            Supplier Settlement (deferred)
```

**Flow Steps**:

1. `POST /api/wallet/purchase` creates three transactions:
   - `customer_purchase`: Customer debits amount
   - `agency_purchase`: Agency credits amount (holds for supplier settlement)
   - `agency_commission`: Commission reserved for agency
2. Agency balance holds full customer payment
3. Later: `POST /api/wallet/settlement` transfers supplier amount to supplier wallet
4. Commission is deducted from agency balance during settlement

**Example**:

- Customer purchases $100 airline ticket through Agency
- Commission rate: 10%
- Transactions:
  - Customer debit: $100
  - Agency credit: $100 (holds in wallet)
  - Commission reserved: $10
  - Supplier settlement: $90 (transferred later)
  - Agency net: $100 (holds) → $10 (after settlement)

### Supplier Settlement Flow (SUPPLIER_TO_AGENCY)

```text
Agency Settlement → Agency Wallet (debit) → Supplier Wallet (credit)
                  ↓
            Commission Deducted
```

**Flow Steps**:

1. `POST /api/wallet/settlement` with:
   - `settlementAmount`: Net amount to supplier ($90 in example)
   - `deductedCommission`: Agency commission ($10 in example)
2. Agency is debited: settlementAmount + commission = $100 total
3. Supplier is credited: settlementAmount = $90
4. Ledger entries track both settlement and commission deduction

## API Endpoints

### 1. POST /api/wallet/transfer

Transfer between currencies with FX conversion

**Request**:

```json
{
  "userId": "uuid",
  "fromCurrency": "USD",
  "toCurrency": "EUR",
  "amount": 100,
  "idempotencyKey": "uuid"
}
```

**Response**:

```json
{
  "success": true,
  "transaction": {
    "id": "uuid",
    "type": "transfer",
    "amount": 100,
    "fromCurrency": "USD",
    "toCurrency": "EUR",
    "fxRate": 0.92,
    "convertedAmount": 92,
    "status": "completed",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

### 2. POST /api/wallet/purchase

Customer purchase with agency intermediary

**Request**:

```json
{
  "amount": 100,
  "currency": "USD",
  "agencyId": "uuid",
  "supplierId": "uuid",
  "bookingId": "BK123456",
  "commissionRate": 10,
  "idempotencyKey": "uuid"
}
```

**Response**:

```json
{
  "success": true,
  "transactions": {
    "customer": {
      "id": "uuid",
      "type": "customer_purchase",
      "amount": 100,
      "status": "completed"
    },
    "agency": {
      "id": "uuid",
      "type": "agency_purchase",
      "amount": 100,
      "status": "completed"
    },
    "commission": {
      "id": "uuid",
      "type": "agency_commission",
      "amount": 10,
      "status": "pending"
    }
  },
  "summary": {
    "customerDebited": 100,
    "agencyCredited": 100,
    "commissionReserved": 10,
    "supplierPending": 90
  }
}
```

### 3. POST /api/wallet/settlement

Agency settlement with supplier

**Request**:

```json
{
  "supplierId": "uuid",
  "settlementAmount": 90,
  "deductedCommission": 10,
  "currency": "USD",
  "invoiceId": "INV123456",
  "idempotencyKey": "uuid"
}
```

**Response**:

```json
{
  "success": true,
  "transaction": {
    "id": "uuid",
    "type": "supplier_settlement",
    "flow": "supplier_to_agency",
    "amount": 90,
    "status": "completed",
    "invoiceId": "INV123456"
  },
  "summary": {
    "agencyDebited": 100,
    "supplierCredited": 90,
    "commissionDeducted": 10,
    "net": 90
  }
}
```

## Database Schema (Key Tables)

### users

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  user_type user_type_enum,  -- customer, agency, travel_supplier, admin
  company_name VARCHAR(255),
  tax_id VARCHAR(50),
  commission_rate NUMERIC(5,2),
  bank_account_info JSONB,
  created_at TIMESTAMPTZ
);
```

### wallets

```sql
CREATE TABLE wallets (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  currency CHAR(3),
  balance NUMERIC(24,6),  -- Max: 999,999,999,999,999,999.999999
  status wallet_status_enum,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  UNIQUE(user_id, currency)
);
```

### transactions

```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY,
  wallet_id UUID REFERENCES wallets(id),
  type transaction_type_enum,  -- topup, debit, customer_purchase, etc.
  flow transaction_flow_enum,  -- customer_to_supplier, supplier_to_agency, etc.
  amount NUMERIC(24,6),
  currency CHAR(3),
  fx_rate NUMERIC(24,12),
  base_amount NUMERIC(24,6),
  base_currency CHAR(3),
  payer_id UUID REFERENCES users(id),
  payee_id UUID REFERENCES users(id),
  related_transaction_id UUID,  -- Links multi-party transactions
  booking_id VARCHAR(50),  -- Travel booking reference
  invoice_id VARCHAR(50),  -- Supplier invoice reference
  status transaction_status_enum,
  gateway VARCHAR(50),
  gateway_reference VARCHAR(255),
  counterparty VARCHAR(255),
  gateway_fee NUMERIC(24,6),
  metadata JSONB,
  idempotency_key UUID UNIQUE,
  exchange_snapshot_fetched_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### ledger_entries

```sql
CREATE TABLE ledger_entries (
  id UUID PRIMARY KEY,
  transaction_id UUID REFERENCES transactions(id),
  account VARCHAR(255),  -- wallet:currency:id or clearing:gateway:currency
  debit NUMERIC(24,6),
  credit NUMERIC(24,6),
  currency CHAR(3),
  description TEXT,
  created_at TIMESTAMPTZ
);
```

### exchange_rate_snapshots

```sql
CREATE TABLE exchange_rate_snapshots (
  id UUID PRIMARY KEY,
  base_currency CHAR(3),
  rates JSONB,  -- { "USD": 1.0, "EUR": 0.92, "GBP": 0.79, ... }
  source VARCHAR(50),  -- openexchangerates
  is_active BOOLEAN,
  fetched_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
);
```

## Transaction Safety

### Atomicity

All operations use `SERIALIZABLE` isolation level to prevent dirty reads and phantom reads.

```typescript
// Atomic transfer with locks
await client.query('BEGIN ISOLATION LEVEL SERIALIZABLE');
const wallet = await client.query(
  'SELECT id FROM wallets WHERE id = $1 FOR UPDATE',
  [walletId]
);
// ... perform operations ...
await client.query('COMMIT');
```

### Idempotency

All payment operations check idempotency key before processing to prevent duplicates.

```typescript
const existing = await client.query(
  'SELECT id FROM transactions WHERE idempotency_key = $1',
  [idempotencyKey]
);
if (existing.rows.length) return existing.rows[0];
```

### Double-Entry Ledger

Every transaction creates two ledger entries (debit and credit) for audit trail.

```typescript
// Customer purchase creates 6 ledger entries
// (customer debit/credit, agency debit/credit, commission debit/credit)
```

## Precision & Rounding

- **Amounts**: `NUMERIC(24,6)` - 18 digits before decimal, 6 after
  - Supports up to 999,999,999,999,999,999.999999
- **FX Rates**: `NUMERIC(24,12)` - 12 digits before decimal, 12 after
  - Precise to 1 trillionth of a unit
- **Conversions**: Rates stored with snapshot for audit trail

## Error Handling

| Error | HTTP Code | Description |
| ------ | -------- | ----------- |
| Insufficient funds | 402 | Wallet balance < requested amount |
| FX unavailable | 503 | No active FX snapshot for conversion |
| Wallet not found | 404 | User wallet doesn't exist |
| Duplicate transaction | 409 | Idempotency key already processed |
| Invalid request | 400 | Schema validation failed |
| Server error | 500 | Database or service error |

## Development

### Setup

```bash
npm install
npm run build
npm run migrations  # Run database migrations
```

### Development Mode

```bash
npm run dev  # Watches .ts files with nodemon
```

### Build TypeScript

```bash
npm run build  # Outputs to ./dist
```

### Run Tests

```bash
npm test
npm run test:watch
```

### Linting

```bash
npm run lint
npm run lint:fix
```

### Run FX Fetcher (Scheduled)

```bash
npm run fx:fetch --now  # Fetch immediately
npm run fx:schedule     # Start hourly schedule
```

### Run Reconciliation (Scheduled)

```bash
npm run reconcile --now  # Run immediately
```

## Deployment

### Docker

```bash
npm run docker:build
npm run docker:run
```

### Environment Variables

```bash
DATABASE_URL=postgres://user:password@host:5432/wallet_db
JWT_SECRET=your_secret_key
OPEN_EXCHANGE_RATES_API_KEY=your_api_key
NODE_ENV=production
PORT=3007
```

## Monitoring & Observability

- **Health Check**: `GET /health`
- **Readiness Check**: `GET /ready`
- **Structured Logging**: JSON logs with timestamps
- **Metrics**: Transaction counts, FX rates, settlement latency
- **Alerts**: FX snapshot stale (> 3 hours), failed reconciliation

## Security

- **JWT Authentication**: All endpoints require valid JWT token
- **Helmet**: HTTP security headers
- **CORS**: Configured for cross-origin requests
- **Validation**: Joi schema validation on all inputs
- **Connection**: SSL/TLS to Neon Postgres (enforced)
- **Rate Limiting**: Recommended at API gateway level
