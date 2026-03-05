# TripAlfa Quick Start - Environment Config

## When You Clone the Repository

### Step 1: Get Neon Credentials

```bash
# Option A: Use Neon CLI
brew install neonctl && neonctl init
# Copy pooled and direct endpoints

# Option B: From https://console.neon.tech/app/projects
# Go to your project → Connection string
```

### Step 2: Setup Environment

**For Local Development (npm/pnpm dev):**

```bash
export NEON_DATABASE_URL="postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require"
export DIRECT_NEON_DATABASE_URL="postgresql://user:pass@ep-xxx.direct-connect.aws.neon.tech/neondb?sslmode=require"
npm run dev
```

**For Docker Development (docker-compose):**

```bash
cp .env.docker .env.docker.local
nano .env.docker.local  # Add your Neon credentials
docker-compose -f docker-compose.local.yml up
```

### Step 3: Run Database Migrations

```bash
npm run db:generate
npm run db:push
```

---

## Key Files & What They Do

| File | Purpose | Status |
|------|---------|--------|
| `.env.example` | Master template - read this first | ✓ Commit |
| `SETUP.md` | Detailed setup guide | ✓ Read this |
| `docker-compose.local.yml` | Only active compose file | ✓ Use this |
| `.env.docker` | Docker template (no secrets) | ✓ Commit |
| `archive/` | Legacy files (reference only) | 📖 History |

---

## Common Issues & Fixes

### `Connection refused on port 5433`

```bash
# Start just the static database
docker-compose -f docker-compose.local.yml up postgres-static
```

### `NEON_DATABASE_URL not set`

```bash
# Set before running
export NEON_DATABASE_URL="your-connection-string"
npm run dev
```

### `Services won't start in Docker`

```bash
# Check validator logs
docker-compose -f docker-compose.local.yml logs env-validator

# Verify env variables
docker-compose --env-file .env.docker.local -f docker-compose.local.yml config | grep DATABASE_URL
```

---

## One-Line Summary

**Local**: `export NEON_DATABASE_URL="..."; npm run dev`
**Docker**: `docker-compose --env-file .env.docker.local -f docker-compose.local.yml up`

---

**See full details in [SETUP.md](./SETUP.md)**
**Security details in [CLEANUP_SUMMARY.md](./CLEANUP_SUMMARY.md)**
