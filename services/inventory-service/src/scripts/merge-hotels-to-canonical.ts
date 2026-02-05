import 'dotenv/config';
import { staticPrisma, staticPool } from '../db.js';
import crypto from 'crypto';
import * as stringSimilarity from 'string-similarity';

type HotelData = {
  name: string;
  address?: string;
  city?: string;
  country?: string;
  country_code?: string | null;
  stars?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  amenities?: string[];
  images?: Array<{ url: string; caption?: string }>;
  external_id: string;
  external_source: string;
};

async function findOrCreateCanonicalHotel(pool: any, hotel: HotelData) {
  const queryParams: any[] = [hotel.city || '', hotel.country || ''];
  let countryFilter = 'country = $2';

  if (hotel.country_code) {
    queryParams.push(hotel.country_code);
    countryFilter = '(country = $2 OR country_code = $3)';
  }

  const existing = await pool.query(
    `SELECT id, name, address, latitude, longitude, star_rating FROM canonical_hotels WHERE city = $1 AND ${countryFilter}`,
    queryParams
  );

  let canonicalId: number | null = null;
  let matchedRow: any = null;

  for (const row of existing.rows) {
    const nameSimilarity = stringSimilarity.compareTwoStrings((hotel.name || '').toLowerCase(), (row.name || '').toLowerCase());
    const addressSimilarity = stringSimilarity.compareTwoStrings((hotel.address || '').toLowerCase(), (row.address || '').toLowerCase());

    if (nameSimilarity > 0.9 || (nameSimilarity > 0.8 && addressSimilarity > 0.8)) {
      canonicalId = row.id;
      matchedRow = row;
      break;
    }
  }

  if (canonicalId && matchedRow) {
    await enrichCanonicalHotel(pool, canonicalId, matchedRow, hotel);
  } else {
    const result = await pool.query(
      `INSERT INTO canonical_hotels (name, address, city, country, country_code, star_rating, latitude, longitude, primary_source, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW(),NOW()) RETURNING id`,
      [hotel.name, hotel.address || '', hotel.city || '', hotel.country || '', hotel.country_code || null, hotel.stars || 0, hotel.latitude || null, hotel.longitude || null, hotel.external_source]
    );
    canonicalId = result.rows[0].id;
  }

  // Insert mapping
  await pool.query(
    `INSERT INTO hotel_supplier_references (canonical_hotel_id, supplier_code, supplier_hotel_id, match_confidence, match_method, raw_data, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,NOW(),NOW())
     ON CONFLICT (supplier_code, supplier_hotel_id) DO UPDATE SET canonical_hotel_id = EXCLUDED.canonical_hotel_id, updated_at = NOW()`,
    [canonicalId, hotel.external_source, hotel.external_id, matchedRow ? 0.95 : 1.0, matchedRow ? 'FUZZY' : 'ORIGINAL', { source: hotel }]
  );

  if (hotel.amenities && hotel.amenities.length) {
    await upsertNormalizedAmenities(pool, canonicalId, hotel.amenities, hotel.external_source);
  }
  if (hotel.images && hotel.images.length) {
    await upsertNormalizedImages(pool, canonicalId, hotel.images, hotel.external_source, hotel.external_id);
  }

  return canonicalId;
}

async function upsertNormalizedAmenities(pool: any, canonicalId: number, amenities: string[], supplier: string) {
  for (const rawName of amenities) {
    if (!rawName) continue;
    const rawNameStr = String(rawName);
    const code = rawNameStr
      .toUpperCase()
      .replace(/\s+/g, '_')
      .replace(/\//g, '_')
      .replace(/-/g, '_')
      .replace(/[^A-Z0-9_]/g, '')
      .substring(0, 255);

    const amenityResult = await pool.query(
      `INSERT INTO amenities (name, code, created_at, updated_at) VALUES ($1,$2,NOW(),NOW()) ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name RETURNING id`,
      [rawName, code]
    );
    const amenityId = amenityResult.rows[0].id;
    await pool.query(
      `INSERT INTO hotel_amenity_instances (canonical_hotel_id, amenity_id, source_supplier, created_at) VALUES ($1,$2,$3,NOW()) ON CONFLICT DO NOTHING`,
      [canonicalId, amenityId, supplier]
    );
  }
}

async function upsertNormalizedImages(pool: any, canonicalId: number, images: any[], supplier: string, externalId: string) {
  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    const url = typeof img === 'string' ? img : img.url || img.path || null;
    if (!url) continue;
    const urlHash = crypto.createHash('md5').update(url).digest('hex');
    await pool.query(
      `INSERT INTO hotel_images (canonical_hotel_id, url, url_hash, caption, is_primary, sort_order, source_supplier, source_id, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW()) ON CONFLICT (canonical_hotel_id, url_hash) DO NOTHING`,
      [canonicalId, url, urlHash, img.caption || null, i === 0, i, supplier, externalId]
    );
  }
}

