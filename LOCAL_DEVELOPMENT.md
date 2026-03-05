# TripAlfa Local Development Guide

## Overview

This guide explains how to run TripAlfa's microservices architecture on your local machine using a hybrid approach:

- **Docker Containers**: API Gateway + Static Database
- **Local Machine**: 12 Backend Services + 2 Frontend Applications

This setup provides fast development iteration while maintaining production-like infrastructure.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│           LOCAL MACHINE (MacBook)                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────────┐   ┌──────────────────┐           │
│  │   Vite Dev       │   │   Vite Dev       │           │
│  │  b2b-admin:5173  │   │  booking-engine  │           │
│  │                  │   │     :5174        │           │
│  └──────────────────┘   └──────────────────┘           │
│           │                     │                       │
│           └──────────┬──────────┘                       │
│                      ▼                                │
│  ┌───────────────────────────────────────────────────┐ │
│  │  12 Backend Services (Node.js)                    │ │
│  │  Ports: 3000-3021                                 │ │
│  │  - api-gateway:3000*                              │ │
│  │  - booking-service:3001                           │ │
│  │  - user-service:3003                              │ │
│  │  - payment-service:3007                           │ │
│  │  - organization-service:3006                      │ │
│  │  - wallet-service:3008                            │ │
│  │  - notification-service:3009                      │ │
│  │  - rule-engine-service:3010                       │ │
│  │  - kyc-service:3011                               │ │
│  │  - marketing-service:3012                         │ │
│  │  - b2b-admin-service:3020                         │ │
│  │  - booking-engine-service:3021                    │ │
│  └───────────────────────────────────────────────────┘ │
│                      │                                │
└──────────────────────┼────────────────────────────────┘
                       │
                       ▼
               ┌───────────────────┐
               │  Docker Network   │
               ├───────────────────┤
               │ API Gateway       │
               │ (Port 3000)       │
               └─────────┬─────────┘
                         │
                         ▼
               ┌───────────────────┐
               │ PostgreSQL Static │
               │ DB (Port 5435)    │
               └───────────────────┘
                         │
                         ▼
               ┌───────────────────┐
               │  Neon Cloud DB    │
               │  (External)       │
               └───────────────────┘
                         │
                         ▼
               ┌───────────────────┐
               │ External APIs     │
               │ - Duffel          │
               │ - LiteAPI         │
               │ - Stripe          │
               └───────────────────┘

* Note: api-gateway runs in Docker, not locally
```

## Prerequisites

### Required Software

- **Node.js**: v20+ (LTS recommended)
- **pnpm**: v10+ (package manager)
- **Docker**: Latest version
- **Docker Compose**: v2.0+
- **curl**: For health checks

### Environment Setup

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your API keys and database URLs
   ```

3. **Start Docker infrastructure**:
   ```bash
   docker-compose -f docker-compose.local.yml up -d tripalfa-api-gateway tripalfa-staticdb
   ```

## Quick Start

### Start All Services

```bash
# Make scripts executable
chmod +x start-all-services.sh stop-all-services.sh

# Start everything
./start-all-services.sh
```

### Access Applications

- **b2b-admin**: http://localhost:5173
- **booking-engine**: http://localhost:5174
- **API Gateway**: http://localhost:3000
- **Static DB**: localhost:5435

### Stop All Services

```bash
./stop-all-services.sh
```

## Service Details

### Backend Services (12)

| Service | Port | Description | Health Check |
|---------|------|-------------|--------------|
| api-gateway | 3000 | API Gateway (Docker) | `/health` |
| booking-service | 3001 | Flight/Hotel booking | `/health` |
| user-service | 3003 | User management | `/health` |
| payment-service | 3007 | Payment processing | `/health` |
| organization-service | 3006 | Organization management | `/health` |
| wallet-service | 3008 | Wallet management | `/health` |
| notification-service | 3009 | Email/SMS notifications | `/health` |
| rule-engine-service | 3010 | Business rules engine | `/health` |
| kyc-service | 3011 | KYC verification | `/health` |
| marketing-service | 3012 | Marketing campaigns | `/health` |
| b2b-admin-service | 3020 | Admin API endpoints | `/health` |
| booking-engine-service | 3021 | Booking engine API | `/health` |

### Frontend Applications (2)

| App | Port | Description | Dev Server |
|-----|------|-------------|------------|
| b2b-admin | 5173 | Admin dashboard | Vite dev server |
| booking-engine | 5174 | Booking interface | Vite dev server |

## Development Workflow

### Individual Service Development

Start specific services for focused development:

```bash
# Start only user service
cd services/user-service
pnpm dev

# Start only booking service
cd services/booking-service
pnpm dev

# Start only b2b-admin frontend
cd apps/b2b-admin
pnpm dev
```

### Debugging

#### VS Code Debug Configuration

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug User Service",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/services/user-service/src/index.ts",
      "env": {
        "NODE_ENV": "development",
        "PORT": "3003"
      },
      "runtimeArgs": ["--inspect-brk"],
      "console": "integratedTerminal"
    },
    {
      "name": "Debug Booking Service",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/services/booking-service/src/index.ts",
      "env": {
        "NODE_ENV": "development",
        "PORT": "3001"
      },
      "runtimeArgs": ["--inspect-brk"],
      "console": "integratedTerminal"
    }
  ]
}
```

#### Chrome DevTools

Services run with `--inspect` flag by default. Open Chrome DevTools:

1. Open Chrome
2. Navigate to `chrome://inspect`
3. Click "Open dedicated DevTools for Node"

### Logging

#### View Service Logs

```bash
# View all logs
tail -f logs/*.log

# View specific service logs
tail -f logs/user-service.log
tail -f logs/booking-service.log

# View frontend logs
tail -f logs/b2b-admin.log
tail -f logs/booking-engine.log
```

#### Log Levels

Set log level in `.env.local`:

```bash
LOG_LEVEL=debug    # Most verbose
LOG_LEVEL=info     # Standard
LOG_LEVEL=warn     # Warnings only
LOG_LEVEL=error    # Errors only
```

### Database Operations

#### Static Database (Docker)

```bash
# Connect to static database
docker exec -it tripalfa-staticdb psql -U postgres -d tripalfa_static

# Run migrations
pnpm prisma migrate dev --schema=database/prisma/schema.prisma
```

#### Neon Cloud Database

Configure connection in `.env.local`:

```bash
NEON_DATABASE_URL="postgresql://user:pass@ep-xyz.us-east-1.aws.neon.tech/db?sslmode=require"
```

### External API Integration

#### Duffel API

```bash
# Set in .env.local
DUFFEL_API_KEY="your_duffel_api_key"
DUFFEL_API_BASE_URL="https://api.duffel.com"
```

#### LiteAPI

```bash
# Set in .env.local
LITEAPI_BASE_URL="https://api.liteapi.travel"
LITEAPI_KEY="your_liteapi_key"
```

#### Stripe

```bash
# Set in .env.local
STRIPE_SECRET_KEY="sk_test_your_stripe_key"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret"
```

## Troubleshooting

### Common Issues

#### Port Conflicts

If ports are already in use:

1. Check which process is using the port:
   ```bash
   lsof -i :3001
   ```

2. Kill the process or change the port in `.env.local`

#### Docker Services Not Running

```bash
# Check Docker status
docker ps

# Restart Docker services
docker-compose -f docker-compose.local.yml restart tripalfa-api-gateway tripalfa-staticdb

# Check logs
docker logs tripalfa-api-gateway
docker logs tripalfa-staticdb
```

#### Environment Variables Not Loading

```bash
# Check if .env.local exists
ls -la .env.local

# Verify environment variables
echo $USER_SERVICE_PORT
echo $NEON_DATABASE_URL
```

#### Services Not Starting

```bash
# Check service logs
tail -f logs/user-service.log

# Check if dependencies are installed
cd services/user-service
pnpm install

# Check TypeScript compilation
pnpm build
```

### Health Checks

Verify all services are running:

```bash
# Check Docker services
docker ps

# Check local services
curl http://localhost:3003/health
curl http://localhost:3001/health
curl http://localhost:5173/
curl http://localhost:5174/
```

### Performance Tips

1. **Use pnpm cache**: pnpm uses a global cache, making installs faster
2. **Hot reload**: All services support hot reload for faster development
3. **Selective startup**: Start only the services you're working on
4. **Memory management**: Monitor memory usage with `htop` or Activity Monitor

## Production Parity

This local setup maintains production parity by:

- Using the same API Gateway configuration
- Connecting to the same Neon Cloud database
- Using identical environment variables
- Running the same service versions
- Maintaining the same network topology

## Next Steps

1. **Start developing**: Run `./start-all-services.sh`
2. **Access applications**: Open http://localhost:5173 and http://localhost:5174
3. **Monitor services**: Use the logs directory for debugging
4. **Customize**: Modify `.env.local` for your development needs

## Support

For issues or questions:

1. Check the troubleshooting section above
2. Review service logs in the `logs/` directory
3. Verify Docker services are running
4. Ensure all environment variables are configured correctly