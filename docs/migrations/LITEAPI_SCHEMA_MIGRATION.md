# LiteAPI Hotel Static Data Schema Migration

## Overview

This document describes the production-ready PostgreSQL schema for LiteAPI hotel static data endpoints, optimized for very low-latency reads. The schema supports:

- **PostGIS** for geographic queries (bounding box, radius search)
- **pg_trgm** for fast fuzzy name matching
- **pgvector** for semantic/visual similarity search (KNN)
- **JSONB** for flexible filtering
- **Materialized Views** for denormalized single-row API responses

## Architecture

### Dual-Database Strategy

The system uses two databases that work together:

```text
┌─────────────────────────────────────────────────────────────────────┐
│                     TRIPALFA DATABASE ARCHITECTURE                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────────────────┐    ┌─────────────────────────────┐ │
│  │   LOCAL POSTGRES (Static)   │    │     Neon (Operational)      │ │
│  │   Port: 5433 (external)     │    │     Cloud PostgreSQL        │ │
│  │   Container: 5432           │    │                            │ │
│  ├─────────────────────────────┤    ├─────────────────────────────┤ │
│  │ • Hotels (full data)        │    │ • Users                     │ │
│  │ • Places                    │    │ • Bookings                  │ │
│  │ • Airports                  │    │ • Transactions              │ │
│  │ • Airlines & Routes         │    │ • Wallet                    │ │
│  │ • Facilities                │    │ • Notifications             │ │
│  │ • Rooms & Amenities         │    │ • Pricing & Commissions     │ │
│  │ • Chains & Types            │    │ • Rules & Campaigns         │ │
│  │ • Reviews                   │    │ • SupplierHotelMapping      │ │
│  │ • Embeddings (vectors)      │    │ • Duffel integration        │ │
│  │ • GeoJSON boundaries        │    │ • Exchange rates            │ │
│  └──────────────┬──────────────┘    └──────────────┬──────────────┘ │
│                 │                                   │                │
│                 │  ┌─────────────────────────────┐  │                │
│                 └──┤    SYNC SERVICE (App Layer) ├──┘                │
│                    │  • Incremental sync         │                   │
│                    │  • Checkpoint tracking      │                   │
│                    │  • JSON export/import       │                   │
│                    └─────────────────────────────┘                   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Static Data Sync**: LiteAPI hotel + flight static data is fetched and stored in Local Postgres (Docker static DB)
2. **Reference Sync**: Minimal hotel/place data is synced to Neon for booking operations via `SupplierHotelMapping`
3. **Cross-DB Queries**: Application layer joins data from both databases when needed

## Schema Files

| File                                  | Purpose                                                         | Status             |
| ------------------------------------- | --------------------------------------------------------------- | ------------------ |
| `001_extensions.sql`                  | PostgreSQL extensions (uuid-ossp, pg_trgm, unaccent, btree_gin) | ✅ Exists          |
| `002_shared_reference.sql`            | Shared reference tables (countries, currencies, languages)      | ✅ Exists          |
| `003_liteapi_hotel_domain.sql`        | Core hotel tables (hotels, rooms, facilities, etc.)             | ✅ Exists          |
| `004_duffel_flight_domain.sql`        | Duffel flight data (airlines, airports, routes)                 | ✅ Exists          |
| `005_indexes.sql`                     | Standard B-tree and GIN indexes                                 | ✅ Exists          |
| `006_views.sql`                       | Denormalized views for common queries                           | ✅ Exists          |
| `007_postgis_pgvector.sql`            | PostGIS geo functions + pgvector semantic search                | ✅ Exists          |
| `008_liteapi_places_search.sql`       | Places table + embedding columns + search functions             | ✅ Exists          |
| `009_materialized_search_indexes.sql` | Vector indexes + materialized views                             | ✅ Exists          |
| `010_cross_database_sync.sql`         | Cross-database sync strategy                                    | ⚠️ Not implemented |
| `011_liteapi_fallback_cache.sql`      | Fallback cache for direct LiteAPI calls                         | ✅ Exists          |

> **Note**: Schema file `010_cross_database_sync.sql` is referenced in this document but does not yet exist in the codebase. The cross-database sync is currently handled at the application layer.

## LiteAPI Endpoints Supported

### 1. `/data/places` - Places List

**Primary Tables**: `hotel.places`

```sql
-- Query places directly
SELECT * FROM hotel.places
WHERE name ILIKE '%New York%'
  AND place_type = 'City'
  AND country_code = 'US'
