# Hotelston Static Data Import Guide

## Overview

This guide provides step-by-step instructions for importing Hotelston static data into your PostgreSQL database running in Docker.

## Prerequisites

### 1. Docker Environment
Ensure Docker and docker-compose are installed and running:
```bash
docker --version
docker-compose --version
```

### 2. Database Setup
Start your PostgreSQL database:
```bash
cd /path/to/your/project
docker-compose -f infrastructure/compose/docker-compose.yml up -d postgres
```

### 3. Prisma Setup
Ensure Prisma is set up and the database schema is applied:
```bash
cd database
npm install
npx prisma generate
npx prisma migrate dev --name init
```

### 4. Dependencies
Install required dependencies for the import script:
```bash
cd scripts
npm install axios @prisma/client
```

## Import Process

### 1. Start Database Services
```bash
# Start PostgreSQL
docker-compose -f infrastructure/compose/docker-compose.yml up -d postgres

# Verify database is running
docker-compose -f infrastructure/compose/docker-compose.yml ps
```

### 2. Set Environment Variables
Create a `.env` file in the project root with your database connection:
```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/staticdatabase?schema=public"
```

### 3. Run the Import Script
```bash
cd scripts
node import-hotelston-data.js
```

## Expected Output

The import script will:
1. Test database connection
2. Import countries
3. Import cities
4. Import hotel chains
5. Import hotel facilities
6. Import hotel types
7. Import hotels

### Sample Output:
```
============================================================
HOTELSTON STATIC DATA IMPORT
============================================================
Testing database connection...
Database connection successful!

Starting data import...
Importing countries...
Countries response: { countries: '[{"code":"US","name":"United States"}]' }
Found 1 countries
Successfully imported 1 countries

Importing cities...
Cities response: { cities: '[{"name":"New York","country":"US"}]' }
Found 1 cities
Successfully imported 1 cities

Importing hotel chains...
Hotel chains response: { chains: '[{"code":"HILTON","name":"Hilton"}]' }
Found 1 hotel chains
Successfully imported 1 hotel chains

Importing hotel facilities...
Hotel facilities response: { facilities: '[{"name":"WiFi","category":"Connectivity"}]' }
Found 1 hotel facilities
Successfully imported 1 hotel facilities

Importing hotel types...
Hotel types response: { types: '[{"name":"Resort"}]' }
Found 1 hotel types
Successfully imported 1 hotel types

Importing hotels...
Hotels response: { hotels: '[{"id":"1","name":"Test Hotel"}]' }
Found 1 hotels
Successfully imported 1 hotels

============================================================
IMPORT SUMMARY
============================================================
All static data import operations completed!
Import process completed successfully!
```

## Troubleshooting

### 1. Database Connection Issues
```bash
# Check if PostgreSQL is running
docker-compose -f infrastructure/compose/docker-compose.yml ps

# Check PostgreSQL logs
docker-compose -f infrastructure/compose/docker-compose.yml logs postgres

# Test connection manually
docker exec -it $(docker-compose -f infrastructure/compose/docker-compose.yml ps -q postgres) psql -U postgres -d staticdatabase
```

### 2. Prisma Issues
```bash
# Regenerate Prisma client
npx prisma generate

# Reset database (WARNING: This will delete all data)
npx prisma migrate reset

# Re-run migrations
npx prisma migrate dev
```

### 3. API Connection Issues
The Hotelston API endpoints are currently returning 404 errors. The import script includes error handling for this scenario.

### 4. Import Script Errors
```bash
# Check Node.js version
node --version

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Run with debug output
DEBUG=* node import-hotelston-data.js
```

## Database Verification

After import, verify the data was imported correctly:

