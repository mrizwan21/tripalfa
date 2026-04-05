# TripAlfa Database Rebuild Guide

**Version 2.0** | **Generated:** 2026-03-17

## Overview

This guide provides step-by-step instructions for rebuilding the TripAlfa databases based on the updated ERD diagram with the following major corrections:

### Key Changes in v2.0

#### **tripalfa_local** — Static Reference Data

- **hotels + hotel_details**: Now explicitly modeled as separate tables with one-to-one FK relationship
  - `hotels` table (2.9M rows): Lightweight search index mirroring LiteAPI's `/data/hotels` endpoint
  - `hotel_details` table (2.2M rows): Rich content loaded only after detail sync
  - `is_detail_fetched` boolean flag tracks sync progress for ~680k records awaiting detail fetch
- **hotel_images**: Broken out as separate table (images were previously bloating the detail table)
- **All vendor-prefixed tables removed**: `liteapi_*`, `duffel_*` consolidated into canonical schema
- **Schemas**:
  - `shared` — Countries, currencies, languages, exchange rates
  - `hotel` — Hotel core data, details, images, facilities, rooms, reviews
  - `flight` — Airports, airlines, aircraft, loyalty programs, places

#### **tripalfa_core** — Core Application

- **wallet_ledger**: Properly linked to both `wallets` and `wallet_transactions` for running balance trail
- **Flight reference tables removed**: Cross-referenced via string codes (`iata_code`, `iso2_country_code`)
- Full auth stack, company hierarchy, bookings, KYC, inventory management

#### **tripalfa_ops** — Operations

- **rule_analysis**: Added with FK to `rules` (was missing in v1)
- **settlements**: Properly FK'd to `disputes`
- Notifications, documents, rules engine, webhook events, dead letter queue

#### **tripalfa_finance** — Finance

- **campaigns**: Merged `campaign` + `marketing_campaign` into single table with `type` column
- **discount_coupons**: Added `campaign_id` FK for full traceability
- **commission_settlements**: Properly FK'd to both `commission_rules` and `bookings`
- **supplier_sync_logs**: Explicit tracking for supplier data synchronization
- Full supplier management, invoicing, loyalty, pricing, contracts

---

## File Summary

| File                   | Lines | Purpose                                                 |
| ---------------------- | ----- | ------------------------------------------------------- |
| `tripalfa_local.sql`   | 342   | Static reference data with corrected hotel/detail split |
| `tripalfa_core.sql`    | 537   | Core auth, users, bookings, wallets, KYC, inventory     |
| `tripalfa_ops.sql`     | 327   | Notifications, documents, rules, disputes, settlements  |
| `tripalfa_finance.sql` | 513   | Suppliers, invoicing, loyalty, campaigns, commissions   |
| `tripalfa_all_ddl.sql` | 1,825 | Complete bundle with execution guide                    |

---

## Execution Instructions

### Prerequisites

- PostgreSQL 13+ with the following extensions available:
  - `uuid-ossp`
  - `pgcrypto`
  - `pg_trgm`
  - `postgis`
- Four separate databases created:
  ```sql
  CREATE DATABASE tripalfa_local;
  CREATE DATABASE tripalfa_core;
  CREATE DATABASE tripalfa_ops;
  CREATE DATABASE tripalfa_finance;
  ```
- Connection string with superuser or appropriate role privileges

### Step 1: Create Databases

```bash
psql -U postgres -c "CREATE DATABASE tripalfa_local;"
psql -U postgres -c "CREATE DATABASE tripalfa_core;"
psql -U postgres -c "CREATE DATABASE tripalfa_ops;"
psql -U postgres -c "CREATE DATABASE tripalfa_finance;"
```

### Step 2: Execute DDL in Order

**IMPORTANT**: Execute in this exact order. Each database depends on the previous:

```bash
# 1. Static reference data first (needed for foreign keys in other DBs)
psql -d tripalfa_local -f tripalfa_local.sql

# 2. Core application schema
psql -d tripalfa_core -f tripalfa_core.sql

# 3. Operations database
psql -d tripalfa_ops -f tripalfa_ops.sql

# 4. Finance database
psql -d tripalfa_finance -f tripalfa_finance.sql
```

