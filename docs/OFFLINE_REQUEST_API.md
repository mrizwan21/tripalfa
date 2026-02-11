# Offline Request Management API Documentation

## Overview

The Offline Request Management API handles booking modifications (flights and hotels) that require manual staff intervention when API-based changes are not available. This system integrates with the existing TripAlfa services for notifications, document generation, and payment processing.

## Base URL

```
http://localhost:3001/api/offline-requests
```

## Authentication

All endpoints require authentication. Include the user ID in the request headers or JWT token.

## API Endpoints

### 1. Create Offline Request

**Endpoint:** `POST /api/offline-requests`

Create a new offline change request for a booking.

**Request Body:**
```json
{
  "bookingId": "string (required)",
  "bookingRef": "string (required)",
  "requestType": "flight_change | hotel_change | date_change | passenger_change | other (required)",
  "requestedChanges": {
    "serviceType": "flight | hotel (required)",
    "newItinerary": {
      // Flight or Hotel Itinerary object
    },
    "changeReason": "string (required)",
    "customerNotes": "string (optional)"
  },
  "priority": "low | medium | high | urgent (optional, default: medium)"
}
```

**Request Body Example (Flight Change):**
```json
{
  "bookingId": "123e4567-e89b-12d3-a456-426614174000",
  "bookingRef": "BK-2024-001234",
  "requestType": "flight_change",
  "requestedChanges": {
    "serviceType": "flight",
    "newItinerary": {
      "type": "flight",
      "segments": [
        {
          "origin": "LHR",
          "destination": "CDG",
          "departureDate": "2024-03-15T10:00:00Z",
          "arrivalDate": "2024-03-15T12:30:00Z",
          "airline": "BA",
          "flightNumber": "112",
          "cabinClass": "economy"
        }
      ],
      "passengers": [
        {
          "firstName": "John",
          "lastName": "Doe",
          "type": "adult",
          "dateOfBirth": "1990-01-01"
        }
      ]
    },
    "changeReason": "Customer wants to change flight due to work commitment",
    "customerNotes": "Please try to keep the same airline if possible"
  },
  "priority": "high"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "requestRef": "OCR-2024-001234",
    "bookingId": "123e4567-e89b-12d3-a456-426614174000",
    "bookingRef": "BK-2024-001234",
    "requestType": "flight_change",
    "status": "pending_staff",
    "priority": "high",
    "originalDetails": {...},
    "requestedChanges": {...},
    "timeline": {
      "requestedAt": "2024-02-10T12:00:00Z",
      "requestedBy": "user-id"
    },
    "tags": [],
    "internalNotes": [],
    "createdAt": "2024-02-10T12:00:00Z",
    "updatedAt": "2024-02-10T12:00:00Z"
  },
  "message": "Offline request OCR-2024-001234 created successfully"
}
```

---

### 2. Get Offline Request by ID

**Endpoint:** `GET /api/offline-requests/:id`

Retrieve details of a specific offline request by its ID.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "requestRef": "OCR-2024-001234",
    "bookingId": "123e4567-e89b-12d3-a456-426614174000",
    "bookingRef": "BK-2024-001234",
    "requestType": "flight_change",
    "status": "pending_staff",
    "priority": "high",
    "originalDetails": {...},
    "requestedChanges": {...},
    "timeline": {...},
    "tags": [],
    "internalNotes": [],
    "createdAt": "2024-02-10T12:00:00Z",
    "updatedAt": "2024-02-10T12:00:00Z"
  }
}
```

---

### 3. Get Offline Request by Reference

**Endpoint:** `GET /api/offline-requests/ref/:requestRef`

Retrieve details of a specific offline request by its reference number (e.g., OCR-2024-001234).

**Response (200 OK):**
Same as endpoint #2

---

### 4. Get Customer's Offline Requests

**Endpoint:** `GET /api/offline-requests/customer/my-requests`

Get all offline requests for a specific booking.

**Query Parameters:**
- `bookingId` (required): The booking ID to fetch requests for
- `limit` (optional, default: 50, max: 100): Number of items per page
- `offset` (optional, default: 0): Pagination offset

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "total": 5,
    "requests": [
      {
        "id": "uuid",
        "requestRef": "OCR-2024-001234",
        "bookingId": "123e4567-e89b-12d3-a456-426614174000",
        "bookingRef": "BK-2024-001234",
        "requestType": "flight_change",
        "status": "pending_customer_approval",
        "priority": "high",
        "originalDetails": {...},
        "requestedChanges": {...},
        "priceDifference": {
          "baseFareDiff": 50,
          "taxesDiff": 10,
          "markupDiff": 5,
          "totalDiff": 65,
          "currency": "USD"
        },
        "staffPricing": {...},
        "timeline": {...},
        "createdAt": "2024-02-10T12:00:00Z",
        "updatedAt": "2024-02-10T14:00:00Z"
      }
    ]
  }
}
```

---

### 5. Get Staff Queue

