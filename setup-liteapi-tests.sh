#!/bin/bash

# LiteAPI Test Setup Script
# This script helps you configure the API key for hotel booking tests

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║         LiteAPI Hotel Testing - Setup Wizard               ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Check if .env.test already exists
if [ -f "$PROJECT_ROOT/.env.test" ]; then
    echo "✓ .env.test already exists"
    echo ""
    echo "Current configuration:"
    grep -E "^[^#]" "$PROJECT_ROOT/.env.test" | head -5
    echo ""
    read -p "Do you want to overwrite it? (y/n): " -n 1 -r OVERWRITE
    echo ""
    
    if [[ ! $OVERWRITE =~ ^[Yy]$ ]]; then
        echo "Setup cancelled. Using existing .env.test"
        exit 0
    fi
fi

echo "To get your API key:"
echo "1. Visit: https://dashboard.liteapi.travel/auth/login"
echo "2. Sign up or log in"
echo "3. Copy your Sandbox API Key (format: sand_xxxxx)"
echo ""

read -p "Enter your LiteAPI Sandbox API Key: " API_KEY

# Validate API key format
if [[ ! $API_KEY =~ ^sand_ ]]; then
    echo "⚠️  Warning: Key should start with 'sand_' for sandbox"
    echo "   (provided: ${API_KEY:0:10}...)"
    read -p "Continue anyway? (y/n): " -n 1 -r CONTINUE
    echo ""
    if [[ ! $CONTINUE =~ ^[Yy]$ ]]; then
        echo "Setup cancelled."
        exit 1
    fi
fi

# Optional: Ask for test city
echo ""
echo "Test Configuration (press Enter to use defaults)"
read -p "Test city [Paris]: " TEST_CITY
TEST_CITY=${TEST_CITY:-Paris}

read -p "Test country code [FR]: " TEST_COUNTRY
TEST_COUNTRY=${TEST_COUNTRY:-FR}

read -p "Number of adults [2]: " TEST_ADULTS
TEST_ADULTS=${TEST_ADULTS:-2}

# Optional: Enable verbose mode
echo ""
read -p "Enable verbose output by default? (y/n): " -n 1 -r VERBOSE
echo ""
VERBOSE_MODE="false"
if [[ $VERBOSE =~ ^[Yy]$ ]]; then
    VERBOSE_MODE="true"
fi

# Create .env.test
cat > "$PROJECT_ROOT/.env.test" << EOF
# LiteAPI Hotel Testing Configuration
# Generated: $(date)

# API Key (keep this private!)
LITEAPI_API_KEY=$API_KEY

# Test parameters
LITEAPI_TEST_CITY=$TEST_CITY
LITEAPI_TEST_COUNTRY=$TEST_COUNTRY
LITEAPI_TEST_ADULTS=$TEST_ADULTS

# API endpoints
LITEAPI_API_BASE_URL=https://api.liteapi.travel/v3.0
LITEAPI_BOOK_BASE_URL=https://book.liteapi.travel/v3.0

# Request timeout (milliseconds)
LITEAPI_TIMEOUT_MS=90000

# Debug options
VERBOSE=$VERBOSE_MODE
DEBUG=false
EOF

echo ""
echo "✓ .env.test created successfully!"
echo ""
echo "Configuration:"
echo "  City: $TEST_CITY ($TEST_COUNTRY)"
echo "  Adults: $TEST_ADULTS"
echo "  API Key: ${API_KEY:0:10}...${API_KEY: -4}"
echo "  Verbose: $VERBOSE_MODE"
echo ""
echo "Next steps:"
echo ""
echo "  Run tests:"
echo "    npm run test:api:liteapi"
echo ""
echo "  Run with verbose output:"
echo "    VERBOSE=true npm run test:api:liteapi"
echo ""
echo "  Run comprehensive suite:"
echo "    npm run test:api:liteapi:comprehensive"
echo ""
echo "⚠️  Remember:"
echo "  - Never commit .env.test to git (already in .gitignore)"
echo "  - Keep your API key private"
echo "  - Rotate keys regularly"
echo ""
