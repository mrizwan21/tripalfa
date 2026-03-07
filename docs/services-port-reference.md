# TripAlfa Service Port Reference

## Scope

This file is the quick port and health reference for local process deployments.
Use it with `start-all-services.sh` and `stop-all-services.sh`.

## Process Entry Commands

```bash
./start-all-services.sh
./stop-all-services.sh
```

## Frontend Ports

| Application | Host Port | Notes |
| --- | --- | --- |
| b2b-admin | 5173 | Local Vite dev server |
| booking-engine | 5174 | Local Vite dev server |

## Backend Service Ports

| Service | Host Port | Health Endpoint |
| --- | --- | --- |
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

## Infrastructure Ports

| Component | Host Port | Notes |
| --- | --- | --- |
| Redis | 6379 | Optional local dependency for async/session flows |
| API Gateway | 3000 | Runs as local service |
| Static DB | varies | Uses `STATIC_DATABASE_URL` from env |

## Quick Health Sweep

```bash
for p in 3001 3003 3006 3007 3008 3009 3010 3011 3012 3020 3021; do
  echo "Checking :$p"
  curl -fsS "http://localhost:$p/health" >/dev/null && echo "ok" || echo "down"
done
```

## Troubleshooting

```bash
# Check running local service process
ps aux | grep "pnpm dev" | grep "services/booking-service"

# Follow local logs
tail -f logs/booking-service.log

# Check who owns a port
lsof -i :3001
```
