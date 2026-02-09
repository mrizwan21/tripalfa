#!/bin/bash

##############################################################################
# Kong Configuration Automation Script for TripAlfa Duffel API
# 
# Purpose: Automate Kong service, route, and plugin configuration
#
# Usage:
#   chmod +x ./scripts/setup-kong.sh
#   ./scripts/setup-kong.sh [kong_url] [duffel_api_key]
#
# Examples:
#   ./scripts/setup-kong.sh http://localhost:8001 your_duffel_api_key
#   ./scripts/setup-kong.sh http://kong:8001 $DUFFEL_TEST_API_KEY
#
##############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
KONG_ADMIN_URL="${1:-http://localhost:8001}"
DUFFEL_API_KEY="${2:-not_set}"
SERVICE_NAME="duffel-air-service"
DUFFEL_UPSTREAM_HOST="api.duffel.com"
DUFFEL_UPSTREAM_PORT="443"
DUFFEL_UPSTREAM_PATH="/air"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Kong Configuration Script for Duffel API${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Function to print step
print_step() {
    echo -e "${YELLOW}[STEP]${NC} $1"
}

# Function to print success
print_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

# Function to print error
print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# Function to check Kong connectivity
check_kong_connectivity() {
    print_step "Checking Kong connectivity..."
    
    if ! curl -s "$KONG_ADMIN_URL/status" > /dev/null 2>&1; then
        print_error "Cannot connect to Kong at $KONG_ADMIN_URL"
        print_error "Make sure Kong is running: docker-compose -f docker-compose.kong.yml up -d"
        exit 1
    fi
    
    print_success "Connected to Kong at $KONG_ADMIN_URL"
}

# Function to create or update service
setup_service() {
    print_step "Setting up Duffel service..."
    
    # Check if service already exists
    if curl -s "$KONG_ADMIN_URL/services/$SERVICE_NAME" > /dev/null 2>&1; then
        print_success "Service '$SERVICE_NAME' already exists"
        return 0
    fi
    
    # Create service
    RESPONSE=$(curl -s -X POST "$KONG_ADMIN_URL/services" \
        -d "name=$SERVICE_NAME" \
        -d "protocol=https" \
        -d "host=$DUFFEL_UPSTREAM_HOST" \
        -d "port=$DUFFEL_UPSTREAM_PORT" \
        -d "path=$DUFFEL_UPSTREAM_PATH" \
        -d "connect_timeout=5000" \
        -d "write_timeout=10000" \
        -d "read_timeout=10000" \
        -H "Content-Type: application/x-www-form-urlencoded")
    
    if echo "$RESPONSE" | grep -q "id"; then
        print_success "Service created: $SERVICE_NAME"
    else
        print_error "Failed to create service"
        echo "$RESPONSE"
        exit 1
    fi
}

# Function to create routes
setup_routes() {
    print_step "Setting up Duffel routes..."
    
    local routes=(
        "name=duffel-seat-maps,paths[]=/seat_maps,methods[]=GET,methods[]=POST"
        "name=duffel-ancillary-offers,paths[]=/ancillary_offers,methods[]=GET,methods[]=POST"
        "name=duffel-orders,paths[]=/orders,methods[]=GET,methods[]=POST,methods[]=PATCH,methods[]=DELETE"
        "name=duffel-offer-requests,paths[]=/offer_requests,methods[]=POST"
        "name=duffel-payment-methods,paths[]=/payment_methods,methods[]=GET"
        "name=duffel-payment-intents,paths[]=/payment_intents,methods[]=POST"
        "name=duffel-payment-confirmations,paths[]=/payment_confirmations,methods[]=POST"
        "name=duffel-payments,paths[]=/payments,methods[]=GET"
    )
    
    for route_config in "${routes[@]}"; do
        IFS=',' read -ra ROUTE_PARAMS <<< "$route_config"
        
        ROUTE_NAME=$(echo "${ROUTE_PARAMS[0]}" | cut -d'=' -f2)
        
        # Check if route already exists
        if curl -s "$KONG_ADMIN_URL/routes/$ROUTE_NAME" > /dev/null 2>&1; then
            echo -e "${GREEN}  ✓${NC} Route exists: $ROUTE_NAME"
            continue
        fi
        
        # Build curl command
        local curl_cmd="curl -s -X POST \"$KONG_ADMIN_URL/services/$SERVICE_NAME/routes\""
        
        for param in "${ROUTE_PARAMS[@]}"; do
            curl_cmd="$curl_cmd -d \"$param\""
        done
        
        curl_cmd="$curl_cmd -d \"strip_path=false\""
        
        # Execute curl command
        RESPONSE=$(eval "$curl_cmd")
        
        if echo "$RESPONSE" | grep -q "id"; then
            echo -e "${GREEN}  ✓${NC} Route created: $ROUTE_NAME"
        else
            echo -e "${RED}  ✗${NC} Failed to create route: $ROUTE_NAME"
        fi
    done
    
    print_success "Routes setup complete"
}

# Function to add plugins
setup_plugins() {
    print_step "Setting up Kong plugins..."
    
    # Authentication (Key Auth)
    print_step "Adding Key Authentication plugin..."
    curl -s -X POST "$KONG_ADMIN_URL/services/$SERVICE_NAME/plugins" \
        -d "name=key-auth" \
        -d "config.key_names=Authorization" \
        -d "config.key_in_header=true" \
        -d "config.hide_credentials=false" > /dev/null
    print_success "Key Authentication added"
    
    # Rate Limiting
    print_step "Adding Rate Limiting plugin..."
    curl -s -X POST "$KONG_ADMIN_URL/services/$SERVICE_NAME/plugins" \
        -d "name=rate-limiting" \
        -d "config.minute=1000" \
        -d "config.hour=10000" \
        -d "config.policy=local" \
        -d "config.fault_tolerant=true" > /dev/null
    print_success "Rate Limiting added"
    
    # Request Transformer
    print_step "Adding Request Transformer plugin..."
    curl -s -X POST "$KONG_ADMIN_URL/services/$SERVICE_NAME/plugins" \
        -d "name=request-transformer" \
        -d "config.add.headers=Duffel-Version:v2" \
        -d "config.add.headers=Content-Type:application/json" > /dev/null
    print_success "Request Transformer added"
    
    # Correlation ID
    print_step "Adding Correlation ID plugin..."
    curl -s -X POST "$KONG_ADMIN_URL/services/$SERVICE_NAME/plugins" \
        -d "name=correlation-id" \
        -d "config.header_name=X-Correlation-ID" \
        -d "config.generator=uuid" > /dev/null 2>&1 || true
    print_success "Correlation ID added"
}

# Function to verify setup
verify_setup() {
    print_step "Verifying Kong configuration..."
    echo ""
    
    echo -e "${YELLOW}Services:${NC}"
    curl -s "$KONG_ADMIN_URL/services/$SERVICE_NAME" | jq '.name, .protocol, .host' | tr -d '"'
    
    echo ""
    echo -e "${YELLOW}Routes:${NC}"
    curl -s "$KONG_ADMIN_URL/services/$SERVICE_NAME/routes" | jq '.data[] | .name' | tr -d '"'
    
    echo ""
    echo -e "${YELLOW}Plugins:${NC}"
    curl -s "$KONG_ADMIN_URL/plugins" | jq '.data[] | select(.service.id != null) | .name' | tr -d '"' | sort -u
}

# Function to test Kong proxy
test_kong_proxy() {
    print_step "Testing Kong proxy endpoint..."
    
    if [ "$DUFFEL_API_KEY" = "not_set" ]; then
        echo -e "${YELLOW}[INFO]${NC} Skipping test - DUFFEL_API_KEY not provided"
        return 0
    fi
    
    echo "Testing: /seat_maps endpoint"
    RESPONSE=$(curl -s -X GET "http://localhost:8000/seat_maps" \
        -H "Authorization: Bearer $DUFFEL_API_KEY" \
        -H "Duffel-Version: v2")
    
    if echo "$RESPONSE" | grep -q "error\|data"; then
        print_success "Kong proxy is responding"
    else
        print_error "Unexpected response from Kong proxy"
    fi
}

# Main execution
main() {
    check_kong_connectivity
    setup_service
    setup_routes
    setup_plugins
    verify_setup
    test_kong_proxy
    
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}Kong Configuration Complete!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "${BLUE}Next Steps:${NC}"
    echo "1. Access Konga UI: http://localhost:1337"
    echo "2. Access Kong Admin: http://localhost:8001"
    echo "3. Test via API Gateway: http://localhost:3000/bookings/flight/ancillary-offers?orderId=test"
    echo ""
}

# Run main function
main
