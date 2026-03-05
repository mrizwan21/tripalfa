# Static Databases: Languages & Facilities

This document describes the standalone static database sync scripts for LiteAPI reference data: **Languages** and **Facilities**.

## Overview

Static databases provide reference data that changes infrequently but needs to be synchronized with LiteAPI. These standalone scripts allow independent syncing of:

- **Languages** (`/data/languages`) - ISO 639-1 language codes for UI localization
- **Facilities** (`/data/facilities`) - Hotel amenities and facility references

## Table of Contents

- [Architecture](#architecture)
- [Languages Database](#languages-database)
- [Facilities Database](#facilities-database)
- [Running the Sync Scripts](#running-the-sync-scripts)
- [Monitoring & Verification](#monitoring--verification)
- [Troubleshooting](#troubleshooting)

---

## Architecture

### Data Flow

```
LiteAPI Endpoint
    ↓
HTTP Client (with retry/caching)
    ↓
Validation & Sanitization
    ↓
Database Upsert
    ↓
Audit Trail & Sync Metadata
```

### Key Features

- **Idempotent Operations**: Uses `INSERT ... ON CONFLICT ... DO UPDATE`
- **Data Validation**: Validates required fields before insertion
- **UTF-8 Sanitization**: Removes invalid characters for PostgreSQL compatibility
- **Caching**: 24-hour TTL for API responses to reduce network calls
- **Audit Logging**: Tracks all changes via triggers and audit tables
- **Retry Mechanism**: Automatic retry with exponential backoff
- **Comprehensive Reporting**: Validates and reports sync statistics

### Database Schema Pattern

Each static database follows this pattern:

```
Main Table
  ├── Primary Key (id or code)
  ├── Core Data (name, translations, etc.)
  ├── Metadata (created_at, updated_at, is_enabled)
  └── Indexes (name, enabled status, search)

Audit Table
  ├── Tracks all INSERT/UPDATE/DELETE operations
  ├── Stores old and new values
  └── Created automatically via triggers

Sync Metadata Table
  ├── Records sync operation statistics
  ├── Tracks inserted/updated/deleted counts
  └── Stores error messages and timestamps

Views
  ├── Enabled records view
  ├── Full-text search materialized view
  └── Audit trail with metadata view
```

---

## Languages Database

### Schema

**Table**: `shared.languages`

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| `code` | VARCHAR(10) | ✓ | ISO 639-1 language code (e.g., `en`, `fr`, `zh-TW`) |
| `name` | VARCHAR(100) | ✓ | Display name (e.g., `English`, `French`) |
| `is_enabled` | BOOLEAN | ✓ | Flag for UI localization (default: TRUE) |
| `created_at` | TIMESTAMPTZ | ✓ | Auto-set creation timestamp |
| `updated_at` | TIMESTAMPTZ | ✓ | Auto-updated modification timestamp |

### Data Source

- **API Endpoint**: `GET /data/languages`
- **Response Format**: Array of language objects
- **Example Response**:
  ```json
  {
    "data": [
      { "code": "en", "name": "English" },
      { "code": "fr", "name": "French" },
      { "code": "es", "name": "Spanish" },
      { "code": "de", "name": "German" }
    ]
  }
  ```

### Sync Script

**File**: `database/static-db/scripts/sync-languages.ts`

#### Usage

```bash
# Run the languages sync
npx ts-node database/static-db/scripts/sync-languages.ts

# With environment override
LITEAPI_KEY=your_api_key npx ts-node database/static-db/scripts/sync-languages.ts
```

#### Features

- Fetches all languages from LiteAPI
- Validates code and name fields
- Sanitizes UTF-8 data
- Upserts to `shared.languages` table
- Reports statistics and sample data
- Generates comprehensive validation report

#### Sample Output

```
[Languages] Starting languages static database sync...

[Languages] Fetching languages from LiteAPI /data/languages...
[Languages] ✓ Fetched 150 languages from API
[Languages] Upserting 150 languages into shared.languages...
[Languages] ✓ Successfully upserted 150 languages

──────────────────────────────────────────────────
LANGUAGES DATABASE VALIDATION & REPORT
──────────────────────────────────────────────────
  Total languages in database: 150
  Enabled languages: 150

Sample languages:
  ✓ af     → Afrikaans
  ✓ ar     → Arabic
  ✓ en     → English
  ✓ es     → Spanish
  ✓ fr     → French
  ✓ de     → German
  ✓ zh-CN  → Chinese (Simplified)
  ✓ zh-TW  → Chinese (Traditional)
  ✓ ja     → Japanese
  ✓ ko     → Korean

Database schema columns:
  • code
  • name
  • is_enabled
  • created_at
  • updated_at
──────────────────────────────────────────────────

[Languages] ✓ Languages database sync completed successfully!
```

### Queries

#### Get all enabled languages
```sql
SELECT * FROM shared.v_languages_enabled
ORDER BY code ASC;
```

#### Get languages with sync history
```sql
SELECT * FROM shared.v_languages_with_audit
WHERE total_changes > 0
ORDER BY last_synced_at DESC;
```

#### Search for a language
```sql
SELECT * FROM shared.mv_languages_search
WHERE search_vector @@ plainto_tsquery('english', 'english')
LIMIT 10;
```

---

## Facilities Database

### Schema

**Table**: `hotel.facilities`

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| `id` | INTEGER | ✓ | LiteAPI facility ID |
| `name` | VARCHAR(255) | ✓ | Facility name (e.g., `WiFi`, `Swimming Pool`) |
| `translations` | JSONB | ○ | Multi-language translations (`{en: "...", fr: "..."}`) |
| `description` | TEXT | ○ | Facility description |
| `category` | VARCHAR(50) | ○ | Category (amenity, service, accessibility, etc.) |
| `is_active` | BOOLEAN | ✓ | Active flag (default: TRUE) |
| `created_at` | TIMESTAMPTZ | ✓ | Auto-set creation timestamp |
| `updated_at` | TIMESTAMPTZ | ✓ | Auto-updated modification timestamp |

### Data Source

- **API Endpoint**: `GET /data/facilities`
- **Response Format**: Array of facility objects with language translations
- **Example Response**:
  ```json
  {
    "data": [
      {
        "id": 1,
        "name": "WiFi",
        "en": "WiFi",
        "fr": "WiFi",
        "es": "WiFi"
      },
      {
        "id": 2,
        "name": "Swimming Pool",
        "en": "Swimming Pool",
        "fr": "Piscine",
        "es": "Piscina"
      }
    ]
  }
  ```

### Sync Script

**File**: `database/static-db/scripts/sync-facilities.ts`

#### Usage

```bash
# Run the facilities sync
npx ts-node database/static-db/scripts/sync-facilities.ts

# With environment override
LITEAPI_KEY=your_api_key npx ts-node database/static-db/scripts/sync-facilities.ts
```

#### Features

- Fetches all facilities from LiteAPI
- Validates ID and name fields
- Extracts translations from response
- Sanitizes UTF-8 data
- Upserts to `hotel.facilities` table with translations
- Reports statistics with translation metadata
- Generates comprehensive validation report

#### Sample Output

```
[Facilities] Starting facilities static database sync...

[Facilities] Fetching facilities from LiteAPI /data/facilities...
[Facilities] ✓ Fetched 256 facilities from API
[Facilities] Upserting 256 facilities into hotel.facilities...
[Facilities] ✓ Successfully upserted 256 facilities

──────────────────────────────────────────────────
FACILITIES DATABASE VALIDATION & REPORT
──────────────────────────────────────────────────
  Total facilities in database: 256
  Facilities with translations: 248

Sample facilities:
  • [  1] WiFi (+5 translations)
  • [  2] Swimming Pool (+5 translations)
  • [  3] Gym (+5 translations)
  • [  4] Business Center (+5 translations)
  • [  5] Parking (+5 translations)
  • [  6] Restaurant (+5 translations)
  • [  7] Bar (+5 translations)
  • [  8] Spa (+5 translations)
  • [  9] Conference Room (+5 translations)
  • [ 10] Room Service (+5 translations)

Database schema columns:
  • id
  • name
  • translations
  • description
  • category
  • is_active
  • created_at
  • updated_at

Database indexes:
  • idx_facilities_active
  • idx_facilities_category
  • idx_facilities_name
  • idx_facilities_search
  • idx_facilities_translations
  • idx_facilities_updated_at
  • idx_mv_facilities_search_vector
  • pk_facilities
──────────────────────────────────────────────────

[Facilities] ✓ Facilities database sync completed successfully!
```

### Queries

#### Get all active facilities
```sql
SELECT * FROM hotel.v_facilities_active
ORDER BY name ASC;
```

#### Get facilities with translations
```sql
SELECT id, name, translation_count, available_languages
FROM hotel.v_facilities_with_translations
ORDER BY translation_count DESC;
```

#### Search for a facility
```sql
SELECT * FROM hotel.mv_facilities_search
WHERE search_vector @@ plainto_tsquery('english', 'pool')
LIMIT 10;
```

#### Get facility translation in specific language
```sql
SELECT id, name, translations->>'en' as english_name
FROM hotel.facilities
WHERE translations->>'en' IS NOT NULL
LIMIT 10;
```

---

## Running the Sync Scripts

### Prerequisites

1. **Environment Variables**
   ```bash
   LITEAPI_KEY=your_api_key_here
   ```

2. **Database Connection**
   - Ensure PostgreSQL is running and accessible
   - Database credentials configured in `.env` or environment

3. **Node.js & Dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

### Single Script Execution

```bash
# Languages sync
npm run sync:languages
# or
npx ts-node database/static-db/scripts/sync-languages.ts

# Facilities sync
npm run sync:facilities
# or
npx ts-node database/static-db/scripts/sync-facilities.ts
```

### Combined Execution

```bash
# Run both in sequence
npm run sync:languages && npm run sync:facilities

# Run both in parallel (using xargs)
echo "languages\nfacilities" | xargs -I {} -P 2 \
  npx ts-node database/static-db/scripts/sync-{}.ts
```

### Scheduled Sync (Cron)

```bash
# Add to crontab for daily 2 AM sync
0 2 * * * cd /path/to/project && npm run sync:languages && npm run sync:facilities

# Or use a dedicated sync runner script
./database/static-db/run-static-db-sync.sh
```

---

## Monitoring & Verification

### Check Sync Status

#### Languages
```sql
SELECT 
  sync_id,
  total_records,
  inserted_count + updated_count as modified_count,
  status,
  sync_completed_at,
  EXTRACT(EPOCH FROM (sync_completed_at - sync_started_at))::int as duration_seconds
FROM shared.languages_sync_metadata
ORDER BY sync_completed_at DESC
LIMIT 10;
```

#### Facilities
```sql
SELECT 
  sync_id,
  total_records,
  inserted_count + updated_count as modified_count,
  status,
  sync_completed_at,
  EXTRACT(EPOCH FROM (sync_completed_at - sync_started_at))::int as duration_seconds
FROM hotel.facilities_sync_metadata
ORDER BY sync_completed_at DESC
LIMIT 10;
```

### Audit Trail

#### Recent language changes
```sql
SELECT * FROM shared.languages_audit
WHERE changed_at > NOW() - INTERVAL '7 days'
ORDER BY changed_at DESC;
```

#### Recent facility changes
```sql
SELECT * FROM hotel.facilities_audit
WHERE changed_at > NOW() - INTERVAL '7 days'
ORDER BY changed_at DESC;
```

### Data Completeness

#### Languages coverage
```sql
SELECT 
  COUNT(*) as total,
  COUNT(CASE WHEN is_enabled THEN 1 END) as enabled,
  COUNT(CASE WHEN updated_at > NOW() - INTERVAL '30 days' THEN 1 END) as recently_synced
FROM shared.languages;
```

#### Facilities coverage
```sql
SELECT 
  COUNT(*) as total,
  COUNT(CASE WHEN is_active THEN 1 END) as active,
  COUNT(CASE WHEN translations IS NOT NULL THEN 1 END) as with_translations,
  COUNT(CASE WHEN updated_at > NOW() - INTERVAL '30 days' THEN 1 END) as recently_synced
FROM hotel.facilities;
```

---

## Troubleshooting

### Common Issues

#### 1. Connection Error
```
Error: LITEAPI_KEY environment variable is not set
```

**Solution**: Set the environment variable
```bash
export LITEAPI_KEY=your_api_key_here
```

#### 2. Database Connection Timeout
```
Error: timeout acquiring a connection from the pool
```

**Solution**: Check database connectivity
```bash
psql -h localhost -U postgres -d tripalfa -c "SELECT 1"
```

#### 3. Invalid UTF-8 Characters
```
Error: invalid byte sequence for encoding "UTF8"
```

**Solution**: The scripts automatically sanitize UTF-8. Check for null bytes in API response.

#### 4. Duplicate Key Violation
```
Error: duplicate key value violates unique constraint
```

**Solution**: Data is already inserted. This shouldn't happen with upsert logic. Check for corruption:
```sql
-- Languages
DELETE FROM shared.languages WHERE code NOT LIKE 'A-Za-z%';

-- Facilities
DELETE FROM hotel.facilities WHERE id IS NULL OR name = '';
```

### Verification Commands

```bash
# Check languages count
psql -c "SELECT COUNT(*) FROM shared.languages;"

# Check facilities count  
psql -c "SELECT COUNT(*) FROM hotel.facilities;"

# Check recent sync metadata
psql -c "SELECT * FROM shared.languages_sync_metadata ORDER BY sync_completed_at DESC LIMIT 1;"
psql -c "SELECT * FROM hotel.facilities_sync_metadata ORDER BY sync_completed_at DESC LIMIT 1;"

# Check audit trail
psql -c "SELECT COUNT(*) FROM shared.languages_audit WHERE changed_at > NOW() - INTERVAL '1 hour';"
psql -c "SELECT COUNT(*) FROM hotel.facilities_audit WHERE changed_at > NOW() - INTERVAL '1 hour';"
```

---

## Performance Considerations

### Indexing Strategy

- **Code/ID lookups**: Primary key indexes (automatic)
- **Name searches**: B-tree indexes on name columns
- **Full-text search**: GIN indexes on tsvector columns
- **Status filters**: Partial indexes on enabled/active flags
- **Audit queries**: Compound indexes on (ID, timestamp)

### Optimization Tips

1. **Batch Inserts**: The sync scripts insert individually. For large datasets, consider batch upserts.

2. **Materialized Views**: Refresh periodically
   ```sql
   REFRESH MATERIALIZED VIEW CONCURRENTLY shared.mv_languages_search;
   REFRESH MATERIALIZED VIEW CONCURRENTLY hotel.mv_facilities_search;
   ```

3. **Vacuum & Analyze**: After large syncs
   ```sql
   VACUUM ANALYZE shared.languages;
   VACUUM ANALYZE hotel.facilities;
   ```

4. **Connection Pooling**: Use PgBouncer for production

### Storage

- **Languages**: ~10 KB (150 languages × 65 bytes average)
- **Facilities**: ~800 KB (256 facilities × 3 KB with translations)
- **Audit Tables**: Grows with each sync (~5-10 KB per sync)
- **Total Overhead**: < 2 MB

---

## Security

### Best Practices

1. **API Key Management**
   - Store `LITEAPI_KEY` in `.env.local` (never commit)
   - Rotate keys regularly
   - Use separate keys for dev/prod

2. **Database Access**
   - Use read-only roles for reporting
   - Restrict audit table access to admins
   - Enable connection SSL/TLS

3. **Data Validation**
   - Scripts validate all input
   - Sanitization removes dangerous characters
   - Null checks prevent injection

---

## Related Documentation

- [LiteAPI Integration Guide](../LITEAPI_INTEGRATION.md)
- [Main Sync Script](./sync-liteapi.ts)
- [Database Schema](./schema/)
- [Migration Guide](./migrations/)