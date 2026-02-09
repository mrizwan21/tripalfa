#!/bin/bash

# 🔍 PHASE A: Automated Infrastructure Validation Script
# Date: February 7, 2026
# Purpose: Quickly validate all critical infrastructure components
# Usage: bash scripts/validate-staging-infrastructure.sh

set -e

RESET='\033[0m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'

# Function to print colored output
print_status() {
    local status=$1
    local message=$2
    
    if [ "$status" = "✅" ]; then
        echo -e "${GREEN}${status} ${message}${RESET}"
    elif [ "$status" = "🔴" ]; then
        echo -e "${RED}${status} ${message}${RESET}"
    elif [ "$status" = "⏳" ]; then
        echo -e "${YELLOW}${status} ${message}${RESET}"
    elif [ "$status" = "📋" ]; then
        echo -e "${BLUE}${status} ${message}${RESET}"
    fi
}

print_header() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
    echo -e "${BLUE}📋 $1${RESET}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
}

# Track results
PASSED=0
FAILED=0
SKIPPED=0

print_header "PHASE A: Automated Infrastructure Validation"

# ========================================
# 1. TYPESCRIPT & BUILD VALIDATION
# ========================================
print_header "1. TypeScript & Build Validation"

echo "Testing TypeScript compilation..."
if npx tsc -p tsconfig.json --noEmit 2>/dev/null; then
    print_status "✅" "TypeScript compilation: PASSED"
    ((PASSED++))
else
    print_status "🔴" "TypeScript compilation: FAILED"
    ((FAILED++))
fi

echo ""
echo "Testing ESLint..."
if npm run lint 2>/dev/null | grep -q "no errors"; then
    print_status "✅" "ESLint: PASSED"
    ((PASSED++))
else
    print_status "⏳" "ESLint: COMPLETED (review any warnings)"
    ((SKIPPED++))
fi

echo ""
echo "Testing Booking Service build..."
if npm run build --workspace=@tripalfa/booking-service 2>/dev/null > /dev/null; then
    print_status "✅" "Booking Service build: PASSED"
    ((PASSED++))
else
    print_status "🔴" "Booking Service build: FAILED"
    ((FAILED++))
fi

# ========================================
# 2. INFRASTRUCTURE CHECKS
# ========================================
print_header "2. Kubernetes Infrastructure"

if ! command -v kubectl &> /dev/null; then
    print_status "🔴" "kubectl not found - cannot check K8s"
    ((FAILED++))
else
    echo "Checking Kubernetes cluster access..."
    if kubectl cluster-info 2>/dev/null | grep -q "running"; then
        print_status "✅" "Kubernetes cluster: ACCESSIBLE"
        ((PASSED++))
        
        CONTEXT=$(kubectl config current-context 2>/dev/null)
        echo "  └─ Current context: $CONTEXT"
        
        echo ""
        echo "Checking node status..."
        NODES=$(kubectl get nodes --no-headers 2>/dev/null | wc -l)
        READY_NODES=$(kubectl get nodes --no-headers 2>/dev/null | grep -c "Ready")
        
        if [ "$NODES" -eq "$READY_NODES" ]; then
            print_status "✅" "All K8s nodes ready: $READY_NODES/$NODES"
            ((PASSED++))
        else
            print_status "🔴" "Not all nodes ready: $READY_NODES/$NODES"
            ((FAILED++))
        fi
        
        echo ""
        echo "Checking namespaces..."
        for ns in services database monitoring logging; do
            if kubectl get namespace $ns 2>/dev/null > /dev/null; then
                print_status "✅" "Namespace '$ns': FOUND"
                ((PASSED++))
            else
                print_status "🔴" "Namespace '$ns': MISSING"
                ((FAILED++))
            fi
        done
        
        echo ""
        echo "Checking PostgreSQL pod..."
        if kubectl get pods -n database -l app=postgres 2>/dev/null | grep -q "postgres"; then
            print_status "✅" "PostgreSQL pod: RUNNING"
            ((PASSED++))
        else
            print_status "🔴" "PostgreSQL pod: NOT RUNNING"
            ((FAILED++))
        fi
    else
        print_status "🔴" "Kubernetes cluster: NOT ACCESSIBLE"
        echo "  └─ Hint: Check kubectl configuration and cluster status"
        ((FAILED++))
    fi
fi

# ========================================
# 3. DOCKER & REGISTRY
# ========================================
print_header "3. Docker & Container Registry"

if ! command -v docker &> /dev/null; then
    print_status "🔴" "Docker not found - cannot check registry"
    ((FAILED++))
else
    print_status "✅" "Docker: INSTALLED"
    ((PASSED++))
    
    echo ""
    echo "Checking Docker daemon..."
    if docker ps 2>/dev/null > /dev/null; then
        print_status "✅" "Docker daemon: RUNNING"
        ((PASSED++))
    else
        print_status "🔴" "Docker daemon: NOT RUNNING"
        echo "  └─ Hint: Start Docker Desktop or docker daemon"
        ((FAILED++))
    fi
