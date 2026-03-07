import fetch from 'node-fetch';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// Static data MUST use local PostgreSQL as per AI_AGENT_RULES.md
const LOCAL_DATABASE_URL = 'postgresql://postgres@localhost:5432/tripalfa_local';
const databaseUrl = process.env.STATIC_DATABASE_URL || LOCAL_DATABASE_URL;

console.log(`🔌 Connecting to database: ${databaseUrl}`);

const pool = new pg.Pool({
    connectionString: databaseUrl,
    max: 10
});

const BASE_URL = 'https://api.liteapi.travel/v3.0/data';

interface Translation {
    lang: string;
    facility: string;
}

interface FacilityData {
    facility_id: string;
    facility?: string;
    sort?: number;
    translation?: Translation[];
}

async function importFacilities() {
    console.log('Fetching facilities...');
    try {
        const response = await fetch(`${BASE_URL}/facilities`, {
            headers: {
                'X-API-Key': process.env.LITEAPI_API_KEY || '',
            },
        });
        const data: any = await response.json();
        const facilities: FacilityData[] = data.data || [];

        console.log(`\nImporting ${facilities.length} hotel facilities with translations...`);
        let facilitiesCount = 0;
        let translationsCount = 0;

        const client = await pool.connect();
        try {
            for (const facility of facilities) {
                if (!facility.facility_id) continue;

                try {
                    await client.query(
                        'INSERT INTO hotel_facilities (facility_id, facility_name, sort_order) VALUES ($1, $2, $3) ON CONFLICT (facility_id) DO UPDATE SET facility_name = EXCLUDED.facility_name',
                        [facility.facility_id, facility.facility, facility.sort || 0]
                    );
                    facilitiesCount++;

                    if (facility.translation && Array.isArray(facility.translation)) {
                        for (const trans of facility.translation) {
                            if (trans.lang && trans.facility) {
                                await client.query(
                                    'INSERT INTO hotel_facility_translations (facility_id, language_code, facility_name) VALUES ($1, $2, $3) ON CONFLICT (facility_id, language_code) DO UPDATE SET facility_name = EXCLUDED.facility_name',
                                    [facility.facility_id, trans.lang, trans.facility]
                                );
                                translationsCount++;
                            }
                        }
                    }
                } catch (error) {
                    console.warn(`  ⚠️  Error importing facility ${facility.facility_id}:`, (error as Error).message);
                }
            }
        } finally {
            client.release();
        }

        console.log(`✓ ${facilitiesCount}/${facilities.length} facilities imported with ${translationsCount} translations`);
        await pool.end();
    } catch (error) {
        console.error('Error:', (error as Error).message);
        process.exit(1);
    }
}

importFacilities();
