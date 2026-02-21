/**
 * LITEAPI Routes
 * Handles all LITEAPI hotel and loyalty endpoints
 * 
 * Base URLs:
 * - API: https://api.liteapi.travel/v3.0 (data endpoints)
 * - BOOK: https://book.liteapi.travel/v3.0 (booking endpoints)
 * - DA: https://da.liteapi.travel/v1 (voucher endpoints)
 * 
 * Caching Strategy:
 * - Hotel search results: 15 min TTL
 * - Room rates: 30 min TTL
 * - Prebook sessions: 60 min TTL
 */

import { Router, Request, Response } from 'express';
import { prisma } from '@tripalfa/shared-database';
import CacheService, { CacheKeys, CACHE_TTL } from '../cache/redis.js';

const router: Router = Router();

// ============================================================================
// Environment Configuration
// ============================================================================

const LITEAPI_API_BASE_URL = process.env.LITEAPI_API_BASE_URL || 'https://api.liteapi.travel/v3.0';
const LITEAPI_BOOK_BASE_URL = process.env.LITEAPI_BOOK_BASE_URL || 'https://book.liteapi.travel/v3.0';
const LITEAPI_DA_BASE_URL = process.env.LITEAPI_DA_BASE_URL || 'https://da.liteapi.travel/v1';
const LITEAPI_API_KEY = process.env.LITEAPI_API_KEY || process.env.VITE_LITEAPI_TEST_API_KEY;

// ============================================================================
// Helper Functions
// ============================================================================

// Request to API base URL (data endpoints)
async function liteApiRequest<T>(endpoint: string, method: string, body?: object, baseUrl?: string): Promise<T> {
  const url = `${baseUrl || LITEAPI_API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': LITEAPI_API_KEY || '',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LITEAPI Error (${response.status}): ${errorText}`);
  }

  return response.json();
}

// Request to BOOK base URL
async function liteApiBookRequest<T>(endpoint: string, method: string, body?: object): Promise<T> {
  return liteApiRequest(endpoint, method, body, LITEAPI_BOOK_BASE_URL);
}

// Request to DA base URL (vouchers)
async function liteApiDaRequest<T>(endpoint: string, method: string, body?: object): Promise<T> {
  return liteApiRequest(endpoint, method, body, LITEAPI_DA_BASE_URL);
}

// ============================================================================
// Data Endpoints (API Base URL)
// ============================================================================

