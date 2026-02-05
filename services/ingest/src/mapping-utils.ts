import { Pool } from 'pg';
import * as stringSimilarity from 'string-similarity';
import crypto from 'crypto';

export interface HotelData {
    name: string;
    address?: string;
    city?: string;
    country?: string;
    country_code?: string;
    stars?: number;
    latitude?: number;
    longitude?: number;
    amenities?: string[];
    images?: Array<{ url: string; caption?: string }>;
    external_id: string;
    external_source: string;
}

export async function findOrCreateCanonicalHotel(pool: Pool, hotel: HotelData, supplierHotelId: number) {
    // 1. Search for existing canonical hotels in the same city/country
    // Filter by country_code if available for better accuracy
    const queryParams: any[] = [hotel.city, hotel.country];
    let countryFilter = 'country = $2';

    if (hotel.country_code) {
        queryParams.push(hotel.country_code);
        countryFilter = '(country = $2 OR country_code = $3)';
    }

    const existing = await pool.query(`
        SELECT id, name, address, latitude, longitude, star_rating
        FROM canonical_hotels 
        WHERE city = $1 AND ${countryFilter}
    `, queryParams);

    let canonicalId = null;
    let matchedRow = null;

    for (const row of existing.rows) {
        const nameSimilarity = stringSimilarity.compareTwoStrings((hotel.name || '').toLowerCase(), row.name.toLowerCase());
        const addressSimilarity = stringSimilarity.compareTwoStrings((hotel.address || '').toLowerCase(), (row.address || '').toLowerCase());

        // High confidence match
        if (nameSimilarity > 0.9 || (nameSimilarity > 0.8 && addressSimilarity > 0.8)) {
            canonicalId = row.id;
            matchedRow = row;
            break;
        }
    }

    if (canonicalId && matchedRow) {
        // High complexity merging is deferred to a background job or specific enrichment phase
        // Here we just ensure we have the basic reference
        await enrichCanonicalHotel(pool, canonicalId, matchedRow, hotel);
    } else {
        // 2. If no match, create new canonical hotel
        // Note: Schema has: name, address, city, country, star_rating, latitude, longitude, amenities, images
        const result = await pool.query(`
            INSERT INTO canonical_hotels (
                name, address, city, country, 
                star_rating, latitude, longitude, primary_source, amenities, images, updated_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
            RETURNING id
        `, [
            hotel.name,
            hotel.address || '',
            hotel.city || '',
            hotel.country || '',
            hotel.stars || 0,
            hotel.latitude || null,
            hotel.longitude || null,
            hotel.external_source,
            JSON.stringify(hotel.amenities || []),
            JSON.stringify(hotel.images || [])
        ]);
        canonicalId = result.rows[0].id;
    }

    // 3. Create/Update mapping record (actual table: hotel_supplier_references)
    await pool.query(`
        INSERT INTO hotel_supplier_references (
            canonical_hotel_id, supplier_code, supplier_hotel_id, match_confidence, match_method, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, NOW())
        ON CONFLICT (supplier_code, supplier_hotel_id) DO UPDATE SET
            canonical_hotel_id = EXCLUDED.canonical_hotel_id,
            updated_at = NOW()
    `, [canonicalId, hotel.external_source, hotel.external_id, matchedRow ? 0.95 : 1.0, matchedRow ? 'FUZZY' : 'ORIGINAL']);

    // 4. Normalize Amenities for this instance
    if (hotel.amenities && hotel.amenities.length > 0) {
        await upsertNormalizedAmenities(pool, canonicalId, hotel.amenities, hotel.external_source);
    }

    // 5. Normalize Images for this instance
    if (hotel.images && hotel.images.length > 0) {
        await upsertNormalizedImages(pool, canonicalId, hotel.images, hotel.external_source, hotel.external_id);
    }

    return canonicalId;
}

