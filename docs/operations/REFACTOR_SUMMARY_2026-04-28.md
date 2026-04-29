# Refactor Summary (2026-04-28)

## Scope completed

1. Removed legacy monorepo documentation sprawl and rebuilt a canonical docs set.
2. Removed legacy script sprawl and rebuilt a curated `tools/scripts` structure.
3. Remapped repository guidance to package-based backend architecture (`packages/*`).
4. Normalized stale references from deleted root `services/` and old app naming.
5. Updated API Manager descriptor docs to current TripAlfa naming.
6. Corrected static-analysis entrypoints (`fallow.yaml`) to active apps/packages.

## Current canonical documentation

- `docs/README.md`
- `docs/architecture/REPOSITORY_LAYOUT.md`
- `docs/architecture/BACKEND_FRONTEND_TOPOLOGY.md`
- `docs/architecture/WORKSPACE_COMPONENT_MAP.md`
- `docs/setup/LOCAL_SETUP.md`
- `docs/operations/RUNBOOK.md`
- `docs/operations/DATABASE_POLICY.md`
- `docs/api/API_GATEWAY_POLICY.md`

## Current canonical scripts

- `tools/scripts/bin/verify_databases.sh`
- `tools/scripts/bin/health_check.sh`
- `tools/scripts/db/bootstrap_frontend_apps.sql`
- `tools/scripts/db/seed_frontend_sample_data.sql`
- `tools/scripts/db/verify_frontend_databases.sh`
- `tools/scripts/static/fix-static-data-import.js`

## Active frontend applications

- `booking-engine`
- `b2b-portal`
- `call-center-portal`
- `super-admin-portal`

## Backend architecture baseline

- Deployable backend runtime is package-based.
- Core backend packages include:
  - `@tripalfa/booking-service`
  - `@tripalfa/booking-engine-service`
  - `@tripalfa/shared-database`
  - `@tripalfa/shared-openapi`
  - `@tripalfa/shared-types`
  - `@tripalfa/shared-utils`
  - `@tripalfa/shared-validation`

## Database safety outcome

- Frontend app DB verification: ✅ passed.
- Static/reference DB `tripalfa_local`: ✅ untouched.
- `_prisma_migrations` absent in static DB: ✅ confirmed.

## Validation matrix

- `pnpm -r build`: ✅ passed
- `pnpm -r --if-present test`: ✅ passed
- `npx tsc -p tsconfig.json --noEmit`: ✅ passed
- `bash tools/scripts/bin/verify_databases.sh`: ✅ passed

## Notes

- Legacy Kong route markdown/yaml artifacts were removed. The canonical gateway route source is `infrastructure/wicked-config/routes/platform-core-routes.json`.