### 1. Check Table Counts
```bash
# Connect to database
docker exec -it $(docker-compose -f infrastructure/compose/docker-compose.yml ps -q postgres) psql -U postgres -d staticdatabase

# Check record counts
SELECT 'countries' as table_name, COUNT(*) as count FROM countries
UNION ALL
SELECT 'cities' as table_name, COUNT(*) as count FROM cities
UNION ALL
SELECT 'hotel_chains' as table_name, COUNT(*) as count FROM hotel_chains
UNION ALL
SELECT 'hotel_facilities' as table_name, COUNT(*) as count FROM hotel_facilities
UNION ALL
SELECT 'hotel_types' as table_name, COUNT(*) as count FROM hotel_types
UNION ALL
SELECT 'hotels' as table_name, COUNT(*) as count FROM hotels;
```

### 2. Sample Data Queries
```sql
-- View countries
SELECT * FROM countries LIMIT 5;

-- View cities
SELECT * FROM cities LIMIT 5;

-- View hotels with chains
SELECT h.name, h.city, h.country, hc.name as chain_name
FROM hotels h
LEFT JOIN hotel_chains hc ON h.chain_id = hc.id
LIMIT 10;
```

## Import Script Features

### 1. Error Handling
- Graceful handling of API failures
- Database constraint violations
- Network timeouts

### 2. Data Validation
- Checks for duplicate entries
- Validates required fields
- Handles missing optional fields

### 3. Upsert Operations
- Uses `upsert` to avoid duplicates
- Updates existing records with new data
- Maintains data integrity

### 4. Logging
- Detailed progress logging
- Error reporting with context
- Summary of import results

## API Integration Notes

### Current Status
The Hotelston API endpoints are currently returning 404 errors:
- `https://dev.hotelston.com/ws/StaticDataServiceV2?wsdl` → 404
- `https://dev.hotelston.com/ws/StaticDataServiceV2/StaticDataServiceHttpSoap11Endpoint/` → 404

### Fallback Strategy
The import script includes fallback mechanisms:
1. Attempts to parse JSON responses
2. Falls back to XML parsing if JSON fails
3. Logs detailed error information
4. Continues with other imports if one fails

### Next Steps
1. Contact Hotelston support for correct endpoints
2. Verify API credentials and permissions
3. Check WSDL availability
4. Update endpoints in the import script

## Performance Considerations

### 1. Batch Processing
For large datasets, consider modifying the script to:
- Process records in batches
- Use bulk insert operations
- Implement progress tracking

### 2. Memory Usage
The script loads all data into memory before processing. For very large datasets:
- Implement streaming processing
- Use pagination for API calls
- Process records incrementally

### 3. Database Optimization
For optimal performance:
- Ensure proper indexes are in place
- Use connection pooling
- Monitor database performance during import

## Integration with Existing System

### 1. Data Model Compatibility
The import script maps Hotelston data to your existing schema:
- Countries → `countries` table
- Cities → `cities` table
- Hotels → `hotels` table
- Hotel Chains → `hotel_chains` table
- Hotel Facilities → `hotel_facilities` table
- Hotel Types → `hotel_types` table

### 2. External References
Hotels are marked with:
- `external_id`: Hotelston hotel ID
- `external_source`: "Hotelston"

### 3. Data Relationships
- Hotels reference hotel chains via `chain_id`
- All tables include proper foreign key relationships
- Data integrity is maintained through upsert operations

## Maintenance

### 1. Regular Updates
Schedule regular imports to keep data current:
```bash
# Add to crontab for daily updates
0 2 * * * cd /path/to/project/scripts && node import-hotelston-data.js
```

### 2. Monitoring
Monitor import success and data quality:
- Check import logs regularly
- Verify data counts match expectations
- Monitor for API changes or errors

### 3. Backup Strategy
Always backup before running imports:
```bash
# Create backup before import
docker exec $(docker-compose -f infrastructure/compose/docker-compose.yml ps -q postgres) pg_dump -U postgres staticdatabase > backup_$(date +%Y%m%d_%H%M%S).sql
```

## Support

For issues with the import process:
1. Check the troubleshooting section above
2. Review import script logs
3. Verify database connectivity
4. Contact Hotelston support for API issues
5. Check project documentation for schema changes