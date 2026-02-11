# Offline Request Management API Documentation

## Overview

The Offline Request Management API enables customers and staff to handle booking modifications that require manual processing. This includes price changes, special requests, and complex modifications that cannot be processed automatically.

## State Machine Transitions

```
[PENDING_STAFF] 
    ↓ (submitPricing)
[PENDING_CUSTOMER_APPROVAL]
    ├→ (approveRequest with price difference) → [PAYMENT_PENDING]
    │                                              ↓ (recordPayment)
    │                                          [COMPLETED]
    └→ (approveRequest with no price diff) → [COMPLETED]
    
    ├→ (rejectRequest) → [REJECTED]
```

## Authentication

All endpoints require JWT authentication via `Authorization: Bearer <token>` header.

### User Roles

- **customer**: Can create requests, approve/reject pricing, view own requests
- **staff**: Can submit pricing, record payments, view queue, add notes
- **admin**: Full access to all endpoints

---

## Endpoints

### 1. Create Offline Request

**POST** `/api/offline-requests`

Creates a new offline change request.

**Authentication**: Required (any authenticated user)

**Request Body**:
```json
{
  "bookingId": "booking-id-123",
  "bookingRef": "BK-2026-001",
  "requestType": "hotel_change_request|flight_change|service_addition|other",
  "priority": "low|medium|high|urgent",
  "originalDetails": {
    "serviceName": "string",
    "pricing": {
      "baseFare": 500,
      "taxes": 50,
      "markup": 25,
      "totalPrice": 575
    },
    "additionalInfo": {}
  },
  "requestedChanges": {
    "field1": "new_value",
    "field2": "new_value"
  }
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "req-abc123",
    "requestRef": "REQ-2026-001",
    "bookingId": "booking-id-123",
    "status": "PENDING_STAFF",
    "requestType": "hotel_change_request",
    "priority": "high",
    "originalDetails": { ... },
    "requestedChanges": { ... },
    "timeline": {
      "createdAt": "2026-02-10T12:00:00Z"
    },
    "createdAt": "2026-02-10T12:00:00Z",
    "updatedAt": "2026-02-10T12:00:00Z"
  },
  "message": "Offline request REQ-2026-001 created successfully"
}
```

**Status Codes**:
- `201`: Request created successfully
- `400`: Missing or invalid fields
- `401`: Unauthorized

---

### 2. Get Offline Request by ID

**GET** `/api/offline-requests/:id`

Retrieves a specific offline request (customer can only view own requests).

**Authentication**: Required

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "req-abc123",
    "requestRef": "REQ-2026-001",
    "status": "PENDING_CUSTOMER_APPROVAL",
    "staffPricing": {
      "newBaseFare": 550,
      "newTaxes": 55,
      "newMarkup": 30,
      "newTotalPrice": 635,
      "staffNotes": "Premium room upgrade available"
    },
    "priceDifference": {
      "baseFareDiff": 50,
      "taxesDiff": 5,
      "markupDiff": 5,
      "totalDiff": 60,
      "currency": "USD"
    },
    "timeline": {
      "createdAt": "2026-02-10T12:00:00Z",
      "pricingSubmittedAt": "2026-02-10T12:30:00Z",
      "customerNotifiedAt": "2026-02-10T12:31:00Z"
    }
  }
}
```

**Status Codes**:
- `200`: Success
- `404`: Request not found
- `403`: Access denied

---

### 3. Get Offline Request by Reference

**GET** `/api/offline-requests/ref/:requestRef`

Retrieves a request by its reference number.

**Authentication**: Required

**Path Parameters**:
- `requestRef` (string): Reference number (e.g., REQ-2026-001)

**Response**: Same as endpoint #2

---

### 4. Get Customer's Requests

**GET** `/api/offline-requests/customer/my-requests`

Lists all offline requests for the authenticated customer's booking.

**Authentication**: Required

**Query Parameters**:
- `bookingId` (required): Booking ID filter
- `limit` (optional): Results per page (default: 50, max: 100)
- `offset` (optional): Pagination offset (default: 0)

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "total": 3,
    "requests": [
      { ... request object ... },
      { ... request object ... }
    ]
  }
}
```

**Status Codes**:
- `200`: Success
- `400`: Missing bookingId
- `401`: Unauthorized

---

### 5. Get Staff Queue

**GET** `/api/offline-requests/queue`

Lists pending offline requests for staff to process.

**Authentication**: Required (staff or admin only)

**Query Parameters**:
- `status` (optional): Filter by status (default: PENDING_STAFF)
  - Values: PENDING_STAFF, PENDING_CUSTOMER_APPROVAL, PAYMENT_PENDING, COMPLETED, REJECTED, CANCELLED
