# Offline Request API - Centralized Gateway Integration

## Overview

All Offline Request Management System APIs are routed through the **centralized API Gateway** at `/services/api-gateway`. This ensures consistent authentication, rate limiting, logging, and request handling across the entire platform.

---

## Architecture

```
Client
  ↓
API Gateway (Port 3001)
  ├─ Authentication (JWT validation)
  ├─ Rate Limiting
  ├─ Request Logging
  ├─ Response Transformation
  └─ Routing to Services
       ↓
    Booking Service (Internal)
       ↓
    Neon PostgreSQL

```

---

## Client Request Flow

### Option 1: Direct RESTful Calls Through Gateway (Recommended)

```bash
# All calls go through the gateway at localhost:3001
curl -X GET http://localhost:3001/api/offline-requests/queue \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

The gateway automatically:
1. Validates JWT token
2. Checks rate limits (100 req/15min)
3. Logs the request
4. Routes to booking-service
5. Transforms and returns response

### Option 2: Intent-Based Routing (Advanced)

For complex operations, use the `/route` endpoint:

```bash
curl -X POST http://localhost:3001/route \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "intent": "ADAPTER",
    "body": {
      "method": "POST",
      "path": "/api/offline-requests",
      "data": {
        "bookingId": "123",
        "bookingRef": "BK-2024-001",
        "requestType": "flight_change",
        "requestedChanges": {...}
      }
    },
    "meta": {
      "service": "booking-service",
      "version": "1.0"
    }
  }'
```

---

## Available Endpoints Through Gateway

### Create Offline Request
```
POST /api/offline-requests
Host: localhost:3001
Authorization: Bearer <JWT_TOKEN>

Body:
{
  "bookingId": "booking-123",
  "bookingRef": "BK-2024-001",
  "requestType": "flight_change",
  "requestedChanges": { ... },
  "priority": "high"
}

Response: 201 Created
{
  "id": "request-id",
  "status": "pending_staff",
  "requestRef": "OCR-2024-001234"
}
```

### Get Offline Request
```
GET /api/offline-requests/:id
Host: localhost:3001
Authorization: Bearer <JWT_TOKEN>

Response: 200 OK
{
  "id": "request-id",
  "status": "pending_staff",
  "bookingRef": "BK-2024-001",
  "requestRef": "OCR-2024-001234",
  ...
}
```

### Get Staff Queue
```
GET /api/offline-requests/queue
Host: localhost:3001
Authorization: Bearer <JWT_TOKEN>

Response: 200 OK
{
  "data": [
    { "id": "...", "status": "pending_staff", "priority": "high", ... },
    ...
  ],
  "pagination": {
    "total": 45,
    "page": 1,
    "pageSize": 50
  }
}
```

### Get by Request Reference
```
GET /api/offline-requests/ref/:requestRef
Host: localhost:3001
Authorization: Bearer <JWT_TOKEN>

Example: /api/offline-requests/ref/OCR-2024-001234

Response: 200 OK
{ ... request data ... }
```

### Submit Pricing
```
PUT /api/offline-requests/:id/pricing
Host: localhost:3001
Authorization: Bearer <JWT_TOKEN>
X-Requires-Role: staff

Body:
{
  "newBaseFare": 450.00,
  "newTaxes": 85.50,
  "newFees": 25.00,
  "markup": 5.00,
  "notes": "Price updated due to seat change"
}

Response: 200 OK
{
  "status": "pricing_submitted",
  "priceDifference": { ... }
}
```

### Approve Request
```
PUT /api/offline-requests/:id/approve
Host: localhost:3001
Authorization: Bearer <JWT_TOKEN>

Body:
{
  "approvalMethod": "wallet",
  "autoApply": true
}

Response: 200 OK
{
  "status": "approved",
  "approvedAt": "2024-02-10T15:30:00Z"
}
```

### Reject Request
```
PUT /api/offline-requests/:id/reject
Host: localhost:3001
Authorization: Bearer <JWT_TOKEN>

Body:
{
  "rejectionReason": "Too expensive",
  "notifyCustomer": true
}

Response: 200 OK
{
  "status": "rejected",
  "rejectedAt": "2024-02-10T15:30:00Z"
}
```

### Complete Request
```
PUT /api/offline-requests/:id/complete
Host: localhost:3001
Authorization: Bearer <JWT_TOKEN>
X-Requires-Role: staff

Body:
{
  "documents": {
    "eTicketNumber": "0011234567890",
    "voucherNumber": "VOUCHER-2024-001",
    "invoiceId": "INV-2024-001"
  },
  "notes": "Tickets issued successfully"
}

Response: 200 OK
{
  "status": "completed",
  "completedAt": "2024-02-10T15:30:00Z"
}
```

### Record Payment
```
POST /api/offline-requests/:id/payment
Host: localhost:3001
Authorization: Bearer <JWT_TOKEN>

Body:
{
  "method": "wallet",
  "amount": 100.00,
  "transactionRef": "TXN-2024-001",
  "notes": "Customer paid via wallet"
}

