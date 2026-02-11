import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
import Fastify from 'fastify';
import { createRequire } from 'module';
const requireC = createRequire(import.meta.url);

// Import static airport data - official airport data for the application
import { AIRPORTS, searchAirports } from './data/airports.js';
import { AIRCRAFT, searchAircraft, getAircraftByCode } from './data/aircraft.js';
import { LOYALTY_PROGRAMS, searchLoyaltyPrograms, getLoyaltyProgramByCode } from './data/loyalty-programs.js';
import { COUNTRIES, searchCountries, getCountryByCode } from './data/countries.js';
import { NATIONALITIES, searchNationalities, getNationalityByCode } from './data/nationalities.js';
import { CITIES, searchCities, getCityById, getCitiesByCountry } from './data/cities.js';
/*
  Dynamic resolution fallback for environments where importing sibling service
  TS files fails at runtime (ts-node-dev / ESM resolution issues).
  Prefer local shared db-connector and cache modules when available, otherwise
  create lightweight fallbacks using 'pg' and an in-memory noop redis.
*/
let queryStatic: any;
let queryRealtime: any;
let getRedisClient: any;
try {
    // Try to load local shared modules (preferred in monorepo)
    // Use require to avoid ESM directory import problems at runtime.

    const db = requireC('../../db-connector/src');
    queryStatic = db.queryStatic;
    queryRealtime = db.queryRealtime;

    getRedisClient = requireC('../../cache/redisClient').getRedisClient;
} catch (err) {
    // Fallback: create dummy functions that return errors
    // This ensures the gateway can start even if monorepo resolution fails.
    console.warn('Warning: db-connector not available, using safe no-op database functions');

    // Create safe noop database functions that will not attempt connections
    queryStatic = async (text: string, params?: any[]) => {
        console.error('[queryStatic] Database unavailable - returning error');
        return { rows: [], rowCount: 0 };
    };
    queryRealtime = async (text: string, params?: any[]) => {
        console.error('[queryRealtime] Database unavailable - returning error');
        return { rows: [], rowCount: 0 };
    };
    getRedisClient = () => {
        // very small noop redis client to avoid runtime crashes when Redis unavailable
        return {
            get: async (_k: string) => null,
            set: async (_k: string, _v: string, _mode?: string, _ttl?: number) => null,
            xadd: async (_stream: string, _id: string, ..._args: any[]) => null,
            del: async (_k: string) => null
        };
    };
}
let Registry: any = { getAdapter: (_: string) => null }; // Default no-op registry

// Initialize Registry asynchronously before server starts
const initializeRegistry = async () => {
    try {
        // Use dynamic import for ESM compatibility
        const reg = await import('./adapters/Registry.js');
        Registry = reg?.default || reg;
        console.log('✅ Registry initialized successfully');
    } catch (err: any) {
        console.error('⚠️  Registry initialization failed, using fallback:', err?.message);
        Registry = { getAdapter: (_: string) => null };
    }
};
/*
  Lightweight local Intent/RoutedRequest shims to avoid resolving
  monorepo packages at runtime in development (ts-node ESM directory import issues).
  These mirror the minimal shape used by the gateway; replace with real shared-types
  when running in full monorepo/runtime that resolves packages.
*/
const Intent: Record<string, string> = {
    READ_STATIC: 'READ_STATIC',
    QUERY_STATIC: 'QUERY_STATIC',
    QUERY_REALTIME: 'QUERY_REALTIME',
    READ_REALTIME: 'READ_REALTIME',
    ADAPTER: 'ADAPTER',
    WRITE: 'WRITE'
};
// RoutedRequest is only used for typing; use any at runtime to avoid module resolution.
type RoutedRequest = any;

const server = Fastify({ logger: true });
server.register(requireC('@fastify/cors'), {
    origin: true, // Must reflect origin when credentials: true
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
    credentials: true,
});
const redis = getRedisClient();

server.post('/route', async (request, reply) => {
    const { intent, body, meta } = request.body as RoutedRequest;

    switch (intent) {
        case Intent.READ_STATIC:
        case Intent.QUERY_STATIC:
            // Query local Postgres
            const staticResult = await queryStatic(body.query, body.params);
            return staticResult.rows;

        case Intent.QUERY_REALTIME:
            // Query Neon directly
            const dynamicResult = await queryRealtime(body.query, body.params);
            return dynamicResult.rows;

        case Intent.READ_REALTIME:
        case Intent.ADAPTER: {
            // 1. Try Redis cache for specific product lookup if applicable
            if (body.productId) {
                const cacheKey = 'realtime:' + body.productId;
                const cached = await redis.get(cacheKey);
                if (cached) {
                    try {
                        return JSON.parse(cached);
                    } catch (parseErr) {
                        server.log.warn({ err: parseErr }, 'Failed to parse cached realtime value');
                    }
                }
            }

            // 2. Check for adapter delegation (standard for search/live requests)
            const adapterName = (meta && (meta.adapter || meta.vendor)) || body.provider;
            if (adapterName) {
                const adapter = Registry.getAdapter(String(adapterName).toLowerCase());
                if (adapter) {
                    try {
                        const result = await adapter.request(body);
                        server.log.info(`Adapter ${adapterName} returned ${Array.isArray(result) ? result.length : 'non-array'} results`);
                        return result;
                    } catch (adapterError: any) {
                        server.log.error(`Adapter ${adapterName} failed: ${adapterError?.response?.data || adapterError?.message}`);
                        throw adapterError;
                    }
                }
            }

            // 3. Fallback to Neon if it is a specific product lookup
            if (body.productId) {
                const dbResult = await queryRealtime('SELECT * FROM realtime_data WHERE product_id = $1 ORDER BY ts DESC LIMIT 1', [body.productId]);
                return dbResult.rows[0];
            }

            return reply.code(400).send({ error: 'No adapter or product ID provided for real-time request' });
        }

        case Intent.WRITE:
            // Push to Redis Stream for ingestion pipeline
            const streamKey = process.env.INGEST_STREAM || 'ingest:stream';
            await redis.xadd(streamKey, '*', 'vendor', meta?.vendor || 'unknown', 'payload', JSON.stringify(body));
            return { status: 'queued' };

        default: {
            // Forward to adapter if it's a third-party request
            const adapterName = meta?.adapter;
            if (adapterName) {
                const adapter = Registry.getAdapter(adapterName);
                if (adapter) {
                    return await adapter.request(body);
                }
            }
            return reply.code(400).send({ error: 'Invalid intent or adapter' });
        }
    }
});

// --- RESTful Static Data Routes ---

server.get('/airports', async (request, reply) => {
    const { q, query } = request.query as { q?: string; query?: string };
    const searchTerm = q || query;

    console.log(`[/airports] Endpoint called with query: "${searchTerm || 'none'}"`);

    // Search static airport data
    const results = searchAirports(searchTerm);

    console.log(`[/airports] Returning ${results.length} airports${searchTerm ? ` matching "${searchTerm}"` : ''}`);
    return results.slice(0, 100);
});

server.get('/airlines', async (request, reply) => {
    const result = await queryStatic('SELECT * FROM airlines WHERE is_active = true ORDER BY name ASC', []);
    return result.rows;
});

server.get('/aircraft', async (request, reply) => {
    const { q, query, code } = request.query as { q?: string; query?: string; code?: string };

    // If code is provided, return single aircraft
    if (code) {
        const aircraft = getAircraftByCode(code);
        return aircraft ? [aircraft] : [];
    }

    // Otherwise search or return all
    const searchTerm = q || query;
    const results = searchAircraft(searchTerm);
    return results;
});

server.get('/loyalty-programs', async (request, reply) => {
    const { q, query, code } = request.query as { q?: string; query?: string; code?: string };

    // If airline code is provided, return that airline's program
    if (code) {
        const program = getLoyaltyProgramByCode(code);
        return program ? [program] : [];
    }

    // Otherwise search or return all
    const searchTerm = q || query;
    const results = searchLoyaltyPrograms(searchTerm || '');
    return results;
});

server.get('/hotels', async (request, reply) => {
    const { city, country, limit, offset } = request.query as { city?: string, country?: string, limit?: string, offset?: string };
    let query = 'SELECT * FROM canonical_hotels WHERE is_active = true';
    const params: any[] = [];
    let paramIdx = 1;

    if (city) {
        query += ` AND city ILIKE $${paramIdx++}`;
        params.push(`%${city}%`);
    }
    if (country) {
        query += ` AND country ILIKE $${paramIdx++}`;
        params.push(`%${country}%`);
    }

    const l = Math.min(parseInt(limit || '50'), 100);
    const o = parseInt(offset || '0');

    query += ` ORDER BY star_rating DESC NULLS LAST LIMIT $${paramIdx++} OFFSET $${paramIdx++}`;
    params.push(l, o);

    const result = await queryStatic(query, params);
    return result.rows;
});

