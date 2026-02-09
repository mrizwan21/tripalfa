#!/bin/bash

# Kong Duffel Routes Configuration - Bash Version
# Creates all Duffel API routes with proper form-data encoding

SERVICE_ID="70aa131a-4a36-4ea9-8b92-45bd52be580d"
KONG_ADMIN="http://localhost:8001"

echo "🚀 Configuring Kong Duffel Routes..."
echo ""

# Create routes
echo "Creating Routes:"

curl -s -X POST $KONG_ADMIN/services/$SERVICE_ID/routes \
  -d "name=duffel-offer-requests&paths[]=/offer_requests&methods=POST&strip_path=false" > /dev/null && echo "✅ offer-requests"

curl -s -X POST $KONG_ADMIN/services/$SERVICE_ID/routes \
  -d "name=duffel-seat-maps&paths[]=/seat_maps&methods=GET&strip_path=false" > /dev/null && echo "✅ seat-maps"

curl -s -X POST $KONG_ADMIN/services/$SERVICE_ID/routes \
  -d "name=duffel-available-services&paths[]=/orders/*/available_services&methods=GET&strip_path=false" > /dev/null && echo "✅ available-services"

curl -s -X POST $KONG_ADMIN/services/$SERVICE_ID/routes \
  -d "name=duffel-selected-services&paths[]=/order_change_requests&methods=POST&strip_path=false" > /dev/null && echo "✅ selected-services"

curl -s -X POST $KONG_ADMIN/services/$SERVICE_ID/routes \
  -d "name=duffel-orders-create&paths[]=/orders&methods=POST&strip_path=false" > /dev/null && echo "✅ orders-create"

curl -s -X POST $KONG_ADMIN/services/$SERVICE_ID/routes \
  -d "name=duffel-orders-get&paths[]=/orders&paths[]=/orders/*&methods=GET&strip_path=false" > /dev/null && echo "✅ orders-get"

curl -s -X POST $KONG_ADMIN/services/$SERVICE_ID/routes \
  -d "name=duffel-orders-update&paths[]=/orders/*&methods=PATCH&strip_path=false" > /dev/null && echo "✅ orders-update"

curl -s -X POST $KONG_ADMIN/services/$SERVICE_ID/routes \
  -d "name=duffel-payment-intents&paths[]=/payment_intents&methods=GET&methods=POST&strip_path=false" > /dev/null && echo "✅ payment-intents"

curl -s -X POST $KONG_ADMIN/services/$SERVICE_ID/routes \
  -d "name=duffel-payment-methods&paths[]=/payment_methods&methods=GET&strip_path=false" > /dev/null && echo "✅ payment-methods"

curl -s -X POST $KONG_ADMIN/services/$SERVICE_ID/routes \
  -d "name=duffel-airlines&paths[]=/airlines&methods=GET&strip_path=false" > /dev/null && echo "✅ airlines"

curl -s -X POST $KONG_ADMIN/services/$SERVICE_ID/routes \
  -d "name=duffel-aircraft&paths[]=/aircraft&methods=GET&strip_path=false" > /dev/null && echo "✅ aircraft"

curl -s -X POST $KONG_ADMIN/services/$SERVICE_ID/routes \
  -d "name=duffel-airports&paths[]=/airports&methods=GET&strip_path=false" > /dev/null && echo "✅ airports"

echo ""
echo "Configuring Plugins:"

# Key-Auth
curl -s -X POST $KONG_ADMIN/services/$SERVICE_ID/plugins \
  -d "name=key-auth&config.key_names=Authorization&config.key_in_header=true" > /dev/null && echo "✅ key-auth"

# Rate Limiting
curl -s -X POST $KONG_ADMIN/services/$SERVICE_ID/plugins \
  -d "name=rate-limiting&config.minute=1000&config.hour=10000&config.policy=local" > /dev/null && echo "✅ rate-limiting"

# Request Transformer
curl -s -X POST $KONG_ADMIN/services/$SERVICE_ID/plugins \
  -d "name=request-transformer&config.add.headers=Duffel-Version:v2&config.add.headers=Content-Type:application/json" > /dev/null && echo "✅ request-transformer"

# CORS
curl -s -X POST $KONG_ADMIN/services/$SERVICE_ID/plugins \
  -d "name=cors&config.origins=*&config.credentials=true" > /dev/null && echo "✅ cors"

echo ""
echo "Verification:"

ROUTE_COUNT=$(curl -s $KONG_ADMIN/services/$SERVICE_ID/routes | jq '.data | length')
PLUGIN_COUNT=$(curl -s $KONG_ADMIN/services/$SERVICE_ID/plugins | jq '.data | length')

echo "  Routes configured: $ROUTE_COUNT"
echo "  Plugins configured: $PLUGIN_COUNT"

echo ""
echo "✅ Kong Configuration Complete!"
echo ""
echo "🔗 Available interfaces:"
echo "  - Kong Proxy: http://localhost:8000"
echo "  - Kong Admin API: http://localhost:8001"
echo "  - Konga UI: http://localhost:1337"
echo ""
echo "📝 Test command:"
echo "  curl http://localhost:8000/airlines -H 'Authorization: Bearer test_key'"
echo ""
