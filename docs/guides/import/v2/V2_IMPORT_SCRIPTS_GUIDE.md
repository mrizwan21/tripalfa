# TripAlfa v2.0 Data Import Guide

## Overview

All data import scripts have been rewritten for the v2.0 schema. They correctly reference the new table structures with proper schemas (flight._, hotel._, shared.\*).

---

## Available Import Scripts

### 1️⃣ **Sample Test Data** (Recommended for Quick Start)

```bash
tsx scripts/load-sample-v2.ts
```

**What it does:**

- Loads 10 countries, 10 currencies, 10 languages
- Adds 14 sample airports (JFK, LHR, CDG, etc.)
- Creates 60 sample hotels across 10 cities
- Takes ~5-10 seconds
- **No API credentials required**

### 2️⃣ **Individual Import Scripts**

#### Reference Data (Countries, Currencies, Languages)

```bash
tsx scripts/import-reference-v2.ts
```

**Requires:** `LITEAPI_KEY` in .env
**Updates:** `shared.countries`, `shared.currencies`, `shared.languages`

#### Cities

```bash
tsx scripts/import-cities-v2.ts
```

**Requires:** `LITEAPI_KEY` in .env
**Updates:** `flight.cities`, `hotel.cities`

#### Airports

```bash
tsx scripts/import-airports-v2.ts
```

**Requires:** `DUFFEL_API_KEY` in .env
**Updates:** `flight.airports`
**Note:** Can import 10,000+ airports

#### Airlines & Aircraft

```bash
tsx scripts/import-duffel-v2.ts
```

**Requires:** `DUFFEL_API_KEY` in .env
**Updates:** `flight.airlines`, `flight.aircraft`

#### Hotels

```bash
tsx scripts/import-hotels-v2.ts
```

**Requires:** `LITEAPI_KEY` in .env
**Updates:** `hotel.hotels`, `hotel.hotel_details`
**Note:** Limits to top 10 countries to avoid rate limits

#### Facilities & Amenities

```bash
tsx scripts/import-facilities-v2.ts
```

**Requires:** `LITEAPI_KEY` in .env
**Updates:** `hotel.facilities`

---

## 3️⃣ **Master Import Script** (Production)

Import everything in the correct order with dependency management:

```bash
tsx scripts/import-all-v2.ts
```

**Execution Order:**

1. Reference data ✓ (required)
2. Cities ✓ (depends on reference)
3. Duffel (airlines/aircraft) ✓ (depends on reference)
4. Airports ✓ (depends on reference & cities)
5. Hotels ✓ (depends on reference & cities)
6. Facilities ✓ (depends on reference)

**Features:**

- Checks dependencies automatically
- Skips failed optional scripts
- Stops on required script failure
- Shows detailed progress

---

## Quick Start Guide

### Step 1: Verify Environment

```bash
# Check required variables
echo "DUFFEL_API_KEY=$DUFFEL_API_KEY"
echo "LITEAPI_KEY=$LITEAPI_KEY"
echo "LOCAL_DATABASE_URL=$LOCAL_DATABASE_URL"
```

### Step 2: Choose Your Path

#### **Option A: Fast Testing (5 min)** ⭐ Recommended

```bash
# Load minimal test data (no API keys needed)
tsx scripts/load-sample-v2.ts

# Verify
psql -d tripalfa_local -c "SELECT COUNT(*) FROM hotel.hotels;"
# Output: 60 sample hotels
```

#### **Option B: Full Production Data (20-30 min)**

```bash
# Import from Duffel/LiteAPI APIs
tsx scripts/import-all-v2.ts

# Verify
psql -d tripalfa_local << EOF
SELECT 'Airports' as entity, COUNT(*) as count FROM flight.airports
UNION ALL SELECT 'Airlines', COUNT(*) FROM flight.airlines
UNION ALL SELECT 'Hotels', COUNT(*) FROM hotel.hotels
UNION ALL SELECT 'Facilities', COUNT(*) FROM hotel.facilities;
EOF
```

#### **Option C: Selective Import (10-15 min)**

```bash
# Just airports and airlines
tsx scripts/import-reference-v2.ts
tsx scripts/import-airports-v2.ts
tsx scripts/import-duffel-v2.ts

# Then verify
psql -d tripalfa_local -c "SELECT COUNT(*) FROM flight.airports;"
```

---

## API Setup (If Using Full Data)

### Get Duffel API Key

1. Visit https://duffel.com/developers
2. Sign up for developer account
3. Create API key
4. Add to `.env`:
   ```
   DUFFEL_API_KEY=your_key_here
   ```

### Get LiteAPI Key

1. Visit https://liteapi.travel
2. Sign up
3. Get API key from dashboard
4. Add to `.env`:
   ```
   LITEAPI_KEY=your_key_here
   ```

---

## v2.0 Schema Reference

### flight schema

