# Countries Data Import - Completion Report

## ✅ Import Successful

Successfully extracted and imported **252 countries** with international dialing codes into the PostgreSQL database.

### Data Source

- **Repository**: [annexare/Countries](https://github.com/annexare/Countries)
- **Source File**: `/tmp/Countries/dist/countries.min.json`
- **Cloned**: March 16, 2026

### Database Details

- **Database**: `tripalfa_local`
- **Table**: `liteapi_countries`
- **Schema**:
  - `code` (String, Primary Key): 2-letter ISO 3166-1 alpha-2 country code
  - `name` (String): English country name
  - `dialing_code` (String, nullable): International telephone dialing code
  - `created_at` (Timestamp): Insertion timestamp
  - `updated_at` (Timestamp): Last update timestamp

### Import Results

- **Total Countries**: 252
- **Countries with Dialing Codes**: 252
- **Countries without Dialing Codes**: 0

### Sample Data

| Code | Country Name   | Dialing Code |
| ---- | -------------- | ------------ |
| US   | United States  | 1            |
| GB   | United Kingdom | 44           |
| FR   | France         | 33           |
| DE   | Germany        | 49           |
| JP   | Japan          | 81           |
| IN   | India          | 91           |
| CN   | China          | 86           |
| BR   | Brazil         | 55           |
| AU   | Australia      | 61           |
| CA   | Canada         | 1            |

### Import Script

The import was performed using the script: `scripts/import-countries-data.ts`

To re-run the import:

```bash
cd /Users/mohamedrizwan/Desktop/TripAlfa\ -\ Node
npx ts-node scripts/import-countries-data.ts
```

### How to Use the Data

#### Query all countries

```sql
SELECT code, name, dialing_code FROM liteapi_countries ORDER BY code;
```

#### Query a specific country

```sql
SELECT code, name, dialing_code FROM liteapi_countries WHERE code = 'US';
```

#### Query by dialing code

```sql
SELECT code, name, dialing_code FROM liteapi_countries WHERE dialing_code = '44';
```

#### Search by country name

```sql
SELECT code, name, dialing_code FROM liteapi_countries WHERE name ILIKE '%united%' ORDER BY name;
```

### Environment Variables

The import script uses the following environment variable:

- `LOCAL_DATABASE_URL`: PostgreSQL connection string for the local database
  - Default: `postgresql://postgres:postgres@localhost:5432/tripalfa_local`

If not set, ensure your `.env` or `.env.local` file contains the correct database URL.

### Data Integrity

- ✅ All 252 countries have been successfully inserted
- ✅ All dialing codes are present (no null values)
- ✅ Country codes are properly formatted (2-letter uppercase ISO codes)
- ✅ Country names match the official annexare/Countries database

### Additional Resources

- Full country data is available at: `/tmp/Countries/dist/countries.min.json`
- The original repository: https://github.com/annexare/Countries
- Original JSON also includes: continent, capital, currencies, languages, and more

### Notes

- The script uses `ON CONFLICT` to handle re-runs safely (idempotent)
- Batch insertion is used for optimal performance (100 countries per batch)
- The import completed in seconds with minimal database load
