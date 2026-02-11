# Developer Quick Reference - Gateway Routing

## Always Route Through the Centralized API Gateway

```
API Gateway: http://localhost:3001
```

---

## Request Template

```bash
# TEMPLATE
curl -X [METHOD] http://localhost:3001/api/offline-requests[ENDPOINT] \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '[BODY]'
```

---

## Common Operations

### Get JWT Token

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"staff@tripalfa.com","password":"password123"}'

# Response: { "token": "eyJ...", "user": {...} }
```

### Create Request

```bash
curl -X POST http://localhost:3001/api/offline-requests \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": "BK-123",
    "bookingRef": "BK-2024-001",
    "requestType": "flight_change",
    "requestedChanges": {"route":"LAX→JFK"},
    "priority": "high"
  }'
```

### View Staff Queue

```bash
curl http://localhost:3001/api/offline-requests/queue \
  -H "Authorization: Bearer $TOKEN"
```

### Get Request by ID

```bash
curl http://localhost:3001/api/offline-requests/[REQUEST_ID] \
  -H "Authorization: Bearer $TOKEN"
```

### Get Request by Reference

```bash
curl http://localhost:3001/api/offline-requests/ref/OCR-2024-001234 \
  -H "Authorization: Bearer $TOKEN"
```

### Submit Pricing

```bash
curl -X PUT http://localhost:3001/api/offline-requests/[REQUEST_ID]/pricing \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "newBaseFare": 450.00,
    "newTaxes": 85.50,
    "newFees": 25.00
  }'
```

### Approve Request

```bash
curl -X PUT http://localhost:3001/api/offline-requests/[REQUEST_ID]/approve \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"approvalMethod":"wallet","autoApply":true}'
```

### Complete Request

```bash
curl -X PUT http://localhost:3001/api/offline-requests/[REQUEST_ID]/complete \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "documents": {
      "eTicketNumber": "0011234567890",
      "voucherNumber": "VOUCHER-2024-001"
    }
  }'
```

---

## JavaScript/Fetch Example

```typescript
const API_BASE = 'http://localhost:3001';

// Get token
const loginRes = await fetch(`${API_BASE}/api/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'staff@tripalfa.com',
    password: 'password123'
  })
});
const { token } = await loginRes.json();

// Create request
const createRes = await fetch(`${API_BASE}/api/offline-requests`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    bookingId: 'BK-123',
    bookingRef: 'BK-2024-001',
    requestType: 'flight_change',
    requestedChanges: { route: 'LAX→JFK' }
  })
});
const newRequest = await createRes.json();
console.log(`Created: ${newRequest.data.requestRef}`);

// Get queue
const queueRes = await fetch(`${API_BASE}/api/offline-requests/queue`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
const queue = await queueRes.json();
console.log(`${queue.data.length} pending requests`);
```

---

## TypeScript Client

```typescript
import { OfflineRequestType } from '@tripalfa/shared-types';

class OfflineRequestClient {
  private token: string;
  private baseUrl = 'http://localhost:3001';

  constructor(token: string) {
    this.token = token;
  }

  private headers() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`
    };
  }

  async createRequest(
    bookingId: string,
    bookingRef: string,
    requestType: OfflineRequestType,
    requestedChanges: any,
    priority: 'low' | 'medium' | 'high' = 'medium'
  ) {
    const res = await fetch(`${this.baseUrl}/api/offline-requests`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({
        bookingId,
        bookingRef,
        requestType,
        requestedChanges,
        priority
      })
    });
    return res.json();
  }

  async getQueue(page = 1, pageSize = 50) {
    const res = await fetch(
      `${this.baseUrl}/api/offline-requests/queue?page=${page}&pageSize=${pageSize}`,
      { headers: this.headers() }
    );
    return res.json();
  }

  async getRequest(id: string) {
    const res = await fetch(
      `${this.baseUrl}/api/offline-requests/${id}`,
      { headers: this.headers() }
    );
    return res.json();
  }

  async submitPricing(
    id: string,
    newBaseFare: number,
    newTaxes: number,
    newFees: number
  ) {
    const res = await fetch(
      `${this.baseUrl}/api/offline-requests/${id}/pricing`,
      {
        method: 'PUT',
        headers: this.headers(),
        body: JSON.stringify({
          newBaseFare,
          newTaxes,
          newFees
        })
      }
    );
    return res.json();
  }

  async approveRequest(id: string) {
    const res = await fetch(
      `${this.baseUrl}/api/offline-requests/${id}/approve`,
      {
        method: 'PUT',
        headers: this.headers(),
        body: JSON.stringify({ approvalMethod: 'wallet' })
      }
    );
    return res.json();
  }

  async completeRequest(id: string, documents: any) {
    const res = await fetch(
      `${this.baseUrl}/api/offline-requests/${id}/complete`,
      {
        method: 'PUT',
        headers: this.headers(),
        body: JSON.stringify({ documents })
      }
    );
    return res.json();
  }
}

