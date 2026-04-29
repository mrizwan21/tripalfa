# Batch Offer Requests with Long-Polling API

A production-ready system for handling Duffel batch offer requests with real-time streaming of flight offers via long-polling.

## Overview

This system extends the existing Duffel API integration to support batch offer requests, which allow searching multiple routes simultaneously. The key enhancement is **continuous retrieval and streaming of flight offers as they become available**, rather than waiting for a complete payload. This is achieved through:

- **Enhanced Data Model**: New fields for expiration, status enum, and relationships between batch requests, offer requests, and offers.
- **Long-Polling Endpoint**: Clients can wait efficiently for new offers using a configurable timeout.
- **Background Polling**: Automatic polling of Duffel API to fetch and store offers as they arrive.
- **Expiration Cleanup**: Scheduled marking of stale batch requests as expired.

## Architecture

```
┌─────────────┐  POST /batch-offer-requests   ┌────────────────────┐
│   Client    │──────────────────────────────▶│   Express Router   │
└─────────────┘                               └────────────────────┘
         │                                            │
         │                                            │ 1. Call Duffel API
         │                                            │ 2. Store batch request
         │                                            │ 3. Start background polling
         │                                            ▼
         │                                 ┌────────────────────┐
         │                                 │   Database (Core)  │
         │                                 │  - BatchOfferRequest│
         │                                 │  - OfferRequest    │
         │                                 │  - Offer           │
         │                                 └────────────────────┘
         │                                            │
         │                                            │ Poll every 2s
         │                                            ▼
         │                                 ┌────────────────────┐
         │                                 │   Duffel API       │
         │                                 │  - Batch status    │
         │                                 │  - Offer requests  │
         │                                 │  - Offers          │
         │                                 └────────────────────┘
         │                                            │
         │                                            │ Store results
         │                                            ▼
         │                                 ┌────────────────────┐
         │                                 │   Database (Core)  │
         │                                 └────────────────────┘
         │                                            │
         │ GET /batch-offer-requests/:id/offers/poll  │
         │ (long-polling)                             │
         └────────────────────────────────────────────┘
```

## Data Model

### BatchOfferRequest (`duffel_batch_offer_request`)

| Field         | Type                    | Description                                                |
| ------------- | ----------------------- | ---------------------------------------------------------- |
| id            | String (cuid)           | Primary key                                                |
| externalId    | String (unique)         | Duffel batch request ID                                    |
| requests      | Json?                   | Array of request objects (slices, passengers, cabin_class) |
| status        | BatchOfferRequestStatus | Enum: `pending`, `processing`, `completed`, `expired`      |
| processedAt   | DateTime?               | When batch started processing                              |
| completedAt   | DateTime?               | When batch completed                                       |
| expiresAt     | DateTime?               | Automatic expiration (1 minute after creation)             |
| results       | Json?                   | Duffel API results (list of offer request IDs)             |
| createdAt     | DateTime                | Creation timestamp                                         |
| updatedAt     | DateTime                | Last update timestamp                                      |
| offerRequests | DuffelOfferRequest[]    | Related offer requests                                     |

### OfferRequest (`duffel_offer_request`)

Enhanced with a foreign key to batch:

- `batchOfferRequestId` (String?): References the parent batch.
- `batchOfferRequest` relation.

### Offer (`duffel_offer`)

Remains unchanged but linked via `offerRequestId`.

## API Endpoints

### 1. Create Batch Offer Request

**POST** `/api/duffel/batch-offer-requests`

Creates a new batch offer request in Duffel and starts background polling.

**Request Body**:

```json
{
  "requests": [
    {
      "slices": [...],
      "passengers": [...],
      "cabin_class": "economy"
    }
  ]
}
```

**Response**:

```json
{
  "success": true,
  "data": { ... Duffel batch response ... },
  "localId": "clocal...",
  "message": "Batch offer request created"
}
```

**Notes**:

- Automatically sets `expiresAt` to 1 minute from creation.
- Background polling begins immediately after response.

