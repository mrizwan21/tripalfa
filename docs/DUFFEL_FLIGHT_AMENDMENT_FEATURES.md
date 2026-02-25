# Duffel Flight Amendment Features Implementation Guide

This document covers the implementation of flight post-booking features based on Duffel API documentation:

- [Cancelling an Order](https://duffel.com/docs/guides/cancelling-an-order)
- [Changing an Order](https://duffel.com/docs/guides/changing-an-order)
- [Adding Post Booking Bags](https://duffel.com/docs/guides/adding-post-booking-bags)
- [Using Airline Credits](https://duffel.com/docs/guides/using-airline-credits)

---

## Table of Contents

1. [Cancelling an Order](#cancelling-an-order)
2. [Changing an Order](#changing-an-order)
3. [Adding Post Booking Bags](#adding-post-booking-bags)
4. [Using Airline Credits](#using-airline-credits)
5. [API Endpoints Summary](#api-endpoints-summary)

---

## Cancelling an Order

### Overview

The cancellation flow in Duffel involves two steps:
1. **Create Cancellation Quote** - Get refund details before confirming
2. **Confirm Cancellation** - Finalize the cancellation

### Implementation

**Endpoint: `POST /api/duffel/order-cancellations`**

Creates an unconfirmed cancellation quote for an order. Returns refund details including:
- `refund_amount` - Amount to be refunded
- `refund_currency` - Currency of the refund  
- `refund_to` - Destination of refund (`original_form_of_payment` or `airline_credits`)
- `expires_at` - Quote expiration timestamp
- `airline_credits` - Array of credit details (if refunding to airline credits)

**Request:**
```json
{
  "order_id": "ord_00009hthhsUZ8W4LxQgkjo"
}
```

**Response:**
```json
{
  "id": "ore_00009qzZWzjDipIkqpaUAj",
  "refund_currency": "GBP",
  "refund_amount": "90.80",
  "expires_at": "2020-01-17T10:42:14Z",
  "refund_to": "original_form_of_payment"
}
```

**Confirming Cancellation: `POST /api/duffel/order-cancellations/:id/confirm`**

After reviewing the cancellation quote, confirm to finalize:
```json
{}
```

### Database Schema

The `duffelOrderCancellation` table stores:
- `externalId` - Duffel cancellation ID
- `orderId` - Reference to local order
- `status` - pending, confirmed, failed
- `refundAmount`, `refundCurrency` - Refund details
- `refundTo` - original_form_of_payment or airline_credits
- `airlineCredits` - JSON array of credit details
- `confirmedAt` - Confirmation timestamp

---

## Changing an Order

### Overview

Order changes allow passengers to modify their bookings:
- Change flight dates
- Change destinations
- Change cabin class
- The flow involves: Change Request → Get Offers → Select Offer → Confirm Change

### Implementation

**Step 1: Create Order Change Request**

**Endpoint: `POST /api/duffel/order-change-requests`**

```json
{
  "order_id": "ord_0000A8L6Pqy4nZVh0nPdK6",
  "slices": {
    "remove": [
      { "slice_id": "sli_0000A8L6Pqy4nZVh0nPdK6" }
    ],
    "add": [
      {
        "origin": "ATL",
        "destination": "SWF",
        "departure_date": "2022-06-24",
        "cabin_class": "business"
      }
    ]
  }
}
```

**Response includes `order_change_offers`** - Available change options with pricing.

**Step 2: Create Order Change**

**Endpoint: `POST /api/duffel/order-changes`**

```json
{
  "selected_order_change_offer": {
    "id": "oco_0000A8LNLgZVCzBypYW5mC"
  }
}
```

**Step 3: Confirm Order Change**

**Endpoint: `POST /api/duffel/order-changes/confirm`**

```json
{
  "order_change_id": "och_0000A8LNLgZVCzBypYW5mC",
  "payment": {
    "type": "balance",
    "currency": "GBP",
    "amount": "30.20"
  }
}
```

If there's an additional cost (positive `change_total_amount`), payment is required.

### Database Schema

The `duffelOrderChange` table stores:
- `externalId` - Duffel change ID
- `orderId` - Reference to local order
- `requestedChanges` - JSON of requested modifications
- `changeOffers` - Array of available change offers
- `status` - pending, confirmed, failed
- `confirmedAt` - Confirmation timestamp

---

## Adding Post Booking Bags

### Overview

After booking, customers can add additional baggage, seats, or meals to their order.

### Implementation

**Step 1: Get Available Services**

**Endpoint: `GET /api/duffel/orders/:id/available-services`**

Returns services that can be added (baggage, seats, meals).

**Response:**
```json
{
  "data": [
    {
      "id": "service_id",
      "type": "baggage",
      "total_amount": 10,
      "total_currency": "GBP",
      "segment_ids": ["segment_id"],
      "passenger_ids": ["passenger_id"]
    }
  ]
}
```

**Step 2: Add Services to Order**

**Endpoint: `POST /api/duffel/bags` (or `POST /api/duffel/order-services`)**

```json
{
  "order_id": "ord_0000ABC123",
  "services": [
    {
      "quantity": 2,
      "id": "service_001"
    }
  ],
  "payment": {
    "type": "balance",
    "currency": "GBP",
    "amount": 20
  }
}
```

### Database Updates

When services are added:
- Order is updated in database
- Redis cache is invalidated
- New services are stored in order metadata

---

## Using Airline Credits

### Overview

When an order is cancelled, airlines may issue credits instead of monetary refunds. These credits:
- Take the form of a "code" for future use
- Are typically valid for 1-2 years
- Can be used on the airline's website

### Implementation

**Airline Credits in Cancellation Response**

When a cancellation is refunded to airline credits, the response includes:

```json
{
  "id": "ore_00009qzZWzjDipIkqpaUAj",
  "refund_currency": "GBP",
  "refund_amount": "90.80",
  "refund_to": "airline_credits",
  "airline_credits": [
    {
      "passenger_id": "pas_00009hj8USM7Ncg31cBCLL",
      "credit_name": "Duffel Travel Credit",
      "credit_currency": "GBP",
      "credit_amount": "90.80",
      "credit_code": "1234567890123"
    }
  ]
}
```

**Storing Airline Credits**

The system stores airline credits in:
1. `duffelOrderCancellation.airlineCredits` - JSON field
2. User's wallet/account for tracking

**Using Airline Credits**

Credits can be used in two ways:
1. **Direct with Airline** - Customer uses credit code on airline website
2. **Via Duffel** - Credits applied to future bookings (when supported)

### Database Schema

```typescript
interface AirlineCredit {
  id: string;
  passengerId: string;
  creditName: string;
  creditAmount: number;
  creditCurrency: string;
  creditCode: string; // null until confirmed
  orderId: string;
  createdAt: Date;
  expiresAt?: Date;
  status: 'pending' | 'confirmed' | 'used' | 'expired';
}
```

---

## API Endpoints Summary

### Order Cancellations

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/duffel/order-cancellations` | Create cancellation quote |
| GET | `/api/duffel/order-cancellations/:id` | Get cancellation details |
| GET | `/api/duffel/order-cancellations` | List all cancellations |
| POST | `/api/duffel/order-cancellations/:id/confirm` | Confirm cancellation |

### Order Changes

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/duffel/order-change-requests` | Create change request |
| GET | `/api/duffel/order-change-requests/:id` | Get change request |
| POST | `/api/duffel/order-changes` | Create order change |
| POST | `/api/duffel/order-changes/confirm` | Confirm order change |
| GET | `/api/duffel/order-changes/:id` | Get order change |

### Post-Booking Services

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/duffel/orders/:id/available-services` | Get available services |
| POST | `/api/duffel/bags` | Add baggage to order |
| POST | `/api/duffel/order-services` | Add services to order |

### Airline Credits

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/duffel/airline-credits` | List airline credits |
| GET | `/api/duffel/airline-credits/:id` | Get credit details |
| POST | `/api/airline-credits` | Create credit record |

---

## Workflow Examples

### Cancellation Flow

```
1. User requests cancellation
   ↓
2. POST /api/duffel/order-cancellations
   (get refund quote)
   ↓
3. Display refund amount & expiry to user
   ↓
4. User confirms cancellation
   ↓
5. POST /api/duffel/order-cancellations/:id/confirm
   ↓
6. Order status → cancelled
   (if airline_credits: store credit codes)
   ↓
7. Refund processed
```

### Change Flight Flow

```
1. User requests flight change
   ↓
2. POST /api/duffel/order-change-requests
   (specify new dates/destination)
   ↓
3. Get available change offers
   ↓
4. User selects offer
   ↓
5. POST /api/duffel/order-changes
   ↓
6. User confirms & pays (if applicable)
   ↓
7. POST /api/duffel/order-changes/confirm
   ↓
8. Order updated with new flights
```

### Add Baggage Flow

```
1. User views booking
   ↓
2. GET /api/duffel/orders/:id/available-services
   ↓
3. Display available baggage options
   ↓
4. User selects baggage
   ↓
5. POST /api/duffel/bags
   ↓
6. Payment processed
   ↓
7. Order updated with new baggage
```

---

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message description",
  "code": "ERROR_CODE"
}
```

Common error codes:
- `ORDER_NOT_FOUND` - Order doesn't exist
- `CANCELLATION_NOT_ALLOWED` - Order cannot be cancelled
- `CHANGE_NOT_ALLOWED` - Order cannot be modified
- `QUOTE_EXPIRED` - Cancellation/change quote expired
- `PAYMENT_FAILED` - Payment processing failed
- `SERVICE_NOT_AVAILABLE` - Requested service not available

---

## Testing

### Test Order for Cancellation

Use a one-way flight from London Luton (LTN) to Sydney (SYD) to simulate airline credits refund.

### Test Endpoints

```bash
# Create cancellation
curl -X POST https://api.duffel.com/air/order_cancellations \
  -H "Authorization: Bearer $TOKEN" \
  -H "Duffel-Version: v2" \
  -d '{"data": {"order_id": "ord_xxx"}}'

# Confirm cancellation
curl -X POST https://api.duffel.com/air/order_cancellations/ore_xxx/confirm \
  -H "Authorization: Bearer $TOKEN" \
  -H "Duffel-Version: v2"
```

---

## Implementation Files

- **Routes:** `services/booking-service/src/routes/duffel.ts`
- **API Manager:** `services/booking-service/src/services/duffel-api-manager.service.ts`
- **Database:** `database/prisma/schema.prisma` (duffelOrderCancellation, duffelOrderChange)
- **Airline Credits:** `services/booking-service/src/routes/airlineCredits.ts`

---

## See Also

- [Duffel API Documentation](https://duffel.com/docs/api/v2)
- [Duffel Cancellation Guide](https://duffel.com/docs/guides/cancelling-an-order)
- [Duffel Order Changes Guide](https://duffel.com/docs/guides/changing-an-order)
- [Duffel Post-Booking Services](https://duffel.com/docs/guides/adding-post-booking-bags)
