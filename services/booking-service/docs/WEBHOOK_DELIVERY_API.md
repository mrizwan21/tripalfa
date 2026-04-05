# Webhook Delivery Management API

## Overview

The Webhook Delivery Management API provides a robust, production-ready backend service for managing webhook deliveries. It implements a comprehensive suite of features based on Duffel API specifications and endpoints, with support for receiving, forwarding, tracking, and monitoring webhook deliveries to customer endpoints.

## Key Features

1. **Endpoint Implementation**: Complete REST API for managing webhook deliveries
2. **Data Persistence**: Comprehensive data model with relational database storage
3. **Ingestion & Processing**: Secure internal endpoint for receiving webhooks with HMAC validation
4. **Asynchronous Delivery**: Retry-enabled job system with exponential backoff
5. **Monitoring & Observability**: Built-in logging, metrics, and delivery statistics
6. **Resilience & Scalability**: Designed for high volumes with retry mechanisms and efficient queries

## API Endpoints

### 1. List Webhook Deliveries

**GET** `/api/webhook-deliveries`

Retrieve a paginated list of all webhook delivery attempts with filtering capabilities.

**Query Parameters:**

- `page` (optional, default: 1) - Page number for pagination
- `limit` (optional, default: 50, max: 100) - Number of items per page
- `provider` (optional) - Filter by provider (duffel, liteapi, internal, stripe, other)
- `eventType` (optional) - Filter by event type
- `status` (optional) - Filter by status (PENDING, DELIVERING, DELIVERED, FAILED, RETRYING, DEAD_LETTER)
- `customerId` (optional) - Filter by customer ID
- `subscriptionId` (optional) - Filter by subscription ID
- `fromDate` (optional) - Filter by creation date (ISO 8601)
- `toDate` (optional) - Filter by creation date (ISO 8601)

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "clxyz...",
      "provider": "duffel",
      "eventType": "order.created",
      "endpointUrl": "https://customer.example.com/webhooks",
      "status": "DELIVERED",
      "attemptCount": 1,
      "maxRetries": 5,
      "responseStatusCode": 200,
      "deliveredAt": "2026-03-23T19:30:00.000Z",
      "createdAt": "2026-03-23T19:29:45.000Z",
      "updatedAt": "2026-03-23T19:30:00.000Z"
    }
  ],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 50,
    "totalPages": 3
  }
}
```

### 2. Get Webhook Delivery Schema

**GET** `/api/webhook-deliveries/schema`

Serve the JSON schema describing the structure of a webhook delivery object.

**Response:**

```json
{
  "success": true,
  "data": {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "title": "Webhook Delivery",
    "description": "Schema for webhook delivery tracking object",
    "type": "object",
    "properties": {
      "id": { "type": "string" },
      "provider": {
        "type": "string",
        "enum": ["duffel", "liteapi", "internal", "stripe", "other"]
      },
      "eventType": { "type": "string" }
      // ... full schema
    }
  }
}
```

### 3. Get Specific Webhook Delivery

**GET** `/api/webhook-deliveries/{id}`

Fetch the detailed record, including payload and response data, for a specific webhook delivery by its unique ID.

**Path Parameters:**

- `id` (required) - Webhook delivery ID

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "clxyz...",
    "provider": "duffel",
    "eventType": "order.created",
    "payload": { "order_id": "ord_123", "status": "confirmed" },
    "signature": "sha256=...",
    "verificationStatus": "verified",
    "endpointUrl": "https://customer.example.com/webhooks",
    "status": "DELIVERED",
    "attemptCount": 1,
    "maxRetries": 5,
    "responseStatusCode": 200,
    "responseBody": "OK",
    "responseHeaders": { "content-type": "application/json" },
    "deliveredAt": "2026-03-23T19:30:00.000Z",
    "createdAt": "2026-03-23T19:29:45.000Z",
    "updatedAt": "2026-03-23T19:30:00.000Z"
  }
}
```

### 4. Get Delivery Statistics

**GET** `/api/webhook-deliveries/statistics`

Get delivery statistics within a specified time range.

**Query Parameters:**

- `timeRangeHours` (optional, default: 24, max: 720) - Time range in hours for statistics

**Response:**

```json
{
  "success": true,
  "data": {
    "timeRange": {
      "from": "2026-03-22T19:44:00.000Z",
      "to": "2026-03-23T19:44:00.000Z",
      "hours": 24
    },
    "total": 1250,
    "byStatus": {
      "DELIVERED": 1150,
      "FAILED": 80,
      "PENDING": 10,
      "RETRYING": 10
    },
    "byProvider": {
      "duffel": 800,
      "liteapi": 400,
      "internal": 50
    },
    "successRate": 0.92
  }
}
```

