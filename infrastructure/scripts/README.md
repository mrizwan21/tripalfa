# Innstant Travel Static Data Import

This script imports the complete dataset from Innstant Travel Static Data API into your local PostgreSQL database.

## Prerequisites

1. **PostgreSQL Database**: Ensure your local PostgreSQL database is running (port 5432)
2. **Prisma**: The database schema should be generated and migrated
3. **Node.js**: Version 16 or higher

## Setup

1. **Install Dependencies**:
   ```bash
   cd scripts
   npm install
   ```

2. **Ensure Database is Running**:
   ```bash
   # Start PostgreSQL if not already running
   docker-compose up -d postgres
   ```

3. **Generate Prisma Client**:
   ```bash
   npx prisma generate
   ```

## Usage

### Import All Data
```bash
cd scripts
npm run import
```

### What Gets Imported

The script fetches and imports the following data from Innstant Travel API:

- **Airports** (IATA/ICAO codes, locations, coordinates)
- **Airlines** (IATA/ICAO codes, names, logos, alliances)
- **Countries** (ISO codes, names)
- **Cities** (names, countries, coordinates, population)
- **Currencies** (ISO codes, names, symbols)
- **Hotel Chains** (brand names, codes, websites)
- **Hotel Facilities** (amenities, categories)
- **Hotel Types** (property types)
- **Loyalty Programs** (program names, alliances, logos)

### Data Processing

The script performs the following operations:

1. **Fetches** data from Innstant Travel API using the provided API key
2. **Transforms** the data to match your Prisma schema
3. **Validates** the data (filters out invalid records)
4. **Imports** the data into PostgreSQL with duplicate handling
5. **Generates** a summary report

### Output

The script provides real-time feedback during import and generates a final summary report showing the count of records imported for each data type.

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running on port 5432
- Check your `.env` file for correct database URL
- Verify Prisma schema is up to date

### API Rate Limits
- The script includes error handling for API failures
- Failed imports are logged but don't stop the entire process
- Retry failed imports by running the script again

### Data Validation
- Invalid records are automatically filtered out
- Records without required fields (like IATA codes) are skipped
- The script provides detailed error messages for debugging

## Notes

- The script clears existing data before importing new data
- All imports use `skipDuplicates: true` to prevent conflicts
- The script is designed to be idempotent - you can run it multiple times
- Import time depends on API response times and data volume