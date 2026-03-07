# TripAlfa - Travel Booking Platform

TripAlfa is a comprehensive travel booking platform that provides flight, hotel, and transfer booking services with a modern, user-friendly interface.

## Features

- **Flight Booking**: Search, compare, and book flights from multiple suppliers
- **Hotel Booking**: Browse and book hotels worldwide with real-time availability
- **Transfer Services**: Book airport transfers and local transportation
- **Multi-Currency Support**: Support for multiple currencies with real-time exchange rates
- **Wallet System**: Integrated wallet for easy payments and transactions
- **Admin Dashboard**: Comprehensive admin interface for managing bookings, suppliers, and users

## Architecture

TripAlfa follows a modular, microservices-based architecture with a **local process-first runtime**:

- **Host-Run Services**: Backend services run as local `pnpm dev` processes
- **Local Frontends**: Frontend apps run as local Vite processes
- **External + Local Data**: Application data in Neon; static/reference data from configured static DB

### Frontend Applications

- **Booking Engine** (`apps/booking-engine`, Port 5174): Main customer-facing booking application
- **B2B Admin** (`apps/b2b-admin`, Port 5173): Admin interface for managing suppliers and bookings

### Backend Services (Local Host Stack)

- **Booking Service** (`services/booking-service`, Port 3001): Core booking logic and processing
- **Payment Service** (`services/payment-service`, Port 3007): Payment processing and insurance
- **Wallet Service** (`services/wallet-service`, Port 3008): Wallet and financial management
- **Notification Service** (`services/notification-service`, Port 3009): Multi-channel notifications
- **Rule Engine Service** (`services/rule-engine-service`, Port 3010): Dynamic business rules
- **KYC Service** (`services/kyc-service`, Port 3011): Identity verification
- **Marketing Service** (`services/marketing-service`, Port 3012): Campaign management
- **Organization Service** (`services/organization-service`, Port 3006): Enterprise/B2B management
- **User Service** (`services/user-service`, Port 3003): User management and authentication

### Infrastructure

- **API Gateway** (`services/api-gateway`, Port 3000): Central API routing and management
- **Redis** (Port 6379): Cache and async support
- **Static Database** (`STATIC_DATABASE_URL`): Reference/lookup data connection for static flows

### Packages (9 total)

- **API Clients** (`packages/api-clients`): Shared API client libraries
- **Notifications** (`packages/notifications`): Notification templates and logic
- **Rules** (`packages/rules`): Business rule definitions
- **Shared Database** (`packages/shared-database`): Prisma client and database utilities
- **Shared Types** (`packages/shared-types`): Common TypeScript interfaces
- **Shared Utils** (`packages/shared-utils`): Logging, error handling, and helpers
- **Static Data** (`packages/static-data`): Centralized static data management
- **UI Components** (`packages/ui-components`): Shared React components
- **Wallet** (`packages/wallet`): Payment and billing logic

## 🗄️ Database Configuration

> **⚠️ CRITICAL** - Read before setting up!
>
> **Required Architecture:**
>
> - **Neon (CLI-managed project/container)** for application data (`neondb`)
> - **Local PostgreSQL** for static flight/hotel data (`staticdatabase`)

### Database Architecture

Live verification matrix: [operations/DATABASE_BUILD_STATUS_MATRIX.md](operations/DATABASE_BUILD_STATUS_MATRIX.md)

- **Neon `neondb`**: Application data for API Gateway, Booking, Payment, User, KYC, Wallet, Notification, Organization, and Marketing services.
- **Local PostgreSQL `staticdatabase`**: Static reference data for booking lookup flows (flight/hotel/airport datasets).

### Neon Access (CLI First)

- Install and initialize Neon CLI:

```bash
brew install neonctl && neonctl init
```

- Use your Neon CLI/project output to set:
  - `NEON_DATABASE_URL` (pooled endpoint)
  - `DIRECT_NEON_DATABASE_URL` (direct endpoint)

> Use Neon connection strings generated from your current Neon project/container setup.
> MCP is optional and mainly useful for branch/schema/query workflows, not required for runtime DB connectivity.

### Quick Start (Local Machine)

