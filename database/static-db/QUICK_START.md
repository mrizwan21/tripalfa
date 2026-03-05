# Quick Start: Languages & Facilities Sync

Get your static databases up and running in minutes.

## Prerequisites

```bash
# 1. Ensure you have Node.js and npm/pnpm installed
node --version  # v18+
npm --version   # v8+

# 2. Install dependencies
npm install
# or
pnpm install

# 3. Set up environment
cp .env.example .env.local
# Edit .env.local and add your LITEAPI_KEY
```

## One-Minute Setup

```bash
# 1. Set API key
export LITEAPI_KEY=your_liteapi_key_here

# 2. Run migrations (creates tables and indexes)
npm run migrate
# or manually:
psql -d tripalfa -f database/static-db/migrations/20260304000002_facilities_static_database.sql
psql -d tripalfa -f database/static-db/migrations/20260304000003_languages_static_database.sql

# 3. Run sync scripts
npm run sync:languages
npm run sync:facilities

# Done! Data is now in your database.
```

## Verification

```bash
# Check languages
psql -c "SELECT COUNT(*) as total_languages FROM shared.languages;"

# Check facilities
psql -c "SELECT COUNT(*) as total_facilities FROM hotel.facilities;"

# View sample data
psql -c "SELECT * FROM shared.v_languages_enabled LIMIT 5;"
psql -c "SELECT * FROM hotel.v_facilities_active LIMIT 5;"
```

## Common Commands

### Run specific sync
```bash
# Languages only
npx ts-node database/static-db/scripts/sync-languages.ts

# Facilities only
npx ts-node database/static-db/scripts/sync-facilities.ts

# Both together
npm run sync:languages && npm run sync:facilities
```

### View Results

```bash
# All languages
psql -c "SELECT * FROM shared.v_languages_enabled;"

# Facilities with translations
psql -c "SELECT id, name, jsonb_object_keys(translations) as languages FROM hotel.facilities WHERE translations IS NOT NULL LIMIT 10;"

# Sync history
psql -c "SELECT * FROM shared.languages_sync_metadata ORDER BY sync_completed_at DESC LIMIT 3;"
psql -c "SELECT * FROM hotel.facilities_sync_metadata ORDER BY sync_completed_at DESC LIMIT 3;"

# Recent changes
psql -c "SELECT * FROM shared.languages_audit ORDER BY changed_at DESC LIMIT 5;"
psql -c "SELECT * FROM hotel.facilities_audit ORDER BY changed_at DESC LIMIT 5;"
```

### Debug Issues

```bash
# Check if tables exist
psql -c "\dt shared.languages hotel.facilities"

# Check indexes
psql -c "SELECT * FROM pg_indexes WHERE tablename IN ('languages', 'facilities');"

# View error logs
tail -f database/static-db/liteapi-sync.log

# Check last sync status
psql -c "SELECT * FROM shared.languages_sync_metadata ORDER BY sync_id DESC LIMIT 1;"
psql -c "SELECT * FROM hotel.facilities_sync_metadata ORDER BY sync_id DESC LIMIT 1;"
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `LITEAPI_KEY is not set` | `export LITEAPI_KEY=your_key` |
| `Cannot connect to database` | Check PostgreSQL is running: `psql -l` |
| `Table does not exist` | Run migrations: `npm run migrate` |
| `Timeout` | Check API key validity and internet connection |
| `UTF-8 Error` | This is automatically handled by the scripts |

## Schedule Regular Syncs

### Option 1: Cron Job
```bash
# Edit crontab
crontab -e

# Add this line for daily 2 AM sync
0 2 * * * cd /path/to/project && npm run sync:languages && npm run sync:facilities >> /var/log/static-db-sync.log 2>&1
```

### Option 2: Systemd Timer
Create `/etc/systemd/system/static-db-sync.service`:
```ini
[Unit]
Description=Static Database Sync (Languages & Facilities)
After=network.target

[Service]
Type=oneshot
User=app
WorkingDirectory=/path/to/project
ExecStart=/usr/bin/npm run sync:languages
ExecStart=/usr/bin/npm run sync:facilities
StandardOutput=journal
StandardError=journal
```

Create `/etc/systemd/system/static-db-sync.timer`:
```ini
[Unit]
Description=Run Static DB Sync daily at 2 AM

[Timer]
OnCalendar=daily
OnCalendar=02:00
Persistent=true

[Install]
WantedBy=timers.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable static-db-sync.timer
sudo systemctl start static-db-sync.timer
```

## Next Steps

1. ✅ **Basic**: Run the quick setup above
2. 📖 **Learn**: Read [STATIC_DATABASES.md](./STATIC_DATABASES.md) for comprehensive docs
3. 📊 **Monitor**: Set up alerts on sync failures
4. 🔄 **Schedule**: Configure daily syncs
5. 🔌 **Integrate**: Use the views in your application

## Files Created

```
database/static-db/
├── scripts/
│   ├── sync-languages.ts ............ Language sync script
│   └── sync-facilities.ts ........... Facilities sync script
├── migrations/
│   ├── 20260304000002_*.sql ......... Facilities schema
│   └── 20260304000003_*.sql ......... Languages schema
├── STATIC_DATABASES.md .............. Full documentation
├── STATIC_DB_SUMMARY.md ............. Overview & architecture
└── QUICK_START.md ................... This file
```

## Support

For detailed information on:
- **Architecture & Design**: See [STATIC_DATABASES.md](./STATIC_DATABASES.md)
- **SQL Queries**: See [STATIC_DATABASES.md](./STATIC_DATABASES.md#queries)
- **Performance Tuning**: See [STATIC_DATABASES.md](./STATIC_DATABASES.md#performance-considerations)
- **Security**: See [STATIC_DATABASES.md](./STATIC_DATABASES.md#security)

## Common Queries

### Quick Stats
```sql
-- Languages
SELECT 
  COUNT(*) as total,
  COUNT(CASE WHEN is_enabled THEN 1 END) as enabled
FROM shared.languages;

-- Facilities
SELECT 
  COUNT(*) as total,
  COUNT(CASE WHEN is_active THEN 1 END) as active,
  COUNT(CASE WHEN translations IS NOT NULL THEN 1 END) as with_translations
FROM hotel.facilities;
```

### Search Examples
```sql
-- Find language
SELECT * FROM shared.v_languages_enabled WHERE code = 'en';

-- Find facility
SELECT * FROM hotel.v_facilities_active WHERE name LIKE '%WiFi%';

-- Search facilities (full-text)
SELECT * FROM hotel.mv_facilities_search 
WHERE search_vector @@ plainto_tsquery('english', 'pool');
```

---

**Ready to go! Run `npm run sync:languages && npm run sync:facilities` now.**