// Usage
const client = new OfflineRequestClient(jwtToken);
const requests = await client.getQueue();
const newRequest = await client.createRequest(
  'BK-123',
  'BK-2024-001',
  OfflineRequestType.FLIGHT_CHANGE,
  { route: 'LAX→JFK' },
  'high'
);
```

---

## Axios Example

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001/api',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

// Get staff queue
const { data: queue } = await api.get('/offline-requests/queue');

// Create request
const { data: newRequest } = await api.post('/offline-requests', {
  bookingId: 'BK-123',
  bookingRef: 'BK-2024-001',
  requestType: 'flight_change',
  requestedChanges: { route: 'LAX→JFK' }
});

// Submit pricing
const { data: updated } = await api.put(`/offline-requests/${id}/pricing`, {
  newBaseFare: 450,
  newTaxes: 85.50,
  newFees: 25
});
```

---

## React Hooks

```typescript
import { useEffect, useState } from 'react';

export const useOfflineRequests = (token: string) => {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/offline-requests/queue', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setQueue(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createRequest = async (payload: any) => {
    const res = await fetch('http://localhost:3001/api/offline-requests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    setQueue([...queue, data.data]);
    return data.data;
  };

  useEffect(() => {
    fetchQueue();
  }, [token]);

  return { queue, loading, error, fetchQueue, createRequest };
};

// Usage
export const StaffDashboard = ({ token }: { token: string }) => {
  const { queue } = useOfflineRequests(token);

  return (
    <div>
      <h1>Offline Requests Queue ({queue.length})</h1>
      <ul>
        {queue.map(req => (
          <li key={req.id}>
            {req.requestRef} - {req.status} [{req.priority}]
          </li>
        ))}
      </ul>
    </div>
  );
};
```

---

## Important Notes

### ✅ DO
- ✅ Always use `http://localhost:3001/api/offline-requests` base URL
- ✅ Include JWT token in every request
- ✅ Handle 429 rate limit errors with exponential backoff
- ✅ Use pagination for large result sets
- ✅ Check response `meta.requestId` for debugging

### ❌ DON'T
- ❌ Call booking-service directly (use gateway only)
- ❌ Bypass authentication
- ❌ Hardcode API URLs (use environment variables)
- ❌ Store sensitive data in localStorage unencrypted
- ❌ Ignore rate limit headers

---

## Error Handling

```typescript
try {
  const res = await fetch(`${API_URL}/api/offline-requests/queue`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (!res.ok) {
    const error = await res.json();
    
    if (res.status === 401) {
      // Token expired - refresh
      console.error('Unauthorized - refresh token');
    } else if (res.status === 429) {
      // Rate limited - wait
      const resetTime = res.headers.get('X-RateLimit-Reset');
      console.error(`Rate limited until ${resetTime}`);
    } else if (res.status === 403) {
      // Permission denied
      console.error('Insufficient permissions');
    } else {
      console.error(`Error: ${error.error.message}`);
    }
  }

  const data = await res.json();
  return data;
} catch (err) {
  console.error('Network error:', err);
}
```

---

## Debugging

### Check Request ID
```
All responses include: meta.requestId
Use this to track requests in gateway logs
```

### View Rate Limit Status
```
Response headers:
- X-RateLimit-Limit: 100
- X-RateLimit-Remaining: 95
- X-RateLimit-Reset: 1707576000
```

### Verify Token
```typescript
const decoded = jwt_decode(token);
console.log('Token exp:', decoded.exp);
console.log('User role:', decoded.role);
```

---

## Endpoints Reference

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/` | Create request |
| GET | `/` | List (filters) |
| GET | `/queue` | Staff queue |
| GET | `/:id` | Get request |
| GET | `/ref/:ref` | Get by reference |
| PUT | `/:id/pricing` | Submit pricing |
| PUT | `/:id/approve` | Approve |
| PUT | `/:id/reject` | Reject |
| POST | `/:id/payment` | Record payment |
| PUT | `/:id/complete` | Complete |
| PUT | `/:id/cancel` | Cancel |
| POST | `/:id/notes` | Add note |
| GET | `/:id/audit` | View audit log |

---

## More Information

- [Gateway Integration Guide](./OFFLINE_REQUEST_GATEWAY_INTEGRATION.md)
- [Complete API Reference](./OFFLINE_REQUEST_API.md)
- [Full Quick Start](./OFFLINE_REQUEST_QUICK_START.md)

---

**All requests route through the centralized API Gateway at port 3001.**
