# TripAlfa Backend Services

This document is the canonical backend service map for local development and operational checks.

## Runtime Mode

TripAlfa local development runs backend services directly on the host machine.
Use workspace `dev` commands as primary entry points.

## Service Port Map

| Service | Port | Health Endpoint |
| --- | --- | --- |
| api-gateway | 3000 | `http://localhost:3000/health` |
| booking-service | 3001 | `http://localhost:3001/health` |
| user-service | 3003 | `http://localhost:3003/health` |
| organization-service | 3006 | `http://localhost:3006/health` |
| payment-service | 3007 | `http://localhost:3007/health` |
| wallet-service | 3008 | `http://localhost:3008/health` |
| notification-service | 3009 | `http://localhost:3009/health` |
| rule-engine-service | 3010 | `http://localhost:3010/health` |
| kyc-service | 3011 | `http://localhost:3011/health` |
| marketing-service | 3012 | `http://localhost:3012/health` |
| b2b-admin-service | 3020 | `http://localhost:3020/health` |
| booking-engine-service | 3021 | `http://localhost:3021/health` |

## Frontend Ports

| Application | Port |
| --- | --- |
| b2b-admin | 5173 |
| booking-engine | 5174 |

## Data Boundaries

- Prisma-managed application data uses Neon/PostgreSQL connection variables.
- Static/reference data uses `STATIC_DATABASE_URL` and remains separate from Prisma-managed application schema.
- Prisma schema location: `database/prisma/schema.prisma`.

## Local Commands

Recommended local startup:

```bash
pnpm --dir services/api-gateway dev
pnpm --dir services/booking-service dev
pnpm --dir services/user-service dev
pnpm --dir services/payment-service dev
pnpm --dir apps/b2b-admin dev
pnpm --dir apps/booking-engine dev
```

Service logs are written to `logs/*.log`.

## Verification

```bash
for p in 3000 3001 3003 3006 3007 3008 3009 3010 3011 3012 3020 3021; do
  printf "Checking :%s ... " "$p"
  curl -fsS "http://localhost:$p/health" >/dev/null && echo ok || echo down
done
```
