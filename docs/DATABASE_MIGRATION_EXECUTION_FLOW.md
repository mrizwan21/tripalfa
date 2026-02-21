# Database Migration: Execution Flow

## Visual Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│  START: npm run run-migration                                   │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: Database Connection Setup                               │
│                                                                  │
│  $ npm run setup-database                                       │
│                                                                  │
│  Choose:                                                        │
│  ├─ 1) Local Docker       (localhost:5433)                      │
│  ├─ 2) Neon Cloud         (ep-xxx.neon.tech)                    │
│  └─ 3) Custom             (manual URL)                          │
│                                                                  │
│  ✓ Verifies connection works                                    │
│  ✓ Saves for later use                                          │
│                                                                  │
│  ⏱️  Time: 1-2 minutes                                            │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: Validate Current State                                  │
│                                                                  │
│  $ npm run validate-db-migration                                │
│                                                                  │
│  Checks:                                                        │
│  ✅ Airline (active)         | Count: 0 → expect 400+          │
│  ✅ Airport (active)         | Count: 0 → expect 8000+         │
│  ✅ City (active)            | Count: 0 → expect 10000+        │
│  ✅ Country (active)         | Count: 0 → expect 250+          │
│  ✅ Currency (active)        | Count: 0 → expect 180+          │
│  ✅ HotelAmenity (active)    | Count: 0 → expect 200+          │
│  ✅ RoomAmenity (active)     | Count: 0 → expect 200+          │
│  ✅ BoardType (active)       | Count: 0 → expect 10+           │
│  ⚠️  Airline Logo Status     | 0 with CDN URL                  │
│                                                                  │
│  👉 If all empty → proceed to Step 3                           │
│  👉 If already populated → skip to Step 5                      │
│                                                                  │
│  ⏱️  Time: 30 seconds                                            │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
         ┌───────────────┴───────────────┐
         │ User Confirmation             │
         │ "Proceed with data imports?"  │
         │ (y/n)                         │
         └───────────────┬───────────────┘
                         │
              ┌──────────┴──────────┐
              │ YES                │ NO
             YES                   ▼
              │          "Skipping data imports"
              │          Goto Step 5
              ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 3a: Seed Base Data                                         │
│                                                                  │
│  $ npm run seed-suppliers                                       │
│                                                                  │
│  Creates:                                                       │
│  ✓ 5 Suppliers (Hotelbeds, LITEAPI, Duffel, Innstant)          │
│  ✓ 100-200 Hotel Amenities (Pool, Spa, Gym, Restaurant, etc)   │
│  ✓ 100-200 Room Amenities (WiFi, TV, AC, Safe, etc)            │
│  ✓ 10 Board Types (RO, BB, HB, FB, AI, UAI)                    │
│                                                                  │
│  ⏱️  Time: 30 seconds                                            │
│  Status: ✅ Seeding base data                                   │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 3b: Import Duffel Data                                     │
│                                                                  │
│  $ npm run import-duffel                                        │
│  (Or individually: import-duffel-airlines, -airports, -cities)  │
│                                                                  │
│  Imports:                                                       │
│  ✓ 400-600 Airlines           (AA, BA, LH, EK, etc)            │
│  ✓ 6000-8000 Airports         (JFK, LHR, CDG, ORD, etc)        │
│  ✓ 8000-15000 Cities          (New York, London, Paris, etc)   │
│  ✓ 1000+ Aircraft types       (A380, 747, 787, etc)            │
│                                                                  │
│  ⏱️  Time: 2-5 minutes                                           │
│  Status: 📊 Importing from Duffel API...                       │
│          ✅ 400 airlines ✓                                      │
│          ✅ 8000 airports ✓                                     │
│          ✅ 10000 cities ✓                                      │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 3c: Import LITEAPI Reference Data                          │
│                                                                  │
│  $ npm run import-liteapi-reference                             │
│                                                                  │
│  Imports:                                                       │
│  ✓ 240-250 Countries          (US, GB, FR, DE, JP, etc)        │
│  ✓ 160-180 Currencies         (USD, EUR, GBP, JPY, etc)        │
│  ✓ 100+ Languages             (EN, FR, DE, ES, etc)            │
│  ✓ 200+ Facility Types        (Hotel amenities)                │
│                                                                  │
│  ⏱️  Time: 1-2 minutes                                           │
│  Status: 📊 Importing from LITEAPI...                          │
│          ✅ 250 countries ✓                                     │
│          ✅ 180 currencies ✓                                    │
│          ✅ Languages & facilities ✓                            │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 4: Validate After Imports                                  │
│                                                                  │
│  $ npm run validate-db-migration                                │
│                                                                  │
│  Expected Results:                                              │
│  ✅ Airline (active)         | Count: 400+ ✓                   │
│  ✅ Airport (active)         | Count: 8000+ ✓                  │
│  ✅ City (active)            | Count: 10000+ ✓                 │
│  ✅ Country (active)         | Count: 250+ ✓                   │
│  ✅ Currency (active)        | Count: 180+ ✓                   │
│  ✅ HotelAmenity (active)    | Count: 100+ ✓                   │
│  ✅ RoomAmenity (active)     | Count: 100+ ✓                   │
│  ✅ BoardType (active)       | Count: 5+ ✓                     │
│  ⚠️  Airline Logo Status     | 400 without CDN URL (next step) │
│                                                                  │
│  ⏱️  Time: 30 seconds                                            │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
         ┌───────────────┴───────────────┐
         │ User Confirmation             │
         │ "Set up airline logo CDN?"    │
         │ (y/n)                         │
         └───────────────┬───────────────┘
                         │
              ┌──────────┴──────────┐
              │ YES                │ NO
             YES                   ▼
              │          "Skipping logo setup"
              │          Goto Step 6
              ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 5: Configure Airline Logo CDN                              │
