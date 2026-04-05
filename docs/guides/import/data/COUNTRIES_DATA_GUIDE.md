# 🌍 Countries & Dialing Codes with Nationalities - Quick Reference Guide

## ✅ Import Completed Successfully

**All 252 countries with international telephone dialing codes and 249 nationalities have been imported into your PostgreSQL database.**

### Latest Update

- **Added**: Nationality/Demonym column to liteapi_countries table
- **Source**: REST Countries API (https://restcountries.com)
- **Coverage**: 249 out of 252 countries have nationality data (98.4%)
- **Import Date**: March 16, 2026

## 📊 Quick Stats

| Metric                        | Value                                                           |
| ----------------------------- | --------------------------------------------------------------- |
| Total Countries               | 252                                                             |
| With Dialing Code             | 252                                                             |
| With Nationality              | 249                                                             |
| Countries Missing Nationality | 3                                                               |
| Source                        | annexare/Countries (dialing) + REST Countries API (nationality) |
| Nationality Coverage          | 98.4%                                                           |
| Last Updated                  | March 16, 2026                                                  |

---

## 🔍 How to Query the Data

### 1. **Query by Country Code**

```bash
npx ts-node scripts/query-countries.ts US
npx ts-node scripts/query-countries.ts gb
npx ts-node scripts/query-countries.ts FR
```

### 2. **Search by Country Name**

```bash
npx ts-node scripts/query-countries.ts --search "United"
npx ts-node scripts/query-countries.ts --search "Kong"
npx ts-node scripts/query-countries.ts --search "Arab"
```

### 3. **Query by Dialing Code**

```bash
npx ts-node scripts/query-countries.ts --dialing 1
npx ts-node scripts/query-countries.ts --dialing 44
npx ts-node scripts/query-countries.ts --dialing 91
```

### 4. **List All Countries**

```bash
npx ts-node scripts/query-countries.ts --all
npx ts-node scripts/query-countries.ts --all --limit 20
```

---

## 📝 SQL Queries

### Get a country by code

```sql
SELECT code, name, dialing_code, nationality
FROM liteapi_countries
WHERE code = 'US';
```

### Get countries by dialing code

```sql
SELECT code, name, dialing_code, nationality
FROM liteapi_countries
WHERE dialing_code = '44'
ORDER BY code;
```

### Search countries by name or nationality

```sql
SELECT code, name, dialing_code, nationality
FROM liteapi_countries
WHERE name ILIKE '%united%' OR nationality ILIKE '%united%'
ORDER BY name;
```

### Get all countries (sorted)

```sql
SELECT code, name, dialing_code, nationality
FROM liteapi_countries
ORDER BY code;
```

### Get countries by nationality

```sql
SELECT code, name, nationality
FROM liteapi_countries
WHERE nationality IS NOT NULL
ORDER BY nationality;
```

### Get countries statistics

```sql
SELECT
  COUNT(*) as total,
  COUNT(CASE WHEN dialing_code IS NOT NULL THEN 1 END) as with_codes,
  COUNT(CASE WHEN nationality IS NOT NULL THEN 1 END) as with_nationality
FROM liteapi_countries;
```

---

## 🎯 Use in Your Application

### In Backend Services

```typescript
import * as pg from 'pg';

// Get country info
const pool = new pg.Pool({
  connectionString: process.env.LOCAL_DATABASE_URL,
});

const client = await pool.connect();

// Query single country
const result = await client.query(
  'SELECT code, name, dialing_code FROM liteapi_countries WHERE code = $1',
  ['US']
);

console.log(result.rows[0]);
// Output: { code: 'US', name: 'United States', dialing_code: '1' }
```

### In API Endpoints

```typescript
// GET /api/countries/:countryCode
app.get('/api/countries/:countryCode', async (req, res) => {
  const { countryCode } = req.params;

  const result = await pool.query(
    'SELECT code, name, dialing_code FROM liteapi_countries WHERE code = $1',
    [countryCode.toUpperCase()]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Country not found' });
  }

  res.json(result.rows[0]);
});

// GET /api/countries?search=united
app.get('/api/countries', async (req, res) => {
  const { search } = req.query;

  const query = search
    ? 'SELECT code, name, dialing_code FROM liteapi_countries WHERE name ILIKE $1 ORDER BY code'
    : 'SELECT code, name, dialing_code FROM liteapi_countries ORDER BY code';

  const params = search ? [`%${search}%`] : [];
  const result = await pool.query(query, params);

  res.json(result.rows);
});
```

---

## 📁 Files Created/Modified

### New Import Scripts

- `scripts/import-countries-data.ts` - TypeScript script to import dialing codes and country names
- `scripts/import-nationalities.ts` - TypeScript script to import nationalities from REST Countries API

### New Query Helper

- `scripts/query-countries.ts` - CLI tool to query countries from database

### Documentation

- `docs/COUNTRIES_DATA_IMPORT.md` - Detailed import report and documentation

---

## 🔄 Running the Imports Again

If you need to re-run the imports (e.g., to get updated data):

### Import Dialing Codes

```bash
cd /path/to/TripAlfa\ -\ Node
npx ts-node scripts/import-countries-data.ts
```

### Import Nationalities

```bash
cd /path/to/TripAlfa\ -\ Node
npx ts-node scripts/import-nationalities.ts
```

Both scripts are idempotent - they're safe to run multiple times. They will:

1. Fetch fresh data from their respective sources
2. Update the database with new/changed data
3. Verify the import was successful

---

## 📋 Sample Data

Here are some examples of imported data:

| Code | Country Name   | Dialing Code | Nationality   |
| ---- | -------------- | ------------ | ------------- |
| US   | United States  | 1            | American      |
| GB   | United Kingdom | 44           | British       |
| FR   | France         | 33           | French        |
| DE   | Germany        | 49           | German        |
| JP   | Japan          | 81           | Japanese      |
| IN   | India          | 91           | Indian        |
| CN   | China          | 86           | Chinese       |
| BR   | Brazil         | 55           | Brazilian     |
| CA   | Canada         | 1            | Canadian      |
| AU   | Australia      | 61           | Australian    |
| MX   | Mexico         | 52           | Mexican       |
| ZA   | South Africa   | 27           | South African |
| RU   | Russia         | 7            | Russian       |
| KR   | South Korea    | 82           | South Korean  |
| SG   | Singapore      | 65           | Singaporean   |

---

## 🔧 Technical Details

### Data Source Format

The data is sourced from two providers:

**1. Dialing Codes** - annexare/Countries GitHub repository's JSON output

- Country code (ISO 3166-1 alpha-2)
- Country name (English)
- Dialing codes (international telephone)
- Native name
- Continent
- Capital
- Currencies
- Languages

**2. Nationalities/Demonyms** - REST Countries API

- English demonym/nationality for each country
- Fetched from: https://restcountries.com/v3.1/all

### Database Schema

```sql
CREATE TABLE liteapi_countries (
  code VARCHAR(2) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  dialing_code VARCHAR(10),
  nationality VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Environment Variables

- `LOCAL_DATABASE_URL` - PostgreSQL connection string
  - Default: `postgresql://postgres:postgres@localhost:5432/tripalfa_local`

---

## ✨ Key Features

✅ **Complete**: All 252 countries included  
✅ **Accurate**: Country codes sourced from annexare/Countries repository  
✅ **Dialing Codes**: All countries have international telephone codes  
✅ **Nationalities**: 249 countries have nationality/demonym data (98.4% coverage)  
✅ **Accessible**: Easy CLI tool to query data  
✅ **Performant**: Optimized batch insertions  
✅ **Safe**: Idempotent import scripts  
✅ **Documented**: Comprehensive guides and examples

---

## 📞 Support

For questions or issues:

1. Check the `docs/COUNTRIES_DATA_IMPORT.md` file for detailed documentation
2. Run `scripts/query-countries.ts` with no arguments to see all options
3. Query the database directly using SQL examples above

---

**Last Updated**: March 16, 2026  
**Status**: ✅ Complete and Verified
