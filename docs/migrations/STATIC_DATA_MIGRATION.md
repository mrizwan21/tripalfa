# Static Data Service Migration Guide

## Overview

The static data service has been restructured as part of the `restructure-phase1-optimization` branch. This guide documents the migration path for services that previously depended on the dedicated static-data-service.

## What Changed

### Before

- Dedicated `static-data-service` running on port 3002
- Direct database queries to static database (port 5433)
- Separate API endpoints under `/static-data/*`

### After

- Static data access consolidated through API Gateway
- Centralized API facade pattern at `/api/static/*`
- React Query hooks for frontend data fetching
- Direct database access through shared-database package

## Migration Paths

### 1. Frontend Applications

**Before:**

```typescript
// Direct fetch to static data service
const response = await fetch('http://localhost:3002/airports');
const airports = await response.json();
```

**After:**

```typescript
// Use React Query hooks from shared package
import { useAirports, useAirlines, useHotels } from '@tripalfa/shared-hooks';

function MyComponent() {
  const { data: airports, isLoading } = useAirports();
  const { data: airlines } = useAirlines();
  const { data: hotels } = useHotels({ city: 'DXB' });
  
  // ...
}
```

### 2. Backend Services

**Before:**

```typescript
// Direct database connection
import { Pool } from 'pg';
const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres@localhost:5433/staticdatabase'
});
const result = await pool.query('SELECT * FROM airports');
```

**After:**

```typescript
// Use shared-database package
import { prisma } from '@tripalfa/shared-database';

// For static data, use the appropriate model
const airports = await prisma.airport.findMany();
const airlines = await prisma.airline.findMany();
```

### 3. API Endpoints

**Before:**

```http
GET /static-data/airports
GET /static-data/airlines
GET /static-data/hotels
```

**After:**

```http
GET /api/static/airports
GET /api/static/airlines
GET /api/static/hotels
```

**Note:** Legacy routes are supported with deprecation warnings until 2025-06-01.

## Environment Variables

Update your `.env` files:

```bash
# Old (deprecated)
STATIC_DATA_SERVICE_URL=http://localhost:3002

# New (required)
STATIC_DATABASE_URL=postgresql://postgres:postgres@localhost:5433/staticdatabase
API_GATEWAY_URL=http://localhost:3000
```

## Available Static Data Endpoints

| Endpoint   | Description               | New Path                  |
| ---------- | ------------------------- | ------------------------- |
| Airports   | Airport search and details| `/api/static/airports`    |
| Airlines   | Airline information       | `/api/static/airlines`    |
| Hotels     | Hotel properties          | `/api/static/hotels`      |
| Cities     | City data                 | `/api/static/cities`      |
| Countries  | Country reference         | `/api/static/countries`   |
| Currencies | Currency exchange rates   | `/api/static/currencies`  |
| Aircraft   | Aircraft types            | `/api/static/aircraft`    |

## React Query Hooks Reference

### useAirports

```typescript
const { data, isLoading, error } = useAirports({
  search: 'DXB',      // Optional: search by IATA code or name
  country: 'AE',      // Optional: filter by country
  enabled: true       // Optional: enable/disable query
});
```

### useAirlines

```typescript
const { data, isLoading } = useAirlines({
  search: 'Emirates', // Optional: search by name or IATA code
  active: true        // Optional: filter active airlines only
});
```

### useHotels

```typescript
const { data, isLoading } = useHotels({
  city: 'DXB',        // Required: city IATA code
  country: 'AE',      // Optional: country code
  amenities: ['WIFI', 'POOL'], // Optional: filter by amenities
  page: 1,            // Optional: pagination
  limit: 20           // Optional: results per page
});
```

## Database Schema

The static database schema remains unchanged. Tables include:

- `airports` - Airport information with IATA/ICAO codes
- `airlines` - Airline details and codes
- `hotels` - Hotel properties and amenities
- `cities` - City reference data
- `countries` - Country information
- `currencies` - Currency exchange rates
- `aircraft` - Aircraft type specifications
- `amenities` - Hotel amenity reference

## Breaking Changes

1. **Direct static-data-service access removed**
   - Service no longer runs on port 3002
   - All requests must go through API Gateway

2. **API route changes**
   - `/static-data/*` → `/api/static/*`
   - Legacy routes will return deprecation headers

3. **Response format changes**
   - All responses now wrapped in standard API response format:

   ```typescript
   {
     data: [...],
     pagination: { page: 1, limit: 20, total: 100 }
   }
   ```

## Timeline

- **Phase 1 (Current):** Legacy routes supported with deprecation warnings
- **Phase 2 (2025-04-01):** Legacy routes return 301 redirects
- **Phase 3 (2025-06-01):** Legacy routes removed

## Support

For migration assistance:

1. Check this documentation
2. Review the API Gateway configuration at `services/api-gateway/src/config/api-manager.config.ts`
3. Contact the platform team for complex migrations