│                                                                  │
│  Choose Provider:                                               │
│  ├─ 1) GitHub Repository (Free)                                │
│  │  └─ https://raw.githubusercontent.com/svg-use-it/...       │
│  │                                                              │
│  ├─ 2) Cloudflare (Free tier)                                  │
│  │  └─ https://cdn.example.com/airline-logos/...              │
│  │                                                              │
│  ├─ 3) AWS S3 + CloudFront (Enterprise)                        │
│  │  └─ https://s3.amazonaws.com/...                           │
│  │                                                              │
│  └─ 4) Custom (Manual)                                         │
│     └─ https://your-domain.com/logos/...                      │
│                                                                  │
│  If GitHub selected:                                            │
│  $ npx tsx scripts/migrate-airline-logos-github.ts              │
│  ✅ Updated 400+ airlines with CDN URLs                        │
│                                                                  │
│  ⏱️  Time: 1-2 minutes                                           │
│  Status: 🎨 Airline logos configured                           │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 6: Final Verification                                      │
│                                                                  │
│  $ npm run validate-db-migration                                │
│                                                                  │
│  Final Checks:                                                  │
│  ✅ All tables populated with expected row counts              │
│  ✅ Airline logos have CDN URLs                                │
│  ✅ ~40,000+ reference records total                           │
│                                                                  │
│  Test API Endpoints:                                            │
│  $ npm run dev:static-data &                                   │
│  $ curl http://localhost:3002/airlines?limit=3                │
│  $ curl http://localhost:3002/airports?q=lon                  │
│  $ curl http://localhost:3002/countries                        │
│                                                                  │
│  ⏱️  Time: 2 minutes                                             │
│  Status: ✅ Migration complete!                                │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ DONE: Database Migration Complete! 🎉                           │
│                                                                  │
│ Summary:                                                        │
│ ✅ Database configured and connected                           │
│ ✅ 400+ airlines imported                                      │
│ ✅ 8000+ airports imported                                     │
│ ✅ 10000+ cities imported                                      │
│ ✅ 250+ countries imported                                     │
│ ✅ 180+ currencies imported                                    │
│ ✅ 200+ amenities created                                      │
│ ✅ Airline logos configured from CDN                          │
│ ✅ ~40,000+ reference records total                           │
│                                                                  │
│ Next Steps:                                                     │
│ 1. Start static-data-service:                                  │
│    npm run dev:static-data                                     │
│                                                                  │
│ 2. Start booking-engine:                                       │
│    npm run dev --workspace=@tripalfa/booking-engine            │
│                                                                  │
│ 3. Test flight search with airline logos                       │
│                                                                  │
│ Total Time: ~10 minutes ⏱️                                      │
│ Status: 🟢 PRODUCTION READY                                    │
│                                                                  │
│ Database is now single source of truth for all static data!    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Command Reference

