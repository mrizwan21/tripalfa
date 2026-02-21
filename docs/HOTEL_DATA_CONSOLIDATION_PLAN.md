# Hotel Data Consolidation Plan

## Executive Summary

Hotel data is currently scattered across multiple locations:
1. **CSV Files** in `mishor_static/` (Mishor supplier data)
2. **JSON Files** in root directory (Innstant data)
3. **Multiple Import Scripts** for LiteAPI, Innstant, Hotelbeds
4. **Database Tables** across `staticdatabase` and `neondb`

This document outlines the consolidation strategy into a unified PostgreSQL static database.

---

## Current Data Sources

### 1. Mishor Static CSV Files (`mishor_static/`)

| File | Records | Description |
|------|---------|-------------|
| `hotels.csv` | ~70,000+ | Master hotel data |
| `hotel_images.part*.csv` | ~500,000+ | Hotel images (24 parts) |
| `hotel_facilities.part*.csv` | ~300,000+ | Hotel facilities (8 parts) |
| `hotel_descriptions.csv` | ~50,000+ | Hotel descriptions |
| `hotel_destinations.csv` | ~5,000+ | Hotel destinations |
| `countries.csv` | ~250 | Country data |
| `destinations.csv` | ~10,000+ | Destination data |

### 2. JSON Static Files

| File | Description |
|------|-------------|
| `innstant-countries.json` | Innstant country mappings |
| `innstant-currencies.json` | Innstant currency mappings |
| `HOTEL_DEAL_TYPES_POSTMAN_COLLECTION.json` | Deal type definitions |

### 3. Supplier API Sources (via Import Scripts)

| Supplier | Scripts | Data Types |
|----------|---------|------------|
| **LiteAPI** | `import-liteapi-*.ts` | Hotels, chains, types, amenities, reviews |
| **Innstant** | `import-innstant-*.ts` | Hotels, destinations, static data |
| **Hotelbeds** | `test-hotelbeds-*.ts` | Hotels, rates |
| **Mishor** | `import-mishor-*.ts` | Images, descriptions, amenities |

---

## Current Database Tables

### Canonical Hotel Tables (in `staticdatabase`)

```sql
-- Core hotel identity
canonical_hotels           -- Unified hotel identity across suppliers
SupplierHotelMapping       -- Maps supplier hotels to canonical
HotelImage                 -- Hotel-level images
RoomImage                  -- Room-level images
HotelDescription           -- Multi-language descriptions
HotelContact               -- Contact information
HotelReview                -- Static review data

-- Hotel facilities
HotelAmenity               -- Canonical amenity definitions (pool, spa, gym)
HotelAmenityMapping        -- Hotel to amenity mapping
HotelAmenitySupplierMapping -- Supplier amenity code mapping
RoomAmenity                -- Room-level amenities (WiFi, AC, TV)
RoomAmenityMapping         -- Room to amenity mapping

-- Room types and board
HotelRoomType              -- Room type definitions
BoardType                  -- Meal plan definitions (RO, BB, HB, FB, AI)

-- Property classification
HotelType                  -- Property types (hotel, resort, apartment)
HotelChain                 -- Hotel chains (Marriott, Hilton, Accor)

-- Geographic data
Destination                -- Geographic hierarchy
DestinationSupplierMapping -- Supplier destination codes
```

### Translation/Scoring Tables (in `staticdatabase`)

```sql
-- Multi-language translation tables
RoomCategory               -- Room categories with translations
PolicyTerm                 -- Policy terms (positive, negative)
BoardTypeScore             -- Board/meal type scores
CancelPolicy               -- Cancellation policies
FloorType                  -- Floor/level types
BedroomType                -- Bedroom types
RatePlan                   -- Rate plans
PaxUsageRule               -- Guest/pax usage rules
RefundPolicy               -- Refund policies
SharedAmenity              -- Shared amenities
SmokingPolicy              -- Smoking policies
ParkingOption              -- Parking options
MembershipScore            -- Membership programs
InternetOption             -- Internet options
DepositOption              -- Deposit options
CookingOption              -- Cooking/kitchen options
MarketingTerm              -- Hotel names/brands/descriptors
```

### Flight Static Data Tables (in `staticdatabase`)

```sql
Airline                    -- Airlines with IATA codes
Aircraft                   -- Aircraft types
Airport                    -- Airports with IATA codes
City                       -- Cities with IATA codes
Place                      -- Duffel places
Language                   -- Language definitions
Nationality                -- Nationality definitions
Country                    -- Country definitions
Currency                   -- Currency with exchange rates
```

### Supplier Registry (in `staticdatabase`)

```sql
suppliers                  -- Supplier registry
SupplierCredential         -- Multiple API credentials per supplier
SupplierSyncLog            -- Sync tracking for incremental imports
```

---

## Consolidation Strategy

