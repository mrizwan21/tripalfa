# Workspace Component Map

This map defines active modules and shared components after the `services/` removal and package consolidation.

## Frontend apps

| App | Primary purpose | Shared dependencies |
|---|---|---|
| `apps/booking-engine` | Customer booking journeys (flight/hotel) | `@tripalfa/ui-components`, `@tripalfa/shared-types`, `@tripalfa/auth-client` |
| `apps/b2b-portal` | Partner/agency workflows | `@tripalfa/shared-features`, `@tripalfa/ui-components`, `@tripalfa/shared-types` |
| `apps/call-center-portal` | Agent-assisted booking/support flows | `@tripalfa/shared-features`, `@tripalfa/ui-components`, `@tripalfa/shared-types` |
| `apps/super-admin-portal` | Platform administration and controls | `@tripalfa/shared-features`, `@tripalfa/ui-components`, `@tripalfa/shared-types` |

## Backend packages

| Package | Responsibility | Reuse target |
|---|---|---|
| `@tripalfa/booking-service` | Core booking domain APIs and orchestration | All apps via gateway |
| `@tripalfa/booking-engine-service` | Booking-engine specific backend APIs | Booking engine and shared booking flows |
| `@tripalfa/shared-database` | Prisma schema, generated client, DB contracts | All backend packages |
| `@tripalfa/shared-openapi` | Shared API contracts/spec generation | Backend + API governance |
| `@tripalfa/shared-types` | Cross-app and cross-service TS contracts | Frontend + backend |
| `@tripalfa/shared-utils` | Reusable non-domain utility functions | Frontend + backend |
| `@tripalfa/shared-validation` | Shared validation schemas/helpers | Frontend + backend |
| `@tripalfa/shared-express` | Express middleware/common backend primitives | Backend packages |
| `@tripalfa/shared-queue` | Shared queue adapters/contracts | Async jobs and event flows |
| `@tripalfa/shared-features` | Reusable frontend feature modules | B2B, Call Center, Super Admin |
| `@tripalfa/api-clients` | Centralized HTTP/API client abstractions | Frontend + backend integration |
| `@tripalfa/auth-client` | Authentication helper layer | Frontend apps |
| `@tripalfa/ui-components` | Shared UI component system | Frontend apps |
| `@tripalfa/design-tokens` | Shared visual tokens | Frontend apps |
| `@tripalfa/static-data` | Static/reference data handling | Static domain only |

## Architectural guardrails

1. Route all app API calls through API Manager (Kong/Wicked).
2. Avoid app-specific duplicate business logic when `shared-features` or shared backend packages can own it.
3. Keep static data workflows isolated from frontend app database migration/reset operations.
4. Do not reintroduce root `services/` deployable trees.
