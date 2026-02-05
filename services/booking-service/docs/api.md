# Booking Service API Documentation

## Overview

The Booking Service provides comprehensive booking management functionality for the TripAlfa platform. It supports flight, hotel, package, transfer, visa, and insurance bookings with full admin capabilities.

## Base URL

```
https://api.tripalfa.com/booking-service
```

## Authentication

All endpoints require authentication via JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

## Rate Limiting

- General endpoints: 100 requests per 15 minutes per IP
- Authentication endpoints: 5 requests per 15 minutes per IP
- Booking endpoints: 20 requests per 15 minutes per IP

## Response Format

All responses follow this format:

```json
{
  "success": boolean,
  "data": any,
  "error": string,
  "timestamp": string
}
```

## Endpoints

### Health Check

#### GET /health
Check service health and status.

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "service": "booking-service",
    "timestamp": "2026-01-29T01:57:00.000Z"
  }
}
```

### Booking Management

#### GET /bookings
Get paginated list of bookings.

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 10)
- `status` (string, optional): Filter by status
- `customer` (string, optional): Filter by customer ID
- `agent` (string, optional): Filter by agent ID
- `dateFrom` (string, optional): Filter bookings from date (ISO format)
- `dateTo` (string, optional): Filter bookings to date (ISO format)

**Response:**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "1",
        "reference": "BK-2026-001247",
        "segment": "FLIGHT",
        "status": "CONFIRMED",
        "paymentStatus": "PAID",
        "customerName": "John Smith",
        "customerEmail": "john.smith@email.com",
        "customerPhone": "+1 555-0123",
        "passengerCount": 2,
        "travelDate": "2026-02-15",
        "returnDate": "2026-02-22",
        "origin": "JFK",
        "destination": "DXB",
        "supplierName": "Emirates",
        "supplierPnr": "ABC123",
        "netAmount": 1100,
        "sellingAmount": 1250,
        "profit": 150,
        "currency": "USD",
        "agentName": "John Doe",
        "branchName": "Main Branch",
        "bookedAt": "2026-01-21T10:30:00Z",
        "remarks": "Business trip"
      }
    ],
    "pagination": {
      "total": 100,
      "page": 1,
      "limit": 10,
      "totalPages": 10
    }
  }
}
```

#### GET /bookings/:id
Get single booking by ID or reference.

