# TripAlfa Local Development Setup Guide

## Overview

This guide walks you through setting up TripAlfa for local development with all services running as native processes on your machine (no Docker required).

**Deployment Model:** Process-First (Services run directly on host machine)  
**Database:** Neon (cloud) for application data + Local PostgreSQL (5433) for static data  
**Estimated Setup Time:** 15-30 minutes

---

## Prerequisites

### Required Software

- **Node.js** 18 or higher (recommend 20.x)
- **pnpm** 10.x (package manager)
- **PostgreSQL** 14+ (for static reference data on port 5433)
- **Redis** 6+ (for caching, optional but recommended)
- **Git**

### Required Accounts

- **Neon** account with a PostgreSQL database
- **Duffel** API keys (test environment)
- **LiteAPI** API keys (test environment)
- **Stripe** test API keys
- **Google/Facebook/Apple** OAuth credentials (for auth testing)

---

## Step 1: Install Dependencies

### 1.1 Clone or Navigate to Repository

```bash
cd /path/to/tripalfa
```

### 1.2 Install pnpm (if not already installed)

```bash
npm install -g pnpm
```

### 1.3 Install Workspace Dependencies

```bash
pnpm install
```

This installs all dependencies across 27 workspace packages.

---

## Step 2: Database Configuration

### 2.1 Static Database (PostgreSQL on port 5433)

#### Option A: Using Docker (if you have Docker installed)

```bash
docker run -d \
  --name tripalfa-static-db \
  -e POSTGRES_PASSWORD=postgres \
  -p 5433:5432 \
  postgres:16-alpine
```

#### Option B: Using Homebrew (macOS)

```bash
brew install postgresql
brew services start postgresql
createdb -p 5433 staticdatabase

# If port 5432 is in use, configure PostgreSQL for port 5433
# Edit ~/.homebrew/var/postgres/postgresql.conf
```

#### Option C: Using apt (Linux)

```bash
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo -u postgres psql -c "CREATE DATABASE staticdatabase WITH OWNER postgres;"
```

### 2.2 Initialize Static Database

```bash
# With Docker running:
psql -h localhost -p 5433 -U postgres -d staticdatabase < database/init-static/00_run_all.sql
```

### 2.3 Verify Static Database

```bash
psql -h localhost -p 5433 -U postgres -d staticdatabase -c "SELECT * FROM hotels LIMIT 1;"
```

---

## Step 3: Environment Configuration

### 3.1 Create Local Environment File

```bash
# Copy the example environment file
cp .env.local.example .env.local
```

### 3.2 Update .env.local with Your Credentials

#### Database URLs

```dotenv
# Get these from your Neon dashboard
NEON_DATABASE_URL="postgresql://neondb_owner:YOUR_PASSWORD@..."
DIRECT_NEON_DATABASE_URL="postgresql://neondb_owner:YOUR_PASSWORD@..."

# Static database (should be running locally on 5433)
STATIC_DATABASE_URL="postgresql://postgres:postgres@localhost:5433/staticdatabase"
```

#### API Keys

Add your test API keys from:

- Duffel: `DUFFEL_API_KEY`
- LiteAPI: `LITEAPI_API_KEY`
- Stripe: `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`
- Google OAuth: `VITE_GOOGLE_CLIENT_ID`

#### JWT Secret

```dotenv
JWT_SECRET="your-dev-secret-key-at-least-32-characters"
```

### 3.3 Verify Configuration

```bash
# Check that all required env vars are set
grep -E "^[A-Z_]+=" .env.local | wc -l
```

---

## Step 4: Generate Prisma Client

Before running services, generate the Prisma client:

```bash
cd database/prisma
npx prisma generate

# Or from root:
pnpm -r exec prisma generate
```

---

## Step 5: Start Services

### Option A: Start Individual Services Manually

Start each service in a separate terminal window:

