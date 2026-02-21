#!/bin/bash
# =============================================================================
# Import Mishor/Innstant Static Hotel Data
# =============================================================================
# Imports ~30M rows from CSV files into the staticdatabase PostgreSQL instance
# running in Docker on port 5433.
#
# CSV Files (from /Users/mohamedrizwan/Downloads/mishor_static/):
#   countries.csv         - 244 rows
#   destinations.csv      - 42K rows
#   hotels.csv            - 655K rows
#   hotel_descriptions.csv- 787K rows
#   hotel_destinations.csv- 964K rows
#   hotel_facilities.csv  - 7.5M rows (split across 9 parts)
#   hotel_images.part*.csv- 22M rows  (split across 23 parts)
#
# Usage:
#   chmod +x scripts/import-mishor-static.sh
#   ./scripts/import-mishor-static.sh
#
# Options:
#   --skip-images       Skip image import (saves ~1-2 hours)
#   --skip-facilities   Skip facilities import
#   --dry-run           Only create staging tables, don't insert into final tables
# =============================================================================

set -e

DB_URL="postgresql://postgres:postgres@localhost:5433/staticdatabase"
DATA_DIR="/Users/mohamedrizwan/Documents/TripAlfa - Node/mishor_static"

SKIP_IMAGES=false
SKIP_FACILITIES=false
DRY_RUN=false

# Parse args
for arg in "$@"; do
  case $arg in
    --skip-images)     SKIP_IMAGES=true ;;
    --skip-facilities) SKIP_FACILITIES=true ;;
    --dry-run)         DRY_RUN=true ;;
  esac
done

log()     { echo "[$(date '+%H:%M:%S')] $1"; }
success() { echo "[$(date '+%H:%M:%S')] ✅ $1"; }
warn()    { echo "[$(date '+%H:%M:%S')] ⚠️  $1"; }
fail()    { echo "[$(date '+%H:%M:%S')] ❌ $1"; exit 1; }

# Verify prerequisites
[ -d "$DATA_DIR" ] || fail "Data directory not found: $DATA_DIR"
command -v psql >/dev/null 2>&1 || fail "psql not found in PATH"

log "Testing database connection..."
psql "$DB_URL" -c "SELECT 1" > /dev/null 2>&1 || fail "Cannot connect to database at $DB_URL"
success "Database connection OK"

# =============================================================================
# PHASE 1: CREATE TEMP STAGING TABLES
# =============================================================================
log "Creating staging tables..."
psql "$DB_URL" <<'ENDSQL'
-- Drop existing temp tables if they exist from a previous run
DROP TABLE IF EXISTS _tmp_countries;
DROP TABLE IF EXISTS _tmp_destinations;
DROP TABLE IF EXISTS _tmp_hotels;
DROP TABLE IF EXISTS _tmp_hotel_descriptions;
DROP TABLE IF EXISTS _tmp_hotel_destinations;
DROP TABLE IF EXISTS _tmp_facilities;
DROP TABLE IF EXISTS _tmp_images;

-- Staging: countries
CREATE UNLOGGED TABLE _tmp_countries (
  id        TEXT,
  name      TEXT,
  continent TEXT,
  region    TEXT,
  currency  TEXT
);

-- Staging: destinations (cities/regions)
CREATE UNLOGGED TABLE _tmp_destinations (
  id        TEXT,
  name      TEXT,
  type      TEXT,
  lat       TEXT,
  lon       TEXT,
  countryid TEXT,
  searchable TEXT,
  seoname   TEXT,
  state     TEXT,
  contains  TEXT
);

-- Staging: hotels
CREATE UNLOGGED TABLE _tmp_hotels (
  id      TEXT,
  name    TEXT,
  address TEXT,
  status  TEXT,
  zip     TEXT,
  phone   TEXT,
  fax     TEXT,
  lat     TEXT,
  lon     TEXT,
  stars   TEXT,
  seoname TEXT
);

-- Staging: hotel descriptions
CREATE UNLOGGED TABLE _tmp_hotel_descriptions (
  hotel_id    TEXT,
  description TEXT
);

-- Staging: hotel-to-destination mapping
CREATE UNLOGGED TABLE _tmp_hotel_destinations (
  hotel_id       TEXT,
  destination_id TEXT,
  surroundings   TEXT
);

-- Staging: hotel facilities (amenities)
CREATE UNLOGGED TABLE _tmp_facilities (
  hotel_id TEXT,
  facility TEXT
);

