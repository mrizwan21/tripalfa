#!/bin/bash

# Currency Database Verification Script
# Verifies that all 147 currencies are properly imported with complete metadata

echo "🔍 Currency Database Verification"
echo "================================="

# Source the .env file
if [ -f ".env" ]; then
    echo "📍 Loading environment variables from .env file..."
    set -a
    source .env
    set +a
fi

# Get database URL
DATABASE_URL="${LOCAL_DATABASE_URL:-$DATABASE_URL}"

if [ -z "$DATABASE_URL" ]; then
    echo "❌ No database URL found. Please set LOCAL_DATABASE_URL or DATABASE_URL in your .env file."
    exit 1
fi

echo "📍 Using database URL: ${DATABASE_URL//:[^@]*@/:***MASKED***@}"

# Run verification queries
echo ""
echo "📊 Running verification queries..."

# 1. Total currency count
TOTAL_CURRENCIES=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM shared.currencies;" | xargs)
echo "✅ Total currencies: $TOTAL_CURRENCIES"

# 2. Currencies with complete metadata
COMPLETE_CURRENCIES=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM shared.currencies WHERE symbol IS NOT NULL AND symbol != '' AND decimal_precision IS NOT NULL AND rounding_mode IS NOT NULL;" | xargs)
echo "✅ Currencies with complete metadata: $COMPLETE_CURRENCIES"

# 3. Currencies with symbols
SYMBOL_CURRENCIES=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM shared.currencies WHERE symbol IS NOT NULL AND symbol != '';" | xargs)
echo "✅ Currencies with symbols: $SYMBOL_CURRENCIES"

# 4. Currencies with decimal precision
PRECISION_CURRENCIES=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM shared.currencies WHERE decimal_precision IS NOT NULL;" | xargs)
echo "✅ Currencies with decimal precision: $PRECISION_CURRENCIES"

# 5. Currencies with rounding mode
ROUNDING_CURRENCIES=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM shared.currencies WHERE rounding_mode IS NOT NULL;" | xargs)
echo "✅ Currencies with rounding mode: $ROUNDING_CURRENCIES"

# 6. Exchange rate history count
EXCHANGE_RATES=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM shared.exchange_rate_history;" | xargs)
echo "✅ Exchange rate history records: $EXCHANGE_RATES"

# 7. Check for missing major currencies
echo ""
echo "🌍 Checking major currency coverage..."

MAJOR_CURRENCIES="USD,EUR,GBP,JPY,CHF,CAD,AUD,NZD,SEK,NOK,DKK,PLN,CZK,HUF,RON,CNY,HKD,SGD,MYR,THB,PHP,IDR,VND,KRW,INR,PKR,BDT,LKR,AED,SAR,QAR,KWD,BHD,OMR,JOD,ILS,TRY,EGP,ZAR,NGN,GHS,KES,TZS,UGX,MUR,MAD,DZD,TND,MXN,BRL,ARS,CLP,COP,PEN,UYU"
MISSING_COUNT=0

for currency in $(echo $MAJOR_CURRENCIES | tr ',' '\n'); do
    EXISTS=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM shared.currencies WHERE code = '$currency';" | xargs)
    if [ "$EXISTS" -eq 0 ]; then
        echo "❌ Missing major currency: $currency"
        MISSING_COUNT=$((MISSING_COUNT + 1))
    fi
done

if [ $MISSING_COUNT -eq 0 ]; then
    echo "✅ All major currencies present"
else
    echo "⚠️  $MISSING_COUNT major currencies missing"
fi

# 8. Show currencies with missing symbols
echo ""
echo "⚠️  Currencies with missing symbols:"
MISSING_SYMBOLS=$(psql "$DATABASE_URL" -c "SELECT code, name FROM shared.currencies WHERE symbol IS NULL OR symbol = '' ORDER BY code;" 2>/dev/null)
if [ $? -eq 0 ] && [ -n "$MISSING_SYMBOLS" ]; then
    echo "$MISSING_SYMBOLS"
