# Duffel Flight Module Integration Guide

## Overview

This guide documents the complete integration of the Duffel Flight API with the TripAlfa Booking Engine frontend. It covers the data flow, API endpoints, testing, and debugging.

## Architecture

```text
┌─────────────────────┐
│   BOOKING ENGINE    │
│   (React + Vite)    │
└──────────┬──────────┘
           │
    ┌──────▼──────────┐
    │   API Gateway   │  (PORT 3000)
    └──────┬──────────┘
           │
    ┌──────▼──────────────┐
    │ Booking Service     │  (NODE EXPRESS)
    │ - Routes           │
    │ - Controllers      │
    │ - Services         │
    └──────┬──────────────┘
           │
    ┌──────▼──────────────┐
    │   Duffel API        │  (PRODUCTION OR SANDBOX)
    │   - Flight Search   │
    │   - Booking         │
    │   - Payment         │
    │   - Cancellation    │
    └─────────────────────┘

Database: Neon PostgreSQL (Order persistence)
Cache: Redis (Flight search caching)
```

## Data Flow

### 1. Flight Search Flow

```text
User Input (Origin, Destination, Dates)
    ↓
DuffelFlightSearch Component (frontend/src/components/flight/)
    ↓
useDuffelFlights Hook (frontend/src/hooks/)
    ↓
duffelFlightService.searchFlights()
    ↓
flightApi.post("/duffel/offer-requests")
    ↓
API Gateway → Booking Service
    ↓
POST /api/duffel/offer-requests
    ↓
OfferRequestManager (Duffel API Manager)
    ↓
Duffel API: POST /air/offer_requests
    ↓
Cache Response (Redis)
    ↓
Return Results to Frontend
    ↓
Display in DuffelFlightResults Component
```

### 2. Booking Flow

```text
Select Flight Offer
    ↓
Create Hold Order (Book Now, Pay Later)
    ↓
flightApi.createDuffelHoldOrder()
    ↓
POST /duffel/orders/hold
    ↓
Duffel API: POST /air/orders (type: hold)
    ↓
Store Order in Database (Neon)
    ↓
Return Order ID + Payment Deadline
    ↓
User Completes Passenger Details
    ↓
Execute Payment
    ↓
POST /duffel/orders/{id}/pay
    ↓
Duffel API: POST /air/payments
    ↓
Order Status → Confirmed
    ↓
Issue Ticket
    ↓
Return Booking Confirmation
```

## Frontend Components

### Flight Search Component

**File**: `apps/booking-engine/src/components/flight/DuffelFlightSearch.tsx`

Provides:

- Trip type selection (One-way, Round-trip, Multi-city)
- Origin/Destination autocomplete
- Date picker
- Passenger count selector
- Cabin class selector

Props:

```typescript
interface DuffelFlightSearchProps {
  initialTripType?: "roundTrip" | "oneWay" | "multiCity";
  initialCabinClass?: CabinClass;
  onSearchComplete?: (flights: any[]) => void;
  onNavigate?: (params: URLSearchParams) => void;
  compact?: boolean;
  className?: string;
}
```

### Flight Results Component

**File**: `apps/booking-engine/src/components/flight/DuffelFlightResults.tsx`

Displays:

- List of available flight options
- Price, duration, stops information
- Select button for each flight
- Sorting and filtering options

### Flight Detail Component

**File**: `apps/booking-engine/src/components/flight/DuffelFlightDetail.tsx`

Shows:

- Complete itinerary with segments
- Seat map availability
- Baggage information
- Ancillary services availability

## API Endpoints

### Duffel Flight Endpoints

All endpoints are proxied through the API Gateway:

- **Base URL**: `http://localhost:3000/api`
- **Backend Service**: `services/booking-service/src/routes/duffel.ts`

#### Flight Search

```http
POST /duffel/offer-requests
Body: {
  slices: Array<{
    origin: string (IATA code)
    destination: string (IATA code)
    departure_date: string (YYYY-MM-DD)
  }>,
  passengers: Array<{
    type: "adult" | "child" | "infant"
    given_name: string
    family_name: string
  }>,
  cabin_class?: "economy" | "premium_economy" | "business" | "first",
  loyalty_programme_accounts?: Array
}

Response: {
  id: string (Offer Request ID)
  offers: Array<DuffelOffer>
  created_at: string
}
```

