import fetch from 'node-fetch';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Strictly use the local PostgreSQL for static data import tasks as per AI_AGENT_RULES.md
const LOCAL_DATABASE_URL = 'postgresql://postgres@localhost:5432/tripalfa_local';
const databaseUrl = process.env.STATIC_DATABASE_URL || LOCAL_DATABASE_URL;

console.log(`🔌 Connecting to database: ${databaseUrl}`);

// Initialize PostgreSQL connection pool
const pool = new pg.Pool({
    connectionString: databaseUrl,
    max: 10,
});

// Create Prisma adapter for PostgreSQL
const adapter = new PrismaPg(pool);

// Initialize Prisma Client with adapter (required for Prisma 7.x)
// @ts-ignore - Prisma 7.x adapter compatibility
const prisma = new PrismaClient({
    adapter,
    log: ['error', 'warn'],
});

const BASE_URL = 'https://api.liteapi.travel/v3.0/data';

interface AirportData {
    iataCode?: string;
    code?: string;
    icaoCode?: string;
    name?: string;
    city?: string;
    country?: string;
    countryCode?: string;
    latitude?: number;
    longitude?: number;
}

interface CurrencyData {
    code: string;
    currency?: string;
    name?: string;
    symbol?: string;
}

interface ChainData {
    id: number | string;
    name?: string;
}

interface DestinationData {
    code?: string;
    iataCode?: string;
    id?: string;
    name?: string;
    type?: string;
    country?: string;
    countryCode?: string;
    latitude?: number;
    longitude?: number;
}

interface AmenityData {
    code?: string;
    id?: string;
    name?: string;
    category?: string;
}

interface CityData {
    city?: string;
    country?: string;
}

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

interface HotelData {
    id: string;
    primaryHotelId?: string;
    name?: string;
    hotelDescription?: string;
    hotelTypeId?: string;
    chainId?: string;
    chain?: string;
    currency?: string;
    country?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
    address?: string;
    zip?: string;
    main_photo?: string;
    thumbnail?: string;
    stars?: number;
    rating?: number;
    reviewCount?: number;
    facilityIds?: string[];
}

class LiteAPIImporter {
    retryCount: number = 3;
    retryDelay: number = 2000;

