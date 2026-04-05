# Supplier Management Module - Comprehensive Design

**Status**: Design Phase  
**Version**: 1.0  
**Last Updated**: March 2, 2026

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Data Models](#data-models)
4. [API Endpoints](#api-endpoints)
5. [Workflows](#workflows)
6. [Implementation Phases](#implementation-phases)

---

## Overview

The **Supplier Management Module** is a comprehensive system for onboarding, managing, and paying suppliers across multiple product categories (flights, hotels, activities, cars, etc.). It includes:

- ✅ **Phase 1 (COMPLETE)**: Supplier onboarding + API credential management + gateway integration
- 🔨 **Phase 2 (IN PROGRESS)**: Product mapping, financial details, supplier wallets, deletion rules

### Key Features (Phase 2)

| Feature               | Purpose                                                                | Status |
| --------------------- | ---------------------------------------------------------------------- | ------ |
| **Product Mapping**   | Map supplier products to platform catalog with geographic/market rules | Design |
| **Financial Details** | Payment terms, commission structure, payout management                 | Design |
| **Supplier Wallets**  | Separate wallet system with admin approval workflow                    | Design |
| **Deletion Rules**    | Soft delete with financial liability checks                            | Design |
| **Supplier Payments** | Payout processing with settlement tracking                             | Design |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   B2B Admin Service (port 3020)              │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Supplier Management Routes               │  │
│  │                                                       │  │
│  │  • /api/suppliers (CRUD) ← Phase 1 ✅               │  │
│  │  • /api/suppliers/:id/products (NEW) ← Phase 2      │  │
│  │  • /api/suppliers/:id/mappings (ENHANCE) ← Phase 2  │  │
│  │  • /api/suppliers/:id/financial (NEW) ← Phase 2     │  │
│  │  • /api/suppliers/:id/wallets (NEW) ← Phase 2       │  │
│  │  • /api/suppliers/:id/payments (NEW) ← Phase 2      │  │
│  │                                                       │  │
│  └──────────────────────────────────────────────────────┘  │
│                              ↓                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │          Prisma ORM (local Database)                  │  │
│  │                                                       │  │
│  │  Tables:                                             │  │
│  │  • Supplier (enhanced) ← Phase 1 ✅                 │  │
│  │  • SupplierProduct (NEW) ← Phase 2                  │  │
│  │  • SupplierProductMapping (NEW) ← Phase 2           │  │
│  │  • ProductMappingParameter (NEW) ← Phase 2          │  │
│  │  • SupplierFinancial (NEW) ← Phase 2                │  │
│  │  • SupplierPaymentTerm (NEW) ← Phase 2              │  │
│  │  • SupplierWallet (NEW) ← Phase 2                   │  │
│  │  • SupplierWalletApprovalRequest (NEW) ← Phase 2    │  │
│  │  • SupplierPayment (NEW) ← Phase 2                  │  │
│  │  • SupplierPaymentLog (NEW) ← Phase 2               │  │
│  │                                                       │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Models

### Phase 2 New Tables

#### 1. SupplierProduct

Maps supplier's own product catalog to the platform.

```sql
CREATE TABLE supplier_products (
  id CUID PRIMARY KEY,
  supplierId CUID NOT NULL,
  externalProductId STRING NOT NULL,     -- Supplier's product ID
  productType STRING,                     -- 'flight', 'hotel', 'activity', 'car'
  name STRING NOT NULL,
  description TEXT,
  category STRING,
  subCategory STRING,
  metadata JSON,
  status STRING DEFAULT 'active',
  isActive BOOLEAN DEFAULT true,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX ON supplier_products(supplierId, externalProductId);
```

#### 2. SupplierProductMapping

Maps supplier products to platform products with geographic/market rules.

```sql
CREATE TABLE supplier_product_mappings (
  id CUID PRIMARY KEY,
  supplierId CUID NOT NULL,
  supplierProductId CUID NOT NULL,
  platformProductId CUID,                -- Our internal product
  productType STRING,                     -- 'flight', 'hotel', etc.
  marketNames STRING[],                   -- ['US', 'EU', 'ASIA']
  geographyZones STRING[],                -- ['North America', 'Western Europe']
  seasonalAppliance STRING,               -- 'year-round', 'summer', 'winter'
  businessRules JSON,                     -- Custom mapping logic
  status STRING DEFAULT 'active',
  matchConfidence DECIMAL(5, 2),          -- 0-100 confidence score
  approvedBy CUID,                        -- Admin who approved
  approvedAt TIMESTAMP,
  metadata JSON,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);

CREATE INDEX ON supplier_product_mappings(supplierId, productType);
CREATE INDEX ON supplier_product_mappings(status);
```

#### 3. ProductMappingParameter

Detailed parameters for product mapping (e.g., commission per market).

```sql
CREATE TABLE product_mapping_parameters (
  id CUID PRIMARY KEY,
  mappingId CUID NOT NULL,
  parameterType STRING,                   -- 'commission', 'markup', 'discount', 'tax'
  marketName STRING,                      -- Optional market-specific
  parameterName STRING,
  parameterValue DECIMAL(12, 4),
  unit STRING,                            -- 'percentage', 'fixed', 'per_unit'
  validFrom TIMESTAMP,
  validTo TIMESTAMP,
  metadata JSON,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);

CREATE INDEX ON product_mapping_parameters(mappingId);
```

#### 4. SupplierFinancial

Financial profile of supplier (payment terms, settlement cycles, etc.).

```sql
CREATE TABLE supplier_financials (
  id CUID PRIMARY KEY,
  supplierId CUID NOT NULL UNIQUE,
  paymentTerms STRING,                    -- '30_days', '60_days', 'monthly', 'weekly'
  settlementCycle STRING,                 -- 'daily', 'weekly', 'monthly'
  commissionStructure JSON,               -- { "flight": 5%, "hotel": 8%, ...}
  minimumPayoutAmount DECIMAL(12, 2),
  bankAccountName STRING,
  bankAccountNumber STRING (encrypted),
  bankCode STRING,
  swiftCode STRING,
  accountHolderName STRING,
  country STRING,
  currency STRING DEFAULT 'USD',
  taxId STRING,
  paymentHolds BOOLEAN DEFAULT false,
  holdReason STRING,
  holdExpiresAt TIMESTAMP,
  totalOutstanding DECIMAL(12, 2) DEFAULT 0,
  totalPaid DECIMAL(12, 2) DEFAULT 0,
  totalAttributed DECIMAL(12, 2) DEFAULT 0,
  metadata JSON,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX ON supplier_financials(supplierId);
```

#### 5. SupplierPaymentTerm

Detailed payment term rules.

```sql
CREATE TABLE supplier_payment_terms (
  id CUID PRIMARY KEY,
  supplierId CUID NOT NULL,
  termType STRING,                       -- 'deposit', 'partial', 'full_settlement'
  daysFromBooking INT,                   -- Days after booking
  percentageRequired DECIMAL(5, 2),      -- % of total due
  minimumAmount DECIMAL(12, 2),
  description STRING,
  isActive BOOLEAN DEFAULT true,
  createdAt TIMESTAMP DEFAULT NOW()
);

CREATE INDEX ON supplier_payment_terms(supplierId);
```

#### 6. SupplierWallet

Supplier's payment wallet (separate from user wallets).

```sql
CREATE TABLE supplier_wallets (
  id CUID PRIMARY KEY,
  supplierId CUID NOT NULL UNIQUE,
  balance DECIMAL(12, 2) DEFAULT 0,
  reservedBalance DECIMAL(12, 2) DEFAULT 0,  -- For pending bookings
  totalEarned DECIMAL(12, 2) DEFAULT 0,
  totalPaid DECIMAL(12, 2) DEFAULT 0,
  currency STRING DEFAULT 'USD',
  status STRING DEFAULT 'pending',            -- 'pending', 'active', 'suspended', 'closed'
  approvalStatus STRING DEFAULT 'pending',    -- 'pending', 'approved', 'rejected'
  dailyPayoutLimit DECIMAL(12, 2),
  monthlyPayoutLimit DECIMAL(12, 2),
  deletedAt TIMESTAMP,                        -- Soft delete marker
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX ON supplier_wallets(supplierId);
CREATE INDEX ON supplier_wallets(status);
```

#### 7. SupplierWalletApprovalRequest

Approval workflow for wallet creation/changes.

```sql
CREATE TABLE supplier_wallet_approval_requests (
  id CUID PRIMARY KEY,
  supplierId CUID NOT NULL,
  walletId CUID,
  requestType STRING,                    -- 'create', 'update', 'reactivate'
  requestData JSON,                      -- Details of the request
  approverRole STRING,                   -- 'admin', 'finance', 'legal'
  status STRING DEFAULT 'pending',       -- 'pending', 'approved', 'rejected'
  approvedBy CUID,
  approvalNotes STRING,
  reason STRING,                         -- For rejection
  requestedAt TIMESTAMP DEFAULT NOW(),
  respondedAt TIMESTAMP,
  expiresAt TIMESTAMP,                   -- Request expires after 30 days
  createdAt TIMESTAMP DEFAULT NOW()
);

CREATE INDEX ON supplier_wallet_approval_requests(supplierId);
CREATE INDEX ON supplier_wallet_approval_requests(status);
```

#### 8. SupplierPayment

Payment/payout records.

```sql
CREATE TABLE supplier_payments (
  id CUID PRIMARY KEY,
  supplierId CUID NOT NULL,
  walletId CUID NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  currency STRING DEFAULT 'USD',
  paymentType STRING,                    -- 'payout', 'refund', 'adjustment', 'reversal'
  paymentMethod STRING,                  -- 'bank_transfer', 'check', 'credit', 'cryptocurrency'
  transactionReference STRING,
  status STRING DEFAULT 'pending',       -- 'pending', 'processing', 'completed', 'failed', 'cancelled'
  scheduledFor TIMESTAMP,
  processedAt TIMESTAMP,
  failureReason STRING,
  metadata JSON,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);

CREATE INDEX ON supplier_payments(supplierId);
CREATE INDEX ON supplier_payments(status);
CREATE INDEX ON supplier_payments(createdAt);
```

#### 9. SupplierPaymentLog

Audit trail for all financial transactions.

```sql
CREATE TABLE supplier_payment_logs (
  id CUID PRIMARY KEY,
  supplierId CUID NOT NULL,
  paymentId CUID,
  action STRING,                         -- 'created', 'approved', 'processed', 'failed', 'cancelled'
  amount DECIMAL(12, 2),
  previousBalance DECIMAL(12, 2),
  newBalance DECIMAL(12, 2),
  actorId CUID,                          -- Who performed the action
  actorType STRING,                      -- 'system', 'admin', 'supplier'
  notes STRING,
  metadata JSON,
  createdAt TIMESTAMP DEFAULT NOW()
);

CREATE INDEX ON supplier_payment_logs(supplierId);
CREATE INDEX ON supplier_payment_logs(action);
```

---

## API Endpoints

### Product Mapping APIs

| Method   | Endpoint                                            | Purpose                  |
| -------- | --------------------------------------------------- | ------------------------ |
| `GET`    | `/api/suppliers/:id/products`                       | List supplier's products |
| `POST`   | `/api/suppliers/:id/products`                       | Add supplier product     |
| `PUT`    | `/api/suppliers/:id/products/:productId`            | Update supplier product  |
| `DELETE` | `/api/suppliers/:id/products/:productId`            | Remove supplier product  |
| `GET`    | `/api/suppliers/:id/mappings`                       | List product mappings    |
| `POST`   | `/api/suppliers/:id/mappings`                       | Create product mapping   |
| `PUT`    | `/api/suppliers/:id/mappings/:mappingId`            | Update mapping           |
| `DELETE` | `/api/suppliers/:id/mappings/:mappingId`            | Remove mapping           |
| `GET`    | `/api/suppliers/:id/mappings/:mappingId/parameters` | List mapping parameters  |
| `POST`   | `/api/suppliers/:id/mappings/:mappingId/parameters` | Add parameter            |

### Financial APIs

| Method   | Endpoint                                   | Purpose                  |
| -------- | ------------------------------------------ | ------------------------ |
| `GET`    | `/api/suppliers/:id/financial`             | Get financial profile    |
| `PUT`    | `/api/suppliers/:id/financial`             | Update financial details |
| `GET`    | `/api/suppliers/:id/payment-terms`         | List payment terms       |
| `POST`   | `/api/suppliers/:id/payment-terms`         | Add payment term         |
| `PUT`    | `/api/suppliers/:id/payment-terms/:termId` | Update term              |
| `DELETE` | `/api/suppliers/:id/payment-terms/:termId` | Remove term              |

### Supplier Wallet APIs

| Method | Endpoint                                                 | Purpose                       |
| ------ | -------------------------------------------------------- | ----------------------------- |
| `POST` | `/api/suppliers/:id/wallets`                             | Request wallet creation       |
| `GET`  | `/api/suppliers/:id/wallets`                             | Get wallet details            |
| `GET`  | `/api/suppliers/:id/wallet-approvals`                    | List approval requests        |
| `POST` | `/api/suppliers/:id/wallet-approvals/:requestId/approve` | Approve wallet request        |
| `POST` | `/api/suppliers/:id/wallet-approvals/:requestId/reject`  | Reject wallet request         |
| `GET`  | `/api/suppliers/:id/payments`                            | List payments                 |
| `POST` | `/api/suppliers/:id/payments`                            | Create payment/payout request |
| `POST` | `/api/suppliers/:id/payments/:paymentId/cancel`          | Cancel payment                |
| `GET`  | `/api/suppliers/:id/payment-logs`                        | Get payment audit trail       |

---

## Workflows

### 1. Product Mapping Workflow

```
Step 1: Supplier adds their products
  POST /api/suppliers/{id}/products

Step 2: Admin maps supplier product to platform product
  POST /api/suppliers/{id}/mappings

Step 3: Admin configures geographic/market rules
  POST /api/suppliers/{id}/mappings/{mappingId}/parameters

Step 4: System applies mapping during booking → availability sync
```

### 2. Wallet Approval Workflow

```
Step 1: Supplier requests wallet creation
  POST /api/suppliers/{id}/wallets
  → Creates SupplierWalletApprovalRequest (status: pending)

Step 2: Admin reviews request
  GET /api/suppliers/{id}/wallet-approvals

Step 3: Admin approves/rejects
  POST /api/suppliers/{id}/wallet-approvals/{requestId}/approve
  → If approved: Creates SupplierWallet (status: active)
  → If rejected: Sets status: rejected

Step 4: Supplier can now receive payments
```

### 3. Payment Workflow

```
Step 1: Booking completed → amount due to supplier
  • System calculates commission based on SupplierFinancial.commissionStructure
  • Creates entry in SupplierWallet with reservedBalance

Step 2: Payment terms met → transition from reserved to available

Step 3: Supplier or Admin requests payout
  POST /api/suppliers/{id}/payments

Step 4: System processes payout
  POST /api/suppliers/{id}/payments/{paymentId}/process
  → Bank transfer OR cryptocurrency payment
  → Updates balance

Step 5: Audit trail logged
  → SupplierPaymentLog records all state changes
```

### 4. Supplier Deletion Workflow (Soft Delete)

```
Deletion Allowed IF:
  ✓ SupplierWallet.balance == 0
  ✓ No pending SupplierPayment records
  ✓ No active SupplierWalletApprovalRequest

IF Financial Liability Exists:
  ✗ Request blocked → return 409 Conflict
  → Suggest payment resolution
  → Mark for audit review

IF All Conditions Met:
  • SET Supplier.deletedAt = NOW()
  • SET SupplierWallet.deletedAt = NOW()
  • Soft delete (no data removal, just marked as deleted)
```

---

## Implementation Phases

### Phase 2a: Schema & Models (Current)

- [ ] Create 9 new Prisma models
- [ ] Run migrations
- [ ] Verify indexes
- [ ] Generate Prisma client

### Phase 2b: Product Mapping APIs

- [ ] GET /api/suppliers/:id/products
- [ ] POST /api/suppliers/:id/products
- [ ] PUT/DELETE product endpoints
- [ ] GET/POST/PUT/DELETE mapping endpoints
- [ ] Parameter management endpoints
- [ ] E2E tests for product mapping

### Phase 2c: Financial APIs

- [ ] GET/PUT /api/suppliers/:id/financial
- [ ] Payment term CRUD endpoints
- [ ] E2E tests for financial management

### Phase 2d: Supplier Wallet APIs

- [ ] POST /api/suppliers/:id/wallets (request)
- [ ] GET wallet details
- [ ] Approval workflow endpoints
- [ ] E2E tests for wallet approval

### Phase 2e: Payment Processing

- [ ] Payment creation endpoints
- [ ] Payment processing logic
- [ ] Bank integration hooks
- [ ] E2E tests for payments
- [ ] Load testing for payment throughput

### Phase 2f: Comprehensive E2E Testing

- [ ] Full supplier lifecycle test
- [ ] Product mapping matrix test
- [ ] Financial calculations test
- [ ] Wallet approval workflow test
- [ ] Payment processing test
- [ ] Deletion constraint test

---

## Next Steps

1. ✅ **This Document**: Architecture & Design approved
2. ⏭️ **Implement Prisma Schema**: Add 9 new models to schema.prisma
3. ⏭️ **Generate Migrations**: Run `npm run db:migrate`
4. ⏭️ **Build APIs**: Implement all endpoints in b2b-admin-service
5. ⏭️ **Test**: Comprehensive E2E validation

---

**Ready to proceed with schema implementation?** → Confirm and I'll create the Prisma migrations.
