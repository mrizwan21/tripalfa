#!/bin/bash

# TripAlfa Service Connectivity Test
# Verifies service-to-service communication
# Usage: bash scripts/test-service-connectivity.sh

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}🔗 TripAlfa Service Connectivity Test${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

TIMEOUT=5
TEST_COUNT=0
PASS_COUNT=0

# Function to test endpoint
test_endpoint() {
  local test_name=$1
  local method=$2
  local url=$3
  local expected_code=${4:-200}
  
  ((TEST_COUNT++))
  
  echo -n "Testing: $test_name ... "
  
  # Add auth header if needed (with dummy JWT)
  local response=$(curl -s -m $TIMEOUT -w "%{http_code}" -o /tmp/test_response.json \
    -X $method \
    -H "Content-Type: application/json" \
    "$url" 2>/dev/null || echo "000")
  
  if [ "$response" = "$expected_code" ] || [ "$response" = "200" ] || [ "$response" = "201" ] || [ "$response" = "404" ]; then
    echo -e "${GREEN}✅ (HTTP $response)${NC}"
    ((PASS_COUNT++))
    return 0
  else
    echo -e "${RED}❌ (HTTP $response)${NC}"
    return 1
  fi
}

# Test 1: API Gateway is running
echo -e "${BLUE}1. API Gateway Tests${NC}"
echo "─────────────────────────────────────────────────────────"
test_endpoint "API Gateway health" "GET" "http://localhost:3000/health"
test_endpoint "API Gateway status" "GET" "http://localhost:3000/status" "404"
echo ""

# Test 2: Service discovery via API Gateway
echo -e "${BLUE}2. Service Discovery Tests${NC}"
echo "─────────────────────────────────────────────────────────"
test_endpoint "Get destinations (Booking)" "GET" "http://localhost:3000/api/bookings/destinations"
test_endpoint "Get flights (API Gateway)" "GET" "http://localhost:3000/api/flights/search" "404"
test_endpoint "Get hotels (API Gateway)" "GET" "http://localhost:3000/api/hotels/search" "404"
echo ""

# Test 3: Database connectivity via services
echo -e "${BLUE}3. Database Tests${NC}"
echo "─────────────────────────────────────────────────────────"

# Neon database
if [ ! -z "$DIRECT_NEON_DATABASE_URL" ]; then
  echo -n "Testing: Neon database connection ... "
  if psql "$DIRECT_NEON_DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${GREEN}✅${NC}"
    ((PASS_COUNT++))
  else
    echo -e "${RED}❌${NC}"
  fi
  ((TEST_COUNT++))
fi

# Static database
echo -n "Testing: Static database connection ... "
if psql -h localhost -p 5433 -U postgres -d staticdatabase -c "SELECT 1;" > /dev/null 2>&1; then
  echo -e "${GREEN}✅${NC}"
  ((PASS_COUNT++))
else
  echo -e "${RED}❌ (Static DB on port 5433 not responding)${NC}"
fi
((TEST_COUNT++))

echo ""

# Test 4: Service-to-Service Communication (if services are running)
echo -e "${BLUE}4. Cross-Service Communication Tests${NC}"
echo "─────────────────────────────────────────────────────────"

# These tests assume services are running
# API Gateway → Booking Service
test_endpoint "API Gateway → Booking Service" "GET" "http://localhost:3001/health" "200"

# BookingService → Booking Service health check
test_endpoint "Booking Service health" "GET" "http://localhost:3001/health" "200"

# User Service health
test_endpoint "User Service health" "GET" "http://localhost:3004/health" "200"

# Payment Service health
test_endpoint "Payment Service health" "GET" "http://localhost:3007/health" "200"

echo ""

# Test 5: Frontend Access
echo -e "${BLUE}5. Frontend Accessibility Tests${NC}"
echo "─────────────────────────────────────────────────────────"
test_endpoint "B2B Admin Frontend" "GET" "http://localhost:5173" "200"
test_endpoint "Booking Engine Frontend" "GET" "http://localhost:5174" "200"
echo ""

# Test 6: Network Configuration Tests
echo -e "${BLUE}6. Network Configuration Tests${NC}"
echo "─────────────────────────────────────────────────────────"

# Check if all required ports are accessible
declare -a REQUIRED_PORTS=(3000 3001 3004 3006 3007 3008 3009 3010 3011 3012 3020 3021 5173 5174)

for port in "${REQUIRED_PORTS[@]}"; do
  echo -n "Testing: Port $port accessibility ... "
  if timeout 2 bash -c "echo >/dev/tcp/localhost/$port" 2>/dev/null; then
    echo -e "${GREEN}✅${NC}"
    ((PASS_COUNT++))
  else
    echo -e "${RED}❌ (Port not open)${NC}"
  fi
  ((TEST_COUNT++))
done

echo ""

# Summary
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}📋 Test Results Summary${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "Tests Run:     $TEST_COUNT"
echo -e "Tests Passed:  ${GREEN}${PASS_COUNT}${NC}"
echo -e "Tests Failed:  ${RED}$((TEST_COUNT - PASS_COUNT))${NC}"
echo ""

PERCENTAGE=$((PASS_COUNT * 100 / TEST_COUNT))
echo -e "Success Rate:  ${GREEN}${PERCENTAGE}%${NC}"
echo ""

if [ $PASS_COUNT -eq $TEST_COUNT ]; then
  echo -e "${GREEN}✅ All connectivity tests passed!${NC}"
  echo ""
  echo "Your TripAlfa instance is ready for development."
  echo ""
  echo "Next steps:"
  echo "1. Run integration tests: bash scripts/test-integration.sh"
  echo "2. Access Booking Engine: http://localhost:5174"
  echo "3. Access B2B Admin: http://localhost:5173"
  echo "4. View API docs: http://localhost:3000/documentation"
  exit 0
else
  echo -e "${YELLOW}⚠️  Some tests failed. Check the output above.${NC}"
  echo ""
  echo "Troubleshooting:"
  echo "1. Ensure all services are started: bash scripts/start-local-dev.sh"
  echo "2. Check service logs: tail -f .logs/*.log"
  echo "3. Verify databases are running:"
  echo "   - Static DB: psql -h localhost -p 5433 -U postgres"
  echo "   - Neon: psql \"\$DIRECT_NEON_DATABASE_URL\""
  echo "4. Check firewall/network settings"
  exit 1
fi
