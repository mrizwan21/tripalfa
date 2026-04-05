# Database Domain Distribution & Service Mapping

**Generated:** March 9, 2026  
**Purpose:** Unified view of which services use which tables across all 4 databases

cSpell:ignore staticdatabase Rebooking dedup financials Financials

---

## 📊 Overview: 4-Database Architecture & Service Dependencies

### Database Statistics

| Database         | Purpose                          | Services | Model Count | Frequency             |
| ---------------- | -------------------------------- | -------- | ----------- | --------------------- |
| tripalfa_local   | Static reference & hotel content | 2        | 26          | Read-only, infrequent |
| tripalfa_core    | Core OLTP transactions           | 7        | 35+         | Highest usage         |
| tripalfa_ops     | Operational processing           | 3        | 13          | Moderate usage        |
| tripalfa_finance | Finance & reporting              | 4        | 20+         | Lower usage           |

**Total:** 13 services across 4 PostgreSQL databases

---

## 🗄️ Detailed Database & Service Mapping

---

## DATABASE 1: tripalfa_local

**Purpose:** Hotel content + Static reference data  
**Frequency:** Read-only, rarely changes  
**Managed by:** Hotel importer (`scripts/import-hotel-content.ts`) — NEVER CHANGE STRUCTURE

### Services Reading from tripalfa_local

- **booking-service** (read-only via separate pool or Prisma)
- **booking-engine-service** (read-only via static-db.ts pool)

### Tables in tripalfa_local (26 models)

#### Hotel Content (Dynamic — Updated by Importer)

```text
hotel_content             → Hotel master data
  ├─ hotel_amenity      → Per-hotel amenities
  ├─ hotel_image        → Hotel photos
  ├─ hotel_room_type    → Room categories
  └─ hotel_room_image   → Room photos
```

#### Duffel Reference (Static)

```text
duffel_aircraft          → Flight aircraft reference
duffel_airline           → Airlines
duffel_airport           → Airports
duffel_city              → Cities
duffel_loyalty_programme → Airline loyalty programs
duffel_place_suggestion  → Location autocomplete
```

#### LiteAPI Reference (Static)

```text
liteapi_chain            → Hotel chain (e.g., Marriott)
liteapi_city             → Cities for search
liteapi_country          → Countries
liteapi_currency         → Currency definitions
liteapi_facility         → Hotel amenities reference
liteapi_hotel_type       → Hotel classification
liteapi_hotel            → Hotel master reference
liteapi_iata_code        → Airport codes
liteapi_language         → Language definitions
liteapi_review           → Hotel reviews
```

### Service Usage Details

#### booking-service Access Pattern

- Reads: hotel_content, hotel amenities, room types (price lookups)
- Access Method: Likely via `localDb` Prisma client or separate queries
- Use Case: Building complete offer data with hotel details

#### booking-engine-service Access Pattern

- Reads: All static data (liteapi*\*, duffel*\* reference)
- Access Method: `staticDbPool` (PostgreSQL `pg` library) — configuration in `static-db.ts`
- Use Case: Search suggestions, autocomplete, reference data loading
- Connection String: `STATIC_DATABASE_URL` or default `postgresql://postgres@localhost:5432/staticdatabase`

### TypeScript Types for Static Data

The `@tripalfa/shared-types` package now includes comprehensive TypeScript interfaces for all static data entities,
exported from `static.types.ts`.
These types include:

- **Airports**, **Airlines**, **Aircraft types**, **Loyalty programs**
- **Countries**, **States**, **Currencies**
- **Languages**, **Salutations**, **Genders**, **Cabin classes**, **Meal preferences**, **Special assistance types**
- **Hotel static details**, **Hotel images**, **Hotel reviews**, **Room types**, **Amenities**
- **Insurance products**, **Popular destinations**, **Promotions**, **Legal documents**, **Cancellation policies**

These types are automatically exported from the package's main entry and can be imported as:

```typescript
import type { Airport, Airline, Country } from '@tripalfa/shared-types';
```

---

## DATABASE 2: tripalfa_core

**Purpose:** Core OLTP — Highest frequency, transactional  
**Frequency:** Highest (bookings, payments, user operations)  
**Services:** 7 primary + 1 read-only

### Services Writing to tripalfa_core

1. **booking-service** (primary)
2. **booking-engine-service** (primary)
3. **user-service** (primary)
4. **wallet-service** (primary)
5. **organization-service** (primary)
6. **kyc-service** (primary)
7. **api-gateway** (future auth lookups)

### Services Reading from tripalfa_core (Read-Only)

- **b2b-admin-service** (read-only admin dashboard)

### Tables in tripalfa_core (35+ models)

#### User & Access Control (7 models)

