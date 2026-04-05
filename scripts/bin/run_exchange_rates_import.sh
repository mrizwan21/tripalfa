#!/bin/bash

# Live Exchange Rate Import Script
# Fetches real-time exchange rates from OpenExchangeRates API

echo "💱 Starting Live Exchange Rate Import"
echo "📍 Database: tripalfa_local"

# Source the .env file to load environment variables
if [ -f ".env" ]; then
    echo "📍 Loading environment variables from .env file..."
    set -a  # automatically export all variables
    source .env
    set +a
fi

# Check for required API key
if [ -z "$OPENEXCHANGE_API_KEY" ]; then
    echo "❌ OPENEXCHANGE_API_KEY environment variable is required"
    echo "Please set it in your .env file:"
    echo "OPENEXCHANGE_API_KEY=your_api_key_here"
    echo ""
    echo "💡 You can get a free API key from: https://openexchangerates.org/signup/free"
    exit 1
fi

echo "📍 Using OpenExchangeRates API"
echo "📍 Base currency: USD"
echo "📍 Target currencies: 80+ major world currencies"

# Run the TypeScript exchange rate import script
echo "🚀 Executing live exchange rate import..."
npm run ts-node scripts/import-exchange-rates-live.ts

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Live exchange rate import completed successfully!"
    echo ""
    echo "📊 Summary:"
    echo "   - Fetched real-time rates from OpenExchangeRates.org"
    echo "   - Updated exchange_rate_history table with latest rates"
    echo "   - Maintained historical data for rate tracking"
    echo ""
    echo "📚 Next steps:"
    echo "   1. Set up scheduled updates: Add to crontab for daily updates"
    echo "   2. Monitor rates: Use scripts/monitor-currency-system.sh"
    echo "   3. Use in application: Query exchange_rate_history table for latest rates"
    echo "   4. Currency conversion: Use rates relative to USD base currency"
    echo ""
    echo "⏰ Recommended schedule: Daily at 00:00 UTC (when OXR updates)"
    echo "   Add to crontab: 0 0 * * * /path/to/tripalfa/scripts/run-exchange-rates-import.sh"
    echo ""
else
    echo "❌ Live exchange rate import failed!"
    exit 1
fi