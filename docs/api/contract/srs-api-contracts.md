# SRS API Contracts — JSON Schemas (Frontend ↔ Backend)

This file contains detailed request/response JSON schemas for the booking-engine frontend to call
backend endpoints described in the SRS. Use these as authoritative contracts for frontend stubs
and backend implementation.

---

## 1. Common types

```json
// json
{
  "$id": "https://example.com/srs/common.json",
  "definitions": {
    "Money": {
      "type": "object",
      "properties": {
        "amount": { "type": "number" },
        "currency": { "type": "string" }
      },
      "required": ["amount", "currency"]
    },
    "DateISO": { "type": "string", "format": "date-time" }
  }
}
```

---

## 2. GET /api/bookings (list with filters)

Request query parameters:

- userId (optional)
- q (optional) — search keyword
- status (optional) — booking status enum
- product (optional) — "hotel" | "flight"
- from (optional) — ISO date
- to (optional) — ISO date
- page (optional, default 1)
- perPage (optional, default 10)

Response schema:

```json
// json
{
  "type": "object",
  "properties": {
    "items": {
      "type": "array",
      "items": { "$ref": "#/definitions/BookingSummary" }
    },
    "total": { "type": "integer" },
    "page": { "type": "integer" },
    "perPage": { "type": "integer" }
  },
  "required": ["items", "total", "page", "perPage"],
  "definitions": {
    "BookingSummary": {
      "type": "object",
      "properties": {
        "id": { "type": "string" },
        "bookingId": { "type": "string" },
        "product": { "type": "string" },
        "status": { "type": "string" },
        "reference": { "type": "string" },
        "total": { "$ref": "#/definitions/Money" },
        "createdAt": { "type": "string", "format": "date-time" }
      },
      "required": ["id", "bookingId", "product", "status", "total", "createdAt"]
    },
    "Money": {
      "type": "object",
      "properties": {
        "amount": { "type": "number" },
        "currency": { "type": "string" }
      },
      "required": ["amount", "currency"]
    }
  }
}
```

---

## 3. GET /api/bookings/{id}

Response: full Booking object

```json
// json
{
  "type": "object",
  "properties": {
    "id": { "type": "string" },
    "bookingId": { "type": "string" },
    "product": { "type": "string" },
    "status": { "type": "string" },
    "reference": { "type": "string" },
    "total": {
      "type": "object",
      "properties": {
        "amount": { "type": "number" },
        "currency": { "type": "string" }
      },
      "required": ["amount", "currency"]
    },
    "createdAt": { "type": "string", "format": "date-time" },
    "paymentStatus": { "type": "string" },
    "guestInfo": { "type": "array", "items": { "type": "object" } },
    "details": { "type": "object" }
  },
  "required": ["id", "bookingId", "product", "status", "reference", "total", "createdAt"]
}
```

---

## 4. POST /api/bookings/{id}/action

Request:

```json
// json
{
  "type": "object",
  "properties": {
    "action": { "type": "string" },
    "reason": { "type": "string" },
    "payload": { "type": "object" }
  },
  "required": ["action"]
}
```

Response: updated Booking (use schema in section 3).

---

## 5. POST /api/hotels/search

Request body:

```json
// json
{
  "type": "object",
  "properties": {
    "location": { "type": "string" },
    "checkin": { "type": "string", "format": "date" },
    "checkout": { "type": "string", "format": "date" },
    "adults": { "type": "integer", "minimum": 1 },
    "children": { "type": "integer", "minimum": 0 },
    "rooms": { "type": "integer", "minimum": 1 },
    "currency": { "type": "string" }
  },
  "required": ["location", "checkin", "checkout", "adults", "rooms"]
}
```

Response: list of hotel offers (cheapest-per-hotel) with breakdown

```json
// json
{
  "type": "object",
  "properties": {
    "hotels": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": { "type": "string" },
          "name": { "type": "string" },
          "location": { "type": "string" },
          "latitude": { "type": "number" },
          "longitude": { "type": "number" },
          "image": { "type": "string" },
          "price": {
            "type": "object",
            "properties": {
              "amount": { "type": "number" },
              "currency": { "type": "string" },
              "breakdown": {
                "type": "object",
                "properties": {
                  "original": { "type": "number" },
                  "tax": { "type": "number" },
                  "commission": { "type": "number" },
                  "fees": { "type": "number" }
                }
              }
            },
            "required": ["amount", "currency"]
          },
          "roomsSummary": { "type": "array", "items": { "type": "object" } }
        },
        "required": ["id", "name", "price"]
      }
    }
  },
  "required": ["hotels"]
}
```

Notes: frontend expects price.amount to be inclusive (original+tax+fees+commission).

---

## 6. GET /api/hotels/{id}

Response: detailed hotel record