```text
user                     → Platform users (employees, travelers)
user_preference          → User settings (language, currency, notifications)
role                     → Role definitions
user_role                → Role assignments
company                  → Organizations/companies
branch                   → Office locations
department               → Departments within company
```

#### Organization Structure (5 models)

```text
designation              → Job titles
cost_center              → Cost allocation units
audit_log                → Transaction history
circuit_breaker          → Rate limiting/resilience
exchangeRate             → FX rates (primary; also in finance)
```

#### Flight Bookings (4 core + modifications)

```text
booking                  → Flight booking master
  ├─ Contains: pnr, status, total_price, currency
booking_segment          → Flight leg (e.g., JFK→LAX)
booking_passenger        → Travelers in booking
booking_modification     → Rebooking, seat changes, etc.
```

#### Duffel Integration (10 models — Flight Offers & Orders)

```text
duffel_offer_request     → Request to Duffel API
duffel_offer             → Flight offer from Duffel
duffel_offer_cache       → Performance cache (TTL-based)
duffel_offer_request_cache → Request dedup cache

duffel_order             → Confirmed flight order
duffel_order_cache       → Order state cache
duffel_order_cancellation → Cancellation requests
duffel_order_change      → Change requests (seats, meals)

duffel_airline_credit    → Airline credit tracking
duffel_airline_initiated_change → Airline-initiated mods
duffel_batch_offer_request → Batch offer requests
duffel_cancellation_cache → Cancellation state
duffel_seat_map_cache    → Seat availability
duffel_services_cache    → Ancillary services
```

#### Alternative Integration (5 models — Kiwi.com)

```text
kiwi_booking_hold        → Hold/reservation on Kiwi
kiwi_settlement          → Settlement status
kiwi_refund              → Refund tracking
kiwi_price_change        → Price movement tracking
kiwi_airline_credit      → Airline credit (Kiwi)
```

#### Wallet & Payments (4 models)

```text
wallet                   → User/company wallet balance
wallet_transaction       → Debit/credit movement
wallet_ledger            → Immutable transaction log
wallet_reconciliation    → Balance verification
```

#### Other (3 models)

```text
kyc_verification         → Know-Your-Customer verification
booking_queue            → Async booking processing
prebook_session          → Pre-booking session state
```

---

## DATABASE 3: tripalfa_ops

**Purpose:** Operational/Support — Moderate frequency, decoupled from OLTP
**Frequency:** Moderate (notifications, rules, disputes)
**Services:** 3 primary

### Services Writing to tripalfa_ops

1. **notification-service** (primary)
2. **rule-engine-service** (primary)
3. **booking-engine-service** (partial: offline requests)

### Services Reading from tripalfa_ops (Read-Only)

- **b2b-admin-service** (read-only: disputes, documents)

### Tables in tripalfa_ops (13 models)

#### Notifications (7 models)

```text
notification             → Email/SMS/push notification record
notification_template    → HTML/text templates
notification_retry       → Retry history
notification_analytics   → Delivery metrics
notification_metric       → Aggregated stats
notification_target      → Recipient addresses
channel_status           → Email provider status (Resend health)
```

#### Business Rules Engine (3 models)

```text
rule                     → Rule definition
rule_execution           → Rule run history
rule_analysis            → Performance analysis
```

#### Documents & Legal (3 models)

```text
document                 → Uploaded documents (visas, invoices, etc.)
document_access          → Access control per document
document_retention        → Compliance/archive settings
document_template        → Invoice/receipt templates
```

#### Offline Support (3 models)

```text
offline_change_request   → Offline booking modifications
offline_request_audit_log → Audit trail
offline_request_notification_queue → Notification queue
```

#### Other Operational (2 models)

```text
dispute                  → Issue/complaint tracking
settlement               → Issue resolution/refund
dead_letter_queue        → Failed event handling
scheduled_notification   → Future notifications
webhook_event            → Webhook tracking
```

---

## DATABASE 4: tripalfa_finance

**Purpose:** Finance/Batch/Reporting — Lower frequency, batch-oriented
**Frequency:** Lower (campaigns, commissions, supplier management)
**Services:** 4 primary

### Services Writing to tripalfa_finance

1. **marketing-service** (primary)
2. **wallet-service** (primary: exchange_rate, future supplier wallets)
3. **organization-service** (partial: campaigns)

### Services Reading from tripalfa_finance (Read-Only)

- **b2b-admin-service** (read-only: commissions, currency, markup rules)

### Tables in tripalfa_finance (20+ models)

#### Marketing & Promotion (5 models)

```text
campaign                 → Marketing campaign
marketing_campaign       → Campaign details
promo_code               → Discount codes
coupon_redemption        → Code usage tracking
discount_coupon          → Coupon definitions
```

#### Commission & Pricing (4 models)