server.get('/static/languages', async (request, reply) => {
    try {
        const result = await queryStatic('SELECT * FROM languages WHERE is_active = true ORDER BY name ASC', []);
        return result.rows;
    } catch (err) {
        // Fallback when static DB/schema not initialized
        server.log.warn({ err }, 'GET /static/languages fallback due to error');
        return [
            { code: 'en', name: 'English' },
            { code: 'ar', name: 'Arabic' },
            { code: 'fr', name: 'French' },
            { code: 'es', name: 'Spanish' },
            { code: 'de', name: 'German' }
        ];
    }
});

server.get('/translations', async (request, reply) => {
    const lang = (request.query as any).lang || 'en';
    server.log.info(`GET /translations requested for lang=${lang}`);
    const cacheKey = `translations:${lang}`;
    try {
        // Try cache first
        try {
            const cached = await redis.get(cacheKey);
            if (cached) {
                server.log.info(`translations cache hit for lang=${lang}`);
                return JSON.parse(cached);
            }
        } catch (cacheErr) {
            server.log.warn({ err: cacheErr }, 'Redis GET failed for translations cache');
        }

        // Fallback to DB
        const result = await queryStatic(
            'SELECT key, value FROM translations WHERE lang_code = $1 AND is_active = true',
            [lang]
        );
        server.log.info(`DB returned ${Array.isArray(result?.rows) ? result.rows.length : 'no'} rows for translations lang=${lang}`);
        const map: Record<string, string> = {};
        (result.rows || []).forEach((r: any) => { map[r.key] = r.value; });

        // Populate cache (best-effort)
        try {
            const ttl = Number(process.env.TRANSLATIONS_CACHE_TTL || '3600');
            await redis.set(cacheKey, JSON.stringify(map), 'EX', ttl);
            server.log.info(`translations cached for lang=${lang} ttl=${ttl}s`);
        } catch (cacheErr) {
            server.log.warn({ err: cacheErr }, 'Redis SET failed for translations cache');
        }

        return map;
    } catch (err) {
        server.log.warn({ err }, 'GET /translations failed, returning empty map');
        // Also output stack for local debugging
        try { console.error(err && (err.stack || err)); } catch (e) { }
        return {};
    }
});

// Save single translation to database
server.post('/translations/save', async (request, reply) => {
    try {
        const { lang, key, value, is_active = true } = request.body as any;

        if (!lang || !key || !value) {
            return reply.code(400).send({ error: 'Missing required fields: lang, key, value' });
        }

        // Insert or update translation
        const result = await queryStatic(
            `INSERT INTO translations (translation_key, lang_code, value, is_active, updated_at) 
             VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
             ON CONFLICT (translation_key, lang_code) 
             DO UPDATE SET value = EXCLUDED.value, is_active = EXCLUDED.is_active, updated_at = CURRENT_TIMESTAMP
             RETURNING translation_key, lang_code, value, is_active`,
            [key, lang, value, is_active]
        );

        // Invalidate cache for this language
        try {
            await redis.del(`translations:${lang}`);
            server.log.info(`Cache invalidated for lang=${lang}`);
        } catch (cacheErr) {
            server.log.warn({ err: cacheErr }, 'Redis DEL failed for translations cache invalidation');
        }

        server.log.info(`Saved translation: ${lang}.${key} = "${value}"`);
        return { success: true, translation: result.rows[0] };
    } catch (err) {
        server.log.error({ err }, 'POST /translations/save failed');
        return reply.code(500).send({ error: 'Failed to save translation' });
    }
});

// Save multiple translations to database
server.post('/translations/bulk-save', async (request, reply) => {
    try {
        const { lang, translations, is_active = true } = request.body as any;

        if (!lang || !translations || typeof translations !== 'object') {
            return reply.code(400).send({ error: 'Missing required fields: lang, translations' });
        }

        const keys = Object.keys(translations);
        if (keys.length === 0) {
            return reply.code(400).send({ error: 'No translations provided' });
        }

        // Build bulk insert query
        const values = [];
        const params = [];
        let paramIndex = 1;

        keys.forEach(key => {
            values.push(`($${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, CURRENT_TIMESTAMP)`);
            params.push(key, lang, translations[key], is_active);
        });

        const query = `
            INSERT INTO translations (translation_key, lang_code, value, is_active, updated_at)
            VALUES ${values.join(', ')}
            ON CONFLICT (translation_key, lang_code)
            DO UPDATE SET value = EXCLUDED.value, is_active = EXCLUDED.is_active, updated_at = CURRENT_TIMESTAMP
            RETURNING translation_key, lang_code, value, is_active
        `;

        const result = await queryStatic(query, params);

        // Invalidate cache for this language
        try {
            await redis.del(`translations:${lang}`);
            server.log.info(`Cache invalidated for lang=${lang}`);
        } catch (cacheErr) {
            server.log.warn({ err: cacheErr }, 'Redis DEL failed for translations cache invalidation');
        }

        server.log.info(`Saved ${result.rows.length} translations for lang=${lang}`);
        return { success: true, count: result.rows.length, translations: result.rows };
    } catch (err) {
        server.log.error({ err }, 'POST /translations/bulk-save failed');
        return reply.code(500).send({ error: 'Failed to save translations' });
    }
});

// --- Currency Exchange Rate Endpoints ---

// Get latest exchange rates
server.get('/exchange-rates/latest', async (request, reply) => {
    try {
        // Try to get from cache first
        const cacheKey = 'exchange_rates:latest';
        try {
            const cached = await redis.get(cacheKey);
            if (cached) {
                server.log.info('Exchange rates cache hit');
                return JSON.parse(cached);
            }
        } catch (cacheErr) {
            server.log.warn({ err: cacheErr }, 'Redis GET failed for exchange rates cache');
        }

        // Get latest rates from database
        const result = await queryStatic(`
            SELECT base_currency, rates, fetched_at 
            FROM exchange_rate_snapshots 
            WHERE status = 'active' 
            ORDER BY fetched_at DESC 
            LIMIT 1
        `, []);

        if (result.rows && result.rows.length > 0) {
            const latestRates = {
                base_currency: result.rows[0].base_currency,
                rates: result.rows[0].rates,
                fetched_at: result.rows[0].fetched_at
            };

            // Cache for 1 hour
            try {
                await redis.set(cacheKey, JSON.stringify(latestRates), 'EX', 3600);
                server.log.info('Exchange rates cached for 1 hour');
            } catch (cacheErr) {
                server.log.warn({ err: cacheErr }, 'Redis SET failed for exchange rates cache');
            }

            return latestRates;
        } else {
            // No exchange rates in database - return error
            server.log.warn('No exchange rates found in database');
            return reply.code(503).send({ error: 'Exchange rates not available' });
        }
    } catch (err) {
        server.log.error({ err }, 'GET /exchange-rates/latest failed');
        return reply.code(500).send({ error: 'Failed to fetch exchange rates' });
    }
});

// Save exchange rates to database
server.post('/exchange-rates/save', async (request, reply) => {
    try {
        const { source, base_currency, rates } = request.body as any;

        if (!source || !base_currency || !rates || typeof rates !== 'object') {
            return reply.code(400).send({ error: 'Missing required fields: source, base_currency, rates' });
        }

        // Insert new exchange rate snapshot
        const result = await queryStatic(`
            INSERT INTO exchange_rate_snapshots (source, base_currency, rates, fetched_at, status)
            VALUES ($1, $2, $3, $4, 'active')
            RETURNING id, source, base_currency, rates, fetched_at
        `, [source, base_currency, JSON.stringify(rates), new Date().toISOString()]);

        // Invalidate cache
        try {
            await redis.del('exchange_rates:latest');
            server.log.info('Exchange rates cache invalidated');
        } catch (cacheErr) {
            server.log.warn({ err: cacheErr }, 'Redis DEL failed for exchange rates cache invalidation');
        }

        server.log.info(`Saved exchange rates from ${source} for ${base_currency}`);
        return { success: true, snapshot: result.rows[0] };
    } catch (err) {
        server.log.error({ err }, 'POST /exchange-rates/save failed');
        return reply.code(500).send({ error: 'Failed to save exchange rates' });
    }
});

// Get currency information
server.get('/currencies', async (request, reply) => {
    try {
        const result = await queryStatic('SELECT * FROM currencies WHERE is_active = true ORDER BY code ASC', []);
        return result.rows;
    } catch (err) {
        server.log.error({ err }, 'GET /currencies failed');
        return reply.code(500).send({ error: 'Failed to fetch currencies' });
    }
});

server.get('/nationalities', async (request, reply) => {
    const { q, query } = request.query as { q?: string; query?: string };
    const searchTerm = q || query;

    // Use static data first
    const results = searchNationalities(searchTerm);
    if (results.length > 0) {
        return results;
    }

    // Fallback to DB if available
    try {
        const result = await queryStatic('SELECT * FROM nationalities ORDER BY name ASC', []);
        return result.rows;
    } catch {
        return NATIONALITIES;
    }
});

