# Docker Setup and Development Guide

## Quick Start (5 minutes)

```bash
# 1. Copy environment template
cp .env.docker.example .env.docker.local

# 2. Edit .env.docker.local with your Neon credentials
# Get from: https://console.neon.tech/app/projects
nano .env.docker.local

# 3. Start all services
docker compose --env-file .env.docker.local -f docker-compose.local.yml up -d

# 4. Verify services are running
docker compose -f docker-compose.local.yml ps

# 5. Check logs if anything fails
docker compose -f docker-compose.local.yml logs -f
```

## Understanding the Architecture

TripAlfa uses a **two-database approach**:

### 1. Neon PostgreSQL (Cloud) - Application Data

- **Purpose**: User accounts, bookings, payments, wallets, notifications, KYC records
- **Hosted**: Neon cloud platform (<https://neon.tech>)
- **Connection**: Via `NEON_DATABASE_URL` (pooled) and `DIRECT_NEON_DATABASE_URL` (direct for migrations)
- **Services**: API Gateway, Booking, Payment, User, Notification, KYC, Wallet, Organization, Marketing

### 2. Local Docker PostgreSQL - Static Reference Data

- **Purpose**: Static data: airports, airlines, hotels, cities, exchange rates
- **Hosted**: Docker container `postgres-static` on port 5433
- **Connection**: Built into compose file (no manual setup needed)
- **Services**: Booking service for static lookups (flight/hotel availability)

## Detailed Setup

### Prerequisites

```bash
# Required
- Docker Desktop (includes docker-compose)
- Neon account (free tier: https://console.neon.tech/signup)
- pnpm or npm (for local development without Docker)

# Optional (for features)
- Duffel account (flights)
- LiteAPI account (hotels)
- Stripe/PayPal (payments)
```

### Step-by-Step Setup

#### 1. Get Neon Database Credentials

1. Go to [Neon Console](https://console.neon.tech)
2. Create or select a project
3. Click "Connection Details" button
4. Select "Pooled connections"
5. Copy the connection string, e.g.:

   ```
   postgresql://neon_user:abc123def456@ep-cool-project.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

#### 2. Create Local Environment File

```bash
cp .env.docker.example .env.docker.local
```

#### 3. Edit `.env.docker.local`

```bash
# Using any editor (nano, vim, VS Code, etc.)
nano .env.docker.local
```

Update these lines with your credentials:

```dotenv
NEON_DATABASE_URL=postgresql://neon_user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
DIRECT_NEON_DATABASE_URL=postgresql://neon_user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require

# Add API keys if you want to test integrations
DUFFEL_API_KEY=your_key_here
LITEAPI_API_KEY=your_key_here
```

#### 4. Start Docker Compose

```bash
# Start all services in background
docker compose --env-file .env.docker.local -f docker-compose.local.yml up -d

# Wait ~30 seconds for services to initialize
sleep 30

# Check status
docker compose -f docker-compose.local.yml ps
```

Expected output:

```
NAME                        STATUS
tripalfa-env-validator      Exited (0)        ✓ (validation ran successfully)
tripalfa-postgres-static    Up                ✓ Port 5433
tripalfa-redis-local        Up                ✓ Port 6379
tripalfa-api-gateway        Up                ✓ Port 3000
tripalfa-booking-service    Up                ✓ Port 3001
```

#### 5. Verify Services Are Healthy

```bash
# Test API Gateway
curl http://localhost:3000/health

# Check all service logs
docker compose -f docker-compose.local.yml logs --tail=50

# Test database connection
docker exec tripalfa-postgres-static psql -U postgres -d staticdatabase -c "SELECT COUNT(*) FROM airports;"
```

## Common Commands

### Service Management

```bash
# Start services
docker compose --env-file .env.docker.local -f docker-compose.local.yml up -d

# Stop services
docker compose -f docker-compose.local.yml down

# Restart a specific service
docker compose -f docker-compose.local.yml restart api-gateway

# View service logs
docker compose -f docker-compose.local.yml logs -f booking-service

# View logs from last 100 lines
docker compose -f docker-compose.local.yml logs --tail=100

# Execute command in running container
docker exec tripalfa-api-gateway npm run dev
```

### Database Management

```bash
# Access PostgreSQL shell
docker exec -it tripalfa-postgres-static psql -U postgres -d staticdatabase

# Backup static database
docker exec tripalfa-postgres-static pg_dump -U postgres staticdatabase > backup.sql

# Check database size
docker exec tripalfa-postgres-static psql -U postgres -c "SELECT pg_size_pretty(pg_database_size('staticdatabase'));"

# Run Prisma migrations (against Neon)
npm run db:migrate

# Generate Prisma client
npm run db:generate

# Sync schema with Neon
npm run db:push
```

### Redis Management

```bash
# Connect to Redis CLI
docker exec -it tripalfa-redis-local redis-cli

# Check Redis memory usage
docker exec tripalfa-redis-local redis-cli INFO memory

# Clear all Redis data
docker exec tripalfa-redis-local redis-cli FLUSHALL
```

## Troubleshooting

### Services Won't Start

**Problem**: Services fail immediately

```
docker compose -f docker-compose.local.yml logs api-gateway
# Error: NEON_DATABASE_URL is not set
```

**Solution**:

1. Verify `.env.docker.local` exists: `ls -la .env.docker.local`
2. Check environment is loaded:

   ```bash
   docker compose --env-file .env.docker.local config | grep NEON_DATABASE_URL
   ```

3. Ensure credentials are correct (test connection):

   ```bash
   psql "$NEON_DATABASE_URL"
   ```

### Database Connection Timeout

**Problem**: Services can't connect to Neon

```
psql: error: could not translate host name "ep-xxx.us-east-2.aws.neon.tech" to address
```

**Solution**:

1. Check internet connection
2. Verify Neon project is still active
3. Test connection string is correct:

   ```bash
   psql "postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require"
   ```

4. Check firewall/VPN isn't blocking Postgres port 5432

### Static Database Errors

**Problem**: Static database won't initialize

```
docker compose -f docker-compose.local.yml logs postgres-static
# Initialization scripts fail
```

**Solution**:

1. Delete and recreate the volume:

   ```bash
   docker compose -f docker-compose.local.yml down -v
   docker compose --env-file .env.docker.local -f docker-compose.local.yml up -d postgres-static
   ```

2. Wait for initialization (first startup takes ~1-2 minutes)
3. Check logs: `docker compose -f docker-compose.local.yml logs postgres-static`

### Port Already in Use

**Problem**: Port conflicts when starting

```
ERROR: for tripalfa-postgres-static: Bind for 0.0.0.0:5433 failed
```

**Solution**:

1. Find what's using the port: `lsof -i :5433`
2. Either:
   - Kill the process: `kill -9 <PID>`
   - Or change port in `docker-compose.local.yml`: Change `5433:5432` to `5434:5432`

### Memory Issues

**Problem**: Docker runs out of memory

```
docker: Error response from daemon: OOM (Out of Memory)
```

**Solution**:

1. Increase Docker memory limits (Docker Desktop → Preferences → Resources)
2. Or stop unnecessary services:

   ```bash
   docker compose -f docker-compose.local.yml down
   # Then selectively start only needed services
   docker compose -f docker-compose.local.yml up -d api-gateway booking-service
   ```

## File Structure

```
.env.docker.example            ← Distribution template (commit this)
.env.docker.local             ← Your local credentials (DO NOT COMMIT)
docker-compose.local.yml      ← Active development compose file
database/static-db/
  docker-compose.yml          ← Static data initialization (optional)
  .env.example                ← Static DB environment template
_archive/docker-legacy/       ← Old/unused compose files (kept for reference)
  docker-compose.kong.yml
  docker-compose.resilient.yml
  infrastructure/compose/
```

## Environment Variables Reference

| Variable | Required | Purpose |
|----------|----------|---------|
| `NEON_DATABASE_URL` | ✅ Yes | Pooled Neon connection (services) |
| `DIRECT_NEON_DATABASE_URL` | ⚠️ Recommended | Direct Neon connection (migrations only) |
| `DUFFEL_API_KEY` | ❌ No | Flight search API key |
| `LITEAPI_API_KEY` | ❌ No | Hotel/transfer search API key |
| `JWT_SECRET` | ✅ Yes | Token signing secret |
| `NODE_ENV` | ℹ️ Optional | `development` (default) or `production` |
| `LOG_LEVEL` | ℹ️ Optional | `debug`, `info` (default), `warn`, `error` |

## Production Setup

For production deployment, refer to [PRODUCTION_DEPLOYMENT_GUIDE.md](./PRODUCTION_DEPLOYMENT_GUIDE.md).

Key differences:

- Use managed database (Neon, AWS RDS) - not local postgres
- Set `NODE_ENV=production`
- Enable security features: `ENABLE_WEBHOOK_SIGNATURE_VERIFICATION=true`
- Use strong JWT secrets
- Configure external payment gateways (Stripe, PayPal)

## Getting Help

- 📖 **Architecture Questions**: See [README.md](./README.md)
- 🐛 **Service Development**: See `services/*/README.md`
- 📦 **Package Dependencies**: See `packages/*/README.md`
- 🗄️ **Database Schema**: See `database/prisma/schema.prisma`
- 🚀 **Deployment**: See [PRODUCTION_DEPLOYMENT_GUIDE.md](./PRODUCTION_DEPLOYMENT_GUIDE.md)

## Next Steps

1. ✅ Complete setup above
2. ✅ Run integration tests: `npm run test:api:duffel`
3. ✅ Start frontend: `npm run dev --workspace=@tripalfa/booking-engine`
4. ✅ Access dashboard: <http://localhost:5176>

Happy coding! 🎉
