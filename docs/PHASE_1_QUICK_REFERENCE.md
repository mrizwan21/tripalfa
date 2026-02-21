# Phase 1: Quick Reference Guide

## Canonical Service Ports

```text
API Gateway             → 3000
Booking Service         → 3001
User Service            → 3004
Notification Service    → 3005
Organization Service    → 3006
Payment Service         → 3007 ⭐ CANONICAL
Rule Engine Service     → 3010 ⭐ CANONICAL
KYC Service             → 3011
Marketing Service       → 3012
```

## Important: Wallet API is ONLY through API Gateway

❌ **DO NOT** access Payment Service wallet endpoints directly:

```text
WRONG: http://payment-service:3007/api/wallet/balance
```

✅ **DO** use API Gateway:

```text
CORRECT: http://api-gateway:3000/api/wallet/balance
```

## Docker-Compose Quick Start

### Local Development

```bash
# Start all services
docker-compose -f docker-compose.local.yml up -d

# Check service health
curl http://localhost:3000/health      # API Gateway
curl http://localhost:3007/health      # Payment Service
curl http://localhost:3010/health      # Rule Engine Service

# Test wallet API
curl -H "Authorization: Bearer test-token" \
  http://localhost:3000/api/wallet/balance?currency=USD
```

### Neon Staging

```bash
# Build and push images
docker-compose -f docker-compose.neon.yml build
docker-compose -f docker-compose.neon.yml up -d

# Verify canonical ports are respected
docker ps | grep payment-service    # Should show port 3007
docker ps | grep rule-engine        # Should show port 3010
```

## Environment Variables

### For API Gateway

```bash
PAYMENT_SERVICE_URL=http://payment-service:3007
PAYMENT_SERVICE_PORT=3007
RULE_ENGINE_SERVICE_URL=http://rule-engine-service:3010
RULE_ENGINE_SERVICE_PORT=3010
NOTIFICATION_SERVICE_URL=http://notification-service:3005
```

### For Payment Service

```bash
PAYMENT_SERVICE_PORT=3007
DATABASE_URL=postgresql://...
REDIS_URL=redis://redis:6379
```

### For Rule Engine Service

```bash
RULE_ENGINE_SERVICE_PORT=3010
REDIS_URL=redis://redis:6379
```

## Wallet API Endpoints

All accessible via: `http://API_GATEWAY/api/wallet/...`

| Endpoint | Method | Auth | Idempotent | Purpose |
| -------- | ------ | ---- | --------- | ------- |
| `/api/wallet` | GET | Yes | - | List all wallets |
| `/api/wallet/balance` | GET | Yes | - | Get balance |
| `/api/wallet/credit` | POST | Yes | Yes | Deposit funds |
| `/api/wallet/debit` | POST | Yes | Yes | Withdraw funds |
| `/api/wallet/transfer` | POST | Yes | Yes | Currency exchange |
| `/api/wallet/fx-preview` | GET | Yes | - | FX rate preview |
| `/api/wallet/history` | GET | Yes | - | Transaction log |

## TypeScript Build

### Incremental Build (Phase 2)

```bash
# Once tsc -b is enabled
npx tsc -b
```

### Type Check Only

```bash
npx tsc -p tsconfig.json --noEmit
```

### Build Specific Service

```bash
npm run build --workspace=@tripalfa/payment-service
```

## Docker Build Optimization

### BuildKit Cache Features

```dockerfile
# pnpm store persisted across builds
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install

# TypeScript build cache preserved
RUN --mount=type=cache,target=/app/.tsbuildcache pnpm build
```

### Faster Rebuilds

1. pnpm store is cached → faster `pnpm install`
2. TypeScript incremental info preserved → faster compilation
3. Lockfiles copied before sources → minimal invalidation

## Common Troubleshooting

### Service Not Accessible from API Gateway

```bash
# Check docker network
docker network ls
docker network inspect tripalfa-local

# Check service is running on correct port
docker logs tripalfa-payment-service-local | grep "running on port"
```

### Port Already in Use

```bash
# Find process using port
lsof -i :3007

# Kill process (macOS)
kill -9 <PID>

# Or use different compose file/port override
docker-compose -f docker-compose.local.yml -e PAYMENT_SERVICE_PORT=3008 up
```

### Wallet Operation Fails

```bash
# Check authentication header
Authorization: Bearer <valid-jwt>

# Generate unique idempotency key
import { randomUUID } from 'crypto'
idempotencyKey: randomUUID()  // e.g., "550e8400-e29b-41d4-a716-446655440000"

# Check currency is valid (USD, EUR, GBP, etc.)
currency: "USD"

# Verify sufficient balance
GET /api/wallet/balance?currency=USD
```

### Gateway Can't Reach Service

```bash
# Check API Manager configuration
services/api-gateway/src/config/api-manager.config.ts

# Verify URL format
PAYMENT_SERVICE_URL: http://payment-service:3007  ✓ (docker hostname)
PAYMENT_SERVICE_URL: http://localhost:3007        ✗ (won't work from gateway)
```

## Development Workflow

### Adding a New Endpoint to Wallet

1. Edit `/services/payment-service/src/routes/wallet.ts`
2. Register in `/services/api-gateway/src/config/api-manager.config.ts` under `WALLET_ENDPOINTS`
3. Add middleware (auth, idempotency) if needed
4. Test through API Gateway: `curl http://localhost:3000/api/wallet/<new-endpoint>`

### Modifying Service Port

1. Update `PORT` env var in docker-compose
2. Update `PAYMENT_SERVICE_PORT` or `RULE_ENGINE_SERVICE_PORT`
3. Update API Manager service config if needed
4. Rebuild and restart: `docker-compose up -d --build`

### Debugging Request Flow

```bash
# Enable request logging in API Gateway
LOG_LEVEL=debug docker-compose up

# Check which service handles the request
# Look for: "[request-id] Route: GET /api/wallet → paymentService"

# Trace to Payment Service
docker logs tripalfa-payment-service-local | grep "request-id"
```

## References

- **Wallet API Contract:** `docs/WALLET_API_CONTRACT.md`
- **Phase 1 Summary:** `docs/PHASE_1_COMPLETION_SUMMARY.md`
- **API Manager Config:** `services/api-gateway/src/config/api-manager.config.ts`
- **Wallet Routes:** `services/payment-service/src/routes/wallet.ts`
- **Wallet Library:** `packages/wallet/`

## Support

- **Slack:** #backend-support
- **Docs:** <https://docs.tripinfo.internal>
- **Status:** <https://status.tripinfo.com>

---

**Last Updated:** 2026-02-14  
**Version:** 1.0.0
