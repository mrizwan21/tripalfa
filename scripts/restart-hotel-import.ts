#!/usr/bin/env node

/**
 * Restart Hotel Import Script
 * 
 * This script will restart the hotel import process to your local database
 * after the previous import stopped yesterday.
 */

import fetch from 'node-fetch';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env.local' });

// Connect to LOCAL database (not Neon)
const pool = new pg.Pool({
    connectionString: 'postgresql://postgres@localhost:5432/tripalfa_local',
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
});

const BASE_URL = 'https://api.liteapi.travel/v3.0/data';

class HotelImportRestart {
    retryCount = 3;
    retryDelay = 2000;

    async fetchCountries(): Promise<Array<{ code: string }>> {
        console.log('🌍 Fetching countries list...');
        const response = await fetch(`${BASE_URL}/countries`, {
            headers: {
                'X-API-Key': process.env.LITEAPI_API_KEY || '',
            },
        });
        const data = await response.json();
        return data.data || [];
    }

    async importHotels(countriesData: Array<{ code: string }>): Promise<void> {
        console.log(`\n🏨 Importing hotels for ${countriesData.length} countries to LOCAL database...\n`);
        let totalImported = 0;
        let totalFailed = 0;
        let alreadyExists = 0;

        for (let i = 0; i < countriesData.length; i++) {
            const country = countriesData[i];
            if (!country.code) continue;

            let retries = 0;
            let success = false;

            while (retries < this.retryCount && !success) {
                try {
                    console.log(`📍 Processing country: ${country.code} (${i + 1}/${countriesData.length})`);
                    
                    const hotelsResponse = await fetch(`${BASE_URL}/hotels?countryCode=${country.code}`, {
                        headers: {
                            'X-API-Key': process.env.LITEAPI_API_KEY || '',
                        },
                        timeout: 30000,
                    });

                    if (!hotelsResponse.ok) {
                        console.warn(`  ⚠️  Country ${country.code}: HTTP ${hotelsResponse.status}`);
                        totalFailed++;
                        success = true;
                        continue;
                    }

                    const hotelsData = await hotelsResponse.json();
                    if (!hotelsData.data || !Array.isArray(hotelsData.data)) {
                        console.log(`  ℹ️  No hotels found for ${country.code}`);
                        success = true;
                        continue;
                    }

                    let batchImported = 0;
                    let batchUpdated = 0;
                    const client = await pool.connect();
                    try {
                        for (const hotel of hotelsData.data) {
                            if (!hotel.id) continue;

                            try {
                                const result = await client.query(
                                    `INSERT INTO public.hotels (
                                        id, primary_hotel_id, name, description, hotel_type_id, chain_id, chain_name,
                                        currency, country_code, city, latitude, longitude, address, zip_code,
                                        main_photo_url, thumbnail_url, stars, rating, review_count, facility_ids
                                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
                                    ON CONFLICT (id) DO UPDATE SET
                                        name = EXCLUDED.name,
                                        description = EXCLUDED.description,
                                        rating = EXCLUDED.rating,
                                        review_count = EXCLUDED.review_count,
                                        updated_at = CURRENT_TIMESTAMP
                                    RETURNING id`,
                                    [
                                        hotel.id,
                                        hotel.primaryHotelId || null,
                                        hotel.name || 'Unknown Hotel',
                                        hotel.hotelDescription || null,
                                        hotel.hotelTypeId || null,
                                        hotel.chainId || null,
                                        hotel.chain || null,
                                        hotel.currency || null,
                                        hotel.country || country.code,
                                        hotel.city || null,
                                        hotel.latitude || null,
                                        hotel.longitude || null,
                                        hotel.address || null,
                                        hotel.zip || null,
                                        hotel.main_photo || null,
                                        hotel.thumbnail || null,
                                        hotel.stars || null,
                                        hotel.rating || null,
                                        hotel.reviewCount || null,
                                        hotel.facilityIds ? JSON.stringify(hotel.facilityIds) : null
                                    ]
                                );

                                if (result.rowCount > 0) {
                                    // Check if this was an insert or update
                                    batchImported++;
                                    totalImported++;
                                }
                            } catch (error) {
                                // Skip individual hotel errors
                                console.warn(`    ⚠️  Failed to import hotel ${hotel.id}: ${error.message}`);
                            }
                        }
                    } finally {
                        client.release();
                    }

                    success = true;

                    if (batchImported > 0) {
                        console.log(`  ✓ ${country.code}: ${batchImported} hotels processed`);
                    } else {
                        console.log(`  ✓ ${country.code}: No new hotels to import`);
                    }

                    // Progress update every 10 countries
                    if ((i + 1) % 10 === 0) {
                        console.log(`\n📊 Progress: ${i + 1}/${countriesData.length} countries processed`);
                        console.log(`   📈 Total imported: ${totalImported} hotels`);
                        console.log(`   ⚠️  Failed countries: ${totalFailed}\n`);
                    }
                } catch (error) {
                    retries++;
                    if (retries < this.retryCount) {
                        console.warn(`  ⚠️  Error for ${country.code} (retry ${retries}/${this.retryCount}):`, error.message);
                        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
                    } else {
                        console.warn(`  ✗ Failed to import hotels for ${country.code} after ${this.retryCount} retries`);
                        totalFailed++;
                        success = true;
                    }
                }
            }
        }

        console.log(`\n🎉 IMPORT SUMMARY:`);
        console.log(`   🏨 Total hotels imported/updated: ${totalImported}`);
        console.log(`   ❌ Failed countries: ${totalFailed}`);
        console.log(`   ✅ Countries successfully processed: ${countriesData.length - totalFailed}`);
    }

    async getCurrentCount(): Promise<number> {
        const client = await pool.connect();
        try {
            const result = await client.query('SELECT COUNT(*) as total FROM public.hotels');
            return parseInt(result.rows[0].total);
        } finally {
            client.release();
        }
    }

    async run(): Promise<void> {
        try {
            console.log('🚀 RESTARTING HOTEL IMPORT PROCESS\n');
            console.log('This will continue importing hotels to your LOCAL database\n');
            
            // Check current count
            const currentCount = await this.getCurrentCount();
            console.log(`📊 Current hotel count: ${currentCount.toLocaleString()}\n`);

            const countries = await this.fetchCountries();
            console.log(`🌍 Found ${countries.length} countries to process\n`);
            
            await this.importHotels(countries);
            
            // Check final count
            const finalCount = await this.getCurrentCount();
            const newHotels = finalCount - currentCount;
            
            console.log(`\n🎯 FINAL RESULTS:`);
            console.log(`   📊 Before: ${currentCount.toLocaleString()} hotels`);
            console.log(`   📊 After: ${finalCount.toLocaleString()} hotels`);
            console.log(`   ➕ Added: ${newHotels.toLocaleString()} new hotels`);
            
            if (newHotels > 0) {
                console.log(`\n✅ SUCCESS: Import completed with ${newHotels} new hotels!`);
            } else {
                console.log(`\nℹ️  INFO: No new hotels were added. Import may be complete.`);
            }
            
        } catch (error) {
            console.error('\n❌ Import failed:', error.message);
            process.exit(1);
        } finally {
            await pool.end();
        }
    }
}

const importer = new HotelImportRestart();
importer.run().catch(console.error);