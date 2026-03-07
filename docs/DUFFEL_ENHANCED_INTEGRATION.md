# Enhanced Duffel Flight API Integration

This document describes the enhanced Duffel Flight API integration that adds advanced flight booking capabilities to the TripAlfa platform.

## Overview

The enhanced Duffel integration extends the existing flight booking functionality with new API endpoints and database models that support:

- **Partial Offer Requests** - Segment-by-segment flight pricing
- **Batch Offer Requests** - Bulk flight search for multiple routes
- **Order Changes** - Flight modification and rebooking
- **Airline Credits** - Refund management and credit handling
- **Services Management** - Ancillary services and add-ons
- **Enhanced Payments** - Advanced payment processing
- **Airline-Initiated Changes** - Proactive flight changes

## Architecture

### Database Schema

The enhanced integration introduces new database models:

#### Core Models
- `DuffelPartialOfferRequest` - Partial offer request tracking
- `DuffelPartialOfferFare` - Individual fare data for partial offers
- `DuffelBatchOfferRequest` - Batch search request management
- `DuffelOrderChangeRequest` - Order modification tracking
- `DuffelAirlineCredit` - Airline credit management
- `DuffelService` - Ancillary services tracking
- `DuffelPayment` - Enhanced payment records
- `DuffelAirlineInitiatedChange` - Proactive change management

#### Enhanced Existing Models
- `DuffelOrder` - Added `localBookingId` field for internal tracking
- `DuffelOffer` - Enhanced with additional metadata

### API Endpoints

#### Partial Offer Requests
- `POST /api/duffel/partial-offer-requests` - Create partial offer request
- `GET /api/duffel/partial-offer-requests/:id` - Get partial offer request
- `GET /api/duffel/partial-offer-requests/:id/fares` - Get fares for partial offer

#### Batch Offer Requests
- `POST /api/duffel/batch-offer-requests` - Create batch offer request
- `GET /api/duffel/batch-offer-requests/:id` - Get batch offer request

#### Order Changes
- `POST /api/duffel/order-change-requests` - Create order change request
- `GET /api/duffel/order-change-requests/:id` - Get order change request
- `POST /api/duffel/order-changes` - Create pending order change
- `POST /api/duffel/order-changes/confirm` - Confirm order change

#### Airline Credits
- `GET /api/duffel/airline-credits` - List airline credits
- `POST /api/duffel/airline-credits` - Create airline credit
- `GET /api/duffel/airline-credits/:id` - Get airline credit

#### Services Management
- `GET /api/duffel/services` - List services for order
- `POST /api/duffel/services` - Add services to order

#### Enhanced Payments
- `GET /api/duffel/payments` - List payments for order
- `POST /api/duffel/payments` - Create payment
- `GET /api/duffel/payments/:id` - Get payment details

#### Airline-Initiated Changes
- `GET /api/duffel/airline-initiated-changes` - List airline-initiated changes
- `PATCH /api/duffel/airline-initiated-changes/:id` - Update change response
- `POST /api/duffel/airline-initiated-changes/:id/accept` - Accept change

## Implementation Details

### Hybrid Caching Strategy

The enhanced integration uses a hybrid caching approach:

1. **Primary Source**: Duffel API responses
2. **Fallback Source**: Local database cache
3. **Write Strategy**: Asynchronous database writes with timeout handling

```typescript
async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
): Promise<T | null> {
  return Promise.race([
    promise,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs)),
  ]);
}
```

### Database Integration

All API responses are automatically cached in the local database:

```typescript
// Example: Storing partial offer request
let partialRequest: { id?: string } | null = null;
try {
  partialRequest = await withTimeout(
    prisma.duffelPartialOfferRequest.create({
      data: {
        externalId: requestId,
        slices: slices,
        passengers: passengers,
        cabinClass: cabin_class,
        status: "pending",
      },
    }),
    DB_WRITE_TIMEOUT_MS,
  );
} catch (dbError: any) {
  console.warn(
    "[Duffel] Partial offer request local persistence skipped:",
    dbError?.message || dbError,
  );
}
```

### Error Handling

Comprehensive error handling with fallback mechanisms:

```typescript
// Try Duffel API first
try {
  const duffelResponse = await duffelClient.request({
    method: "GET",
    url: `/air/partial_offer_requests/${id}`,
  });

  // Store/update in database
  await prisma.duffelPartialOfferRequest.upsert({
    where: { externalId: String(id) },
    update: { /* update data */ },
    create: { /* create data */ },
  });

  return res.json({
    success: true,
    data: duffelResponse.data,
  });
} catch (duffelError) {
  // Fallback to database
  const partialRequest = await prisma.duffelPartialOfferRequest.findUnique({
    where: { externalId: String(id) },
    include: { partialOfferFares: true },
  });

  if (partialRequest) {
    return res.json({
      success: true,
      data: partialRequest,
    });
  }

  return res.status(404).json({ error: "Partial offer request not found" });
}
```

## Usage Examples

### Creating a Partial Offer Request

```javascript
const response = await fetch('/api/duffel/partial-offer-requests', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    slices: [
      {
        origin: 'LON',
        destination: 'NYC',
        departure_date: '2024-12-01'
      }
    ],
    passengers: [
      {
        type: 'adult',
        age: 30
      }
    ],
    cabin_class: 'economy',
    return_available_services: true
  })
});

const result = await response.json();
console.log('Partial offer request created:', result.data.id);
```

