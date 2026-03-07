# Local Infrastructure Setup Guide

## Overview

This guide explains how to run TripAlfa's infrastructure components locally on your machine (not in Docker). The infrastructure includes:

- **Nginx Reverse Proxy** - Routes requests to services
- **Wicked API Gateway** - API management and routing layer
- **Prometheus** - Metrics collection
- **Grafana** - Metrics visualization
- **Loki** - Log aggregation

## Architecture

```
Client Requests
     ↓
Nginx (Port 80)
     ├→ /api/* → API Gateway (Port 3000)
     ├→ /socket.io → API Gateway (Port 3000)
     ├→ / → Booking Engine (Port 5174)
     └→ /b2b → B2B Admin (Port 5173)
```

## Quick Start

### 1. Start Services
```bash
# Start all services
bash scripts/start-local-dev.sh
```

### 2. Start Monitoring Stack (Optional)
```bash
# Start Prometheus, Loki, and Grafana
bash scripts/start-monitoring-local.sh
```

### 3. Access the Application
- Main App: http://localhost (via Nginx) or http://localhost:5174
- B2B Panel: http://localhost:5173
- API: http://localhost:3000
- Grafana: http://localhost:3500
- Prometheus: http://localhost:9090

## Detailed Setup

### Prerequisites

```bash
# Install Homebrew packages (macOS)
brew install nginx
brew install prometheus
brew install grafana
brew install loki

# Or if already using package managers:
# Ubuntu: apt-get install nginx prometheus grafana-server loki
```

### Nginx Configuration

**Location**: `infrastructure/nginx/nginx.conf`

The Nginx configuration is already updated to use localhost ports:

```nginx
upstream api_gateway {
    server localhost:3000;
}

upstream booking_engine {
    server localhost:5174;
}

upstream b2b_panel {
    server localhost:5173;
}
```

**Start Nginx**:
```bash
# Copy config to Nginx directory
sudo cp infrastructure/nginx/nginx.conf /usr/local/etc/nginx/nginx.conf

# Start Nginx
nginx

# Test configuration
nginx -t

# Reload after config changes
nginx -s reload

# Stop Nginx
nginx -s stop
```

### Wicked API Gateway Configuration

**Location**: `infrastructure/wicked-config/`

Wicked is an API gateway management framework. Configuration files:

- **APIs**: `infrastructure/wicked-config/apis/` - Service definitions
- **Routes**: `infrastructure/wicked-config/routes/` - API routes
- **Auth Servers**: `infrastructure/wicked-config/auth-servers/` - Authentication configs
- **Environment**: `infrastructure/wicked-config/static/env/box.json` - Local environment settings

**Already Configured for Local**:
```json
{
  "PORTAL_STORAGE_PGHOST": {
    "value": "localhost"
  }
}
```

**To Use Wicked**:
```bash
# Wicked is configured but can run as:
# 1. Configuration management tool (current use)
# 2. API gateway service (if deployed)

# For local development, Wicked provides:
# - API documentation
# - Route management (reference)
# - Portal access (optional)
```

### Prometheus Monitoring

**Location**: `infrastructure/monitoring/prometheus.yml`

Prometheus is configured to scrape metrics from all services:

```yaml
scrape_configs:
  - job_name: "api-gateway"
    static_configs:
      - targets: ["localhost:3000"]
    metrics_path: /metrics
  # ... (other services configured)
```

**Start Prometheus**:
```bash
prometheus --config.file=infrastructure/monitoring/prometheus.yml \
           --storage.tsdb.path=.monitoring-data/prometheus \
           --storage.tsdb.retention.time=30d
```

Or use the automated script:
```bash
bash scripts/start-monitoring-local.sh
```

### Grafana Dashboards

**Location**: 
- Config: `infrastructure/monitoring/grafana.ini`
- Provisioning: `infrastructure/monitoring/grafana/provisioning/`

**Features**:
- Auto-configured Prometheus datasource
- Sample dashboards for monitoring
- Pre-configured Loki for logs

**Start Grafana**:
```bash
grafana-server --config=infrastructure/monitoring/grafana.ini
```

Access at: http://localhost:3500
- Username: admin
- Password: admin

