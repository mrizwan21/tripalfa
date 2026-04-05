# Duffel Order Cancellations API

A robust, production-ready backend service for handling flight order cancellations using the Duffel API (version 2).

## Overview

This service provides a complete implementation of Duffel's Order Cancellations API with enhanced features:

- **Schema Integration**: Full validation against official Duffel API schemas
- **Core Operations**: All essential endpoints with pagination, caching, and retry logic
- **Production Ready**: Comprehensive error handling, logging, monitoring, and security

## Architecture

```
┌─────────────────┐    ┌─────────────────────┐    ┌─────────────────┐
│   API Gateway   │───▶│   Controller Layer  │───▶│  Service Layer  │
└─────────────────┘    └─────────────────────┘    └─────────────────┘
                                                           │
                                                           ▼
┌─────────────────┐    ┌─────────────────────┐    ┌─────────────────┐
│   Redis Cache   │◀───│   Repository Layer  │◀───│   Duffel API    │
└─────────────────┘    └─────────────────────┘    └─────────────────┘
```

## Prerequisites

- Node.js 18+ or 20+
- PostgreSQL database
- Redis (for caching)
- Duffel API credentials

## Installation

1. **Clone the repository** (if not already done)

   ```bash
   git clone <repository-url>
   cd services/booking-service
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the service root:

   ```env
   # Database
   DATABASE_URL="postgresql://user:password@localhost:5432/tripalfa_core"

   # Redis
   REDIS_URL="redis://localhost:6379"

   # Duffel API
   DUFFEL_API_KEY="duffel_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
   DUFFEL_BASE_URL="https://api.duffel.com"
   DUFFEL_VERSION="v2"

   # Service Configuration
   PORT=3001
   NODE_ENV="development"
   LOG_LEVEL="info"

   # Security
   API_KEY_SECRET="your-secret-key-here"
   JWT_SECRET="your-jwt-secret-here"
   ```

4. **Set up database schema**
   The service requires the following Prisma model. Add to your `schema.prisma`:

   ```prisma
   model DuffelOrderCancellation {
     id           String   @id @default(cuid())
     externalId   String   @unique // Duffel API cancellation ID (ore_*)
     orderId      String   // Duffel order ID (ord_*)
     userId       String?  // Internal user ID

     status       String   // pending, confirmed, failed, expired
     refundAmount Float?
     refundCurrency String?
     refundTo     String?  // original_form_of_payment, airline_credits, voucher

     // JSON fields for complex data
     airlineCredits Json?
     voucher        Json?
     metadata       Json?

     // Timestamps
     expiresAt    DateTime?
     confirmedAt  DateTime?
     failedAt     DateTime?
     failureReason String?

     createdAt    DateTime @default(now())
     updatedAt    DateTime @updatedAt

     // Indexes
     @@index([orderId])
     @@index([userId])
     @@index([status])
     @@index([createdAt])
   }
   ```

5. **Run database migrations**

   ```bash
   pnpm prisma migrate dev
   ```

6. **Start the service**
   ```bash
   pnpm run dev
   ```

## API Endpoints

### 1. Create Order Cancellation

**POST** `/api/duffel/order-cancellations`

Creates a new order cancellation request (unconfirmed quote).

**Request Body:**

```json
{
  "order_id": "ord_1234567890abcdef",
  "refund_to": "original_form_of_payment",
  "airline_credits": {
    "airline_iata_code": "AA",
    "credit_amount": "150.00",
    "credit_currency": "USD",
    "credit_expires_at": "2024-12-31T23:59:59Z",
    "passenger_id": "pas_1234567890abcdef",
    "ticket_number": "001234567890"
  },
  "metadata": {
    "reason": "Customer requested cancellation",
    "cancelled_by": "user_123"
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "ore_1234567890abcdef",
    "order_id": "ord_1234567890abcdef",
    "status": "pending",
    "refund_amount": "150.00",
    "refund_currency": "USD",
    "refund_to": "original_form_of_payment",
    "expires_at": "2024-03-24T16:45:34Z",
    "created_at": "2024-03-23T16:45:34Z",
    "updated_at": "2024-03-23T16:45:34Z"
  },
  "message": "Cancellation quote created. Please confirm to proceed with cancellation.",
  "cached": false,
  "source": "api"
}
```

### 2. Get Order Cancellation by ID

**GET** `/api/duffel/order-cancellations/:id`

Retrieves detailed information for a specific order cancellation.

**Parameters:**

- `id` (path): Duffel cancellation ID (e.g., `ore_1234567890abcdef`)

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "ore_1234567890abcdef",
    "order_id": "ord_1234567890abcdef",
    "status": "pending",
    "refund_amount": "150.00",
    "refund_currency": "USD",
    "refund_to": "original_form_of_payment",
    "expires_at": "2024-03-24T16:45:34Z",
    "created_at": "2024-03-23T16:45:34Z",
    "updated_at": "2024-03-23T16:45:34Z"
  },
  "cached": true,
  "source": "redis"
}
```

