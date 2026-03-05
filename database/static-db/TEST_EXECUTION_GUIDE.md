# Facilities Data Import Test Guide

## Overview

This guide walks you through testing the facilities data import with a focus on verifying that **all language translations** from the LiteAPI endpoint are being captured and saved to the local database.

## Test Objective

✅ Fetch 100 facilities from LiteAPI `/data/facilities` endpoint  
✅ Extract ALL language translations (en, fr, es, de, pt, zh, ja, ko, etc.)  
✅ Save complete data to local PostgreSQL database  
✅ Verify all translations are stored and queryable  
✅ Generate translation coverage report  

## Prerequisites

```bash
# 1. Node.js and npm/pnpm installed
node --version  # v18+
npm --version   # v8+

# 2. PostgreSQL running and accessible
psql --version
psql -l         # List databases

# 3. Project dependencies installed
npm install
```

## Test Execution

### Option 1: Automated Test Script (Recommended)

```bash
cd /path/to/project

# Make script executable
chmod +x database/static-db/run-facilities-test.sh

# Run the test
./database/static-db/run-facilities-test.sh
```

The script will:
1. ✅ Verify database schema exists
2. ✅ Set up test environment variables
3. ✅ Run facilities sync with 100 facility limit
4. ✅ Verify data in database
5. ✅ Generate translation coverage report

### Option 2: Manual Execution

```bash
# 1. Set environment variables
export LITEAPI_KEY="prod_1ca7e299-f889-4462-8e32-ce421ab66a93"
export SYNC_TEST_MODE="true"
export SYNC_TEST_LIMIT="100"
export SYNC_VERBOSE="true"

# 2. Ensure migrations are applied
npm run migrate

# 3. Run the facilities sync
npx ts-node database/static-db/scripts/sync-facilities-full.ts

# 4. Verify data in database
psql -c "SELECT COUNT(*) FROM hotel.facilities;"
```

## What the Test Does

### Step 1: API Connection
- Connects to LiteAPI production endpoint using the provided API key
- Fetches `/data/facilities` endpoint data
- Limits to 100 facilities for quick testing

### Step 2: Data Extraction
For each facility, the script:
- Extracts the facility ID and English name
- **Captures ALL string-valued keys as language translations**
- Skips known non-translation fields (description, type, category, etc.)
- Sanitizes UTF-8 data for PostgreSQL compatibility

### Step 3: Database Storage
Each facility is stored with:
```sql
INSERT INTO hotel.facilities (id, name, translations)
VALUES (
  1,                                          -- ID
  'WiFi',                                     -- Name
  '{"en":"WiFi","fr":"WiFi","es":"WiFi"...}' -- All translations as JSONB
)
```

### Step 4: Verification
The test queries the database to verify:
- Total facilities imported
- Facilities with translations
- Active facilities
- Sample of imported data with translation counts
- Language coverage statistics

## Expected Output

### Successful Test Run Output

