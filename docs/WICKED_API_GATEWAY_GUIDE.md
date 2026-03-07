# Wicked API Gateway Configuration Guide

## Overview

Wicked is an open-source API gateway management platform that provides:

- **API Portal** - Self-service developer portal
- **API Gateway** - Request routing and transformation
- **Authorization** - OAuth 2.0, OpenID Connect, API Key management
- **Rate Limiting** - Request throttling and quotas
- **API Documentation** - Auto-generated developer docs
- **Subscriptions** - Developer plan management
- **Webhooks** - Event notifications

## Current Setup

TripAlfa uses Wicked for **API management and documentation**. The configuration is stored in `infrastructure/wicked-config/`.

### Configuration Structure

```
infrastructure/wicked-config/
├── apis/                        # API definitions
│   ├── analytics-service/      # Analytics API config
│   ├── api-gateway/            # Main API Gateway config
│   ├── b2b-admin-server/       # B2B Admin API config
│   ├── booking-service/        # Booking API config
│   ├── inventory-service/      # Inventory API config
│   ├── metrics-service/        # Metrics API config
│   ├── payment-service/        # Payment API config
│   ├── petstore/               # Petstore demo API
│   ├── petstore-oauth/         # Petstore with OAuth
│   ├── user-service/           # User API config
│   ├── apis.json               # Master API registry
│   └── desc.md                 # API descriptions
├── routes/                      # Route definitions
│   ├── booking-service-routes.yml
│   ├── duffel-all-endpoints.yml
│   ├── duffel-ancillary-routes.yml
│   └── hold-orders-routes.yml
├── auth-servers/               # Authentication configs
│   └── default.json            # Default auth server config
├── pools/                       # Connection pools
│   └── wicked.json             # Database pool config
├── static/                      # Static content
│   ├── env/                     # Environment-specific configs
│   │   ├── box.json            # Local machine config ✅
│   │   ├── default.json        # Default config
│   │   ├── docker.json         # Docker config
│   │   └── k8s.json            # Kubernetes config
│   ├── apis/                   # Portal APIs
│   ├── auth-servers/           # Auth server definitions
│   ├── content/                # Portal content pages
│   ├── deploy.envkey           # Deployment key
│   ├── globals.json            # Global variables
│   ├── groups/                 # User groups
│   ├── index.jade              # Portal template
│   ├── index.json              # Portal config
│   ├── kickstarter.json        # Kickstarter config
│   ├── plans/                  # Pricing plans
│   ├── pools/                  # Connection pools
│   └── templates/              # Email templates
└── templates/                   # Wicked configuration templates
    └── [additional templates]
```

## Key Configuration Files

### 1. Environment Configuration (box.json)

**Path**: `infrastructure/wicked-config/static/env/box.json`

Contains environment-specific settings for **local machine deployment**:

```json
{
  "PORTAL_NETWORK_SCHEMA": { "value": "http" },
  "PORTAL_NETWORK_APIHOST": { "value": "localhost:8000" },
  "PORTAL_STORAGE_PGHOST": { "value": "localhost" },
  "PORTAL_NETWORK_PORTALHOST": { "value": "localhost:3000" },
  "PORTAL_API_URL": { "value": "http://localhost:3001" },
  "PORTAL_ECHO_URL": { "value": "http://localhost:3009" },
  // ... other service URLs
}
```

**Key Settings**:
- `PORTAL_NETWORK_SCHEMA` - HTTP or HTTPS
- `PORTAL_NETWORK_APIHOST` - Wicked API Gateway host
- `PORTAL_STORAGE_PGHOST` - PostgreSQL hostname (now: `localhost`)
- `PORTAL_*_URL` - Service endpoint URLs

### 2. API Definitions

**Path**: `infrastructure/wicked-config/apis/<service-name>/`

Each API service has its own directory containing:

```
<service-name>/
├── config.json           # API configuration
├── swagger.json          # OpenAPI specification
└── views.json            # Portal view customization
```

**Example: booking-service config**
```json
{
  "api": {
    "name": "booking-service",
    "title": "Booking Service API",
    "description": "Flight and hotel booking operations",
    "version": "2.0.0",
    "baseUri": "/booking",
    "requiredScopes": ["admin", "user"],
    "rateLimiting": {
      "requests": 1000,
      "period": "hour"
    }
  }
}
```

### 3. Routes Configuration

**Path**: `infrastructure/wicked-config/routes/`

Defines API routes and transformations:

- `booking-service-routes.yml` - Booking service endpoints
- `duffel-all-endpoints.yml` - Full Duffel API routing
- `duffel-ancillary-routes.yml` - Duffel add-on services
- `hold-orders-routes.yml` - Order hold/save functionality

**Route Example**:
```yaml
routes:
  - path: /flights/search
    target: "https://api.duffel.com/air/search_offers"
    auth: oauth2
    methods:
      - POST
    rateLimit:
      requests: 100
      period: minute
  - path: /flights/bookings
    target: "https://api.duffel.com/air/orders"
    auth: oauth2
    methods:
      - POST
```

### 4. Authentication Configuration

**Path**: `infrastructure/wicked-config/auth-servers/default.json`

Manages authentication methods:

- **API Key** - Simple key-based authentication
- **OAuth 2.0** - 3-legged authorization
- **OpenID Connect** - Identity provider integration
- **MTLS** - Mutual TLS authentication

## Local Machine Setup

### Step 1: Update Environment Configuration

Verify `box.json` is configured for localhost:

