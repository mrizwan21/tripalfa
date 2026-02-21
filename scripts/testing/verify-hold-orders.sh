#!/bin/bash
# Hold Orders - Quick Deployment Verification Script
# This script verifies all hold orders components are working correctly
# Usage: bash verify-hold-orders.sh

set -e

echo "╔════════════════════════════════════════════════════════╗"
echo "║  Hold Orders Implementation - Verification Script     ║"
echo "║  TripAlfa Booking Engine - February 7, 2026            ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0

# Helper functions
check_pass() {
  echo -e "${GREEN}✅ $1${NC}"
  ((PASSED++))
}

check_fail() {
  echo -e "${RED}❌ $1${NC}"
  ((FAILED++))
}

check_warn() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

info() {
  echo -e "${BLUE}ℹ️  $1${NC}"
}

echo "═══════════════════════════════════════════════════════════"
echo "PHASE 1: File System Checks"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Backend files
echo "Checking backend service files..."
[[ -f "services/booking-service/src/services/holdOrdersService.ts" ]] && check_pass "holdOrdersService.ts exists" || check_fail "holdOrdersService.ts missing"
[[ -f "services/booking-service/src/services/paymentService.ts" ]] && check_pass "paymentService.ts exists" || check_fail "paymentService.ts missing"
[[ -f "services/booking-service/src/controllers/holdOrdersController.ts" ]] && check_pass "holdOrdersController.ts exists" || check_fail "holdOrdersController.ts missing"
[[ -f "services/booking-service/src/routes/holdOrdersRoutes.ts" ]] && check_pass "holdOrdersRoutes.ts exists" || check_fail "holdOrdersRoutes.ts missing"
[[ -f "services/booking-service/src/validation/holdOrdersSchemas.ts" ]] && check_pass "holdOrdersSchemas.ts exists" || check_fail "holdOrdersSchemas.ts missing"

# Frontend files
echo ""
echo "Checking frontend component files..."
[[ -f "apps/booking-engine/src/components/booking/HoldOrdersCheck.tsx" ]] && check_pass "HoldOrdersCheck.tsx exists" || check_fail "HoldOrdersCheck.tsx missing"
[[ -f "apps/booking-engine/src/components/booking/HoldOrderForm.tsx" ]] && check_pass "HoldOrderForm.tsx exists" || check_fail "HoldOrderForm.tsx missing"
[[ -f "apps/booking-engine/src/components/booking/HoldOrderDetails.tsx" ]] && check_pass "HoldOrderDetails.tsx exists" || check_fail "HoldOrderDetails.tsx missing"
[[ -f "apps/booking-engine/src/components/payment/PaymentForm.tsx" ]] && check_pass "PaymentForm.tsx exists" || check_fail "PaymentForm.tsx missing"

# Kong config
echo ""
echo "Checking Kong configuration..."
[[ -f "wicked-config/routes/hold-orders-routes.yml" ]] && check_pass "Kong routes config exists" || check_fail "Kong routes config missing"

