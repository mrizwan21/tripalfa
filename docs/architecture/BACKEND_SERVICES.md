# TripAlfa Backend Services

**Note**: This document may be outdated. For the most current service information, please refer to the actual service implementations and API documentation.

This document provides a comprehensive overview of the backend services for the TripAlfa booking engine and B2B admin module.

## Services Overview

**Note**: The service overview below may be outdated. Please refer to the current service implementations.

### 1. B2B Admin Service (`services/b2b-admin-service`)

Port: 3020

A comprehensive backend service for B2B administration, providing APIs for:

- Company management
- User management
- Booking management
- Finance operations
- Supplier management
- Rules and pricing management

### 2. Booking Engine Service (`services/booking-engine-service`)

Port: 3021

A dedicated service for booking operations, providing APIs for:

- Flight search and booking (via Duffel API)
- Hotel search and booking (via LITEAPI)
- Offline request management

---

## API Gateway Integration

**Note**: The API gateway integration details below may be outdated. Please refer to the current gateway configuration.

All services are routed through the centralized API Gateway (`services/api-gateway`). The gateway handles:

- Request routing and load balancing
- Authentication and authorization
- Rate limiting
- Request/response transformation
- Error handling and retry logic

### Gateway Configuration

Services and endpoints are configured in [`api-manager.config.ts`](services/api-gateway/src/config/api-manager.config.ts).

#### Service Configuration

```typescript
b2bAdminService: {
  name: 'B2B Admin Service',
  baseUrl: process.env.B2B_ADMIN_SERVICE_URL || 'http://b2b-admin-service:3020',
  port: 3020,
  timeout: 15000,
  retryPolicy: { maxRetries: 3, backoffMs: 1000, codes: [408, 429, 500, 502, 503, 504] },
  rateLimitPolicy: { requestsPerMinute: 100, requestsPerHour: 5000 },
  healthCheck: { enabled: true, interval: 30000, endpoint: '/health' },
}

bookingEngineService: {
  name: 'Booking Engine Service',
  baseUrl: process.env.BOOKING_ENGINE_SERVICE_URL || 'http://booking-engine-service:3021',
  port: 3021,
  timeout: 30000,
  retryPolicy: { maxRetries: 3, backoffMs: 2000, codes: [408, 429, 500, 502, 503, 504] },
  rateLimitPolicy: { requestsPerMinute: 100, requestsPerHour: 5000 },
  healthCheck: { enabled: true, interval: 30000, endpoint: '/health' },
}
```

#### Endpoint Statistics

- **B2B Admin Endpoints**: 70+ endpoints across 6 categories
  - Company endpoints: 8
  - User endpoints: 10
  - Booking endpoints: 8
  - Finance endpoints: 17
  - Supplier endpoints: 9
  - Rule endpoints: 10
- **Booking Engine Endpoints**: 25+ endpoints across 3 categories
  - Flight endpoints: 8
  - Hotel endpoints: 8
  - Offline request endpoints: 8

---

## B2B Admin Service API Reference

**Note**: The API reference below may be outdated. Please refer to the current API documentation.

### Authentication

All endpoints require JWT authentication via Bearer token in the Authorization header.

```http
Authorization: Bearer <token>
```

### Companies API (`/api/companies`)

| Method | Endpoint                         | Description                        | Permission         |
| ------ | -------------------------------- | ---------------------------------- | ------------------ |
| GET    | `/api/companies`                 | List all companies with pagination | `companies:read`   |
| GET    | `/api/companies/:id`             | Get company by ID                  | `companies:read`   |
| POST   | `/api/companies`                 | Create new company                 | `companies:create` |
| PUT    | `/api/companies/:id`             | Update company                     | `companies:update` |
| DELETE | `/api/companies/:id`             | Soft delete company                | `companies:delete` |
| GET    | `/api/companies/:id/departments` | Get company departments            | `companies:read`   |
| POST   | `/api/companies/:id/departments` | Create department                  | `companies:update` |
| GET    | `/api/companies/:id/stats`       | Get company statistics             | `companies:read`   |

### Users API (`/api/users`)

