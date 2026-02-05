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
- **Super Admin** (`apps/super-admin`): High-level administrative functions

### Services
- **Booking Service** (`services/booking-service`): Core booking logic and processing
- **Inventory Service** (`services/inventory-service`): Real-time inventory management
- **Wallet Service** (`services/wallet-service`): Payment and wallet management
- **API Gateway** (`services/api-gateway`): Central API routing and management

### Packages
- **Static Data** (`packages/static-data`): Centralized static data management
- **Automapper** (`automapper`): Object mapping utilities

## Static Data Management

### Centralized Static Data Package

TripAlfa uses a centralized static data management system to eliminate duplications and ensure consistency across the application.

#### Package Location
```
packages/static-data/
```

#### Key Features
- **Single Source of Truth**: All static data managed in one location
- **Intelligent Caching**: Configurable caching with TTL and size limits
- **Fallback Mechanisms**: Automatic fallback to local data when external sources fail
- **Type Safety**: Full TypeScript support with comprehensive type definitions
- **Multiple Data Sources**: Support for local database, API gateway, and fallback data

#### Data Modules
- **Core Types** (`src/types.ts`): Airport, Airline, Aircraft, Currency, City, Country, Nationality, HotelChain, HotelFacility, HotelType, Location
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
npm install
```

### Development
```bash
npm run dev
```

### Building
```bash
npm run build
```

### Testing
```bash
npm test
```

### Linting
```bash
npm run lint
```

## Project Structure

```
TripAlfa - Node/
├── apps/
│   ├── booking-engine/          # Main booking application
│   ├── b2b-admin/               # Admin interface
│   └── super-admin/             # Super admin functions
├── services/
│   ├── booking-service/         # Booking logic
│   ├── inventory-service/       # Inventory management
│   ├── wallet-service/          # Payment processing
│   └── api-gateway/             # API routing
├── packages/
│   ├── static-data/             # Centralized static data
│   └── automapper/              # Object mapping utilities
├── docs/                        # Documentation
├── infrastructure/              # Infrastructure setup
└── types/                       # TypeScript type definitions
```

## Contributing

1. Follow the existing code style and patterns
2. Add comprehensive tests for new functionality
3. Update documentation as needed
4. Ensure all data types are properly typed

## License

MIT License