```
════════════════════════════════════════════════════
  Facilities Data Import Test (100 facilities)
════════════════════════════════════════════════════

Configuration:
  API Key: ****...6a93 (production key)
  Test Mode: ENABLED
  Facility Limit: 100
  Verbose Logging: ENABLED

Step 1: Ensuring database schema is up to date...
✓ Database schema verified

Step 2: Starting facilities import test...

[Facilities-Full] Starting facilities sync with full translation support...
🧪 TEST MODE ACTIVE: Limiting to 100 facilities
📝 VERBOSE LOGGING ENABLED: Detailed translation logging

[Facilities-Full] Fetching facilities from LiteAPI /data/facilities...
[Facilities-Full] ✓ Fetched 100 facilities from API
[Facilities-Full] Upserting 100 facilities into hotel.facilities...

[Facilities-Full] Facility 1: "WiFi" with 15 language translations [ar, de, en, es, fr, ...]
[Facilities-Full] Facility 2: "Swimming Pool" with 15 language translations [ar, de, en, ...]
...
[Facilities-Full] ✓ Successfully upserted 100 facilities

VERIFYING IMPORTED DATA
──────────────────────────────────────────────────
✓ Verified 100 recently imported facilities

Sample of imported facilities with translations:
  • [ID   1] WiFi (15 languages: ar, cs, de, en, es, fr, ...)
  • [ID   2] Swimming Pool (15 languages: ar, cs, de, en, es, fr, ...)
  • [ID   3] Gym (15 languages: ar, cs, de, en, es, fr, ...)
  • [ID   4] Business Center (15 languages: ar, cs, de, en, es, fr, ...)
  • [ID   5] Parking (15 languages: ar, cs, de, en, es, fr, ...)

TRANSLATION COVERAGE REPORT
──────────────────────────────────────────────────
✓ Total unique languages across all facilities: 15
Languages: ar, cs, de, en, es, fr, hu, it, ja, ko, nl, pl, pt, ru, zh

Language Coverage (facilities with translation):
  en     │ ████████████████████ │ 100/100 (100%)
  es     │ ████████████████████ │ 100/100 (100%)
  fr     │ ████████████████████ │ 100/100 (100%)
  de     │ ████████████████████ │ 100/100 (100%)
  pt     │ ████████████████████ │ 100/100 (100%)
  ...

Translation Completeness:
  With translations: 100/100
  Without translations: 0/100
  Average translations per facility: 15

FACILITIES DATABASE VALIDATION & REPORT
──────────────────────────────────────────────────
  Total facilities in database: 100
  Facilities with translations: 100
  Active facilities: 100

Sample facilities with translation counts:
  • [   1] WiFi (+15 languages)
  • [   2] Swimming Pool (+15 languages)
  • [   3] Gym (+15 languages)
  • [ ... ]

Step 3: Verifying imported data...

✓ Import script completed successfully

Database Verification Results:

 metric                       | value
──────────────────────────────┼───────
 Total Facilities Imported:   |   100
 Facilities with Translations:|   100
 Active Facilities:           |   100

Sample of Imported Facilities:
 id | name             | language_count | languages
────┼──────────────────┼────────────────┼──────────────
  1 | WiFi             |             15 | [ar, cs, de, en, es, fr, hu, it, ja, ko, nl, pl, pt, ru, zh]
  2 | Swimming Pool    |             15 | [ar, cs, de, en, es, fr, hu, it, ja, ko, nl, pl, pt, ru, zh]
  3 | Gym              |             15 | [ar, cs, de, en, es, fr, hu, it, ja, ko, nl, pl, pt, ru, zh]
  ...

Language Coverage Report:
 language | facility_count | coverage_percent
──────────┼────────────────┼──────────────────
 en       |            100 |           100.00
 es       |            100 |           100.00
 fr       |            100 |           100.00
 de       |            100 |           100.00
 pt       |            100 |           100.00
 ...

════════════════════════════════════════════════════
✓ TEST COMPLETED SUCCESSFULLY
════════════════════════════════════════════════════

Summary:
  • 100 facilities fetched from LiteAPI
  • All language translations captured and saved
  • Data verified in local PostgreSQL database
  • Translation coverage report generated
```

## Verification Queries

After running the test, you can verify the data with these SQL queries:

### Check Total Facilities
```sql
SELECT COUNT(*) as total_facilities FROM hotel.facilities;
```

### Check Facilities with Translations
```sql
SELECT COUNT(*) as with_translations FROM hotel.facilities 
WHERE translations IS NOT NULL;
```

### View Sample Facility with All Translations
```sql
SELECT id, name, translations 
FROM hotel.facilities 
WHERE id = 1;
```

### Get All Languages for a Facility
```sql
SELECT jsonb_object_keys(translations) as language
FROM hotel.facilities 
WHERE id = 1
ORDER BY language;
```

