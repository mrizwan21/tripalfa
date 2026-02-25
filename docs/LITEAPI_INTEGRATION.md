# LITEAPI Integration Documentation

## Overview

This document details all the LITEAPI integrations required for the TripAlfa hotel booking module.

**Documentation**:

- Main: <https://docs.liteapi.travel/reference/overview>
- Workflow: <https://docs.liteapi.travel/reference/workflow>
- Hotel Rates API: <https://docs.liteapi.travel/reference/post_hotels-rates>

---

## Base URLs

| Service | Base URL |
| --------- | ---------- |
| **API (Data)** | `https://api.liteapi.travel/v3.0` |
| **Booking** | `https://book.liteapi.travel/v3.0` |
| **Voucher (DA)** | `https://da.liteapi.travel` |

---

## Database Architecture

### Primary Database: Neon (PostgreSQL)

The project uses **Neon** as the primary database for storing all LITEAPI real-time data.

### Hybrid Data Management Approach

| Layer | Technology | Use Case |
| ------- | ---------- | ---------- |
| **Hot Cache** | Redis | Frequently accessed search results, availability data, session management |
| **Persistent Storage** | Neon (PostgreSQL) | Booking records, voucher data, loyalty points, historical data |
| **Real-time Sync** | LITEAPI → Neon | Live inventory, rates, hotel details |

### Data Flow

```text
LITEAPI → API Gateway → Booking Service → Redis (Cache) → Neon (Persistent)
                                              ↓
                                      Frontend Display
```

### Caching Strategy

- **Search Results**: Cached in Redis with TTL (Time-To-Live) for fast retrieval
- **Hotel Details**: Cached in Redis, invalidated on updates
- **Rates**: Real-time fetch from LITEAPI, cached briefly in Redis
- **Booking Data**: Stored directly in Neon for persistence
- **Vouchers**: Stored in Neon with Redis caching for frequently accessed vouchers
- **Loyalty Points**: Stored in Neon for transactional integrity

### Neon Database Configuration

```bash
DATABASE_URL=postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
```

---

## Authentication

All API requests require the following header:

```http
X-API-Key: {your_api_key}
```

---

## Implemented Endpoints

### 1. Data API - List Supported Languages

**Endpoint**: `GET /data/languages`
**Full URL**: `https://api.liteapi.travel/v3.0/data/languages`

| Feature         | Description                 | Status         |
| --------------- | --------------------------- | -------------- |
| List Languages  | Get all supported languages | ✅ Implemented |
| Language Codes  | ISO language codes          | ✅ Implemented |

---

### 2. Data API - Search Hotels (Room Rates)

**Endpoint**: `POST /hotels/rates`
**Full URL**: `https://api.liteapi.travel/v3.0/hotels/rates`
**Documentation**: <https://docs.liteapi.travel/reference/post_hotels-rates>

| Feature | Description | Status |
| ------- | ----------- | ------ |
| Search Hotels | Search hotels by city or hotel IDs | ✅ Implemented |
| Get Room Rates | Request room rates for hotel IDs | ✅ Implemented |
| Filter by Guests | Filter by occupancy (adults/children) | ✅ Implemented |

#### Search Hotels Request Example

```json
{
  "checkin": "2026-03-01",
  "checkout": "2026-03-05",
  "currency": "USD",
  "guestNationality": "US",
  "occupancies": [
    {
      "adults": 2,
      "children": [5, 10]
    }
  ],
  "cityName": "Paris",
  "countryCode": "FR",
  "limit": 20
}
```

---

### 3. Data API - Get Hotel Details

**Endpoint**: `GET /data/hotel`
**Full URL**: `https://api.liteapi.travel/v3.0/data/hotel`

| Feature | Description | Status |
| ------- | ----------- | ------ |
| Hotel Info | Get detailed hotel information | ✅ Implemented |
| Amenities | Hotel facilities and amenities | ✅ Implemented |
| Location | Hotel location details | ✅ Implemented |

