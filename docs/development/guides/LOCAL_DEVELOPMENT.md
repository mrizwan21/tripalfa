# TripAlfa Local Development (Process-First)

## Overview

TripAlfa local development runs backend services directly on the host machine.
Docker is no longer required for the default backend runtime.

## Runtime Model

- Start services via workspace commands, for example:
  - `pnpm --dir services/api-gateway dev`
  - `pnpm --dir services/booking-service dev`
  - `pnpm --dir services/user-service dev`
  - `pnpm --dir services/payment-service dev`
  - `pnpm --dir apps/b2b-admin dev`
  - `pnpm --dir apps/booking-engine dev`
- `database/prisma/schema.prisma`: Prisma schema for application data (local PostgreSQL/PostgreSQL).
- `STATIC_DATABASE_URL`: separate static/reference database connection used by selected services.

## Prerequisites

- Node.js 18+
- pnpm

## Environment

Recommended local env files:

- `.env.local`
- `.env` (fallback)

Minimum required values:

```dotenv
DATABASE_URL=postgresql://...
DIRECT_DATABASE_URL=postgresql://...
JWT_SECRET=...
```

Optional but common:

```dotenv
STATIC_DATABASE_URL=postgresql://...
DUFFEL_API_KEY=...
LITEAPI_API_KEY=...
```

## Start and Stop

From repo root:

```bash
pnpm --dir services/api-gateway dev
pnpm --dir services/booking-service dev
pnpm --dir services/user-service dev
pnpm --dir services/payment-service dev
pnpm --dir apps/b2b-admin dev
pnpm --dir apps/booking-engine dev
```

Stop services:

```bash
# Use Ctrl+C in each service/frontend terminal
```

## Typical Endpoints

When running locally, the usual endpoints are:

- `http://localhost:5173` (b2b-admin)
- `http://localhost:5174` (booking-engine)
- `http://localhost:3001/health` (booking-service)
- `http://localhost:3003/health` (user-service)
- `http://localhost:3006/health` (organization-service)
- `http://localhost:3007/health` (payment-service)
- `http://localhost:3008/health` (wallet-service)
- `http://localhost:3009/health` (notification-service)
- `http://localhost:3010/health` (rule-engine-service)
- `http://localhost:3011/health` (kyc-service)
- `http://localhost:3012/health` (marketing-service)
- `http://localhost:3020/health` (b2b-admin-service)
- `http://localhost:3021/health` (booking-engine-service)

## Prisma Workflow

Prisma commands are run from repo root and target `database/prisma/schema.prisma`:

```bash
pnpm run db:generate
pnpm run db:migrate
pnpm run db:push
pnpm run db:studio
```

`prisma.config.ts` resolves the datasource URL from `DIRECT_DATABASE_URL` first, then `DATABASE_URL`.

## Validation

Recommended checks after changes:

```bash
npx tsc -p tsconfig.json --noEmit
pnpm run lint
pnpm run build
```
