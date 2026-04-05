#!/bin/bash
# Quick Data Import - Uses sample SQL data for immediate testing
# No API keys required!

set -e

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║      TripAlfa v2.0 Quick Data Import                      ║"
echo "║      Sample test data for development & demo              ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Check if sample-test-data.sql exists
if [ ! -f "$(dirname "$0")/../sample-test-data.sql" ]; then
  echo "❌ Error: sample-test-data.sql not found"
  echo "   Expected location: /sample-test-data.sql"
  exit 1
fi

echo "📋 Data to be imported:"
echo "   🌍 Countries (10)"
echo "   💵 Currencies (10)"
echo "   🗣️  Languages (10)"
echo "   ✈️  Airports (14)"
echo "   🏨 Hotels (60)"
echo "   🛫 Airlines (10)"
echo ""

# Check PostgreSQL connection
echo "🔍 Checking PostgreSQL connection..."
if ! psql -d tripalfa_local -c "SELECT 1" > /dev/null 2>&1; then
  echo "❌ Error: Cannot connect to tripalfa_local database"
  echo "   Make sure PostgreSQL is running: /Users/mohamedrizwan/Desktop/TripAlfa\\ -\\ Node"
  echo "   Command: createdb tripalfa_local (if not exists)"
  exit 1
fi

echo "✅ PostgreSQL connected"
echo ""

# Show current data counts
echo "📊 Current database state:"
psql -d tripalfa_local -c "
  SELECT 'Countries' as entity, COUNT(*) as count FROM shared.countries
  UNION ALL
  SELECT 'Currencies', COUNT(*) FROM shared.currencies
  UNION ALL
  SELECT 'Languages', COUNT(*) FROM shared.languages
  UNION ALL
  SELECT 'Airports', COUNT(*) FROM flight.airports
  UNION ALL
  SELECT 'Hotels', COUNT(*) FROM hotel.hotels
  UNION ALL
  SELECT 'Airlines', COUNT(*) FROM flight.airlines
  ORDER BY entity;
"

echo ""
echo "📥 Importing sample data..."
psql -d tripalfa_local -f sample-test-data.sql

echo ""
echo "✨ Import complete!"
echo ""
echo "📊 Verification: New data counts"
psql -d tripalfa_local -c "
  SELECT 'Countries' as entity, COUNT(*) as count FROM shared.countries
  UNION ALL
  SELECT 'Currencies', COUNT(*) FROM shared.currencies
  UNION ALL
  SELECT 'Languages', COUNT(*) FROM shared.languages
  UNION ALL
  SELECT 'Airports', COUNT(*) FROM flight.airports
  UNION ALL
  SELECT 'Hotels', COUNT(*) FROM hotel.hotels
  UNION ALL
  SELECT 'Airlines', COUNT(*) FROM flight.airlines
  ORDER BY entity;
"

echo ""
echo "✅ Success! Data is ready for testing"
echo ""
echo "🚀 Next steps:"
echo "   1. Services running on:"
echo "      • API Gateway: http://localhost:3030"
echo "      • Booking Engine: http://localhost:5174"
echo "      • B2B Admin: http://localhost:5173"
echo ""
echo "   2. Test API endpoints:"
echo "      curl http://localhost:3030/health"
echo ""
echo "   3. Access frontend applications in browser"
echo ""
