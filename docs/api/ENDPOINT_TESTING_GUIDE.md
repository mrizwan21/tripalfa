# Endpoint Testing Guide

## Prerequisites

1. Start the booking-service:

```bash
cd services/booking-service
pnpm run dev
```

1. Start the frontend:

```bash
cd apps/booking-engine
pnpm run dev
```

## Testing Hotel Search Endpoint

### Test 1: Search Hotels via API Gateway

```bash
curl -X POST http://localhost:3000/api/search/hotels \
  -H "Content-Type: application/json" \
  -d '{
    "location": "Paris",
    "checkin": "2026-03-01",
    "checkout": "2026-03-05",
    "adults": 2,
    "rooms": 1
  }'
```

Expected Response:

```json
{
  "results": [
    {
      "id": "hotel-id",
      "name": "Hotel Name",
      "image": "https://...",
      "location": "Hotel Address",
      "rating": 4,
      "price": { "amount": 150, "currency": "USD" },
      "offers": [],
      "provider": "LiteAPI"
    }
  ],
  "total": 10
}
```

### Test 2: Get Hotel Rates

```bash
curl -X POST http://localhost:3000/api/hotels/rates \
  -H "Content-Type: application/json" \
  -d '{
    "cityName": "Paris",
    "checkin": "2026-03-01",
    "checkout": "2026-03-05",
    "currency": "USD",
    "guestNationality": "US",
    "occupancies": [{ "adults": 2 }],
    "limit": 20
  }'
```

### Test 3: Prebook Hotel

```bash
curl -X POST http://localhost:3000/api/rates/prebook \
  -H "Content-Type: application/json" \
  -d '{
    "offerId": "offer-123",
    "price": 150,
    "currency": "USD"
  }'
```

### Test 4: Book Hotel (Confirm)

```bash
curl -X POST http://localhost:3000/api/rates/book \
  -H "Content-Type: application/json" \
  -d '{
    "prebookId": "transaction-123",
    "guestDetails": {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com"
    }
  }'
```

## Testing Booking Management Endpoints

### Test 5: List Bookings

```bash
curl http://localhost:3000/api/bookings
```

### Test 6: Get Specific Booking

```bash
curl http://localhost:3000/api/bookings/booking-id-here
```

### Test 7: Cancel Booking

```bash
curl -X PUT http://localhost:3000/api/bookings/booking-id-here \
  -H "Content-Type: application/json" \
  -d '{
    "status": "cancelled",
    "cancellationReason": "User requested"
  }'
```

## Testing Loyalty Endpoints

### Test 8: Get Loyalty Settings

```bash
curl http://localhost:3000/api/loyalty/loyalties
```

Expected Response:

```json
{
  "enabled": true,
  "cashbackRate": 0.03,
  "programName": "TripAlfa Rewards"
}
```

### Test 9: Get User Loyalty

```bash
curl http://localhost:3000/api/loyalty/user/user-id-here
```

### Test 10: Get Loyalty Tiers

```bash
curl http://localhost:3000/api/loyalty/tiers
```

Expected Response:

```json
[
  {
    "id": "bronze",
    "name": "Bronze",
    "level": 1,
    "minPoints": 0,
    "maxPoints": 5000,
    "discountPercentage": 5,
    "pointsMultiplier": 1
  },
  {
    "id": "silver",
    "name": "Silver",
    "level": 2,
    "minPoints": 5001,
    "maxPoints": 10000,
    "discountPercentage": 10,
    "pointsMultiplier": 1.5
  },
  {
    "id": "gold",
    "name": "Gold",
    "level": 3,
    "minPoints": 10001,
    "maxPoints": 25000,
    "discountPercentage": 15,
    "pointsMultiplier": 2
  },
  {
    "id": "platinum",
    "name": "Platinum",
    "level": 4,
    "minPoints": 25001,
    "maxPoints": 999999,
    "discountPercentage": 20,
    "pointsMultiplier": 3
  }
]
```

### Test 11: Get Points History

```bash
curl "http://localhost:3000/api/loyalty/transactions/user-id-here?limit=10"
```

### Test 12: Get Expiring Points

```bash
curl http://localhost:3000/api/loyalty/user/user-id-here/expiring-points
```

### Test 13: Enable Loyalty Program

```bash
curl -X POST http://localhost:3000/api/loyalty/loyalties \
  -H "Content-Type: application/json" \
  -d '{
    "enabled": true,
    "cashbackRate": 0.05,
    "programName": "TripAlfa Rewards"
  }'
```

### Test 14: Update Loyalty Settings

```bash
curl -X PUT http://localhost:3000/api/loyalty/loyalties \
  -H "Content-Type: application/json" \
  -d '{
    "enabled": true,
    "cashbackRate": 0.1
  }'
```

### Test 15: Get Guest Bookings (with points)

```bash
curl http://localhost:3000/api/loyalty/guests/user-id-here/bookings
```

### Test 16: Get Guests

```bash
curl http://localhost:3000/api/loyalty/guests
```

## Testing via Frontend

### Hotel Search Flow

1. Open <http://localhost:5173>
2. Navigate to Hotels tab
3. Enter destination (e.g., "Paris")
4. Select check-in and check-out dates
5. Click Search
6. Verify hotels appear in results

### Loyalty Dashboard Flow

1. Open <http://localhost:5173/loyalty>
2. Verify:
   - Current points balance is displayed
   - Tier status is shown (Bronze/Silver/Gold/Platinum)
   - Points history is loaded
   - Expiring points warning (if any)

### User Profile Flow

1. Open <http://localhost:5173/profile>
2. Navigate to Preferences & Loyalty section
3. Verify loyalty module and membership number fields

## Expected Data Flow

```text
Frontend (booking-engine)
    ↓
API Gateway (Wicked - Port 3000)
    ↓
Booking Service (Port 3003)
    ↓
LITEAPI / Neon Database
```

## Troubleshooting

### If Hotel Search Returns Empty

- Check that LITEAPI_KEY is set in .env
- Verify LITEAPI_BASE_URL is correct
- Check console for API errors

### If Loyalty Shows No Data

- Ensure user is logged in
- Check that booking-service is running
- Verify database has user records

### If CORS Errors

- Ensure API Gateway CORS is configured
- Check that frontend VITE_API_GATEWAY_URL is correct

## Environment Variables Required

Create `.env` file in services/booking-service:

```env
LITEAPI_BASE_URL=https://api.liteapi.travel/v3.0
LITEAPI_API_KEY=sand_e79a7012-2820-4644-874f-ea71a9295a0e
DATABASE_URL=postgresql://...your-neon-connection-string...
```