---

### 4. Data API - Get Hotel Reviews

**Endpoint**: `GET /data/reviews`
**Full URL**: `https://api.liteapi.travel/v3.0/data/reviews`

| Feature | Description | Status |
| ------- | ----------- | ------ |
| Hotel Reviews | Get reviews for a hotel | ✅ Implemented |
| Ratings | Review scores and ratings | ✅ Implemented |
| Guest Feedback | Guest comments and feedback | ✅ Implemented |

---

### 5. Data API - Search Hotel Rooms by Image and Text

**Endpoint**: `POST /data/hotels/room-search`
**Full URL**: `https://api.liteapi.travel/v3.0/data/hotels/room-search`

| Feature | Description | Status |
| ------- | ----------- | ------ |
| Image Search | Search rooms by image | ✅ Implemented |
| Text Search | Search rooms by text query | ✅ Implemented |
| Room Types | Different room categories | ✅ Implemented |

---

### 6. Data API - Retrieve Minimum Rate for Hotels

**Endpoint**: `GET /hotels/min-rates`
**Full URL**: `https://api.liteapi.travel/v3.0/hotels/min-rates`

| Feature | Description | Status |
| ------- | ----------- | ------ |
| Minimum Rates | Get lowest rates for hotels | ✅ Implemented |
| Price Comparison | Compare hotel prices | ✅ Implemented |
| Best Price | Find cheapest options | ✅ Implemented |

---

### 7. Booking API - Create Checkout Session (Prebook)

**Endpoint**: `POST /rates/prebook`
**Full URL**: `https://book.liteapi.travel/v3.0/rates/prebook`

| Feature | Description | Status |
| ------- | ----------- | ------ |
| Create Prebook | Initiate checkout session | ✅ Implemented |
| Get Transaction ID | Obtain transaction for booking | ✅ Implemented |
| Price Hold | Hold price for booking | ✅ Implemented |

#### Prebook Request Example

```json
{
  "offerId": "offer_12345",
  "price": {
    "amount": 450.00,
    "currency": "USD"
  },
  "guests": [
    {
      "firstName": "John",
      "lastName": "Doe"
    }
  ],
  "rooms": 1
}
```

---

### 8. Booking API - Complete a Booking

**Endpoint**: `POST /rates/book`
**Full URL**: `https://book.liteapi.travel/v3.0/rates/book`

| Feature | Description | Status |
| ------- | ----------- | ------ |
| Confirm Booking | Confirm booking with transaction ID | ✅ Implemented |
| Get Confirmation | Receive booking confirmation | ✅ Implemented |
| Payment | Process payment with payment method | ✅ Implemented |

#### Payment Methods

| Method | Code | Description |
| ------ | ---- | ----------- |
| Direct Credit Card | `ACC_CREDIT_CARD` | Direct credit card payment. In sandbox mode, can simulate booking without charging. |
| Transaction | `TRANSACTION` | Use when using Payment SDK (provide transactionId) |
| Wallet | `WALLET` | Wallet payment method |

#### Complete Booking Request Example

```json
{
  "transactionId": "txn_abc123",
  "guest": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "+1234567890"
  },
  "payment": {
    "method": "ACC_CREDIT_CARD",
    "cardToken": "tok_xxx"
  }
}
```

---

### 9. Booking API - Retrieve a Prebook by ID

**Endpoint**: `GET /prebooks/{prebookId}`
**Full URL**: `https://book.liteapi.travel/v3.0/prebooks/{prebookId}`

| Feature | Description | Status |
| ------- | ----------- | ------ |
| Get Prebook | Retrieve prebook details | ✅ Implemented |
| Prebook Status | Check prebook status | ✅ Implemented |
| Expiry Info | Prebook expiration time | ✅ Implemented |

---

### 10. Booking API - List Bookings

**Endpoint**: `GET /bookings`
**Full URL**: `https://book.liteapi.travel/v3.0/bookings`