#### Get Offer Details

```http
GET /duffel/offers/{offerId}

Response: DuffelOffer {
  id: string
  slices: Array<Slice>
  available_services: Array<Service>
  total_amount: {
    amount: string
    currency: string
  }
  owner: { iata_code: string }
}
```

#### Create Hold Order

```http
POST /duffel/orders/hold
Body: {
  selected_offers: string[] (Offer IDs)
  passengers: Array<{
    type: "adult" | "child" | "infant"
    given_name: string
    family_name: string
    email: string
    phone_number: string
    born_at?: string (YYYY-MM-DD)
    title?: "mr" | "mrs" | "ms"
  }>,
  contact?: {
    email: string
    phone_number: string
  }
}

Response: {
  order: DuffelOrder {
    id: string
    type: "hold"
    status: "pending"
    created_at: string
    payment_required_by: string
  },
  payment_required_by: string
}
```

#### Pay for Order

```http
POST /duffel/orders/{orderId}/pay
Body: {
  payment_method_type: "balance" | "card"
}

Response: {
  order: DuffelOrder {
    status: "confirmed"
  },
  payment_intent?: PaymentIntent
}
```

#### Get Order Details

```http
GET /duffel/orders/{orderId}

Response: DuffelOrder {
  id: string
  status: "pending" | "confirmed" | "archived" | "cancelled"
  passengers: Array<Passenger>
  total_amount: { amount: string, currency: string }
  created_at: string
}
```

#### Get Seat Maps

```http
GET /duffel/seat-maps?offer_id={offerId}&order_id={orderId}

Response: Array<SeatMap> {
  id: string
  segment_id: string
  cabin: {
    rows: Array<Row>
  }
  available_services: Array<Service>
}
```

#### Get Available Services

```http
GET /duffel/orders/{orderId}/available-services

Response: Array<Service> {
  id: string
  type: "baggage" | "seat" | "meal"
  name: string
  metadata: any
}
```

#### Cancel Order

```http
POST /duffel/order-cancellations
Body: {
  order_id: string
}

Response: {
  id: string (Cancellation ID)
  order_id: string
  status: "pending"
}
```

## State Management

### useDuffelFlights Hook

**File**: `apps/booking-engine/src/hooks/useDuffelFlights.ts`

Key features:

- Client-side caching (5 minute TTL by default)
- Request cancellation support
- Automatic state reset
- Error handling

```typescript
const { flights, loading, error, search, reset, isCached, total } = useDuffelFlights({
  initialParams: { origin: "LHR", destination: "JFK", ... },
  enableCache: true,
  cacheTTL: 5 * 60 * 1000,
  onSuccess: (results) => console.log("Found flights:", results),
  onError: (error) => console.error("Search failed:", error)
});

// Trigger search
await search({
  origin: "LHR",
  destination: "JFK",
  departureDate: "2026-06-15",
  adults: 1
});
```

## Testing

### Integration Tests

#### Playwright E2E Tests

```bash
# Run all flight integration tests
npx playwright test tests/e2e/duffel-flight-integration.spec.ts

# Run specific test
npx playwright test tests/e2e/duffel-flight-integration.spec.ts -g "Flight Search"

# Run with UI
npx playwright test --ui tests/e2e/duffel-flight-integration.spec.ts
```

#### Data Flow Verification Script

```bash
# Run integration verification
npm run test:api:duffel-flight-integration

# Or with ts-node
npx ts-node scripts/test-duffel-flight-integration.ts

# Verbose output
VERBOSE=true npm run test:api:duffel-flight-integration

# Custom API URL
API_BASE_URL=http://localhost:4000/api npm run test:api:duffel-flight-integration
```

### Test Files

1. **Unit Tests**
   - `apps/booking-engine/src/services/duffelFlightService.ts` - Service logic
   - `apps/booking-engine/src/hooks/useDuffelFlights.ts` - Hook tests