### 2. Get Batch Offer Request

**GET** `/api/duffel/batch-offer-requests/:id`

Retrieves batch request details, updating local cache from Duffel if possible.

### 3. Long-Polling for New Offers

**GET** `/api/duffel/batch-offer-requests/:id/offers/poll`

Waits for new offers associated with the batch request.

**Query Parameters**:

- `timeout` (optional, default 30): Maximum seconds to wait.
- `since` (optional): ISO timestamp; only return offers created after this time.

**Behavior**:

1. Validates batch existence.
2. Fetches offers created after `since` (or all if not provided).
3. If offers exist, returns immediately.
4. Otherwise, polls database every 500ms until new offers appear or timeout.
5. Returns empty array if timeout reached.

**Response**:

```json
{
  "success": true,
  "data": [... offers ...],
  "count": 5,
  "batchStatus": "processing"
}
```

### 4. Cleanup Expired Batches

**POST** `/api/duffel/batch-offer-requests/cleanup`

Internal endpoint intended for scheduled cron jobs. Marks batch requests as `expired` when `expiresAt` is in the past and status is not already `expired`.

**Response**:

```json
{
  "success": true,
  "message": "Marked X batch requests as expired",
  "count": X
}
```

## Background Polling

After a batch request is created, the system starts an asynchronous polling loop (`startBatchPolling`). This loop:

1. Fetches batch status from Duffel every 2 seconds.
2. Updates local status (`pending` → `processing` → `completed`/`expired`).
3. When batch is `completed`, fetches each offer request and its offers, storing them in the database.
4. Stops polling after completion, expiration, or after 60 attempts (2 minutes).

Polling runs independently of client requests, ensuring offers are stored as soon as they become available.

## Expiration Handling

- Each batch request has an `expiresAt` field set to `createdAt + 1 minute`.
- The cleanup endpoint can be scheduled (e.g., via cron) to mark overdue batches as `expired`.
- Expired batches are still accessible for idempotent retrieval of offers.

## Idempotent Retrieval

Clients can repeatedly call the long-polling endpoint with the same `since` parameter to get all offers without duplicates. The system guarantees that once an offer is returned, it will not be returned again for the same `since` timestamp.

## Concurrency Considerations

- Multiple clients can poll the same batch request simultaneously; each will receive the same set of new offers.
- Database writes are atomic using Prisma upserts to avoid duplicates.
- Background polling is per batch; multiple batches run concurrently.

## Error Handling

- Duffel API errors are logged and polling continues (with retry).
- Database errors are logged but do not crash the polling loop.
- Long-polling endpoint returns 500 on unexpected errors.

## Monitoring

- Logs are emitted for key events: batch creation, status changes, offer storage, polling errors.
- Metrics can be added to track number of active batches, offer throughput, polling latency.

## Deployment Notes

1. **Migration Required**: Run `prisma migrate dev` to apply schema changes (new enum, fields, and indexes).
2. **Cron Job**: Set up a scheduled job (e.g., every minute) to call the cleanup endpoint.
3. **Scaling**: The background polling is stateless and can be scaled horizontally; ensure idempotency of polling loops (e.g., using distributed locks if necessary).

## Example Workflow

1. **Client** creates a batch request with two flight searches.
2. **Server** returns batch ID and starts polling Duffel.
3. **Client** immediately calls long-polling endpoint with `timeout=30`.
4. **Server** waits for offers; after 5 seconds Duffel returns first offer request with 3 offers.
5. **Server** stores offers and immediately returns them to the waiting client.
6. **Client** displays the first 3 offers and can poll again for more.
7. **Background polling** continues and fetches remaining offers, storing them.
8. After 1 minute, batch expires; cleanup marks it as `expired`.
9. **Client** can still retrieve all offers using the batch ID.

## Conclusion

This system provides a robust, scalable foundation for streaming flight offers from Duffel batch requests. It is ready for integration into the existing TripAlfa booking service.
