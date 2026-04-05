# TripAlfa Wallet Service Infrastructure Report

**Date**: March 2026  
**Scope**: Complete wallet service architecture exploration and integration points  
**Status**: Phase 1 implementation complete, Phase 2 integration ready

---

## 1. Executive Summary

The TripAlfa monorepo has a **well-structured wallet infrastructure** with:

- ✅ **Dedicated wallet-service** (Port 3008) for wallet operations
- ✅ **Shared `@tripalfa/wallet` package** with `WalletManager` class
- ✅ **Multi-currency wallet support** with ledger tracking
- ✅ **Payment service integration** (Port 3007) exposing wallet endpoints
- ✅ **API Gateway routing** with rate limiting and auth
- ✅ **Database schema** with wallet, transactions, and ledger models
- ✅ **Booking service integration** for wallet payment support

---

## 2. Wallet-Related Code Locations

### 2.1 Core Services

| Service             | Port | Location                    | Purpose                                          |
| ------------------- | ---- | --------------------------- | ------------------------------------------------ |
| **wallet-service**  | 3008 | `services/wallet-service/`  | Primary wallet operations, FX rates, settlements |
| **payment-service** | 3007 | `services/payment-service/` | Payment orchestration including wallet endpoints |
| **booking-service** | 3006 | `services/booking-service/` | Booking + wallet payment integration             |
| **api-gateway**     | 3000 | `services/api-gateway/`     | Central routing, rate limiting, auth             |

### 2.2 Shared Packages

| Package              | Location                    | Exports                                |
| -------------------- | --------------------------- | -------------------------------------- |
| **@tripalfa/wallet** | `packages/wallet/src/`      | `WalletManager` class, wallet types    |
| **shared-types**     | `packages/shared-types/`    | Wallet permission types, payment enums |
| **shared-database**  | `packages/shared-database/` | Prisma client with wallet models       |

### 2.3 Database Schema

**File**: `database/prisma/schema.core.prisma` (lines 1065-1175)

**Models**:

- `wallet` - User wallets with multi-currency support
- `wallet_transaction` - Individual transactions (deposits, withdrawals, transfers)
- `wallet_ledger` - Complete audit trail with double-entry bookkeeping
- `wallet_approval_request` - Approval workflows for large transactions

---

## 3. Current Wallet Implementation Status

### 3.1 Wallet Service (`services/wallet-service`)

#### Routes Implemented

```
src/routes/
├── walletRoutes.ts          ✅ Core wallet operations
├── transferRoute.ts         ✅ Inter-currency transfers
├── transactionHistoryRoute.ts ✅ Transaction history
├── fxRoute.ts              ✅ FX rate management
├── customerPurchaseRoute.ts ✅ Customer purchase flows
├── settlementRoute.ts      ✅ Supplier settlement
├── kiwiRoutes.ts           ✅ Kiwi integration
└── MISSING: wallet.ts      ❌ Primary route file not found
```

#### Services Implemented

```
src/services/
├── walletService.ts        ✅ Core wallet operations
├── fxService.ts           ✅ FX conversion, rate snapshots
├── walletOps.ts           ✅ Low-level wallet operations
├── ledgerOps.ts           ✅ Ledger entry creation
├── transactionHistoryService.ts ✅ History queries
├── receipts Service.ts    ✅ Receipt generation
├── transactions.ts        ✅ Transaction handling
└── walletHelpers.ts       ✅ Helper utilities
```

#### Controllers

```
src/controllers/
└── WalletController.ts     ✅ Single controller handling wallet endpoints
```

#### Current Endpoints

- `POST /` - Create wallet account
- `GET /balance/:userId` - Get wallet balance (IDOR protected)
- `POST /transfer` - Transfer between wallets
- `POST /deposit` - Deposit funds
- `POST /debit` - Debit wallet

**Environment**: Port 3008, uses local PostgreSQL (tripalfa_local)

### 3.2 Payment Service Wallet Integration

**File**: `services/payment-service/src/routes/wallet.ts` (lines 1-235)

The payment service exposes wallet endpoints through the `WalletManager` class:

```typescript
export default (walletManager: WalletManager): Router => { ... }
```

#### Endpoints

- `GET /api/wallet` - List user's wallets
- `GET /api/wallet/balance` - Get balance for specific currency
- `POST /api/wallet/credit` - Top-up wallet (idempotent)
- `POST /api/wallet/debit` - Withdraw from wallet (idempotent)
- `POST /api/wallet/transfer` - Transfer between currencies
- `GET /api/wallet/history` - Transaction history with pagination

#### Authentication

- Bearer token from JWT (`Authorization` header)
- User ID extracted from `req.user.sub`, `req.user.id`, or `req.user.userId`
- Role-based access (admin bypass available)

### 3.3 API Gateway Routing

