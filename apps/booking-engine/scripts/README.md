# Build-Time Static Data Generation

This directory contains scripts that directly index PostgreSQL tables and generate TypeScript files bundled into the frontend at build time.

## Overview

Instead of fetching static reference data (airports, airlines, countries, etc.) through an API at runtime, we:

1. **Extract** data from PostgreSQL at build time
2. **Generate** TypeScript files with pre-indexed lookups
3. **Bundle** into the frontend for instant access

This eliminates network latency and API failures for static data.

## Usage

### Generate Static Data

```bash
# One-time generation
npm run generate:static

# Watch mode (regenerate on DB changes)
npm run generate:static:watch

# Before build (automatic via prebuild hook)
npm run build
```

### Environment Variables

```bash
# PostgreSQL connection string
STATIC_DATABASE_URL=postgresql://user:pass@host:port/database
```

### Output

Generated files are written to `src/generated/static-data/`:

```
src/generated/static-data/
├── index.ts           # Master exports
├── airports.ts        # ~9,200 airports with IATA index
├── airlines.ts        # ~800 airlines with IATA index  
├── cities.ts          # ~4,000 cities with IATA index
├── countries.ts       # ~250 countries with phone prefixes
├── currencies.ts      # ~150 currencies with symbols
├── hotel-amenities.ts # ~80 amenities by category
├── board-types.ts     # 7 meal plan types
├── suppliers.ts       # Active hotel/flight suppliers
├── destinations.ts    # ~5,000 destinations
└── loyalty-programs.ts # Airline/hotel loyalty programs
```

## Using in Components

### Direct Import

```typescript
import { AIRPORTS, AIRPORTS_BY_IATA } from '../generated/static-data';

const airport = AIRPORTS_BY_IATA['DXB'];
```

### React Hooks

```typescript
import { 
  useStaticAirports, 
  useStaticAirlines,
  useStaticDestinations 
} from '../hooks/useBundledStaticData';

function FlightSearch() {
  const { search: searchAirports } = useStaticAirports();
  const { getLogo } = useStaticAirlines();
  
  const results = searchAirports('dubai');
  
  return (
    <div>
      {results.map(airport => (
        <div key={airport.iata_code}>
          <img src={getLogo(airport.iata_code)} />
          {airport.name}
        </div>
      ))}
    </div>
  );
}
```

### Master Hook

```typescript
import { useBundledStaticData } from '../hooks/useBundledStaticData';

function App() {
  const { 
    airports, 
    airlines, 
    destinations,
    suppliers 
  } = useBundledStaticData();
  
  // All static data available instantly
}
```

## Generated Data Structures

### Airports

```typescript
interface Airport {
  iata_code: string;     // "DXB"
  name: string;          // "Dubai International Airport"
  city: string;          // "Dubai"
  country: string;       // "United Arab Emirates"
  country_code: string;  // "AE"
  latitude: number;      // 25.2532
  longitude: number;     // 55.3657
}

// Indexed for O(1) lookup
AIRPORTS_BY_IATA['DXB'] // → Airport
```

### Airlines

```typescript
interface Airline {
  iata_code: string;        // "EK"
  name: string;             // "Emirates"
  logo_url: string;         // CDN URL
  logo_symbol_url: string;  // Symbol only
  country: string;          // "United Arab Emirates"
  country_code: string;     // "AE"
}

// Get logo instantly
AIRLINES_BY_IATA['EK']?.logo_symbol_url
```

### Destinations

```typescript
interface Destination {
  id: string;
  code: string;
  name: string;
  destinationType: 'city' | 'region' | 'zone';
  countryCode: string;
  countryName: string;
  hotelCount: number;
  isPopular: boolean;
  imageUrl: string;
}

// Popular destinations for homepage
POPULAR_DESTINATIONS.slice(0, 12)
```

## Performance Benefits

| Metric | API Approach | Bundled Approach |
|--------|--------------|------------------|
| Initial load | 500ms+ (multiple API calls) | 0ms (bundled) |
| Time to interactive | Delayed | Instant |
| Offline support | No | Yes |
| SEO | Data not in HTML | Data in HTML |

## Data Freshness

- Run `npm run generate:static` when static data changes
- CI/CD pipelines should regenerate on deploy
- Data is version-controlled with the build

## Database Tables Indexed

| Table | Records | Used For |
|-------|---------|----------|
| Airport | ~9,200 | Flight search autocomplete |
| Airline | ~800 | Carrier display, logos |
| City | ~4,000 | Destination search |
| Country | ~250 | Phone prefixes, dropdowns |
| Currency | ~150 | Price formatting |
| HotelAmenity | ~80 | Hotel facilities |
| BoardType | 7 | Meal plans |
| Destination | ~5,000 | Hotel search |
| Supplier | ~10 | Supplier badges |
| LoyaltyProgram | ~50 | Frequent flyer programs |

## Extending

Add new generators in `scripts/generate-static-data.ts`:

```typescript
async function generateNewDataType() {
  const data = await query(`SELECT * FROM "NewTable"`);
  
  writeTsFile('new-data.ts', `
export const NEW_DATA = ${JSON.stringify(data)};
`);
  
  return data.length;
}
```

Then add to the `main()` function and regenerate.