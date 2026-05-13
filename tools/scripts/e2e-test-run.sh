#!/bin/bash
#
# E2E Test Runner Script
#
# Usage:
#   ./tools/scripts/e2e-test-run.sh all          - Run all tests
#   ./tools/scripts/e2e-test-run.sh yolo         - YOLO mode (autonomous)
#   ./tools/scripts/e2e-test-run.sh parallel     - Parallel execution
#   ./tools/scripts/e2e-test-run.sh module auth  - Specific module
#   ./tools/scripts/e2e-test-run.sh debug        - Debug mode
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
BOOKING_ENGINE_DIR="$ROOT_DIR/apps/booking-engine"

cd "$BOOKING_ENGINE_DIR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}  TripAlfa E2E Test Runner${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

case "$1" in
  all)
    echo -e "${GREEN}Running all E2E tests...${NC}"
    node "$SCRIPT_DIR/e2e-test-runner.js" --all
    ;;
  
  yolo)
    echo -e "${YELLOW}YOLO Mode: Autonomous execution${NC}"
    echo -e "⚠️  No human intervention will be required"
    echo ""
    node "$SCRIPT_DIR/autonomous-agent.js" --all
    ;;
  
  parallel)
    echo -e "${GREEN}Running tests in parallel...${NC}"
    node "$SCRIPT_DIR/parallel-agent-executor.js"
    ;;
  
  sequential)
    echo -e "${GREEN}Running tests sequentially...${NC}"
    node "$SCRIPT_DIR/e2e-test-runner.js" --all
    ;;
  
  module)
    MODULE="${2:-auth}"
    echo -e "${GREEN}Running tests for module: ${BLUE}${MODULE}${NC}"
    node "$SCRIPT_DIR/autonomous-agent.js" "$MODULE"
    ;;
  
  debug)
    echo -e "${YELLOW}Debug mode enabled${NC}"
    pnpm test:e2e:debug
    ;;
  
  ui)
    echo -e "${YELLOW}UI mode enabled${NC}"
    pnpm test:e2e:ui
    ;;
  
  report)
    echo -e "${GREEN}Opening test report...${NC}"
    pnpm test:e2e:report
    ;;
  
  smoke)
    echo -e "${GREEN}Running smoke tests...${NC}"
    pnpm test:e2e:smoke
    ;;
  
  ci)
    echo -e "${GREEN}Running in CI mode...${NC}"
    pnpm test:e2e:ci
    ;;
  
  auth)
    echo -e "${GREEN}Running authentication tests...${NC}"
    pnpm test:e2e -- tests/e2e/auth/*.spec.ts
    ;;
  
  flights)
    echo -e "${GREEN}Running flight tests...${NC}"
    pnpm test:e2e -- tests/e2e/flights/*.spec.ts
    ;;
  
  hotels)
    echo -e "${GREEN}Running hotel tests...${NC}"
    pnpm test:e2e -- tests/e2e/hotels/*.spec.ts
    ;;
  
  bookings)
    echo -e "${GREEN}Running booking tests...${NC}"
    pnpm test:e2e -- tests/e2e/bookings/*.spec.ts
    ;;
  
  *)
    echo "Usage:"
    echo "  ./tools/scripts/e2e-test-run.sh all"
    echo "  ./tools/scripts/e2e-test-run.sh yolo"
    echo "  ./tools/scripts/e2e-test-run.sh parallel"
    echo "  ./tools/scripts/e2e-test-run.sh sequential"
    echo "  ./tools/scripts/e2e-test-run.sh module <module_name>"
    echo "  ./tools/scripts/e2e-test-run.sh debug"
    echo "  ./tools/scripts/e2e-test-run.sh ui"
    echo "  ./tools/scripts/e2e-test-run.sh report"
    echo "  ./tools/scripts/e2e-test-run.sh smoke"
    echo "  ./tools/scripts/e2e-test-run.sh ci"
    echo "  ./tools/scripts/e2e-test-run.sh auth"
    echo "  ./tools/scripts/e2e-test-run.sh flights"
    echo "  ./tools/scripts/e2e-test-run.sh hotels"
    echo "  ./tools/scripts/e2e-test-run.sh bookings"
    echo ""
    echo "Modules: auth, flights, hotels, bookings, profile,"
    echo "         dashboard, loyalty, wallet, navigation,"
    echo "         forms, components, api"
    exit 1
    ;;
esac

echo ""
echo -e "${BLUE}============================================${NC}"
echo -e "${GREEN}Test execution completed${NC}"
echo -e "${BLUE}============================================${NC}"