**Endpoint:** `GET /api/offline-requests/queue`

Retrieve the staff queue of pending offline requests (sorted by priority and creation date).

**Query Parameters:**
- `status` (optional, default: "pending_staff"): Filter by status
- `limit` (optional, default: 50, max: 100): Number of items per page
- `offset` (optional, default: 0): Pagination offset

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "total": 42,
    "items": [
      {
        "id": "uuid",
        "requestRef": "OCR-2024-001234",
        "bookingRef": "BK-2024-001234",
        "requestType": "flight_change",
        "status": "pending_staff",
        "priority": "urgent",
        "originalDetails": {...},
        "requestedChanges": {...},
        "timeline": {...},
        "createdAt": "2024-02-10T12:00:00Z",
        "updatedAt": "2024-02-10T12:00:00Z"
      }
    ]
  }
}
```

---

### 6. Submit Pricing

**Endpoint:** `PUT /api/offline-requests/:id/pricing`

Staff submits new pricing for the offline request. This moves the request to "pricing_submitted" status.

**Request Body:**
```json
{
  "newBaseFare": 1500.00 (required),
  "newTaxes": 300.00 (required),
  "newMarkup": 150.00 (required),
  "currency": "USD" (required),
  "supplierReference": "SUP-123456" (optional),
  "supplierPNR": "ABC123" (optional),
  "staffNotes": "New pricing includes additional fees" (optional)
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "requestRef": "OCR-2024-001234",
    "status": "pricing_submitted",
    "staffPricing": {
      "newBaseFare": 1500.00,
      "newTaxes": 300.00,
      "newMarkup": 150.00,
      "newTotalPrice": 1950.00,
      "currency": "USD",
      "supplierReference": "SUP-123456",
      "supplierPNR": "ABC123",
      "staffNotes": "New pricing includes additional fees",
      "pricedAt": "2024-02-10T14:00:00Z",
      "pricedBy": "staff-user-id"
    },
    "priceDifference": {
      "baseFareDiff": 50,
      "taxesDiff": 10,
      "markupDiff": 5,
      "totalDiff": 65,
      "currency": "USD"
    },
    "timeline": {
      "requestedAt": "2024-02-10T12:00:00Z",
      "staffPricedAt": "2024-02-10T14:00:00Z",
      "requestedBy": "customer-user-id"
    },
    "updatedAt": "2024-02-10T14:00:00Z"
  },
  "message": "Pricing submitted successfully"
}
```

---

### 7. Approve Request

**Endpoint:** `PUT /api/offline-requests/:id/approve`

Customer approves the pricing. Moves request to "approved" status.

**Request Body:**
```json
// No body required - can be empty {}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "requestRef": "OCR-2024-001234",
    "status": "approved",
    "customerApproval": {
      "approved": true,
      "approvedAt": "2024-02-10T15:00:00Z"
    },
    "timeline": {
      "requestedAt": "2024-02-10T12:00:00Z",
      "staffPricedAt": "2024-02-10T14:00:00Z",
      "customerApprovedAt": "2024-02-10T15:00:00Z",
      "requestedBy": "customer-user-id"
    },
    "updatedAt": "2024-02-10T15:00:00Z"
  },
  "message": "Request approved successfully"
}
```

---

### 8. Reject Request

**Endpoint:** `PUT /api/offline-requests/:id/reject`

Customer rejects the pricing. Moves request to "rejected" status.

**Request Body:**
```json
{
  "rejectionReason": "The price is too high" (required)
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "requestRef": "OCR-2024-001234",
    "status": "rejected",
    "customerApproval": {
      "approved": false,
      "rejectionReason": "The price is too high"
    },
    "updatedAt": "2024-02-10T15:00:00Z"
  },
  "message": "Request rejected successfully"
}
```

---

### 9. Record Payment

**Endpoint:** `POST /api/offline-requests/:id/payment`

Record payment for an approved request. Moves request to "payment_pending" status.

**Request Body:**
```json
{
  "paymentId": "PAY-2024-001234" (required),
  "amount": 65.00 (required),
  "method": "wallet | credit_card | supplier_credit" (required),
  "transactionRef": "TXN-123456789" (optional)
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "requestRef": "OCR-2024-001234",
    "status": "payment_pending",
    "payment": {
      "paymentId": "PAY-2024-001234",
      "amount": 65.00,
      "currency": "USD",
      "method": "wallet",
      "status": "completed",
      "paidAt": "2024-02-10T15:30:00Z",
      "transactionRef": "TXN-123456789"
    },
    "timeline": {
      "paymentCompletedAt": "2024-02-10T15:30:00Z"
    },
    "updatedAt": "2024-02-10T15:30:00Z"
  },
  "message": "Payment recorded successfully"
}
```

---

### 10. Complete Request

**Endpoint:** `PUT /api/offline-requests/:id/complete`

Mark the request as completed. Moves request to "completed" status.

**Request Body:**
```json
{
  "documentUrls": ["https://...", "https://..."] (optional array of document URLs)
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "requestRef": "OCR-2024-001234",
    "status": "completed",
    "reissuedDocuments": {
      "documentUrls": ["https://..."],
      "issuedAt": "2024-02-10T16:00:00Z"
    },
    "timeline": {
      "documentsIssuedAt": "2024-02-10T16:00:00Z",
      "completedAt": "2024-02-10T16:00:00Z"
    },
    "updatedAt": "2024-02-10T16:00:00Z"
  },
  "message": "Request completed successfully"
}
```

---

### 11. Cancel Request

**Endpoint:** `PUT /api/offline-requests/:id/cancel`

Cancel an offline request. Can only be done in specific statuses (pending_staff, pricing_submitted, pending_customer_approval).

**Request Body:**
```json
{
  "reason": "Customer changed their mind" (required)
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "requestRef": "OCR-2024-001234",
    "status": "cancelled",
    "updatedAt": "2024-02-10T16:30:00Z"
  },
  "message": "Request cancelled successfully"
}
```

---

### 12. Add Internal Note

**Endpoint:** `POST /api/offline-requests/:id/notes`

Add an internal note to the offline request (staff only).

**Request Body:**
```json
{
  "note": "Waiting for supplier response on availability" (required)
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "requestRef": "OCR-2024-001234",
    "internalNotes": [
      "[2024-02-10T16:45:00Z] staff-123: Waiting for supplier response on availability"
    ],
    "updatedAt": "2024-02-10T16:45:00Z"
  },
  "message": "Note added successfully"
}
```

---

### 13. Get Audit Log

**Endpoint:** `GET /api/offline-requests/:id/audit`

Retrieve the full audit log for an offline request.

**Query Parameters:**
- `limit` (optional, default: 100, max: 500): Number of items per page
- `offset` (optional, default: 0): Pagination offset

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "total": 8,
    "logs": [
      {
        "id": "uuid",
        "offlineRequestId": "uuid",
        "action": "created",
        "actorId": "customer-123",
        "actorType": "customer",
        "oldValues": null,
        "newValues": {
          "requestType": "flight_change",
          "status": "pending_staff"
        },
        "createdAt": "2024-02-10T12:00:00Z"
      },
      {
        "id": "uuid",
        "offlineRequestId": "uuid",
        "action": "pricing_submitted",
        "actorId": "staff-456",
        "actorType": "staff",
        "oldValues": {
          "status": "pending_staff"
        },
        "newValues": {
          "status": "pricing_submitted",
          "staffPricing": {...}
        },
        "createdAt": "2024-02-10T14:00:00Z"
      }
    ]
  }
}
```

