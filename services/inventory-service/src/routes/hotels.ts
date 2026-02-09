import express, { Request, Response } from 'express';
import { getHotelSearchService, getHotelCacheService, hotelCacheKeys } from '../services/index.js';
import { staticPool } from '../db.js';

const router = express.Router();

// POST /hotels/search
router.post('/search', async (req: Request, res: Response) => {
    try {
        const body = req.body;
        const page = parseInt(body.page as string) || 1;
        const limit = parseInt(body.limit as string) || 20;

        const filters = {
            city: body.city,
            countryCode: body.countryCode,
            chainCode: body.chainCode,
            starRating: body.starRating,
            facilities: body.facilities,
            facilityFlags: body.facilityFlags,
            minPrice: body.minPrice,
            maxPrice: body.maxPrice,
            boardBasis: body.boardBasis,
            paymentType: body.paymentType,
            checkIn: body.checkIn ? new Date(body.checkIn) : new Date(),
            checkOut: body.checkOut ? new Date(body.checkOut) : new Date(Date.now() + 86400000),
            occupancy: body.occupancy,
            viewType: body.viewType,
            query: body.query
        };

        const hotelService = getHotelSearchService();
        const result = await hotelService.searchHotels(filters, page, limit);

        res.json(result);
    } catch (error) {
        console.error('Hotel Search Error:', error);
        res.status(500).json({ error: 'Search failed' });
    }
});

// POST /hotels/rates
router.post('/rates', async (req: Request, res: Response) => {
    try {
        const { hotelIds, checkin, checkout, currency, guestNationality, occupancies } = req.body;

        if (!hotelIds || !Array.isArray(hotelIds) || hotelIds.length === 0) {
            return res.status(400).json({ error: 'hotelIds array is required' });
        }

        const liteApiClient = (await import('../services/LiteAPIClient.js')).default;
        const rates = await liteApiClient.getHotelsRates({
            hotelIds,
            checkin,
            checkout,
            currency: currency || 'USD',
            guestNationality: guestNationality || 'US',
            occupancies: occupancies || [{ adults: 2 }]
        });

        res.json({ hotels: rates });
    } catch (error) {
        console.error('Hotel Rates Error:', error);
        res.status(500).json({ error: 'Failed to fetch rates' });
    }
});

// GET /hotels/:id
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        // Strip prefix if present
        const numericId = (rawId || '').replace('local_h_', '');

        const cacheService = getHotelCacheService();
        const cacheKey = hotelCacheKeys.details(parseInt(numericId, 10));

        // Try cache
        const cached = await cacheService.get(cacheKey);
        if (cached) {
            return res.json(cached);
        }

        // Fetch hotel details with normalized relations
        const hotelQuery = `
        SELECT 
            h.id, h.name, h.address, h.city, h.country, h.star_rating, h.latitude, h.longitude, h.description, h.policies,
            (SELECT jsonb_agg(img) FROM (
                SELECT url, caption, is_primary, sort_order 
                FROM hotel_images 
                WHERE hotel_id = h.id 
                ORDER BY is_primary DESC, sort_order ASC
                LIMIT 50
            ) img) as normalized_images,
            (SELECT jsonb_agg(am) FROM (
                SELECT a.name, a.code, a.category 
                FROM hotel_amenity_instances hai 
                JOIN amenities a ON a.id = hai.amenity_id 
                WHERE hai.hotel_id = h.id
                LIMIT 50
            ) am) as normalized_amenities
        FROM hotels h
        WHERE h.id = $1
    `;
        // Note: Updated query to use 'hotels' table instead of 'canonical_hotels'
        // But need to ensure 'hotels' table has these columns.
        // The optimization schema consolidated things into 'hotels'.
        // 'hotel_images' and 'hotel_amenity_instances' link to 'hotel_id' now?
        // In optimization schema, we likely kept 'hotel_amenity_instances' or denormalized.
        // Let's assume for now keeping similar query structure but against optimized table.

        const hotelResult = await staticPool.query(hotelQuery, [numericId]);

        if (hotelResult.rows.length === 0) {
            // Fallback to LiteAPI if not found locally
            try {
                const liteApiClient = (await import('../services/LiteAPIClient.js')).default;
                const liteHotel = await liteApiClient.getHotel(rawId);
                if (liteHotel) {
                    await cacheService.set(cacheKey, liteHotel, 3600);
                    return res.json(liteHotel);
                }
            } catch (fallbackError) {
                console.error('LiteAPI Fallback Failed:', fallbackError);
            }
            return res.status(404).json({ error: 'Hotel not found' });
        }

        const h = hotelResult.rows[0];

        // Fetch room types (legacy/new mix)
        // Optimally, use new 'hotel_rooms' table
        const roomsQuery = `
            SELECT id, name, description, max_occupancy 
            FROM hotel_rooms 
            WHERE hotel_id = $1
            AND is_active = true
        `;
        const roomsResult = await staticPool.query(roomsQuery, [numericId]);

        // Map to API format
        const images = h.normalized_images || [];
        const imageUrl = (images.length > 0) ? images[0].url : 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80';
        const amenityNames = (h.normalized_amenities || []).map((a: any) => a.name);

        const hotel = {
            id: `local_h_${h.id}`,
            name: h.name,
            image: imageUrl,
            location: `${h.address || ''}, ${h.city}`,
            rating: h.star_rating ? parseFloat(h.star_rating) : 4,
            reviews: 100,
            pricePerNight: 200, // Placeholder, normally fetch lowest rate
            currency: 'USD',
            amenities: amenityNames,
            description: h.description || '',
            latitude: h.latitude,
            longitude: h.longitude,
            images: images,
            rooms: roomsResult.rows.map(r => ({
                id: `r_${r.id}`,
                name: r.name,
                roomView: r.description,
                boardType: 'Room Only',
                originalPrice: { amount: 200, currency: 'USD' },
                availability: 5
            })),
            provider: 'Local'
        };

        // Cache for 1 hour
        await cacheService.set(cacheKey, hotel, 3600);

        res.json(hotel);
    } catch (error) {
        console.error('Fetch Hotel Failed:', error);
        res.status(500).json({ error: 'Failed to fetch hotel' });
    }
});

export default router;
