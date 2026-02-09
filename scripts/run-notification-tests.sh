#!/bin/bash

# ================================================================
# Test Runner - Notification Management System
# ================================================================
# Purpose: Quick test execution with multiple options
# Usage: ./scripts/run-notification-tests.sh [option]
# 
# Server Bootstrap:
#   - global-setup.ts starts Express test server on ephemeral port
#   - Test URL stored in globalThis.TEST_API_URL
#   - All axios requests use this URL automatically
#   - global-teardown.ts stops server and cleans up
# 
# Test Data Isolation:
#   - Each test run uses a fresh database (TEST_DB_RESET=true)
#   - setup.ts provides testDataTracker for cleanup
#   - Tests should track created resources via testDataTracker.track()
# ================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# ================================================================
# Test Commands
# ================================================================

test_unit() {
    print_header "Unit Tests (130+ tests)"
    
    npm test -- \
        services/booking-service/tests/integration/notificationService.integration.test.ts \
        services/booking-service/tests/integration/notificationAPI.integration.test.ts \
        services/booking-service/tests/integration/notifications.test.tsx \
        --passWithNoTests \
        --testTimeout=10000
    
    print_success "Unit tests completed"
}

test_scheduled() {
    print_header "Scheduled Notifications Tests (40+ tests)"
    
    npm test -- \
        services/booking-service/tests/integration/scheduledNotifications.test.ts \
        --passWithNoTests \
        --testTimeout=10000
    
    print_success "Scheduled notifications tests completed"
}

test_templates() {
    print_header "Template Substitution Tests (50+ tests)"
    
    npm test -- \
        services/booking-service/tests/integration/templateSubstitution.test.ts \
        --passWithNoTests \
        --testTimeout=10000
    
    print_success "Template tests completed"
}

test_webhooks() {
    print_header "Webhook Integration Tests (55+ tests)"
    
    npm test -- \
        services/booking-service/tests/integration/scheduleChangeDetection.test.ts \
        services/booking-service/tests/integration/webhooksIntegration.test.ts \
        --passWithNoTests \
        --testTimeout=15000
    
    print_success "Webhook tests completed"
}

test_payment_wallet() {
    print_header "Payment & Wallet Tests (76+ tests)"
    
    npm test -- \
        services/booking-service/tests/integration/paymentWalletNotifications.test.ts \
        services/booking-service/tests/integration/walletReconciliation.test.ts \
        --passWithNoTests \
        --testTimeout=12000
    
    print_success "Payment & wallet tests completed"
}

test_retry() {
    print_header "Retry Mechanism Tests (45+ tests)"
    
    npm test -- \
        services/booking-service/tests/integration/notificationRetryMechanism.test.ts \
        --passWithNoTests \
        --testTimeout=10000
    
    print_success "Retry mechanism tests completed"
}

test_analytics() {
    print_header "Analytics Tests (45+ tests)"
    
    npm test -- \
        services/booking-service/tests/integration/notificationAnalytics.test.ts \
        --passWithNoTests \
        --testTimeout=10000
    
    print_success "Analytics tests completed"
}

test_e2e() {
    print_header "E2E Workflow Tests (150+ tests)"
    
    npm test -- \
        services/booking-service/tests/integration/e2eWorkflowNotifications.test.ts \
        services/booking-service/tests/integration/manualBookingErrorNotifications.test.ts \
        --passWithNoTests \
        --testTimeout=15000
    
    print_success "E2E workflow tests completed"
}

test_b2b_admin() {
    print_header "B2B Admin Notification Tests"
    
    npm test -- \
        apps/b2b-admin/tests/notificationManagement.test.tsx \
        --passWithNoTests \
        --testTimeout=10000
    
    print_success "B2B admin tests completed"
}

test_all() {
    print_header "All Notification Tests (611+ tests)"
    print_info "This will take 5-10 minutes..."
    
    start_time=$(date +%s)
    
    npm test -- \
        services/booking-service/tests/integration/**/*.test.ts \
        apps/b2b-admin/tests/notificationManagement.test.tsx \
        --passWithNoTests \
        --testTimeout=15000 \
        --maxWorkers=2
    
    end_time=$(date +%s)
    duration=$((end_time - start_time))
    
    print_success "All tests completed in ${duration}s"
}

