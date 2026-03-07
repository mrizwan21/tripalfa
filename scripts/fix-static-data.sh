#!/bin/bash

# Configuration
LITEAPI_API_KEY="prod_1ca7e299-f889-4462-8e32-ce421ab66a93"
BASE_URL="https://api.liteapi.travel/v3.0/data"
DB_URL="postgresql://postgres@localhost:5432/staticdatabase"

echo "🚀 Starting Unified Static Data Import via Hybrid Shell/Node..."

# 1. Countries
echo "🌐 Importing Countries..."
curl -s -H "X-API-Key: $LITEAPI_API_KEY" "$BASE_URL/countries" | node scripts/generate-sql.js countries | psql "$DB_URL" > /dev/null
echo "✅ Countries imported."

# 2. Hotel Types
echo "🏨 Importing Hotel Types..."
curl -s -H "X-API-Key: $LITEAPI_API_KEY" "$BASE_URL/hotelTypes" | node scripts/generate-sql.js hotelTypes | psql "$DB_URL" > /dev/null
echo "✅ Hotel Types imported."

# 3. IATA Codes
echo "✈️ Importing IATA Codes..."
curl -s -H "X-API-Key: $LITEAPI_API_KEY" "$BASE_URL/iataCodes" | node scripts/generate-sql.js iataCodes | psql "$DB_URL" > /dev/null
echo "✅ IATA Codes imported."

# 4. Cities
echo "🏙️ Importing Cities for selected countries..."
COUNTRIES_TO_PROCESS="AE US GB FR DE IT ES IN PH EG SA QA OM KW"

for country_code in $COUNTRIES_TO_PROCESS; do
  printf "  Processing %s... " "$country_code"
  curl -s -H "X-API-Key: $LITEAPI_API_KEY" "$BASE_URL/cities?countryCode=$country_code" | node scripts/generate-sql.js cities "$country_code" | psql "$DB_URL" > /dev/null
  echo "Done"
done

echo "✨ All selected tasks completed successfully!"