-- Staging: hotel images
CREATE UNLOGGED TABLE _tmp_images (
  hotel_id TEXT,
  image    TEXT,
  title    TEXT
);
ENDSQL
success "Staging tables created"

# =============================================================================
# PHASE 2: LOAD CSV FILES INTO STAGING TABLES
# =============================================================================

# Python CSV normalizer script (handles both \" and "" escaping, and strips malformed fields)
PYTHON_NORMALIZER=$(cat << 'PYEOF'
import csv, sys, io, re

def normalize(path):
    with open(path, 'r', encoding='utf-8', errors='replace') as f:
        content = f.read()
    # Replace backslash-escaped quotes with double-quote escaping (RFC 4180)
    content = content.replace('\\"', '""')
    reader = csv.reader(io.StringIO(content), doublequote=True, skipinitialspace=True)
    writer = csv.writer(sys.stdout, doublequote=True, lineterminator='\n')
    header = None
    for i, row in enumerate(reader):
        if i == 0:
            header = row
            writer.writerow(row)
            continue
        # Trim row to expected number of columns (discard extra columns from bad data)
        if header and len(row) > len(header):
            row = row[:len(header)]
        writer.writerow(row)

normalize(sys.argv[1])
PYEOF
)

# Helper: load a CSV file with Python-based normalization for robust quoting handling
copy_csv() {
  local table="$1"
  local file="$2"
  local tmpfile="/tmp/_import_$(basename $file)"
  python3 -c "$PYTHON_NORMALIZER" "$file" > "$tmpfile"
  psql "$DB_URL" -c "\copy ${table} FROM '${tmpfile}' CSV HEADER"
  rm -f "$tmpfile"
}

log "Loading countries.csv (244 rows)..."
copy_csv _tmp_countries "$DATA_DIR/countries.csv"
success "Loaded countries"

log "Loading destinations.csv (~42K rows)..."
copy_csv _tmp_destinations "$DATA_DIR/destinations.csv"
success "Loaded destinations"

log "Loading hotels.csv (~655K rows)..."
copy_csv _tmp_hotels "$DATA_DIR/hotels.csv"
success "Loaded hotels"

log "Loading hotel_descriptions.csv (~787K rows)..."
copy_csv _tmp_hotel_descriptions "$DATA_DIR/hotel_descriptions.csv"
success "Loaded hotel descriptions"

log "Loading hotel_destinations.csv (~964K rows)..."
copy_csv _tmp_hotel_destinations "$DATA_DIR/hotel_destinations.csv"
success "Loaded hotel destinations"

if [ "$SKIP_FACILITIES" = false ]; then
  log "Loading hotel_facilities.csv + 8 parts (~7.5M rows total)..."
  copy_csv _tmp_facilities "$DATA_DIR/hotel_facilities.csv"
  for i in $(seq 1 8); do
    log "  Loading hotel_facilities.part${i}.csv..."
    copy_csv _tmp_facilities "$DATA_DIR/hotel_facilities.part${i}.csv"
  done
  success "Loaded all hotel facilities"
fi

if [ "$SKIP_IMAGES" = false ]; then
  log "Loading hotel images (~22M rows across 23 parts)..."
  for i in $(seq 0 21) 23; do
    log "  Loading hotel_images.part${i}.csv..."
    copy_csv _tmp_images "$DATA_DIR/hotel_images.part${i}.csv"
  done
  success "Loaded all hotel images"
fi

if [ "$DRY_RUN" = true ]; then
  log "Dry run mode: staging tables loaded. Skipping final inserts."
  psql "$DB_URL" -c "SELECT 'countries' AS table, count(*) FROM _tmp_countries UNION ALL SELECT 'destinations', count(*) FROM _tmp_destinations UNION ALL SELECT 'hotels', count(*) FROM _tmp_hotels UNION ALL SELECT 'descriptions', count(*) FROM _tmp_hotel_descriptions UNION ALL SELECT 'hotel_destinations', count(*) FROM _tmp_hotel_destinations UNION ALL SELECT 'facilities', count(*) FROM _tmp_facilities UNION ALL SELECT 'images', count(*) FROM _tmp_images;"
  exit 0
fi

