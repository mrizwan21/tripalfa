# Centralized Static Data Management System

This package provides a unified interface for accessing static data across the entire TripAlfa application. It eliminates duplications by centralizing data sources, caching, and fallback mechanisms.

## Features

- **Centralized Data Management**: Single source of truth for all static data
- **Intelligent Caching**: Configurable caching with TTL and size limits
- **Fallback Mechanisms**: Automatic fallback to local data when external sources fail
- **Type Safety**: Full TypeScript support with comprehensive type definitions
- **Multiple Data Sources**: Support for local database, API gateway, and fallback data

## Data Structure

The package organizes static data into the following modules:

### Core Data Types (`src/types.ts`)
- `Airport`, `Airline`, `Aircraft`, `Currency`
- `City`, `Country`, `Nationality`
- `HotelChain`, `HotelFacility`, `HotelType`
- `Location` for autocomplete functionality

### Data Modules (`src/data/`)
- `notification-types.ts` - Notification types and mock data
- `supplier-data.ts` - Supplier, vendor, and contract data for B2B admin

### Client (`src/client.ts`)
- `StaticDataClient` class for data access
- Convenience functions: `getAirports()`, `getAirlines()`, etc.
- Automatic caching and fallback handling

### Cache (`src/cache.ts`)
- `StaticDataCache` class for cache management
- Configurable cache settings
- Cache statistics and management functions

### Fallbacks (`src/fallbacks.ts`)
- Predefined fallback data for all data types
- Automatic fallback selection based on error types
- Configurable fallback behavior

### Utilities (`src/utils.ts`)
- Helper functions for data manipulation
- Cache key generation
- Data validation and sanitization
- Retry mechanisms with exponential backoff

## Usage

### Basic Usage
```typescript
import { getAirports, getCurrencies } from '@tripalfa/static-data';

// Get airports with optional search parameters
const airports = await getAirports({ query: 'London', limit: 10 });

// Get currencies
const currencies = await getCurrencies();
```

### Advanced Usage with Client
```typescript
import { StaticDataClient } from '@tripalfa/static-data';

const client = new StaticDataClient({
  apiBase: 'http://localhost:3000',
  cache: { ttl: 3600000, maxSize: 1000 },
  sources: [
    { name: 'local-db', priority: 1, endpoint: 'http://localhost:3000', enabled: true, timeout: 5000 },
    { name: 'wicked-gateway', priority: 2, endpoint: 'http://localhost:8000', enabled: true, timeout: 10000 }
  ],
  fallbackEnabled: true
});

const airports = await client.getAirports({ query: 'New York' });
```

### B2B Admin Data
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

## Data Migration

### Migrating from Old Static Data

1. **Replace direct imports**:
   ```typescript
   // Old
   import { MOCK_NOTIFICATIONS } from '../lib/notification-types';
   
   // New
   import { MOCK_NOTIFICATIONS } from '@tripalfa/static-data';
   ```

2. **Update constants**:
   ```typescript
   // Old
   import { FLIGHT_CLASSES } from '../lib/constants';
   
   // New (if moved to static-data)
   import { FLIGHT_CLASSES } from '@tripalfa/static-data';
   ```

3. **Remove duplicate definitions** after migration is complete.

## Configuration

### Client Configuration
```typescript
interface StaticDataConfig {
  apiBase: string;           // Base URL for API calls
  cache: CacheConfig;        // Cache configuration
  sources: DataSourceConfig[]; // Data source configuration
  fallbackEnabled: boolean;  // Enable/disable fallback data
}

interface CacheConfig {
  ttl: number;              // Time to live in milliseconds
  maxSize: number;          // Maximum number of cached items
}

interface DataSourceConfig {
  name: string;             // Source name
  priority: number;         // Priority (lower = higher priority)
  endpoint?: string;        // API endpoint
  enabled: boolean;         // Whether source is enabled
  timeout: number;          // Request timeout in milliseconds
}
```

## Error Handling

The client automatically handles errors and falls back to local data when appropriate:

```typescript
try {
  const data = await getAirports({ query: 'London' });
  // Use data
} catch (error) {
  console.error('Failed to fetch airports:', error);
  // Fallback data will be used automatically if enabled
}
```

## Development

### Building
```bash
npm run build
```

### Development
```bash
npm run dev
```

### Testing
```bash
npm test
```

### Linting
```bash
npm run lint
```

## Contributing

1. Follow the existing code style and patterns
2. Add comprehensive tests for new functionality
3. Update documentation as needed
4. Ensure all data types are properly typed

## License

MIT License