else
    echo "✅ All currencies have symbols"
fi

# 9. Show sample currencies
echo ""
echo "📋 Sample currencies with metadata:"
SAMPLE_CURRENCIES=$(psql "$DATABASE_URL" -c "SELECT code, name, symbol, decimal_precision, rounding_mode FROM shared.currencies WHERE code IN ('USD', 'EUR', 'GBP', 'JPY', 'CNY', 'INR', 'AED', 'SAR', 'KWD', 'BHD', 'OMR', 'JOD', 'TRY', 'ILS', 'ZAR', 'NGN', 'BRL', 'MXN', 'CAD', 'AUD', 'CHF', 'SEK', 'NOK', 'DKK', 'PLN', 'CZK', 'HUF', 'RON', 'RUB', 'KZT', 'KRW', 'HKD', 'SGD', 'MYR', 'THB', 'PHP', 'IDR', 'VND') ORDER BY code;" 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "$SAMPLE_CURRENCIES"
fi

# 10. Summary
echo ""
echo "============================================================"
echo "📊 VERIFICATION SUMMARY"
echo "============================================================"
echo "Total Currencies: $TOTAL_CURRENCIES"
echo "Complete Metadata: $COMPLETE_CURRENCIES ($(($COMPLETE_CURRENCIES * 100 / TOTAL_CURRENCIES))%)"
echo "With Symbols: $SYMBOL_CURRENCIES ($(($SYMBOL_CURRENCIES * 100 / TOTAL_CURRENCIES))%)"
echo "With Precision: $PRECISION_CURRENCIES ($(($PRECISION_CURRENCIES * 100 / TOTAL_CURRENCIES))%)"
echo "With Rounding: $ROUNDING_CURRENCIES ($(($ROUNDING_CURRENCIES * 100 / TOTAL_CURRENCIES))%)"
echo "Exchange Rate Records: $EXCHANGE_RATES"
echo "=".repeat(60)

# Check if we have the target of 147 currencies
if [ "$TOTAL_CURRENCIES" -ge 147 ]; then
    echo "✅ Target achieved: 147+ currencies imported"
else
    echo "⚠️  Target not met: Only $TOTAL_CURRENCIES currencies (target: 147)"
fi

# Check symbol coverage
SYMBOL_PERCENTAGE=$(($SYMBOL_CURRENCIES * 100 / $TOTAL_CURRENCIES))
if [ "$SYMBOL_PERCENTAGE" -ge 95 ]; then
    echo "✅ Symbol coverage excellent: ${SYMBOL_PERCENTAGE}%"
elif [ "$SYMBOL_PERCENTAGE" -ge 80 ]; then
    echo "✅ Symbol coverage good: ${SYMBOL_PERCENTAGE}%"
else
    echo "⚠️  Symbol coverage needs improvement: ${SYMBOL_PERCENTAGE}%"
fi

echo ""
echo "🎯 RECOMMENDATIONS:"
echo "==================="
if [ "$TOTAL_CURRENCIES" -lt 147 ]; then
    echo "1. Run comprehensive currency import: ./scripts/run-currency-import-comprehensive.sh"
fi

if [ "$SYMBOL_PERCENTAGE" -lt 95 ]; then
    echo "2. Update currency symbols for missing currencies"
fi

if [ "$EXCHANGE_RATES" -eq 0 ]; then
    echo "3. Set OPENEXCHANGE_API_KEY and run: ./scripts/run-exchange-rates-import.sh"
fi

if [ "$MISSING_COUNT" -gt 0 ]; then
    echo "4. Check for missing major currencies"
fi

echo "5. Set up scheduled updates: ./scripts/setup-currency-scheduler.sh"
echo "6. Monitor system health: ./scripts/monitor-currency-system.sh"
echo ""