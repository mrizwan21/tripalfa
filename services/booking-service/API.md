# Booking Service API Documentation

## Overview

The Booking Service provides RESTful APIs for managing travel bookings including flights, hotels, and packages. This service handles the complete booking lifecycle from creation to cancellation.

## Base URL

```
http://localhost:3001/api/bookings
```

## Authentication

All endpoints require authentication via JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

## Endpoints

### 1. Create Booking

Create a new booking for flight, hotel, or package.

**POST** `/api/bookings`

#### Request Body

```json
{
  "type": "flight|hotel|package",
  "totalAmount": 250.00,
  "serviceFee": 10.00,
  "passengers": [
    {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "dateOfBirth": "1990-01-01",
      "passportNumber": "AB123456"
    }
  ],
  "flightDetails": {
    "flightNumber": "AA100",
    "origin": "JFK",
    "destination": "LAX",
    "departureTime": "2026-02-15T10:00:00Z",
    "arrivalTime": "2026-02-15T13:00:00Z",
    "cabinClass": "economy|business|first"
  },
  "hotelDetails": {
    "hotelName": "Grand Plaza Hotel",
    "hotelCode": "GP001",
    "checkInDate": "2026-03-01",
    "checkOutDate": "2026-03-05",
    "numberOfRooms": 1,
    "roomType": "deluxe|standard|suite"
  },
  "supplierData": {
    "supplierId": "supplier123",
    "supplierReference": "REF123456"
  }
}
```

#### Response (201 Created)

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "type": "flight",
    "status": "confirmed",
    "userId": "user123",
    "totalAmount": 250.00,
    "serviceFee": 10.00,
    "passengers": [
      {
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com",
        "phone": "+1234567890",
        "dateOfBirth": "1990-01-01",
        "passportNumber": "AB123456"
      }
    ],
    "flightDetails": {
      "flightNumber": "AA100",
      "origin": "JFK",
      "destination": "LAX",
      "departureTime": "2026-02-15T10:00:00Z",
      "arrivalTime": "2026-02-15T13:00:00Z",
      "cabinClass": "economy"
    },
    "confirmationNumber": "TK-1708444800-ABC123",
    "createdAt": "2024-01-10T10:00:00Z",
    "updatedAt": "2024-01-10T10:00:00Z"
  }
}
```

#### Validation Rules

- `type`: Required, must be one of: flight, hotel, package
- `totalAmount`: Required, positive number
- `serviceFee`: Optional, minimum 0 (defaults to 0)
- `passengers`: Required, minimum 1 passenger
  - `firstName`: Required, 2-50 characters
  - `lastName`: Required, 2-50 characters
  - `email`: Required, valid email format
  - `phone`: Required, valid phone number format
  - `dateOfBirth`: Required, ISO date format
  - `passportNumber`: Optional
- `flightDetails`: Required when type is 'flight'
- `hotelDetails`: Required when type is 'hotel'

### 2. Get Booking by ID

Retrieve a specific booking by its ID.

**GET** `/api/bookings/:id`

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "type": "flight",
    "status": "confirmed",
    "userId": "user123",
    "totalAmount": 250.00,
    "serviceFee": 10.00,
    "passengers": [...],
    "flightDetails": {...},
    "confirmationNumber": "TK-1708444800-ABC123",
    "createdAt": "2024-01-10T10:00:00Z",
    "updatedAt": "2024-01-10T10:00:00Z"
  }
}
```

#### Error Responses

- `404 Not Found`: Booking not found
- `400 Bad Request`: Invalid booking ID format

### 3. Cancel Booking

Cancel an existing booking.

**PUT** `/api/bookings/:id/cancel`

#### Request Body

