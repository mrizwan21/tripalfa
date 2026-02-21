# Static Data Migration: CSV to PostgreSQL

## Executive Summary

You've successfully cleaned up 2.6GB of CSV dumps and duplicate airline logo files. Now we need to:
1. ✅ **Validate PostgreSQL is populated** with all reference data
2. ✅ **Configure airline logos** to serve from a CDN instead of local files

This document outlines the current state, validation procedures, and necessary fixes.

---

## Current Architecture

### Data Flow (Post-Migration)
```
Frontend Pages (Flight/Hotel Search)
    ↓
React Query Hooks (useStaticData.ts)
    ↓
Static-Data-Service (/static/* endpoints)
    ↓
PostgreSQL Reference Tables
    ↓
Reference Data (Airlines, Airports, Countries, Amenities, etc.)
```

### Before (Removed)
- ❌ **CSVs**: `mishor_static/*.csv` (2.6GB) - DELETED
- ❌ **Local Logos**: `/services/ingest/static-logos/airline/*.png` - DELETED

### After (Current)
- ✅ **PostgreSQL Schema**: Fully defined models (Airline, Airport, City, Country, Currency, Hotel Amenities, Board Types, etc.)
- ✅ **Static-Data-Service**: Express.js server with 18+REST endpoints
- ✅ **Data Import Tools**: CLI commands to populate tables
- ⏳ **Data Population**: NEEDS VERIFICATION
- ⏳ **Airline Logos**: NEEDS CDN CONFIGURATION

---

## Step 1: Validate PostgreSQL Population

### 1a. Check Your Database Connection

First, identify which database you're using:

```bash
# Show current DATABASE_URL
grep -E "DATABASE_URL|STATIC_DATABASE_URL" .env .env.services
```

Expected output:
- **Local Docker**: `postgresql://postgres:postgres@localhost:5433/staticdatabase`
- **Neon Cloud**: `postgresql://neondb_owner:...@ep-xxx.c-4.us-east-1.aws.neon.tech/neondb`

### 1b. Run the Validation Script

```bash
# Set correct DATABASE_URL if needed
export DATABASE_URL="postgresql://postgres:postgres@localhost:5433/staticdatabase"

# Run validation
npm run validate-db-migration
```

### 1c. Interpret the Results

#### Expected Output (All OK):
```
✅ Airline (active)             | Count: 400+ (expected: 400)
✅ Airport (active)             | Count: 8000+ (expected: 8000)
✅ City (active)                | Count: 10000+ (expected: 10000)
✅ Country (active)             | Count: 250+ (expected: 250)
✅ Currency (active)            | Count: 180+ (expected: 180)
✅ HotelAmenity (active)        | Count: 50+ (expected: 200)
✅ BoardType (active)           | Count: 5+ (expected: 10)
✅ Destination (active)         | Count: 100+ (expected: 1000)
✅ Supplier (active)            | Count: 3+ (expected: 5)
```

#### If Critical Issues Found:
```
❌ Airline (active)             | Count: 0 (expected: 400)
⚠️ Airport (active)             | Count: 100 (expected: 8000)
❌ Country (active)             | Count: 0 (expected: 250)
```

---

## Step 2: Populate Missing Data

If any tables are empty/low row counts, run these commands in order:

### 2a. Seed Base Data (Suppliers, Board Types, Amenities)
```bash
npm run seed-suppliers
```
This creates:
- Supplier configurations (Hotelbeds, LITEAPI, Duffel, Innstant)
- Hotel amenities (100+)
- Room amenities (100+)
- Board types (RO, BB, HB, FB, AI, UAI)

### 2b. Import Duffel Data (Airlines, Airports, Cities)
```bash
npm run import-duffel-airlines
npm run import-duffel-airports
npm run import-duffel-cities
```

Or all at once:
```bash
npm run import-duffel
```

### 2c. Import Reference Data (Countries, Currencies, Languages)
```bash
npm run import-liteapi-reference
```

### 2d. Full Import (Recommended for First-Time Setup)
```bash
# Set API credentials if not already set
export DUFFEL_API_KEY="your-key"
export LITEAPI_API_KEY="your-key"

# Run full import
npm run import-duffel
npm run import-liteapi-reference
```

---

## Step 3: Configure Airline Logo CDN

### Current Problem
- Frontend expects `logo_url` in airline responses
- Local files (`/services/ingest/static-logos/airline/`) are deleted
- CDN not configured

### Frontend Code (Already Compatible)
```typescript
// apps/booking-engine/src/pages/FlightSearch.tsx
const dbAirline = dbAirlinesMap.get(code);
const logo = dbAirline?.logo_url || `/airline-logos/${code}.png`;
// ↑ Falls back to local path if DB logo_url is empty
```

