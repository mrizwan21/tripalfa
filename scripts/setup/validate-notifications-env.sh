#!/usr/bin/env bash

###############################################################################
# Phase 4 Notification System - Environment Configuration Validator
#
# Purpose: Verify all notification system environment variables and 
#          credentials are properly configured before deployment
#
# Usage: chmod +x validate-notifications-env.sh
#        ./validate-notifications-env.sh
#
###############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
CHECKS_TOTAL=0
CHECKS_PASSED=0
CHECKS_FAILED=0
CHECKS_WARNING=0

# Results
declare -a FAILED_CHECKS
declare -a WARNING_CHECKS

###############################################################################
# Helper Functions
###############################################################################

print_header() {
  echo -e "\n${BLUE}════════════════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}\n"
}

print_section() {
  echo -e "\n${BLUE}→ $1${NC}\n"
}

check_pass() {
  echo -e "${GREEN}✓${NC} $1"
  ((CHECKS_PASSED++))
  ((CHECKS_TOTAL++))
}

check_fail() {
  echo -e "${RED}✗${NC} $1"
  ((CHECKS_FAILED++))
  ((CHECKS_TOTAL++))
  FAILED_CHECKS+=("$1")
}

check_warn() {
  echo -e "${YELLOW}⚠${NC} $1"
  ((CHECKS_WARNING++))
  ((CHECKS_TOTAL++))
  WARNING_CHECKS+=("$1")
}

check_env() {
  if [ -z "${!1}" ]; then
    check_fail "Missing required environment variable: $1"
    return 1
  else
    check_pass "Environment variable set: $1"
    return 0
  fi
}

check_file_exists() {
  if [ ! -f "$1" ]; then
    check_fail "File not found: $1"
    return 1
  else
    check_pass "File exists: $1"
    return 0
  fi
}

test_connection() {
  local url=$1
  local timeout=${2:-5}
  
  if timeout $timeout bash -c "echo >/dev/tcp/$url/443" 2>/dev/null; then
    check_pass "Connection successful to $url"
    return 0
  else
    check_warn "Cannot connect to $url (may fail if no internet or host is down)"
    return 0
  fi
}

###############################################################################
# Validation Checks
###############################################################################

