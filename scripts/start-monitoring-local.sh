#!/bin/bash

# TripAlfa Local Monitoring Stack Startup
# Starts Prometheus, Loki, and Grafana for local development
# Usage: bash scripts/start-monitoring-local.sh

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
WORKSPACE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MONITORING_DIR="${WORKSPACE_DIR}/infrastructure/monitoring"
LOG_DIR="${WORKSPACE_DIR}/.logs/monitoring"
PID_FILE="${WORKSPACE_DIR}/.pids/monitoring"
DATA_DIR="${WORKSPACE_DIR}/.monitoring-data"

# Create directories
mkdir -p "$LOG_DIR"
mkdir -p "$PID_FILE"
mkdir -p "$DATA_DIR/prometheus"
mkdir -p "$DATA_DIR/loki"
mkdir -p "$DATA_DIR/grafana"

echo -e "${GREEN}🚀 TripAlfa Local Monitoring Stack${NC}"
echo "Workspace: $WORKSPACE_DIR"
echo "Config: $MONITORING_DIR"
echo "Logs: $LOG_DIR"
echo "Data: $DATA_DIR"
echo ""

# Function to check if port is available
check_port() {
  local port=$1
  local service=$2
  
  if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Port $port is already in use (likely $service is running)${NC}"
    return 1
  fi
  return 0
}

# Function to start Prometheus
start_prometheus() {
  local port=9090
  
  echo -e "${YELLOW}Starting Prometheus on port ${port}...${NC}"
  
  if ! check_port $port "Prometheus"; then
    echo "Skipping Prometheus - port already in use"
    return 0
  fi
  
  # Check if Prometheus is installed
  if ! command -v prometheus &> /dev/null; then
    echo -e "${RED}❌ Prometheus is not installed${NC}"
    echo "Install with: brew install prometheus"
    return 1
  fi
  
  local log_file="${LOG_DIR}/prometheus.log"
  
  prometheus \
    --config.file="${MONITORING_DIR}/prometheus.yml" \
    --storage.tsdb.path="${DATA_DIR}/prometheus" \
    --storage.tsdb.retention.time=30d \
    --web.enable-lifecycle \
    > "$log_file" 2>&1 &
  
  local pid=$!
  echo "$pid" > "${PID_FILE}/prometheus.pid"
  
  sleep 2
  
  if ps -p $pid > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Prometheus started (PID: $pid, Port: $port)${NC}"
    echo "   Access at: http://localhost:$port"
  else
    echo -e "${RED}❌ Failed to start Prometheus${NC}"
    cat "$log_file"
    return 1
  fi
  
  return 0
}

# Function to start Loki
start_loki() {
  local port=3100
  
  echo -e "${YELLOW}Starting Loki on port ${port}...${NC}"
  
  if ! check_port $port "Loki"; then
    echo "Skipping Loki - port already in use"
    return 0
  fi
  
  # Check if Loki is installed
  if ! command -v loki &> /dev/null; then
    echo -e "${YELLOW}⚠️  Loki is not installed${NC}"
    echo "Install with: brew install loki"
    return 0
  fi
  
  local log_file="${LOG_DIR}/loki.log"
  
  # Update Loki config to use local data dir
  sed "s|/tmp/loki|${DATA_DIR}/loki|g" "${MONITORING_DIR}/loki.yml" > "${LOG_DIR}/loki-local.yml"
  
  loki -config.file="${LOG_DIR}/loki-local.yml" \
    > "$log_file" 2>&1 &
  
  local pid=$!
  echo "$pid" > "${PID_FILE}/loki.pid"
  
  sleep 2
  
  if ps -p $pid > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Loki started (PID: $pid, Port: $port)${NC}"
  else
    echo -e "${YELLOW}⚠️  Loki may not have started properly${NC}"
  fi
  
  return 0
}

# Function to start Grafana
start_grafana() {
  local port=3500
  
  echo -e "${YELLOW}Starting Grafana on port ${port}...${NC}"
  
  if ! check_port $port "Grafana"; then
    echo "Skipping Grafana - port already in use"
    return 0
  fi
  
  # Check if Grafana is installed
  if ! command -v grafana-server &> /dev/null; then
    echo -e "${YELLOW}⚠️  Grafana is not installed${NC}"
    echo "Install with: brew install grafana"
    return 0
  fi
  
  local log_file="${LOG_DIR}/grafana.log"
  
  grafana-server \
    --config="${MONITORING_DIR}/grafana.ini" \
    --homepath /usr/local/opt/grafana/share/grafana \
    --datapath="${DATA_DIR}/grafana" \
    > "$log_file" 2>&1 &
  
  local pid=$!
  echo "$pid" > "${PID_FILE}/grafana.pid"
  
  sleep 3
  
  if ps -p $pid > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Grafana started (PID: $pid, Port: $port)${NC}"
    echo "   Access at: http://localhost:$port"
    echo "   Default login: admin/admin"
  else
    echo -e "${YELLOW}⚠️  Grafana may not have started properly${NC}"
    cat "$log_file"
  fi
  
  return 0
}

# Function to stop all services
stop_services() {
  echo -e "${YELLOW}Stopping monitoring stack...${NC}"
  
  for pid_file in ${PID_FILE}/*.pid; do
    if [ -f "$pid_file" ]; then
      local pid=$(cat "$pid_file")
      local service=$(basename "$pid_file" .pid)
      
      if ps -p $pid > /dev/null 2>&1; then
        kill $pid 2>/dev/null || true
        echo -e "${GREEN}✅ Stopped ${service} (PID: $pid)${NC}"
      fi
      
      rm -f "$pid_file"
    fi
  done
}

# Trap to ensure cleanup on exit
trap stop_services EXIT

# Main startup sequence
echo "Starting monitoring components..."
echo ""

# Start services
start_prometheus
start_loki
start_grafana

echo ""
echo -e "${GREEN}✅ Monitoring stack initialized!${NC}"
echo ""
echo "Access URLs:"
echo "  Prometheus:  http://localhost:9090"
echo "  Loki:        http://localhost:3100"
echo "  Grafana:     http://localhost:3500"
echo ""
echo "Next steps:"
echo "  1. Configure Prometheus datasource in Grafana (if not auto-configured)"
echo "  2. Add Loki as a datasource (http://localhost:3100)"
echo "  3. Create dashboards using the datasources"
echo ""
echo "Logs: $LOG_DIR"
echo "Data: $DATA_DIR"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"

# Keep script running
wait
