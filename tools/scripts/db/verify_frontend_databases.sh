#!/bin/bash
# Frontend DB verification for shared platform architecture.
# Verifies only frontend application databases and confirms static DB safety.

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PGHOST="${PGHOST:-localhost}"
PGPORT="${PGPORT:-5433}"
PGUSER="${PGUSER:-postgres}"
PGPASSWORD="${PGPASSWORD:-postgres}"

FRONTEND_DBS=(
  "tripalfa_platform"
  "tripalfa_platform_ops"
  "tripalfa_platform_finance"
)
STATIC_DB="tripalfa_local"
EXPECTED_ENUM="BOOKING_ENGINE,B2B_PORTAL,CALL_CENTER,SUPERADMIN"
EXPECTED_TABLE_COUNT=27
REQUIRED_TABLE_COUNT=9

EXIT_CODE=0

pass() {
  echo -e "${GREEN}✓${NC} $1"
}

fail() {
  echo -e "${RED}✗${NC} $1"
  EXIT_CODE=1
}

warn() {
  echo -e "${YELLOW}⚠${NC} $1"
}

query() {
  local db="$1"
  local sql="$2"
  PGPASSWORD="$PGPASSWORD" psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$db" -Atc "$sql"
}

db_exists() {
  local db="$1"
  local exists
  exists=$(query postgres "SELECT EXISTS (SELECT 1 FROM pg_database WHERE datname='${db}');")
  [[ "$exists" == "t" ]]
}

echo "TripAlfa Frontend Database Verification"
echo "======================================="
echo "Host: $PGHOST:$PGPORT  User: $PGUSER"
echo ""

echo "1) Required databases"
echo "---------------------"
for db in "${FRONTEND_DBS[@]}" "$STATIC_DB"; do
  if db_exists "$db"; then
    pass "Database exists: $db"
  else
    fail "Database missing: $db"
  fi
done

echo ""
echo "2) Frontend DB schema checks"
echo "----------------------------"
for db in "${FRONTEND_DBS[@]}"; do
  table_count=$(query "$db" "SELECT count(*) FROM pg_tables WHERE schemaname='public';")
  if [[ "$table_count" == "$EXPECTED_TABLE_COUNT" ]]; then
    pass "$db has $table_count public tables"
  else
    fail "$db expected $EXPECTED_TABLE_COUNT tables, found $table_count"
  fi

  enum_values=$(query "$db" "SELECT string_agg(enumlabel, ',' ORDER BY enumsortorder) FROM pg_enum e JOIN pg_type t ON t.oid=e.enumtypid WHERE t.typname='AppModule';")
  if [[ "$enum_values" == "$EXPECTED_ENUM" ]]; then
    pass "$db AppModule enum includes all four frontend apps"
  else
    fail "$db AppModule mismatch: $enum_values"
  fi

  required_tables=$(query "$db" "SELECT count(*) FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('users','bookings','payments','audit_logs','tenant_application_access','b2b_organization_profiles','call_center_agent_profiles','superadmin_settings','booking_engine_preferences');")
  if [[ "$required_tables" == "$REQUIRED_TABLE_COUNT" ]]; then
    pass "$db has all required shared/app extension tables"
  else
    fail "$db missing required shared/app extension tables (found $required_tables/$REQUIRED_TABLE_COUNT)"
  fi

  enabled_apps=$(query "$db" "SELECT count(*) FROM tenant_application_access taa JOIN tenants t ON t.id=taa.\"tenantId\" WHERE t.code='TRIPALFA' AND taa.\"isEnabled\"=true;")
  if [[ "$enabled_apps" == "4" ]]; then
    pass "$db has 4 enabled tenant app access rows for TRIPALFA"
  else
    warn "$db expected 4 enabled tenant app access rows for TRIPALFA, found $enabled_apps"
  fi

  booking_app_count=$(query "$db" "SELECT count(DISTINCT app) FROM bookings;")
  if [[ "$booking_app_count" == "4" ]]; then
    pass "$db has bookings across all four apps"
  else
    warn "$db has bookings for $booking_app_count apps"
  fi
done

echo ""
echo "3) Static DB safety checks"
echo "--------------------------"
static_public_tables=$(query "$STATIC_DB" "SELECT count(*) FROM pg_tables WHERE schemaname='public';")
echo "Static DB public table count: $static_public_tables"

static_prisma=$(query "$STATIC_DB" "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='_prisma_migrations');")
if [[ "$static_prisma" == "f" ]]; then
  pass "$STATIC_DB has no Prisma migrations table (frontend migrations did not touch static DB)"
else
  fail "$STATIC_DB unexpectedly contains _prisma_migrations"
fi

echo ""
echo "======================================="
if [[ "$EXIT_CODE" -eq 0 ]]; then
  echo -e "${GREEN}Verification passed.${NC}"
else
  echo -e "${RED}Verification completed with issues.${NC}"
fi

exit "$EXIT_CODE"
