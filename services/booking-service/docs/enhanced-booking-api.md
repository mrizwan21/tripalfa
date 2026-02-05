# Enhanced Booking Management API Documentation

## Overview

This document provides comprehensive API documentation for the Enhanced Booking Management System, designed specifically for B2B admin booking capabilities. The API supports advanced booking workflows, queue management, GDS integration, and document generation.

## Base URL

```
https://api.tripalfa.com/v1/bookings
```

## Authentication

All endpoints require authentication via JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Rate Limiting

- **Rate Limit**: 100 requests per minute per user
- **Burst Limit**: 20 requests per second

## Response Format

All responses follow this standard format:

```json
{
  "success": boolean,
  "data": object | array | null,
  "error": string | null,
  "meta": {
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "req_1234567890"
  }
}
```

## Error Responses

```json
{
  "success": false,
  "data": null,
  "error": "Error description",
  "meta": {
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "req_1234567890"
  }
}
```

## Endpoints

### 1. Create Booking

Create a new booking with enhanced B2B/B2C support.

**POST** `/bookings`

#### Request Body

```json
{
  "type": "flight",
  "customerType": "B2B",
  "customerId": "user_123",
  "companyId": "company_456",
  "branchId": "branch_789",
  "productId": "product_abc",
  "supplierId": "supplier_xyz",
  "serviceDetails": {
    "segments": [
      {
        "from": "LHR",
        "to": "DXB",
        "airline": "Emirates",
        "flightNo": "EK-02",
        "date": "2024-05-15",
        "duration": "7h 15m"
      }
    ]
  },
  "passengers": [
    {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "phone": "+1234567890",
      "dateOfBirth": "1985-06-15",
      "passportNumber": "AB123456",
      "nationality": "US",
      "type": "adult"
    }
  ],
  "pricing": {
    "customerPrice": 1240.50,
    "supplierPrice": 1100.00,
    "markup": 140.50,
    "currency": "USD",
    "taxes": 50.00,
    "fees": 90.50
  },
  "payment": {
    "method": "wallet",
    "amount": 1240.50,
    "currency": "USD",
    "supplierPayment": {
      "method": "credit",
      "terms": "Net 30",
      "creditLimit": 50000
    }
  },
  "specialRequests": ["Window seat", "Vegetarian meal"],
  "metadata": {
    "gdsType": "amadeus",
    "bookingType": "instant"
  }
}
```

#### Response

```json
{
  "success": true,
  "data": {
    "id": "booking_123",
    "bookingRef": "B2B-1234567890-ABC",
    "confirmationNumber": "XA882J",
    "type": "flight",
    "status": "confirmed",
    "customerType": "B2B",
    "customerId": "user_123",
    "companyId": "company_456",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z",
    "pricing": {
      "customerPrice": 1240.50,
      "currency": "USD"
    },
    "payment": {
      "status": "completed",
      "method": "wallet"
    }
  }
}
```

### 2. Import Booking from GDS

Import an existing booking from a GDS system.

**POST** `/bookings/import`

#### Request Body

```json
{
  "gdsType": "amadeus",
  "pnr": "ABC123",
  "supplierRef": "AM-123456"
}
```

#### Response

```json
{
  "success": true,
  "data": {
    "id": "booking_456",
    "bookingRef": "IMPORT-1234567890-DEF",
    "confirmationNumber": "ABC123",
    "type": "flight",
    "status": "imported",
    "customerType": "B2B",
    "importedAt": "2024-01-15T10:30:00Z",
    "importedBy": "admin_user",
    "metadata": {
      "gdsType": "amadeus",
      "supplierRef": "AM-123456"
    }
  }
}
```

### 3. Search Bookings

Search bookings with advanced filtering capabilities.

**GET** `/bookings/search`

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `customerId` | string | Yes | Customer ID |
| `status` | string | No | Booking status (pending, confirmed, hold, cancelled, refunded, amended, imported, ticketed) |
| `type` | string | No | Service type (flight, hotel, package) |
| `customerType` | string | No | Customer type (B2B, B2C) |
| `companyId` | string | No | Company ID |
| `branchId` | string | No | Branch ID |
| `supplierId` | string | No | Supplier ID |
| `startDate` | string | No | Start date (YYYY-MM-DD) |
| `endDate` | string | No | End date (YYYY-MM-DD) |
| `minPrice` | number | No | Minimum price |
| `maxPrice` | number | No | Maximum price |
| `page` | number | No | Page number (default: 1) |
| `limit` | number | No | Items per page (default: 20) |
| `sortBy` | string | No | Sort field (createdAt, updatedAt, price, status) |
| `sortOrder` | string | No | Sort order (asc, desc) |

