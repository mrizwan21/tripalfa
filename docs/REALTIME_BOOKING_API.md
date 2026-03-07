# Real-Time Hotel Booking API (LiteAPI Integration)

**Status**: ✅ Implemented  
**Database**: NEON (PostgreSQL Cloud)  
**Cache**: Redis  
**Last Updated**: April 3, 2026

## Overview

The Real-Time Booking API implements the complete LiteAPI hotel booking flow according to the official LiteAPI documentation: <https://docs.liteapi.travel/docs/booking-a-room>

This API enables end-to-end hotel booking with real-time rate locking, payment processing, and booking management directly integrated with NEON database for persistent storage.

## Booking Flow

```
Guest selects hotel
        ↓
    [1] Prebook (Hold rate) → Rate locked for 15-60 minutes
        ↓
    Guest enters payment details
        ↓
    [2] Book (Confirm) → Booking confirmed with supplier
        ↓
    Guest receives confirmation
        ↓
    [3] Manage booking (view, amend, cancel)
```

## API Endpoints

### 1. Create Prebook (Hold Booking)

**POST** `/api/realtime-booking/prebook`

Creates a hold booking and locks the room rate for a specified duration.

#### Request Body

```json
{
  "offerId": "string",
  "hotelId": "string",
  "roomTypeId": "string",
  "price": 250.00,
  "currency": "USD",
  "checkInDate": "2026-04-10",
  "checkOutDate": "2026-04-13",
  "guests": [
    {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "occupancyNumber": 1
    }
  ],
  "userId": "user-123",
  "hotelName": "Grand Hotel Paris",
  "roomType": "Deluxe Double",
  "adults": 2,
  "children": [5, 10]
}
```

#### Response

```json
{
  "success": true,
  "data": {
    "bookingId": "BK-1712180000-abc123",
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "transactionId": "LITEAPI_TXN_123456",
    "status": "prebooked",
    "expiresAt": "2026-04-03T14:30:00Z",
    "hotel": {
      "id": "hotel-123",
      "name": "Grand Hotel Paris",
      "roomType": "Deluxe Double"
    },
    "dates": {
      "checkIn": "2026-04-10",
      "checkOut": "2026-04-13"
    },
    "nights": 3,
    "price": {
      "amount": 250.00,
      "currency": "USD"
    },
    "guests": [...],
    "validationWarnings": [],
    "message": "Booking hold created successfully. Rate is now locked."
  }
}
```

#### Status Codes

- `201 Created` - Prebook session created successfully
- `400 Bad Request` - Invalid input or date validation error
- `500 Internal Server Error` - Server error

#### Notes

- Prebook sessions are cached in Redis with TTL of 60 minutes
- Booking record is created in NEON immediately
- If LiteAPI unavailable, fallback mode creates local booking
- Price changes and cancellation policy updates trigger warnings

---

### 2. Complete Booking

**POST** `/api/realtime-booking/book`

Completes a prebooked hold and confirms the booking with payment.

#### Request Body

```json
{
  "bookingId": "BK-1712180000-abc123",
  "transactionId": "LITEAPI_TXN_123456",
  "guests": [
    {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "occupancyNumber": 1
    }
  ],
  "holder": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "+1234567890"
  },
  "paymentMethod": "WALLET",
  "paymentDetails": {
    "method": "WALLET"
  }
}
```

#### Response

```json
{
  "success": true,
  "data": {
    "bookingId": "BK-1712180000-abc123",
    "bookingRef": "LITEAPI_CONF_789012",
    "status": "confirmed",
    "hotel": {
      "name": "Grand Hotel Paris",
      "roomType": "Deluxe Double"
    },
    "dates": {
      "checkIn": "2026-04-10",
      "checkOut": "2026-04-13",
      "nights": 3
    },
    "price": {
      "amount": 250.00,
      "currency": "USD"
    },
    "confirmation": { /* LiteAPI confirmation data */ },
    "message": "Booking confirmed successfully!"
  }
}
```

#### Payment Methods

| Method | Code | Description |
|--------|------|-------------|
| Wallet | `WALLET` | Customer's wallet balance |
| Credit Card | `ACC_CREDIT_CARD` | Direct credit card payment |
| Transaction | `TRANSACTION` | Payment SDK transaction |

#### Status Codes

- `200 OK` - Booking confirmed successfully
- `400 Bad Request` - Invalid request or LiteAPI error
- `404 Not Found` - Booking not found
- `409 Conflict` - Booking already confirmed
- `500 Internal Server Error` - Server error

---

### 3. Get Booking Details

**GET** `/api/realtime-booking/bookings/:bookingId`

Retrieves complete booking details including supplier status.

#### Response

