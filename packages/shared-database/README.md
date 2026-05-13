# TripAlfa Database REST API

## Overview

Comprehensive REST API layer built on top of PostgreSQL database infrastructure for the TripAlfa travel platform. This API provides OpenAPI-compliant endpoints for accessing and managing data across three operational databases.

## Database Statistics

- **Total Tables**: 197
- **Total Rows**: ~48 million
- **Total Data Size**: ~40 GB

## Operational Databases

1. **tripalfa_local** (39 GB, 118 tables)
   - Flight/hotel reference data
   - Static catalog information
   - High-volume tables: reviews (45.2M rows), images (36.4M rows)

2. **tripalfa_core** (12 MB, 76 tables)
   - Core application data
   - Users, roles, permissions
   - Bookings, audit logs, admin activity

3. **tripalfa_finance** (12 MB, 49 tables)
   - Financial operations
   - Invoices, commissions, suppliers

## Features

- ✅ **OpenAPI 3.0 Compliant** - Full Swagger documentation
- ✅ **JWT Authentication** - RS256 asymmetric encryption
- ✅ **RBAC Authorization** - Role-based access control
- ✅ **Rate Limiting** - IP-based request throttling
- ✅ **Pagination** - Standard and keyset pagination for large datasets
- ✅ **Filtering & Sorting** - Flexible query parameters
- ✅ **Audit Logging** - Complete activity tracking
- ✅ **Security Headers** - Helmet.js protection
- ✅ **CORS Support** - Configurable origins
- ✅ **Structured Logging** - JSON-formatted logs

## API Documentation

Interactive API documentation is available at:
```
http://localhost:3002/api-docs
```

## Installation

```bash
cd packages/shared-database
npm install
```

## Configuration

Create a `.env` file with the following variables:

```env
# Server
DB_API_PORT=3002
NODE_ENV=development

# Database
db_HOST=localhost
db_PORT=5432
db_USER=postgres
db_PASSWORD=your_password

# JWT
JWT_SECRET=your-secret-key
JWT_PRIVATE_KEY=--BEGIN RSA PRIVATE KEY--\n...
JWT_PUBLIC_KEY=--BEGIN RSA PUBLIC KEY--\n...

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:3001

# Logging
LOG_LEVEL=info
```

## Running the API

### Development

```bash
npm run dev
```

### Production

```bash
npm run build
npm start
```

## API Endpoints

### Authentication

#### Login
```http
POST /api/v1/auth/login
```

Authenticate and receive JWT token.

**Request Body:**
```json
{
  "email": "user@tripalfa.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600,
    "user": {
      "id": "uuid",
      "email": "user@tripalfa.com",
      "roles": [...],
      "permissions": [...]
    }
  }
}
```

#### Refresh Token
```http
POST /api/v1/auth/refresh
```

Refresh expired JWT token.

#### Logout
```http
POST /api/v1/auth/logout
```

Invalidate current session.

---

### Flight Reference Data

#### List Aircraft
```http
GET /api/v1/flight/aircraft
```

**Query Parameters:**
- `page` (integer, default: 1)
- `pageSize` (integer, default: 50, max: 100)
- `sortBy` (string, default: 'id')
- `sortOrder` (enum: 'asc', 'desc', default: 'asc')
- `filter[iata_type]` (string)
- `filter[icao_type]` (string)

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "iata_type": "737",
      "icao_type": "B737",
      "manufacturer": "Boeing",
      "model": "737-800",
      "capacity": 189,
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 50,
    "totalItems": 6,
    "totalPages": 1
  }
}
```

#### Get Aircraft
```http
GET /api/v1/flight/aircraft/{id}
```

#### Create Aircraft
```http
POST /api/v1/flight/aircraft
```

#### Update Aircraft
```http
PUT /api/v1/flight/aircraft/{id}
```

#### Patch Aircraft
```http
PATCH /api/v1/flight/aircraft/{id}
```

#### Delete Aircraft
```http
DELETE /api/v1/flight/aircraft/{id}
```

---

### Hotel Reference Data

#### List Hotels
```http
GET /api/v1/hotel/hotels
```

**Query Parameters:**
- `page` (integer, default: 1)
- `pageSize` (integer, default: 50, max: 100)
- `sortBy` (string, default: 'id')
- `sortOrder` (enum: 'asc', 'desc', default: 'desc')
- `filter[city_id]` (UUID)
- `filter[chain_id]` (UUID)
- `filter[type_id]` (UUID)
- `filter[status]` (enum: 'active', 'inactive', 'pending')
- `filter[verified]` (boolean)
- `filter[star_rating]` (integer, 1-5)
- `search` (string)
- `min_rating` (number, 0-5)

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Grand Plaza Hotel",
      "address": "123 Main St",
      "city_id": "uuid",
      "latitude": 40.7128,
      "longitude": -74.0060,
      "rating": 4.5,
      "star_rating": 5,
      "check_in_time": "15:00:00",
      "check_out_time": "11:00:00",
      "total_rooms": 200,
      "status": "active",
      "verified": true,
      "currency": "USD",
      "amenities": ["wifi", "pool", "gym"],
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 50,
    "totalItems": 3100000,
    "totalPages": 62000
  }
}
```

