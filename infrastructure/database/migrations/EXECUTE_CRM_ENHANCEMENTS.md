# CRM Enhancements Migration Execution Guide

## Overview
This guide explains how to apply the CRM database enhancements to the finance database. The migration adds tier classification, lead scoring, and visitor analytics tables.

## Migration File
`20260331000001_add_crm_enhancements.sql`

## Prerequisites

### 1. Database Access
- Access to PostgreSQL `tripalfa_finance` database
- Sufficient privileges to create tables, alter tables, and create indexes
- Connection string for finance database

### 2. Environment Variables
Ensure these environment variables are set:
```bash
# For direct connection
export FINANCE_DATABASE_URL="postgresql://user:password@localhost:5432/tripalfa_finance"

# Or for the shared-database package
export CORE_DATABASE_URL="postgresql://user:password@localhost:5432/tripalfa_core"
export FINANCE_DATABASE_URL="postgresql://user:password@localhost:5432/tripalfa_finance"
export OPS_DATABASE_URL="postgresql://user:password@localhost:5432/tripalfa_ops"
export LOCAL_DATABASE_URL="postgresql://user:password@localhost:5432/tripalfa_local"
```

## Execution Methods

### Method 1: Direct PostgreSQL Client (Recommended)
```bash
# Navigate to migrations directory
cd infrastructure/database/migrations/archive

# Execute migration using psql
psql $FINANCE_DATABASE_URL -f 20260331000001_add_crm_enhancements.sql

# Or with explicit connection string
psql "postgresql://user:password@localhost:5432/tripalfa_finance" -f 20260331000001_add_crm_enhancements.sql
```

### Method 2: Using Prisma Migrate
```bash
# Run shared Prisma migration workflow from repository root
pnpm run db:migrate
pnpm run db:generate

# Note: the CRM SQL file here is an archived manual SQL migration.
# For that specific SQL file, use Method 1.
```

### Method 3: Programmatic Execution (Node.js)
```javascript
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const pool = new Pool({
    connectionString: process.env.FINANCE_DATABASE_URL,
  });

  try {
    const sql = fs.readFileSync(
      path.join(__dirname, '20260331000001_add_crm_enhancements.sql'),
      'utf8'
    );
    
    await pool.query(sql);
    console.log('Migration applied successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await pool.end();
  }
}

runMigration();
```

## Verification Steps

After applying the migration, verify the changes:

### 1. Check New Columns on crm_contact
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'crm_contact' 
AND table_schema = 'public'
ORDER BY ordinal_position;
```

Expected new columns:
- `tier` (text)
- `totalBookings` (integer)
- `totalSpent` (numeric)
- `bookingsCount` (integer)
- `openTicketsCount` (integer)
- `location` (text)

### 2. Verify New Tables Exist
```sql
-- Check all CRM tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'crm_%'
ORDER BY table_name;
```

Expected tables:
- `crm_contact`
- `crm_activity`
- `crm_campaign`
- `crm_campaign_contact`
- `crm_lead_score` (NEW)
- `crm_visitor_session` (NEW)
- `crm_visitor_page_view` (NEW)
- `crm_visitor_event` (NEW)

### 3. Test Foreign Key Constraints
```sql
-- Test crm_lead_score relation
INSERT INTO crm_contact (id, email) VALUES ('test_contact', 'test@example.com');
INSERT INTO crm_lead_score (id, contactId, email, score, grade) 
VALUES ('test_score', 'test_contact', 'test@example.com', 85, 'B');

-- Should succeed
```

### 4. Verify Indexes
```sql
-- Check indexes on crm_contact
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'crm_contact' 
AND schemaname = 'public';

-- Should include crm_contact_tier_idx
```

## Rollback Procedure

If needed, here's how to rollback the migration:

```sql
-- Drop new tables (in reverse dependency order)
DROP TABLE IF EXISTS crm_visitor_event;
DROP TABLE IF EXISTS crm_visitor_page_view;
DROP TABLE IF EXISTS crm_visitor_session;
DROP TABLE IF EXISTS crm_lead_score;

-- Remove new columns from crm_contact
ALTER TABLE crm_contact 
DROP COLUMN IF EXISTS tier,
DROP COLUMN IF EXISTS totalBookings,
DROP COLUMN IF EXISTS totalSpent,
DROP COLUMN IF EXISTS bookingsCount,
DROP COLUMN IF EXISTS openTicketsCount,
DROP COLUMN IF EXISTS location;

-- Drop the tier index
DROP INDEX IF EXISTS crm_contact_tier_idx;
```

## Service Updates Required

After database migration, update these services:

### 1. CRM Service
Already updated to use finance database. Verify:
- `packages/booking-service/src/database.ts` uses the shared finance DB connection strategy
- Environment variable `FINANCE_DATABASE_URL` is set
- Service restarts successfully

### 2. Contact Service
Check if it needs updating (may also need finance database):
```typescript
// Current: uses shared database client
// May need to update to finance database if accessing CRM tables
```

### 3. Regenerate Prisma Client
```bash
pnpm run db:generate
```

## Troubleshooting

### Error: "relation already exists"
The migration uses `IF NOT EXISTS` clauses, so this error shouldn't occur. If it does, the tables already exist.

### Error: "permission denied"
Ensure the database user has:
- `CREATE TABLE` privilege
- `ALTER TABLE` privilege on `crm_contact`
- `CREATE INDEX` privilege

### Error: "column already exists"
The migration uses `IF NOT EXISTS` for columns too. If columns already exist, the migration will skip them.

### Connection Issues
Verify:
- Database is running
- Connection string is correct
- Firewall allows connections (if remote)

## Post-Migration Tasks

1. **Update Application Code**: Ensure code uses new fields (tier, lead score, etc.)
2. **Data Migration**: Populate tier fields based on existing customer data
3. **Monitoring**: Set up monitoring for new tables
4. **Backup**: Take a database backup after successful migration

## Support
For issues, contact the database team or refer to:
- `docs/README.md`
- `docs/operations/DATABASE_POLICY.md`
- Prisma documentation
- PostgreSQL documentation
