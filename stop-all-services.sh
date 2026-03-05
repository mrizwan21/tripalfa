#!/bin/bash

# TripAlfa Local Development Shutdown Script
# Stops all locally running services

set -e

echo "🛑 Stopping TripAlfa Local Development Environment"
echo "=============================================="

# Function to stop a service
stop_service() {
    local service_name=$1
    local project_root=$(pwd)
    
    echo "🔄 Stopping $service_name..."
    
    # Check if PID file exists
    if [ -f "${project_root}/logs/${service_name}.pid" ]; then
        local pid=$(cat "${project_root}/logs/${service_name}.pid")
        
        # Check if process is running
        if kill -0 $pid 2>/dev/null; then
            kill $pid
            echo "✅ $service_name stopped (PID: $pid)"
        else
            echo "⚠️  $service_name was not running"
        fi
        
        # Remove PID file
        rm -f "${project_root}/logs/${service_name}.pid"
    else
        echo "⚠️  No PID file found for $service_name"
    fi
}

echo "🔧 Stopping Backend Services..."
echo "=============================="

# Stop backend services
stop_service "user-service"
stop_service "booking-service"
stop_service "payment-service"
stop_service "organization-service"
stop_service "wallet-service"
stop_service "notification-service"
stop_service "rule-engine-service"
stop_service "kyc-service"
stop_service "marketing-service"
stop_service "b2b-admin-service"
stop_service "booking-engine-service"

echo ""
echo "🌐 Stopping Frontend Applications..."
echo "=================================="

# Stop frontend applications
stop_service "b2b-admin"
stop_service "booking-engine"

echo ""
echo "🧹 Cleaning up..."
echo "==============="

# Remove log files older than 1 hour (optional)
find logs/ -name "*.log" -mmin +60 -delete 2>/dev/null || true

echo ""
echo "📊 Service Status Summary"
echo "========================"

echo "💻 Local Services Status:"
echo "Backend Services:"
for service in user-service booking-service payment-service organization-service wallet-service notification-service rule-engine-service kyc-service marketing-service b2b-admin-service booking-engine-service; do
    if [ -f "logs/${service}.pid" ]; then
        echo "  • $service: Running (PID file exists)"
    else
        echo "  • $service: Stopped"
    fi
done

echo ""
echo "Frontend Applications:"
for app in b2b-admin booking-engine; do
    if [ -f "logs/${app}.pid" ]; then
        echo "  • $app: Running (PID file exists)"
    else
        echo "  • $app: Stopped"
    fi
done

echo ""
echo "🐳 Docker Services (Still Running):"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "(tripalfa-api-gateway|tripalfa-staticdb)"

echo ""
echo "🎯 Next Steps:"
echo "============"
echo "1. Start services again: ./start-all-services.sh"
echo "2. Check logs: ls logs/"
echo "3. Clean logs: rm logs/*.log"

echo ""
echo "✅ All local services stopped successfully!"
echo "🐳 Docker services remain running for next session"