#### Get Hotel
```http
GET /api/v1/hotel/hotels/{id}
```

#### Create Hotel
```http
POST /api/v1/hotel/hotels
```

#### Update Hotel
```http
PUT /api/v1/hotel/hotels/{id}
```

#### Patch Hotel
```http
PATCH /api/v1/hotel/hotels/{id}
```

#### Delete Hotel
```http
DELETE /api/v1/hotel/hotels/{id}
```

---

### Hotel Rooms

#### List Hotel Rooms
```http
GET /api/v1/hotel/hotels/{id}/rooms
```

**Query Parameters:**
- `page` (integer, default: 1)
- `pageSize` (integer, default: 50, max: 100)

---

### Hotel Reviews (Keyset Pagination)

#### List Hotel Reviews
```http
GET /api/v1/hotel/reviews
```

**Query Parameters:**
- `hotel_id` (UUID, required)
- `pageSize` (integer, default: 50, max: 100)
- `cursor` (string, for keyset pagination)
- `sortOrder` (enum: 'asc', 'desc', default: 'desc')
- `min_rating` (integer, 1-5)
- `max_rating` (integer, 1-5)

**Note:** Uses keyset pagination for optimal performance with large datasets (45M+ reviews).

---

### Hotel Images (Keyset Pagination)

#### List Hotel Images
```http
GET /api/v1/hotel/images
```

**Query Parameters:**
- `hotel_id` (UUID, required)
- `pageSize` (integer, default: 50, max: 100)
- `cursor` (string, for keyset pagination)
- `type` (enum: 'exterior', 'interior', 'room', 'amenity', 'dining')

**Note:** Uses keyset pagination for optimal performance with large datasets (36M+ images).

---

### User Management

#### List Users
```http
GET /api/v1/users
```

**Query Parameters:**
- `page` (integer, default: 1)
- `pageSize` (integer, default: 50, max: 100)
- `search` (string)
- `status` (enum: 'active', 'inactive', 'suspended')

#### Create User
```http
POST /api/v1/users
```

#### Get User
```http
GET /api/v1/users/{id}
```

#### Update User
```http
PUT /api/v1/users/{id}
```

#### Delete User
```http
DELETE /api/v1/users/{id}
```

---

### Roles & Permissions

#### List Roles
```http
GET /api/v1/roles
```

#### Create Role
```http
POST /api/v1/roles
```

#### Get Role
```http
GET /api/v1/roles/{id}
```

#### List Permissions
```http
GET /api/v1/permissions
```

---

### Bookings

#### List Bookings
```http
GET /api/v1/bookings
```

**Query Parameters:**
- `page` (integer, default: 1)
- `pageSize` (integer, default: 50, max: 100)
- `status` (enum: 'NEW_BOOKING', 'PROVISIONAL', 'AUTHORIZED', 'TICKETED', 'DOCUMENTED', 'DISPATCHED', 'CANCELLED', 'VOID', 'REFUNDED')
- `userId` (UUID)
- `dateFrom` (date)
- `dateTo` (date)
- `search` (string)

#### Create Booking
```http
POST /api/v1/bookings
```

#### Get Booking
```http
GET /api/v1/bookings/{id}
```

#### Update Booking
```http
PUT /api/v1/bookings/{id}
```

---

### Flight Bookings

#### List Flight Bookings
```http
GET /api/v1/flight-bookings
```

