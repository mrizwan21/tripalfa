# Currency & Exchange Rate Import Guide for TripAlfa v2.0

## Overview

TripAlfa implements a sophisticated currency and exchange rate system with:

- **High-precision rates**: numeric(18,8) for accurate financial calculations
- **ISO 4217 decimal placement**: Respects each currency's standard decimal places
- **Intelligent rounding**: Rounds based on source and target currency precision
- **Cross-rate computation**: Efficiently calculates rates between non-USD pairs
- **Real-time updates**: Fetches latest rates from OpenExchange API

## Database Schema

### shared.currencies

Stores base currency metadata:

```sql
CREATE TABLE shared.currencies (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  code character(3) NOT NULL UNIQUE,      -- ISO 4217 code (USD, EUR, GBP, etc)
  name character varying(100) NOT NULL,  -- Full name (US Dollar, Euro, etc)
  symbol character varying(10) NOT NULL, -- Display symbol ($, €, £, etc)
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
```

### shared.exchange_rate_history

Tracks historical exchange rates with high precision:

```sql
CREATE TABLE shared.exchange_rate_history (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_currency_id uuid NOT NULL REFERENCES shared.currencies(id),
  to_currency_id uuid NOT NULL REFERENCES shared.currencies(id),
  rate numeric(18,8) NOT NULL,            -- High precision (max 18 digits, 8 decimals)
  source character varying(50),           -- 'openexchangerates.org', 'liteapi', etc
  recorded_at timestamp with time zone DEFAULT now(),

  UNIQUE(from_currency_id, to_currency_id, recorded_at),
  INDEX on (from_currency_id),
  INDEX on (to_currency_id),
  INDEX on (recorded_at DESC)
);
```

## Decimal Precision by Currency

### Zero-Decimal Currencies (0 decimals)

Used for currencies with no fractional units:

- **CLP** (Chilean Peso)
- **ISK** (Icelandic Króna)
- **JPY** (Japanese Yen)
- **KRW** (South Korean Won)
- **KMF** (Comorian Franc)
- **RWF** (Rwandan Franc)
- **UGX** (Ugandan Shilling)
- **VND** (Vietnamese Đồng)
- **VUV** (Vanuatu Vatu)
- **XAF, XOF, XPF** (CFA/CFP Francs)
- **YER** (Yemeni Rial)

### Three-Decimal Currencies (3 decimals)

Used for precious metals and some regional currencies:

- **BHD** (Bahraini Dinar)
- **JOD** (Jordanian Dinar)
- **KWD** (Kuwaiti Dinar)
- **LYD** (Libyan Dinar)
- **OMR** (Omani Rial)
- **TND** (Tunisian Dinar)

### Standard Currencies (2 decimals)

Most common currencies worldwide:

- **USD** (US Dollar)
- **EUR** (Euro)
- **GBP** (British Pound)
- **JPY** (Japanese Yen) → Actually 0
- **AUD** (Australian Dollar)
- **CAD** (Canadian Dollar)
- **CHF** (Swiss Franc)
- **CNY** (Chinese Yuan)
- **INR** (Indian Rupee)
- **AED** (UAE Dirham)
- **SGD** (Singapore Dollar)
- ... and 100+ others

## Rounding Logic

### Storage Precision

Exchange rates are stored with **8 decimal places** (numeric(18,8)):

```sql
-- Example: 1 USD = 85.45623456 INR
INSERT INTO shared.exchange_rate_history (from_currency_id, to_currency_id, rate, source)
VALUES (usd_id, inr_id, 85.45623456, 'openexchangerates.org');
```

### Calculation Rounding

When calculating rates, we consider both currencies' standard decimal places:

```typescript
// Example: Converting JPY (0 decimals) to USD (2 decimals)
function roundRate(rate: number, fromDecimals: number, toDecimals: number): string {
  // Use maximum decimals + extra for intermediate calculations
  const maxDecimals = Math.max(0, 2) + 4; // 6 decimals

  const scaled = Math.round(rate * Math.pow(10, maxDecimals)) / Math.pow(10, maxDecimals);
  return scaled.toFixed(8); // Store with full precision
}

// JPY→USD: 1 JPY = 0.00756234 USD
// USD→JPY: 1 USD = 132.2456789 JPY (inverse)
```

### Application Rounding

When displaying or using rates in calculations, round to the target currency's decimals:

```typescript
// Display 1 USD = 85.46 INR (2 decimals)
const displayRate = parseFloat(rate).toFixed(CURRENCY_DECIMALS['INR']); // "85.46"

// Display 1 USD = 132 JPY (0 decimals)
const displayRate = parseFloat(rate).toFixed(CURRENCY_DECIMALS['JPY']); // "132"
```

## Exchange Rate Types

### Direct Rates (Base USD)

Fetched directly from OpenExchange API:

```
USD→EUR, USD→GBP, USD→JPY, etc.
rate = baseRates['EUR'] // Direct from API
```

### Inverse Rates (To USD)

Calculated as inverse of base rates:

```
EUR→USD = 1 / (baseRates['EUR'])
GBP→USD = 1 / (baseRates['GBP'])
```

### Cross Rates (Non-USD pairs)

Calculated through USD intermediary to avoid redundant API calls:

```
EUR→GBP = (EUR→USD) × (USD→GBP)
         = (1 / baseRates['EUR']) × baseRates['GBP']

JPY→CNY = (JPY→USD) × (USD→CNY)
        = (1 / baseRates['JPY']) × baseRates['CNY']
```

## Import Process

### Step-by-Step Execution

```bash
# 1. Run the currency import script
tsx scripts/import-currencies-v2.ts

# 2. Verify currencies were imported
psql -d tripalfa_local -c "SELECT code, name, symbol FROM shared.currencies LIMIT 10;"

# 3. Check exchange rates
psql -d tripalfa_local -c "
  SELECT c1.code, c2.code, rate
  FROM shared.exchange_rate_history h
  JOIN shared.currencies c1 ON h.from_currency_id = c1.id
  JOIN shared.currencies c2 ON h.to_currency_id = c2.id
  WHERE c1.code = 'USD'
  LIMIT 10;
"

# 4. Count rates
psql -d tripalfa_local -c "SELECT COUNT(*) FROM shared.exchange_rate_history;"
```

### Data Flow

```
┌─────────────────────┐
│   LiteAPI           │
│ (Currency Metadata) │
└──────────┬──────────┘
           │
           ▼
    ┌─────────────────┐
    │   Import        │
    │ Currencies      │
    └──────┬──────────┘
           │
           ├─────────────────────────────────┐
           │                                 │
      ┌────▼──────────┐          ┌──────────▼─────┐
      │ USD as Base   │          │  Open Exchange  │
      │ (Most stable) │          │   API Rates     │
      └──────┬────────┘          └────────┬────────┘
             │                            │
             └──────────┬─────────────────┘
                        │
              ┌─────────▼──────────┐
              │  Calculate All     │
              │  Currency Pairs    │
              │  (N x N matrix)    │
              └─────────┬──────────┘
                        │
              ┌─────────▼──────────────────┐
              │ Apply Rounding Rules       │
              │ (ISO 4217 Decimals)        │
              │ Store numeric(18,8)        │
              └─────────┬──────────────────┘
                        │
              ┌─────────▼──────────────────┐
              │ exchange_rate_history      │
              │ Table (persistent)         │
              └───────────────────────────┘
```

## Configuration

### Environment Variables

```bash
# OpenExchange Rates API
VITE_OPENEXCHANGERATES_APP_ID="your_app_id_here"

# Database (already configured)
LOCAL_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/tripalfa_local"

# LiteAPI for currency metadata
LITEAPI_API_KEY="your_liteapi_key_here"
```

### API Rate Limits

- **OpenExchange Rates**:
  - Free: 1,000 requests/month
  - Pro: Unlimited
  - Daily limit: Use sparingly in production
- **LiteAPI**:
  - Varies by plan
  - Check API documentation

## Practical Examples

### Example 1: Currency Conversion with Rounding

```typescript
// Convert 1000 USD to INR
const usdToInrRate = 85.45623456; // From database

// Display to user with INR precision (2 decimals)
const displayAmount = 1000 * parseFloat(usdToInrRate).toFixed(2);
// Result: 1000 × 85.46 = 85,460 INR

// Database: Maintain full precision
const dbAmount = 1000 * usdToInrRate;
// Result: 1000 × 85.45623456 = 85,456.23456 (lost to numeric(18,2) in app)
```

### Example 2: Wallet Conversion

