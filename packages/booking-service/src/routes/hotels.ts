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
 * - GET  /hotels/search - Search hotels with live rates
 * - GET  /hotels/:hotelId - Get hotel details
 * - GET  /hotels/facilities - Get all facilities/amenities
 * - POST /hotels/rates - Get live rates for specific hotels
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

export default router;
