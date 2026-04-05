# Prompt: Generate API Client for Duffel Webhook Deliveries (v2)

## Objective

Create a production‑ready TypeScript API client that retrieves a paginated list of webhook deliveries from the Duffel API v2. The client must be robust, well‑documented, and follow the patterns already established in the TripAlfa booking‑service codebase.

## Context

- **Duffel API v2 Documentation**
  - Webhooks endpoint: https://duffel.com/docs/api/v2/webhooks
  - Webhook delivery schema: https://duffel.com/docs/api/v2/webhooks/schema
  - Related endpoints (for awareness): create, get, update, delete, ping webhooks (links provided in the user request).
- **Existing Project Patterns**
  - The booking‑service already uses `duffelClient` (axios‑based) and `createEnhancedDuffelClient` (with retry logic).
  - Error handling is centralized in `utils/error‑handler.ts`.
  - Logging uses `logError`, `logInfo`, `logWarn` from the same module.
  - Pagination in internal services follows a `page`/`limit` model, but Duffel’s API likely uses cursor‑based pagination (`after`, `before`, `limit`).
  - Type definitions for webhook‑related entities are in `types/webhook‑delivery.ts`.

## Requirements

### 1. **API Client Design**

- Create a **class `DuffelWebhookDeliveryClient`** that encapsulates all operations for the `/webhooks/deliveries` endpoint.
- The client must be instantiated with a configured Axios instance (reuse the existing `duffelClient` or `createEnhancedDuffelClient`).
- Support **dependency injection** for easier testing and integration.

### 2. **Pagination Management**

- Implement **cursor‑based pagination** as per Duffel’s API (assume the response includes `after`, `before`, `has_more`, `limit`).
- Provide a method `listDeliveries(params?: ListDeliveriesParams)` that returns a `DuffelPaginatedResponse<DuffelWebhookDelivery>`.
- The method must handle:
  - Fetching the first page (no cursor).
  - Fetching next/previous pages using `after`/`before` cursors.
  - Respecting the `limit` parameter (default 50, max 100).
  - Automatic extraction of the next/previous cursors from the response.
- Include an **iterable interface** (async generator) `listAllDeliveries(params)` that transparently pages through all deliveries until `has_more` is false (yields `DuffelWebhookDelivery` objects).

### 3. **Error Handling**

- Use the existing `error‑handler` utilities for consistent logging.
- Classify errors:
  - **Network errors** (timeout, connection refused) → retry according to the enhanced client’s retry configuration.
  - **API errors** (4xx, 5xx) → map to meaningful application‑level errors (e.g., `AuthenticationError`, `RateLimitError`, `ValidationError`).
  - **Validation errors** (malformed response) → throw a `SchemaValidationError` with details.
- Never expose raw Axios errors to callers; wrap them in a domain‑specific `DuffelApiError` class.

### 4. **Data Validation**

- Define **separate TypeScript interfaces** for Duffel’s webhook delivery schema (do not reuse the internal `WebhookDelivery` type, which is for tracking our own delivery attempts). Create:
  - `DuffelWebhookDelivery` (matching Duffel’s schema: `id`, `webhook_id`, `event_type`, `payload`, `status`, `created_at`, `updated_at`, `attempts`, `last_attempt_at`, etc.).
  - `DuffelPaginatedResponse<T>` with `data: T[]`, `after?: string`, `before?: string`, `has_more: boolean`, `limit: number`.
- Provide an optional **mapper function** `toInternalDelivery(duffelDelivery: DuffelWebhookDelivery): WebhookDelivery` that converts Duffel’s schema to the internal type (used by `webhook‑delivery.service.ts`).
- Use **runtime validation** (e.g., with `zod` or `joi`) to ensure the API response matches the expected shape. If a validation library is not already in the project, rely on TypeScript’s compile‑time checks and add thorough runtime checks with descriptive error messages.

### 5. **Logging & Observability**

- Log each request at `debug` level (URL, parameters, cursor).
- Log each response at `info` level (count of deliveries, pagination state).
- Log errors with full context (request details, response status, error code).
- Include **performance metrics**: record request duration and report slow calls (>2s).

### 6. **Configuration & Environment**

