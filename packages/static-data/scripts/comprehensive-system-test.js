/**
 * Comprehensive System Test Script
 * 
 * This script tests the complete UAE hotels import system including:
 * - Database connectivity and schema validation
 * - Import script functionality
 * - Data integrity and quality checks
 * - Frontend integration points
 */

import { Pool } from "pg";
import fs from "fs/promises";
import path from "path";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const DB_NAME = process.env.STATIC_DATABASE_URL || "postgresql://postgres@localhost:5432/staticdatabase";

// Test configuration
const TEST_CONFIG = {
    expectedUAEHotels: 8000, // Minimum expected hotels
    expectedUAECities: 10,   // Minimum expected cities
    expectedUAECountries: 1, // UAE country
    expectedUAEAirports: 5   // Minimum expected airports
};

// Test results tracking
const testResults = {
    passed: 0,
    failed: 0,
    total: 0,
    errors: [],
    warnings: []
};

/**
 * Log test result
 */
function logTest(testName, passed, details = "") {
    testResults.total++;
    if (passed) {
        testResults.passed++;
        console.log(`✅ ${testName}`);
        if (details) console.log(`   ${details}`);
    } else {
        testResults.failed++;
        testResults.errors.push(`${testName}: ${details}`);
        console.log(`❌ ${testName}`);
        console.log(`   ${details}`);
    }
}

/**
 * Log warning
 */
function logWarning(message) {
    testResults.warnings.push(message);
    console.log(`⚠️  ${message}`);
}

/**
 * Initialize database connection
 */
async function initDatabase() {
    console.log("🔧 Initializing database connection...");
    
    const pool = new Pool({
        connectionString: DB_NAME,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
    });

    try {
        const client = await pool.connect();
        console.log("✅ Database connection established");
        client.release();
        return pool;
    } catch (error) {
        console.error("❌ Database connection failed:", error.message);
        throw error;
    }
}

/**
 * Test database schema
 */
async function testDatabaseSchema(pool) {
    console.log("\n🏗️  Testing database schema...");
    
    const tables = [
        'hotel.hotels',
        'hotel.hotel_images', 
        'hotel.hotel_amenities',
        'hotel.hotel_amenity_mapping',
        'hotel.hotel_descriptions',
        'hotel.hotel_contacts',
        'hotel.hotel_reviews',
        'hotel.hotel_rooms',
        'hotel.cities',
        'hotel.countries',
        'hotel.airports'
    ];

    for (const table of tables) {
        try {
            const client = await pool.connect();
            const result = await client.query(`
                SELECT COUNT(*) as count 
                FROM information_schema.tables 
                WHERE table_schema = 'hotel' AND table_name = '${table.split('.')[1]}'
            `);
            client.release();
            
            const exists = result.rows[0].count > 0;
            logTest(`Table ${table} exists`, exists);
            
        } catch (error) {
            logTest(`Table ${table} exists`, false, error.message);
        }
    }
}

/**
 * Test data integrity
 */
