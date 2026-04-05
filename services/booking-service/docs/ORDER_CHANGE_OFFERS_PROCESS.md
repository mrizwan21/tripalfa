# Order Change Offers Process - Duffel API

## Overview

Order change offers are specific flight options provided by airlines in response to an order change request. When a passenger needs to modify their existing flight booking (change dates, times, routes, or passengers), they submit an order change request. The airline then evaluates the request and returns one or more order change offers, each representing a possible modification with associated pricing and conditions.

## Process Flow

### 1. Order Change Request Submission

- **Endpoint**: `POST /api/duffel/order-change-requests`
- **Purpose**: Submit a request to change an existing flight order
- **Required Parameters**:
  - `order_id`: The Duffel order ID to modify
  - `slices`: Array of slice changes specifying the modifications requested

### 2. Airline Processing

- The airline receives the change request
- The airline evaluates availability, fare rules, and pricing
- Multiple change options may be generated based on:
  - Alternative flight times/dates
  - Different routing options
  - Various fare classes
  - Different passenger configurations

### 3. Order Change Offers Generation

- The airline returns a collection of `order_change_offers`
- Each offer contains:
  - **Price**: Total change cost (could be additional payment or refund)
  - **Slices**: Modified flight segments
  - **Conditions**: Change rules, penalties, and restrictions
  - **Expiry**: Time limit for accepting the offer

### 4. Offer Selection

- Customer reviews the available offers
- Selects the most suitable option based on price, timing, and convenience
- Submits selection via `POST /api/duffel/order-changes`

### 5. Order Change Confirmation

- Final confirmation via `POST /api/duffel/order-changes/confirm`
- Payment processing (if additional payment required)
- Ticket reissuance and confirmation

## Slices and Segments Structure

### Key Concepts

#### **Slice**

A slice represents a journey from an origin to a destination, which may include one or more flight segments. In the context of order changes:

- **Original Slice**: The existing flight segment(s) being modified
- **Modified Slice**: The proposed new flight segment(s)

#### **Segment**

A segment is a single flight leg between two airports on a specific date with a specific flight number.

### Slice Structure in Order Change Offers

```json
{
  "slices": [
    {
      "origin": {
        "iata_code": "LHR",
        "name": "London Heathrow"
      },
      "destination": {
        "iata_code": "JFK",
        "name": "John F. Kennedy International"
      },
      "duration": "8h 15m",
      "segments": [
        {
          "marketing_carrier": {
            "iata_code": "BA",
            "name": "British Airways"
          },
          "operating_carrier": {
            "iata_code": "BA",
            "name": "British Airways"
          },
          "flight_number": "178",
          "aircraft": {
            "iata_code": "777"
          },
          "origin": {
            "iata_code": "LHR",
            "terminal": "5",
            "at": "2024-06-15T10:00:00"
          },
          "destination": {
            "iata_code": "JFK",
            "terminal": "7",
            "at": "2024-06-15T13:15:00"
          },
          "duration": "8h 15m",
          "passengers": [
            {
              "passenger_id": "pas_123",
              "cabin_class": "economy",
              "fare_basis": "Y26"
            }
          ]
        }
      ]
    }
  ]
}
```

### Change Types Supported

1. **Date/Time Changes**: Moving to different departure/arrival times
2. **Route Changes**: Changing origin, destination, or stopovers
3. **Cabin Class Changes**: Upgrading or downgrading cabin class
4. **Passenger Changes**: Adding, removing, or modifying passenger details
5. **Combination Changes**: Multiple modifications in a single request

## Order Change Offer Object

Each order change offer contains the following key properties:

