#!/bin/bash

# ================================================================
# Bootstrap Script - Notification Management System Setup
# ================================================================
# Purpose: Initialize development environment for notification tests
# Usage: ./scripts/bootstrap-notifications.sh [option]
# ================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ================================================================
# Helper Functions
# ================================================================

print_header() {
    echo -e "\n${BLUE}════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}════════════════════════════════════════════════════════${NC}\n"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

check_command() {
    if ! command -v $1 &> /dev/null; then
        print_error "$1 is not installed"
        return 1
    fi
    print_success "$1 found: $(which $1)"
}

# ================================================================
# Setup Phases
# ================================================================

setup_environment() {
    print_header "Phase 1: Environment Setup"

    print_info "Checking system requirements..."
    check_command "node" || exit 1
    check_command "npm" || exit 1
    check_command "git" || exit 1

    NODE_VERSION=$(node -v)
    print_info "Node.js version: $NODE_VERSION"

    if [[ ! "$NODE_VERSION" =~ ^v18 ]] && [[ ! "$NODE_VERSION" =~ ^v20 ]]; then
        print_warning "Recommended Node version is 18 or 20+"
    fi

    print_success "Environment check passed"
}

install_dependencies() {
    print_header "Phase 2: Install Dependencies"

    if [ -d "node_modules" ]; then
        print_warning "node_modules already exists"
        read -p "Clear and reinstall? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            rm -rf node_modules
            print_info "Cleared node_modules"
        else
            print_info "Skipping npm install"
            return
        fi
    fi

    print_info "Running npm install..."
    npm install --workspace=@tripalfa/booking-service

    print_success "Dependencies installed"
}

setup_redis() {
    print_header "Phase 3: Redis Setup"

    if command -v redis-cli &> /dev/null; then
        print_info "Redis found: $(which redis-cli)"
        
        if redis-cli ping &> /dev/null; then
            print_success "Redis is running"
        else
            print_warning "Redis not running"
            print_info "Starting Redis (macOS)..."
            brew services start redis 2>/dev/null || print_warning "Could not start Redis via brew"
        fi
    else
        print_warning "Redis not found locally"
        print_info "Setting up Redis with Docker..."
        
        if command -v docker &> /dev/null; then
            # Check if container already running
            if ! docker ps | grep -q "redis"; then
                docker run -d --name tripalfa-redis -p 6379:6379 redis:7-alpine
                print_success "Redis container started"
            else
                print_success "Redis container already running"
            fi
        else
            print_error "Docker not found. Please install Docker or Redis manually"
            return 1
        fi
    fi

    # Test connection
    sleep 1
    if redis-cli ping &> /dev/null; then
        print_success "Redis connection verified"
    else
        print_error "Could not connect to Redis"
        return 1
    fi
}

setup_env_file() {
    print_header "Phase 4: Environment Variables"

    if [ -f "services/booking-service/.env.local" ]; then
        print_warning ".env.local already exists"
        print_info "Skipping environment setup"
        return
    fi

    print_info "Creating .env.local template..."

    cat > "services/booking-service/.env.local" << 'EOF'
# ============================================
# Notification Service Environment Variables
# ============================================

# Development flag
NODE_ENV=development

# ============================================
# Provider Credentials (Request from DevOps)
# ============================================

# SendGrid Email
SENDGRID_API_KEY=

# Twilio SMS
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# Firebase Push
FIREBASE_PROJECT_ID=
FIREBASE_PRIVATE_KEY=
FIREBASE_CLIENT_EMAIL=

# ============================================
# Redis Configuration
# ============================================
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# ============================================
# Notification Configuration
# ============================================
NOTIFICATION_RETRY_MAX=5
NOTIFICATION_RETRY_DELAY_BASE=1000
NOTIFICATION_RETRY_DELAY_MAX=30000
NOTIFICATION_REQUEST_TIMEOUT=5000

# ============================================
# Wallet & Payment
# ============================================
WALLET_RECONCILIATION_ENABLED=true
WALLET_RECONCILIATION_CRON=0 2 * * *
FX_UPDATE_ENABLED=true
FX_UPDATE_CRON=0 * * * *

# ============================================
# Webhook Verification
# ============================================
DUFFEL_WEBHOOK_SECRET=
INNSTANT_WEBHOOK_SECRET=
HOTELSTON_WEBHOOK_SECRET=
AMADEUS_WEBHOOK_SECRET=

# ============================================
# Database
# ============================================
DATABASE_URL=

# ============================================
# Monitoring & Analytics
# ============================================
LOG_LEVEL=info
ENABLE_METRICS=true
METRICS_PORT=9090
EOF

    print_success ".env.local created"
    print_warning "⚠️  Update .env.local with actual credentials from DevOps"
}

run_lint_tests() {
    print_header "Phase 5: Code Quality Checks"

    print_info "Running ESLint..."
    npx eslint services/booking-service/tests/integration/*.test.ts \
        services/booking-service/src/notification/**/*.ts \
        --max-warnings=0 || print_warning "ESLint issues found"

    print_info "Running TypeScript compiler..."
    npx tsc --noEmit -p services/booking-service/tsconfig.json || print_warning "TypeScript issues found"

    print_success "Code quality checks complete"
}

run_unit_tests() {
    print_header "Phase 6: Run Unit Tests"

    print_info "Running core notification tests..."
    npm test -- \
        services/booking-service/tests/integration/notificationService.integration.test.ts \
        --passWithNoTests \
        --testTimeout=10000

    print_info "Running API endpoint tests..."
    npm test -- \
        services/booking-service/tests/integration/notificationAPI.integration.test.ts \
        --passWithNoTests \
        --testTimeout=10000

    print_success "Unit tests complete"
}

run_integration_tests() {
    print_header "Phase 7: Run Integration Tests"

    print_info "Running integration test suite..."
    print_info "Tests: webhooks, payments, retry logic, analytics..."

    npm test -- \
        services/booking-service/tests/integration/**/*.test.ts \
        --passWithNoTests \
        --testTimeout=15000 \
        --maxWorkers=2

    print_success "Integration tests complete"
}

build_project() {
    print_header "Phase 8: Build Project"

    print_info "Building booking-service workspace..."
    npm run build -- --workspace=@tripalfa/booking-service

    print_success "Build complete"
}

verify_setup() {
    print_header "Verification Summary"

    print_info "Checking setup completion..."

    checks=0
    total=0

    # Check Node
    total=$((total+1))
    if node -v &> /dev/null; then
        print_success "Node.js: $(node -v)"; checks=$((checks+1))
    else
        print_error "Node.js: NOT FOUND"
    fi

    # Check npm
    total=$((total+1))
    if npm -v &> /dev/null; then
        print_success "npm: $(npm -v)"; checks=$((checks+1))
    else
        print_error "npm: NOT FOUND"
    fi

    # Check node_modules
    total=$((total+1))
    if [ -d "node_modules" ]; then
        print_success "Dependencies: INSTALLED"; checks=$((checks+1))
    else
        print_error "Dependencies: MISSING"
    fi

    # Check Redis
    total=$((total+1))
    if redis-cli ping &> /dev/null; then
        print_success "Redis: RUNNING"; checks=$((checks+1))
    else
        print_warning "Redis: NOT RUNNING (optional for local testing)"
    fi

    # Check .env.local
    total=$((total+1))
    if [ -f "services/booking-service/.env.local" ]; then
        print_success "Environment: CONFIGURED"; checks=$((checks+1))
    else
        print_warning "Environment: NOT CONFIGURED (create .env.local)"
    fi

    echo ""
    echo -e "${BLUE}Setup Status: $checks/$total checks passed${NC}"

    if [ $checks -ge 4 ]; then
        print_success "Setup looks good! Ready to start development."
    else
        print_warning "Some issues detected. Review above."
    fi
}

# ================================================================
# Quick Setup Options
# ================================================================

quick_setup() {
    print_header "Quick Setup (5 Minutes)"
    print_info "This will set up minimal environment to run tests"

    setup_environment
    install_dependencies
    setup_redis
    setup_env_file

    print_success "Quick setup complete!"
    print_info "Next steps:"
    echo "  1. Update .env.local with credentials"
    echo "  2. Run: npm test -- services/booking-service/tests/integration/scheduledNotifications.test.ts"
    echo "  3. Check DEVELOPER_QUICK_REFERENCE.md for development workflow"
}

full_setup() {
    print_header "Full Setup (15 Minutes)"
    print_info "This will set up everything and run tests"

    setup_environment
    install_dependencies
    setup_redis
    setup_env_file
    run_lint_tests
    run_unit_tests

    print_success "Full setup complete!"
    verify_setup
}

dev_setup() {
    print_header "Developer Setup (30 Minutes)"
    print_info "This will set up everything including integration tests"

    setup_environment
    install_dependencies
    setup_redis
    setup_env_file
    run_lint_tests
    run_unit_tests
    run_integration_tests
    build_project

    print_success "Developer setup complete!"
    verify_setup
}

cleanup_setup() {
    print_header "Cleanup"

    read -p "This will remove node_modules and cache. Continue? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Cleanup cancelled"
        return
    fi

    print_info "Removing node_modules..."
    rm -rf node_modules

    print_info "Clearing npm cache..."
    npm cache clean --force

    print_info "Removing .env.local..."
    rm -f services/booking-service/.env.local

    print_success "Cleanup complete"
    print_info "Run bootstrap script again to reinstall"
}

test_only() {
    print_header "Test Execution Only"

    read -p "Select test type:
    1) Unit tests only
    2) Integration tests only
    3) All notification tests
    4) Quick sanity check
    