test_with_coverage() {
    print_header "Tests with Coverage Report"
    
    npm test -- \
        --coverage \
        --collectCoverageFrom='services/booking-service/src/notification/**/*.ts' \
        --coverageThreshold='{"global":{"lines":75,"functions":75,"branches":70}}' \
        services/booking-service/tests/integration/**/*.test.ts \
        apps/b2b-admin/tests/notificationManagement.test.tsx
    
    print_success "Coverage report generated"
    print_info "Coverage report: ./coverage/index.html"
}

test_watch_mode() {
    print_header "Watch Mode (Auto-rerun on changes)"
    
    npm test -- \
        services/booking-service/tests/integration/scheduledNotifications.test.ts \
        --watch
}

test_quick_sanity() {
    print_header "Quick Sanity Check (30 seconds)"
    
    npm test -- \
        services/booking-service/tests/integration/scheduledNotifications.test.ts \
        --passWithNoTests \
        --testTimeout=5000 \
        --bail \
        --maxWorkers=1
    
    print_success "Sanity check passed"
}

test_lint() {
    print_header "Code Quality (Lint & TypeScript)"
    
    print_info "Running ESLint..."
    npx eslint services/booking-service/tests/integration/*.test.ts \
        services/booking-service/src/notification/**/*.ts \
        --max-warnings=0 || print_warning "ESLint issues found"
    
    print_info "Running TypeScript compiler..."
    npx tsc --noEmit -p services/booking-service/tsconfig.json || print_warning "TypeScript issues found"
    
    print_success "Lint checks complete"
}

test_formatting() {
    print_header "Code Formatting Check"
    
    npx prettier --check services/booking-service/src/notification/**/*.ts || print_warning "Formatting issues found"
    
    print_success "Formatting check complete"
}

test_phase1() {
    print_header "Phase 1: Core Foundation Tests"
    
    test_unit
    test_lint
}

test_phase2() {
    print_header "Phase 2: Advanced Feature Tests"
    
    test_scheduled
    test_templates
    test_webhooks
    test_retry
}

test_phase3() {
    print_header "Phase 3: Integration & E2E Tests"
    
    test_payment_wallet
    test_analytics
    test_e2e
    test_b2b_admin
}

test_specific_file() {
    local file=$1
    if [ -z "$file" ]; then
        print_error "No file specified"
        return 1
    fi
    
    print_header "Running: $file"
    
    npm test -- "$file" --passWithNoTests --testTimeout=10000
}

# ================================================================
# Interactive Menu
# ================================================================

show_menu() {
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}Notification Tests Runner${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
    echo ""
    echo "Select test category:"
    echo ""
    echo "Phase-Based Testing:"
    echo "  1) Phase 1 - Core Foundation (Unit + Lint)"
    echo "  2) Phase 2 - Advanced Features (Scheduled, Templates, Webhooks, Retry)"
    echo "  3) Phase 3 - Integration & E2E (Payment, Analytics, E2E, B2B)"
    echo ""
    echo "Component Testing:"
    echo "  4) Unit Tests Only"
    echo "  5) Scheduled Notifications"
    echo "  6) Template Substitution"
    echo "  7) Webhook Integration"
    echo "  8) Payment & Wallet"
    echo "  9) Retry Mechanism"
    echo " 10) Analytics"
    echo " 11) E2E Workflows"
    echo " 12) B2B Admin Notifications"
    echo ""
    echo "Full Test Suites:"
    echo " 13) All 611+ Tests (Full Suite)"
    echo " 14) All Tests with Coverage Report"
    echo ""
    echo "Quick Testing:"
    echo " 15) Quick Sanity Check (30s)"
    echo " 16) Watch Mode (Auto-rerun)"
    echo ""
    echo "Code Quality:"
    echo " 17) Linting & TypeScript Check"
    echo " 18) Formatting Check"
    echo ""
    echo "  0) Exit"
    echo ""
    read -p "Enter choice (0-18): " choice

    case $choice in
        1) test_phase1 ;;
        2) test_phase2 ;;
        3) test_phase3 ;;
        4) test_unit ;;
        5) test_scheduled ;;
        6) test_templates ;;
        7) test_webhooks ;;
        8) test_payment_wallet ;;
        9) test_retry ;;
        10) test_analytics ;;
        11) test_e2e ;;
        12) test_b2b_admin ;;
        13) test_all ;;
        14) test_with_coverage ;;
        15) test_quick_sanity ;;
        16) test_watch_mode ;;
        17) test_lint ;;
        18) test_formatting ;;
        0) print_info "Exiting"; exit 0 ;;
        *) print_error "Invalid choice"; show_menu ;;
    esac
}

