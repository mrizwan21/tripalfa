# Database Configuration Guide

This guide explains the 4-database architecture and how to fix common database URL and Prisma client issues.

## Overview

TripAlfa uses a 4-database architecture for optimal performance and separation of concerns:

### Database Purposes

1. **tripalfa_local** (`LOCAL_DATABASE_URL`)
   - **Purpose**: Static reference data (hotels, airports, airlines, countries, currencies)
   - **Content**: Hotel content, Duffel static data, LiteAPI static data
   - **Access Pattern**: Read-heavy, rarely modified (only by importers)

2. **tripalfa_core** (`CORE_DATABASE_URL`)
   - **Purpose**: Core business data (users, bookings, wallet, organizations)
   - **Content**: User accounts, booking transactions, wallet balances, KYC data
   - **Access Pattern**: High-frequency OLTP operations

3. **tripalfa_ops** (`OPS_DATABASE_URL`)
   - **Purpose**: Operational workflows (notifications, rules, documents, disputes)
   - **Content**: Notification logs, business rules, document management, dispute tracking
   - **Access Pattern**: Event-driven, workflow processing

4. **tripalfa_finance** (`FINANCE_DATABASE_URL`)
   - **Purpose**: Financial data (invoices, commission, suppliers, loyalty)
   - **Content**: Invoices, supplier payments, commission rules, loyalty programs
   - **Access Pattern**: Financial reporting and accounting

## Environment Configuration

### Required Environment Variables

```bash
# 4-Database Architecture URLs
LOCAL_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tripalfa_local
CORE_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tripalfa_core
OPS_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tripalfa_ops
FINANCE_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tripalfa_finance

# Static Database URL (for services that need reference data)
STATIC_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tripalfa_local

# Legacy compatibility (fallback)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tripalfa_local
DIRECT_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tripalfa_local
```

### Service Database Mappings

Each service connects to specific databases based on its needs:

- **Booking Service**: `coreDb` + `opsDb` + `localDb` (bookings, workflow, static data)
- **User Service**: `coreDb` (users, roles, sessions)
- **Organization Service**: `coreDb` + `financeDb` (organizations, budgets, campaigns)
- **Static Data Service**: `localDb` (hotel and flight reference data)
- **Wallet Service**: `coreDb` (wallet transactions)
- **Notification Service**: `opsDb` (notification workflows)
- **Finance Service**: `financeDb` (invoices, payments)

## Common Issues and Solutions

### Issue 1: "DATABASE_URL not set" Error

**Problem**: Services can't find database connection strings.

**Solution**: Ensure all required environment variables are set in `.env.local`:

```bash
# Check current environment
echo $CORE_DATABASE_URL
echo $LOCAL_DATABASE_URL
echo $OPS_DATABASE_URL
echo $FINANCE_DATABASE_URL
```

### Issue 2: "Connection refused" Error

**Problem**: PostgreSQL server not running or wrong port.

**Solution**:

1. Start PostgreSQL: `brew services start postgresql` (Mac) or `sudo systemctl start postgresql` (Linux)
2. Verify port 5432 is available: `lsof -i :5432`
3. Test connection: `psql -h localhost -U postgres -d tripalfa_core`

### Issue 3: "Database does not exist" Error

**Problem**: Databases not created.

**Solution**: Create all 4 databases:

```sql
CREATE DATABASE tripalfa_local;
CREATE DATABASE tripalfa_core;
CREATE DATABASE tripalfa_ops;
CREATE DATABASE tripalfa_finance;
```

### Issue 4: Prisma Client Generation Failures

**Problem**: Prisma clients not generated or outdated.

**Solution**: Regenerate all clients:

```bash
# From project root
pnpm run db:generate

# Or manually
cd packages/shared-database
pnpm run generate
```

### Issue 5: "STATIC_DATABASE_URL not found" Error

**Problem**: Services looking for `STATIC_DATABASE_URL` but it's not defined.

**Solution**: Add to `.env.local`:

```bash
STATIC_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tripalfa_local
```

## Database Operations

### 1. Create Databases

```bash
# Connect to PostgreSQL
psql -h localhost -U postgres

# Create databases
CREATE DATABASE tripalfa_local;
CREATE DATABASE tripalfa_core;
CREATE DATABASE tripalfa_ops;
CREATE DATABASE tripalfa_finance;
```

### 2. Push Schema Changes

```bash
# Push all schemas
pnpm run db:push

# Or individually
pnpm run db:migrate:local
pnpm run db:migrate:core
pnpm run db:migrate:ops
pnpm run db:migrate:finance
```

### 3. Seed Databases

```bash
# Seed with test data
pnpm run db:seed
```

### 4. Verify Connections

```bash
# Run verification script
node scripts/verify-database-connections.js

# Or manually test each database
psql $LOCAL_DATABASE_URL -c "SELECT NOW();"
psql $CORE_DATABASE_URL -c "SELECT NOW();"
psql $OPS_DATABASE_URL -c "SELECT NOW();"
psql $FINANCE_DATABASE_URL -c "SELECT NOW();"
```

## Service-Specific Configuration

### Booking Service

```typescript
// Uses: coreDb (bookings), opsDb (workflow), localDb (static data)
import { coreDb, opsDb, localDb } from '@tripalfa/shared-database';
```

### User Service

```typescript
// Uses: coreDb (users, roles, sessions)
import { coreDb } from '@tripalfa/shared-database';
```

### Static Data Service

```typescript
// Uses: localDb (hotel and flight reference data)
import { localDb } from '@tripalfa/shared-database';
```

## Troubleshooting Checklist

- [ ] All 4 PostgreSQL databases exist
- [ ] All database URLs are set in `.env.local`
- [ ] PostgreSQL server is running on port 5432
- [ ] Database credentials are correct
- [ ] Prisma clients are generated
- [ ] Services can connect to their respective databases
- [ ] No conflicting environment variables

## Quick Commands

```bash
# Environment setup
cp .env.local.example .env.local  # if needed

# Database operations
pnpm run db:generate    # Generate Prisma clients
pnpm run db:push        # Push schema changes
pnpm run db:seed        # Seed with test data
pnpm run db:reset       # Regenerate + seed

# Verification
node scripts/verify-database-connections.js
node scripts/regenerate-prisma-clients.js

# Service startup
pnpm run dev  # Start all services
```

## Production Deployment

For production, use secure database URLs with SSL:

```bash
# Production example
CORE_DATABASE_URL="postgresql://user:pass@prod-db.example.com:5432/tripalfa_core?sslmode=require"
```

Ensure:

- SSL is enabled (`sslmode=require`)
- Database credentials are stored securely (not in code)
- Connection pooling is configured appropriately
- Monitoring and alerting are set up