```text
commission_rule          → Commission calculation rules
commission_settlement    → Commission payout tracking
markup_rule              → Dynamic pricing rules
pricing_audit_log        → Pricing change history
```

#### Supplier Management (9 models)

```text
supplier                 → Supplier master (airlines, hotels, 3rd party)
supplier_credential      → API credentials
supplier_sync_log        → Integration sync history
supplier_hotel_mapping   → Hotel to supplier ID mapping
supplier_deal            → Partnership/rate contracts
deal_mapping_rule        → Deal selection rules
supplier_product         → Supplier-specific products
supplier_product_mapping → Product to supplier mapping
supplier_financials      → Supplier financial data
```

#### Supplier Financials & Wallets (5 models)

```text
supplier_payment_term    → Payment terms & conditions
supplier_payment         → Payment record
supplier_payment_log     → Payment history
supplier_wallet          → Supplier credit/balance
supplier_wallet_approval_request → Wallet approval workflow
```

#### Reference/Catalog (2 models)

```text
currency                 → Currency definitions (reference)
board_type               → Hotel board type (BB, HB, FB)
exchange_rate            → FX rates (also mirrors in core for speed)
```

#### Loyalty Program (4 models)

```text
loyalty_tier             → Loyalty tier definitions
customer_loyalty         → Customer loyalty enrollment
loyalty_transaction      → Points/miles transaction
loyalty_voucher          → Voucher/miles redemption
```

#### Corporate (1 model)

```text
corporate_contract       → B2B contract terms
```

---

## 🔗 Cross-Database Service Architecture

### Single-Database Services (Simplest)

#### Core-Only

```text
user-service
└─ Tables: user, user_preference

kyc-service
└─ Tables: kyc_verification
```

#### Finance-Only

```text
marketing-service
└─ Tables: marketing_campaign, promo_code
```

#### Ops-Only

```text
rule-engine-service                notification-service
├─ rule                            ├─ notification
├─ rule_execution                  ├─ notification_template
└─ rule_analysis                   ├─ notification_retry
                                   └─ notification_analytics
```

---

### Multi-Database Services (Moderate Complexity)

#### Core + Finance

```text
wallet-service
├─ coreDb: wallet, wallet_transaction, wallet_ledger, user
├─ financeDb: exchange_rate, supplier_wallet (future)
└─ Cross-DB pattern: Exchange rate FX conversions

organization-service
├─ coreDb: company, department, designation, cost_center
├─ financeDb: campaign, commission_rule (future)
└─ Cross-DB pattern: Org structure with campaign budgets
```

#### Core + Local

```text
booking-service
├─ coreDb: booking, booking_segment, booking_passenger
│        duffel_*, kiwi_*, booking_modification, audit_log
├─ localDb: hotel_content, hotel_amenity (static data lookups)
└─ Cross-DB pattern: Booking data + hotel enrichment

booking-engine-service
├─ coreDb: booking, booking_modification, offline_change_request
├─ localDb: liteapi_*, duffel_reference (search & autocomplete)
├─ opsDb: offline_request_audit_log (separate pool)
└─ Cross-DB pattern: Transactional booking + static search
```

---

### Read-Only Multi-Database Service (Complex)

#### All Databases (Read-Only)

```text
b2b-admin-service
├─ coreDb (read): booking, booking_modification
│                company, department, user, wallet
├─ opsDb (read): dispute, settlement, document
├─ financeDb (read): commission_settlement, currency
│                   markup_rule, exchange_rate
└─ Pattern: Admin dashboard reads from all domains
           No writes (read-only connections only)
           Must use Prisma `queryRaw` for reporting
```

---

## 🎯 Service Queries by Database

### Booking-Service Query Patterns

```sql
-- Core DB Queries
SELECT * FROM booking WHERE status = 'CONFIRMED'
SELECT * FROM duffel_offer WHERE price < 500
SELECT * FROM booking_modification WHERE booking_id = $1

-- Local DB Queries (separate pool)
SELECT hotel_amenity.name FROM hotel_amenity
  WHERE hotel_content.id = $1

-- Result: Combined booking + enriched hotel data
```

### Wallet-Service Query Patterns

```sql
-- Core DB Queries
SELECT * FROM wallet WHERE user_id = $1
SELECT * FROM wallet_transaction WHERE datetime > NOW() - INTERVAL '30 days'

-- Finance DB Queries
SELECT exchange_rate FROM exchange_rate
  WHERE from_currency = 'EUR' AND to_currency = 'USD'

-- Result: Wallet balance + FX-converted amounts
```

### Booking-Engine-Service Query Patterns

```sql
-- Core DB Queries
SELECT * FROM booking WHERE id = $1

-- Local DB Queries (static pool)
SELECT * FROM liteapi_hotel WHERE country = 'US'
SELECT * FROM duffel_airline WHERE iata_code = 'AA'

-- Ops DB Queries
SELECT * FROM offline_change_request WHERE status = 'PENDING'

-- Result: Complete booking engine with search + offline support
```

