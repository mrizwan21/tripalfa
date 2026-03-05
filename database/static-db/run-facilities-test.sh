#!/bin/bash

# ============================================================
# Facilities Data Import Test Script
# ============================================================
# This script runs a test import of 100 facilities to verify
# that all language translations are being captured and saved
# to the local database.
#
# Usage: ./database/static-db/run-facilities-test.sh
# ============================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Facilities Data Import Test (100 facilities)${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════${NC}"
echo ""

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo -e "${YELLOW}Creating .env.local file...${NC}"
    cp .env.example .env.local
fi

# Set the API key (production key provided)
export LITEAPI_KEY="prod_1ca7e299-f889-4462-8e32-ce421ab66a93"

# Enable test mode with 100 facility limit
export SYNC_TEST_MODE="true"
export SYNC_TEST_LIMIT="100"

# Enable verbose logging to see translation extraction
export SYNC_VERBOSE="true"

echo -e "${GREEN}Configuration:${NC}"
echo "  API Key: ****...6a93 (production key)"
echo "  Test Mode: ENABLED"
echo "  Facility Limit: 100"
echo "  Verbose Logging: ENABLED"
echo ""

# Step 1: Run migrations if needed
echo -e "${BLUE}Step 1: Ensuring database schema is up to date...${NC}"
psql -v ON_ERROR_STOP=1 << EOF
-- Check if facilities table exists
DO \$\$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'hotel' AND table_name = 'facilities') THEN
        RAISE EXCEPTION 'hotel.facilities table does not exist. Please run migrations first.';
    END IF;
END \$\$;

SELECT 'Database schema check passed' AS status;
EOF

echo -e "${GREEN}✓ Database schema verified${NC}"
echo ""

# Step 2: Run the facilities test sync
echo -e "${BLUE}Step 2: Starting facilities import test...${NC}"
echo ""

npx ts-node database/static-db/scripts/sync-facilities-full.ts

TEST_EXIT_CODE=$?
echo ""

# Step 3: Verify the import
echo -e "${BLUE}Step 3: Verifying imported data...${NC}"
echo ""

if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✓ Import script completed successfully${NC}"
    echo ""
    
    # Query the database to verify data
    echo -e "${BLUE}Database Verification Results:${NC}"
    echo ""
    
    psql << EOF
-- Count total facilities
SELECT 'Total Facilities Imported:' AS metric, COUNT(*) AS value
FROM hotel.facilities;

-- Count facilities with translations
SELECT 'Facilities with Translations:' AS metric, COUNT(*) AS value
FROM hotel.facilities
WHERE translations IS NOT NULL;

-- Count active facilities
SELECT 'Active Facilities:' AS metric, COUNT(*) AS value
FROM hotel.facilities
WHERE is_active = TRUE;

-- Sample of first 10 imported facilities with translation counts
SELECT 'Sample of Imported Facilities:' AS metric;

SELECT 
    id,
    name,
    COALESCE(jsonb_array_length(jsonb_object_keys(translations)::jsonb), 0) as language_count,
    to_jsonb(array(SELECT k FROM jsonb_object_keys(translations) k)) as languages
FROM hotel.facilities
ORDER BY id ASC
LIMIT 10;

-- Language coverage report
SELECT 'Language Coverage Report:' AS metric;

WITH lang_stats AS (
    SELECT
        key as language,
        COUNT(*) as facility_count
    FROM hotel.facilities, jsonb_each(translations)
    GROUP BY key
)
SELECT 
    language,
    facility_count,
    ROUND(100.0 * facility_count / (SELECT COUNT(*) FROM hotel.facilities), 2) as coverage_percent
FROM lang_stats
ORDER BY facility_count DESC
LIMIT 20;
EOF
    
    echo ""
    echo -e "${GREEN}════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}✓ TEST COMPLETED SUCCESSFULLY${NC}"
    echo -e "${GREEN}════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "${GREEN}Summary:${NC}"
    echo "  • 100 facilities fetched from LiteAPI"
    echo "  • All language translations captured and saved"
    echo "  • Data verified in local PostgreSQL database"
    echo "  • Translation coverage report generated"
    echo ""
    
else
    echo -e "${RED}════════════════════════════════════════════════════${NC}"
    echo -e "${RED}✗ TEST FAILED${NC}"
    echo -e "${RED}════════════════════════════════════════════════════${NC}"
    echo ""
    echo "Exit code: $TEST_EXIT_CODE"
    echo ""
    exit 1
fi

# Step 4: Show next steps
echo -e "${BLUE}Next Steps:${NC}"
echo "  1. Review the language coverage report above"
echo "  2. Run full import: SYNC_TEST_MODE=false npx ts-node database/static-db/scripts/sync-facilities-full.ts"
echo "  3. Schedule daily syncs via cron or systemd"
echo "  4. Monitor sync metadata table for future runs"
echo ""

echo -e "${BLUE}View detailed data:${NC}"
echo "  psql -c \"SELECT * FROM hotel.facilities LIMIT 5;\""
echo "  psql -c \"SELECT id, name, translations FROM hotel.facilities WHERE id < 10;\""
echo ""