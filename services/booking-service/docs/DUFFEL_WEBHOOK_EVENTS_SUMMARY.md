# Duffel API v2 Webhook Events: Comprehensive Technical Summary

## Overview

Duffel webhook events are real-time notifications delivered via HTTP POST requests to a configured endpoint when significant state changes occur within the Duffel flight booking platform. They enable external systems to maintain synchronization with booking lifecycle events—such as order creation, updates, cancellations, and flight schedule changes—without requiring continuous polling.

This technical summary synthesizes information from the Duffel API v2 reference documentation, covering the core concept, event data structure, security model, and available management operations for webhook events.

## Core Concepts

### Purpose & Function

- **Asynchronous Notifications**: Webhook events provide a push‑based mechanism for Duffel to inform integrators about changes to orders, flights, and related resources.
- **Reliable Delivery**: Each event is assigned a unique ID, timestamped, and can be redelivered if the initial delivery fails.
- **Configurable Endpoints**: Integrators register one or more endpoint URLs via the Duffel dashboard or API; events are sent to all active endpoints.
- **At‑Least‑Once Semantics**: The system guarantees that an event is delivered at least once, but duplicate deliveries may occur under certain network conditions.
<!-- cspell:ignore HMAC -->

### Event Lifecycle

1. **Trigger**: A state change (e.g., order confirmation, schedule change) occurs within Duffel’s systems.
2. **Generation**: Duffel creates a webhook event record containing the event type, payload, metadata, and a unique identifier.
3. **Delivery**: The event is serialized as JSON and POSTed to each registered endpoint with an HMAC signature for verification.
4. **Acknowledgment**: The endpoint must respond with a `2xx` HTTP status within a timeout window (typically 10 seconds) to be considered successful.
5. **Retry**: If the endpoint responds with a non‑2xx status, times out, or encounters a network error, Duffel will retry the delivery according to a built‑in retry schedule (exponential backoff).
6. **Final State**: After all retries are exhausted, the event is marked as `failed` and can be manually redelivered via the API.

## Event Types

Duffel defines a set of standard event types that cover the entire booking lifecycle. The following events are supported (based on observed integration patterns):

| Event Type                 | Description                                                                                       | Typical Payload Fields                                                                      |
| -------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `order.created`            | A new flight order has been successfully created and confirmed.                                   | `order_id`, `status`, `passenger_name`, `origin`, `destination`, `total_amount`, `currency` |
| `order.updated`            | An existing order has been modified (e.g., passenger details, contact information).               | `order_id`, `status`, `changes` (array of modified fields)                                  |
| `order.cancelled`          | An order has been cancelled, optionally with refund details.                                      | `order_id`, `refund_amount`, `refund_currency`                                              |
| `flight_schedule_changed`  | The schedule (departure/arrival times, dates, or flight numbers) of a booked segment has changed. | `order_id`, `segment_id`, `previous_schedule`, `new_schedule`                               |
| `airline_initiated_change` | The airline has proactively changed the booking (e.g., equipment change, re‑routing).             | `order_id`, `change_reason`, `new_itinerary`                                                |
| `seat_map_updated`         | Seat availability or pricing for a booked flight has been updated.                                | `order_id`, `segment_id`, `seat_map_diff`                                                   |
| `order_change_completed`   | A requested order change (e.g., date change, passenger name correction) has been processed.       | `order_id`, `change_id`, `outcome`                                                          |

Additional event types may exist for ancillary services (baggage, meals, insurance) and payment‑related updates.

## Webhook Payload Schema

