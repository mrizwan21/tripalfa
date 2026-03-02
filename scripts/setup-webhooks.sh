#!/bin/bash
# Webhook Setup Script for Payment Gateway Staging Deployment
# This script registers webhook endpoints with payment processors in test/sandbox mode

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
STAGING_URL="${1:-https://staging.tripalfa.com}"
STRIPE_API_KEY="${STRIPE_API_KEY:-}"
PAYPAL_CLIENT_ID="${PAYPAL_CLIENT_ID:-}"
PAYPAL_CLIENT_SECRET="${PAYPAL_CLIENT_SECRET:-}"

echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Payment Gateway Webhook Setup - Staging Deployment${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo ""

# Validate inputs
if [ -z "$STAGING_URL" ]; then
  echo -e "${RED}❌ ERROR: Staging URL not provided${NC}"
  echo "Usage: ./setup-webhooks.sh https://staging.tripalfa.com"
  exit 1
fi

if [ -z "$STRIPE_API_KEY" ]; then
  echo -e "${RED}❌ ERROR: STRIPE_API_KEY environment variable not set${NC}"
  echo "Set with: export STRIPE_API_KEY=sk_test_..."
  exit 1
fi

if [ -z "$PAYPAL_CLIENT_ID" ] || [ -z "$PAYPAL_CLIENT_SECRET" ]; then
  echo -e "${RED}❌ ERROR: PayPal credentials not set${NC}"
  echo "Set with:"
  echo "  export PAYPAL_CLIENT_ID=your_sandbox_client_id"
  echo "  export PAYPAL_CLIENT_SECRET=your_sandbox_client_secret"
  exit 1
fi

# Define webhook endpoints
STRIPE_ENDPOINT="$STAGING_URL/webhooks/stripe"
PAYPAL_ENDPOINT="$STAGING_URL/webhooks/paypal"

echo -e "${YELLOW}📋 Configuration:${NC}"
echo "  Staging URL: $STAGING_URL"
echo "  Stripe Endpoint: $STRIPE_ENDPOINT"
echo "  PayPal Endpoint: $PAYPAL_ENDPOINT"
echo ""

# ============================================================================
# STRIPE WEBHOOK REGISTRATION
# ============================================================================

echo -e "${BLUE}Registering Stripe Webhooks...${NC}"
echo ""

# Get list of existing webhooks
echo -e "${YELLOW}📊 Fetching existing Stripe webhooks...${NC}"

STRIPE_RESPONSE=$(curl -s https://api.stripe.com/v1/webhook_endpoints \
  -H "Authorization: Bearer $STRIPE_API_KEY" \
  -d "limit=100")

# Check if endpoint already exists
if echo "$STRIPE_RESPONSE" | grep -q "$STRIPE_ENDPOINT"; then
  echo -e "${GREEN}✅ Stripe webhook endpoint already exists${NC}"
else
  echo -e "${YELLOW}📝 Creating new Stripe webhook endpoint...${NC}"
  
  STRIPE_WEBHOOK=$(curl -s -X POST https://api.stripe.com/v1/webhook_endpoints \
    -H "Authorization: Bearer $STRIPE_API_KEY" \
    -d "url=$STRIPE_ENDPOINT" \
    -d "enabled_events[0]=payment_intent.succeeded" \
    -d "enabled_events[1]=payment_intent.payment_failed" \
    -d "enabled_events[2]=charge.refunded" \
    -d "enabled_events[3]=payment_intent.canceled" \
    -d "enabled_events[4]=charge.dispute.created" \
    -d "enabled_events[5]=charge.dispute.closed")
  
  # Extract webhook signing secret
  STRIPE_WEBHOOK_SECRET=$(echo "$STRIPE_WEBHOOK" | grep -o '"secret":"[^"]*"' | head -1 | cut -d'"' -f4)
  
  if [ -z "$STRIPE_WEBHOOK_SECRET" ]; then
    echo -e "${RED}❌ Failed to create Stripe webhook${NC}"
    echo "Response: $STRIPE_WEBHOOK"
    exit 1
  fi
  
  echo -e "${GREEN}✅ Stripe webhook created successfully${NC}"
  echo -e "${YELLOW}📌 Save this signing secret to .env.staging:${NC}"
  echo -e "   ${BLUE}STRIPE_WEBHOOK_SECRET=$STRIPE_WEBHOOK_SECRET${NC}"
fi

echo ""

# ============================================================================
# PAYPAL WEBHOOK REGISTRATION
# ============================================================================

echo -e "${BLUE}Registering PayPal Webhooks...${NC}"
echo ""

# Get PayPal access token
echo -e "${YELLOW}🔐 Obtaining PayPal access token...${NC}"

PAYPAL_AUTH=$(curl -s -X POST https://api.sandbox.paypal.com/v1/oauth2/token \
  -H "Accept: application/json" \
  -H "Accept-Language: en_US" \
  -u "$PAYPAL_CLIENT_ID:$PAYPAL_CLIENT_SECRET" \
  -d "grant_type=client_credentials")

PAYPAL_ACCESS_TOKEN=$(echo "$PAYPAL_AUTH" | grep -o '"access_token":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$PAYPAL_ACCESS_TOKEN" ]; then
  echo -e "${RED}❌ Failed to obtain PayPal access token${NC}"
  echo "Response: $PAYPAL_AUTH"
  exit 1
fi

echo -e "${GREEN}✅ PayPal access token obtained${NC}"
echo ""

# Register webhook
echo -e "${YELLOW}📝 Creating PayPal webhook...${NC}"

PAYPAL_WEBHOOK=$(curl -s -X POST https://api.sandbox.paypal.com/v1/notifications/webhooks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $PAYPAL_ACCESS_TOKEN" \
  -d "{
    \"url\": \"$PAYPAL_ENDPOINT\",
    \"event_types\": [
      {\"name\": \"PAYMENT.CAPTURE.COMPLETED\"},
      {\"name\": \"PAYMENT.CAPTURE.DENIED\"},
      {\"name\": \"PAYMENT.CAPTURE.REFUNDED\"},
      {\"name\": \"PAYMENT.CAPTURE.PENDING\"},
      {\"name\": \"BILLING.PLAN.CREATED\"},
      {\"name\": \"BILLING.PLAN.UPDATED\"}
    ]
  }")

PAYPAL_WEBHOOK_ID=$(echo "$PAYPAL_WEBHOOK" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$PAYPAL_WEBHOOK_ID" ]; then
  echo -e "${RED}❌ Failed to create PayPal webhook${NC}"
  echo "Response: $PAYPAL_WEBHOOK"
  exit 1
fi

echo -e "${GREEN}✅ PayPal webhook created successfully${NC}"
echo -e "${YELLOW}📌 Save this webhook ID to .env.staging:${NC}"
echo -e "   ${BLUE}PAYPAL_WEBHOOK_ID=$PAYPAL_WEBHOOK_ID${NC}"

echo ""

# ============================================================================
# VERIFICATION
# ============================================================================

echo -e "${BLUE}Verifying Webhook Configuration...${NC}"
echo ""

echo -e "${YELLOW}🔍 Testing Stripe endpoint...${NC}"

STRIPE_TEST=$(curl -s -X POST "$STRIPE_ENDPOINT" \
  -H "Content-Type: application/json" \
  -d '{"type":"test"}' || echo "Connection failed")

if echo "$STRIPE_TEST" | grep -q "signerequired\|unauthorized\|malformed"; then
  echo -e "${GREEN}✅ Stripe endpoint is accessible${NC}"
elif echo "$STRIPE_TEST" | grep -q "Connection refused\|Failed to connect"; then
  echo -e "${RED}❌ Stripe endpoint not accessible (webhook service not running?)${NC}"
else
  echo -e "${YELLOW}⚠️  Stripe endpoint responded with: ${STRIPE_TEST:0:100}${NC}"
fi

echo ""
echo -e "${YELLOW}🔍 Testing PayPal endpoint...${NC}"

PAYPAL_TEST=$(curl -s -X POST "$PAYPAL_ENDPOINT" \
  -H "Content-Type: application/json" \
  -d '{"event_type":"test"}' || echo "Connection failed")

if echo "$PAYPAL_TEST" | grep -q "unauthorized\|signature\|invalid"; then
  echo -e "${GREEN}✅ PayPal endpoint is accessible${NC}"
elif echo "$PAYPAL_TEST" | grep -q "Connection refused\|Failed to connect"; then
  echo -e "${RED}❌ PayPal endpoint not accessible (webhook service not running?)${NC}"
else
  echo -e "${YELLOW}⚠️  PayPal endpoint responded with: ${PAYPAL_TEST:0:100}${NC}"
fi

echo ""

# ============================================================================
# SUMMARY
# ============================================================================

echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Webhook Setup Complete${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo ""

echo -e "${YELLOW}📝 Next Steps:${NC}"
echo ""
echo "1. Update .env.staging with credentials:"
echo -e "   ${BLUE}STRIPE_WEBHOOK_SECRET=$STRIPE_WEBHOOK_SECRET${NC}"
echo -e "   ${BLUE}PAYPAL_WEBHOOK_ID=$PAYPAL_WEBHOOK_ID${NC}"
echo ""
echo "2. Verify webhook endpoints are accessible:"
echo "   - Stripe API is listening at: $STRIPE_ENDPOINT"
echo "   - PayPal API is listening at: $PAYPAL_ENDPOINT"
echo ""
echo "3. Test webhook delivery:"
echo "   - Log in to Stripe Dashboard > Developers > Webhooks"
echo "   - Select your endpoint and click 'Send test webhook'"
echo "   - Check your webhook service logs for received events"
echo ""
echo "4. Monitor webhook events:"
echo "   - Query database: SELECT * FROM payment_webhook_events"
echo "   - Watch logs with: tail -f logs/webhooks.log"
echo ""

echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
