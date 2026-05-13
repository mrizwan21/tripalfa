/**
 * Hotel Routes - Hybrid Data Fetching
 * =====================================
 *
 * Strategy:
 * - Static data (95%): Postgres static DB
 * - Live data (rates): LITEAPI
 * - Fallback: LITEAPI if static DB has no data
 *
 * Endpoints:
 * - GET  /hotels/destinations/search - Search destinations for hotel search
 * - POST /hotels/search - Search hotels with live rates
 * - POST /hotels/rates - Get live rates for specific hotels
 * - GET  /hotels/facilities/list - Get all facilities/amenities
 * - GET  /hotels/filters/options - Get filter options for hotel search UI
 * - GET  /hotels/amenities/hotel - Get hotel amenities (hotel-level)
 * - GET  /hotels/amenities/room - Get room amenities (room-level)
 * - GET  /hotels/board-types - Get board types/meal plans
 * - GET  /hotels/images - Get hotel images
 * - GET  /hotels/images/room - Get room images
 * - GET  /hotels/:hotelId - Get hotel details by ID with optional rate fetching
 * - POST /hotels/book - Create hotel booking
 * - GET  /hotels/booking/:bookingRef - Get booking details
 * - POST /hotels/booking/:bookingRef/cancel - Cancel booking
 */

import { Router, Request, Response } from 'express';
import HotelDataService from '../services/hotelDataService.js';

const router: Router = Router();

// Helper function to parse query params from Express req.query
// Express query params can be string, string[], or ParsedQs objects
function parseQueryString(value: unknown): string | undefined {
  if (!value) return undefined;
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) {
    const first = value[0];
    return typeof first === 'string' ? first : undefined;
  }
  return undefined;
}