async function enrichCanonicalHotel(pool: any, canonicalId: number, currentData: any, newData: HotelData) {
  const updates: string[] = [];
  const values: any[] = [];
  let paramIdx = 1;
  const isGiata = newData.external_source === 'GIATA';

  if (isGiata) {
    if (newData.name) { updates.push(`name = $${paramIdx++}`); values.push(newData.name); }
    if (newData.address) { updates.push(`address = $${paramIdx++}`); values.push(newData.address); }
    if (newData.stars !== undefined && newData.stars !== null && newData.stars > 0) { updates.push(`star_rating = $${paramIdx++}`); values.push(newData.stars); }
  } else {
    if (!currentData.name && newData.name) { updates.push(`name = $${paramIdx++}`); values.push(newData.name); }
    if (!currentData.address && newData.address) { updates.push(`address = $${paramIdx++}`); values.push(newData.address); }
    if ((!currentData.star_rating || currentData.star_rating === 0) && newData.stars) { updates.push(`star_rating = $${paramIdx++}`); values.push(newData.stars); }
  }

  if (newData.images && newData.images.length > 0) {
    await upsertNormalizedImages(pool, canonicalId, newData.images, newData.external_source, newData.external_id);
  }
  if (newData.amenities && newData.amenities.length > 0) {
    await upsertNormalizedAmenities(pool, canonicalId, newData.amenities, newData.external_source);
  }

  if (!currentData.latitude && newData.latitude) { updates.push(`latitude = $${paramIdx++}`); values.push(newData.latitude); }
  if (!currentData.longitude && newData.longitude) { updates.push(`longitude = $${paramIdx++}`); values.push(newData.longitude); }

  if (updates.length > 0) {
    values.push(canonicalId);
    await pool.query(
      `UPDATE canonical_hotels SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${paramIdx}`,
      values
    );
  }
}

async function columnExists(pool: any, table: string, column: string) {
  const r = await pool.query(`SELECT 1 FROM information_schema.columns WHERE table_name=$1 AND column_name=$2`, [table, column]);
  return r.rowCount > 0;
}

async function main() {
  console.log('Starting merge of supplier hotels into canonical_hotels...');
  try {
    const hotels = await staticPrisma.hotel.findMany({ where: { isActive: true } });
    console.log(`Found ${hotels.length} supplier hotels to process.`);

    const canUpdateHotels = await columnExists(staticPool, 'hotels', 'canonical_hotel_id');

    let processed = 0;
    let createdCanonical = 0;
    let linked = 0;

    for (const h of hotels) {
      const hotelData: HotelData = {
        name: h.name || 'Unknown',
        address: h.address || undefined,
        city: h.city || undefined,
        country: h.country || undefined,
        country_code: null,
        stars: null,
        latitude: h.latitude ? Number(h.latitude) : null,
        longitude: h.longitude ? Number(h.longitude) : null,
        amenities: Array.isArray(h.amenities) ? (h.amenities as any[]).filter(item => typeof item === 'string') : [],
        images: Array.isArray(h.images) ? h.images.map((i: any) => ({ url: i.path || i.url || i })) : [],
        external_id: '',
        external_source: ''
      };

      const canonicalId = await findOrCreateCanonicalHotel(staticPool, hotelData);
      if (canonicalId) {
        processed++;
        // If hotels table supports linking, update it
        if (canUpdateHotels) {
          await staticPool.query(`UPDATE hotels SET canonical_hotel_id = $1 WHERE external_id = $2 AND external_source = $3`, [canonicalId, hotelData.external_id, hotelData.external_source]);
          linked++;
        } else {
          createdCanonical++;
        }
      }
    }

    console.log(`Merge complete. Processed: ${processed}, linked(updated hotels): ${linked}, canonicalCreatedOrEnriched: ${createdCanonical}`);
  } catch (err) {
    console.error('Merge failed:', err?.message || err);
    process.exitCode = 2;
  } finally {
    await staticPrisma.$disconnect();
    await staticPool.end();
  }
}

main();
