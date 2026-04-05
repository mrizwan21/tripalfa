# TripAlfa 4-Database Architecture — Quick Reference

## 🚀 Quick Start

### Start All Services

```bash
npm run dev
```

### Start Single Service

```bash
npm run dev --workspace=@tripalfa/api-gateway
npm run dev --workspace=@tripalfa/booking-service
npm run dev --workspace=@tripalfa/wallet-service
```

### Verify Everything Works

```bash
bash scripts/verify-architecture.sh
```

---

## 📊 4 Databases at a Glance

| Name                 | Tables | Purpose                         | Connection             |
| -------------------- | ------ | ------------------------------- | ---------------------- |
| **tripalfa_local**   | 29     | Static data (hotels, flights)   | `LOCAL_DATABASE_URL`   |
| **tripalfa_core**    | 60     | Users, bookings, wallet, KYC    | `CORE_DATABASE_URL`    |
| **tripalfa_ops**     | 26     | Notifications, rules, documents | `OPS_DATABASE_URL`     |
| **tripalfa_finance** | 36     | Invoices, loyalty, marketing    | `FINANCE_DATABASE_URL` |

---

## 📦 4 Prisma Clients

```typescript
import { localDb, coreDb, opsDb, financeDb } from "@tripalfa/shared-database";

// Static data (read-only)
await localDb.hotel_content.findMany();

// Main app operations
await coreDb.user.findUnique({ where: { id: "123" } });

// Workflows
await opsDb.notification.create({ data: {...} });

// Financial reporting
await financeDb.invoice.findMany();
```

---

## 🔧 Common Tasks

### Add a New Model to Core Database

```bash
# 1. Edit database/prisma/schema.core.prisma
# 2. Regenerate client
bash scripts/generate-prisma-clients.sh
# 3. Create migration
npm run db:migrate -- --name add_my_table
# 4. Apply migration
npm run db:push
```

### Create Migration for Any Database

```bash
npm run db:migrate -- --name descriptive_name
```

### Run Migrations

```bash
npm run db:push
```

### Regenerate Prisma Clients

```bash
bash scripts/generate-prisma-clients.sh
```

### Type Check Your Code

```bash
npx tsc --noEmit
```

### Lint & Format

```bash
npm run lint
npm run format
```

---

## 🔌 Service Database Mapping

### Single Database Services

```text
user-service          → coreDb
kyc-service           → coreDb
notification-service  → opsDb
rule-engine-service   → opsDb
marketing-service     → financeDb
api-gateway          → coreDb
```

### Multi-Database Services

```text
booking-service           → coreDb + opsDb + localDb
wallet-service            → coreDb + financeDb
organization-service      → coreDb + financeDb
payment-service           → coreDb + financeDb
booking-engine-service    → coreDb + localDb + opsDb
b2b-admin-service       → coreDb + opsDb + financeDb (read-only)
```

user-service → coreDb
kyc-service → coreDb
notification-service → opsDb
rule-engine-service → opsDb
marketing-service → financeDb
api-gateway → coreDb

```text
### Multi-Database Services

booking-service → coreDb + opsDb + localDb
wallet-service → coreDb + financeDb
organization-service → coreDb + financeDb
payment-service → coreDb + financeDb
booking-engine-service → coreDb + localDb + opsDb
b2b-admin-service → coreDb + opsDb + financeDb (read-only)
```

### Service Database Configuration

Each service has `src/database.ts`:

```typescript
// Example: booking-service
export { coreDb as prisma } from '@tripalfa/shared-database';
export { coreDb, opsDb, localDb } from '@tripalfa/shared-database';
```

---

## 📝 Using Databases in Code

### Current Way (What Services Do)

```typescript
// In any service, import from local database.ts
import { prisma, coreDb, opsDb, financeDb } from './database.js';

// Use directly
const user = await prisma.user.findUnique({ where: { id } });
const orders = await coreDb.booking.findMany();
const notifications = await opsDb.notification.findMany();
const invoices = await financeDb.invoice.findMany();
```

### Direct Way (From Shared Database)

