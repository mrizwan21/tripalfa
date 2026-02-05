import axios from 'axios';
import * as cheerio from 'cheerio';
import { Pool } from 'pg';
import path from 'path';
import dotenv from 'dotenv';
import pLimit from 'p-limit';
import { findOrCreateCanonicalHotel, HotelData } from './mapping-utils';

// Load .env
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const STATIC_DATABASE_URL = process.env.STATIC_DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/staticdatabase';

console.log('🚀 Loading GIATA Importer...');
const pool = new Pool({
    connectionString: STATIC_DATABASE_URL,
});
console.log('📡 Database connection pool initialized.');

// Concurrency limit for enrichment
const limit = pLimit(5);

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Supported GIATA languages
const SUPPORTED_LANGUAGES = [
    'ar', 'bg', 'zh', 'hr', 'cs', 'da', 'nl', 'en', 'en-US', 'et', 'fi', 'fr', 'de', 'el', 'hu',
    'it', 'ja', 'lv', 'lt', 'no', 'pl', 'pt-BR', 'pt', 'ro', 'ru', 'sl', 'es', 'sv', 'tr', 'uk'
];

async function getSetting(key: string): Promise<string | null> {
    const res = await pool.query('SELECT value FROM system_settings WHERE key = $1', [key]);
    const val = res.rows[0]?.value;
    return val ? (typeof val === 'string' ? val : JSON.stringify(val)) : null;
}

async function setSetting(key: string, value: string) {
    await pool.query(
        `INSERT INTO system_settings (id, key, value, category, updated_at) 
         VALUES ($1, $1, $2, 'ingestion', NOW()) 
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
        [key, JSON.stringify(value)]
    );
}

interface BasicHotelInfo {
    id: string;
    name: string;
}

/**
 * Phase 1.5: Discover IDs from Hotel Chains (with pagination)
 */
async function discoverHotelsFromChains(): Promise<BasicHotelInfo[]> {
    console.log('🔍 Phase 1.5: Discovering properties from Hotel Chains...');
    const chainHotels: BasicHotelInfo[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
        try {
            console.log(`📡 Fetching hotel chains page ${page}...`);
            const { data: chainsPage } = await axios.get(`https://giatadrive.com/hotel-chains?lang=en&page=${page}`);
            const $chains = cheerio.load(chainsPage as string);
            const chainUrls: string[] = [];

            $chains('#sitemap-container a').each((_: number, el: any) => {
                const href = $chains(el).attr('href');
                if (href && !href.includes('hotel-chains') && !href.includes('hotel-directory')) {
                    const cleanHref = href.startsWith('/') ? href : `/${href}`;
                    const finalHref = cleanHref.split('?')[0];
                    if (!chainUrls.includes(finalHref)) chainUrls.push(finalHref);
                }
            });

            if (chainUrls.length === 0) {
                hasMore = false;
                break;
            }

            console.log(`⛓️ Found ${chainUrls.length} hotel chains on page ${page}. Crawling...`);

            for (const chainUrl of chainUrls) {
                try {
                    console.log(`🔗 Scrapping chain: ${chainUrl}...`);
                    const { data: chainPage } = await axios.get(`https://giatadrive.com${chainUrl}?lang=en`);
                    const $hotel = cheerio.load(chainPage as string);

                    $hotel('a').each((_: number, el: any) => {
                        const href = $hotel(el).attr('href');
                        const text = $hotel(el).text().trim();
                        const idMatch = href?.match(/(?:\d+)?\/(\d+)\?lang=/);

                        if (idMatch && text && text !== idMatch[1]) {
                            const id = idMatch[1];
                            if (!chainHotels.some(h => h.id === id)) {
                                chainHotels.push({ id, name: text });
                            }
                        }
                    });
                    await sleep(200);
                } catch (e: any) {
                    console.warn(`⚠️ Failed to scrape chain ${chainUrl}: ${e.message}`);
                }
            }

            page++;
            await sleep(500);
        } catch (error: any) {
            console.error(`❌ Error discovering from chains: ${error.message}`);
            hasMore = false;
        }
    }

    return chainHotels;
}

/**
 * Phase 2: Enrich a single hotel with details from its property page
 */
