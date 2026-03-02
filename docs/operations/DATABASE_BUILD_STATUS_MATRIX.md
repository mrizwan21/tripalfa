# Database Build Status Matrix

**Date:** March 1, 2026  
**Scope:** Backend services, frontend apps, infrastructure, and shared packages

## Neon Database Verification (Live)

| Database | Purpose | Tables | Foreign Keys | Status |
| --- | --- | ---: | ---: | --- |
| `neondb` | Shared core data | 85 | 52 | ✅ Built |
| `tripalfa_user_service` | Dedicated user service DB | 85 | 52 | ✅ Built |
| `tripalfa_payment_service` | Dedicated payment service DB | 85 | 52 | ✅ Built |
| `tripalfa_booking_service` | Dedicated booking service DB | 85 | 52 | ✅ Built |
| `tripalfa_notification_service` | Dedicated notification service DB | 85 | 52 | ✅ Built |
| `tripalfa_wallet_service` | Dedicated wallet service DB | 85 | 52 | ✅ Built |
| `tripalfa_audit_service` | Dedicated audit service DB | 85 | 52 | ✅ Built |

## Component Coverage Matrix

| Component Group | Count | Database Model | Build Status |
| --- | ---: | --- | --- |
| Backend services (`services/*`) | 12 | Neon (shared + dedicated), except in-memory rule engine | ✅ Confirmed |
| Frontend apps (`apps/*`) | 2 | No direct DB (API consumers) | ✅ Confirmed |
| Infrastructure (`docker-compose.local.yml`) | 3 | `postgres-static` + `redis` + `env-validator` | ✅ Confirmed |
| Shared packages (`packages/*`) | 11 | Library layer (no standalone DB instances) | ✅ Confirmed |

## Static Database Separation

- `staticdatabase` remains local Docker (`postgres-static`, port `5433`).
- It is intentionally separated from Neon and was not modified during Neon schema builds.

## Notes

- Schema source: `database/prisma/schema.prisma`
- Prisma runtime config: `prisma.config.ts`
- Neon rebuild/sync script: `scripts/neon/rebuild-neon-optimized.sh`