Each webhook event follows a consistent JSON structure, documented in the [Duffel API v2 webhook events schema](https://duffel.com/docs/api/v2/webhook-events/schema). The schema includes both **event metadata** and the **resource‑specific data** that triggered the event.

### Common Top‑Level Fields

```json
{
  "id": "wev_1234567890abcdef",
  "type": "order.created",
  "resource": "order",
  "resource_id": "ord_1234567890abcdef",
  "created_at": "2026-03-23T19:30:00.000Z",
  "data": {
    // Event‑specific payload (varies by `type`)
  },
  "live_mode": true,
  "previous_attributes": {}
}
```

### Field Descriptions

- **`id`** (string): Unique identifier for the webhook event. Used for idempotency and retrieval.
- **`type`** (string): The event type (e.g., `order.created`).
- **`resource`** (string): The Duffel resource type that changed (`order`, `order_change`, `seat_map`, etc.).
- **`resource_id`** (string): ID of the affected resource (matches `data.id` for most events).
- **`created_at`** (ISO 8601): Timestamp when the event occurred in Duffel’s systems.
- **`data`** (object): The detailed payload containing the current state of the resource. Its structure matches the corresponding resource’s API representation (e.g., an Order object for `order.created`).
- **`live_mode`** (boolean): `true` for production events, `false` for test/sandbox events.
- **`previous_attributes`** (object, optional): For update‑type events, contains the previous values of changed attributes.

### Example: `order.created` Payload

```json
{
  "id": "wev_abc123",
  "type": "order.created",
  "resource": "order",
  "resource_id": "ord_xyz789",
  "created_at": "2026-03-23T19:30:00.000Z",
  "data": {
    "id": "ord_xyz789",
    "status": "confirmed",
    "passenger_name": "John Doe",
    "origin": {"iata_code": "LHR", "name": "London Heathrow"},
    "destination": {"iata_code": "JFK", "name": "John F. Kennedy International"},
    "total_amount": "450.00",
    "currency": "USD",
    "segments": [...]
  },
  "live_mode": true
}
```

## Security & Verification

### Signature Header

Duffel signs each webhook request with an **HMAC‑SHA256** signature to allow the receiver to verify authenticity.

- **Header name**: `x-duffel-signature`
- **Format**: `t=<timestamp>,v1=<signature>`
- **Calculation**: `HMAC‑SHA256(payload, secret)` where `payload` is the raw request body (stringified JSON) and `secret` is the webhook signing secret configured in the Duffel dashboard.
<!-- cspell:ignore Heathrow -->

### Verification Steps

1. Extract the timestamp `t` and signature `v1` from the header.
2. Reject if the timestamp is older than a tolerance window (e.g., 5 minutes) to prevent replay attacks.
3. Compute the expected signature using the shared secret and the exact request body.
4. Compare the computed signature with the provided `v1` using a constant‑time comparison.

### Implementation Note

The existing TripAlfa booking‑service implements signature verification in `services/booking‑service/src/routes/webhooks.ts` (see `verifySignature` function). The secret is stored in the `WEBHOOK_SECRET` environment variable.

## Management Actions

The Duffel API provides three key endpoints for inspecting and managing webhook events after they have been generated.

### 1. Retrieve a Single Webhook Event

**Endpoint**: `GET /webhook-events/{id}`  
**Purpose**: Fetch the complete details of a specific webhook event, including its payload and delivery status.  
**Use Cases**:

- Debugging a particular event that failed to process correctly.
- Idempotency checking by comparing event IDs.
- Auditing and compliance.

**Response**: Returns a `WebhookEvent` object with all top‑level fields described in the schema.

### 2. List Webhook Events

**Endpoint**: `GET /webhook-events`  
**Purpose**: Retrieve a paginated list of webhook events, optionally filtered by time range, event type, resource, or live mode.  
**Parameters**:

- `limit` (default 50, max 100): Number of events per page.
- `after` / `before`: Cursor‑based pagination tokens.
- `type`: Filter by event type.
- `resource`: Filter by resource type.
- `created_at[gt]` / `created_at[lt]`: Filter by creation timestamp.
- `live_mode`: Filter by environment.

**Response**: A paginated collection of `WebhookEvent` objects with `has_more`, `after`, and `before` cursors.

### 3. Redeliver a Webhook Event

**Endpoint**: `POST /webhook-events/{id}/actions/redeliver`  
**Purpose**: Manually trigger a new delivery attempt for an event that previously failed or was not acknowledged.  
**Use Cases**:

- Recovering from transient endpoint outages.
- Re‑processing events after fixing a bug in the receiver.
- Testing webhook handling logic.

**Behavior**:

- Creates a new delivery attempt with the same payload and signature.
- Does not modify the original event record.
- The redelivered event will have a new `id` but the same `resource_id` and `type`.

**Response**: Returns a new `WebhookEvent` object representing the redelivery attempt.

## Integration Best Practices

### Endpoint Implementation

1. **Idempotency**: Design handlers to be idempotent using the event `id` or a combination of `resource_id` and `created_at`. Store processed event IDs to detect duplicates.
2. **Fast Acknowledgement**: Respond with a `2xx` status immediately after receiving the event, then process asynchronously. Duffel’s timeout is short (≈10 s).
3. **Queue‑Based Processing**: In high‑volume scenarios, push events to an internal queue (e.g., BullMQ, RabbitMQ) and acknowledge immediately.
4. **Comprehensive Logging**: Log the event `id`, `type`, and `resource_id` for debugging and audit trails.

### Error Handling

- **Temporary Failures**: Return `429 Too Many Requests` or `503 Service Unavailable` to trigger Duffel’s automatic retry.
- **Permanent Failures**: Return `4xx` status for malformed events; these will not be retried.
- **Monitoring**: Track delivery success rates and set up alerts for repeated failures.

### Testing

- Use Duffel’s sandbox environment (`live_mode: false`) to test webhook handling without affecting production data.
- The `POST /webhook-events/{id}/actions/redeliver` endpoint can be used to replay test events.
- Simulate edge cases (network timeouts, malformed payloads) with a mock endpoint.

## References

- [Duffel API v2 Webhook Events Overview](https://duffel.com/docs/api/v2/webhook-events)
- [Webhook Events Schema](https://duffel.com/docs/api/v2/webhook-events/schema)
- [Redeliver a Webhook Event](https://duffel.com/docs/api/v2/webhook-events/redeliver-webhook-event)
- [Get a Webhook Event by ID](https://duffel.com/docs/api/v2/webhook-events/get-webhook-event-by-id)
- [List Webhook Events](https://duffel.com/docs/api/v2/webhook-events/get-webhook-event)

## Appendix: TripAlfa Implementation Notes

The TripAlfa booking‑service already includes a production‑ready webhook delivery system (`services/booking‑service/src/routes/webhooks.ts`) that handles Duffel webhooks with signature verification, database logging, and asynchronous processing. The service supports the following Duffel event types:

- `order.created` → `handleOrderCreated`
- `order.updated` → `handleOrderUpdated`
- `order.cancelled` → `handleOrderCancelled`
- `flight_schedule_changed` → `handleFlightScheduleChanged`
- `airline_initiated_change` → `handleAirlineInitiatedChange`
- `seat_map_updated` → `handleSeatMapUpdated`
- `order_change_completed` → `handleOrderChangeCompleted`

Each handler extracts relevant data from the webhook payload and updates the internal booking database, triggers notifications, and ensures idempotency.

For forwarding Duffel webhooks to external customer endpoints, the separate **Webhook Delivery Management API** (`/api/webhook‑deliveries`) provides retry logic, monitoring, and delivery guarantees.