async function testDataIntegrity(pool) {
    console.log("\n🔍 Testing data integrity...");
    
    // Test hotels data
    try {
        const client = await pool.connect();
        
        // Count UAE hotels
        const hotelCountResult = await client.query(`
            SELECT COUNT(*) as count FROM hotel.hotels WHERE country_code = 'AE'
        `);
        const hotelCount = parseInt(hotelCountResult.rows[0].count);
        
        logTest(
            "UAE hotels count meets minimum requirement", 
            hotelCount >= TEST_CONFIG.expectedUAEHotels,
            `Found ${hotelCount} hotels (expected >= ${TEST_CONFIG.expectedUAEHotels})`
        );
        
        // Test data quality
        const qualityResult = await client.query(`
            SELECT 
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE name IS NOT NULL AND name != '') as with_name,
                COUNT(*) FILTER (WHERE rating IS NOT NULL) as with_rating,
                COUNT(*) FILTER (WHERE stars IS NOT NULL) as with_stars,
                COUNT(*) FILTER (WHERE address IS NOT NULL AND address != '') as with_address
            FROM hotel.hotels WHERE country_code = 'AE'
        `);
        
        const quality = qualityResult.rows[0];
        const nameQuality = (quality.with_name / quality.total) * 100;
        const ratingQuality = (quality.with_rating / quality.total) * 100;
        const starsQuality = (quality.with_stars / quality.total) * 100;
        const addressQuality = (quality.with_address / quality.total) * 100;
        
        logTest("Hotel name data quality", nameQuality >= 95, `${nameQuality.toFixed(1)}% of hotels have names`);
        logTest("Hotel rating data quality", ratingQuality >= 90, `${ratingQuality.toFixed(1)}% of hotels have ratings`);
        logTest("Hotel stars data quality", starsQuality >= 90, `${starsQuality.toFixed(1)}% of hotels have stars`);
        logTest("Hotel address data quality", addressQuality >= 95, `${addressQuality.toFixed(1)}% of hotels have addresses`);
        
        // Test for duplicate hotel IDs
        const duplicatesResult = await client.query(`
            SELECT COUNT(*) as duplicates
            FROM (
                SELECT id, COUNT(*) 
                FROM hotel.hotels 
                WHERE country_code = 'AE'
                GROUP BY id 
                HAVING COUNT(*) > 1
            ) as dup
        `);
        
        const duplicates = parseInt(duplicatesResult.rows[0].duplicates);
        logTest("No duplicate hotel IDs", duplicates === 0, `${duplicates} duplicate IDs found`);
        
        client.release();
        
    } catch (error) {
        logTest("Hotel data integrity check", false, error.message);
    }
    
    // Test cities data
    try {
        const client = await pool.connect();
        const cityCountResult = await client.query(`
            SELECT COUNT(*) as count FROM hotel.cities WHERE country_code = 'AE'
        `);
        const cityCount = parseInt(cityCountResult.rows[0].count);
        
        logTest(
            "UAE cities count meets minimum requirement",
            cityCount >= TEST_CONFIG.expectedUAECities,
            `Found ${cityCount} cities (expected >= ${TEST_CONFIG.expectedUAECities})`
        );
        
        client.release();
        
    } catch (error) {
        logTest("Cities data integrity check", false, error.message);
    }
    
    // Test countries data
    try {
        const client = await pool.connect();
        const countryCountResult = await client.query(`
            SELECT COUNT(*) as count FROM hotel.countries WHERE alpha2_code = 'AE'
        `);
        const countryCount = parseInt(countryCountResult.rows[0].count);
        
        logTest(
            "UAE country data exists",
            countryCount >= TEST_CONFIG.expectedUAECountries,
            `Found ${countryCount} UAE countries (expected >= ${TEST_CONFIG.expectedUAECountries})`
        );
        
        client.release();
        
    } catch (error) {
        logTest("Countries data integrity check", false, error.message);
    }
    
    // Test airports data
    try {
        const client = await pool.connect();
        const airportCountResult = await client.query(`
            SELECT COUNT(*) as count FROM hotel.airports WHERE country_code = 'AE'
        `);
        const airportCount = parseInt(airportCountResult.rows[0].count);
        
        logTest(
            "UAE airports count meets minimum requirement",
            airportCount >= TEST_CONFIG.expectedUAEAirports,
            `Found ${airportCount} airports (expected >= ${TEST_CONFIG.expectedUAEAirports})`
        );
        
        client.release();
        
    } catch (error) {
        logTest("Airports data integrity check", false, error.message);
    }
}

/**
 * Test data relationships
 */