**Path Parameters:**
- `id` (string): Booking ID or reference

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "1",
    "reference": "BK-2026-001247",
    "segment": "FLIGHT",
    "status": "CONFIRMED",
    "paymentStatus": "PAID",
    "customer": {
      "id": "customer123",
      "name": "John Smith",
      "email": "john.smith@email.com",
      "phone": "+1 555-0123",
      "type": "individual"
    },
    "serviceDetails": {
      "type": "flight",
      "segments": [
        {
          "id": "seg-001",
          "type": "flight",
          "departure": "JFK",
          "arrival": "DXB",
          "date": "2026-02-15",
          "details": {
            "airline": "Emirates",
            "flightNumber": "EK203",
            "class": "Economy"
          }
        }
      ],
      "supplier": {
        "id": "sup-001",
        "name": "Emirates",
        "pnr": "ABC123",
        "supplierRef": "EMR-20260215-001"
      }
    },
    "financials": {
      "customerPrice": 1250,
      "supplierPrice": 1100,
      "markup": 150,
      "taxes": 100,
      "fees": 0,
      "currency": "USD",
      "paymentMethod": "wallet",
      "profit": 150
    },
    "timeline": {
      "bookedAt": "2026-01-21T10:30:00Z",
      "travelDate": "2026-02-15",
      "returnDate": "2026-02-22",
      "holdUntil": null,
      "lastModified": "2026-01-21T10:30:00Z"
    },
    "adminFeatures": {
      "assignedAgent": "agent123",
      "branch": "Main Branch",
      "queueStatus": "pending",
      "priority": "medium",
      "tags": ["business", "urgent"],
      "notes": [
        {
          "id": "note-001",
          "content": "Customer requested extra legroom",
          "author": "agent123",
          "createdAt": "2026-01-21T10:35:00Z"
        }
      ],
      "auditTrail": [
        {
          "id": "audit-001",
          "action": "status_change",
          "actor": "agent123",
          "timestamp": "2026-01-21T10:30:00Z",
          "details": {
            "previousStatus": "PENDING",
            "newStatus": "CONFIRMED"
          }
        }
      ]
    }
  }
}
```

#### POST /bookings
Create a new booking.

**Request Body:**
```json
{
  "type": "flight",
  "details": {
    "origin": "JFK",
    "destination": "DXB",
    "travelDate": "2026-02-15",
    "returnDate": "2026-02-22",
    "passengers": [
      {
        "firstName": "John",
        "lastName": "Smith",
        "type": "adult",
        "dateOfBirth": "1985-05-15"
      }
    ]
  },
  "customerName": "John Smith",
  "customerEmail": "john.smith@email.com",
  "customerPhone": "+1 555-0123",
  "paymentMethod": "wallet",
  "remarks": "Business trip"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "6",
    "reference": "BK-2026-001252",
    "segment": "FLIGHT",
    "status": "CONFIRMED",
    "paymentStatus": "PAID",
    "customerName": "John Smith",
    "customerEmail": "john.smith@email.com",
    "customerPhone": "+1 555-0123",
    "passengerCount": 1,
    "travelDate": "2026-02-15",
    "returnDate": "2026-02-22",
    "origin": "JFK",
    "destination": "DXB",
    "supplierName": "Direct",
    "supplierPnr": "DIRABC123",
    "netAmount": 1000,
    "sellingAmount": 1150,
    "profit": 150,
    "currency": "USD",
    "agentName": "System",
    "branchName": "Main Branch",
    "bookedAt": "2026-01-29T01:57:00Z",
    "remarks": "Business trip"
  }
}
```

#### POST /bookings/:id/cancel
Cancel a booking.

**Path Parameters:**
- `id` (string): Booking ID or reference

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "1",
    "reference": "BK-2026-001247",
    "status": "CANCELLED",
    "paymentStatus": "REFUNDED",
    "timeline": {
      "lastModified": "2026-01-29T01:57:00Z"
    }
  }
}
```

### Shopping Cart Management

#### GET /cart
Get user's shopping cart.