export async function enrichHotel(id: string, initialName: string) {
    console.log(`🏠 Enriching Hotel ID: ${id}...`);
    try {
        const url = `https://giatadrive.com/${id}?lang=en`;
        const { data } = await axios.get(url);
        const $ = cheerio.load(data as string);

        const name = $('h1').text().trim() || initialName;

        // Stars extraction: Robust selector set
        let starRating = 0;
        $('.hotel-header-address-stars span').each((_: number, el: any) => {
            if ($(el).text().trim() === 'G') starRating++;
        });

        if (starRating === 0) {
            $('.giata-star, .star, .rating-star, i.fa-star').each(() => { starRating++; });
        }

        if (starRating === 0) {
            $('img[src*="star"]').each((_: number, el: any) => {
                const src = $(el).attr('src') || '';
                if (src.includes('full') || src.includes('active')) starRating++;
            });
        }

        // Address & Facts
        let address = '';
        let city = '';
        let country = '';
        const amenities: string[] = [];

        $('.fact').each((_: number, el: any) => {
            const h3 = $(el).find('h3').text().trim();
            const content = $(el).find('.fact-attributes').text().trim();

            if (h3 === 'Address') {
                address = content.replace(/\s+/g, ' ').trim();
                const parts = address.split(',').map(p => p.trim());
                if (parts.length >= 2) {
                    country = parts[parts.length - 1];
                    city = parts[parts.length - 2].replace(/^\d+\s+/, ''); // Remove zip from "Zip City"
                }
            } else {
                amenities.push(`${h3}: ${content}`);
            }
        });

        // Images & Variants
        const images: any[] = [];
        $('.image-gallery-image img').each((_: number, el: any) => {
            const src = $(el).attr('src') || '';
            const iidMatch = src.match(/iid=(\d+)/);
            if (iidMatch) {
                const iid = iidMatch[1];
                const uid = '203291'; // Standard UID for the directory
                images.push({
                    thumbnail: `https://i.giatamedia.com/s.php?uid=${uid}&iid=${iid}&size=100`,
                    small: `https://i.giatamedia.com/s.php?uid=${uid}&iid=${iid}&size=300`,
                    medium: `https://i.giatamedia.com/s.php?uid=${uid}&iid=${iid}&size=600`,
                    large: `https://i.giatamedia.com/s.php?uid=${uid}&iid=${iid}&size=1200`
                });
            } else if (src) {
                images.push({ original: src });
            }
        });

        // 3. Canonical Mapping & Merging
        const hotelData: HotelData = {
            name,
            address,
            city,
            country,
            stars: starRating,
            amenities,
            images,
            external_id: id,
            external_source: 'GIATA'
        };

        const canonicalId = await findOrCreateCanonicalHotel(pool, hotelData, 0); // supplierHotelId is handled inside

        // Retrieve the supplier reference ID for room type mapping
        const refRes = await pool.query(
            'SELECT id FROM hotel_supplier_references WHERE supplier_code = $1 AND supplier_hotel_id = $2',
            ['GIATA', id]
        );
        const supplierHotelId = refRes.rows[0]?.id;

        // --- NEW: Room Level Mapping Extraction ---
        try {
            const scripts = $('script').map((_, el) => $(el).html()).get();

            // Try both 'variantGroups' and 'roomTypes' patterns
            const roomsToProcess: any[] = [];

            // Pattern 1: variantGroups (from previous version/docs)
            const configScript = scripts.find(s => s && s.includes('variantGroups'));
            if (configScript) {
                const match = configScript.match(/\"variantGroups\":\s*(\[.*?\]),/);
                if (match) {
                    const groups = JSON.parse(match[1]);
                    for (const g of groups) {
                        if (g.variants) {
                            roomsToProcess.push(...g.variants.map((v: any) => ({ name: v.label, variantId: v.variantId })));
                        }
                    }
                }
            }

            // Pattern 2: property.roomTypes (observed in browser)
            if (roomsToProcess.length === 0) {
                const propertyScript = scripts.find(s => s && (s.includes('window.property =') || s.includes('var property =')) && s.includes('roomTypes'));
                if (propertyScript) {
                    // Use regex to extract the JSON object
                    const propMatch = propertyScript.match(/(?:window\.|var\s+)property\s*=\s*({.*?});/s);
                    if (propMatch) {
                        try {
                            const propertyData = JSON.parse(propMatch[1]);
                            if (propertyData.roomTypes) {
                                roomsToProcess.push(...propertyData.roomTypes);
                            }
                        } catch (e) {
                            console.log('JSON.parse failed for property object, trying fallback.');
                            const rtMatch = propertyScript.match(/\"roomTypes\":\s*(\[.*?\])/);
                            if (rtMatch) roomsToProcess.push(...JSON.parse(rtMatch[1]));
                        }
                    }
                }
            }

            if (roomsToProcess.length > 0) {
                console.log(`🛏️ Processing ${roomsToProcess.length} room types for hotel ${id}.`);
                for (const room of roomsToProcess) {
                    const label = room.name || room.label;
                    const vid = room.variantId;
                    if (!vid || !label) continue;

                    // Basic Attribute Extraction
                    let rClass = 'Standard';
                    if (label.toLowerCase().includes('deluxe')) rClass = 'Deluxe';
                    if (label.toLowerCase().includes('executive')) rClass = 'Executive';
                    if (label.toLowerCase().includes('superior')) rClass = 'Superior';
                    if (label.toLowerCase().includes('suite')) rClass = 'Suite';

                    let rType = 'Room';
                    if (label.toLowerCase().includes('apartment')) rType = 'Apartment';
                    if (label.toLowerCase().includes('villa')) rType = 'Villa';
                    if (label.toLowerCase().includes('studio')) rType = 'Studio';
                    if (label.toLowerCase().includes('suite')) rType = 'Suite';

                    let vType = null;
                    if (label.toLowerCase().includes('view')) {
                        const vMatch = label.match(/(\w+\s+View)/i);
                        vType = vMatch ? vMatch[1] : 'Yes';
                    }

                    // Extract features/amenities form name
                    const features: string[] = [];
                    if (label.toLowerCase().includes('balcony')) features.push('Balcony');
                    if (label.toLowerCase().includes('terrace')) features.push('Terrace');
                    if (label.toLowerCase().includes('ac') || label.toLowerCase().includes('air condition')) features.push('Air Conditioning');
                    if (label.toLowerCase().includes('wifi')) features.push('WiFi');
                    if (vType) features.push(vType);

                    // Extract Room Images
                    const roomImages: any[] = [];
                    if (room.imageRelations && Array.isArray(room.imageRelations)) {
                        const uid = '203291'; // Standard UID
                        for (const iid of room.imageRelations) {
                            roomImages.push({
                                thumbnail: `https://i.giatamedia.com/s.php?uid=${uid}&iid=${iid}&size=100`,
                                small: `https://i.giatamedia.com/s.php?uid=${uid}&iid=${iid}&size=300`,
                                medium: `https://i.giatamedia.com/s.php?uid=${uid}&iid=${iid}&size=600`,
                                large: `https://i.giatamedia.com/s.php?uid=${uid}&iid=${iid}&size=1200`
                            });
                        }
                    }

                    await pool.query(`
                        INSERT INTO hotel_room_types (
                            hotel_id, name, giata_room_id, standardized_name, 
                            room_class, room_type, view_type, is_active, updated_at, max_occupancy,
                            confidence_score, features, images
                        )
                        VALUES ($1, $2, $3, $4, $5, $6, $7, true, NOW(), 2, $8, $9, $10)
                        ON CONFLICT (giata_room_id) DO UPDATE SET
                            name = EXCLUDED.name,
                            standardized_name = EXCLUDED.standardized_name,
                            room_class = EXCLUDED.room_class,
                            room_type = EXCLUDED.room_type,
                            view_type = EXCLUDED.view_type,
                            confidence_score = EXCLUDED.confidence_score,
                            features = EXCLUDED.features,
                            images = EXCLUDED.images,
                            updated_at = NOW()
                    `, [
                        supplierHotelId, label, vid, `${rClass} ${rType}`,
                        rClass, rType, vType,
                        0.95, JSON.stringify(features), JSON.stringify(roomImages)
                    ]);
                }
            }
        } catch (roomError: any) {
            console.warn(`⚠️ Failed to extract rooms for hotel ${id}: ${roomError.message} `);
        }
        // ------------------------------------------

        // 4. Fetch and store translations for all supported languages
        await fetchAndStoreTranslations(id, canonicalId);

    } catch (error: any) {
        console.error(`❌ Failed to enrich hotel ${id}: ${error.message} `);
    }
}

/**
 * Fetch localized content for a hotel in all supported languages
 */
async function fetchAndStoreTranslations(giataId: string, hotelId: number) {
    for (const lang of SUPPORTED_LANGUAGES) {
        if (lang === 'en') continue; // Already fetched in primary enrichment

        try {
            const url = `https://giatadrive.com/${giataId}?lang=${lang}`;
            const { data } = await axios.get(url);
            const $ = cheerio.load(data as string);

            const name = $('h1').text().trim();

            // Extract description from meta or first paragraph
            const description = $('meta[name="description"]').attr('content') ||
                $('.hotel-description p').first().text().trim() || '';

            // Address
            let address = '';
            $('.fact').each((_: number, el: any) => {
                const h3 = $(el).find('h3').text().trim();
                if (h3 === 'Address' || h3.includes('Adresse') || h3.includes('Dirección')) {
                    address = $(el).find('.fact-attributes').text().trim().replace(/\s+/g, ' ');
                }
            });

            // Upsert translation
            await pool.query(`
                INSERT INTO hotel_translations (canonical_hotel_id, language_code, name, description, address, updated_at, source_supplier)
                VALUES ($1, $2, $3, $4, $5, NOW(), 'GIATA')
                ON CONFLICT (canonical_hotel_id, language_code) DO UPDATE SET
                    name = EXCLUDED.name,
                    description = EXCLUDED.description,
                    address = EXCLUDED.address,
                    updated_at = NOW()
            `, [hotelId, lang, name, description, address]);

            // Polite delay between language fetches
            await sleep(100);
        } catch (error: any) {
            // Silent fail for individual language - don't break the entire loop
            console.warn(`⚠️ Failed to fetch ${lang} translation for hotel ${giataId}`);
        }
    }
}

/**
 * Main ingestion entry point
 */
export async function ingestGiataHotels() {
    console.log('--- Starting Massive GIATA Ingestion ---');

    // 1. Chain-based discovery (One-off or infrequent)
    const chainDiscoveryDone = await getSetting('giata_chains_discovered');
    if (chainDiscoveryDone !== '"true"' && chainDiscoveryDone !== 'true') {
        const chainHotels = await discoverHotelsFromChains();
        console.log(`🧪 Enriching ${chainHotels.length} hotels discovered from chains...`);
        const tasks = chainHotels.map(hotel =>
            limit(async () => {
                await enrichHotel(hotel.id, hotel.name);
                await sleep(200);
            })
        );
        await Promise.all(tasks);
        await setSetting('giata_chains_discovered', 'true');
        console.log('✅ Chain discovery and enrichment complete.');
    }

    // 2. Directory-based discovery (Paginated)
    const lastPageStr = await getSetting('giata_last_page');
    const startPage = lastPageStr ? parseInt(lastPageStr) : 1;
    console.log(`📡 Resuming / Starting directory from page ${startPage} `);

    let page = startPage;
    let hasMore = true;

    while (hasMore) {
        try {
            console.log(`📡 Fetching directory page ${page}...`);
            const { data } = await axios.get(`https://giatadrive.com/hotel-directory?lang=en&page=${page}`);
            const $ = cheerio.load(data as string);

            const pageHotels: BasicHotelInfo[] = [];
            $('a').each((_: number, el: any) => {
                const href = $(el).attr('href');
                const text = $(el).text().trim();
                const idMatch = href?.match(/(?:giatadrive\.com\/)?(\d+)\?lang=/);
                if (idMatch && text && text !== idMatch[1]) {
                    pageHotels.push({ id: idMatch[1], name: text });
                }
            });

            if (pageHotels.length === 0) {
                hasMore = false;
            } else {
                console.log(`🧪 Enriching ${pageHotels.length} hotels from page ${page}...`);
                const tasks = pageHotels.map(hotel =>
                    limit(async () => {
                        await enrichHotel(hotel.id, hotel.name);
                        await sleep(300);
                    })
                );
                await Promise.all(tasks);

                await setSetting('giata_last_page', page.toString());
                console.log(`✅ Page ${page} complete and saved.`);
                page++;
                await sleep(500);
            }
        } catch (error: any) {
            console.error(`❌ Error on directory page ${page}: ${error.message}`);
            if (error.response?.status === 404) {
                hasMore = false;
            } else {
                // Wait and retry
                await sleep(5000);
            }
        }
    }

    console.log('--- Massive GIATA Ingestion Complete ---');
}

if (require.main === module) {
    ingestGiataHotels().then(() => {
        console.log('🏁 GIATA Importer finished successfully.');
        pool.end();
    }).catch(e => {
        console.error('💥 GIATA Importer crashed:', e);
        pool.end();
    });
}
