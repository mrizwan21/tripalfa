# TripAlfa Database v2.0 — Documentation Index

Complete rebuild materials for the TripAlfa multi-database schema v2.0, incorporating the updated ERD diagram with corrected hotel/detail split, consolidated campaigns, complete wallet ledger traceability, and enhanced cross-database reference patterns.

---

## 📋 Quick Navigation

### For First-Time Setup

1. Start here: **[DATABASE_V2_SUMMARY.md](DATABASE_V2_SUMMARY.md)** (5 min read)
2. Then follow: **[DATABASE_REBUILD_GUIDE.md](DATABASE_REBUILD_GUIDE.md)** (10 min read)
3. Run verification: `bash verify-databases.sh`

### For Developers

1. Integration code examples: **[docs/SERVICE_INTEGRATION_GUIDE.md](docs/SERVICE_INTEGRATION_GUIDE.md)**
2. Schema change details: **[docs/SCHEMA_CHANGES_V2.md](docs/SCHEMA_CHANGES_V2.md)**

### For Data Migration (v1 → v2)

1. See: **[docs/SCHEMA_CHANGES_V2.md](docs/SCHEMA_CHANGES_V2.md)** → "Data Migration Path" section

### For Troubleshooting

1. See: **[DATABASE_REBUILD_GUIDE.md](DATABASE_REBUILD_GUIDE.md)** → "Troubleshooting" section
2. Run: `bash verify-databases.sh`

---

## 📁 Files Included

### SQL Files (Ready to Execute)

| File                   | Size        | Purpose                                                | Exec. Order |
| ---------------------- | ----------- | ------------------------------------------------------ | ----------- |
| `tripalfa_local.sql`   | 342 lines   | Static reference data (shared, hotel, flight schemas)  | 1️⃣ First    |
| `tripalfa_core.sql`    | 537 lines   | Core app (users, companies, bookings, wallets, KYC)    | 2️⃣ Second   |
| `tripalfa_ops.sql`     | 327 lines   | Operations (notifications, documents, rules, disputes) | 3️⃣ Third    |
| `tripalfa_finance.sql` | 513 lines   | Finance (suppliers, invoicing, loyalty, campaigns)     | 4️⃣ Fourth   |
| `tripalfa_all_ddl.sql` | 1,825 lines | **Complete bundle** with full documentation header     | Optional    |

**Status**: ✅ All files tested and ready for production

### Documentation Files

#### Root Directory

| File                                                       | Purpose                                            | Audience    | Reading Time |
| ---------------------------------------------------------- | -------------------------------------------------- | ----------- | ------------ |
| **[DATABASE_V2_SUMMARY.md](DATABASE_V2_SUMMARY.md)**       | Quick overview and checklist                       | Everyone    | 5 min        |
| **[DATABASE_REBUILD_GUIDE.md](DATABASE_REBUILD_GUIDE.md)** | Complete rebuild instructions with troubleshooting | DevOps/DBAs | 15 min       |
| **[verify-databases.sh](verify-databases.sh)**             | Automated verification script                      | Everyone    | Run: 2 min   |

#### Docs Directory

| File                                                                       | Purpose                                       | Audience              | Reading Time |
| -------------------------------------------------------------------------- | --------------------------------------------- | --------------------- | ------------ |
| **[docs/SCHEMA_CHANGES_V2.md](docs/SCHEMA_CHANGES_V2.md)**                 | Before/after comparison, migration strategies | Developers/Architects | 20 min       |
| **[docs/SERVICE_INTEGRATION_GUIDE.md](docs/SERVICE_INTEGRATION_GUIDE.md)** | TypeScript code examples for all queries      | Developers            | 30 min       |

#### Reference Files

| File                              | Purpose                   | Audience          |
| --------------------------------- | ------------------------- | ----------------- |
| `tripalfa_corrected_erd_v2.html`  | Interactive ER diagram    | Visual learners   |
| `.github/copilot-instructions.md` | Repo-specific AI guidance | AI agents/Copilot |

---

## 🔑 Key Changes at a Glance

### tripalfa_local (Static Reference Data)

✅ **hotels + hotel_details split**

- `hotels`: 2.9M rows, search-optimized
- `hotel_details`: 2.2M rows, detail-optimized (one-to-one FK)
- `hotel_images`: Separate table (no longer bloats searches)
- `is_detail_fetched` flag for async sync tracking

✅ **Clean vendor-prefix removal**

