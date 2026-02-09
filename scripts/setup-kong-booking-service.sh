#!/bin/bash

# Kong Configuration Script for Hold Orders API (Booking Service)
# This script registers the booking-service with Kong and configures all hold orders routes

set -e

# Configuration
KONG_ADMIN_URL="${1:-http://localhost:8001}"
SERVICE_NAME="booking-service"
SERVICE_HOST="${SERVICE_HOST:-localhost}"
SERVICE_PORT="${SERVICE_PORT:-3007}"
PROXY_URL="${KONG_PROXY_URL:-http://localhost:8000}"

echo "🚀 Kong Configuration for Hold Orders API"
echo "=========================================="
echo "Kong Admin URL: $KONG_ADMIN_URL"
echo "Service: $SERVICE_NAME ($SERVICE_HOST:$SERVICE_PORT)"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
success() {
  echo -e "${GREEN}✅ $1${NC}"
}

error() {
  echo -e "${RED}❌ $1${NC}"
}

info() {
  echo -e "${YELLOW}ℹ️  $1${NC}"
}

# Step 1: Check Kong connectivity
info "Checking Kong Admin API connectivity..."
if ! curl -s "$KONG_ADMIN_URL/status" > /dev/null; then
  error "Cannot connect to Kong Admin API at $KONG_ADMIN_URL"
  echo "Make sure Kong is running: docker-compose -f docker-compose.kong.yml up -d"
  exit 1
fi
success "Kong Admin API is accessible"

# Step 2: Create Booking Service
info "Creating booking-service in Kong..."
SERVICE_RESPONSE=$(curl -s -X POST "$KONG_ADMIN_URL/services" \
  -d "name=$SERVICE_NAME" \
  -d "protocol=http" \
  -d "host=$SERVICE_HOST" \
  -d "port=$SERVICE_PORT" \
  -d "connect_timeout=5000" \
  -d "write_timeout=10000" \
  -d "read_timeout=10000" 2>&1)

# Check if service already exists (409 Conflict)
if echo "$SERVICE_RESPONSE" | grep -q "already exists"; then
  info "Service already exists, updating..."
  curl -s -X PATCH "$KONG_ADMIN_URL/services/$SERVICE_NAME" \
    -d "protocol=http" \
    -d "host=$SERVICE_HOST" \
    -d "port=$SERVICE_PORT" 2>&1 > /dev/null
  success "Service updated"
elif echo "$SERVICE_RESPONSE" | grep -q "\"name\":\"$SERVICE_NAME\""; then
  success "Service created: $SERVICE_NAME"
else
  error "Failed to create service"
  echo "$SERVICE_RESPONSE"
  exit 1
fi

# Step 3: Create Routes
info "Creating Kong routes for hold orders endpoints..."

declare -a ROUTES=(
  "check-hold-eligibility:/bookings/hold/eligibility:GET"
  "create-hold-order:/bookings/hold/orders:POST"
  "get-hold-order:/bookings/hold/orders:GET"
  "cancel-hold-order:/bookings/hold/orders/*/cancel:POST"
  "check-price-change:/bookings/hold/orders/*/check-price:POST"
  "check-schedule-change:/bookings/hold/orders/*/check-schedule:POST"
  "pay-for-hold-order:/bookings/hold/orders/*/payment:POST"
  "get-payment-methods:/bookings/hold/payment-methods:GET"
  "get-payment-details:/bookings/hold/payments/*:GET"
  "get-order-payments:/bookings/hold/orders/*/payments:GET"
  "refund-payment:/bookings/hold/payments/*/refund:POST"
  "get-hold-services:/bookings/hold/orders/*/services:GET"
  "add-hold-service:/bookings/hold/orders/*/services:POST"
  "payment-finalize:/bookings/payment/finalize:POST"
  "wallet-topup:/bookings/wallet/topup:POST"
  "wallet-balance:/bookings/wallet/balance/*:GET"
  "wallet-transactions:/bookings/wallet/transactions/*:GET"
)