### Quick Start
```bash
npm run run-migration          # Full guided migration (interactive)
```

### Individual Commands
```bash
npm run setup-database         # Configure DB connection
npm run validate-db-migration  # Check current state
npm run seed-suppliers         # Seed base data
npm run import-duffel          # Import from Duffel
npm run import-liteapi-reference  # Import reference data
```

### Manual Logo Setup
```bash
npx tsx scripts/migrate-airline-logos-github.ts
```

### Testing
```bash
npm run dev:static-data &      # Start API server
curl http://localhost:3002/airlines?limit=5  # Test endpoint
npm run dev --workspace=@tripalfa/booking-engine  # Test frontend
```

---

## Success Indicators

### ✅ After Step 2 (Validation)
- Database connection works
- Tables exist but are empty (expected if first-time)

### ✅ After Step 3 (Data Import)
- Validation shows populated tables
- Actual counts match expected ranges
- Import logs show success messages

### ✅ After Step 4 (Verification)
- All reference tables populated
- Row counts match expectations
- No errors in logs

### ✅ After Step 5 (Logos)
- Airline table has logo_url values
- URLs point to CDN (not local paths)
- Sample check: `curl http://localhost:3002/airlines` returns logo URLs

### ✅ After Step 6 (Final)
- Frontend loads without 404 errors
- Airline logos display on flight results
- Network tab shows CDN requests
- Performance is good (~100ms response time)

---

## Time Breakdown

| Step | Activity | Duration |
|------|----------|----------|
| 1 | Database Setup | 1-2 min |
| 2 | Initial Validation | 30 sec |
| 3a | Seed Base Data | 30 sec |
| 3b | Duffel Import | 2-5 min |
| 3c | LITEAPI Import | 1-2 min |
| 4 | Final Validation | 30 sec |
| 5 | Logo CDN Setup | 1-2 min |
| 6 | Verification | 2 min |
| **Total** | **Complete Migration** | **~10 min** |

---

## Troubleshooting at Each Stage

### Stage 1: Database Connection
```bash
# If fails: Check Docker is running
docker compose ps

# Or check Neon is accessible
ping ep-xxx.neon.tech
```

### Stage 3a: Seed Base Data
```bash
# If fails: Delete and retry
npm run db:reset
npm run seed-suppliers
```

### Stage 3b: Duffel Import
```bash
# If slow: Check network
timeout 60 npm run import-duffel && echo "Completed" || echo "Timed out (OK, still running)"

# If fails: Check API key
echo $DUFFEL_API_KEY
```

### Stage 5: Logo Setup
```bash
# If fails: Run manually
npx tsx scripts/migrate-airline-logos-github.ts

# Verify
npm run db:studio  # Open Prisma to check airline.logo_url
```

---

## What Each Step Does

```
Step 1: Database Connection
└─ Detects your PostgreSQL instance
│  ├─ Local Docker
│  ├─ Neon Cloud
│  └─ Custom
└─ Verifies it's accessible
└─ Sets environment variable for next steps

Step 2: Validation
└─ Counts rows in each table
└─ Compares to expected values
└─ Shows what needs to be imported

Step 3: Data Import
├─ 3a: Creates base suppliers, amenities
├─ 3b: Fetches airlines from Duffel API
│       ├─ 400-600 airlines
│       ├─ 6000-8000 airports
│       └─ 8000-15000 cities
└─ 3c: Fetches reference data from LITEAPI
        ├─ 240-250 countries
        ├─ 160-180 currencies
        └─ 100+ languages

Step 4: Re-validate
└─ Confirms all imports succeeded
└─ Identifies if any data is still missing

Step 5: Configure CDN
└─ Fetches GitHub airline logo URLs
└─ Updates database with CDN URLs
└─ Now logos won't break if local files removed

Step 6: Final Test
└─ Verifies API endpoints work
└─ Tests database performance
└─ Confirms frontend can access data
```

---

**Ready to start?** `npm run run-migration`