async function testDataRelationships(pool) {
    console.log("\n🔗 Testing data relationships...");
    
    try {
        const client = await pool.connect();
        
        // Test hotel-city relationship
        const hotelCityResult = await client.query(`
            SELECT 
                COUNT(*) as total_hotels,
                COUNT(*) FILTER (WHERE h.city IS NOT NULL AND c.id IS NOT NULL) as hotels_with_valid_city
            FROM hotel.hotels h
            LEFT JOIN hotel.cities c ON h.city = c.name
            WHERE h.country_code = 'AE'
        `);
        
        const relationship = hotelCityResult.rows[0];
        const relationshipQuality = (relationship.hotels_with_valid_city / relationship.total_hotels) * 100;
        
        logTest(
            "Hotel-city relationship quality",
            relationshipQuality >= 80,
            `${relationshipQuality.toFixed(1)}% of hotels have valid city relationships`
        );
        
        // Test hotel-amenity relationship
        const amenityResult = await client.query(`
            SELECT 
                COUNT(DISTINCT h.id) as hotels_with_amenities,
                COUNT(DISTINCT h.id) FILTER (WHERE ham.hotel_id IS NOT NULL) as hotels_with_mapped_amenities
            FROM hotel.hotels h
            LEFT JOIN hotel.hotel_amenity_mapping ham ON h.id = ham.hotel_id
            WHERE h.country_code = 'AE'
        `);
        
        const amenity = amenityResult.rows[0];
        const amenityMappingQuality = (amenity.hotels_with_mapped_amenities / amenity.hotels_with_amenities) * 100;
        
        logTest(
            "Hotel-amenity mapping quality",
            amenityMappingQuality >= 90,
            `${amenityMappingQuality.toFixed(1)}% of hotels have valid amenity mappings`
        );
        
        client.release();
        
    } catch (error) {
        logTest("Data relationships check", false, error.message);
    }
}

/**
 * Test import scripts
 */
async function testImportScripts() {
    console.log("\n📜 Testing import scripts...");
    
    const scripts = [
        'import-uae-hotels.js',
        'import-uae-cities.js', 
        'import-uae-countries.js',
        'import-uae-airports.js'
    ];
    
    for (const script of scripts) {
        try {
            const scriptPath = path.join(process.cwd(), 'scripts', script);
            const stats = await fs.stat(scriptPath);
            
            logTest(`Script ${script} exists`, true, `Size: ${stats.size} bytes`);
            
            // Check if script is executable
            const content = await fs.readFile(scriptPath, 'utf8');
            const hasMainFunction = content.includes('async function main()');
            const hasExport = content.includes('export { main as');
            
            logTest(`Script ${script} has main function`, hasMainFunction);
            logTest(`Script ${script} has export`, hasExport);
            
        } catch (error) {
            logTest(`Script ${script} exists`, false, error.message);
        }
    }
}

/**
 * Test data files
 */
async function testDataFiles() {
    console.log("\n📁 Testing data files...");
    
    const dataFiles = [
        'uae-hotels.json',
        'uae-cities.json',
        'uae-countries.json', 
        'uae-airports.json'
    ];
    
    for (const file of dataFiles) {
        try {
            const filePath = path.join(process.cwd(), 'data', file);
            const stats = await fs.stat(filePath);
            
            logTest(`Data file ${file} exists`, true, `Size: ${stats.size} bytes`);
            
            // Check if file is valid JSON
            const content = await fs.readFile(filePath, 'utf8');
            JSON.parse(content);
            logTest(`Data file ${file} is valid JSON`, true);
            
        } catch (error) {
            logTest(`Data file ${file} exists`, false, error.message);
        }
    }
}

/**
 * Test frontend integration points
 */
