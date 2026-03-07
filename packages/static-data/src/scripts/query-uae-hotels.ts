/**
 * Query UAE Hotels Example Script
 * 
 * This script demonstrates how to query the imported UAE hotels data
 * from the PostgreSQL database.
 */

import { Pool, PoolConfig } from "pg";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const DB_NAME = process.env.STATIC_DATABASE_URL || "postgresql://postgres@localhost:5432/staticdatabase";

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

async function queryUAEHotels() {
    console.log("=".repeat(60));
    console.log("UAE Hotels Query Examples");
    console.log("=".repeat(60));
    
    try {
        const client = await pool.connect();
        
        // 1. Count total UAE hotels
        console.log("\n1. Total UAE Hotels:");
        const countResult = await client.query(`
            SELECT COUNT(*) as total_hotels 
            FROM hotel.hotels 
            WHERE country_code = 'AE'
        `);
        console.log(`   Total hotels in UAE: ${countResult.rows[0].total_hotels}`);
        
        // 2. Hotels by city
        console.log("\n2. Hotels by City:");
        const cityResult = await client.query(`
            SELECT city, COUNT(*) as hotel_count
            FROM hotel.hotels 
            WHERE country_code = 'AE' AND city IS NOT NULL
            GROUP BY city 
            ORDER BY hotel_count DESC
            LIMIT 10
        `);
        cityResult.rows.forEach(row => {
            console.log(`   ${row.city}: ${row.hotel_count} hotels`);
        });
        
        // 3. Hotels by star rating
        console.log("\n3. Hotels by Star Rating:");
        const starResult = await client.query(`
            SELECT stars, COUNT(*) as hotel_count
            FROM hotel.hotels 
            WHERE country_code = 'AE' AND stars IS NOT NULL
            GROUP BY stars 
            ORDER BY stars DESC
        `);
        starResult.rows.forEach(row => {
            console.log(`   ${row.stars} stars: ${row.hotel_count} hotels`);
        });
        
        // 4. Top-rated hotels
        console.log("\n4. Top 5 Rated Hotels:");
        const ratingResult = await client.query(`
            SELECT name, city, stars, rating, review_count
            FROM hotel.hotels 
            WHERE country_code = 'AE' AND rating IS NOT NULL
            ORDER BY rating DESC, review_count DESC
            LIMIT 5
        `);
        ratingResult.rows.forEach((hotel, index) => {
            console.log(`   ${index + 1}. ${hotel.name} (${hotel.city})`);
            console.log(`      Stars: ${hotel.stars}, Rating: ${hotel.rating}/10, Reviews: ${hotel.review_count}`);
        });
        
        // 5. Hotels with specific amenities
        console.log("\n5. Hotels with Pool and WiFi:");
        const amenityResult = await client.query(`
            SELECT h.name, h.city, h.stars
            FROM hotel.hotels h
            WHERE country_code = 'AE' 
            AND h.id IN (
                SELECT hotel_id FROM hotel.hotel_facility_map hfm
                JOIN hotel.facilities f ON hfm.facility_id = f.id
                WHERE f.name ILIKE '%pool%' OR f.name ILIKE '%wifi%'
            )
            ORDER BY h.stars DESC, h.rating DESC
            LIMIT 10
        `);
        amenityResult.rows.forEach((hotel, index) => {
            console.log(`   ${index + 1}. ${hotel.name} (${hotel.city}) - ${hotel.stars} stars`);
        });
        
        // 6. Hotels by price range (if currency data available)
        console.log("\n6. Hotels by Currency:");
        const currencyResult = await client.query(`
            SELECT currency_code, COUNT(*) as hotel_count
            FROM hotel.hotels 
            WHERE country_code = 'AE' AND currency_code IS NOT NULL
            GROUP BY currency_code 
            ORDER BY hotel_count DESC
        `);
        currencyResult.rows.forEach(row => {
            console.log(`   ${row.currency_code}: ${row.hotel_count} hotels`);
        });
        
        // 7. Sample hotel details
        console.log("\n7. Sample Hotel Details:");
        const sampleResult = await client.query(`
            SELECT 
                h.id, h.name, h.city, h.stars, h.rating,
                h.address, h.phone, h.email,
                h.main_photo, h.description
            FROM hotel.hotels h
            WHERE country_code = 'AE'
            ORDER BY h.created_at DESC
            LIMIT 3
        `);
        
        sampleResult.rows.forEach((hotel, index) => {
            console.log(`\n   Hotel ${index + 1}: ${hotel.name}`);
            console.log(`   Location: ${hotel.city}, UAE`);
            console.log(`   Address: ${hotel.address || 'Not available'}`);
            console.log(`   Contact: ${hotel.phone || 'Not available'}`);
            console.log(`   Email: ${hotel.email || 'Not available'}`);
            console.log(`   Rating: ${hotel.stars || 'Not available'} stars, ${hotel.rating || 'Not available'}/10`);
            console.log(`   Photo: ${hotel.main_photo || 'Not available'}`);
            console.log(`   Description: ${hotel.description ? hotel.description.substring(0, 100) + '...' : 'Not available'}`);
        });
        
        client.release();
        
    } catch (error) {
        console.error("Query failed:", error);
    } finally {
        await pool.end();
    }
}

