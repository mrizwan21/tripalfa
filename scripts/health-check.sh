#!/bin/bash

# TripAlfa Service Health Check Script
# Verifies all services are running and responding to health checks
# Usage: bash scripts/health-check.sh

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
TIMEOUT=5  # Health check timeout in seconds
RETRIES=3  # Number of retries for each service

# Service health check endpoints
declare -a SERVICE_NAMES=("API Gateway" "Booking Service" "User Service" "Organization Service" "Payment Service" "Wallet Service" "Notification Service" "Rule Engine Service" "KYC Service" "Marketing Service" "B2B Admin Service" "Booking Engine Service")
declare -a SERVICE_URLS=("http://localhost:3000/health" "http://localhost:3001/health" "http://localhost:3004/health" "http://localhost:3006/health" "http://localhost:3007/health" "http://localhost:3008/health" "http://localhost:3009/health" "http://localhost:3010/health" "http://localhost:3011/health" "http://localhost:3012/health" "http://localhost:3020/health" "http://localhost:3021/health")

# Frontend endpoints (no health endpoint, just check if running)
declare -a FRONTEND_NAMES=("B2B Admin Frontend" "Booking Engine Frontend")
declare -a FRONTEND_URLS=("http://localhost:5173" "http://localhost:5174")

# Function to check service health
check_service() {
  local service_name=$1
  local service_url=$2
  local attempt=1
  
  while [ $attempt -le $RETRIES ]; do
    local response=$(curl -s -m $TIMEOUT -w "%{http_code}" -o /tmp/response.json "$service_url" 2>/dev/null || echo "000")
    
    if [ "$response" = "200" ]; then
      echo -e "${GREEN}✅ ${service_name}${NC}"
      return 0
    fi
    
    if [ $attempt -lt $RETRIES ]; then
      echo -ne "${YELLOW}⏳ ${service_name} (attempt $attempt/$RETRIES)${NC}\r"
      sleep 2
    fi
    
    ((attempt++))
  done
  
  echo -e "${RED}❌ ${service_name} (HTTP $response)${NC}"
  return 1
}

# Function to check frontend
check_frontend() {
  local frontend_name=$1
  local frontend_url=$2
  
  local response=$(curl -s -m $TIMEOUT -w "%{http_code}" -o /dev/null "$frontend_url" 2>/dev/null || echo "000")
  
  if [ "$response" = "200" ] || [ "$response" = "304" ]; then
    echo -e "${GREEN}✅ ${frontend_name}${NC}"
    return 0
  else
    echo -e "${RED}❌ ${frontend_name} (HTTP $response)${NC}"
    return 1
  fi
}

# Function to check database
check_database() {
  local db_name=$1
  local db_url=$2
  
  if [ -z "$db_url" ]; then
    echo -e "${YELLOW}⚠️  ${db_name} (URL not set)${NC}"
    return 1
  fi
  
  # Try to connect using psql
  if psql "$db_url" -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ ${db_name}${NC}"
    return 0
  else
    echo -e "${RED}❌ ${db_name} (connection failed)${NC}"
    return 1
  fi
}

# Main execution
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}🔍 TripAlfa Service Health Check${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Check backend services
echo -e "${BLUE}Backend Services:${NC}"
echo "───────────────────────────────────────────────────────────"
backend_healthy=0
backend_total=${#SERVICE_NAMES[@]}

for ((i=0; i<${#SERVICE_NAMES[@]}; i++)); do
  if check_service "${SERVICE_NAMES[$i]}" "${SERVICE_URLS[$i]}"; then
    ((backend_healthy++))
  fi
done

echo ""

# Check frontends
echo -e "${BLUE}Frontend Applications:${NC}"
echo "───────────────────────────────────────────────────────────"
frontend_healthy=0
frontend_total=${#FRONTEND_NAMES[@]}

for ((i=0; i<${#FRONTEND_NAMES[@]}; i++)); do
  if check_frontend "${FRONTEND_NAMES[$i]}" "${FRONTEND_URLS[$i]}"; then
    ((frontend_healthy++))
  fi
done

echo ""

# Check databases
echo -e "${BLUE}Databases:${NC}"
echo "───────────────────────────────────────────────────────────"
db_healthy=0
db_total=0

# Load environment variables if .env.local exists
if [ -f ".env.local" ]; then
  export $(grep -v '^#' .env.local | xargs -0 2>/dev/null) || true
fi

# Check Neon Database (application data)
((db_total++))
if [ -n "$DIRECT_DATABASE_URL" ] || [ -n "$DATABASE_URL" ]; then
  db_url=${DIRECT_DATABASE_URL:-$DATABASE_URL}
  if psql "$db_url" -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Neon Database (Cloud)${NC}"
    ((db_healthy++))
  else
    echo -e "${RED}❌ Neon Database (Cloud) - connection failed${NC}"
  fi
else
  echo -e "${YELLOW}⚠️  Neon Database (Cloud) - URL not configured${NC}"
fi

# Check Local Static Database (reference data)
((db_total++))
static_db_url=${STATIC_DATABASE_URL:-postgresql://postgres:postgres@localhost:5432/staticdatabase}
if check_database "Static Database (Local)" "$static_db_url"; then
  ((db_healthy++))
fi

echo ""

# Print summary
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}📊 Health Check Summary${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "Backend Services:      ${GREEN}${backend_healthy}/${backend_total}${NC}"
echo -e "Frontend Apps:         ${GREEN}${frontend_healthy}/${frontend_total}${NC}"
echo -e "Databases:             ${GREEN}${db_healthy}/${db_total}${NC}"
echo ""

# Calculate overall health
total_healthy=$((backend_healthy + frontend_healthy + db_healthy))
total_services=$((backend_total + frontend_total + db_total))
health_percentage=$((total_healthy * 100 / total_services))

if [ $total_healthy -eq $total_services ]; then
  echo -e "${GREEN}✅ All systems operational (${health_percentage}%)${NC}"
  exit 0
elif [ $total_healthy -ge $((total_services * 3 / 4)) ]; then
  echo -e "${YELLOW}⚠️  Most systems operational (${health_percentage}%)${NC}"
  exit 1
else
  echo -e "${RED}❌ Critical services down (${health_percentage}%)${NC}"
  echo ""
  echo "Troubleshooting steps:"
  echo "1. Check logs: tail -f .logs/*.log"
  echo "2. Verify services are running: ps aux | grep pnpm"
  echo "3. Check static database: psql -h localhost -p 5433 -U postgres"
  echo "4. Restart services: bash scripts/start-local-dev.sh"
  exit 2
fi