```typescript
interface OrderChangeOffer {
  id: string; // Unique identifier for the offer
  order_change_request_id: string; // Parent change request ID
  total_amount: string; // Total price (e.g., "150.00")
  total_currency: string; // Currency code (e.g., "USD")

  // Payment details
  change_total_amount: string; // Amount to pay (positive) or refund (negative)
  change_total_currency: string;
  penalty_total_amount: string; // Any penalty charges
  penalty_total_currency: string;

  // Flight details
  slices: Slice[]; // Modified slices
  passengers: PassengerChange[]; // Passenger modifications

  // Timestamps
  created_at: string; // ISO 8601 timestamp
  expires_at: string; // Offer expiry timestamp

  // Status
  available: boolean; // Whether offer is still available
  conditions: ChangeConditions; // Rules and restrictions
}
```

## API Endpoints

### 1. Create Order Change Request

```http
POST /api/duffel/order-change-requests
```

Creates a new order change request and retrieves available offers.

### 2. Get Order Change Request

```http
GET /api/duffel/order-change-requests/:id
```

Retrieves a specific order change request with its associated offers.

### 3. Get Order Change Offers

```http
GET /api/duffel/order-change-offers?order_change_request_id=:id
```

Retrieves all offers for a specific change request.

### 4. Get Single Order Change Offer

```http
GET /api/duffel/order-change-offers/:id
```

Retrieves a specific order change offer by ID.

### 5. Create Order Change

```http
POST /api/duffel/order-changes
```

Creates a pending order change by selecting a specific offer.

### 6. Confirm Order Change

```http
POST /api/duffel/order-changes/confirm
```

Confirms and finalizes the order change.

## Pricing and Payment

### Cost Components

1. **Fare Difference**: Difference between original and new fares
2. **Change Fees**: Airline-imposed change penalties
3. **Tax Differences**: Changes in taxes and fees
4. **Ancillary Changes**: Modifications to add-ons (bags, seats, etc.)

### Payment Scenarios

- **Additional Payment**: Customer pays extra for the change
- **Refund**: Customer receives money back (rare)
- **Zero Change**: No financial impact (within change windows)

### Payment Methods

- Original form of payment (automatic charge/refund)
- Alternative payment methods (if supported)
- Airline credits/vouchers

## Error Handling and Edge Cases

### Common Issues

1. **Offer Expiry**: Offers typically expire within 1-24 hours
2. **Inventory Changes**: Seats may become unavailable between offer and acceptance
3. **Pricing Changes**: Final price may differ at confirmation time
4. **Rule Violations**: Request may violate fare rules

### Retry Logic

- Implement exponential backoff for transient failures
- Cache offers to reduce API calls
- Validate offers before presenting to customers

## Best Practices

### For Implementation

1. **Always check offer expiry** before presenting to customers
2. **Validate slice changes** match customer requirements
3. **Calculate total cost** including all fees and taxes
4. **Provide clear explanations** of changes and costs

### For User Experience

1. **Display all available options** with clear comparisons
2. **Highlight key differences** from original booking
3. **Show total cost breakdown** (fare difference + fees)
4. **Indicate time sensitivity** of offers

## Implementation Examples

### 1. Creating an Order Change Request (Actual Code)

```typescript
// From services/booking-service/src/routes/duffel-enhanced.ts
router.post('/order-change-requests', async (req: Request, res: Response) => {
  try {
    const { order_id, slices } = req.body;

    if (!order_id) {
      return res.status(400).json({ error: 'order_id is required' });
    }

    if (!slices) {
      return res.status(400).json({ error: 'slices is required' });
    }

    // Call Duffel API
    const duffelResponse = await duffelClient.request({
      method: 'POST',
      url: '/air/order_change_requests',
      data: {
        data: {
          order_id,
          slices,
        },
      },
    });

    const changeData = duffelResponse.data;

    // Store in database
    const order = await prisma.duffelOrder.findUnique({
      where: { externalId: order_id },
    });

    if (order) {
      await prisma.duffelOrderChangeRequest.create({
        data: {
          externalId: changeData.id,
          orderId: order.id,
          requestedChanges: slices,
          changeOffers: changeData.order_change_offers,
          status: 'pending',
        },
      });
    }

    res.json({
      success: true,
      data: changeData,
    });
  } catch (error: any) {
    console.error('[Duffel] Create order change request error:', error.message);
    res.status(500).json({ error: error.message });
  }
});
```