```sql
flight.airports        -- IATA/ICAO codes, coordinates
flight.airlines        -- Airline codes
flight.aircraft        -- Aircraft types
flight.cities          -- City references
flight.loyalty_programmes
flight.places
```

### hotel schema

```sql
hotel.hotels           -- Main hotel records (liteapi_id unique)
hotel.hotel_details    -- Details (one-to-one FK)
hotel.hotel_images     -- Images per hotel
hotel.rooms            -- Room types
hotel.facilities       -- Amenities/facilities
hotel.chains           -- Hotel chains
hotel.cities           -- City references
hotel.policies         -- Cancellation policies
```

### shared schema

```sql
shared.countries       -- iso2_code primary
shared.currencies      -- Currency codes
shared.languages       -- Language codes
shared.exchange_rate_history
```

---

## Key Changes from v1

| v1                  | v2.0               | Notes                                 |
| ------------------- | ------------------ | ------------------------------------- |
| `duffel_airports`   | `flight.airports`  | Now in flight schema                  |
| `liteapi_hotels`    | `hotel.hotels`     | Now in hotel schema                   |
| `liteapi_countries` | `shared.countries` | Now in shared schema                  |
| `company` table     | `companies`        | Plural naming                         |
| PK: `id`            | PK: `id` (uuid)    | Auto-generated                        |
| Direct table names  | Schema-qualified   | Use `flight.airports`, not `airports` |

---

## Troubleshooting

### "Cannot find module axios"

```bash
npm install axios
```

### "DUFFEL_API_KEY not set"

Add to .env and retry:

```bash
DUFFEL_API_KEY=your_actual_key
```

### "relation 'duffel_airports' does not exist"

You're using old scripts! Use the new v2.0 scripts:

```bash
tsx scripts/import-airports-v2.ts  # ✓ Correct
# NOT: import-duffel-airports-full.ts  ❌ Old
```

### "Foreign key violation"

Dependencies missing. Run in correct order:

```bash
# ✓ Correct order:
tsx scripts/import-reference-v2.ts
tsx scripts/import-airports-v2.ts

# ❌ Wrong order (fails):
tsx scripts/import-airports-v2.ts  # References don't exist yet!
```

---

## Performance Tips

### For Large Imports

```bash
# Disable indexes temporarily
psql -d tripalfa_local << EOF
ALTER TABLE hotel.hotels DISABLE TRIGGER ALL;
EOF

# Run import
tsx scripts/import-hotels-v2.ts

# Re-enable
psql -d tripalfa_local << EOF
ALTER TABLE hotel.hotels ENABLE TRIGGER ALL;
REINDEX TABLE hotel.hotels;
EOF
```

### For Partial Updates

Each script uses `ON CONFLICT ... DO NOTHING`, so you can:

- Run the same script multiple times safely
- Transfer without losing existing data
- Resume interrupted imports

---

## Verification Commands

```bash
# Count by table
psql -d tripalfa_local << EOF
SELECT
  'Airports'::text as table_name, COUNT(*) as count FROM flight.airports
UNION ALL SELECT 'Airlines', COUNT(*) FROM flight.airlines
UNION ALL SELECT 'Hotels', COUNT(*) FROM hotel.hotels
UNION ALL SELECT 'Facilities', COUNT(*) FROM hotel.facilities
UNION ALL SELECT 'Countries', COUNT(*) FROM shared.countries
ORDER BY table_name;
EOF

# Check for duplicates
psql -d tripalfa_local -c "SELECT COUNT(*), COUNT(DISTINCT iata_code) FROM flight.airports;"

# Verify FKs work
psql -d tripalfa_local -c "SELECT * FROM flight.airports LIMIT 1;"
```

---

## Next Steps

After data import:

1. **Test the API**

   ```bash
   curl http://localhost:3030/health | jq .
   ```

2. **Access frontends**
   - Booking Engine: http://localhost:5174
   - B2B Admin: http://localhost:5173

3. **Run integration tests**

   ```bash
   npm run test
   ```

4. **Monitor import logs**
   ```bash
   psql -d tripalfa_local -c "SELECT table_name, COUNT(*) FROM information_schema.tables WHERE table_schema IN ('flight', 'hotel', 'shared') GROUP BY table_schema, table_name;"
   ```

---

## Summary

| Task           | Command                              | Time   | Credentials |
| -------------- | ------------------------------------ | ------ | ----------- |
| Quick test     | `tsx scripts/load-sample-v2.ts`      | 5 min  | None        |
| Full data      | `tsx scripts/import-all-v2.ts`       | 30 min | Both APIs   |
| Reference only | `tsx scripts/import-reference-v2.ts` | 2 min  | LiteAPI     |
| Airports only  | `tsx scripts/import-airports-v2.ts`  | 10 min | Duffel      |
| Hotels only    | `tsx scripts/import-hotels-v2.ts`    | 15 min | LiteAPI     |

**Recommended for development:** Load sample data (Option A)
**Recommended for staging:** Full import with APIs (Option B)
**Recommended for testing:** Selective import (Option C)