Response: 200 OK
{
  "payment": { ... },
  "status": "payment_pending"
}
```

### Add Internal Note
```
POST /api/offline-requests/:id/notes
Host: localhost:3001
Authorization: Bearer <JWT_TOKEN>
X-Requires-Role: staff

Body:
{
  "note": "Customer called to confirm changes",
  "isInternal": true
}

Response: 201 Created
{
  "noteId": "note-id",
  "createdAt": "2024-02-10T15:30:00Z"
}
```

### View Audit Log
```
GET /api/offline-requests/:id/audit
Host: localhost:3001
Authorization: Bearer <JWT_TOKEN>

Response: 200 OK
{
  "data": [
    {
      "id": "audit-id",
      "action": "created",
      "actorId": "user-123",
      "actorType": "customer",
      "timestamp": "2024-02-10T15:00:00Z",
      "oldValues": null,
      "newValues": { ... }
    },
    ...
  ]
}
```

---

## Authentication

### JWT Token Required
All requests must include a valid JWT token:

```
Authorization: Bearer <JWT_TOKEN>
```

Token should contain:
- `sub` - User ID
- `email` - User email
- `role` - User role (customer, staff, admin)
- `iat` - Issued at timestamp
- `exp` - Expiration timestamp

### Get JWT Token

```bash
# Example: Login endpoint
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'

# Response
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { "id": "user-123", "email": "user@example.com", "role": "staff" }
}
```

---

## Role-Based Access Control

### Customer Endpoints
- ✅ Create request
- ✅ View own requests
- ✅ Approve/reject pricing
- ✅ View audit log
- ❌ View staff queue
- ❌ Submit pricing
- ❌ Complete request

### Staff Endpoints
- ✅ View all requests (queue)
- ✅ Submit pricing
- ✅ Complete requests
- ✅ Add internal notes
- ✅ View audit logs
- ❌ Approve (customer only)

### Admin Endpoints
- ✅ All staff endpoints
- ✅ Bulk operations
- ✅ System configuration
- ✅ Analytics

---

## Rate Limiting

**Global limit:** 100 requests per 15 minutes per IP

Headers returned:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1707576000
```

When limit exceeded (429 Too Many Requests):
```json
{
  "error": "Too many requests",
  "retryAfter": 900
}
```

---

## Error Handling

### Standard Error Response Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": {
      "field": "bookingId",
      "issue": "Required field missing"
    },
    "timestamp": "2024-02-10T15:30:00Z",
    "requestId": "req-12345"
  }
}
```

### Common Error Codes

| Code | Status | Meaning |
|------|--------|---------|
| INVALID_TOKEN | 401 | JWT token invalid or expired |
| INSUFFICIENT_PERMISSIONS | 403 | User role insufficient for operation |
| NOT_FOUND | 404 | Request record not found |
| VALIDATION_ERROR | 400 | Invalid request body |
| CONFLICT | 409 | Invalid state transition |
| SERVICE_UNAVAILABLE | 503 | Booking service down |
| RATE_LIMIT | 429 | Too many requests |

---

## Request/Response Transformation

The API Gateway automatically:

### Request Transformation
- ✅ Validates JSON schema
- ✅ Normalizes field names (snake_case → camelCase)
- ✅ Validates field types
- ✅ Injects user context (userId, role)
- ✅ Adds request ID for tracking

### Response Transformation
- ✅ Standardizes envelope format
- ✅ Converts dates to ISO 8601
- ✅ Includes pagination metadata
- ✅ Adds timing information
- ✅ Filters sensitive data based on role

### Example Transformation

**Client sends:**
```json
{
  "booking_id": "123",
  "requested_changes": { "route": "LAX→JFK" }
}
```

**Gateway passes to service:**
```json
{
  "bookingId": "123",
  "requestedChanges": { "route": "LAX→JFK" },
  "userId": "user-456",
  "role": "customer",
  "requestId": "req-789"
}
```

**Service returns:**
```json
{
  "id": "request-id",
  "status": "pending_staff",
  "createdAt": "2024-02-10T15:00:00Z"
}
```

**Gateway returns to client:**
```json
{
  "data": {
    "id": "request-id",
    "status": "pending_staff",
    "createdAt": "2024-02-10T15:00:00Z"
  },
  "meta": {
    "requestId": "req-789",
    "timestamp": "2024-02-10T15:30:00Z",
    "duration_ms": 145
  }
}
```

---

## Integration Examples

### JavaScript/TypeScript

```typescript
import axios from 'axios';

const API_URL = 'http://localhost:3001';

interface OfflineRequestPayload {
  bookingId: string;
  bookingRef: string;
  requestType: 'flight_change' | 'hotel_change';
  requestedChanges: Record<string, any>;
  priority?: 'low' | 'medium' | 'high';
}