server.get('/countries', async (request, reply) => {
    const { q, query } = request.query as { q?: string; query?: string };
    const searchTerm = q || query;

    // Use static data first
    const results = searchCountries(searchTerm);
    if (results.length > 0) {
        return results;
    }

    // Fallback to DB if available
    try {
        const result = await queryStatic('SELECT * FROM countries ORDER BY name ASC', []);
        return result.rows;
    } catch {
        return COUNTRIES;
    }
});

// Note: /loyalty-programs endpoint is defined earlier using static data

server.get('/static/facilities', async (request, reply) => {
    const result = await queryStatic('SELECT * FROM amenities ORDER BY name ASC', []);
    return result.rows;
});

server.get('/hotelFacilities', async (request, reply) => {
    const result = await queryStatic('SELECT * FROM amenities ORDER BY name ASC', []);
    return result.rows;
});

server.get('/static/types', async (request, reply) => {
    const result = await queryStatic('SELECT * FROM hotel_types ORDER BY name ASC', []);
    return result.rows;
});

server.get('/hotelTypes', async (request, reply) => {
    const result = await queryStatic('SELECT * FROM hotel_types ORDER BY name ASC', []);
    return result.rows;
});

server.get('/static/chains', async (request, reply) => {
    const result = await queryStatic('SELECT * FROM hotel_chains ORDER BY name ASC', []);
    return result.rows;
});

server.get('/hotelChains', async (request, reply) => {
    const result = await queryStatic('SELECT * FROM hotel_chains ORDER BY name ASC', []);
    return result.rows;
});

server.get('/cities', async (request, reply) => {
    const { q, query, country } = request.query as { q?: string; query?: string; country?: string };
    const searchTerm = q || query;

    // If country filter is provided, return cities for that country
    if (country) {
        return getCitiesByCountry(country);
    }

    // Otherwise search by name
    const results = searchCities(searchTerm);
    return results;
});

// Unified Rich Search Suggestions (Cities + Airports + Hotels)
server.get('/static/suggestions', async (request, reply) => {
    const { q, type } = request.query as { q?: string, type?: 'flight' | 'hotel' };
    if (!q || q.length < 2) return [];

    const cacheKey = `suggestions:${type || 'all'}:${q.toLowerCase().trim()}`;

    try {
        // 1. Try Redis cache first
        try {
            const cached = await redis.get(cacheKey);
            if (cached) {
                server.log.info({ cacheKey }, 'Suggestions cache hit');
                return JSON.parse(cached);
            }
        } catch (cacheErr) {
            server.log.warn({ err: cacheErr }, 'Redis cache lookup failed for suggestions');
        }

        const unifiedResults: any[] = [];
        const searchTerm = `%${q}%`;

        // Define queries in parallel
        const citiesQuery = `
            SELECT id, name, country, country_code, is_popular 
            FROM cities 
            WHERE (name ILIKE $1 OR country ILIKE $1) 
              AND country_code IS NOT NULL 
              AND name IS NOT NULL
            ORDER BY 
              (CASE WHEN name ILIKE $2 THEN 1 ELSE 2 END),
              is_popular DESC, 
              name ASC
            LIMIT 10;
        `;

        const airportsQuery = `
            SELECT iata_code, name, city, country, country_code
            FROM airports 
            WHERE (iata_code ILIKE $1 OR name ILIKE $1 OR city ILIKE $1) 
              AND is_active = true 
            ORDER BY 
              (CASE WHEN iata_code ILIKE $2 THEN 0 
                    WHEN name ILIKE $2 THEN 1 
                    ELSE 2 END),
              iata_code ASC
            LIMIT 10;
        `;

        const hotelsQuery = `
            SELECT id, name, address as location, city, country 
            FROM canonical_hotels 
            WHERE (name ILIKE $1) 
              AND is_active = true 
            LIMIT 5;
        `;

        // Execute all queries in parallel
        const queries = [
            queryStatic(citiesQuery, [searchTerm, `${q}%`]).catch(err => {
                server.log.error({ err }, 'Cities suggestion query failed');
                return { rows: [] };
            }),
            queryStatic(airportsQuery, [searchTerm, `${q}%`]).catch(err => {
                server.log.error({ err }, 'Airports suggestion query failed');
                return { rows: [] };
            })
        ];

        if (type === 'hotel') {
            queries.push(
                queryStatic(hotelsQuery, [searchTerm]).catch(err => {
                    server.log.error({ err }, 'Hotels suggestion query failed');
                    return { rows: [] };
                })
            );
        }

        const [cities, airports, hotels] = await Promise.all(queries);

        // Process results
        if (cities?.rows) {
            cities.rows.forEach((c: any) => {
                unifiedResults.push({
                    type: 'CITY',
                    icon: 'map-pin',
                    title: `${c.name}, ${c.country}`,
                    subtitle: type === 'flight' ? 'All airports' : 'City',
                    code: c.id,
                    id: `city_${c.id}`,
                    city: c.name,
                    country: c.country,
                    countryCode: c.country_code,
                    isPopular: c.is_popular
                });
            });
        }

        if (airports?.rows) {
            airports.rows.forEach((a: any) => {
                unifiedResults.push({
                    type: 'AIRPORT',
                    icon: 'plane',
                    title: `${a.city}, ${a.country}`,
                    subtitle: `${a.name} (${a.iata_code})`,
                    code: a.iata_code,
                    id: `air_${a.iata_code}`,
                    city: a.city,
                    country: a.country,
                    countryCode: a.country_code
                });
            });
        }

        if (hotels?.rows) {
            hotels.rows.forEach((h: any) => {
                unifiedResults.push({
                    type: 'HOTEL',
                    icon: 'bed',
                    title: h.name,
                    subtitle: `${h.location || h.city}, ${h.country}`,
                    code: h.id,
                    id: `hotel_${h.id}`,
                    city: h.city,
                    country: h.country
                });
            });
        }

        // Cache the results for 1 hour (best effort)
        if (unifiedResults.length > 0) {
            try {
                await redis.set(cacheKey, JSON.stringify(unifiedResults), 'EX', 3600);
            } catch (cacheErr) {
                server.log.warn({ err: cacheErr }, 'Failed to cache suggestions');
            }
        }

        return unifiedResults;
    } catch (error) {
        server.log.error({ error }, 'Suggestions unified search failed');
        return [];
    }
});

// --- Real-time API Wrappers (Duffel & LiteAPI) ---

server.post('/search/flights', async (request, reply) => {
    // Wrapper for Duffel Flight Search
    const adapter = Registry.getAdapter('duffel');
    if (!adapter) throw new Error('Duffel adapter not configured');

    // Pass entire body to adapter (slices, passengers, cabinClass)
    return await adapter.request(request.body);
});

server.post('/search/hotels', async (request, reply) => {
    // Wrapper for LiteAPI Hotel Availability
    const adapter = Registry.getAdapter('liteapi');
    if (!adapter) throw new Error('LiteAPI adapter not configured');

    // Pass body: checkin, checkout, adults, children, location/city
    return await adapter.request(request.body);
});

// --- Booking wrappers (proxy to booking-service) ---
const BOOKING_SERVICE_URL = process.env.BOOKING_SERVICE_URL || 'http://localhost:3001';

server.post('/bookings/flight/hold', async (request, reply) => {
    const url = `${BOOKING_SERVICE_URL.replace(/\/$/, '')}/bookings/flight/hold`;
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(request.body) });
    if (!res.ok) return reply.code(res.status).send(await res.text());
    return res.json();
});

server.post('/bookings/flight/confirm', async (request, reply) => {
    const url = `${BOOKING_SERVICE_URL.replace(/\/$/, '')}/bookings/flight/confirm`;
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(request.body) });
    if (!res.ok) return reply.code(res.status).send(await res.text());
    return res.json();
});

server.post('/bookings/hotel/hold', async (request, reply) => {
    const url = `${BOOKING_SERVICE_URL.replace(/\/$/, '')}/bookings/hotel/hold`;
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(request.body) });
    if (!res.ok) return reply.code(res.status).send(await res.text());
    return res.json();
});

server.post('/bookings/hotel/confirm', async (request, reply) => {
    const url = `${BOOKING_SERVICE_URL.replace(/\/$/, '')}/bookings/hotel/confirm`;
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(request.body) });
    if (!res.ok) return reply.code(res.status).send(await res.text());
    return res.json();
});

// Generic bookings proxy (list, create, detail)
server.get('/bookings', async (request, reply) => {
    const qs = new URLSearchParams(request.query as any).toString();
    const url = `${BOOKING_SERVICE_URL.replace(/\/$/, '')}/bookings${qs ? `?${qs}` : ''}`;
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) return reply.code(res.status).send(await res.text());
    return res.json();
});

server.get('/bookings/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const url = `${BOOKING_SERVICE_URL.replace(/\/$/, '')}/bookings/${id}`;
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) return reply.code(res.status).send(await res.text());
    return res.json();
});

server.post('/bookings', async (request, reply) => {
    const url = `${BOOKING_SERVICE_URL.replace(/\/$/, '')}/bookings`;
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(request.body) });
    if (!res.ok) return reply.code(res.status).send(await res.text());
    return res.json();
});

