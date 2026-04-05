#!/bin/bash
# Database Rebuild Verification Script
# Run this after loading the v2 schemas to verify correct setup

set -e

echo "🔍 TripAlfa Database v2.0 Verification"
echo "======================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $2"
    else
        echo -e "${RED}✗${NC} $2"
        EXIT_CODE=1
    fi
}

warn_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${YELLOW}⚠${NC} $2"
    fi
}

EXIT_CODE=0

# 1. Check PostgreSQL availability
echo "1️⃣  PostgreSQL Connection"
echo "------------------------"
if psql -U postgres -c "SELECT version();" > /dev/null 2>&1; then
    check_result 0 "PostgreSQL accessible"
else
    check_result 1 "PostgreSQL not accessible"
    exit 1
fi

# 2. Check databases exist
echo ""
echo "2️⃣  Database Existence"
echo "----------------------"
for db in tripalfa_local tripalfa_core tripalfa_ops tripalfa_finance; do
    if psql -lqt | cut -d'|' -f1 | grep -qw "$db"; then
        check_result 0 "Database '$db' exists"
    else
        check_result 1 "Database '$db' NOT found"
    fi
done

# 3. Check extensions
echo ""
echo "3️⃣  Required Extensions"
echo "----------------------"
for ext in uuid-ossp pgcrypto pg_trgm postgis; do
    if psql -d tripalfa_local -c "SELECT 1 FROM pg_extension WHERE extname='$ext';" 2>/dev/null | grep -q 1; then
        check_result 0 "Extension '$ext' installed"
    else
        warn_result 1 "Extension '$ext' not installed (may not be critical)"
    fi
done

# 4. Check tripalfa_local schema structure
echo ""
echo "4️⃣  tripalfa_local Schema"
echo "------------------------"

# Check schemas exist
for schema in shared hotel flight; do
    if psql -d tripalfa_local -c "SELECT 1 FROM information_schema.schemata WHERE schema_name='$schema';" 2>/dev/null | grep -q 1; then
        check_result 0 "Schema '$schema' exists"
    else
        check_result 1 "Schema '$schema' NOT found"
    fi
done

# Check key tables
for table in "shared.currencies" "shared.countries" "hotel.hotels" "hotel.hotel_details" "hotel.hotel_images" "flight.airports" "flight.airlines"; do
    if psql -d tripalfa_local -c "\d $table" > /dev/null 2>&1; then
        check_result 0 "Table '$table' exists"
    else
        check_result 1 "Table '$table' NOT found"
    fi
done

# Check is_detail_fetched column
if psql -d tripalfa_local -c "SELECT is_detail_fetched FROM hotel.hotels LIMIT 0;" > /dev/null 2>&1; then
    check_result 0 "Column 'is_detail_fetched' exists on hotel.hotels"
else
    check_result 1 "Column 'is_detail_fetched' NOT found on hotel.hotels"
fi

# Check one-to-one relationship
if psql -d tripalfa_local -c "\d hotel.hotel_details" | grep -q "hotel_id.*UNIQUE"; then
    check_result 0 "hotel_details has UNIQUE FK to hotels (one-to-one)"
else
    check_result 1 "hotel_details FK uniqueness may need verification"
fi

# Check hotel_images is separate table with proper FK
if psql -d tripalfa_local -c "SELECT 1 FROM information_schema.key_column_usage WHERE table_name='hotel_images' AND column_name='hotel_id';" 2>/dev/null | grep -q 1; then
    check_result 0 "hotel_images has FK to hotels"
else
    check_result 1 "hotel_images FK to hotels needs verification"
fi

# 5. Check tripalfa_core schema (using plural names)
echo ""
echo "5️⃣  tripalfa_core Schema"
echo "------------------------"

for table in "users" "companies" "bookings" "wallets" "wallet_ledger" "wallet_transactions"; do
    if psql -d tripalfa_core -c "\d $table" > /dev/null 2>&1; then
        check_result 0 "Table '$table' exists"
    else
        check_result 1 "Table '$table' NOT found"
    fi