**Query Parameters:**
- `userId` (string, optional): User ID
- `sessionId` (string, optional): Session ID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "cart-001",
    "userId": "user123",
    "sessionId": "session-abc123",
    "items": [
      {
        "id": "item-001",
        "type": "flight",
        "productId": "FL001",
        "quantity": 2,
        "unitPrice": 450,
        "totalPrice": 900,
        "details": {
          "airline": "Emirates",
          "route": "JFK-DXB",
          "date": "2026-02-15",
          "class": "Economy"
        },
        "addedAt": "2026-01-21T10:00:00Z"
      }
    ],
    "subtotal": 1080,
    "taxes": 108,
    "fees": 25,
    "total": 1213,
    "currency": "USD",
    "expiresAt": "2026-01-22T10:00:00Z",
    "createdAt": "2026-01-21T10:00:00Z",
    "updatedAt": "2026-01-21T10:05:00Z"
  }
}
```

#### POST /cart/items
Add item to cart.

**Request Body:**
```json
{
  "userId": "user123",
  "type": "flight",
  "productId": "FL001",
  "quantity": 2,
  "unitPrice": 450,
  "details": {
    "airline": "Emirates",
    "route": "JFK-DXB",
    "date": "2026-02-15",
    "class": "Economy"
  }
}
```

#### PUT /cart/items/:itemId
Update cart item.

**Request Body:**
```json
{
  "userId": "user123",
  "quantity": 3,
  "details": {
    "class": "Business"
  }
}
```

#### DELETE /cart/items/:itemId
Remove item from cart.

#### DELETE /cart
Clear entire cart.

#### GET /cart/summary
Get cart summary for checkout.

**Response:**
```json
{
  "success": true,
  "data": {
    "itemCount": 2,
    "subtotal": 1080,
    "taxes": 108,
    "fees": 25,
    "total": 1213,
    "currency": "USD",
    "items": [
      {
        "id": "item-001",
        "type": "flight",
        "productId": "FL001",
        "quantity": 2,
        "unitPrice": 450,
        "totalPrice": 900
      }
    ]
  }
}
```

#### POST /cart/checkout
Checkout cart and create booking.

**Request Body:**
```json
{
  "userId": "user123",
  "customerInfo": {
    "name": "John Smith",
    "email": "john.smith@email.com",
    "phone": "+1 555-0123"
  },
  "paymentInfo": {
    "method": "wallet",
    "amount": 1213
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "booking": {
      "id": "6",
      "reference": "BK-2026-001252",
      "status": "CONFIRMED",
      "paymentStatus": "PAID",
      "customerName": "John Smith",
      "customerEmail": "john.smith@email.com",
      "customerPhone": "+1 555-0123",
      "travelDate": "2026-02-15",
      "origin": "JFK",
      "destination": "DXB",
      "netAmount": 1080,
      "sellingAmount": 1213,
      "profit": 133,
      "currency": "USD"
    },
    "payment": {
      "amount": 1213,
      "currency": "USD",
      "status": "completed",
      "transactionId": "TXNABC123456"
    }
  }
}
```

### Admin Features

#### GET /admin/bookings
Get bookings with admin features (requires admin role).

**Query Parameters:**
- `page` (number, optional): Page number
- `limit` (number, optional): Items per page
- `status` (array, optional): Filter by statuses
- `queueType` (string, optional): Filter by queue type
- `priority` (string, optional): Filter by priority
- `agentId` (string, optional): Filter by agent
- `branchId` (string, optional): Filter by branch
- `tags` (array, optional): Filter by tags

#### POST /admin/bookings/:id/status
Update booking status (requires admin role).

**Request Body:**
```json
{
  "status": "CONFIRMED",
  "reason": "Supplier confirmed availability"
}
```

#### POST /admin/bookings/:id/assign
Assign booking to agent (requires admin role).

**Request Body:**
```json
{
  "agentId": "agent123",
  "reason": "Special handling required"
}
```

#### POST /admin/bookings/:id/tags
Add tags to booking (requires admin role).

**Request Body:**
```json
{
  "tags": ["business", "urgent", "vip"]
}
```

#### POST /admin/bookings/:id/notes
Add note to booking (requires admin role).

**Request Body:**
```json
{
  "content": "Customer requested extra legroom and meal preferences",
  "author": "agent123"
}
```

### Metrics and Monitoring

#### GET /metrics
Get application metrics (requires admin role).

**Response:**
```json
{
  "success": true,
  "data": {
    "requests": {
      "total": 1500,
      "successful": 1450,
      "failed": 50,
      "byEndpoint": {
        "/bookings": 300,
        "/cart": 200,
        "/health": 1000
      },
      "byMethod": {
        "GET": 1200,
        "POST": 250,
        "PUT": 30,
        "DELETE": 20
      },
      "byStatus": {
        "200": 1450,
        "400": 30,
        "404": 15,
        "500": 5
      }
    },
    "performance": {
      "avgResponseTime": 245.6,
      "minResponseTime": 12.3,
      "maxResponseTime": 2150.8
    },
    "errors": {
      "total": 50,
      "byType": {
        "ValidationError": 30,
        "NotFoundError": 15,
        "ServerError": 5
      },
      "recent": [
        {
          "timestamp": "2026-01-29T01:56:00Z",
          "error": "ValidationError",
          "endpoint": "/bookings",
          "method": "POST"
        }
      ]
    },
    "cache": {
      "hits": 850,
      "misses": 150,
      "hitRate": 85.0
    },
    "database": {
      "queries": 1200,
      "avgQueryTime": 45.2,
      "slowQueries": [
        {
          "query": "SELECT * FROM bookings WHERE status = 'PENDING'",
          "duration": 1200,
          "timestamp": "2026-01-29T01:55:00Z"
        }
      ]
    }
  }
}
```

#### GET /health
Get detailed health check.

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "uptime": 3600000,
    "timestamp": "2026-01-29T01:57:00Z",
    "services": {
      "database": {
        "status": "connected",
        "latency": 15
      },
      "cache": {
        "status": "connected",
        "hitRate": 85.0
      },
      "memory": {
        "usage": 104857600,
        "limit": 536870912,
        "percentage": 19.5
      },
      "cpu": {
        "usage": 150000
      }
    }
  }
}
```

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Invalid request parameters",
  "details": {
    "field": "customerEmail",
    "message": "Email is required"
  }
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Booking not found"
}
```

### 429 Too Many Requests
```json
{
  "success": false,
  "error": "Too many requests from this IP, please try again later.",
  "retryAfter": 900
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Internal server error"
}
```

## Webhook Events

The booking service emits the following webhook events:

### booking.created
Emitted when a new booking is created.

**Payload:**
```json
{
  "event": "booking.created",
  "data": {
    "bookingId": "BK-2026-001252",
    "customerId": "customer123",
    "amount": 1213,
    "currency": "USD",
    "timestamp": "2026-01-29T01:57:00Z"
  }
}
```

### booking.status_changed
Emitted when booking status changes.

**Payload:**
```json
{
  "event": "booking.status_changed",
  "data": {
    "bookingId": "BK-2026-001252",
    "previousStatus": "PENDING",
    "newStatus": "CONFIRMED",
    "reason": "Supplier confirmed availability",
    "timestamp": "2026-01-29T01:57:00Z"
  }
}
```

### booking.cancelled
Emitted when a booking is cancelled.

**Payload:**
```json
{
  "event": "booking.cancelled",
  "data": {
    "bookingId": "BK-2026-001252",
    "reason": "Customer requested cancellation",
    "refundAmount": 1213,
    "timestamp": "2026-01-29T01:57:00Z"
  }
}
```

## SDK Examples

### JavaScript/Node.js
```javascript
const axios = require('axios');