async function testFrontendIntegration() {
    console.log("\n🌐 Testing frontend integration points...");
    
    // Check if API constants exist
    try {
        const constantsPath = path.join(process.cwd(), '../../apps/booking-engine/src/lib/constants/hotel-static-data.ts');
        const stats = await fs.stat(constantsPath);
        logTest("Hotel static data constants exist", true, `Size: ${stats.size} bytes`);
        
        const content = await fs.readFile(constantsPath, 'utf8');
        const hasStaticEndpoints = content.includes('/api/static/');
        logTest("Static API endpoints defined", hasStaticEndpoints);
        
    } catch (error) {
        logTest("Hotel static data constants exist", false, error.message);
    }
    
    // Check if API client exists
    try {
        const apiPath = path.join(process.cwd(), '../../apps/booking-engine/src/lib/api.ts');
        const stats = await fs.stat(apiPath);
        logTest("API client exists", true, `Size: ${stats.size} bytes`);
        
        const content = await fs.readFile(apiPath, 'utf8');
        const hasStaticFunctions = content.includes('fetchHotelById') || content.includes('fetchPopularDestinations');
        logTest("Static data API functions exist", hasStaticFunctions);
        
    } catch (error) {
        logTest("API client exists", false, error.message);
    }
}

/**
 * Test performance
 */
async function testPerformance(pool) {
    console.log("\n⚡ Testing performance...");
    
    try {
        const client = await pool.connect();
        
        // Test hotel query performance
        const startTime = Date.now();
        await client.query(`
            SELECT h.*, c.name as city_name 
            FROM hotel.hotels h
            LEFT JOIN hotel.cities c ON h.city = c.name
            WHERE h.country_code = 'AE'
            LIMIT 100
        `);
        const hotelQueryTime = Date.now() - startTime;
        
        logTest(
            "Hotel query performance (100 records)",
            hotelQueryTime < 1000,
            `${hotelQueryTime}ms`
        );
        
        // Test city query performance
        const cityStartTime = Date.now();
        await client.query(`SELECT * FROM hotel.cities WHERE country_code = 'AE'`);
        const cityQueryTime = Date.now() - cityStartTime;
        
        logTest(
            "City query performance",
            cityQueryTime < 500,
            `${cityQueryTime}ms`
        );
        
        client.release();
        
    } catch (error) {
        logTest("Performance tests", false, error.message);
    }
}

/**
 * Generate final test report
 */
function generateTestReport() {
    console.log("\n" + "=".repeat(80));
    console.log("🧪 COMPREHENSIVE SYSTEM TEST REPORT");
    console.log("=".repeat(80));
    console.log(`Total Tests: ${testResults.total}`);
    console.log(`Passed: ${testResults.passed}`);
    console.log(`Failed: ${testResults.failed}`);
    console.log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
    
    if (testResults.warnings.length > 0) {
        console.log("\n⚠️  WARNINGS:");
        testResults.warnings.forEach(warning => console.log(`   - ${warning}`));
    }
    
    if (testResults.errors.length > 0) {
        console.log("\n❌ ERRORS:");
        testResults.errors.forEach(error => console.log(`   - ${error}`));
    }
    
    console.log("=".repeat(80));
    
    if (testResults.failed === 0) {
        console.log("🎉 All tests passed! System is ready for production.");
    } else {
        console.log(`⚠️  ${testResults.failed} tests failed. Please review and fix issues before production.`);
    }
}

/**
 * Main execution function
 */
async function main() {
    console.log("🚀 Starting Comprehensive UAE Hotels Import System Test");
    console.log("=".repeat(80));

    let pool;
    
    try {
        // Initialize database
        pool = await initDatabase();
        
        // Run all tests
        await testDatabaseSchema(pool);
        await testDataIntegrity(pool);
        await testDataRelationships(pool);
        await testImportScripts();
        await testDataFiles();
        await testFrontendIntegration();
        await testPerformance(pool);
        
        // Generate final report
        generateTestReport();
        
    } catch (error) {
        console.error("❌ Test process failed:", error);
        process.exit(1);
        
    } finally {
        if (pool) {
            await pool.end();
            console.log("🔌 Database connection closed");
        }
    }
}

// Run the test process
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export { main as runComprehensiveTest };