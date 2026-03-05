# TripAlfa Services Port Reference Guide

## Complete Port Mapping

This document provides a quick reference for all service ports in the hybrid local development environment.

### Docker Services (Infrastructure)

| Service | Port | Host | Status | Purpose |
|---------|------|------|--------|---------|
| API Gateway | 3000 | localhost:3000 | Running | Central API gateway for all requests |
| PostgreSQL Static DB | 5435 | localhost:5435 | Running | Reference/static data storage |

### Local Backend Services (Node.js)

| # | Service Name | Port | URL | Status | Command |
|---|--------------|------|-----|--------|---------|
| 1 | api-gateway | 3000 | http://localhost:3000 | Docker | docker compose up |
| 2 | booking-service | 3001 | http://localhost:3001 | Local | pnpm dev |
| 3 | user-service | 3003 | http://localhost:3003 | Local | pnpm dev |
| 4 | organization-service | 3006 | http://localhost:3006 | Local | pnpm dev |
| 5 | payment-service | 3007 | http://localhost:3007 | Local | pnpm dev |
| 6 | wallet-service | 3008 | http://localhost:3008 | Local | pnpm dev |
| 7 | notification-service | 3009 | http://localhost:3009 | Local | pnpm dev |
| 8 | rule-engine-service | 3010 | http://localhost:3010 | Local | pnpm dev |
| 9 | kyc-service | 3011 | http://localhost:3011 | Local | pnpm dev |
| 10 | marketing-service | 3012 | http://localhost:3012 | Local | pnpm dev |
| 11 | b2b-admin-service | 3020 | http://localhost:3020 | Local | pnpm dev |
| 12 | booking-engine-service | 3021 | http://localhost:3021 | Local | pnpm dev |

### Local Frontend Applications (Vite Dev Servers)

| # | Application | Port | URL | Status | Command |
|---|-------------|------|-----|--------|---------|
| 1 | b2b-admin | 5173 | http://localhost:5173 | Local | pnpm dev |
| 2 | booking-engine | 5174 | http://localhost:5174 | Local | pnpm dev |

### External Services

| Service | Endpoint | Auth Method | Environment Variable |
|---------|----------|-------------|----------------------|
| Neon Cloud DB | postgresql://... | Connection String | NEON_DATABASE_URL |
| Duffel API | https://api.duffel.com | API Key | DUFFEL_API_KEY |
| LiteAPI | https://api.liteapi.travel | API Key | LITEAPI_KEY |
| Stripe | https://api.stripe.com | Secret Key | STRIPE_SECRET_KEY |
| Resend | https://api.resend.com | API Key | RESEND_API_KEY |

## Port Ranges

- **Docker Infrastructure**: 3000, 5435
- **Local Backend Services**: 3001-3012, 3020-3021 (non-sequential)
- **Local Frontend Apps**: 5173-5174

## Health Check Endpoints

All local backend services expose health check endpoints:

```bash
# Check individual service health
curl http://localhost:3001/health   # booking-service
curl http://localhost:3003/health   # user-service
curl http://localhost:3006/health   # organization-service
curl http://localhost:3007/health   # payment-service
curl http://localhost:3008/health   # wallet-service
curl http://localhost:3009/health   # notification-service
curl http://localhost:3010/health   # rule-engine-service
curl http://localhost:3011/health   # kyc-service
curl http://localhost:3012/health   # marketing-service
curl http://localhost:3020/health   # b2b-admin-service
curl http://localhost:3021/health   # booking-engine-service

# Check API Gateway health
curl http://localhost:3000/health   # api-gateway (Docker)
```

## Service Dependencies

### booking-service (3001)
- Depends on: payment-service, wallet-service
- Called by: API Gateway, frontend apps
- Database: Neon Cloud

### user-service (3003)
- Depends on: notification-service
- Called by: API Gateway, other services
- Database: Neon Cloud

### payment-service (3007)
- Depends on: wallet-service, stripe integration
- Called by: booking-service, API Gateway
- Database: Neon Cloud
- External: Stripe API

### organization-service (3006)
- Depends on: None
- Called by: API Gateway, user-service
- Database: Neon Cloud

### wallet-service (3008)
- Depends on: None
- Called by: booking-service, payment-service
- Database: Neon Cloud

### notification-service (3009)
- Depends on: Resend API
- Called by: user-service, booking-service
- Database: Neon Cloud
- External: Resend Email API

### rule-engine-service (3010)
- Depends on: None
- Called by: booking-service, promotion services
- Database: Neon Cloud

### kyc-service (3011)
- Depends on: None
- Called by: user-service, organization-service
- Database: Neon Cloud