### 2. Selecting and Creating an Order Change

```typescript
// From services/booking-service/src/routes/duffel.ts
router.post('/order-changes', async (req: Request, res: Response) => {
  try {
    const { selected_order_change_offer } = req.body;

    if (!selected_order_change_offer?.id) {
      return res.status(400).json({ error: 'selected_order_change_offer.id is required' });
    }

    // Call Duffel API
    const duffelResponse = await duffelRequest<any>('/air/order_changes', 'POST', {
      data: {
        selected_order_change_offer,
      },
    });

    res.json({
      success: true,
      data: duffelResponse.data,
    });
  } catch (error: any) {
    console.error('[Duffel] Create order change error:', error.message);
    res.status(500).json({ error: error.message });
  }
});
```

### 3. Confirming an Order Change

```typescript
// From services/booking-service/src/routes/duffel-enhanced.ts
router.post('/order-changes/confirm', async (req: Request, res: Response) => {
  try {
    const { order_change_id } = req.body;

    if (!order_change_id) {
      return res.status(400).json({ error: 'order_change_id is required' });
    }

    // Call Duffel API
    const duffelResponse = await duffelClient.request({
      method: 'POST',
      url: '/air/order_changes/confirm',
      data: {
        data: { order_change_id },
      },
    });

    // Update in database
    await prisma.duffelOrderChangeRequest.updateMany({
      where: { externalId: order_change_id },
      data: {
        status: 'confirmed',
        updatedAt: new Date(),
      },
    });

    res.json({
      success: true,
      data: duffelResponse.data,
    });
  } catch (error: any) {
    console.error('[Duffel] Confirm order change error:', error.message);
    res.status(500).json({ error: error.message });
  }
});
```

### 4. Example Request Payload

```json
{
  "order_id": "ord_1234567890abcdef",
  "slices": [
    {
      "slice_id": "sli_original_123",
      "origin": "LHR",
      "destination": "JFK",
      "departure_date": "2024-07-20",
      "cabin_class": "economy",
      "change_type": "date_change",
      "new_departure_date": "2024-07-25"
    }
  ]
}
```

### 5. Example Response with Order Change Offers

```json
{
  "id": "ocr_abcdef123456",
  "order_id": "ord_1234567890abcdef",
  "status": "pending",
  "order_change_offers": [
    {
      "id": "oco_1234567890",
      "total_amount": "150.00",
      "total_currency": "USD",
      "change_total_amount": "150.00",
      "change_total_currency": "USD",
      "penalty_total_amount": "50.00",
      "penalty_total_currency": "USD",
      "slices": [
        {
          "origin": {
            "iata_code": "LHR",
            "name": "London Heathrow"
          },
          "destination": {
            "iata_code": "JFK",
            "name": "John F. Kennedy International"
          },
          "duration": "8h 15m",
          "segments": [
            {
              "marketing_carrier": {
                "iata_code": "BA",
                "name": "British Airways"
              },
              "flight_number": "178",
              "origin": {
                "iata_code": "LHR",
                "terminal": "5",
                "at": "2024-07-25T10:00:00"
              },
              "destination": {
                "iata_code": "JFK",
                "terminal": "7",
                "at": "2024-07-25T13:15:00"
              }
            }
          ]
        }
      ],
      "created_at": "2024-03-23T10:30:00Z",
      "expires_at": "2024-03-23T14:30:00Z",
      "available": true
    }
  ],
  "created_at": "2024-03-23T10:25:00Z"
}
```

## Integration with Existing System

### Database Models

The system uses Prisma models to track order changes in the `schema.core.prisma` file:

#### `duffel_order_change_request`

Stores order change requests and the associated offers returned by Duffel:

```prisma
model duffel_order_change_request {
  id              String    @id @default(cuid())
  externalId      String?   @unique  // Duffel API order_change_request ID
  orderId         String
  order           duffel_order @relation(fields: [orderId], references: [id], onDelete: Cascade)

  // Request details
  requestedChanges Json?    // The slices that were requested to be changed
  changeOffers     Json?    // The order_change_offers returned by Duffel

  // Status tracking
  status          String    @default("pending")
  errorMessage    String?

  // Timestamps
  createdAt       DateTime  @default(now()) @db.Timestamptz(6)
  updatedAt       DateTime  @updatedAt @db.Timestamptz(6)
  expiresAt       DateTime? @db.Timestamptz(6)

  // Metadata
  metadata        Json?
}
```

#### `duffel_order_change`

Tracks confirmed order changes after an offer is selected:

```prisma
model duffel_order_change {
  id                      String    @id @default(cuid())
  externalId              String?   @unique  // Duffel API order_change ID
  orderId                 String
  orderChangeRequestId    String?

  // Relations
  order                   duffel_order @relation(fields: [orderId], references: [id], onDelete: Cascade)
  orderChangeRequest      duffel_order_change_request? @relation(fields: [orderChangeRequestId], references: [id], onDelete: SetNull)

  // Change details
  selectedOrderChangeOfferId String?  // The selected offer ID
  changeDetails          Json?        // The full change details from Duffel
  paymentRequired        Boolean     @default(false)
  paymentAmount          Decimal?    @db.Decimal(12, 2)
  paymentCurrency        String      @default("USD")
  refundAmount           Decimal?    @db.Decimal(12, 2)
  refundCurrency         String      @default("USD")

  // Status tracking
  status                  String    @default("pending") // pending, confirmed, failed, expired
  confirmedAt             DateTime? @db.Timestamptz(6)
  failedAt                DateTime? @db.Timestamptz(6)
  failureReason           String?

  // Timestamps
  createdAt               DateTime  @default(now()) @db.Timestamptz(6)
  updatedAt               DateTime  @updatedAt @db.Timestamptz(6)

  // Metadata
  metadata                Json?
}
```

#### Relationships

- `duffel_order` (parent booking) ↔ `duffel_order_change_request` (1-to-many)
- `duffel_order_change_request` ↔ `duffel_order_change` (1-to-1, optional)
- Both models reference the original `duffel_order` for booking context

### Caching Strategy

- Order change offers are cached in Redis to reduce API calls
- Cache expiry matches offer expiry times
- Fallback to database when Duffel API is unavailable

### Error Recovery

- Automatic retry for transient failures
- Database persistence for audit trail
- Webhook integration for status updates

## Testing Examples

### Unit Test for Order Change Creation

```typescript
// Example test from the codebase
describe('Order Change Offers', () => {
  it('should create order change request with valid slices', async () => {
    const mockResponse = {
      id: 'ocr_test123',
      order_change_offers: [
        {
          id: 'oco_test456',
          total_amount: '100.00',
          total_currency: 'USD',
        },
      ],
    };

    // Mock Duffel API call
    duffelClient.request.mockResolvedValue({ data: mockResponse });

    const response = await request(app)
      .post('/api/duffel/order-change-requests')
      .send({
        order_id: 'ord_test',
        slices: [{ slice_id: 'sli_test', new_departure_date: '2024-07-25' }],
      });

    expect(response.status).toBe(200);
    expect(response.body.data.order_change_offers).toHaveLength(1);
  });
});
```

## References

- [Duffel Order Change Offers API](https://duffel.com/docs/api/v2/order-change-offers)
- [Duffel Order Change Offers Schema](https://duffel.com/docs/api/v2/order-change-offers/schema)
- [Get Order Change Offers by Request ID](https://duffel.com/docs/api/v2/order-change-offers/get-order-change-offers-by-order-change-request-id)
- [Get Order Change Offer by ID](https://duffel.com/docs/api/v2/order-change-offers/get-order-change-offer-by-id)
