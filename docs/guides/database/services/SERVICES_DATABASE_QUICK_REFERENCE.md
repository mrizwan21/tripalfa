# TripAlfa Services Database Mapping — Quick Reference

**Generated:** March 9, 2026  
**Purpose:** Quick lookup for service-to-database mapping during implementation

---

## Quick Service-to-Database Map

```text
┌─ tripalfa_core (OLTP)
│  ├── api-gateway (routing only, may add auth lookup later)
│  ├── booking-service ✅
│  ├── user-service ✅
│  ├── wallet-service (also needs finance)
│  ├── organization-service (also needs finance)
│  ├── kyc-service ✅
│  └── booking-engine-service (also needs local)
│
├─ tripalfa_ops (Support/Ops)
│  ├── notification-service ✅
│  ├── rule-engine-service ✅
│  └── booking-engine-service (partial: offline requests)
│
├─ tripalfa_finance (Batch/Reporting)
│  ├── marketing-service ✅
│  ├── wallet-service (also needs core)
│  ├── organization-service (also needs core)
│  └── b2b-admin-service (read-only)
│
├─ tripalfa_local (Static Data)
│  ├── booking-service (read-only)
│  └── booking-engine-service (read-only)
│
└─ No Database (Stateless)
   ├── alerting-service (webhook bridge)
   └── payment-service (framework only, TBD)

b2b-admin-service → Special: Read-only access to ALL (core + ops + finance)
```

---

## Implementation Cheat Sheet

### Single-Database Services (Most Common)

#### tripalfa_core Services

```typescript
// user-service, kyc-service
import { coreDb as prisma } from '@tripalfa/shared-database';
```

#### tripalfa_ops Services

```typescript
// notification-service, rule-engine-service
import { opsDb as prisma } from '@tripalfa/shared-database';
```

#### tripalfa_finance Services

```typescript
// marketing-service
import { financeDb as prisma } from '@tripalfa/shared-database';
```

### Multi-Database Services

#### booking-service (core + local)

```typescript
import { coreDb, localDb } from '@tripalfa/shared-database';

// Use coreDb for: bookings, booking_passengers, duffel_*, kiwi_*, audit_logs
// Use localDb for: price lookups, static data (via separate query methods)
```

#### wallet-service (core + finance)

```typescript
import { coreDb, financeDb } from '@tripalfa/shared-database';

// Use coreDb for: wallet, wallet_transaction, wallet_ledger, user
// Use financeDb for: exchange_rate, supplier_wallet (future)
```

#### organization-service (core + finance)

```typescript
import { coreDb, financeDb } from '@tripalfa/shared-database';

// Use coreDb for: company, department, designation, cost_center
// Use financeDb for: campaign
```

#### booking-engine-service (core + local)

```typescript
import { coreDb, localDb } from '@tripalfa/shared-database';

// Use coreDb for: booking, booking_passenger, offline_change_request
// Use localDb for: static hotel data (via staticDbPool or Prisma)
```

#### b2b-admin-service (ALL — read-only)

```typescript
import {
  coreDb, // Read bookings, company, users
  opsDb, // Read disputes, documents
  financeDb, // Read commissions, currency, markup
} from '@tripalfa/shared-database';

// All queries are read-only
```

### Stateless Services (No Changes Needed)

#### alerting-service

- No Prisma import
- Webhook bridge only
- Entry: `resend-webhook-bridge.ts`

#### api-gateway

- No Prisma import (routing gateway)
- Entry: `index.ts`

#### payment-service

- Unused Prisma stub in `database.ts`
- Awaiting feature implementation
- Entry: `index.ts`

---

## Database Initialization Example

