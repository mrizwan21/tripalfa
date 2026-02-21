#!/bin/bash
# =============================================================================
# Import Missing Mishor Static Hotel Data - Resilient One-File-At-A-Time
# =============================================================================
# Processes ONE CSV file at a time: normalize → copy to staging → insert → drop.
# This keeps disk/memory usage bounded and is safe to restart if interrupted.
#
# Usage:
#   chmod +x scripts/import-mishor-local.sh
#   ./scripts/import-mishor-local.sh
#
# Options:
#   --skip-images         Skip image import
#   --skip-facilities     Skip facilities import
#   --skip-descriptions   Skip descriptions import
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
DATA_DIR="$PROJECT_DIR/mishor_static"
DB_URL="postgresql://postgres:postgres@localhost:5433/staticdatabase"

SKIP_IMAGES=false
SKIP_FACILITIES=false
SKIP_DESCRIPTIONS=false

for arg in "$@"; do
  case $arg in
    --skip-images)       SKIP_IMAGES=true ;;
    --skip-facilities)   SKIP_FACILITIES=true ;;
    --skip-descriptions) SKIP_DESCRIPTIONS=true ;;
  esac
done

log()     { echo "[$(date '+%H:%M:%S')] $1"; }
success() { echo "[$(date '+%H:%M:%S')] ✅ $1"; }
warn()    { echo "[$(date '+%H:%M:%S')] ⚠️  $1"; }
fail()    { echo "[$(date '+%H:%M:%S')] ❌ $1"; exit 1; }

[ -d "$DATA_DIR" ] || fail "Data directory not found: $DATA_DIR"
command -v psql >/dev/null 2>&1 || fail "psql not found"

log "Testing database connection..."
psql "$DB_URL" -c "SELECT 1" > /dev/null 2>&1 || fail "Cannot connect at $DB_URL"
success "Database connection OK"
log "Data directory: $DATA_DIR"

# Ensure supplier exists
psql "$DB_URL" -c "
INSERT INTO \"Supplier\" (
  id, code, name, type, status, \"apiBaseUrl\", \"syncEnabled\", \"syncInterval\",
  \"rateLimitPerMin\", \"rateLimitPerDay\", features, metadata, \"createdAt\", \"updatedAt\"
)
VALUES (
  'supplier-innstant','innstant','Innstant Travel','hotel','active',
  'https://static-data.innstant-servers.com',true,86400,60,10000,
  '{\"hotels\":true,\"availability\":true,\"realtime\":true,\"staticData\":true}'::jsonb,
  '{\"description\":\"Global hotel distribution platform\",\"dataSource\":\"csv_import\"}'::jsonb,
  NOW(),NOW()
)
ON CONFLICT (code) DO UPDATE SET \"updatedAt\"=NOW();" 2>&1 | grep -v "^INSERT" || true

# Python normalizer: handles \" escaping, trims extra columns
PYTHON_NORMALIZER=$(cat << 'PYEOF'
import csv, sys, io
def normalize(path):
    with open(path, 'r', encoding='utf-8', errors='replace') as f:
        content = f.read()
    content = content.replace('\\"', '""')
    reader = csv.reader(io.StringIO(content), doublequote=True, skipinitialspace=True)
    writer = csv.writer(sys.stdout, doublequote=True, lineterminator='\n')
    header = None
    for i, row in enumerate(reader):
        if i == 0:
            header = row
            writer.writerow(row)
            continue
        if header and len(row) > len(header):
            row = row[:len(header)]
        writer.writerow(row)
normalize(sys.argv[1])
PYEOF
)

