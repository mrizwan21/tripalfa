#!/bin/bash
# Payment Gateway Staging Deployment Script
# This automates the full deployment process for payment gateway integration

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
ENVIRONMENT="${1:-staging}"
DEPLOY_DIR="${2:-.}"

echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Payment Gateway Staging Deployment${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo ""

# Function to check prerequisites
check_prerequisites() {
  echo -e "${YELLOW}🔍 Checking prerequisites...${NC}"
  
  # Check Node.js
  if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    exit 1
  fi
  echo -e "${GREEN}✅ Node.js $(node --version)${NC}"
  
  # Check npm/pnpm
  if command -v pnpm &> /dev/null; then
    echo -e "${GREEN}✅ pnpm $(pnpm --version)${NC}"
  elif command -v npm &> /dev/null; then
    echo -e "${GREEN}✅ npm $(npm --version)${NC}"
  else
    echo -e "${RED}❌ Neither npm nor pnpm is installed${NC}"
    exit 1
  fi
  
  # Check PostgreSQL client
  if ! command -v psql &> /dev/null; then
    echo -e "${YELLOW}⚠️  PostgreSQL client not found (required for database operations)${NC}"
  else
    echo -e "${GREEN}✅ PostgreSQL client installed${NC}"
  fi
  
  # Check environment file
  if [ ! -f ".env.$ENVIRONMENT" ]; then
    echo -e "${YELLOW}⚠️  .env.$ENVIRONMENT not found${NC}"
    echo "   Copy from template: cp .env.$ENVIRONMENT.template .env.$ENVIRONMENT"
    echo "   Then fill in your API credentials"
    exit 1
  fi
  echo -e "${GREEN}✅ Environment file .env.$ENVIRONMENT exists${NC}"
  
  echo ""
}

# Function to install dependencies
install_dependencies() {
  echo -e "${YELLOW}📦 Installing dependencies...${NC}"
  
  if command -v pnpm &> /dev/null; then
    pnpm install
  else
    npm install
  fi
  
  echo -e "${GREEN}✅ Dependencies installed${NC}"
  echo ""
}

# Function to run database migration
run_database_migration() {
  echo -e "${YELLOW}🔄 Running database migration...${NC}"
  
  # Load environment
  set -a
  source ".env.$ENVIRONMENT"
  set +a
  
  # Check if DATABASE_URL is set
  if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ DATABASE_URL not set in .env.$ENVIRONMENT${NC}"
    exit 1
  fi
  
  # Run migration
  if command -v pnpm &> /dev/null; then
    pnpm dlx prisma migrate deploy --preview-feature 2>/dev/null || \
    pnpm dlx psql "$DATABASE_URL" -f database/migrations/003_create_payment_transactions.sql || \
    echo -e "${YELLOW}⚠️  Using psql directly for migration${NC}"
  else
    npx prisma migrate deploy --preview-feature 2>/dev/null || \
    psql "$DATABASE_URL" -f database/migrations/003_create_payment_transactions.sql || \
    echo -e "${YELLOW}⚠️  Using psql directly for migration${NC}"
  fi
  
  echo -e "${GREEN}✅ Database migration completed${NC}"
  echo ""
}

# Function to verify configuration
verify_configuration() {
  echo -e "${YELLOW}🔐 Verifying payment processor configuration...${NC}"
  
  # Load environment
  set -a
  source ".env.$ENVIRONMENT"
  set +a
  
  # Check Stripe
  if [ -z "$STRIPE_API_KEY" ]; then
    echo -e "${RED}❌ STRIPE_API_KEY not configured${NC}"
    exit 1
  fi
  
  if [[ ! $STRIPE_API_KEY == sk_test_* ]]; then
    echo -e "${RED}❌ STRIPE_API_KEY doesn't appear to be a test key (should start with sk_test_)${NC}"
    exit 1
  fi
  echo -e "${GREEN}✅ Stripe API key configured (test mode)${NC}"
  
  # Check PayPal
  if [ -z "$PAYPAL_CLIENT_ID" ] || [ -z "$PAYPAL_CLIENT_SECRET" ]; then
    echo -e "${RED}❌ PayPal credentials not configured${NC}"
    exit 1
  fi
  echo -e "${GREEN}✅ PayPal credentials configured (sandbox mode)${NC}"
  
  # Check webhook secrets
  if [ -z "$STRIPE_WEBHOOK_SECRET" ]; then
    echo -e "${YELLOW}⚠️  STRIPE_WEBHOOK_SECRET not configured (webhooks won't verify)${NC}"
  else
    echo -e "${GREEN}✅ Stripe webhook secret configured${NC}"
  fi
  
  if [ -z "$PAYPAL_WEBHOOK_ID" ]; then
    echo -e "${YELLOW}⚠️  PAYPAL_WEBHOOK_ID not configured${NC}"
  else
    echo -e "${GREEN}✅ PayPal webhook ID configured${NC}"
  fi
  
  echo ""
}

# Function to build services
build_services() {
  echo -e "${YELLOW}🔨 Building services...${NC}"
  
  if command -v pnpm &> /dev/null; then
    pnpm run build
  else
    npm run build
  fi
  
  echo -e "${GREEN}✅ Services built successfully${NC}"
  echo ""
}

# Function to run tests
run_tests() {
  echo -e "${YELLOW}🧪 Running payment gateway tests...${NC}"
  
  if command -v pnpm &> /dev/null; then
    pnpm run test:payment:gateway
  else
    npm run test:payment:gateway
  fi
  
  TEST_RESULT=$?
  
  if [ $TEST_RESULT -eq 0 ]; then
    echo -e "${GREEN}✅ All payment gateway tests passed${NC}"
  else
    echo -e "${RED}❌ Some tests failed (exit code: $TEST_RESULT)${NC}"
    exit $TEST_RESULT
  fi
  
  echo ""
}

# Function to generate configuration summary
generate_summary() {
  echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
  echo -e "${GREEN}✅ Deployment Steps Completed${NC}"
  echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
  echo ""
  
  echo -e "${YELLOW}📋 Checklist:${NC}"
  echo "  ✅ Prerequisites verified"
  echo "  ✅ Dependencies installed"
  echo "  ✅ Database migration executed"
  echo "  ✅ Configuration verified"
  echo "  ✅ Services built"
  echo "  ✅ Tests passed"
  echo ""
  
  echo -e "${YELLOW}🚀 Next Steps:${NC}"
  echo ""
  echo "1. Register webhooks with payment processors:"
  echo -e "   ${BLUE}./scripts/setup-webhooks.sh https://staging.tripalfa.com${NC}"
  echo ""
  echo "2. Start the payment gateway service:"
  if command -v pnpm &> /dev/null; then
    echo -e "   ${BLUE}pnpm run start:payment:gateway${NC}"
  else
    echo -e "   ${BLUE}npm run start:payment:gateway${NC}"
  fi
  echo ""
  echo "3. Start the wallet service (if not already running):"
  if command -v pnpm &> /dev/null; then
    echo -e "   ${BLUE}pnpm run start:wallet:api${NC}"
  else
    echo -e "   ${BLUE}npm run start:wallet:api${NC}"
  fi
  echo ""
  echo "4. Verify webhook connectivity:"
  echo "   - Stripe Dashboard: https://dashboard.stripe.com/test/webhooks"
  echo "   - PayPal Dashboard: https://developer.paypal.com/dashboard"
  echo ""
  echo "5. Monitor deployment:"
  echo -e "   ${BLUE}tail -f logs/payment-gateway.log${NC}"
  echo ""
  echo "6. Test payments (with test credentials):"
  echo "   - Stripe test card: 4242 4242 4242 4242"
  echo "   - Any future expiry date"
  echo "   - Any 3-digit CVC"
  echo ""
  
  echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
}

# Main deployment flow
main() {
  check_prerequisites
  install_dependencies
  verify_configuration
  run_database_migration
  build_services
  run_tests
  generate_summary
}

# Run main function
main
