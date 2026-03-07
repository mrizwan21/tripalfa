/**
 * Test UAE Hotels Import Script
 * 
 * This script tests the UAE hotels import functionality by:
 * 1. Checking database connection
 * 2. Verifying table structure
 * 3. Running a small test import
 * 4. Validating the imported data
 */

import { Pool, PoolConfig } from "pg";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const LITEAPI_API_KEY = process.env.LITEAPI_API_KEY || "prod_1ca7e299-f889-4462-8e32-ce421ab66a93";
const LITEAPI_BASE_URL = "https://api.liteapi.travel/v3.0";
const DB_NAME = process.env.STATIC_DATABASE_URL || "postgresql://postgres@localhost:5432/staticdatabase";

if (!LITEAPI_API_KEY) {
    console.error("Error: LITEAPI_API_KEY environment variable is required");
    process.exit(1);
}

const headers = {
    "X-API-Key": LITEAPI_API_KEY,
    "Content-Type": "application/json",
};

// PostgreSQL connection pool
const poolConfig: PoolConfig = {
    connectionString: DB_NAME,
};

if (process.env.NODE_ENV === 'production') {
    (poolConfig as any).max = 10;
    (poolConfig as any).idleTimeoutMillis = 30000;
    (poolConfig as any).connectionTimeoutMillis = 10000;
} else {
    (poolConfig as any).max = 5;
    (poolConfig as any).idleTimeoutMillis = 30000;
    (poolConfig as any).connectionTimeoutMillis = 10000;
}

const pool = new Pool(poolConfig);