| Feature | Description | Status |
| ------- | ----------- | ------ |
| List All Bookings | Retrieve all bookings | ✅ Implemented |
| Filter by Status | Filter by confirmed/cancelled | ✅ Implemented |
| Pagination | Support limit and offset | ✅ Implemented |

---

### 11. Booking API - Retrieve a Booking

**Endpoint**: `GET /bookings/{bookingId}`
**Full URL**: `https://book.liteapi.travel/v3.0/bookings/{bookingId}`

| Feature | Description | Status |
| ------- | ----------- | ------ |
| Get Booking Details | Retrieve specific booking | ✅ Implemented |
| Booking Status | Check booking status | ✅ Implemented |

---

### 12. Booking API - Cancel a Booking

**Endpoint**: `DELETE /bookings/{bookingId}`
**Full URL**: `https://book.liteapi.travel/v3.0/bookings/{bookingId}`

| Feature | Description | Status |
| ------- | ----------- | ------ |
| Cancel Booking | Cancel a booking | ✅ Implemented |
| Cancellation Reason | Provide cancellation reason | ✅ Implemented |

---

### 13. Booking API - Retrieve All Bookings

**Endpoint**: `GET /bookings/`
**Full URL**: `https://book.liteapi.travel/v3.0/bookings/`

| Feature | Description | Status |
| ------- | ----------- | ------ |
| Get All Bookings | Retrieve all bookings | ✅ Implemented |
| Extended Details | Full booking information | ✅ Implemented |

---

### 14. Booking API - Amend Guest Name

**Endpoint**: `POST /bookings/{bookingId}/amend`
**Full URL**: `https://book.liteapi.travel/v3.0/bookings/{bookingId}/amend`

| Feature | Description | Status |
| ------- | ----------- | ------ |
| Amend Guest Name | Update guest name on booking | ✅ Implemented |
| Modify Booking | Amend booking details | ✅ Implemented |

---

### 15. Voucher API - Create a New Voucher

**Endpoint**: `POST /vouchers`
**Full URL**: `https://da.liteapi.travel/vouchers`

| Feature | Description | Status |
| ------- | ----------- | ------ |
| Create Voucher | Create a new voucher | ✅ Implemented |
| Voucher Details | Set voucher value and rules | ✅ Implemented |

---

### 16. Voucher API - Retrieve All Vouchers

**Endpoint**: `GET /vouchers`
**Full URL**: `https://da.liteapi.travel/vouchers`

| Feature | Description | Status |
| ------- | ----------- | ------ |
| List Vouchers | Get all vouchers | ✅ Implemented |
| Voucher Status | Check voucher status | ✅ Implemented |

---

### 17. Voucher API - Retrieve a Specific Voucher

**Endpoint**: `GET /vouchers/{voucherID}`
**Full URL**: `https://da.liteapi.travel/vouchers/{voucherID}`

| Feature | Description | Status |
| ------- | ----------- | ------ |
| Get Voucher | Retrieve specific voucher | ✅ Implemented |
| Voucher Info | Voucher details and balance | ✅ Implemented |

---

### 18. Voucher API - Update a Voucher

**Endpoint**: `PUT /vouchers/{id}`
**Full URL**: `https://da.liteapi.travel/vouchers/{id}`

| Feature | Description | Status |
| ------- | ----------- | ------ |
| Update Voucher | Modify voucher details | ✅ Implemented |
| Change Value | Update voucher value | ✅ Implemented |

---

### 19. Voucher API - Update Voucher Status

**Endpoint**: `PUT /vouchers/{id}/status`
**Full URL**: `https://da.liteapi.travel/vouchers/{id}/status`

| Feature | Description | Status |
| ------- | ----------- | ------ |
| Activate Voucher | Activate a voucher | ✅ Implemented |
| Deactivate Voucher | Deactivate a voucher | ✅ Implemented |
| Status Change | Update voucher status | ✅ Implemented |

---