# =============================================================================
# PHASE 3: INDEXES ON STAGING TABLES (speeds up joins)
# =============================================================================
log "Building indexes on staging tables for fast joins..."
psql "$DB_URL" <<'ENDSQL'
CREATE INDEX IF NOT EXISTS idx_tmp_hdest_hotel    ON _tmp_hotel_destinations(hotel_id);
CREATE INDEX IF NOT EXISTS idx_tmp_hdest_dest     ON _tmp_hotel_destinations(destination_id);
CREATE INDEX IF NOT EXISTS idx_tmp_dest_id        ON _tmp_destinations(id);
CREATE INDEX IF NOT EXISTS idx_tmp_countries_id   ON _tmp_countries(id);
CREATE INDEX IF NOT EXISTS idx_tmp_hotels_id      ON _tmp_hotels(id);
CREATE INDEX IF NOT EXISTS idx_tmp_hdesc_hotel    ON _tmp_hotel_descriptions(hotel_id);
CREATE INDEX IF NOT EXISTS idx_tmp_fac_hotel      ON _tmp_facilities(hotel_id);
CREATE INDEX IF NOT EXISTS idx_tmp_img_hotel      ON _tmp_images(hotel_id);
ENDSQL
success "Staging indexes created"

# =============================================================================
# PHASE 4: UPSERT SUPPLIER RECORD
# =============================================================================
log "Upserting Innstant supplier record..."
psql "$DB_URL" <<'ENDSQL'
INSERT INTO "Supplier" (
  id, code, name, type, status,
  "apiBaseUrl", "syncEnabled", "syncInterval",
  "rateLimitPerMin", "rateLimitPerDay",
  features, metadata, "createdAt", "updatedAt"
)
VALUES (
  'supplier-innstant',
  'innstant',
  'Innstant Travel',
  'hotel',
  'active',
  'https://static-data.innstant-servers.com',
  true,
  86400,
  60,
  10000,
  '{"hotels": true, "availability": true, "realtime": true, "staticData": true}'::jsonb,
  '{"description": "Global hotel distribution platform (Mishor static data)", "dataSource": "csv_import"}'::jsonb,
  NOW(),
  NOW()
)
ON CONFLICT (code) DO UPDATE
  SET "updatedAt"      = NOW(),
      "lastSyncAt"     = NOW(),
      "lastSyncStatus" = 'running';
ENDSQL
success "Supplier record upserted"

# =============================================================================
# PHASE 5: IMPORT COUNTRIES
# =============================================================================
log "Importing countries into Country table..."
psql "$DB_URL" <<'ENDSQL'
INSERT INTO "Country" (id, code, name, currency, "isActive", "createdAt")
SELECT
  'country-' || LOWER(id) AS id,
  id                      AS code,
  name,
  currency,
  true,
  NOW()
FROM _tmp_countries
WHERE id IS NOT NULL AND name IS NOT NULL
ON CONFLICT (code) DO UPDATE
  SET name     = EXCLUDED.name,
      currency = EXCLUDED.currency;

SELECT 'Countries imported: ' || count(*) FROM "Country" WHERE id LIKE 'country-%';
ENDSQL
success "Countries imported"

# =============================================================================
# PHASE 6: IMPORT COUNTRIES AS DESTINATIONS (level 0)
# =============================================================================
log "Importing countries as Destinations (level 0)..."
psql "$DB_URL" <<'ENDSQL'
INSERT INTO "Destination" (
  id, code, name, "nameNormalized",
  "destinationType", level,
  "countryCode", "countryName",
  "iataCountryCode",
  "isActive", "createdAt", "updatedAt"
)
SELECT
  'dest-country-' || LOWER(id) AS id,
  id                           AS code,
  name,
  LOWER(name),
  'country'                    AS "destinationType",
  0                            AS level,
  id                           AS "countryCode",
  name                         AS "countryName",
  id                           AS "iataCountryCode",
  true,
  NOW(),
  NOW()
FROM _tmp_countries
WHERE id IS NOT NULL AND name IS NOT NULL
ON CONFLICT (code) DO UPDATE
  SET name            = EXCLUDED.name,
      "nameNormalized"= EXCLUDED."nameNormalized",
      "countryName"   = EXCLUDED."countryName",
      "updatedAt"     = NOW();

SELECT 'Country destinations imported: ' || count(*) FROM "Destination" WHERE id LIKE 'dest-country-%';
ENDSQL
success "Country destinations imported"

