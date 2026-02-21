#!/bin/bash

# Database Connection Helper
# Detects and configures the correct DATABASE_URL for your environment

set -e

BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Create a temporary env file to persist DATABASE_URL
TEMP_ENV_FILE="/tmp/.tripalfa_db_env_$$.sh"
TRAP_CLEANUP() {
  # Don't delete - parent will use it
  :  
}
trap TRAP_CLEANUP EXIT

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Database Connection Setup${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}(For STATIC DATA PostgreSQL - not for application/Neon)${NC}\n"

# Check for existing DATABASE_URL in environment or .env
if [ -n "$DATABASE_URL" ]; then
  echo -e "${GREEN}✅ DATABASE_URL already set in environment${NC}"
  echo "Current: $DATABASE_URL"
  echo ""
  read -p "Use this database? (y/n) " -n 1 -r response
  echo ""
  if [[ $response =~ ^[Yy]$ ]]; then
    echo "export DATABASE_URL=\"$DATABASE_URL\"" > "$TEMP_ENV_FILE"
    echo "$TEMP_ENV_FILE"
    exit 0
  fi
elif [ -f .env ]; then
  # Look for a static DB URL (not the Neon one)
  DB_URL=$(grep "^DATABASE_URL=" .env | cut -d'=' -f2- | tr -d "'\"" | head -n1)
  if [ -n "$DB_URL" ] && [[ "$DB_URL" == *"localhost"* ]]; then
    echo -e "${GREEN}✅ Local static database found in .env${NC}"
    echo "URL: $DB_URL"
    echo ""
    read -p "Use this database? (y/n) " -n 1 -r response
    echo ""
    if [[ $response =~ ^[Yy]$ ]]; then
      echo "export DATABASE_URL=\"$DB_URL\"" > "$TEMP_ENV_FILE"
      echo "$TEMP_ENV_FILE"
      exit 0
    fi
  fi
fi

# List available options
echo -e "${YELLOW}Available database options:${NC}\n"
echo "1) ${GREEN}Local Docker PostgreSQL (RECOMMENDED)${NC}"
echo "   └─ localhost:5433/staticdatabase (for static reference data)"
echo ""
echo "2) Manual/Custom connection string"
echo "   └─ For alternative local or development databases"
echo ""
echo -e "${YELLOW}⚠️  Note: Neon database in .env is for application (transactional) data${NC}\n"
echo ""

read -p "Select option (1-2): " -n 1 -r choice
echo ""

case $choice in
  1)
    DB_URL="postgresql://postgres:postgres@localhost:5433/staticdatabase"
    echo -e "\n${GREEN}✅ Using local Docker static database${NC}"
    echo "Connection: $DB_URL"
    
    # Try to connect
    if command -v psql &> /dev/null; then
      echo ""
      echo -e "${YELLOW}Testing connection...${NC}"
      if PGPASSWORD=postgres psql -h localhost -p 5433 -U postgres -d staticdatabase -c "SELECT 1" &> /dev/null; then
        echo -e "${GREEN}✅ Connection successful${NC}"
      else
        echo -e "${YELLOW}⚠️  Connection test skipped (check Docker is running)${NC}"
        echo "Start with: docker compose up -d"
      fi
    fi
    ;;
    
  2)
    read -p "Enter full DATABASE_URL: " DB_URL
    echo -e "${GREEN}✅ Using custom database${NC}"
    ;;
    
  *)
    echo -e "${RED}❌ Invalid choice${NC}"
    exit 1
    ;;
esac

# Write to temp env file so parent process can source it
echo "export DATABASE_URL=\"$DB_URL\"" > "$TEMP_ENV_FILE"
echo "$TEMP_ENV_FILE"

echo ""
echo -e "${YELLOW}📝 Configuration:${NC}"
echo "Database: Static Reference Data"
echo "Purpose:  Airlines, airports, countries, currencies, amenities, etc."
echo ""
echo "To persist permanently, add to your .env:"
echo -e "${YELLOW}DATABASE_URL='$DB_URL'${NC}"
echo ""
echo -e "${YELLOW}⚠️  Keep Neon DATABASE_URL separate for application (transactional) data${NC}"
echo ""
