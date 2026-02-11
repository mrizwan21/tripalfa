# Architecture Overview - Centralized API Gateway Routing

**Date:** February 10, 2026  
**Status:** ✅ Backend Complete, Gateway Integration Ready

---

## System Overview

The Offline Booking Request Management System uses a **centralized API Gateway** to route all requests. This ensures consistent security, rate limiting, and monitoring across the entire platform.

## Request Flow Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Client Applications                  │
│  ├─ Booking Engine (React)                              │
│  ├─ B2B Admin Dashboard (React)                         │
│  └─ Mobile Apps (React Native)                          │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ↓
        ┌──────────────────────┐
        │   API Gateway        │ (Port 3001)
        ├──────────────────────┤
        │ ✅ JWT Authentication │
        │ ✅ Rate Limiting      │
        │ ✅ Request Logging    │
        │ ✅ Response Transform │
        │ ✅ CORS & Security    │
        └─────────┬────────────┘
                  │
        ┌─────────┼──────────────────────┐
        ↓         ↓                      ↓
   Booking      Flights              Hotels
   Service      Service              Service
   (Port 3002)  
   
   [Internal Only - Not Directly Accessible]
```

---

## Key Gateway Features

### 1. **Authentication**
- JWT token validation on every request
- Token must be included in `Authorization` header
- Automatic token refresh handling

### 2. **Rate Limiting**
- 100 requests per 15 minutes per IP
- Headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- Returns 429 when limit exceeded

### 3. **Request Logging**
- Every request logged with ID for tracing
- Includes user context (ID, role)
- Tracks request duration and status

### 4. **Response Transformation**
- Standardized envelope format
- Automatic schema validation
- Field normalization (snake_case ↔ camelCase)

### 5. **Security**
- CORS validation
- Request size limits
- SQL injection prevention
- XSS protection

---

## Offline Request API Structure

```
Gateway Root: http://localhost:3001

├── /api/offline-requests          (Core endpoints)
│   ├── POST    /                  (Create request)
│   ├── GET     /                  (List requests with filters)
│   ├── GET     /queue             (Staff queue - sorted by priority)
│   ├── GET     /customer/my-requests (Customer's requests)
│   ├── GET     /:id               (Get by ID)
│   ├── GET     /ref/:requestRef   (Get by reference number)
│   │
│   ├── PUT     /:id/pricing       (Staff submits pricing)
│   ├── PUT     /:id/approve       (Customer approves)
│   ├── PUT     /:id/reject        (Customer rejects)
│   ├── POST    /:id/payment       (Record payment)
│   ├── PUT     /:id/complete      (Mark completed)
│   ├── PUT     /:id/cancel        (Cancel request)
│   │
│   ├── POST    /:id/notes         (Add internal note)
│   └── GET     /:id/audit         (View audit log)
│
└── /api/auth                       (Shared gateway auth)
    ├── POST    /login             (Get JWT token)
    ├── POST    /refresh           (Refresh token)
    └── POST    /logout            (Invalidate token)
```

---

## Request/Response Pattern

### Standard Request Format

```http
POST http://localhost:3001/api/offline-requests
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "bookingId": "BK-123",
  "bookingRef": "BK-2024-001",
  "requestType": "flight_change",
  "requestedChanges": {
    "serviceType": "flight",
    "newItinerary": { ... }
  },
  "priority": "high"
}
```

### Standard Response Format

```http
HTTP/1.1 201 Created
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1707576000

{
  "data": {
    "id": "request-abc123",
    "status": "pending_staff",
    "requestRef": "OCR-2024-001234",
    "bookingId": "BK-123",
    "priority": "high",
    "createdAt": "2024-02-10T15:30:00Z",
    "updatedAt": "2024-02-10T15:30:00Z"
  },
  "meta": {
    "requestId": "req-xyz789",
    "timestamp": "2024-02-10T15:30:00Z",
    "duration_ms": 145
  }
}
```

---

## Integration Points

### From Booking Engine
```typescript
// Frontend code
import { useAuth } from '@tripalfa/auth';