# =============================================================================
# PHASE 7: IMPORT CITIES/REGIONS AS DESTINATIONS (level 1-2)
# =============================================================================
log "Importing destinations (cities/regions)..."
psql "$DB_URL" <<'ENDSQL'
INSERT INTO "Destination" (
  id, code, name, "nameNormalized",
  "destinationType", level,
  "countryCode", "countryName",
  latitude, longitude,
  "isActive", "createdAt", "updatedAt"
)
SELECT
  'dest-' || d.id            AS id,
  'DEST-' || d.id            AS code,
  d.name,
  LOWER(d.name),
  CASE
    WHEN d.type = 'city'    THEN 'city'
    WHEN d.type = 'region'  THEN 'state'
    WHEN d.type = 'country' THEN 'country'
    ELSE COALESCE(d.type, 'city')
  END                        AS "destinationType",
  CASE
    WHEN d.type = 'country' THEN 0
    WHEN d.type = 'region'  THEN 1
    ELSE 2
  END                        AS level,
  d.countryid                AS "countryCode",
  c.name                     AS "countryName",
  CASE WHEN d.lat ~ '^-?[0-9]+\.?[0-9]*$' THEN d.lat::float ELSE NULL END  AS latitude,
  CASE WHEN d.lon ~ '^-?[0-9]+\.?[0-9]*$' THEN d.lon::float ELSE NULL END  AS longitude,
  true,
  NOW(),
  NOW()
FROM _tmp_destinations d
LEFT JOIN _tmp_countries c ON c.id = d.countryid
ON CONFLICT (code) DO UPDATE
  SET name             = EXCLUDED.name,
      "nameNormalized" = EXCLUDED."nameNormalized",
      "countryCode"    = EXCLUDED."countryCode",
      "countryName"    = EXCLUDED."countryName",
      latitude         = EXCLUDED.latitude,
      longitude        = EXCLUDED.longitude,
      "updatedAt"      = NOW();

SELECT 'City/region destinations imported: ' || count(*) FROM "Destination" WHERE id LIKE 'dest-%' AND id NOT LIKE 'dest-country-%';
ENDSQL
success "City/region destinations imported"

# =============================================================================
# PHASE 8: IMPORT CANONICAL HOTELS
# =============================================================================
log "Importing canonical hotels (~655K rows - this may take a few minutes)..."
psql "$DB_URL" <<'ENDSQL'
-- We join hotels -> hotel_destinations (primary, surroundings=0)
-- -> destinations -> countries to get city and country info
INSERT INTO canonical_hotels (
  id, canonical_code,
  name, name_normalized,
  address, address_normalized,
  city, city_code,
  country, country_code,
  postal_code,
  phone,
  latitude, longitude,
  star_rating,
  status
)
SELECT
  'hotel-inn-' || h.id          AS id,
  'INN-' || h.id                AS canonical_code,
  h.name,
  LOWER(h.name)                 AS name_normalized,
  NULLIF(TRIM(h.address), '')   AS address,
  NULLIF(LOWER(TRIM(h.address)), '') AS address_normalized,
  COALESCE(NULLIF(TRIM(d.name), ''), 'Unknown')   AS city,
  CASE WHEN d.id IS NOT NULL THEN 'DEST-' || d.id ELSE NULL END AS city_code,
  COALESCE(c.name, 'Unknown')   AS country,
  COALESCE(d.countryid, '')     AS country_code,
  NULLIF(TRIM(h.zip), '')       AS postal_code,
  NULLIF(TRIM(h.phone), '')     AS phone,
  CASE WHEN h.lat ~ '^-?[0-9]+\.?[0-9]*$' THEN h.lat::float ELSE NULL END  AS latitude,
  CASE WHEN h.lon ~ '^-?[0-9]+\.?[0-9]*$' THEN h.lon::float ELSE NULL END  AS longitude,
  CASE WHEN h.stars ~ '^[0-9]+\.?[0-9]*$' THEN h.stars::float ELSE NULL END AS star_rating,
  CASE WHEN h.status = '1' THEN 'active' ELSE 'inactive' END AS status
