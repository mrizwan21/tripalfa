#!/bin/bash

# ============================================================
# Kong Configuration Setup for Duffel API
# ============================================================
# This script configures Kong to proxy all Duffel API requests
# through the API manager for centralized management
#
# Usage: bash scripts/setup-kong-duffel.sh
# ============================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
KONG_ADMIN_API="${KONG_ADMIN_API:-http://localhost:8001}"
KONG_PROXY_URL="${KONG_PROXY_URL:-http://localhost:8000}"
DUFFEL_API_HOST="api-sandbox.duffel.com"
DUFFEL_API_PORT="443"
DUFFEL_PATH="/air"

echo -e "${YELLOW}🔧 Setting up Kong for Duffel API...${NC}"
echo "Kong Admin API: $KONG_ADMIN_API"
echo "Kong Proxy URL: $KONG_PROXY_URL"

# ============================================================
# Step 1: Create Duffel Service
# ============================================================
echo -e "\n${YELLOW}1️⃣  Creating Duffel API Service...${NC}"

SERVICE_RESPONSE=$(curl -s -X POST "$KONG_ADMIN_API/services" \
  -d "name=duffel-api-service" \
  -d "host=$DUFFEL_API_HOST" \
  -d "port=$DUFFEL_API_PORT" \
  -d "protocol=https" \
  -d "path=$DUFFEL_PATH" \
  -d "connect_timeout=5000" \
  -d "write_timeout=15000" \
  -d "read_timeout=15000" \
  -d "tags=duffel,flight-service")

if echo "$SERVICE_RESPONSE" | grep -q "duffel-api-service"; then
  echo -e "${GREEN}✅ Service created successfully${NC}"
else
  echo -e "${YELLOW}⚠️  Service may already exist, continuing...${NC}"
fi

# ============================================================
# Step 2: Create Routes
# ============================================================
echo -e "\n${YELLOW}2️⃣  Creating Kong Routes...${NC}"

declare -a routes=(
  "duffel-offer-requests:/offer_requests:POST:flight-search,duffel"
  "duffel-seat-maps:/seat_maps:GET:ancillary-services,seat-maps,duffel"
  "duffel-available-services:/orders/*/available_services:GET:ancillary-services,duffel"
  "duffel-selected-services:/order_change_requests:POST:ancillary-services,duffel"
  "duffel-orders-create:/orders:POST:orders,duffel"
  "duffel-orders-get:/orders,/orders/*:GET:orders,duffel"
  "duffel-payment-intents:/payment_intents:GET,POST:payments,duffel"
  "duffel-payment-methods:/payment_methods:GET:payments,duffel"
  "duffel-airlines:/airlines:GET:reference-data,duffel"
  "duffel-aircraft:/aircraft:GET:reference-data,duffel"
  "duffel-airports:/airports:GET:reference-data,duffel"
)

