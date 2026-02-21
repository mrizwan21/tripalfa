# Frontend and Neon Database Integration Guide

## Overview

This document describes the integration between the TripAlfa frontend applications and the Neon PostgreSQL database.

## Current Status

✅ **Integration Complete** - The frontend applications are connected to the Neon database via the backend microservices.

## Architecture (All APIs through API Manager)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Frontend Apps                                    │
│  ┌─────────────────┐        ┌──────────────────────────┐              │
│  │  b2b-admin     │        │    booking-engine          │              │
│  └────────┬────────┘        └────────────┬─────────────┘              │
│           │                              │                              │
│           └──────────────┬──────────────┘                              │
│                          ▼                                              │
│              ┌─────────────────────┐                                   │
│              │   API Gateway       │  ← Wicked API Manager              │
│              │   (Port 3000)       │                                   │
│              └──────────┬──────────┘                                   │
│                         │                                              │
│         ┌──────────────┼──────────────┐                               │
│         ▼              ▼              ▼                                │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                     │
│  │  Booking   │ │  User      │ │  Wallet    │                     │
│  │  Service  │ │  Service   │ │  Service   │                     │
│  │  (3003)   │ │  (3004)   │ │  (3005)   │                     │
│  └─────┬─────┘ └─────┬─────┘ └─────┬─────┘                         │
│        │            │            │                                  │
│        └────────────┼────────────┘                                  │
│                     ▼                                                │
│           ┌─────────────────────┐                                   │
│           │   @tripalfa/       │                                   │
│           │   shared-database   │                                   │
│           └──────────┬──────────┘                                   │
│                      ▼                                               │
│           ┌─────────────────────┐                                   │
│           │   Neon Database     │                                   │
│           │   PostgreSQL 17    │                                   │
│           └─────────────────────┘                                   │
└─────────────────────────────────────────────────────────────────────┘

External API Providers:
┌────────────────────────────────────────────────────────────────────┐
│   Duffel API (Flights)    ← Booking Service routes requests         │
│   LITEAPI (Hotels)        ← Booking Service routes requests         │
└────────────────────────────────────────────────────────────────────┘
```

## Database Configuration

### Neon Database Details

- **Project ID**: curly-queen-75335750
- **Region**: AWS US-East-1
- **PostgreSQL Version**: 17
- **Connection**: SSL/TLS required

### Environment Variables

The following environment variables are configured in `.env`:

```bash
# Main database connection (via PgBouncer)
DATABASE_URL="postgresql://neondb_owner:npg_***@ep-ancient-meadow-***.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require&pgbouncer=true&connection_limit=20"