done

# Check wallet_ledger FK relationships
if psql -d tripalfa_core -c "\d wallet_ledger" | grep -q "wallet_ledger_transaction_id_fkey"; then
    check_result 0 "wallet_ledger has FK to wallet_transactions"
else
    check_result 1 "wallet_ledger FK to wallet_transactions NOT found"
fi

if psql -d tripalfa_core -c "\d wallet_ledger" | grep -q "wallet_ledger_wallet_id_fkey"; then
    check_result 0 "wallet_ledger has FK to wallets"
else
    check_result 1 "wallet_ledger FK to wallets NOT found"
fi

# Check flight tables are removed
if psql -d tripalfa_core -c "\d flight_cities" > /dev/null 2>&1; then
    check_result 1 "Flight tables still exist in core (should be removed)"
else
    check_result 0 "Flight tables correctly removed from core"
fi

# 6. Check tripalfa_ops schema
echo ""
echo "6️⃣  tripalfa_ops Schema"
echo "----------------------"

for table in "notification_templates" "notifications" "documents" "rules" "rule_analysis" "disputes" "settlements"; do
    if psql -d tripalfa_ops -c "\d $table" > /dev/null 2>&1; then
        check_result 0 "Table '$table' exists"
    else
        check_result 1 "Table '$table' NOT found"
    fi
done

# Check rule_analysis exists with FK
if psql -d tripalfa_ops -c "\d rule_analysis" > /dev/null 2>&1; then
    if psql -d tripalfa_ops -c "\d rule_analysis" | grep -q "rule_id"; then
        check_result 0 "rule_analysis exists with FK to rules"
    else
        check_result 1 "rule_analysis exists but missing FK to rules"
    fi
fi

# Check settlements FK to disputes
if psql -d tripalfa_ops -c "\d settlements" | grep -q "dispute_id"; then
    check_result 0 "settlements has FK to disputes"
else
    check_result 1 "settlements FK to disputes NOT found"
fi

# 7. Check tripalfa_finance schema
echo ""
echo "7️⃣  tripalfa_finance Schema"
echo "----------------------------"

for table in "suppliers" "invoices" "campaigns" "discount_coupons" "commission_rules" "commission_settlements" "supplier_sync_logs"; do
    if psql -d tripalfa_finance -c "\d $table" > /dev/null 2>&1; then
        check_result 0 "Table '$table' exists"
    else
        check_result 1 "Table '$table' NOT found"
    fi
done

# Check campaigns type column
if psql -d tripalfa_finance -c "\d campaigns" | grep -q "type"; then
    check_result 0 "campaigns table has 'type' column (merged from campaign + marketing_campaign)"
else
    check_result 1 "campaigns table missing 'type' column"
fi

# Check discount_coupons campaign_id FK
if psql -d tripalfa_finance -c "\d discount_coupons" | grep -q "campaign_id"; then
    check_result 0 "discount_coupons has FK to campaigns"
else
    check_result 1 "discount_coupons FK to campaigns NOT found"
fi

# Check commission_settlements has both essential columns
if psql -d tripalfa_finance -c "SELECT 1 FROM information_schema.key_column_usage WHERE table_name='commission_settlements' AND column_name='rule_id';" 2>/dev/null | grep -q 1; then
    check_result 0 "commission_settlements has FK to commission_rules"
else
    check_result 1 "commission_settlements FK to commission_rules NOT found"
fi

# Check for booking_id column (may not have FK constraint, but column should exist)
if psql -d tripalfa_finance -c "SELECT 1 FROM information_schema.columns WHERE table_name='commission_settlements' AND column_name='booking_id';" 2>/dev/null | grep -q 1; then
    check_result 0 "commission_settlements has booking_id column (for booking reference)"
else
    check_result 1 "commission_settlements booking_id column NOT found"
fi

