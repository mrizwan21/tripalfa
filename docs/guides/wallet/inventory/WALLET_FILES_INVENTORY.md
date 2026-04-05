# Wallet Service - Complete File Inventory

## Overview

This document provides a complete inventory of all wallet-related files across the TripAlfa monorepo, along with their current status and key details.

---

## Wallet Service Files

### Main Application

**File**: `services/wallet-service/src/app.ts`

- **Status**: ✅ Complete
- **Purpose**: Express server setup
- **Port**: 3008
- **Key Components**:
  - Health check endpoint
  - Swagger documentation
  - Route registration
  - Middleware setup (CORS, helmet, morgan)

### Routes

| File                         | Status     | Lines  | Purpose                                                          |
| ---------------------------- | ---------- | ------ | ---------------------------------------------------------------- |
| `walletRoutes.ts`            | ✅         | 1-80+  | Core wallet operations (list, balance, transfer, deposit, debit) |
| `transferRoute.ts`           | ✅         | 1-100+ | Inter-currency transfers with idempotency                        |
| `transactionHistoryRoute.ts` | ✅         | TBD    | Paginated transaction history                                    |
| `fxRoute.ts`                 | ✅         | TBD    | FX rates and conversion preview                                  |
| `customerPurchaseRoute.ts`   | ✅         | TBD    | Customer purchase flow handler                                   |
| `settlementRoute.ts`         | ✅         | TBD    | Supplier settlement processing                                   |
| `kiwiRoutes.ts`              | ✅         | TBD    | Kiwi integration routes                                          |
| `wallet.ts`                  | ❌ MISSING | -      | Primary entry route file (should aggregate routes)               |

### Services

| File                           | Status | Purpose                     | Methods                                                                                                                                        |
| ------------------------------ | ------ | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `walletService.ts`             | ✅     | Core wallet operations      | createWallet, getWalletBalance, getUserWallets, creditWallet, debitWallet, getTransactionHistory, customerPurchaseFlow, supplierSettlementFlow |
| `fxService.ts`                 | ✅     | Foreign exchange management | getLatestSnapshot, convertAmount, fetchRates                                                                                                   |
| `walletOps.ts`                 | ✅     | Low-level wallet operations | Balance updates, reservation handling                                                                                                          |
| `ledgerOps.ts`                 | ✅     | Ledger entry creation       | createLedgerEntry (double-entry bookkeeping)                                                                                                   |
| `transactionHistoryService.ts` | ✅     | History queries             | Pagination, filtering                                                                                                                          |
| `receiptService.ts`            | ✅     | Receipt generation          | Format transaction receipts                                                                                                                    |
| `transactions.ts`              | ✅     | Transaction handling        | Create, validate, process                                                                                                                      |
| `walletHelpers.ts`             | ✅     | Helper utilities            | Validation, formatting                                                                                                                         |

### Controllers

| File                  | Status | Purpose                                   |
| --------------------- | ------ | ----------------------------------------- |
| `WalletController.ts` | ✅     | Main request handler for wallet endpoints |

### Configuration

**File**: `src/config/`

- **Status**: ✅
- **Contains**: Database config, service constants

### Database

**File**: `src/database.ts`

- **Status**: ✅
- **Purpose**: Prisma client initialization

### Tests

**File**: `jest.config.cjs`

- **Status**: ✅
- **Purpose**: Jest test configuration

### Package File

**File**: `package.json`

- **Status**: ✅
- **Scripts**:
  - `build`: TypeScript compilation
  - `dev`: Development with tsx watch
  - `start`: Production start
  - `test`: Jest tests
  - `lint`: ESLint
  - `fx:fetch`: Fetch FX rates
  - `fx:schedule`: Schedule FX updates
  - `reconcile`: Run reconciliation job

### Documentation

**File**: `docs/api-reference.md`

- **Status**: ✅
- **Content**: Complete API reference (lines 1-100+)

---

## Payment Service Files

### Main Application

**File**: `services/payment-service/src/index.ts`

- **Status**: ⚠️ NEEDS FIX
- **Purpose**: Express server setup for payment operations
- **Port**: 3007
- **Issue**: WalletManager not instantiated

### Routes

| File               | Status | Purpose                 | Issue                           |
| ------------------ | ------ | ----------------------- | ------------------------------- |
| `payments.ts`      | ✅     | Payment processing      | -                               |
| `virtual-cards.ts` | ✅     | Virtual card management | -                               |
| `tax.ts`           | ✅     | Tax calculation         | -                               |
| `wallet.ts`        | ⚠️     | **Wallet endpoints**    | Expects WalletManager parameter |

**wallet.ts Details**:

```typescript
export default (walletManager: WalletManager): Router => { ... }
```

- **Lines**: 1-235
- **Endpoints**:
  - GET `/` - List wallets
  - GET `/balance` - Get balance
  - POST `/credit` - Credit wallet
  - POST `/debit` - Debit wallet
  - POST `/transfer` - Transfer between currencies
  - GET `/history` - Transaction history