```bash
# 1. Install dependencies
pnpm install

# 2. Configure local env
cp .env.example .env.local

# 3. Start local services and frontends (use separate terminals)
pnpm --dir services/api-gateway dev
pnpm --dir services/booking-service dev
pnpm --dir services/user-service dev
pnpm --dir services/payment-service dev
pnpm --dir apps/b2b-admin dev
pnpm --dir apps/booking-engine dev

# 4. Verify health and logs
for p in 3000 3001 3003 3006 3007 3008 3009 3010 3011 3012 3020 3021; do curl -fsS "http://localhost:$p/health" >/dev/null && echo "ok:$p" || echo "down:$p"; done
tail -f logs/*.log

# 5. Stop when done
# Use Ctrl+C in each terminal
```

**For setup & troubleshooting, see:** `LOCAL_DEVELOPMENT.md`.

## Static Data Management

### Centralized Static Data Package

TripAlfa uses a centralized static data management system to eliminate duplications and ensure consistency across the application.

#### Package Location

```text
packages/static-data/
```

#### Key Features

- **Single Source of Truth**: All static data managed in one location
- **Intelligent Caching**: Configurable caching with TTL and size limits
- **Fallback Mechanisms**: Automatic fallback to local data when external sources fail
- **Type Safety**: Full TypeScript support with comprehensive type definitions
- **Multiple Data Sources**: Support for local database, API gateway, and fallback data

#### Data Modules

- **Core Types** (`src/types.ts`): Airport, Airline, Aircraft, Currency, City, Country, Nationality, HotelChain, HotelType, Location
- **Notification Types** (`src/data/notification-types.ts`): Notification types and mock data
- **Supplier Data** (`src/data/supplier-data.ts`): Supplier, vendor, and contract data for B2B admin

#### Usage

```typescript
import { getAirports, getCurrencies } from "@tripalfa/static-data";

// Get airports with optional search parameters
const airports = await getAirports({ query: "London", limit: 10 });

// Get currencies
const currencies = await getCurrencies();
```

#### B2B Admin Data

```typescript
import {
  MOCK_NOTIFICATIONS,
  getMockNotifications,
  MOCK_SUPPLIERS,
  getMockSuppliers,
  MOCK_VENDORS,
  getMockVendors,
  MOCK_CONTRACTS,
  getMockContracts,
} from "@tripalfa/static-data";

// Get mock notifications
const notifications = getMockNotifications();

// Get mock suppliers
const suppliers = getMockSuppliers();
```

## Development

### Prerequisites

- Node.js 18.0.0 or higher
- pnpm package manager

### Installation

```bash
pnpm install
```

### Development Mode

**Local Process Stack:**

```bash
# Start key services and frontends (separate terminals)
pnpm --dir services/api-gateway dev
pnpm --dir services/booking-service dev
pnpm --dir services/user-service dev
pnpm --dir services/payment-service dev
pnpm --dir apps/b2b-admin dev
pnpm --dir apps/booking-engine dev

# Follow logs
tail -f logs/*.log

# Stop when done
# Use Ctrl+C in each terminal
```

**For architecture-specific local setup details, see:** `LOCAL_DEVELOPMENT.md`.

### Building

```bash
# Build all packages and services
pnpm run build

# Build specific workspace
pnpm run -F @tripalfa/booking-service build
```

### Testing

#### Unit & Integration Tests

```bash
# Run all E2E tests
pnpm run test:e2e

# Run E2E tests in UI mode (interactive)
pnpm run test:e2e:ui

# Run E2E tests in debug mode
pnpm run test:e2e:debug

# View E2E test report
pnpm run test:e2e:report
```

For comprehensive E2E testing guidance, see [Booking Engine Testing Guide](../apps/booking-engine/README_TESTING.md).

### Linting

```bash
pnpm run lint
```

## Project Structure

