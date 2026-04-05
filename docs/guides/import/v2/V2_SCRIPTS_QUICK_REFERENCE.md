# TripAlfa v2.0 Scripts Summary

## 📋 All Available v2.0 Scripts

### Data Import Scripts

| Script                | Command                               | Purpose                                  | Time   | Credentials |
| --------------------- | ------------------------------------- | ---------------------------------------- | ------ | ----------- |
| **Load Sample**       | `tsx scripts/load-sample-v2.ts`       | Quick test data (60 hotels, 14 airports) | 5 min  | None ⭐     |
| **Master Import**     | `tsx scripts/import-all-v2.ts`        | All data in order with dependencies      | 30 min | Both        |
| **Reference**         | `tsx scripts/import-reference-v2.ts`  | Countries, currencies, languages         | 2 min  | LiteAPI     |
| **Cities**            | `tsx scripts/import-cities-v2.ts`     | Cities for flight/hotel                  | 5 min  | LiteAPI     |
| **Airports**          | `tsx scripts/import-airports-v2.ts`   | 10K+ airports from Duffel                | 10 min | Duffel      |
| **Airlines/Aircraft** | `tsx scripts/import-duffel-v2.ts`     | Airlines and aircraft types              | 3 min  | Duffel      |
| **Hotels**            | `tsx scripts/import-hotels-v2.ts`     | Hotels from LiteAPI                      | 15 min | LiteAPI     |
| **Facilities**        | `tsx scripts/import-facilities-v2.ts` | Hotel amenities/facilities               | 3 min  | LiteAPI     |

### Utility Scripts

| Script       | Command                      | Purpose                                 |
| ------------ | ---------------------------- | --------------------------------------- |
| **Validate** | `tsx scripts/validate-v2.ts` | Check data integrity & FK relationships |

---

## 🚀 Quick Start Paths

### Path 1: Development Testing (5 min) ⭐ FASTEST

```bash
# Load sample data - no credentials needed
tsx scripts/load-sample-v2.ts

# Verify
psql -d tripalfa_local -c "SELECT COUNT(*) FROM hotel.hotels;"  # 60
psql -d tripalfa_local -c "SELECT COUNT(*) FROM flight.airports;"  # 14

# Access app
open http://localhost:5174
```

### Path 2: Production Data (30 min) 🚀 RECOMMENDED

**Prerequisites:** Duffel API key + LiteAPI key

```bash
# Run all imports in correct order
tsx scripts/import-all-v2.ts

# Validate
tsx scripts/validate-v2.ts

# Check counts
psql -d tripalfa_local << EOF
SELECT
  'Hotels'::text, COUNT(*) FROM hotel.hotels
UNION ALL SELECT 'Airports', COUNT(*) FROM flight.airports
UNION ALL SELECT 'Airlines', COUNT(*) FROM flight.airlines;
EOF
```

### Path 3: Selective Import (10-15 min) 🎯 CUSTOM

```bash
# Just reference + airports
tsx scripts/import-reference-v2.ts
tsx scripts/import-airports-v2.ts

# Or reference + hotels only
tsx scripts/import-reference-v2.ts
tsx scripts/import-cities-v2.ts
tsx scripts/import-hotels-v2.ts
```

---

## 🎯 Choose Your Path

### For Quick Testing

- Need fast feedback? → **Path 1: Load Sample** (5 min)
- Already have API keys? → **Path 2: Full Import** (30 min)
- Want only specific data? → **Path 3: Selective** (15 min)

### What Each Path Gives You

**Path 1 (Sample):**

```
✓ 60 sample hotels (10 cities)
✓ 14 major airports (NYC, London, Paris, etc.)
✓ 10 airlines
✓ 10 countries, currencies, languages
✓ READY FOR: UI testing, API integration
✗ NOT realistic: Mock data
```

**Path 2 (Full Import):**

```
✓ 10,000+ real airports from Duffel
✓ 100+ airlines and aircraft
✓ 500+ hotels across 10 countries
✓ Complete reference data
✓ READY FOR: Staging, production testing
✓ Realistic: Real airport codes, hotel IDs
```

**Path 3 (Selective):**

```
✓ Only what you need
✓ Can mix sample + real data
✓ Good for focused testing
✓ READY FOR: Testing specific features
```

---

## 📚 Documentation

- **Detailed Guide:** [V2_IMPORT_SCRIPTS_GUIDE.md](V2_IMPORT_SCRIPTS_GUIDE.md)
- **Schema Reference:** [V2_DATA_IMPORT_GUIDE.md](V2_DATA_IMPORT_GUIDE.md)
- **Sample Data SQL:** `sample-test-data.sql`