```json
// json
{
  "type": "object",
  "properties": {
    "id": { "type": "string" },
    "name": { "type": "string" },
    "rating": { "type": "number" },
    "address": { "type": "object" },
    "latitude": { "type": "number" },
    "longitude": { "type": "number" },
    "images": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "url": { "type": "string" },
          "hero": { "type": "boolean" },
          "maxwidth": { "type": "integer" }
        }
      }
    },
    "facilities": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "code": { "type": "string" },
          "name": { "type": "string" },
          "free": { "type": "boolean" }
        }
      }
    },
    "rooms": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": { "type": "string" },
          "name": { "type": "string" },
          "boardType": { "type": "string" },
          "rateType": { "type": "string" },
          "roomView": { "type": "string" },
          "originalPrice": {
            "type": "object",
            "properties": {
              "amount": { "type": "number" },
              "currency": { "type": "string" }
            }
          },
          "tax": { "type": "number" },
          "commission": { "type": "number" },
          "availability": { "type": "integer" }
        },
        "required": ["id", "name", "originalPrice"]
      }
    }
  },
  "required": ["id", "name", "rooms"]
}
```

---

## 7. GET /integrations/hepstar/addons?hotelId={id}

Response:

```json
// json
{
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "code": { "type": "string" },
      "title": { "type": "string" },
      "description": { "type": "string" },
      "price": {
        "type": "object",
        "properties": {
          "amount": { "type": "number" },
          "currency": { "type": "string" }
        }
      }
    },
    "required": ["code", "title", "price"]
  }
}
```

---

## 8. POST /api/bookings/hotel/hold

Request:

```json
// json
{
  "type": "object",
  "properties": {
    "hotelId": { "type": "string" },
    "rooms": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "roomTypeId": { "type": "string" },
          "quantity": { "type": "integer", "minimum": 1 }
        }
      }
    },
    "checkin": { "type": "string", "format": "date" },
    "checkout": { "type": "string", "format": "date" },
    "guestInfo": { "type": "array" },
    "contact": { "type": "object" },
    "addons": { "type": "array" }
  },
  "required": ["hotelId", "rooms", "checkin", "checkout"]
}
```

Response:

```json
// json
{
  "type": "object",
  "properties": {
    "holdReference": { "type": "string" },
    "expiry": { "type": "string", "format": "date-time" },
    "total": {
      "type": "object",
      "properties": {
        "amount": { "type": "number" },
        "currency": { "type": "string" }
      }
    }
  },
  "required": ["holdReference", "expiry"]
}
```

---

## 9. POST /api/bookings/hotel/confirm

Request:

```json
// json
{
  "type": "object",
  "properties": {
    "holdReference": { "type": "string" },
    "paymentMethod": { "type": "object" }
  },
  "required": ["holdReference", "paymentMethod"]
}
```

Response:

```json
// json
{
  "type": "object",
  "properties": {
    "bookingId": { "type": "string" },
    "status": { "type": "string" },
    "total": {
      "type": "object",
      "properties": {
        "amount": { "type": "number" },
        "currency": { "type": "string" }
      }
    }
  },
  "required": ["bookingId", "status"]
}
```

BookingId format must match regex: `^TL-\d{6}$`.

---

## 10. Flight search & booking endpoints (simplified)

POST /api/flights/search
Request:

```json
// json
{
  "from": "string",
  "to": "string",
  "departDate": "date",
  "returnDate": "date?",
  "cabin": "string",
  "pax": { "adults": 1, "children": 0, "infants": 0 }
}
```

Response: list of offers with fares and fare breakdown (per pax group). Each fare includes fareId, totalAmount, currency, includedBags (array), rules (text), segments.

POST /api/bookings/flight/hold & /confirm follow hotel hold/confirm patterns but include fareId and passenger mapping.

---

## 11. Payments & Wallet

POST /api/payments/card
Request:

```json
// json
{
  "amount": 123.45,
  "currency": "USD",
  "card": {
    "number": "4111111111111111",
    "expiry": "12/26",
    "cvv": "123",
    "holderName": "Alice"
  },
  "metadata": {}
}
```

Response:

```json
// json
{
  "success": true,
  "transactionId": "TXN-123456",
  "authorization": { "provider": "stripe", "id": "auth_..." }
}
```

POST /api/payments/wallet
Request:

```json
// json
{
  "amount": 100,
  "currency": "USD",
  "walletAccount": "WAL-USD-1",
  "userId": "u_123"
}
```

POST /api/wallets/topup
Request:

```json
// json
{
  "accountFrom": "STRIPE-USD",
  "accountTo": "WAL-USD",
  "amount": 500,
  "currency": "USD",
  "paymentType": "card"
}
```

Response:

```json
// json
{ "invoiceNo": "CI-0001", "status": "On-Request" }
```

---

## 12. Error format (uniform)

All error responses:

```json
// json
{
  "error": {
    "code": "ER_01",
    "message": "[Field name] cannot be left blank",
    "details": {}
  }
}
```

Standard codes:

- ER_01 — required field missing
- ER_02 — invalid format (email, card)
- TNS-03 — system processing error

---

## 13. Implementation notes for frontend stubs

- All POST responses for hold/confirm should include realistic mock totals and breakdowns.
- store holdReference and expiry in client state and pass to confirm.
- Always display price inclusive to user in hotel/flight lists.
- Use bookingId regex ^TL-\d{6}$ for generated mock confirmations.

---

If you confirm, I will:

- Create frontend implementations (all missing components/pages) and expand src/lib/api.ts to return mock responses matching these schemas, then create PRs per the atomic PR plan.
