#!/bin/bash

# TripAlfa Integration Test Runner
# Runs integration tests across all services
# Usage: bash scripts/test-integration.sh [options]

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
WORKSPACE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPORT_DIR="${WORKSPACE_DIR}/.reports"
TEST_LOG="${WORKSPACE_DIR}/.logs/test-integration.log"
PROFILE="standard"
GENERATE_REPORT=true

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --profile=*)
      PROFILE="${1#*=}"
      shift
      ;;
    --no-report)
      GENERATE_REPORT=false
      shift
      ;;
    --help)
      echo "Usage: bash scripts/test-integration.sh [options]"
      echo ""
      echo "Options:"
      echo "  --profile=<name>    Test profile: fast, standard, comprehensive (default: standard)"
      echo "  --no-report         Don't generate HTML report"
      echo "  --help              Show this help message"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Create report directory
mkdir -p "$REPORT_DIR"
mkdir -p "$(dirname "$TEST_LOG")"

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}🧪 TripAlfa Integration Test Suite${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo "Profile: $PROFILE"
echo "Workspace: $WORKSPACE_DIR"
echo "Reports: $REPORT_DIR"
echo ""

# Step 1: Pre-flight checks
echo -e "${BLUE}Step 1: Pre-flight Checks${NC}"
echo "─────────────────────────────────────────────────────────"

# Check if services are running
echo -n "Checking service availability... "
if timeout 5 curl -s http://localhost:3000/health > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Ready${NC}"
else
  echo -e "${RED}❌ API Gateway not running${NC}"
  echo ""
  echo "Start services first:"
  echo "  bash scripts/start-local-dev.sh"
  exit 1
fi

# Check environment
echo -n "Checking environment configuration... "
if [ -f .env.local ]; then
  echo -e "${GREEN}✅ .env.local found${NC}"
else
  echo -e "${YELLOW}⚠️  .env.local not found (using defaults)${NC}"
fi

echo ""

# Step 2: Run tests by profile
echo -e "${BLUE}Step 2: Running Tests ($PROFILE profile)${NC}"
echo "─────────────────────────────────────────────────────────"

TEST_SERVICES=()
case $PROFILE in
  fast)
    # Only test core services
    TEST_SERVICES=("booking-service" "user-service" "payment-service")
    ;;
  standard)
    # Test main services
    TEST_SERVICES=("booking-service" "user-service" "payment-service" "api-gateway")
    ;;
  comprehensive)
    # Test all services
    TEST_SERVICES=(
      "booking-service"
      "user-service"
      "payment-service"
      "api-gateway"
      "organization-service"
      "wallet-service"
      "notification-service"
      "rule-engine-service"
    )
    ;;
esac

TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
FAILED_SERVICES=()

for service in "${TEST_SERVICES[@]}"; do
  echo ""
  echo -e "Testing ${YELLOW}${service}${NC}..."
  
  if [ -d "services/$service/tests/integration" ] || [ -d "apps/$service/tests/integration" ]; then
    # Determine the workspace directory
    if [ -d "services/$service" ]; then
      workspace="services/$service"
    else
      workspace="apps/$service"
    fi
    
    echo "  Running: pnpm --dir $workspace test:integration 2>&1 | tee -a $TEST_LOG"
    
    # Run tests
    if pnpm --dir "$workspace" test:integration 2>&1 | tee -a "$TEST_LOG"; then
      echo -e "  ${GREEN}✅ Passed${NC}"
      ((PASSED_TESTS++))
    else
      echo -e "  ${RED}❌ Failed${NC}"
      ((FAILED_TESTS++))
      FAILED_SERVICES+=("$service")
    fi
    ((TOTAL_TESTS++))
  else
    echo -e "  ${YELLOW}⊘ No tests found${NC}"
  fi
done

echo ""