Or use the combined bundle:

```bash
# Option: Use the complete bundle (includes all 4 with ordering instructions)
psql -U postgres -f tripalfa_all_ddl.sql
```

### Step 3: Verify Installation

```bash
# Check all databases exist
psql -U postgres -lqt | grep tripalfa

# Verify local schema structure
psql -d tripalfa_local -c "\dn+"
psql -d tripalfa_local -c "\dt hotel.*"

# Check hotel/hotel_details relationship
psql -d tripalfa_local -c "\d+ hotel.hotels"
psql -d tripalfa_local -c "\d+ hotel.hotel_details"
psql -d tripalfa_local -c "\d+ hotel.hotel_images"

# Verify wallet ledger structure
psql -d tripalfa_core -c "\d+ wallet_ledger"

# Check campaigns table type column
psql -d tripalfa_finance -c "\d campaigns"
```

---

## Cross-Database Reference Conventions

PostgreSQL does not enforce foreign keys across databases. Cross-DB references are validated at the service layer using these patterns:

### String-Based Cross-References

| Source                                     | Target                            | Join Key                           | Notes                     |
| ------------------------------------------ | --------------------------------- | ---------------------------------- | ------------------------- |
| `tripalfa_core.booking_segments`           | `tripalfa_local.flight.airports`  | `origin/destination → iata_code`   | Flight origin/destination |
| `tripalfa_core.booking_segments`           | `tripalfa_local.flight.airlines`  | `carrier_code → iata_code`         | Airline identifier        |
| `tripalfa_core.bookings`                   | `tripalfa_local.hotel.hotels`     | `supplier_booking_id → liteapi_id` | Hotel booking reference   |
| `tripalfa_core.users`                      | `tripalfa_local.shared.countries` | `iso2_country_code → iso2_code`    | User location             |
| `tripalfa_finance.supplier_hotel_mappings` | `tripalfa_local.hotel.hotels`     | `liteapi_hotel_id → liteapi_id`    | Supplier-hotel mapping    |

### UUID-Based Cross-References (Same-Database)

All foreign keys within a single database use explicit UUID-based relationships with `ON DELETE` cascade/restrict behavior.

### Application Layer Validation

Services must validate cross-DB references before use:

```typescript
// Example: Validate hotel exists before booking
const hotel = await db.local.hotel.hotels.findUnique({
  where: { liteapi_id: bookingData.supplier_booking_id },
});
if (!hotel) throw new Error('Hotel not found in tripalfa_local');
```

---

## Indexes for Performance

The DDL includes comprehensive indexes optimized for common queries:

### tripalfa_local Highlights

- **GiST spatial index**: `hotel.hotels (location)` for radius queries
- **GIN trigram index**: `hotel.hotels (name)` for fuzzy search
- **Partial index**: `hotel.hotels (is_detail_fetched=FALSE)` for sync job processing
- **Composite index**: `hotel.reviews (hotel_id, rating DESC)` for sorted listing

### tripalfa_core Highlights

- **Booking dashboard**: `(company_id, status, created_at DESC)`
- **Wallet ledger**: `(wallet_id, recorded_at DESC)`
- **KYC verification**: `(user_id, verified_at DESC)`

### tripalfa_finance Highlights

- **Aging invoices**: `(status, due_date)` WHERE status NOT IN ('paid','void')
- **Loyalty points**: `(user_id, occurred_at DESC)`
- **Supplier sync tracking**: `(supplier_id, synced_at DESC)`

---

## Schema Evolution

When making schema changes after initial build:

1. **Create a migration file** in `database/migrations/`:

   ```bash
   touch database/migrations/YYYY-MM-DD-description.sql
   ```

2. **Update Prisma schemas** in `database/prisma/`:
   - `schema.local.prisma`
   - `schema.core.prisma`
   - `schema.ops.prisma`
   - `schema.finance.prisma`

3. **Regenerate Prisma clients**:

   ```bash
   npm run db:generate
   ```