---

## Status Transitions

The offline request follows this state flow:

```
pending_staff
    ↓
pricing_submitted → pending_customer_approval
                    ↓
                    approved → payment_pending → completed
                    ↓
                    rejected
                    
Can be cancelled from: pending_staff, pricing_submitted, pending_customer_approval
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Missing required fields",
  "message": "bookingId and bookingRef are required"
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "User ID is required"
}
```

### 404 Not Found
```json
{
  "error": "Not found",
  "message": "Offline request <id> not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal Server Error",
  "message": "An error occurred while processing your request"
}
```

---

## Rate Limiting

All endpoints are protected by rate limiting. Default limits:
- General endpoints: 100 requests per 15 minutes per IP
- Booking endpoints: 50 requests per 15 minutes per IP

---

## Pagination

List endpoints support pagination with:
- `limit`: Items per page (default: 50, max: 100)
- `offset`: Number of items to skip (default: 0)

---

## Authentication

Include authentication header in all requests:
```
Header: Authorization: Bearer <JWT_TOKEN>
```

Or include user ID in the request context (set via middleware).

---

## WebSocket Events (Future Enhancement)

For real-time updates on queue status:
```
socket.on('offline-request-updated', (data) => {
  // data: { requestId, status, updatedAt }
});
```

---

## Integration with External Services

### Notification Service
- Triggered on: request created, pricing submitted, customer approved, request completed
- Channels: Email, SMS, In-app, Push

### Document Generation Service
- Triggered on: request completed
- Generates: New E-tickets, Vouchers, Amendment invoices

### Payment Service
- Triggered on: customer approves (to process payment)
- Handles: Wallet charges, refunds for negative differences

---

## Best Practices

1. **Always include priority** when creating urgent requests
2. **Add internal notes** to track staff discussions
3. **Monitor queue regularly** to maintain SLA targets
4. **Use pagination** for large result sets
5. **Handle webhooks** for payment confirmation events

---

## FAQ

**Q: Can a customer cancel after approval?**
A: No, only staff can cancel after payment is initiated.

**Q: What if supplier confirms a lower price?**
A: Staff can update pricing, customer will receive a notification with the new price.

**Q: How long does processing typically take?**
A: 2-4 hours for standard requests, 30-60 minutes for urgent.

**Q: Is there a refund for rejected prices?**
A: Automatic refund is issued if payment was already made.
