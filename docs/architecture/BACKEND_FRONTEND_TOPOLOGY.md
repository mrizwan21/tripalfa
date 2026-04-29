# Backend and Frontend Topology

## Frontends

- `apps/booking-engine`: customer-facing booking workflow.
- `apps/b2b-portal`: agency and partner operations.
- `apps/call-center-portal`: assisted operations and agent workflows.
- `apps/super-admin-portal`: platform-level management.

## Backend packages

- `@tripalfa/booking-service`: booking orchestration and domain APIs.
- `@tripalfa/booking-engine-service`: booking-engine support APIs.
- `@tripalfa/shared-database`: Prisma schema, generation, and data access utilities.
- `@tripalfa/shared-openapi`: OpenAPI specs/contracts.
- `@tripalfa/shared-types`, `@tripalfa/shared-utils`, `@tripalfa/shared-validation`: shared contracts and utilities.

## API centralization

All internal and external API traffic should be exposed through API Manager (Kong/Wicked):

1. Frontends call gateway endpoints only.
2. Gateway routes to package-based backend services.
3. External suppliers (Duffel, LiteAPI, etc.) are brokered through backend + gateway policy.
