#!/usr/bin/env node

/**
 * Full LiteAPI Hotel Import Script
 * 
 * This script imports the complete LiteAPI hotel dataset to your local database
 * using pagination to get all hotels, not just the sample 200 per country.
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
const MAX_LIMIT = 500; // Maximum hotels per request

class FullHotelImport {
    retryCount = 3;
    retryDelay = 2000;
    totalImported = 0;
    totalCountries = 0;
    totalFailedCountries = 0;

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

    async getCountryHotelCount(countryCode: string): Promise<number> {
        try {
            // First, get a sample to estimate total count
            const response = await fetch(`${BASE_URL}/hotels?countryCode=${countryCode}&limit=1`, {
                headers: {
                    'X-API-Key': process.env.LITEAPI_API_KEY || '',
                },
            });
            
            if (!response.ok) {
                return 0;
            }

            // The API doesn't provide total count directly, so we'll use pagination
            // to get all hotels. We'll start with a reasonable estimate.
            return 10000; // Conservative estimate - we'll paginate until no more results
        } catch (error) {
            return 0;
        }
    }

    async importCountryHotels(countryCode: string): Promise<number> {
        let offset = 0;
        let countryImported = 0;
        let hasMore = true;

        console.log(`\n🏨 Importing hotels for ${countryCode}...`);

        while (hasMore) {
            try {
                const response = await fetch(`${BASE_URL}/hotels?countryCode=${countryCode}&offset=${offset}&limit=${MAX_LIMIT}`, {
                    headers: {
                        'X-API-Key': process.env.LITEAPI_API_KEY || '',
                    },
                    timeout: 30000,
                });

                if (!response.ok) {
                    console.warn(`  ⚠️  HTTP ${response.status} for ${countryCode} at offset ${offset}`);
                    hasMore = false;
                    break;
                }

                const data = await response.json();
                
                if (!data.data || !Array.isArray(data.data) || data.data.length === 0) {
                    hasMore = false;
                    break;
                }

                // Import batch of hotels
                const batchImported = await this.importHotelBatch(data.data, countryCode);
                countryImported += batchImported;
                this.totalImported += batchImported;

                console.log(`  📊 ${countryCode}: ${batchImported} hotels (offset ${offset})`);

                if (data.data.length < MAX_LIMIT) {
                    hasMore = false; // No more hotels
                } else {
                    offset += MAX_LIMIT;
                }

                // Rate limiting - be respectful to the API
                await new Promise(resolve => setTimeout(resolve, 1000));

            } catch (error) {
                console.warn(`  ❌ Error importing ${countryCode} at offset ${offset}:`, error.message);
                hasMore = false;
                this.totalFailedCountries++;
                break;
            }
        }

        return countryImported;
    }

    async importHotelBatch(hotels: any[], countryCode: string): Promise<number> {
        let batchImported = 0;
        const client = await pool.connect();
        
        try {
            for (const hotel of hotels) {
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
                            hotel.country || countryCode,
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
                        batchImported++;
                    }
                } catch (error) {
                    // Skip individual hotel errors
                }
            }
        } finally {
            client.release();
        }

        return batchImported;
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
            console.log('🚀 FULL LITEAPI HOTEL DATASET IMPORT\n');
            console.log('This will import the COMPLETE LiteAPI hotel inventory to your LOCAL database\n');
            console.log('⚠️  This may take several hours due to the large dataset size\n');
            
            // Check current count
            const currentCount = await this.getCurrentCount();
            console.log(`📊 Current hotel count: ${currentCount.toLocaleString()}\n`);

            const countries = await this.fetchCountries();
            this.totalCountries = countries.length;
            console.log(`🌍 Found ${countries.length} countries to process\n`);
            
            // Process countries
            for (let i = 0; i < countries.length; i++) {
                const country = countries[i];
                if (!country.code) continue;

                const countryImported = await this.importCountryHotels(country.code);
                
                // Progress update
                const progress = ((i + 1) / countries.length) * 100;
                console.log(`\n📈 Progress: ${i + 1}/${countries.length} countries (${progress.toFixed(1)}%)`);
                console.log(`   📊 Total imported so far: ${this.totalImported.toLocaleString()} hotels`);
                console.log(`   ❌ Failed countries: ${this.totalFailedCountries}\n`);

                // Save progress periodically
                if ((i + 1) % 10 === 0) {
                    const currentTotal = await this.getCurrentCount();
                    console.log(`💾 Progress saved: ${currentTotal.toLocaleString()} total hotels in database\n`);
                }
            }
            
            // Check final count
            const finalCount = await this.getCurrentCount();
            const newHotels = finalCount - currentCount;
            
            console.log(`\n🎯 FINAL RESULTS:`);
            console.log(`   📊 Before: ${currentCount.toLocaleString()} hotels`);
            console.log(`   📊 After: ${finalCount.toLocaleString()} hotels`);
            console.log(`   ➕ Added: ${newHotels.toLocaleString()} new hotels`);
            console.log(`   🌍 Countries processed: ${this.totalCountries - this.totalFailedCountries}/${this.totalCountries}`);
            console.log(`   ❌ Failed countries: ${this.totalFailedCountries}`);
            
            if (newHotels > 0) {
                console.log(`\n✅ SUCCESS: Full dataset import completed with ${newHotels.toLocaleString()} new hotels!`);
                console.log(`   🎉 Total LiteAPI inventory imported: ${finalCount.toLocaleString()} hotels`);
            } else {
                console.log(`\nℹ️  INFO: No new hotels were added. Database may already contain the full dataset.`);
            }
            
        } catch (error) {
            console.error('\n❌ Import failed:', error.message);
            process.exit(1);
        } finally {
            await pool.end();
        }
    }
}

const importer = new FullHotelImport();
importer.run().catch(console.error);