# =============================================================================
# Process ONE descriptions CSV file
# Uses permanent staging table (not TEMP) so it survives across psql sessions
# =============================================================================
import_descriptions_file() {
  local file="$1"
  local filename=$(basename "$file")
  local tmpfile="/tmp/_imp_${filename}"

  log "  Normalizing $filename..."
  python3 -c "$PYTHON_NORMALIZER" "$file" > "$tmpfile"

  log "  Creating staging table..."
  psql "$DB_URL" -c "DROP TABLE IF EXISTS _stg_desc; CREATE TABLE _stg_desc (hotel_id TEXT, description TEXT);" > /dev/null

  log "  Copying into staging..."
  psql "$DB_URL" -c "\copy _stg_desc FROM '${tmpfile}' CSV HEADER"
  rm -f "$tmpfile"

  log "  Inserting into HotelDescription..."
  psql "$DB_URL" -c "
    INSERT INTO \"HotelDescription\" (
      id, \"canonicalHotelId\", \"languageCode\", \"descriptionType\",
      content, \"supplierId\", \"isPrimary\", \"createdAt\", \"updatedAt\"
    )
    SELECT
      'hdesc-inn-' || s.hotel_id,
      'hotel-inn-' || s.hotel_id,
      'en', 'general', s.description,
      (SELECT id FROM \"Supplier\" WHERE code='innstant'),
      true, NOW(), NOW()
    FROM _stg_desc s
    WHERE s.description IS NOT NULL AND TRIM(s.description) <> ''
      AND EXISTS (SELECT 1 FROM \"CanonicalHotel\" c WHERE c.id = 'hotel-inn-' || s.hotel_id)
    ON CONFLICT (\"canonicalHotelId\", \"languageCode\", \"descriptionType\") DO UPDATE
      SET content=EXCLUDED.content, \"updatedAt\"=NOW();"

  psql "$DB_URL" -c "DROP TABLE IF EXISTS _stg_desc;" > /dev/null

  ROWS=$(psql "$DB_URL" -t -c "SELECT count(*) FROM \"HotelDescription\" WHERE id LIKE 'hdesc-inn-%';" | tr -d ' \n')
  log "  HotelDescription total: $ROWS"
}

# =============================================================================
# Process ONE facilities CSV file
# =============================================================================
import_facilities_file() {
  local file="$1"
  local filename=$(basename "$file")
  local tmpfile="/tmp/_imp_${filename}"

  log "  Normalizing $filename..."
  python3 -c "$PYTHON_NORMALIZER" "$file" > "$tmpfile"

  log "  Creating staging table..."
  psql "$DB_URL" -c "DROP TABLE IF EXISTS _stg_fac; CREATE TABLE _stg_fac (hotel_id TEXT, facility TEXT);" > /dev/null

  log "  Copying into staging..."
  psql "$DB_URL" -c "\copy _stg_fac FROM '${tmpfile}' CSV HEADER"
  rm -f "$tmpfile"

  log "  Upserting HotelAmenity..."
  psql "$DB_URL" -c "
    INSERT INTO \"HotelAmenity\" (id, code, name, category, \"isPopular\", \"sortOrder\", \"isActive\", \"createdAt\", \"updatedAt\")
    SELECT DISTINCT
      'amenity-inn-' || md5(LOWER(TRIM(facility))),
      UPPER(REGEXP_REPLACE(TRIM(facility), '[^a-zA-Z0-9]+', '_', 'g')),
      LOWER(TRIM(facility)), 'Facilities', false, 0, true, NOW(), NOW()
    FROM _stg_fac
    WHERE facility IS NOT NULL AND TRIM(facility) <> ''
    ON CONFLICT (code) DO NOTHING;" > /dev/null

  log "  Upserting HotelAmenitySupplierMapping..."
  psql "$DB_URL" -c "
    INSERT INTO \"HotelAmenitySupplierMapping\" (id, \"amenityId\", \"supplierId\", \"supplierCode\", \"supplierName\", \"isVerified\", \"createdAt\", \"updatedAt\")
    SELECT DISTINCT
      'hasm-inn-' || md5(LOWER(TRIM(f.facility))),
      ha.id,
      (SELECT id FROM \"Supplier\" WHERE code='innstant'),
      TRIM(f.facility), TRIM(f.facility), false, NOW(), NOW()
    FROM _stg_fac f
    JOIN \"HotelAmenity\" ha ON ha.code = UPPER(REGEXP_REPLACE(TRIM(f.facility), '[^a-zA-Z0-9]+', '_', 'g'))
    WHERE f.facility IS NOT NULL AND TRIM(f.facility) <> ''
    ON CONFLICT (\"supplierId\", \"supplierCode\") DO NOTHING;" > /dev/null

  log "  Inserting HotelAmenityMapping..."
  psql "$DB_URL" -c "
    INSERT INTO \"HotelAmenityMapping\" (id, \"canonicalHotelId\", \"amenityId\", \"supplierId\", \"supplierAmenityCode\", \"isFree\", \"isVerified\", \"createdAt\", \"updatedAt\")
    SELECT DISTINCT
      'ham-' || md5('hotel-inn-'||f.hotel_id||'-'||ha.id),
      'hotel-inn-' || f.hotel_id,
      ha.id,
      (SELECT id FROM \"Supplier\" WHERE code='innstant'),
      TRIM(f.facility), true, false, NOW(), NOW()
    FROM _stg_fac f
    JOIN \"HotelAmenity\" ha ON ha.code = UPPER(REGEXP_REPLACE(TRIM(f.facility), '[^a-zA-Z0-9]+', '_', 'g'))
    WHERE f.facility IS NOT NULL AND TRIM(f.facility) <> ''
      AND EXISTS (SELECT 1 FROM \"CanonicalHotel\" c WHERE c.id = 'hotel-inn-' || f.hotel_id)
    ON CONFLICT (\"canonicalHotelId\", \"amenityId\") DO NOTHING;" > /dev/null

  psql "$DB_URL" -c "DROP TABLE IF EXISTS _stg_fac;" > /dev/null

  ROWS=$(psql "$DB_URL" -t -c "SELECT count(*) FROM \"HotelAmenityMapping\" WHERE id LIKE 'ham-%';" | tr -d ' \n')
  log "  HotelAmenityMapping total: $ROWS"
}

# =============================================================================
# Process ONE images CSV file
# =============================================================================
import_images_file() {
  local file="$1"
  local filename=$(basename "$file")
  local tmpfile="/tmp/_imp_${filename}"

  log "  Normalizing $filename..."
  python3 -c "$PYTHON_NORMALIZER" "$file" > "$tmpfile"

  log "  Creating staging table..."
  psql "$DB_URL" -c "DROP TABLE IF EXISTS _stg_img; CREATE TABLE _stg_img (hotel_id TEXT, image TEXT, title TEXT);" > /dev/null

  log "  Copying into staging..."
  psql "$DB_URL" -c "\copy _stg_img FROM '${tmpfile}' CSV HEADER"
  rm -f "$tmpfile"

  log "  Inserting HotelImage..."
  psql "$DB_URL" -c "
    INSERT INTO \"HotelImage\" (
      id, \"canonicalHotelId\", \"supplierId\",
      url, \"urlHash\", \"imageType\", \"sizeVariant\",
      caption, \"isPrimary\", \"isVerified\",
      \"qualityScore\", \"displayOrder\", status,
      \"createdAt\", \"updatedAt\"
    )
    SELECT
      'himg-inn-' || md5(i.image),
      'hotel-inn-' || i.hotel_id,
      (SELECT id FROM \"Supplier\" WHERE code='innstant'),
      i.image, md5(i.image), 'general', 'original',
      NULLIF(TRIM(COALESCE(i.title,'')), ''),
      (ROW_NUMBER() OVER (PARTITION BY i.hotel_id ORDER BY i.image) = 1),
      false, NULL,
      (ROW_NUMBER() OVER (PARTITION BY i.hotel_id ORDER BY i.image) - 1),
      'active', NOW(), NOW()
    FROM _stg_img i
    WHERE i.image IS NOT NULL AND TRIM(i.image) <> ''
      AND EXISTS (SELECT 1 FROM \"CanonicalHotel\" c WHERE c.id = 'hotel-inn-' || i.hotel_id)
    ON CONFLICT (\"urlHash\") DO NOTHING;" > /dev/null

  psql "$DB_URL" -c "DROP TABLE IF EXISTS _stg_img;" > /dev/null

  ROWS=$(psql "$DB_URL" -t -c "SELECT count(*) FROM \"HotelImage\" WHERE id LIKE 'himg-inn-%';" | tr -d ' \n')
  log "  HotelImage total: $ROWS"
}

# =============================================================================
# PHASE 1: HOTEL DESCRIPTIONS
# =============================================================================
if [ "$SKIP_DESCRIPTIONS" = false ]; then
  CURRENT_DESC=$(psql "$DB_URL" -t -c "SELECT count(*) FROM \"HotelDescription\" WHERE id LIKE 'hdesc-inn-%';" | tr -d ' \n')
  if [ "$CURRENT_DESC" -gt 100000 ]; then
    warn "Hotel descriptions already has $CURRENT_DESC rows - skipping"
  else
    log "=== PHASE 1: Hotel Descriptions (~787K rows) ==="
    psql "$DB_URL" -c "DELETE FROM \"HotelDescription\" WHERE id LIKE 'hdesc-inn-%';" > /dev/null
    import_descriptions_file "$DATA_DIR/hotel_descriptions.csv"
    success "Hotel descriptions phase complete"
  fi
fi

# =============================================================================
# PHASE 2: HOTEL FACILITIES (one part at a time)
# =============================================================================
if [ "$SKIP_FACILITIES" = false ]; then
  CURRENT_HAM=$(psql "$DB_URL" -t -c "SELECT count(*) FROM \"HotelAmenityMapping\" WHERE id LIKE 'ham-%';" | tr -d ' \n')
  if [ "$CURRENT_HAM" -gt 8000000 ]; then
    warn "HotelAmenityMapping already has $CURRENT_HAM rows - skipping facilities"
  else
    log "=== PHASE 2: Hotel Facilities (9 files, one at a time) ==="
    import_facilities_file "$DATA_DIR/hotel_facilities.csv"
    for i in $(seq 1 8); do
      log "  --- Facilities part $i/8 ---"
      import_facilities_file "$DATA_DIR/hotel_facilities.part${i}.csv"
    done
    success "Hotel facilities phase complete"
  fi
fi

# =============================================================================
# PHASE 3: HOTEL IMAGES (one part at a time)
# =============================================================================
if [ "$SKIP_IMAGES" = false ]; then
  CURRENT_IMG=$(psql "$DB_URL" -t -c "SELECT count(*) FROM \"HotelImage\" WHERE id LIKE 'himg-inn-%';" | tr -d ' \n')
  if [ "$CURRENT_IMG" -gt 1000000 ]; then
    warn "HotelImage already has $CURRENT_IMG rows - skipping images"
  else
    log "=== PHASE 3: Hotel Images (23 parts, one at a time) ==="
    for i in $(seq 0 21) 23; do
      log "  --- Images part ${i}/23 ---"
      import_images_file "$DATA_DIR/hotel_images.part${i}.csv"
    done
    success "Hotel images phase complete"
  fi
fi

# =============================================================================
# PHASE 4: UPDATE SUPPLIER STATUS + FINAL SUMMARY
# =============================================================================
log "Updating supplier sync status..."
psql "$DB_URL" -c "
  UPDATE \"Supplier\"
  SET \"lastSyncAt\"=NOW(), \"lastSyncStatus\"='success',
      \"lastSyncRecords\"=(SELECT count(*)::int FROM \"CanonicalHotel\" WHERE id LIKE 'hotel-inn-%'),
      \"updatedAt\"=NOW()
  WHERE code='innstant';" > /dev/null

echo ""
log "=== FINAL DATABASE SUMMARY ==="
psql "$DB_URL" -c "
  SELECT 'Countries'         AS \"Table\", count(*)::text AS \"Rows\" FROM \"Country\"             WHERE id LIKE 'country-%'
  UNION ALL SELECT 'Destinations',         count(*)::text FROM \"Destination\"         WHERE id LIKE 'dest-%'
  UNION ALL SELECT 'Canonical Hotels',     count(*)::text FROM \"CanonicalHotel\"      WHERE id LIKE 'hotel-inn-%'
  UNION ALL SELECT 'Hotel Descriptions',   count(*)::text FROM \"HotelDescription\"    WHERE id LIKE 'hdesc-inn-%'
  UNION ALL SELECT 'Unique Amenities',     count(*)::text FROM \"HotelAmenity\"        WHERE id LIKE 'amenity-inn-%'
  UNION ALL SELECT 'Amenity Mappings',     count(*)::text FROM \"HotelAmenityMapping\" WHERE id LIKE 'ham-%'
  UNION ALL SELECT 'Hotel Images',         count(*)::text FROM \"HotelImage\"          WHERE id LIKE 'himg-inn-%'
  ORDER BY 1;"

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║        Mishor Static Data Import COMPLETE                    ║"
echo "╚══════════════════════════════════════════════════════════════╝"