# Direct database connection (for migrations)
DIRECT_DATABASE_URL="postgresql://neondb_owner:npg_***@ep-ancient-meadow-***.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require&connect_timeout=15"
```

### Frontend Environment Configuration

#### b2b-admin (.env.local)
```bash
VITE_API_GATEWAY_URL=http://localhost:3000
VITE_USE_API_GATEWAY=false
```

#### booking-engine
```bash
VITE_API_URL=http://localhost:3000
VITE_API_BASE_URL=http://localhost:3000
```

## Services Using Neon Database

| Service | Port | Database Connection |
|---------|------|-------------------|
| user-service | 3004 | @tripalfa/shared-database |
| booking-service | 3003 | @tripalfa/shared-database |
| wallet-service | 3005 | @tripalfa/shared-database |
| organization-service | - | @tripalfa/shared-database |
| notification-service | 3001 | @tripalfa/shared-database |
| rule-engine-service | 3002 | @tripalfa/shared-database |

## Data Sources

### Booking Engine Data Sources

The TripAlfa booking engine uses a **hybrid data approach**:

| Feature | Data Source | Status |
|---------|------------|--------|
| Flight Search | Duffel API | ✅ Implemented |
| Hotel Search | LITEAPI | ✅ Implemented |
| Hotel Availability | LITEAPI | ✅ Implemented |
| Hotel Booking | LITEAPI | ✅ Implemented |
| Flight Booking | Duffel API | ✅ Implemented |
| Seat Selection | Duffel API | ✅ Implemented |
| Baggage/Ancillary | Duffel API | ✅ Implemented |
| Order Management | Duffel API + Database | ✅ Implemented |

### Cancel APIs

| Feature | API | Status |
|---------|-----|--------|
| Flight Cancellation | Duffel API | ✅ Implemented |
| Hotel Cancellation | LITEAPI | ⚠️ Needs Implementation |


### Webhooks

| Event Type | Provider | Status |
|------------|----------|--------|
| Order Created | Duffel | ⚠️ Needs Implementation |
| Order Cancelled | Duffel | ⚠️ Needs Implementation |
| Flight Status Changes | Duffel | ⚠️ Needs Implementation |
| Hotel Booking Confirmed | LITEAPI | ⚠️ Needs Implementation |
| Hotel Booking Cancelled | LITEAPI | ⚠️ Needs Implementation |
| Payment Success | Stripe/PayPal | ✅ Implemented |
| Payment Failed | Stripe/PayPal | ✅ Implemented |
| Refund Processed | Stripe/PayPal | ✅ Implemented |
| Chargeback | Stripe/PayPal | ✅ Implemented |

### Database vs API Data

| Feature | Data Stored in Neon | Data from API |
|---------|-------------------|---------------|
| Flight Search Results | ❌ Cache only | ✅ Duffel API |
| Hotel Search Results | ❌ Cache only | ✅ LITEAPI |
| Hotel Availability | ❌ Cache only | ✅ LITEAPI |
| Hotel Booking | ✅ Complete record | ✅ LITEAPI |
| Bookings | ✅ Complete record | ✅ Supplier reference |
| Customers | ✅ All data | N/A |
| Wallets | ✅ All data | N/A |
| Notifications | ✅ All data | N/A |
| Rules/Commissions | ✅ All data | N/A |
| Offline Requests | ✅ All data | N/A |

### B2B Admin Data Sources

| Feature | Data Source |
|---------|-------------|
| Booking Management | Neon Database (via API) |
| Customer Management | Neon Database (via API) |
| Notification Campaigns | Neon Database (via API) |
| Rule Engine | Neon Database (via API) |
| Supplier Management | Neon Database (via API) |
| User/Role Management | Neon Database (via API) |

## Database Schema

The Neon database contains the following main schemas:

1. **public** - Core business logic (Users, Bookings, Companies, etc.)
2. **neon_auth** - Authentication (built-in Neon Auth)
3. **wallet_test** - Wallet/Payment system

### Key Tables

- `User` - Customer and staff accounts
- `Booking` - Flight and hotel bookings
- `BookingSegment` - Flight/hotel details
- `Company` - Organization/agency data
- `Wallet` - Customer wallet balances
- `WalletTransaction` - Financial transactions
- `Notification` - User notifications
- `NotificationTemplate` - Notification templates

## Testing the Connection

### 1. Verify Database Connection

```bash
cd /Users/mohamedrizwan/Documents/TripAlfa\ -\ Node

# Test basic connection
node -e "
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.\$queryRaw\`SELECT 1 as test\`
  .then(r => { console.log('✅ Database connected!'); process.exit(0); })
  .catch(e => { console.error('❌ Connection failed:', e.message); process.exit(1); })
"
```

### 2. Query Database Tables

```bash
node -e "
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
Promise.all([
    prisma.user.count(),
    prisma.booking.count(),
    prisma.company.count()
]).then(([users, bookings, companies]) => { 
    console.log('Users:', users, 'Bookings:', bookings, 'Companies:', companies); 
    process.exit(0); 
})
"
```

## Running the Application

### Prerequisites

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Generate Prisma Client**:
   ```bash
   pnpm run db:generate
   ```

3. **Run database migrations** (if needed):
   ```bash
   pnpm run db:migrate
   ```

### Starting Services

```bash
# Start all services
pnpm run dev

# Or start individual services
cd services/user-service && pnpm run dev
cd services/booking-service && pnpm run dev
```

### Starting Frontend

```bash
# B2B Admin
cd apps/b2b-admin && pnpm run dev

# Booking Engine
cd apps/booking-engine && pnpm run dev
```

## Troubleshooting

### Connection Issues

If you encounter connection errors:

1. **Verify DATABASE_URL in .env**:
   ```bash
   cat .env | grep DATABASE_URL
   ```

2. **Check Neon console**:
   - Go to https://console.neon.tech
   - Verify compute is active (not suspended)
   - Check connection string is correct

3. **Test connection**:
   ```bash
   psql "postgresql://neondb_owner:***@ep-ancient-***.neon.tech/neondb?sslmode=require" -c "SELECT 1"
   ```

### Prisma Issues

If Prisma generates errors:

1. **Regenerate Prisma client**:
   ```bash
   pnpm run db:generate
   ```

2. **Check Prisma version**:
   ```bash
   pnpm list prisma @prisma/client
   ```

   Current working version: **6.19.2**

### Common Errors

| Error | Solution |
|-------|----------|
| `PrismaClientConstructorValidationError` | Downgrade to Prisma 6.x |
| `ECONNREFUSED` | Check DATABASE_URL or Neon compute status |
| `SSL connection required` | Add `?sslmode=require` to connection string |

## Additional Resources

- [API Integration Master Guide](./API_INTEGRATION_MASTER.md) - Complete API reference
- [Neon Database Connection Guide](./NEON_DATABASE_CONNECTION.md)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Neon Console](https://console.neon.tech)

---

**Last Updated**: February 15, 2026
**Integration Status**: ✅ Complete
