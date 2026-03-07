# Duffel Flight Booking Confirmation Emails Integration

## Overview

This document outlines the implementation of flight booking confirmation emails based on Duffel's best practices for handling flight booking confirmation emails.

**Reference**: <https://duffel.com/docs/guides/handling-flight-booking-confirmation-emails>

## Implementation Summary

### 1. Notification Service Updates

**File**: `services/notification-service/src/routes/notifications.ts`

Added two new endpoints for flight booking confirmations:

#### a) POST /api/notifications/flight/confirmation

- Main endpoint for sending flight booking confirmation emails
- Accepts structured flight data including:
  - Customer information (email, name, phone)
  - Booking reference and order ID
  - Flight details (departure, arrival, airline, flight number, cabin class)
  - Passenger details
  - Pricing information (total amount, currency, base amount, tax amount)
  - Booking status and timestamp

#### b) POST /api/notifications/flight/confirmation/webhook

- Webhook-specific endpoint for processing confirmation requests from booking-service
- Automatically transforms webhook payload to confirmation format
- Handles various input formats flexibly

### 2. Booking Service Webhook Integration

**File**: `services/booking-service/src/routes/webhooks.ts`

Added `sendFlightConfirmation()` function that:

- Transforms Duffel webhook data into confirmation email payload
- Calls the notification service endpoint
- Handles error cases gracefully

Updated `handleOrderCreated()` to:

- Trigger flight confirmation email on order creation
- Follow Duffel's recommended practice of sending confirmation immediately after booking

## Data Flow

```text
Duffel API (order.created webhook)
         ↓
booking-service (webhooks.ts)
    ├── Creates/updates booking in database
    ├── Sends generic notification
    └── Calls sendFlightConfirmation()
         ↓
notification-service
    ├── Validates required fields
    ├── Creates notification record
    ├── Stores in database
    └── Returns confirmation
         ↓
Email Service (Brevo/SendGrid)
         ↓
Customer receives confirmation email
```

## API Endpoints

### Send Flight Confirmation

```text
POST /api/notifications/flight/confirmation

Request Body:
{
  travelerEmail: string,
  travelerName: string,
  bookingReference: string,
  orderId: string,
  flights: [{
    departure: { airportCode, city, airport, time, terminal? },
    arrival: { airportCode, city, airport, time, terminal? },
    airline: string,
    flightNumber: string,
    cabinClass: string,
    duration: string,
    flightId: string
  }],
  passengers: [{
    firstName: string,
    lastName: string,
    passengerType: string
  }],
  totalAmount: string,
  currency: string,
  baseAmount?: string,
  taxAmount?: string,
  bookingStatus: string,
  bookedAt: string
}

Response:
{
  success: true,
  notificationId: string,
  recipient: string,
  bookingReference: string,
  orderId: string,
  status: "sent",
  message: "Flight booking confirmation email queued successfully"
}
```

### Webhook Endpoint

```text
POST /api/notifications/flight/confirmation/webhook

Request Body:
{
  orderId: string,
  bookingReference?: string,
  customerEmail: string,
  customerName?: string,
  flights?: [...],
  passengers?: [...],
  totalAmount?: string,
  currency?: string,
  userId?: string
}

Response:
{
  success: true,
  notificationId: string,
  orderId: string,
  bookingReference: string,
  status: "sent",
  message: "Flight booking confirmation processed successfully"
}
```

## Testing

### Test Flight Confirmation Email

```bash
# Test the flight confirmation endpoint
curl -X POST http://localhost:3009/api/notifications/flight/confirmation \
  -H "Content-Type: application/json" \
  -d '{
    "travelerEmail": "john@example.com",
    "travelerName": "John Doe",
    "bookingReference": "ORD-123456",
    "orderId": "ord_123456",
    "flights": [
      {
        "departure": {
          "airportCode": "LHR",
          "city": "London",
          "airport": "London Heathrow",
          "time": "2026-03-01T10:00:00Z",
          "terminal": "5"
        },
        "arrival": {
          "airportCode": "JFK",
          "city": "New York",
          "airport": "John F Kennedy",
          "time": "2026-03-01T18:30:00Z",
          "terminal": "1"
        },
        "airline": "British Airways",
        "flightNumber": "BA178",
        "cabinClass": "Economy",
        "duration": "8h 30m",
        "flightId": "fl_123"
      }
    ],
    "passengers": [
      {
        "firstName": "John",
        "lastName": "Doe",
        "passengerType": "adult"
      }
    ],
    "totalAmount": "450.00",
    "currency": "USD",
    "bookingStatus": "confirmed",
    "bookedAt": "2026-02-25T06:00:00Z"
  }'
```

### Test Webhook Flow

```bash
# Test the webhook endpoint
curl -X POST http://localhost:3009/api/notifications/flight/confirmation/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "ord_test_123",
    "customerEmail": "jane@example.com",
    "customerName": "Jane Smith",
    "flights": [
      {
        "origin": "LAX",
        "destination": "SFO",
        "departureTime": "2026-04-01T08:00:00Z",
        "arrivalTime": "2026-04-01T09:30:00Z",
        "airline": "United Airlines",
        "flightNumber": "UA123"
      }
    ],
    "passengers": [
      {
        "firstName": "Jane",
        "lastName": "Smith"
      }
    ],
    "totalAmount": "150.00",
    "currency": "USD"
  }'
```

## Best Practices Implemented

Based on Duffel's guidelines:

1. **Immediate Confirmation**: Confirmation email sent immediately when order is created
2. **Complete Information**: Email includes all booking details (flights, passengers, pricing)
3. **Structured Data**: Using Duffel's order response structure for consistency
4. **Error Handling**: Graceful degradation if notification service is unavailable
5. **Logging**: All confirmation requests logged for audit trail
6. **Validation**: Required fields validated before processing

## Configuration

The implementation uses the following environment variables:

- `NOTIFICATION_SERVICE_URL` - URL of notification service (default: `http://notification-service:3009`)

## Related Documentation

- [Duffel API Integration](./DUFFEL_API_INTEGRATION.md)
- [Duffel Flight Amendment Features](./DUFFEL_FLIGHT_AMENDMENT_FEATURES.md)
- [Flight Amendment Features](./DUFFEL_FLIGHT_AMENDMENT_FEATURES.md)
- [API Documentation](../API_DOCUMENTATION.md)