2. **Integration Tests**
   - `apps/booking-engine/tests/api-integration/duffel-flight-integration.test.ts` - Core API client
   - `apps/booking-engine/tests/e2e/duffel-flight-integration.spec.ts` - Playwright tests
   - `scripts/test-duffel-flight-integration.ts` - Node.js test runner

## Debugging

### Enable Request/Response Logging

In `apps/booking-engine/src/lib/api.ts`:

```typescript
api.interceptors.request.use((config) => {
  console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
  return config;
});

api.interceptors.response.use((response) => {
  console.log(`[API] ${response.status} ${response.statusText}`);
  return response;
});
```

### Monitor Network Requests

1. Open DevTools (F12)
2. Go to Network tab
3. Filter by "api/duffel"
4. Perform flight search
5. Inspect request/response details

### Backend Logging

Enable logging in `services/booking-service`:

```bash
DEBUG=booking-service:* npm run dev
```

### Database Checks

Check cached offers in Redis:

```bash
redis-cli
> KEYS "offer_request:*"
> GET "offer_request:LHR:JFK:2026-06-15"
```

Check orders in Neon:

```sql
SELECT * FROM "Order" WHERE status = 'hold' ORDER BY created_at DESC LIMIT 10;
```

## Troubleshooting

### No Offers Returned

1. **Check search parameters**
   - Ensure valid IATA codes (LHR, JFK, etc.)
   - Verify departure date is in future
   - Check passenger count matches

2. **Verify Duffel API access**
   - Check `DUFFEL_API_KEY` environment variable
   - Verify API token has correct permissions
   - Check API sandbox vs production

3. **Check caching**
   - Clear Redis cache: `redis-cli FLUSHDB`
   - Retry search

### Payment Failures

- **Check order status**

  ```text
  GET /duffel/orders/{orderId}
  ```

- **Verify payment method**
  - Ensure "balance" payment method is available
  - Check wallet balance if using balance payment

- **Check payment deadline**
  - Holds expire after `payment_required_by` timestamp
  - Create new order if expired

### Timeout Issues

1. **Increase timeout in flightApi.ts**

   ```typescript
   const response = await api.post(..., {
     timeout: 60000 // 60 seconds
   });
   ```

2. **Check network connectivity**
   - Verify internet connection
   - Check firewall rules
   - Test with `curl https://api.duffel.com/air/offer_requests`

## Performance Optimization

### Caching Strategy

1. **Client-side caching** (5 minutes default)
   - Enabled by default in `useDuffelFlights` hook
   - Configurable TTL

2. **Server-side caching** (Database + Redis)
   - Offer requests stored in Neon
   - Results cached in Redis
   - See `services/booking-service/src/cache/` for details

3. **Cache invalidation**
   - Automatic after TTL expiration
   - Manual via `refetch()` in hook
   - Via cache invalidation middleware on mutations

### Database Indexes

Ensure these indexes exist in `database/prisma/schema.prisma`:

```prisma
model OfferRequest {
  @@index([origin, destination, departureDate])
  @@index([createdAt])
}

model Order {
  @@index([status])
  @@index([createdAt])
  @@index([userId])
}
```

## Environment Variables

Required for production deployment:

```env
# Duffel API
DUFFEL_API_KEY=your_api_key_here
DUFFEL_API_URL=https://api.duffel.com

# API Gateway
API_BASE_URL=http://localhost:3000/api

# Database
DATABASE_URL=postgresql://...

# Redis
REDIS_URL=redis://localhost:6379
```

## References

- [Duffel API Documentation](https://duffel.com/docs/api/v2)
- [Setup Guide](./FLIGHT_MODULE_INTEGRATION_GUIDE.md)
- [API Implementation Status](./DUFFEL_API_INTEGRATION.md)
- [Caching Guide](./integrations/DUFFEL_CACHING_GUIDE.md)

## Support

For issues or questions:

1. Check the troubleshooting section above
2. Review test logs: `npm run test:api:duffel-flight-integration`
3. Check Duffel API status: <https://status.duffel.com>
4. Contact development team
