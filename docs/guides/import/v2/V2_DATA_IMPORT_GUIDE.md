# Schema Mismatch: Data Import Guide for v2.0

## Problem

The existing import scripts in `/scripts/` reference **old v1 table names** that no longer exist in v2.0:

| v1 (Old)             | v2.0 (New)          | Status                 |
| -------------------- | ------------------- | ---------------------- |
| `duffel_airports`    | `flight.airports`   | ❌ Script incompatible |
| `liteapi_hotels`     | `hotel.hotels`      | ❌ Script incompatible |
| `liteapi_currencies` | `shared.currencies` | ❌ Script incompatible |
| `liteapi_countries`  | `shared.countries`  | ❌ Script incompatible |

---

## V2.0 Table Structure

### flight schema (Duffel/Flight Data)

```sql
flight.airports        -- IATA code, ICAO code, coordinates
flight.airlines        -- Airline codes and names
flight.aircraft        -- Aircraft types and models
flight.cities          -- City references
flight.loyalty_programmes
flight.places
```

**Key constraints:**

- `airports.iso2_country_code` → FK to `shared.countries(iso2_code)`
- `airports.iata_code` is UNIQUE

### hotel schema (LiteAPI/Hotel Data)

```sql
hotel.hotels           -- Main hotel records (liteapi_id is unique key)
hotel.hotel_details    -- Detailed hotel info (one-to-one with hotels)
hotel.hotel_images     -- Images per hotel
hotel.rooms            -- Room types per hotel
hotel.facilities       -- Facilities/amenities
hotel.chains           -- Hotel chains
hotel.cities           -- City references
hotel.policies         -- Cancellation/booking policies
```

**Key constraints:**

- `hotels.liteapi_id` is UNIQUE (preserve external ID mapping)
- `hotels.iso2_country_code` → FK to `shared.countries(iso2_code)`
- `is_detail_fetched` flag tracks if full details were synced

### shared schema (Reference Data)

```sql
shared.countries       -- Country codes (iso2_code is unique)
shared.currencies      -- Currency codes
shared.languages       -- Language codes
shared.exchange_rate_history
```

---

## Solutions

### ✅ **Option 1: Minimal Sample Data** (Recommended for testing)

Insert just enough reference data to test the system:

```bash
# Add a few sample airports
psql -d tripalfa_local << 'EOF'
INSERT INTO flight.airports (iata_code, icao_code, name, iso2_country_code, latitude, longitude)
VALUES
  ('JFK', 'KJFK', 'John F. Kennedy International Airport', 'US', 40.6413, -73.7781),
  ('LHR', 'EGLL', 'London Heathrow Airport', 'GB', 51.4700, -0.4543),
  ('CDG', 'LFPG', 'Paris Charles de Gaulle Airport', 'FR', 49.0097, 2.5479),
  ('AMS', 'EHAM', 'Amsterdam Airport Schiphol', 'NL', 52.3086, 4.7639),
  ('DUB', 'EIDW', 'Dublin Airport', 'IE', 53.4129, -6.2700)
ON CONFLICT (iata_code) DO NOTHING;

INSERT INTO hotel.hotels
  (liteapi_id, name, iso2_country_code, latitude, longitude, is_detail_fetched)
VALUES
  ('hotel_1', 'Sample Hotel New York', 'US', 40.7128, -74.0060, false),
  ('hotel_2', 'Sample Hotel London', 'GB', 51.5074, -0.1278, false),
  ('hotel_3', 'Sample Hotel Paris', 'FR', 48.8566, 2.3522, false)
ON CONFLICT (liteapi_id) DO NOTHING;
EOF
```

### ❌ **Option 2: Fix Existing Import Scripts**

The /scripts/ import files need to be updated. Find references like:

```typescript
// OLD (broken)
INSERT INTO duffel_airports VALUES...

// NEW (fixed)
INSERT INTO flight.airports VALUES...
INSERT INTO hotel.hotels VALUES...
```

**Files to update:**

- `import-duffel-airports-full.ts`
- `import-liteapi-hotels-complete.ts`
- And others containing hardcoded table names

### ✅ **Option 3: Create V2-Compatible Import Script**

I can create a new TypeScript import adapter that:

1. Fetches from Duffel/LiteAPI APIs
2. Maps to v2.0 column names
3. Inserts into correct v2.0 tables

---

## Recommended Path Forward

### **For Quick Testing (5 min)**

Use **Option 1** - insert sample data:

```bash
psql -d tripalfa_local << 'EOF'
-- Add 10-50 sample airports and hotels
-- System will be testable with seed data
EOF
```

### **For Full Data Import (30 min)**

1. **Setup API credentials:**

   ```bash
   # In .env, add:
   DUFFEL_API_KEY=your_key_here
   LITEAPI_KEY=your_key_here
   ```

2. **Use my new v2-compatible import** (Option 3 - I'll create this)

3. **Or manually fix existing scripts** (Option 2 - tedious but works)

---

## Current Status

| Component         | Status     | Data      |
| ----------------- | ---------- | --------- |
| API Gateway       | ✅ Running | Ready     |
| Booking Engine    | ✅ Running | Ready     |
| PostgreSQL (v2.0) | ✅ Ready   | 0 records |
| Databases         | ✅ Created | Empty     |

**System is fully operational - just needs data!**

---

## Next Steps

**What would you like to do?**

A) **Option 1 - Insert sample data quickly** (5 min)

```bash
psql -d tripalfa_local < sample-data.sql
```

B) **Option 3 - I'll create a v2-compatible import script** (15 min)

- Works with Duffel/LiteAPI APIs
- Auto-maps to v2.0 schema
- Handles all relationships correctly

C) **Option 2 - Fix existing scripts yourself**

- Find `duffel_airports` → replace with `flight.airports`
- Find `liteapi_hotels` → replace with `hotel.hotels`
- Update column mappings

**Recommendation: Go with Option B (I'll create the adapter)** - takes 15 min and gives you production-ready data import capability.

Choose what works for you!