LIMIT 20;
```

### 2. `/data/places/{placeId}` - Place Detail

**Primary Tables**: `hotel.places`

```sql
-- Get place by ID
SELECT * FROM hotel.places WHERE id = 'place:12345';

-- Get place hierarchy (manual query)
SELECT * FROM hotel.places
WHERE id IN (
  SELECT parent_id FROM hotel.places WHERE id = 'place:12345'
  UNION ALL SELECT 'place:12345'
);
```

### 3. `/data/hotels` - Hotels List

**Primary Tables**: `hotel.hotels`, `hotel.mv_hotel_search`

```sql
-- Fast search using materialized view
SELECT * FROM hotel.mv_hotel_search
WHERE country_code = 'US'
  AND stars >= 4
ORDER BY rating DESC
LIMIT 20;

-- Geo search (bounding box)
SELECT * FROM hotel.hotels_in_bbox(40.5, -74.5, 40.9, -73.7, 100);
```

### 4. `/data/hotel` - Hotel Detail

**Primary Tables**: `hotel.hotels`, `hotel.rooms`, `hotel.images`, `hotel.policies`

```sql
-- Full hotel detail with related data
SELECT h.*,
       (SELECT json_agg(r.*) FROM hotel.rooms r WHERE r.hotel_id = h.id) as rooms,
       (SELECT json_agg(img.*) FROM hotel.images img WHERE img.hotel_id = h.id) as images
FROM hotel.hotels h
WHERE h.id = 'lp1897';
```

### 5. `/data/hotels/semantic-search` - Semantic Search

**Primary Tables**: `hotel.hotels` (with `semantic_embedding`)

```sql
-- Semantic similarity search
SELECT * FROM hotel.semantic_search(
    '[0.1, 0.2, ...]'::vector(1536),  -- query embedding
    20,                                -- match count
    'US',                              -- country filter
    4.0,                               -- min stars
    7.0                                -- min rating
);
```

### 6. `/data/hotels/room-search` - Room Search

**Primary Tables**: `hotel.rooms`, `hotel.mv_room_search`

```sql
-- Search rooms by capacity
SELECT * FROM hotel.mv_room_search
WHERE max_occupancy >= 4
  AND max_adults >= 2
  AND max_children >= 2;
```

### 7. Hybrid Search

**Primary Tables**: `hotel.hotels` (with `semantic_embedding`)

```sql
-- Hybrid search combining semantic + text + geo
SELECT * FROM hotel.hybrid_search(
    '[0.1, 0.2, ...]'::vector(1536),  -- query embedding
    'boutique hotel',                  -- text search
    40.7128,                          -- center_lat
    -74.0060,                         -- center_lng
    5000,                             -- radius_meters
    'US',                             -- country_code
    4.0,                              -- min_stars
    7.0,                              -- min_rating
    20                                -- match_count
);
```

> **Note**: The `/data/hotel/ask` endpoint (RAG-style natural language) is not implemented as a stored function. Use the `hybrid_search` function with embeddings for semantic queries.

## Index Strategy

### Geographic Indexes

```sql
-- Bounding box queries
CREATE INDEX idx_hotels_geo_covering
ON hotel.hotels (latitude, longitude, id, name, stars, rating)
WHERE is_deleted = FALSE AND latitude IS NOT NULL;

