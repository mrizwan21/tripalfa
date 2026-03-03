# TripAlfa Development Environment Setup

## Overview

TripAlfa is a modern travel booking platform with the following architecture:
- **Application Database**: Neon (PostgreSQL serverless)
- **Static Reference Database**: Local Docker PostgreSQL
- **Microservices**: Express + TypeScript running on individual ports
- **Frontend**: React (Booking Engine) + Next.js (B2B Admin)

This document guides you through setting up your local development environment.

---

## ⚠️ CRITICAL SECURITY NOTICE

**Never commit actual credentials to version control.**

- `.env.example` - Master template (committed) ✓
- `.env.docker` - Docker template (committed) ✓
- `.env` - Your local config (gitignored) ❌ DON'T commit
- `.env.local.private` - Local secrets (gitignored) ❌ DON'T commit
- `.env.services`, `.env.local` - Templates (gitignored by policy)

The Neon API tokens previously exposed in `.env` and `.env.docker` have been removed. If you need to rotate credentials in production, visit https://console.neon.tech/app/projects.

---

## Prerequisites

1. **Node.js** (v18+) and pnpm (v8+)
2. **Docker** and Docker Compose (for static database and services)
3. **PostgreSQL** (for local static database - alternative to running via Docker)
4. **Neon Account** (free tier OK) - https://console.neon.tech

---

## Step 1: Setup Neon Database

### Option A: Using Neon CLI (Recommended)

```bash
# Install Neon CLI
brew install neonctl

# Initialize and authenticate
neonctl init

# Your Neon project connection strings will be displayed
# Copy the pooled and direct endpoints
```

### Option B: Manual Setup via Dashboard

1. Go to https://console.neon.tech/app/projects
2. Open or create a project
3. Click **Connection string** in the sidebar
4. Copy the **Pooled connection string** (for runtime)
5. Copy the **Direct connection string** (for migrations)

### Neon Connection Strings

From your Neon project, you'll have:

```
Pooled:  postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
Direct:  postgresql://username:password@ep-xxx.direct-connect.aws.neon.tech/neondb?sslmode=require
```

> **Note**: Pooled endpoint uses pgbouncer and is optimal for serverless/web apps.
> Direct endpoint is required for Prisma migrations.

---

## Step 2: Setup Local Environment Files

### For Local Development (`pnpm dev`)

```bash
# Create a local environment file
cp .env .env.local.private

# Edit it with your actual credentials
nano .env.local.private
```

Edit `.env.local.private`:

```dotenv
# Database URLs (from Neon)
DATABASE_URL="postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require"
NEON_DATABASE_URL="postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require"
DIRECT_DATABASE_URL="postgresql://user:password@ep-xxx.direct-connect.aws.neon.tech/neondb?sslmode=require"

# Static database (port 5433 when running local Postgres)
STATIC_DATABASE_URL="postgresql://postgres:postgres@localhost:5433/staticdatabase"

# Secrets
JWT_SECRET="your-secret-key-for-dev"
```

### For Docker Development (`docker-compose`)

```bash
# Create a Docker environment file
cp .env.docker .env.docker.local

# Edit it with your actual credentials
nano .env.docker.local
```

Edit `.env.docker.local`:

```dotenv
# Database URLs (from Neon)
NEON_DATABASE_URL="postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require"
DIRECT_NEON_DATABASE_URL="postgresql://user:password@ep-xxx.direct-connect.aws.neon.tech/neondb?sslmode=require"

# Static database (postgres-static container)
STATIC_DATABASE_URL="postgresql://postgres:postgres@postgres-static:5432/staticdatabase"

# Secrets
JWT_SECRET="your-secret-key-for-dev"
```

---

## Step 3: Setup Static Reference Database

The static database stores airports, airlines, hotels, amenities, etc. You have two options:

### Option A: Docker (Automatic, Recommended)

```bash
# This starts when you run docker-compose.local.yml up
docker-compose -f docker-compose.local.yml up postgres-static
```

The database will be available at:
```
Host: localhost
Port: 5433
User: postgres
Password: postgres
Database: staticdatabase
```

### Option B: Local PostgreSQL

```bash
# Install PostgreSQL locally (macOS)
brew install postgresql@15

# Or use Docker image directly
docker run -d \
  --name tripalfa-postgres-static \
  -e POSTGRES_DB=staticdatabase \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5433:5432 \
  postgres:15
```

### Option C: Existing PostgreSQL Instance

If you have a fully populated static database elsewhere, update `STATIC_DATABASE_URL` accordingly.

---

## Step 4: Install Dependencies

```bash
# Install all workspace dependencies
npm install

# Or with pnpm
pnpm install

# Generate Prisma client
npm run db:generate

# Optional: Push schema to Neon
npm run db:push
```

---

## Step 5: Run the Application

### Local Development (All Workspaces in NPM)

```bash
# From repo root
npm run dev

# This starts:
# - api-gateway on http://localhost:3000
# - booking-engine on http://localhost:3021
# - b2b-admin on http://localhost:3020
# - All microservices on their respective ports
```

### Docker Compose (Full Stack)

```bash
# Start all services in Docker
docker-compose -f docker-compose.local.yml up

# Or with custom env file
docker-compose --env-file .env.docker.local -f docker-compose.local.yml up

# Start only specific service
docker-compose -f docker-compose.local.yml up api-gateway

# View logs
docker-compose -f docker-compose.local.yml logs -f api-gateway

# Stop everything
docker-compose -f docker-compose.local.yml down
```

### Single Workspace Development

```bash
# Start just the booking engine
npm run dev --workspace=@tripalfa/booking-engine

# Start just the API gateway
npm run dev --workspace=@tripalfa/api-gateway
```

