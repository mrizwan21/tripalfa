# Environment Configuration Strategy

## Overview

TripAlfa uses a **single source of truth** for environment variables to eliminate confusion.

### Files

| File                 | Status       | Purpose                                | Git Status       |
| -------------------- | ------------ | -------------------------------------- | ---------------- |
| `.env`               | **PRIMARY**  | Main configuration (test/dummy values) | ✅ **COMMITTED** |
| `.env.example`       | **TEMPLATE** | Template for developers to copy        | ✅ **COMMITTED** |
| `.env.local.private` | Optional     | Local-only secrets (unused in repo)    | ❌ **IGNORED**   |

## Quick Start

### For New Developers

```bash
# 1. The .env file is already configured for local development
# 2. If you need to override specific values locally, create:
cp .env .env.local.private

# 3. Edit .env.local.private with your local-only values (it won't be committed)
# 4. Your local overrides will be loaded by: source .env && source .env.local.private
```

### For Production/CI Setup

```bash
# Copy the template and fill in real values
cp .env.example .env.production
# Edit .env.production with production values
# Use appropriate deployment automation to load this file
```

## The Single `.env` File (Committed to Git)

**Location:** `/Users/mohamedrizwan/Desktop/TripAlfa - Node/.env`

**Contains:**

- ✅ Test/dummy API keys (safe for git)
- ✅ Local development service URLs
- ✅ Development database configuration
- ✅ Test JWT secrets
- ✅ Feature flags
- ✅ All configuration needed to run locally

**Example values are clearly marked:**

```env
JWT_SECRET="your-test-jwt-secret-key-min-32-chars-change-in-production"
STRIPE_SECRET_KEY="sk_test_your_stripe_test_key"
GOOGLE_CLIENT_SECRET="test_secret_here"
```

## The `.env.example` File (Template)

**Location:** `/Users/mohamedrizwan/Desktop/TripAlfa - Node/.env.example`

**Purpose:**

- Template showing all available variables
- Clear documentation of what each variable does
- Instructions for obtaining real API keys
- Used by setup scripts/automation

**Usage:**

```bash
# Generate production configuration from template
cp .env.example .env.production
```

## Local-Only Overrides (`.env.local.private`)

**Location:** `.env.local.private` (create only if needed)

**When to use:**

- You have a different local database setup
- You want to use your own API keys
- You need different ports
- Anything you DON'T want committed to git

**Create & Use:**

```bash
# Create your local overrides file
cp .env .env.local.private

# Edit with your values (vi, nano, VSCode, etc)
nano .env.local.private

# Load in your shell (add to ~/.zshrc or ~/.bashrc)
source .env && source .env.local.private
```

**⚠️ Important:** `.env.local.private` is in `.gitignore` - it will NEVER be committed.

## Environment Variables by Category

### Database (4-Database Architecture)

```env
# PRIMARY: Core business database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/tripalfa_core"
CORE_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/tripalfa_core"

# Read-only reference data (hotels, flights)
LOCAL_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/tripalfa_local"

# Operations (notifications, rules)
OPS_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/tripalfa_ops"

# Financial data (invoices, loyalty)
FINANCE_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/tripalfa_finance"
```

**Key Fix in Current Setup:**

```
DATABASE_URL → tripalfa_core (NOT tripalfa_local)
CORE_DATABASE_URL → tripalfa_core
```

### Service Ports (Process-based)

```env
API_GATEWAY_PORT=3000
BOOKING_SERVICE_PORT=3001
STATIC_DATA_SERVICE_PORT=3002
USER_SERVICE_PORT=3004
ORGANIZATION_SERVICE_PORT=3006
PAYMENT_SERVICE_PORT=3007
WALLET_SERVICE_PORT=3008
NOTIFICATION_SERVICE_PORT=3009
RULE_ENGINE_SERVICE_PORT=3010
KYC_SERVICE_PORT=3011
MARKETING_SERVICE_PORT=3012
```

### Frontend (Vite Dev Servers)

```env
BOOKING_ENGINE_FRONTEND_PORT=5174
B2B_ADMIN_FRONTEND_PORT=5173

VITE_API_BASE_URL="http://localhost:3000/api"
VITE_API_URL="http://localhost:3000/api"
```

### External APIs

```env
# Flight booking (Duffel)
DUFFEL_API_KEY="your_duffel_api_key"

# Hotels (LiteAPI)
LITEAPI_API_KEY="prod_1ca7e299-f889-4462-8e32-ce421ab66a93"
LITEAPI_SANDBOX_KEY="sand_e79a7012-2820-4644-874f-ea71a9295a0e"

# Payments (Stripe)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
```

## What NOT to Do ❌

### ❌ DO NOT create multiple env files

- ~~`.env.local`~~ - Use `.env.local.private` instead
- ~~`.env.resend`~~ - All vars in `.env`
- ~~`.env.production.template`~~ - Use `.env.example`
- ~~`.env.services`~~ - Not needed

### ❌ DO NOT commit secrets

```env
# ❌ WRONG - Don't commit real secrets
STRIPE_SECRET_KEY="sk_live_xxxxxxxxxxxxx"  # Real production key

# ✅ RIGHT - Use dummy/test values in committed .env
STRIPE_SECRET_KEY="sk_test_your_stripe_test_key"
```

### ❌ DO NOT hardcode credentials in code

```typescript
// ❌ WRONG
const apiKey = 'sk_live_xxxxxxxxxxxxx';

// ✅ RIGHT
const apiKey = process.env.STRIPE_SECRET_KEY;
```

## Deployment Strategy

### Local Development (Already Working ✅)

```bash
# .env is loaded automatically
npm run dev
```

### Docker / CI/CD

```bash
# Load from mounted .env file
docker run --env-file .env.production myapp

# Or use environment variables
docker run -e DATABASE_URL="..." -e JWT_SECRET="..." myapp
```

### Production

```bash
# Build your production .env from template
cp .env.example .env.production

# Fill in real values
nano .env.production

# Use in Docker/K8s
# Option 1: Mount as file
# Option 2: Use secrets management (Vault, AWS Secrets Manager, etc)
# Option 3: Pass individual vars to container/process
```

## Troubleshooting

### "Connection refused on port 3000"

Check `API_GATEWAY_PORT` and `BOOKING_ENGINE_FRONTEND_PORT` conflict. Frontend Vite dev
server and API gateway both use port 3000 in some configs - if conflict, check
`.env` values.

### "Database connection failed"

1. Verify PostgreSQL running: `psql -h localhost -U postgres`
2. Check `DATABASE_URL` points to correct host:port:database
3. Verify database exists: `psql -l`
4. Verify credentials in URL match PostgreSQL setup

### "Missing API key error"

Check that all required external APIs have values in `.env`:

- `DUFFEL_API_KEY` (if using flights)
- `LITEAPI_API_KEY` (if using hotels)
- `STRIPE_SECRET_KEY` (if using payments)

### "Wrong variable loaded"

1. Verify `.env` vs `.env.local.private` (local.private overrides .env)
2. Reload environment: `source .env && source .env.local.private`
3. Check: `echo $VARIABLE_NAME` to see what's loaded

## Summary

```
One .env file = One source of truth ✅
No confusion = Streamlined development ✅
Clear local override strategy = Flexibility ✅
```

This is the final consolidated approach. No more `.env.local`, `.env.resend`, `.env.production.template`, etc.
