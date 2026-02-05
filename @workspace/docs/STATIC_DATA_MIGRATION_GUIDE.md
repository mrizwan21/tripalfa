# Static Data Migration Guide

This guide explains how to migrate from scattered static data to the new centralized `@tripalfa/static-data` package.

## Overview

The new centralized static data system eliminates duplications and provides:
- Unified API for all static data types
- Smart caching and fallback mechanisms
- Type safety and better performance
- Consistent error handling

## Migration Steps

### 1. Update Package Dependencies

Add the static-data package to your project dependencies:

```bash
# From project root
npm install @tripalfa/static-data
```

### 2. Replace Import Statements

#### Before (Scattered Imports)
```typescript
// apps/booking-engine/src/lib/constants.ts
export const STATIC_AIRPORTS_FALLBACK = [...];
export const STATIC_CITIES_FALLBACK = [...];

// apps/booking-engine/src/lib/api.ts
import { STATIC_API_BASE } from './constants';
// Multiple scattered API calls
```

#### After (Centralized Imports)
```typescript
// Anywhere in your code
import { getAirports, getCities, staticDataClient } from '@tripalfa/static-data';
```

### 3. Replace API Calls

#### Before (Direct API Calls)
```typescript
export async function fetchAirports(query?: string) {
  try {
    const endpoint = query
      ? `${API_ENDPOINTS.STATIC_AIRPORTS}?q=${encodeURIComponent(query)}`
      : API_ENDPOINTS.STATIC_AIRPORTS;

    const res = await remoteFetch(endpoint);
    return res || [];
  } catch (error) {
    console.error('Failed to fetch airports:', error);
    return [];
  }
}
```

#### After (Using Centralized Client)
```typescript
import { getAirports } from '@tripalfa/static-data';

export async function fetchAirports(query?: string) {
  try {
    const response = await getAirports({ query });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch airports:', error);
    return [];
  }
}
```

### 4. Replace Fallback Data

#### Before (Hardcoded Fallbacks)
```typescript
// apps/booking-engine/src/lib/constants.ts
export const STATIC_AIRPORTS_FALLBACK = [
  {
    iata_code: 'LHR',
    name: 'London Heathrow Airport',
    // ... more properties
  }
];
```

#### After (Automatic Fallbacks)
```typescript
// No more hardcoded fallbacks needed!
// The centralized system handles fallbacks automatically
```

### 5. Update Location Autocomplete

#### Before (Manual Location Handling)
```typescript
// apps/booking-engine/src/components/ui/LocationAutocomplete.tsx
import { STATIC_AIRPORTS_FALLBACK, STATIC_CITIES_FALLBACK } from '../../lib/constants';

const staticLocations: Location[] = [
  ...STATIC_AIRPORTS_FALLBACK.map(a => ({ ...a, type: 'airport' as const })),
  ...STATIC_CITIES_FALLBACK.map(c => ({ ...c, type: 'city' as const }))
];
```

#### After (Using Centralized Locations)
```typescript
// apps/booking-engine/src/components/ui/LocationAutocomplete.tsx
import { getLocations } from '@tripalfa/static-data';

// Replace the entire location fetching logic
const locations = await getLocations(search);
```

### 6. Update Constants

#### Before (Multiple API Endpoints)
```typescript
// apps/booking-engine/src/lib/constants.ts
export const API_ENDPOINTS = {
  STATIC_AIRPORTS: `${STATIC_API_BASE}/airports`,
  STATIC_AIRLINES: `${STATIC_API_BASE}/airlines`,
  STATIC_CITIES: `${STATIC_API_BASE}/cities`,
  // ... many more
};
```

#### After (No More Constants Needed)
```typescript
// Remove all static data constants
// Use the centralized client instead
```

## Specific File Migrations

### apps/booking-engine/src/lib/constants.ts

**Remove these exports:**
- `STATIC_AIRPORTS_FALLBACK`
- `STATIC_CITIES_FALLBACK`
- All `STATIC_*` API endpoints

**Keep these:**
- `APP_NAME`
- `API_BASE_URL`
- `API_ENDPOINTS` (only non-static endpoints)
- `NAV_LINKS`
- `FLIGHT_CLASSES`

### apps/booking-engine/src/lib/api.ts

**Replace these functions:**
- `fetchAirports()`
- `fetchAirlines()`
- `fetchCities()`
- `fetchCurrencies()`
- `fetchLoyaltyPrograms()`
- `fetchSuggestions()`
- `fetchCountries()`
- `fetchNationalities()`

**Keep these functions:**
- All booking-related functions
- All user-related functions
- All payment-related functions
- All search-related functions (flights, hotels)

### apps/booking-engine/src/components/ui/LocationAutocomplete.tsx

**Replace the entire location fetching logic:**
- Remove hardcoded fallback data
- Remove manual API calls
- Use `getLocations()` from centralized client

## Benefits of Migration

### 1. Reduced Code Duplication
- No more scattered fallback data
- No more duplicate API endpoints
- No more manual error handling

### 2. Better Performance
- Smart caching reduces API calls
- Automatic fallbacks prevent errors
- Optimized data fetching

### 3. Improved Maintainability
- Single source of truth for static data
- Type-safe interfaces
- Centralized error handling

### 4. Enhanced Reliability
- Automatic fallbacks when APIs fail
- Graceful degradation
- Consistent data format

## Testing the Migration

### 1. Unit Tests
```typescript
import { getAirports } from '@tripalfa/static-data';

describe('Static Data Migration', () => {
  test('should fetch airports with caching', async () => {
    const response = await getAirports({ query: 'London' });
    expect(response.data).toBeDefined();
    expect(response.total).toBeGreaterThan(0);
    expect(response.cached).toBe(false); // First call
  });

  test('should return cached data on second call', async () => {
    const response1 = await getAirports({ query: 'London' });
    const response2 = await getAirports({ query: 'London' });
    expect(response2.cached).toBe(true);
  });
});
```

### 2. Integration Tests
```typescript
import { staticDataClient } from '@tripalfa/static-data';

describe('Static Data Integration', () => {
  test('should handle API failures gracefully', async () => {
    // Mock API failure
    const client = new StaticDataClient({
      apiBase: 'https://nonexistent-api.com',
      fallbackEnabled: true
    });

    const response = await client.getAirports();
    expect(response.data).toBeDefined();
    expect(response.source).toBe('fallback');
  });
});
```

## Rollback Plan

If issues arise during migration:

1. **Keep old code temporarily**: Don't delete old functions immediately
2. **Feature flags**: Use environment variables to switch between old and new
3. **Gradual rollout**: Migrate one component at a time
4. **Monitoring**: Track performance and error rates

## Support

For questions about the migration:
- Check the `@tripalfa/static-data` package documentation
- Review the example implementations in this guide
- Contact the development team for assistance

## Timeline

- **Week 1**: Migrate core API functions
- **Week 2**: Update frontend components
- **Week 3**: Remove old code and cleanup
- **Week 4**: Testing and optimization