# Step 3: Generate report
if [ "$GENERATE_REPORT" = true ]; then
  echo -e "${BLUE}Step 3: Generating Reports${NC}"
  echo "─────────────────────────────────────────────────────────"
  
  # Create JSON report
  cat > "${REPORT_DIR}/test-results.json" << EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "profile": "$PROFILE",
  "summary": {
    "total": $TOTAL_TESTS,
    "passed": $PASSED_TESTS,
    "failed": $FAILED_TESTS
  },
  "services": [
EOF

  for service in "${TEST_SERVICES[@]}"; do
    if [[ " ${FAILED_SERVICES[@]} " =~ " ${service} " ]]; then
      status="failed"
    else
      status="passed"
    fi
    echo "    {\"service\": \"$service\", \"status\": \"$status\"}," >> "${REPORT_DIR}/test-results.json"
  done

  # Remove trailing comma and close JSON
  sed -i '$ s/,$//' "${REPORT_DIR}/test-results.json"
  echo "  ]" >> "${REPORT_DIR}/test-results.json"
  echo "}" >> "${REPORT_DIR}/test-results.json"

  echo "JSON Report: ${REPORT_DIR}/test-results.json"

  # Create HTML report
  cat > "${REPORT_DIR}/test-report.html" << 'EOF'
<!DOCTYPE html>
<html>
<head>
  <title>TripAlfa Integration Test Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background: #f5f5f5;
      padding: 20px;
    }
    .container { max-width: 1000px; margin: 0 auto; }
    .header {
      background: white;
      padding: 30px;
      border-radius: 8px;
      margin-bottom: 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .header h1 { color: #333; margin-bottom: 10px; }
    .summary {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin-top: 20px;
    }
    .stat {
      padding: 15px;
      border-radius: 6px;
      text-align: center;
    }
    .stat.total { background: #e3f2fd; }
    .stat.passed { background: #e8f5e9; }
    .stat.failed { background: #ffebee; }
    .stat h3 { font-size: 28px; margin-bottom: 5px; }
    .stat p { font-size: 14px; color: #666; }
    .services {
      background: white;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .service-item {
      padding: 15px;
      border-bottom: 1px solid #eee;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .service-item:last-child { border-bottom: none; }
    .status {
      padding: 5px 12px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: bold;
    }
    .status.passed { background: #e8f5e9; color: #2e7d32; }
    .status.failed { background: #ffebee; color: #c62828; }
    .footer {
      text-align: center;
      padding: 20px;
      color: #999;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🧪 TripAlfa Integration Test Report</h1>
      <div class="summary">
        <div class="stat total">
          <h3 id="total">0</h3>
          <p>Total Tests</p>
        </div>
        <div class="stat passed">
          <h3 id="passed">0</h3>
          <p>Passed</p>
        </div>
        <div class="stat failed">
          <h3 id="failed">0</h3>
          <p>Failed</p>
        </div>
      </div>
    </div>
    <div class="services" id="services"></div>
    <div class="footer">
      Generated at <span id="timestamp"></span>
    </div>
  </div>
  <script>
    // Load test results from JSON
    fetch('./test-results.json')
      .then(r => r.json())
      .then(data => {
        document.getElementById('total').textContent = data.summary.total;
        document.getElementById('passed').textContent = data.summary.passed;
        document.getElementById('failed').textContent = data.summary.failed;
        document.getElementById('timestamp').textContent = data.timestamp;
        
        const servicesHtml = data.services.map(s =>
          `<div class="service-item">
            <span>${s.service}</span>
            <span class="status ${s.status}">${s.status.toUpperCase()}</span>
          </div>`
        ).join('');
        
        document.getElementById('services').innerHTML = servicesHtml;
      });
  </script>
</body>
</html>
EOF

  echo "HTML Report: ${REPORT_DIR}/test-report.html"
fi

echo ""

# Step 4: Summary
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}📊 Test Results Summary${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "Total Services Tested:  $TOTAL_TESTS"
echo -e "Tests Passed:           ${GREEN}${PASSED_TESTS}${NC}"
echo -e "Tests Failed:           ${RED}${FAILED_TESTS}${NC}"
echo ""

if [ ${#FAILED_SERVICES[@]} -gt 0 ]; then
  echo -e "${RED}Failed Services:${NC}"
  for service in "${FAILED_SERVICES[@]}"; do
    echo "  - $service"
  done
  echo ""
fi

# Determine exit code
if [ $FAILED_TESTS -eq 0 ]; then
  echo -e "${GREEN}✅ All integration tests passed!${NC}"
  echo ""
  echo "Next steps:"
  echo "1. Review test report: open ${REPORT_DIR}/test-report.html"
  echo "2. Check test logs: tail -f ${TEST_LOG}"
  echo "3. Deploy services to staging"
  exit 0
else
  echo -e "${RED}❌ Some tests failed. Review logs and fix issues.${NC}"
  echo ""
  echo "Troubleshooting:"
  echo "1. Check test logs: tail -f ${TEST_LOG}"
  echo "2. Review failing service logs: tail -f .logs/*.log"
  echo "3. Run health checks: bash scripts/health-check.sh"
  echo "4. Restart all services: bash scripts/start-local-dev.sh"
  exit 1
fi
