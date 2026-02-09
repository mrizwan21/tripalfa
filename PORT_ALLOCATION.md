# TripAlfa Port Allocation Guide

This document provides a standardized port allocation for all services in the TripAlfa project to avoid conflicts when running multiple services simultaneously.

## Standardized Port Allocation

### Application Services (3000-3010)

| Port | Service | Status | Notes |
|------|---------|--------|-------|
| 3000 | api-gateway | ✅ **RESERVED** | Main API Gateway (Fastify) |
| 3001 | booking-service | ✅ **RESERVED** | Booking microservice |
| 3002 | inventory-service | ✅ **RESERVED** | Inventory/search service |
| 3003 | user-service | ✅ **RESERVED** | User management service |
| 3004 | payment-service | ✅ **RESERVED** | Payment processing service |
| 3005 | notification-service | ✅ **RESERVED** | Email/SMS notifications |
| 3006 | analytics-service | ✅ **RESERVED** | Analytics and reporting |
| 3007 | *available* | ⚪ **FREE** | Previously had conflicts |
| 3008 | wallet-service | ✅ **RESERVED** | Multi-currency wallet |
| 3009 | wicked-portal | ✅ **RESERVED** | Wicked API Management Portal |
| 3010 | metrics-service | ✅ **RESERVED** | Metrics collection service |

### Frontend Applications (Vite Dev Servers)

| Port | Application | Status | Notes |
|------|-------------|--------|-------|
| 5173 | b2b-admin | ✅ **RESERVED** | B2B Admin Panel (Vite) |
| 5174 | booking-engine | ✅ **RESERVED** | Customer Booking Engine (Vite) |

### Special Services

| Port | Service | Status | Notes |
|------|---------|--------|-------|
| 4000 | superadmin-api | ✅ **RESERVED** | Super Admin API |

### Database & Cache Ports

| Port | Service | Status | Notes |
|------|---------|--------|-------|
| 5432 | postgres | ✅ **RESERVED** | Main PostgreSQL (docker-compose.yml) |
| 5433 | postgres-static | ✅ **RESERVED** | Hybrid PostgreSQL (docker-compose.hybrid.yml) |
| 55432 | postgres (kong) | ✅ **RESERVED** | Kong stack PostgreSQL |
| 6379 | redis | ✅ **RESERVED** | Main Redis (docker-compose.yml) |
| 6380 | redis-cache | ✅ **RESERVED** | Hybrid Redis (docker-compose.hybrid.yml) |
| 6432 | pgbouncer | ✅ **RESERVED** | Main PgBouncer (docker-compose.yml) |
| 6433 | pgbouncer | ✅ **RESERVED** | Kong stack PgBouncer |

### Kong API Gateway Ports

| Port | Service | Status | Notes |
|------|---------|--------|-------|
| 8000 | kong-proxy | ✅ **RESERVED** | Kong Proxy HTTP |
| 8443 | kong-proxy-ssl | ✅ **RESERVED** | Kong Proxy HTTPS |
| 8001 | kong-admin | ✅ **RESERVED** | Kong Admin API |
| 8444 | kong-admin-ssl | ✅ **RESERVED** | Kong Admin API HTTPS |
| 1337 | konga | ✅ **RESERVED** | Kong Admin UI |

### Wicked API Management (Alternative Stack)

| Port | Service | Status | Notes |
|------|---------|--------|-------|
| 9000 | wicked-kong-proxy | ✅ **RESERVED** | Wicked Kong Proxy HTTP |
| 9443 | wicked-kong-proxy-ssl | ✅ **RESERVED** | Wicked Kong Proxy HTTPS |
| 9001 | wicked-kong-admin | ✅ **RESERVED** | Wicked Kong Admin API |

## Port Conflict Resolution History

### Changes Made

1. **booking-service**: Changed default port from `3007` → `3001` (was inconsistent)
2. **booking-engine**: Changed Vite port from `3002` → `5174` (was conflicting with inventory-service)
3. **wallet-service**: Changed port from `3007` → `3008` (was conflicting with booking-service)
4. **payment-service**: Changed port from `3003` → `3004` (was conflicting with user-service)
5. **nginx upstreams**: Fixed incorrect ports for frontend apps and superadmin
6. **docker-compose.hybrid.yml**: 
   - postgres: `5432` → `5433`
   - redis: `6379` → `6380`
7. **docker-compose.kong.yml**: 
   - pgbouncer: `6432` → `6433`
8. **docker-compose.wicked.yml**:
   - wicked-kong: `8000/8443/8001` → `9000/9443/9001`
   - wicked-portal: `3001` → `3009`

## Running Multiple Stacks

To run multiple docker-compose stacks simultaneously:

### Stack 1: Local Development
```bash
docker-compose -f docker-compose.local.yml up -d
# Uses: 3000, 3001, 5174
```

### Stack 2: Kong Infrastructure
```bash
docker-compose -f docker-compose.kong.yml up -d
# Uses: 3000, 5432, 6433, 8000-8001, 8443-8444, 1337
```

### Stack 3: Hybrid Architecture
```bash
docker-compose -f infrastructure/compose/docker-compose.hybrid.yml up -d
# Uses: 3000, 3010, 5433, 6380
```

### Stack 4: Wicked API Management
```bash
docker-compose -f infrastructure/compose/docker-compose.wicked.yml up -d
# Uses: 3009, 9000, 9443, 9001
```

## Environment Variables

When running services locally, use these environment variables:

```bash
# API Gateway
PORT=3000

# Booking Service
PORT=3001

# Inventory Service
PORT=3002

# User Service
USER_SERVICE_PORT=3003

# Payment Service
PORT=3004

# Notification Service
PORT=3005

# Analytics Service
PORT=3006

# Wallet Service
PORT=3008

# Super Admin API
PORT=4000

# Metrics Service
PORT=3010
```

## Adding New Services

When adding a new service:

1. Check this document for the next available port
2. Update this document with the new service allocation
3. Use environment variables for port configuration (e.g., `process.env.PORT || default`)
4. Update docker-compose files with the allocated port
5. Update nginx configuration if the service needs to be exposed

## Troubleshooting Port Conflicts

If you encounter "port already in use" errors:

1. Check which process is using the port:
   ```bash
   lsof -i :<port>
   # or
   netstat -tuln | grep <port>
   ```

2. Stop the conflicting service or reassign to a different port

3. Verify your changes align with this allocation guide

## Contact

For questions about port allocation or to request changes, contact the platform team.