```typescript
// User has 100 EUR, wants to convert to JPY
// 1 EUR = 134.8756234 JPY

// Step 1: Get rate (numeric(18,8) from database)
const eurToJpyRate = parseFloat('134.8756234'); // From DB query

// Step 2: Calculate (JPY has 0 decimals)
const jpy = 100 * eurToJpyRate; // 13,487.56234

// Step 3: Round for display (0 decimals for JPY)
const displayJpy = Math.round(jpy); // 13,488 JPY

// Step 4: Store in wallet (use actual calculated value)
const walletBalance = jpy; // 13,487.56234
```

### Example 3: Historical Rate Lookup

```typescript
// Find the rate that was used on a specific date for a booking

SELECT
  c1.code as from_currency,
  c2.code as to_currency,
  rate,
  source,
  recorded_at
FROM shared.exchange_rate_history h
JOIN shared.currencies c1 ON h.from_currency_id = c1.id
JOIN shared.currencies c2 ON h.to_currency_id = c2.id
WHERE c1.code = 'USD'
  AND c2.code = 'EUR'
  AND DATE(recorded_at) = '2025-01-15'
ORDER BY recorded_at DESC
LIMIT 1;
```

## Troubleshooting

### Problem: Rates are all NULL

```bash
# Check if OpenExchange API key is valid
curl "https://openexchangerates.org/api/latest.json?app_id=YOUR_API_ID&base=USD"

# Check environment variable
echo $VITE_OPENEXCHANGERATES_APP_ID
```

### Problem: Decimal precision is lost

```typescript
// ❌ WRONG: Float loses precision
const rate = 1.23456789012345; // Actually 1.2345678901234502

// ✅ RIGHT: Use string for financial data
const rate = '1.23456789012345'; // Exact
const decimal = parseDecimal('1.23456789012345'); // Prisma Decimal
```

### Problem: Rates seem incorrect

```bash
# Verify calculation method and rounding
SELECT
  c1.code,
  c2.code,
  rate,
  (1::numeric / rate) as inverse_rate
FROM shared.exchange_rate_history h
JOIN shared.currencies c1 ON h.from_currency_id = c1.id
JOIN shared.currencies c2 ON h.to_currency_id = c2.id
WHERE c1.code = 'USD' AND c2.code = 'EUR'
ORDER BY recorded_at DESC
LIMIT 1;
```

## Best Practices

1. **Always use numeric(18,8) for rates** in database
2. **Round to display decimals only at presentation layer** (not before storing)
3. **Use the same base currency** (USD) for all rate fetches
4. **Cache rates** for 1-24 hours to respect API limits
5. **Log rate updates** with timestamp for audit trail
6. **Test with edge cases**: JPY (0 decimals), JOD (3 decimals), etc.
7. **Use transaction locks** when updating multiple related rates

## Performance Optimization

### Caching Strategy

```typescript
// Cache rates for 1 hour
const RATE_CACHE_TTL = 3600000; // 1 hour in ms
const rateCache = new Map<string, { rate: string; timestamp: number }>();

function getCachedRate(from: string, to: string): string | null {
  const now = Date.now();
  const cache = rateCache.get(`${from}:${to}`);

  if (cache && now - cache.timestamp < RATE_CACHE_TTL) {
    return cache.rate;
  }

  return null;
}

function setCachedRate(from: string, to: string, rate: string): void {
  rateCache.set(`${from}:${to}`, { rate, timestamp: Date.now() });
}
```

### Database Indexes

```sql
-- Already created by schema, but verify they exist:
CREATE INDEX idx_exchange_rate_from ON shared.exchange_rate_history(from_currency_id);
CREATE INDEX idx_exchange_rate_to ON shared.exchange_rate_history(to_currency_id);
CREATE INDEX idx_exchange_rate_time ON shared.exchange_rate_history(recorded_at DESC);
```

## Integration Points

### Wallet Service (wallet-service)

- Uses rates for balance conversion
- Updates wallet balances when payment received in different currency

### Booking Service (booking-service)

- Calculates trip prices in user's preferred currency
- Stores booking rate used (for historical accuracy)

### Payment Service (payment-service)

- Applies rates for currency conversion during payment processing
- Records exact rate used for dispute resolution

## Future Enhancements

1. **Multi-source rates**: Compare rates from multiple APIs
2. **Real-time updates**: WebSocket feed for live rates
3. **Rate forecasting**: Predict rates for future bookings
4. **Bid-ask spreads**: Different buy/sell rates
5. **Crypto integration**: BTC, ETH, etc.
6. **Hedge rates**: Lock rates for future payments