// --- Real-time LiteAPI & Loyalty Routes ---

server.post('/hotels/rates', async (request, reply) => {
    const url = `${INVENTORY_SERVICE_URL.replace(/\/$/, '')}/hotels/rates`;
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request.body)
    });
    if (!res.ok) return reply.code(res.status).send(await res.text());
    return res.json();
});

server.post('/rates/prebook', async (request, reply) => {
    const url = `${BOOKING_SERVICE_URL.replace(/\/$/, '')}/rates/prebook`;
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request.body)
    });
    if (!res.ok) return reply.code(res.status).send(await res.text());
    return res.json();
});

server.post('/rates/book', async (request, reply) => {
    const url = `${BOOKING_SERVICE_URL.replace(/\/$/, '')}/rates/book`;
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request.body)
    });
    if (!res.ok) return reply.code(res.status).send(await res.text());
    return res.json();
});

server.get('/loyalty/*', async (request, reply) => {
    const url = `${INVENTORY_SERVICE_URL.replace(/\/$/, '')}${request.url}`;
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) return reply.code(res.status).send(await res.text());
    return res.json();
});

server.post('/loyalty/*', async (request, reply) => {
    const url = `${INVENTORY_SERVICE_URL.replace(/\/$/, '')}${request.url}`;
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request.body)
    });
    if (!res.ok) return reply.code(res.status).send(await res.text());
    return res.json();
});

server.put('/loyalty/*', async (request, reply) => {
    const url = `${INVENTORY_SERVICE_URL.replace(/\/$/, '')}${request.url}`;
    const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request.body)
    });
    if (!res.ok) return reply.code(res.status).send(await res.text());
    return res.json();
});

// --- Inventory wrappers (proxy to inventory-service) ---
const INVENTORY_SERVICE_URL = process.env.INVENTORY_SERVICE_URL || 'http://localhost:3002';
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3003';

server.get('/inventory/*', async (request, reply) => {
    const url = `${INVENTORY_SERVICE_URL.replace(/\/$/, '')}${request.url.replace('/inventory', '')}`;
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) return reply.code(res.status).send(await res.text());
    return res.json();
});

server.post('/inventory/*', async (request, reply) => {
    const url = `${INVENTORY_SERVICE_URL.replace(/\/$/, '')}${request.url.replace('/inventory', '')}`;
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request.body)
    });
    if (!res.ok) return reply.code(res.status).send(await res.text());
    return res.json();
});

// --- Booking Wrappers (Flight Order Management) ---

/**
 * Create a flight order using the selected provider's adapter
 * POST /bookings/flight/order
 * Body: {
 *   provider: 'duffel' | 'liteapi' | etc,
 *   selectedOffers: string[],
 *   passengers: Passenger[],
 *   orderType: 'instant' | 'hold',
 *   paymentMethod: { type: 'balance' | 'card', id?: string },
 *   env: 'test' | 'prod'
 * }
 */
server.post('/bookings/flight/order', async (request, reply) => {
    try {
        const { provider, env, ...orderData } = request.body as any;

        if (!provider) {
            return reply.code(400).send({ error: 'Provider is required' });
        }

        const adapter = Registry.getAdapter(provider.toLowerCase());
        if (!adapter) {
            return reply.code(400).send({ error: `Unsupported provider: ${provider}` });
        }

        if (typeof adapter.createOrder !== 'function') {
            return reply.code(501).send({ error: `Provider ${provider} does not support order creation` });
        }

        const order = await adapter.createOrder({ ...orderData, env });
        return { success: true, order, provider };
    } catch (error: any) {
        server.log.error({ err: error }, 'Order creation error:');
        return reply.code(400).send({
            error: error.message,
            details: error.response?.data
        });
    }
});

/**
 * Get order details
 * GET /bookings/flight/order/:orderId
 * Query params: provider, env
 */
server.get('/bookings/flight/order/:orderId', async (request, reply) => {
    try {
        const { orderId } = request.params as { orderId: string };
        const { provider, env } = request.query as { provider?: string; env?: string };

        if (!provider) {
            return reply.code(400).send({ error: 'Provider is required' });
        }

        const adapter = Registry.getAdapter(provider.toLowerCase());
        if (!adapter) {
            return reply.code(400).send({ error: `Unsupported provider: ${provider}` });
        }

        if (typeof adapter.getOrder !== 'function') {
            return reply.code(501).send({ error: `Provider ${provider} does not support order retrieval` });
        }

        const order = await adapter.getOrder(orderId, env || 'test');
        return { success: true, order, provider };
    } catch (error: any) {
        server.log.error({ err: error }, 'Order retrieval error:');
        return reply.code(400).send({
            error: error.message,
            details: error.response?.data
        });
    }
});

/**
 * Confirm a held order
 * POST /bookings/flight/order/:orderId/confirm
 * Body: { provider, env }
 */
server.post('/bookings/flight/order/:orderId/confirm', async (request, reply) => {
    try {
        const { orderId } = request.params as { orderId: string };
        const { provider, env } = request.body as any;

        if (!provider) {
            return reply.code(400).send({ error: 'Provider is required' });
        }

        const adapter = Registry.getAdapter(provider.toLowerCase());
        if (!adapter) {
            return reply.code(400).send({ error: `Unsupported provider: ${provider}` });
        }

        if (typeof adapter.confirmOrder !== 'function') {
            return reply.code(501).send({ error: `Provider ${provider} does not support order confirmation` });
        }

        const order = await adapter.confirmOrder(orderId, env || 'test');
        return { success: true, order, provider };
    } catch (error: any) {
        server.log.error({ err: error }, 'Order confirmation error:');
        return reply.code(400).send({
            error: error.message,
            details: error.response?.data
        });
    }
});

/**
 * Create a payment intent for an order
 * POST /bookings/flight/payment-intent
 * Body: {
 *   provider: string,
 *   orderId: string,
 *   amount: string,
 *   currency: string,
 *   returnUrl: string,
 *   env: 'test' | 'prod'
 * }
 */
server.post('/bookings/flight/payment-intent', async (request, reply) => {
    try {
        const { provider, env, ...paymentData } = request.body as any;

        if (!provider) {
            return reply.code(400).send({ error: 'Provider is required' });
        }

        const adapter = Registry.getAdapter(provider.toLowerCase());
        if (!adapter) {
            return reply.code(400).send({ error: `Unsupported provider: ${provider}` });
        }

        if (typeof adapter.createPaymentIntent !== 'function') {
            return reply.code(501).send({ error: `Provider ${provider} does not support payment intents` });
        }

        const paymentIntent = await adapter.createPaymentIntent({ ...paymentData, env });
        return { success: true, paymentIntent, provider };
    } catch (error: any) {
        server.log.error({ err: error }, 'Payment intent error:');
        return reply.code(400).send({
            error: error.message,
            details: error.response?.data
        });
    }
});

/**
 * Update an order (e.g., add services)
 * PATCH /bookings/flight/order/:orderId
 * Body: {
 *   provider: string,
 *   data: any (update payload),
 *   env: 'test' | 'prod'
 * }
 */
server.patch('/bookings/flight/order/:orderId', async (request, reply) => {
    try {
        const { orderId } = request.params as { orderId: string };
        const { provider, data, env } = request.body as any;

        if (!provider) {
            return reply.code(400).send({ error: 'Provider is required' });
        }

        const adapter = Registry.getAdapter(provider.toLowerCase());
        if (!adapter) {
            return reply.code(400).send({ error: `Unsupported provider: ${provider}` });
        }

        if (typeof adapter.updateOrder !== 'function') {
            return reply.code(501).send({ error: `Provider ${provider} does not support order updates` });
        }

        const order = await adapter.updateOrder(orderId, data, env || 'test');
        return { success: true, order, provider };
    } catch (error: any) {
        server.log.error({ err: error }, 'Order update error:');
        return reply.code(400).send({
            error: error.message,
            details: error.response?.data
        });
    }
});

/**
 * Get available payment methods
 * GET /bookings/flight/payment-methods
 * Query: {
 *   provider: string,
 *   env: 'test' | 'prod'
 * }
 */
server.get('/bookings/flight/payment-methods', async (request, reply) => {
    try {
        const { provider, env } = request.query as any;

        if (!provider) {
            return reply.code(400).send({ error: 'Provider is required' });
        }

        const adapter = Registry.getAdapter(provider.toLowerCase());
        if (!adapter) {
            return reply.code(400).send({ error: `Unsupported provider: ${provider}` });
        }

        if (typeof adapter.getPaymentMethods !== 'function') {
            return reply.code(501).send({ error: `Provider ${provider} does not support payment methods` });
        }

        const paymentMethods = await adapter.getPaymentMethods(env || 'test');
        return { success: true, paymentMethods, provider };
    } catch (error: any) {
        server.log.error({ err: error }, 'Payment methods error:');
        return reply.code(400).send({
            error: error.message,
            details: error.response?.data
        });
    }
});

