#!/bin/bash

# TripAlfa Hybrid Database Configuration Checker
# This script verifies that both NEON and local PostgreSQL are properly configured

set -e

echo "=================================="
echo "TripAlfa Hybrid Database Checker"
echo "=================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Track results
NEON_OK=false
LOCAL_OK=false
ALL_OK=true

# Helper functions
check_command() {
  if command -v "$1" &> /dev/null; then
    echo -e "${GREEN}✓${NC} $1 found"
    return 0
  else
    echo -e "${RED}✗${NC} $1 not found"
    return 1
  fi
}

# 1. Check Prerequisites
echo -e "${BLUE}[1/5]${NC} Checking prerequisites..."
echo ""

check_command "psql" || ALL_OK=false
check_command "pnpm" || ALL_OK=false

echo ""

# 2. Load environment variables
echo -e "${BLUE}[2/5]${NC} Loading environment configuration..."
echo ""

# Check if .env.local exists
if [ -f ".env.local" ]; then
  echo -e "${GREEN}✓${NC} .env.local file found"
  # Source the .env file (careful with this in production)
  export $(grep -v '^#' .env.local | xargs -0)
else
  echo -e "${RED}✗${NC} .env.local not found"
  ALL_OK=false
  exit 1
fi

echo ""

# 3. Check NEON Configuration
echo -e "${BLUE}[3/5]${NC} Checking NEON Cloud Database..."
echo ""

if [ -z "$DIRECT_DATABASE_URL" ] && [ -z "$DATABASE_URL" ]; then
  echo -e "${RED}✗${NC} Neither DIRECT_DATABASE_URL nor DATABASE_URL is set"
  echo "  Please configure NEON credentials in .env.local"
  ALL_OK=false
