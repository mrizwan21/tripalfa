# Supplier Management API Reference

## Overview

The Supplier Management API provides comprehensive endpoints for managing suppliers, API vendors, pricing rules, and inventory orchestration. This API enables search across multiple suppliers with automatic pricing rule application.

## Base URL

- **Development**: `http://localhost:3002`
- **Production**: `https://api.tripalfa.com/inventory`

## Authentication

### API Key Authentication
Include your API key in the request header:
```
X-API-Key: your-api-key-here
```

### Bearer Token Authentication
Include your JWT token in the request header:
```
Authorization: Bearer your-jwt-token
```

## Error Handling

All API responses follow a consistent error format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description",
    "details": {
      "field": "specific details"
    },
    "timestamp": "2024-10-25T10:30:00Z",
    "requestId": "optional-request-id"
  }
}
```

### Common Error Codes

- `VALIDATION_ERROR` (400): Invalid input parameters
- `NOT_FOUND` (404): Resource not found
- `CONFLICT` (409): Resource conflict (duplicate, etc.)
- `FORBIDDEN` (403): Access denied or supplier inactive
- `SUPPLIER_ERROR` (502): Supplier service error
- `SERVICE_UNAVAILABLE` (503): No active suppliers available
- `INTERNAL_ERROR` (500): Internal server error

## Endpoints

### Health Check

#### GET /health
Returns service health status and metadata.

**Response:**
```json
{
  "status": "healthy",
  "service": "inventory-service",
  "timestamp": "2024-10-25T10:30:00Z"
}
```

### Supplier Management

#### GET /suppliers
Retrieve all suppliers with their associated vendors and contracts.

**Query Parameters:**
- `include` (optional): Comma-separated list of relations to include (`vendor`, `contracts`)
- `isActive` (optional): Filter by active status (`true`/`false`)
- `category` (optional): Filter by supplier category (`flights`, `hotels`, `LOCAL`)

**Response:**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Amadeus GDS",
    "code": "AMADEUS",
    "category": "GDS",
    "vendorId": "550e8400-e29b-41d4-a716-446655440001",
    "isActive": true,
    "settings": {
      "timeout": 30000,
      "retryCount": 3
    },
    "vendor": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "Duffel",
      "code": "DUFFEL",
      "baseUrl": "https://api.duffel.com",
      "authType": "API_KEY"
    },
    "contracts": [...]
  }
]
```

#### POST /suppliers
Create a new supplier.

**Request Body:**
```json
{
  "name": "Amadeus GDS",
  "code": "AMADEUS",
  "category": "GDS",
  "vendorId": "550e8400-e29b-41d4-a716-446655440001",
  "settings": {
    "timeout": 30000,
    "retryCount": 3
  }
}
```

**Response:** 201 Created with supplier object

#### GET /suppliers/{id}
Retrieve a specific supplier by ID.

**Response:** Supplier object

#### PUT /suppliers/{id}
Update an existing supplier.

**Request Body:**
```json
{
  "name": "Updated Supplier Name",
  "isActive": false,
  "settings": {
    "timeout": 60000
  }
}
```

**Response:** Updated supplier object

#### DELETE /suppliers/{id}
Delete a supplier by ID.

**Response:** 204 No Content

### API Vendor Management

#### GET /api-vendors
Retrieve all configured API vendors with their mappings.

**Response:**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "Duffel",
    "code": "DUFFEL",
    "baseUrl": "https://api.duffel.com",
    "authType": "API_KEY",
    "isActive": true,
    "mappings": [...]
  }
]
```

#### POST /api-vendors
Create a new API vendor configuration.

**Request Body:**
```json
{
  "name": "Duffel",
  "code": "DUFFEL",
  "baseUrl": "https://api.duffel.com",
  "authType": "API_KEY",
  "credentials": {
    "apiKey": "encrypted_key_here"
  },
  "mappings": [
    {
      "action": "SEARCH",
      "path": "/air/offer_requests",
      "method": "POST"
    }
  ]
}
```

**Response:** 201 Created with API vendor object

### Pricing Rules

#### GET /pricing-rules
Retrieve all pricing rules ordered by priority.

**Query Parameters:**
- `serviceType` (optional): Filter by service type (`FLIGHT`, `HOTEL`, `PACKAGE`, `ALL`)
- `targetType` (optional): Filter by target type (`GLOBAL`, `COMPANY`, `BRANCH`, `SUBAGENT`)
- `status` (optional): Filter by rule status (`ACTIVE`, `INACTIVE`)

**Response:**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440003",
    "name": "Weekend Markup",
    "targetType": "GLOBAL",
    "serviceType": "FLIGHT",
    "markupType": "PERCENTAGE",
    "markupValue": 10.5,
    "status": "ACTIVE",
    "priority": 1,
    "criteria": {
      "airlineCodes": ["AA", "UA"],
      "classOfService": "Economy"
    }
  }
]
```