/**
 * Get available payment methods for a specific order
 * GET /bookings/flight/order/:orderId/payment-methods
 * Query: {
 *   provider: string,
 *   env: 'test' | 'prod'
 * }
 */
server.get('/bookings/flight/order/:orderId/payment-methods', async (request, reply) => {
    try {
        const { orderId } = request.params as { orderId: string };
        const { provider, env } = request.query as any;

        if (!provider) {
            return reply.code(400).send({ error: 'Provider is required' });
        }

        const adapter = Registry.getAdapter(provider.toLowerCase());
        if (!adapter) {
            return reply.code(400).send({ error: `Unsupported provider: ${provider}` });
        }

        if (typeof adapter.getOrderPaymentMethods !== 'function') {
            return reply.code(501).send({ error: `Provider ${provider} does not support order payment methods` });
        }

        const paymentMethods = await adapter.getOrderPaymentMethods(orderId, env || 'test');
        return { success: true, paymentMethods, provider };
    } catch (error: any) {
        server.log.error({ err: error }, 'Order payment methods error:');
        return reply.code(400).send({
            error: error.message,
            details: error.response?.data
        });
    }
});

/**
 * Confirm a payment to finalize the booking
 * POST /bookings/flight/payment-confirm
 * Body: {
 *   provider: string,
 *   paymentIntentId: string,
 *   env: 'test' | 'prod',
 *   ...otherPaymentData
 * }
 */
server.post('/bookings/flight/payment-confirm', async (request, reply) => {
    try {
        const { provider, env, ...paymentData } = request.body as any;

        if (!provider) {
            return reply.code(400).send({ error: 'Provider is required' });
        }

        const adapter = Registry.getAdapter(provider.toLowerCase());
        if (!adapter) {
            return reply.code(400).send({ error: `Unsupported provider: ${provider}` });
        }

        if (typeof adapter.confirmPayment !== 'function') {
            return reply.code(501).send({ error: `Provider ${provider} does not support payment confirmation` });
        }

        const paymentResult = await adapter.confirmPayment(paymentData, env || 'test');
        return { success: true, paymentResult, provider };
    } catch (error: any) {
        server.log.error({ err: error }, 'Payment confirmation error:');
        return reply.code(400).send({
            error: error.message,
            details: error.response?.data
        });
    }
});

/**
 * Get payment details
 * GET /bookings/flight/payment/:paymentId
 * Query: {
 *   provider: string,
 *   env: 'test' | 'prod'
 * }
 */
server.get('/bookings/flight/payment/:paymentId', async (request, reply) => {
    try {
        const { paymentId } = request.params as { paymentId: string };
        const { provider, env } = request.query as any;

        if (!provider) {
            return reply.code(400).send({ error: 'Provider is required' });
        }

        const adapter = Registry.getAdapter(provider.toLowerCase());
        if (!adapter) {
            return reply.code(400).send({ error: `Unsupported provider: ${provider}` });
        }

        if (typeof adapter.getPayment !== 'function') {
            return reply.code(501).send({ error: `Provider ${provider} does not support payment retrieval` });
        }

        const payment = await adapter.getPayment(paymentId, env || 'test');
        return { success: true, payment, provider };
    } catch (error: any) {
        server.log.error({ err: error }, 'Get payment error:');
        return reply.code(400).send({
            error: error.message,
            details: error.response?.data
        });
    }
});

// ============================================================================
// SEAT MAPS ENDPOINTS
// ============================================================================

/**
 * GET /bookings/flight/seat-maps
 * Get seat maps for an offer (all segments)
 */
server.get('/bookings/flight/seat-maps', async (request, reply) => {
    try {
        const { offerId, provider, env } = request.query as any;

        if (!offerId) {
            return reply.code(400).send({ error: 'Offer ID is required' });
        }

        if (!provider) {
            return reply.code(400).send({ error: 'Provider is required' });
        }

        const adapter = Registry.getAdapter(provider.toLowerCase());
        if (!adapter) {
            return reply.code(400).send({ error: `Unsupported provider: ${provider}` });
        }

        if (typeof adapter.getSeatMaps !== 'function') {
            return reply.code(501).send({ error: `Provider ${provider} does not support seat maps` });
        }

        const seatMaps = await adapter.getSeatMaps(offerId, env || 'test');
        return { success: true, data: seatMaps.data || [], provider };
    } catch (error: any) {
        server.log.error({ err: error }, 'Get seat maps error:');
        return reply.code(400).send({
            error: error.message,
            details: error.response?.data
        });
    }
});

/**
 * GET /bookings/flight/seat-maps/:segmentId
 * Get seat map for a specific segment
 */
server.get('/bookings/flight/seat-maps/:segmentId', async (request, reply) => {
    try {
        const { segmentId } = request.params as { segmentId: string };
        const { offerId, provider, env } = request.query as any;

        if (!offerId) {
            return reply.code(400).send({ error: 'Offer ID is required' });
        }

        if (!provider) {
            return reply.code(400).send({ error: 'Provider is required' });
        }

        const adapter = Registry.getAdapter(provider.toLowerCase());
        if (!adapter) {
            return reply.code(400).send({ error: `Unsupported provider: ${provider}` });
        }

        if (typeof adapter.getSeatMapForSegment !== 'function') {
            return reply.code(501).send({ error: `Provider ${provider} does not support seat map retrieval per segment` });
        }

        const seatMap = await adapter.getSeatMapForSegment(offerId, segmentId, env || 'test');
        if (!seatMap) {
            return reply.code(404).send({ error: `No seat map found for segment ${segmentId}` });
        }
        return { success: true, data: seatMap.data || [], provider };
    } catch (error: any) {
        server.log.error({ err: error }, 'Get seat map error:');
        return reply.code(400).send({
            error: error.message,
            details: error.response?.data
        });
    }
});

/**
 * POST /bookings/flight/select-seats
 * Select seats for passengers before creating order
 */
server.post('/bookings/flight/select-seats', async (request, reply) => {
    try {
        const { offerId, selectedSeats, provider, environment } = request.body as any;

        if (!offerId) {
            return reply.code(400).send({ error: 'Offer ID is required' });
        }

        if (!selectedSeats || !Array.isArray(selectedSeats)) {
            return reply.code(400).send({ error: 'Selected seats array is required' });
        }

        if (!provider) {
            return reply.code(400).send({ error: 'Provider is required' });
        }

        const adapter = Registry.getAdapter(provider.toLowerCase());
        if (!adapter) {
            return reply.code(400).send({ error: `Unsupported provider: ${provider}` });
        }

        if (typeof adapter.selectSeats !== 'function') {
            return reply.code(501).send({ error: `Provider ${provider} does not support seat selection` });
        }

        const result = await adapter.selectSeats(offerId, selectedSeats, environment || 'test');
        return { success: true, data: result.data || [], provider };
    } catch (error: any) {
        server.log.error({ err: error }, 'Select seats error:');
        return reply.code(400).send({
            error: error.message,
            details: error.response?.data
        });
    }
});

// ============================================================================
// BOOKING SERVICE SEAT MAPS PROXY ROUTES
// Proxy to booking-service's internal seat maps implementation
// ============================================================================

/**
 * GET /bookings/seat-maps-service
 * Internal proxy: Get seat maps from booking-service
 * Query: offerId, orderId
 */
server.get('/bookings/seat-maps-service', async (request, reply) => {
    try {
        const qs = new URLSearchParams(request.query as any).toString();
        const url = `${BOOKING_SERVICE_URL.replace(/\/$/, '')}/bookings/flight/seat-maps${qs ? `?${qs}` : ''}`;
        const res = await fetch(url, { method: 'GET' });
        if (!res.ok) return reply.code(res.status).send(await res.text());
        return res.json();
    } catch (error: any) {
        server.log.error({ err: error }, 'Seat maps service proxy error:');
        return reply.code(500).send({
            error: 'Failed to fetch seat maps from service',
            message: error.message
        });
    }
});

/**
 * POST /bookings/seat-maps-service/select
 * Internal proxy: Select seats via booking-service
 * Body: offerId, orderId, seats
 */
server.post('/bookings/seat-maps-service/select', async (request, reply) => {
    try {
        const url = `${BOOKING_SERVICE_URL.replace(/\/$/, '')}/bookings/flight/seat-maps/select`;
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(request.body)
        });
        if (!res.ok) return reply.code(res.status).send(await res.text());
        return res.json();
    } catch (error: any) {
        server.log.error({ err: error }, 'Seat selection service proxy error:');
        return reply.code(500).send({
            error: 'Failed to select seats via service',
            message: error.message
        });
    }
});

// ============================================================================
// ANCILLARY SERVICES ENDPOINTS
// Manage seat selections, baggage, insurance, lounge access, and other ancillaries
// ============================================================================

/**
 * GET /bookings/flight/ancillary-offers
 * Get available ancillary offers for a specific order
 * Query: { orderId, type?: 'seat' | 'baggage' | 'insurance' | 'lounge', provider, env }
 */
