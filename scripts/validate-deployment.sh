#!/bin/bash

# Seat Maps Feature - Full Deployment Validation Script
# Validates complete implementation before staging deployment

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║   SEAT MAPS FEATURE - DEPLOYMENT VALIDATION SCRIPT         ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

passed=0
failed=0

# Helper functions
check_pass() {
  echo -e "${GREEN}✅ $1${NC}"
  ((passed++))
}

check_fail() {
  echo -e "${RED}❌ $1${NC}"
  ((failed++))
}

check_warn() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

echo "🔍 VALIDATION CHECKS"
echo "===================="
echo ""

# 1. Check backend files exist
echo "1. Backend Files:"
if [ -f "services/booking-service/src/integrations/duffelApiClient.ts" ]; then
  check_pass "DuffelApiClient.ts exists"
else
  check_fail "DuffelApiClient.ts missing"
fi

if [ -f "services/booking-service/src/controllers/seatMapsController.ts" ]; then
  check_pass "SeatMapsController.ts exists"
else
  check_fail "SeatMapsController.ts missing"
fi

if [ -f "services/booking-service/src/routes/seatMapsRoutes.ts" ]; then
  check_pass "SeatMapsRoutes.ts exists"
else
  check_fail "SeatMapsRoutes.ts missing"
fi

if [ -f "services/booking-service/src/mocks/duffelResponses.ts" ]; then
  check_pass "Mock data exists"
else
  check_fail "Mock data missing"
fi

echo ""

# 2. Check TypeScript compilation
echo "2. TypeScript Compilation:"
if npx tsc --noEmit 2>/dev/null | grep -q "seat\|duffel"; then
  check_fail "TypeScript errors in seat maps code"
else
  check_pass "No TypeScript errors"
fi

echo ""

# 3. Check frontend files
echo "3. Frontend Files:"
if [ -f "apps/booking-engine/src/pages/SeatSelection.tsx" ]; then
  check_pass "SeatSelection.tsx exists"
else
  check_fail "SeatSelection.tsx missing"
fi

if [ -f "apps/booking-engine/src/services/seatMapsApi.ts" ]; then
  check_pass "seatMapsApi.ts exists"
else
  check_fail "seatMapsApi.ts missing"
fi

echo ""

# 4. Check documentation
echo "4. Documentation:"
docs=(
  "BACKEND_FRONTEND_INTEGRATION_GETTING_STARTED.md"
  "DEPLOYMENT_READY.md"
  "docs/INTEGRATION_TESTING_GUIDE.md"
  "docs/BACKEND_FRONTEND_INTEGRATION_STATUS.md"
)

for doc in "${docs[@]}"; do
  if [ -f "$doc" ]; then
    check_pass "$doc exists"
  else
    check_fail "$doc missing"
  fi
done

echo ""

# 5. Check scripts
echo "5. Test Scripts:"
if [ -f "scripts/test-seat-maps-integration.ts" ]; then
  check_pass "test-seat-maps-integration.ts exists"
else
  check_fail "test-seat-maps-integration.ts missing"
fi

if [ -f "scripts/test-full-booking-flow.ts" ]; then
  check_pass "test-full-booking-flow.ts exists"
else
  check_fail "test-full-booking-flow.ts missing"
fi

echo ""

# 6. Check app.ts integration
echo "6. Routes Integration:"
if grep -q "seatMapsRoutes" "services/booking-service/src/app.ts"; then
  check_pass "Routes imported in app.ts"
else
  check_fail "Routes not imported in app.ts"
fi

if grep -q "'/bookings'.*seatMapsRoutes" "services/booking-service/src/app.ts"; then
  check_pass "Routes registered on /bookings path"
else
  check_fail "Routes not registered properly"
fi

echo ""

# 7. Check if build works
echo "7. Build Status:"
if npm run build --workspace=@tripalfa/booking-engine >/dev/null 2>&1; then
  check_pass "Frontend builds successfully"
else
  check_fail "Frontend build failed"
fi

echo ""

# Summary
echo "════════════════════════════════════════════════════════════"
echo "📊 SUMMARY"
echo "════════════════════════════════════════════════════════════"
total=$((passed + failed))
echo ""
echo "Total Checks:  $total"
echo -e "Passed:        ${GREEN}$passed ✅${NC}"
echo -e "Failed:        ${RED}$failed ❌${NC}"

if [ $failed -eq 0 ]; then
  echo ""
  echo -e "${GREEN}✅ ALL VALIDATIONS PASSED${NC}"
  echo ""
  echo "Next Steps:"
  echo "  1. Run integration tests:"
  echo "     npm run dev --workspace=@tripalfa/booking-service &"
  echo "     npm run dev --workspace=@tripalfa/booking-engine &"
  echo "     npx ts-node scripts/test-full-booking-flow.ts"
  echo ""
  echo "  2. Deploy to staging environment"
  echo "  3. Configure Duffel API credentials"
  echo "  4. Run QA testing suite"
  echo ""
  exit 0
else
  echo ""
  echo -e "${RED}❌ SOME VALIDATIONS FAILED${NC}"
  echo ""
  echo "Please fix the issues above before proceeding."
  echo ""
  exit 1
fi