for route in "${routes[@]}"; do
  IFS=':' read -r name paths methods tags <<< "$route"
  
  echo -n "  Creating route: $name... "
  
  ROUTE_RESPONSE=$(curl -s -X POST "$KONG_ADMIN_API/services/duffel-api-service/routes" \
    -d "name=$name" \
    -d "paths[]=$paths" \
    -d "methods[]=$(echo $methods | tr ',' '\n' | sed 's/.*/-d "methods[]=&/')" \
    -d "strip_path=false" \
    -d "protocols[]=https" \
    -d "tags=$(echo $tags | tr ',' ' ')")
  
  if echo "$ROUTE_RESPONSE" | grep -q "$name"; then
    echo -e "${GREEN}✅${NC}"
  else
    echo -e "${YELLOW}⚠️${NC}"
  fi
done

# ============================================================
# Step 3: Add Plugins
# ============================================================
echo -e "\n${YELLOW}3️⃣  Configuring Plugins...${NC}"

# Authentication
echo -n "  Adding Key-Auth plugin... "
curl -s -X POST "$KONG_ADMIN_API/services/duffel-api-service/plugins" \
  -d "name=key-auth" \
  -d "config.key_names[]=Authorization" \
  -d "config.key_in_header=true" \
  -d "config.hide_credentials=true" > /dev/null
echo -e "${GREEN}✅${NC}"

# Rate Limiting
echo -n "  Adding Rate-Limiting plugin... "
curl -s -X POST "$KONG_ADMIN_API/services/duffel-api-service/plugins" \
  -d "name=rate-limiting" \
  -d "config.minute=1000" \
  -d "config.hour=10000" \
  -d "config.policy=local" \
  -d "config.fault_tolerant=true" > /dev/null
echo -e "${GREEN}✅${NC}"

# Request Transformer
echo -n "  Adding Request-Transformer plugin... "
curl -s -X POST "$KONG_ADMIN_API/services/duffel-api-service/plugins" \
  -d "name=request-transformer" \
  -d "config.add.headers[]=Duffel-Version:v2" \
  -d "config.add.headers[]=Content-Type:application/json" > /dev/null
echo -e "${GREEN}✅${NC}"

# CORS
echo -n "  Adding CORS plugin... "
curl -s -X POST "$KONG_ADMIN_API/services/duffel-api-service/plugins" \
  -d "name=cors" \
  -d "config.origins[]=*" \
  -d "config.methods[]=GET" \
  -d "config.methods[]=POST" \
  -d "config.methods[]=PATCH" \
  -d "config.methods[]=DELETE" \
  -d "config.methods[]=OPTIONS" > /dev/null
echo -e "${GREEN}✅${NC}"

# ============================================================
# Step 4: Verify Configuration
# ============================================================
echo -e "\n${YELLOW}4️⃣  Verifying Configuration...${NC}"

SERVICE_COUNT=$(curl -s "$KONG_ADMIN_API/services/duffel-api-service" | grep -c "duffel-api-service" || echo "0")
ROUTE_COUNT=$(curl -s "$KONG_ADMIN_API/services/duffel-api-service/routes" | grep -c '"id"' || echo "0")
PLUGIN_COUNT=$(curl -s "$KONG_ADMIN_API/services/duffel-api-service/plugins" | grep -c '"id"' || echo "0")

echo "  Services: $SERVICE_COUNT"
echo "  Routes: $ROUTE_COUNT"
echo "  Plugins: $PLUGIN_COUNT"

# ============================================================
# Step 5: Test Configuration
# ============================================================
echo -e "\n${YELLOW}5️⃣  Testing Kong Proxy...${NC}"

# Try to reach Kong proxy
HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$KONG_PROXY_URL")

if [ "$HEALTH_RESPONSE" = "404" ]; then
  echo -e "${GREEN}✅ Kong proxy is responding${NC}"
elif [ "$HEALTH_RESPONSE" = "000" ]; then
  echo -e "${RED}❌ Cannot connect to Kong proxy at $KONG_PROXY_URL${NC}"
  echo "   Make sure Kong is running: docker-compose -f docker-compose.local.yml up -d"
else
  echo -e "${YELLOW}⚠️  Unexpected response: $HEALTH_RESPONSE${NC}"
fi

# ============================================================
# Summary
# ============================================================
echo ""
echo -e "${GREEN}══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Kong Configuration Complete!${NC}"
echo -e "${GREEN}══════════════════════════════════════════════════════${NC}"
echo ""
echo "📝 Configuration Summary:"
echo "  Service: duffel-api-service"
echo "  Host: $DUFFEL_API_HOST"
echo "  Port: $DUFFEL_API_PORT"
echo "  Routes configured: $ROUTE_COUNT"
echo "  Plugins configured: $PLUGIN_COUNT"
echo ""
echo "🚀 Next Steps:"
echo "  1. Set Kong proxy URL in your environment:"
echo "     export KONG_PROXY_URL=$KONG_PROXY_URL"
echo ""
echo "  2. Update your API Gateway configuration:"
echo "     export KONG_PROXY_URL=$KONG_PROXY_URL"
echo ""
echo "  3. Start your services:"
echo "     docker-compose -f docker-compose.local.yml up -d"
echo ""
echo "  4. Test the proxy:"
echo "     curl -X POST $KONG_PROXY_URL/offer_requests \\"
echo "       -H 'Authorization: Bearer YOUR_API_KEY' \\"
echo "       -H 'Content-Type: application/json' \\"
echo "       -d '{\"data\": {...}}'"
echo ""