```bash
# Confirm configuration
cat infrastructure/wicked-config/static/env/box.json | grep PORTAL_STORAGE_PGHOST
# Should show: "localhost"
```

### Step 2: Update Nginx Configuration

Nginx is already configured in `infrastructure/nginx/nginx.conf`.

### Step 3: Configure Service URLs

All service URLs in `box.json` should point to localhost:

```json
{
  "PORTAL_API_URL": { "value": "http://localhost:3001" },
  "PORTAL_ECHO_URL": { "value": "http://localhost:3009" },
  "PORTAL_CHATBOT_URL": { "value": "http://localhost:3004" },
  "PORTAL_AUTHSERVER_URL": { "value": "http://localhost:3010" },
  "PORTAL_KONG_ADAPTER_URL": { "value": "http://localhost:3002" },
  // ... all services configured
}
```

### Step 4: Start Services

```bash
# Start all application services
bash scripts/start-local-dev.sh

# Services will be available at:
# - API Gateway: http://localhost:3000
# - Booking Service: http://localhost:3001
# - ... (others on configured ports)
```

## API Management

### Adding a New API

1. Create API directory:
```bash
mkdir -p infrastructure/wicked-config/apis/new-service
```

2. Create configuration:
```json
// config.json
{
  "api": {
    "name": "new-service",
    "title": "New Service API",
    "description": "Description of the service",
    "version": "1.0.0",
    "baseUri": "/new-service"
  }
}
```

3. Add routes in `routes/new-service-routes.yml`

4. Configure auth in `auth-servers/`

### Managing Subscriptions & Plans

Plans are defined in `static/plans/`:

```json
{
  "name": "free",
  "description": "Free tier",
  "maxRequests": 1000,
  "period": "month",
  "scopes": ["basic"]
}
```

### Developer Portal

Customize the portal in `static/`:

- **index.jade** - Main portal template
- **index.json** - Portal configuration
- **content/** - Portal pages (Markdown/HTML)
- **templates/** - Email templates

## Advanced Configuration

### Rate Limiting

Configure per-API or globally:

```json
{
  "rateLimiting": {
    "enabled": true,
    "requests": 1000,
    "period": "hour",
    "by": "api_key"
  }
}
```

### Request/Response Transformation

Add middleware for request/response transformation:

```yaml
transformations:
  - type: request
    action: add_header
    header: X-Service-Version
    value: 2.0
  - type: response
    action: add_header
    header: X-Powered-By
    value: Wicked
```

### Webhook Events

Configure webhooks for subscription events:

```json
{
  "webhooks": {
    "subscription_created": "http://localhost:3001/webhooks/subscription",
    "subscription_deleted": "http://localhost:3001/webhooks/subscription",
    "api_key_created": "http://localhost:3001/webhooks/api-key"
  }
}
```

## Integration with TripAlfa

### Current Usage

Wicked provides:
- ✅ **API Documentation** - OpenAPI/Swagger specs
- ✅ **Route Management** - Configuration reference
- ✅ **Auth Server Config** - OAuth setup reference
- ✅ **Portal** - [Optional] Developer self-service

### Not Currently Used in Local Dev

- ❌ **API Gateway** - Using embedded Express API Gateway instead
- ❌ **Rate Limiting** - Using service-level rate limiting
- ❌ **Subscriptions** - Using internal plan management
- ❌ **Portal UI** - Using B2B Admin for management

## Troubleshooting

### Configuration Not Applied

1. Verify environment is set correctly:
```bash
echo $WICKED_ENV
# Should be: box
```

2. Verify file permissions:
```bash
ls -la infrastructure/wicked-config/static/env/box.json
```

3. Check JSON syntax:
```bash
jq . infrastructure/wicked-config/static/env/box.json
```

### Database Connection Issues

1. Verify PostgreSQL is running:
```bash
psql -h localhost -U postgres -d staticdatabase -c "SELECT 1;"
```

2. Check credentials in `box.json`

3. Verify port 5432 is open

### Missing Routes

1. Check `routes/` directory has necessary YAML files
2. Verify YAML syntax: `yamllint routes/*.yml`
3. Ensure routes are referenced in service configs

## Best Practices

1. **Use Environment-Specific Configs**
   - `box.json` for local
   - `docker.json` for Docker
   - `k8s.json` for Kubernetes

2. **Document Route Changes**
   - Keep API documentation updated
   - Update Swagger specs when routes change
   - Add comments explaining complex routes

3. **Version Your APIs**
   - Use semantic versioning
   - Support multiple API versions
   - Plan deprecation timeline

4. **Monitor API Usage**
   - Track API calls in Prometheus
   - Monitor error rates
   - Alert on quota violations

5. **Secure Sensitive Data**
   - Never commit API keys/secrets
   - Use environment variables
   - Encrypt sensitive configuration

## Resources

- **Wicked Docs**: https://wicked.haufe.io/
- **OpenAPI Spec**: https://spec.openapis.org/
- **OAuth 2.0**: https://tools.ietf.org/html/rfc6749
- **TripAlfa Services**: See `docs/BACKEND_SERVICES.md`

## Next Steps

1. ✅ Verify `box.json` configuration
2. ✅ Start services with `bash scripts/start-local-dev.sh`
3. ✅ Test API endpoints: `curl http://localhost:3000/health`
4. ✅ Add custom routes as needed
5. ✅ Configure auth servers for your services

---

**Last Updated**: March 5, 2026
**Configuration Version**: 2.0
**Environment**: Local Machine Setup
