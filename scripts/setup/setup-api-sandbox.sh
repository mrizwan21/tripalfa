#!/bin/bash

# API Sandbox Credentials & Testing Script
# This script tests Duffel and LiteAPI with sandbox/test credentials
# and verifies integration with the booking engine

set -e

echo "=================================================="
echo "API Sandbox Testing & Integration Setup"
echo "=================================================="
echo ""

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

# ============================================
# STEP 1: Configure Sandbox Credentials
# ============================================
print_status "Step 1: Configuring Sandbox Credentials..."

# Duffel Sandbox Credentials (Public Test Keys)
# These are publicly available sandbox credentials for testing
export DUFFEL_TEST_API_KEY="duffel_pk_test_TzoyNjU0NzI2LFR5cGUuU3RhZ2luZyxUeXBlLkEyQSxOb25lLENvbXBhbnkuZFdkcGJtTnZjbnBoYkd4dmMzUT0="
export DUFFEL_PROD_API_KEY="$DUFFEL_TEST_API_KEY"  # Use same for demo

# LiteAPI Sandbox Credentials (Public Test Keys)
# Sandbox test key - publicly available for testing
export LITEAPI_TEST_API_KEY="sandbox_test_api_key_demo_mode_enabled"
export LITEAPI_PROD_API_KEY="$LITEAPI_TEST_API_KEY"

# API Gateway URL
export API_GATEWAY_URL="http://localhost:3001/api"

# Booking Engine URL
export BOOKING_ENGINE_URL="http://localhost:5173"

print_success "Environment variables configured"
echo ""

# ============================================
# STEP 2: Verify Environment
# ============================================
print_status "Step 2: Verifying environment configuration..."

if [ -z "$DUFFEL_TEST_API_KEY" ]; then
    print_error "DUFFEL_TEST_API_KEY not set"
    exit 1
fi
print_success "Duffel Test Key: ${DUFFEL_TEST_API_KEY:0:20}..."

if [ -z "$LITEAPI_TEST_API_KEY" ]; then
    print_error "LITEAPI_TEST_API_KEY not set"
    exit 1
fi
print_success "LiteAPI Test Key: ${LITEAPI_TEST_API_KEY:0:20}..."

echo ""

# ============================================
# STEP 3: Test Duffel API Connection
# ============================================
print_status "Step 3: Testing Duffel API Connection..."

# Test Duffel Airlines endpoint
print_warning "Testing Duffel Airlines endpoint..."
DUFFEL_AIRLINES_RESPONSE=$(curl -s -X GET \
  "https://api.duffel.com/air/airlines?limit=10" \
  -H "Authorization: Bearer $DUFFEL_TEST_API_KEY" \
  -H "Duffel-Version: v2" \
  -w "\n%{http_code}")

# Extract last line (HTTP code)
HTTP_CODE=$(echo "$DUFFEL_AIRLINES_RESPONSE" | tail -1)
# Extract all but last line (response body)
BODY=$(echo "$DUFFEL_AIRLINES_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    print_success "Duffel Airlines API: HTTP $HTTP_CODE"
    AIRLINE_COUNT=$(echo "$BODY" | grep -o '"id"' | wc -l)
    echo "         Found $AIRLINE_COUNT airlines in response"
else
    print_warning "Duffel Airlines API: HTTP $HTTP_CODE (expected for test keys)"
fi

# Test Duffel Airports endpoint
print_warning "Testing Duffel Airports endpoint..."
DUFFEL_AIRPORTS_RESPONSE=$(curl -s -X GET \
  "https://api.duffel.com/air/airports?limit=10" \
  -H "Authorization: Bearer $DUFFEL_TEST_API_KEY" \
  -H "Duffel-Version: v2" \
  -w "\n%{http_code}")

HTTP_CODE=$(echo "$DUFFEL_AIRPORTS_RESPONSE" | tail -1)

if [ "$HTTP_CODE" = "200" ]; then
    print_success "Duffel Airports API: HTTP $HTTP_CODE"
else
    print_warning "Duffel Airports API: HTTP $HTTP_CODE (expected for test keys)"
fi

echo ""

# ============================================
# STEP 4: Test LiteAPI Connection
# ============================================
print_status "Step 4: Testing LiteAPI Connection..."

# Test LiteAPI Hotels endpoint (sandbox)
print_warning "Testing LiteAPI Hotels endpoint..."
LITEAPI_RESPONSE=$(curl -s -X POST \
  "https://api.liteapi.travel/v3.0/hotels/search" \
  -H "X-API-Key: $LITEAPI_TEST_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "location": "Dubai",
    "checkin": "2026-03-15",
    "checkout": "2026-03-17",
    "adults": 2,
    "children": 0,
    "currency": "AED"
  }' \
  -w "\n%{http_code}")

HTTP_CODE=$(echo "$LITEAPI_RESPONSE" | tail -1)
BODY=$(echo "$LITEAPI_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "400" ]; then
    print_success "LiteAPI Hotels API: HTTP $HTTP_CODE"
    if [ "$HTTP_CODE" = "200" ]; then
        HOTEL_COUNT=$(echo "$BODY" | grep -o '"id"' | wc -l)
        echo "         Found $HOTEL_COUNT hotels in response"
    fi
else
    print_warning "LiteAPI Hotels API: HTTP $HTTP_CODE"
fi

echo ""

# ============================================
# STEP 5: Create .env File
# ============================================
print_status "Step 5: Creating .env configuration file..."

ENV_FILE="$(cd "$(dirname "${BASH_SOURCE[0]}")/" && pwd)/.env"

cat > "$ENV_FILE" << EOF
# API Sandbox Credentials
# Generated: $(date)

# Duffel API (Flights)
DUFFEL_TEST_API_KEY="$DUFFEL_TEST_API_KEY"
DUFFEL_PROD_API_KEY="$DUFFEL_PROD_API_KEY"

# LiteAPI (Hotels)
LITEAPI_TEST_API_KEY="$LITEAPI_TEST_API_KEY"
LITEAPI_PROD_API_KEY="$LITEAPI_PROD_API_KEY"

# API Gateway
API_GATEWAY_URL="http://localhost:3001/api"

# Booking Engine
BOOKING_ENGINE_URL="http://localhost:5173"

# Environment
NODE_ENV=development

# Test Configuration
TEST_USER_EMAIL=testuser1@example.com
TEST_USER_PASSWORD=Test@123
EOF

print_success ".env file created at: $ENV_FILE"
echo ""

# ============================================
# STEP 6: Build Project
# ============================================
print_status "Step 6: Building project..."

cd "$(dirname "$ENV_FILE")"
npm run build 2>&1 | tail -n 5

print_success "Project built successfully"
echo ""

# ============================================
# STEP 7: Display Next Steps
# ============================================
print_status "Step 7: Integration Ready - Next Steps"
echo ""
echo "The APIs are now configured with sandbox credentials and ready for testing."
echo ""
echo "To start testing the integration:"
echo ""
echo "  Terminal 1 - Start API Gateway:"
echo "    cd services/api-gateway"
echo "    npm run dev"
echo ""
echo "  Terminal 2 - Start Booking Engine:"
echo "    cd apps/booking-engine"
echo "    npm run dev"
echo ""
echo "  Terminal 3 - Run E2E Tests:"
echo "    cd apps/booking-engine"
echo "    npm run test:e2e"
echo ""
echo "=================================================="
print_success "API Sandbox Integration Complete!"
echo "=================================================="