else
  NEON_URL="${DIRECT_DATABASE_URL:-$DATABASE_URL}"
  
  if [[ $NEON_URL == *"neon.tech"* ]] || [[ $NEON_URL == *"neondb"* ]]; then
    echo -e "${GREEN}✓${NC} NEON connection string detected"
    
    # Try to connect
    if psql "$NEON_URL" -c "SELECT version();" &> /dev/null; then
      echo -e "${GREEN}✓${NC} Successfully connected to NEON"
      
      # Check tables exist
      TABLE_COUNT=$(psql "$NEON_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null || echo "0")
      echo -e "${GREEN}✓${NC} Found $TABLE_COUNT tables in NEON"
      
      NEON_OK=true
    else
      echo -e "${YELLOW}⚠${NC} Could not connect to NEON"
      echo "  Please verify:"
      echo "  1. NEON connection string is correct"
      echo "  2. Internet connection is working"
      echo "  3. Credentials are still valid"
      echo ""
      echo "  NEON URL (first 50 chars): ${NEON_URL:0:50}..."
      ALL_OK=false
    fi
  else
    echo -e "${YELLOW}⚠${NC} Connection string doesn't appear to be NEON"
    echo "  Expected: postgresql://...neon.tech/neondb..."
    echo "  Got: ${NEON_URL:0:50}..."
    ALL_OK=false
  fi
fi

echo ""

# 4. Check Local PostgreSQL Configuration
echo -e "${BLUE}[4/5]${NC} Checking Local PostgreSQL (Static Database)..."
echo ""

if [ -z "$STATIC_DATABASE_URL" ]; then
  echo -e "${RED}✗${NC} STATIC_DATABASE_URL is not set"
  ALL_OK=false
else
  echo -e "${GREEN}✓${NC} STATIC_DATABASE_URL is configured"
  
  # Try to connect
  if psql "$STATIC_DATABASE_URL" -c "SELECT version();" &> /dev/null; then
    echo -e "${GREEN}✓${NC} Successfully connected to local PostgreSQL"
    
    # Check if hotels table exists (key static data)
    if psql "$STATIC_DATABASE_URL" -t -c "SELECT 1 FROM information_schema.tables WHERE table_name='hotels';" 2>/dev/null | grep -q 1; then
      HOTEL_COUNT=$(psql "$STATIC_DATABASE_URL" -t -c "SELECT COUNT(*) FROM hotels;" 2>/dev/null || echo "0")
      echo -e "${GREEN}✓${NC} Hotels table exists ($HOTEL_COUNT records)"
      LOCAL_OK=true
    else
      echo -e "${YELLOW}⚠${NC} Hotels table not found in local database"
      echo "  Static data may not be seeded yet"
      echo "  See: docs/DUFFEL_API_INTEGRATION.md for seeding instructions"
    fi
  else
    echo -e "${RED}✗${NC} Could not connect to local PostgreSQL"
    echo "  Please verify:"
    echo "  1. PostgreSQL is running: brew services start postgresql@14"
    echo "  2. staticdatabase exists"
    echo "  3. Connection string is correct"
    ALL_OK=false
  fi
fi

echo ""

# 5. Check Environment Variables Summary
echo -e "${BLUE}[5/5]${NC} Configuration Summary..."
echo ""

echo "Environment Variables Set:"
if [ -n "$DIRECT_DATABASE_URL" ]; then
  NEON_DISPLAY="${DIRECT_DATABASE_URL:0:50}..."
  echo -e "${GREEN}✓${NC} DIRECT_DATABASE_URL: $NEON_DISPLAY"
elif [ -n "$DATABASE_URL" ]; then
  NEON_DISPLAY="${DATABASE_URL:0:50}..."
  echo -e "${GREEN}✓${NC} DATABASE_URL: $NEON_DISPLAY"
fi

if [ -n "$STATIC_DATABASE_URL" ]; then
  LOCAL_DISPLAY="${STATIC_DATABASE_URL:0:50}..."
  echo -e "${GREEN}✓${NC} STATIC_DATABASE_URL: $LOCAL_DISPLAY"
fi

echo ""

# Final Summary
echo "=================================="
echo "Configuration Check Result"
echo "=================================="
echo ""

if [ "$NEON_OK" = true ] && [ "$LOCAL_OK" = true ]; then
  echo -e "${GREEN}✓ NEON Cloud Database:${NC} READY"
  echo -e "${GREEN}✓ Local PostgreSQL Database:${NC} READY"
  echo ""
  echo -e "${GREEN}✓ Hybrid database setup is complete!${NC}"
  echo ""
  echo "Next steps:"
  echo "1. Start services: bash scripts/start-local-dev.sh"
  echo "2. Check service health: curl http://localhost:3000/health"
  echo "3. View logs: tail -f .logs/*.log"
  echo ""
elif [ "$NEON_OK" = true ]; then
  echo -e "${GREEN}✓ NEON Cloud Database:${NC} READY"
  echo -e "${YELLOW}⚠ Local PostgreSQL Database:${NC} NOT READY"
  echo ""
  echo "Your NEON connection works, but local static database needs setup:"
  echo "1. Start local PostgreSQL: brew services start postgresql@14"
  echo "2. Create database: psql -U postgres -c \"CREATE DATABASE staticdatabase;\""
  echo "3. Seed static data: See docs/DUFFEL_API_INTEGRATION.md"
  echo ""
elif [ "$LOCAL_OK" = true ]; then
  echo -e "${YELLOW}⚠ NEON Cloud Database:${NC} NOT READY"
  echo -e "${GREEN}✓ Local PostgreSQL Database:${NC} READY"
  echo ""
  echo "Your local database works, but NEON needs configuration:"
  echo "1. Get NEON connection: Sign up at https://neon.tech"
  echo "2. Copy connection string to .env.local"
  echo "3. Run: pnpm dlx prisma db push"
  echo ""
else
  echo -e "${RED}✗ Hybrid database setup:${NC} INCOMPLETE"
  echo ""
  echo "Issues found:"
  [ "$NEON_OK" = false ] && echo "  - NEON connection not working"
  [ "$LOCAL_OK" = false ] && echo "  - Local PostgreSQL not working"
  echo ""
  echo "See documentation:"
  echo "  - NEON setup: NEON_SETUP_QUICKSTART.md"
  echo "  - Architecture: NEON_HYBRID_DATABASE_SETUP.md"
  echo "  - Environment: .env.neon.example"
  echo ""
  exit 1
fi

echo "=================================="
echo ""

# Return appropriate exit code
if [ "$ALL_OK" = true ]; then
  exit 0
else
  exit 1
fi
