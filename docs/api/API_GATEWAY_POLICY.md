# API Gateway Policy (Kong/Wicked)

## Principle

All internal and external APIs should be centralized through API Manager (Kong/Wicked).
Kong runtime is expected to be deployed locally (outside this repository deployment stack).

## Rules

1. Frontend apps consume gateway endpoints only.
2. Backend package services are registered behind gateway routes.
3. Supplier/provider APIs are exposed via gateway-managed contracts and policies.
4. Auth, rate-limits, logging, and audit should be enforced at gateway and service layers.

## Implementation Notes

- Wicked catalog (source of truth): `infrastructure/wicked-config/apis`
- Core route mapping: `infrastructure/wicked-config/routes/platform-core-routes.json`
- Generated Kong declarative config: `infrastructure/kong/kong.yml`
- Run preflight checks: `pnpm gateway:preflight`
- Build config: `pnpm gateway:build`
- Verify route coverage: `pnpm gateway:verify-routes`
- Start local Kong runtime: `pnpm gateway:start`
- Sync to local Kong: `bash tools/scripts/bin/gateway_sync_local.sh`

## Active frontend app domains

- Booking Engine
- B2B Portal
- Call Center Portal
- Super Admin Portal
