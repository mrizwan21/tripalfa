# TripAlfa Quick Reference - Local Deployment

## Current Status

- ✅ **All systems operational**
- ✅ PostgreSQL: Running on port 5432
- ✅ Services: 12+ active and responding
- ✅ Frontends: Ready on ports 5173 and 5174

## Essential Commands

### Start Everything

```bash
bash scripts/start-local-dev.sh
```

### Check Service Health

```bash
# All services
bash scripts/health-check.sh

# Specific services
curl http://localhost:3000/health    # API Gateway
curl http://localhost:3001/health    # Booking Service
curl http://localhost:3004/health    # User Service
curl http://localhost:3007/health    # Payment Service
```

### Test Database

```bash
psql -U postgres -h localhost -d staticdatabase -c "SELECT version();"
```

### View Logs

```bash
# Watch all logs
tail -f .logs/*.log

# Specific service
tail -f .logs/api-gateway.log
tail -f .logs/booking-service.log
```

### Stop Services

```bash
pkill -f "tsx watch"
```

## Application URLs

| App | URL | Purpose |
| --- | --- | --- |
| API Gateway | <http://localhost:3000> | Backend API |
| Booking Engine | <http://localhost:5173> | User Portal |
| B2B Admin | <http://localhost:5174> | Admin Panel |

## Database

- **Host:** localhost
- **Port:** 5432
- **Database:** staticdatabase
- **User:** postgres
- **Password:** postgres

## If Issues Occur

### Services won't start

```bash
# 1. Check if Prisma is generated
pnpm dlx prisma generate --schema database/prisma/schema.prisma

# 2. Verify dependencies
pnpm install

# 3. Restart services
pkill -f "tsx watch"
bash scripts/start-local-dev.sh
```

### Database connection fails

```bash
# 1. Verify PostgreSQL is running
brew services list | grep postgresql@14

# 2. Restart PostgreSQL
brew services restart postgresql@14

# 3. Test connection
psql -U postgres -h localhost -d staticdatabase -c "SELECT 1;"
```

### Port already in use

```bash
# Find process
lsof -i :3000

# Kill it
kill -9 <PID>
```

## Performance Tips

- Ensure at least 4GB RAM available
- Run services on local SSD for best performance
- Use separate terminal window for logs
- TypeScript watch mode auto-recompiles on file changes

---

**Complete local deployment documentation:** See [LOCAL_DEPLOYMENT_SUCCESS.md](LOCAL_DEPLOYMENT_SUCCESS.md)