- Read `DUFFEL_API_KEY`, `DUFFEL_BASE_URL`, `DUFFEL_VERSION` from the existing `config/duffel.ts`.
- Allow optional overrides via constructor (e.g., custom timeout, max retries).
- Respect the `NODE_ENV` to adjust logging verbosity.

### 7. **Testing**

- Write **unit tests** with mocked HTTP responses (use `vitest` + `axios‑mock‑adapter`).
- Cover:
  - Successful pagination flow.
  - Error scenarios (network failure, rate limit, invalid cursor).
  - Validation failures.
- Provide **integration test** skeleton that can be run against a sandbox environment (optional).

### 8. **Documentation**

- JSDoc comments for all public methods and types.
- A README section explaining usage, error handling, and pagination examples.
- Include a **code example** that demonstrates:
  ```typescript
  const client = new DuffelWebhookDeliveryClient();
  // Fetch first page
  const firstPage = await client.listDeliveries({ limit: 20 });
  console.log(`Fetched ${firstPage.data.length} deliveries`);
  // Iterate through all pages (async generator)
  for await (const delivery of client.listAllDeliveries({ limit: 50 })) {
    console.log(delivery.id, delivery.event_type, delivery.status);
  }
  // Convert to internal type if needed
  const internalDelivery = client.toInternalDelivery(firstPage.data[0]);
  ```

### 9. **Integration with Existing Codebase**

- Follow the existing project’s **code style** (ES modules, named exports, no default exports).
- Reuse the `logError`, `logInfo`, `logWarn` functions from `utils/error‑handler.ts`.
- If the project uses a caching layer (e.g., Redis), consider adding optional caching for frequently accessed delivery records (stretch goal).

### 10. **Production‑Ready Considerations**

- **Rate‑limiting awareness**: include automatic backoff when receiving `429 Too Many Requests`.
- **Idempotency**: the client’s methods should be safe to retry.
- **Memory efficiency**: the async generator should not hold all deliveries in memory; process them stream‑wise.
- **Timeout configuration**: allow per‑call timeout overrides.

### 11. **Debugging & Validation Assumptions**

Based on analysis of potential failure sources in paginated API clients, the two most likely problem areas are:

1. **Cursor pagination mishandling** – incorrectly parsing `after`/`before` cursors or misinterpreting `has_more`.
2. **Inadequate error recovery** – not distinguishing between transient network errors and permanent API errors.

To validate these assumptions, the generated code must include **diagnostic logging** that captures:

- The exact cursor values sent and received in each request.
- The `has_more` flag and the number of items returned.
- Any retry attempts with exponential backoff details.
- Response validation failures (schema mismatches).

Add log statements at `debug` level that can be enabled to trace pagination flow and error recovery. This will allow developers to confirm that pagination is working as expected and that error handling is robust.

## Deliverables

1. **TypeScript source file** `src/utils/duffel‑webhook‑deliveries‑client.ts` containing the client class and all related types.
2. **Test file** `src/__tests__/duffel‑webhook‑deliveries‑client.spec.ts`.
3. **Type definitions file** `src/types/duffel‑webhook‑delivery.ts` containing `DuffelWebhookDelivery`, `DuffelPaginatedResponse`, `ListDeliveriesParams`, and any other Duffel‑specific types. Do not modify the existing `webhook‑delivery.ts` unless absolutely necessary (e.g., adding a shared utility type).
4. **Example usage snippet** in a comment at the top of the client file.

## Validation Checklist

Before submitting, ensure the generated code:

- [ ] Compiles with `tsc --noEmit`.
- [ ] Passes the existing linting rules (`npm run lint`).
- [ ] Follows the project’s prettier formatting.
- [ ] Does not break any existing tests.
- [ ] Includes at least 90% test coverage for the new client.
- [ ] Logs appropriately in development and production modes.
- [ ] Handles edge cases (empty result set, invalid cursor, network interruption).

## Additional Notes

- If any part of the Duffel API specification is ambiguous, assume the most conservative interpretation and add a `TODO` comment with a link to the relevant documentation.
- The client should be ready to be imported and used by other services (e.g., the `webhook‑delivery.service.ts`).
- Prioritize clarity and maintainability over premature optimization.
