#!/bin/bash

#############################################################################
# Quick Production Setup Validation
# Lightweight validation that works on macOS and Linux
#############################################################################

set +e  # Don't exit on error - we handle it

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PASSED=0
FAILED=0
WARNING=0

header() {
    echo ""
    echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
}

check_file() {
    local file="$1"
    local desc="$2"
    
    if [ -f "$file" ]; then
        local size=$(wc -c < "$file")
        echo -e "${GREEN}✅ PASS${NC}: $desc ($file - $size bytes)"
        ((PASSED++))
    else
        echo -e "${RED}❌ FAIL${NC}: $file missing"
        ((FAILED++))
    fi
}

check_content() {
    local file="$1"
    local pattern="$2"
    local desc="$3"
    
    if [ ! -f "$file" ]; then
        echo -e "${RED}❌ FAIL${NC}: $file not found"
        ((FAILED++))
        return 1
    fi
    
    if grep -qi "$pattern" "$file"; then
        echo -e "${GREEN}✅ PASS${NC}: $desc"
        ((PASSED++))
    else
        echo -e "${RED}❌ FAIL${NC}: $desc not found in $file"
        ((FAILED++))
    fi
}

#############################################################################

header "PRODUCTION DEPLOYMENT VALIDATION - Phase 4.4"
echo ""

# 1. Check all critical files exist
header "1. CRITICAL FILES"
check_file ".env.production.template" "Environment template"
check_file "scripts/deploy-production.sh" "Deployment script"
check_file "SECURITY_AUDIT_CHECKLIST.md" "Security checklist"
check_file "INCIDENT_RESPONSE_PLAYBOOK.md" "Incident playbook"
check_file "PRODUCTION_DEPLOYMENT_GUIDE.md" "Deployment guide"
check_file "PRODUCTION_MONITORING_CONFIG.md" "Monitoring config"
check_file "PAYMENT_GATEWAY_PRODUCTION_DEPLOYMENT_COMPLETE.md" "Production summary"

echo ""

# 2. Check deployment script content
header "2. DEPLOYMENT SCRIPT"
check_content "scripts/deploy-production.sh" "STRIPE_API_KEY" "Stripe credential check"
check_content "scripts/deploy-production.sh" "PAYPAL" "PayPal credential check"
check_content "scripts/deploy-production.sh" "CONFIRMED" "Mandatory confirmation gate"
check_content "scripts/deploy-production.sh" "verify_prerequisites" "Prerequisites function"

echo ""

# 3. Check environment template
header "3. ENVIRONMENT TEMPLATE"
check_content ".env.production.template" "STRIPE" "Stripe configuration"
check_content ".env.production.template" "PAYPAL" "PayPal configuration"
check_content ".env.production.template" "DATABASE" "Database configuration"
check_content ".env.production.template" "SENTRY\|DATADOG" "Monitoring configuration"
check_content ".env.production.template" "CRITICAL\|LIVE" "Security warnings"

echo ""

# 4. Check security checklist
header "4. SECURITY AUDIT CHECKLIST"
check_content "SECURITY_AUDIT_CHECKLIST.md" "API Key Security" "API Key Security section"
check_content "SECURITY_AUDIT_CHECKLIST.md" "Database Security" "Database Security section"
check_content "SECURITY_AUDIT_CHECKLIST.md" "Network Security" "Network Security section"
check_content "SECURITY_AUDIT_CHECKLIST.md" "PCI" "PCI Compliance section"

echo ""

# 5. Check incident response
header "5. INCIDENT RESPONSE PLAYBOOK"
check_content "INCIDENT_RESPONSE_PLAYBOOK.md" "Payment.*Outage" "Payment Outage scenario"
check_content "INCIDENT_RESPONSE_PLAYBOOK.md" "Security.*Incident" "Security Incident scenario"
check_content "INCIDENT_RESPONSE_PLAYBOOK.md" "Webhook" "Webhook scenario"
check_content "INCIDENT_RESPONSE_PLAYBOOK.md" "escalation" "Escalation procedures"