-- PostGIS functions for radius search
SELECT * FROM hotel.hotels_within_radius(40.7128, -74.0060, 5000, 100);
```

### Text Search Indexes

```sql
-- Fuzzy name matching (pg_trgm)
CREATE INDEX idx_hotels_name_trgm
ON hotel.hotels USING GIN (name gin_trgm_ops)
WHERE is_deleted = FALSE;

-- Full-text search on places
CREATE INDEX idx_places_search
ON hotel.places USING GIN (search_vector);
```

### Vector Indexes (IVFFlat)

```sql
-- Semantic embedding KNN
CREATE INDEX idx_hotels_semantic_embedding
ON hotel.hotels
USING ivfflat (semantic_embedding vector_cosine_ops)
WITH (lists = 100)
WHERE semantic_embedding IS NOT NULL AND is_deleted = FALSE;
```

### JSONB Filter Indexes

```sql
-- Accessibility attributes
CREATE INDEX idx_hotels_accessibility
ON hotel.hotels USING GIN (accessibility_attributes)
WHERE accessibility_attributes IS NOT NULL;

-- Semantic tags
CREATE INDEX idx_hotels_semantic_tags
ON hotel.hotels USING GIN (semantic_tags)
WHERE semantic_tags IS NOT NULL;
```

## Materialized Views

### `hotel.mv_hotel_search`

Optimized for listing page queries. Refresh periodically:

```sql
-- Refresh concurrently (non-blocking)
SELECT hotel.refresh_hotel_search_view();

-- Or manually
REFRESH MATERIALIZED VIEW CONCURRENTLY hotel.mv_hotel_search;
```

### `hotel.mv_place_summary`

Aggregated hotel statistics per place.

### `hotel.mv_room_search`

Denormalized room data with amenities and bed types.

## Cross-Database Synchronization

### Current Implementation

The sync between static database (Local Postgres) and Neon is handled at the application layer using the `SupplierHotelMapping` model in Prisma.

### Sync Strategy

1. **Checkpoint-based incremental sync**
   - Track sync state in application code or a dedicated table
   - Query delta records where `updated_at > last_sync_at`

2. **Export Functions** (from static DB)

   ```sql
   -- Get hotels for sync
   SELECT id, name, country_code, city, latitude, longitude, stars, rating,
          currency_code, main_photo, is_deleted, updated_at
   FROM hotel.hotels
   WHERE updated_at > $1
   ORDER BY updated_at
   LIMIT 1000;
   ```

### Neon (Operational) Tables

| Table                  | Source          | Purpose                                        |
| ---------------------- | --------------- | ---------------------------------------------- |
| `SupplierHotelMapping` | Manual/External | Maps supplier hotel IDs to local hotel IDs     |
| `Supplier`             | Manual/External | Supplier configuration (LiteAPI, Duffel, etc.) |
| `SupplierSyncLog`      | Auto            | Tracks sync status per supplier                |

> **Note**: The document previously mentioned `hotel_references`, `place_references`, `booking_hotel_references`, and `sync_status` tables in Neon. These do NOT exist in the current Prisma schema. The sync is handled via `SupplierHotelMapping` and application-level tracking.

## Setup Instructions

### 1. Start Static Database

```bash
cd database/static-db

# Create .env file
cp .env.example .env
# Edit .env with your passwords

# Start PostgreSQL + pgAdmin
docker-compose up -d
```

### 2. Verify Extensions

```sql
-- Connect to the database
psql -h localhost -p 5433 -U staticdb_admin -d tripalfa_static

-- Check extensions
SELECT extname, extversion FROM pg_extension;
-- Should show: uuid-ossp, pg_trgm, unaccent, btree_gin, postgis, vector
```

### 3. Apply Prisma Migration (Neon)

```bash
# Generate Prisma client
npx prisma generate

# Push schema to Neon
npx prisma db push

# Or create migration
npx prisma migrate dev --name init_neon_schema
```

### 4. Configure Sync Service

```typescript
// Example sync service (updated to match actual schema)
import { Pool } from "pg";
import { PrismaClient } from "@prisma/client";