- `limit` (optional): Results per page (default: 50, max: 100)
- `offset` (optional): Pagination offset (default: 0)

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "total": 12,
    "items": [
      {
        "id": "req-abc123",
        "requestRef": "REQ-2026-001",
        "bookingRef": "BK-2026-001",
        "requestType": "hotel_change_request",
        "priority": "high",
        "createdAt": "2026-02-10T10:00:00Z"
      }
    ]
  }
}
```

**Status Codes**:
- `200`: Success
- `403`: Insufficient permissions

---

### 6. Submit Pricing (Staff Action)

**PUT** `/api/offline-requests/:id/pricing`

Staff submits pricing for the offline request. Request transitions to `PENDING_CUSTOMER_APPROVAL`.

**Authentication**: Required (staff or admin only)

**Request Body**:
```json
{
  "newBaseFare": 550,
  "newTaxes": 55,
  "newMarkup": 30,
  "newTotalPrice": 635,
  "currency": "USD",
  "staffNotes": "Premium room upgrade now available"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "req-abc123",
    "requestRef": "REQ-2026-001",
    "status": "PENDING_CUSTOMER_APPROVAL",
    "staffPricing": {
      "newBaseFare": 550,
      "newTaxes": 55,
      "newMarkup": 30,
      "newTotalPrice": 635,
      "staffNotes": "Premium room upgrade now available"
    },
    "priceDifference": {
      "baseFareDiff": 50,
      "taxesDiff": 5,
      "markupDiff": 5,
      "totalDiff": 60,
      "currency": "USD"
    },
    "timeline": {
      "pricingSubmittedAt": "2026-02-10T12:30:00Z",
      "customerNotifiedAt": "2026-02-10T12:31:00Z"
    }
  },
  "message": "Pricing submitted successfully"
}
```

**Status Codes**:
- `200`: Success
- `400`: Invalid pricing data
- `404`: Request not found
- `409`: Cannot submit pricing in current status
- `403`: Insufficient permissions

---

### 7. Customer Approves Request

**PUT** `/api/offline-requests/:id/approve`

Customer approves the pricing. Request transitions based on price difference:
- If additional payment required → `PAYMENT_PENDING`
- If no additional payment → `COMPLETED`

**Authentication**: Required

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "req-abc123",
    "requestRef": "REQ-2026-001",
    "status": "PAYMENT_PENDING",
    "customerApproval": {
      "approved": true,
      "approvedAt": "2026-02-10T13:00:00Z"
    },
    "timeline": {
      "customerApprovedAt": "2026-02-10T13:00:00Z"
    }
  },
  "message": "Request approved successfully"
}
```

**Status Codes**:
- `200`: Success
- `404`: Request not found
- `409`: Cannot approve in current status
- `403`: Access denied

---

### 8. Customer Rejects Request

**PUT** `/api/offline-requests/:id/reject`

Customer rejects the pricing. Request transitions to `REJECTED`.

**Authentication**: Required

**Request Body**:
```json
{
  "rejectionReason": "Price increase is too high; prefer to cancel instead"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "req-abc123",
    "status": "REJECTED",
    "customerApproval": {
      "approved": false,
      "rejectionReason": "Price increase is too high; prefer to cancel instead"
    }
  },
  "message": "Request rejected successfully"
}
```

**Status Codes**:
- `200`: Success
- `400`: Missing reason
- `404`: Request not found
- `409`: Cannot reject in current status

---

### 9. Record Payment (Staff Action)

**POST** `/api/offline-requests/:id/payment`

Records payment for approved request. Request transitions to `COMPLETED`.

**Authentication**: Required (staff or admin only)

**Request Body**:
```json
{
  "paymentId": "pay-12345",
  "amount": 60,
  "method": "credit_card|wallet|bank_transfer|other",
  "transactionRef": "txn-abc123"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "req-abc123",
    "status": "COMPLETED",
    "payment": {
      "paymentId": "pay-12345",
      "amount": 60,
      "currency": "USD",
      "method": "credit_card",
      "status": "completed",
      "paidAt": "2026-02-10T14:00:00Z",
      "transactionRef": "txn-abc123"
    },
    "timeline": {
      "paymentCompletedAt": "2026-02-10T14:00:00Z",
      "documentsIssuedAt": "2026-02-10T14:00:00Z",
      "completedAt": "2026-02-10T14:00:00Z"
    }
  },
  "message": "Payment recorded successfully"
}
```

**Status Codes**:
- `200`: Success
- `400`: Invalid payment data
- `404`: Request not found
- `409`: Wrong status for payment
- `403`: Insufficient permissions

---

### 10. Complete Request (Staff Action)

**PUT** `/api/offline-requests/:id/complete`

Marks request as completed with issued documents.

**Authentication**: Required (staff or admin only)

**Request Body**:
```json
{
  "documentUrls": [
    "https://cdn.example.com/new-itinerary.pdf",
    "https://cdn.example.com/new-voucher.pdf"
  ]
}
```

**Response** (200 OK):
Same as #9 with document URLs included.

---

### 11. Cancel Request

**PUT** `/api/offline-requests/:id/cancel`

Cancels an offline request.

