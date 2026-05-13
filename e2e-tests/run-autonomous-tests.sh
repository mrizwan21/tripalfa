#!/bin/bash
# Autonomous Test Execution Script - YOLO Mode
# Executes all test agents in parallel without manual intervention

set -e

echo "🚀 Starting Autonomous Test Execution - YOLO Mode"
echo "==================================================\n"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

# Configuration
export AUTONOMOUS_MODE=true
export YOLO_MODE=true
export CI=false
export HEADED=true

# Create results directory
mkdir -p test-results

# Start all agents in parallel
echo "📡 Deploying Test Agents..."
echo ""

# Agent 1: Booking Engine
echo "🤖 Agent Booking: Starting..."
npx playwright test agents/agent-booking.ts --config=playwright.config.ts --headed &
PID_BOOKING=$!

# Agent 2: B2B Portal
echo "🤖 Agent B2B: Starting..."
npx playwright test agents/agent-b2b.ts --config=playwright.config.ts --headed &
PID_B2B=$!

# Agent 3: Call Center
echo "🤖 Agent CallCenter: Starting..."
npx playwright test agents/agent-callcenter.ts --config=playwright.config.ts --headed &
PID_CALLCENTER=$!

# Agent 4: Super Admin
echo "🤖 Agent Admin: Starting..."
npx playwright test agents/agent-admin.ts --config=playwright.config.ts --headed &
PID_ADMIN=$!

echo ""
echo "✅ All agents deployed"
echo "⏳ Waiting for test completion..."
echo ""

# Wait for all agents to complete
wait $PID_BOOKING && echo "✅ Agent Booking: Complete" || echo "❌ Agent Booking: Failed"
wait $PID_B2B && echo "✅ Agent B2B: Complete" || echo "❌ Agent B2B: Failed"
wait $PID_CALLCENTER && echo "✅ Agent CallCenter: Complete" || echo "❌ Agent CallCenter: Failed"
wait $PID_ADMIN && echo "✅ Agent Admin: Complete" || echo "❌ Agent Admin: Failed"

echo ""
echo "=================================================="
echo "📊 Autonomous Test Execution Complete"
echo "=================================================="
echo ""
echo "📝 Reports available at:"
echo "   HTML: $ROOT_DIR/test-results/index.html"
echo "   Screenshots: $ROOT_DIR/test-results/screenshots/"
echo "   Videos: $ROOT_DIR/test-results/videos/"
echo ""
echo "✅ All autonomous agents have completed execution"