Choice: " choice

    case $choice in
        1)
            print_info "Running unit tests..."
            run_unit_tests
            ;;
        2)
            print_info "Running integration tests..."
            run_integration_tests
            ;;
        3)
            print_info "Running all tests..."
            run_unit_tests
            run_integration_tests
            ;;
        4)
            print_info "Quick sanity check..."
            npm test -- \
                services/booking-service/tests/integration/scheduledNotifications.test.ts \
                --passWithNoTests \
                --testTimeout=5000
            ;;
        *)
            print_error "Invalid choice"
            ;;
    esac
}

# ================================================================
# Help & Menu
# ================================================================

show_help() {
    cat << 'EOF'

╔════════════════════════════════════════════════════════════════╗
║  Bootstrap Script - Notification Management System            ║
║  Version 1.0.0                                                 ║
╚════════════════════════════════════════════════════════════════╝

USAGE:
    ./scripts/bootstrap-notifications.sh [option]

OPTIONS:
    quick       Quick setup (5 min) - minimal environment
    full        Full setup (15 min) - environment + tests
    dev         Developer setup (30 min) - everything
    test        Run tests interactively
    clean       Clean up node_modules and cache
    help        Show this help message
    
EXAMPLES:
    ./scripts/bootstrap-notifications.sh quick
    ./scripts/bootstrap-notifications.sh full
    ./scripts/bootstrap-notifications.sh dev
    ./scripts/bootstrap-notifications.sh test
    ./scripts/bootstrap-notifications.sh clean

DEFAULT (no argument):
    Runs interactive menu for choosing setup type

QUICK START:
    1. chmod +x scripts/bootstrap-notifications.sh
    2. ./scripts/bootstrap-notifications.sh quick
    3. Update .env.local with credentials
    4. ./scripts/bootstrap-notifications.sh test

TROUBLESHOOTING:
    - Redis connection issues: brew services start redis
    - npm issues: rm -rf node_modules && npm install
    - Port conflicts: sudo lsof -i :6379 (for Redis on 6379)

For more info, see:
    - docs/DEVELOPER_QUICK_REFERENCE.md
    - docs/NOTIFICATION_IMPLEMENTATION_GUIDE.md

EOF
}