### Get Translation in Specific Language
```sql
SELECT id, name, translations->>'en' as english_name
FROM hotel.facilities 
WHERE id = 1;
```

### Language Coverage Statistics
```sql
WITH lang_stats AS (
  SELECT key as language, COUNT(*) as count
  FROM hotel.facilities, jsonb_each(translations)
  GROUP BY key
)
SELECT 
  language,
  count,
  ROUND(100.0 * count / (SELECT COUNT(*) FROM hotel.facilities), 2) as coverage_percent
FROM lang_stats
ORDER BY count DESC;
```

### List All Facilities with Translation Count
```sql
SELECT 
  id,
  name,
  jsonb_object_keys(translations) as language_count
FROM hotel.facilities
ORDER BY id
LIMIT 20;
```

## Troubleshooting

### Issue: "LITEAPI_KEY is not set"
```bash
export LITEAPI_KEY="prod_1ca7e299-f889-4462-8e32-ce421ab66a93"
```

### Issue: "Cannot connect to database"
```bash
# Verify PostgreSQL is running
psql -l

# Check connection string
echo $DATABASE_URL
```

### Issue: "hotel.facilities table does not exist"
```bash
# Run migrations
npm run migrate

# Or manually
psql -d tripalfa -f database/static-db/migrations/20260304000002_facilities_static_database.sql
```

### Issue: "No recently updated facilities found"
- Check database user permissions
- Verify INSERT privileges on hotel.facilities table
- Check for constraint violations

### Issue: "Could not parse translations"
- May indicate JSON corruption
- Check PostgreSQL logs
- Try re-running with fresh migrations

## Performance Metrics

Expected performance for 100 facilities test:

| Metric | Value |
|--------|-------|
| API Fetch Time | 5-10 seconds |
| Database Insert Time | 10-15 seconds |
| Total Execution Time | 20-30 seconds |
| Facilities Imported | 100 |
| Languages per Facility | ~15 |
| Total Records Stored | 100 facilities + 1500 translation entries |
| Database Size | ~500 KB |

## Next Steps After Successful Test

1. **Review Results**
   - Check the translation coverage report
   - Verify all expected languages are present
   - Ensure all 100 facilities were imported

2. **Run Full Import**
   ```bash
   export LITEAPI_KEY="prod_1ca7e299-f889-4462-8e32-ce421ab66a93"
   unset SYNC_TEST_MODE
   npx ts-node database/static-db/scripts/sync-facilities-full.ts
   ```

3. **Schedule Regular Syncs**
   ```bash
   # Add to crontab for daily 2 AM sync
   0 2 * * * cd /path/to/project && LITEAPI_KEY=prod_xxx npx ts-node database/static-db/scripts/sync-facilities-full.ts
   ```

4. **Monitor Sync Operations**
   ```sql
   SELECT * FROM hotel.facilities_sync_metadata ORDER BY sync_completed_at DESC LIMIT 5;
   ```

5. **Set Up Alerts**
   - Monitor `hotel.facilities_sync_metadata` for failed syncs
   - Alert if sync takes longer than expected
   - Track translation coverage changes

## FAQ

**Q: Why are some facilities missing translations?**
A: LiteAPI may not return all language variants for every facility. This is expected. The test captures whatever is returned.

**Q: Can I test with a different number of facilities?**
A: Yes, set `SYNC_TEST_LIMIT=500` to test with 500 facilities instead of 100.

**Q: What if the API key expires?**
A: Contact LiteAPI support for a new production key. Update the script with the new key.

**Q: How often should I run the full import?**
A: Once daily is recommended. Facility data doesn't change frequently, so nightly syncs are sufficient.

**Q: Can I run multiple syncs at the same time?**
A: Not recommended. Use a cron job or queue to ensure sequential execution.

---

**Test Date**: 2026-03-04  
**Status**: Ready for execution  
**API Key**: Production key provided and embedded in test script