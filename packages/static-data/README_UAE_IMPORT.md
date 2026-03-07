# UAE Hotels Import - LITEAPI Integration

This document describes the UAE hotels import functionality that integrates with the LITEAPI static data endpoints and saves the data to a local PostgreSQL database.

## Overview

The UAE hotels import system consists of two main scripts:

1. **`import-uae-hotels.ts`** - Main import script that fetches and imports all UAE hotels
2. **`test-uae-import.ts`** - Test script to validate the import functionality

## Prerequisites

### Environment Variables

Set the following environment variables:

```bash
# LITEAPI credentials
LITEAPI_API_KEY=your_liteapi_key_here

# PostgreSQL connection
STATIC_DATABASE_URL=postgresql://postgres@localhost:5432/staticdatabase
```

### Database Setup

Ensure you have a PostgreSQL database running locally with:
- Database name: `staticdatabase` (or as specified in STATIC_DATABASE_URL)
- User: `postgres` (or as specified in connection string)
- Port: `5432` (default)

## Installation

1. Install dependencies:
```bash
cd packages/static-data
npm install
```

2. Build the package:
```bash
npm run build
```

## Usage

### 1. Test the Import System

Before running the full import, test the system:

```bash
npm run test:uae
```

This will:
- Test database connection
- Verify table structure
- Test LITEAPI connectivity
- Validate UAE data availability
- Run a sample import
- Validate imported data

### 2. Run the Full Import

Once tests pass, run the full UAE hotels import:

```bash
npm run import:uae
```

This will:
- Create all required tables if they don't exist
- Import UAE country data
- Import reference data (chains, types, facilities)
- Import IATA codes
- Import UAE cities
- Import all hotels for all UAE cities

## Database Schema

The import creates the following tables in the `hotel` schema:

### Core Tables

- **`hotel.hotels`** - Main hotels table with all hotel information
- **`hotel.chains`** - Hotel chain/brand reference data
- **`hotel.types`** - Hotel type classification (resort, boutique, etc.)
- **`hotel.facilities`** - Hotel amenities and facilities
- **`hotel.cities`** - Cities in UAE
- **`hotel.iata_airports`** - IATA airport codes

### Extended Tables

- **`hotel.images`** - Hotel photos
- **`hotel.rooms`** - Hotel room types
- **`hotel.room_bed_types`** - Room bed configurations
- **`hotel.room_amenities`** - Room-specific amenities
- **`hotel.policies`** - Hotel policies
- **`hotel.reviews`** - Guest reviews
- **`hotel.sentiment_analysis`** - AI-generated sentiment analysis
- **`hotel.accessibility`** - Accessibility features

## Data Sources

### LITEAPI Endpoints Used

1. **`/data/countries`** - Country information
2. **`/data/chains`** - Hotel chain data
3. **`/data/hotelTypes`** - Hotel type classification
4. **`/data/facilities`** - Hotel facilities and amenities
5. **`/data/iataCodes`** - IATA airport codes
6. **`/data/cities?countryCode=AE`** - UAE cities
7. **`/data/hotels?countryCode=AE&iataCode={code}`** - Hotels by city

### Data Fields Imported

#### Hotel Core Information
- Hotel ID, name, description
- Location (country, city, address, coordinates)
- Star rating, currency, chain ID
- Contact information (phone, email, fax)
- Check-in/out times and instructions

#### Hotel Features
- Main photo, thumbnail, video URL
- Parking availability, children/pets allowed
- Accessibility attributes
- Semantic tags and AI-generated metadata

#### Extended Data
- Room types and configurations
- Hotel policies (child, pet, parking)
- Guest reviews and ratings
- Sentiment analysis results

## Import Process

### Step-by-Step Flow

1. **Schema Creation**: Creates all required tables if they don't exist
2. **Country Import**: Imports UAE country data
3. **Reference Data**: Imports chains, types, facilities
4. **IATA Codes**: Imports airport codes for UAE
5. **Cities**: Imports UAE cities
6. **Hotels**: For each UAE city:
   - Fetch hotels from LITEAPI
   - Insert/update hotel records
   - Continue with next city

### Error Handling

- **Batch Processing**: Uses batch inserts for performance
- **Conflict Resolution**: Uses `ON CONFLICT DO UPDATE` for existing records
- **Error Recovery**: Continues with other cities if one fails
- **Logging**: Detailed progress logging for each step

## Performance Considerations

### Batch Size
- Hotels are inserted in batches of 50 for optimal performance
- Individual insertion attempted if batch fails

### Database Optimization
- Uses PostgreSQL connection pooling
- Transactions for data consistency
- Indexes on frequently queried fields

### API Rate Limiting
- Respects LITEAPI rate limits
- Sequential processing to avoid overwhelming the API

## Monitoring and Validation

### Test Suite
The `test-uae-import.ts` script provides comprehensive testing:

1. **Connection Tests**: Database and API connectivity
2. **Schema Validation**: Table structure verification
3. **Data Availability**: Confirms UAE data exists in LITEAPI
4. **Sample Import**: Tests actual data insertion
5. **Data Validation**: Verifies imported data integrity

### Import Summary
After import completion, the script provides:
- Total hotels imported
- Database connection details
- Success/failure status

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check PostgreSQL is running
   - Verify connection string in STATIC_DATABASE_URL
   - Ensure user has necessary permissions

2. **LITEAPI Connection Failed**
   - Verify LITEAPI_API_KEY is set correctly
   - Check API key has necessary permissions
   - Verify network connectivity

3. **No UAE Data Found**
   - Confirm LITEAPI account has access to UAE data
   - Check if UAE is in the list of available countries
   - Verify IATA codes exist for UAE cities

4. **Import Errors**
   - Check PostgreSQL logs for detailed error messages
   - Verify table permissions
   - Check for data format issues

### Debug Mode

For detailed debugging, you can modify the scripts to:
- Add more verbose logging
- Enable PostgreSQL query logging
- Use smaller batch sizes for testing

## Security Considerations

### API Keys
- Store LITEAPI_API_KEY in environment variables
- Never commit API keys to version control
- Use appropriate access controls

### Database Security
- Use strong database passwords
- Limit database user permissions
- Consider SSL connections for production

## Maintenance

### Regular Updates
To keep hotel data current:
1. Run the import script periodically
2. Monitor for new UAE cities or hotels
3. Update reference data as needed

### Data Cleanup
Consider implementing:
- Old data archival
- Duplicate detection
- Data quality validation

## Integration with Other Systems

### Static Data Package
The imported data is part of the larger static data package that also includes:
- Flight data (Duffel API)
- Exchange rates
- Timezone data

### Application Usage
The imported hotel data can be used by:
- Booking engine
- Hotel search functionality
- Admin dashboard
- Analytics and reporting

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review test script output for detailed error information
3. Verify all prerequisites are met
4. Check LITEAPI documentation for API-specific issues

## Example Usage

```bash
# Test the import system
cd packages/static-data
npm run test:uae

# If tests pass, run the full import
npm run import:uae

# Monitor import progress in the console output
# Check database after completion:
# psql -h localhost -U postgres -d staticdatabase
# SELECT COUNT(*) FROM hotel.hotels WHERE country_code = 'AE';
```

This import system provides a robust foundation for integrating UAE hotel data from LITEAPI into your local PostgreSQL database, with comprehensive testing and error handling to ensure data quality and system reliability.