**File**: `services/api-gateway/src/config/api-manager.config.ts` (lines 1599-1690)

#### Exposed Wallet Endpoints

| Endpoint                     | Method | Service        | Rate Limit | Auth | Timeout |
| ---------------------------- | ------ | -------------- | ---------- | ---- | ------- |
| `/api/wallet`                | GET    | paymentService | 50/min     | ✅   | 5s      |
| `/api/wallet/balance`        | GET    | paymentService | 50/min     | ✅   | 5s      |
| `/api/wallet/credit`         | POST   | paymentService | 10/min     | ✅   | 10s     |
| `/api/wallet/debit`          | POST   | paymentService | 10/min     | ✅   | 10s     |
| `/api/wallet/transfer`       | POST   | paymentService | 10/min     | ✅   | 10s     |
| `/api/wallet/history`        | GET    | paymentService | 20/min     | ✅   | 10s     |
| `/api/wallet/fx-preview`     | GET    | paymentService | 50/min     | ✅   | 5s      |
| `/api/exchange-rates/latest` | GET    | bookingService | 120/min    | ❌   | 5s      |

---

## 4. Database Schema Details

### Table: `wallet`

```sql
CREATE TABLE wallet (
  id              TEXT PRIMARY KEY,
  userId          TEXT UNIQUE NOT NULL,  -- One wallet per user
  balance         DECIMAL(12,2) DEFAULT 0,
  reservedBalance DECIMAL(12,2) DEFAULT 0,
  currency        TEXT DEFAULT 'USD',
  status          TEXT DEFAULT 'active',
  dailyLimit      DECIMAL(12,2),
  monthlyLimit    DECIMAL(12,2),
  createdAt       TIMESTAMPTZ DEFAULT now(),
  updatedAt       TIMESTAMPTZ
);
```

### Table: `wallet_transaction`

```sql
CREATE TABLE wallet_transaction (
  id              TEXT PRIMARY KEY,
  walletId        TEXT NOT NULL,
  payerId         TEXT,
  payeeId         TEXT,
  referenceId     TEXT,
  idempotencyKey  TEXT,
  type            TEXT,              -- 'deposit', 'withdrawal', 'transfer'
  flow            TEXT,               -- 'credit', 'debit'
  amount          DECIMAL(12,2),
  balance         DECIMAL(12,2),
  currency        TEXT DEFAULT 'USD',
  credit          DECIMAL(12,2),
  debit           DECIMAL(12,2),
  description     TEXT,
  bookingId       TEXT,
  paymentId       TEXT,
  serviceType     TEXT,
  supplierId      TEXT,
  supplierName    TEXT,
  bookingRef      TEXT,
  travelDate      TIMESTAMPTZ,
  returnDate      TIMESTAMPTZ,
  route           TEXT,
  hotelAddress    TEXT,
  guestName       TEXT,
  roomType        TEXT,
  metadata        JSON,
  status          TEXT DEFAULT 'completed',
  createdAt       TIMESTAMPTZ DEFAULT now()
);
```

### Table: `wallet_ledger`

```sql
CREATE TABLE wallet_ledger (
  id            TEXT PRIMARY KEY,
  walletId      TEXT NOT NULL REFERENCES wallet(id),
  transactionId TEXT NOT NULL REFERENCES wallet_transaction(id),
  entryType     TEXT,               -- 'credit', 'debit'
  amount        DECIMAL(12,2),
  balance       DECIMAL(12,2),
  currency      TEXT DEFAULT 'USD',
  credit        DECIMAL(12,2),
  debit         DECIMAL(12,2),
  accountType   TEXT,
  account       TEXT,
  createdAt     TIMESTAMPTZ DEFAULT now()
);
```

### Table: `wallet_approval_request`

```sql
CREATE TABLE wallet_approval_request (
  id          TEXT PRIMARY KEY,
  walletId    TEXT NOT NULL,
  amount      DECIMAL(12,2),
  reason      TEXT,
  status      TEXT DEFAULT 'pending',  -- 'pending', 'approved', 'rejected'
  approverIds TEXT[],
  approvals   JSON,
  approvedAt  TIMESTAMPTZ,
  metadata    JSON,
  createdAt   TIMESTAMPTZ DEFAULT now(),
  updatedAt   TIMESTAMPTZ
);
```

---

## 5. Wallet Patterns and Features

### 5.1 Core Patterns

#### Idempotency

All mutation endpoints (POST) use `idempotencyKey` to ensure idempotent operations:

```typescript
const existing = await prisma.walletTransaction.findFirst({
  where: { idempotencyKey },
});
if (existing) return existing; // Return cached result
```

#### Double-Entry Bookkeeping

Every transaction creates a ledger entry:

- **Credit**: System debit → Wallet credit
- **Debit**: Wallet debit → System credit

#### Transaction Naming