async function searchHotelsByCriteria(criteria: {
    city?: string;
    minStars?: number;
    maxStars?: number;
    minRating?: number;
    hasPool?: boolean;
    hasWiFi?: boolean;
    limit?: number;
}) {
    console.log("\n" + "=".repeat(60));
    console.log("Custom Hotel Search");
    console.log("=".repeat(60));
    
    try {
        const client = await pool.connect();
        
        let query = `
            SELECT h.id, h.name, h.city, h.stars, h.rating, h.review_count, h.address
            FROM hotel.hotels h
            WHERE h.country_code = 'AE'
        `;
        
        const params: any[] = [];
        let paramIndex = 1;
        
        if (criteria.city) {
            query += ` AND h.city ILIKE $${paramIndex}`;
            params.push(`%${criteria.city}%`);
            paramIndex++;
        }
        
        if (criteria.minStars) {
            query += ` AND h.stars >= $${paramIndex}`;
            params.push(criteria.minStars);
            paramIndex++;
        }
        
        if (criteria.maxStars) {
            query += ` AND h.stars <= $${paramIndex}`;
            params.push(criteria.maxStars);
            paramIndex++;
        }
        
        if (criteria.minRating) {
            query += ` AND h.rating >= $${paramIndex}`;
            params.push(criteria.minRating);
            paramIndex++;
        }
        
        if (criteria.hasPool || criteria.hasWiFi) {
            query += ` AND h.id IN (
                SELECT hfm.hotel_id 
                FROM hotel.hotel_facility_map hfm
                JOIN hotel.facilities f ON hfm.facility_id = f.id
                WHERE 1=1`;
            
            if (criteria.hasPool) {
                query += ` AND f.name ILIKE '%pool%'`;
            }
            if (criteria.hasWiFi) {
                if (criteria.hasPool) query += ` OR`;
                query += ` f.name ILIKE '%wifi%'`;
            }
            query += `)`;
        }
        
        query += ` ORDER BY h.stars DESC, h.rating DESC`;
        
        if (criteria.limit) {
            query += ` LIMIT $${paramIndex}`;
            params.push(criteria.limit);
        }
        
        const result = await client.query(query, params);
        
        console.log(`Found ${result.rows.length} hotels matching criteria:`);
        console.log("-".repeat(40));
        
        result.rows.forEach((hotel, index) => {
            console.log(`${index + 1}. ${hotel.name} (${hotel.city})`);
            console.log(`   Stars: ${hotel.stars}, Rating: ${hotel.rating}/10, Reviews: ${hotel.review_count}`);
            console.log(`   Address: ${hotel.address}`);
            console.log("");
        });
        
        client.release();
        
    } catch (error) {
        console.error("Search failed:", error);
    }
}

// Example usage
if (import.meta.url === `file://${process.argv[1]}`) {
    console.log("Running UAE Hotels Query Examples...\n");
    
    // Run basic queries
    queryUAEHotels().then(() => {
        console.log("\n" + "=".repeat(60));
        console.log("Running Custom Search Examples");
        console.log("=".repeat(60));
        
        // Example searches
        return searchHotelsByCriteria({
            city: "Dubai",
            minStars: 4,
            limit: 5
        });
    }).then(() => {
        return searchHotelsByCriteria({
            hasPool: true,
            hasWiFi: true,
            minRating: 8,
            limit: 3
        });
    }).catch(error => {
        console.error("Script failed:", error);
        process.exit(1);
    });
}

export { queryUAEHotels, searchHotelsByCriteria };