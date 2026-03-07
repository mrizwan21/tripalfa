#!/bin/bash

# TripAlfa Local Deployment Startup Script
# Starts all required services for local development without Docker
# Usage: bash scripts/start-local-dev.sh

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
WORKSPACE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_DIR="${WORKSPACE_DIR}/.logs"
PID_FILE="${WORKSPACE_DIR}/.pids"

# Create log directory
mkdir -p "$LOG_DIR"
mkdir -p "$PID_FILE"

# Function to start a service
start_service() {
  local service_name=$1
  local service_path=$2
  local port=$3
  local log_file="${LOG_DIR}/${service_name}.log"
  
  echo -e "${YELLOW}Starting ${service_name} on port ${port}...${NC}"
  
  # Start service with explicit port environment variables
  cd "$WORKSPACE_DIR"
  PORT=$port API_GATEWAY_PORT=$port BOOKING_SERVICE_PORT=$port ORGANIZATION_SERVICE_PORT=$port \
  pnpm --dir "$service_path" dev > "$log_file" 2>&1 &
  local pid=$!
  
  # Save PID
  echo "$pid" > "${PID_FILE}/${service_name}.pid"
  
  # Wait a moment for service to start
  sleep 2
  
  # Check if service is running
  if ps -p $pid > /dev/null 2>&1; then
    echo -e "${GREEN}✅ ${service_name} started (PID: $pid, Port: $port)${NC}"
  else
    echo -e "${RED}❌ Failed to start ${service_name}${NC}"
    cat "$log_file"
    return 1
  fi
  
  return 0
}

# Function to stop all services
stop_services() {
  echo -e "${YELLOW}Stopping all services...${NC}"
  
  for pid_file in ${PID_FILE}/*.pid; do
    if [ -f "$pid_file" ]; then
      local pid=$(cat "$pid_file")
      local service_name=$(basename "$pid_file" .pid)
      
      if ps -p $pid > /dev/null 2>&1; then
        kill $pid 2>/dev/null || true
        echo -e "${GREEN}✅ Stopped ${service_name} (PID: $pid)${NC}"
      fi
      
      rm -f "$pid_file"
    fi
  done
}

# Trap to ensure cleanup on exit
trap stop_services EXIT

echo -e "${GREEN}🚀 TripAlfa Local Development Startup${NC}"
echo "Workspace: $WORKSPACE_DIR"
echo "Logs: $LOG_DIR"
echo ""

# Services to start (name, path, port)
declare -a SERVICES=(
  "api-gateway:services/api-gateway:3030"
  "booking-service:services/booking-service:3001"
  "user-service:services/user-service:3004"
  "organization-service:services/organization-service:3005"
  "payment-service:services/payment-service:3007"
  "wallet-service:services/wallet-service:3008"
  "notification-service:services/notification-service:3009"
  "rule-engine-service:services/rule-engine-service:3010"
  "kyc-service:services/kyc-service:3011"
  "marketing-service:services/marketing-service:3012"
  "b2b-admin-service:services/b2b-admin-service:3020"
  "booking-engine-service:services/booking-engine-service:3021"
  "b2b-admin-app:apps/b2b-admin:5173"
  "booking-engine-app:apps/booking-engine:5173"
)

# Start services
echo -e "${YELLOW}Starting services...${NC}"
for service in "${SERVICES[@]}"; do
  IFS=: read -r name path port <<< "$service"
  if ! start_service "$name" "$path" "$port"; then
    echo -e "${RED}Stopping remaining services due to startup failure${NC}"
    exit 1
  fi
done

echo ""
echo -e "${GREEN}✅ All services started!${NC}"
echo ""
echo "Service URLs:"
echo "  API Gateway:           http://localhost:3030"
echo "  Booking Service:       http://localhost:3001"
echo "  User Service:          http://localhost:3004"
echo "  Organization Service:  http://localhost:3005"
echo "  Payment Service:       http://localhost:3007"
echo "  Wallet Service:        http://localhost:3008"
echo "  Notification Service:  http://localhost:3009"
echo "  Rule Engine Service:   http://localhost:3010"
echo "  KYC Service:           http://localhost:3011"
echo "  Marketing Service:     http://localhost:3012"
echo "  B2B Admin Service:     http://localhost:3020"
echo "  Booking Engine Service:http://localhost:3021"
echo "  B2B Admin App:         http://localhost:5177"
echo "  Booking Engine App:    http://localhost:5176"
echo ""
echo "Logs are available in: $LOG_DIR"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"

# Keep script running
wait