### Loki Log Aggregation

**Location**: `infrastructure/monitoring/loki.yml`

Loki collects logs from services for centralized log viewing in Grafana.

**Requirements**:
- Promtail agent running on each service (or centralized)
- Configuration: `infrastructure/monitoring/promtail.yml`

## Environment Files

Configuration is environment-specific:

- **box.json** - Local machine (recommended)
- **docker.json** - Docker containers
- **k8s.json** - Kubernetes deployments
- **default.json** - Fallback configuration

**Select Environment**:
```bash
# In Wicked Portal or API Gateway config:
export WICKED_ENV=box  # for local development
```

## Monitoring Metrics

Services expose metrics on the `/metrics` endpoint:

```bash
# Example: Get API Gateway metrics
curl http://localhost:3000/metrics
```

**Available Metrics**:
- Request latency
- Error rates
- Circuit breaker state
- Queue depth (if applicable)
- Database connection pool stats

## Troubleshooting

### Port Already in Use
```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>
```

### Nginx Config Errors
```bash
# Test configuration
nginx -t

# Check config syntax
sudo nginx -t -c /usr/local/etc/nginx/nginx.conf
```

### Prometheus Not Scraping
1. Check targets: http://localhost:9090/targets
2. Verify services are running
3. Check network connectivity: `curl http://localhost:3000/metrics`

### Grafana Not Connecting to Prometheus
1. Verify Prometheus is running
2. Add datasource: http://localhost:9090
3. Test datasource connection in Grafana UI

## File Reference

```
infrastructure/
├── nginx/
│   ├── nginx.conf              # Main reverse proxy (localhost config)
│   └── api-gateway-proxy.conf  # API gateway specific routing
├── wicked-config/
│   ├── apis/                   # API definitions
│   ├── routes/                 # Route configurations
│   ├── auth-servers/           # Auth server configs
│   ├── pools/                  # Connection pools
│   └── static/env/
│       ├── box.json            # Local machine config (USE THIS)
│       ├── docker.json         # Docker config
│       ├── k8s.json            # Kubernetes config
│       └── default.json        # Default config
├── monitoring/
│   ├── prometheus.yml          # Prometheus scrape config
│   ├── grafana.ini             # Grafana settings
│   ├── loki.yml                # Loki log aggregation
│   ├── promtail.yml            # Log shipper config
│   └── grafana/
│       └── provisioning/       # Auto-provision datasources/dashboards
├── templates/                  # Wicked templates
└── compose/                    # Docker Compose configs (reference only)
```

## Advanced Configuration

### Using Wicked Portal

To access Wicked Portal UI:

```bash
# Navigate to configured portal URL
# Default: http://localhost:8000

# Manage:
# - API definitions
# - Routes and pipelines
# - Users and subscriptions
# - Approvals and deployments
```

### Custom Metrics

Add custom prometheus metrics to services:

```typescript
import prometheus from 'prom-client';

const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
});
```

### Performance Tuning

**Nginx**:
```nginx
worker_connections 2048;
keepalive_timeout 65;
gzip on;
```

**Prometheus**:
```bash
--storage.tsdb.retention.time=7d    # Reduce retention for local dev
--query.timeout=2m                   # Timeout for queries
```

## Monitoring Best Practices

1. **Keep Metrics Retention Short** (7d for local dev)
2. **Monitor Key Services** (API Gateway, Database, Payment)
3. **Set Up Alerts** for critical metrics
4. **Review Logs** in Grafana when investigating issues
5. **Use Dashboards** to visualize system health

## Next Steps

1. ✅ Run `bash scripts/start-local-dev.sh` to start services
2. ✅ Run `bash scripts/start-monitoring-local.sh` to start monitoring
3. ✅ Access http://localhost:3009 (Grafana)
4. ✅ Create custom dashboards for your monitoring needs
5. ✅ Configure alerts for production-like scenarios

## Support

For issues with:
- **Nginx**: Check `/var/log/nginx/error.log`
- **Prometheus**: Check stdout logs
- **Grafana**: Check logs at configured path
- **Services**: Use application-specific logging

Refer to individual service documentation for metric details and custom configurations.