/**
 * @swagger
 * /api/hotels/search:
 *   post:
 *     summary: Search hotels with live rates using POST body
 *     tags: [Hotels]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - checkin
 *               - checkout
 *             properties:
 *               location:
 *                 type: string
 *               cityName:
 *                 type: string
 *               countryCode:
 *                 type: string
 *               checkin:
 *                 type: string
 *                 format: date
 *               checkout:
 *                 type: string
 *                 format: date
 *               adults:
 *                 type: integer
 *                 default: 2
 *               children:
 *                 type: array
 *                 items:
 *                   type: integer
 *               rooms:
 *                 type: integer
 *                 default: 1
 *               limit:
 *                 type: integer
 *                 default: 20
 *               offset:
 *                 type: integer
 *                 default: 0
 *               facilityIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *               starRating:
 *                 type: array
 *                 items:
 *                   type: integer
 *               minPrice:
 *                 type: number
 *               maxPrice:
 *                 type: number
 *               sortBy:
 *                 type: string
 *               sortOrder:
 *                 type: string
 *                 enum: [asc, desc]
 *     responses:
 *       200:
 *         description: Hotels retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       400:
 *         description: Missing required checkin/checkout dates
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.post('/search', async (req: Request, res: Response) => {
  try {
    const {
      location,
      cityName,
      countryCode,
      checkin,
      checkout,
      adults = 2,
      children,
      rooms = 1,
      limit = 20,
      offset = 0,
      facilityIds,
      starRating,
      minPrice,
      maxPrice,
      sortBy,
      sortOrder,
    } = req.body;

    // Validate required params
    if (!checkin || !checkout) {
      return res.status(400).json({
        error: 'checkin and checkout dates are required',
      });
    }

    const result = await HotelDataService.searchHotels({
      location,
      cityName,
      countryCode,
      checkin,
      checkout,
      adults,
      children,
      rooms,
      limit,
      offset,
      facilityIds,
      starRating,
      minPrice,
      maxPrice,
      sortBy,
      sortOrder,
    });

    res.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('[Hotels] Search error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/hotels/rates:
 *   post:
 *     summary: Get live rates for specific hotels
 *     tags: [Hotels]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - hotelIds
 *               - checkin
 *               - checkout
 *             properties:
 *               hotelIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               checkin:
 *                 type: string
 *                 format: date
 *               checkout:
 *                 type: string
 *                 format: date
 *               currency:
 *                 type: string
 *                 default: USD
 *               guestNationality:
 *                 type: string
 *                 default: US
 *               occupancies:
 *                 type: array
 *                 items:
 *                   type: object
 *               adults:
 *                 type: integer
 *                 default: 2
 *               children:
 *                 type: array
 *                 items:
 *                   type: integer
 *               maxRatesPerHotel:
 *                 type: integer
 *                 default: 3
 *               timeout:
 *                 type: integer
 *                 default: 8
 *     responses:
 *       200:
 *         description: Rates retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 rates:
 *                   type: object
 *                 hotelCount:
 *                   type: integer
 *       400:
 *         description: Missing required parameters
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.post('/rates', async (req: Request, res: Response) => {
  try {
    const {
      hotelIds,
      checkin,
      checkout,
      currency = 'USD',
      guestNationality = 'US',
      occupancies,
      adults = 2,
      children,
      maxRatesPerHotel = 3,
      timeout = 8,
    } = req.body;

    if (!hotelIds || !Array.isArray(hotelIds) || hotelIds.length === 0) {
      return res.status(400).json({
        error: 'hotelIds array is required',
      });
    }

    if (!checkin || !checkout) {
      return res.status(400).json({
        error: 'checkin and checkout dates are required',
      });
    }

    // Build occupancies if not provided
    let occs = occupancies;
    if (!occs) {
      let childrenAges: number[] = [];
      if (children) {
        childrenAges = Array.isArray(children)
          ? children.map(Number)
          : String(children).split(',').map(Number);
      }
      occs = [
        {
          adults: Number(adults),
          children: childrenAges,
        },
      ];
    }

    const ratesMap = await HotelDataService.getLiveRates({
      hotelIds,
      checkin,
      checkout,
      currency,
      guestNationality,
      occupancies: occs,
      maxRatesPerHotel,
      timeout,
    });

    // Convert Map to object for JSON response
    const rates: Record<string, any> = {};
    ratesMap.forEach((value, key) => {
      rates[key] = value;
    });

    res.json({
      success: true,
      rates,
      hotelCount: ratesMap.size,
    });
  } catch (error: any) {
    console.error('[Hotels] Get rates error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/hotels/facilities/list:
 *   get:
 *     summary: Get all hotel facilities/amenities
 *     tags: [Hotels]
 *     responses:
 *       200:
 *         description: Facilities retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 facilities:
 *                   type: array
 *                 count:
 *                   type: integer
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.get('/facilities/list', async (req: Request, res: Response) => {
  try {
    const facilities = await HotelDataService.getFacilities();

    res.json({
      success: true,
      facilities,
      count: facilities.length,
    });
  } catch (error: any) {
    console.error('[Hotels] Get facilities error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/hotels/filters/options:
 *   get:
 *     summary: Get filter options for hotel search UI
 *     tags: [Hotels]
 *     responses:
 *       200:
 *         description: Filter options retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 filters:
 *                   type: object
 *                   properties:
 *                     starRating:
 *                       type: array
 *                     priceRange:
 *                       type: object
 *                     facilities:
 *                       type: array
 *                     sortOptions:
 *                       type: array
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.get('/filters/options', async (req: Request, res: Response) => {
  try {
    // Get facilities from DB
    const facilities = await HotelDataService.getFacilities();

    // Return filter options for UI components
    res.json({
      success: true,
      filters: {
        starRating: [
          { value: 5, label: '5 Stars' },
          { value: 4, label: '4 Stars' },
          { value: 3, label: '3 Stars' },
          { value: 2, label: '2 Stars' },
          { value: 1, label: '1 Star' },
        ],
        priceRange: {
          min: 0,
          max: 10000,
          step: 50,
        },
        facilities: facilities.map(f => ({
          value: f.id,
          label: f.name,
        })),
        sortOptions: [
          { value: 'price', label: 'Price', defaultOrder: 'asc' },
          { value: 'rating', label: 'Rating', defaultOrder: 'desc' },
          { value: 'name', label: 'Name', defaultOrder: 'asc' },
        ],
      },
    });
  } catch (error: any) {
    console.error('[Hotels] Get filter options error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/hotels/destinations/search:
 *   get:
 *     summary: Search destinations for hotel search
 *     tags: [Hotels]
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         description: Search term (city, country, or region name)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Maximum number of results
 *     responses:
 *       200:
 *         description: Destinations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 destinations:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       countryCode:
 *                         type: string
 *                       city:
 *                         type: string
 *                       state:
 *                         type: string
 *                       type:
 *                         type: string
 *       500:
 *         description: Server error
 */