# ================================================================
# Help
# ================================================================

show_help() {
    cat << 'EOF'

╔════════════════════════════════════════════════════════════════╗
║  Test Runner - Notification Management System                 ║
║  Version 1.0.0                                                 ║
╚════════════════════════════════════════════════════════════════╝

USAGE:
    ./scripts/run-notification-tests.sh [option]

OPTIONS (Phase-Based):
    phase1              Phase 1: Core foundation tests
    phase2              Phase 2: Advanced features
    phase3              Phase 3: Integration & E2E
    
OPTIONS (Component-Based):
    unit                Core notification unit tests
    scheduled           Scheduled notification tests
    templates           Template substitution tests
    webhooks            Webhook integration tests
    payment             Payment & wallet tests
    retry               Retry mechanism tests
    analytics           Analytics tests
    e2e                 E2E workflow tests
    b2b                 B2B admin notification tests
    
OPTIONS (Full Suites):
    all                 All 611+ notification tests
    coverage            All tests with coverage report
    
OPTIONS (Quick):
    quick               Quick 30-second sanity check
    watch               Watch mode (auto-rerun on changes)
    
OPTIONS (Quality):
    lint                ESLint & TypeScript checks
    format              Formatting check with Prettier
    
OTHER:
    help                Show this help message
    (no argument)       Interactive menu

EXAMPLES:
    ./scripts/run-notification-tests.sh phase1
    ./scripts/run-notification-tests.sh all
    ./scripts/run-notification-tests.sh coverage
    ./scripts/run-notification-tests.sh quick
    ./scripts/run-notification-tests.sh lint
    ./scripts/run-notification-tests.sh watch

QUICK START:
    1. chmod +x scripts/run-notification-tests.sh
    2. ./scripts/run-notification-tests.sh quick
    3. ./scripts/run-notification-tests.sh phase1
    4. ./scripts/run-notification-tests.sh all

VIEWING COVERAGE:
    After running with coverage, open:
    ./coverage/lcov-report/index.html

TROUBLESHOOTING:
    - Tests timeout: Increase timeout in command
    - Redis errors: Start Redis: brew services start redis
    - Memory issues: Use single worker: --maxWorkers=1

For more info:
    - docs/DEVELOPER_QUICK_REFERENCE.md
    - docs/TEST_SUITE_VALIDATION_REPORT.md

EOF
}

# ================================================================
# Main
# ================================================================

main() {
    case "${1:-}" in
        phase1)
            test_phase1
            ;;
        phase2)
            test_phase2
            ;;
        phase3)
            test_phase3
            ;;
        unit)
            test_unit
            ;;
        scheduled)
            test_scheduled
            ;;
        templates)
            test_templates
            ;;
        webhooks)
            test_webhooks
            ;;
        payment)
            test_payment_wallet
            ;;
        retry)
            test_retry
            ;;
        analytics)
            test_analytics
            ;;
        e2e)
            test_e2e
            ;;
        b2b)
            test_b2b_admin
            ;;
        all)
            test_all
            ;;
        coverage)
            test_with_coverage
            ;;
        quick)
            test_quick_sanity
            ;;
        watch)
            test_watch_mode
            ;;
        lint)
            test_lint
            ;;
        format)
            test_formatting
            ;;
        help|--help|-h)
            show_help
            ;;
        "")
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

main "$@"