```json
{
  "reason": "Changed travel plans"
}
```

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "cancelled",
    "cancelledAt": "2024-01-10T10:00:00Z",
    "cancelledBy": "user123",
    "cancellationReason": "Changed travel plans",
    "updatedAt": "2024-01-10T10:00:00Z",
    // ... other booking fields
  }
}
```

#### Error Responses

- `404 Not Found`: Booking not found
- `400 Bad Request`: Booking already cancelled
- `400 Bad Request`: Missing cancellation reason

### 4. Search Bookings

Search bookings with various filters and pagination.

**GET** `/api/bookings`

#### Query Parameters

- `status` (optional): Filter by booking status (pending, confirmed, cancelled, failed, refunded)
- `type` (optional): Filter by booking type (flight, hotel, package)
- `startDate` (optional): Filter bookings created after this date (ISO format)
- `endDate` (optional): Filter bookings created before this date (ISO format)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `sortBy` (optional): Sort field (createdAt, updatedAt, totalAmount, status) (default: createdAt)
- `sortOrder` (optional): Sort order (ASC, DESC) (default: DESC)

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "bookings": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "type": "flight",
        "status": "confirmed",
        "totalAmount": 250.00,
        "confirmationNumber": "TK-1708444800-ABC123",
        "createdAt": "2024-01-10T10:00:00Z",
        "updatedAt": "2024-01-10T10:00:00Z"
      }
    ],
    "total": 1
  }
}
```

### 5. Get User Bookings

Get all bookings for a specific user.

**GET** `/api/bookings/user/:userId`

#### Query Parameters

- `status` (optional): Filter by booking status
- `type` (optional): Filter by booking type

#### Response (200 OK)

```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "type": "flight",
      "status": "confirmed",
      "totalAmount": 250.00,
      "confirmationNumber": "TK-1708444800-ABC123",
      "createdAt": "2024-01-10T10:00:00Z",
      "updatedAt": "2024-01-10T10:00:00Z"
    }
  ]
}
```

### 6. Get User Booking Statistics

Get booking statistics for a specific user.

**GET** `/api/bookings/stats/user/:userId`

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "totalBookings": 5,
    "confirmedBookings": 4,
    "cancelledBookings": 1,
    "totalSpent": 1250.00,
    "bookingTypes": {
      "flight": 3,
      "hotel": 2
    }
  }
}
```

## Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "error": "Error message"
}
```

### Common Error Codes

- `400 Bad Request`: Invalid request data or missing required fields
- `401 Unauthorized`: Missing or invalid authentication token
- `403 Forbidden`: User not authorized to access this resource
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

## Status Codes

- `pending`: Booking created but not yet confirmed
- `confirmed`: Booking confirmed and active
- `cancelled`: Booking cancelled by user or system
- `failed`: Booking failed due to payment or other issues
- `refunded`: Booking refunded

## Booking Types

- `flight`: Airline booking
- `hotel`: Hotel reservation
- `package`: Combined travel package

## Cabin Classes

- `economy`: Economy class
- `business`: Business class
- `first`: First class

## Room Types

- `standard`: Standard room
- `deluxe`: Deluxe room
- `suite`: Suite room

## Examples

### Create a Flight Booking

```bash
curl -X POST http://localhost:3001/api/bookings \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "type": "flight",
    "totalAmount": 250.00,
    "passengers": [
      {
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com",
        "phone": "+1234567890",
        "dateOfBirth": "1990-01-01",
        "passportNumber": "AB123456"
      }
    ],
    "flightDetails": {
      "flightNumber": "AA100",
      "origin": "JFK",
      "destination": "LAX",
      "departureTime": "2026-02-15T10:00:00Z",
      "arrivalTime": "2026-02-15T13:00:00Z",
      "cabinClass": "economy"
    }
  }'
```

### Search Bookings

```bash
curl -X GET "http://localhost:3001/api/bookings?status=confirmed&type=flight&page=1&limit=10" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Cancel a Booking

```bash
curl -X PUT http://localhost:3001/api/bookings/550e8400-e29b-41d4-a716-446655440000/cancel \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Changed travel plans"
  }'
```

## Rate Limiting

The API implements rate limiting to prevent abuse:
- 100 requests per minute per IP address
- 10 requests per second burst limit

## Security

- All endpoints require JWT authentication
- Passwords are never returned in responses
- Sensitive data is encrypted in transit (HTTPS required in production)
- Input validation prevents injection attacks

## Monitoring

The service provides health check endpoints:
- `GET /health`: Service health status
- `GET /health/ready`: Kubernetes readiness probe
- `GET /health/live`: Kubernetes liveness probe