```bash
# Terminal 1: API Gateway (port 3000)
pnpm --dir services/api-gateway dev

# Terminal 2: Booking Service (port 3001)
pnpm --dir services/booking-service dev

# Terminal 3: User Service (port 3004)
pnpm --dir services/user-service dev

# Terminal 4: Other backend services
pnpm --dir services/payment-service dev
pnpm --dir services/wallet-service dev
pnpm --dir services/notification-service dev
# ... etc for remaining services

# Terminal N-2: B2B Admin Frontend (port 5173)
pnpm --dir apps/b2b-admin dev

# Terminal N-1: Booking Engine Frontend (port 5174)
pnpm --dir apps/booking-engine dev
```

### Option B: Start with Provided Script

```bash
# Make the script executable
chmod +x scripts/start-local-dev.sh

# Run the startup script
bash scripts/start-local-dev.sh
```

The script will:

- Start all services in parallel
- Log output to `.logs/` directory
- Show service URLs and logs location
- Clean up on Ctrl+C

---

## Step 6: Verify Services Are Running

### Check Health Endpoints

```bash
# API Gateway
curl http://localhost:3000/health

# Booking Service
curl http://localhost:3001/health

# User Service
curl http://localhost:3004/health

# Other services on their respective ports...
```

### Expected Response

```json
{
  "status": "healthy",
  "service": "api-gateway",
  "timestamp": "2026-03-05T20:30:00.000Z"
}
```

### View Logs

```bash
# All services
tail -f .logs/*.log

# Specific service
tail -f .logs/booking-service.log
```

---

## Step 7: Access Applications

| Service | URL | Purpose |
| --------- | ----- | --------- |
| **API Gateway** | <http://localhost:3000> | Backend API entry point |
| **Booking Engine** | <http://localhost:5174> | User-facing booking application |
| **B2B Admin** | <http://localhost:5173> | Admin dashboard |
| **Swagger UI** | <http://localhost:3000/documentation> | API documentation |
| **Health Check** | <http://localhost:3000/health> | Service status |

---

## Step 8: Verify Service Connectivity

### Test API Gateway to Backend Communication

```bash
# Make a test request through the API Gateway
curl -X GET http://localhost:3000/api/static/destinations \
  -H "Content-Type: application/json"
```

### Test Database Queries

```bash
# Verify Neon database connection
psql "$DIRECT_NEON_DATABASE_URL" -c "SELECT version();"

# Verify static database connection
psql -h localhost -p 5433 -U postgres -d staticdatabase -c "SELECT COUNT(*) FROM hotels;"
```

### Test Service-to-Service Communication

```bash
# API Gateway should be able to reach Booking Service
curl http://localhost:3001/health
```

---

## Service Dependencies & Startup Order

### Critical Start Order

1. **Static Database** (must be running before services start)
2. **API Gateway** (central routing hub)
3. **Core Services** (booking, user, payment services)
4. **Frontends** (after API Gateway is ready)

### Service Communication Flow

```text
User Browser
    ↓
Frontend (5173/5174)
    ↓
API Gateway (3000)
    ↓
[Booking | User | Payment | ... Services]
    ↓
[Neon DB | Static DB | Redis Cache]
```

---

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or change port in .env.local
API_GATEWAY_PORT=3001
```

### Static Database Connection Error

```bash
# Verify PostgreSQL is running
psql -h localhost -p 5433 -U postgres -d staticdatabase -c "SELECT 1;"

# If it fails, restart PostgreSQL
docker restart tripalfa-static-db  # if using Docker
# or
brew services restart postgresql  # if using Homebrew
```

### Neon Database Connection Error

```bash
# Verify credentials in .env.local
echo $DIRECT_NEON_DATABASE_URL

# Test connection
psql "$DIRECT_NEON_DATABASE_URL" -c "SELECT 1;"
```

### Service Won't Start

```bash
# Check logs
tail -f .logs/service-name.log

