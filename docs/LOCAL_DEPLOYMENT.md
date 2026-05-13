# Local Deployment Guide - TripAlfa Architecture
# No Docker required - everything runs natively on macOS

## Prerequisites (macOS)
- Node.js >= 18
- PostgreSQL >= 14 running locally (already on port 5433)
- Kong Gateway installed locally (`brew install kong`)
- PgBouncer (optional, for connection pooling)

## 1. Database Setup (Local PostgreSQL)
```bash
# Create read-only user for static data (already executed)
psql -U postgres -p 5433 -f infrastructure/database/create_static_ro_user.sql

# Seed static data tables (already executed)
psql -U postgres -p 5433 -d tripalfa_local -f infrastructure/database/seed_static_data.sql

# Enable pg_stat_statements for monitoring
psql -U postgres -p 5433 -c "ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';"
psql -U postgres -p 5433 -c "SELECT pg_reload_conf();"
psql -U postgres -p 5433 -f infrastructure/database/enable_pg_stat_statements.sql
```

## 2. Kong Gateway (Local)
```bash
# Start Kong locally using project scripts
pnpm gateway:start

# Verify Kong is running
curl <http://localhost:8000/api/gateway/health-status>

# Check Kong status
pnpm gateway:status
```

Kong configuration is at: `infrastructure/kong/kong.yml`
Logs: `infrastructure/kong/.runtime/logs/`

## 3. Static Data API Server (Local)
```bash
# Install dependencies
cd packages/static-data && pnpm install

# Start static data API server (port 3022)
cd packages/static-data
STATIC_RO_DATABASE_URL="postgresql://static_ro:static_secure_password_123!@localhost:5433/tripalfa_local" \
STATIC_API_PORT=3022 \
node server.ts

# Test the server
curl <http://localhost:3022/health>
curl <http://localhost:3022/api/static/amenities>
```

## 4. Frontend Apps (Local)
All 4 frontends are already configured to:
- Use Kong Gateway at `http://localhost:8000` for dynamic APIs
- Use Static Data API at `http://localhost:3022` for static data
- Environment variables in `.env.local.private`

```bash
# Start booking-engine (React + Vite)
cd apps/booking-engine && pnpm dev
# Runs on <http://localhost:5173>

# Other frontends:
cd apps/b2b-portal && pnpm dev
cd apps/call-center-portal && pnpm dev  
cd apps/super-admin-portal && pnpm dev
```

## 5. Connection Pooling (Optional - PgBouncer)
If you want connection pooling without Docker:
```bash
# Install PgBouncer
brew install pgbouncer

# Create config
cat > /usr/local/etc/pgbouncer.ini << EOL
[databases]
tripalfa_local = host=127.0.0.1 port=5433 dbname=tripalfa_local

[pgbouncer]
listen_addr = 127.0.0.1
listen_port = 6432
auth_type = trust
pool_mode = transaction
max_client_conn = 100
default_pool_size = 20
EOL

# Start PgBouncer
pgbouncer /usr/local/etc/pgbouncer.ini

# Then update STATIC_RO_DATABASE_URL to use port 6432
```

## Environment Variables (.env.local.private)
Already configured:
- `STATIC_RO_DATABASE_URL` - Read-only Postgres user
- `VITE_GATEWAY_URL=http://localhost:8000` - Kong Gateway
- `VITE_STATIC_API_URL=http://localhost:3022` - Static Data API

## Verification
```bash
# 1. Check Postgres
psql -U postgres -p 5433 -c "SELECT COUNT(*) FROM hotel_amenities;"

# 2. Check Kong
curl <http://localhost:8000/api/gateway/health-status>

# 3. Check Static Data API
curl <http://localhost:3022/api/static/amenities>

# 4. Check frontend can access both
# Open <http://localhost:5173> and verify static data loads + API calls work
```

## Architecture Summary (Local)
```
Frontends (4 apps on ports 5173-5176)
    |
    +---> Kong Gateway (port 8000) --> Backend Services
    |
    +---> Static Data API (port 3022) --> Postgres (port 5433)
              |
              +---> static_ro user (read-only)
              +---> PgBouncer (optional, port 6432)
```
