# Database Rebuild Recovery Guide

<!-- cSpell:ignore psql datname dropdb createdb -->

## What Happened

Your databases have old v1 schemas that conflict with the new v2 DDL. The verification script found:

### Critical Issues Found

1. **Hotel schema incomplete**:
   - ✗ `hotel.hotels` table NOT found
   - ✗ `hotel.hotel_details` table NOT found
   - ✗ `hotel.hotel_images` table NOT found
   - ✗ Column `is_detail_fetched` missing

   **Root cause**: Tables were created but not with the v2 structure; v1 had different schema

2. **Wallet ledger not properly linked**:
   - ✗ FK to `wallet_transactions` NOT found
   - ✗ FK to `wallets` NOT found

   **Root cause**: Old schema didn't have these relationships

3. **Missing FK relationships**:
   - ✗ `rule_analysis` → `rules` FK missing
   - ✗ `commission_settlements` → `commission_rules` FK missing

   **Root cause**: Old schema wasn't updated with v2 design

4. **Performance indexes missing**:
   - ✗ Partial index on `hotel.hotels(is_detail_fetched)`
   - ✗ GIN trigram index on `hotel.hotels(name)`

   **Root cause**: Indexes weren't created because tables didn't have v2 structure

5. **PostGIS not installed**:
   - ℹ️ Optional: Only needed if using geo-proximity queries
   - ℹ️ Not critical for basic functionality

### Why This Happened

The SQL files used `CREATE TABLE` without `CREATE TABLE IF NOT EXISTS`, which means:

- First time: Tables created successfully
- Subsequent runs: Conflicts with existing tables that have different schemas

The best solution is to **drop and rebuild clean**.

---

## Recovery: Three Options

### Option A: Automated Clean Rebuild (RECOMMENDED)

**Time**: 5 minutes  
**Risk**: Low (backups created automatically)

```bash
# Make script executable
chmod +x rebuild-databases-clean.sh

# Run it (will backup old databases before dropping)
bash rebuild-databases-clean.sh
```

The script will:

1. ✅ Backup existing databases to `database/backups/pre-v2-migration/`
2. ✅ Drop all 4 old databases
3. ✅ Create fresh databases
4. ✅ Load v2 schemas in correct order
5. ✅ Run verification

---

### Option B: Manual Clean Rebuild

**Time**: 10 minutes  
**Risk**: Low (you control each step)

```bash
# 1. Backup existing databases (optional but recommended)
for db in tripalfa_local tripalfa_core tripalfa_ops tripalfa_finance; do
  pg_dump "$db" > "database/backups/${db}_backup_$(date +%Y%m%d_%H%M%S).sql"
done

# 2. Drop old databases
psql -U postgres -c "DROP DATABASE IF EXISTS tripalfa_local CASCADE;"
psql -U postgres -c "DROP DATABASE IF EXISTS tripalfa_core CASCADE;"
psql -U postgres -c "DROP DATABASE IF EXISTS tripalfa_ops CASCADE;"
psql -U postgres -c "DROP DATABASE IF EXISTS tripalfa_finance CASCADE;"

# 3. Create fresh databases
psql -U postgres -c "CREATE DATABASE tripalfa_local;"
psql -U postgres -c "CREATE DATABASE tripalfa_core;"
psql -U postgres -c "CREATE DATABASE tripalfa_ops;"
psql -U postgres -c "CREATE DATABASE tripalfa_finance;"

# 4. Load v2 schemas (IN THIS ORDER)
psql -d tripalfa_local -f tripalfa_local.sql
psql -d tripalfa_core -f tripalfa_core.sql
psql -d tripalfa_ops -f tripalfa_ops.sql
psql -d tripalfa_finance -f tripalfa_finance.sql

# 5. Verify
bash verify-databases.sh
```

---

### Option C: Keep v1 and Migrate Data

**Time**: 1-2 hours  
**Risk**: Medium (complex schema transformation)

If you have data in v1 that needs to be preserved, follow the migration guide in:

- `docs/SCHEMA_CHANGES_V2.md` → "Data Migration Path"

This requires custom SQL scripts to transform data between schemas.

---

## PostGIS Note

The v2 schema includes spatial indexes for geo-proximity hotel search, but PostGIS is optional:

- **If you need geo queries**: Install PostGIS on your PostgreSQL

  ```bash
  brew install postgresql@14  # Includes PostGIS
  # or via plain PostgreSQL: CREATE EXTENSION postgis;
  ```