#### POST /pricing-rules
Create a new pricing rule.

**Request Body:**
```json
{
  "name": "Weekend Markup",
  "targetType": "GLOBAL",
  "serviceType": "FLIGHT",
  "markupType": "PERCENTAGE",
  "markupValue": 10.5,
  "status": "ACTIVE",
  "priority": 1,
  "criteria": {
    "airlineCodes": ["AA", "UA"],
    "classOfService": "Economy"
  }
}
```

**Response:** 201 Created with pricing rule object

### Search Endpoints

#### POST /search/flights
Search for flights across multiple suppliers with automatic pricing rule application.

**Request Body:**
```json
{
  "origin": "JFK",
  "destination": "LAX",
  "departureDate": "2024-10-25",
  "returnDate": "2024-10-30",
  "adults": 2,
  "children": 1,
  "infants": 0,
  "cabinClass": "ECONOMY",
  "context": {
    "tenantId": "tenant_123",
    "companyId": "company_456",
    "branchId": "branch_789"
  }
}
```

**Response:**
```json
{
  "results": [
    {
      "id": "flight_12345",
      "airline": "Delta Air Lines",
      "carrierCode": "DL",
      "flightNumber": "DL123",
      "origin": "JFK",
      "destination": "LAX",
      "departureTime": "10:30",
      "arrivalTime": "14:45",
      "duration": "5h 15m",
      "stops": 0,
      "amount": 250.00,
      "currency": "USD",
      "originalAmount": 227.27,
      "markupApplied": "Weekend Markup",
      "supplier": "Duffel",
      "provider": "Local"
    }
  ],
  "metadata": {
    "totalResults": 25,
    "suppliersQueried": ["DUFFEL", "LOCAL"],
    "processingTime": 1250
  }
}
```

#### POST /search/hotels
Search for hotels across multiple suppliers with automatic pricing rule application.

**Request Body:**
```json
{
  "location": "New York",
  "checkin": "2024-10-25",
  "checkout": "2024-10-30",
  "adults": 2,
  "children": 1,
  "rooms": 1,
  "context": {
    "tenantId": "tenant_123",
    "companyId": "company_456",
    "branchId": "branch_789"
  }
}
```

**Response:**
```json
{
  "results": [
    {
      "id": "hotel_12345",
      "name": "Grand Plaza Hotel",
      "image": "https://images.example.com/hotel_12345.jpg",
      "location": "Times Square, New York",
      "rating": 4.5,
      "reviews": 1250,
      "pricePerNight": 180.00,
      "currency": "USD",
      "originalPricePerNight": 163.64,
      "markupApplied": "Weekend Markup",
      "amenities": ["WiFi", "Pool", "Gym", "Restaurant"],
      "provider": "LiteAPI"
    }
  ],
  "metadata": {
    "totalResults": 15,
    "suppliersQueried": ["LITEAPI", "LOCAL"],
    "processingTime": 850
  }
}
```

### Configuration Endpoints

#### GET /config/active-suppliers
Retrieve configuration for all active suppliers. Used by the booking engine to get current supplier configuration.

**Response:** Array of active supplier objects

## Supplier Categories

- **GDS**: Global Distribution Systems (Amadeus, Sabre, Travelport)
- **DIRECT_API**: Direct API connections to suppliers
- **LOCAL**: Local database suppliers

## Service Types

- **FLIGHT**: Flight services
- **HOTEL**: Hotel services
- **PACKAGE**: Package services
- **ALL**: All service types

## Target Types for Pricing Rules

- **GLOBAL**: Applies to all users
- **COMPANY**: Applies to specific companies
- **BRANCH**: Applies to specific branches
- **SUBAGENT**: Applies to specific sub-agents

## Markup Types

- **PERCENTAGE**: Percentage-based markup
- **FIXED**: Fixed amount markup

## Rate Limiting

The API implements rate limiting to ensure fair usage:
- Default: 100 requests per minute per API key
- Burst limit: 20 requests per second

## Monitoring

The API provides health check endpoints and metrics for monitoring:
- `/health`: Service health status
- Request/response logging with correlation IDs
- Performance metrics and error tracking

## Support

For API support and documentation updates:
- Email: api-support@tripalfa.com
- Documentation: https://docs.tripalfa.com/supplier-management