#### Response

```json
{
  "success": true,
  "data": {
    "bookings": [
      {
        "id": "booking_123",
        "bookingRef": "B2B-1234567890-ABC",
        "confirmationNumber": "XA882J",
        "type": "flight",
        "status": "confirmed",
        "customerType": "B2B",
        "customerId": "user_123",
        "pricing": {
          "customerPrice": 1240.50,
          "currency": "USD"
        },
        "createdAt": "2024-01-15T10:30:00Z",
        "updatedAt": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8
    }
  }
}
```

### 4. Process Queue

Process items in various booking queues.

**POST** `/bookings/queue/:queueType/:bookingId/:action`

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `queueType` | string | Queue type (hold, refund, special-requests, amendment, website-booking, rejected) |
| `bookingId` | string | Booking ID |
| `action` | string | Action to perform (approve, reject, process) |

#### Request Body

```json
{
  "reason": "Booking confirmed by customer"
}
```

#### Response

```json
{
  "success": true,
  "data": {
    "id": "booking_123",
    "status": "confirmed",
    "queueStatus": "completed",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

### 5. Process Payment

Process payment for a booking.

**POST** `/bookings/:bookingId/payment`

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `bookingId` | string | Booking ID |

#### Request Body

```json
{
  "amount": 1240.50,
  "paymentMethod": "credit_card",
  "notes": "Payment for booking confirmation"
}
```

#### Response

```json
{
  "success": true,
  "data": {
    "id": "booking_123",
    "payment": {
      "status": "completed",
      "method": "credit_card",
      "amount": 1240.50,
      "currency": "USD"
    },
    "transactions": [
      {
        "id": "txn_123",
        "amount": 1240.50,
        "method": "credit_card",
        "status": "completed",
        "timestamp": "2024-01-15T10:30:00Z",
        "transactionId": "CC-1234567890"
      }
    ]
  }
}
```

### 6. Process Refund

Process a refund for a booking.

**POST** `/bookings/:bookingId/refund`

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `bookingId` | string | Booking ID |

#### Request Body

```json
{
  "refundType": "full",
  "reason": "Customer cancellation",
  "amount": 1240.50,
  "refundTo": "original"
}
```

#### Response

```json
{
  "success": true,
  "data": {
    "id": "booking_123",
    "refunds": [
      {
        "id": "refund_123",
        "amount": 1240.50,
        "reason": "Customer cancellation",
        "type": "full",
        "status": "pending",
        "timestamp": "2024-01-15T10:30:00Z",
        "processedBy": "admin_user"
      }
    ]
  }
}
```

### 7. Process Amendment

Process an amendment request for a booking.

**POST** `/bookings/:bookingId/amendment`

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `bookingId` | string | Booking ID |

#### Request Body

```json
{
  "changes": {
    "flightDate": "2024-06-15",
    "passengerName": "Jane Doe"
  },
  "reason": "Change of travel dates",
  "priceDifference": 150.00
}
```

#### Response

```json
{
  "success": true,
  "data": {
    "id": "booking_123",
    "amendments": [
      {
        "id": "amendment_123",
        "changes": {
          "flightDate": "2024-06-15",
          "passengerName": "Jane Doe"
        },
        "reason": "Change of travel dates",
        "priceDifference": 150.00,
        "status": "pending",
        "createdAt": "2024-01-15T10:30:00Z",
        "approvedAt": null,
        "approvedBy": null
      }
    ]
  }
}
```

### 8. Issue Ticket

Issue ticket or voucher for a hold booking.

**POST** `/bookings/:bookingId/issue-ticket`

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `bookingId` | string | Booking ID |

#### Request Body

```json
{
  "ticketDetails": {
    "ticketNumber": "TKT-123456",
    "issueDate": "2024-01-15T10:30:00Z",
    "validity": "2024-12-31"
  }
}
```

#### Response

```json
{
  "success": true,
  "data": {
    "id": "booking_123",
    "status": "ticketed",
    "ticketDetails": {
      "ticketNumber": "TKT-123456",
      "issueDate": "2024-01-15T10:30:00Z",
      "validity": "2024-12-31"
    },
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

### 9. Get Booking History

Retrieve complete history for a booking.

**GET** `/bookings/:bookingId/history`

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `bookingId` | string | Booking ID |

#### Response

```json
{
  "success": true,
  "data": {
    "history": [
      {
        "id": "history_123",
        "bookingId": "booking_123",
        "action": "Booking Created",
        "description": "Initial booking created by admin",
        "performedBy": "admin_user",
        "timestamp": "2024-01-15T10:30:00Z",
        "details": {
          "bookingType": "instant",
          "customerType": "B2B"
        },
        "ipAddress": "192.168.1.1",
        "userAgent": "Mozilla/5.0..."
      }
    ]
  }
}
```

### 10. Get Booking Documents

Retrieve all documents for a booking.

**GET** `/bookings/:bookingId/documents`

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `bookingId` | string | Booking ID |

#### Response

```json
{
  "success": true,
  "data": {
    "documents": [
      {
        "id": "doc_123",
        "bookingId": "booking_123",
        "type": "invoice",
        "fileName": "Invoice_B2B-1234567890-ABC.pdf",
        "fileUrl": "https://storage.example.com/documents/Invoice_B2B-1234567890-ABC.pdf",
        "mimeType": "application/pdf",
        "size": 1024000,
        "generatedAt": "2024-01-15T10:30:00Z",
        "generatedBy": "system",
        "status": "generated",
        "sentTo": ["customer@example.com"],
        "downloadCount": 2
      }
    ]
  }
}
```

### 11. Send Document

Send a document to a customer via email.

**POST** `/documents/:documentId/send`

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `documentId` | string | Document ID |

#### Request Body

```json
{
  "email": "customer@example.com"
}
```

#### Response

```json
{
  "success": true,
  "data": {
    "sent": true,
    "email": "customer@example.com",
    "sentAt": "2024-01-15T10:30:00Z"
  }
}
```

### 12. Download Document

Download a booking document.

**GET** `/documents/:documentId/download`

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `documentId` | string | Document ID |

#### Response

Returns the document file as a binary stream with appropriate headers:
- Content-Type: application/pdf
- Content-Disposition: attachment; filename="document_name.pdf"

## Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 422 | Unprocessable Entity |
| 429 | Too Many Requests |
| 500 | Internal Server Error |

## Webhook Events

The system supports webhook notifications for booking events:

### Event Types

- `booking.created` - New booking created
- `booking.confirmed` - Booking confirmed
- `booking.cancelled` - Booking cancelled
- `booking.refunded` - Booking refunded
- `booking.amended` - Booking amended
- `payment.completed` - Payment completed
- `payment.failed` - Payment failed
- `document.generated` - Document generated

### Webhook Payload

```json
{
  "event": "booking.confirmed",
  "data": {
    "bookingId": "booking_123",
    "bookingRef": "B2B-1234567890-ABC",
    "status": "confirmed",
    "timestamp": "2024-01-15T10:30:00Z"
  },
  "metadata": {
    "eventId": "evt_1234567890",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

## SDK Examples

### JavaScript/Node.js

```javascript
const axios = require('axios');

const api = axios.create({
  baseURL: 'https://api.tripalfa.com/v1/bookings',
  headers: {
    'Authorization': 'Bearer your-jwt-token',
    'Content-Type': 'application/json'
  }
});

// Create a booking
const createBooking = async (bookingData) => {
  try {
    const response = await api.post('/', bookingData);
    return response.data;
  } catch (error) {
    console.error('Error creating booking:', error.response.data);
    throw error;
  }
};

// Search bookings
const searchBookings = async (params) => {
  try {
    const response = await api.get('/search', { params });
    return response.data;
  } catch (error) {
    console.error('Error searching bookings:', error.response.data);
    throw error;
  }
};
```

### Python

```python
import requests

class BookingAPI:
    def __init__(self, base_url, api_key):
        self.base_url = base_url
        self.headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        }
    
    def create_booking(self, booking_data):
        response = requests.post(
            f'{self.base_url}/bookings',
            json=booking_data,
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()
    
    def search_bookings(self, params):
        response = requests.get(
            f'{self.base_url}/bookings/search',
            params=params,
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()
```

## Testing

### Test Environment

Use the test environment for development and testing:

```
https://test-api.tripalfa.com/v1/bookings
```

### Test Data

Test credentials and sample data are available in the development documentation.

## Support

For API support and questions:
- Email: api-support@tripalfa.com
- Documentation: https://docs.tripalfa.com
- Status Page: https://status.tripalfa.com