**Query Parameters:**
- `page` (integer, default: 1)
- `pageSize` (integer, default: 50, max: 100)
- `bookingId` (UUID)
- `pnr` (string)
- `status` (string)

#### Create Flight Booking
```http
POST /api/v1/flight-bookings
```

---

### Hotel Bookings

#### List Hotel Bookings
```http
GET /api/v1/hotel-bookings
```

**Query Parameters:**
- `page` (integer, default: 1)
- `pageSize` (integer, default: 50, max: 100)
- `bookingId` (UUID)
- `hotelId` (UUID)
- `status` (string)

#### Create Hotel Booking
```http
POST /api/v1/hotel-bookings
```

---

### Financial

#### List Invoices
```http
GET /api/v1/finance/invoices
```

**Query Parameters:**
- `page` (integer, default: 1)
- `pageSize` (integer, default: 50, max: 100)
- `status` (enum: 'draft', 'issued', 'paid', 'overdue', 'cancelled')
- `supplierId` (UUID)
- `dateFrom` (date)
- `dateTo` (date)

#### List Commissions
```http
GET /api/v1/finance/commissions
```

**Query Parameters:**
- `page` (integer, default: 1)
- `pageSize` (integer, default: 50, max: 100)
- `bookingId` (UUID)
- `status` (enum: 'pending', 'calculated', 'paid', 'disputed')

---

### Audit

#### List Audit Logs
```http
GET /api/v1/audit
```

**Query Parameters:**
- `page` (integer, default: 1)
- `pageSize` (integer, default: 50, max: 100)
- `userId` (UUID)
- `action` (string)
- `resourceType` (string)
- `dateFrom` (date)
- `dateTo` (date)

---

### Admin Activity

#### List Admin Activity Logs
```http
GET /api/v1/admin/activity
```

**Query Parameters:**
- `page` (integer, default: 1)
- `pageSize` (integer, default: 50, max: 100)
- `adminId` (UUID)
- `action` (string)

---

## Authentication

### JWT Bearer Token

All endpoints (except `/api/v1/auth/login` and `/api/v1/auth/refresh`) require authentication via Bearer token:

```http
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

### API Key

Service-to-service communication can use API key authentication:

```http
X-API-Key: abc123def456ghi789jkl012mno345pqr
```

## Error Responses

All error responses follow this format:

```json
{
  "error": "validation_failed",
  "message": "Validation failed for one or more fields",
  "details": {
    "email": ["Email is required", "Email must be a valid email address"]
  },
  "requestId": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Error Codes

- `400` - Bad Request (validation_failed)
- `401` - Unauthorized (unauthorized)
- `403` - Forbidden (forbidden)
- `404` - Not Found (not_found)
- `429` - Too Many Requests (rate_limit_exceeded)
- `500` - Internal Server Error (internal_server_error)

## Rate Limiting

- **100 requests per 15 minutes** per IP address
- Exceeding the limit returns `429 Too Many Requests`

## Pagination

### Standard Pagination

Used for most endpoints:

```json
{
  "data": [...],
  "meta": {
    "page": 1,
    "pageSize": 50,
    "totalItems": 1000,
    "totalPages": 20
  }
}
```

### Keyset Pagination

Used for large datasets (reviews, images):

```json
{
  "data": [...],
  "meta": {
    "pageSize": 50,
    "hasNext": true,
    "hasPrev": false,
    "nextCursor": "abc123",
    "prevCursor": null
  }
}
```

## Security

- JWT tokens use RS256 asymmetric encryption
- Passwords are hashed with bcrypt (12 rounds)
- All endpoints use HTTPS in production
- CORS is restricted to configured origins
- Security headers via Helmet.js
- Rate limiting to prevent abuse
- Comprehensive audit logging
- Field-level encryption for PII

## Performance

- Keyset pagination for datasets >10M rows
- Database indexes on frequently queried columns
- Connection pooling (max 20 connections)
- Query optimization for large datasets
- Cached static reference data

## Monitoring

Health check endpoint:

```http
GET /health
```

Returns:

```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600,
  "version": "1.0.0",
  "services": {
    "database": {
      "tripalfa_local": "connected",
      "tripalfa_core": "connected",
      "tripalfa_finance": "connected"
    }
  }
}
```

## Support

For issues or questions, contact: api@tripalfa.com

## License

Proprietary - TripAlfa Inc.