# ================================================================
# Main Menu (Interactive)
# ================================================================

show_menu() {
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}Notification System Bootstrap${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
    echo ""
    echo "Select setup type:"
    echo ""
    echo "  1) Quick Setup (5 min)    - install deps, start Redis"
    echo "  2) Full Setup (15 min)    - Quick + lint + unit tests"
    echo "  3) Dev Setup (30 min)     - Full + integration tests + build"
    echo "  4) Test Only              - Run existing tests interactively"
    echo "  5) Cleanup & Start Fresh  - Remove node_modules & cache"
    echo "  6) Help                   - Show help information"
    echo "  7) Exit                   - Exit bootstrap script"
    echo ""
    read -p "Enter choice (1-7): " choice

    case $choice in
        1)
            quick_setup
            ;;
        2)
            full_setup
            ;;
        3)
            dev_setup
            ;;
        4)
            test_only
            ;;
        5)
            cleanup_setup
            ;;
        6)
            show_help
            ;;
        7)
            print_info "Exiting bootstrap"
            exit 0
            ;;
        *)
            print_error "Invalid choice"
            show_menu
            ;;
    esac
}

# ================================================================
# Entry Point
# ================================================================

main() {
    # Handle command line arguments
    case "${1:-}" in
        quick)
            quick_setup
            ;;
        full)
            full_setup
            ;;
        dev)
            dev_setup
            ;;
        test)
            test_only
            ;;
        clean)
            cleanup_setup
            ;;
        help|--help|-h)
            show_help
            ;;
        "")
            # No argument - show interactive menu
            show_menu
            ;;
        *)
            print_error "Unknown option: $1"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# Run main
main "$@"
