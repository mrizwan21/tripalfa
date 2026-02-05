# Hotelston Full Data Import Setup Guide

## Overview

This guide sets up a comprehensive system for importing full Hotelston static data into your PostgreSQL database. The system includes monitoring capabilities that will automatically start the import process when the Hotelston API becomes available.

## System Components

### 1. **API Monitoring System**
- **File:** `scripts/setup-hotelston-import.js`
- **Purpose:** Continuously monitors Hotelston API endpoints for availability
- **Features:**
  - Tests both Static Data API and Hotel Service API
  - Automatic retry every 5 minutes
  - Auto-starts import when API becomes available
  - Creates status files for monitoring

### 2. **Database Import System**
- **Files:** 
  - `scripts/import-hotelston-data.js` (original import script)
  - `scripts/setup-hotelston-import.js` (enhanced with monitoring)
- **Purpose:** Imports all Hotelston static data types
- **Data Types:**
  - Countries
  - Cities
  - Hotel Chains
  - Hotel Facilities
  - Hotel Types
  - Hotels

### 3. **Status Monitoring**
- **File:** `scripts/hotelston-import-status.json` (auto-created)
- **Purpose:** Tracks import status and API availability
- **Contents:**
  - Last check timestamp
  - API endpoint status
  - Import progress
  - Error information

## Prerequisites

### 1. **Database Setup**
```bash
# Start PostgreSQL
docker-compose -f infrastructure/compose/docker-compose.yml up -d postgres

# Verify database is running
docker-compose -f infrastructure/compose/docker-compose.yml ps

# Set up Prisma (if not already done)
cd database
npm install
npx prisma generate
npx prisma migrate dev --name init
```

### 2. **Environment Configuration**
Create `.env` file in project root:
```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/staticdatabase?schema=public"
```

### 3. **Dependencies**
```bash
cd scripts
npm install axios @prisma/client
```

## Setup Process

### Step 1: Start Database
```bash
# Navigate to project root
cd /Users/mohamedrizwan/Desktop/TripAlfa - Node

# Start PostgreSQL
docker-compose -f infrastructure/compose/docker-compose.yml up -d postgres

# Verify it's running
docker-compose -f infrastructure/compose/docker-compose.yml ps
```

### Step 2: Install Dependencies
```bash
# Install script dependencies
cd scripts
npm install axios @prisma/client
```

### Step 3: Run Setup and Monitoring
```bash
# Run the setup script
node setup-hotelston-import.js
```

## What Happens Next

### 1. **Initial API Test**
The script will:
- Test both Hotelston API endpoints
- Report current availability status
- Create a status file

### 2. **Monitoring Mode**
If API is not available:
- Starts monitoring mode
- Checks API every 5 minutes
- Automatically imports when API becomes available
- Logs all attempts and results

### 3. **Auto-Import**
When API becomes available:
- Automatically starts full data import
- Imports all data types in correct order
- Provides detailed progress reports
- Creates comprehensive summary

## Expected Output

### Initial Setup Output:
```
============================================================
HOTELSTON IMPORT SETUP
============================================================
Testing Static Data API...
❌ Static Data API: 404 Not Found

Testing Hotel Service API...
❌ Hotel Service API: 404 Not Found

API not available. Starting monitoring mode...
============================================================
HOTELSTON API MONITORING AND AUTO-IMPORT
============================================================
Monitoring API availability. Will auto-import when API becomes available.
Press Ctrl+C to stop monitoring.

[2024-01-31T23:50:00.000Z] Check attempt #1
Testing Static Data API...
❌ Static Data API: 404 Not Found

Testing Hotel Service API...
❌ Hotel Service API: 404 Not Found

API still not available. Will check again in 5 minutes...
```

### When API Becomes Available:
```
[2024-01-31T23:55:00.000Z] Check attempt #2
Testing Static Data API...
✅ Static Data API: AVAILABLE (Status: 200)

🎉 API is now available! Starting import...
============================================================
HOTELSTON FULL DATA IMPORT
============================================================
Testing database connection...
✅ Database connection successful!

Importing countries...
✅ Successfully imported 150 countries

Importing cities...
✅ Successfully imported 2000 cities

Importing hotel chains...
✅ Successfully imported 50 hotel chains

Importing hotel facilities...
✅ Successfully imported 100 hotel facilities

Importing hotel types...
✅ Successfully imported 20 hotel types

Importing hotels...
✅ Successfully imported 10000 hotels

============================================================
IMPORT SUMMARY
============================================================
✅ All Hotelston data imported successfully!
Your booking engine now has access to complete Hotelston static data.
✅ Import completed successfully!
Monitoring will now stop.
```

## Status File

The system creates `scripts/hotelston-import-status.json` with details like:
```json
{
  "lastCheck": "2024-01-31T23:50:00.000Z",
  "status": "MONITORING",
  "credentials": {
    "username": "technocense@gmail.com",
    "password": "********"
  },
  "endpoints": {
    "static": "https://dev.hotelston.com/ws/StaticDataServiceV2/StaticDataServiceHttpSoap11Endpoint/",
    "service": "https://dev.hotelston.com/ws/HotelServiceV2/HotelServiceHttpSoap11Endpoint/"
  },
  "endpoints": [
    {
      "name": "Static Data API",
      "status": "404",
      "url": "https://dev.hotelston.com/ws/StaticDataServiceV2/StaticDataServiceHttpSoap11Endpoint/"
    },
    {
      "name": "Hotel Service API", 
      "status": "404",
      "url": "https://dev.hotelston.com/ws/HotelServiceV2/HotelServiceHttpSoap11Endpoint/"
    }
  ]
}
```

## Manual Import (Alternative)

If you prefer to manually trigger the import when you know the API is available:

```bash
# Run the original import script
node import-hotelston-data.js
```

## Troubleshooting

### 1. **Database Connection Issues**
```bash
# Check if PostgreSQL is running
docker-compose -f infrastructure/compose/docker-compose.yml ps

# Restart database
docker-compose -f infrastructure/compose/docker-compose.yml restart postgres

# Check database logs
docker-compose -f infrastructure/compose/docker-compose.yml logs postgres
```

### 2. **API Still Not Available**
- The Hotelston API endpoints may need activation
- Contact Hotelston support to verify:
  - Test environment status
  - Correct endpoint URLs
  - Any additional setup required

### 3. **Import Errors**
- Check the status file for error details
- Verify database schema is correct
- Ensure all dependencies are installed

### 4. **Monitoring Issues**
- The script runs indefinitely until API is available
- Use Ctrl+C to stop monitoring
- Restart with `node setup-hotelston-import.js` to resume

## Next Steps

1. **Start the monitoring system** using the commands above
2. **Monitor the output** for API availability
3. **Contact Hotelston support** if API remains unavailable
4. **Verify import completion** once API becomes available
5. **Test your booking engine** with the imported data

## Support

If you encounter issues:
1. Check the status file for detailed error information
2. Review the console output for specific error messages
3. Verify all prerequisites are met
4. Contact Hotelston support for API-related issues
5. Check the project documentation for database setup issues