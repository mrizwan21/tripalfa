# Offline Request Management - Quick Start Guide

## Overview

This guide helps developers quickly implement and integrate the Offline Request Management System into TripAlfa applications.

**Important:** All offline request APIs are routed through the **centralized API Gateway** (port 3001) for authentication, rate limiting, and logging. See [Gateway Integration Guide](./OFFLINE_REQUEST_GATEWAY_INTEGRATION.md) for complete details.

## Architecture

```
Client Apps (Booking Engine / B2B Admin)
         ↓
  API Gateway (port 3001)
  ├─ Authentication (JWT)
  ├─ Rate Limiting
  └─ Request Routing
         ↓
  Booking Service (port 3002, internal only)
         ↓
  Neon PostgreSQL
```

All requests must:
1. Go through the API Gateway (not direct to booking-service)
2. Include JWT token in `Authorization` header
3. Use base URL: `http://localhost:3001/api/offline-requests`

## Prerequisites

- Node.js 16+
- npm or yarn
- Neon PostgreSQL database (managed)
- TripAlfa monorepo set up

## Installation & Setup

### 1. Update Database Connection (Neon)

Ensure your `.env` file has the Neon database URL:

```env
DATABASE_URL="postgresql://user:password@neon-hostname.neon.tech/database?sslmode=require"
```

### 2. Run Database Migration

```bash
# From repository root
cd /path/to/TripAlfa-Node
npm run db:migrate
npm run db:generate
```

This will:
- Create the `OfflineChangeRequest` table
- Create the `OfflineRequestAuditLog` table
- Create the `OfflineRequestNotificationQueue` table
- Generate Prisma client types

### 3. Verify Installation

Check that the migration was applied:

```bash
npm run db:status
```

---

## Basic Usage

### Creating an Offline Request

**In Booking Engine (Frontend):**

```typescript
import { CreateOfflineRequestPayload, OfflineRequestType } from '@tripalfa/shared-types';

async function requestFlightChange() {
  const payload: CreateOfflineRequestPayload = {
    bookingId: 'booking-123',
    bookingRef: 'BK-2024-001234',
    requestType: OfflineRequestType.FLIGHT_CHANGE,
    requestedChanges: {
      serviceType: 'flight',
      newItinerary: {
        type: 'flight',
        segments: [
          {
            origin: 'LHR',
            destination: 'CDG',
            departureDate: '2024-03-15T10:00:00Z',
            arrivalDate: '2024-03-15T12:30:00Z',
            airline: 'BA',
            flightNumber: '112',
            cabinClass: 'economy',
          }
        ],
        passengers: [
          {
            firstName: 'John',
            lastName: 'Doe',
            type: 'adult',
            dateOfBirth: '1990-01-01',
          }
        ]
      },
      changeReason: 'Need to change flight date',
      customerNotes: 'Prefer morning flight if available'
    },
    priority: 'high'
  };

  const response = await fetch('/api/offline-requests', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  console.log('Request created:', data.data.requestRef);
}
```

---

### Staff Processing Flow

**In B2B Admin Dashboard:**

```typescript
import offlineRequestService from '@/services/offlineRequestService';

// Step 1: Get pending queue
async function loadPendingQueue() {
  const response = await fetch('/api/offline-requests/queue?limit=50');
  const { data } = await response.json();
  return data.items;
}

// Step 2: Open request details
async function openRequest(requestId: string) {
  const response = await fetch(`/api/offline-requests/${requestId}`);
  const { data } = await response.json();
  return data;
}

// Step 3: Submit pricing
async function submitPricing(requestId: string) {
  const response = await fetch(`/api/offline-requests/${requestId}/pricing`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${staffToken}`
    },
    body: JSON.stringify({
      newBaseFare: 1500,
      newTaxes: 300,
      newMarkup: 150,
      currency: 'USD',
      supplierReference: 'SUP-123456',
      staffNotes: 'Lowest available price'
    })
  });
  return await response.json();
}