### Solution (Choose One)

#### Option A: External CDN (Recommended)

1. **Choose a CDN provider**:
   - Cloudflare (FREE tier available)
   - AWS S3 + CloudFront
   - GitHub Pages
   - Gravatar (Free airline icons)

2. **Update Airline Model with CDN URL**:

```typescript
// Create a migration or update-script to set logo_url
// Example: Update airlines with Gravatar or custom CDN

await prisma.airline.updateMany({
  where: { is_active: true },
  data: {
    // Option 1: GitHub Repository (Free, reliable)
    logo_url: `https://raw.githubusercontent.com/svg-use-it/airline-logos/master/logos/{iata_code}.png`,
    
    // Option 2: Your custom CDN
    // logo_url: `https://cdn.tripalfa.com/airline-logos/{iata_code}.png`,
  }
});
```

3. **Update static-data-service** to transform logo URLs:

```typescript
// services/static-data-service/src/index.ts
app.get('/airlines', async (req, res) => {
  const airlines = await prisma.airline.findMany({
    where: { is_active: true },
    select: { iata_code: true, name: true, logo_url: true },
  });
  
  // Transform URLs if needed
  const withCdnUrls = airlines.map(airline => ({
    ...airline,
    // Use stored URL or fallback
    logo_url: airline.logo_url || 
      `${process.env.AIRLINE_LOGO_CDN}/${airline.iata_code}.png`
  }));
  
  res.json({ data: withCdnUrls });
});
```

#### Option B: GitHub Repository (Free & Easy)

Use an existing public airline logo repository:

```bash
# 1. Create script to populate Airline.logo_url
cat > scripts/set-airline-logos-github.ts << 'EOF'
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const CDN_BASE = 'https://raw.githubusercontent.com/svg-use-it/airline-logos/master/logos';

async function main() {
  const airlines = await prisma.airline.findMany({
    where: { is_active: true },
  });
  
  for (const airline of airlines) {
    await prisma.airline.update({
      where: { id: airline.id },
      data: {
        logo_url: `${CDN_BASE}/${airline.iata_code.toLowerCase()}.png`
      }
    });
  }
  
  console.log(`✅ Updated ${airlines.length} airlines with CDN URLs`);
}

main().finally(() => prisma.$disconnect());
EOF

# 2. Run it
npx tsx scripts/set-airline-logos-github.ts
```

#### Option C: Local Static Files (Using Static-Data-Service)

If you want to serve from a local asset folder:

```bash
# 1. Store logos somewhere accessible
mkdir -p services/static-data-service/public/airline-logos

# 2. Add express static middleware
app.use('/static-logos', express.static(path.join(__dirname, '../public')));

# 3. Update Airline.logo_url to relative path
await prisma.airline.updateMany({
  data: {
    logo_url: `/static-logos/airline-logos/{iata_code}.png`
  }
});
```

### Verification

After configuring CDN:

```bash
# Test the endpoint
curl http://localhost:3002/airlines?limit=5

# Expected response:
{
  "data": [
    {
      "iata_code": "EK",
      "name": "Emirates",
      "logo_url": "https://cdn.example.com/airline-logos/ek.png"
    },
    ...
  ]
}
```

---

## Complete Checklist

- [ ] **1. Database Validation**
  - [ ] Run `npm run validate-db-migration`
  - [ ] All tables show "OK" status
  - [ ] Record actual row counts from output

- [ ] **2. Data Population**
  - [ ] Ran `npm run seed-suppliers`
  - [ ] Ran `npm run import-duffel` (or individual commands)
  - [ ] Ran `npm run import-liteapi-reference`
  - [ ] Re-ran validation - all tables populated

- [ ] **3. Airline Logo CDN**
  - [ ] Chose CDN provider (GitHub/Cloudflare/AWS)
  - [ ] Updated Airline.logo_url field in PostgreSQL
  - [ ] Updated static-data-service to serve CDN URLs
  - [ ] Tested `/airlines` endpoint returns logo URLs
  - [ ] Verified frontend displays airline logos correctly

- [ ] **4. Testing**
  - [ ] Frontend flight search loads without 404 errors
  - [ ] Airline logos display for all flights
  - [ ] Network panel shows logos coming from CDN
  - [ ] Database queries fast (response time < 100ms)

---

## Troubleshooting

### Issue: "Database does not exist"
**Solution**: Check `DATABASE_URL` environment variable
```bash
# For local Docker:
export DATABASE_URL="postgresql://postgres:postgres@localhost:5433/staticdatabase"