# Verify dependencies are installed
pnpm --dir services/service-name install

# Check TypeScript compilation
pnpm --dir services/service-name exec tsc --noEmit
```

### High Memory Usage

```bash
# Some services like Booking Engine (Vite) are memory-intensive
# Increase Node memory limit if needed
NODE_OPTIONS=--max_old_space_size=4096 pnpm --dir apps/booking-engine dev
```

---

## Environment Variables Reference

### Database

- `STATIC_DATABASE_URL` - Local PostgreSQL for reference data (port 5433)
- `NEON_DATABASE_URL` - Neon cloud database (application data)
- `DIRECT_NEON_DATABASE_URL` - Direct Neon connection (for transactions)
- `REDIS_URL` - Redis cache location

### Services

- `API_GATEWAY_PORT=3000` - Central API gateway
- `BOOKING_SERVICE_PORT=3001` - Booking management
- `USER_SERVICE_PORT=3004` - User management
- `PAYMENT_SERVICE_PORT=3007` - Payment processing
- `NOTIFICATION_SERVICE_PORT=3009` - Email/SMS notifications

### External APIs

- `DUFFEL_API_KEY` - Flight search API
- `LITEAPI_API_KEY` - Hotel search API
- `STRIPE_SECRET_KEY` - Payment processing
- `VITE_GOOGLE_CLIENT_ID` - Google authentication

See `.env.local.example` for complete reference.

---

## Development Workflow

### 1. Make Code Changes

```bash
# Edit any service code
vim services/booking-service/src/index.ts
```

### 2. Auto-Reload

Most services watch for changes and reload automatically. If not:

```bash
# Stop service (Ctrl+C) and restart
pnpm --dir services/booking-service dev
```

### 3. TypeScript Compilation

Services automatically compile TypeScript on startup.

### 4. Database Migrations

```bash
# Apply migrations to Neon database
pnpm exec prisma migrate dev --name "your_migration_name"

# Sync schema without migrations
pnpm exec prisma db push
```

### 5. Restart Services

```bash
# Kill all services and restart
pkill -f "pnpm.*dev"
bash scripts/start-local-dev.sh
```

---

## Performance Tips

### 1. Monitor Resource Usage

```bash
# Watch memory/CPU consumption
top -o %MEM

# Services to watch: Booking Engine (Vite is memory-intensive)
```

### 2. Optimize Database Queries

```bash
# Enable query logging
QUERY_LOG=true pnpm --dir services/booking-service dev
```

### 3. Parallel Transpilation

Services use esbuild for fast TypeScript compilation.

### 4. Cache Management

```bash
# Clear Redis cache if needed
redis-cli FLUSHDB

# Or via environment
CACHE_ENABLED=false pnpm --dir services/booking-service dev
```

---

## Next Steps

1. **Run Tests:** `pnpm -r test`
2. **Check Types:** `pnpm -r exec tsc --noEmit`
3. **Lint Code:** `pnpm -r exec eslint src --fix`
4. **Build for Production:** `pnpm -r build`

---

## Support & Resources

- **Documentation:** `/docs/` directory
- **API Docs:** <http://localhost:3000/documentation>
- **Issues:** Check GitHub issues
- **Logs:** `.logs/` directory for service outputs

---

## Quick Commands Reference

```bash
# Install everything
pnpm install

# Start all services with script
bash scripts/start-local-dev.sh

# Start specific service
pnpm --dir services/booking-service dev

# Type check everything
pnpm -r exec tsc --noEmit

# Run linting
pnpm -r exec eslint src --fix

# Run tests
pnpm -r test

# Build all
pnpm -r build

# Clean build artifacts
pnpm -r exec rm -rf dist

# View all pnpm workspaces
pnpm ls --depth=0
```

---

**Last Updated:** March 5, 2026  
**Deployment Model:** Local Process-Based (No Docker)  
**Database:** Cloud-First (Neon) + Local Static Data
