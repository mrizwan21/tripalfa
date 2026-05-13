#!/bin/bash
# Autonomous Agent Deployment Script - YOLO Mode
# Deploys all test agents without manual intervention

set -e

echo "🚀 Deploying Autonomous Test Agents - YOLO Mode"
echo "==============================================="
echo ""

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

# Function to deploy an agent
deploy_agent() {
  local agent_name=$1
  local app_name=$2
  local port=$3
  
  echo "🤖 Deploying $agent_name for $app_name on port $port..."
  
  # Start the app in background
  cd "apps/$app_name"
  pnpm run dev --port $port &
  local app_pid=$!
  
  # Wait for app to start
  sleep 5
  
  # Run tests
  cd "$ROOT_DIR"
  npx playwright test "e2e-tests/agents/$agent_name.ts" \
    --config=e2e-tests/playwright.config.ts \
    --headed \
    --workers=2 \
    --reporter=list
  
  # Cleanup
  kill $app_pid 2>/dev/null || true
}

# Deploy all agents in parallel
echo "Starting autonomous deployment..."
echo ""

# Agent 1: Booking Engine
deploy_agent "agent-booking" "booking-engine" 5173 &

# Agent 2: B2B Portal
deploy_agent "agent-b2b" "b2b-portal" 5174 &

# Agent 3: Call Center
deploy_agent "agent-callcenter" "call-center-portal" 5175 &

# Agent 4: Super Admin
deploy_agent "agent-admin" "super-admin-portal" 5176 &

# Wait for all agents to complete
wait

echo ""
echo "==============================================="
echo "✅ All autonomous agents completed"
echo "==============================================="