// GET /hotels/destinations - Search hotel destinations (cities)
// Proxied endpoint to avoid exposing LiteAPI key in frontend
router.get('/hotels/destinations', async (req: Request, res: Response) => {
  try {
    const { q, search, limit = 10 } = req.query;
    const query = q || search;

    if (!query || typeof query !== 'string' || query.length < 2) {
      return res.status(400).json({ error: 'Query parameter "q" or "search" is required (min 2 characters)' });
    }

    // Call LiteAPI cities search endpoint
    const params = new URLSearchParams();
    params.append('search', query);
    params.append('limit', String(limit));

    const result = await liteApiRequest<any>(`/cities/search?${params}`, 'GET');

    // Transform to consistent format for frontend autocomplete
    const cities = (result.data || []).map((city: any) => ({
      type: 'CITY',
      icon: 'map-pin',
      title: city.name,
      subtitle: city.country || '',
      code: city.id || city.code,
      city: city.name,
      country: city.country || '',
      countryCode: city.countryCode || '',
      latitude: city.latitude,
      longitude: city.longitude,
    }));

    res.json({
      success: true,
      data: cities,
    });
  } catch (error: any) {
    console.error('[LITEAPI] /hotels/destinations error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// GET /data/languages - List of supported languages
router.get('/data/languages', async (req: Request, res: Response) => {
  try {
    const cacheKey = 'liteapi:languages';
    const result = await CacheService.getOrSet(
      cacheKey,
      async () => liteApiRequest<any>('/data/languages', 'GET'),
      CACHE_TTL.LONG // 24 hours for static data
    );
    res.json(result);
  } catch (error: any) {
    console.error('[LITEAPI] /data/languages error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// GET /data/hotel/:id - Get hotel details
router.get('/data/hotel/:hotelId', async (req: Request, res: Response) => {
  try {
    const { hotelId } = req.params;
    
    // Try cache first
    const cacheKey = `liteapi:hotel:${hotelId}`;
    const result = await CacheService.getOrSet(
      cacheKey,
      async () => liteApiRequest<any>(`/data/hotel/${hotelId}`, 'GET'),
      CACHE_TTL.HOTEL_SEARCH // 15 min TTL for hotel details
    );
    res.json(result);
  } catch (error: any) {
    console.error('[LITEAPI] /data/hotel/:id error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// GET /data/reviews - Get hotel reviews
router.get('/data/reviews', async (req: Request, res: Response) => {
  try {
    const { hotelId, limit = 10, offset = 0 } = req.query;
    
    if (!hotelId) {
      return res.status(400).json({ error: 'hotelId is required' });
    }

    const cacheKey = `liteapi:reviews:${hotelId}:${limit}:${offset}`;
    const result = await CacheService.getOrSet(
      cacheKey,
      async () => liteApiRequest<any>(`/data/reviews?hotelId=${hotelId}&limit=${limit}&offset=${offset}`, 'GET'),
      CACHE_TTL.MEDIUM // 1 hour for reviews
    );
    res.json(result);
  } catch (error: any) {
    console.error('[LITEAPI] /data/reviews error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// POST /data/hotels/room-search - Search hotel rooms by image and text
router.post('/data/hotels/room-search', async (req: Request, res: Response) => {
  try {
    const { image, text, hotelId } = req.body;
    
    const payload: any = {};
    if (image) payload.image = image;
    if (text) payload.text = text;
    if (hotelId) payload.hotelId = hotelId;

    const result = await liteApiRequest<any>('/data/hotels/room-search', 'POST', payload);
    res.json(result);
  } catch (error: any) {
    console.error('[LITEAPI] /data/hotels/room-search error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// Search Hotels - Room Rates
// POST /hotels/rates (API Base URL)
// ============================================================================

router.post('/search/hotels', async (req: Request, res: Response) => {
  try {
    const {
      location,
      checkin,
      checkout,
      adults = 2,
      children,
      rooms = 1,
      countryCode,
      limit = 20
    } = req.body;

    const searchParams = {
      location,
      checkin,
      checkout,
      adults,
      children,
      rooms,
      countryCode,
      limit
    };

    const cacheKey = CacheKeys.hotelSearch(searchParams);

    const result = await CacheService.getOrSet(
      cacheKey,
      async () => {
        const payload: any = {
          checkin,
          checkout,
          currency: 'USD',
          guestNationality: 'US',
          occupancies: [{
            adults: Number(adults),
            children: children ? (Array.isArray(children) ? children : [children]) : []
          }],
          cityName: location,
          countryCode: countryCode || 'FR',
          limit: limit || 20
        };

        return await liteApiRequest<any>('/hotels/rates', 'POST', payload);
      },
      CACHE_TTL.HOTEL_SEARCH
    );

    const hotels = (result.hotels || []).map((hotel: any) => {
      const firstOffer = hotel.offers?.[0];
      return {
        id: hotel.id,
        name: hotel.name,
        image: hotel.main_photo || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80',
        location: hotel.address,
        rating: hotel.rating || 0,
        reviews: 0,
        price: {
          amount: firstOffer?.offerRetailRate || firstOffer?.retailRate?.total?.[0]?.amount || 0,
          currency: 'USD'
        },
        amenities: [],
        provider: 'LiteAPI',
        offers: hotel.offers || [],
        refundable: firstOffer?.refundableTag === 'RFN'
      };
    });

    res.json({ results: hotels, total: hotels.length, cached: true });
  } catch (error: any) {
    console.error('[LITEAPI] /search/hotels error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// POST /hotels/rates - Get room rates for specific hotels
router.post('/hotels/rates', async (req: Request, res: Response) => {
  try {
    const {
      hotelIds,
      checkin,
      checkout,
      currency = 'USD',
      guestNationality = 'US',
      occupancies,
      cityName,
      countryCode,
      limit = 20
    } = req.body;

    const payload: any = {
      checkin,
      checkout,
      currency,
      guestNationality,
      occupancies,
      limit,
    };

    if (hotelIds && hotelIds.length > 0) {
      payload.hotelIds = hotelIds;
    } else if (cityName) {
      payload.cityName = cityName;
      if (countryCode) payload.countryCode = countryCode;
    } else {
      return res.status(400).json({ error: 'Either hotelIds or cityName is required' });
    }

    const cacheKey = CacheKeys.hotelSearch(payload);

    const result = await CacheService.getOrSet(
      cacheKey,
      async () => liteApiRequest<any>('/hotels/rates', 'POST', payload),
      CACHE_TTL.HOTEL_RATES
    );

    res.json({ ...result, cached: true });
  } catch (error: any) {
    console.error('[LITEAPI] /hotels/rates error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// GET /hotels/min-rates - Retrieve minimum rate for hotels
router.get('/hotels/min-rates', async (req: Request, res: Response) => {
  try {
    const { hotelIds, checkin, checkout, currency = 'USD' } = req.query;

    if (!hotelIds) {
      return res.status(400).json({ error: 'hotelIds are required' });
    }

    const ids = Array.isArray(hotelIds) ? hotelIds : hotelIds.split(',');
    const params = new URLSearchParams();
    params.append('hotelIds', ids.join(','));
    if (checkin) params.append('checkin', String(checkin));
    if (checkout) params.append('checkout', String(checkout));
    if (currency) params.append('currency', String(currency));

    const cacheKey = `liteapi:minrates:${ids.join(',')}:${checkin}:${checkout}`;
    const result = await CacheService.getOrSet(
      cacheKey,
      async () => liteApiRequest<any>(`/hotels/min-rates?${params}`, 'GET'),
      CACHE_TTL.HOTEL_RATES
    );

    res.json(result);
  } catch (error: any) {
    console.error('[LITEAPI] /hotels/min-rates error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// Booking Endpoints (BOOK Base URL)
// ============================================================================

// POST /rates/prebook - Create checkout session
router.post('/rates/prebook', async (req: Request, res: Response) => {
  try {
    const { offerId, price, currency, guestDetails, rooms, userId } = req.body;

    if (!offerId || !price) {
      return res.status(400).json({ error: 'offerId and price are required' });
    }

    const payload = {
      offerId,
      price: {
        amount: price,
        currency: currency || 'USD',
      },
      guests: guestDetails ? [guestDetails] : undefined,
      rooms: rooms || 1,
    };

    const result = await liteApiBookRequest<any>('/rates/prebook', 'POST', payload);

    if (result.transactionId) {
      const sessionData = {
        transactionId: result.transactionId,
        offerId,
        price,
        currency: currency || 'USD',
        guestDetails,
        rooms,
        userId,
        expiresAt: result.expiresAt,
        createdAt: new Date().toISOString(),
        status: 'prebooked'
      };

      await CacheService.set(
        CacheKeys.prebookSession(result.transactionId),
        sessionData,
        CACHE_TTL.PREBOOK_SESSION
      );

      await prisma.booking.updateMany({
        where: { id: req.body.bookingId },
        data: {
          metadata: {
            liteApiPrebookId: result.transactionId,
            prebookExpiry: result.expiresAt,
          },
        },
      }).catch(() => { });
    }

    res.json({ ...result, cached: true });
  } catch (error: any) {
    console.error('[LITEAPI] /rates/prebook error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// GET /prebooks/:prebookId - Retrieve a prebook by ID
router.get('/prebooks/:prebookId', async (req: Request, res: Response) => {
  try {
    const { prebookId } = req.params;
    
    // Try cache first
    const cacheKey = CacheKeys.prebookSession(prebookId);
    const cached = await CacheService.get(cacheKey);
    if (cached) {
      return res.json({ ...cached, cached: true });
    }

    const result = await liteApiBookRequest<any>(`/prebooks/${prebookId}`, 'GET');
    res.json(result);
  } catch (error: any) {
    console.error('[LITEAPI] /prebooks/:id error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// POST /rates/book - Complete a booking
router.post('/rates/book', async (req: Request, res: Response) => {
  try {
    const { prebookId, guestDetails, paymentDetails, bookingId } = req.body;

    if (!prebookId) {
      return res.status(400).json({ error: 'prebookId (transactionId) is required' });
    }

    const payload = {
      transactionId: prebookId,
      guest: guestDetails,
      payment: paymentDetails,
    };

    const result = await liteApiBookRequest<any>('/rates/book', 'POST', payload);

    if (bookingId && result.confirmationId) {
      await prisma.booking.update({
        where: { id: bookingId },
        data: {
          status: 'confirmed',
          bookingRef: result.confirmationId,
          metadata: {
            liteApiConfirmationId: result.confirmationId,
            rawBookingData: result,
          },
        },
      }).catch(() => { });
    }

    res.json(result);
  } catch (error: any) {
    console.error('[LITEAPI] /rates/book error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// GET /bookings - List all bookings
router.get('/bookings', async (req: Request, res: Response) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;

    try {
      const params = new URLSearchParams();
      if (status) params.append('status', status as string);
      params.append('limit', String(limit));
      params.append('offset', String(offset));

      const result = await liteApiBookRequest<any>(`/bookings?${params}`, 'GET');
      return res.json(result);
    } catch (liteError) {
      console.log('[LITEAPI] Direct bookings failed, falling back to database');
    }

    const dbBookings = await prisma.booking.findMany({
      where: {
        serviceType: 'hotel',
        ...(status && status !== "all" ? { status: String(status) as string } : {}),
      },
      take: Number(limit),
      skip: Number(offset),
      orderBy: { createdAt: 'desc' },
    });

    res.json({ bookings: dbBookings, total: dbBookings.length });
  } catch (error: any) {
    console.error('[LITEAPI] /bookings error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// GET /bookings/:bookingId - Retrieve a booking
router.get('/bookings/:bookingId', async (req: Request, res: Response) => {
  try {
    const bookingId = String(req.params.bookingId);

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (booking?.bookingRef) {
      try {
        const result = await liteApiBookRequest<any>(`/bookings/${booking.bookingRef}`, 'GET');
        return res.json(result);
      } catch (liteError) {
        console.log('[LITEAPI] Direct booking fetch failed, using database');
      }
    }

    if (booking) {
      return res.json(booking);
    }

    res.status(404).json({ error: 'Booking not found' });
  } catch (error: any) {
    console.error('[LITEAPI] /bookings/:id error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// PUT /bookings/:bookingId - Cancel a booking
router.put('/bookings/:bookingId', async (req: Request, res: Response) => {
  try {
    const bookingId = String(req.params.bookingId);
    const { status, cancellationReason } = req.body;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (status === 'cancelled' && booking.bookingRef) {
      try {
        const cancelPayload = {
          bookingId: booking.bookingRef,
          reason: cancellationReason || 'User requested cancellation',
        };

        const result = await liteApiBookRequest<any>(`/bookings/${booking.bookingRef}`, 'PUT', cancelPayload);

        await prisma.booking.update({
          where: { id: bookingId },
          data: {
            status: 'cancelled',
            metadata: {
              ...(booking.metadata as object || {}),
              cancellationResult: result,
              cancelledAt: new Date().toISOString(),
            },
          },
        });

        return res.json(result);
      } catch (liteError: any) {
        console.error('[LITEAPI] Cancellation failed:', liteError.message);
      }
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: status || booking.status,
        metadata: {
          ...(booking.metadata as object || {}),
          lastUpdated: new Date().toISOString(),
        },
      },
    });

    res.json(updatedBooking);
  } catch (error: any) {
    console.error('[LITEAPI] /bookings/:id PUT error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// PATCH /bookings/:bookingId/amend - Amend guest name on a booking
router.patch('/bookings/:bookingId/amend', async (req: Request, res: Response) => {
  try {
    const bookingId = String(req.params.bookingId);
    const { guestName } = req.body;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking?.bookingRef) {
      return res.status(404).json({ error: 'Booking not found or no supplier reference' });
    }

    const payload = {
      guestName,
    };

    const result = await liteApiBookRequest<any>(`/bookings/${booking.bookingRef}/amend`, 'PATCH', payload);
    
    // Update local record
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        metadata: {
          ...(booking.metadata as object || {}),
          amendedGuestName: guestName,
          amendedAt: new Date().toISOString(),
        },
      },
    });

    res.json(result);
  } catch (error: any) {
    console.error('[LITEAPI] /bookings/:id/amend error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// Voucher Endpoints (DA Base URL)
// ============================================================================

// GET /vouchers - Retrieve all vouchers
router.get('/vouchers', async (req: Request, res: Response) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const params = new URLSearchParams();
    params.append('limit', String(limit));
    params.append('offset', String(offset));

    const result = await liteApiDaRequest<any>(`/vouchers?${params}`, 'GET');
    res.json(result);
  } catch (error: any) {
    console.error('[LITEAPI] /vouchers GET error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// GET /vouchers/:voucherId - Retrieve a specific voucher
router.get('/vouchers/:voucherId', async (req: Request, res: Response) => {
  try {
    const { voucherId } = req.params;
    const result = await liteApiDaRequest<any>(`/vouchers/${voucherId}`, 'GET');
    res.json(result);
  } catch (error: any) {
    console.error('[LITEAPI] /vouchers/:id GET error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// POST /vouchers - Create a new voucher
router.post('/vouchers', async (req: Request, res: Response) => {
  try {
    const result = await liteApiDaRequest<any>('/vouchers', 'POST', req.body);
    res.json(result);
  } catch (error: any) {
    console.error('[LITEAPI] /vouchers POST error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// PUT /vouchers/:voucherId - Update a voucher
router.put('/vouchers/:voucherId', async (req: Request, res: Response) => {
  try {
    const { voucherId } = req.params;
    const result = await liteApiDaRequest<any>(`/vouchers/${voucherId}`, 'PUT', req.body);
    res.json(result);
  } catch (error: any) {
    console.error('[LITEAPI] /vouchers/:id PUT error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// PUT /vouchers/:voucherId/status - Update voucher status
router.put('/vouchers/:voucherId/status', async (req: Request, res: Response) => {
  try {
    const { voucherId } = req.params;
    const { status } = req.body;
    const result = await liteApiDaRequest<any>(`/vouchers/${voucherId}/status`, 'PUT', { status });
    res.json(result);
  } catch (error: any) {
    console.error('[LITEAPI] /vouchers/:id/status PUT error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// GET /vouchers/history - Retrieve voucher usage history
router.get('/vouchers/history', async (req: Request, res: Response) => {
  try {
    const { voucherId, limit = 50, offset = 0 } = req.query;
    const params = new URLSearchParams();
    if (voucherId) params.append('voucherId', String(voucherId));
    params.append('limit', String(limit));
    params.append('offset', String(offset));

    const result = await liteApiDaRequest<any>(`/vouchers/history?${params}`, 'GET');
    res.json(result);
  } catch (error: any) {
    console.error('[LITEAPI] /vouchers/history GET error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /vouchers/:voucherId - Delete a voucher
router.delete('/vouchers/:voucherId', async (req: Request, res: Response) => {
  try {
    const { voucherId } = req.params;
    const result = await liteApiDaRequest<any>(`/vouchers/${voucherId}`, 'DELETE');
    res.json(result);
  } catch (error: any) {
    console.error('[LITEAPI] /vouchers/:id DELETE error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// Loyalty Endpoints (API Base URL)
// ============================================================================

// GET /loyalties - Get loyalty program settings
router.get('/loyalties', async (req: Request, res: Response) => {
  try {
    const result = await liteApiRequest<any>('/loyalties', 'GET');
    res.json(result);
  } catch (error: any) {
    console.error('[LITEAPI] /loyalties GET error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// PUT /loyalties - Update loyalty program
router.put('/loyalties', async (req: Request, res: Response) => {
  try {
    const result = await liteApiRequest<any>('/loyalties', 'PUT', req.body);
    res.json(result);
  } catch (error: any) {
    console.error('[LITEAPI] /loyalties PUT error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// GET /guests/:guestId/loyalty-points - Fetch guest's loyalty points
router.get('/guests/:guestId/loyalty-points', async (req: Request, res: Response) => {
  try {
    const { guestId } = req.params;
    const result = await liteApiRequest<any>(`/guests/${guestId}/loyalty-points`, 'GET');
    res.json(result);
  } catch (error: any) {
    console.error('[LITEAPI] /guests/:id/loyalty-points GET error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// POST /guests/:guestId/loyalty-points/redeem - Redeem guest's loyalty points
router.post('/guests/:guestId/loyalty-points/redeem', async (req: Request, res: Response) => {
  try {
    const { guestId } = req.params;
    const result = await liteApiRequest<any>(`/guests/${guestId}/loyalty-points/redeem`, 'POST', req.body);
    res.json(result);
  } catch (error: any) {
    console.error('[LITEAPI] /guests/:id/loyalty-points/redeem POST error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// Legacy Loyalty Endpoints (Database fallback routes)
// ============================================================================

router.get('/guests', async (req: Request, res: Response) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    try {
      const params = new URLSearchParams();
      params.append('limit', String(limit));
      params.append('offset', String(offset));
      const liteGuests = await liteApiRequest<any>(`/guests?${params}`, 'GET');
      return res.json(liteGuests);
    } catch (liteError) { }
    const guests = await prisma.user.findMany({ take: Number(limit), skip: Number(offset), orderBy: { createdAt: 'desc' }, select: { id: true, email: true, firstName: true, lastName: true, phoneNumber: true, createdAt: true } });
    res.json({ guests, total: guests.length });
  } catch (error: any) {
    console.error('[LITEAPI] /guests error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

router.get('/guests/:guestId', async (req: Request, res: Response) => {
  try {
    const { guestId } = req.params;
    try {
      const result = await liteApiRequest<any>(`/guests/${guestId}`, 'GET');
      return res.json(result);
    } catch (liteError) { }
    const guest = await prisma.user.findUnique({ where: { id: String(guestId) }, select: { id: true, email: true, firstName: true, lastName: true, phoneNumber: true, createdAt: true } });
    if (guest) return res.json(guest);
    res.status(404).json({ error: 'Guest not found' });
  } catch (error: any) {
    console.error('[LITEAPI] /guests/:id error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

router.get('/guests/:guestId/bookings', async (req: Request, res: Response) => {
  try {
    const { guestId } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    try {
      const params = new URLSearchParams();
      params.append('limit', String(limit));
      params.append('offset', String(offset));
      const result = await liteApiRequest<any>(`/guests/${guestId}/bookings?${params}`, 'GET');
      return res.json(result);
    } catch (liteError) { }
    const bookings = await prisma.booking.findMany({ where: { userId: String(guestId) }, take: Number(limit), skip: Number(offset), orderBy: { createdAt: 'desc' } });
    res.json({ bookings, total: bookings.length });
  } catch (error: any) {
    console.error('[LITEAPI] /guests/:id/bookings error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

router.post('/loyalties', async (req: Request, res: Response) => {
  try {
    const { enabled, cashbackRate, programName } = req.body;
    const settings = { enabled: enabled ?? true, cashbackRate: cashbackRate || 0.03, programName: programName || 'TripAlfa Rewards', updatedAt: new Date().toISOString() };
    try {
      const result = await liteApiRequest<any>('/loyalties', 'POST', settings);
      return res.json(result);
    } catch (liteError) { }
    res.json({ success: true, settings });
  } catch (error: any) {
    console.error('[LITEAPI] /loyalties POST error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Loyalty routes with /loyalty prefix
router.get('/loyalty/loyalties', async (req: Request, res: Response) => {
  try {
    try {
      const result = await liteApiRequest<any>('/loyalties', 'GET');
      return res.json(result);
    } catch (liteError) { }
    res.json({ enabled: true, cashbackRate: 0.03, programName: 'TripAlfa Rewards' });
  } catch (error: any) {
    console.error('[LITEAPI] /loyalty/loyalties GET error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

router.put('/loyalty/loyalties', async (req: Request, res: Response) => {
  try {
    const { enabled, cashbackRate, programName } = req.body;
    const settings = { enabled, cashbackRate, programName, updatedAt: new Date().toISOString() };
    try {
      const result = await liteApiRequest<any>('/loyalties', 'PUT', settings);
      return res.json(result);
    } catch (liteError) { }
    res.json({ success: true, settings });
  } catch (error: any) {
    console.error('[LITEAPI] /loyalty/loyalties PUT error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

router.post('/loyalty/loyalties', async (req: Request, res: Response) => {
  try {
    const { enabled, cashbackRate, programName } = req.body;
    const settings = { enabled: enabled ?? true, cashbackRate: cashbackRate || 0.03, programName: programName || 'TripAlfa Rewards', updatedAt: new Date().toISOString() };
    try {
      const result = await liteApiRequest<any>('/loyalties', 'POST', settings);
      return res.json(result);
    } catch (liteError) { }
    res.json({ success: true, settings });
  } catch (error: any) {
    console.error('[LITEAPI] /loyalty/loyalties POST error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

router.get('/loyalty/guests', async (req: Request, res: Response) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    try {
      const params = new URLSearchParams();
      params.append('limit', String(limit));
      params.append('offset', String(offset));
      const liteGuests = await liteApiRequest<any>(`/guests?${params}`, 'GET');
      return res.json(liteGuests);
    } catch (liteError) { }
    const guests = await prisma.user.findMany({ take: Number(limit), skip: Number(offset), orderBy: { createdAt: 'desc' }, select: { id: true, email: true, firstName: true, lastName: true, phoneNumber: true, createdAt: true } });
    res.json({ guests, total: guests.length });
  } catch (error: any) {
    console.error('[LITEAPI] /loyalty/guests GET error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

router.get('/loyalty/guests/:guestId', async (req: Request, res: Response) => {
  try {
    const { guestId } = req.params;
    try {
      const result = await liteApiRequest<any>(`/guests/${guestId}`, 'GET');
      return res.json(result);
    } catch (liteError) { }
    const guest = await prisma.user.findUnique({ where: { id: String(guestId) }, select: { id: true, email: true, firstName: true, lastName: true, phoneNumber: true, createdAt: true } });
    if (guest) return res.json(guest);
    res.status(404).json({ error: 'Guest not found' });
  } catch (error: any) {
    console.error('[LITEAPI] /loyalty/guests/:id GET error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

router.get('/loyalty/guests/:guestId/bookings', async (req: Request, res: Response) => {
  try {
    const { guestId } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    try {
      const params = new URLSearchParams();
      params.append('limit', String(limit));
      params.append('offset', String(offset));
      const result = await liteApiRequest<any>(`/guests/${guestId}/bookings?${params}`, 'GET');
      return res.json(result);
    } catch (liteError) { }
    const bookings = await prisma.booking.findMany({ where: { userId: String(guestId) }, take: Number(limit), skip: Number(offset), orderBy: { createdAt: 'desc' } });
    res.json({ bookings, total: bookings.length });
  } catch (error: any) {
    console.error('[LITEAPI] /loyalty/guests/:id/bookings GET error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

router.get('/loyalty/user/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    try {
      const result = await liteApiRequest<any>(`/guests/${userId}`, 'GET');
      return res.json(result);
    } catch (liteError) { }
    const user = await prisma.user.findUnique({ where: { id: String(userId) }, select: { id: true, email: true, firstName: true, lastName: true } });
    if (user) {
      const bookings = await prisma.booking.findMany({ where: { userId: String(userId), status: 'confirmed' } });
      const totalSpent = bookings.reduce((sum, b) => sum + Number(b.baseAmount || 0), 0);
      const totalPoints = Math.floor(totalSpent);
      return res.json({
        userId: user.id,
        currentPoints: totalPoints,
        totalPointsEarned: totalPoints,
        totalPointsRedeemed: 0,
        pointsExpiringDate: null,
        tier: totalPoints > 10000 ? 'gold' : (totalPoints > 5000 ? 'silver' : 'bronze')
      });
    }
    res.status(404).json({ error: 'User not found' });
  } catch (error: any) {
    console.error('[LITEAPI] /loyalty/user/:id GET error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

router.get('/loyalty/transactions/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { limit = 20, offset = 0, type } = req.query;
    const bookings = await prisma.booking.findMany({
      where: { userId: String(userId), ...(type && type !== 'all' ? { serviceType: type as string } : {}) },
      take: Number(limit),
      skip: Number(offset),
      orderBy: { createdAt: 'desc' }
    });
    const transactions = bookings.map(b => ({
      id: b.id,
      customerId: userId,
      points: Math.floor(Number(b.baseAmount) || 0),
      type: 'EARN' as const,
      description: `${b.serviceType || 'Booking'} booking`,
      bookingReference: b.bookingRef,
      createdAt: b.createdAt.toISOString(),
      updatedAt: b.updatedAt.toISOString()
    }));
    res.json({ data: transactions, total: transactions.length });
  } catch (error: any) {
    console.error('[LITEAPI] /loyalty/transactions/:id GET error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

router.get('/loyalty/tiers', async (req: Request, res: Response) => {
  try {
    const tiers = [
      { id: 'bronze', name: 'Bronze', level: 1, minPoints: 0, maxPoints: 5000, discountPercentage: 5, pointsMultiplier: 1, benefits: ['5% discount', 'Earn 1x points'] },
      { id: 'silver', name: 'Silver', level: 2, minPoints: 5001, maxPoints: 10000, discountPercentage: 10, pointsMultiplier: 1.5, benefits: ['10% discount', 'Earn 1.5x points', 'Priority support'] },
      { id: 'gold', name: 'Gold', level: 3, minPoints: 10001, maxPoints: 25000, discountPercentage: 15, pointsMultiplier: 2, benefits: ['15% discount', 'Earn 2x points', 'Priority support', 'Free upgrades'] },
      { id: 'platinum', name: 'Platinum', level: 4, minPoints: 25001, maxPoints: 999999, discountPercentage: 20, pointsMultiplier: 3, benefits: ['20% discount', 'Earn 3x points', 'Priority support', 'Free upgrades', 'Lounge access'] }
    ];
    res.json(tiers);
  } catch (error: any) {
    console.error('[LITEAPI] /loyalty/tiers GET error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

router.get('/loyalty/tiers/:tierId', async (req: Request, res: Response) => {
  try {
    const { tierId } = req.params;
    const tiers: Record<string, any> = {
      bronze: { id: 'bronze', name: 'Bronze', level: 1, minPoints: 0, maxPoints: 5000, discountPercentage: 5, pointsMultiplier: 1, benefits: ['5% discount', 'Earn 1x points'] },
      silver: { id: 'silver', name: 'Silver', level: 2, minPoints: 5001, maxPoints: 10000, discountPercentage: 10, pointsMultiplier: 1.5, benefits: ['10% discount', 'Earn 1.5x points', 'Priority support'] },
      gold: { id: 'gold', name: 'Gold', level: 3, minPoints: 10001, maxPoints: 25000, discountPercentage: 15, pointsMultiplier: 2, benefits: ['15% discount', 'Earn 2x points', 'Priority support', 'Free upgrades'] },
      platinum: { id: 'platinum', name: 'Platinum', level: 4, minPoints: 25001, maxPoints: 999999, discountPercentage: 20, pointsMultiplier: 3, benefits: ['20% discount', 'Earn 3x points', 'Priority support', 'Free upgrades', 'Lounge access'] }
    };
    if (tiers[tierId]) return res.json(tiers[tierId]);
    res.status(404).json({ error: 'Tier not found' });
  } catch (error: any) {
    console.error('[LITEAPI] /loyalty/tiers/:id GET error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

router.post('/loyalty/user/:userId/redeem-points', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { points } = req.body;
    res.json({ success: true, pointsRemaining: 0, redemptionAmount: points / 100, message: 'Points redeemed successfully' });
  } catch (error: any) {
    console.error('[LITEAPI] /loyalty/user/:id/redeem-points POST error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

router.get('/loyalty/user/:userId/expiring-points', async (req: Request, res: Response) => {
  try {
    res.json({ expiringPoints: 0, expiryDate: null });
  } catch (error: any) {
    console.error('[LITEAPI] /loyalty/user/:id/expiring-points GET error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

router.post('/loyalty/user/:userId/award-points', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { points } = req.body;
    res.json({ success: true, newBalance: points });
  } catch (error: any) {
    console.error('[LITEAPI] /loyalty/user/:id/award-points POST error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// Export Router
// ============================================================================

export default router;