validate_database() {
  print_section "Database Configuration"
  
  check_env "DATABASE_URL" && {
    if [[ $DATABASE_URL == postgresql://* ]]; then
      check_pass "DATABASE_URL format is valid"
    else
      check_fail "DATABASE_URL format invalid (must start with postgresql://)"
    fi
  }
}

validate_email() {
  print_section "Email Configuration"
  
  # Check if any email provider is configured
  if [ -z "$EMAIL_HOST" ] && [ -z "$SENDGRID_API_KEY" ] && [ -z "$AWS_SES_REGION" ] && [ -z "$MAILGUN_API_KEY" ]; then
    check_warn "No email provider configured (SMTP/SendGrid/AWS SES/Mailgun)"
  else
    check_pass "At least one email provider configured"
  fi
  
  # SMTP Configuration
  if [ ! -z "$EMAIL_HOST" ]; then
    check_pass "SMTP_HOST configured: $EMAIL_HOST"
    check_env "EMAIL_PORT"
    check_env "EMAIL_USER"
    check_env "EMAIL_PASS"
    check_env "EMAIL_FROM"
  fi
  
  # SendGrid Configuration
  if [ ! -z "$SENDGRID_API_KEY" ]; then
    check_pass "SendGrid API key configured"
    check_env "SENDGRID_FROM_EMAIL"
  fi
  
  # AWS SES Configuration
  if [ ! -z "$AWS_SES_REGION" ]; then
    check_pass "AWS SES region configured: $AWS_SES_REGION"
    check_env "AWS_ACCESS_KEY_ID"
    check_env "AWS_SECRET_ACCESS_KEY"
  fi
  
  # Mailgun Configuration
  if [ ! -z "$MAILGUN_API_KEY" ]; then
    check_pass "Mailgun API key configured"
    check_env "MAILGUN_DOMAIN"
    check_env "MAILGUN_FROM_EMAIL"
  fi
}

validate_sms() {
  print_section "SMS Configuration"
  
  # Check if any SMS provider is configured
  if [ -z "$TWILIO_ACCOUNT_SID" ] && [ -z "$AWS_SNS_REGION" ] && [ -z "$VONAGE_API_KEY" ]; then
    check_warn "No SMS provider configured (Twilio/AWS SNS/Vonage)"
  else
    check_pass "At least one SMS provider configured"
  fi
  
  # Twilio Configuration
  if [ ! -z "$TWILIO_ACCOUNT_SID" ]; then
    check_pass "Twilio account SID configured"
    check_env "TWILIO_AUTH_TOKEN"
    check_env "TWILIO_FROM_NUMBER"
    
    # Validate phone number format
    if [[ $TWILIO_FROM_NUMBER =~ ^\+?[1-9]\d{1,14}$ ]]; then
      check_pass "Twilio phone number format valid: $TWILIO_FROM_NUMBER"
    else
      check_warn "Twilio phone number format may be invalid: $TWILIO_FROM_NUMBER"
    fi
  fi
  
  # AWS SNS Configuration
  if [ ! -z "$AWS_SNS_REGION" ]; then
    check_pass "AWS SNS region configured: $AWS_SNS_REGION"
    check_env "AWS_ACCESS_KEY_ID"
    check_env "AWS_SECRET_ACCESS_KEY"
  fi
  
  # Vonage Configuration
  if [ ! -z "$VONAGE_API_KEY" ]; then
    check_pass "Vonage API key configured"
    check_env "VONAGE_API_SECRET"
    check_env "VONAGE_BRAND_NAME"
  fi
}

validate_push() {
  print_section "Push Notification Configuration"
  
  # Check if push is configured
  if [ -z "$VAPID_PUBLIC_KEY" ] && [ -z "$FIREBASE_PROJECT_ID" ]; then
    check_warn "No push provider configured (Web Push/Firebase)"
  else
    check_pass "At least one push provider configured"
  fi
  
  # Web Push Configuration
  if [ ! -z "$VAPID_PUBLIC_KEY" ]; then
    check_pass "VAPID public key configured"
    check_env "VAPID_PRIVATE_KEY"
    check_env "VAPID_SUBJECT"
    
    # Validate VAPID key format
    if [ ${#VAPID_PUBLIC_KEY} -lt 50 ]; then
      check_warn "VAPID public key seems too short (usually 87+ chars)"
    else
      check_pass "VAPID public key length acceptable"
    fi
  fi
  
  # Firebase Configuration
  if [ ! -z "$FIREBASE_PROJECT_ID" ]; then
    check_pass "Firebase project ID configured: $FIREBASE_PROJECT_ID"
    check_env "FIREBASE_PRIVATE_KEY"
    check_env "FIREBASE_CLIENT_EMAIL"
  fi
}

validate_frontend() {
  print_section "Frontend Configuration"
  
  check_env "REACT_APP_API_URL" || {
    check_warn "REACT_APP_API_URL not set, will use default localhost:3001"
  }
  
  check_env "REACT_APP_WS_URL" || {
    check_warn "REACT_APP_WS_URL not set, will use http protocol for WebSocket"
  }
  
  if [ ! -z "$REACT_APP_API_URL" ]; then
    if [[ $REACT_APP_API_URL == http* ]]; then
      check_pass "REACT_APP_API_URL format valid"
    else
      check_fail "REACT_APP_API_URL format invalid (must start with http/https)"
    fi
  fi
  
  if [ ! -z "$REACT_APP_WS_URL" ]; then
    if [[ $REACT_APP_WS_URL == ws* ]]; then
      check_pass "REACT_APP_WS_URL format valid"
    else
      check_fail "REACT_APP_WS_URL format invalid (must start with ws/wss)"
    fi
  fi
}

validate_backend() {
  print_section "Backend Configuration"
  
  check_env "NODE_ENV" || {
    check_warn "NODE_ENV not set, will default to 'development'"
  }
  
  check_env "JWT_SECRET" || {
    check_fail "JWT_SECRET not set (required for authentication)"
  }
  
  check_env "JWT_EXPIRE" || {
    check_warn "JWT_EXPIRE not set, will use default (7d)"
  }
  
  check_env "API_PORT" || {
    check_warn "API_PORT not set, will use default (3001)"
  }
  
  check_env "WS_PORT" || {
    check_warn "WS_PORT not set, will use default (3002)"
  }
}

validate_security() {
  print_section "Security Configuration"
  
  # Check for required security headers
  check_env "CORS_ORIGIN" || {
    check_warn "CORS_ORIGIN not set, may default to localhost"
  }
  
  # Check rate limiting
  check_env "RATE_LIMIT_WINDOW_MS" || {
    check_warn "RATE_LIMIT_WINDOW_MS not set, will use default"
  }
  
  check_env "RATE_LIMIT_MAX_REQUESTS" || {
    check_warn "RATE_LIMIT_MAX_REQUESTS not set, will use default"
  }
  
  # Check encryption
  if [ ! -z "$ENCRYPTION_KEY" ]; then
    if [ ${#ENCRYPTION_KEY} -eq 32 ]; then
      check_pass "ENCRYPTION_KEY is 32 bytes (256-bit)"
    else
      check_warn "ENCRYPTION_KEY is ${#ENCRYPTION_KEY} bytes (should be 32 for AES-256)"
    fi
  else
    check_warn "ENCRYPTION_KEY not set, sensitive data may not be encrypted"
  fi
}

validate_monitoring() {
  print_section "Monitoring & Logging Configuration"
  
  # Sentry Configuration
  if [ ! -z "$SENTRY_DSN" ]; then
    check_pass "Sentry error tracking configured"
    check_env "SENTRY_ENVIRONMENT"
  else
    check_warn "Sentry not configured (recommended for production)"
  fi
  
  # Logging
  check_env "LOG_LEVEL" || {
    check_warn "LOG_LEVEL not set, will default to 'info'"
  }
  
  # APM Configuration
  if [ ! -z "$ELASTICAPM_SERVER_URL" ]; then
    check_pass "Elastic APM configured"
    check_env "ELASTICAPM_SERVICE_NAME"
  else
    check_warn "Elastic APM not configured (optional)"
  fi
}

validate_files() {
  print_section "Required Files"
  
  # Check if prisma schema exists
  check_file_exists "database/prisma/schema.prisma"
  
  # Check if notification service exists
  if [ -d "services/notification-service" ]; then
    check_pass "Notification service directory exists"
  else
    check_warn "Notification service directory not found"
  fi
  
  # Check if booking-engine exists
  if [ -d "apps/booking-engine" ]; then
    check_pass "Booking engine directory exists"
  else
    check_warn "Booking engine directory not found"
  fi
}

validate_commands() {
  print_section "Required Commands"
  
  # Check Node.js
  if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    check_pass "Node.js installed: $NODE_VERSION"
  else
    check_fail "Node.js not installed"
  fi
  
  # Check npm
  if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    check_pass "npm installed: $NPM_VERSION"
  else
    check_fail "npm not installed"
  fi
  
  # Check TypeScript (optional)
  if command -v tsc &> /dev/null; then
    check_pass "TypeScript installed"
  else
    check_warn "TypeScript not globally installed (install with: npm install -g typescript)"
  fi
  
  # Check Docker (optional]
  if command -v docker &> /dev/null; then
    check_pass "Docker installed"
  else
    check_warn "Docker not installed (optional)"
  fi
}

###############################################################################
# Main Validation Flow
###############################################################################

main() {
  print_header "Phase 4 Notification System - Environment Validator"
  
  echo -e "This script will validate your notification system configuration.\n"
  
  # Load .env file if it exists
  if [ -f ".env" ]; then
    echo -e "${GREEN}Loading .env file...${NC}\n"
    export $(cat .env | grep -v '#' | xargs)
  else
    echo -e "${YELLOW}Warning: .env file not found${NC}\n"
  fi
  
  # Run all validations
  validate_database
  validate_email
  validate_sms
  validate_push
  validate_frontend
  validate_backend
  validate_security
  validate_monitoring
  validate_files
  validate_commands
  
  # Print Summary
  print_header "Validation Summary"
  
  echo -e "Total Checks: ${BLUE}$CHECKS_TOTAL${NC}"
  echo -e "Passed:       ${GREEN}$CHECKS_PASSED${NC}"
  echo -e "Failed:       ${RED}$CHECKS_FAILED${NC}"
  echo -e "Warnings:     ${YELLOW}$CHECKS_WARNING${NC}\n"
  
  # Print failed checks
  if [ $CHECKS_FAILED -gt 0 ]; then
    echo -e "${RED}Failed Checks:${NC}"
    for check in "${FAILED_CHECKS[@]}"; do
      echo -e "  ${RED}✗${NC} $check"
    done
    echo ""
  fi
  
  # Print warning checks
  if [ $CHECKS_WARNING -gt 0 ]; then
    echo -e "${YELLOW}Warnings:${NC}"
    for check in "${WARNING_CHECKS[@]}"; do
      echo -e "  ${YELLOW}⚠${NC} $check"
    done
    echo ""
  fi
  
  # Final status
  if [ $CHECKS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All critical checks passed!${NC}\n"
    if [ $CHECKS_WARNING -eq 0 ]; then
      echo -e "${GREEN}✓ No warnings. System ready for deployment.${NC}\n"
    else
      echo -e "${YELLOW}⚠ Some warnings present. Review before production deployment.${NC}\n"
    fi
    return 0
  else
    echo -e "${RED}✗ Critical checks failed. Fix above issues before proceeding.${NC}\n"
    return 1
  fi
}

# Run main function
main