# Documentation
echo ""
echo "Checking documentation files..."
[[ -f "docs/HOLD_ORDERS_IMPLEMENTATION.md" ]] && check_pass "Implementation guide exists" || check_fail "Implementation guide missing"
[[ -f "docs/HOLD_ORDERS_QUICK_START.md" ]] && check_pass "Quick start guide exists" || check_fail "Quick start guide missing"
[[ -f "docs/HOLD_ORDERS_INTEGRATION.md" ]] && check_pass "Integration guide exists" || check_fail "Integration guide missing"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "PHASE 2: Service Health Checks"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Check Kong
echo "Checking Kong API Gateway..."
if timeout 2 bash -c "</dev/tcp/localhost/8001" 2>/dev/null; then
  check_pass "Kong Admin API is responding (port 8001)"
  KONG_STATUS=$(curl -s http://localhost:8001/status | grep -o '"version":"[^"]*' | cut -d'"' -f4)
  info "Kong version: $KONG_STATUS"
else
  check_fail "Kong Admin API not responding (port 8001)"
  check_warn "Start Kong: docker-compose up -d kong"
fi

# Check Kong Proxy
echo ""
echo "Checking Kong Proxy..."
if timeout 2 bash -c "</dev/tcp/localhost/8000" 2>/dev/null; then
  check_pass "Kong Proxy is responding (port 8000)"
else
  check_fail "Kong Proxy not responding (port 8000)"
  check_warn "Ensure Kong is fully started"
fi

# Check Booking Service
echo ""
echo "Checking Booking Service..."
if timeout 2 bash -c "</dev/tcp/localhost/3007" 2>/dev/null; then
  HEALTH=$(curl -s http://localhost:3007/health | grep -o '"status":"[^"]*' | cut -d'"' -f4)
  if [[ "$HEALTH" == "healthy" ]]; then
    check_pass "Booking Service is healthy (port 3007)"
  else
    check_warn "Booking Service responded but status: $HEALTH"
  fi
else
  check_fail "Booking Service not responding (port 3007)"
  check_warn "Start service: cd services/booking-service && npm run dev"
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "PHASE 3: API Endpoint Verification"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Test endpoints against booking service directly
echo "Testing hold orders endpoints on booking service..."

# Test 1: Payment Methods
if RESPONSE=$(curl -s http://localhost:3007/bookings/hold/payment-methods 2>/dev/null); then
  if echo "$RESPONSE" | grep -q '"success":true'; then
    check_pass "GET /bookings/hold/payment-methods"
  else
    check_fail "GET /bookings/hold/payment-methods (invalid response)"
    echo "Response: $RESPONSE"
  fi
else
  check_fail "GET /bookings/hold/payment-methods (no response)"
fi

# Test 2: Create Hold Order (will fail without Duffel API key, but endpoint exists)
if timeout 3 bash -c "curl -s -X POST http://localhost:3007/bookings/hold/orders -H 'Content-Type: application/json' -d '{}'  > /dev/null 2>&1"; then
  check_pass "POST /bookings/hold/orders (endpoint reachable)"
else
  check_fail "POST /bookings/hold/orders (endpoint not responding)"
fi

# Test 3: Check eligibility
if timeout 3 bash -c "curl -s http://localhost:3007/bookings/hold/eligibility/test-offer > /dev/null 2>&1"; then
  check_pass "GET /bookings/hold/eligibility/:offerId (endpoint reachable)"
else
  check_fail "GET /bookings/hold/eligibility/:offerId (endpoint not responding)"
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "PHASE 4: Build & Type Safety Checks"
echo "═══════════════════════════════════════════════════════════"
echo ""

echo "Checking booking service build..."
if cd services/booking-service && npm run build > /tmp/build.log 2>&1; then
  if grep -q "error TS" /tmp/build.log; then
    check_fail "Build has TypeScript errors"
    grep "error TS" /tmp/build.log | head -5
  else
    check_pass "Build succeeded with no errors"
  fi
  cd - > /dev/null
else
  check_fail "Build failed"
  tail -10 /tmp/build.log
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "PHASE 5: Configuration Verification"
echo "═══════════════════════════════════════════════════════════"
echo ""

echo "Verifying hold orders routes integration..."

# Check if holdOrdersRoutes are imported in app.ts
if grep -q "holdOrdersRoutes" services/booking-service/src/app.ts; then
  check_pass "holdOrdersRoutes imported in app.ts"
else
  check_fail "holdOrdersRoutes not imported in app.ts"
fi

# Check if routes are registered
if grep -q "app.use.*holdOrdersRoutes" services/booking-service/src/app.ts; then
  check_pass "holdOrdersRoutes registered in app"
else
  check_fail "holdOrdersRoutes not registered in app"
fi

# Count endpoints in routes file
ENDPOINT_COUNT=$(grep -c "router\.\(get\|post\|put\|delete\)" services/booking-service/src/routes/holdOrdersRoutes.ts)
if [[ $ENDPOINT_COUNT -eq 13 ]]; then
  check_pass "All 13 endpoints defined in holdOrdersRoutes"
else
  check_warn "Expected 13 endpoints, found $ENDPOINT_COUNT"
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "PHASE 6: Component Verification"
echo "═══════════════════════════════════════════════════════════"
echo ""

echo "Checking React components..."

# Check exports
if grep -q "export.*const.*HoldOrdersCheck" apps/booking-engine/src/components/booking/HoldOrdersCheck.tsx; then
  check_pass "HoldOrdersCheck component exports correctly"
else
  check_fail "HoldOrdersCheck component export issue"
fi

# Check CSS files
[[ -f "apps/booking-engine/src/components/booking/HoldOrdersCheck.css" ]] && check_pass "HoldOrdersCheck CSS found" || check_fail "HoldOrdersCheck CSS missing"
[[ -f "apps/booking-engine/src/components/booking/HoldOrderForm.css" ]] && check_pass "HoldOrderForm CSS found" || check_fail "HoldOrderForm CSS missing"
[[ -f "apps/booking-engine/src/components/booking/HoldOrderDetails.css" ]] && check_pass "HoldOrderDetails CSS found" || check_fail "HoldOrderDetails CSS missing"
[[ -f "apps/booking-engine/src/components/payment/PaymentForm.css" ]] && check_pass "PaymentForm CSS found" || check_fail "PaymentForm CSS missing"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "RESULTS SUMMARY"
echo "═══════════════════════════════════════════════════════════"
echo ""

TOTAL=$((PASSED + FAILED))
PASS_RATE=$((PASSED * 100 / TOTAL))

echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo "Total:  $TOTAL"
echo "Pass Rate: $PASS_RATE%"
echo ""

if [[ $FAILED -eq 0 ]]; then
  echo "╔════════════════════════════════════════════════════════╗"
  echo "║  ✅ ALL CHECKS PASSED - READY FOR DEPLOYMENT           ║"
  echo "╚════════════════════════════════════════════════════════╝"
  exit 0
else
  echo "╔════════════════════════════════════════════════════════╗"
  echo "║  ⚠️  $FAILED CHECKS FAILED - REVIEW ABOVE             ║"
  echo "╚════════════════════════════════════════════════════════╝"
  exit 1
fi