4. **Document cross-DB impacts** in migration file if changing reference patterns

---

## Service-Level Requirements

Each microservice should implement the following patterns:

### 1. Multi-Database Client Setup

```typescript
// services/booking-service/src/db/client.ts
import { PrismaClient as LocalClient } from '@tripalfa/shared-database/local';
import { PrismaClient as CoreClient } from '@tripalfa/shared-database/core';
import { PrismaClient as OpsClient } from '@tripalfa/shared-database/ops';
import { PrismaClient as FinanceClient } from '@tripalfa/shared-database/finance';

export const db = {
  local: new LocalClient(),
  core: new CoreClient(),
  ops: new OpsClient(),
  finance: new FinanceClient(),
};
```

### 2. Cross-Database Query Helpers

```typescript
async function getHotelWithDetails(liteapiId: string) {
  const hotel = await db.local.hotels.findUnique({
    where: { liteapi_id: liteapiId },
    include: { details: true, images: true },
  });

  if (!hotel) throw new NotFound('Hotel not found');

  return hotel;
}

async function getBookingWithHotel(bookingId: string) {
  const booking = await db.core.bookings.findUnique({ where: { id: bookingId } });
  if (!booking) throw new NotFound('Booking not found');

  // Cross-DB join
  const hotel = await db.local.hotels.findUnique({
    where: { liteapi_id: booking.supplier_booking_id },
  });

  return { booking, hotel };
}
```

### 3. Transaction Safety

```typescript
// For operations spanning local + core
async function createHotelBooking(data: BookingData) {
  // Start transaction on core
  return await db.core.$transaction(async tx => {
    // Create booking in core
    const booking = await tx.bookings.create({ data });

    // Verify hotel exists in local (read-only)
    const hotel = await db.local.hotels.findUnique({
      where: { liteapi_id: data.supplier_booking_id },
    });

    if (!hotel) throw new Error('Hotel sync incomplete');

    return booking;
  });
}
```

---

## Troubleshooting

### "Foreign key violation" across databases

**Cause**: Service tried to create a reference before target record exists  
**Fix**: Always verify the string key exists in the target database first

### "Extension not found" errors

**Cause**: Required PostgreSQL extensions not installed  
**Fix**: Install extensions as superuser:

```sql
CREATE EXTENSION IF NOT EXISTS uuid-ossp;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS postgis;
```

### "Column is_detail_fetched not found"

**Cause**: tripalfa_local not synced to v2.0  
**Fix**: Ensure you ran `tripalfa_local.sql` and it completed without errors

### Slow hotel search queries

**Cause**: Missing GIN trigram index on hotel names  
**Fix**: Verify index exists:

```sql
SELECT * FROM pg_indexes WHERE tablename = 'hotels' AND indexname LIKE '%trgm%';
```

If missing, recreate:

```bash
psql -d tripalfa_local -c "CREATE INDEX idx_hotels_name_trgm ON hotel.hotels USING GIN (name gin_trgm_ops);"
```

---

## Next Steps

1. **Backup existing databases** if migrating from v1:

   ```bash
   pg_dump tripalfa_local > backup_tripalfa_local_v1.sql
   pg_dump tripalfa_core > backup_tripalfa_core_v1.sql
   pg_dump tripalfa_ops > backup_tripalfa_ops_v1.sql
   pg_dump tripalfa_finance > backup_tripalfa_finance_v1.sql
   ```

2. **Migrate data** from v1 tables to v2 if preserving existing data (requires custom scripts)

3. **Update application code**:
   - Update all service-layer queries to adapt to new table locations
   - Remove references to vendor-prefixed tables (`liteapi_*`, `duffel_*`)
   - Implement cross-DB validation helpers

4. **Test integration** with booking engine and downstream services

5. **Update documentation** with new schema references

---

## Support

For issues or questions about the schema design, consult:

- **ERD Diagram**: `tripalfa_corrected_erd_v2.html`
- **API Design Notes**: Check `docs/ARCHITECTURE_QUICK_REFERENCE.md`
- **Service Examples**: See `services/booking-service` for canonical patterns
