#!/bin/bash

#######################################################################
# Resend Email Integration Verification Script
# Validates all components of the Resend email setup
#######################################################################

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
GRAY='\033[0;37m'
NC='\033[0m'

# Counters
PASSED=0
FAILED=0
WARNED=0

# Configuration
WEBHOOK_HOST="${WEBHOOK_HOST:-localhost}"
WEBHOOK_PORT="${WEBHOOK_PORT:-9094}"
ALERTMANAGER_HOST="${ALERTMANAGER_HOST:-localhost}"
ALERTMANAGER_PORT="${ALERTMANAGER_PORT:-9093}"
PROMETHEUS_HOST="${PROMETHEUS_HOST:-localhost}"
PROMETHEUS_PORT="${PROMETHEUS_PORT:-9090}"

#######################################################################
# Logging Functions
#######################################################################

log_pass() {
  echo -e "${GREEN}[✓ PASS]${NC} $1"
  ((PASSED++))
}

log_fail() {
  echo -e "${RED}[✗ FAIL]${NC} $1"
  ((FAILED++))
}

log_warn() {
  echo -e "${YELLOW}[!]${NC} $1"
  ((WARNED++))
}

log_info() {
  echo -e "${BLUE}[i]${NC} $1"
}

log_detail() {
  echo -e "${GRAY}    $1${NC}"
}

#######################################################################
# Verification Tests
#######################################################################

# Test 1: Check environment variables
test_environment_variables() {
  echo ""
  echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}Test 1: Environment Variables${NC}"
  echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"

  if [ -z "$RESEND_API_KEY" ]; then
    log_fail "RESEND_API_KEY not set"
    return 1
  fi

  if [ ${#RESEND_API_KEY} -lt 10 ]; then
    log_fail "RESEND_API_KEY appears invalid (too short)"
    return 1
  fi

  log_pass "RESEND_API_KEY is set"
  log_detail "Value: ${RESEND_API_KEY:0:10}..."

  # Optional configs
  if [ -z "$FROM_EMAIL" ]; then
    log_warn "FROM_EMAIL not set (will use default: alerts@tripalfa.com)"
  else
    log_pass "FROM_EMAIL configured: $FROM_EMAIL"
  fi

  if [ -z "$CRITICAL_ALERT_EMAIL" ]; then
    log_warn "CRITICAL_ALERT_EMAIL not set"
  else
    log_pass "CRITICAL_ALERT_EMAIL configured: $CRITICAL_ALERT_EMAIL"
  fi

  return 0
}

# Test 2: Check file existence
test_required_files() {
  echo ""
  echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}Test 2: Required Files${NC}"
  echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"

  local files=(
    "infrastructure/monitoring/alertmanager.yml"
    "services/alerting-service/src/resend-webhook-bridge.ts"
    "docs/RESEND_EMAIL_NOTIFICATIONS.md"
  )

  for file in "${files[@]}"; do
    if [ -f "$file" ]; then
      log_pass "File exists: $file"
      local lines=$(wc -l < "$file")
      log_detail "    Lines: $lines"
    else
      log_fail "File missing: $file"
    fi
  done
}

# Test 3: Verify webhook bridge is running locally
test_webhook_bridge_running() {
  echo ""
  echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}Test 3: Webhook Bridge Process Status${NC}"
  echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"

  if pgrep -f "dev:webhook" > /dev/null || pgrep -f "resend-webhook-bridge" > /dev/null; then
    log_pass "Webhook bridge process is running"
  else
    log_fail "Webhook bridge process is not running"
    log_info "Start with: npm run dev:webhook --workspace=@tripalfa/notification-service"
    return 1
  fi
}

# Test 4: Check webhook health endpoint
test_webhook_health() {
  echo ""
  echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}Test 4: Webhook Bridge Health Check${NC}"
  echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"

  local health_url="http://${WEBHOOK_HOST}:${WEBHOOK_PORT}/health"
  local response=$(curl -s -w "\n%{http_code}" "$health_url" 2>/dev/null || echo "000")
  local http_code=$(echo "$response" | tail -n1)
  local body=$(echo "$response" | head -n-1)

  if [ "$http_code" = "200" ]; then
    log_pass "Webhook bridge health check passed (HTTP $http_code)"
    if echo "$body" | grep -q "ok"; then
      log_detail "Status: ok"
    fi
  else
    log_fail "Webhook bridge health check failed (HTTP $http_code)"
    log_detail "Response: $body"
    return 1
  fi
}

# Test 5: Verify Resend API connectivity
test_resend_api() {
  echo ""
  echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}Test 5: Resend API Connectivity${NC}"
  echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"

  local response=$(curl -s -w "\n%{http_code}" -X GET \
    "https://api.resend.com/api-keys" \
    -H "Authorization: Bearer ${RESEND_API_KEY}" 2>/dev/null || echo "000")
  
  local http_code=$(echo "$response" | tail -n1)
  local body=$(echo "$response" | head -n-1)

  if [ "$http_code" = "200" ]; then
    log_pass "Resend API authentication successful (HTTP $http_code)"
    
    # Parse number of keys
    if command -v jq &> /dev/null; then
      local num_keys=$(echo "$body" | jq '.data | length' 2>/dev/null || echo "?")
      log_detail "API keys in account: $num_keys"
    fi
  else
    log_fail "Resend API authentication failed (HTTP $http_code)"
    log_detail "Response: $body"
    return 1
  fi
}

