#!/bin/bash
#
# Verify E2E Testing Setup
# This script checks if all required files and configurations are in place
#

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}  E2E Testing Setup Verification${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

cd /Users/mohamedrizwan/Desktop/TripAlfa\ -\ Node

ERRORS=0

# Check required scripts
echo "Checking required scripts..."
SCRIPTS=(
  "tools/scripts/e2e-test-runner.js"
  "tools/scripts/e2e-orchestrator.js"
  "tools/scripts/parallel-agent-executor.js"
  "tools/scripts/autonomous-agent.js"
  "tools/scripts/e2e.config.js"
  "tools/scripts/master-orchestrator.js"
  "tools/scripts/e2e-test-run.sh"
)

for script in "${SCRIPTS[@]}"; do
  if [ -f "$script" ]; then
    echo -e "${GREEN}✓${NC} $script"
  else
    echo -e "${RED}✗${NC} $script (MISSING)"
    ((ERRORS++))
  fi
done

echo ""
echo "Checking documentation..."
DOCS=(
  "tools/scripts/README.md"
  "docs/E2E_TESTING.md"
  "docs/TEST_EXECUTION_PLAN.md"
  "docs/TEST_QUICKSTART.md"
  "E2E_TESTING_SETUP.md"
)

for doc in "${DOCS[@]}"; do
  if [ -f "$doc" ]; then
    echo -e "${GREEN}✓${NC} $doc"
  else
    echo -e "${RED}✗${NC} $doc (MISSING)"
    ((ERRORS++))
  fi
done

echo ""
echo "Checking test modules..."
MODULES=(
  "apps/booking-engine/tests/e2e/auth"
  "apps/booking-engine/tests/e2e/flights"
  "apps/booking-engine/tests/e2e/hotels"
  "apps/booking-engine/tests/e2e/bookings"
  "apps/booking-engine/tests/e2e/profile"
  "apps/booking-engine/tests/e2e/dashboard"
)

for module in "${MODULES[@]}"; do
  if [ -d "$module" ]; then
    echo -e "${GREEN}✓${NC} $module"
  else
    echo -e "${RED}✗${NC} $module (MISSING)"
    ((ERRORS++))
  fi
done

echo ""
echo "Checking Playwright configuration..."
if [ -f "apps/booking-engine/playwright.config.ts" ]; then
  echo -e "${GREEN}✓${NC} apps/booking-engine/playwright.config.ts"
else
  echo -e "${RED}✗${NC} apps/booking-engine/playwright.config.ts (MISSING)"
  ((ERRORS++))
fi

echo ""
echo "Checking package.json scripts..."
if grep -q "test:e2e:yolo" apps/booking-engine/package.json; then
  echo -e "${GREEN}✓${NC} test:e2e:yolo script"
else
  echo -e "${RED}✗${NC} test:e2e:yolo script (MISSING)"
  ((ERRORS++))
fi

if grep -q "test:e2e:all" package.json; then
  echo -e "${GREEN}✓${NC} test:e2e:all script"
else
  echo -e "${RED}✗${NC} test:e2e:all script (MISSING)"
  ((ERRORS++))
fi

echo ""
echo "============================================"
if [ $ERRORS -eq 0 ]; then
  echo -e "${GREEN}✓ All checks passed!${NC}"
  echo ""
  echo -e "${BLUE}Quick Start:${NC}"
  echo "  pnpm test:e2e:yolo     # Run all tests (YOLO mode)"
  echo "  pnpm test:e2e:all      # Run all tests (sequential)"
  echo "  pnpm test:e2e:parallel # Run tests in parallel"
  echo "  pnpm test:e2e:report   # View reports"
  echo ""
  exit 0
else
  echo -e "${RED}✗ $ERRORS check(s) failed${NC}"
  exit 1
fi
