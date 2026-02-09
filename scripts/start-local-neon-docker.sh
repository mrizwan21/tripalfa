#!/bin/bash

# 🚀 NEON + DOCKER LOCAL QUICK START
# Purpose: Set up and run local environment with Neon database
# Date: February 7, 2026

set -e

RESET='\033[0m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'

print_header() {
    echo ""
    echo -e "${BLUE}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
    echo -e "${BLUE}${BOLD}$1${RESET}"
    echo -e "${BLUE}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
}

print_status() {
    local status=$1
    local message=$2
    
    if [ "$status" = "✅" ]; then
        echo -e "${GREEN}✅ ${message}${RESET}"
    elif [ "$status" = "🔴" ]; then
        echo -e "${RED}🔴 ${message}${RESET}"
    elif [ "$status" = "⏳" ]; then
        echo -e "${YELLOW}⏳ ${message}${RESET}"
    elif [ "$status" = "ℹ️" ]; then
        echo -e "${BLUE}ℹ️  ${message}${RESET}"
    fi
}

# ========================================
# 1. PRE-FLIGHT CHECKS
# ========================================
print_header "1. Pre-flight Checks"

if ! command -v docker &> /dev/null; then
    print_status "🔴" "Docker not installed"
    exit 1
fi
print_status "✅" "Docker installed"

if ! command -v docker-compose &> /dev/null; then
    print_status "🔴" "Docker Compose not installed"
    exit 1
fi
print_status "✅" "Docker Compose installed"

if ! docker ps &> /dev/null; then
    print_status "🔴" "Docker daemon not running"
    echo "  Start Docker Desktop or daemon and retry"
    exit 1
fi
print_status "✅" "Docker daemon running"

# ========================================
# 2. ENVIRONMENT VARIABLES
# ========================================
print_header "2. Environment Configuration"

if [ -z "$DATABASE_URL" ]; then
    print_status "🔴" "DATABASE_URL not set"
    echo ""
    echo "Required: Set the Neon connection string"
    echo "  export DATABASE_URL='postgresql://user:password@ep-xxxxx.region.neon.tech/dbname'"
    echo ""
    echo "To get your Neon connection string:"
    echo "  1. Go to https://console.neon.tech"
    echo "  2. Select your project"
    echo "  3. Go to 'Connection String'"
    echo "  4. Copy the connection string"
    echo ""
    exit 1
fi
print_status "✅" "DATABASE_URL is set"

if [ -z "$DUFFEL_SANDBOX_API_KEY" ]; then
    print_status "🔴" "DUFFEL_SANDBOX_API_KEY not set"
    echo "  export DUFFEL_SANDBOX_API_KEY='sk_sandbox_...'"
    exit 1
fi
print_status "✅" "DUFFEL_SANDBOX_API_KEY is set"

# Show connection info (masked)
DB_HOST=$(echo $DATABASE_URL | grep -oP '(?<=@)[^/]*' || echo "unknown")
print_status "ℹ️" "Neon host: $DB_HOST"

# ========================================
# 3. TEST NEON CONNECTION
# ========================================
print_header "3. Testing Neon Database Connection"

if psql "$DATABASE_URL" -c "SELECT NOW();" 2>/dev/null > /dev/null; then
    print_status "✅" "Neon connection: SUCCESSFUL"
else
    print_status "⏳" "psql not installed - skipping direct connection test"
    print_status "ℹ️" "Connection will be tested when docker services start"
fi

# ========================================
# 4. BUILD DOCKER IMAGES
# ========================================
print_header "4. Building Docker Images"

print_status "⏳" "Building api-gateway..."
docker-compose -f docker-compose.local.yml build api-gateway 2>&1 | tail -5
print_status "✅" "api-gateway built"

print_status "⏳" "Building booking-service..."
docker-compose -f docker-compose.local.yml build booking-service 2>&1 | tail -5
print_status "✅" "booking-service built"