```text
TripAlfa - Node/
├── apps/
│   ├── booking-engine/          # Main booking application
│   │   └── tests/               # E2E tests using Playwright
│   ├── b2b-admin/               # Admin interface
├── services/
│   ├── booking-service/         # Booking logic
│   ├── payment-service/         # Payment processing
│   ├── user-service/            # User management
│   ├── notification-service/    # Notifications
│   ├── kyc-service/             # Identity verification
│   ├── marketing-service/       # Marketing
│   ├── organization-service/    # Organizations
│   ├── rule-engine-service/     # Rule engine
│   └── api-gateway/             # API routing
├── packages/
│   ├── static-data/             # Centralized static data
│   ├── shared-utils/            # Shared utilities
│   ├── shared-types/            # Shared types
│   ├── shared-database/         # Shared database
│   ├── ui-components/           # UI components
│   ├── api-clients/             # API clients
│   ├── notifications/           # Notifications
│   ├── rules/                   # Business rules
│   └── wallet/                  # Wallet/Billing
├── docs/
│   ├── testing/                 # Testing documentation
│   │   ├── E2E_TEST_EXECUTION_GUIDE.md
│   │   ├── TEST_DATA_MANAGEMENT_GUIDE.md
│   │   └── E2E_TESTING_IMPLEMENTATION_SUMMARY.md
│   └── ...                      # Other documentation
├── infrastructure/              # Infrastructure setup
└── types/                       # TypeScript type definitions
```

## 📚 Documentation Guide

All project documentation is organized under `/docs` by category. **For setup & development, start here:**

### Quick Links

| Purpose | Location | Key Files |
| ------- | -------- | --------- |
| **Getting Started** | [`getting-started/`](getting-started/) | [SETUP.md](getting-started/SETUP.md), [QUICK_START_ENV.md](getting-started/QUICK_START_ENV.md) |
| **Development & Local Setup** | [`development/`](development/) | [QUICK_REFERENCE.md](development/QUICK_REFERENCE.md), [LOCAL_DEVELOPMENT.md](LOCAL_DEVELOPMENT.md) |
| **Production & Operations** | [`operations/`](operations/) | [deployment.md](operations/deployment.md), [PRODUCTION_MONITORING_CONFIG.md](operations/PRODUCTION_MONITORING_CONFIG.md) |
| **Architecture & Design** | [`architecture/`](architecture/) | [BACKEND_SERVICES.md](architecture/BACKEND_SERVICES.md), [microservices.md](microservices.md) |
| **APIs & Integrations** | [`integrations/`](integrations/) | Various integration guides (Duffel, LiteAPI, etc.) |
| **Security & Compliance** | [`compliance/`](compliance/) | [SECURITY_AUDIT_CHECKLIST.md](compliance/SECURITY_AUDIT_CHECKLIST.md) |
| **Historical Docs** | Legacy folders under repo root | Phase completion reports, feature docs, test records |

### Finding What You Need

- **💻 New to the project?** → Start with [getting-started/SETUP.md](getting-started/SETUP.md)
- **🚀 Deploying to production?** → Check [operations/deployment.md](operations/deployment.md)
- **🔍 Trouble with database/setup config?** → See [LOCAL_DEVELOPMENT.md](LOCAL_DEVELOPMENT.md)
- **📊 Want the full architecture?** → Read [microservices.md](microservices.md)
- **🛟 Incident response?** → Use [operations/PRODUCTION_MONITORING_CONFIG.md](operations/PRODUCTION_MONITORING_CONFIG.md)
- **📚 Looking for older docs?** → Check repository legacy folders for historical documentation

---

## Testing Documentation

### E2E Testing

The TripAlfa booking engine includes a comprehensive E2E testing suite using Playwright:

- **[Booking Engine Testing Guide](../apps/booking-engine/README_TESTING.md)**: How to run, debug, and troubleshoot E2E tests
- **[Notification Tests Quickstart](../apps/booking-engine/NOTIFICATION_TESTS_QUICKSTART.md)**: Focused notification test workflows

**Quick Start**:

```bash
cd apps/booking-engine
pnpm install
pnpm exec playwright install
pnpm run test:e2e
```

### Current Test Coverage

- **Smoke Tests**: ✅ Passing (1/1)
- **Flight Booking**: 🟡 In Progress (1/5 passing, selectors being updated)
- **Hotel Booking**: 🟡 In Progress (selector updates needed)
- **Booking Management**: 🟡 In Progress
- **Wallet Operations**: 🟡 In Progress
- **Payment Processing**: 🟡 In Progress (timeout fixes in progress)
- **Error Scenarios**: 🟡 In Progress
- **API Integration Tests**: ✅ Implemented (auth, booking, wallet, payment)

## Contributing

1. Follow the existing code style and patterns
2. Add comprehensive tests for new functionality
3. Update documentation as needed
4. Ensure all data types are properly typed

## License

MIT License
