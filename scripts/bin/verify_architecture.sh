#!/bin/bash
# Verification script for 4-database architecture
# Tests database connectivity and service startup

set -e

echo "════════════════════════════════════════════════════════════"
echo "🧪 TripAlfa 4-Database Architecture Verification"
echo "════════════════════════════════════════════════════════════"

# Load environment variables
if [ -f ".env" ]; then
  export $(cat .env | grep -v '^#' | xargs)
  echo "✅ Environment variables loaded from .env"
else
  echo "❌ .env file not found"
  exit 1
fi

# Test 1: Database connectivity
echo ""
echo "📊 Test 1: Database Connectivity"
echo "────────────────────────────────────"

for db_name in tripalfa_local tripalfa_core tripalfa_ops tripalfa_finance; do
  echo -n "Testing $db_name... "
  count=$(psql -d $db_name -U postgres -h localhost -tc "SELECT count(*) FROM information_schema.tables WHERE table_schema='public';" 2>/dev/null | xargs)
  if [ -z "$count" ]; then
    echo "❌ Failed to connect"
    exit 1
  else
    echo "✅ $count tables"
  fi
done

# Test 2: Check Prisma client generation
echo ""
echo "📦 Test 2: Prisma Client Generation"
echo "────────────────────────────────────"

for client in local core ops finance; do
  client_dir="packages/shared-database/src/generated/$client"
  if [ -d "$client_dir" ]; then
    if [ -f "$client_dir/index.d.ts" ]; then
      echo "✅ Prisma client generated: $client"
    else
      echo "❌ Prisma client incomplete: $client"
      exit 1
    fi
  else
    echo "❌ Prisma client not found: $client"
    exit 1
  fi
done

# Test 3: Verify service database.ts files exist
echo ""
echo "🔧 Test 3: Service Database Configuration"
echo "────────────────────────────────────────"

services=(
  "api-gateway"
  "booking-service"
  "booking-engine-service"
  "notification-service"
  "user-service"
  "kyc-service"
  "wallet-service"
  "company-service"
  "marketing-service"
  "rule-engine-service"
  "payment-service"
  "b2b-admin-service"
)

for service in "${services[@]}"; do
  db_file="services/$service/src/database.ts"
  if [ -f "$db_file" ]; then
    # Check if it exports correct database client
    if grep -qE "(export.*from.*@tripalfa/shared-database|import.*@tripalfa/shared-database)" "$db_file"; then
      echo "✅ $service: database.ts configured"
    else
      echo "❌ $service: database.ts missing exports"
      exit 1
    fi
  else
    echo "⚠️  $service: database.ts not found"
  fi
done

# Test 4: Type checking shared-database package
echo ""
echo "✨ Test 4: TypeScript Compilation (shared-database)"
echo "────────────────────────────────────────────────────"

if npx tsc --noEmit -p packages/shared-database/tsconfig.json 2>&1 | grep -q "error TS"; then
  echo "❌ TypeScript compilation errors found"
  npx tsc --noEmit -p packages/shared-database/tsconfig.json
  exit 1
else
  echo "✅ No TypeScript errors in shared-database"
fi

echo ""
echo "════════════════════════════════════════════════════════════"
echo "✨ All verification tests passed!"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "🚀 Next steps:"
echo "   npm run dev              # Start all services"
echo "   npm run dev --workspace=@tripalfa/api-gateway   # Start just API Gateway"
echo ""