server.get('/bookings/flight/ancillary-offers', async (request, reply) => {
    try {
        const { orderId, type, provider, env } = request.query as any;

        if (!orderId) {
            return reply.code(400).send({ error: 'Order ID is required' });
        }

        if (!provider) {
            return reply.code(400).send({ error: 'Provider is required' });
        }

        const adapter = Registry.getAdapter(provider.toLowerCase());
        if (!adapter) {
            return reply.code(400).send({ error: `Unsupported provider: ${provider}` });
        }

        if (typeof adapter.getAncillaryOffers !== 'function') {
            return reply.code(501).send({ error: `Provider ${provider} does not support ancillary offers retrieval` });
        }

        const offers = await adapter.getAncillaryOffers({
            orderId,
            type,
            env: env || 'test'
        });

        return {
            success: true,
            data: offers.data || offers,
            provider
        };
    } catch (error: any) {
        server.log.error({ err: error }, 'Get ancillary offers error');
        return reply.code(400).send({
            error: error.message,
            details: error.response?.data
        });
    }
});

/**
 * POST /bookings/flight/ancillary-select
 * Select an ancillary service (seat, baggage, insurance, lounge, etc.)
 * Body: { orderId, serviceId, quantity?, passengerId?, provider, env }
 */
server.post('/bookings/flight/ancillary-select', async (request, reply) => {
    try {
        const { orderId, serviceId, quantity, passengerId, provider, env } = request.body as any;

        if (!orderId) {
            return reply.code(400).send({ error: 'Order ID is required' });
        }

        if (!serviceId) {
            return reply.code(400).send({ error: 'Service ID is required' });
        }

        if (!provider) {
            return reply.code(400).send({ error: 'Provider is required' });
        }

        const adapter = Registry.getAdapter(provider.toLowerCase());
        if (!adapter) {
            return reply.code(400).send({ error: `Unsupported provider: ${provider}` });
        }

        if (typeof adapter.selectAncillaryService !== 'function') {
            return reply.code(501).send({ error: `Provider ${provider} does not support ancillary service selection` });
        }

        const result = await adapter.selectAncillaryService({
            orderId,
            serviceId,
            quantity,
            passengerId,
            env: env || 'test'
        });

        return {
            success: true,
            data: result.data || result,
            provider
        };
    } catch (error: any) {
        server.log.error({ err: error }, 'Select ancillary service error');
        return reply.code(400).send({
            error: error.message,
            details: error.response?.data
        });
    }
});

/**
 * DELETE /bookings/flight/ancillary/:serviceId
 * Remove an ancillary service from an order
 * Query: { orderId, provider, env }
 */
server.delete('/bookings/flight/ancillary/:serviceId', async (request, reply) => {
    try {
        const { serviceId } = request.params as { serviceId: string };
        const { orderId, provider, env } = request.query as any;

        if (!orderId) {
            return reply.code(400).send({ error: 'Order ID is required' });
        }

        if (!provider) {
            return reply.code(400).send({ error: 'Provider is required' });
        }

        const adapter = Registry.getAdapter(provider.toLowerCase());
        if (!adapter) {
            return reply.code(400).send({ error: `Unsupported provider: ${provider}` });
        }

        if (typeof adapter.removeAncillaryService !== 'function') {
            return reply.code(501).send({ error: `Provider ${provider} does not support ancillary service removal` });
        }

        const result = await adapter.removeAncillaryService(
            orderId,
            serviceId,
            env || 'test'
        );

        return {
            success: true,
            data: result.data || result,
            provider
        };
    } catch (error: any) {
        server.log.error({ err: error }, 'Remove ancillary service error');
        return reply.code(400).send({
            error: error.message,
            details: error.response?.data
        });
    }
});

// ============================================================================
// BAGGAGE MANAGEMENT ENDPOINTS
// Manage baggage allowances and add-ons
// ============================================================================

/**
 * GET /bookings/flight/baggage/:orderId
 * Get baggage details for a booking
 * Query: { provider, env }
 */
server.get('/bookings/flight/baggage/:orderId', async (request, reply) => {
    try {
        const { orderId } = request.params as { orderId: string };
        const { provider, env } = request.query as any;

        if (!provider) {
            return reply.code(400).send({ error: 'Provider is required' });
        }

        const adapter = Registry.getAdapter(provider.toLowerCase());
        if (!adapter) {
            return reply.code(400).send({ error: `Unsupported provider: ${provider}` });
        }

        // Retrieve baggage information via ancillary offers with type='baggage'
        if (typeof adapter.getAncillaryOffers !== 'function') {
            return reply.code(501).send({
                error: `Provider ${provider} does not support baggage information retrieval`
            });
        }

        const baggageOffers = await adapter.getAncillaryOffers({
            orderId,
            type: 'baggage',
            env: env || 'test'
        });

        return {
            success: true,
            data: baggageOffers.data || baggageOffers,
            provider
        };
    } catch (error: any) {
        server.log.error({ err: error }, 'Get baggage error:');
        return reply.code(400).send({
            error: error.message,
            details: error.response?.data
        });
    }
});

/**
 * POST /bookings/flight/baggage/:orderId/add
 * Add baggage to a booking
 * Body: { passengerId?, quantity, baggageType, provider, env }
 */
server.post('/bookings/flight/baggage/:orderId/add', async (request, reply) => {
    try {
        const { orderId } = request.params as { orderId: string };
        const { passengerId, quantity, baggageType, provider, env } = request.body as any;

        if (!quantity) {
            return reply.code(400).send({ error: 'Quantity is required' });
        }

        if (!provider) {
            return reply.code(400).send({ error: 'Provider is required' });
        }

        const adapter = Registry.getAdapter(provider.toLowerCase());
        if (!adapter) {
            return reply.code(400).send({ error: `Unsupported provider: ${provider}` });
        }

        // This operation uses selectAncillaryService with baggage service ID
        if (typeof adapter.selectAncillaryService !== 'function') {
            return reply.code(501).send({
                error: `Provider ${provider} does not support baggage addition`
            });
        }

        const result = await adapter.selectAncillaryService({
            orderId,
            serviceId: `baggage_${baggageType || 'standard'}_${quantity}`,
            quantity,
            passengerId,
            env: env || 'test'
        });

        return {
            success: true,
            data: result.data || result,
            provider
        };
    } catch (error: any) {
        server.log.error({ err: error }, 'Add baggage error:');
        return reply.code(400).send({
            error: error.message,
            details: error.response?.data
        });
    }
});

/**
 * DELETE /bookings/flight/baggage/:orderId/:baggageId
 * Remove baggage from a booking
 * Query: { provider, env }
 */
server.delete('/bookings/flight/baggage/:orderId/:baggageId', async (request, reply) => {
    try {
        const { orderId, baggageId } = request.params as { orderId: string; baggageId: string };
        const { provider, env } = request.query as any;

        if (!provider) {
            return reply.code(400).send({ error: 'Provider is required' });
        }

        const adapter = Registry.getAdapter(provider.toLowerCase());
        if (!adapter) {
            return reply.code(400).send({ error: `Unsupported provider: ${provider}` });
        }

        if (typeof adapter.removeAncillaryService !== 'function') {
            return reply.code(501).send({
                error: `Provider ${provider} does not support baggage removal`
            });
        }

        const result = await adapter.removeAncillaryService(
            orderId,
            baggageId,
            env || 'test'
        );

        return {
            success: true,
            data: result.data || result,
            provider
        };
    } catch (error: any) {
        server.log.error({ err: error }, 'Remove baggage error:');
        return reply.code(400).send({
            error: error.message,
            details: error.response?.data
        });
    }
});

/**
 * GET /bookings/flight/baggage-summary/:orderId
 * Get summary of baggage allowances and current usage
 * Query: { provider, env }
 */
server.get('/bookings/flight/baggage-summary/:orderId', async (request, reply) => {
    try {
        const { orderId } = request.params as { orderId: string };
        const { provider, env } = request.query as any;

        if (!provider) {
            return reply.code(400).send({ error: 'Provider is required' });
        }

        const adapter = Registry.getAdapter(provider.toLowerCase());
        if (!adapter) {
            return reply.code(400).send({ error: `Unsupported provider: ${provider}` });
        }

        // Retrieve baggage summary information
        if (typeof adapter.getAncillaryOffers !== 'function') {
            return reply.code(501).send({
                error: `Provider ${provider} does not support baggage summary`
            });
        }

        const baggageSummary = await adapter.getAncillaryOffers({
            orderId,
            type: 'baggage',
            env: env || 'test'
        });

        return {
            success: true,
            data: baggageSummary.data || baggageSummary,
            provider
        };
    } catch (error: any) {
        server.log.error({ err: error }, 'Get baggage summary error:');
        return reply.code(400).send({
            error: error.message,
            details: error.response?.data
        });
    }
});

// ============================================================================
// ANCILLARY SERVICES PROXY ROUTES (Booking Service)
// Internal proxies to the booking-service for ancillary operations
// ============================================================================