### 5. Retry Failed Delivery

**POST** `/api/webhook-deliveries/{id}/retry`

Manually trigger a retry for a failed webhook delivery.

**Path Parameters:**

- `id` (required) - Webhook delivery ID

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "clxyz...",
    "retryInitiated": true,
    "success": true,
    "message": "Retry initiated successfully"
  }
}
```

### 6. Internal Webhook Ingestion

**POST** `/api/internal/webhooks`

Secure internal endpoint to receive incoming webhook events from Duffel or other providers. This endpoint validates the incoming request using HMAC signature, parses the payload, creates a delivery record, and initiates asynchronous delivery to the customer endpoint.

**Request Body:**

```json
{
  "provider": "duffel",
  "eventType": "order.created",
  "payload": { "order_id": "ord_123", "status": "confirmed" },
  "signature": "sha256=...",
  "endpointUrl": "https://customer.example.com/webhooks",
  "customerId": "cust_123",
  "subscriptionId": "sub_123",
  "maxRetries": 5
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "clxyz...",
    "provider": "duffel",
    "eventType": "order.created",
    "status": "PENDING",
    "attemptCount": 0,
    "maxRetries": 5,
    "createdAt": "2026-03-23T19:44:00.000Z",
    "updatedAt": "2026-03-23T19:44:00.000Z"
  },
  "message": "Webhook accepted for processing"
}
```

### 7. Process Pending Retries (Admin)

**POST** `/api/internal/webhooks/process-pending-retries`

Manually trigger processing of pending retries (typically called by a scheduled job).

**Query Parameters:**

- `limit` (optional, default: 100, max: 1000) - Maximum number of pending retries to process

**Response:**

```json
{
  "success": true,
  "data": {
    "processed": 100,
    "successful": 85,
    "message": "Processed 85 of 100 pending retries successfully"
  }
}
```

## Data Model

### Webhook Delivery Table (`webhook_delivery`)

| Field              | Type                | Description                                                   |
| ------------------ | ------------------- | ------------------------------------------------------------- |
| id                 | String (CUID)       | Unique identifier                                             |
| provider           | String              | Source provider (duffel, liteapi, internal, etc.)             |
| eventType          | String              | Event type (e.g., "order.created")                            |
| webhookId          | String (optional)   | ID from source system                                         |
| payload            | JSON (optional)     | Original webhook payload                                      |
| signature          | String (optional)   | HMAC signature for verification                               |
| verificationStatus | String (optional)   | "verified", "invalid", or "skipped"                           |
| endpointUrl        | String              | Target endpoint URL for delivery                              |
| customerId         | String (optional)   | Associated customer/tenant ID                                 |
| subscriptionId     | String (optional)   | Webhook subscription ID                                       |
| status             | Enum                | PENDING, DELIVERING, DELIVERED, FAILED, RETRYING, DEAD_LETTER |
| attemptCount       | Integer             | Number of delivery attempts made                              |
| maxRetries         | Integer             | Maximum number of retry attempts                              |
| nextRetryAt        | DateTime (optional) | When the next retry will be attempted                         |
| responseStatusCode | Integer (optional)  | HTTP status code from target endpoint                         |
| responseBody       | Text (optional)     | Response body from target endpoint                            |
| responseHeaders    | JSON (optional)     | Response headers from target endpoint                         |
| deliveredAt        | DateTime (optional) | When delivery was successfully completed                      |
| lastError          | Text (optional)     | Last error message                                            |
| errorCode          | String (optional)   | Error code for classification                                 |
| createdAt          | DateTime            | When the delivery record was created                          |
| updatedAt          | DateTime            | When the delivery record was last updated                     |

## Delivery Flow

1. **Ingestion**: Webhook received via `POST /api/internal/webhooks`
2. **Validation**: HMAC signature verified (if provided)
3. **Record Creation**: Delivery record created with status `PENDING`
4. **Async Delivery**: Immediate attempt to forward to customer endpoint
5. **Retry Logic**: Exponential backoff with jitter for failed deliveries
6. **Status Update**: Record updated with response details
7. **Monitoring**: Events logged and metrics updated

## Retry Mechanism

The system implements exponential backoff with jitter for retries:

- Base delay: `2^attemptCount` seconds
- Jitter: Random value up to 1 second
- Maximum delay: 30 seconds
- Default max retries: 5

Example retry schedule:

- Attempt 1: Immediate
- Attempt 2: 2-3 seconds
- Attempt 3: 4-5 seconds
- Attempt 4: 8-9 seconds
- Attempt 5: 16-17 seconds

## Monitoring & Observability

### Built-in Monitoring

- **Logging**: Structured logging for all delivery events
- **Metrics**: Real-time delivery statistics and success rates
- **Event Buffer**: In-memory buffer of recent events for debugging
- **Health Checks**: Endpoint availability monitoring

### Integration Points

- **Error Handler**: Integrated with centralized error handling
- **Logger**: Uses shared logging infrastructure
- **Database**: Ops database for operational data

## Security

### Signature Verification

- HMAC-SHA256 signature verification for webhook authenticity
- Configurable secret via `WEBHOOK_SECRET` environment variable
- Support for skipping verification in development

### Input Validation

- Request body validation for all endpoints
- URL format validation for endpoint URLs
- Enum validation for providers and statuses

## Configuration

### Environment Variables

```bash
# Required for production
WEBHOOK_SECRET=your_shared_secret_for_hmac

