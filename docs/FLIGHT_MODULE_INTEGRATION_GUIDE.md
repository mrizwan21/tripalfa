# Flight Module Integration Guide

## Overview

The flight module provides complete integration between the Booking Engine frontend and Duffel APIs for flight search, booking, and management. This guide documents the complete data flow, integration points, and testing procedures.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      BOOKING ENGINE FRONTEND                     │
│  (DuffelFlightSearch, DuffelFlightResults, DuffelFlightDetail)   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
        ┌────────────────────────────────────────┐
        │   Frontend API Layer                   │
        │   - useDuffelFlights hook              │
        │   - duffelFlightService                │
        │   - duffelApiManager                   │
        └────────────────┬───────────────────────┘
                         │
                         ▼
        ┌────────────────────────────────────────┐
        │   API GATEWAY                          │
        │   - Routes: /api/duffel/*              │
        │   - Cache: Redis                       │
        │   - Rate limiting                      │
        └────────────────┬───────────────────────┘
                         │
                         ▼
        ┌────────────────────────────────────────┐
        │   BOOKING SERVICE                      │
        │   - routes/duffel.ts                   │
        │   - routes/flight-booking.ts           │
        │   - services/duffel-api-manager        │
        │   - Database: PostgreSQL (Prisma)      │
        │   - Cache: Redis                       │
        └────────────────┬───────────────────────┘
                         │
                         ▼
        ┌────────────────────────────────────────┐
        │   DUFFEL API (https://api.duffel.com)  │
        │   - Offer Requests (Flight Search)     │
        │   - Offers (Details & Pricing)         │
        │   - Orders (Booking & Management)      │
        │   - Seat Maps                          │
        │   - Services (Baggage, Meals)          │
        │   - Cancellations                      │
        └────────────────────────────────────────┘
```

## Data Flow: Flight Search

### Request Flow

```
1. User enters search criteria in DuffelFlightSearch component
   ↓
2. useDuffelFlights.search() is called with SearchFlightsParams
   ↓
3. duffelFlightService.searchFlights() is invoked
   ↓
4. duffelApiManager.post('/offer-requests') sends request to API Gateway
   ↓
5. API Gateway routes to booking-service POST /api/duffel/offer-requests
   ↓
6. Booking service prepares request and calls Duffel API
   ↓
7. Results are cached in Redis
   ↓
8. Response flows back through layers
   ↓
9. Results displayed in DuffelFlightResults component
```

### Response Data Structure

```json
{
  "success": true,
  "offers": [
    {
      "id": "offer_123",
      "slices": [
        {
          "id": "slice_456",
          "origin": { "iata_code": "LHR" },
          "destination": { "iata_code": "JFK" },
          "segments": [
            {
              "id": "seg_789",
              "departing_at": "2026-04-15T08:00:00",
              "arriving_at": "2026-04-15T14:00:00",
              "flight_number": "BA112",
              "aircraft": { "iata_code": "789" }
            }
          ]
        }
      ],
      "total_amount": {
        "amount": "850.00",
        "currency": "GBP"
      },
      "meta": {
        "is_refundable": true,
        "is_changeable": true
      }
    }
  ],
  "offerRequestId": "offer_request_xyz",
  "total": 42,
  "cached": false
}
```

## Data Flow: Booking Creation

### Request Flow

```
1. User clicks "Book" on selected flight
   ↓
2. Navigation to BookingCheckout with offerId
   ↓
3. PassengerDetails component collects passenger information
   ↓
4. flightBookingOrchestrator.createHoldBooking() is called
   ↓
5. Creates hold order via duffelApiManager.post('/orders/hold')
   ↓
6. Booking Service:
   - Stores booked order in PostgreSQL
   - Caches order details in Redis
   - Generates booking reference
   ↓
7. Workflow state persisted
   ↓
8. Shows booking confirmation with payment options
   ↓
9. User selects payment method
   ↓
10. Payment processed via payment gateway
    ↓
11. Order confirmed and ticket generated
```

### Booking State Workflow

```
SEARCH → CREATE HOLD → PAYMENT → TICKETING → CONFIRMATION
  │         │           │          │             │
  ├─────────┴─────────┬─┴──────────┴─────────────┤
  │                   │                           │
  └───────────────────────────────────────────────┘
           Cancellation possible at any stage
```

## API Endpoints

### Flight Search

- **POST** `/api/duffel/offer-requests`
  - Create a flight search request
  - Cached for 1 hour

### Offer Details

- **GET** `/api/duffel/offers/:offerId`
  - Retrieve full offer details including services
  - Cached for 2 hours

### Order Management

- **POST** `/api/duffel/orders/hold`
  - Create a hold order (Book Now, Pay Later)
- **POST** `/api/duffel/orders`
  - Create instant order (immediate booking)
- **GET** `/api/duffel/orders/:orderId`
  - Retrieve order details
  - Cached for 24 hours

### Seat Selection

- **GET** `/api/duffel/seat-maps?offer_id=:offerId`
  - Get seat maps for specific offer
  - Cached for 6 hours

### Services & Ancillaries

- **GET** `/api/duffel/orders/:orderId/available-services`
  - List available services (baggage, meals, seats)
- **POST** `/api/duffel/orders/:orderId/services`
  - Add service to order

### Cancellations

- **POST** `/api/duffel/order-cancellations`
  - Initiate order cancellation
- **POST** `/api/duffel/order-cancellations/:cancellationId/confirm`
  - Confirm cancellation

## Frontend Components

### DuffelFlightSearch

Location: `src/components/flight/DuffelFlightSearch.tsx`

**Features:**

- Trip type selection (one-way, round-trip, multi-city)
- Automatic origin/destination swapping
- Multiple leg support
- Traveler configuration
- Cabin class selection
- Date range selection

**Props:**

```typescript
{
  initialTripType?: "roundTrip" | "oneWay" | "multiCity";
  initialCabinClass?: CabinClass;
  onSearchComplete?: (flights: any[]) => void;
  onNavigate?: (params: URLSearchParams) => void;
  compact?: boolean;
  className?: string;
}
```

### DuffelFlightResults

Location: `src/components/flight/DuffelFlightResults.tsx`

**Features:**

- Paginated flight listing
- Sorting by price, duration, stops
- Filtering by airline, departure time
- Real-time price updates
- Price change alerts

### DuffelFlightDetail

Location: `src/components/flight/DuffelFlightDetail.tsx`

**Features:**

- Detailed itinerary display
- Segment breakdown
- Pricing breakdown
- Available ancillaries
- Refundability and changeability indicators

## Hooks

### useDuffelFlights

Location: `src/hooks/useDuffelFlights.ts`

```typescript
const {
  flights, // FlightSearchResult[]
  loading, // boolean
  error, // string | null
  search, // (params: SearchFlightsParams) => Promise<void>
  reset, // () => void
  searchParams, // SearchFlightsParams | null
  isCached, // boolean
  total, // number
  refetch, // () => Promise<void>
} = useDuffelFlights(options);
```

**Features:**

- Built-in caching (configurable TTL)
- Automatic error handling
- Refetch capability
- Cache status tracking

## Services

### duffelFlightService

Location: `src/services/duffelFlightService.ts`

**Methods:**

- `searchFlights(params)` - Search for flights
- `getOfferDetails(offerId)` - Get offer details
- `createOrder(params)` - Create instant order
- `createHoldOrder(params)` - Create hold order
- `getOrder(orderId)` - Get order details
- `getSeatMaps(params)` - Get seat maps
- `getAvailableServices(orderId)` - Get services
- `cancelOrder(orderId)` - Cancel booking

### duffelApiManager

Location: `src/services/duffelApiManager.ts`

**Features:**

- Unified API interface
- Request/response transformation
- Error handling
- Cache management
- Rate limiting headers

## Testing

### Running Integration Tests

```bash
# Run the comprehensive test suite
npm run test:flight-integration

# Run with verbose output
npm run test:flight-integration -- --verbose

# Run parallel tests
npm run test:flight-integration -- --parallel
```

### Test Suites

1. **Flight Search Integration**
   - Search with various parameters
   - Caching validation
   - Multi-city support
   - Traveler combinations

2. **Booking Flow**
   - Hold order creation
   - Payment processing
   - Ticket generation
   - Cancellation handling

3. **Data Flow Validation**
   - Request/response monitoring
   - Cache layer testing
   - Error handling
   - Concurrent request handling

## Environment Variables

```bash
# API Gateway
API_GATEWAY_URL=http://localhost:3000/api

# Duffel API
DUFFEL_API_URL=https://api.duffel.com
DUFFEL_API_KEY=<your_duffel_token>

# Caching
REDIS_URL=redis://localhost:6379
CACHE_TTL_OFFERS=3600
CACHE_TTL_ORDERS=86400

# Testing
TEST_MODE=true
VERBOSE=false
```

## Error Handling

### Common Errors

| Error                  | Cause                   | Resolution                              |
| ---------------------- | ----------------------- | --------------------------------------- |
| `INVALID_SLICES`       | Empty or invalid routes | Provide valid origin, destination, date |
| `INVALID_PASSENGERS`   | Missing passenger data  | Include all required passenger fields   |
| `NO_AVAILABLE_OFFERS`  | No flights for route    | Try different dates or routes           |
| `ORDER_EXPIRED`        | Hold expired            | Create new hold order                   |
| `INSUFFICIENT_BALANCE` | Payment method issue    | Check balance or update payment method  |

### Error Recovery

```typescript
try {
  const result = await duffelFlightService.searchFlights(params);
} catch (error) {
  if (error.code === "INVALID_SLICES") {
    // Prompt user to correct search parameters
  } else if (error.code === "NO_AVAILABLE_OFFERS") {
    // Suggest alternative dates/routes
  } else {
    // Show generic error message
    // Log for monitoring
  }
}
```

## Performance Optimization

### Caching Strategy

- **Offer Requests**: 1 hour (search results change frequently)
- **Offers**: 2 hours (pricing relatively stable)
- **Orders**: 24 hours (rarely change after creation)
- **Seat Maps**: 6 hours (aircraft configuration stable)
- **Services**: 6 hours (ancillary pricing relatively stable)

### Request Batching

```typescript
// Fetch multiple offers in parallel
const offers = await Promise.all(
  offerIds.map((id) => duffelFlightService.getOfferDetails(id)),
);
```

### Pagination

```typescript
// Implement pagination for large result sets
const { flights, hasMore } = await searchFlights({
  ...params,
  limit: 20,
  offset: 0,
});
```

## Monitoring & Debugging

### Enable Detailed Logging

```typescript
// In development environment
localStorage.setItem("flight-module-debug", "true");
```

### Check Cache Status

```typescript
const { isCached, searchParams } = useDuffelFlights();
console.log(`Results from cache: ${isCached}`);
```

### Monitor API Calls

Open browser DevTools → Network tab, filter by `/api/duffel/` to see all API calls.

## Troubleshooting

### No Results Returned

1. Check if API Gateway is running
2. Verify Duffel API credentials
3. Check date is in the future
4. Verify route has available flights

### Slow Search Performance

1. Check cache TTL settings
2. Monitor Redis cache hit rate
3. Enable request batching
4. Implement pagination for large result sets

### Booking Creation Fails

1. Verify all required passenger fields
2. Check if offer is still valid
3. Verify balance for payment method
4. Check booking reference generation

## Contributing

When enhancing the flight module:

1. Update data structures in `types/duffel.ts`
2. Add service methods to `duffelFlightService.ts`
3. Create corresponding API endpoints in booking service
4. Add integration tests
5. Update this documentation
6. Run full test suite before submitting PR

## Related Documentation

- [Duffel API Documentation](https://duffel.com/docs/api/v2)
- [Booking Service Implementation](../../services/booking-service/README.md)
- [API Gateway Architecture](../../services/api-gateway/README.md)
- [Database Schema](../../database/prisma/schema.prisma)