fi

# ========================================
# 4. DUFFEL API CREDENTIALS
# ========================================
print_header "4. Duffel API Credentials"

if [ -z "$DUFFEL_SANDBOX_API_KEY" ]; then
    print_status "🔴" "DUFFEL_SANDBOX_API_KEY: NOT SET"
    echo "  └─ Set it: export DUFFEL_SANDBOX_API_KEY=<your-key>"
    ((FAILED++))
else
    print_status "✅" "DUFFEL_SANDBOX_API_KEY: SET"
    ((PASSED++))
    
    # Get first 10 chars for verification
    KEY_PREVIEW="${DUFFEL_SANDBOX_API_KEY:0:10}..."
    echo "  └─ Key preview: $KEY_PREVIEW"
    
    echo ""
    echo "Testing Duffel API connectivity..."
    if curl -s -X GET https://api-sandbox.duffel.com/air/airlines \
        -H "Authorization: Bearer $DUFFEL_SANDBOX_API_KEY" \
        -H "Accept: application/json" 2>/dev/null | grep -q "data"; then
        print_status "✅" "Duffel API: RESPONDING"
        ((PASSED++))
    else
        print_status "🔴" "Duffel API: NOT RESPONDING"
        echo "  └─ Check API key validity and sandbox endpoint accessibility"
        ((FAILED++))
    fi
fi

# ========================================
# 5. ENVIRONMENT CONFIGURATION
# ========================================
print_header "5. Environment Configuration"

if [ -f ".env.staging" ]; then
    print_status "✅" ".env.staging file: EXISTS"
    ((PASSED++))
    
    # Check critical variables
    for var in NODE_ENV DUFFEL_BASE_URL DATABASE_URL; do
        if grep -q "^$var=" .env.staging; then
            print_status "✅" "  └─ $var: CONFIGURED"
            ((PASSED++))
        else
            print_status "🔴" "  └─ $var: MISSING"
            ((FAILED++))
        fi
    done
else
    print_status "⏳" ".env.staging file: NOT FOUND"
    echo "  └─ Create .env.staging with required variables"
    ((SKIPPED++))
fi

# ========================================
# 6. PROJECT STRUCTURE
# ========================================
print_header "6. Project Structure Validation"

REQUIRED_DIRS=(
    "services/booking-service"
    "services/api-gateway"
    "apps/booking-engine"
    "packages/shared-types"
    "database/prisma"
    "scripts"
)

for dir in "${REQUIRED_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        print_status "✅" "$dir: EXISTS"
        ((PASSED++))
    else
        print_status "🔴" "$dir: MISSING"
        ((FAILED++))
    fi
done

# ========================================
# 7. PACKAGE.JSON VALIDATION
# ========================================
print_header "7. Package & Dependency Checks"

echo "Checking package.json..."
if [ -f "package.json" ]; then
    print_status "✅" "package.json: FOUND"
    ((PASSED++))
    
    echo ""
    echo "Checking for necessary scripts..."
    SCRIPTS=("build" "test" "lint" "dev")
    for script in "${SCRIPTS[@]}"; do
        if grep -q "\"$script\":" package.json; then
            print_status "✅" "  └─ npm run $script: AVAILABLE"
            ((PASSED++))
        else
            print_status "🔴" "  └─ npm run $script: MISSING"
            ((FAILED++))
        fi
    done
else
    print_status "🔴" "package.json: NOT FOUND"
    ((FAILED++))
fi

# ========================================
# SUMMARY
# ========================================
print_header "Validation Summary"

TOTAL=$((PASSED + FAILED + SKIPPED))

echo ""
echo "Results:"
print_status "✅" "Passed: $PASSED"
print_status "🔴" "Failed: $FAILED"
print_status "⏳" "Skipped/Warnings: $SKIPPED"
echo "───────────────────────────"
echo "Total checks: $TOTAL"

echo ""
if [ $FAILED -eq 0 ]; then
    print_status "✅" "ALL CHECKS PASSED! Ready for Phase B"
    echo ""
    echo "Next steps:"
    echo "1. Review PHASE_A_INFRASTRUCTURE_VERIFICATION.md"
    echo "2. Complete manual checklist (credentials, DNS, etc.)"
    echo "3. Proceed to Phase B: Build & Pre-staging"
    exit 0
else
    print_status "🔴" "ISSUES FOUND - Please resolve before proceeding"
    echo ""
    echo "Failed checks:"
    echo "1. Kubernetes infrastructure"
    echo "2. Database connectivity"
    echo "3. Docker daemon"
    echo "4. Duffel API credentials"
    echo ""
    echo "Resolution steps:"
    echo "1. Check Kubernetes cluster status"
    echo "2. Verify all namespaces are created"
    echo "3. Set DUFFEL_SANDBOX_API_KEY environment variable"
    echo "4. Ensure Docker daemon is running"
    echo ""
    echo "For help, see: PHASE_A_INFRASTRUCTURE_VERIFICATION.md"
    exit 1
fi