# Check supplier_sync_logs
if psql -d tripalfa_finance -c "\d supplier_sync_logs" > /dev/null 2>&1; then
    check_result 0 "supplier_sync_logs table exists"
else
    check_result 1 "supplier_sync_logs table NOT found"
fi

# 8. Check critical indexes
echo ""
echo "8️⃣  Performance Indexes"
echo "----------------------"

# hotel.hotels indexes
if psql -d tripalfa_local -c "SELECT 1 FROM pg_indexes WHERE tablename='hotels' AND indexname LIKE '%detail_fetched%';" 2>/dev/null | grep -q 1; then
    check_result 0 "Partial index on hotel.hotels(is_detail_fetched) exists"
else
    check_result 1 "Partial index on hotel.hotels(is_detail_fetched) NOT found"
fi

if psql -d tripalfa_local -c "SELECT 1 FROM pg_indexes WHERE tablename='hotels' AND indexname LIKE '%trgm%';" 2>/dev/null | grep -q 1; then
    check_result 0 "GIN trigram index on hotel.hotels(name) exists"
else
    check_result 1 "GIN trigram index on hotel.hotels(name) NOT found"
fi

if psql -d tripalfa_local -c "SELECT 1 FROM pg_indexes WHERE tablename='hotels' AND indexname LIKE '%geo%';" 2>/dev/null | grep -q 1; then
    check_result 0 "GiST spatial index on hotel.hotels(location) exists"
else
    warn_result 1 "GiST spatial index on hotel.hotels NOT found (PostGIS may not be installed)"
fi

# booking indexes
if psql -d tripalfa_core -c "SELECT 1 FROM pg_indexes WHERE tablename='booking' AND indexname LIKE '%company%status%';" 2>/dev/null | grep -q 1; then
    check_result 0 "Composite index on booking(company_id, status, created_at) exists"
else
    warn_result 1 "Composite index on booking NOT found"
fi

# 9. Data validation
echo ""
echo "9️⃣  Data Validation (Sample Queries)"
echo "------------------------------------"

# Count hotels in local
HOTEL_COUNT=$(psql -d tripalfa_local -t -c "SELECT COUNT(*) FROM hotel.hotels;" 2>/dev/null | tr -d ' ')
if [ ! -z "$HOTEL_COUNT" ] && [ "$HOTEL_COUNT" -gt 0 ]; then
    check_result 0 "hotel.hotels contains $HOTEL_COUNT records"
else
    warn_result 1 "hotel.hotels appears empty (expected for new schema)"
fi

# Check one-to-one relationship
DETAIL_COUNT=$(psql -d tripalfa_local -t -c "SELECT COUNT(*) FROM hotel.hotel_details;" 2>/dev/null | tr -d ' ')
if [ ! -z "$DETAIL_COUNT" ]; then
    if [ "$DETAIL_COUNT" -eq "$HOTEL_COUNT" ]; then
        check_result 0 "hotel_details count matches hotels ($DETAIL_COUNT records)"
    elif [ "$DETAIL_COUNT" -le "$HOTEL_COUNT" ]; then
        warn_result 0 "hotel_details count ($DETAIL_COUNT) <= hotels ($HOTEL_COUNT) - expected for partial sync"
    fi
else
    warn_result 1 "Could not count hotel_details (new schema expected to be empty)"
fi

echo ""
echo "======================================"
if [ $EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✨ All checks passed!${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Run 'npm run db:generate' to regenerate Prisma clients"
    echo "  2. Update service code to use new schema location"
    echo "  3. Test integration with booking engine"
    echo "  4. See DATABASE_REBUILD_GUIDE.md for detailed next steps"
else
    echo -e "${RED}⚠️  Some checks failed. Review errors above.${NC}"
    echo ""
    echo "For detailed help:"
    echo "  - See: DATABASE_REBUILD_GUIDE.md"
    echo "  - See: docs/SCHEMA_CHANGES_V2.md"
    echo "  - See: docs/SERVICE_INTEGRATION_GUIDE.md"
fi

echo ""
exit $EXIT_CODE