echo ""

# 6. Check deployment guide
header "6. DEPLOYMENT GUIDE"
check_content "PRODUCTION_DEPLOYMENT_GUIDE.md" "Step.*1\|pre-deployment" "Deployment steps"
check_content "PRODUCTION_DEPLOYMENT_GUIDE.md" "checklist" "Pre-deployment checklist"
check_content "PRODUCTION_DEPLOYMENT_GUIDE.md" "rollback" "Rollback procedures"
check_content "PRODUCTION_DEPLOYMENT_GUIDE.md" "verify\|test" "Verification steps"

echo ""

# 7. Check monitoring config
header "7. MONITORING CONFIGURATION"
check_content "PRODUCTION_MONITORING_CONFIG.md" "metric\|threshold" "Metrics defined"
check_content "PRODUCTION_MONITORING_CONFIG.md" "sentry\|alert" "Sentry configuration"
check_content "PRODUCTION_MONITORING_CONFIG.md" "cloudwatch" "CloudWatch configuration"
check_content "PRODUCTION_MONITORING_CONFIG.md" "pagerduty" "PagerDuty configuration"

echo ""

# 8. Check deployment script is executable
header "8. DEPLOYMENT SCRIPT PERMISSIONS"
if [ -x "scripts/deploy-production.sh" ]; then
    echo -e "${GREEN}✅ PASS${NC}: deploy-production.sh is executable"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠️  WARN${NC}: deploy-production.sh needs chmod +x"
    ((WARNING++))
fi

echo ""

# 9. Check git configuration
header "9. GIT & SECURITY"
if grep -q "\.env" .gitignore 2>/dev/null; then
    echo -e "${GREEN}✅ PASS${NC}: .env files in .gitignore"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠️  WARN${NC}: Verify .env files are in .gitignore"
    ((WARNING++))
fi

if [ -f ".env.production.template" ] && ! grep -q "LIVE\|production" ".env.production.template" 2>/dev/null; then
    echo -e "${YELLOW}⚠️  WARN${NC}: Template missing security warnings"
    ((WARNING++))
else
    echo -e "${GREEN}✅ PASS${NC}: Security warnings in template"
    ((PASSED++))
fi

echo ""

# Summary
header "VALIDATION SUMMARY"
TOTAL=$((PASSED + FAILED + WARNING))

echo ""
echo -e "${GREEN}✅ Passed${NC}:   $PASSED"
echo -e "${RED}❌ Failed${NC}:   $FAILED"
echo -e "${YELLOW}⚠️  Warnings${NC}: $WARNING"
echo -e "📊 Total${NC}:    $TOTAL checks"
echo ""

if [ "$FAILED" -eq 0 ]; then
    echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}✅ PRODUCTION SETUP VALIDATION PASSED${NC}"
    echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "${GREEN}Status: READY FOR PRODUCTION DEPLOYMENT${NC}"
    echo ""
    echo "Next Steps:"
    echo "  1. Review all production files"
    echo "  2. Walk through SECURITY_AUDIT_CHECKLIST.md"
    echo "  3. Review INCIDENT_RESPONSE_PLAYBOOK.md"
    echo "  4. Obtain executive sign-offs"
    echo "  5. When ready:"
    echo "     cp .env.production.template .env.production"
    echo "     # Fill in LIVE Stripe/PayPal credentials"
    echo "     ./scripts/deploy-production.sh production CONFIRMED"
    echo ""
    exit 0
else
    echo -e "${RED}════════════════════════════════════════════════════════════${NC}"
    echo -e "${RED}❌ VALIDATION FAILED - Fix errors before proceeding${NC}"
    echo -e "${RED}════════════════════════════════════════════════════════════${NC}"
    echo ""
    exit 1
fi