function RequestFlightChange() {
  const { token } = useAuth();
  
  async function submitRequest() {
    const response = await fetch(
      'http://localhost:3001/api/offline-requests',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bookingId: 'BK-123',
          bookingRef: 'BK-2024-001',
          requestType: 'flight_change',
          requestedChanges: { ... }
        })
      }
    );
    return response.json();
  }
}
```

### From B2B Admin
```typescript
// Admin dashboard
async function viewStaffQueue() {
  const res = await fetch(
    'http://localhost:3001/api/offline-requests/queue',
    {
      headers: { 'Authorization': `Bearer ${staffToken}` }
    }
  );
  const { data } = await res.json();
  return data; // Array of pending requests sorted by priority
}
```

### From Backend Services
```typescript
// Other backend services accessing through gateway
const response = await fetch(
  'http://localhost:3001/api/offline-requests/ref/OCR-2024-001234',
  {
    headers: { 'Authorization': `Bearer ${serviceToken}` }
  }
);
```

---

## Data Flow Example - Flight Change Workflow

```
1. Customer Submits Request
   ├─ Booking Engine captures flight change details
   ├─ Calls: POST /api/offline-requests
   └─ Gateway validates & routes to booking-service
      └─ Database: Creates OfflineChangeRequest record
      └─ Audit Log: Records "REQUEST_CREATED"
      └─ Notification: Queues staff notification

2. Staff Reviews Request
   ├─ B2B Admin fetches: GET /api/offline-requests/queue
   └─ Returns pending requests sorted by priority

3. Staff Submits Pricing
   ├─ Admin calls: PUT /:id/pricing
   ├─ Including: newBaseFare, newTaxes, newFees
   └─ Service calculates price difference
      └─ Database: Updates status to PRICING_SUBMITTED
      └─ Audit Log: Records "PRICING_SUBMITTED" with old/new values
      └─ Notification: Notifies customer to approve

4. Customer Approves
   ├─ Booking Engine calls: PUT /:id/approve
   └─ Service processes approval
      └─ Database: Updates status to APPROVED
      └─ Audit Log: Records "APPROVED"
      └─ Notification: Confirms to customer

5. Payment Processing
   ├─ Customer pays: POST /:id/payment
   └─ Service records payment
      └─ Database: Updates payment info
      └─ Audit Log: Records "PAYMENT_RECORDED"

6. Staff Completes
   ├─ Admin calls: PUT /:id/complete
   ├─ Including: documents (eTicket, voucher)
   └─ Service finalizes
      └─ Database: Updates status to COMPLETED
      └─ Audit Log: Records "COMPLETED"
      └─ Notification: Sends final confirmation

7. Complete Audit Trail
   └─ Admin views: GET /:id/audit
      └─ Shows all 6 actions with timestamps & actors
```

---

## Error Handling Flow

```
Client Request
    ↓
Gateway Validation
├─ Invalid JWT → 401 Unauthorized
├─ Rate Limited → 429 Too Many Requests
├─ Invalid Schema → 400 Bad Request
└─ Valid → Forward to Service
    ↓
Service Processing
├─ Not Found → 404 Not Found
├─ Conflict (invalid state) → 409 Conflict
├─ Internal Error → 500 Internal Server Error
└─ Success → 200/201 OK
    ↓
Response Transformation
└─ Return formatted response with meta
```

---

## Performance Considerations

### Database Indexes
```sql
-- Optimized for queue retrieval
CREATE INDEX idx_offline_requests_status_priority 
  ON OfflineChangeRequest(status, priority DESC);

-- Optimized for customer queries
CREATE INDEX idx_offline_requests_booking_id 
  ON OfflineChangeRequest(bookingId, createdAt DESC);

-- Optimized for reference lookups
CREATE INDEX idx_offline_requests_ref 
  ON OfflineChangeRequest(requestRef);