ROUTE_COUNT=0
for route in "${ROUTES[@]}"; do
  IFS=':' read -r name path method <<< "$route"
  
  ROUTE_RESPONSE=$(curl -s -X POST "$KONG_ADMIN_URL/services/$SERVICE_NAME/routes" \
    -d "name=$name" \
    -d "paths[]=$path" \
    -d "methods[]=$method" \
    -d "strip_path=false" 2>&1)
  
  if echo "$ROUTE_RESPONSE" | grep -q "\"name\":\"$name\""; then
    ((ROUTE_COUNT++))
  elif echo "$ROUTE_RESPONSE" | grep -q "already exists"; then
    ((ROUTE_COUNT++))
  fi
done

success "Created/Updated $ROUTE_COUNT routes"

# Step 4: Configure Rate Limiting Plugin
info "Configuring rate limiting plugin..."
RATE_LIMIT_RESPONSE=$(curl -s -X POST "$KONG_ADMIN_URL/services/$SERVICE_NAME/plugins" \
  -d "name=rate-limiting" \
  -d "config.minute=2000" \
  -d "config.hour=20000" \
  -d "config.policy=local" \
  -d "config.fault_tolerant=true" 2>&1)

if echo "$RATE_LIMIT_RESPONSE" | grep -q "\"name\":\"rate-limiting\""; then
  success "Rate limiting configured (2000 requests/minute)"
elif echo "$RATE_LIMIT_RESPONSE" | grep -q "already exists"; then
  success "Rate limiting already configured"
fi

# Step 5: Configure CORS Plugin
info "Configuring CORS plugin..."
CORS_RESPONSE=$(curl -s -X POST "$KONG_ADMIN_URL/services/$SERVICE_NAME/plugins" \
  -d "name=cors" \
  -d "config.origins=*" \
  -d "config.methods=GET,POST,PUT,DELETE,PATCH,OPTIONS" \
  -d "config.allowed_headers=Accept,Accept-Language,Content-Language,Content-Type,Authorization,Duffel-Version" \
  -d "config.max_age=3600" \
  -d "config.credentials=true" 2>&1)

if echo "$CORS_RESPONSE" | grep -q "\"name\":\"cors\""; then
  success "CORS plugin configured"
elif echo "$CORS_RESPONSE" | grep -q "already exists"; then
  success "CORS already configured"
fi

# Step 6: Configure Request Transformer Plugin
info "Configuring request transformer plugin..."
TRANSFORMER_RESPONSE=$(curl -s -X POST "$KONG_ADMIN_URL/services/$SERVICE_NAME/plugins" \
  -d "name=request-transformer" \
  -d "config.add.headers=Content-Type:application/json" \
  -d "config.add.headers=X-Service:booking-service" 2>&1)

if echo "$TRANSFORMER_RESPONSE" | grep -q "\"name\":\"request-transformer\""; then
  success "Request transformer configured"
elif echo "$TRANSFORMER_RESPONSE" | grep -q "already exists"; then
  success "Request transformer already configured"
fi

# Step 7: Verify Configuration
info "Verifying Kong configuration..."
SERVICES_COUNT=$(curl -s "$KONG_ADMIN_URL/services" | grep -o '"name":"booking-service"' | wc -l)
ROUTES_COUNT=$(curl -s "$KONG_ADMIN_URL/services/$SERVICE_NAME/routes" | grep -o '"name"' | wc -l)

success "Kong Configuration Complete!"
echo ""
echo "📊 Summary:"
echo "==========="
echo "Services configured: $SERVICES_COUNT"
echo "Routes configured: $ROUTES_COUNT"
echo ""
echo "🔗 Access Points:"
echo "=================="
echo "Kong Admin API:  $KONG_ADMIN_URL"
echo "Kong Proxy:      $PROXY_URL"
echo "Booking Service: http://$SERVICE_HOST:$SERVICE_PORT"
echo ""
echo "📝 Testing Hold Orders API through Kong:"
echo "=========================================="
echo ""
echo "Option 1: Direct API (no Kong)"
echo "  curl http://localhost:3007/bookings/hold/payment-methods"
echo ""
echo "Option 2: Through Kong Proxy"
echo "  curl http://localhost:8000/bookings/hold/payment-methods"
echo ""
echo "Option 3: View Kong Admin UI"
echo "  http://localhost:1337"
echo ""
echo "✅ Next steps:"
echo "1. Start booking-service: npm run dev --workspace=@tripalfa/booking-service"
echo "2. Test endpoints through Kong proxy (port 8000)"
echo "3. Monitor Kong Admin UI (port 1337)"
echo ""
