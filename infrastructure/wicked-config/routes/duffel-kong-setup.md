# Kong Configuration for Duffel API Proxy

## Overview

This document describes how to configure Kong to proxy all Duffel API requests from the API Gateway.

## Architecture

```
API Gateway (port 3000)
    ↓
Kong API Manager (port 8000)
    ↓
Duffel API (https://api.duffel.com/air)
```

## Kong Configuration

### 1. Service Definition

```bash
# Create Duffel Upstream Service
curl -X POST http://localhost:8001/services \
  -d "name=duffel-service" \
  -d "url=https://api.duffel.com/air" \
  -d "protocol=https" \
  -d "host=api.duffel.com" \
  -d "port=443" \
  -d "path=/air" \
  -d "connect_timeout=5000" \
  -d "write_timeout=10000" \
  -d "read_timeout=10000"
```

### 2. Route Definitions

```bash
# Route for Seat Maps
curl -X POST http://localhost:8001/services/duffel-service/routes \
  -d "name=seat-maps-route" \
  -d "paths[]=/seat_maps" \
  -d "methods[]=GET" \
  -d "methods[]=POST" \
  -d "strip_path=false"

# Route for Ancillary Offers
curl -X POST http://localhost:8001/services/duffel-service/routes \
  -d "name=ancillary-route" \
  -d "paths[]=/ancillary_offers" \
  -d "methods[]=GET" \
  -d "methods[]=POST" \
  -d "strip_path=false"

# Route for Orders
curl -X POST http://localhost:8001/services/duffel-service/routes \
  -d "name=orders-route" \
  -d "paths[]=/orders" \
  -d "methods[]=GET" \
  -d "methods[]=POST" \
  -d "methods[]=PATCH" \
  -d "strip_path=false"
```

### 3. Plugins Configuration

#### Authentication (Key Auth)

```bash
curl -X POST http://localhost:8001/services/duffel-service/plugins \
  -d "name=key-auth" \
  -d "config.key_names=Authorization,X-API-Key" \
  -d "config.key_in_header=true"
```

#### Rate Limiting

```bash
curl -X POST http://localhost:8001/services/duffel-service/plugins \
  -d "name=rate-limiting" \
  -d "config.minute=100" \
  -d "config.hour=1000" \
  -d "config.policy=local"
```

#### Request Transformer (Add Duffel-Version header)

```bash
curl -X POST http://localhost:8001/services/duffel-service/plugins \
  -d "name=request-transformer" \
  -d "config.add.headers=Duffel-Version:v2" \
  -d "config.add.headers=Content-Type:application/json"
```

#### Logging

```bash
curl -X POST http://localhost:8001/services/duffel-service/plugins \
  -d "name=http-log" \
  -d "config.http_endpoint=http://logging-service:8000/logs" \
  -d "config.method=POST" \
  -d "config.timeout=1000"
```

## API Gateway Configuration

### Environment Variables

```bash
KONG_PROXY_URL=http://kong:8000
DUFFEL_TEST_API_KEY=your_test_key_here
DUFFEL_PROD_API_KEY=your_prod_key_here
```

### Adapter Updates

1. Update `DuffelAdapter.ts` baseUrl:

   ```typescript
   private baseUrl = process.env.KONG_PROXY_URL || 'http://localhost:8000';
   ```

2. Update `AncillaryServicesAdapter.ts` baseUrl:

   ```typescript
   private baseUrl = process.env.KONG_PROXY_URL || 'http://localhost:8000';
   ```

## Local Development Setup

### docker-compose.yml

```yaml
services:
  kong:
    image: kong:latest
    container_name: tripalfa-kong
    environment:
      KONG_DATABASE: postgres
      KONG_PG_HOST: postgres
      KONG_PG_USER: kong
      KONG_PG_PASSWORD: kong
      KONG_PROXY_ACCESS_LOG: /dev/stdout
      KONG_ADMIN_ACCESS_LOG: /dev/stdout
      KONG_PROXY_ERROR_LOG: /dev/stderr
      KONG_ADMIN_ERROR_LOG: /dev/stderr
      KONG_ADMIN_LISTEN: 0.0.0.0:8001
    ports:
      - "8000:8000" # Proxy
      - "8443:8443" # Proxy SSL
      - "8001:8001" # Admin API
      - "8444:8444" # Admin SSL
    networks:
      - tripalfa-network
    depends_on:
      - postgres

  konga:
    image: pantsel/konga:latest
    container_name: tripalfa-konga
    environment:
      DB_ADAPTER: postgres
      DB_HOST: postgres
      DB_USER: konga
      DB_PASSWORD: konga
      DB_DATABASE: konga
      NODE_ENV: production
      DB_PG_SCHEMA: konga
    ports:
      - "1337:1337"
    networks:
      - tripalfa-network
    depends_on:
      - postgres
```

## Startup Commands

```bash
# 1. Start Kong and dependencies
docker-compose up -d kong konga

# 2. Wait for Kong to be ready
sleep 10

# 3. Create Kong database
docker exec -i tripalfa-kong kong migrations bootstrap

# 4. Configure Kong services and routes (see above commands)

# 5. Verify Kong is running
curl -s http://localhost:8001/services | jq .

# 6. Test proxy endpoint
curl -s http://localhost:8000/seat_maps?offer_id=test \
  -H "Authorization: Bearer your_api_key"
```

## Testing

### Test Seat Maps through Kong

```bash
curl -X GET "http://localhost:8000/seat_maps" \
  -H "Authorization: Bearer $DUFFEL_TEST_API_KEY" \
  -H "Duffel-Version: v2" \
  -d '{"offer_id": "test"}'
```

### Test through API Gateway (which now uses Kong)

```bash
curl -s "http://localhost:3000/bookings/flight/seat-maps?orderId=test&offerId=of_123" | jq .
```

## Wicked Configuration Alternative

If using Wicked instead of Kong, use YAML configuration:

```yaml
# wicked-config/apis/duffel.yml
name: duffel
title: Duffel API Proxy
description: Central proxy for all Duffel API requests
basePath: /duffel

apiClients:
  - id: api-gateway-client
    clientSecret: your-secret
    scope: read write

plans:
  - name: basic
    description: Basic plan
    rateLimit: 100/minute

policies:
  - name: key-auth
  - name: rate-limiting
  - name: request-transformer
  - name: http-log

upstream:
  url: https://api.duffel.com/air
  healthcheck: /health
```

## Troubleshooting

### Kong not starting

```bash
# Check logs
docker logs tripalfa-kong

# Verify database connectivity
docker exec tripalfa-kong kong migrations list
```

### Requests timing out

```bash
# Increase Kong timeouts
curl -X PATCH http://localhost:8001/services/duffel-service \
  -d "connect_timeout=10000" \
  -d "write_timeout=15000" \
  -d "read_timeout=15000"
```

### Authentication errors

```bash
# Verify API key is being passed through Kong
curl -X GET "http://localhost:8000/seat_maps" \
  -H "Authorization: Bearer $DUFFEL_TEST_API_KEY" \
  -v
```

## References

- Kong Documentation: https://docs.konghq.com/
- Konga UI: http://localhost:1337
- Duffel API Docs: https://duffel.com/docs