| Method | Endpoint                       | Description                    | Permission      |
| ------ | ------------------------------ | ------------------------------ | --------------- |
| GET    | `/api/users`                   | List all users with pagination | `users:read`    |
| GET    | `/api/users/:id`               | Get user by ID                 | `users:read`    |
| POST   | `/api/users`                   | Create new user                | `users:create`  |
| PUT    | `/api/users/:id`               | Update user                    | `users:update`  |
| DELETE | `/api/users/:id`               | Delete user                    | `users:delete`  |
| PUT    | `/api/users/:id/password`      | Change user password           | `users:update`  |
| GET    | `/api/users/:id/notifications` | Get user notifications         | `users:read`    |
| GET    | `/api/users/:id/bookings`      | Get user bookings              | `bookings:read` |

### Bookings API (`/api/bookings`)

| Method | Endpoint                            | Description                    | Permission        |
| ------ | ----------------------------------- | ------------------------------ | ----------------- |
| GET    | `/api/bookings`                     | List all bookings with filters | `bookings:read`   |
| GET    | `/api/bookings/stats`               | Get booking statistics         | `bookings:read`   |
| GET    | `/api/bookings/:id`                 | Get booking by ID              | `bookings:read`   |
| GET    | `/api/bookings/:id/ref/:bookingRef` | Get booking by reference       | `bookings:read`   |
| PUT    | `/api/bookings/:id/status`          | Update booking status          | `bookings:update` |
| POST   | `/api/bookings/:id/cancel`          | Cancel booking                 | `bookings:update` |
| POST   | `/api/bookings/:id/refund`          | Process refund                 | `bookings:update` |
| GET    | `/api/bookings/:id/modifications`   | Get modification history       | `bookings:read`   |
| GET    | `/api/bookings/:id/documents`       | Get booking documents          | `bookings:read`   |
| GET    | `/api/bookings/queues`              | Get booking queues             | `bookings:read`   |
| POST   | `/api/bookings/:id/queue-action`    | Perform queue action           | `bookings:update` |

### Finance API (`/api/finance`)

| Method | Endpoint                                    | Description             | Permission       |
| ------ | ------------------------------------------- | ----------------------- | ---------------- |
| GET    | `/api/finance/wallets`                      | List all wallets        | `finance:read`   |
| GET    | `/api/finance/wallets/:userId`              | Get wallet by user ID   | `finance:read`   |
| GET    | `/api/finance/wallets/:userId/transactions` | Get wallet transactions | `finance:read`   |
| POST   | `/api/finance/wallets/:userId/credit`       | Credit wallet           | `finance:update` |
| POST   | `/api/finance/wallets/:userId/debit`        | Debit wallet            | `finance:update` |
| GET    | `/api/finance/settlements`                  | List settlements        | `finance:read`   |
| PUT    | `/api/finance/settlements/:id`              | Update settlement       | `finance:update` |
| GET    | `/api/finance/disputes`                     | List disputes           | `finance:read`   |
| PUT    | `/api/finance/disputes/:id`                 | Update dispute          | `finance:update` |
| GET    | `/api/finance/exchange-rates`               | List exchange rates     | `finance:read`   |
| POST   | `/api/finance/exchange-rates`               | Update exchange rate    | `finance:update` |
| GET    | `/api/finance/currencies`                   | List currencies         | `finance:read`   |
| PUT    | `/api/finance/currencies/:code`             | Update currency         | `finance:update` |
| GET    | `/api/finance/reports/summary`              | Financial summary       | `finance:read`   |
| GET    | `/api/finance/reports/revenue`              | Revenue report          | `finance:read`   |

### Suppliers API (`/api/suppliers`)

| Method | Endpoint                                       | Description              | Permission         |
| ------ | ---------------------------------------------- | ------------------------ | ------------------ |
| GET    | `/api/suppliers`                               | List all suppliers       | `suppliers:read`   |
| GET    | `/api/suppliers/:id`                           | Get supplier by ID       | `suppliers:read`   |
| POST   | `/api/suppliers`                               | Create supplier          | `suppliers:create` |
| PUT    | `/api/suppliers/:id`                           | Update supplier          | `suppliers:update` |
| PUT    | `/api/suppliers/:id/status`                    | Toggle supplier status   | `suppliers:update` |
| DELETE | `/api/suppliers/:id`                           | Delete supplier          | `suppliers:delete` |
| GET    | `/api/suppliers/:id/credentials`               | Get supplier credentials | `suppliers:read`   |
| POST   | `/api/suppliers/:id/credentials`               | Add credentials          | `suppliers:update` |
| PUT    | `/api/suppliers/:id/credentials/:credId`       | Update credentials       | `suppliers:update` |
| DELETE | `/api/suppliers/:id/credentials/:credId`       | Delete credentials       | `suppliers:update` |
| GET    | `/api/suppliers/:id/sync-logs`                 | Get sync logs            | `suppliers:read`   |
| POST   | `/api/suppliers/:id/sync`                      | Trigger sync             | `suppliers:update` |
| GET    | `/api/suppliers/:id/hotel-mappings`            | Get hotel mappings       | `suppliers:read`   |
| POST   | `/api/suppliers/:id/hotel-mappings`            | Create hotel mapping     | `suppliers:update` |
| DELETE | `/api/suppliers/:id/hotel-mappings/:mappingId` | Delete hotel mapping     | `suppliers:update` |