### 3. List Order Cancellations

**GET** `/api/duffel/order-cancellations`

Retrieves a paginated list of all order cancellations with filtering options.

**Query Parameters:**

- `limit` (optional): Number of results per page (default: 50, max: 100)
- `offset` (optional): Pagination offset (default: 0)
- `status` (optional): Filter by status (`pending`, `confirmed`, `failed`, `expired`)
- `order_id` (optional): Filter by order ID
- `user_id` (optional): Filter by user ID

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "ore_1234567890abcdef",
      "order_id": "ord_1234567890abcdef",
      "status": "confirmed",
      "refund_amount": "150.00",
      "refund_currency": "USD",
      "refund_to": "original_form_of_payment",
      "confirmed_at": "2024-03-23T16:46:00Z",
      "created_at": "2024-03-23T16:45:34Z",
      "updated_at": "2024-03-23T16:46:00Z"
    }
  ],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "total": 1,
    "hasMore": false
  }
}
```

### 4. Confirm Order Cancellation

**POST** `/api/duffel/order-cancellations/:id/confirm`

Confirms a previously requested order cancellation.

**Parameters:**

- `id` (path): Duffel cancellation ID (e.g., `ore_1234567890abcdef`)

**Request Body:**

```json
{
  "metadata": {
    "confirmed_by": "user_123",
    "confirmation_reason": "Customer confirmed cancellation"
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "ore_1234567890abcdef",
    "order_id": "ord_1234567890abcdef",
    "status": "confirmed",
    "refund_amount": "150.00",
    "refund_currency": "USD",
    "refund_to": "original_form_of_payment",
    "confirmed_at": "2024-03-23T16:46:00Z",
    "created_at": "2024-03-23T16:45:34Z",
    "updated_at": "2024-03-23T16:46:00Z"
  },
  "message": "Cancellation confirmed successfully. Refund will be processed shortly."
}
```

## Error Handling

The API returns standardized error responses:

### Validation Error (400)

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed for order_id: Expected pattern /^ord_[a-zA-Z0-9]+$/, got invalid_id",
    "timestamp": "2024-03-23T16:45:34Z",
    "retryable": false,
    "details": {
      "field": "order_id",
      "value": "invalid_id"
    }
  }
}
```

### Authentication Error (401)

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Duffel API authentication failed: Invalid API key",
    "timestamp": "2024-03-23T16:45:34Z",
    "retryable": false
  }
}
```

### Resource Not Found (404)

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Order cancellation not found: ore_1234567890abcdef",
    "timestamp": "2024-03-23T16:45:34Z",
    "retryable": false
  }
}
```

### Rate Limit Exceeded (429)

```json
{
  "success": false,
  "error": {
    "code": "EXTERNAL_API_ERROR",
    "message": "Duffel API rate limit exceeded: Too many requests",
    "timestamp": "2024-03-23T16:45:34Z",
    "retryable": true,
    "retryAfter": 60
  }
}
```

### Server Error (500)

```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Internal server error",
    "timestamp": "2024-03-23T16:45:34Z",
    "retryable": true
  }
}
```