- **If you don't need geo queries**: Ignore the PostGIS errors; the schema will work fine

The v2 schema gracefully handles missing PostGIS (all other features work).

---

## Next Steps After Rebuild

### 1. Verify Clean Install

```bash
bash verify-databases.sh
```

You should see all green checkmarks ✓

### 2. Update Environment (.env)

```bash
# Make sure these are set correctly
export DATABASE_URL_LOCAL=postgresql://user:password@localhost:5432/tripalfa_local
export DATABASE_URL_CORE=postgresql://user:password@localhost:5432/tripalfa_core
export DATABASE_URL_OPS=postgresql://user:password@localhost:5432/tripalfa_ops
export DATABASE_URL_FINANCE=postgresql://user:password@localhost:5432/tripalfa_finance
```

### 3. Regenerate Prisma Clients

```bash
npm run db:generate
```

### 4. Test Integration

```bash
# Spot-check new schema
psql -d tripalfa_local -c "SELECT COUNT(*) FROM hotel.hotels;"
psql -d tripalfa_core -c "SELECT COUNT(*) FROM wallet_ledger;"
psql -d tripalfa_finance -c "SELECT COUNT(*) FROM campaigns WHERE type='internal';"
```

### 5. Update Service Code

Update services to use new multi-database setup:

- See: `docs/SERVICE_INTEGRATION_GUIDE.md` for code examples

---

## Recovery Checklist

- [ ] Backup existing databases (automated if using `rebuild-databases-clean.sh`)
- [ ] Drop old databases (automated or manual)
- [ ] Create fresh databases (automated or manual)
- [ ] Load v2 schemas in order (automated or manual)
- [ ] Run `bash verify-databases.sh` and confirm all ✓
- [ ] Update `.env` with correct connection strings
- [ ] Run `npm run db:generate`
- [ ] Spot-check schema with sample queries
- [ ] Update service code
- [ ] Run integration tests

---

## Troubleshooting

### "Cannot drop database because it's in use"

```bash
# Terminate active connections
psql -U postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='tripalfa_local' AND pid <> pg_backend_pid();"

# Then drop
psql -U postgres -c "DROP DATABASE tripalfa_local CASCADE;"
```

### "Extension postgis does not exist"

This is non-critical. PostGIS is optional for geo queries.

- If you don't need geo-proximity search, ignore it
- If you do need it, install PostGIS first: `brew install postgresql@14`

### "Schema conflicts still happening"

Drop and recreate databases fresh:

```bash
bash rebuild-databases-clean.sh
```

### "Verification script shows failures"

After rebuild, verify again:

```bash
bash verify-databases.sh
```

If still fails, check:

1. All databases exist: `psql -lqt | grep tripalfa`
2. All schemas created: `psql -d tripalfa_local -c "\dn+"`
3. Key tables exist: `psql -d tripalfa_local -c "\dt hotel.*"`

---

## What Changed From First Attempt

| Issue                | Root Cause                            | Resolution                       |
| -------------------- | ------------------------------------- | -------------------------------- |
| Tables already exist | CREATE TABLE without IF NOT EXISTS    | Drop and recreate fresh          |
| Schema conflicts     | Old v1 schema incompatible with v2    | Clean rebuild handles this       |
| PostGIS error        | Optional extension not installed      | Non-critical; handled gracefully |
| FK violations        | Tables missing expected columns       | v2 schema fixes all FKs          |
| Index errors         | Tables didn't exist with v2 structure | Rebuilding creates all indexes   |

---

## Recommended Path Forward

1. **Run automated clean rebuild** (simplest):

   ```bash
   bash rebuild-databases-clean.sh
   ```

2. **Verify all checks pass**:

   ```bash
   bash verify-databases.sh
   ```

3. **Proceed with integration** (see docs/SERVICE_INTEGRATION_GUIDE.md)

---

## Files That Help

| File                                | Purpose                                 |
| ----------------------------------- | --------------------------------------- |
| `rebuild-databases-clean.sh`        | Automated recovery script (recommended) |
| `verify-databases.sh`               | Validation after rebuild                |
| `DATABASE_REBUILD_GUIDE.md`         | Complete rebuild reference              |
| `docs/SCHEMA_CHANGES_V2.md`         | Schema change details                   |
| `docs/SERVICE_INTEGRATION_GUIDE.md` | Code examples                           |

---

**Estimated time to recover**: 5 minutes (automated) to 15 minutes (manual)

Ready to proceed? Run: `bash rebuild-databases-clean.sh`