const staticDb = new Pool({
  host: "localhost",
  port: 5433,
  database: "tripalfa_static",
  user: "staticdb_admin",
  password: process.env.STATICDB_PASSWORD,
});

const prisma = new PrismaClient();

async function syncHotelsToNeon() {
  // Get last sync time from SupplierSyncLog
  const lastSync = await prisma.supplierSyncLog.findFirst({
    where: { supplierId: "liteapi", status: "completed" },
    orderBy: { completedAt: "desc" },
  });

  const lastSyncTime = lastSync?.completedAt || new Date(0);

  // Fetch delta from static DB
  const result = await staticDb.query(
    `
    SELECT id, name, country_code, city, latitude, longitude, stars, rating, 
           currency_code, main_photo, is_deleted, updated_at
    FROM hotel.hotels 
    WHERE updated_at > $1
    ORDER BY updated_at
    LIMIT 1000
  `,
    [lastSyncTime],
  );

  // Upsert to SupplierHotelMapping
  for (const row of result.rows) {
    await prisma.supplierHotelMapping.upsert({
      where: {
        id: `liteapi-${row.id}`,
      },
      update: {
        localHotelId: row.id,
        hotelName: row.name,
        matchScore: 1.0,
        status: "active",
      },
      create: {
        id: `liteapi-${row.id}`,
        supplierId: "liteapi",
        supplierHotelId: row.id,
        localHotelId: row.id,
        hotelName: row.name,
        matchScore: 1.0,
        status: "active",
      },
    });
  }

  // Log sync status
  await prisma.supplierSyncLog.create({
    data: {
      supplierId: "liteapi",
      syncType: "hotels",
      status: "completed",
      recordsProcessed: result.rows.length,
      completedAt: new Date(),
    },
  });
}
```

## Performance Recommendations

### 1. Vector Index Tuning

For different dataset sizes, adjust `lists` parameter:

| Hotels     | Lists Value |
| ---------- | ----------- |
| < 10K      | 10          |
| 10K - 100K | 100         |
| 100K - 1M  | 316         |
| > 1M       | 1000        |

### 2. Materialized View Refresh

- **Development**: Refresh on-demand
- **Production**: Refresh every 5-15 minutes via cron job or scheduled job

```sql
-- Call via external scheduler
SELECT hotel.refresh_hotel_search_view();
```

### 3. Connection Pooling

Use PgBouncer for production:

```ini
[databases]
tripalfa_static = host=staticdb port=5432 dbname=tripalfa_static

[pgbouncer]
pool_mode = transaction
max_client_conn = 500
default_pool_size = 25
```

### 4. Query Optimization

- Use `EXPLAIN ANALYZE` for slow queries
- Leverage covering indexes for common filters
- Use materialized views for read-heavy endpoints

## Troubleshooting

### Extension Not Found

```sql
-- If PostGIS fails to install, run:
CREATE EXTENSION IF NOT EXISTS postgis CASCADE;

-- If pgvector fails, ensure PostgreSQL version >= 13 (pgvector requires PG 12+)
SELECT version();
```

### Vector Index Build Slow

```sql
-- Build index concurrently (slower but non-blocking)
CREATE INDEX CONCURRENTLY idx_hotels_semantic_embedding
ON hotel.hotels
USING ivfflat (semantic_embedding vector_cosine_ops)
WITH (lists = 100)
WHERE semantic_embedding IS NOT NULL;
```

### Materialized View Refresh Blocked

```sql
-- Check for active queries blocking refresh
SELECT * FROM pg_stat_activity
WHERE query ILIKE '%hotel_search%';