### 20. Voucher API - Retrieve Voucher Usage History

**Endpoint**: `GET /vouchers/history`
**Full URL**: `https://da.liteapi.travel/vouchers/history`

| Feature | Description | Status |
| ------- | ----------- | ------ |
| Usage History | Get voucher redemption history | ✅ Implemented |
| Transaction Log | View all voucher transactions | ✅ Implemented |

---

### 21. Voucher API - Delete a Voucher

**Endpoint**: `DELETE /vouchers/{id}/`
**Full URL**: `https://da.liteapi.travel/vouchers/{id}/`

| Feature | Description | Status |
| ------- | ----------- | ------ |
| Delete Voucher | Delete a voucher | ✅ Implemented |
| Remove Voucher | Remove voucher from system | ✅ Implemented |

---

### 22. Loyalty API - Update Loyalty Program

**Endpoint**: `PUT /loyalties`
**Full URL**: `https://api.liteapi.travel/v3.0/loyalties`

| Feature | Description | Status |
| ------- | ----------- | ------ |
| Update Program | Modify loyalty program settings | ✅ Implemented |
| Set Rules | Configure loyalty rules | ✅ Implemented |

---

### 23. Loyalty API - Get Loyalty Program Settings

**Endpoint**: `GET /loyalties`
**Full URL**: `https://api.liteapi.travel/v3.0/loyalties`

| Feature | Description | Status |
| ------- | ----------- | ------ |
| Get Settings | Retrieve current settings | ✅ Implemented |
| Program Status | Check if enabled | ✅ Implemented |
| Program Details | Loyalty program info | ✅ Implemented |

---

### 24. Loyalty API - Fetch Guest's Loyalty Points

**Endpoint**: `GET /guests/{guestId}/loyalty-points`
**Full URL**: `https://api.liteapi.travel/v3.0/guests/{guestId}/loyalty-points`

| Feature | Description | Status |
| ------- | ----------- | ------ |
| Get Points | Retrieve guest's loyalty points | ✅ Implemented |
| Points Balance | Current point balance | ✅ Implemented |
| Points History | Points earning history | ✅ Implemented |

---

### 25. Loyalty API - Redeem Guest's Loyalty Points

**Endpoint**: `POST /guests/{guestId}/loyalty-points/redeem`
**Full URL**: `https://api.liteapi.travel/v3.0/guests/{guestId}/loyalty-points/redeem`

| Feature | Description | Status |
| ------- | ----------- | ------ |
| Redeem Points | Redeem loyalty points | ✅ Implemented |
| Points Deduction | Deduct points from balance | ✅ Implemented |
| Reward Conversion | Convert points to rewards | ✅ Implemented |

---

## API Gateway Routes

All endpoints are integrated with the API Manager (Wicked) for centralized routing:

### Data API Routes

| External Route | Internal Service |
| -------------- | ----------------- |
| `POST /api/hotels/rates` | booking-service |
| `GET /api/data/languages` | booking-service |
| `GET /api/data/hotel` | booking-service |
| `GET /api/data/reviews` | booking-service |
| `POST /api/data/hotels/room-search` | booking-service |
| `GET /api/hotels/min-rates` | booking-service |

### Booking API Routes

| External Route | Internal Service |
| -------------- | ----------------- |
| `POST /api/rates/prebook` | booking-service |
| `POST /api/rates/book` | booking-service |
| `GET /api/prebooks/{prebookId}` | booking-service |
| `GET /api/bookings` | booking-service |
| `GET /api/bookings/{bookingId}` | booking-service |
| `DELETE /api/bookings/{bookingId}` | booking-service |
| `POST /api/bookings/{bookingId}/amend` | booking-service |

### Voucher API Routes