const api = axios.create({
  baseURL: 'https://api.tripalfa.com/booking-service',
  headers: {
    'Authorization': 'Bearer your-jwt-token',
    'Content-Type': 'application/json'
  }
});

// Get bookings
const getBookings = async (page = 1, limit = 10) => {
  const response = await api.get(`/bookings?page=${page}&limit=${limit}`);
  return response.data;
};

// Create booking
const createBooking = async (bookingData) => {
  const response = await api.post('/bookings', bookingData);
  return response.data;
};

// Add to cart
const addToCart = async (cartItem) => {
  const response = await api.post('/cart/items', cartItem);
  return response.data;
};
```

### Python
```python
import requests
import json

class BookingServiceClient:
    def __init__(self, base_url, api_key):
        self.base_url = base_url
        self.headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        }
    
    def get_bookings(self, page=1, limit=10):
        response = requests.get(
            f'{self.base_url}/bookings',
            headers=self.headers,
            params={'page': page, 'limit': limit}
        )
        return response.json()
    
    def create_booking(self, booking_data):
        response = requests.post(
            f'{self.base_url}/bookings',
            headers=self.headers,
            json=booking_data
        )
        return response.json()
```

## Versioning

The API follows semantic versioning. The current version is v1.

- **Breaking changes**: Will increment the major version (v2, v3, etc.)
- **New features**: Will increment the minor version (v1.1, v1.2, etc.)
- **Bug fixes**: Will increment the patch version (v1.0.1, v1.0.2, etc.)

## Changelog

### v1.0.0 (2026-01-29)
- Initial release
- Booking CRUD operations
- Shopping cart management
- Admin features
- Metrics and monitoring
- Webhook events
- Comprehensive error handling
- Rate limiting and security measures

## Support

For API support and questions:
- Email: api-support@tripalfa.com
- Documentation: https://docs.tripalfa.com/api
- Status: https://status.tripalfa.com