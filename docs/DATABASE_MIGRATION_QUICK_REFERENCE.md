# Database Migration: Quick Reference

## ⚡ 5-Minute Quick Start

```bash
# 1. Validate current state
npm run validate-db-migration

# 2. Populate all reference data (run once)
npm run import-duffel
npm run import-liteapi-reference
npm run seed-suppliers

# 3. Set up airline logos
export DATABASE_URL="postgresql://..."
npx tsx scripts/migrate-airline-logos-github.ts

# 4. Verify
curl http://localhost:3002/airlines?limit=5
```

## 📊 What Changed

### ❌ Removed (Phase 3 - Cleanup)
- `mishor_static/` - 2.6GB CSV dumps
- `services/ingest/static-logos/airline/` - Duplicate logos

### ✅ Now in PostgreSQL
- **Airlines**: 400+ IATA codes with logos
- **Airports**: 8000+ IATA/ICAO codes
- **Countries**: 250 countries with currencies
- **Currencies**: 180 exchange rates
- **Cities**: 10000+ city codes
- **Hotel Amenities**: 200+ feature categories
- **Board Types**: RO, BB, HB, FB, AI, UAI

### ✅ New Infrastructure
- **Dynamic Endpoint**: `/static/*` routes → PostgreSQL queries
- **Static-Data-Service**: Express.js on port 3002
- **Validation Script**: Check table population status
- **Import CLI**: Load reference data from suppliers

## 🚀 Commands Cheat Sheet

| Purpose | Command |
|---------|---------|
| Validate DB | `npm run validate-db-migration` |
| Seed base data | `npm run seed-suppliers` |
| Import all Duffel | `npm run import-duffel` |
| Import just airlines | `npm run import-duffel-airlines` |
| Import just airports | `npm run import-duffel-airports` |
| Import just cities | `npm run import-duffel-cities` |
| Import countries/currencies | `npm run import-liteapi-reference` |
| Full migration script | `npm run migrate-db-complete` |

## 🛠️ Common Tasks

### Task: Check if reference tables are populated
```bash
npm run validate-db-migration
```
Shows counts and status for all reference tables.

### Task: Add new airlines from Duffel
```bash
npm run import-duffel-airlines
# Replaces existing airlines with fresh data from Duffel
```

### Task: Set airline logos to CDN
```bash
# GitHub (free)
npx tsx scripts/migrate-airline-logos-github.ts

# Or manually update all airlines:
npm run db:studio  # Open Prisma Studio
# Find Airline table → Bulk edit logo_url field
```

### Task: Test static-data-service endpoints
```bash
# In one terminal
npm run dev:static-data

# In another terminal
curl http://localhost:3002/airlines?limit=5
curl http://localhost:3002/airports?q=lon&limit=10
curl http://localhost:3002/countries
```

## 📖 Full Documentation

See [DATABASE_MIGRATION_VALIDATION.md](./DATABASE_MIGRATION_VALIDATION.md) for:
- Detailed architecture overview
- Step-by-step validation procedures
- Data import troubleshooting
- Expected row counts
- CDN configuration options
- Complete checklist

## 🔍 Database Inspection

```bash
# Open Prisma Studio UI
npm run db:studio

# Query from CLI
npm run db:generate
npx prisma db execute --stdin --schema=database/prisma/schema.prisma
# Then type SQL queries

# Or use psql directly
psql "postgresql://postgres:postgres@localhost:5433/staticdatabase"
```

## 🚨 Important: API Keys Needed

For data imports to work, set these environment variables:

```bash
export DUFFEL_API_KEY="your-duffel-sandbox-key"
export LITEAPI_API_KEY="your-liteapi-key"
export DATABASE_URL="postgresql://..."
```

Check `.env.services` or `.env` for examples.

## 🔄 Before vs After Data Flow

### Before (CSV-based)
```
Frontend
  ↓
Local hardcoded data
  ↓
CSV files (mishor_static/)
  ↓
Potential stale data
```

### After (PostgreSQL)
```
Frontend → React Query
  ↓
Static-Data-Service (/static/*)
  ↓
PostgreSQL queries
  ↓
Always fresh reference data
  ↓
Fast (~100ms response)
```

## ✅ Completion Checklist

- [ ] Ran `npm run validate-db-migration` → All tables populated
- [ ] Ran `npm run import-duffel` → Airlines/airports imported
- [ ] Ran `npm run seed-suppliers` → Base data created
- [ ] Set up airline logo CDN (GitHub/Cloudflare/Custom)
- [ ] Tested `/airlines` endpoint → Returns logo URLs
- [ ] Frontend flight search loads without errors
- [ ] Airline logos display on flight results

---

**Status**: ✅ PostgreSQL migration complete. Ready for production use.

**Last Updated**: 2024 | CSV removal phase complete
