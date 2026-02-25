# Flight Stops Display Integration

## Overview

This document covers the implementation of flight stops/layovers display in the TripAlfa booking engine, aligned with [Duffel's Displaying Stops guide](https://duffel.com/docs/guides/displaying-stops).

---

## Current Implementation Status: ✅ COMPLETE

The TripAlfa flight module already implements comprehensive stops/layovers display:

### 1. Backend (booking-service)

**File**: `services/booking-service/src/index.ts`

```typescript
// Stops calculation (line ~175)
stops: (firstSlice?.segments?.length || 1) - 1,

// Segments mapping includes:
segments: firstSlice?.segments?.map((seg: any) => ({
  origin: seg.origin?.iata_code,
  destination: seg.destination?.iata_code,
  departureTime: seg.departing_at,
  arrivalTime: seg.arriving_at,
  carrierCode: seg.marketing_carrier?.iata_code,
  flightNumber: seg.marketing_carrier_flight_number,
  carrier: seg.marketing_carrier?.name,
  duration: seg.duration,
  aircraft: seg.aircraft?.name,
})) || [],
```

### 2. Frontend Service Layer (duffelFlightService)

**File**: `apps/booking-engine/src/services/duffelFlightService.ts`

```typescript
// Layover duration calculation
function calculateLayover(arrival: string, departure: string): string {
  const arr = new Date(arrival);
  const dep = new Date(departure);
  const diffMs = dep.getTime() - arr.getTime();
  if (diffMs <= 0) return '0h 0m';
  
  const diffHrs = Math.floor(diffMs / 3600000);
  const diffMins = Math.floor((diffMs % 3600000) / 60000);
  return `${diffHrs}h ${diffMins}m`;
}

// Segment mapping with layover
const segments: FlightSegment[] = outSegs.map((seg, idx) => {
  const nextSeg = outSegs[idx + 1];
  return {
    // ... other fields
    layoverDuration: nextSeg ? calculateLayover(seg.arriving_at, nextSeg.departing_at) : null,
    departureTerminal: seg.origin_terminal ?? null,
    arrivalTerminal: seg.destination_terminal ?? null,
  };
});
```

### 3. Flight Search Results (FlightList/FlightSearch)

**File**: `apps/booking-engine/src/pages/FlightList.js`

Display of stops count:

```jsx
// Filter by stops
{flight.stops === 0 ? 'Non-stop' : `${flight.stops} Stop${flight.stops > 1 ? 's' : ''}`}
```

Stops filter UI:

```jsx
// Filter options
{ label: 'Non-stop', value: 'non-stop' }
{ label: '1 Stop', value: '1-stop' }
{ label: '2+ Stops', value: '2-plus-stops' }
```

### 4. Flight Detail Page (FlightDetail.tsx)

**File**: `apps/booking-engine/src/pages/FlightDetail.tsx`

Shows detailed layover information for each segment:

```tsx
// Calculate layover between segments
const layover = nextSeg
  ? (() => {
      const diff = new Date(nextSeg.departing_at).getTime()
                 - new Date(arrAt).getTime();
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      return `${h}h ${m}m`;
    })()
  : null;

// Display layover in amber badge
{segment.layover && (
  <div className="mt-4 px-4 py-3 bg-amber-50 rounded-2xl border border-amber-100 flex items-center gap-3">
    <Clock size={12} className="text-amber-500 shrink-0" />
    <span className="text-[10px] font-black text-amber-700 uppercase tracking-wider">
      Layover: {segment.layover}
    </span>
  </div>
)}
```

---

## Key Features Implemented

| Feature | Duffel Guide | Implementation |
| ------- | ------------ | -------------- |
| Stop count display | ✅ | ✅ `(segments.length - 1)` |
| Layover duration | ✅ | ✅ `calculateLayover()` function |
| Direct flight labeling | ✅ | ✅ "Non-stop" text |
| Connection time | ✅ | ✅ Shown in segment details |
| Terminal info | ✅ | ✅ `departureTerminal`, `arrivalTerminal` |
| Multi-city support | ✅ | ✅ Multiple slices with segments |
| Aircraft info | ✅ | ✅ `seg.aircraft?.name` |
| Filter by stops | ✅ | ✅ UI filter with counts |

---

## API Integration (Duffel)

### Search with Connection Filter

The backend supports `max_connections` parameter:

```json
{
  "max_connections": 1,
  "slices": [
    {
      "origin": "LHR",
      "destination": "JFK",
      "departure_date": "2026-03-15"
    }
  ]
}
```

| Value | Result |
| ----- | ------ |
| `0` | Direct flights only |
| `1` | Maximum 1 stop |
| `2` | Maximum 2 stops |

---

## Data Flow

```text
Duffel API Response
       ↓
booking-service (transform)
       ↓
API Gateway (hybrid cache)
       ↓
duffelFlightService (map)
       ↓
FlightSearch/FlightList (display)
       ↓
FlightDetail (segment details + layover)
```

---

## TypeScript Interfaces

### FlightSegment

```typescript
interface FlightSegment {
  id: string;
  origin: string;
  originCity: string;
  destination: string;
  destinationCity: string;
  departureTime: string;
  arrivalTime: string;
  flightNumber: string;
  airline: string;
  duration: string;
  layoverDuration: string | null;
  departureTerminal: string | null;
  arrivalTerminal: string | null;
  aircraft?: string;
}
```

### FlightSearchResult

```typescript
interface FlightSearchResult {
  id: string;
  offerId: string;
  tripType: 'one-way' | 'round-trip' | 'multi-city';
  airline: string;
  carrierCode: string;
  flightNumber: string;
  departureTime: string;
  origin: string;
  originCity: string;
  arrivalTime: string;
  destination: string;
  destinationCity: string;
  duration: string;
  stops: number;
  amount: number;
  currency: string;
  refundable: boolean;
  includedBags: Array<{ quantity: number; weight: number; unit: string }>;
  segments: FlightSegment[];
  extraSlices?: FlightExtraSlice[];
}
```

---

## Testing

### Verify Stops Display

1. Search for a route with multiple stops (e.g., LHR → LAX)
2. Verify stops count is shown correctly
3. Click on flight to see segment breakdown
4. Verify layover duration is displayed between segments

### Verify Filter Works

1. Select "Non-stop" filter
2. Verify only direct flights are shown
3. Select "1 Stop" filter
4. Verify only flights with 1 connection are shown

---

## Related Documentation

- [Duffel Search Best Practices](./DUFFEL_SEARCH_BEST_PRACTICES.md)
- [Duffel API Integration](./DUFFEL_API_INTEGRATION.md)
- [Frontend Integration Guide](./DUFFEL_FRONTEND_INTEGRATION_GUIDE.md)

---

**Last Updated**: February 25, 2026

**Reference**: <https://duffel.com/docs/guides/displaying-stops>
