#!/bin/sh
# ============================================
# Environment Variable Validator for TripAlfa
# ============================================
# This script validates required environment variables before services start.
# It provides clear error messages when variables are missing.

set -e

echo "============================================"
echo "TripAlfa Environment Variable Validator"
echo "============================================"

ERRORS=0
WARNINGS=0

# Required variables
if [ -z "$NEON_DATABASE_URL" ]; then
    echo "ERROR: NEON_DATABASE_URL is not set!"
    echo "  This is REQUIRED for all services to connect to the database."
    echo "  Get your connection string from: https://console.neon.tech/app/projects"
    echo "  Example: postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require"
    ERRORS=$((ERRORS + 1))
else
    echo "✓ NEON_DATABASE_URL is set"
fi

# Optional but recommended variables
if [ -z "$JWT_SECRET" ]; then
    echo "WARN: JWT_SECRET is not set. Using default (not secure for production!)"
    WARNINGS=$((WARNINGS + 1))
else
    echo "✓ JWT_SECRET is set"
fi

if [ -z "$DUFFEL_API_KEY" ]; then
    echo "INFO: DUFFEL_API_KEY is not set. Flight booking will be limited."
else
    echo "✓ DUFFEL_API_KEY is set"
fi

if [ -z "$LITEAPI_API_KEY" ]; then
    echo "INFO: LITEAPI_API_KEY is not set. Hotel booking will be limited."
else
    echo "✓ LITEAPI_API_KEY is set"
fi

if [ -z "$KIWI_AFFIL_ID" ] || [ -z "$KIWI_API_KEY" ]; then
    echo "INFO: KIWI_AFFIL_ID and/or KIWI_API_KEY not set. Kiwi deposit integration will be disabled."
else
    echo "✓ KIWI_AFFIL_ID and KIWI_API_KEY are set"
fi

echo "============================================"
if [ $ERRORS -gt 0 ]; then
    echo "VALIDATION FAILED: $ERRORS error(s), $WARNINGS warning(s)"
    echo ""
    echo "Please set the required environment variables:"
    echo "  export NEON_DATABASE_URL='your-connection-string'"
    echo ""
    echo "Or create a .env.docker file with your variables."
    exit 1
fi

echo "VALIDATION PASSED: $WARNINGS warning(s)"
echo "Environment is ready. Starting services..."
exit 0