### Rules API (`/api/rules`)

| Method | Endpoint                            | Description         | Permission     |
| ------ | ----------------------------------- | ------------------- | -------------- |
| GET    | `/api/rules/markup`                 | List markup rules   | `rules:read`   |
| GET    | `/api/rules/markup/:id`             | Get markup rule     | `rules:read`   |
| POST   | `/api/rules/markup`                 | Create markup rule  | `rules:create` |
| PUT    | `/api/rules/markup/:id`             | Update markup rule  | `rules:update` |
| DELETE | `/api/rules/markup/:id`             | Delete markup rule  | `rules:delete` |
| PUT    | `/api/rules/markup/:id/toggle`      | Toggle rule status  | `rules:update` |
| POST   | `/api/rules/markup/:id/duplicate`   | Duplicate rule      | `rules:create` |
| GET    | `/api/rules/deals`                  | List supplier deals | `rules:read`   |
| GET    | `/api/rules/deals/:id`              | Get deal details    | `rules:read`   |
| POST   | `/api/rules/deals`                  | Create deal         | `rules:create` |
| PUT    | `/api/rules/deals/:id`              | Update deal         | `rules:update` |
| DELETE | `/api/rules/deals/:id`              | Delete deal         | `rules:delete` |
| GET    | `/api/rules/commissions`            | List commissions    | `rules:read`   |
| PUT    | `/api/rules/commissions/:id/settle` | Settle commission   | `rules:update` |

---

## Booking Engine Service API Reference

**Note**: The API reference below may be outdated. Please refer to the current API documentation.

### Flights API (`/api/flights`)

| Method | Endpoint                                  | Description           |
| ------ | ----------------------------------------- | --------------------- |
| POST   | `/api/flights/search`                     | Search for flights    |
| GET    | `/api/flights/offers/:offerId`            | Get offer details     |
| POST   | `/api/flights/book`                       | Create flight booking |
| GET    | `/api/flights/booking/:bookingRef`        | Get booking details   |
| POST   | `/api/flights/booking/:bookingRef/cancel` | Cancel booking        |
| GET    | `/api/flights/airports`                   | Search airports       |
| GET    | `/api/flights/airlines`                   | Get airlines          |

### Hotels API (`/api/hotels`)

| Method | Endpoint                                 | Description          |
| ------ | ---------------------------------------- | -------------------- |
| POST   | `/api/hotels/search`                     | Search for hotels    |
| GET    | `/api/hotels/:hotelId`                   | Get hotel details    |
| POST   | `/api/hotels/:hotelId/rates`             | Get hotel rates      |
| POST   | `/api/hotels/book`                       | Create hotel booking |
| GET    | `/api/hotels/booking/:bookingRef`        | Get booking details  |
| POST   | `/api/hotels/booking/:bookingRef/cancel` | Cancel booking       |
| GET    | `/api/hotels/destinations/search`        | Search destinations  |
| GET    | `/api/hotels/amenities`                  | Get hotel amenities  |
| GET    | `/api/hotels/board-types`                | Get board types      |

### Offline Requests API (`/api/offline-requests`)

| Method | Endpoint                              | Description            |
| ------ | ------------------------------------- | ---------------------- |
| POST   | `/api/offline-requests`               | Create offline request |
| GET    | `/api/offline-requests`               | List offline requests  |
| GET    | `/api/offline-requests/:id`           | Get request details    |
| PUT    | `/api/offline-requests/:id/pricing`   | Submit pricing (staff) |
| PUT    | `/api/offline-requests/:id/approve`   | Customer approval      |
| PUT    | `/api/offline-requests/:id/payment`   | Process payment        |
| PUT    | `/api/offline-requests/:id/documents` | Issue documents        |
| GET    | `/api/offline-requests/:id/audit`     | Get audit log          |

---

## Database Models Used

**Note**: The database models below may be outdated. Please refer to the current Prisma schema.

