#!/bin/bash

#######################################################################
# Resend Email Notifications Setup Script
# Configures AlertManager to use Resend for email notifications
#######################################################################

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
RESEND_API_KEY="${RESEND_API_KEY:-}"
FROM_EMAIL="${FROM_EMAIL:-alerts@tripalfa.com}"
WEBHOOK_PORT="${WEBHOOK_PORT:-9094}"
CRITICAL_ALERT_EMAIL="${CRITICAL_ALERT_EMAIL:-critical-alerts@tripalfa.com}"
DATABASE_TEAM_EMAIL="${DATABASE_TEAM_EMAIL:-dba@tripalfa.com}"

# Logging functions
log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[✓]${NC} $1"
}

log_error() {
  echo -e "${RED}[✗]${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}[!]${NC} $1"
}

#######################################################################
# Verify Prerequisites
#######################################################################
verify_prerequisites() {
  log_info "Verifying prerequisites..."

  if [ -z "$RESEND_API_KEY" ]; then
    log_error "RESEND_API_KEY environment variable not set"
    echo ""
    echo "Get your API key from: https://resend.com/api-keys"
    echo ""
    echo "Example:"
    echo "  export RESEND_API_KEY='re_xxxxxxxxxxxxxxxxxxxxxxxxxxxx'"
    echo "  $0"
    exit 1
  fi

  if [ -z "$RESEND_API_KEY" ] || [ ${#RESEND_API_KEY} -lt 10 ]; then
    log_error "RESEND_API_KEY appears to be invalid"
    exit 1
  fi

  if ! command -v curl &> /dev/null; then
    log_error "curl is not installed"
    exit 1
  fi

  log_success "Prerequisites verified"

  log_success "Prerequisites verified"
}

#######################################################################
# Test Resend API Key
#######################################################################
test_resend_api() {
  log_info "Testing Resend API key..."

  local response=$(curl -s -X GET \
    "https://api.resend.com/api-keys" \
    -H "Authorization: Bearer ${RESEND_API_KEY}" \
    -w "\n%{http_code}")

  local http_code=$(echo "$response" | tail -n1)
  
  if [ "$http_code" = "200" ]; then
    log_success "Resend API key is valid"
    return 0
  else
    log_error "Resend API key validation failed (HTTP $http_code)"
    log_warning "Check your API key at: https://resend.com/api-keys"
    return 1
  fi
}

#######################################################################
# Verify Sender Email
#######################################################################
verify_sender_email() {
  log_info "Verifying sender email configuration..."

  if [ "$FROM_EMAIL" = "alerts@tripalfa.com" ]; then
    log_warning "Using default sender email: $FROM_EMAIL"
    log_info "Make sure this email is verified in Resend dashboard"
    read -p "Proceed? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      exit 1
    fi
  fi

  log_success "Sender email configured: $FROM_EMAIL"
}

#######################################################################
# Display Configuration
#######################################################################
display_config() {
  cat << EOF

${GREEN}═════════════════════════════════════════════════════${NC}
${GREEN}    Resend Email Notifications Configuration${NC}
${GREEN}═════════════════════════════════════════════════════${NC}

${BLUE}Email Configuration:${NC}
  From Email:              $FROM_EMAIL
  Webhook Port:            $WEBHOOK_PORT
  API Key:                 ${RESEND_API_KEY:0:10}...
  
${BLUE}Alert Recipients:${NC}
  Standard Alerts:         ops@tripalfa.com
  Critical Alerts:         $CRITICAL_ALERT_EMAIL
  Warning Alerts:          dev-team@tripalfa.com
  Database Alerts:         $DATABASE_TEAM_EMAIL
  
${BLUE}Webhook Endpoints:${NC}
  Standard:                http://localhost:$WEBHOOK_PORT/resend/send
  Critical:                http://localhost:$WEBHOOK_PORT/resend/send-critical
  Health Check:            http://localhost:$WEBHOOK_PORT/health

${GREEN}═════════════════════════════════════════════════════${NC}

EOF
}

#######################################################################
# Start Webhook Bridge
#######################################################################
  # Change to project root
  cd "$(dirname "$0")/.."

  # Start with local Node.js
  log_info "Starting webhook bridge via npm..."
  if npm run dev:webhook --workspace=@tripalfa/notification-service > /dev/null 2>&1 & then
    log_success "Resend webhook bridge started in background"
    
    # Wait for service to be ready
    log_info "Waiting for service to be ready..."
    sleep 5
    
    # Test health endpoint
    if curl -s http://localhost:9094/health > /dev/null 2>&1; then
      log_success "Webhook bridge is healthy"
      return 0
    else
      log_warning "Webhook bridge is starting, please wait..."
      sleep 5
    fi
  else
    log_error "Failed to start webhook bridge"
    return 1
  fi
}

#######################################################################
# Test Email Delivery
#######################################################################
test_email_delivery() {
  log_info "Testing email delivery..."

  read -p "Enter test email address (your email): " test_email
  
  if [ -z "$test_email" ]; then
    log_warning "Skipping email delivery test"
    return 0
  fi

  log_info "Sending test email to: $test_email"

  local response=$(curl -s -X POST "http://localhost:$WEBHOOK_PORT/resend/send?to=$test_email" \
    -H "Content-Type: application/json" \
    -d '{
      "status": "firing",
      "alerts": [{
        "status": "firing",
        "labels": {
          "alertname": "ResendIntegrationTest",
          "severity": "warning"
        },
        "annotations": {
          "description": "This is a test email from Resend integration setup"
        },
        "startsAt": "2024-01-15T10:00:00Z",
        "endsAt": "0001-01-01T00:00:00Z"
      }],
      "groupLabels": {"alertname": "ResendIntegrationTest"},
      "commonAnnotations": {},
      "commonLabels": {}
    }')

  if echo "$response" | grep -q "success"; then
    log_success "Test email sent successfully!"
    log_info "Check your inbox for the test email (may take a few seconds)"
  else
    log_warning "Email send response: $response"
  fi
}

#######################################################################
# Update AlertManager Config
#######################################################################
update_alertmanager_config() {
  log_info "Updating AlertManager configuration..."

  local config_file="/etc/alertmanager/config.yml"
  
  if [ ! -f "$config_file" ]; then
    log_warning "AlertManager config not found at $config_file"
    log_info "Please manually ensure webhook URLs are configured in AlertManager"
    return 0
  fi

  # Backup original config
  cp "$config_file" "$config_file.backup"
  log_success "Backed up AlertManager config to $config_file.backup"

  # Update environment variables in the config file
  sed -i.bak "s|\${FROM_EMAIL}|$FROM_EMAIL|g" "$config_file"
  sed -i.bak "s|\${WEBHOOK_PORT}|$WEBHOOK_PORT|g" "$config_file"
  sed -i.bak "s|\${CRITICAL_ALERT_EMAIL}|$CRITICAL_ALERT_EMAIL|g" "$config_file"
  sed -i.bak "s|\${DATABASE_TEAM_EMAIL}|$DATABASE_TEAM_EMAIL|g" "$config_file"

  log_success "AlertManager configuration updated"

  # Reload AlertManager
  if command -v systemctl &> /dev/null; then
    log_info "Reloading AlertManager..."
    if systemctl reload alertmanager 2>/dev/null; then
      log_success "AlertManager reloaded"
    else
      log_warning "Could not reload AlertManager (may need manual reload)"
    fi
  else
    log_info "Please reload AlertManager manually: systemctl reload alertmanager"
  fi
}

#######################################################################
# Create Environment File
#######################################################################
create_env_file() {
  log_info "Creating .env.resend configuration file..."

  cat > .env.resend << EOF
# Resend Email Configuration
RESEND_API_KEY=$RESEND_API_KEY
FROM_EMAIL=$FROM_EMAIL
WEBHOOK_PORT=$WEBHOOK_PORT

# Alert Recipients
CRITICAL_ALERT_EMAIL=$CRITICAL_ALERT_EMAIL
DATABASE_TEAM_EMAIL=$DATABASE_TEAM_EMAIL
EOF

  chmod 600 .env.resend
  log_success "Created .env.resend (permissions: 600)"
  log_info "Load this file: source .env.resend"
}

#######################################################################
# Display Summary
#######################################################################
display_summary() {
  cat << EOF

${GREEN}═════════════════════════════════════════════════════${NC}
${GREEN}    Resend Setup Complete! ✓${NC}
${GREEN}═════════════════════════════════════════════════════${NC}

${BLUE}Next Steps:${NC}

1. Monitor the webhook bridge:
   ${YELLOW}npm run logs --workspace=@tripalfa/notification-service${NC}

2. Check AlertManager alerts:
   ${YELLOW}curl http://localhost:9090/api/v1/alerts${NC}

3. Monitor email delivery:
   ${YELLOW}Visit: https://resend.com/emails${NC}

4. Verify email configuration:
   ${YELLOW}curl http://localhost:$WEBHOOK_PORT/health${NC}

${BLUE}Email Route Status:${NC}
  ✓ Standard Alerts    → ops@tripalfa.com
  ✓ Critical Alerts    → $CRITICAL_ALERT_EMAIL
  ✓ Warning Alerts     → dev-team@tripalfa.com
  ✓ Database Alerts    → $DATABASE_TEAM_EMAIL

${BLUE}Documentation:${NC}
  Complete guide: docs/RESEND_EMAIL_NOTIFICATIONS.md
  AlertManager config: infrastructure/monitoring/alertmanager.yml
  Webhook bridge: services/alerting-service/src/resend-webhook-bridge.ts

${BLUE}Configuration File:${NC}
  ${YELLOW}.env.resend${NC} - Load with: source .env.resend

${GREEN}═════════════════════════════════════════════════════${NC}

EOF
}

#######################################################################
# Main Execution
#######################################################################
main() {
  clear
  
  echo -e "${GREEN}"
  echo "╔════════════════════════════════════════════════════════╗"
  echo "║   TripAlfa Resend Email Notifications Setup            ║"
  echo "╚════════════════════════════════════════════════════════╝"
  echo -e "${NC}"
  echo ""

  # Step 1: Verify prerequisites
  verify_prerequisites
  echo ""

  # Step 2: Test API
  if ! test_resend_api; then
    log_error "Setup failed: Invalid Resend API key"
    exit 1
  fi
  echo ""

  # Step 3: Verify sender
  verify_sender_email
  echo ""

  # Step 4: Display configuration
  display_config
  echo ""

  # Step 5: Start webhook bridge
  if start_webhook_bridge; then
    echo ""
  else
    log_warning "Could not start webhook bridge automatically"
    log_info "Start manually with: npm run dev:webhook --workspace=@tripalfa/notification-service"
  fi

  # Step 6: Create env file
  echo ""
  create_env_file
  echo ""

  # Step 7: Test email (optional)
  read -p "Would you like to test email delivery? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    test_email_delivery
    echo ""
  fi

  # Step 8: Update AlertManager
  read -p "Update AlertManager configuration? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    update_alertmanager_config
    echo ""
  fi

  # Step 9: Display summary
  display_summary
}

# Run main function
main
