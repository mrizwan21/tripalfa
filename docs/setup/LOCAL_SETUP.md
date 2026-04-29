# Local Setup

## Prerequisites

- Node.js 18+
- pnpm 10+
- PostgreSQL (local)

## Install

```bash
pnpm install
```

## Build

```bash
pnpm -r build
```

## Test

```bash
pnpm -r --if-present test
```

## Start selected apps/services

```bash
pnpm --filter @tripalfa/booking-service dev
pnpm --filter @tripalfa/booking-engine-service dev
pnpm --filter booking-engine dev
pnpm --filter b2b-portal dev
pnpm --filter call-center-portal dev
pnpm --filter super-admin-portal dev
```

## Database scripts

- Verify frontend app databases: `bash tools/scripts/bin/verify_databases.sh`
- Bootstrap frontend schemas: `psql ... -f tools/scripts/db/bootstrap_frontend_apps.sql`
- Seed frontend sample data: `psql ... -f tools/scripts/db/seed_frontend_sample_data.sql`