router.get('/destinations/search', async (req: Request, res: Response) => {
  try {
    const { query, limit = 10 } = req.query;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'query parameter is required',
      });
    }

    // Search destinations from LITEAPI
    const response = await fetch(`${process.env.LITEAPI_API_BASE_URL || 'https://api.liteapi.travel/v3.0'}/data/destinations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.LITEAPI_API_KEY || process.env.VITE_LITEAPI_TEST_API_KEY || '',
      },
      body: JSON.stringify({
        query,
        limit: Number(limit),
      }),
    });

    if (!response.ok) {
      throw new Error(`LITEAPI Error: ${response.status}`);
    }

    const data = await response.json();

    res.json({
      success: true,
      destinations: data.data || data.destinations || [],
    });
  } catch (error: any) {
    console.error('[Hotels] Destination search error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/hotels/amenities:
 *   get:
 *     summary: Get hotel amenities list (deprecated - use /amenities/hotel or /amenities/room)
 *     tags: [Hotels]
 *     deprecated: true
 *     responses:
 *       200:
 *         description: Amenities retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 amenities:
 *                   type: array
 *                   items:
 *                     type: object
 *       500:
 *         description: Server error
 */
router.get('/amenities', async (req: Request, res: Response) => {
  try {
    // Reuse facilities endpoint - deprecated, use /amenities/hotel instead
    const facilities = await HotelDataService.getFacilities();

    res.json({
      success: true,
      amenities: facilities,
      deprecated: true,
      message: 'This endpoint is deprecated. Use /amenities/hotel for hotel amenities or /amenities/room for room amenities.',
    });
  } catch (error: any) {
    console.error('[Hotels] Get amenities error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/hotels/board-types:
 *   get:
 *     summary: Get board types (meal plans) for hotels
 *     tags: [Hotels]
 *     responses:
 *       200:
 *         description: Board types retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 boardTypes:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       code:
 *                         type: string
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 *       500:
 *         description: Server error
 */
router.get('/board-types', async (req: Request, res: Response) => {
  try {
    // Common board types for hotels
    const boardTypes = [
      { code: 'BB', name: 'Bed and Breakfast', description: 'Breakfast included' },
      { code: 'HB', name: 'Half Board', description: 'Breakfast and dinner included' },
      { code: 'FB', name: 'Full Board', description: 'All meals included' },
      { code: 'AI', name: 'All Inclusive', description: 'All meals, drinks, and activities included' },
      { code: 'RO', name: 'Room Only', description: 'No meals included' },
    ];

    res.json({
      success: true,
      boardTypes,
    });
  } catch (error: any) {
    console.error('[Hotels] Get board types error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/hotels/book:
 *   post:
 *     summary: Create a hotel booking
 *     tags: [Hotels]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - hotelId
 *               - offerId
 *               - guests
 *               - checkin
 *               - checkout
 *             properties:
 *               hotelId:
 *                 type: string
 *               offerId:
 *                 type: string
 *               guests:
 *                 type: array
 *                 items:
 *                   type: object
 *               checkin:
 *                 type: string
 *                 format: date
 *               checkout:
 *                 type: string
 *                 format: date
 *               holder:
 *                 type: object
 *               payment:
 *                 type: object
 *     responses:
 *       201:
 *         description: Booking created successfully
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Server error
 */
router.post('/book', async (req: Request, res: Response) => {
  try {
    const { hotelId, offerId, guests, checkin, checkout, holder, payment } = req.body;

    if (!hotelId || !offerId || !guests || !checkin || !checkout) {
      return res.status(400).json({
        success: false,
        error: 'hotelId, offerId, guests, checkin, and checkout are required',
      });
    }

    // Create booking via LITEAPI prebook and book
    const prebookResponse = await fetch(`${process.env.LITEAPI_BOOK_BASE_URL || 'https://book.liteapi.travel/v3.0'}/rates/prebook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.LITEAPI_API_KEY || process.env.VITE_LITEAPI_TEST_API_KEY || '',
      },
      body: JSON.stringify({
        offerId,
        guests: guests.map((g: any, idx: number) => ({
          occupancyNumber: idx + 1,
          firstName: g.firstName,
          lastName: g.lastName,
          email: g.email,
        })),
      }),
    });

    if (!prebookResponse.ok) {
      throw new Error('Prebook failed');
    }

    const prebookData = await prebookResponse.json();
    const prebookId = prebookData.transactionId;

    // Complete booking
    const bookResponse = await fetch(`${process.env.LITEAPI_BOOK_BASE_URL || 'https://book.liteapi.travel/v3.0'}/rates/book`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.LITEAPI_API_KEY || process.env.VITE_LITEAPI_TEST_API_KEY || '',
      },
      body: JSON.stringify({
        prebookId,
        holder: holder || {
          name: guests[0]?.firstName,
          surname: guests[0]?.lastName,
          email: guests[0]?.email,
        },
        guests: guests.map((g: any, idx: number) => ({
          occupancyNumber: idx + 1,
          firstName: g.firstName,
          lastName: g.lastName,
        })),
        payment: payment || { method: 'WALLET' },
      }),
    });

    if (!bookResponse.ok) {
      throw new Error('Booking failed');
    }

    const bookingData = await bookResponse.json();

    res.status(201).json({
      success: true,
      booking: {
        id: bookingData.booking?.reference?.supplier || bookingData.confirmationId,
        hotelId,
        offerId,
        status: 'confirmed',
        checkin,
        checkout,
        guests,
        ...bookingData,
      },
    });
  } catch (error: any) {
    console.error('[Hotels] Book error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/hotels/{hotelId}:
 *   get:
 *     summary: Get hotel details by ID
 *     tags: [Hotels]
 *     parameters:
 *       - in: path
 *         name: hotelId
 *         required: true
 *         schema:
 *           type: string
 *         description: The hotel ID
 *       - in: query
 *         name: checkin
 *         schema:
 *           type: string
 *           format: date
 *         description: Check-in date for rates
 *       - in: query
 *         name: checkout
 *         schema:
 *           type: string
 *           format: date
 *         description: Check-out date for rates
 *       - in: query
 *         name: adults
 *         schema:
 *           type: integer
 *         description: Number of adults
 *       - in: query
 *         name: children
 *         schema:
 *           type: string
 *         description: Comma-separated children ages
 *     responses:
 *       200:
 *         description: Hotel details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 hotel:
 *                   type: object
 *                 rates:
 *                   type: array
 *       404:
 *         description: Hotel not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.get('/:hotelId', async (req: Request, res: Response) => {
  try {
    const hotelId = String(req.params.hotelId);
    const { checkin, checkout, adults, children } = req.query;

    // Parse children ages if provided
    let childrenAges: number[] | undefined;
    if (children) {
      if (Array.isArray(children)) {
        childrenAges = children.map(Number);
      } else if (typeof children === 'string') {
        childrenAges = children.split(',').map(Number);
      }
    }

    const result = await HotelDataService.getHotelDetails(hotelId, {
      checkin: parseQueryString(checkin),
      checkout: parseQueryString(checkout),
      adults: adults ? Number(adults) : undefined,
      children: childrenAges,
    });

    if (!result.hotel) {
      return res.status(404).json({
        success: false,
        error: 'Hotel not found',
      });
    }

    res.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('[Hotels] Get hotel error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/hotels/booking/{bookingRef}:
 *   get:
 *     summary: Get hotel booking details by reference
 *     tags: [Hotels]
 *     parameters:
 *       - in: path
 *         name: bookingRef
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking reference number
 *     responses:
 *       200:
 *         description: Booking details retrieved successfully
 *       404:
 *         description: Booking not found
 *       500:
 *         description: Server error
 */
router.get('/booking/:bookingRef', async (req: Request, res: Response) => {
  try {
    const { bookingRef } = req.params;

    // Try to get booking from LITEAPI
    const response = await fetch(`${process.env.LITEAPI_BOOK_BASE_URL || 'https://book.liteapi.travel/v3.0'}/bookings/${bookingRef}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.LITEAPI_API_KEY || process.env.VITE_LITEAPI_TEST_API_KEY || '',
      },
    });

    if (!response.ok) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found',
      });
    }

    const bookingData = await response.json();

    res.json({
      success: true,
      booking: bookingData,
    });
  } catch (error: any) {
    console.error('[Hotels] Get booking error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/hotels/booking/{bookingRef}/cancel:
 *   post:
 *     summary: Cancel a hotel booking
 *     tags: [Hotels]
 *     parameters:
 *       - in: path
 *         name: bookingRef
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking reference number
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Booking cancelled successfully
 *       400:
 *         description: Missing required fields
 *       404:
 *         description: Booking not found
 *       500:
 *         description: Server error
 */
router.post('/booking/:bookingRef/cancel', async (req: Request, res: Response) => {
  try {
    const { bookingRef } = req.params;
    const { reason = 'Customer requested cancellation' } = req.body;

    // Cancel booking via LITEAPI
    const response = await fetch(`${process.env.LITEAPI_BOOK_BASE_URL || 'https://book.liteapi.travel/v3.0'}/bookings/${bookingRef}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.LITEAPI_API_KEY || process.env.VITE_LITEAPI_TEST_API_KEY || '',
      },
      body: JSON.stringify({ reason }),
    });

    if (!response.ok) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found or cannot be cancelled',
      });
    }

    const cancelData = await response.json();

    res.json({
      success: true,
      booking: {
        bookingRef,
        status: 'cancelled',
        cancellationReason: reason,
        ...cancelData,
      },
    });
  } catch (error: any) {
    console.error('[Hotels] Cancel booking error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/hotels/amenities/hotel:
 *   get:
 *     summary: Get hotel amenities list (hotel-level amenities)
 *     tags: [Hotels]
 *     responses:
 *       200:
 *         description: Hotel amenities retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 amenities:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 *       500:
 *         description: Server error
 */
router.get('/amenities/hotel', async (req: Request, res: Response) => {
  try {
    // Get hotel-specific facilities/amenities
    const facilities = await HotelDataService.getFacilities();

    res.json({
      success: true,
      amenities: facilities.map(f => ({
        id: f.id,
        name: f.name,
        code: f.code,
      })),
    });
  } catch (error: any) {
    console.error('[Hotels] Get hotel amenities error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/hotels/amenities/room:
 *   get:
 *     summary: Get room amenities list (room-level amenities)
 *     tags: [Hotels]
 *     parameters:
 *       - in: query
 *         name: hotelId
 *         schema:
 *           type: string
 *         description: Hotel ID to get room amenities for
 *     responses:
 *       200:
 *         description: Room amenities retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 amenities:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 *       500:
 *         description: Server error
 */
router.get('/amenities/room', async (req: Request, res: Response) => {
  try {
    const { hotelId } = req.query;

    // Common room amenities that apply across hotels
    const roomAmenities = [
      { id: 1, name: 'Air Conditioning', description: 'Air conditioning in the room' },
      { id: 2, name: 'Balcony/Terrace', description: 'Private balcony or terrace' },
      { id: 3, name: 'Cable TV', description: 'Cable/satellite television' },
      { id: 4, name: 'Coffee/Tea Maker', description: 'In-room coffee/tea making facilities' },
      { id: 5, name: 'Hair Dryer', description: 'Hair dryer provided' },
      { id: 6, name: 'In-room Safe', description: 'Electronic in-room safe' },
      { id: 7, name: 'Iron/Ironing Board', description: 'Iron and ironing board available' },
      { id: 8, name: 'Minibar', description: 'Minibar with refreshments' },
      { id: 9, name: 'Room Service', description: 'Room service available' },
      { id: 10, name: 'Telephone', description: 'In-room telephone' },
      { id: 11, name: 'Wi-Fi', description: 'Wireless internet access' },
      { id: 12, name: 'Work Desk', description: 'Work desk and chair' },
      { id: 13, name: 'Wake-up Service', description: 'Wake-up call service' },
      { id: 14, name: 'Bathroom', description: 'Private bathroom' },
      { id: 15, name: 'Shower', description: 'Private shower' },
    ];

    // If hotelId is provided, try to get specific room amenities from the hotel data
    if (hotelId && typeof hotelId === 'string') {
      try {
        const hotelDetails = await HotelDataService.getHotelDetails(hotelId);
        if (hotelDetails.hotel?.rooms && hotelDetails.hotel.rooms.length > 0) {
          // Extract unique room amenities from the hotel's rooms
          const extractedAmenities = new Map<number, string>();
          hotelDetails.hotel.rooms.forEach((room: any) => {
            if (room.roomAmenities) {
              room.roomAmenities.forEach((amenity: any) => {
                if (amenity.name) {
                  extractedAmenities.set(
                    amenity.amenitiesId || Math.random() * 1000,
                    amenity.name
                  );
                }
              });
            }
          });

          if (extractedAmenities.size > 0) {
            return res.json({
              success: true,
              amenities: Array.from(extractedAmenities.entries()).map(([id, name]) => ({
                id,
                name,
              })),
              source: 'hotel-data',
            });
          }
        }
      } catch (e) {
        // Fall through to default room amenities
      }
    }

    res.json({
      success: true,
      amenities: roomAmenities,
      source: 'default',
    });
  } catch (error: any) {
    console.error('[Hotels] Get room amenities error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/hotels/images:
 *   get:
 *     summary: Get hotel images
 *     tags: [Hotels]
 *     parameters:
 *       - in: query
 *         name: hotelId
 *         required: true
 *         schema:
 *           type: string
 *         description: Hotel ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Maximum number of images to return
 *     responses:
 *       200:
 *         description: Hotel images retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 images:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       url:
 *                         type: string
 *                       caption:
 *                         type: string
 *                       order:
 *                         type: integer
 *       400:
 *         description: hotelId is required
 *       404:
 *         description: Hotel not found
 *       500:
 *         description: Server error
 */
router.get('/images', async (req: Request, res: Response) => {
  try {
    const { hotelId, limit = 20 } = req.query;

    if (!hotelId) {
      return res.status(400).json({
        success: false,
        error: 'hotelId is required',
      });
    }

    const result = await HotelDataService.getHotelDetails(String(hotelId));

    if (!result.hotel) {
      return res.status(404).json({
        success: false,
        error: 'Hotel not found',
      });
    }

    // Extract hotel images from the hotel data
    const hotelImages: Array<{ url: string; caption?: string; order?: number }> = [];

    // Check for hotelImages in the hotel data
    if (result.hotel.hotelImages && Array.isArray(result.hotel.hotelImages)) {
      result.hotel.hotelImages.forEach((img: any, idx: number) => {
        hotelImages.push({
          url: img.url || img,
          caption: img.caption,
          order: img.order || idx,
        });
      });
    }

    // Also check for images array
    if (result.hotel.images && Array.isArray(result.hotel.images) && hotelImages.length === 0) {
      result.hotel.images.forEach((img: any, idx: number) => {
        hotelImages.push({
          url: typeof img === 'string' ? img : img.url,
          caption: typeof img === 'object' ? img.caption : undefined,
          order: idx,
        });
      });
    }

    res.json({
      success: true,
      hotelId,
      images: hotelImages.slice(0, Number(limit)),
      total: hotelImages.length,
    });
  } catch (error: any) {
    console.error('[Hotels] Get hotel images error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/hotels/images/room:
 *   get:
 *     summary: Get room images for a specific room
 *     tags: [Hotels]
 *     parameters:
 *       - in: query
 *         name: hotelId
 *         required: true
 *         schema:
 *           type: string
 *         description: Hotel ID
 *       - in: query
 *         name: roomId
 *         schema:
 *           type: string
 *         description: Specific room ID (optional, returns all room types if not provided)
 *     responses:
 *       200:
 *         description: Room images retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 rooms:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       roomId:
 *                         type: string
 *                       roomName:
 *                         type: string
 *                       images:
 *                         type: array
 *                         items:
 *                           type: object
 *       400:
 *         description: hotelId is required
 *       404:
 *         description: Hotel not found
 *       500:
 *         description: Server error
 */
router.get('/images/room', async (req: Request, res: Response) => {
  try {
    const { hotelId, roomId } = req.query;

    if (!hotelId) {
      return res.status(400).json({
        success: false,
        error: 'hotelId is required',
      });
    }

    const result = await HotelDataService.getHotelDetails(String(hotelId));

    if (!result.hotel) {
      return res.status(404).json({
        success: false,
        error: 'Hotel not found',
      });
    }

    const roomImages: Array<{
      roomId: string;
      roomName: string;
      images: Array<{ url: string; caption?: string; order?: number }>;
    }> = [];

    // Extract room images from the hotel's rooms
    if (result.hotel.rooms && Array.isArray(result.hotel.rooms)) {
      result.hotel.rooms.forEach((room: any) => {
        const targetId = room.roomId || room.id;

        // If roomId is specified, filter to that room only
        if (roomId && targetId !== roomId) {
          return;
        }

        const roomImageArray: Array<{ url: string; caption?: string; order?: number }> = [];

        if (room.photos && Array.isArray(room.photos)) {
          room.photos.forEach((photo: any, idx: number) => {
            roomImageArray.push({
              url: photo.url || photo.photo_url || '',
              caption: photo.imageDescription || photo.caption,
              order: photo.classOrder || idx,
            });
          });
        }

        if (room.images && Array.isArray(room.images) && roomImageArray.length === 0) {
          room.images.forEach((img: any, idx: number) => {
            roomImageArray.push({
              url: typeof img === 'string' ? img : img.url || '',
              caption: typeof img === 'object' ? img.caption : undefined,
              order: idx,
            });
          });
        }

        roomImages.push({
          roomId: targetId,
          roomName: room.roomName || room.name || 'Room',
          images: roomImageArray,
        });
      });
    }

    res.json({
      success: true,
      hotelId,
      roomId: roomId || undefined,
      rooms: roomImages,
    });
  } catch (error: any) {
    console.error('[Hotels] Get room images error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;