---

## File Structure Reference

```
.
├── .env                          # Local development (gitignored)
├── .env.example                  # Master template (committed)
├── .env.docker                   # Docker template (committed)
├── .env.docker.local             # Docker with secrets (gitignored)
├── .env.local.private            # Local dev secrets (gitignored)
├── docker-compose.local.yml      # Primary compose file (committed)
├── apps/
│   ├── booking-engine/           # Customer booking UI
│   └── b2b-admin/                # Admin dashboard
├── services/
│   ├── api-gateway/              # Main routing/auth
│   ├── booking-service/          # Booking logic
│   ├── payment-service/          # Payments
│   ├── user-service/             # User management
│   ├── wallet-service/           # Wallet/billing
│   ├── notification-service/     # Notifications
│   ├── rule-engine-service/      # Business rules
│   └── ... (other services)
├── packages/
│   ├── shared-types/             # TypeScript types
│   ├── shared-utils/             # Utilities
│   ├── static-data/              # Static data mgmt
│   └── ... (other packages)
└── database/prisma/
    ├── schema.prisma             # Database schema
    └── migrations/               # Schema migrations
```

---

## Common Workflows

### Database Operations

```bash
# Generate Prisma client (after schema changes)
npm run db:generate

# Push schema changes to Neon (non-destructive)
npm run db:push

# After creating migrations
npm run db:migrate

# Reset database (DESTRUCTIVE - only in dev!)
npm run db:reset

# Open Prisma Studio (visual DB browser)
npm run db:studio
```

### Code Quality

```bash
# Run linter
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Run TypeScript check
npx tsc -p tsconfig.json --noEmit

# Specific workspace typecheck
npm run typecheck:booking-engine
npm run typecheck:b2b-admin
```

### API Testing

```bash
# Test Duffel flight API integration
npm run test:api:duffel

# Test LiteAPI hotel booking
npm run test:api:liteapi

# Comprehensive LiteAPI tests
npm run test:api:liteapi:comprehensive

# Test wallet system
npm run test:api:wallet:orchestrator

# Test supplier management
npm run test:api:supplier-management:phase2-e2e
```

---

## Docker Compose Services

The `docker-compose.local.yml` includes:

| Service | Port | Purpose |
|---------|------|---------|
| `postgres-static` | 5433 | Static reference data |
| `redis` | 6379 | Caching & sessions |
| `api-gateway` | 3000 | Main API entry point |
| `booking-service` | 3001 | Booking logic |
| `payment-service` | 3007 | Payment processing |
| `user-service` | 3003 | User management |
| `wallet-service` | 3008 | Wallet system |
| `notification-service` | 3009 | Notifications |
| `rule-engine-service` | 3010 | Business rules |
| `booking-engine` | 3021 | Customer UI |
| `b2b-admin` | 3020 | Admin UI |

---

## Troubleshooting

### Connection Refused: postgres-static

**Problem**: Services can't connect to static database on port 5433

**Solution**:
```bash
# Verify container is running
docker ps | grep postgres-static

# Check logs
docker-compose -f docker-compose.local.yml logs postgres-static

# Restart the database
docker-compose -f docker-compose.local.yml restart postgres-static
```

### Neon Connection Failed

**Problem**: `ECONNREFUSED` or timeout connecting to Neon

**Solutions**:
1. Verify credentials in `.env.local.private` or `.env.docker.local`
2. Check internet connectivity
3. Test connection manually:
   ```bash
   psql "postgresql://user:pass@endpoint/neondb?sslmode=require"
   ```
4. Check Neon dashboard for API errors

### Migration Failures

**Problem**: Prisma migration to Neon fails

**Solution**:
```bash
# Use DIRECT_DATABASE_URL (not pooled) for migrations
export DIRECT_DATABASE_URL="your-direct-url"

# Retry migration
npm run db:migrate

# Or push schema changes
npm run db:push
```

### Services Won't Start in Docker

**Problem**: `env-validator` service fails

**Solution**:
```bash
# Check the validator logs
docker-compose -f docker-compose.local.yml logs env-validator

# Verify environment variables are set
docker-compose --env-file .env.docker.local -f docker-compose.local.yml config | grep DATABASE_URL
```

### Port Already in Use

**Problem**: `Port 3000 is already allocated`

**Solution**:
```bash
# Kill existing services
docker-compose -f docker-compose.local.yml down

# Or use different ports
docker-compose -f docker-compose.local.yml up --rename-port 3000:3000:3001
```

---

## Archive Reference

Legacy and outdated configuration files have been moved to:

```
./archive/
├── legacy-docker-configs/
│   ├── docker-compose.kong.yml          # Old Kong setup
│   ├── docker-compose.resilient.yml     # Experimental setup
│   └── docker-compose.notification-rules.yml  # Old partial setup
└── legacy-env-files/
    ├── .env.docker.example
    ├── .env.neon.example
    ├── .env.production.template
    ├── .env.staging.template
    ├── .env.local.example
    ├── .env.services.example
    └── ... (other legacy files)
```

These files are kept for historical reference but should not be used.

---

## Next Steps

- Review [README.md](README.md) for architecture overview
- Check individual service READMEs in `services/*/README.md`
- Set up IDE extensions (ESLint, Prettier, TypeScript)
- Run `npm run lint` and `npm run format` to check code style
- Review [Contributing Guidelines](CONTRIBUTING.md) (if available)

---

## Getting Help

- **Database Issues**: Check Neon docs at https://neon.tech/docs
- **Docker Issues**: See Docker Compose docs at https://docs.docker.com/compose
- **Code Issues**: Review service-specific README files
- **General Questions**: Check existing issues or create a new one

---

**Last Updated**: March 3, 2026
