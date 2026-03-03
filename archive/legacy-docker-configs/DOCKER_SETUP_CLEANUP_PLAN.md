# Docker & Environment Setup Cleanup Plan

## Problem Summary

The codebase has multiple legacy docker-compose files and incomplete environment configuration, causing:
- Service build failures due to missing/conflicting environment variables
- Confusion about which compose file is the "source of truth"
- Redundant and incompatible configurations
- Database connection string mismatches between services

## Current State Analysis

### Docker Compose Files (8 total - TOO MANY!)

**Root Level (4 files):**
1. ✅ `docker-compose.local.yml` - **PRIMARY, ACTIVE** - Uses Neon cloud DB + local postgres-static
2. ❌ `docker-compose.kong.yml` - **LEGACY** - Old Kong API gateway setup (Kong replaced by services/api-gateway)
3. ❌ `docker-compose.resilient.yml` - **LEGACY** - Old resilient setup with RabbitMQ (not used)
4. ⚠️ `docker-compose.notification-rules.yml` - **UNCLEAR** - Standalone notification services (should be integrated or removed)

**Infrastructure/Compose Directory (3 files):**
5. ❌ `infrastructure/compose/docker-compose.yml` - **LEGACY** - Different service definitions
6. ❌ `infrastructure/compose/docker-compose.hybrid.yml` - **LEGACY** - Unused variant
7. ❌ `infrastructure/compose/docker-compose.wicked.yml` - **LEGACY** - Unused variant

**Database Directory (1 file):**
8. ✅ `database/static-db/docker-compose.yml` - **ACTIVE** - Static data initialization

### Environment Files (INCOMPLETE!)

**Existing:**
- `services/wallet-service/.env.example` - ✅ Good example
- `database/static-db/.env.example` - ✅ Good example

**Missing:**
- ❌ No `.env.docker` or `.env.docker.example` at root (README mentions `cp .env.docker .env.docker.local`)
- ❌ No root-level environment configuration documentation

### Database Architecture (From README)

Two-database system:
1. **Neon PostgreSQL** (cloud) - Application data via `NEON_DATABASE_URL` and `DIRECT_NEON_DATABASE_URL`
2. **Local Docker PostgreSQL** (postgres-static) - Static reference data (port 5433)

## Cleanup Plan

### Phase 1: Archive Legacy Files

Move these to `_archive/docker-legacy/`:
```
docker-compose.kong.yml
docker-compose.resilient.yml
infrastructure/compose/docker-compose.yml
infrastructure/compose/docker-compose.hybrid.yml
infrastructure/compose/docker-compose.wicked.yml
infrastructure/compose/pgbouncer/
```

**Rationale:** These represent outdated architectural approaches (Kong gateway, RabbitMQ resilience pattern). Keep for reference but don't use.

### Phase 2: Handle Notification/Rules Compose

**Decision Point:** `docker-compose.notification-rules.yml`

**Options:**
- **A (Recommended)**: Delete it - notification & rule-engine should run via main `docker-compose.local.yml`
- **B**: Keep as optional overlay: `docker-compose local.yml -f docker-compose.notification-rules.yml up`

**Action:** Integrate into `docker-compose.local.yml` (notification-service and rule-engine-service)

### Phase 3: Create Root Environment Configuration

Create `.env.docker.example`:
```dotenv
# ============================================
# Docker Compose Environment Configuration
# For local development with docker-compose.local.yml
# ============================================

# REQUIRED: Neon Cloud Database Connections
# Get from: https://console.neon.tech/app/projects
NEON_DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
DIRECT_NEON_DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require

# API Keys (Optional - required if using these providers)
DUFFEL_API_KEY=your_duffel_access_token_here
LITEAPI_API_KEY=your_liteapi_sandbox_or_production_key
KIWI_AFFIL_ID=your_kiwi_affiliate_id_here
KIWI_API_KEY=your_kiwi_api_key_here

# JWT Secret for Service-to-Service Auth
JWT_SECRET=your-secret-key-change-in-production

# Optional: Logging Level
LOG_LEVEL=info
```

Create `.env.docker.local` (git-ignored template):
- Copy of `.env.docker.example` with filled-in values
- Created manually by developers
- Used in docker-compose commands: `docker compose --env-file .env.docker.local up`

### Phase 4: Update Documentation

1. **Update README.md** - Clarify which compose files to use
2. **Create `DOCKER_SETUP.md`** - Step-by-step setup guide
3. **Create `.dockercompose.local.yml.md`** - Comments explaining each section

### Phase 5: Validate Service Definitions

Ensure `docker-compose.local.yml` includes:
- ✅ env-validator
- ✅ postgres-static (for static data)
- ✅ redis
- ✅ api-gateway
- ✅ booking-service
- ✅ All other backend services
- ⚠️ notification-service (currently in separate file)
- ⚠️ rule-engine-service (currently in separate file)

## Implementation Steps

1. **Create archive directory**
   ```bash
   mkdir -p _archive/docker-legacy
   ```

2. **Move legacy files**
   ```bash
   mv docker-compose.kong.yml _archive/docker-legacy/
   mv docker-compose.resilient.yml _archive/docker-legacy/
   mv infrastructure/compose/* _archive/docker-legacy/
   ```

3. **Create `.env.docker.example`** - Ready for distribution

4. **Integrate notification services** into `docker-compose.local.yml`
   - Add notification-service
   - Add rule-engine-service
   - Delete `docker-compose.notification-rules.yml`

5. **Update README.md** with single, clear startup command:
   ```bash
   cp .env.docker.example .env.docker.local
   # Edit .env.docker.local with your Neon credentials
   docker compose --env-file .env.docker.local -f docker-compose.local.yml up -d
   ```

6. **Update package.json** scripts (optional):
   ```json
   "docker:up": "docker compose --env-file .env.docker.local -f docker-compose.local.yml up -d",
   "docker:down": "docker compose -f docker-compose.local.yml down",
   "docker:logs": "docker compose -f docker-compose.local.yml logs -f"
   ```

7. **Add .gitignore entries**:
   ```
   .env.docker.local
   .env.docker
   .env.staticdb.local
   ```

## Validation Checklist

- [ ] All legacy files moved to `_archive/docker-legacy/`
- [ ] `docker-compose.local.yml` is the only active compose file
- [ ] `.env.docker.example` created with all required variables
- [ ] Notification services integrated into main compose
- [ ] README.md updated with single setup command
- [ ] All services start without environment variable errors
- [ ] Database connections work (Neon + postgres-static)
- [ ] `.env.docker.local` is in `.gitignore`

## Expected Outcome

✅ **Before Cleanup:**
```
8 docker-compose files
2 scattered .env files
Confusion about which file to use
Build failures from missing env vars
```

✅ **After Cleanup:**
```
2 active docker-compose files (local.yml + static-db/compose.yml)
1 root .env.docker.example
Clear documentation
Successful service startup
```

---

**Next Steps:** Run the cleanup commands below or ask me to automate the process.