-- Kill blocking queries if needed
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE query ILIKE '%hotel_search%' AND state = 'idle';
```

## Monitoring

### Key Metrics to Track

1. **Index Usage**

   ```sql
   SELECT schemaname, relname, indexrelname, idx_scan, idx_tup_read
   FROM pg_stat_user_indexes
   WHERE schemaname IN ('hotel', 'shared')
   ORDER BY idx_scan DESC;
   ```

1. **Cache Hit Ratio**

   ```sql
   SELECT relname,
          heap_blks_read, heap_blks_hit,
          round(heap_blks_hit::numeric / (heap_blks_hit + heap_blks_read), 4) as hit_ratio
   FROM pg_statio_user_tables
   WHERE schemaname = 'hotel'
   ORDER BY heap_blks_read DESC;
   ```

1. **Materialized View Freshness**

   ```sql
   SELECT
     schemaname, matviewname,
     last_refresh,
     now() - last_refresh as age
   FROM pg_matviews
   WHERE schemaname = 'hotel';
   ```

## Fallback Cache System

When hotel data is not available in the static database, the system falls back to calling the LiteAPI `/data/hotel` endpoint directly and caches the response.

### Data Resolution Flow

```text
┌─────────────────────────────────────────────────────────────────────┐
│                    HOTEL DATA RESOLUTION FLOW                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   Request for hotelId: "lp12345"                                    │
│              │                                                       │
│              ▼                                                       │
│   ┌─────────────────────────┐                                       │
│   │  Check Static DB        │                                       │
│   │  (hotel.hotels)         │                                       │
│   └───────────┬─────────────┘                                       │
│               │                                                      │
│       ┌───────┴───────┐                                              │
│       │ Found?        │                                              │
│       └───────┬───────┘                                              │
│          Yes  │   No                                                 │
│              ▼      ┌─────────────────────────┐                      │
│         ┌────────┐  │ Check Fallback Cache    │                      │
│         │ RETURN │  │ (hotel.api_cache)       │                      │
│         │ DATA   │  └───────────┬─────────────┘                      │
│         └────────┘              │                                    │
│                          ┌──────┴──────┐                             │
│                          │ Found?      │                             │
│                          └──────┴──────┘                             │
│                        Yes │    │ No                                 │
│                             ▼    ▼                                   │
│                        ┌──────┐ ┌─────────────────────────┐          │
│                        │RETURN│ │ Fetch from LiteAPI      │          │
│                        │CACHE │ │ /data/hotel endpoint    │          │
│                        └──────┘ └───────────┬─────────────┘          │
│                                             │                        │
│                                             ▼                        │
│                                   ┌─────────────────────┐            │
│                                   │ Cache Response      │            │
│                                   │ (hotel.api_cache)   │            │
│                                   └───────────┬─────────┘            │
│                                               │                      │
│                                               ▼                      │
│                                         ┌──────────┐                  │
│                                         │ RETURN   │                  │
│                                         │ DATA     │                  │
│                                         └──────────┘                  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Usage Examples

#### 1. Resolve Hotel Data (Auto-select source)

```sql
-- Try static DB, then cache, returns needs_fallback=true if API call needed
SELECT * FROM hotel.resolve_hotel_data('lp12345', 'en', 24);
```

Returns:

| source         | hotel_id | hotel_name | needs_fallback |
| -------------- | -------- | ---------- | -------------- |
| static_db      | lp12345  | Hotel ABC  | false          |
| fallback_cache | lp12345  | Hotel ABC  | false          |
| not_found      | lp12345  | NULL       | true           |

#### 2. Cache API Response

```typescript
// After fetching from LiteAPI, cache the response
const response = await fetchLiteAPIHotel("lp12345", "en");

await pool.query(
  `
  SELECT hotel.cache_hotel_response(
    $1, $2, $3, $4, $5
  )
`,
  [
    "lp12345", // hotel_id
    "en", // language
    JSON.stringify(response.data), // response_data
    response.durationMs, // fetch_duration_ms
    24, // ttl_hours
  ],
);
```

#### 3. Get Cached Data Directly

```sql
-- Get cached hotel if available
SELECT * FROM hotel.get_cached_hotel('lp12345', 'en');
```

