# Neon Database Cleanup & Rebuild Guide

## Overview

This guide provides step-by-step instructions for:

1. Removing legacy Neon-related Prisma scripts and configurations
2. Cleaning up Neon database instances
3. Rebuilding your database from scratch based on the new design

## What Was Removed

### Files Deleted

- ✅ `.env.neon` - Neon environment configuration
- ✅ `docker-compose.neon.yml` - Neon-specific Docker Compose configuration
- ✅ `scripts/cleanup-neon-static-data.ts` - Legacy Neon cleanup script (package.json reference removed)

### Files Updated

- ✅ `package.json` - Removed `cleanup-neon-static-data` script, added `db:reset` and `db:rebuild`
- ✅ `services/booking-service/Dockerfile` - Removed NEON reference from header
- ✅ `services/kyc-service/Dockerfile` - Removed NEON reference from header
- ✅ `infrastructure/templates/README.md` - Updated feature list
- ✅ `services/wallet-service/src/config/db.ts` - Updated comments (Neon → PostgreSQL)
- ✅ `apps/booking-engine/.env.test.staging` - Updated connection string (neondb_owner → postgres)
- ✅ `apps/booking-engine/.env.test.ci` - Updated connection string (neondb_owner → postgres)
- ✅ `apps/booking-engine/tests/helpers/global.setup.ts` - Updated test database URLs

### Important Note on Static Database

**The static database (PostgreSQL locally) remains untouched:**

- All references to `STATIC_DATABASE_URL` and `staticdatabase` are preserved
- Static data imports and configuration remain unchanged
- Local PostgreSQL instance continues to serve static data

## Deletion of Existing Neon Databases

To completely remove Neon databases:

1. **Access Neon Console**: <https://console.neon.tech/app/projects>

2. **Delete Neon Project**:
   - Select your project
   - Go to Settings → Delete Project
   - Confirm deletion

3. **Verify Deletion**:
   - Check that the Neon database is no longer accessible
   - Confirm that local `staticdatabase` PostgreSQL is still running

## Rebuilding Database from Scratch

### Step 1: Set Up Environment Variables

Create or update your `.env` file with the new database configuration:

```bash
# Use local PostgreSQL or PostgreSQL-compatible database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tripalfa_dev

# Static database (unchanged)
STATIC_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/staticdatabase

# Other required variables
NODE_ENV=development
```

### Step 2: Start PostgreSQL

If using Docker Compose locally:

```bash
docker-compose -f infrastructure/compose/docker-compose.yml up -d postgres
```

### Step 3: Generate Prisma Client

```bash
npm run db:generate
```

### Step 4: Reset & Rebuild Database

### Option A: Using the Rebuild Script (Recommended)

```bash
# Interactive mode (asks for confirmation)
npm run db:rebuild

# Non-interactive mode (skips confirmation)
npm run db:rebuild -- --skip-confirm

# With seed data (if available)
npm run db:rebuild -- --skip-confirm --seed
```

### Option B: Manual Steps

```bash
# Generate Prisma client
npm run db:generate

# Reset database (WARNING: deletes all data)
npm run db:reset

# Or push schema without reset
npm run db:push

# Apply migrations
npm run db:migrate
```

### Step 5: Verify Database

Open Prisma Studio to verify the schema:

```bash
npm run db:studio
```

This will open `http://localhost:5555` where you can inspect tables and data.

## New Database Scripts

Added to `package.json`:

```bash
# Build (generate Prisma client)
npm run db:generate

# Push schema to database
npm run db:push

# Reset database (⚠️ destructive)
npm run db:reset

# Rebuild database (interactive with safeguards)
npm run db:rebuild

# View database in Prisma Studio
npm run db:studio
```

## Migration from Neon to PostgreSQL

### Key Changes

1. **Connection String Format**:
   - Neon: `postgresql://neondb_owner:...@ep-xxx.neon.tech/neondb?sslmode=require`
   - PostgreSQL: `postgresql://postgres:password@localhost:5432/tripalfa_dev`

2. **SSL Configuration**:
   - Neon: Required SSL by default
   - PostgreSQL: SSL optional (configure as needed)

3. **Pool Sizing**:
   - Configuration remains in `services/wallet-service/src/config/db.ts`
   - Adjust `PG_MAX_CLIENTS`, `PG_MIN_CLIENTS` as needed

### Database User Credentials

New database scripts use standard PostgreSQL:

- User: `postgres` (or your configured user)
- Password: `postgres` (or your configured password)
- Database names: `tripalfa_dev`, `tripalfa_staging`, `tripalfa_test`

## Troubleshooting

### Database Connection Issues

```bash
# Test connection
psql postgresql://postgres:postgres@localhost:5432/tripalfa_dev

# Check PostgreSQL service
docker-compose -f infrastructure/compose/docker-compose.yml ps postgres
```

### Prisma Client Issues

```bash
# Regenerate client
npm run db:generate

# Clear cache and reinstall
rm -rf node_modules/.prisma
npm install
```

### Migration Conflicts

```bash
# If migrations conflict, reset and start fresh
npm run db:reset
npm run db:generate
npm run db:migrate
```

## Static Database Verification

Verify that the static database is still intact:

```bash
# Connect to static database
psql postgresql://postgres:postgres@localhost:5432/staticdatabase

# List tables (should see static data tables)
\dt
```

## Support & Documentation

- [Prisma Documentation](https://www.prisma.io/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [TripAlfa Database Setup Guide](../docs/complete-database-implementation-plan.md)

## Cleanup Completed ✅

- ❌ Removed Neon-specific configurations
- ❌ Removed Neon environment files
- ❌ Removed Neon Docker Compose setup
- ✅ Preserved static database configuration
- ✅ Added database rebuild scripts
- ✅ Updated connection strings for standard PostgreSQL

Your project is now ready to rebuild databases from scratch using the new PostgreSQL-based design!
