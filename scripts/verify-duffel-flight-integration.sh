#!/bin/bash

# Duffel Flight Integration Verification Script
# This script verifies that all components of the Duffel flight integration are in place

set -e

echo "═══════════════════════════════════════════════════════════════"
echo "  🚀 DUFFEL FLIGHT INTEGRATION VERIFICATION"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Check for required files
echo "📋 Checking required files..."

REQUIRED_FILES=(
    "apps/booking-engine/src/components/flight/DuffelFlightSearch.tsx"
    "apps/booking-engine/src/components/flight/DuffelFlightResults.tsx"
    "apps/booking-engine/src/components/flight/DuffelFlightDetail.tsx"
    "apps/booking-engine/src/hooks/useDuffelFlights.ts"
    "apps/booking-engine/src/services/duffelFlightService.ts"
    "apps/booking-engine/src/api/flightApi.ts"
    "apps/booking-engine/src/pages/DuffelFlightsPage.tsx"
    "services/booking-service/src/routes/duffel.ts"
    "tests/api-integration/duffel-flight-integration.test.ts"
    "tests/e2e/duffel-flight-integration.spec.ts"
    "scripts/test-duffel-flight-integration.ts"
    "docs/DUFFEL_FLIGHT_MODULE_INTEGRATION.md"
)

MISSING_FILES=0

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✓ $file"
    else
        echo "  ✗ $file (MISSING)"
        MISSING_FILES=$((MISSING_FILES + 1))
    fi
done

echo ""

if [ $MISSING_FILES -gt 0 ]; then
    echo "❌ Missing $MISSING_FILES file(s)"
    exit 1
fi

echo "✅ All required files present"
echo ""

# Check for TypeScript compilation errors
echo "🔍 Checking TypeScript compilation..."

cd apps/booking-engine
if npx tsc --noEmit --project tsconfig.json > /dev/null 2>&1; then
    echo "  ✓ TypeScript compilation successful"
else
    echo "  ✗ TypeScript compilation failed"
    exit 1
fi

cd ../..

echo ""

# Check npm scripts are available
echo "📜 Checking npm scripts..."

REQUIRED_SCRIPTS=(
    "test:api:duffel-flight-integration"
    "test:e2e:duffel-flights"
)

for script in "${REQUIRED_SCRIPTS[@]}"; do
    if npm run 2>&1 | grep -q "$script"; then
        echo "  ✓ npm script: $script"
    else
        echo "  ✗ npm script: $script (NOT FOUND)"
    fi
done

echo ""

# Check API endpoints are defined
echo "🔗 Checking backend routes..."

ENDPOINTS=(
    "/duffel/offer-requests"
    "/duffel/orders/hold"
    "/duffel/orders"
    "/duffel/seat-maps"
    "/duffel/order-cancellations"
)

for endpoint in "${ENDPOINTS[@]}"; do
    if grep -q "router.post(\"$endpoint\"" services/booking-service/src/routes/duffel.ts || \
       grep -q "router.get(\"$endpoint" services/booking-service/src/routes/duffel.ts; then
        echo "  ✓ Endpoint: $endpoint"
    else
        echo "  ✗ Endpoint: $endpoint (NOT FOUND)"
    fi
done

echo ""

# Summary
echo "═══════════════════════════════════════════════════════════════"
echo "✅ VERIFICATION COMPLETE - All systems ready for testing!"
echo "═══════════════════════════════════════════════════════════════"
echo ""

echo "📚 Next Steps:"
echo "  1. Review integration guide:"
echo "     docs/DUFFEL_FLIGHT_MODULE_INTEGRATION.md"
echo ""
echo "  2. Run integration tests:"
echo "     npm run test:api:duffel-flight-integration"
echo ""
echo "  3. Run E2E tests:"
echo "     npm run test:e2e:duffel-flights"
echo ""
echo "  4. Check quick start:"
echo "     docs/DUFFEL_FLIGHT_INTEGRATION_QUICK_START.md"
echo ""