#### 4. Log API Request for Monitoring

```sql
SELECT hotel.log_api_request(
  'lp12345',                          -- hotel_id
  'en',                               -- language
  '{"timeout": 6}'::jsonb,            -- request_params
  200,                                -- status_code
  450,                                -- response_time_ms
  'success',                          -- status
  NULL,                               -- error_message
  'hotel_not_found'                   -- source_trigger
);
```

### Cache Tables

| Table                   | Purpose                                    |
| ----------------------- | ------------------------------------------ |
| `hotel.api_cache`       | Stores raw API responses with TTL          |
| `hotel.api_request_log` | Audit log for monitoring and rate limiting |

### Cache Statistics

```sql
-- View cache statistics
SELECT * FROM hotel.v_cache_statistics;
```

| total_cached_hotels | fresh_entries | stale_entries | avg_fetch_time_ms |
| ------------------- | ------------- | ------------- | ----------------- |
| 1523                | 1489          | 34            | 325               |

### API Usage Monitoring

```sql
-- View daily API usage
SELECT * FROM hotel.v_api_usage_stats LIMIT 7;
```

### Cache Maintenance

```sql
-- Mark expired entries as stale
SELECT hotel.mark_stale_cache();

-- Clean up old entries (30 days retention)
SELECT hotel.cleanup_old_cache(30);
```

### Integration Example

```typescript
import { Pool } from "pg";

const staticDb = new Pool({
  host: "localhost",
  port: 5433,
  database: "tripalfa_static",
});

async function getHotelData(hotelId: string, language = "en") {
  // 1. Try to resolve from static DB or cache
  const result = await staticDb.query(
    `
    SELECT * FROM hotel.resolve_hotel_data($1, $2, 24)
  `,
    [hotelId, language],
  );

  const resolution = result.rows[0];

  // 2. If data found, return it
  if (!resolution.needs_fallback) {
    return {
      source: resolution.source,
      data: resolution.full_data,
    };
  }

  // 3. Fetch from LiteAPI
  const startTime = Date.now();
  try {
    const apiResponse = await fetch(`https://api.liteapi.travel/data/hotel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hotelId,
        language,
        timeout: 6,
        advancedAccessibilityOnly: false,
      }),
    });

    const durationMs = Date.now() - startTime;
    const data = await apiResponse.json();

    // 4. Cache the response
    await staticDb.query(
      `
      SELECT hotel.cache_hotel_response($1, $2, $3, $4, 24)
    `,
      [hotelId, language, JSON.stringify(data), durationMs],
    );

    // 5. Log the request
    await staticDb.query(
      `
      SELECT hotel.log_api_request($1, $2, $3, $4, $5, $6, $7, $8)
    `,
      [
        hotelId,
        language,
        JSON.stringify({ hotelId, language }),
        apiResponse.status,
        durationMs,
        "success",
        null,
        "hotel_not_found",
      ],
    );

    return {
      source: "liteapi_fallback",
      data,
    };
  } catch (error) {
    const durationMs = Date.now() - startTime;

    // Log the failure
    await staticDb.query(
      `
      SELECT hotel.log_api_request($1, $2, $3, $4, $5, $6, $7, $8)
    `,
      [
        hotelId,
        language,
        JSON.stringify({ hotelId, language }),
        null,
        durationMs,
        "failed",
        error.message,
        "hotel_not_found",
      ],
    );

    throw error;
  }
}
```

## Changelog

| Date       | Version | Changes                                                                                                                                    |
| ---------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| 2026-02-23 | 1.0.0   | Initial schema with PostGIS, pgvector, materialized views                                                                                  |
| 2026-02-24 | 1.1.0   | Added fallback cache system for LiteAPI direct calls                                                                                       |
| 2026-02-25 | 1.2.0   | Fixed documentation: port numbers, missing schema files, non-existent functions, PostgreSQL version requirements, Prisma schema mismatches |