```

### Caching Strategy
- Requests cached for 5 minutes (non-staff access)
- Queue refreshes every 1 minute (staff access)
- Audit logs not cached (compliance requirement)

### Pagination
- Default: 50 items per page
- Maximum: 100 items per page
- Supports: offset, limit, sort, filter

---

## Security Considerations

### Authentication
- ✅ JWT tokens required on all endpoints
- ✅ Tokens expire after 24 hours
- ✅ Refresh token available for 7 days
- ✅ All tokens issued with user context

### Authorization
- ✅ Customers can only access own requests
- ✅ Staff can access all pending requests
- ✅ Audit trails accessible to request actor + staff
- ✅ Payment operations require customer role

### Data Protection
- ✅ HTTPS only (enforced in production)
- ✅ All sensitive fields encrypted at rest
- ✅ Full audit trail of all changes
- ✅ Soft deletes (records not hard-deleted)

### Rate Limiting
- ✅ Per-IP rate limit (100/15min)
- ✅ Per-user burst limit (10/minute)
- ✅ Queue operations have separate limit (20/15min)

---

## Monitoring & Debugging

### Request Tracing
```
X-Request-ID: req-12345
├─ Sent by gateway
├─ Included in logs
└─ Returned in response (meta.requestId)
```

### Performance Metrics
```
X-Response-Time: 145ms
X-DB-Time: 95ms
X-Cache-Hit: false
```

### Rate Limit Headers
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1707576000
```

---

## Documentation Files

### Quick References
- **[GATEWAY_ROUTING_REFERENCE.md](./GATEWAY_ROUTING_REFERENCE.md)** - Copy-paste code examples
- **[OFFLINE_REQUEST_QUICK_START.md](./docs/OFFLINE_REQUEST_QUICK_START.md)** - Implementation guide

### Complete Documentation
- **[OFFLINE_REQUEST_GATEWAY_INTEGRATION.md](./docs/OFFLINE_REQUEST_GATEWAY_INTEGRATION.md)** - Full gateway integration guide
- **[OFFLINE_REQUEST_API.md](./docs/OFFLINE_REQUEST_API.md)** - All 13 endpoints documented

### Reference
- **[OFFLINE_REQUEST_README.md](./OFFLINE_REQUEST_README.md)** - System overview
- **[OFFLINE_REQUEST_IMPLEMENTATION_CHECKLIST.md](./OFFLINE_REQUEST_IMPLEMENTATION_CHECKLIST.md)** - Implementation roadmap

---

## Quick Start

### For Frontend Developers
1. Read: [GATEWAY_ROUTING_REFERENCE.md](./GATEWAY_ROUTING_REFERENCE.md)
2. Use: `http://localhost:3001/api/offline-requests` as base URL
3. Include: JWT token in Authorization header
4. Reference: Code examples for React/TypeScript

### For Backend Developers
1. Read: [OFFLINE_REQUEST_GATEWAY_INTEGRATION.md](./docs/OFFLINE_REQUEST_GATEWAY_INTEGRATION.md)
2. Understand: Request/response transformation patterns
3. Handle: Role-based access control
4. Test: All 13 endpoints through gateway

### For DevOps/Infra
1. Gateway runs: `Port 3001`
2. Service(s) internal: `Port 3002+` (not directly accessible)
3. Database: Neon PostgreSQL
4. Scaling: Gateway is stateless (horizontal scaling OK)

---

## Key Takeaways

1. **All requests route through API Gateway** - Never call booking-service directly
2. **Authentication required** - Include JWT token on every request
3. **Standard patterns** - All endpoints follow same request/response format
4. **Rate limiting applied** - 100 requests per 15 minutes
5. **Complete audit trail** - All operations logged for compliance
6. **Type-safe** - Generated TypeScript types for all payloads

---

**Next Step:** Read [GATEWAY_ROUTING_REFERENCE.md](./GATEWAY_ROUTING_REFERENCE.md) for code examples and integration patterns.
