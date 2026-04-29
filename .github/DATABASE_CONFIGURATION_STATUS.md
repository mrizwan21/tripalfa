# TripAlfa Database Configuration Status

**Date:** April 28, 2026  
**Status:** ✅ Verified

## Active frontend applications

- Booking Engine
- B2B Portal
- Call Center Portal
- Super Admin Portal

## Frontend application databases

- `tripalfa_platform`
- `tripalfa_platform_ops`
- `tripalfa_platform_finance`

## Protected static/reference database

- `tripalfa_local`

This database is intentionally excluded from frontend application migration/reset workflows.

## Verification command

```bash
bash tools/scripts/bin/verify_databases.sh
```

## Latest verification result

- Required frontend DBs: ✅ present
- Shared schema checks: ✅ passed
- Four-app enum/access checks: ✅ passed
- Static DB safety check (`tripalfa_local`): ✅ untouched by frontend Prisma migrations

## Current policy

1. Frontend app schema operations target only frontend app databases.
2. Static/reference database remains isolated.
3. API traffic for frontend apps is centralized through API Manager (Kong/Wicked).
