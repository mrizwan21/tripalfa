# Offline Request Management API Documentation

## Overview

The Offline Request Management API enables customers to submit change requests for their bookings (flights, hotels, etc.) that require staff intervention. These requests go through a structured workflow: submission → staff review → pricing approval → payment → completion.

## Architecture

### Request Lifecycle

```
PENDING_STAFF (REQUEST SUBMITTED)
    ↓
PRICING_SUBMITTED (STAFF REVIEW)
    ↓
PENDING_CUSTOMER_APPROVAL (PRICING AVAILABLE)
    ↓
PAYMENT_PENDING (AWAITING PAYMENT)
    ↓
COMPLETED (DOCUMENTS ISSUED)

Alternative paths:
- REJECTED (at any staff stage)
- CANCELLED (by customer before approval)
```

## API Endpoints

### Base URL
```
/api/offline-requests
```

### Authentication
All endpoints require Bearer token authentication:
```
Authorization: Bearer {token}
```

---

## Endpoints

### 1. Create Offline Request
**POST** `/api/offline-requests`

Create a new offline change request for a booking.

#### Request Body
```typescript
{
  bookingId: string;           // Unique booking identifier
  bookingRef: string;          // Booking reference number
  requestType: string;         // 'schedule_change' | 'booking_modification' | etc.
  priority?: string;           // 'low' | 'medium' | 'high' | 'critical'
  requestedChanges: {
    newItinerary?: any;        // New flight/hotel details
    changeReason: string;      // Reason for the change
    originalDetails?: any;     // Original booking details (optional)
  };
}
```

#### Example Request
```bash
curl -X POST http://localhost:3000/api/offline-requests \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": "booking-123",
    "bookingRef": "TRP-2024-001234",
    "requestType": "schedule_change",
    "priority": "medium",
    "requestedChanges": {
      "changeReason": "Personal schedule conflict",
      "newItinerary": {
        "departure": { "airport": "LHR", "time": "2024-03-20T14:15:00Z" },
        "arrival": { "airport": "DXB", "time": "2024-03-21T00:30:00Z" }
      }
    }
  }'
```

#### Response
```json
{
  "success": true,
  "data": {
    "id": "ocr-req-123",
    "requestRef": "OCR-2024-001234",
    "bookingId": "booking-123",
    "bookingRef": "TRP-2024-001234",
    "requestType": "schedule_change",
    "status": "pending_staff",
    "priority": "medium",
    "timeline": {
      "requestedAt": "2024-03-15T14:30:00Z"
    },
    "createdAt": "2024-03-15T14:30:00Z"
  },
  "message": "Offline request OCR-2024-001234 created successfully"
}
```

---

### 2. Get Offline Request
**GET** `/api/offline-requests/{id}`

Retrieve details of a specific offline request.

#### Path Parameters
- `id` (string): Request ID

#### Response
```json
{
  "success": true,
  "data": {
    "id": "ocr-req-123",
    "requestRef": "OCR-2024-001234",
    "bookingId": "booking-123",
    "bookingRef": "TRP-2024-001234",
    "requestType": "schedule_change",
    "status": "pending_customer_approval",
    "priority": "medium",
    "originalDetails": { /* pricing and booking details */ },
    "requestedChanges": { /* new itinerary and reason */ },
    "staffPricing": {
      "newBaseFare": 1150.00,
      "newTaxes": 230.00,
      "newMarkup": 50.00,
      "newTotalPrice": 1430.00,
      "currency": "USD"
    },
    "priceDifference": {
      "baseFareDiff": 170.00,
      "taxesDiff": 15.00,
      "totalDiff": 185.00
    },
    "timeline": {
      "requestedAt": "2024-03-15T14:30:00Z",
      "staffPricedAt": "2024-03-15T18:45:00Z"
    }
  }
}
```

---

### 3. Get Customer's Requests
**GET** `/api/offline-requests/customer/my-requests`

Retrieve all offline requests for a customer (filtered by bookingId).

#### Query Parameters
- `bookingId` (string, required): Booking identifier
- `limit` (number, optional): Results per page (default: 50, max: 100)
- `offset` (number, optional): Pagination offset (default: 0)

#### Response
```json
{
  "success": true,
  "data": {
    "items": [
      { /* request objects */ }
    ],
    "total": 5,
    "limit": 50,
    "offset": 0
  }
}
```

---

### 4. Staff: Submit Pricing (Staff Only)
**PUT** `/api/offline-requests/{id}/pricing`

Staff submits pricing for an offline change request.

**Required Role:** Staff

#### Request Body
```typescript
{
  newBaseFare: number;          // New base fare amount
  newTaxes: number;             // New taxes amount
  newMarkup: number;            // Service fee/markup
  newTotalPrice: number;        // Total price (required)
  currency: string;             // Currency code (e.g., 'USD')
  staffNotes?: string;          // Optional notes
  supplierReference?: string;   // Supplier booking reference
  supplierPNR?: string;         // Supplier PNR/confirmation
}
```