# Test 6: Check AlertManager configuration
test_alertmanager_config() {
  echo ""
  echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}Test 6: AlertManager Configuration${NC}"
  echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"

  local config_file="infrastructure/monitoring/alertmanager.yml"

  if [ ! -f "$config_file" ]; then
    log_fail "AlertManager config not found"
    return 1
  fi

  # Check for webhook configs
  if grep -q "webhook_configs" "$config_file"; then
    log_pass "Webhook configs found in AlertManager"
    
    local count=$(grep -c "webhook_configs" "$config_file" || true)
    log_detail "Webhook config blocks: $count"
  else
    log_fail "No webhook_configs found in AlertManager config"
    return 1
  fi

  # Check for webhook URLs
  if grep -q "localhost:${WEBHOOK_PORT}/resend" "$config_file"; then
    log_pass "Webhook URLs configured correctly"
    local urls=$(grep "localhost:${WEBHOOK_PORT}/resend" "$config_file" | wc -l)
    log_detail "Webhook URLs configured: $urls"
  else
    log_fail "Webhook URLs not found or misconfigured"
    return 1
  fi

  # Check for SMTP (should be removed)
  if grep -q "smtp_from" "$config_file" && [ -z "$ALLOW_SMTP" ]; then
    log_warn "SMTP configuration still present (should be removed)"
  else
    log_pass "SMTP configuration not present (good)"
  fi
}

# Test 7: AlertManager connectivity
test_alertmanager_running() {
  echo ""
  echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}Test 7: AlertManager Service Status${NC}"
  echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"

  local health_url="http://${ALERTMANAGER_HOST}:${ALERTMANAGER_PORT}/-/healthy"
  local response=$(curl -s -w "\n%{http_code}" "$health_url" 2>/dev/null || echo "000")
  local http_code=$(echo "$response" | tail -n1)

  if [ "$http_code" = "200" ]; then
    log_pass "AlertManager is running and healthy"
  else
    log_fail "AlertManager health check failed (HTTP $http_code)"
    log_info "AlertManager may not be running or unreachable at ${ALERTMANAGER_HOST}:${ALERTMANAGER_PORT}"
    return 1
  fi
}

# Test 8: Verify webhook bridge logs (system)
test_webhook_logs() {
  echo ""
  echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}Test 8: Webhook Bridge Logs${NC}"
  echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"

  log_info "Skipping log check (log analysis requires explicit log file path for local processes)"
}

# Test 9: Port availability
test_ports() {
  echo ""
  echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}Test 9: Port Availability${NC}"
  echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"

  # Check webhook port
  if command -v netstat &> /dev/null; then
    if netstat -tuln 2>/dev/null | grep -q ":${WEBHOOK_PORT}"; then
      log_pass "Port ${WEBHOOK_PORT} is in use (webhook bridge)"
    else
      log_warn "Port ${WEBHOOK_PORT} is not in use (webhook bridge may not be running)"
    fi
  elif command -v ss &> /dev/null; then
    if ss -tuln 2>/dev/null | grep -q ":${WEBHOOK_PORT}"; then
      log_pass "Port ${WEBHOOK_PORT} is in use (webhook bridge)"
    else
      log_warn "Port ${WEBHOOK_PORT} is not in use (webhook bridge may not be running)"
    fi
  else
    log_warn "Cannot check port status (no netstat/ss available)"
  fi

  # Check if ports are accessible
  if timeout 2 bash -c "cat < /dev/null > /dev/tcp/${WEBHOOK_HOST}/${WEBHOOK_PORT}" 2>/dev/null; then
    log_pass "Port ${WEBHOOK_PORT} is accessible"
  else
    log_fail "Port ${WEBHOOK_PORT} is not accessible"
  fi
}

# Test 10: Process configuration
test_process_config() {
  echo ""
  echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}Test 10: Local Process Configuration${NC}"
  echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"

  if [ -f "package.json" ]; then
    log_pass "Root package.json exists"
  else
    log_fail "Root package.json missing"
  fi
}

#######################################################################
# Summary Report
#######################################################################

print_summary() {
  echo ""
  echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}Summary Report${NC}"
  echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"

  echo ""
  echo -e "  ${GREEN}Passed${NC}:  $PASSED"
  echo -e "  ${RED}Failed${NC}:  $FAILED"
  echo -e "  ${YELLOW}Warned${NC}:  $WARNED"
  echo ""

  if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All critical checks passed!${NC}"
    echo ""
    echo "Resend integration is ready for use."
    return 0
  else
    echo -e "${RED}✗ Some checks failed. Please review above.${NC}"
    echo ""
    echo "Resend integration needs attention."
    return 1
  fi
}

#######################################################################
# Main Execution
#######################################################################

main() {
  clear
  
  cat << EOF
${GREEN}╔═══════════════════════════════════════════════════════${NC}
${GREEN}║  Resend Email Integration Verification Script        ${NC}
${GREEN}║  TripAlfa Email Notifications Setup                  ${NC}
${GREEN}╚═══════════════════════════════════════════════════════${NC}
EOF

  echo ""
  echo "Running verification tests..."
  echo ""

  # Run all tests
  test_environment_variables
  test_required_files
  test_webhook_bridge_running
  test_webhook_health
  test_resend_api
  test_alertmanager_config
  test_alertmanager_running
  test_webhook_logs
  test_ports
  test_process_config

  # Print summary
  print_summary
  
  # Return appropriate exit code
  if [ $FAILED -eq 0 ]; then
    exit 0
  else
    exit 1
  fi
}

# Run main
main "$@"
