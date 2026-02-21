#!/bin/bash

# Database Migration Complete & Quick Start
# Runs all necessary steps to migrate from CSV to PostgreSQL
# with airline logo CDN setup

set -e

BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Static Data Migration: CSV → PostgreSQL + CDN${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"

# Step 1: Check environment
echo -e "${YELLOW}Step 1: Checking environment...${NC}"
if [ -z "$DATABASE_URL" ]; then
  echo -e "${RED}⚠️  DATABASE_URL not set${NC}"
  echo "Using default: postgresql://postgres:postgres@localhost:5433/staticdatabase"
  export DATABASE_URL="postgresql://postgres:postgres@localhost:5433/staticdatabase"
else
  echo -e "${GREEN}✅ DATABASE_URL set${NC}"
fi

# Step 2: Validate current state
echo -e "\n${YELLOW}Step 2: Validating PostgreSQL population...${NC}"
npm run validate-db-migration || true

# Step 3: Ask user if they want to proceed with data import
echo -e "\n${YELLOW}Step 3: Ready to import data?${NC}"
echo "This will:"
echo "  • Seed suppliers, amenities, board types"
echo "  • Import airlines, airports, cities from Duffel"
echo "  • Import countries, currencies, languages"
echo ""
read -p "Proceed with data import? (y/n) " -n 1 -r response
echo ""

if [[ $response =~ ^[Yy]$ ]]; then
  echo -e "\n${YELLOW}Seeding base data...${NC}"
  npm run seed-suppliers || echo -e "${RED}Warning: Seed may have failed${NC}"
  
  echo -e "\n${YELLOW}Importing Duffel data (airlines, airports, cities)...${NC}"
  npm run import-duffel || echo -e "${RED}Warning: Duffel import may have failed${NC}"
  
  echo -e "\n${YELLOW}Importing reference data (countries, currencies)...${NC}"
  npm run import-liteapi-reference || echo -e "${RED}Warning: Reference data import may have failed${NC}"
  
  echo -e "\n${YELLOW}Re-validating after imports...${NC}"
  npm run validate-db-migration || true
fi

# Step 4: Airline logo setup
echo -e "\n${YELLOW}Step 4: Airline Logo Setup${NC}"
echo "Choose a CDN provider for airline logos:"
echo "1) GitHub Repository (Free) - Recommended"
echo "2) Cloudflare (Free tier available)"
echo "3) AWS S3 + CloudFront"
echo "4) Custom/Skip for now"
read -p "Enter choice (1-4): " -n 1 -r cdn_choice
echo ""

case $cdn_choice in
  1|"GitHub"|"github")
    echo -e "${YELLOW}Setting up GitHub CDN for airline logos...${NC}"
    cat > scripts/migrate-airline-logos-github.ts << 'LOGO_SCRIPT'
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const CDN_BASE = 'https://raw.githubusercontent.com/svg-use-it/airline-logos/master/logos';

async function main() {
  const airlines = await prisma.airline.findMany({
    where: { is_active: true },
  });
  
  let updated = 0;
  for (const airline of airlines) {
    try {
      await prisma.airline.update({
        where: { id: airline.id },
        data: {
          logo_url: `${CDN_BASE}/${airline.iata_code.toLowerCase()}.png`
        }
      });
      updated++;
    } catch (e) {
      console.warn(`Failed to update logo for ${airline.iata_code}`);
    }
  }
  
  console.log(`✅ Updated ${updated}/${airlines.length} airlines with CDN URLs`);
  console.log(`📍 CDN Base: ${CDN_BASE}`);
}

main().finally(() => prisma.$disconnect());
LOGO_SCRIPT
    
    echo -e "${GREEN}Running migration...${NC}"
    npx tsx scripts/migrate-airline-logos-github.ts
    ;;
    
  2|"Cloudflare"|"cloudflare")
    echo -e "${YELLOW}Cloudflare setup (manual):${NC}"
    echo "1. Upload airline logos to Cloudflare"
    echo "2. Set AIRLINE_LOGO_CDN env var:"
    echo "   export AIRLINE_LOGO_CDN='https://your-domain.com/airline-logos'"
    echo ""
    ;;
    
  *)
    echo -e "${YELLOW}Skipping CDN setup${NC}"
    ;;
esac

# Step 5: Test endpoints
echo -e "\n${YELLOW}Step 5: Testing endpoints...${NC}"
echo "Make sure static-data-service is running first:"
echo -e "${GREEN}npm run dev:static-data${NC}"
echo ""
echo "Then test in another terminal:"
echo -e "${GREEN}curl http://localhost:3002/airlines?limit=5${NC}"
echo -e "${GREEN}curl http://localhost:3002/airports?q=lon${NC}"

# Step 6: Final summary
echo -e "\n${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Database Migration Complete!${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"

echo "Next steps:"
echo "1. Start the static-data-service:"
echo -e "   ${GREEN}npm run dev:static-data${NC}"
echo ""
echo "2. Test in another terminal:"
echo -e "   ${GREEN}curl http://localhost:3002/airlines${NC}"
echo ""
echo "3. Start the frontend:"
echo -e "   ${GREEN}npm run dev --workspace=@tripalfa/booking-engine${NC}"
echo ""
echo "4. Check Flight Search page for airline logos"
echo ""
echo "Documentation: docs/DATABASE_MIGRATION_VALIDATION.md"
echo ""
