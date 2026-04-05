#!/bin/bash

##############################################################################
# 🔍 Currency System Code Audit
# Systematically finds currency/price/amount issues across booking engine
# Usage: bash scripts/audit-currency-usage.sh
##############################################################################

BOOKING_ENGINE_DIR="apps/booking-engine/src"
REPORT_FILE="CURRENCY_AUDIT_REPORT.md"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}💱 CURRENCY SYSTEM CODE AUDIT${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Initialize report
cat > "$REPORT_FILE" << 'EOF'
# 💱 Currency Audit Report

**Generated**: $(date)
**Target Directory**: apps/booking-engine/src

---

## 📊 Summary

EOF

# ============================================================================
# AUDIT 1: Find all price/amount references
# ============================================================================

echo -e "${YELLOW}🔍 AUDIT 1: Finding all price/amount references...${NC}"

echo "" >> "$REPORT_FILE"
echo "## Audit 1: Price/Amount References" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

PRICE_REFS=$(grep -r "\.price\|\.amount\|totalPrice\|finalPrice\|basePrice" "$BOOKING_ENGINE_DIR" \
  --include="*.tsx" --include="*.ts" 2>/dev/null | wc -l)

echo -e "${GREEN}✅ Found $PRICE_REFS references${NC}"
echo "Found: $PRICE_REFS references" >> "$REPORT_FILE"

# Show sample references
echo "" >> "$REPORT_FILE"
echo "### Sample References:" >> "$REPORT_FILE"
echo '```' >> "$REPORT_FILE"
grep -r "\.price\|\.amount" "$BOOKING_ENGINE_DIR" \
  --include="*.tsx" --include="*.ts" 2>/dev/null | head -10 >> "$REPORT_FILE"
echo '```' >> "$REPORT_FILE"

# ============================================================================
# AUDIT 2: Check for formatCurrency usage
# ============================================================================

echo -e "${YELLOW}🔍 AUDIT 2: Checking formatCurrency usage...${NC}"

echo "" >> "$REPORT_FILE"
echo "## Audit 2: formatCurrency Usage" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

FORMAT_USAGE=$(grep -r "formatCurrency" "$BOOKING_ENGINE_DIR" \
  --include="*.tsx" --include="*.ts" 2>/dev/null | wc -l)

echo -e "${GREEN}✅ Found $FORMAT_USAGE formatCurrency calls${NC}"
echo "Found: $FORMAT_USAGE formatCurrency calls" >> "$REPORT_FILE"

echo "" >> "$REPORT_FILE"
echo "### Components Using formatCurrency:" >> "$REPORT_FILE"
echo '```' >> "$REPORT_FILE"
grep -r "formatCurrency" "$BOOKING_ENGINE_DIR" \
  --include="*.tsx" --include="*.ts" 2>/dev/null | cut -d: -f1 | sort -u | sed 's|^.*components/||' >> "$REPORT_FILE"
echo '```' >> "$REPORT_FILE"

# ============================================================================
# AUDIT 3: Find hardcoded decimal places
# ============================================================================

echo -e "${YELLOW}🔍 AUDIT 3: Finding hardcoded decimal places...${NC}"

echo "" >> "$REPORT_FILE"
echo "## Audit 3: Hardcoded Decimal Places (❌ ISSUES)" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

HARDCODED=$(grep -r "\.toFixed\|toPrecision\|\.floor\|\.ceil\|Math\.round" "$BOOKING_ENGINE_DIR" \
  --include="*.tsx" --include="*.ts" 2>/dev/null)

HARDCODED_COUNT=$(echo "$HARDCODED" | wc -l)

if [ "$HARDCODED_COUNT" -gt 0 ]; then
  echo -e "${RED}⚠️  Found $HARDCODED_COUNT hardcoded decimal operations${NC}"
  echo "Found: $HARDCODED_COUNT hardcoded decimal operations" >> "$REPORT_FILE"
  echo "" >> "$REPORT_FILE"
  echo "### Details:" >> "$REPORT_FILE"
  echo '```' >> "$REPORT_FILE"
  echo "$HARDCODED" | head -15 >> "$REPORT_FILE"
  echo '```' >> "$REPORT_FILE"
else
  echo -e "${GREEN}✅ No hardcoded decimal places found${NC}"
  echo "✅ No hardcoded decimal places found" >> "$REPORT_FILE"
fi

# ============================================================================
# AUDIT 4: Check for rawprices without formatting
# ============================================================================

echo -e "${YELLOW}🔍 AUDIT 4: Finding raw price displays...${NC}"

echo "" >> "$REPORT_FILE"
echo "## Audit 4: Raw Price Displays (❌ ISSUES)" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

RAW_PRICES=$(grep -r "{.*price.*}" "$BOOKING_ENGINE_DIR" \
  --include="*.tsx" 2>/dev/null | grep -v "formatCurrency\|currency-formatter" | head -20)

RAW_PRICE_COUNT=$(echo "$RAW_PRICES" | grep -c ".")

if [ "$RAW_PRICE_COUNT" -gt 0 ]; then
  echo -e "${RED}⚠️  Found $RAW_PRICE_COUNT potential raw price displays${NC}"
  echo "Found: $RAW_PRICE_COUNT potential raw price displays" >> "$REPORT_FILE"
  echo "" >> "$REPORT_FILE"
  echo "### Sample Issues:" >> "$REPORT_FILE"
  echo '```' >> "$REPORT_FILE"
  echo "$RAW_PRICES" >> "$REPORT_FILE"
  echo '```' >> "$REPORT_FILE"
else
  echo -e "${GREEN}✅ No raw price displays found${NC}"
  echo "✅ No raw price displays found" >> "$REPORT_FILE"
fi

# ============================================================================
# AUDIT 5: Check for manual currency handling
# ============================================================================

echo -e "${YELLOW}🔍 AUDIT 5: Finding manual currency handling...${NC}"

echo "" >> "$REPORT_FILE"
echo "## Audit 5: Manual Currency Handling (❌ ISSUES)" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

MANUAL=$(grep -r "currency === 'JPY'\|code === 'BHD'\|decimal_places ==\|if.*currency" "$BOOKING_ENGINE_DIR" \
  --include="*.tsx" --include="*.ts" 2>/dev/null)

MANUAL_COUNT=$(echo "$MANUAL" | wc -l)

if [ "$MANUAL_COUNT" -gt 0 ]; then
  echo -e "${RED}⚠️  Found $MANUAL_COUNT manual currency checks${NC}"
  echo "Found: $MANUAL_COUNT manual currency checks (should use formatter instead)" >> "$REPORT_FILE"
  echo "" >> "$REPORT_FILE"
  echo "### Details:" >> "$REPORT_FILE"
  echo '```' >> "$REPORT_FILE"
  echo "$MANUAL" >> "$REPORT_FILE"
  echo '```' >> "$REPORT_FILE"
else
  echo -e "${GREEN}✅ No manual currency handling found${NC}"
  echo "✅ No manual currency handling found" >> "$REPORT_FILE"
fi

# ============================================================================
# AUDIT 6: Check specific priority components
# ============================================================================

echo -e "${YELLOW}🔍 AUDIT 6: Analyzing priority components...${NC}"

echo "" >> "$REPORT_FILE"
echo "## Audit 6: Priority Components Analysis" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Check FareUpsellPopup
echo "### FareUpsellPopup.tsx" >> "$REPORT_FILE"
if [ -f "$BOOKING_ENGINE_DIR/components/FareUpsellPopup.tsx" ]; then
  POPUP_ISSUES=$(grep -c "\.amount\|\.price\|toFixed" "$BOOKING_ENGINE_DIR/components/FareUpsellPopup.tsx" 2>/dev/null || echo "0")
  echo "- Issues found: $POPUP_ISSUES" >> "$REPORT_FILE"
  echo -e "${GREEN}✅ FareUpsellPopup.tsx analyzed${NC}"
else
  echo "- File not found" >> "$REPORT_FILE"
  echo -e "${YELLOW}⚠️  FareUpsellPopup.tsx not found${NC}"
fi

# Check HotelCard
echo "### HotelCard.tsx" >> "$REPORT_FILE"
if [ -f "$BOOKING_ENGINE_DIR/components/hotel/HotelCard.tsx" ]; then
  CARD_ISSUES=$(grep -c "\.amount\|\.price\|toFixed" "$BOOKING_ENGINE_DIR/components/hotel/HotelCard.tsx" 2>/dev/null || echo "0")
  echo "- Issues found: $CARD_ISSUES" >> "$REPORT_FILE"
  echo -e "${GREEN}✅ HotelCard.tsx analyzed${NC}"
else
  echo "- File not found" >> "$REPORT_FILE"
  echo -e "${YELLOW}⚠️  HotelCard.tsx not found${NC}"
fi

# Check WalletBalance
echo "### WalletBalance.tsx" >> "$REPORT_FILE"
if [ -f "$BOOKING_ENGINE_DIR/components/WalletBalance.tsx" ]; then
  WALLET_ISSUES=$(grep -c "\.amount\|\.balance\|toFixed" "$BOOKING_ENGINE_DIR/components/WalletBalance.tsx" 2>/dev/null || echo "0")
  echo "- Issues found: $WALLET_ISSUES" >> "$REPORT_FILE"
  echo -e "${GREEN}✅ WalletBalance.tsx analyzed${NC}"
else
  echo "- File not found" >> "$REPORT_FILE"
  echo -e "${YELLOW}⚠️  WalletBalance.tsx not found${NC}"
fi

# Check CardPaymentProcessor
echo "### CardPaymentProcessor.tsx" >> "$REPORT_FILE"
if [ -f "$BOOKING_ENGINE_DIR/components/CardPaymentProcessor.tsx" ]; then
  PAYMENT_ISSUES=$(grep -c "\.amount\|price\|roundCurrency" "$BOOKING_ENGINE_DIR/components/CardPaymentProcessor.tsx" 2>/dev/null || echo "0")
  echo "- Issues found: $PAYMENT_ISSUES" >> "$REPORT_FILE"
  echo -e "${GREEN}✅ CardPaymentProcessor.tsx analyzed${NC}"
else
  echo "- File not found" >> "$REPORT_FILE"
  echo -e "${YELLOW}⚠️  CardPaymentProcessor.tsx not found${NC}"
fi

# ============================================================================
# Final Summary
# ============================================================================

echo "" >> "$REPORT_FILE"
echo "---" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "## Summary" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "**Audit Date**: $(date)" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "### Metrics:" >> "$REPORT_FILE"
echo "- Total price/amount references: $PRICE_REFS" >> "$REPORT_FILE"
echo "- formatCurrency calls: $FORMAT_USAGE" >> "$REPORT_FILE"
echo "- Hardcoded decimals found: $HARDCODED_COUNT" >> "$REPORT_FILE"
echo "- Raw price displays found: $RAW_PRICE_COUNT" >> "$REPORT_FILE"
echo "- Manual currency checks: $MANUAL_COUNT" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "### Recommended Actions:" >> "$REPORT_FILE"
echo "1. Address the $HARDCODED_COUNT hardcoded decimal operations in Week 2" >> "$REPORT_FILE"
echo "2. Review the $RAW_PRICE_COUNT raw price displays for formatting" >> "$REPORT_FILE"
echo "3. Replace $MANUAL_COUNT manual currency checks with formatter calls" >> "$REPORT_FILE"
echo "4. Follow the component update timeline in CURRENCY_INTEGRATION_ROADMAP.md" >> "$REPORT_FILE"

echo -e "\n${BLUE}========================================${NC}"
echo -e "${GREEN}✅ Audit Complete!${NC}"
echo -e "${BLUE}========================================${NC}\n"

echo -e "Report saved to: ${YELLOW}$REPORT_FILE${NC}"
echo -e "\nSummary:"
echo -e "  Price/Amount references: ${YELLOW}$PRICE_REFS${NC}"
echo -e "  formatCurrency calls: ${GREEN}$FORMAT_USAGE${NC}"
echo -e "  Hardcoded decimals: ${RED}$HARDCODED_COUNT${NC}"
echo -e "  Raw price displays: ${RED}$RAW_PRICE_COUNT${NC}"
echo -e "  Manual currency checks: ${RED}$MANUAL_COUNT${NC}"

echo -e "\n📖 Next: Read $REPORT_FILE for detailed findings"
echo -e "📗 Then: Follow WEEK1_CODE_AUDIT_GUIDE.md for action items\n"