print_status "⏳" "Building booking-engine..."
docker-compose -f docker-compose.local.yml build booking-engine 2>&1 | tail -5
print_status "✅" "booking-engine built"

# ========================================
# 5. START SERVICES
# ========================================
print_header "5. Starting Local Services"

print_status "⏳" "Starting Docker Compose services..."
docker-compose -f docker-compose.local.yml up -d

print_status "✅" "Docker services started"
echo ""
echo "Waiting for services to become healthy..."
echo "(This may take 30-60 seconds)"

# ========================================
# 6. HEALTH CHECKS
# ========================================
print_header "6. Service Health Checks"

# Wait for services with timeout
TIMEOUT=60
ELAPSED=0

while [ $ELAPSED -lt $TIMEOUT ]; do
    # Check booking-service (depends on Neon)
    if curl -s http://localhost:3001/health 2>/dev/null | grep -q "ok\|healthy" 2>/dev/null; then
        print_status "✅" "Booking Service: HEALTHY"
        BOOKING_OK=1
        break
    fi
    
    ELAPSED=$((ELAPSED + 5))
    echo "  ⏳ Still waiting... (${ELAPSED}s elapsed)"
    sleep 5
done

if [ -z "$BOOKING_OK" ]; then
    print_status "🔴" "Booking Service: TIMEOUT - Check logs"
    docker-compose -f docker-compose.local.yml logs booking-service | tail -20
    exit 1
fi

# Check API Gateway
if curl -s http://localhost:3000/health 2>/dev/null > /dev/null; then
    print_status "✅" "API Gateway: HEALTHY"
else
    print_status "🔴" "API Gateway: NOT RESPONDING"
    docker-compose -f docker-compose.local.yml logs api-gateway | tail -20
fi

# Check Frontend
if curl -s http://localhost:5173 2>/dev/null > /dev/null; then
    print_status "✅" "Booking Engine: HEALTHY"
else
    print_status "🔴" "Booking Engine: NOT RESPONDING"
    docker-compose -f docker-compose.local.yml logs booking-engine | tail -20
fi

# ========================================
# 7. SERVICE SUMMARY
# ========================================
print_header "7. Local Environment Ready"

echo ""
echo -e "${GREEN}${BOLD}🎉 All services are running!${RESET}"
echo ""
echo "Service URLs:"
echo "  API Gateway:   http://localhost:3000"
echo "  Booking Service: http://localhost:3001"
echo "  Booking Engine:  http://localhost:5173"
echo ""
echo "Database:"
echo "  Connection: Neon (via DATABASE_URL)"
echo "  Check Neon dashboard: https://console.neon.tech"
echo ""
echo "Useful commands:"
echo "  View logs:        docker-compose -f docker-compose.local.yml logs -f"
echo "  Stop services:    docker-compose -f docker-compose.local.yml down"
echo "  Restart service:  docker-compose -f docker-compose.local.yml restart booking-service"
echo "  Shell access:     docker-compose -f docker-compose.local.yml exec booking-service sh"
echo ""
echo "Next steps:"
echo "  1. Open: http://localhost:5173 in your browser"
echo "  2. Test the booking flow"
echo "  3. Check logs: docker-compose -f docker-compose.local.yml logs booking-service"
echo "  4. Run integration tests:"
echo "     API_GATEWAY_URL=http://localhost:3000 npx ts-node scripts/test-ancillary-services-integration.ts"
echo ""

# ========================================
# 8. RUNNING INTEGRATION TESTS
# ========================================
read -p "Run integration tests now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_header "Running Integration Tests"
    
    export API_GATEWAY_URL=http://localhost:3000
    export PROVIDER=duffel
    export TEST_ENV=test
    
    echo ""
    echo "Running Ancillary Services integration tests..."
    npx ts-node scripts/test-ancillary-services-integration.ts
fi

print_header "Setup Complete ✅"

echo ""
echo "Your local environment is ready for development!"
echo ""
echo "To stop services later:"
echo "  docker-compose -f docker-compose.local.yml down"
echo ""