async function upsertNormalizedAmenities(pool: Pool, canonicalId: number, amenities: string[], supplier: string) {
    for (const rawName of amenities) {
        if (!rawName) continue;
        const rawNameStr = String(rawName);
        const code = rawNameStr.toUpperCase()
            .replace(/\s+/g, '_')
            .replace(/\//g, '_')
            .replace(/-/g, '_')
            .replace(/[^A-Z0-9_]/g, '')
            .substring(0, 255);

        // Ensure amenity exists in master list
        const amenityResult = await pool.query(`
            INSERT INTO amenities (name, code)
            VALUES ($1, $2)
            ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
            RETURNING id
        `, [rawName, code]);

        const amenityId = amenityResult.rows[0].id;

        // Link to hotel
        await pool.query(`
            INSERT INTO hotel_amenity_instances (canonical_hotel_id, amenity_id, source_supplier)
            VALUES ($1, $2, $3)
            ON CONFLICT DO NOTHING
        `, [canonicalId, amenityId, supplier]);
    }
}

async function upsertNormalizedImages(pool: Pool, canonicalId: number, images: any[], supplier: string, externalId: string) {
    for (let i = 0; i < images.length; i++) {
        const img = images[i];
        const url = typeof img === 'string' ? img : img.url;
        if (!url) continue;

        const urlHash = crypto.createHash('md5').update(url).digest('hex');

        await pool.query(`
            INSERT INTO hotel_images (
                canonical_hotel_id, url, url_hash, caption, 
                is_primary, sort_order, source_supplier, source_id
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (canonical_hotel_id, url_hash) DO NOTHING
        `, [
            canonicalId,
            url,
            urlHash,
            img.caption || null,
            i === 0,
            i,
            supplier,
            externalId
        ]);
    }
}

/**
 * Enriches a canonical hotel with data from a new source.
 * GIATA is considered the primary source for rich content.
 */
/**
 * Enriches a canonical hotel with data from a new source.
 * GIATA is considered the primary source for rich content, but we merge data from all sources.
 */
async function enrichCanonicalHotel(pool: Pool, canonicalId: number, currentData: any, newData: HotelData) {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIdx = 1;

    const isGiata = newData.external_source === 'GIATA';

    // 1. Core Fields: Favor GIATA, otherwise update if current is empty
    if (isGiata) {
        if (newData.name) {
            updates.push(`name = $${paramIdx++}`);
            values.push(newData.name);
        }
        if (newData.address) {
            updates.push(`address = $${paramIdx++}`);
            values.push(newData.address);
        }
        if (newData.stars !== undefined && newData.stars > 0) {
            updates.push(`star_rating = $${paramIdx++}`);
            values.push(newData.stars);
        }
    } else {
        // If not GIATA, only update if current is missing/empty
        if (!currentData.name && newData.name) {
            updates.push(`name = $${paramIdx++}`);
            values.push(newData.name);
        }
        if (!currentData.address && newData.address) {
            updates.push(`address = $${paramIdx++}`);
            values.push(newData.address);
        }
        if ((!currentData.star_rating || currentData.star_rating === 0) && newData.stars) {
            updates.push(`star_rating = $${paramIdx++}`);
            values.push(newData.stars);
        }
    }

    // 2. Images: Write to normalized table
    if (newData.images && newData.images.length > 0) {
        await upsertNormalizedImages(pool, canonicalId, newData.images, newData.external_source, newData.external_id);
    }

    // 3. Amenities: Write to normalized table
    if (newData.amenities && newData.amenities.length > 0) {
        await upsertNormalizedAmenities(pool, canonicalId, newData.amenities, newData.external_source);
    }

    // 4. Geocodes: Precision Strategy
    if (!currentData.latitude && newData.latitude) {
        updates.push(`latitude = $${paramIdx++}`);
        values.push(newData.latitude);
    }
    if (!currentData.longitude && newData.longitude) {
        updates.push(`longitude = $${paramIdx++}`);
        values.push(newData.longitude);
    }

    // Update timestamps if we are changing anything
    if (updates.length > 0) {
        values.push(canonicalId);
        await pool.query(`
            UPDATE canonical_hotels 
            SET ${updates.join(', ')}, updated_at = NOW() 
            WHERE id = $${paramIdx}
        `, values);
    }
}
