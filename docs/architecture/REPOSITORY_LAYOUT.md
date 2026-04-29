# Repository Layout

## Top-level ownership

- `apps/`: frontend applications.
- `packages/`: reusable backend/frontend/shared modules.
- `infrastructure/`: gateway, monitoring, infra configuration.
- `tools/scripts/`: curated operational scripts.
- `docs/`: canonical project documentation.

## Current app structure

```text
apps/
  b2b-portal/
  booking-engine/
  call-center-portal/
  super-admin-portal/
```

## Current backend structure

```text
packages/
  booking-service/
  booking-engine-service/
  shared-database/
  shared-openapi/
  shared-types/
  shared-utils/
  shared-validation/
  shared-express/
  shared-queue/
  shared-config/
  shared-features/
  api-clients/
  auth-client/
  static-data/
  ui-components/
  design-tokens/
```

## Rules

1. New deployable backend features go into existing service packages under `packages/*`.
2. Shared logic is extracted into shared packages; avoid cross-app copy/paste.
3. Do not reintroduce root `services/` runtime directories.
4. Keep static-data domain isolated in `packages/static-data` and do not mix it with frontend app data migrations.
