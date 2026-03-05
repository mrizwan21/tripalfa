#!/bin/bash

cd "/Users/mohamedrizwan/Desktop/TripAlfa - Node"

echo "=========================================="
echo "TripAlfa Deployment Validation Report"
echo "=========================================="
echo "Generated: $(date)"
echo ""

# Expected services
EXPECTED_SERVICES=(
  "api-gateway"
  "user-service"
  "payment-service"
  "booking-service"
  "notification-service"
  "organization-service"
  "wallet-service"
  "rule-engine-service"
  "kyc-service"
  "marketing-service"
  "b2b-admin-service"
  "booking-engine-service"
  "b2b-admin"
  "booking-engine"
)

echo "1. DOCKER IMAGES STATUS"
echo "======================="
BUILT_COUNT=0
for service in "${EXPECTED_SERVICES[@]}"; do
  if docker images --quiet "tripalfa-$service" | grep -q .; then
    echo "  ✓ tripalfa-$service"
    BUILT_COUNT=$((BUILT_COUNT + 1))
  else
    echo "  ✗ tripalfa-$service (not yet built)"
  fi
done
echo "Status: $BUILT_COUNT/${#EXPECTED_SERVICES[@]} images built"
echo ""

echo "2. RUNNING CONTAINERS"
echo "====================="
RUNNING=$(docker ps --filter "name=tripalfa" --format "{{.Names}}" | grep -v staticdb | wc -l)
echo "Status: $RUNNING backend services running"
docker ps --filter "name=tripalfa" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -v staticdb || echo "  (none yet)"
echo ""

echo "3. STATIC DATA INFRASTRUCTURE"
echo "============================="
docker ps --filter "name=staticdb" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""

echo "4. DATABASE CONNECTIVITY"
echo "========================"
echo "NEON Database: $(grep NEON_DATABASE_URL .env.docker.local | cut -d= -f2 | cut -c1-50)..."
echo "Static DB: postgresql://localhost:5435/staticdatabase"
echo ""

echo "5. NETWORK CONFIGURATION"
echo "========================"
docker network inspect tripalfa_staticdb_net --format "Connected containers: {{len .Containers}}" 2>/dev/null || echo "Network: tripalfa_staticdb_net (ready for deployment)"
echo ""

echo "6. SERVICE PORTS"
echo "================"
echo "API Gateway: 3000"
echo "User Service: 3001"
echo "Payment Service: 3003"
echo "Booking Service: 3004"
echo "Notification Service: 3005"
echo "Organization Service: 3006"
echo "Wallet Service: 3008"
echo "Rule Engine Service: 3010"
echo "KYC Service: 3011"
echo "Marketing Service: 3012"
echo "B2B Admin Service: 3020"
echo "Booking Engine Service: 3021"
echo "B2B Admin Frontend: 5173"
echo "Booking Engine Frontend: 5174"
echo ""

echo "=========================================="
echo "Deployment Validation Complete"
echo "=========================================="