```typescript
// packages/shared-database/src/index.ts (new structure)

import { PrismaClient as LocalPrismaClient } from './generated/local/index.js';
import { PrismaClient as CorePrismaClient } from './generated/core/index.js';
import { PrismaClient as OpsPrismaClient } from './generated/ops/index.js';
import { PrismaClient as FinancePrismaClient } from './generated/finance/index.js';

// Global instances
export const localDb = new LocalPrismaClient({
  datasources: {
    db: { url: process.env.LOCAL_DATABASE_URL },
  },
});

export const coreDb = new CorePrismaClient({
  datasources: {
    db: { url: process.env.CORE_DATABASE_URL },
  },
});

export const opsDb = new OpsPrismaClient({
  datasources: {
    db: { url: process.env.OPS_DATABASE_URL },
  },
});

export const financeDb = new FinancePrismaClient({
  datasources: {
    db: { url: process.env.FINANCE_DATABASE_URL },
  },
});

// Legacy: default to coreDb for backward compatibility during migration
export const prisma = coreDb;
```

---

## Environment Variables Needed

```bash
# .env.local or .env

# Core OLTP database
CORE_DATABASE_URL=postgresql://postgres@localhost:5432/tripalfa_core

# Operations/Support database
OPS_DATABASE_URL=postgresql://postgres@localhost:5432/tripalfa_ops

# Finance/Batch database
FINANCE_DATABASE_URL=postgresql://postgres@localhost:5432/tripalfa_finance

# Static/Hotel content database (read-only reference)
LOCAL_DATABASE_URL=postgresql://postgres@localhost:5432/tripalfa_local

# Optional: Static data pool (used by booking-engine for hotel static data)
STATIC_DATABASE_URL=postgresql://postgres@localhost:5432/staticdatabase
```

---

## Service-by-Service Migration Checklist

### Phase 1: Single-Database Services (Simplest)

- [ ] user-service → import `coreDb`
- [ ] kyc-service → import `coreDb`
- [ ] marketing-service → import `financeDb`
- [ ] notification-service → import `opsDb`
- [ ] rule-engine-service → import `opsDb`

### Phase 2: Multi-Database Services (Moderate)

- [ ] wallet-service → import `coreDb, financeDb`
- [ ] organization-service → import `coreDb, financeDb`
- [ ] booking-service → import `coreDb, localDb`
- [ ] booking-engine-service → import `coreDb, localDb`

### Phase 3: Special Cases (Complex)

- [ ] b2b-admin-service → import `coreDb, opsDb, financeDb` (read-only queries only)
- [ ] api-gateway → no change (routing only)

### Phase 4: Awaiting Features

- [ ] payment-service → keep as-is (unused, awaiting implementation)
- [ ] alerting-service → no change (webhook bridge)

---

## Model-to-Database Mapping Reference

### tripalfa_core Models

```text
airport, airline, destination                  // Transactional enriched versions
audit_log, circuit_breaker                     // Monitoring & resilience
booking, booking_segment, booking_passenger    // Flight bookings
booking_modification                           // Change tracking
company, branch, department, designation       // Organization structure
cost_center, role, user_role                   // Access control
duffel_airline_credit, duffel_airline_initiated_change
duffel_batch_offer_request, duffel_cancellation_cache
duffel_offer, duffel_offer_cache, duffel_offer_request_cache
duffel_order, duffel_order_cache               // Flight integration
duffel_seat_map_cache, duffel_services_cache   // Flight reference
exchange_rate                                  // Pricing (primary)
kyc_verification                               // Compliance
kiwi_booking_hold, kiwi_price_change           // Alternative integration
kiwi_refund, kiwi_settlement                   // Settlement tracking
user, user_preference                          // User management
wallet, wallet_ledger, wallet_transaction      // Wallet management
wallet_reconciliation                          // Financial reconciliation
```

### tripalfa_ops Models

```text
channel_status                                 // Notification channel tracking
dead_letter_queue                              // Failed event handling
dispute, settlement                            // Issue resolution
document, document_access, document_retention  // Document management
document_template                              // Template library
notification, notification_analytics           // Notification delivery
notification_metrics, notification_retries     // Retry & metrics
notification_target                            // Recipient management
offline_change_request, offline_request_audit_log  // Offline support
offline_request_notification_queue             // Queue management
rule, rule_analysis, rule_execution            // Business rules engine
scheduled_notification                         // Future notifications
webhook_event                                  // Webhook tracking
```