FROM _tmp_hotels h
LEFT JOIN LATERAL (
  SELECT destination_id
  FROM _tmp_hotel_destinations hd
  WHERE hd.hotel_id = h.id
    AND hd.surroundings = '0'
  ORDER BY destination_id
  LIMIT 1
) hd_primary ON true
LEFT JOIN _tmp_destinations d ON d.id = hd_primary.destination_id
LEFT JOIN _tmp_countries c ON c.id = d.countryid
ON CONFLICT (canonical_code) DO UPDATE
  SET name             = EXCLUDED.name,
      name_normalized  = EXCLUDED.name_normalized,
      address          = EXCLUDED.address,
      city             = EXCLUDED.city,
      city_code        = EXCLUDED.city_code,
      country          = EXCLUDED.country,
      country_code     = EXCLUDED.country_code,
      postal_code      = EXCLUDED.postal_code,
      phone            = EXCLUDED.phone,
      latitude         = EXCLUDED.latitude,
      longitude        = EXCLUDED.longitude,
      star_rating      = EXCLUDED.star_rating,
      status           = EXCLUDED.status;

SELECT 'Canonical hotels imported: ' || count(*) FROM canonical_hotels WHERE id LIKE 'hotel-inn-%';
ENDSQL
success "Canonical hotels imported"

# =============================================================================
# PHASE 9: CREATE SUPPLIER HOTEL MAPPINGS
# =============================================================================
log "Creating supplier hotel mappings..."
psql "$DB_URL" <<'ENDSQL'
INSERT INTO "SupplierHotelMapping" (
  id, "canonicalHotelId", "supplierId",
  "supplierHotelId", "supplierHotelCode",
  "matchType", "matchConfidence",
  "lastSyncedAt", "syncStatus",
  "isActive", "createdAt", "updatedAt"
)
SELECT
  'shm-inn-' || h.id         AS id,
  'hotel-inn-' || h.id       AS "canonicalHotelId",
  (SELECT id FROM "Supplier" WHERE code = 'innstant')        AS "supplierId",
  h.id                       AS "supplierHotelId",
  h.seoname                  AS "supplierHotelCode",
  'auto'                     AS "matchType",
  1.0                        AS "matchConfidence",
  NOW()                      AS "lastSyncedAt",
  'synced'                   AS "syncStatus",
  true,
  NOW(),
  NOW()
FROM _tmp_hotels h
ON CONFLICT ("supplierId", "supplierHotelId") DO UPDATE
  SET "lastSyncedAt" = NOW(),
      "syncStatus"   = 'synced',
      "updatedAt"    = NOW();

SELECT 'Supplier mappings created: ' || count(*) FROM "SupplierHotelMapping" WHERE "supplierId" = (SELECT id FROM "Supplier" WHERE code = 'innstant');
ENDSQL
success "Supplier hotel mappings created"

# =============================================================================
# PHASE 10: IMPORT HOTEL DESCRIPTIONS
# =============================================================================
log "Importing hotel descriptions (~787K rows)..."
psql "$DB_URL" <<'ENDSQL'
INSERT INTO "HotelDescription" (
  id, "canonicalHotelId",
  "languageCode", "descriptionType",
  content, "supplierId",
  "isPrimary",
  "createdAt", "updatedAt"
)
SELECT
  'hdesc-inn-' || hd.hotel_id          AS id,
  'hotel-inn-' || hd.hotel_id          AS "canonicalHotelId",
  'en'                                  AS "languageCode",
  'general'                             AS "descriptionType",
  hd.description                        AS content,
  (SELECT id FROM "Supplier" WHERE code = 'innstant')                   AS "supplierId",
  true                                  AS "isPrimary",
  NOW(),
  NOW()
FROM _tmp_hotel_descriptions hd
-- Only import descriptions for hotels we imported, skip NULL/empty descriptions
WHERE hd.description IS NOT NULL
  AND TRIM(hd.description) <> ''
  AND EXISTS (
    SELECT 1 FROM "CanonicalHotel" ch WHERE ch.id = 'hotel-inn-' || hd.hotel_id
  )
ON CONFLICT ("canonicalHotelId", "languageCode", "descriptionType") DO UPDATE
  SET content    = EXCLUDED.content,
      "updatedAt"= NOW();

SELECT 'Hotel descriptions imported: ' || count(*) FROM "HotelDescription" WHERE "supplierId" = (SELECT id FROM "Supplier" WHERE code = 'innstant');
ENDSQL
success "Hotel descriptions imported"

# =============================================================================
# PHASE 11: IMPORT HOTEL FACILITIES (AMENITIES)
# =============================================================================
if [ "$SKIP_FACILITIES" = false ]; then
  log "Importing unique amenity definitions (~7.5M facility rows → unique amenities)..."
  psql "$DB_URL" <<'ENDSQL'