/**
 * GET /bookings/ancillary-offers-service
 * Internal proxy: Get ancillary offers from booking-service
 * Query: orderId
 */
server.get('/bookings/ancillary-offers-service', async (request, reply) => {
    try {
        const qs = new URLSearchParams(request.query as any).toString();
        const url = `${BOOKING_SERVICE_URL.replace(/\/$/, '')}/bookings/flight/ancillary-offers${qs ? `?${qs}` : ''}`;
        const res = await fetch(url, { method: 'GET' });
        if (!res.ok) return reply.code(res.status).send(await res.text());
        return res.json();
    } catch (error: any) {
        server.log.error({ err: error }, 'Ancillary offers service proxy error');
        return reply.code(500).send({
            error: 'Failed to fetch ancillary offers from service',
            message: error.message
        });
    }
});

/**
 * POST /bookings/ancillary-select-service
 * Internal proxy: Select ancillary service via booking-service
 * Body: orderId, serviceId, quantity, passengerId
 */
server.post('/bookings/ancillary-select-service', async (request, reply) => {
    try {
        const url = `${BOOKING_SERVICE_URL.replace(/\/$/, '')}/bookings/flight/ancillary-select`;
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(request.body)
        });
        if (!res.ok) return reply.code(res.status).send(await res.text());
        return res.json();
    } catch (error: any) {
        server.log.error({ err: error }, 'Ancillary select service proxy error');
        return reply.code(500).send({
            error: 'Failed to select ancillary via service',
            message: error.message
        });
    }
});

/**
 * DELETE /bookings/ancillary-remove-service
 * Internal proxy: Remove ancillary service via booking-service
 * Query: orderId, serviceId
 */
server.delete('/bookings/ancillary-remove-service', async (request, reply) => {
    try {
        const { orderId, serviceId } = request.query as any;
        if (!orderId || !serviceId) {
            return reply.code(400).send({ error: 'orderId and serviceId are required' });
        }
        const url = `${BOOKING_SERVICE_URL.replace(/\/$/, '')}/bookings/flight/ancillary-remove?orderId=${orderId}&serviceId=${serviceId}`;
        const res = await fetch(url, { method: 'DELETE' });
        if (!res.ok) return reply.code(res.status).send(await res.text());
        return res.json();
    } catch (error: any) {
        server.log.error({ err: error }, 'Ancillary remove service proxy error');
        return reply.code(500).send({
            error: 'Failed to remove ancillary via service',
            message: error.message
        });
    }
});

// ============================================================================
// ENHANCED USER PREFERENCES ENDPOINTS
// Store and retrieve user travel preferences
// ============================================================================

/**
 * GET /user/preferences/travel
 * Get travel-specific preferences
 * Returns: seatPreference, bagPref, insurance, lounge, etc.
 */
server.get('/user/preferences/travel', async (request, reply) => {
    try {
        const auth = (request.headers && (request.headers as any).authorization) || '';
        const headers: any = {};
        if (auth) headers['Authorization'] = auth as string;

        const url = `${USER_SERVICE_URL.replace(/\/$/, '')}/user/preferences/travel`;
        const res = await fetch(url, { method: 'GET', headers });
        if (!res.ok) {
            // Fallback to defaults
            return {
                seatPreference: 'aisle',
                bagAllowance: 'standard',
                insuranceEnabled: false,
                loungePreference: null,
                notifications: true
            };
        }
        return await res.json();
    } catch (err) {
        server.log.error({ err }, 'GET /user/preferences/travel error');
        return {
            seatPreference: 'aisle',
            bagAllowance: 'standard',
            insuranceEnabled: false,
            loungePreference: null,
            notifications: true
        };
    }
});

/**
 * POST /user/preferences/travel
 * Save travel preferences
 * Body: { seatPreference, bagAllowance, insuranceEnabled, loungePreference, notifications }
 */
server.post('/user/preferences/travel', async (request, reply) => {
    try {
        const auth = (request.headers && (request.headers as any).authorization) || '';
        const headers: any = { 'Content-Type': 'application/json' };
        if (auth) headers['Authorization'] = auth as string;

        const url = `${USER_SERVICE_URL.replace(/\/$/, '')}/user/preferences/travel`;
        const res = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(request.body)
        });
        if (!res.ok) return reply.code(res.status).send(await res.text());
        return res.json();
    } catch (err) {
        server.log.error({ err }, 'POST /user/preferences/travel error');
        return { success: false };
    }
});

/**
 * GET /user/preferences/ancillary-defaults
 * Get default ancillary preferences (baggage, insurance, lounge)
 */
server.get('/user/preferences/ancillary-defaults', async (request, reply) => {
    try {
        const auth = (request.headers && (request.headers as any).authorization) || '';
        const headers: any = {};
        if (auth) headers['Authorization'] = auth as string;

        const url = `${USER_SERVICE_URL.replace(/\/$/, '')}/user/preferences/ancillary-defaults`;
        const res = await fetch(url, { method: 'GET', headers });
        if (!res.ok) {
            // Fallback to defaults
            return {
                baggageType: 'standard',
                bagQuantity: 1,
                insuranceType: 'basic',
                loungeAccess: false
            };
        }
        return await res.json();
    } catch (err) {
        server.log.error({ err }, 'GET /user/preferences/ancillary-defaults error');
        return {
            baggageType: 'standard',
            bagQuantity: 1,
            insuranceType: 'basic',
            loungeAccess: false
        };
    }
});

/**
 * POST /user/preferences/ancillary-defaults
 * Save default ancillary preferences
 * Body: { baggageType, bagQuantity, insuranceType, loungeAccess }
 */
server.post('/user/preferences/ancillary-defaults', async (request, reply) => {
    try {
        const auth = (request.headers && (request.headers as any).authorization) || '';
        const headers: any = { 'Content-Type': 'application/json' };
        if (auth) headers['Authorization'] = auth as string;

        const url = `${USER_SERVICE_URL.replace(/\/$/, '')}/user/preferences/ancillary-defaults`;
        const res = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(request.body)
        });
        if (!res.ok) return reply.code(res.status).send(await res.text());
        return res.json();
    } catch (err) {
        server.log.error({ err }, 'POST /user/preferences/ancillary-defaults error');
        return { success: false };
    }
});

// --- AUTH ROUTES (Mock Implementation) ---
server.post('/auth/login', async (request, reply) => {
    const { email, password } = request.body as { email: string; password: string };

    if (!email || !password) {
        return reply.code(400).send({ error: 'Email and password are required' });
    }

    // Mock authentication - accept any email/password combination
    const mockUser = {
        id: 'user_' + Date.now(),
        email,
        name: email.split('@')[0],
        role: 'user'
    };

    const mockResponse = {
        data: {
            accessToken: 'mock_access_token_' + Date.now(),
            refreshToken: 'mock_refresh_token_' + Date.now(),
            user: mockUser
        }
    };

    return mockResponse;
});

server.post('/auth/register', async (request, reply) => {
    const url = `${USER_SERVICE_URL.replace(/\/$/, '')}/auth/register`;
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request.body)
    });
    if (!res.ok) return reply.code(res.status).send(await res.text());
    return res.json();
});

server.post('/auth/logout', async (request, reply) => {
    const url = `${USER_SERVICE_URL.replace(/\/$/, '')}/auth/logout`;
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request.body)
    });
    if (!res.ok) return reply.code(res.status).send(await res.text());
    return res.json();
});

server.get('/user/profile', async (request, reply) => {
    const auth = (request.headers && (request.headers as any).authorization) || '';
    const headers: any = {};
    if (auth) headers['Authorization'] = auth as string;

    const url = `${USER_SERVICE_URL.replace(/\/$/, '')}/user/profile`;
    const res = await fetch(url, { method: 'GET', headers });
    if (!res.ok) return reply.code(res.status).send(await res.text());
    return res.json();
});

server.get('/auth/profile', async (request, reply) => {
    const auth = (request.headers && (request.headers as any).authorization) || '';
    const headers: any = {};
    if (auth) headers['Authorization'] = auth as string;

    const url = `${USER_SERVICE_URL.replace(/\/$/, '')}/auth/profile`;
    const res = await fetch(url, { method: 'GET', headers });
    if (!res.ok) return reply.code(res.status).send(await res.text());
    return res.json();
});

// --- USER MANAGEMENT PROXY ROUTES ---
server.get('/admin/staff', async (request, reply) => {
    const qs = new URLSearchParams(request.query as any).toString();
    const url = `${USER_SERVICE_URL.replace(/\/$/, '')}/admin/staff${qs ? `?${qs}` : ''}`;
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) return reply.code(res.status).send(await res.text());
    return res.json();
});

server.get('/admin/users', async (request, reply) => {
    const qs = new URLSearchParams(request.query as any).toString();
    const url = `${USER_SERVICE_URL.replace(/\/$/, '')}/admin/users${qs ? `?${qs}` : ''}`;
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) return reply.code(res.status).send(await res.text());
    return res.json();
});