// Step 4: Track audit log
async function viewAuditLog(requestId: string) {
  const response = await fetch(`/api/offline-requests/${requestId}/audit?limit=100`);
  const { data } = await response.json();
  return data.logs;
}
```

---

### Customer Approval Flow

**In Booking Engine:**

```typescript
// Step 1: Get customer's requests
async function loadMyRequests(bookingId: string) {
  const response = await fetch(
    `/api/offline-requests/customer/my-requests?bookingId=${bookingId}`
  );
  const { data } = await response.json();
  return data.requests;
}

// Step 2: View pricing details
async function viewPricing(requestId: string) {
  const response = await fetch(`/api/offline-requests/${requestId}`);
  const { data } = await response.json();
  
  // Show price difference
  if (data.priceDifference) {
    const { totalDiff, currency } = data.priceDifference;
    console.log(`Price difference: ${currency} ${totalDiff}`);
  }
}

// Step 3: Approve pricing
async function approvePricing(requestId: string) {
  const response = await fetch(`/api/offline-requests/${requestId}/approve`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${customerToken}`
    }
  });
  return await response.json();
}

// Step 4: Process payment (if price difference > 0)
async function processPayment(requestId: string, amount: number) {
  const response = await fetch(`/api/offline-requests/${requestId}/payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${customerToken}`
    },
    body: JSON.stringify({
      paymentId: 'PAY-' + Date.now(),
      amount,
      method: 'wallet', // or 'credit_card'
      transactionRef: 'TXN-' + Date.now()
    })
  });
  return await response.json();
}
```

---

## State Transitions & Validations

### Valid Status Transitions

```typescript
const validTransitions: Record<string, string[]> = {
  'pending_staff': ['pricing_submitted', 'cancelled'],
  'pricing_submitted': ['pending_customer_approval', 'cancelled'],
  'pending_customer_approval': ['approved', 'rejected', 'cancelled'],
  'approved': ['payment_pending'],
  'payment_pending': ['completed'],
  'completed': [],
  'rejected': [],
  'cancelled': []
};
```

### Custom Validations in Frontend

```typescript
function canApproveRequest(request: OfflineChangeRequest): boolean {
  return request.status === OfflineRequestStatus.PRICING_SUBMITTED;
}

function canPayForRequest(request: OfflineChangeRequest): boolean {
  return request.status === OfflineRequestStatus.APPROVED &&
         request.priceDifference &&
         request.priceDifference.totalDiff > 0;
}

function canCancelRequest(request: OfflineChangeRequest): boolean {
  const cancellableStates = [
    OfflineRequestStatus.PENDING_STAFF,
    OfflineRequestStatus.PRICING_SUBMITTED,
    OfflineRequestStatus.PENDING_CUSTOMER_APPROVAL
  ];
  return cancellableStates.includes(request.status);
}
```

---

## Integration with Notification Service

The offline request system automatically triggers notifications. Ensure the notification service is properly configured:

```typescript
// notificationService.ts handles these events:
enum OfflineRequestNotificationType {
  REQUEST_CREATED = 'offline_request_created',           // To: Staff
  PRICING_SUBMITTED = 'offline_request_priced',          // To: Customer
  APPROVAL_REQUEST = 'offline_request_pending_approval', // To: Customer
  COMPLETED = 'offline_request_completed',               // To: Customer
}
```

---

## Integration with Document Generation

When a request is completed, new documents are generated:

```typescript
// This happens automatically when status changes to 'completed'
// Documents generated:
// - New E-ticket (for flights)
// - New Voucher (for hotels)
// - Amendment Invoice
// - Original document reference

// Access via: request.reissuedDocuments.documentUrls
```

---

## Permissions & Authorization

### Customer Permissions
- ✅ Create offline requests for their own bookings
- ✅ View their requests
- ✅ Approve/reject pricing
- ✅ Pay for approved requests
- ✅ Cancel during certain statuses
- ❌ View staff queue
- ❌ Submit pricing

### Staff Permissions
- ✅ View the queue
- ✅ Add pricing to requests
- ✅ Add internal notes
- ✅ View customer details
- ✅ Mark as completed
- ❌ Approve pricing (customer only)
- ❌ View other staff's notes

### Admin Permissions
- ✅ All staff permissions
- ✅ Assign requests to staff
- ✅ Override pricing
- ✅ Force cancel requests
- ✅ View full audit trail

---

## Error Handling

```typescript
async function createOfflineRequest(payload: CreateOfflineRequestPayload) {
  try {
    const response = await fetch('/api/offline-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.json();
      
      switch (response.status) {
        case 400:
          // Missing or invalid fields
          throw new Error(`Validation error: ${error.message}`);
        case 401:
          // Not authenticated
          throw new Error('Please log in to continue');
        case 404:
          // Booking not found
          throw new Error('Booking not found');
        default:
          throw new Error(error.message);
      }
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to create offline request:', error);
    // Show user-friendly error message
  }
}
```

---

## Testing

### Unit Tests

```bash
npm test -- services/offlineRequestService.test.ts
npm test -- controllers/offlineRequestController.test.ts
```

### Integration Tests

```bash
npm run test:api:offline-requests
```

### Manual Testing with cURL

```bash
# Create request
curl -X POST http://localhost:3001/api/offline-requests \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d @- << 'EOF'
{
  "bookingId": "123",
  "bookingRef": "BK-2024-001",
  "requestType": "flight_change",
  "requestedChanges": {
    "serviceType": "flight",
    "newItinerary": {...},
    "changeReason": "Schedule conflict"
  }
}
EOF

# Get request
curl -X GET http://localhost:3001/api/offline-requests/OCR-2024-001234 \
  -H "Authorization: Bearer YOUR_TOKEN"

# Submit pricing (staff)
curl -X PUT http://localhost:3001/api/offline-requests/{id}/pricing \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer STAFF_TOKEN" \
  -d '{"newBaseFare": 1500, "newTaxes": 300, "newMarkup": 150, "currency": "USD"}'
```

---

## Performance Tips

1. **Use pagination** for queue and list endpoints (limit: 50-100)
2. **Cache request details** on the frontend to reduce API calls
3. **Use WebSocket** for real-time queue updates (future enhancement)
4. **Index queries** by `status`, `createdAt`, and `bookingId`
5. **Archive old requests** after 90 days to keep tables lean

---

## Common Issues & Solutions

### "Database migration not applied"
```bash
# Force sync with database
npm run db:push --schema=database/prisma/schema.prisma
```

### "Cannot find Prisma client"
```bash
# Regenerate client
npm run db:generate
```

### "Rate limit exceeded"
```
Wait 15 minutes before retrying.
Or upgrade rate limit in config/security.ts
```

### "Invalid token / Unauthorized"
```
Ensure JWT token is included in Authorization header:
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## Next Steps

1. ✅ Update B2B Admin UI with offline request queue component
2. ✅ Create booking engine modal for submitting requests
3. ✅ Set up email notification templates
4. ✅ Configure payment integration for price differences
5. ✅ Add document generation for re-issued tickets/vouchers
6. ✅ Implement real-time updates with WebSocket

---

## Support & Documentation

- Full API docs: [OFFLINE_REQUEST_API.md](./OFFLINE_REQUEST_API.md)
- Architecture guide: [epic specification](./OFFLINE_REQUEST_MANAGEMENT.md)
- TypeScript types: [packages/shared-types/types/offline-request.ts](../../packages/shared-types/types/offline-request.ts)
- Service code: [services/booking-service/src/services/offlineRequestService.ts](../../services/booking-service/src/services/offlineRequestService.ts)

---

## Questions?

For implementation questions or issues, refer to the full specification or contact the development team.