---

## ⚡ One-Liner Commands

```bash
# Absolute fastest way
npm run dev & tsx scripts/load-sample-v2.ts

# Full production data
tsx scripts/import-all-v2.ts && tsx scripts/validate-v2.ts

# Just verify existing data
tsx scripts/validate-v2.ts

# Load sample, then validate
tsx scripts/load-sample-v2.ts && tsx scripts/validate-v2.ts

# Check data counts
psql -d tripalfa_local << 'EOF'
SELECT table_name, COUNT(*) FROM information_schema.tables t
WHERE table_schema IN ('flight', 'hotel', 'shared') GROUP BY table_name;
EOF
```

---

## 🔧 Environment Setup

### Required for Any Import

```bash
# .env file must have:
LOCAL_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tripalfa_local
```

### For APIs (Optional)

```bash
# For full imports from APIs
DUFFEL_API_KEY=your_duffel_key_here
LITEAPI_KEY=your_liteapi_key_here
```

### Verify Setup

```bash
# Check environment
echo "Local DB: $LOCAL_DATABASE_URL"
echo "Duffel API: $DUFFEL_API_KEY"
echo "LiteAPI: $LITEAPI_KEY"
```

---

## 🎬 Workflow Examples

### Example 1: Fresh Start → Production Ready

```bash
# 1. Start dev server
npm run dev &

# 2. Load sample data (5 min)
tsx scripts/load-sample-v2.ts

# 3. Test UI at http://localhost:5174
# ... explore and test ...

# 4. Ready for staging? Import full data (25 min)
tsx scripts/import-all-v2.ts

# 5. Validate
tsx scripts/validate-v2.ts

# 6. Deploy to staging
npm run build
```

### Example 2: Airports Only Focus

```bash
# Just need airports for testing?
tsx scripts/import-reference-v2.ts
tsx scripts/import-airports-v2.ts

# Verify
psql -d tripalfa_local -c "SELECT COUNT(*) FROM flight.airports;"
```

### Example 3: Continuous Integration

```bash
# In CI/CD pipeline
tsx scripts/load-sample-v2.ts  # Fast, no credentials
npm run test                    # Run tests
npm run build                   # Build project
```

---

## 📊 Expected Results

After successful import:

```
Sample Data Path:
  Countries: 10
  Currencies: 10
  Languages: 10
  Airports: 14
  Airlines: 10
  Hotels: 60

Full Import Path:
  Countries: 200+
  Currencies: 150+
  Languages: 50+
  Airports: 10,000+
  Airlines: 200+
  Hotels: 500+ (across 10 countries)
```

---

## ✅ Validation Checklist

After running any import:

- [ ] No error messages in console
- [ ] `tsx scripts/validate-v2.ts` passes
- [ ] Data counts look correct
- [ ] API responding: `curl http://localhost:3030/health`
- [ ] UI loads: `http://localhost:5174`
- [ ] No orphaned foreign keys

---

## 🆘 Troubleshooting

### Scripts don't run

```bash
# Check Node/TSX
node --version  # Should be 16+
npm install -g tsx  # Install globally

# Run with tsx
tsx scripts/import-reference-v2.ts
```

### API key errors

```bash
# Check if keys are set
echo $DUFFEL_API_KEY
echo $LITEAPI_KEY

# Should output your keys, not empty
```

### Database errors

```bash
# Test connection
psql -d tripalfa_local -c "SELECT 1;"

# Should respond with: 1 (row: 1)
```

### FK violations

```bash
# Run in correct order!
# Reference data MUST be imported first

tsx scripts/import-reference-v2.ts
tsx scripts/import-airports-v2.ts  # This needs reference data!
```

---

## 📞 Next Steps

1. **Choose a path** above based on your needs
2. **Run the command** for that path
3. **Verify data** with validation script
4. **Access the app** at http://localhost:5174
5. **Run tests** with `npm test`

---

## 🎯 Summary Table

| Goal          | Command                             | Time   |
| ------------- | ----------------------------------- | ------ |
| Quick test    | `tsx scripts/load-sample-v2.ts`     | 5 min  |
| Full data     | `tsx scripts/import-all-v2.ts`      | 30 min |
| Just airports | `tsx scripts/import-airports-v2.ts` | 10 min |
| Just hotels   | `tsx scripts/import-hotels-v2.ts`   | 15 min |
| Verify data   | `tsx scripts/validate-v2.ts`        | 1 min  |

**Recommendation:** Start with sample data (Path 1) while developing, then run full import (Path 2) for staging/production.