# For Neon Cloud:
export DATABASE_URL="postgresql://neondb_owner:...@ep-xxx.neon.tech/neondb?sslmode=require"
```

### Issue: "Airlines table empty but script said OK"
**Solution**: Duffel import might have failed silently
```bash
# Check logs
npm run import-duffel 2>&1 | tail -100

# If API key missing:
export DUFFEL_API_KEY="your-duffel-sandbox-key"
npm run import-duffel
```

### Issue: "Airline logos still not showing"
**Solution**: Check three places:
1. **Database**: `SELECT COUNT(*) FROM "Airline" WHERE logo_url IS NOT NULL;`
2. **Static-Data-Service**: Curl `/airlines` endpoint
3. **Frontend**: Network tab - are URLs being called?

### Issue: "Static-data-service fails to start"
**Solution**: Unknown models or missing Prisma client
```bash
# Regenerate Prisma client
npm run db:generate

# Rebuild static-data-service
npm run build --workspace=@tripalfa/static-data-service

# Restart
npm run dev:static-data
```

---

## Reference Data Counts (Expected After Full Import)

| Table | Expected | Notes |
|-------|----------|-------|
| Airline | 400-600 | All active airlines from Duffel |
| Airport | 6000-8000 | Major airports worldwide |
| City | 8000-15000 | IATA city codes |
| Country | 240-250 | All UN countries |
| Currency | 160-180 | Active world currencies |
| HotelAmenity | 100-200 | Feature categories |
| RoomAmenity | 100-200 | Room-level features |
| BoardType | 5-10 | Meal plan types (RO, BB, HB, FB, AI, UAI) |
| Supplier | 3-5 | Hotelbeds, LITEAPI, Duffel, Innstant |
| Destination | 1000-5000 | Popular travel destinations |

---

## CLI Commands Reference

```bash
# Validation
npm run validate-db-migration

# Seeding
npm run seed-suppliers

# Duffel Imports
npm run import-duffel              # All (airlines, airports, cities, aircraft, loyalty)
npm run import-duffel-airlines     # Just airlines
npm run import-duffel-airports     # Just airports
npm run import-duffel-cities       # Just cities

# Reference Data
npm run import-liteapi-reference   # Countries, currencies, languages, facility types

# Hotel Data (if needed)
npm run import-liteapi-hotels      # Hotel inventory
npm run import-hotelbeds           # Hotelbeds inventory
```

---

## Architecture After Migration

```mermaid
graph LR
    FE["Frontend<br/>(Flight/Hotel Pages)"]
    RQ["React Query<br/>(useStaticData.ts)"]
    API["Static-Data-Service<br/>(port 3002)"]
    DB["PostgreSQL<br/>(Neon or Local)"]
    CDN["CDN/GitHub<br/>(Airline Logos)"]
    
    FE -->|HTTP| RQ
    RQ -->|/airlines, /airports| API
    API -->|queries| DB
    API -->|logo_url field| CDN
    
    style FE fill:#e1f5ff
    style RQ fill:#c8e6c9
    style API fill:#fff9c4
    style DB fill:#f8bbd0
    style CDN fill:#b2dfdb
```

### Data Lifetime
- **Reference Data**: Updated daily/weekly via import scripts
- **Hotel Amenities**: Synced from suppliers (Hotelbeds, LITEAPI)
- **Airline Logos**: Updated manually when airlines change (rare)

---

## Next Steps

1. **Immediate** (Today):
   - [ ] Run validation script to check current state
   - [ ] Document any missing data
   
2. **Short-term** (This week):
   - [ ] Run data import commands
   - [ ] Set up airline logo CDN
   - [ ] Verify frontend displays all data correctly

3. **Long-term** (This month):
   - [ ] Automate data imports (cronjobs/scheduler)
   - [ ] Monitor data freshness
   - [ ] Set up alerts for failed imports

---

## Files Modified/Created

### New Files
- ✅ `scripts/validate-db-migration.ts` - Database validation script
- ✅ `docs/DATABASE_MIGRATION_VALIDATION.md` - This document

### Modified Files
- ✅ `package.json` - Added validation and import scripts

### Removed Files (Phase 3)
- ✅ `mishor_static/` - 2.6GB CSV dumps (DELETED)
- ✅ `services/ingest/static-logos/airline/` - Duplicate logos (DELETED)

---

## Support

If you encounter issues during migration:

1. **Check logs**: `npm run import-duffel 2>&1 | grep -i error`
2. **Verify database**: `npm run db:studio` - Open Prisma Studio
3. **Test endpoint**: `curl http://localhost:3002/airlines?limit=5`
4. **Check schema**: `npx prisma schema validate`

For Neon database specifically, see [NEON_DATABASE_CONNECTION.md](./NEON_DATABASE_CONNECTION.md).