The services integrate with the following Prisma models:

### Core Models

- `User` - User accounts
- `UserPreferences` - User notification preferences
- `Company` - B2B company accounts
- `Department` - Company departments
- `Designation` - Job designations
- `CostCenter` - Cost centers
- `Role` - User roles
- `Permission` - Role permissions
- `UserRole` - User-role assignments

### Booking Models

- `Booking` - Main booking records
- `BookingSegment` - Flight/hotel segments
- `BookingPassenger` - Passenger details
- `BookingModification` - Change history
- `DuffelOrder` - Duffel flight orders
- `DuffelOffer` - Duffel offers
- `DuffelOfferRequest` - Duffel search requests
- `PrebookSession` - Hotel prebook sessions

### Finance Models

- `Wallet` - User wallets
- `WalletTransaction` - Wallet transactions
- `Settlement` - Settlement records
- `Dispute` - Dispute records
- `ExchangeRate` - Currency exchange rates
- `Currency` - Currency definitions

### Supplier Models

- `Supplier` - Supplier registry
- `SupplierCredential` - API credentials
- `SupplierSyncLog` - Sync logs
- `CanonicalHotel` - Unified hotel data
- `SupplierHotelMapping` - Hotel mappings

### Rules Models

- `MarkupRule` - Markup rules
- `SupplierDeals` - Supplier deals
- `CommissionSettlement` - Commission records

### Offline Request Models

- `OfflineChangeRequest` - Change requests
- `OfflineRequestAuditLog` - Audit trail
- `OfflineRequestNotificationQueue` - Notification queue

---

## Environment Variables

**Note**: The environment variables below may be outdated. Please refer to the current environment configuration.

### B2B Admin Service

```env
B2B_ADMIN_SERVICE_PORT=3020
JWT_SECRET=your-secret-key
DATABASE_URL=postgresql://...
```

### Booking Engine Service

```env
BOOKING_ENGINE_SERVICE_PORT=3021
DUFFEL_API_URL=https://api.duffel.com
DUFFEL_API_KEY=your-duffel-key
LITEAPI_BASE_URL=https://api.liteapi.travel
LITEAPI_API_KEY=your-liteapi-key
DATABASE_URL=postgresql://...
```

---

## Running the Services

**Note**: The running instructions below may be outdated. Please refer to the current service documentation.

### Development

```bash
# B2B Admin Service
cd services/b2b-admin-service
pnpm install
pnpm dev

# Booking Engine Service
cd services/booking-engine-service
pnpm install
pnpm dev
```

### Docker

```bash
# Build and run B2B Admin Service
docker build -t tripalfa-b2b-admin ./services/b2b-admin-service
docker run -p 3002:3002 tripalfa-b2b-admin

# Build and run Booking Engine Service
docker build -t tripalfa-booking-engine ./services/booking-engine-service
docker run -p 3003:3003 tripalfa-booking-engine
```

---

## Architecture

**Note**: The architecture diagram below may be outdated. Please refer to the current system architecture.

```text
┌─────────────────────────────────────────────────────────────────┐
│                        API Gateway                               │
│                      (Port 3000)                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
          ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  B2B Admin      │ │  Booking Engine │ │  Other Services │
│  Service        │ │  Service        │ │  (User, etc.)   │
│  (Port 3020)    │ │  (Port 3021)    │ │                 │
└─────────────────┘ └─────────────────┘ └─────────────────┘
          │                   │                   │
          └───────────────────┼───────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │   PostgreSQL    │
                    │   Database      │
                    └─────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
          ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│     Duffel      │ │    LITEAPI      │ │   Other APIs    │
│   (Flights)     │ │   (Hotels)      │ │                 │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

---

## Security

**Note**: The security information below may be outdated. Please refer to the current security implementation.

### Authentication Methods

- JWT-based authentication
- Bearer token in Authorization header
- Token expiration and refresh

### Authorization

- Role-based access control (RBAC)
- Permission-based endpoint protection
- Company-level data isolation

### Data Protection

- Input validation with Zod schemas
- SQL injection prevention via Prisma
- XSS protection
- CORS configuration

---

## Error Handling

**Note**: The error handling information below may be outdated. Please refer to the current error handling implementation.

All services return consistent error responses:

```json
{
  "success": false,
  "error": "Error message",
  "message": "Detailed error description (development only)"
}
```

HTTP Status Codes:

- `200` - Success
- `201` - Created
- `400` - Bad Request / Validation Error
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error
