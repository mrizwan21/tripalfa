import 'dotenv/config';
import LiteAPIClient from '../services/LiteAPIClient.js';
import { staticPrisma } from '../db.js';
import { ISO_COUNTRIES } from '../utils/isoCountries.js';

async function ingestGlobalHotels() {
    console.log('Starting Global Hotel Ingestion (Full LiteAPI Scan)...');
    console.log(`Targeting ${ISO_COUNTRIES.length} Countries.`);

    for (const country of ISO_COUNTRIES) {
        console.log(`\n>>> Processing Country: ${country}`);
        let offset = 0;
        const limit = 1000;
        let keepFetching = true;

        while (keepFetching) {
            try {
                const hotels = await LiteAPIClient.getHotels(country, offset, limit);

                if (!hotels || hotels.length === 0) {
                    keepFetching = false;
                    break;
                }

                console.log(`    fetched ${hotels.length} hotels (offset ${offset})...`);

                let successCount = 0;

                for (const hotel of hotels) {
                    const hotelData = {
                        name: hotel.name,
                        description: hotel.description || '',
                        address: hotel.address || '',
                        city: hotel.city || '',
                        country: hotel.country_code || country,
                        postalCode: hotel.zip || '',
                        latitude: hotel.latitude ? parseFloat(hotel.latitude) : null,
                        longitude: hotel.longitude ? parseFloat(hotel.longitude) : null,
                        starRating: hotel.star_rating ? parseFloat(hotel.star_rating) : null,
                        website: hotel.website || null,
                        phone: hotel.telephone || null,
                        email: hotel.email || null,
                        checkinTime: hotel.checkin ? new Date(`1970-01-01T${hotel.checkin}Z`) : new Date('1970-01-01T14:00:00Z'),
                        checkoutTime: hotel.checkout ? new Date(`1970-01-01T${hotel.checkout}Z`) : new Date('1970-01-01T11:00:00Z'),
                        amenities: hotel.amenities || [],
                        images: hotel.hotel_images || [],     // Capturing ALL images
                        isActive: true,
                        externalId: hotel.id.toString(),
                        externalSource: 'LITEAPI'
                    };

                    await staticPrisma.hotel.create({
                        data: hotelData
                    });
                    successCount++;
                }

                // Console visual progress
                // console.log(`    Synced ${successCount}.`); 

                if (hotels.length < limit) {
                    keepFetching = false;
                } else {
                    offset += limit;
                }

                // Brief pause to avoid rate limits
                await new Promise(resolve => setTimeout(resolve, 100));

            } catch (error) {
                console.error(`    Error in ${country}:`, error);
                keepFetching = false;
            }
        }
    }

    console.log('Global Hotel Ingestion Complete.');
    process.exit(0);
}

ingestGlobalHotels();