```json
{
  "success": true,
  "data": {
    "bookingId": "BK-1712180000-abc123",
    "bookingRef": "LITEAPI_CONF_789012",
    "status": "confirmed",
    "hotel": {
      "id": "hotel-123",
      "name": "Grand Hotel Paris",
      "roomType": "Deluxe Double"
    },
    "dates": {
      "checkIn": "2026-04-10",
      "checkOut": "2026-04-13",
      "nights": 3
    },
    "guest": {
      "email": "john@example.com"
    },
    "price": {
      "amount": 250.00,
      "currency": "USD"
    },
    "createdAt": "2026-04-03T13:30:00Z",
    "updatedAt": "2026-04-03T13:45:00Z",
    "supplierStatus": { /* LiteAPI booking status */ },
    "metadata": {
      "holder": { /* Holder information */ },
      "paymentMethod": "WALLET",
      "confirmationId": "LITEAPI_CONF_789012"
    }
  }
}
```

#### Status Codes

- `200 OK` - Booking found
- `404 Not Found` - Booking not found
- `500 Internal Server Error` - Server error

---

### 4. List User Bookings

**GET** `/api/realtime-booking/bookings`

Lists all hotel bookings for a user with filtering and pagination.

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userId` | string | ✅ | User ID |
| `status` | string | ❌ | Filter by status (pending, confirmed, cancelled) |
| `limit` | number | ❌ | Results per page (default: 20) |
| `offset` | number | ❌ | Pagination offset (default: 0) |
| `fromDate` | string | ❌ | Filter from date (ISO 8601) |
| `toDate` | string | ❌ | Filter to date (ISO 8601) |

#### Response

```json
{
  "success": true,
  "data": {
    "bookings": [
      {
        "bookingId": "BK-1712180000-abc123",
        "bookingRef": "LITEAPI_CONF_789012",
        "status": "confirmed",
        "hotel": {
          "name": "Grand Hotel Paris",
          "roomType": "Deluxe Double"
        },
        "dates": {
          "checkIn": "2026-04-10",
          "checkOut": "2026-04-13"
        },
        "price": {
          "amount": 250.00,
          "currency": "USD"
        },
        "createdAt": "2026-04-03T13:30:00Z"
      }
    ],
    "pagination": {
      "total": 5,
      "limit": 20,
      "offset": 0
    }
  }
}
```

---

### 5. Cancel Booking

**DELETE** `/api/realtime-booking/bookings/:bookingId`

Cancels an existing booking and processes refund (if applicable).

#### Request Body

```json
{
  "reason": "Change of plans"
}
```

#### Response

```json
{
  "success": true,
  "data": {
    "bookingId": "BK-1712180000-abc123",
    "bookingRef": "LITEAPI_CONF_789012",
    "status": "cancelled",
    "cancellationReason": "Change of plans",
    "cancellationResult": { /* LiteAPI cancellation response */ },
    "message": "Booking cancelled successfully"
  }
}
```

#### Status Codes

- `200 OK` - Booking cancelled
- `404 Not Found` - Booking not found
- `409 Conflict` - Booking already cancelled
- `500 Internal Server Error` - Server error

---

### 6. Amend Guest Information

**POST** `/api/realtime-booking/bookings/:bookingId/amend`

Updates guest information on an existing booking.

#### Request Body

```json
{
  "firstName": "Jonathan",
  "lastName": "Doe",
  "email": "jonathan@example.com",
  "phone": "+1987654321"
}
```

#### Response

```json
{
  "success": true,
  "data": {
    "bookingId": "BK-1712180000-abc123",
    "amendments": {
      "firstName": "Jonathan",
      "lastName": "Doe",
      "email": "jonathan@example.com",
      "phone": "+1987654321"
    },
    "supplierAmended": true,
    "message": "Guest information updated successfully"
  }
}
```

#### Status Codes

- `200 OK` - Guest information updated
- `404 Not Found` - Booking not found
- `500 Internal Server Error` - Server error

---

## Database Schema (NEON)

### Bookings Table

```sql
CREATE TABLE bookings (
  id VARCHAR(255) PRIMARY KEY,
  userId VARCHAR(255) NOT NULL,
  serviceType VARCHAR(50) NOT NULL DEFAULT 'hotel',
  status VARCHAR(50) NOT NULL,
  bookingRef VARCHAR(255),
  hotelId VARCHAR(255),
  hotelName VARCHAR(255),
  roomType VARCHAR(255),
  checkInDate TIMESTAMP,
  checkOutDate TIMESTAMP,
  baseAmount DECIMAL(12, 2),
  totalAmount DECIMAL(12, 2),
  currency VARCHAR(10) DEFAULT 'USD',
  customerEmail VARCHAR(255),
  metadata JSONB,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_userId (userId),
  INDEX idx_status (status),
  INDEX idx_hotelId (hotelId)
);
```

### Metadata Structure

The `metadata` JSONB column stores:

```json
{
  "sessionId": "UUID",
  "transactionId": "LiteAPI transaction ID",
  "offerId": "Room offer ID",
  "roomTypeId": "Room type ID",
  "guests": [ /* Guest details */ ],
  "adults": 2,
  "children": [5, 10],
  "prebookExpiry": "2026-04-03T14:30:00Z",
  "validationWarnings": [ /* Price/policy changes */ ],
  "creditLine": { /* Wallet credit info */ },
  "paymentTypes": ["WALLET", "ACC_CREDIT_CARD"],
  "holder": { /* Booking holder */ },
  "paymentMethod": "WALLET",
  "confirmationId": "LiteAPI confirmation ID",
  "confirmedAt": "2026-04-03T13:45:00Z",
  "cancellationReason": "User request",
  "cancelledAt": "2026-04-03T14:00:00Z"
}
```

---

## Caching Strategy

### Redis Cache Keys

| Key | TTL | Purpose |
|-----|-----|---------|
| `prebook_session:{transactionId}` | 60 min | Prebook session data |
| `hotel_search:{params}` | 15 min | Hotel search results |
| `hotel_rates:{params}` | 30 min | Room rates |

### Cache Invalidation

- Prebook cache cleared after booking confirmation
- Hotel search cache TTL based on search parameters
- Manual invalidation on booking updates

---

## Error Handling

### Common Errors

#### 400 Bad Request

```json
{
  "success": false,
  "error": "Missing required fields: offerId, price, currency, guests, userId"
}
```

#### 404 Not Found

```json
{
  "success": false,
  "error": "Booking not found"
}
```

#### 409 Conflict

```json
{
  "success": false,
  "error": "Booking is already confirmed"
}
```

#### 500 Internal Server Error

```json
{
  "success": false,
  "error": "Failed to create prebook",
  "details": "Error message from service"
}
```

### Retry Logic

- LiteAPI requests retry on connection timeout
- Fallback mode activates if supplier unavailable
- Client responsible for idempotency via request deduplication

---

## Fallback Mode

If LiteAPI is unavailable, the system operates in fallback mode:

1. **Prebook**: Creates booking locally with `fallback: true` flag
2. **Book**: Confirms locally and syncs when supplier available
3. **Status**: Returns last known state from NEON
4. **Amendments**: Updated locally, synced asynchronously

Response includes `fallback: true` indicator when operating in fallback mode.

---

## Validation Rules

### Date Validation

- Check-in must be at least 1 day in future
- Check-out must be after check-in
- Minimum stay: 1 night

### Guest Validation

- At least one guest required
- Email and name required per guest
- Email format validated

### Price Validation

- Positive amount > 0
- Valid currency code (ISO 4217)

---

## Best Practices

### 1. Session Management

```typescript
// Store transactionId after prebook
const prebookResponse = await POST /api/realtime-booking/prebook
const { transactionId } = prebookResponse.data