### tripalfa_finance Models

```text
campaign, marketing_campaign                   // Campaign management
commission_rule, commission_settlement         // Commission tracking
corporate_contract                             // Contract management
coupon_redemption                              // Promotion tracking
currency, board_type                           // Catalog/reference
customer_loyalty, loyalty_tier                 // Loyalty program
loyalty_transaction, loyalty_voucher           // Loyalty tracking
markup_rule, pricing_audit_log                 // Pricing rules
promo_code                                     // Discounts
supplier, supplier_credential                  // Supplier management
supplier_deal, deal_mapping_rule               // Partnership deals
supplier_financials, supplier_payment_term     // Finance tracking
supplier_hotel_mapping                         // Content mapping
supplier_payment, supplier_payment_log         // Payment tracking
supplier_product, supplier_product_mapping     // Product catalog
supplier_sync_log                              // Integration logging
supplier_wallet, supplier_wallet_approval_request
supplier_wallet                                // Supplier account
```

### tripalfa_local Models (Read-Only Reference)

```text
hotel_amenity, hotel_content                   // Hotel data
hotel_image, hotel_room_image                  // Media
hotel_room_type                                // Room definitions

duffel_aircraft, duffel_airline                // Reference (static)
duffel_airport, duffel_city, duffel_loyalty_programme
duffel_place_suggestion                        // Reference (static)

liteapi_chain, liteapi_city                    // Reference (static)
liteapi_country, liteapi_currency              // Reference (static)
liteapi_facility, liteapi_hotel_type           // Reference (static)
liteapi_hotel, liteapi_iata_code               // Reference (static)
liteapi_language, liteapi_review               // Reference (static)
```

---

## Testing & Verification

### 1. After updating imports, verify TypeScript compilation

```bash
npm run build
npx tsc -p tsconfig.json --noEmit
```

### 2. Test service startup

```bash
npm run dev --workspace=@tripalfa/user-service
npm run dev --workspace=@tripalfa/booking-service
npm run dev --workspace=@tripalfa/b2b-admin-service
```

### 3. Verify database connections

```bash
# Each service should initialize without connection errors
# Health endpoints should respond:
curl http://localhost:3001/health  # user-service
curl http://localhost:3002/health  # booking-service
curl http://localhost:3003/health  # b2b-admin-service
```

### 4. Verify data isolation

```bash
# Confirm that services can only see their respective domain tables
psql -U postgres tripalfa_core     # Should see core tables only
psql -U postgres tripalfa_ops      # Should see ops tables only
psql -U postgres tripalfa_finance  # Should see finance tables only
psql -U postgres tripalfa_local    # Should see local/static tables only
```

---

## Common Issues & Solutions

### Issue: "Prisma client not found for Database Y"

**Solution:** Verify all 4 DATABASE_URL environment variables are set in `.env`

### Issue: "Relation 'X' not found in schema"

**Solution:** Model is in wrong database; check model-to-database mapping above

### Issue: "b2b-admin-service can't find commission_settlement"

**Solution:** b2b-admin-service needs `financeDb` import for read-only finance queries

### Issue: "booking-engine-service can't find offline_change_request"

**Solution:** This ops model should be in tripalfa_ops; booking-engine imports `opsDb` for offline requests

### Issue: Static hotel data not loading in booking-engine

**Solution:** Ensure `STATIC_DATABASE_URL` or `LOCAL_DATABASE_URL` is set; booking-engine uses separate static pool

---

## Legend

- ✅ Ready to migrate (clear database domain)
- 🟡 Future (implementation pending, framework in place)
- 📌 Special (multiple databases or read-only)
- 🔧 No change needed (stateless service)

---

**Last Updated:** March 9, 2026  
**Audit Status:** Complete — Ready for implementation