- `type`: "deposit", "withdrawal", "transfer", etc.
- `flow`: "credit" (incoming), "debit" (outgoing)
- `status`: "completed", "pending", "failed"

### 5.2 Multi-Currency Support

- **Default**: USD
- **FX Rates**: Fetch and store via `fxService.ts`
- **Conversion**: Via `fxRoute.ts` with real-time rates
- **Ledger**: Tracks conversions separately

### 5.3 Business Flows

#### Customer Purchase Flow

```
books flight → wallet debit → commission calc → agency credit → supplier credit
```

**Implemented**: `customerPurchaseRoute.ts`

#### Supplier Settlement Flow

```
agency → settle amount → deduct commission → supplier credit
```

**Implemented**: `settlementRoute.ts`

---

## 6. Integration with Payment Service

### 6.1 WalletManager Class

**Location**: `packages/wallet/src/services/index.ts`

```typescript
class WalletManager {
  constructor(config: { prisma: PrismaClient });

  // Core Operations
  async creditWallet(userId, currency, amount, description, idempotencyKey);
  async debitWallet(userId, currency, amount, description, idempotencyKey);
  async transferBetweenCurrencies(userId, fromCurrency, toCurrency, amount, idempotencyKey);

  // Queries
  async getWallet(userId, currency): Promise<Wallet | null>;
  async getUserWallets(userId): Promise<Wallet[]>;
  async getWalletBalance(userId, currency): Promise<{ balance; currency }>;
  async getTransactionHistory(userId, limit, offset): Promise<WalletTransaction[]>;
}
```

### 6.2 Payment Service Initialization

**Status**: ⚠️ **ISSUE FOUND**

The payment service imports `walletRoutes` but **doesn't initialize WalletManager**:

```typescript
// Current state in payment-service/src/index.ts
import walletRoutes from './routes/wallet.js';
app.use('/api/wallet', authMiddleware, walletRoutes); // ❌ walletRoutes expects WalletManager arg
```

**Expected**:

```typescript
const walletManager = new WalletManager({ prisma });
app.use('/api/wallet', authMiddleware, walletRoutes(walletManager)); // ✅ Pass instance
```

---

## 7. Booking Service Integration

### 7.1 Wallet Payment Support

**File**: `services/booking-service/src/routes/bookings.ts` (line 782+)

#### Endpoints

```
POST /api/admin/bookings/:id/pay-wallet
```

#### Flow

1. Receive booking ID
2. Mark payment method as "wallet"
3. Update booking status
4. Log audit trail

#### LiteAPI Support

**File**: `services/booking-service/src/routes/liteapi.ts`

```typescript
// Check wallet payment support
const walletSupported = paymentTypes?.includes('WALLET');

// Validate wallet balance
if (walletSupported && creditLine) {
  if (remainingCredit < bookingPrice) {
    throw new Error('Insufficient wallet balance');
  }
}
```

---

## 8. Frontend Integration

### 8.1 API Client

**File**: `apps/booking-engine/src/services/walletApi.ts`

```typescript
export async function getUserWallets(token: string): Promise<any>;
export async function transferBetweenWallets(token, params): Promise<any>;
export async function getTransferHistory(token, options): Promise<any>;
export async function getFxPreview(token, fromCurrency, toCurrency, amount): Promise<any>;
```

### 8.2 Routes

All routes proxied through centralized API gateway (`/api/wallet`)

---

## 9. Missing Components for Phase 2 Integration

### 9.1 Critical Issues

| Issue                                                  | Severity  | Location                                | Status        |
| ------------------------------------------------------ | --------- | --------------------------------------- | ------------- |
| WalletManager not instantiated in payment-service      | 🔴 HIGH   | `services/payment-service/src/index.ts` | ❌ TODO       |
| wallet.ts route file not found in wallet-service       | 🔴 HIGH   | `services/wallet-service/src/routes/`   | ❌ MISSING    |
| Wallet-to-wallet transfer method undefined             | 🟡 MEDIUM | `packages/wallet/src/services/index.ts` | ❌ INCOMPLETE |
| Payment-service doesn't initialize database connection | 🟡 MEDIUM | `services/payment-service/src/`         | ❌ TODO       |

### 9.2 Missing Features

| Feature                   | Status | Priority | Notes                                               |
| ------------------------- | ------ | -------- | --------------------------------------------------- |
| **FX Conversion**         | ❌     | HIGH     | `fxService` exists but not fully wired              |
| **Wallet Limits**         | ⚠️     | MEDIUM   | Schema has dailyLimit/monthlyLimit but not enforced |
| **Multi-account**         | ❌     | MEDIUM   | Support for agency/supplier wallets                 |
| **Webhook Events**        | ❌     | MEDIUM   | No webhook system for balance changes               |
| **Transaction Filtering** | ⚠️     | LOW      | Only basic queries implemented                      |
| **Reconciliation**        | ⚠️     | LOW      | Job exists but may not be scheduled                 |