| External Route | Internal Service |
| -------------- | ----------------- |
| `POST /api/vouchers` | booking-service |
| `GET /api/vouchers` | booking-service |
| `GET /api/vouchers/{voucherID}` | booking-service |
| `PUT /api/vouchers/{id}` | booking-service |
| `PUT /api/vouchers/{id}/status` | booking-service |
| `GET /api/vouchers/history` | booking-service |
| `DELETE /api/vouchers/{id}/` | booking-service |

### Loyalty API Routes

| External Route | Internal Service |
| -------------- | ----------------- |
| `GET /api/loyalties` | booking-service |
| `PUT /api/loyalties` | booking-service |
| `GET /api/guests/{guestId}/loyalty-points` | booking-service |
| `POST /api/guests/{guestId}/loyalty-points/redeem` | booking-service |

---

## Implementation Details

### API Flow (All through API Manager)

```text
Frontend → API Gateway (Wicked) → Booking Service → LITEAPI → Neon Database
```

### Frontend Integration

The frontend API functions call the API Gateway, which routes to booking-service:

- `apps/booking-engine/src/lib/api.ts`
- Endpoints: `/api/hotels/rates`, `/api/rates/prebook`, `/api/rates/book`, etc.

### Backend Integration

The booking-service exposes internal routes that the API Gateway routes to:

- `services/booking-service/src/routes/liteapi.ts`

### Environment Variables

Required environment variables in `.env`:

```bash
# Data API
LITEAPI_BASE_URL=https://api.liteapi.travel/v3.0

# Booking API
LITEAPI_BOOK_BASE_URL=https://book.liteapi.travel/v3.0

# Voucher API (DA)
LITEAPI_DA_BASE_URL=https://da.liteapi.travel

# API Keys
LITEAPI_TEST_API_KEY=sand_e79a7012-2820-4644-874f-ea71a9295a0e
LITEAPI_PROD_API_KEY=your_production_key
```

---

## Summary

### ✅ Implemented Endpoints

#### Data API

- List Supported Languages
- Search Hotels (Room Rates)
- Get Hotel Details
- Get Hotel Reviews
- Search Hotel Rooms by Image and Text
- Retrieve Minimum Rate for Hotels

#### Booking API

- Create Checkout Session (Prebook)
- Complete a Booking
- Retrieve a Prebook by ID
- List Bookings
- Retrieve a Booking
- Cancel a Booking
- Retrieve All Bookings
- Amend Guest Name on Booking

#### Voucher API

- Create a New Voucher
- Retrieve All Vouchers
- Retrieve a Specific Voucher
- Update a Voucher
- Update Voucher Status
- Retrieve Voucher Usage History
- Delete a Voucher

#### Loyalty API

- Update Loyalty Program
- Get Loyalty Program Settings
- Fetch Guest's Loyalty Points
- Redeem Guest's Loyalty Points

---

**Last Updated**: February 20, 2026
**API Documentation**: <https://docs.liteapi.travel/reference/overview>
**Hotel Rates API**: <https://docs.liteapi.travel/reference/post_hotels-rates>

---

## MCP Server Integration

LiteAPI provides an MCP (Model Context Protocol) server that allows AI systems to access LiteAPI capabilities directly. This enables AI assistants to perform hotel searches, bookings, and other operations through a standardized protocol.

### MCP Server Endpoint

```
https://mcp.liteapi.travel/api/mcp?apiKey=YOUR_API_KEY
```

### Configuration

To use the MCP server, add the following to your environment:

```bash
LITEAPI_MCP_API_KEY=sand_e79a7012-2820-4644-874f-ea71a9295a0e
```

### AI Tool Integration

**Claude Desktop**:

```json
{
  "mcpServers": {
    "liteapi": {
      "url": "https://mcp.liteapi.travel/api/mcp?apiKey=sand_e79a7012-2820-4644-874f-ea71a9295a0e"
    }
  }
}
```

### Supported MCP Capabilities

- Hotel search
- Price and availability lookup
- Hotel details retrieval
- Prebooking
- Booking flows
- Place search

See [MCP Server Documentation](https://docs.liteapi.travel/reference/mcp-server) for more details.
