# Database Policy

## Scope

This policy applies to frontend application databases only.

## Frontend application databases

- `tripalfa_platform`
- `tripalfa_platform_ops`
- `tripalfa_platform_finance`

## Protected static database

- `tripalfa_local` (static/reference data) is protected.
- Do not run frontend migration/reset/drop workflows against `tripalfa_local`.
- Do not attach Prisma migration history for frontend app schemas to the static database.

## Safe workflow

1. Apply schema changes to frontend databases.
2. Validate with `tools/scripts/bin/verify_databases.sh`.
3. Confirm `tripalfa_local` remains untouched.
