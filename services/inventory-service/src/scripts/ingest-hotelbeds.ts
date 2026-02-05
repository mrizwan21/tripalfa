import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import { staticPrisma } from '../db.js';

const HOTELBEDS_DIR = path.resolve(process.cwd(), 'data', 'hotelbeds');

async function loadFiles(dir: string) {
    try {
        const files = await fs.readdir(dir);
        return files.filter(f => f.includes('-hotels_') && f.endsWith('.json')).map(f => path.join(dir, f));
    } catch (err) {
        console.error('Failed to list hotelbeds files:', err);
        return [];
    }
}

function mapHotel(h: any) {
    const name = h?.name?.content || h?.name || 'Unknown';
    const description = h?.description?.content || '';
    const address = h?.address?.content || '';
    const city = h?.city?.content || '';
    const country = h?.countryCode || '';
    const postalCode = h?.postalCode || '';
    const latitude = h?.coordinates?.latitude ?? null;
    const longitude = h?.coordinates?.longitude ?? null;
    const website = h?.web || null;
    const phone = Array.isArray(h?.phones) && h.phones.length ? h.phones[0].phoneNumber : null;

    const images = Array.isArray(h?.images) ? h.images.map((img: any) => ({ path: img.path, type: img.imageTypeCode })) : [];
    const amenities = h?.facilities || [];

    return {
        name,
        description,
        address,
        city,
        country,
        postalCode,
        latitude: latitude !== undefined && latitude !== null ? Number(latitude) : null,
        longitude: longitude !== undefined && longitude !== null ? Number(longitude) : null,
        website,
        phone,
        checkinTime: new Date('1970-01-01T15:00:00Z'),
        checkoutTime: new Date('1970-01-01T11:00:00Z'),
        amenities,
        images,
        isActive: true,
        externalId: (h.code ?? h.giataCode ?? '').toString(),
        externalSource: 'HOTELBEDS',
        // keep raw payload lightly for later debugging
        policies: { raw: h }
    };
}

async function ingest() {
    console.log('Starting Hotelbeds ingestion...');
    const files = await loadFiles(HOTELBEDS_DIR);
    if (!files.length) {
        console.log('No Hotelbeds hotel files found in', HOTELBEDS_DIR);
        process.exit(0);
    }

    const totalFiles = files.length;
    let imported = 0;

    for (const file of files) {
        console.log(`Processing ${path.basename(file)}...`);
        try {
            const content = await fs.readFile(file, 'utf8');
            const parsed = JSON.parse(content);
            const hotels = parsed.hotels || [];

            console.log(`  file reports total=${parsed.total ?? hotels.length}; processing ${hotels.length} entries`);

            for (const h of hotels) {
                const hotelData = mapHotel(h);

                if (!hotelData.externalId || hotelData.externalId === 'undefined' || hotelData.externalId === '') {
                    // skip malformed
                    continue;
                }

                try {
                    await staticPrisma.hotel.create({
                        data: hotelData
                    });
                    imported++;
                } catch (err) {
                    console.error('    upsert error for', hotelData.externalId, err?.message || err);
                }
            }

        } catch (err) {
            console.error('  failed to parse file', file, err?.message || err);
        }
    }

    console.log(`Hotelbeds ingestion complete. Imported/updated ${imported} hotels from ${totalFiles} files.`);
    process.exit(0);
}

ingest();