#### Example Request
```bash
curl -X PUT http://localhost:3000/api/offline-requests/ocr-req-123/pricing \
  -H "Authorization: Bearer STAFF_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "newBaseFare": 1150.00,
    "newTaxes": 230.00,
    "newMarkup": 50.00,
    "newTotalPrice": 1430.00,
    "currency": "USD",
    "staffNotes": "Confirmed with Emirates. New flight available.",
    "supplierReference": "EK005",
    "supplierPNR": "ABC123XYZ"
  }'
```

#### Response
```json
{
  "success": true,
  "data": {
    "id": "ocr-req-123",
    "status": "pending_customer_approval",
    "staffPricing": { /* pricing details */ },
    "timeline": {
      "staffPricedAt": "2024-03-15T18:45:00Z"
    }
  },
  "message": "Pricing submitted successfully"
}
```

---

### 5. Customer: Approve Pricing
**PUT** `/api/offline-requests/{id}/approve`

Customer approves the pricing and proceeds to payment.

#### Request Body
```typescript
{} // Empty body
```

#### Response
```json
{
  "success": true,
  "data": {
    "id": "ocr-req-123",
    "status": "payment_pending",
    "customerApproval": {
      "approved": true,
      "approvedAt": "2024-03-16T10:15:00Z"
    }
  },
  "message": "Request approved successfully"
}
```

---

### 6. Customer: Reject Pricing
**PUT** `/api/offline-requests/{id}/reject`

Customer rejects the pricing and cancels the request.

#### Request Body
```typescript
{
  rejectionReason: string;      // Reason for rejection
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "id": "ocr-req-123",
    "status": "rejected",
    "timeline": {
      "rejectedAt": "2024-03-16T10:20:00Z"
    }
  },
  "message": "Request rejected successfully"
}
```

---

### 7. Customer: Cancel Request
**PUT** `/api/offline-requests/{id}/cancel`

Customer cancels the request at any stage.

#### Request Body
```typescript
{
  reason: string;               // Reason for cancellation
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "status": "cancelled",
    "timeline": {
      "cancelledAt": "2024-03-16T10:25:00Z"
    }
  }
}
```

---

### 8. Process Payment
**POST** `/api/offline-requests/{id}/payment`

Record payment for an approved request.

#### Request Body
```typescript
{
  paymentMethod: string;        // 'credit_card' | 'wallet' | 'debit_card'
  amount: number;               // Payment amount
  currency: string;             // Currency code
  // Payment method details are handled by payment service
}
```

#### Example Request
```bash
curl -X POST http://localhost:3000/api/offline-requests/ocr-req-123/payment \
  -H "Authorization: Bearer CUSTOMER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "paymentMethod": "credit_card",
    "amount": 185.00,
    "currency": "USD"
  }'
```

#### Response
```json
{
  "success": true,
  "data": {
    "id": "ocr-req-123",
    "status": "completed",
    "payment": {
      "paymentId": "pay-456",
      "amount": 185.00,
      "method": "credit_card",
      "transactionRef": "TXN-20240316-7892",
      "paidAt": "2024-03-16T10:30:00Z"
    }
  },
  "transactionId": "TXN-20240316-7892"
}
```

---

### 9. Staff: Complete Request
**PUT** `/api/offline-requests/{id}/complete`

Mark request as completed and issue new documents.

**Required Role:** Staff

#### Request Body
```typescript
{
  documentUrls?: string[];      // URLs to new tickets/vouchers
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "id": "ocr-req-123",
    "status": "completed",
    "reissuedDocuments": {
      "ticketNumber": "0011234567890",
      "eticketUrl": "https://...",
      "invoiceUrl": "https://..."
    }
  }
}
```

---

### 10. Staff: Get Staff Queue
**GET** `/api/offline-requests/queue`

Get pending requests in staff queue.

**Required Role:** Staff

#### Query Parameters
- `status` (string, optional): Filter by status (default: 'pending_staff')
- `limit` (number, optional): Results per page (default: 50, max: 100)
- `offset` (number, optional): Pagination offset (default: 0)

#### Response
```json
{
  "success": true,
  "data": {
    "items": [
      { /* request objects */ }
    ],
    "total": 12,
    "limit": 50,
    "offset": 0
  }
}
```

---

### 11. Staff: Add Internal Note
**POST** `/api/offline-requests/{id}/notes`

Add internal notes to a request (visible only to staff).

**Required Role:** Staff

#### Request Body
```typescript
{
  note: string;                 // Internal note content
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "id": "ocr-req-123",
    "internalNotes": [
      "Confirmed with Emirates...",
      "Customer called at 2pm..."
    ]
  }
}
```

---

### 12. Get Audit Log
**GET** `/api/offline-requests/{id}/audit`

Get audit trail for a request.

#### Query Parameters
- `limit` (number, optional): Results per page (default: 100, max: 500)
- `offset` (number, optional): Pagination offset (default: 0)