### 9.3 Integration Checklist

**For Phase 2 Completion**:

- [ ] Fix WalletManager instantiation in payment-service
- [ ] Create missing `wallet.ts` route in wallet-service (or consolidate into wallet-routes)
- [ ] Implement `transferBetweenCurrencies()` method in WalletManager
- [ ] Initialize Prisma client in payment-service
- [ ] Add database migrations for wallet schema (if not present)
- [ ] Implement FX rate fetching job
- [ ] Add wallet balance validation middleware
- [ ] Create wallet payment method handler in booking orchestrator
- [ ] Add comprehensive wallet tests
- [ ] Document wallet API contracts
- [ ] Set up monitoring and alerts
- [ ] Configure rate limiting thresholds

---

## 10. Environment Configuration

### 10.1 Required Environment Variables

```env
# Wallet Service
WALLET_SERVICE_PORT=3008
WALLET_SERVICE_URL="http://localhost:3008"

# Payment Service
PAYMENT_SERVICE_PORT=3007

# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/tripalfa_local"
DIRECT_DATABASE_URL="postgresql://user:pass@localhost:5432/tripalfa_local"

# Features
ENABLE_WALLET=true
```

### 10.2 Service Ports Reference

| Service         | Port | Health Check                   |
| --------------- | ---- | ------------------------------ |
| api-gateway     | 3000 | `http://localhost:3000/health` |
| booking-engine  | 5173 | App                            |
| booking-service | 3006 | `http://localhost:3006/health` |
| payment-service | 3007 | `http://localhost:3007/health` |
| wallet-service  | 3008 | `http://localhost:3008/health` |
| auth-service    | 3009 | `http://localhost:3009/health` |

---

## 11. Known Issues & Limitations

### 11.1 From Documentation

**From `docs/KYC_TESTS_QUICK_START.md:177`**:

> "This will fail on wallet-service (known issue) but KYC tests will run"

### 11.2 From Phase 2 Planning

**From `docs/PAYMENT_PHASE1_IMPLEMENTATION.md:399-402`**:

```
Phase 2: Wallet Integration
- Complete wallet service balance operations
- Implement wallet-to-wallet transfers
- Connect wallet as payment method
```

### 11.3 Architecture Concerns

1. **Dual wallet implementations**: Both `wallet-service` and `@tripalfa/wallet` package
2. **Route consolidation needed**: Multiple route files could be consolidated
3. **Error handling**: Inconsistent error formats across services
4. **Transaction atomicity**: Need to verify Prisma transaction handling

---

## 12. Quick Reference: File Paths

### Core Files

```
services/wallet-service/src/
├── app.ts                           ✅ Main server
├── routes/walletRoutes.ts           ✅ Primary routes
├── services/walletService.ts        ✅ Core logic
├── controllers/WalletController.ts  ✅ Request handlers
└── docs/api-reference.md            📖 API docs

services/payment-service/src/
├── index.ts                         ✅ Server init
├── routes/wallet.ts                 ✅ Wallet endpoints
└── middleware/auth.js               ✅ Auth middleware

packages/wallet/src/
├── index.ts                         ✅ Exports
└── services/index.ts                ✅ WalletManager class

database/prisma/
└── schema.core.prisma               📊 Models (lines 1065-1175)

services/api-gateway/src/config/
└── api-manager.config.ts            🔀 Route config (lines 1599-1690)
```

### Documentation

```
services/wallet-service/docs/
└── api-reference.md                 📖 Complete API docs

docs/
├── PAYMENT_PHASE1_IMPLEMENTATION.md 📋 Integration plan
├── PAYMENT_TESTING_QUICKSTART.md    🧪 Testing guide
├── DATABASE_SERVICE_MAPPING.md      🗺️ Service mapping
└── LOCAL_INFRASTRUCTURE_SETUP.md    ⚙️ Setup guide
```

---

## 13. Recommended Next Steps

### Immediate (Critical Path)

1. ✅ **Review this report** - Complete overview
2. 🔧 **Fix payment-service WalletManager initialization**
3. 🔧 **Create/fix wallet.ts route file**
4. ✅ **Run health checks**: `http://localhost:3008/health`

### Short-term (Phase 2)

1. Implement missing WalletManager methods
2. Add comprehensive error handling
3. Create integration tests
4. Document wallet payment flows

### Medium-term

1. Performance optimization (indexing, caching)
2. Webhook event system
3. Advanced features (multi-account, approval workflows)
4. Monitoring and observability

---

## 14. Contact & Support

**Last Updated**: March 20, 2026  
**Maintainer**: TripAlfa Development Team  
**Related Docs**: See `/docs` and `/services/wallet-service/docs`