**Authentication**: Required

**Request Body**:
```json
{
  "reason": "Customer changed mind; proceeding with original booking"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "req-abc123",
    "status": "CANCELLED"
  },
  "message": "Request cancelled successfully"
}
```

---

### 12. Add Internal Note

**POST** `/api/offline-requests/:id/notes`

Staff adds internal notes to the request.

**Authentication**: Required (staff or admin only)

**Request Body**:
```json
{
  "note": "Contacted hotel; room upgrade confirmed for Feb 15"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "req-abc123",
    "internalNotes": [
      "Initial request received",
      "Contacted hotel; room upgrade confirmed for Feb 15"
    ]
  },
  "message": "Note added successfully"
}
```

---

### 13. Get Audit Log

**GET** `/api/offline-requests/:id/audit`

Retrieves the audit trail for the request.

**Authentication**: Required

**Query Parameters**:
- `limit` (optional): Results per page (default: 100, max: 500)
- `offset` (optional): Pagination offset (default: 0)

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "total": 4,
    "logs": [
      {
        "id": "audit-1",
        "action": "CREATED",
        "actorId": "customer-id",
        "actorType": "customer",
        "oldValues": null,
        "newValues": { "status": "PENDING_STAFF" },
        "createdAt": "2026-02-10T12:00:00Z"
      },
      {
        "id": "audit-2",
        "action": "PRICING_SUBMITTED",
        "actorId": "staff-id",
        "actorType": "staff",
        "oldValues": { "status": "PENDING_STAFF" },
        "newValues": { "status": "PENDING_CUSTOMER_APPROVAL" },
        "createdAt": "2026-02-10T12:30:00Z"
      },
      {
        "id": "audit-3",
        "action": "APPROVED",
        "actorId": "customer-id",
        "actorType": "customer",
        "oldValues": { "status": "PENDING_CUSTOMER_APPROVAL" },
        "newValues": { "status": "PAYMENT_PENDING" },
        "createdAt": "2026-02-10T13:00:00Z"
      }
    ]
  }
}
```

---

## Error Handling

### Common Error Responses

**400 Bad Request**:
```json
{
  "error": "Invalid request",
  "message": "Missing required fields: newBaseFare, newTaxes, newMarkup"
}
```

**401 Unauthorized**:
```json
{
  "error": "Unauthorized",
  "message": "Token missing or invalid"
}
```

**403 Forbidden**:
```json
{
  "error": "Forbidden",
  "message": "Insufficient permissions for this action"
}
```

**404 Not Found**:
```json
{
  "error": "Not found",
  "message": "Offline request REQ-2026-001 not found"
}
```

**409 Conflict**:
```json
{
  "error": "State conflict",
  "message": "Cannot submit pricing for request in COMPLETED status"
}
```

**500 Internal Server Error**:
```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred"
}
```

---

## Workflow Example

### Complete Customer Journey

1. **Customer creates request** (POST /api/offline-requests)
   - Status: PENDING_STAFF
   - Staff is notified

2. **Staff reviews and submits pricing** (PUT /api/offline-requests/:id/pricing)
   - Status: PENDING_CUSTOMER_APPROVAL
   - Customer is notified with new pricing

3. **Customer approves pricing** (PUT /api/offline-requests/:id/approve)
   - Status: PAYMENT_PENDING (if price increase)
   - OR COMPLETED (if no price increase)

4. **Staff records payment** (POST /api/offline-requests/:id/payment)
   - Status: COMPLETED
   - Documents are issued
   - Customer receives updated booking

---

## Rate Limiting

- Unauthenticated: 10 requests/minute
- Authenticated: 100 requests/minute
- Staff endpoints: 500 requests/minute

---

## Pagination

All list endpoints support pagination:
- Default limit: 50
- Maximum limit: 100 (200 for audit logs)
- Use `offset` for pagination

---

## Timestamps

All timestamps are in ISO 8601 format (UTC):
- `2026-02-10T12:00:00Z`
- Format: `YYYY-MM-DDTHH:mm:ssZ`

---

## Status Codes Summary

| Status | Meaning | Next States |
|--------|---------|------------|
| PENDING_STAFF | Awaiting staff review | PENDING_CUSTOMER_APPROVAL |
| PENDING_CUSTOMER_APPROVAL | Awaiting customer decision | PAYMENT_PENDING, COMPLETED, REJECTED |
| PAYMENT_PENDING | Awaiting payment | COMPLETED |
| COMPLETED | Request finished | (terminal) |
| REJECTED | Customer rejected | (terminal) |
| CANCELLED | Request cancelled | (terminal) |

---

## Notifications

Customers receive notifications when:
- Request created (summary for staff)
- Pricing submitted (customer notification)
- Request approved (staff notification)
- Request rejected (staff notification)
- Payment completed (customer notification)
- Request cancelled (staff notification)

Notifications are queued asynchronously and delivered via configured channels (email, SMS, push).