// Use transactionId for booking confirmation
const bookResponse = await POST /api/realtime-booking/book {
  transactionId,
  ...
}
```

### 2. Error Handling

```typescript
try {
  const booking = await createPrebook(data)
} catch (error) {
  if (error.status === 400) {
    // Validation error - show user
  } else if (error.status === 500) {
    // Server error - retry or fallback
  }
}
```

### 3. Polling Booking Status

```typescript
// Poll status after booking confirmation
setInterval(async () => {
  const booking = await GET /api/realtime-booking/bookings/:bookingId
  if (booking.data.supplierStatus?.confirmed) {
    stopPolling()
  }
}, 5000) // Poll every 5 seconds
```

### 4. Idempotency

Include idempotency key in request headers:

```
X-Idempotency-Key: UUID
```

Prevents duplicate bookings on retry.

---

## Integration Guide

### Frontend Integration

```typescript
import { realtimeBooking } from '@/lib/api'

// Step 1: Create prebook
const prebook = await realtimeBooking.createPrebook({
  offerId: 'offer_123',
  hotelId: 'hotel_456',
  // ... other fields
})

// Step 2: Complete booking
const booking = await realtimeBooking.book({
  bookingId: prebook.data.bookingId,
  transactionId: prebook.data.transactionId,
  // ... guest & payment details
})

// Step 3: Retrieve booking
const confirmation = await realtimeBooking.getBooking(booking.data.bookingId)
```

### Backend Integration

```typescript
import realtimeBookingRoutes from './routes/realtime-booking.js'

app.use('/api/realtime-booking', realtimeBookingRoutes)
```

---

## Monitoring & Debugging

### Logging

All operations logged with prefix `[RealtimeBooking]`:

```
[RealtimeBooking] /prebook error: Invalid offerId
[RealtimeBooking] LiteAPI prebook error: Rate no longer available
[RealtimeBooking] GET /bookings/:id error: Database connection failed
```

### Metrics to Track

- Prebook creation success rate
- Booking confirmation success rate
- Cancellation refund success rate
- Average booking time
- Fallback mode activation frequency

---

## Security Considerations

1. **Authentication**: All endpoints require user authentication
2. **Authorization**: Users can only access their own bookings
3. **Data Encryption**: Sensitive data (payment, holder info) encrypted in NEON
4. **Rate Limiting**: Implement per-user rate limits on prebook creation
5. **Input Validation**: All inputs validated server-side

---

## Support

For issues or questions:

- **LiteAPI Documentation**: <https://docs.liteapi.travel/docs/booking-a-room>
- **Database**: NEON PostgreSQL (see connection string in `.env`)
- **Cache**: Redis (see Redis configuration in services/booking-service)
- **Status Page**: Check `/health` endpoint

---

**Last Updated**: April 3, 2026  
**Version**: 1.0.0  
**Maintainer**: Backend Team