## Caching Strategy

The service implements a hybrid caching strategy:

1. **Redis Cache**: Fast in-memory responses for frequent queries (TTL: 5 minutes)
2. **Database Cache**: Persistent storage for all cancellations
3. **Cache Invalidation**: Automatic invalidation on updates

Cache keys follow the pattern: `duffel:cancellation:{id}`

## Retry Logic

The service includes automatic retry logic for transient failures:

- **Max Retries**: 3 attempts
- **Backoff Strategy**: Exponential (1s, 2s, 4s)
- **Retry Conditions**: Network errors, 5xx status codes, 429 (Too Many Requests)
- **Non-Retryable**: 4xx client errors (except 429)

## Monitoring & Logging

### Metrics Collected

- Total cancellations processed
- Success/failure rates
- Average processing time
- Refund amounts by currency
- Airline credits vs voucher usage

### Log Levels

- `INFO`: Successful operations, creation/confirmation events
- `WARN`: Expired cancellations, rate limiting
- `ERROR`: Failed operations, API errors
- `DEBUG`: Performance metrics, cache hits/misses

### Health Checks

```bash
GET /health/cancellations
```

Returns service health including:

- Duffel API connectivity
- Database connectivity
- Redis cache status
- Recent error rates

## Security Considerations

1. **API Key Management**: Duffel API keys stored in environment variables
2. **Input Validation**: All inputs validated and sanitized
3. **Rate Limiting**: Implemented at service level
4. **SQL Injection Prevention**: Parameterized queries via Prisma
5. **XSS Prevention**: Input sanitization for all string fields
6. **Data Encryption**: Sensitive data encrypted at rest

## Testing

### Unit Tests

```bash
pnpm test -- --testPathPattern=order-cancellation
```

### Integration Tests

```bash
pnpm test:api -- --testNamePattern="order cancellation"
```

### Manual Testing with cURL

```bash
# Create cancellation
curl -X POST http://localhost:3001/api/duffel/order-cancellations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -d '{"order_id": "ord_1234567890abcdef"}'

# Get cancellation
curl -X GET http://localhost:3001/api/duffel/order-cancellations/ore_1234567890abcdef \
  -H "Authorization: Bearer your-api-key"

# List cancellations
curl -X GET "http://localhost:3001/api/duffel/order-cancellations?limit=10&status=pending" \
  -H "Authorization: Bearer your-api-key"

# Confirm cancellation
curl -X POST http://localhost:3001/api/duffel/order-cancellations/ore_1234567890abcdef/confirm \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -d '{"metadata": {"confirmed_by": "test_user"}}'
```

## Deployment

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["node", "dist/index.js"]
```

### Environment Variables for Production

```env
NODE_ENV=production
LOG_LEVEL=warn
DUFFEL_API_KEY=duffel_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
REDIS_URL=redis://redis-host:6379
DATABASE_URL=postgresql://user:password@db-host:5432/production_db
```

## Troubleshooting

### Common Issues

1. **Duffel API Authentication Failed**
   - Verify `DUFFEL_API_KEY` is set correctly
   - Check API key expiration
   - Ensure proper Duffel-Version header

2. **Database Connection Issues**
   - Verify `DATABASE_URL` format
   - Check PostgreSQL is running
   - Verify user permissions

3. **Redis Cache Not Working**
   - Check `REDIS_URL` configuration
   - Verify Redis server is running
   - Check network connectivity

4. **High Error Rates**
   - Check Duffel API status page
   - Review service logs for patterns
   - Verify rate limits not exceeded

### Log Analysis

```bash
# View recent errors
grep "ERROR" logs/booking-service.log | tail -20

# Monitor cancellation events
grep "cancellation_" logs/booking-service.log | tail -20

# Check performance
grep "duration" logs/booking-service.log | tail -10
```

## Support

For issues with this service:

1. Check the logs in `/logs/booking-service.log`
2. Verify environment variables are set correctly
3. Check Duffel API status at https://status.duffel.com
4. Contact the development team with error details and request IDs

## License

[Your License Here]