-- Step 11a: Create unique HotelAmenity records from all distinct facility names
INSERT INTO "HotelAmenity" (
  id, code, name, category,
  "isPopular", "sortOrder", "isActive",
  "createdAt", "updatedAt"
)
SELECT DISTINCT
  'amenity-inn-' || md5(LOWER(TRIM(facility)))  AS id,
  UPPER(REGEXP_REPLACE(TRIM(facility), '[^a-zA-Z0-9]+', '_', 'g')) AS code,
  LOWER(TRIM(facility))  AS name,
  'Facilities'           AS category,
  false,
  0,
  true,
  NOW(),
  NOW()
FROM _tmp_facilities
WHERE facility IS NOT NULL AND TRIM(facility) <> ''
ON CONFLICT (code) DO NOTHING;

SELECT 'Unique amenities created: ' || count(*) FROM "HotelAmenity" WHERE id LIKE 'amenity-inn-%';
ENDSQL
  success "Amenity definitions created"

  log "Creating hotel amenity supplier mappings..."
  psql "$DB_URL" <<'ENDSQL'
INSERT INTO "HotelAmenitySupplierMapping" (
  id, "amenityId", "supplierId",
  "supplierCode", "supplierName",
  "isVerified", "createdAt", "updatedAt"
)
SELECT DISTINCT
  'hasm-inn-' || md5(LOWER(TRIM(facility)))  AS id,
  'amenity-inn-' || md5(LOWER(TRIM(facility))) AS "amenityId",
  (SELECT id FROM "Supplier" WHERE code = 'innstant')                         AS "supplierId",
  TRIM(facility)                              AS "supplierCode",
  TRIM(facility)                              AS "supplierName",
  false,
  NOW(),
  NOW()
FROM _tmp_facilities
WHERE facility IS NOT NULL AND TRIM(facility) <> ''
ON CONFLICT ("supplierId", "supplierCode") DO NOTHING;

SELECT 'Amenity supplier mappings: ' || count(*) FROM "HotelAmenitySupplierMapping" WHERE "supplierId" = (SELECT id FROM "Supplier" WHERE code = 'innstant');
ENDSQL
  success "Amenity supplier mappings created"

  log "Creating hotel amenity mappings (hotel ↔ amenity links)..."
  psql "$DB_URL" <<'ENDSQL'
INSERT INTO "HotelAmenityMapping" (
  id, "canonicalHotelId", "amenityId",
  "supplierId", "supplierAmenityCode",
  "isFree", "isVerified",
  "createdAt", "updatedAt"
)
SELECT DISTINCT
  'ham-' || md5('hotel-inn-' || f.hotel_id || '-amenity-inn-' || md5(LOWER(TRIM(f.facility)))) AS id,
  'hotel-inn-' || f.hotel_id        AS "canonicalHotelId",
  'amenity-inn-' || md5(LOWER(TRIM(f.facility))) AS "amenityId",
  (SELECT id FROM "Supplier" WHERE code = 'innstant')               AS "supplierId",
  TRIM(f.facility)                  AS "supplierAmenityCode",
  true,
  false,
  NOW(),
  NOW()
FROM _tmp_facilities f
WHERE f.facility IS NOT NULL AND TRIM(f.facility) <> ''
  AND EXISTS (
    SELECT 1 FROM "CanonicalHotel" ch WHERE ch.id = 'hotel-inn-' || f.hotel_id
  )
ON CONFLICT ("canonicalHotelId", "amenityId") DO NOTHING;

SELECT 'Hotel amenity mappings created: ' || count(*) FROM "HotelAmenityMapping" WHERE "supplierId" = (SELECT id FROM "Supplier" WHERE code = 'innstant');
ENDSQL
  success "Hotel amenity mappings created"
fi

# =============================================================================
# PHASE 12: IMPORT HOTEL IMAGES
# =============================================================================
if [ "$SKIP_IMAGES" = false ]; then
  log "Importing hotel images (~22M rows - this is the longest step)..."
  psql "$DB_URL" <<'ENDSQL'
