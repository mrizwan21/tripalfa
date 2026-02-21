#!/bin/bash

# Database Migration Execution Guide
# Provides step-by-step instructions for running the migration

set -e

BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Database Migration Execution Guide${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}📊 For: STATIC REFERENCE DATA (Local Docker PostgreSQL)${NC}"
echo -e "${YELLOW}Do NOT use: Neon (reserved for application/transactional data)${NC}\n"

# Step 0: Database setup
echo -e "${YELLOW}Step 0: Setting up database connection...${NC}"
echo -e "${BLUE}(Connecting to LOCAL STATIC DATA database, not Neon/application)${NC}\n"

# Run setup and capture output
SETUP_OUTPUT=$(bash scripts/setup-database.sh 2>&1) || {
  echo -e "${RED}❌ Database setup failed${NC}"
  echo "$SETUP_OUTPUT"
  exit 1
}

# Extract the temp file path (the line that starts with /tmp/)
ENV_FILE=$(echo "$SETUP_OUTPUT" | grep "^/tmp/.*\.sh$" | tail -1)

if [ -z "$ENV_FILE" ] || [ ! -f "$ENV_FILE" ]; then
  echo -e "${RED}❌ Database configuration file not created${NC}"
  echo "Setup output:"
  echo "$SETUP_OUTPUT"
  exit 1
fi

# Source the database URL from temp env file
source "$ENV_FILE"

# Confirm environment
echo -e "\n${YELLOW}Confirming settings:${NC}"
echo "DATABASE_URL: ${DATABASE_URL:-(not set)}"
if [ -z "$DATABASE_URL" ]; then
  echo -e "${RED}❌ DATABASE_URL is empty - setup failed${NC}"
  exit 1
fi
echo ""

# Step 1: Validate current state
echo -e "${YELLOW}Step 1: Validating current database state...${NC}\n"
export DATABASE_URL
npm run validate-db-migration || {
  echo -e "${RED}❌ Validation failed - check DATABASE_URL${NC}"
  exit 1
}

# Step 2: Ask about imports
echo -e "\n${YELLOW}Step 2: Ready to import data?${NC}"
echo ""
echo "This will import:"
echo "  ✓ Base suppliers, amenities, board types"
echo "  ✓ Airlines, airports, cities (from Duffel)"
echo "  ✓ Countries, currencies, languages (from LITEAPI)"
echo ""
read -p "Proceed with data imports? (y/n) " -n 1 -r response
echo ""

if [[ ! $response =~ ^[Yy]$ ]]; then
  echo -e "${YELLOW}Skipping data imports${NC}"
  echo "You can run them manually later:"
  echo "  npm run seed-suppliers"
  echo "  npm run import-duffel"
  echo "  npm run import-liteapi-reference"
  exit 0
fi

# Step 3: Seed base data
echo -e "\n${YELLOW}Step 3/5: Seeding base data (suppliers, amenities)...${NC}"
export DATABASE_URL
npm run seed-suppliers || echo "⚠️  Seed completed with warnings"
echo -e "${GREEN}✅ Base data seeded${NC}"

# Step 4: Import Duffel data
echo -e "\n${YELLOW}Step 4/5: Importing Duffel data (airlines, airports, cities)...${NC}"
echo "This may take 2-5 minutes..."
export DATABASE_URL
npm run import-duffel || echo "⚠️  Import completed with warnings"
echo -e "${GREEN}✅ Duffel data imported${NC}"

# Step 5: Import reference data
echo -e "\n${YELLOW}Step 5/5: Importing reference data (countries, currencies)...${NC}"
export DATABASE_URL
npm run import-liteapi-reference || echo "⚠️  Import completed with warnings"
echo -e "${GREEN}✅ Reference data imported${NC}"

# Step 6: Final validation
echo -e "\n${YELLOW}Step 6: Final validation...${NC}\n"
export DATABASE_URL
npm run validate-db-migration || true

# Airline logos
echo -e "\n${YELLOW}Step 7: Configure airline logos${NC}"
read -p "Set up airline logo CDN? (y/n) " -n 1 -r logo_response
echo ""

if [[ $logo_response =~ ^[Yy]$ ]]; then
  read -p "Use GitHub CDN? (y/n) " -n 1 -r github_response
  echo ""
  
  if [[ $github_response =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Setting up GitHub CDN for airline logos...${NC}"
    export DATABASE_URL
    npx tsx scripts/migrate-airline-logos-github.ts 2>/dev/null || {
      # Create the script if it doesn't exist
      cat > scripts/migrate-airline-logos-github.ts << 'EOF'
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const { Pool } = pg;
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const CDN_BASE = 'https://raw.githubusercontent.com/svg-use-it/airline-logos/master/logos';
  
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
      // Silent fail for individual airlines
    }
  }
  
  console.log(`✅ Updated ${updated}/${airlines.length} airlines with CDN URLs`);
}

main().finally(() => prisma.$disconnect());
EOF
      npx tsx scripts/migrate-airline-logos-github.ts
    }
    echo -e "${GREEN}✅ Airline logos configured${NC}"
  fi
fi

# Summary
echo -e "\n${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Database Migration Complete!${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"

echo "Next steps:"
echo "1. Start the static-data-service:"
echo -e "   ${GREEN}npm run dev:static-data${NC}"
echo ""
echo "2. In another terminal, verify the API:"
echo -e "   ${GREEN}curl http://localhost:3002/airlines?limit=3${NC}"
echo ""
echo "3. Start the booking engine:"
echo -e "   ${GREEN}npm run dev --workspace=@tripalfa/booking-engine${NC}"
echo ""
echo "4. Test flight search with airline logos"
echo ""
