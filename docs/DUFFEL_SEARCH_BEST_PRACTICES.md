# Duffel Flight Search Best Practices

This document outlines the best practices for implementing flight search using the Duffel API, based on [Duffel's official best practices guide](https://duffel.com/docs/guides/following-search-best-practices).

## Overview

Implementing Duffel's search best practices improves:
- **Relevance**: Return flights that match user intent
- **Performance**: Reduce API response times
- **User Experience**: Better filtering and sorting options

---

## Implemented Best Practices

### 1. Search Filters

The flight search endpoint now supports the following filters:

#### `max_connections` (Integer)
Limit the number of connections/stops in a flight.

```json
{
  "max_connections": 0,
  "slices": [...]
}
```

| Value | Description |
|-------|-------------|
| `0` | Direct flights only |
| `1` | Maximum 1 stop |
| `2` | Maximum 2 stops |

#### `direct_flights` (Boolean)
Shorthand for requesting only direct flights.

```json
{
  "direct_flights": true,
  "slices": [...]
}
```

> **Note**: `direct_flights: true` is equivalent to `max_connections: 0`.

#### `max_price` (Object)
Filter flights by maximum price.

```json
{
  "max_price": {
    "amount": 500.00,
    "currency": "USD"
  },
  "slices": [...]
}
```

### 2. Sorting

#### `sort_by` (String)
Sort results by specified criteria.

```json
{
  "sort_by": "total_amount",
  "slices": [...]
}
```

| Value | Description |
|-------|-------------|
| `total_amount` | Cheapest first |
| `duration` | Fastest first |
| `departure` | Earliest departure first |
| `arrival` | Earliest arrival first |

### 3. Passenger Type Normalization

All passenger requests now include explicit `type` field:

```json
{
  "passengers": [
    {
      "type": "adult",
      "given_name": "John",
      "family_name": "Doe"
    },
    {
      "type": "child",
      "given_name": "Jane",
      "family_name": "Doe"
    }
  ]
}
```

| Passenger Type | Description |
|---------------|-------------|
| `adult` | Adult (12+ years) |
| `child` | Child (2-11 years) |
| `infant` | Infant (under 2, on lap) |

### 4. Available Services

The search includes `return_available_services: true` by default to retrieve:
- Baggage allowances
- Meal options
- Seat availability
- Other ancillary services

This eliminates the need for a separate API call when displaying add-ons.

---

## API Usage Examples

### Search for Direct Flights Only

```bash
curl -X POST https://api.yourdomain.com/api/flights/search \
  -H "Content-Type: application/json" \
  -d '{
    "slices": [
      {
        "origin": "LHR",
        "destination": "JFK",
        "departure_date": "2026-03-15"
      }
    ],
    "passengers": [
      { "type": "adult" }
    ],
    "cabin_class": "economy",
    "direct_flights": true
  }'
```

### Search with Price Limit and Sort

```bash
curl -X POST https://api.yourdomain.com/api/flights/search \
  -H "Content-Type: application/json" \
  -d '{
    "slices": [
      {
        "origin": "LHR",
        "destination": "JFK",
        "departure_date": "2026-03-15"
      }
    ],
    "passengers": [
      { "type": "adult" }
    ],
    "cabin_class": "economy",
    "max_price": {
      "amount": 500,
      "currency": "USD"
    },
    "sort_by": "total_amount"
  }'
```

### Search with Connection Limit

```bash
curl -X POST https://api.yourdomain.com/api/flights/search \
  -H "Content-Type: application/json" \
  -d '{
    "slices": [
      {
        "origin": "LHR",
        "destination": "LAX",
        "departure_date": "2026-03-15"
      }
    ],
    "passengers": [
      { "type": "adult" }
    ],
    "cabin_class": "economy",
    "max_connections": 1
  }'
```

---

## Frontend Integration

### React Example

```typescript
// Search for direct flights
const searchDirectFlights = async () => {
  const response = await fetch('/api/flights/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      slices: [{
        origin: 'LHR',
        destination: 'JFK',
        departure_date: '2026-03-15'
      }],
      passengers: [{ type: 'adult' }],
      cabin_class: 'economy',
      direct_flights: true
    })
  });
  return response.json();
};

// Search with price filter and sort by cheapest
const searchCheapestFlights = async () => {
  const response = await fetch('/api/flights/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      slices: [{
        origin: 'LHR',
        destination: 'JFK',
        departure_date: '2026-03-15'
      }],
      passengers: [{ type: 'adult' }],
      cabin_class: 'economy',
      max_price: { amount: 500, currency: 'USD' },
      sort_by: 'total_amount'
    })
  });
  return response.json();
};
```

---

## Response Format

The search response includes:

```json
{
  "success": true,
  "data": {
    "offers": [
      {
        "id": "off_...",
        "offerId": "off_...",
        "airline": "British Airways",
        "flightNumber": "BA178",
        "carrierCode": "BA",
        "departureTime": "2026-03-15T10:30:00Z",
        "arrivalTime": "2026-03-15T18:45:00Z",
        "origin": "LHR",
        "destination": "JFK",
        "duration": "PT8H15M",
        "stops": 0,
        "amount": 450.00,
        "currency": "USD",
        "cabin": "economy",
        "refundable": false,
        "segments": [...]
      }
    ],
    "offerRequestId": "orq_...",
    "expiresAt": "2026-03-15T23:59:59Z",
    "total": 45
  }
}
```

---

## Cache Strategy

Search results are cached according to the hybrid caching strategy:

| Data Type | Redis TTL | NEON Storage |
|-----------|-----------|--------------|
| Offer Requests | 15 min (900s) | Until offer expires |
| Offers | 30 min (1800s) | Until offer expires |

The caching layer automatically handles repeated searches for the same route/passenger combination.

---

## Best Practices Summary

1. ✅ **Use filters** - Always use `max_connections`, `max_price` when user specifies preferences
2. ✅ **Sort appropriately** - Use `sort_by: 'total_amount'` for price-sensitive users
3. ✅ **Normalize passengers** - Always specify explicit `type` for each passenger
4. ✅ **Request available services** - Enable `return_available_services` to reduce API calls
5. ✅ **Cache effectively** - Leverage the hybrid caching layer for faster responses
6. ✅ **Handle edge cases** - Validate all inputs before sending to Duffel API

---

## Additional Resources

- [Duffel API Documentation](https://duffel.com/docs/api/v2)
- [Offer Requests API](https://duffel.com/docs/api/v2/offer-requests)
- [Following Search Best Practices](https://duffel.com/docs/guides/following-search-best-practices)

---

**Last Updated**: February 25, 2026