### marketing-service (3012)
- Depends on: rule-engine-service
- Called by: API Gateway
- Database: Neon Cloud

### b2b-admin-service (3020)
- Depends on: user-service, organization-service
- Called by: b2b-admin frontend
- Database: Neon Cloud

### booking-engine-service (3021)
- Depends on: booking-service, booking-engine frontend
- Called by: booking-engine frontend
- Database: Neon Cloud
- External: Duffel API, LiteAPI

## Network Communication

```
Frontend Apps (5173, 5174)
        ↓
API Gateway (3000 - Docker)
        ↓
Backend Services (3001-3021)
        ↓
Neon Cloud Database
        ↓
External APIs (Duffel, LiteAPI, Stripe, Resend)
```

## Port Conflict Troubleshooting

If a port is already in use:

```bash
# Find what's using a port
lsof -i :3001

# Kill the process
kill -9 <PID>

# Or change the port in .env.local
USER_SERVICE_PORT=3033  # Use different port
```

## Service Startup Order

For optimal startup, services are started in this order:

1. **API Gateway** (Docker) - Must be running first
2. **Static Database** (Docker) - Must be running for migrations
3. **user-service** - Base service, needed by others
4. **booking-service** - Depends on user-service
5. **payment-service** - Depends on wallet-service
6. **wallet-service** - Independent
7. **organization-service** - Independent
8. **notification-service** - Independent
9. **rule-engine-service** - Independent
10. **kyc-service** - Independent
11. **marketing-service** - Depends on rule-engine
12. **b2b-admin-service** - Depends on user-service
13. **booking-engine-service** - Depends on booking-service
14. **Frontend Apps** (5173, 5174) - Can start anytime

The `start-all-services.sh` script handles this order automatically.

## Quick Commands

```bash
# Start all services
./start-all-services.sh

# Stop all services
./stop-all-services.sh

# Check specific service
curl http://localhost:3001/health

# View service logs
tail -f logs/booking-service.log

# List all running services
ps aux | grep "pnpm dev"

# Check Docker services
docker ps
```

## Available Ports on MacBook

To find available ports on your system:

```bash
# Check which ports are in use
lsof -i -P -n | grep LISTEN

# Check specific port
lsof -i :3001

# See all listening services
netstat -tulpn 2>/dev/null | grep LISTEN
```

## Environment Variable Configuration

All service ports are configurable via `.env.local`:

```bash
# Backend service ports
USER_SERVICE_PORT=3003
BOOKING_SERVICE_PORT=3001
PAYMENT_SERVICE_PORT=3007
ORGANIZATION_SERVICE_PORT=3006
WALLET_SERVICE_PORT=3008
NOTIFICATION_SERVICE_PORT=3009
RULE_ENGINE_SERVICE_PORT=3010
KYC_SERVICE_PORT=3011
MARKETING_SERVICE_PORT=3012
B2B_ADMIN_SERVICE_PORT=3020
BOOKING_ENGINE_SERVICE_PORT=3021

# Frontend app ports
B2B_ADMIN_PORT=5173
BOOKING_ENGINE_PORT=5174

# API Gateway (Docker)
API_GATEWAY_PORT=3000

# Static Database (Docker)
STATIC_DB_PORT=5435
```

## Monitoring All Ports

Create a monitoring script to watch all services:

```bash
#!/bin/bash
# watch-services.sh

watch -n 2 'echo "=== Docker Services ===" && docker ps --format "table {{.Names}}\t{{.Status}}" && echo "" && echo "=== Local Services ===" && lsof -i -P -n | grep LISTEN | grep "3001\|3003\|3006\|3007\|3008\|3009\|3010\|3011\|3012\|3020\|3021\|5173\|5174"'
```

Make it executable and run:

```bash
chmod +x watch-services.sh
./watch-services.sh
```

## Performance Optimization

For optimal performance with all services running:

1. **Allocate sufficient RAM** to Docker (at least 4GB)
2. **Use SSD** for better I/O performance
3. **Monitor resource usage**: `htop` or Activity Monitor
4. **Selectively start** only services you're working on
5. **Use log rotation** to prevent disk space issues

## Summary

- **Total Services**: 14 (2 Docker + 11 Local + 1 Local API Gateway mock)
- **Total Ports Used**: 3000-3021 (backend), 5173-5174 (frontend), 5435 (DB)
- **Frontend Apps**: 2 (b2b-admin, booking-engine)
- **Backend Services**: 11 (local) + 1 (Docker)
- **Infrastructure**: 2 (API Gateway + Static DB in Docker)
- **Cloud Services**: Neon + External APIs

All ports are configured in `.env.local` and can be customized as needed.