### Middleware

**File**: `src/middleware/auth.js`

- **Status**: ✅
- **Purpose**: JWT authentication, permission checking

### Configuration

**File**: `src/config/`

- **Status**: ✅

### Tests

**File**: `src/__tests__/`

- **Status**: ✅

### Package File

**File**: `package.json`

- **Status**: ✅

---

## Shared Wallet Package

### Main Export

**File**: `packages/wallet/src/index.ts`

- **Status**: ✅
- **Content**: Re-exports from services/index.ts

### WalletManager Implementation

**File**: `packages/wallet/src/services/index.ts`

- **Status**: ⚠️ PARTIAL
- **Lines**: 1-200+
- **Class**: `WalletManager`

**Implemented Methods** ✅:

```typescript
async creditWallet(userId, currency, amount, description, idempotencyKey)
async debitWallet(userId, currency, amount, description, idempotencyKey)
async getWallet(userId, currency): Promise<Wallet | null>
async getUserWallets(userId): Promise<Wallet[]>
async getWalletBalance(userId, currency): Promise<{ balance, currency }>
async getTransactionHistory(userId, limit, offset): Promise<WalletTransaction[]>
```

**Missing Methods** ❌:

```typescript
async transferBetweenCurrencies(userId, fromCurrency, toCurrency, amount, idempotencyKey)
  // Called in payment-service/wallet.ts but not defined
```

### Package File

**File**: `package.json`

- **Status**: ✅
- **Dependencies**: @prisma/client, @tripalfa/shared-types

### Configuration

**File**: `tsconfig.json`

- **Status**: ✅

---

## Database Schema

### Prisma Schema Files

**File**: `database/prisma/schema.core.prisma`

- **Status**: ✅ Complete
- **Lines**: 1065-1175 (Wallet section)

**Models**:

1. **wallet** (line 1067)
   - Fields: id, userId, balance, reservedBalance, currency, status, dailyLimit, monthlyLimit, createdAt, updatedAt
   - Indexes: userId (unique)
   - Relations: ledgerEntries

2. **wallet_transaction** (line 1087)
   - Fields: id, walletId, payerId, payeeId, referenceId, idempotencyKey, type, flow, amount, balance, currency, credit, debit, description, bookingId, paymentId, serviceType, supplierId, supplierName, bookingRef, travelDate, returnDate, route, hotelAddress, guestName, roomType, metadata, status, createdAt
   - Indexes: walletId, bookingId, payerId, payeeId
   - Relations: ledgerEntries

3. **wallet_ledger** (line 1128)
   - Fields: id, walletId, transactionId, entryType, amount, balance, currency, credit, debit, accountType, account, createdAt
   - Relations: wallet (FK), transaction (FK)
   - Indexes: walletId, transactionId

4. **wallet_approval_request** (line 1151)
   - Fields: id, walletId, amount, reason, status, approverIds, approvals, approvedAt, metadata, createdAt, updatedAt
   - Indexes: walletId, status

**Other Prisma Files**:

- `schema.finance.prisma` - Finance data (separate database)
- `schema.local.prisma` - Local development config
- `schema.email-verification.prisma` - Auth schema
- `schema.ops.prisma` - Operations schema

### Migrations

**Directory**: `database/migrations/`

- **Status**: ✅
- **Purpose**: Database versioning

---

## API Gateway Configuration

**File**: `services/api-gateway/src/config/api-manager.config.ts`

- **Status**: ✅ Complete
- **Lines**: 1599-1690 (Wallet section)

### Wallet Endpoints Configuration

| Endpoint                     | Method | Service        | Rate Limit | Auth | Timeout |
| ---------------------------- | ------ | -------------- | ---------- | ---- | ------- |
| `/api/exchange-rates/latest` | GET    | bookingService | 120/min    | ❌   | 5s      |
| `/api/wallet`                | GET    | paymentService | 50/min     | ✅   | 5s      |
| `/api/wallet/balance`        | GET    | paymentService | 50/min     | ✅   | 5s      |
| `/api/wallet/fx-preview`     | GET    | paymentService | 50/min     | ✅   | 5s      |
| `/api/wallet/credit`         | POST   | paymentService | 10/min     | ✅   | 10s     |
| `/api/wallet/debit`          | POST   | paymentService | 10/min     | ✅   | 10s     |
| `/api/wallet/transfer`       | POST   | paymentService | 10/min     | ✅   | 10s     |
| `/api/wallet/history`        | GET    | paymentService | 20/min     | ✅   | 10s     |

### Service Configuration

```typescript
walletService: {
  name: "Wallet Service",
  baseUrl: getServiceUrl("WALLET_SERVICE"),
  port: process.env.WALLET_SERVICE_PORT || 3008,
}
```

---

## Booking Service Integration

**File**: `services/booking-service/src/routes/bookings.ts`

