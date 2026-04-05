# TripAlfa Environment Configuration Guide

**Last Updated:** March 18, 2026

This document provides comprehensive guidance on configuring environment variables for TripAlfa's monorepo architecture,
including database setup, service integration, and authentication.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Database Configuration](#database-configuration)
3. [Authentication & Security](#authentication--security)
4. [Service Integration](#service-integration)
5. [External APIs](#external-apis)
6. [Development vs Production](#development-vs-production)
7. [Environment Variable Reference](#environment-variable-reference)
8. [Troubleshooting](#troubleshooting)

---

## Quick Start

### For Local Development

```bash
# 1. Copy the example file
cp .env.example .env

# 2. Update database URLs (see Database Configuration section)
# Edit .env and set:
#   - CORE_DATABASE_URL
#   - LOCAL_DATABASE_URL
#   - OPS_DATABASE_URL
#   - FINANCE_DATABASE_URL

# 3. Generate JWT secret
JWT_SECRET=$(openssl rand -base64 32)

# 4. Set development mode
NODE_ENV=development

# 5. Enable development auth bypass (optional, for testing)
DEV_AUTH_BYPASS=true
DEV_AUTH_BYPASS_SECRET=$(uuidgen)

# 6. Install and run
npm install
npm run dev
```

### For Production

```bash
# 1. Copy the example file
cp .env.example .env

# 2. Set production mode (CRITICAL)
NODE_ENV=production

# 3. Update all database URLs with production credentials
# 4. Set strong JWT_SECRET
# 5. Configure all service URLs for your infrastructure
# 6. Set production API keys for external services
```

---

## Database Configuration

TripAlfa uses a **distributed multi-database architecture** with 4 PostgreSQL instances for different purposes:

### Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│ TripAlfa Multi-Database Architecture                            │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│ tripalfa_core (WRITE-HEAVY)                                    │
│ ┌────────────────────────────────────────┐                     │
│ │ • Users & Authentication               │                     │
│ │ • Bookings & Orders                    │                     │
│ │ • Payments & Wallet                    │                     │
│ │ • KYC Data                             │                     │
│ │ • Sessions & Tokens                    │                     │
│ │ Services: user, auth, booking, payment │                     │
│ └────────────────────────────────────────┘                     │
│                                                                  │
│ tripalfa_local (READ-ONLY STATIC DATA)                         │
│ ┌────────────────────────────────────────┐                     │
│ │ • Hotels & Amenities                   │                     │
│ │ • Flights & Airlines                   │                     │
│ │ • Airports & Locations                 │                     │
│ │ • Facilities & Reviews                 │                     │
│ │ • LiteAPI Reference Data               │                     │
│ │ Services: booking (hybrid access)      │                     │
│ └────────────────────────────────────────┘                     │
│                                                                  │
│ tripalfa_ops (MODERATE WRITE)                                   │
│ ┌────────────────────────────────────────┐                     │
│ │ • Notifications & Events               │                     │
│ │ • Disputes & Chargebacks               │                     │
│ │ • Operations Logs                      │                     │
│ │ • Audit Trails                         │                     │
│ │ Services: notification, kyc, audit     │                     │
│ └────────────────────────────────────────┘                     │
│                                                                  │
│ tripalfa_finance (BATCH PROCESSING)                             │
│ ┌────────────────────────────────────────┐                     │
│ │ • Reports & Analytics                  │                     │
│ │ • Financial Reconciliation             │                     │
│ │ • Deal Rules & Pricing                 │                     │
│ │ • Batch Processing                     │                     │
│ │ Services: rules, marketing, batch      │                     │
│ └────────────────────────────────────────┘                     │
└──────────────────────────────────────────────────────────────────┘
```

### Required Environment Variables

```bash
# ============================================
# CORE DATABASE (REQUIRED - Write-Heavy OLTP)
# ============================================

# Primary connection string (recommended)
CORE_DATABASE_URL="postgresql://user:password@db-core.example.com:5432/tripalfa_core"

# Legacy name (aliases CORE_DATABASE_URL)
DATABASE_URL="postgresql://user:password@db-core.example.com:5432/tripalfa_core"

# Prisma CLI configuration (must set for migrations)
DIRECT_DATABASE_URL="postgresql://user:password@db-core.example.com:5432/tripalfa_core"

# ============================================
# LOCAL DATABASE (REQUIRED - Static Reference Data)
# ============================================

# Static hotel, flight, location reference data (READ-ONLY in most services)
LOCAL_DATABASE_URL="postgresql://user:password@db-local.example.com:5432/tripalfa_local"

# Legacy alias (do not use in new code)
STATIC_DATABASE_URL="postgresql://user:password@db-local.example.com:5432/tripalfa_local"

# ============================================
# OPS DATABASE (REQUIRED - Moderate Write)
# ============================================

# Notifications, disputes, operations logs
OPS_DATABASE_URL="postgresql://user:password@db-ops.example.com:5432/tripalfa_ops"

# ============================================
# FINANCE DATABASE (REQUIRED - Batch Processing)
# ============================================

# Reporting, analytics, financial rules
FINANCE_DATABASE_URL="postgresql://user:password@db-finance.example.com:5432/tripalfa_finance"

# ============================================
# CONNECTION POOL CONFIGURATION
# ============================================

# Maximum concurrent connections per pool (default: 10)
DB_POOL_MAX=20

# Idle connection timeout in milliseconds (default: 30000)
DB_IDLE_TIMEOUT_MS=30000

# Connection establishment timeout (default: 10000)
DB_CONNECTION_TIMEOUT_MS=10000

# SQL statement timeout in milliseconds (default: 30000)
DB_STATEMENT_TIMEOUT_MS=30000

# SSL certificate verification (production: true, dev: false)
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=true
```

### Local Development Setup

```bash
# For local PostgreSQL instances:

# Create databases
createdb tripalfa_core
createdb tripalfa_local
createdb tripalfa_ops
createdb tripalfa_finance

# Update .env with local connection strings
CORE_DATABASE_URL="postgresql://postgres:password@localhost:5432/tripalfa_core"
LOCAL_DATABASE_URL="postgresql://postgres:password@localhost:5432/tripalfa_local"
OPS_DATABASE_URL="postgresql://postgres:password@localhost:5432/tripalfa_ops"
FINANCE_DATABASE_URL="postgresql://postgres:password@localhost:5432/tripalfa_finance"

# Run migrations (from project root)
npm run db:migrate
npm run db:generate

# Verify connection
npm run test:db
```

---

## Authentication & Security

### JWT Configuration

```bash
# ============================================
# JWT SECURITY (CRITICAL)
# ============================================

# Secret for signing JWT tokens (minimum 32 characters for production)
# Generate with: openssl rand -base64 32
JWT_SECRET="your-base64-encoded-256-bit-secret"

# JWT issuer (must be consistent across all services)
# Default: "tripalfa"
JWT_ISSUER="tripalfa"

# JWT expiry times
JWT_EXPIRY=3600                    # Access token (1 hour)
JWT_REFRESH_EXPIRY=2592000         # Refresh token (30 days)
JWT_ISSUER_REFRESH="tripalfa-refresh"
```

### Development Auth Bypass

```bash
# ⚠️ ONLY for development and testing - NEVER enable in production

NODE_ENV=development

# Enable password-less authentication for development
DEV_AUTH_BYPASS=true

# Random secret to bypass auth (generate with: uuidgen)
DEV_AUTH_BYPASS_SECRET="a1b2c3d4-e5f6-7890-abcd-ef1234567890"

# Optional: Use default test credentials
DEV_TEST_USER_ID="test-user-id-123"
DEV_TEST_COMPANY_ID="test-company-id-456"
```

### OAuth2 & SSO Configuration

```bash
# ============================================
# SAML SSO (Single Sign-On)
# ============================================

SAML_ENABLED=false
SAML_ISSUER="tripalfa"
SAML_ENTRY_POINT="https://sso.example.com/sso"
SAML_CERT="-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----"
SAML_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"

# ============================================
# MULTI-FACTOR AUTHENTICATION (MFA / 2FA)
# ============================================

# TOTP (Time-based One-Time Password) configuration
TOTP_ISSUER="TripAlfa"
TOTP_WINDOW=2                      # Tolerance windows (±N minutes)

# SMS verification (optional)
SMS_PROVIDER="twilio"              # or "vonage", "aws-sns"
SMS_API_KEY="xxx"
SMS_SENDER_ID="TripAlfa"

# Email verification
MAIL_FROM="noreply@tripalfa.com"
MAIL_REPLY_TO="support@tripalfa.com"
```

---

## Service Integration

### Service URLs

```bash
# ============================================
# SERVICE DISCOVERY & ROUTING
# ============================================

# API Gateway (central router - REQUIRED)
API_GATEWAY_URL="http://api-gateway.local:3000"

# Individual Service URLs (override defaults)
# Format: {SERVICE_NAME}_URL=http://host:port
# If not set, API gateway will use default port mappings

# Core services
AUTH_SERVICE_URL="http://auth-service.local:3005"
USER_SERVICE_URL="http://user-service.local:3003"
BOOKING_SERVICE_URL="http://booking-service.local:3001"

# Optional: Service-specific ports (if not using URLs above)
AUTH_SERVICE_PORT=3005
USER_SERVICE_PORT=3003
BOOKING_SERVICE_PORT=3001
PAYMENT_SERVICE_PORT=3007
WALLET_SERVICE_PORT=3008
NOTIFICATION_SERVICE_PORT=3009
RULE_ENGINE_SERVICE_PORT=3010
KYC_SERVICE_PORT=3011
MARKETING_SERVICE_PORT=3012
COMPANY_SERVICE_PORT=3006
B2B_ADMIN_SERVICE_PORT=3020
BOOKING_ENGINE_SERVICE_PORT=3021
```

### Service Port Mapping Reference

| Service                | Port | Purpose                 |
| ---------------------- | ---- | ----------------------- |
| api-gateway            | 3000 | Central routing & auth  |
| booking-service        | 3001 | Core booking operations |
| auth-service           | 3005 | JWT & token management  |
| user-service           | 3003 | User management         |
| company-service        | 3006 | Organization management |
| payment-service        | 3007 | Payment processing      |
| wallet-service         | 3008 | Wallet operations       |
| notification-service   | 3009 | Email, SMS, push        |
| rule-engine-service    | 3010 | Rule evaluation         |
| kyc-service            | 3011 | KYC/AML verification    |
| marketing-service      | 3012 | Marketing campaigns     |
| b2b-admin-service      | 3020 | B2B admin API           |
| booking-engine-service | 3021 | Booking engine API      |

---

## External APIs

### Hotel & Flight Integrations

```bash
# ============================================
# LITEAPI (Hotel Search & Booking)
# ============================================

LITEAPI_API_BASE_URL="https://api.liteapi.travel/v3.0"
LITEAPI_BOOK_BASE_URL="https://book.liteapi.travel/v3.0"

# Development: Use test API key
LITEAPI_API_KEY="your-test-api-key"
VITE_LITEAPI_TEST_API_KEY="your-test-api-key"

# Production: Use production API key
LITEAPI_PROD_API_KEY="your-prod-api-key"

# ============================================
# DUFFEL (Flight Search & Booking)
# ============================================

DUFFEL_API_KEY="your-duffel-api-key"
DUFFEL_API_BASE_URL="https://api.duffel.com"
DUFFEL_TIMEOUT_MS=30000            # API request timeout

# ============================================
# CONTENT & MEDIA
# ============================================

# Image optimization service
IMAGE_OPTIMIZATION_URL="https://images.tripalfa.com"
CDN_BASE_URL="https://cdn.tripalfa.com"

# Video streaming service
VIDEO_PROVIDER="cloudinary"         # or "vimeo", "youtube"
VIDEO_API_KEY="xxx"
CLOUDINARY_CLOUD_NAME="tripalfa"
```

### Payment Gateways

```bash
# ============================================
# STRIPE (Payment Processing)
# ============================================

STRIPE_SECRET_KEY="sk_live_xxxx"           # Production key
STRIPE_PUBLISHABLE_KEY="pk_live_xxxx"      # Frontend key
STRIPE_WEBHOOK_SECRET="whsec_xxxx"         # Webhook signature verification

# Test keys (development)
STRIPE_TEST_SECRET_KEY="sk_test_xxxx"
STRIPE_TEST_PUBLISHABLE_KEY="pk_test_xxxx"

# ============================================
# RAZORPAY (Payment Processing - India)
# ============================================

RAZORPAY_KEY_ID="key_xxxx"
RAZORPAY_KEY_SECRET="secret_xxxx"
RAZORPAY_WEBHOOK_SECRET="webhook_secret_xxxx"

# ============================================
# BRAINTREE (PayPal Integration)
# ============================================

BRAINTREE_MERCHANT_ID="xxxx"
BRAINTREE_PUBLIC_KEY="xxxx"
BRAINTREE_PRIVATE_KEY="xxxx"
```

### Communication Services

```bash
# ============================================
# EMAIL (Notification System)
# ============================================

MAIL_PROVIDER="resend"

# ============================================
# SMS (OTP & Alerts)
# ============================================

SMS_PROVIDER="twilio"               # or "vonage", "aws-sns"
TWILIO_ACCOUNT_SID="ACxxxx"
TWILIO_AUTH_TOKEN="token_xxxx"
TWILIO_PHONE_NUMBER="+1234567890"

# ============================================
# PUSH NOTIFICATIONS
# ============================================

FIREBASE_PROJECT_ID="tripalfa-prod"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
FIREBASE_CLIENT_EMAIL="xxxx@appspot.gserviceaccount.com"
```

---

## Development vs Production

### Development Configuration

```bash
NODE_ENV=development

# Loose security settings for development
DEV_AUTH_BYPASS=true
DEV_AUTH_BYPASS_SECRET=test-secret
DEV_LOG_LEVEL=debug
DEV_CORS_ORIGIN="*"

# Relaxed database settings
DB_POOL_MAX=5
DB_CONNECTION_TIMEOUT_MS=30000
DB_STATEMENT_TIMEOUT_MS=60000  # Longer for debugging

# Local service URLs
API_GATEWAY_URL="http://localhost:3000"
BOOKING_SERVICE_URL="http://localhost:3001"

# Development (test) API keys
LITEAPI_API_KEY="test-key"
DUFFEL_API_KEY="test-key"
STRIPE_SECRET_KEY="sk_test_xxxx"

# Logs to console with verbose output
LOG_FORMAT=pretty
LOG_LEVEL=debug
```

### Production Configuration

```bash
NODE_ENV=production

# Strict security settings
DEV_AUTH_BYPASS=false          # Must be false!
JWT_SECRET=<strong-secret>
DB_SSL_REJECT_UNAUTHORIZED=true

# Optimized database settings
DB_POOL_MAX=30                 # Higher for concurrent traffic
DB_IDLE_TIMEOUT_MS=10000       # Shorter timeout
DB_CONNECTION_TIMEOUT_MS=5000
DB_STATEMENT_TIMEOUT_MS=10000  # Shorter for performance

# Production service URLs
API_GATEWAY_URL="https://api.tripalfa.com"
BOOKING_SERVICE_URL="https://api.tripalfa.com/bookings"

# Production API keys
LITEAPI_API_KEY=<prod-key>
DUFFEL_API_KEY=<prod-key>
STRIPE_SECRET_KEY=sk_live_xxxx

# Structured logging (JSON) for aggregation
LOG_FORMAT=json
LOG_LEVEL=warn
```

---

## Environment Variable Reference

### System & Runtime

```bash
NODE_ENV                        # development | production
PORT                           # Default service port (if not set, uses service-specific)
LOG_LEVEL                      # debug | info | warn | error
LOG_FORMAT                     # pretty | json
DEBUG                          # Comma-separated namespaces for debug output
```

### Frontend (React Apps)

Accessible via `import.meta.env.VITE_*` in frontend code:

```bash
# Booking Engine Frontend
VITE_API_BASE_URL="http://localhost:3000"
VITE_LITEAPI_TEST_API_KEY="test-key"
VITE_STRIPE_PUBLISHABLE_KEY="pk_test_xxxx"

# B2B Admin Frontend
VITE_B2B_API_URL="http://localhost:3020"
VITE_ENABLE_ANALYTICS=true
```

### Internal Only (Backend)

```bash
PROJECT_ROOT                    # Explicit root path for .env resolution
INTERNAL_WORKER_THREADS=4       # Worker threads for batch jobs
CACHE_REDIS_URL                 # Redis connection for caching
QUEUE_REDIS_URL                 # Redis connection for job queues
```

---

## Troubleshooting

### Database Connection Issues

**Issue:** `Error: ECONNREFUSED 127.0.0.1:5432`

```bash
# Solution: PostgreSQL is not running
# Check status
brew services list                   # macOS
systemctl status postgresql          # Linux

# Start PostgreSQL
brew services start postgresql       # macOS
systemctl start postgresql           # Linux

# Or using Docker
docker run -d \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  postgres:15
```

**Issue:** `Error: password authentication failed for user "postgres"`

```bash
# Solution: Invalid database credentials
# Check your DATABASE_URL in .env
# Format: postgresql://username:password@host:port/database

# Test connection
psql -U postgres -h localhost -d tripalfa_core
```

**Issue:** `Error: connect ECONNREFUSED - Could not locate .env file`

```bash
# Solution: Missing .env file or wrong working directory
# Ensure you're in the project root:
pwd
ls -la .env

# Or set explicit path:
export PROJECT_ROOT=/path/to/TripAlfa
npm run dev
```

### JWT & Authentication Issues

**Issue:** `JWT_SECRET not set` during development

```bash
# Solution: Generate and set JWT_SECRET
JWT_SECRET=$(openssl rand -base64 32)
echo "JWT_SECRET=$JWT_SECRET" >> .env
npm run dev
```

**Issue:** `Token verification failed - invalid issuer`

```bash
# Solution: JWT_ISSUER mismatch between services
# Verify all services use same issuer:
grep -r "JWT_ISSUER" services/
# All should default to: "tripalfa"

# If custom issuer needed, set consistently:
export JWT_ISSUER="custom-issuer"
```

### Service Communication Issues

**Issue:** `Error: Cannot reach booking-service at http://localhost:3001`

```bash
# Solution: Service is not running
# Start all services at once:
npm run dev

# Or start individual service:
npm run dev --workspace=@tripalfa/booking-service

# Verify service is listening:
curl http://localhost:3001/health
```

**Issue:** `CORS error when frontend calls API`

```bash
# Solution: API not configured to accept frontend origin
# Update CORS_ORIGIN in api-gateway middleware

# Development: Allow all origins
VITE_API_BASE_URL="http://localhost:3000"

# Production: Restrict to your domain
CORS_ORIGIN="https://tripalfa.com,https://admin.tripalfa.com"
```

### Database Pool Exhaustion

**Issue:** `Error: timeout acquiring a connection from the pool`

```bash
# Solution: Increase pool size or reduce connection lifetime
# Update .env:
DB_POOL_MAX=30                    # Increase from 10 to 30
DB_IDLE_TIMEOUT_MS=10000         # Reduce from 30000 to 10000

# Check pool statistics:
npm run db:pool-stats

# Monitor active connections:
psql -c "SELECT count(*) FROM pg_stat_activity;"
```

---

## Security Best Practices

1. **Never commit secrets** to git - use `.env.local.private` or environment-specific secrets management
2. **Rotate JWT secrets** periodically in production
3. **Use strong passwords** for database users (minimum 16 characters, including special chars)
4. **Enable SSL/TLS** for all database connections in production (`DB_SSL_REJECT_UNAUTHORIZED=true`)
5. **Limit service exposure** - only expose API Gateway publicly, keep internal services firewalled
6. **Monitor logs** for authentication failures and suspicious activity
7. **Use separate credentials** for each environment (dev/staging/production)

---

## References

- [Prisma PostgreSQL Adapter](https://www.prisma.io/docs/orm/overview/databases/postgresql)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [OWASP Security Guide](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [SSL/TLS Certificate Management](https://www.postgresql.org/docs/current/libpq-ssl.html)

---

**Questions or Issues?**

- Check [docs/LOCAL_DEVELOPMENT.md](../LOCAL_DEVELOPMENT.md) for setup guide
- Review [docs/CRITICAL_FIXES_APPLIED.md](../CRITICAL_FIXES_APPLIED.md) for known issues
- See [api-manager.config.ts](../../services/api-gateway/src/config/api-manager.config.ts)
  for service routing details
