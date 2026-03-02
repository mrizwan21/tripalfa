# NEON Optimization Plan (TripAlfa)

## Objective

Build an optimized Neon database layout for low-latency queries while keeping the static local PostgreSQL database fully separate and untouched.

## Constraints

- `staticdatabase` remains local Docker only.
- No service should use local static DB for transactional data.
- App transactional workload runs on Neon.

## Verified Current Inventory

- 12 backend services
- 2 frontend apps
- 11 shared packages
- 3 local infra services in local stack (`env-validator`, `postgres-static`, `redis`)

Optional infra exists in alternate stacks (Kong/resilient/hybrid) and is not missing from baseline.

## Optimized Neon Topology

Core transactional and service-isolated databases:

1. `neondb` (core shared transactional domain)
2. `tripalfa_user_service`
3. `tripalfa_payment_service`
4. `tripalfa_booking_service`
5. `tripalfa_notification_service`
6. `tripalfa_wallet_service`
7. `tripalfa_audit_service`

Rationale:
- Keep one shared low-latency core DB for cross-domain reads.
- Isolate high-write / sensitive domains (wallet, audit, payment) to reduce lock contention and improve tail latency.
- Preserve existing naming style used in project files.

## Performance Controls Applied

For each Neon DB:
- `statement_timeout = 30s`
- `lock_timeout = 5s`
- `idle_in_transaction_session_timeout = 10s`
- `default_statistics_target = 200`

These settings target better planner decisions and safer behavior under high concurrency.

## Execution Plan

### Phase 1: Reset/Rebuild Neon Databases

Use:

```bash
npm run neon:rebuild:optimized
```

Script path:
- `scripts/neon/rebuild-neon-optimized.sh`

What it does:
1. Validates required Neon variables
2. Terminates active sessions on target Neon DBs
3. Drops and recreates optimized target DBs
4. Applies DB-level tuning defaults
5. Deploys Prisma schema to `neondb`
6. Regenerates Prisma client

### Phase 2: Validation

Run:

```bash
npx tsc -p tsconfig.json --noEmit
npm run test:api:liteapi:orchestrator
npm run test:api:wallet:orchestrator
npm run test:fx:advanced:edge
```

### Phase 3: Query Optimization Follow-up

- Enable/inspect `pg_stat_statements` on Neon
- Capture top p95 queries and add targeted composite/partial indexes
- Prefer keyset pagination for large list endpoints
- Partition append-heavy event/audit tables over time

## Required Environment Variables

Set before running rebuild script:

```bash
export NEON_ADMIN_DATABASE_URL="postgresql://neondb_owner:<password>@<host>/postgres?sslmode=require"
export NEON_POOLED_HOST="<neon-pooler-host>"
export NEON_DIRECT_HOST="<neon-direct-host>"
export DB_PASSWORD="<password>"
```

Notes:
- `NEON_ADMIN_DATABASE_URL` must point to a Neon maintenance DB (typically `postgres`), not `staticdatabase`.
- Script explicitly does not include or touch `staticdatabase`.

## Static DB Separation Guarantee

- Static DB endpoint remains: `STATIC_DATABASE_URL=.../staticdatabase`
- Static DB usage remains limited to static reference lookups.
- All transactional DB URLs are configured for Neon.
