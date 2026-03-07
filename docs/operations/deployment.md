# TripAlfa Deployment Guide

This guide defines the current local deployment workflow and the canonical files to use.

## Canonical Runtime

TripAlfa local deployment is process-first on the host machine.

- Primary entry commands are workspace `dev` commands (run in separate terminals).

## Prerequisites

- Node.js 18+
- `pnpm`

## Environment Setup

```bash
cp .env.example .env.local
```

Populate `.env.local` with at least:

```dotenv
DATABASE_URL=postgresql://...
DIRECT_DATABASE_URL=postgresql://...
JWT_SECRET=...
```

Optional:

```dotenv
STATIC_DATABASE_URL=postgresql://...
DUFFEL_API_KEY=...
LITEAPI_API_KEY=...
```

## Start and Stop

```bash
pnpm --dir services/api-gateway dev
pnpm --dir services/booking-service dev
pnpm --dir services/user-service dev
pnpm --dir services/payment-service dev
pnpm --dir apps/b2b-admin dev
pnpm --dir apps/booking-engine dev

# Stop services with Ctrl+C in each terminal
```

## Logs

```bash
tail -f logs/*.log
```

## Health Verification

```bash
for p in 3001 3003 3006 3007 3008 3009 3010 3011 3012 3020 3021; do
  printf "Checking :%s ... " "$p"
  curl -fsS "http://localhost:$p/health" >/dev/null && echo ok || echo down
done
```

Frontend endpoints:

- `http://localhost:5173`
- `http://localhost:5174`

## Related References

- `LOCAL_DEVELOPMENT.md`
- `docs/services-port-reference.md`
- `docs/architecture/BACKEND_SERVICES.md`