async function fetchLiteData(endpoint: string) {
    const url = endpoint.startsWith('http') ? endpoint : `${LITEAPI_BASE_URL}${endpoint}`;
    console.log(`Testing fetch from ${url}...`);
    const response = await fetch(url, { headers });
    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to fetch ${endpoint}: ${response.statusText} - ${error}`);
    }
    const json: any = await response.json();
    return json.data || json;
}

async function testDatabaseConnection() {
    console.log("1. Testing database connection...");
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT NOW() as current_time');
        client.release();
        console.log("✓ Database connection successful");
        console.log(`  Current time: ${result.rows[0].current_time}`);
        return true;
    } catch (error) {
        console.error("✗ Database connection failed:", error);
        return false;
    }
}

async function testTableStructure() {
    console.log("\n2. Testing table structure...");
    try {
        const client = await pool.connect();
        
        // Check if hotel schema exists
        const schemaResult = await client.query(`
            SELECT schema_name 
            FROM information_schema.schemata 
            WHERE schema_name = 'hotel'
        `);
        
        if (schemaResult.rows.length === 0) {
            console.log("✗ Hotel schema does not exist");
            client.release();
            return false;
        }
        
        // Check if key tables exist
        const tables = ['hotels', 'chains', 'types', 'facilities', 'cities'];
        for (const table of tables) {
            const tableResult = await client.query(`
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'hotel' AND table_name = '${table}'
            `);
            
            if (tableResult.rows.length === 0) {
                console.log(`✗ Table 'hotel.${table}' does not exist`);
                client.release();
                return false;
            }
        }
        
        client.release();
        console.log("✓ All required tables exist");
        return true;
    } catch (error) {
        console.error("✗ Table structure check failed:", error);
        return false;
    }
}

async function testLiteAPIConnection() {
    console.log("\n3. Testing LITEAPI connection...");
    try {
        const countries = await fetchLiteData("/data/countries");
        console.log(`✓ LITEAPI connection successful, found ${countries.length} countries`);
        
        // Check for UAE
        const uaeCountry = countries.find((c: any) => c.code === "AE");
        if (uaeCountry) {
            console.log(`✓ UAE country found: ${uaeCountry.name}`);
        } else {
            console.log("✗ UAE country not found in API response");
            return false;
        }
        
        return true;
    } catch (error) {
        console.error("✗ LITEAPI connection failed:", error);
        return false;
    }
}

async function testUAEDataAvailability() {
    console.log("\n4. Testing UAE data availability...");
    try {
        // Test UAE cities
        const uaeCities = await fetchLiteData("/data/cities?countryCode=AE");
        console.log(`✓ Found ${uaeCities.length} cities in UAE`);
        
        if (uaeCities.length === 0) {
            console.log("✗ No cities found for UAE");
            return false;
        }
        
        // Test UAE IATA codes
        const iataCodes = await fetchLiteData("/data/iataCodes");
        const uaeIataCodes = iataCodes.filter((i: any) => i.countryCode === "AE");
        console.log(`✓ Found ${uaeIataCodes.length} IATA codes for UAE`);
        
        if (uaeIataCodes.length === 0) {
            console.log("✗ No IATA codes found for UAE");
            return false;
        }
        
        // Test hotels for first UAE city
        const firstCity = uaeIataCodes[0];
        console.log(`Testing hotels for ${firstCity.name} (${firstCity.code})...`);
        const hotels = await fetchLiteData(`/data/hotels?countryCode=AE&iataCode=${firstCity.code}`);
        console.log(`✓ Found ${hotels.length} hotels in ${firstCity.name}`);
        
        return true;
    } catch (error) {
        console.error("✗ UAE data availability test failed:", error);
        return false;
    }
}

async function testSampleImport() {
    console.log("\n5. Testing sample import...");
    try {
        const client = await pool.connect();
        
        // Get UAE IATA codes
        const iataCodes = await fetchLiteData("/data/iataCodes");
        const uaeIataCodes = iataCodes.filter((i: any) => i.countryCode === "AE");
        
        if (uaeIataCodes.length === 0) {
            console.log("✗ No UAE IATA codes available for testing");
            client.release();
            return false;
        }
        
        const testCity = uaeIataCodes[0];
        console.log(`Testing import for ${testCity.name} (${testCity.code})...`);
        
        // Fetch hotels
        const hotels = await fetchLiteData(`/data/hotels?countryCode=AE&iataCode=${testCity.code}`);
        
        if (hotels.length === 0) {
            console.log(`✗ No hotels found for ${testCity.name}`);
            client.release();
            return false;
        }
        
        // Test inserting first hotel
        const testHotel = hotels[0];
        console.log(`Testing import of hotel: ${testHotel.name} (${testHotel.id})`);
        
        const insertQuery = `
            INSERT INTO hotel.hotels (
                id, name, description, country_code, city, address, 
                latitude, longitude, currency_code, stars, chain_id, 
                hotel_type_id, rating, review_count, main_photo, 
                created_at, updated_at
            ) VALUES (
                $1, $2, $3, 'AE', $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW()
            )
            ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name,
                description = EXCLUDED.description,
                city = EXCLUDED.city,
                address = EXCLUDED.address,
                latitude = EXCLUDED.latitude,
                longitude = EXCLUDED.longitude,
                currency_code = EXCLUDED.currency_code,
                stars = EXCLUDED.stars,
                chain_id = EXCLUDED.chain_id,
                hotel_type_id = EXCLUDED.hotel_type_id,
                rating = EXCLUDED.rating,
                review_count = EXCLUDED.review_count,
                main_photo = EXCLUDED.main_photo,
                updated_at = NOW()
            RETURNING id, name, city, stars;
        `;
        
        const values = [
            testHotel.id,
            testHotel.name,
            testHotel.description || null,
            testHotel.city || testCity.name,
            testHotel.address || null,
            testHotel.latitude || null,
            testHotel.longitude || null,
            testHotel.currencyCode || null,
            testHotel.starRating || null,
            testHotel.chainId || null,
            testHotel.hotelTypeId || null,
            testHotel.rating || null,
            testHotel.reviewCount || 0,
            testHotel.mainPhoto || null
        ];
        
        const result = await client.query(insertQuery, values);
        client.release();
        
        if (result.rows.length > 0) {
            console.log("✓ Sample import successful");
            console.log(`  Imported: ${result.rows[0].name} in ${result.rows[0].city} (${result.rows[0].stars} stars)`);
            return true;
        } else {
            console.log("✗ Sample import failed - no rows returned");
            return false;
        }
        
    } catch (error) {
        console.error("✗ Sample import failed:", error);
        return false;
    }
}

async function validateImportedData() {
    console.log("\n6. Validating imported data...");
    try {
        const client = await pool.connect();
        
        // Count hotels in UAE
        const countResult = await client.query(`
            SELECT COUNT(*) as total_hotels 
            FROM hotel.hotels 
            WHERE country_code = 'AE'
        `);
        
        const totalHotels = parseInt(countResult.rows[0].total_hotels);
        console.log(`✓ Found ${totalHotels} hotels in UAE database`);
        
        // Get sample hotels
        const sampleResult = await client.query(`
            SELECT id, name, city, stars, rating, created_at
            FROM hotel.hotels 
            WHERE country_code = 'AE'
            ORDER BY created_at DESC 
            LIMIT 5
        `);
        
        console.log("✓ Sample imported hotels:");
        sampleResult.rows.forEach((hotel, index) => {
            console.log(`  ${index + 1}. ${hotel.name} (${hotel.city}) - ${hotel.stars} stars, rating: ${hotel.rating}`);
        });
        
        client.release();
        return true;
    } catch (error) {
        console.error("✗ Data validation failed:", error);
        return false;
    }
}

async function runFullTest() {
    console.log("=".repeat(60));
    console.log("UAE Hotels Import Test Suite");
    console.log("=".repeat(60));
    
    const tests = [
        { name: "Database Connection", fn: testDatabaseConnection },
        { name: "Table Structure", fn: testTableStructure },
        { name: "LITEAPI Connection", fn: testLiteAPIConnection },
        { name: "UAE Data Availability", fn: testUAEDataAvailability },
        { name: "Sample Import", fn: testSampleImport },
        { name: "Data Validation", fn: validateImportedData }
    ];
    
    let passedTests = 0;
    let totalTests = tests.length;
    
    for (const test of tests) {
        console.log(`\nRunning: ${test.name}`);
        console.log("-".repeat(40));
        
        const result = await test.fn();
        if (result) {
            passedTests++;
            console.log(`✓ ${test.name} PASSED`);
        } else {
            console.log(`✗ ${test.name} FAILED`);
        }
    }
    
    console.log("\n" + "=".repeat(60));
    console.log("TEST SUMMARY");
    console.log("=".repeat(60));
    console.log(`Tests passed: ${passedTests}/${totalTests}`);
    
    if (passedTests === totalTests) {
        console.log("🎉 All tests passed! UAE hotels import is ready to run.");
        console.log("\nTo run the full import, execute:");
        console.log("  npm run import:uae");
    } else {
        console.log("❌ Some tests failed. Please check the errors above.");
        console.log("\nCommon issues:");
        console.log("  - Database not running or connection string incorrect");
        console.log("  - LITEAPI_API_KEY not set in environment");
        console.log("  - Tables not created (run the import script to create them)");
    }
    
    // Close database connection
    await pool.end();
    
    return passedTests === totalTests;
}

// Run the test
if (import.meta.url === `file://${process.argv[1]}`) {
    runFullTest().then(success => {
        process.exit(success ? 0 : 1);
    }).catch(error => {
        console.error("Test suite failed:", error);
        process.exit(1);
    });
}

export { runFullTest };