# Optional
ENABLE_WEBHOOK_SIGNATURE_VERIFICATION=true
WEBHOOK_MAX_RETRIES=5
WEBHOOK_RETRY_BASE_DELAY_MS=1000
```

### Service Configuration

- Default max retries: 5
- Request timeout: 10 seconds
- Maximum response body size: 5000 characters
- Event buffer size: 1000 events

## Integration with Existing Webhook System

The new webhook delivery system complements the existing webhook handling in `services/booking-service/src/routes/webhooks.ts`:

- **Existing System**: Receives webhooks from Duffel/LITEAPI, processes them internally
- **New System**: Forwards webhooks to external customer endpoints with delivery tracking

For backward compatibility, the existing webhook routes remain unchanged. The new system can be used for:

1. Forwarding Duffel webhooks to customer systems
2. Managing webhook subscriptions for B2B customers
3. Providing delivery guarantees with retry logic

## Usage Examples

### 1. Forwarding Duffel Webhooks to Customer

```javascript
// When receiving a Duffel webhook
const response = await fetch('http://localhost:3002/api/internal/webhooks', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    provider: 'duffel',
    eventType: 'order.created',
    payload: duffelWebhookPayload,
    signature: duffelSignature,
    endpointUrl: 'https://customer-system.com/webhooks/duffel',
    customerId: 'cust_123',
    maxRetries: 3,
  }),
});
```

### 2. Monitoring Delivery Status

```bash
# Get recent deliveries
curl "http://localhost:3002/api/webhook-deliveries?provider=duffel&status=FAILED"

# Get delivery statistics
curl "http://localhost:3002/api/webhook-deliveries/statistics?timeRangeHours=48"

# Get specific delivery details
curl "http://localhost:3002/api/webhook-deliveries/clxyz123"
```

### 3. Manual Retry

```bash
curl -X POST "http://localhost:3002/api/webhook-deliveries/clxyz123/retry"
```

## Error Handling

The API returns standardized error responses:

```json
{
  "success": false,
  "error": {
    "code": "INVALID_FORMAT",
    "message": "Invalid endpoint URL format",
    "details": { "endpointUrl": "invalid-url" },
    "timestamp": "2026-03-23T19:44:00.000Z"
  }
}
```

Common error codes:

- `INVALID_FORMAT`: Invalid request data
- `NOT_FOUND`: Resource not found
- `INVALID_STATE`: Invalid operation for current state
- `VALIDATION_ERROR`: Request validation failed
- `INTERNAL_ERROR`: Server error

## Testing

### Manual Testing

```bash
# Test internal webhook ingestion
curl -X POST "http://localhost:3002/api/internal/webhooks" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "duffel",
    "eventType": "order.created",
    "payload": {"test": true},
    "endpointUrl": "https://httpbin.org/post"
  }'

# Test pending retries processing
curl -X POST "http://localhost:3002/api/internal/webhooks/process-pending-retries?limit=10"
```

### Automated Testing

Unit tests should cover:

- Signature verification
- Retry logic with exponential backoff
- Database operations
- API endpoint validation
- Error handling scenarios

## Deployment Considerations

1. **Database Migration**: Run Prisma migration to create `webhook_delivery` table
2. **Environment Variables**: Configure `WEBHOOK_SECRET` in production
3. **Monitoring Setup**: Integrate with existing monitoring infrastructure
4. **Scheduled Jobs**: Set up cron job for processing pending retries
5. **Scaling**: Service designed for horizontal scaling with async processing

## Future Enhancements

1. **Webhook Subscription Management**: CRUD endpoints for customer webhook subscriptions
2. **Rate Limiting**: Per-customer rate limiting for webhook delivery
3. **Dead Letter Queue**: Advanced DLQ management with manual intervention
4. **Webhook Testing**: Test endpoint for customers to verify their webhook receivers
5. **Delivery Guarantees**: At-least-once or exactly-once delivery semantics
6. **Analytics Dashboard**: Visual dashboard for delivery metrics and trends