#### Response
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "audit-1",
        "action": "CREATED",
        "actorId": "user-123",
        "actorType": "customer",
        "details": {
          "requestType": "schedule_change"
        },
        "createdAt": "2024-03-15T14:30:00Z"
      },
      {
        "id": "audit-2",
        "action": "PRICING_SUBMITTED",
        "actorId": "staff-456",
        "actorType": "staff",
        "newValues": {
          "status": "pending_customer_approval",
          "staffPricing": { /* pricing */ }
        },
        "createdAt": "2024-03-15T18:45:00Z"
      }
    ],
    "total": 4,
    "limit": 100,
    "offset": 0
  }
}
```

---

## Error Handling

### Common Error Responses

#### 400 Bad Request
```json
{
  "error": "Missing required fields",
  "message": "bookingId and bookingRef are required"
}
```

#### 404 Not Found
```json
{
  "error": "Not found",
  "message": "Offline request OCR-2024-001234 not found"
}
```

#### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Valid authentication token required"
}
```

#### 403 Forbidden
```json
{
  "error": "Forbidden",
  "message": "Staff role required for this operation"
}
```

#### 500 Server Error
```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred"
}
```

---

## Notifications

### Customer Notifications

The system automatically sends notifications at key stages:

1. **Request Submitted** (Email + In-App)
   - Confirmation that request was received
   - Request reference number

2. **Pricing Available** (Email + SMS + In-App)
   - Pricing details with comparison
   - CTA to approve or reject

3. **Payment Successful** (Email + In-App)
   - Confirmation of payment
   - Updated booking details

4. **Documents Ready** (Email with attachment)
   - New e-ticket or voucher
   - Updated invoice

### Notification Types

```typescript
'offline_request_submitted'      // Customer submitted a request
'offline_request_priced'         // Staff submitted pricing
'offline_request_approved'       // Customer approved pricing
'offline_request_payment_complete' // Payment processed
'offline_request_completed'      // Request finalized with documents
'offline_request_rejected'       // Customer rejected pricing
'offline_request_cancelled'      // Request cancelled
```

---

## Status Transitions

### Valid Status Transitions

```
pending_staff → pricing_submitted
pricing_submitted → pending_customer_approval OR rejected
pending_customer_approval → payment_pending OR rejected
payment_pending → completed OR rejected
rejected → (terminal)
cancelled → (terminal)
completed → (terminal)
```

---

## Rate Limits

- **Customer Endpoints:** 100 requests/hour per user
- **Staff Endpoints:** 500 requests/hour per staff member
- **Create Request:** Max 1 per booking per 24 hours

---

## Best Practices

### For Customers

1. Provide clear reason for change
2. Review pricing comparison carefully before approving
3. Keep request reference for follow-up inquiries
4. Check email for new documents after payment

### For Staff

1. Always add notes when submitting pricing
2. Verify supplier confirmation before pricing
3. Use supplier reference in pricing submission
4. Complete the request with document URLs

### For Developers

1. Always include proper error handling
2. Implement polling for status updates (max every 30 seconds)
3. Use WebSocket for real-time updates if available
4. Cache request data locally to reduce API calls
5. Handle network failures gracefully

---

## Frontend Integration Examples

### React Hook (Status Tracking)

```typescript
const useOfflineRequestStatus = (requestId: string) => {
  return useQuery({
    queryKey: ['offline-request', requestId],
    queryFn: () => offlineRequestApi.getRequest(requestId),
    refetchInterval: 30000, // Poll every 30 seconds
  });
};
```

### Component Usage

```tsx
import { OfflineRequestForm, RequestStatusTracker, PricingApprovalView, OfflineRequestPayment } from '@/components/OfflineRequests';

// Step 1: Submit Request
<OfflineRequestForm
  bookingId="booking-123"
  bookingRef="TRP-2024-001234"
  bookingType="flight"
  originalDetails={booking}
  onSuccess={(request) => navigate(`/requests/${request.id}`)}
/>

// Step 2: Track Status
<RequestStatusTracker
  requestId={requestId}
  autoRefresh={true}
  refreshInterval={30000}
/>

// Step 3: Approve Pricing
<PricingApprovalView
  request={request}
  onApproved={() => setStep('payment')}
/>

// Step 4: Process Payment
<OfflineRequestPayment
  request={request}
  amount={priceDifference}
  onSuccess={(txnId) => navigate('/success')}
/>
```

---

## Appendix: Request Types

- `schedule_change` - Change flight/hotel dates
- `passenger_name_change` - Correct passenger name
- `seat_selection` - Change seat assignment
- `ancillary_update` - Add/remove extras
- `booking_modification` - General booking changes
- `cancellation_with_rebooking` - Cancel and rebook

---

## Support

For issues or questions:
- Email: support@tripalfa.com
- API Status: https://status.tripalfa.com
- Documentation: https://docs.tripalfa.com
