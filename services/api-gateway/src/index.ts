import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
import Fastify from 'fastify';
import { createRequire } from 'module';
const requireC = createRequire(import.meta.url);
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
    // Fallback: create a small local PG pool for static queries and a noop redis
    // This ensures the gateway can start even if monorepo resolution fails.
     
    const { Pool } = requireC('pg');
    const staticPool = new Pool({
        connectionString: process.env.STATIC_DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/staticdatabase'
    });
    queryStatic = async (text: string, params?: any[]) => staticPool.query(text, params);
    queryRealtime = async (text: string, params?: any[]) => staticPool.query(text, params);
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
let Registry: any;
try {
    // prefer require() to avoid ESM resolution issues at runtime
     
    const reg = requireC('./adapters/Registry');
    Registry = reg?.default || reg;
} catch (err) {
    // fallback no-op registry so the gateway can start in minimal environments
    Registry = { getAdapter: (_: string) => null };
}
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
    const { q } = request.query as { q?: string };
    let query = 'SELECT * FROM airports WHERE is_active = true';
    const params: any[] = [];

    if (q) {
        query += ' AND (iata_code ILIKE $1 OR name ILIKE $1 OR city ILIKE $1)';
        params.push(`%${q}%`);
    }

    query += ' ORDER BY iata_code ASC LIMIT 100';
    const result = await queryStatic(query, params);
    return result.rows;
});

server.get('/airlines', async (request, reply) => {
    const result = await queryStatic('SELECT * FROM airlines WHERE is_active = true ORDER BY name ASC', []);
    return result.rows;
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
            // Return mock rates if no data in database
            server.log.warn('No exchange rates found in database, returning mock rates');
            return {
                base_currency: 'USD',
                rates: {
                    USD: 1.0,
                    EUR: 0.85,
                    GBP: 0.73,
                    AED: 3.67,
                    SAR: 3.75,
                    INR: 82.50,
                    JPY: 150.0,
                    AUD: 1.35,
                    CAD: 1.34,
                    CHF: 0.92
                },
                fetched_at: new Date().toISOString()
            };
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
    const result = await queryStatic('SELECT * FROM nationalities ORDER BY name ASC', []);
    return result.rows;
});

server.get('/loyalty-programs', async (request, reply) => {
    const result = await queryStatic('SELECT * FROM loyalty_programs WHERE is_active = true ORDER BY name ASC', []);
    return result.rows;
});

server.get('/static/facilities', async (request, reply) => {
    const result = await queryStatic('SELECT * FROM amenities ORDER BY name ASC', []);
    return result.rows;
});

server.get('/static/types', async (request, reply) => {
    const result = await queryStatic('SELECT * FROM hotel_types ORDER BY name ASC', []);
    return result.rows;
});

server.get('/static/chains', async (request, reply) => {
    const result = await queryStatic('SELECT * FROM hotel_chains ORDER BY name ASC', []);
    return result.rows;
});

server.get('/cities', async (request, reply) => {
    const { q } = request.query as { q?: string };
    let query = 'SELECT * FROM cities';
    const params: any[] = [];

    if (q) {
        query += ' WHERE name ILIKE $1 OR country ILIKE $1';
        params.push(`%${q}%`);
    }

    // Prefer records with country code
    query += ' ORDER BY country_code IS NULL, is_popular DESC, name ASC LIMIT 50';
    const result = await queryStatic(query, params);
    return result.rows;
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

// --- Inventory wrappers (proxy to inventory-service) ---
const INVENTORY_SERVICE_URL = process.env.INVENTORY_SERVICE_URL || 'http://localhost:3002';
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3004';

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

// TODO: Implement Booking Wrappers (createOrder, book) in Adapters first
// server.post('/bookings/flight/hold', ...)

// --- Wallet endpoints (mock for testing) ---
server.get('/wallets', async (request, reply) => {
    // Mock wallet data for testing
    return {
        accounts: [
            { id: 'wallet_1', currency: 'USD', balance: 5000.00, type: 'main' },
            { id: 'wallet_2', currency: 'EUR', balance: 2500.00, type: 'secondary' }
        ]
    };
});

server.post('/wallets/topup', async (request, reply) => {
    const { amount, currency } = request.body as any;
    return { success: true, message: `Added ${amount} ${currency} to wallet`, newBalance: 5000 + (amount || 0) };
});

server.get('/wallets/transactions', async (request, reply) => {
    return {
        transactions: [
            { id: 'tx_1', type: 'credit', amount: 1000, currency: 'USD', description: 'Top-up', createdAt: new Date().toISOString() },
            { id: 'tx_2', type: 'debit', amount: 250, currency: 'USD', description: 'Flight booking', createdAt: new Date().toISOString() }
        ]
    };
});

// --- Auth endpoints (mock for testing) ---
server.post('/auth/login', async (request, reply) => {
    const { email, password } = request.body as any;
    return {
        accessToken: 'test_access_' + Date.now(),
        refreshToken: 'test_refresh_' + Date.now(),
        user: { id: 'user_1', email: email || 'test@tripalfa.com', name: 'Test User' }
    };
});

server.post('/auth/register', async (request, reply) => {
    const { email, password, name } = request.body as any;
    return {
        accessToken: 'test_access_' + Date.now(),
        refreshToken: 'test_refresh_' + Date.now(),
        user: { id: 'user_' + Date.now(), email, name: name || email?.split('@')[0] }
    };
});

server.post('/auth/logout', async (request, reply) => {
    return { success: true };
});

server.post('/auth/refresh', async (request, reply) => {
    return { accessToken: 'test_access_refreshed_' + Date.now() };
});

// --- Notification endpoints (mock for testing) ---
server.get('/notifications', async (request, reply) => {
    return {
        items: [
            { id: 'notif_1', title: 'Booking Confirmed', message: 'Your flight booking has been confirmed.', read: false, createdAt: new Date().toISOString() },
            { id: 'notif_2', title: 'Price Alert', message: 'Prices dropped for your saved route.', read: true, createdAt: new Date().toISOString() }
        ]
    };
});

server.post('/notifications/mark-read', async (request, reply) => {
    return { success: true };
});

server.get('/notifications/unread-count', async (request, reply) => {
    return { count: 1 };
});

// --- User endpoints (mock for testing) ---
server.get('/user/profile', async (request, reply) => {
    return { id: 'user_1', email: 'test@tripalfa.com', name: 'Test User', phone: '+971501234567' };
});

server.get('/user/documents', async (request, reply) => {
    return [];
});

server.post('/user/documents', async (request, reply) => {
    return { success: true, documentId: 'doc_' + Date.now() };
});

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
        await server.listen({ port: Number(process.env.API_GATEWAY_PORT || 3000), host: '0.0.0.0' });
        console.log('API Gateway listening on port', process.env.API_GATEWAY_PORT || 3000);
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};

start();
