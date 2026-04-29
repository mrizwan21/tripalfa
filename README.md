# TripAlfa Monorepo

TripAlfa is a multi-app travel platform monorepo with package-based backend services and shared libraries.

## Active frontend apps

- `apps/booking-engine`
- `apps/b2b-portal`
- `apps/call-center-portal`
- `apps/super-admin-portal`

## Backend and shared packages

- Service packages: `packages/booking-service`, `packages/booking-engine-service`
- Shared platform packages: `packages/shared-*`, `packages/api-clients`, `packages/auth-client`
- Database package: `packages/shared-database`
- Static/reference data package: `packages/static-data`

## Core commands

```bash
pnpm install
pnpm -r build
pnpm -r --if-present test
```

## API gateway (local Kong + Wicked)

```bash
pnpm gateway:preflight
pnpm gateway:build
pnpm gateway:start
pnpm gateway:sync
```

## Database guardrails

- Frontend app DB verification: `bash tools/scripts/bin/verify_databases.sh`
- Static/reference DB (`tripalfa_local`) is protected and must not be modified by frontend migration/reset workflows.

## Documentation

See [docs/README.md](./docs/README.md).