### Creating a Batch Offer Request

```javascript
const response = await fetch('/api/duffel/batch-offer-requests', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    requests: [
      {
        slices: [
          {
            origin: 'LON',
            destination: 'NYC',
            departure_date: '2024-12-01'
          }
        ],
        passengers: [{ type: 'adult', age: 30 }],
        cabin_class: 'economy'
      },
      {
        slices: [
          {
            origin: 'NYC',
            destination: 'LON',
            departure_date: '2024-12-05'
          }
        ],
        passengers: [{ type: 'adult', age: 30 }],
        cabin_class: 'economy'
      }
    ]
  })
});

const result = await response.json();
console.log('Batch offer request created:', result.data.id);
```

### Managing Order Changes

```javascript
// Create order change request
const changeResponse = await fetch('/api/duffel/order-change-requests', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    order_id: 'ord_123',
    slices: [
      {
        origin: 'LON',
        destination: 'NYC',
        departure_date: '2024-12-02' // Changed date
      }
    ]
  })
});

const changeResult = await changeResponse.json();
console.log('Order change request created:', changeResult.data.id);

// Confirm the change
const confirmResponse = await fetch('/api/duffel/order-changes/confirm', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    order_change_id: changeResult.data.id
  })
});

const confirmResult = await confirmResponse.json();
console.log('Order change confirmed:', confirmResult.data);
```

## Testing

### Running Tests

```bash
# Run the enhanced Duffel API tests
cd services/booking-service
npx tsx src/test-duffel-enhanced.ts
```

### Test Coverage

The test suite covers:

- ✅ Database integration
- ✅ Partial offer requests
- ✅ Batch offer requests
- ✅ Order changes
- ✅ Airline credits
- ✅ Services management
- ✅ Enhanced payments

## Migration Guide

### Database Migration

The enhanced integration requires database migrations:

```bash
# Run the migration
cd /Users/mohamedrizwan/Desktop/TripAlfa\ -\ Node
DIRECT_DATABASE_URL="postgresql://neondb_owner:npg_qap6zc2PlrKY@ep-gentle-fog-aio9hd7e-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require" npx prisma migrate dev --name add_duffel_enhanced_models
```

### Service Updates

1. **Update Booking Service**: Add enhanced routes to `src/index.ts`
2. **Update Prisma Client**: Regenerate with `npx prisma generate`
3. **Restart Services**: Restart booking service to load new routes

## Monitoring and Observability

### Logging

All enhanced endpoints include comprehensive logging:

```typescript
console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
```

### Error Tracking

Errors are logged with context:

```typescript
console.error("[Duffel] Create partial offer request error:", error.message);
```

### Performance Monitoring

Database write operations include timeout handling:

```typescript
const DB_WRITE_TIMEOUT_MS = 1500;
```

## Security Considerations

### API Key Management

Duffel API keys are loaded from environment variables or secure files:

```typescript
function resolveDuffelApiKey() {
  const envKey = normalizeToken(
    process.env.DUFFEL_API_KEY || process.env.DUFFEL_TEST_TOKEN,
  );
  if (envKey) {
    return envKey;
  }

  const keyPath = resolve(rootDir, "secrets", "duffel_api_key.txt");
  if (fs.existsSync(keyPath)) {
    const fileKey = normalizeToken(fs.readFileSync(keyPath, "utf8"));
    if (fileKey) {
      return fileKey;
    }
  }

  return "";
}
```

### Input Validation

All endpoints include input validation:

```typescript
if (!slices || !Array.isArray(slices) || slices.length === 0) {
  return res.status(400).json({ error: "slices is required" });
}
```

## Future Enhancements

### Planned Features

1. **Real-time Updates**: WebSocket integration for live flight updates
2. **Advanced Analytics**: Enhanced reporting and analytics
3. **Multi-currency Support**: Improved currency handling
4. **Rate Limiting**: API rate limiting and throttling
5. **Caching Optimization**: Redis-based caching for better performance

### Integration Opportunities

1. **Mobile App**: Native mobile app integration
2. **Corporate Portal**: Enhanced corporate booking features
3. **API Gateway**: Integration with API gateway for better management
4. **Microservices**: Further microservice decomposition

## Support and Maintenance

### Monitoring

- Monitor API response times and error rates
- Track database write success rates
- Monitor cache hit/miss ratios

### Maintenance

- Regularly update Duffel API client
- Monitor for breaking changes in Duffel API
- Update database schema as needed
- Review and optimize performance

### Troubleshooting

Common issues and solutions:

1. **API Timeouts**: Check network connectivity and Duffel API status
2. **Database Errors**: Verify database connection and schema
3. **Authentication Issues**: Check API key configuration
4. **Caching Issues**: Clear cache and restart services

## Conclusion

The enhanced Duffel Flight API integration provides a robust, scalable foundation for advanced flight booking capabilities. With comprehensive error handling, hybrid caching, and extensive testing, this integration ensures reliable operation and excellent user experience.

For questions or support, please refer to the TripAlfa development documentation or contact the development team.