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

TripAlfa follows a modular, microservices-based architecture with the following components:

### Applications

- **Booking Engine** (`apps/booking-engine`): Main customer-facing booking application
- **B2B Admin** (`apps/b2b-admin`): Admin interface for managing suppliers and bookings

### Services

- **API Gateway** (`services/api-gateway`): Central API routing and management
- **Booking Service** (`services/booking-service`): Core booking logic and processing
- **Payment Service** (`services/payment-service`): Payment processing and insurance
- **User Service** (`services/user-service`): User management and authentication
- **Notification Service** (`services/notification-service`): Multi-channel notifications
- **KYC Service** (`services/kyc-service`): Identity verification
- **Marketing Service** (`services/marketing-service`): Campaign management
- **Organization Service** (`services/organization-service`): Enterprise/B2B management
- **Rule Engine Service** (`services/rule-engine-service`): Dynamic business rules

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
import { getAirports, getCurrencies } from '@tripalfa/static-data';

// Get airports with optional search parameters
const airports = await getAirports({ query: 'London', limit: 10 });

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
  getMockContracts 
} from '@tripalfa/static-data';

// Get mock notifications
const notifications = getMockNotifications();

// Get mock suppliers
const suppliers = getMockSuppliers();
```

## Development

### Prerequisites

- Node.js 16.0.0 or higher
- npm or yarn package manager

### Installation

```bash
pnpm install
```

### Development Mode

```bash
pnpm run dev
```

### Building

```bash
pnpm run build
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

For comprehensive E2E testing guide, see [E2E Test Execution Guide](docs/testing/E2E_TEST_EXECUTION_GUIDE.md).

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

## Testing Documentation

### E2E Testing

The TripAlfa booking engine includes a comprehensive E2E testing suite using Playwright:

- **[E2E Test Execution Guide](docs/testing/E2E_TEST_EXECUTION_GUIDE.md)**: How to run, debug, and troubleshoot E2E tests
- **[Test Data Management Guide](docs/testing/TEST_DATA_MANAGEMENT_GUIDE.md)**: Managing test fixtures, seeding, and test data
- **[Implementation Summary](docs/testing/E2E_TESTING_IMPLEMENTATION_SUMMARY.md)**: Overview of Phase 1 testing initiative

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