server.get('/staff/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const url = `${USER_SERVICE_URL.replace(/\/$/, '')}/staff/${id}`;
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) return reply.code(res.status).send(await res.text());
    return res.json();
});

// --- BRANCH MANAGEMENT PROXY ROUTES ---
server.get('/branches', async (request, reply) => {
    const qs = new URLSearchParams(request.query as any).toString();
    const url = `${USER_SERVICE_URL.replace(/\/$/, '')}/branches${qs ? `?${qs}` : ''}`;
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) return reply.code(res.status).send(await res.text());
    return res.json();
});

server.post('/branches', async (request, reply) => {
    const url = `${USER_SERVICE_URL.replace(/\/$/, '')}/branches`;
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request.body)
    });
    if (!res.ok) return reply.code(res.status).send(await res.text());
    return res.json();
});

// --- COMPANY MANAGEMENT PROXY ROUTES ---
server.get('/admin/companies', async (request, reply) => {
    const url = `${USER_SERVICE_URL.replace(/\/$/, '')}/admin/companies`;
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) return reply.code(res.status).send(await res.text());
    return res.json();
});

server.get('/admin/companies/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const url = `${USER_SERVICE_URL.replace(/\/$/, '')}/admin/companies/${id}`;
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) return reply.code(res.status).send(await res.text());
    return res.json();
});

server.patch('/admin/companies/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const url = `${USER_SERVICE_URL.replace(/\/$/, '')}/admin/companies/${id}`;
    const res = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request.body)
    });
    if (!res.ok) return reply.code(res.status).send(await res.text());
    return res.json();
});

// --- DEPARTMENT AND DESIGNATION PROXY ROUTES ---
server.get('/departments', async (request, reply) => {
    const qs = new URLSearchParams(request.query as any).toString();
    const url = `${USER_SERVICE_URL.replace(/\/$/, '')}/departments${qs ? `?${qs}` : ''}`;
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) return reply.code(res.status).send(await res.text());
    return res.json();
});

server.post('/departments', async (request, reply) => {
    const url = `${USER_SERVICE_URL.replace(/\/$/, '')}/departments`;
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request.body)
    });
    if (!res.ok) return reply.code(res.status).send(await res.text());
    return res.json();
});

server.get('/designations', async (request, reply) => {
    const qs = new URLSearchParams(request.query as any).toString();
    const url = `${USER_SERVICE_URL.replace(/\/$/, '')}/designations${qs ? `?${qs}` : ''}`;
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) return reply.code(res.status).send(await res.text());
    return res.json();
});

server.get('/cost-centers', async (request, reply) => {
    const qs = new URLSearchParams(request.query as any).toString();
    const url = `${USER_SERVICE_URL.replace(/\/$/, '')}/cost-centers${qs ? `?${qs}` : ''}`;
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) return reply.code(res.status).send(await res.text());
    return res.json();
});

// --- ROLES AND PERMISSIONS PROXY ROUTES ---
server.get('/admin/roles', async (request, reply) => {
    const url = `${USER_SERVICE_URL.replace(/\/$/, '')}/admin/roles`;
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) return reply.code(res.status).send(await res.text());
    return res.json();
});

server.get('/admin/permissions', async (request, reply) => {
    const url = `${USER_SERVICE_URL.replace(/\/$/, '')}/admin/permissions`;
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) return reply.code(res.status).send(await res.text());
    return res.json();
});

// --- BRANDING PROXY ROUTES ---
server.get('/admin/branding', async (request, reply) => {
    const url = `${USER_SERVICE_URL.replace(/\/$/, '')}/admin/branding`;
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) return reply.code(res.status).send(await res.text());
    return res.json();
});

// --- REFERENCE DATA PROXY ROUTES ---
server.get('/admin/languages', async (request, reply) => {
    const url = `${USER_SERVICE_URL.replace(/\/$/, '')}/admin/languages`;
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) return reply.code(res.status).send(await res.text());
    return res.json();
});

server.get('/admin/currencies', async (request, reply) => {
    const url = `${USER_SERVICE_URL.replace(/\/$/, '')}/admin/currencies`;
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) return reply.code(res.status).send(await res.text());
    return res.json();
});

server.get('/admin/regions', async (request, reply) => {
    const url = `${USER_SERVICE_URL.replace(/\/$/, '')}/admin/regions`;
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) return reply.code(res.status).send(await res.text());
    return res.json();
});

server.get('/admin/ip-whitelist', async (request, reply) => {
    const qs = new URLSearchParams(request.query as any).toString();
    const url = `${USER_SERVICE_URL.replace(/\/$/, '')}/admin/ip-whitelist${qs ? `?${qs}` : ''}`;
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) return reply.code(res.status).send(await res.text());
    return res.json();
});

server.get('/admin/regions/countries', async (request, reply) => {
    const url = `${USER_SERVICE_URL.replace(/\/$/, '')}/admin/regions/countries`;
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) return reply.code(res.status).send(await res.text());
    return res.json();
});

// --- AUDIT LOGS PROXY ROUTES ---
server.get('/admin/audit-logs', async (request, reply) => {
    const qs = new URLSearchParams(request.query as any).toString();
    const url = `${USER_SERVICE_URL.replace(/\/$/, '')}/admin/audit-logs${qs ? `?${qs}` : ''}`;
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) return reply.code(res.status).send(await res.text());
    return res.json();
});

server.get('/admin/audit-logs/stats', async (request, reply) => {
    const url = `${USER_SERVICE_URL.replace(/\/$/, '')}/admin/audit-logs/stats`;
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) return reply.code(res.status).send(await res.text());
    return res.json();
});

server.get('/admin/audit-logs/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const url = `${USER_SERVICE_URL.replace(/\/$/, '')}/admin/audit-logs/${id}`;
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) return reply.code(res.status).send(await res.text());
    return res.json();
});

server.get('/admin/audit-logs/user/:userId', async (request, reply) => {
    const { userId } = request.params as { userId: string };
    const qs = new URLSearchParams(request.query as any).toString();
    const url = `${USER_SERVICE_URL.replace(/\/$/, '')}/admin/audit-logs/user/${userId}${qs ? `?${qs}` : ''}`;
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) return reply.code(res.status).send(await res.text());
    return res.json();
});

server.get('/admin/audit-logs/suspicious', async (request, reply) => {
    const qs = new URLSearchParams(request.query as any).toString();
    const url = `${USER_SERVICE_URL.replace(/\/$/, '')}/admin/audit-logs/suspicious${qs ? `?${qs}` : ''}`;
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) return reply.code(res.status).send(await res.text());
    return res.json();
});

server.get('/admin/audit-logs/export', async (request, reply) => {
    const qs = new URLSearchParams(request.query as any).toString();
    const url = `${USER_SERVICE_URL.replace(/\/$/, '')}/admin/audit-logs/export${qs ? `?${qs}` : ''}`;
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) return reply.code(res.status).send(await res.text());
    return res.json();
});

server.post('/admin/audit-logs/block-ip', async (request, reply) => {
    const url = `${USER_SERVICE_URL.replace(/\/$/, '')}/admin/audit-logs/block-ip`;
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request.body)
    });
    if (!res.ok) return reply.code(res.status).send(await res.text());
    return res.json();
});

// Note: Mock endpoints for wallet, auth, notifications, and user profile have been removed.
// These endpoints should be provided by their respective microservices (user-service, wallet-service, notification-service).

server.get('/user/preferences', async (request, reply) => {
    try {
        const auth = (request.headers && (request.headers as any).authorization) || '';
        const headers: any = {};
        if (auth) headers['Authorization'] = auth as string;

        const url = `${USER_SERVICE_URL.replace(/\/$/, '')}/user/preferences`;
        const res = await fetch(url, { method: 'GET', headers });
        if (!res.ok) {
            // Fallback to defaults when user-service unavailable
            return { language: 'English', currency: 'USD', notifications: true };
        }
        return await res.json();
    } catch (err) {
        server.log.error({ err }, 'GET /user/preferences error');
        return { language: 'English', currency: 'USD', notifications: true };
    }
});

server.post('/user/preferences', async (request, reply) => {
    try {
        const auth = (request.headers && (request.headers as any).authorization) || '';
        const headers: any = { 'Content-Type': 'application/json' };
        if (auth) headers['Authorization'] = auth as string;

        const url = `${USER_SERVICE_URL.replace(/\/$/, '')}/user/preferences`;
        const res = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(request.body)
        });
        if (!res.ok) return reply.code(res.status).send(await res.text());
        return res.json();
    } catch (err) {
        server.log.error({ err }, 'POST /user/preferences error');
        return { success: false };
    }
});

const start = async () => {
    try {
        // Initialize Registry before starting server
        await initializeRegistry();
        await server.listen({ port: Number(process.env.API_GATEWAY_PORT || 8000), host: '0.0.0.0' });
        console.log('API Gateway listening on port', process.env.API_GATEWAY_PORT || 8000);
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};

start();