### Phase 1: Identify All Data Sources

```bash
# 1. CSV Files
ls -la mishor_static/

# 2. JSON Files
ls -la *.json

# 3. Import Scripts
ls -la scripts/import-*.ts
```

### Phase 2: Create Unified Schema

The Prisma schema already defines the canonical structure. Key tables:

1. **`canonical_hotels`** - Single source of truth for hotel identity
2. **`SupplierHotelMapping`** - Links supplier-specific IDs to canonical
3. **`HotelImage`** - All hotel images from all suppliers
4. **`HotelAmenityMapping`** - All hotel amenities from all suppliers

### Phase 3: Migration Strategy

#### Step 1: Mishor CSV → PostgreSQL

```sql
-- Create staging tables for CSV import
CREATE TABLE staging_mishor_hotels (
    hotel_id VARCHAR(255),
    name VARCHAR(500),
    address TEXT,
    city VARCHAR(255),
    country VARCHAR(255),
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),
    star_rating DECIMAL(2, 1),
    -- ... more columns
);

-- Import via COPY
COPY staging_mishor_hotels FROM '/path/to/hotels.csv' WITH CSV HEADER;
```

#### Step 2: Deduplicate & Merge

```sql
-- Merge into canonical_hotels
INSERT INTO canonical_hotels (name, address, city, country_code, latitude, longitude, star_rating)
SELECT DISTINCT ON (name, city, country)
    name, address, city, country_code, latitude, longitude, star_rating
FROM staging_mishor_hotels
ON CONFLICT DO NOTHING;

-- Create supplier mappings
INSERT INTO "SupplierHotelMapping" (canonical_hotel_id, supplier_id, supplier_hotel_id)
SELECT ch.id, 'mishor', smh.hotel_id
FROM staging_mishor_hotels smh
JOIN canonical_hotels ch ON ch.name = smh.name AND ch.city = smh.city;
```

#### Step 3: LiteAPI → PostgreSQL

```bash
# Run existing import scripts
npx tsx scripts/import-liteapi-static.ts --type=all
npx tsx scripts/import-liteapi-hotels-full.ts
npx tsx scripts/import-liteapi-amenities.ts --type=all
```

#### Step 4: Innstant → PostgreSQL

```bash
# Run existing import scripts
npx tsx scripts/import-innstant-static.ts
```

### Phase 4: Create Unified Access Layer

The `generate-static-data.ts` script already creates bundled TypeScript files.
Extend it to include all hotel-related static data.

---

## Recommended File Structure

```
staticdatabase (PostgreSQL - port 5433)
├── Canonical Tables
│   ├── canonical_hotels
│   ├── SupplierHotelMapping
│   ├── HotelImage
│   ├── HotelDescription
│   ├── HotelReview
│   └── ...
├── Reference Tables
│   ├── HotelAmenity
│   ├── RoomAmenity
│   ├── BoardType
│   ├── HotelType
│   ├── HotelChain
│   └── ...
├── Geographic Tables
│   ├── Destination
│   ├── Country
│   ├── City
│   └── ...
└── Flight Tables
    ├── Airline
    ├── Airport
    ├── Aircraft
    └── ...
```

---

## Import Script Inventory

### Active Scripts (Use These)

| Script | Purpose | Status |
|--------|---------|--------|
| `import-liteapi-static.ts` | LiteAPI hotels, chains, types | ✅ Active |
| `import-liteapi-hotels-full.ts` | Full hotel import with workers | ✅ Active |
| `import-liteapi-amenities.ts` | Amenity import & mapping | ✅ Active |
| `import-mishor-content.ts` | Mishor images, descriptions | ✅ Active |
| `import-innstant-static.ts` | Innstant static data | ✅ Active |

### Legacy/Debug Scripts

| Script | Purpose | Status |
|--------|---------|--------|
| `test-hotelbeds-api.ts` | Hotelbeds API testing | 🔧 Debug |
| `test-innstant-api.ts` | Innstant API testing | 🔧 Debug |
| `debug-enrichment.ts` | Debug hotel enrichment | 🔧 Debug |

---

## Next Steps

1. **Run all import scripts** to populate static database
2. **Create data quality report** to identify duplicates
3. **Implement deduplication** using hotel name + city matching
4. **Update frontend** to use bundled static data
5. **Remove API endpoints** for static data access

---

## Data Volume Estimates

| Data Type | Source | Estimated Records |
|-----------|--------|-------------------|
| Hotels | LiteAPI | ~100,000+ |
| Hotels | Mishor | ~70,000+ |
| Hotels | Innstant | ~50,000+ |
| Images | Mishor | ~500,000+ |
| Amenities | LiteAPI | ~80 |
| Destinations | Multiple | ~10,000+ |
| Reviews | LiteAPI | ~1,000,000+ |

**Total estimated unique hotels after deduplication: ~150,000-200,000**