- All `liteapi_*` tables consolidated into schemas
- All `duffel_*` tables removed
- Canonical `shared` schema for cross-cutting reference data

✅ **Three clean schemas**

- `shared`: Countries, currencies, languages, exchange rates
- `hotel`: Hotels, rooms, reviews, facilities
- `flight`: Airports, airlines, aircraft, loyalty programs

### tripalfa_core (Core Application)

✅ **Flight tables removed** (now in tripalfa_local)
✅ **wallet_ledger enhanced**:

- Explicit FK to `wallet_transactions` (which generated this ledger entry)
- Explicit FK to `wallets` (which owns this balance)
- Enables complete audit trail

### tripalfa_ops (Operations)

✅ **rule_analysis added** with FK to `rules`
✅ **settlements FK'd to disputes** (was missing)

### tripalfa_finance (Finance)

✅ **campaigns consolidated**: Single table (merged campaign + marketing_campaign)
✅ **discount_coupons enhanced**: FK to campaigns
✅ **commission_settlements enhanced**: FKs to both rules and bookings
✅ **supplier_sync_logs added**: Track supplier sync status and history

---

## 🚀 Quick Start

### Option A: Read First, Execute Later

```bash
# 1. Read overview
cat DATABASE_V2_SUMMARY.md

# 2. Read rebuild guide
cat DATABASE_REBUILD_GUIDE.md

# 3. Create databases (when ready)
psql -U postgres -c "CREATE DATABASE tripalfa_local;"
psql -U postgres -c "CREATE DATABASE tripalfa_core;"
psql -U postgres -c "CREATE DATABASE tripalfa_ops;"
psql -U postgres -c "CREATE DATABASE tripalfa_finance;"

# 4. Load schemas
psql -d tripalfa_local -f tripalfa_local.sql
psql -d tripalfa_core -f tripalfa_core.sql
psql -d tripalfa_ops -f tripalfa_ops.sql
psql -d tripalfa_finance -f tripalfa_finance.sql

# 5. Verify
bash verify-databases.sh
```

### Option B: Execute Bundle

```bash
# Use the all-in-one file (same result, slightly more convenient)
psql -U postgres -f tripalfa_all_ddl.sql
bash verify-databases.sh
```

---

## 📚 Documentation Breakdown

### DATABASE_V2_SUMMARY.md

**Length**: ~2 pages | **Time**: 5 minutes | **Audience**: Everyone

Overview document with:

- Quick start (3-step rebuild)
- Summary of all changes
- File reference table
- Key improvements
- Cross-database patterns
- Service-specific guidance
- Verification checklist
- Next tasks breakdown (immediate, short-term, medium-term)
- Rollback plan

**Use this when**: You need a high-level understanding before diving in

### DATABASE_REBUILD_GUIDE.md

**Length**: ~10 pages | **Time**: 15 minutes | **Audience**: DevOps/DBAs

Comprehensive guide with:

- Architecture overview
- File summary (lines of code, purposes)
- Execution instructions (step-by-step)
- Prerequisites and setup
- Verification commands
- Cross-database reference conventions
- Indexes for performance
- Schema evolution after initial build
- Service-level requirements (code patterns)
- Troubleshooting (problems + solutions)
- Next steps

**Use this when**: You're actually rebuilding databases

### docs/SCHEMA_CHANGES_V2.md

**Length**: ~15 pages | **Time**: 20 minutes | **Audience**: Developers/Architects

Detailed changelog with:

- Tables removed/added/modified per database
- Key schema decisions (why things changed)
- Cross-database impact matrix
- Data migration path (7-phase approach if upgrading from v1)
- Checklist for implementation

**Use this when**: You need to understand what changed and why, or migrating from v1

### docs/SERVICE_INTEGRATION_GUIDE.md

**Length**: ~20 pages | **Time**: 30 minutes | **Audience**: Developers

Complete code examples with:

- Multi-database Prisma client setup (singleton pattern)
- Environment configuration
- Hotel query patterns (details, search, geo-proximity)
- Hotel detail sync job (background worker)
- Booking with hotel reference (cross-DB)
- Campaign & discount management (code examples)
- Multi-database transactions (wallet + loyalty + commission)
- Error handling & validation (custom error types)
- Performance tips (select, batching, caching)
- Deployment checklist

**Use this when**: You're implementing features that use the new schema

---

## 🔍 Verification & Deployment

### Run Automated Check

```bash
bash verify-databases.sh
```

This script:

- ✅ Verifies PostgreSQL connectivity
- ✅ Checks all 4 databases exist
- ✅ Validates schema structure
- ✅ Confirms key tables exist
- ✅ Checks critical indexes
- ✅ Validates relationships
- ✅ Confirms cross-DB patterns
- ✅ Spot-checks data counts

**Expected output**: Green checkmarks for all items

### Manual Spot Checks

```bash
# Hotel schema
psql -d tripalfa_local -c "SELECT COUNT(*) FROM hotel.hotels;"
psql -d tripalfa_local -c "SELECT COUNT(*) FROM hotel.hotel_details;"
psql -d tripalfa_local -c "\d hotel.hotels" | grep is_detail_fetched

# Wallet ledger
psql -d tripalfa_core -c "\d wallet_ledger;" | grep -E "wallet_id|wallet_transaction_id"

# Campaign consolidation
psql -d tripalfa_finance -c "\d campaigns;" | grep type

# Commissions
psql -d tripalfa_finance -c "\d commission_settlements;" | grep -E "commission_rule_id|booking_id"
```

---

## 🎯 Next Steps After Rebuild

### Immediately After Build Completes

1. **Update environment variables**
   - Set `DATABASE_URL_LOCAL`, `DATABASE_URL_CORE`, `DATABASE_URL_OPS`, `DATABASE_URL_FINANCE`

2. **Regenerate Prisma clients**

   ```bash
   npm run db:generate
   ```

3. **Update service imports**
   - Change from old single-DB imports to new multi-DB clients
   - See: `docs/SERVICE_INTEGRATION_GUIDE.md` for import patterns

### Testing Phase

4. **Unit tests** — All database operations with new schema
5. **Integration tests** — Cross-DB queries (hotel bookings, commissions)
6. **E2E tests** — Full booking flows end-to-end

### Deployment

7. **Staging deployment** — Test in staging environment first
8. **Production deployment** — Roll out to production with monitoring
9. **Data validation** — Run spot checks on production data

---

## ❓ FAQ

**Q: Can I use the bundle file instead of 4 separate files?**  
A: Yes! `tripalfa_all_ddl.sql` contains all 4 schemas. You can either run it once or execute the 4 files separately (same result).

**Q: What if I'm upgrading from v1?**  
A: See `docs/SCHEMA_CHANGES_V2.md` → "Data Migration Path" for a 7-phase approach. Includes backup strategy and validation steps.

**Q: Do I need PostGIS for geo queries?**  
A: Only if you want to use `ST_DWithin()` spatial queries. Verify script will warn if not installed, but schema will still load.

**Q: How do I handle cross-database transactions?**  
A: Use Prisma transactions separately per database (PostgreSQL doesn't support cross-DB transactions). Example in `docs/SERVICE_INTEGRATION_GUIDE.md`.

**Q: What if hotel sync fails (is_detail_fetched stuck)?**  
A: Monitor `hotel.hotels WHERE is_detail_fetched=FALSE`. Run sync job async; it will catch up. Partial index helps identify which hotels are pending.

**Q: Can I use the old liteapi\_\* table names?**  
A: No, they're removed. Update code to use new locations (e.g., `liteapi_hotels` → `hotel.hotels`). Migration script provided in `SCHEMA_CHANGES_V2.md`.

---

## 📞 Support

| Question                  | See                                         |
| ------------------------- | ------------------------------------------- |
| How do I rebuild?         | DATABASE_REBUILD_GUIDE.md                   |
| What changed?             | docs/SCHEMA_CHANGES_V2.md                   |
| How do I code against it? | docs/SERVICE_INTEGRATION_GUIDE.md           |
| Is it set up correctly?   | Run `verify-databases.sh`                   |
| Something's broken        | DATABASE_REBUILD_GUIDE.md → Troubleshooting |

---

## 📊 Statistics

| Metric                             | Value                    |
| ---------------------------------- | ------------------------ |
| Total DDL lines                    | 1,825                    |
| Documentation pages                | 4 main + reference files |
| Code examples in integration guide | 20+                      |
| Tables across all 4 databases      | 100+                     |
| Key improvements                   | 5 major + 10 minor       |
| Estimated rebuild time             | 30 min - 2 hours         |

---

**Version**: 2.0  
**Generated**: 2026-03-17  
**Status**: ✅ Production Ready  
**Last Updated**: 2026-03-17

For questions about database architecture, see `.github/copilot-instructions.md` for project conventions.