### B2B-Admin-Service Query Patterns

```sql
-- Core DB Queries (READ-ONLY)
SELECT * FROM booking WHERE company_id = $1
SELECT * FROM company WHERE id IN (...)

-- Finance DB Queries (READ-ONLY)
SELECT SUM(commission_amount) FROM commission_settlement
  WHERE company_id = $1 AND month = $2

-- Ops DB Queries (READ-ONLY)
SELECT * FROM dispute WHERE status = 'OPEN'

-- Result: Multi-domain admin view (no writes)
```

---

## 🚨 Critical Notes

### 1. Hotel Importer Constraint

```text
Location: scripts/import-hotel-content.ts
Database: postgresql://postgres@localhost:5432/tripalfa_local (HARDCODED)
Tables: hotel_content, hotel_amenity, hotel_image, hotel_room_type, hotel_room_image

⚠️ DO NOT CHANGE: Importer connection is hardcoded and must stay on tripalfa_local
⚠️ DO NOT MOVE: Hotel tables must remain in tripalfa_local forever
⚠️ DO NOT MODIFY: Table structure — importer expects exact schema
```

### 2. Static Data Pool (Booking-Engine)

```text
Connection: staticDbPool (pg.Pool)
Location: services/booking-engine-service/src/static-db.ts
URL: process.env.STATIC_DATABASE_URL defaults to port 5432/staticdatabase

⚠️ This is SEPARATE from Prisma
⚠️ Used for liteapi_* and duffel_reference tables only
⚠️ Not transactional — read-only reference data
```

### 3. Exchange Rate Duplication

```text
Model exists in both:
- tripalfa_core (for fast booking-time lookup)
- tripalfa_finance (for reporting & supplier settlement)

Pattern: Core reads from core for speed, finance for detailed reporting
Sync: Likely need scheduled job to sync core ← finance hourly/daily
```

### 4. B2B-Admin Read-Only Requirement

```text
Service: b2b-admin-service
Behavior: MUST be read-only across all 3 domain DBs
Implementation:
  - Use `@prisma/client` with queryRaw for reporting
  - OR create separate read-only Prisma clients
  - OR use database role with SELECT-only grants

⚠️ Admin dashboard should NEVER write to any domain DB
```

### 5. Offline Requests Spanning Databases

```text
Model: offline_change_request
Location: tripalfa_ops (not core)
Service: booking-engine-service
Pattern: Core + Ops query (booking in core, offline tracking in ops)

Reason: Offline support is operational/support function, not core OLTP
```

---

## 📈 Data Flow Diagrams

### Booking Creation Flow (Multi-DB)

```text
User → booking-engine-service
  ├─ Query coreDb: duffel_offer, exchange_rate
  ├─ Query localDb: hotel_content, hotel_amenity
  └─ Write coreDb: booking, booking_segment, booking_passenger
      Write opsDb: offline_request_audit_log (if offline)

Result: Complete booking with hotel enrichment data
```

### Payment Processing Flow (Multi-DB)

```text
User → wallet-service
  ├─ Read coreDb: wallet, user
  ├─ Read financeDb: exchange_rate, supplier_wallet
  ├─ Write coreDb: wallet, wallet_transaction, wallet_ledger
  └─ notify via opsDb: notification (trigger notification-service)

Result: Cross-DB transaction with FX conversion
```

### Admin Dashboard Flow (Read-Only Multi-DB)

```text
Admin → b2b-admin-service
  ├─ Read coreDb: booking, company, user (aggregate stats)
  ├─ Read financeDb: commission_settlement (revenue by company)
  ├─ Read opsDb: dispute (open issues)
  └─ Aggregate & return to UI (no writes to any DB)

Result: Unified view across all 3 domains
```

---

## ✅ Implementation Checklist

- [ ] Verify all 4 databases exist locally
- [ ] Verify hotel importer connects to tripalfa_local
- [ ] Create 4 separate Prisma schema files (schema.core.prisma, etc.)
- [ ] Update shared-database to export: localDb, coreDb, opsDb, financeDb
- [ ] Update each service's imports (see Quick Reference guide)
- [ ] Set 4 DATABASE_URL env vars
- [ ] Run `npm run build` — should complete with no errors
- [ ] Start each service individually — should connect without errors
- [ ] Verify health endpoints respond with "healthy" status
- [ ] Verify no cross-domain queries (each service only uses its DB(s))
- [ ] Run e2e tests — should pass with distributed DB setup

---

**Last Updated:** March 9, 2026  
**Audit Complete:** All services mapped to correct database domains  
**Ready for:** Prisma schema split & service import updates
