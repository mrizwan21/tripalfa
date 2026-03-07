#!/bin/bash

# TripAlfa NEON Setup Automation
# Interactive setup wizard for configuring NEON database with local PostgreSQL static data

set -e

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║     TripAlfa NEON Cloud Database Setup Wizard              ║"
echo "║                                                            ║"
echo "║  This wizard will help you set up:                        ║"
echo "║  • NEON cloud database (for application data)             ║"
echo "║  • Local PostgreSQL (for static hotel/flight data)        ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Step 1: Check if NEON credentials exist
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}STEP 1: NEON Connection String${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Load .env.local if it exists
if [ -f ".env.local" ]; then
  export $(grep -v '^#' .env.local | xargs -0)
fi

if [ -n "$DIRECT_DATABASE_URL" ] && [[ $DIRECT_DATABASE_URL == *"neon.tech"* ]]; then
  echo -e "${GREEN}✓${NC} NEON connection string already configured"
  echo "  URL: ${DIRECT_DATABASE_URL:0:50}..."
  echo ""
  read -p "Do you want to update it? (yes/no) [no]: " UPDATE_NEON
  UPDATE_NEON=${UPDATE_NEON:-no}
else
  UPDATE_NEON="yes"
fi

if [ "$UPDATE_NEON" = "yes" ] || [ "$UPDATE_NEON" = "y" ]; then
  echo ""
  echo "You'll need a NEON connection string. Here's how to get one:"
  echo ""
  echo "  1. Visit: https://neon.tech"
  echo "  2. Sign up or log in"
  echo "  3. Create a new project (or select existing)"
  echo "  4. Click 'Connect' button"
  echo "  5. Copy the full connection string (psql/connection string)"
  echo ""
  echo "Example format:"
  echo "  postgresql://default:PASSWORD@ep-xxxxx.us-east-1.aws.neon.tech/neondb?sslmode=require"
  echo ""
  
  read -p "Paste your NEON connection string: " NEON_URL
  
  if [ -z "$NEON_URL" ]; then
    echo -e "${RED}✗ Error: Connection string cannot be empty${NC}"
    exit 1
  fi
  
  if [[ ! $NEON_URL == *"postgresql://"* ]]; then
    echo -e "${RED}✗ Error: Invalid connection string format${NC}"
    exit 1
  fi
  
  # Verify connection
  echo ""
  echo "Verifying NEON connection..."
  if psql "$NEON_URL" -c "SELECT version();" &> /dev/null; then
    echo -e "${GREEN}✓${NC} Successfully connected to NEON"
  else
    echo -e "${RED}✗${NC} Could not connect to NEON"
    echo "  Please check:"
    echo "  - Connection string is correct"
    echo "  - Internet connection is working"
    exit 1
  fi
fi

# Step 2: Check Local PostgreSQL
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}STEP 2: Local PostgreSQL Setup${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check if PostgreSQL is running
if brew services list 2>/dev/null | grep -q "postgresql@14"; then
  PG_STATUS=$(brew services list 2>/dev/null | grep "postgresql@14" | awk '{print $2}')
  if [ "$PG_STATUS" = "started" ]; then
    echo -e "${GREEN}✓${NC} PostgreSQL@14 is running"
  else
    echo -e "${YELLOW}⚠${NC} PostgreSQL@14 is not running"
    read -p "Start PostgreSQL now? (yes/no) [yes]: " START_PG
    START_PG=${START_PG:-yes}
    if [ "$START_PG" = "yes" ] || [ "$START_PG" = "y" ]; then
      brew services start postgresql@14
      echo -e "${GREEN}✓${NC} PostgreSQL started"
    fi
  fi
else
  echo -e "${YELLOW}⚠${NC} PostgreSQL@14 not found"
  echo "  Install it with: brew install postgresql@14"
  exit 1
fi

# Check if staticdatabase exists
echo ""
if psql -U postgres -h localhost -d staticdatabase -c "SELECT 1;" &> /dev/null; then
  echo -e "${GREEN}✓${NC} staticdatabase already exists"
else
  echo -e "${YELLOW}⚠${NC} staticdatabase does not exist"
  read -p "Create it now? (yes/no) [yes]: " CREATE_DB
  CREATE_DB=${CREATE_DB:-yes}
  if [ "$CREATE_DB" = "yes" ] || [ "$CREATE_DB" = "y" ]; then
    psql -U postgres -h localhost -c "CREATE DATABASE staticdatabase;"
    echo -e "${GREEN}✓${NC} staticdatabase created"
  fi
fi

# Step 3: Update .env.local
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}STEP 3: Update Environment Variables${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Backup .env.local
if [ -f ".env.local" ]; then
  cp .env.local .env.local.backup
  echo -e "${GREEN}✓${NC} Backed up .env.local → .env.local.backup"
fi

# Update NEON variables if needed
if [ "$UPDATE_NEON" = "yes" ] || [ "$UPDATE_NEON" = "y" ]; then
  # Use sed to update the variables
  if [ -f ".env.local" ]; then
    # Update DIRECT_DATABASE_URL
    if grep -q "DIRECT_DATABASE_URL=" .env.local; then
      sed -i '' "s|^DIRECT_DATABASE_URL=.*|DIRECT_DATABASE_URL=\"$NEON_URL\"|" .env.local
    else
      echo "DIRECT_DATABASE_URL=\"$NEON_URL\"" >> .env.local
    fi
    
    # Update DATABASE_URL
    if grep -q "^DATABASE_URL=" .env.local; then
      sed -i '' "s|^DATABASE_URL=.*|DATABASE_URL=\"$NEON_URL\"|" .env.local
    else
      echo "DATABASE_URL=\"$NEON_URL\"" >> .env.local
    fi
    
    echo -e "${GREEN}✓${NC} Updated NEON credentials in .env.local"
  fi
fi

# Ensure STATIC_DATABASE_URL is set
if ! grep -q "STATIC_DATABASE_URL=" .env.local; then
  echo 'STATIC_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/staticdatabase"' >> .env.local
fi

echo -e "${GREEN}✓${NC} Environment variables configured"

# Step 4: Initialize NEON Database
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}STEP 4: Initialize NEON Database Schema${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

read -p "Initialize NEON database schema? (yes/no) [yes]: " INIT_NEON
INIT_NEON=${INIT_NEON:-yes}

if [ "$INIT_NEON" = "yes" ] || [ "$INIT_NEON" = "y" ]; then
  echo ""
  echo "Generating Prisma client..."
  pnpm dlx prisma generate --schema database/prisma/schema.prisma
  
  echo ""
  echo "Creating tables in NEON..."
  pnpm dlx prisma db push --schema database/prisma/schema.prisma
  
  echo -e "${GREEN}✓${NC} NEON database initialized"
fi

# Step 5: Verification
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}STEP 5: Verify Configuration${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo "Running configuration check..."
bash scripts/check-neon-config.sh

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✓ Setup Complete!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo "Next steps:"
echo "  1. Start services:     bash scripts/start-local-dev.sh"
echo "  2. Check service health: curl http://localhost:3000/health"
echo "  3. View logs:          tail -f .logs/*.log"
echo ""

echo "Hybrid database features:"
echo "  • NEON Cloud: Transactions, users, bookings, payments"
echo "  • Local PostgreSQL: Static data (hotels, flights, reference)"
echo ""

read -p "Start services now? (yes/no) [no]: " START_SERVICES
if [ "$START_SERVICES" = "yes" ] || [ "$START_SERVICES" = "y" ]; then
  pkill -f "tsx watch" || true   # Stop existing services if any
  sleep 2
  bash scripts/start-local-dev.sh
fi

echo ""