-- Insert images with MD5 deduplication
-- We rank images per hotel to mark the first as isPrimary
INSERT INTO "HotelImage" (
  id, "canonicalHotelId", "supplierId",
  url, "urlHash",
  "imageType", "sizeVariant",
  caption,
  "isPrimary", "isVerified",
  "qualityScore", "displayOrder",
  status,
  "createdAt", "updatedAt"
)
SELECT
  'himg-inn-' || md5(i.image)         AS id,
  'hotel-inn-' || i.hotel_id          AS "canonicalHotelId",
  (SELECT id FROM "Supplier" WHERE code = 'innstant')                  AS "supplierId",
  i.image                              AS url,
  md5(i.image)                         AS "urlHash",
  'general'                            AS "imageType",
  'original'                           AS "sizeVariant",
  NULLIF(TRIM(COALESCE(i.title, '')), '') AS caption,
  (ROW_NUMBER() OVER (PARTITION BY i.hotel_id ORDER BY i.image) = 1) AS "isPrimary",
  false                                AS "isVerified",
  NULL                                 AS "qualityScore",
  (ROW_NUMBER() OVER (PARTITION BY i.hotel_id ORDER BY i.image) - 1) AS "displayOrder",
  'active'                             AS status,
  NOW(),
  NOW()
FROM _tmp_images i
WHERE i.image IS NOT NULL AND TRIM(i.image) <> ''
  AND EXISTS (
    SELECT 1 FROM "CanonicalHotel" ch WHERE ch.id = 'hotel-inn-' || i.hotel_id
  )
ON CONFLICT ("urlHash") DO NOTHING;

SELECT 'Hotel images imported: ' || count(*) FROM "HotelImage" WHERE "supplierId" = (SELECT id FROM "Supplier" WHERE code = 'innstant');
ENDSQL
  success "Hotel images imported"
fi

# =============================================================================
# PHASE 13: UPDATE SUPPLIER SYNC STATUS
# =============================================================================
log "Updating supplier sync status..."
psql "$DB_URL" <<'ENDSQL'
UPDATE "Supplier"
SET "lastSyncAt"     = NOW(),
    "lastSyncStatus" = 'success',
    "lastSyncRecords" = (
      SELECT count(*)::int FROM "CanonicalHotel" WHERE id LIKE 'hotel-inn-%'
    ),
    "updatedAt"      = NOW()
WHERE code = 'innstant';
ENDSQL

# =============================================================================
# PHASE 14: CLEANUP STAGING TABLES
# =============================================================================
log "Cleaning up staging tables..."
psql "$DB_URL" <<'ENDSQL'
DROP TABLE IF EXISTS _tmp_countries;
DROP TABLE IF EXISTS _tmp_destinations;
DROP TABLE IF EXISTS _tmp_hotels;
DROP TABLE IF EXISTS _tmp_hotel_descriptions;
DROP TABLE IF EXISTS _tmp_hotel_destinations;
DROP TABLE IF EXISTS _tmp_facilities;
DROP TABLE IF EXISTS _tmp_images;
ENDSQL
success "Staging tables cleaned up"

# =============================================================================
# PHASE 15: FINAL SUMMARY
# =============================================================================
log "Import complete! Final database summary:"
psql "$DB_URL" <<'ENDSQL'
SELECT
  'Countries'               AS "Table", count(*)::text AS "Rows" FROM "Country"               WHERE id LIKE 'country-%'
UNION ALL
SELECT 'Destinations',              count(*)::text FROM "Destination"           WHERE id LIKE 'dest-%'
UNION ALL
SELECT 'Canonical Hotels',          count(*)::text FROM "CanonicalHotel"        WHERE id LIKE 'hotel-inn-%'
UNION ALL
SELECT 'Supplier Mappings',         count(*)::text FROM "SupplierHotelMapping"  WHERE "supplierId" = (SELECT id FROM "Supplier" WHERE code = 'innstant')
UNION ALL
SELECT 'Hotel Descriptions',        count(*)::text FROM "HotelDescription"      WHERE "supplierId" = (SELECT id FROM "Supplier" WHERE code = 'innstant')
UNION ALL
SELECT 'Unique Amenities',          count(*)::text FROM "HotelAmenity"          WHERE id LIKE 'amenity-inn-%'
UNION ALL
SELECT 'Hotel Amenity Mappings',    count(*)::text FROM "HotelAmenityMapping"   WHERE "supplierId" = (SELECT id FROM "Supplier" WHERE code = 'innstant')
UNION ALL
SELECT 'Hotel Images',              count(*)::text FROM "HotelImage"            WHERE "supplierId" = (SELECT id FROM "Supplier" WHERE code = 'innstant')
ORDER BY 1;
ENDSQL

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║        Mishor Static Data Import COMPLETE                    ║"
echo "╚══════════════════════════════════════════════════════════════╝"