- **Status**: ✅ Partial
- **Line**: 782+

### Wallet Payment Endpoint

```typescript
POST /:id/pay-wallet
```

**Functionality**:

- Process wallet payment for booking
- Update booking status
- Log audit trail
- Mark payment method as "wallet"

### LiteAPI Integration

**File**: `services/booking-service/src/routes/liteapi.ts`

- **Status**: ✅ Partial
- **Lines**: 1108-1300+

**Features**:

- WALLET payment method detection
- Wallet balance validation
- Credit balance checking
- Payment method support checking

---

## Frontend Integration

### Wallet API Client

**File**: `apps/booking-engine/src/services/walletApi.ts`

- **Status**: ✅ Complete
- **Lines**: 1-80

**Exported Functions**:

```typescript
export async function getUserWallets(token: string);
export async function transferBetweenWallets(token, params);
export async function getTransferHistory(token, options);
export async function getFxPreview(token, fromCurrency, toCurrency, amount);
export default { getUserWallets, transferBetweenWallets, getTransferHistory, getFxPreview };
```

### Testing

**File**: `apps/booking-engine/src/services/__tests__/flightBookingWorkflowOrchestrator.test.ts`

- **Status**: ✅
- **Coverage**: Wallet debit/credit tests

---

## Environment Configuration

### Environment File

**File**: `.env.example`

- **Status**: ✅
- **Wallet Variables**:
  - `WALLET_SERVICE_PORT=3008`
  - `WALLET_SERVICE_URL="http://localhost:3008"`
  - `VITE_WALLET_SERVICE_URL="http://localhost:3008"`
  - `ENABLE_WALLET=true`

### Docker/Infrastructure

**File**: `infrastructure/monitoring/prometheus.yml`

- **Status**: ✅
- **Services**: Includes wallet-service (3008)

---

## Documentation

### Complete Report

**File**: `WALLET_INFRASTRUCTURE_REPORT.md` (This repo root)

- **Status**: ✅ Generated
- **Content**: Complete architecture overview, issues, and recommendations

### Architecture Visual

**File**: `WALLET_ARCHITECTURE_VISUAL.md` (This repo root)

- **Status**: ✅ Generated
- **Content**: Flow diagrams, component matrix, setup checklist

### API Reference

**File**: `services/wallet-service/docs/api-reference.md`

- **Status**: ✅
- **Content**: Endpoint documentation, request/response examples

### Implementation Plans

**File**: `docs/PAYMENT_PHASE1_IMPLEMENTATION.md`

- **Status**: ✅
- **Content**: Phase 1 complete, Phase 2 wallet integration planned

**File**: `docs/PAYMENT_TESTING_QUICKSTART.md`

- **Status**: ✅
- **Content**: Testing guide for wallet operations

### Infrastructure

**File**: `docs/LOCAL_INFRASTRUCTURE_SETUP.md`

- **Status**: ✅
- **Content**: Wallet service setup (line 43)

**File**: `infrastructure/monitoring/prometheus.yml`

- **Status**: ✅
- **Content**: Service monitoring config

---

## Configuration Files

### ESLint Configuration

**File**: `eslint.config.js`

- **Status**: ✅
- **Line**: 286-288
- **Content**: Wallet service ESLint rules for Prisma patterns

### TypeScript Configuration

**File**: `tsconfig.base.json`

- **Status**: ✅
- **Paths**: Path mappings for monorepo

---

## Summary Statistics

| Category                | Count | Status                   |
| ----------------------- | ----- | ------------------------ |
| **Services**            | 3     | ⚠️ 1 needs fix           |
| **Route Files**         | 7     | ✅ All present           |
| **Service Files**       | 8     | ⚠️ 1 incomplete          |
| **Controller Files**    | 1     | ✅ Complete              |
| **Shared Packages**     | 1     | ⚠️ Partial               |
| **Database Models**     | 4     | ✅ Complete              |
| **API Endpoints**       | 8     | ✅ Configured            |
| **Documentation Files** | 6+    | ✅ Complete              |
| **Missing Files**       | 1     | ❌ wallet.ts entry point |

---

## Next Actions

### Immediate Fixes (Critical Path)

1. **Fix Payment-service initialization** (`services/payment-service/src/index.ts`)
   - Instantiate WalletManager
   - Pass to walletRoutes factory function

2. **Identify wallet.ts role** (`services/wallet-service/src/routes/`)
   - May need to create aggregator
   - Or verify if `walletRoutes.ts` is the main entry

3. **Implement transferBetweenCurrencies()** (packages/wallet)
   - Complete WalletManager implementation
   - Add FX conversion logic
   - Create atomic transaction

### Quality Improvements

- Add comprehensive error handling
- Standardize error formats across services
- Add integration tests
- Add monitoring and alerting

---

**Generated**: March 20, 2026  
**Report Version**: 1.0  
**Scope**: Complete wallet infrastructure inventory