async function createOfflineRequest(
  payload: OfflineRequestPayload,
  token: string
) {
  const response = await axios.post(
    `${API_URL}/api/offline-requests`,
    payload,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  return response.data;
}

async function getStaffQueue(token: string) {
  const response = await axios.get(
    `${API_URL}/api/offline-requests/queue`,
    {
      headers: { 'Authorization': `Bearer ${token}` }
    }
  );
  return response.data;
}

// Usage
const token = 'your-jwt-token';
const request = await createOfflineRequest(
  {
    bookingId: 'BK-123',
    bookingRef: 'BK-2024-001',
    requestType: 'flight_change',
    requestedChanges: { route: 'LAX→JFK' },
    priority: 'high'
  },
  token
);
```

### cURL

```bash
# Get JWT token
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "staff@tripalfa.com",
    "password": "password123"
  }' | jq -r '.token')

# Get staff queue using token
curl -X GET http://localhost:3001/api/offline-requests/queue \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq
```

### React Component

```typescript
import { useEffect, useState } from 'react';

export const StaffQueue = ({ token }: { token: string }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('http://localhost:3001/api/offline-requests/queue', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setRequests(data.data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [token]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Offline Request Queue</h2>
      <table>
        <thead>
          <tr>
            <th>Reference</th>
            <th>Status</th>
            <th>Priority</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          {requests.map(req => (
            <tr key={req.id}>
              <td>{req.requestRef}</td>
              <td>{req.status}</td>
              <td>{req.priority}</td>
              <td>{new Date(req.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
```

---

## Logging & Monitoring

The gateway logs all offline request operations:

```log
[2024-02-10T15:30:00Z] POST /api/offline-requests - 201
└─ User: user-123 (staff)
└─ Body: { bookingId: "BK-123", requestType: "flight_change" }
└─ Response: { id: "req-456", requestRef: "OCR-2024-001234" }
└─ Duration: 145ms
```

### Tracking Request Through System
```
Request ID: req-12345
├─ Gateway Received: 15:30:00.000Z
├─ Auth Validated: 15:30:00.025Z
├─ Rate Limit Checked: 15:30:00.030Z
├─ Routed to Service: 15:30:00.035Z
├─ Service Processing: 15:30:00.045Z - 15:30:00.120Z
├─ DB Write: 15:30:00.100Z
├─ Response Transformed: 15:30:00.130Z
└─ Response Sent: 15:30:00.135Z (Total: 135ms)
```

---

## Best Practices

### 1. Token Management
- ✅ Store tokens securely (HttpOnly cookies preferred)
- ✅ Refresh tokens before expiration
- ✅ Never expose tokens in logs
- ✅ Use HTTPS in production

### 2. Rate Limiting
- ✅ Implement exponential backoff for retries
- ✅ Cache responses when appropriate
- ✅ Use batch endpoints for bulk operations

### 3. Error Handling
- ✅ Retry on 5xx errors
- ✅ Don't retry on 4xx validation errors
- ✅ Include request ID when reporting issues
- ✅ Log full error context

### 4. Performance
- ✅ Use pagination for large result sets
- ✅ Filter and search on client when possible
- ✅ Implement request/response caching
- ✅ Monitor API response times

---

## Deployment

### Gateway Configuration

**Environment Variables:**
```env
PORT=3001
NODE_ENV=production
DATABASE_URL=postgresql://...
DATABASE_POOL_SIZE=20
RATE_LIMIT_WINDOW=900000 (15 minutes)
RATE_LIMIT_MAX=100
LOG_LEVEL=info
JWT_SECRET=your-secret-key
```

### Scaling

The gateway is stateless and can be scaled horizontally:

```
Load Balancer
├─ Gateway Instance 1 (port 3001)
├─ Gateway Instance 2 (port 3001)
└─ Gateway Instance 3 (port 3001)
     ↓
All route to shared services/databases
```

---

## Troubleshooting

### 401 Unauthorized
- **Cause:** Missing or invalid JWT token
- **Fix:** Verify token is included and not expired
- **Debug:** Check token expiration: `jwt_decode(token).exp`

### 403 Forbidden
- **Cause:** User role doesn't have permission
- **Fix:** Verify user has required role (staff/admin)
- **Debug:** Check `X-User-Role` response header

### 429 Too Many Requests
- **Cause:** Rate limit exceeded
- **Fix:** Wait 15 minutes or reduce request frequency
- **Debug:** Check `X-RateLimit-Reset` header for reset time

### 500 Service Unavailable
- **Cause:** Booking service is down
- **Fix:** Check booking service health
- **Debug:** Try `/health` endpoint on booking service

---

## Related Documentation

- [OFFLINE_REQUEST_API.md](./docs/OFFLINE_REQUEST_API.md) - Full API reference
- [OFFLINE_REQUEST_QUICK_START.md](./docs/OFFLINE_REQUEST_QUICK_START.md) - Quick start guide
- [API Gateway Documentation](./services/api-gateway/README.md) - Gateway internals

---

**All offline request APIs route through the centralized gateway for consistent security, rate limiting, and logging.**