```typescript
// Import directly from shared-database package
import { coreDb, opsDb, financeDb, localDb } from '@tripalfa/shared-database';

// Use directly
const user = await coreDb.user.findUnique({ where: { id } });
const hotels = await localDb.hotel_content.findMany();
```

---

## 🔍 Debugging

### View All Connections

```bash
psql -U postgres -c "SELECT datname, count(*) as connections FROM pg_stat_activity GROUP BY datname;"
```

### Query a Specific Database

```bash
# Core database
psql -d tripalfa_core -U postgres -h localhost -c "SELECT COUNT(*) FROM users;"

# Ops database
psql -d tripalfa_ops -U postgres -h localhost -c "SELECT COUNT(*) FROM notification;"

# Finance database
psql -d tripalfa_finance -U postgres -h localhost -c "SELECT COUNT(*) FROM invoice;"

# Local database
psql -d tripalfa_local -U postgres -h localhost -c "SELECT COUNT(*) FROM hotel_content;"
```

### Check Applied Migrations

```bash
psql -d tripalfa_core -U postgres -h localhost -c "SELECT * FROM _prisma_migrations;"
```

### View Service Logs

```bash
# All services
npm run dev 2>&1 | grep "error\|ERROR\|Error"

# Single service
npm run dev --workspace=@tripalfa/booking-service 2>&1
```

---

## ⚠️ Common Mistakes & Solutions

### ❌ Importing from wrong database

```typescript
// WRONG
import { prisma } from '@tripalfa/shared-database';
// This imports coreDb by default, might not be correct for your service

// RIGHT
import { opsDb } from './database.js';
// Use the service's local database.ts for correct client
```

### ❌ Forgetting to regenerate Prisma clients after schema change

```bash
# After editing any .prisma file, MUST run:
bash scripts/generate-prisma-clients.sh
# Then migrate:
npm run db:push
```

### ❌ Service starts but can't query database

```bash
# Check:
1. Verify .env has all 4 database URLs
2. Verify PostgreSQL is running
3. Verify service's database.ts exports correct client
4. Check service imports from "./database.js" not "@tripalfa/shared-database"
```

### ❌ TypeScript errors about missing types

```bash
# Regenerate Prisma clients:
bash scripts/generate-prisma-clients.sh

# Or clear and reinstall:
rm -rf node_modules
npm install
```

---

## 📚 Files to Know

| File                                    | Purpose                         |
| --------------------------------------- | ------------------------------- |
| `.env`                                  | Database URLs & configuration   |
| `database/prisma/schema.*.prisma`       | Schema definitions (4 files)    |
| `database/migrations/`                  | SQL migration files             |
| `packages/shared-database/src/index.ts` | 4-client export layer           |
| `scripts/generate-prisma-clients.sh`    | Automated client generation     |
| `scripts/verify-architecture.sh`        | Architecture verification       |
| `services/*/src/database.ts`            | Service-specific client exports |
| `FOUR_DATABASE_ARCHITECTURE.md`         | Full documentation (this repo)  |

---

## 🌍 Environment Files

### Development (Local PostgreSQL)

**.env** (already configured)

```bash
LOCAL_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/tripalfa_local"
CORE_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/tripalfa_core"
OPS_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/tripalfa_ops"
FINANCE_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/tripalfa_finance"
```

### Production (local PostgreSQL Cloud)

**.env.production** (example)

```bash
LOCAL_DATABASE_URL="postgresql://user:pass@localhost/tripalfa_local?sslmode=require"
CORE_DATABASE_URL="postgresql://user:pass@localhost/tripalfa_core?sslmode=require"
OPS_DATABASE_URL="postgresql://user:pass@localhost/tripalfa_ops?sslmode=require"
FINANCE_DATABASE_URL="postgresql://user:pass@localhost/tripalfa_finance?sslmode=require"
```

---

## 📞 Support

- **Full Documentation**: See `FOUR_DATABASE_ARCHITECTURE.md`
- **Verify Everything**: `bash scripts/verify-architecture.sh`
- **Service Health**: `curl http://localhost:3030/health`
- **Database Status**: `psql -U postgres -l | grep tripalfa`

---

**Status**: ✅ Production Ready  
**Last Updated**: 9 March 2026
