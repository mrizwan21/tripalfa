#!/bin/bash

# TripAlfa Local Development Startup Script
# Starts all 12 backend services and 2 frontend apps on local machine
# API Gateway and Static DB remain in Docker

set -e

echo "🚀 Starting TripAlfa Local Development Environment"
echo "=============================================="

# Check if Docker services are running
echo "📋 Checking Docker services..."
if ! docker ps | grep -q "tripalfa-api-gateway"; then
    echo "❌ API Gateway not running in Docker. Please start it first:"
    echo "   docker-compose -f docker-compose.local.yml up -d tripalfa-api-gateway"
    exit 1
fi

if ! docker ps | grep -q "tripalfa-staticdb"; then
    echo "❌ Static Database not running in Docker. Please start it first:"
    echo "   docker-compose -f docker-compose.local.yml up -d tripalfa-staticdb"
    exit 1
fi

echo "✅ Docker services are running"

# Load environment variables
echo "📋 Loading environment configuration..."
if [ -f .env.local ]; then
    source .env.local
    echo "✅ Loaded .env.local"
else
    echo "⚠️  Warning: .env.local not found. Using default configuration."
fi

# Function to start a service in background
start_service() {
    local service_name=$1
    local port=$2
    local directory=$3
    local project_root=$(pwd)
    
    echo "🔄 Starting $service_name on port $port..."
    
    if [ ! -d "$directory" ]; then
        echo "❌ Directory $directory not found for $service_name"
        return 1
    fi
    
    cd "$directory"
    
    # Check if package.json exists
    if [ ! -f "package.json" ]; then
        echo "❌ package.json not found in $directory"
        cd "$project_root"
        return 1
    fi
    
    # Start service in background
    nohup pnpm dev > "${project_root}/logs/${service_name}.log" 2>&1 &
    local pid=$!
    echo $pid > "${project_root}/logs/${service_name}.pid"
    
    # Wait for service to start
    sleep 3
    
    # Check if service is responding
    if curl -s "http://localhost:$port/health" > /dev/null 2>&1; then
        echo "✅ $service_name started successfully (PID: $pid)"
    else
        echo "⚠️  $service_name may not be ready yet (PID: $pid)"
        echo "   Check logs: tail -f logs/${service_name}.log"
    fi
    
    cd "$project_root"
}

# Create logs directory
mkdir -p logs

echo ""
echo "🔧 Starting Backend Services..."
echo "=============================="

# Start backend services
start_service "user-service" "$USER_SERVICE_PORT" "services/user-service"
start_service "booking-service" "$BOOKING_SERVICE_PORT" "services/booking-service"
start_service "payment-service" "$PAYMENT_SERVICE_PORT" "services/payment-service"
start_service "organization-service" "$ORGANIZATION_SERVICE_PORT" "services/organization-service"
start_service "wallet-service" "$WALLET_SERVICE_PORT" "services/wallet-service"
start_service "notification-service" "$NOTIFICATION_SERVICE_PORT" "services/notification-service"
start_service "rule-engine-service" "$RULE_ENGINE_SERVICE_PORT" "services/rule-engine-service"
start_service "kyc-service" "$KYC_SERVICE_PORT" "services/kyc-service"
start_service "marketing-service" "$MARKETING_SERVICE_PORT" "services/marketing-service"
start_service "b2b-admin-service" "$B2B_ADMIN_SERVICE_PORT" "services/b2b-admin-service"
start_service "booking-engine-service" "$BOOKING_ENGINE_SERVICE_PORT" "services/booking-engine-service"

echo ""
echo "🌐 Starting Frontend Applications..."
echo "=================================="

# Get project root
PROJECT_ROOT=$(pwd)

# Start frontend applications
echo "🔄 Starting b2b-admin on port $B2B_ADMIN_PORT..."
cd "${PROJECT_ROOT}/apps/b2b-admin"
nohup pnpm dev > "${PROJECT_ROOT}/logs/b2b-admin.log" 2>&1 &
echo $! > "${PROJECT_ROOT}/logs/b2b-admin.pid"
sleep 2

echo "🔄 Starting booking-engine on port $BOOKING_ENGINE_PORT..."
cd "${PROJECT_ROOT}/apps/booking-engine"
nohup pnpm dev > "${PROJECT_ROOT}/logs/booking-engine.log" 2>&1 &
echo $! > "${PROJECT_ROOT}/logs/booking-engine.pid"
sleep 2

cd "$PROJECT_ROOT"

echo ""
echo "📊 Service Status Summary"
echo "========================"

# Display service status
echo "🐳 Docker Services:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "(tripalfa-api-gateway|tripalfa-staticdb)"

echo ""
echo "💻 Local Services:"
echo "Backend Services:"
echo "  • user-service: http://localhost:${USER_SERVICE_PORT:-3003}"
echo "  • booking-service: http://localhost:${BOOKING_SERVICE_PORT:-3001}"
echo "  • payment-service: http://localhost:${PAYMENT_SERVICE_PORT:-3007}"
echo "  • organization-service: http://localhost:${ORGANIZATION_SERVICE_PORT:-3006}"
echo "  • wallet-service: http://localhost:${WALLET_SERVICE_PORT:-3008}"
echo "  • notification-service: http://localhost:${NOTIFICATION_SERVICE_PORT:-3009}"
echo "  • rule-engine-service: http://localhost:${RULE_ENGINE_SERVICE_PORT:-3010}"
echo "  • kyc-service: http://localhost:${KYC_SERVICE_PORT:-3011}"
echo "  • marketing-service: http://localhost:${MARKETING_SERVICE_PORT:-3012}"
echo "  • b2b-admin-service: http://localhost:${B2B_ADMIN_SERVICE_PORT:-3020}"
echo "  • booking-engine-service: http://localhost:${BOOKING_ENGINE_SERVICE_PORT:-3021}"

echo ""
echo "Frontend Applications:"
echo "  • b2b-admin: http://localhost:${B2B_ADMIN_PORT:-5173}"
echo "  • booking-engine: http://localhost:${BOOKING_ENGINE_PORT:-5174}"

echo ""
echo "🔗 API Gateway: http://localhost:3000"
echo "🗄️  Static DB: localhost:5435"

echo ""
echo "🎯 Next Steps:"
echo "============"
echo "1. Open b2b-admin: http://localhost:${B2B_ADMIN_PORT:-5173}"
echo "2. Open booking-engine: http://localhost:${BOOKING_ENGINE_PORT:-5174}"
echo "3. Check logs: tail -f logs/*.log"
echo "4. Stop services: ./stop-all-services.sh"

echo ""
echo "✅ All services started successfully!"
echo "🚀 Happy coding!"