    async fetchData(endpoint: string): Promise<any> {
        const apiKey = process.env.LITEAPI_API_KEY;

        if (!apiKey) {
            console.warn('⚠️  LITEAPI_API_KEY not found in environment variables. API calls may fail.');
        }

        let lastError: Error | null = null;
        for (let attempt = 1; attempt <= this.retryCount; attempt++) {
            try {
                console.log(`Fetching ${endpoint} (attempt ${attempt}/${this.retryCount})...`);
                const response = await fetch(`${BASE_URL}${endpoint}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'X-API-Key': apiKey || '',
                    },
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();
                if (!data.data) {
                    throw new Error(`API Error: Invalid response structure - missing 'data' field`);
                }

                console.log(`✓ Successfully fetched ${endpoint}`);
                return data.data;
            } catch (error) {
                lastError = error as Error;
                console.error(`✗ Attempt ${attempt} failed: ${(error as Error).message}`);
                if (attempt < this.retryCount) {
                    console.log(`Retrying in ${this.retryDelay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, this.retryDelay));
                }
            }
        }
        throw new Error(`Failed to fetch ${endpoint} after ${this.retryCount} attempts: ${lastError?.message}`);
    }

    async importAirports(data: AirportData[]): Promise<void> {
        console.log(`\nImporting ${data.length} airports...`);
        let count = 0;
        for (const airport of data) {
            try {
                await (prisma as any).airport.upsert({
                    where: { iataCode: airport.iataCode || airport.code },
                    update: {
                        name: airport.name,
                        city: airport.city,
                        country: airport.country,
                        countryCode: airport.countryCode,
                        latitude: airport.latitude,
                        longitude: airport.longitude,
                    },
                    create: {
                        iataCode: airport.iataCode || airport.code,
                        icaoCode: airport.icaoCode,
                        name: airport.name,
                        city: airport.city,
                        country: airport.country,
                        countryCode: airport.countryCode,
                        latitude: airport.latitude,
                        longitude: airport.longitude,
                    },
                });
                count++;
            } catch (error) {
                console.error(`  Failed to import airport ${airport.iataCode || airport.code}:`, (error as Error).message);
            }
        }
        console.log(`✓ ${count}/${data.length} airports imported`);
    }

    async importCurrencies(data: CurrencyData[]): Promise<void> {
        console.log(`\nImporting ${data.length} currencies...`);
        let count = 0;
        for (const curr of data) {
            try {
                const name = curr.currency || curr.name;
                await (prisma as any).currency.upsert({
                    where: { code: curr.code },
                    update: {
                        name: name,
                        symbol: curr.symbol || '',
                    },
                    create: {
                        code: curr.code,
                        name: name,
                        symbol: curr.symbol || '',
                    },
                });
                count++;
            } catch (error) {
                console.error(`  Failed to import currency ${curr.code}:`, (error as Error).message);
            }
        }
        console.log(`✓ ${count}/${data.length} currencies imported`);
    }

    async importHotelChains(data: ChainData[]): Promise<void> {
        console.log(`\nImporting ${data.length} hotel chains via direct SQL...`);
        let count = 0;

        if (data.length === 0) {
            console.log(`✓ 0/0 hotel chains imported`);
            return;
        }

        try {
            const values = data.map((chain) => {
                const chainId = chain.id.toString();
                const name = chain.name || `Chain ${chainId}`;
                return `('${chainId}', '${name.replace(/'/g, "''")}')`;
            }).join(',\n');

            const sql = `
        INSERT INTO hotel_chains (chain_id, name)
        VALUES ${values}
        ON CONFLICT (chain_id) DO UPDATE SET name = EXCLUDED.name;
      `;

            const client = await pool.connect();
            try {
                await client.query(sql);
                count = data.length;
            } finally {
                client.release();
            }
        } catch (error) {
            console.error(`  Batch import failed:`, (error as Error).message);

            for (const chain of data) {
                try {
                    const chainId = chain.id.toString();
                    const name = chain.name || `Chain ${chainId}`;
                    const sql = `
            INSERT INTO hotel_chains (chain_id, name)
            VALUES ($1, $2)
            ON CONFLICT (chain_id) DO UPDATE SET name = EXCLUDED.name
          `;
                    const client = await pool.connect();
                    try {
                        await client.query(sql, [chainId, name]);
                        count++;
                    } finally {
                        client.release();
                    }
                } catch (error) {
                    console.error(`  Failed to import hotel chain ${chain.id}:`, (error as Error).message);
                }
            }
        }

        console.log(`✓ ${count}/${data.length} hotel chains imported`);
    }

    async importDestinations(data: DestinationData[]): Promise<void> {
        console.log(`\nImporting ${data.length} destinations...`);
        let count = 0;
        for (const dest of data) {
            try {
                await (prisma as any).destination.upsert({
                    where: { code: dest.code || dest.iataCode || dest.id },
                    update: {
                        name: dest.name,
                        country: dest.country,
                        countryCode: dest.countryCode,
                        latitude: dest.latitude,
                        longitude: dest.longitude,
                    },
                    create: {
                        code: dest.code || dest.iataCode || dest.id,
                        name: dest.name,
                        type: dest.type || 'city',
                        country: dest.country,
                        countryCode: dest.countryCode,
                        latitude: dest.latitude,
                        longitude: dest.longitude,
                    },
                });
                count++;
            } catch (error) {
                console.error(`  Failed to import destination ${dest.code || dest.id}:`, (error as Error).message);
            }
        }
        console.log(`✓ ${count}/${data.length} destinations imported`);
    }

    async importHotelAmenities(data: AmenityData[]): Promise<void> {
        console.log(`\nImporting ${data.length} hotel amenities...`);
        let count = 0;
        for (const amenity of data) {
            try {
                await (prisma as any).hotelAmenity.upsert({
                    where: { code: amenity.code || amenity.id },
                    update: {
                        name: amenity.name,
                        category: amenity.category,
                    },
                    create: {
                        code: amenity.code || amenity.id,
                        name: amenity.name,
                        category: amenity.category,
                    },
                });
                count++;
            } catch (error) {
                console.error(`  Failed to import amenity ${amenity.code || amenity.id}:`, (error as Error).message);
            }
        }
        console.log(`✓ ${count}/${data.length} hotel amenities imported`);
    }

    async importCities(countriesData: any[]): Promise<void> {
        console.log(`\nImporting cities for ${countriesData.length} countries...`);
        let totalImported = 0;
        const BATCH_SIZE = 500;

        for (const country of countriesData) {
            if (!country.code) continue;

            try {
                const citiesResponse = await fetch(`${BASE_URL}/cities?countryCode=${country.code}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'X-API-Key': process.env.LITEAPI_API_KEY || '',
                    },
                });

                if (!citiesResponse.ok) {
                    console.warn(`  ⚠️  Failed to fetch cities for ${country.code}: ${citiesResponse.status}`);
                    continue;
                }

                const citiesData = await citiesResponse.json();
                if (!citiesData.data || !Array.isArray(citiesData.data)) {
                    continue;
                }

                const validCities = citiesData.data
                    .map((item: any) => item.city)
                    .filter((city: any) => city && city.trim().length > 0 && city.trim().length < 200)
                    .map((city: any) => city.trim().replace(/^["']|["']$/g, ''));

                if (validCities.length === 0) continue;

                const client = await pool.connect();
                try {
                    for (let i = 0; i < validCities.length; i += BATCH_SIZE) {
                        const batch = validCities.slice(i, i + BATCH_SIZE);
                        const placeholders = batch.map((_, idx) => `($${idx * 2 + 1}, $${idx * 2 + 2})`).join(',');
                        const params: any[] = [];
                        batch.forEach(city => {
                            params.push(city);
                            params.push(country.code);
                        });

                        await client.query(
                            `INSERT INTO cities (city_name, country_code) VALUES ${placeholders} ON CONFLICT DO NOTHING`,
                            params
                        );
                    }
                    totalImported += validCities.length;
                } finally {
                    client.release();
                }
            } catch (error) {
                console.warn(`  ⚠️  Error importing cities for ${country.code}:`, (error as Error).message);
            }
        }

        console.log(`✓ ${totalImported} cities imported`);
    }

    async importFacilities(data: FacilityData[]): Promise<void> {
        console.log(`\nImporting ${data.length} hotel facilities with translations...`);
        let facilitiesCount = 0;
        let translationsCount = 0;

        const client = await pool.connect();
        try {
            for (const facility of data) {
                if (!facility.facility_id) continue;

                try {
                    // Insert main facility
                    await client.query(
                        'INSERT INTO hotel_facilities (facility_id, facility_name, sort_order) VALUES ($1, $2, $3) ON CONFLICT (facility_id) DO UPDATE SET facility_name = EXCLUDED.facility_name',
                        [facility.facility_id, facility.facility, facility.sort || 0]
                    );
                    facilitiesCount++;

                    // Insert translations
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

        console.log(`✓ ${facilitiesCount}/${data.length} facilities imported with ${translationsCount} translations`);
    }

    async importHotels(countriesData: any[]): Promise<void> {
        console.log(`\nImporting hotels for ${countriesData.length} countries...`);
        let totalImported = 0;
        const client = await pool.connect();

        try {
            for (const country of countriesData) {
                if (!country.code) continue;

                try {
                    const hotelsResponse = await fetch(`${BASE_URL}/hotels?countryCode=${country.code}`, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json',
                            'X-API-Key': process.env.LITEAPI_API_KEY || '',
                        },
                    });

                    if (!hotelsResponse.ok) {
                        console.warn(`  ⚠️  Failed to fetch hotels for ${country.code}: ${hotelsResponse.status}`);
                        continue;
                    }

                    const hotelsData = await hotelsResponse.json();
                    if (!hotelsData.data || !Array.isArray(hotelsData.data)) {
                        continue;
                    }

                    for (const hotel of hotelsData.data as HotelData[]) {
                        if (!hotel.id) continue;

                        try {
                            await client.query(
                                `INSERT INTO hotels (
                  id, primary_hotel_id, name, description, hotel_type_id, chain_id, chain_name,
                  currency, country_code, city, latitude, longitude, address, zip_code,
                  main_photo_url, thumbnail_url, stars, rating, review_count, facility_ids
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
                ON CONFLICT (id) DO UPDATE SET
                  name = EXCLUDED.name,
                  description = EXCLUDED.description,
                  rating = EXCLUDED.rating,
                  review_count = EXCLUDED.review_count,
                  updated_at = CURRENT_TIMESTAMP`,
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
                            totalImported++;
                        } catch (error) {
                            console.warn(`  ⚠️  Error importing hotel ${hotel.id}:`, (error as Error).message);
                        }
                    }
                } catch (error) {
                    console.warn(`  ⚠️  Error importing hotels for ${country.code}:`, (error as Error).message);
                }
            }
        } finally {
            client.release();
        }

        console.log(`✓ ${totalImported} hotels imported`);
    }

    async run(): Promise<void> {
        try {
            console.log('Starting LiteAPI static data import...\n');

            const [currencies, countries, chains] =
                await Promise.all([
                    this.fetchData('/currencies').catch((err) => {
                        console.error('Failed to fetch currencies:', err.message);
                        return [];
                    }),
                    this.fetchData('/countries').catch((err) => {
                        console.error('Failed to fetch countries:', err.message);
                        return [];
                    }),
                    this.fetchData('/chains').catch((err) => {
                        console.error('Failed to fetch hotel chains:', err.message);
                        return [];
                    }),
                ]);

            let facilities: FacilityData[] = [];
            try {
                facilities = await this.fetchData('/facilities');
            } catch (err) {
                console.error('Failed to fetch facilities:', (err as Error).message);
            }

            await this.importCurrencies(currencies || []);
            await this.importHotelChains(chains || []);
            await this.importCities(countries || []);
            await this.importFacilities(facilities || []);
            await this.importHotels(countries || []);

            if (countries && countries.length > 0) {
                console.log(`\n✓ Fetched ${countries.length} countries (available for reference)`);
            }

            console.log('\n✓ LiteAPI static data import completed!');
            console.log(`Summary: ${currencies.length} currencies, ${chains.length} hotel chains, ${facilities.length} facilities, hotels imported from ${countries.length} countries`);
        } catch (error) {
            console.error('\n✗ Import failed:', error);
            process.exit(1);
        } finally {
            await prisma.$disconnect();
        }
    }
}

const importer = new LiteAPIImporter();
importer.run().catch(console.error);
