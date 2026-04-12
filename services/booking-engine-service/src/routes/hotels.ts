import { Router, Response } from 'express';
import { randomUUID } from 'node:crypto';
import prisma from '../database.js';
import { staticDbPool } from '../static-db.js';
import { validateLiteApiId } from '../utils/validation.js';
import {
  liteapiDataClient,
  liteapiBookClient,
  liteapiProdDataClient,
} from '../utils/liteapiClient.js';

const router: Router = Router();

// Helper for LITEAPI requests using centralized clients
async function liteApiRequest<T>(endpoint: string, params: Record<string, any> = {}): Promise<T> {
  const response = await liteapiDataClient.get(endpoint, { params });
  return response.data as T;
}

async function liteApiPost<T>(endpoint: string, data: Record<string, any>): Promise<T> {
  const response = await liteapiBookClient.post(endpoint, data);
  return response.data as T;
}

/**
 * @swagger
 * /api/hotels/search:
 *   post:
 *     summary: Search for hotels
 *     tags: [Hotels]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [destination, checkIn, checkOut]
 *             properties:
 *               destination:
 *                 type: string
 *               checkIn:
 *                 type: string
 *                 format: date
 *               checkOut:
 *                 type: string
 *                 format: date
 *               guests:
 *                 type: array
 *               rooms:
 *                 type: integer
 *                 default: 1
 *               nationality:
 *                 type: string
 *               currency:
 *                 type: string
 *                 default: USD
 *     responses:
 *       200:
 *         description: Hotel search results
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
 *         description: Bad request
 *       500:
 *         description: Server error
 */
router.post('/search', async (req, res: Response) => {
  try {
    const {
      destination,
      checkIn,
      checkOut,
      guests,
      rooms = 1,
      nationality,
      currency = 'USD',
    } = req.body;

    if (!destination || !checkIn || !checkOut) {
      return res.status(400).json({
        success: false,
        error: 'Destination, check-in, and check-out dates are required',
      });
    }

    console.log('[Hotels] Searching hotels:', {
      destination,
      checkIn,
      checkOut,
      guests,
      rooms,
    });

    // Search hotels via LITEAPI
    const searchResponse = await liteApiPost<any>('/v3.0/hotels/search', {
      destination,
      checkIn,
      checkOut,
      guests: guests || [{ adults: 2, children: [] }],
      rooms,
      nationality: nationality || 'US',
      currency,
    });

    const hotels = searchResponse.data?.hotels || searchResponse.data || [];

    // Enrich with canonical hotel data if available
    const enrichedHotels = await Promise.all(
      hotels.slice(0, 50).map(async (hotel: any) => {
        // Try to find canonical hotel mapping
        const mapping = await prisma.supplierHotelMapping.findFirst({
          where: {
            supplierHotelId: hotel.id || hotel.hotelId,
          },
        });

        if (mapping && mapping.localHotelId) {
          // Use the mapping data directly since there's no separate hotel model
          const canonicalHotel = {
            id: mapping.localHotelId,
            name: mapping.hotelName || '',
            starRating: 0,
            address: '',
            city: '',
            countryCode: '',
            images: [],
            amenities: [],
          };

          return {
            ...hotel,
            canonicalData: {
              name: canonicalHotel.name,
              starRating: canonicalHotel.starRating,
              address: canonicalHotel.address,
              city: canonicalHotel.city,
              countryCode: canonicalHotel.countryCode,
              images: canonicalHotel.images,
              amenities: canonicalHotel.amenities.map((a: any) => a.amenity),
            },
          };
        }

        return hotel;
      })
    );

    res.json({
      success: true,
      data: {
        hotels: enrichedHotels,
        searchId: searchResponse.data?.searchId || searchResponse.searchId,
        total: enrichedHotels.length,
      },
    });
  } catch (error: any) {
    console.error('[Hotels] Search error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to search hotels',
      message: error.message,
    });
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
 *             required: [hotelId, offerId, checkIn, checkOut]
 *             properties:
 *               hotelId:
 *                 type: string
 *               offerId:
 *                 type: string
 *               checkIn:
 *                 type: string
 *                 format: date
 *               checkOut:
 *                 type: string
 *                 format: date
 *               rooms:
 *                 type: array
 *               guests:
 *                 type: array
 *               guestInfo:
 *                 type: object
 *               specialRequests:
 *                 type: string
 *               paymentMethod:
 *                 type: object
 *               metadata:
 *                 type: object
 *     responses:
 *       200:
 *         description: Booking created successfully
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
 *         description: Bad request
 *       500:
 *         description: Server error
 */
router.post('/book', async (req, res: Response) => {
  try {
    const {
      hotelId,
      offerId,
      checkIn,
      checkOut,
      rooms,
      guests,
      guestInfo,
      specialRequests,
      paymentMethod,
      metadata,
    } = req.body;

    if (!hotelId || !offerId || !checkIn || !checkOut) {
      return res.status(400).json({
        success: false,
        error: 'Hotel ID, offer ID, check-in, and check-out dates are required',
      });
    }

    console.log('[Hotels] Creating booking:', {
      hotelId,
      offerId,
      checkIn,
      checkOut,
    });

    // Create prebook session
    const prebookResponse = await liteApiPost<any>('/rates/prebook', {
      offerId,
      guestInfo: {
        email: guestInfo?.email,
        firstName: guestInfo?.firstName,
        lastName: guestInfo?.lastName,
        phone: guestInfo?.phone,
      },
    });

    if (!prebookResponse.data || !prebookResponse.data.prebookId) {
      return res.status(400).json({
        success: false,
        error: prebookResponse.message || 'Failed to prebook hotel',
      });
    }

    const prebookData = prebookResponse.data;
    const prebookId = prebookData.prebookId;

    // NOW: Complete the booking with LITEAPI
    const bookResponse = await liteApiPost<any>('/rates/book', {
      prebookId,
    });

    if (!bookResponse.data || !bookResponse.data.bookingId) {
      // If booking fails, we still have the prebook session, but the booking is failed
      console.error('[Hotels] LITEAPI Book failed:', bookResponse.message);
      return res.status(400).json({
        success: false,
        error: bookResponse.message || 'Failed to complete LITEAPI booking',
      });
    }

    const bookData = bookResponse.data;
    const liteapiBookingId = bookData.bookingId;

    // Extract values with proper typing
    const baseAmount = Number(bookData.totalPrice || prebookData.price || 0);
    const taxAmount = Number(bookData.taxAmount || prebookData.taxAmount || 0);
    const totalAmount = Number(bookData.totalPrice || prebookData.price || 0);
    const currency = String(bookData.currency || prebookData.currency || 'USD');
    const hotelName = String(bookData.hotelName || prebookData.hotelName || '');

    // Create local booking record
    const bookingRef = `HTL-${Date.now().toString(36).toUpperCase()}`;
    const baseAmountValue = String(baseAmount);
    const taxAmountValue = String(taxAmount);
    const totalAmountValue = String(totalAmount);

    const booking = await prisma.booking.create({
      data: {
        bookingRef,
        userId: guestInfo?.id || 'guest',
        serviceType: 'hotel',
        status: 'confirmed',
        workflowState: 'confirmed',
        paymentStatus: 'pending',
        customerEmail: guestInfo?.email,
        customerPhone: guestInfo?.phone,
        baseAmount: baseAmountValue,
        taxAmount: taxAmountValue,
        markupAmount: '0',
        totalAmount: totalAmountValue,
        currency: currency,
        travelDate: new Date(checkIn),
        returnDate: new Date(checkOut),
        metadata: {
          hotelId,
          offerId,
          prebookId,
          liteapiBookingId,
          rooms,
          specialRequests,
          ...metadata,
        },
      },
    });

    // Create LiteApiBooking record for persistence
    await prisma.liteApiBooking.create({
      data: {
        bookingId: liteapiBookingId,
        prebookId,
        localBookingId: booking.id,
        status: 'confirmed',
        hotelId,
        hotelName,
        checkIn: new Date(checkIn),
        checkOut: new Date(checkOut),
        totalAmount: totalAmountValue,
        currency,
        metadata: {
          bookData,
          prebookData,
        },
      },
    });

    // Create booking segment...

    // Create booking segment
    await prisma.bookingSegment.create({
      data: {
        bookingId: booking.id,
        segmentType: 'hotel_checkin',
        sequenceNumber: 0,
        hotelName: hotelName || metadata?.hotelName,
        checkInDate: new Date(checkIn),
        checkOutDate: new Date(checkOut),
        roomType: rooms?.[0]?.roomType || 'Standard',
        supplierHotelId: hotelId,
      },
    });

    // Create booking passengers (guests)
    if (guests && Array.isArray(guests)) {
      for (const guest of guests) {
        await prisma.bookingPassenger.create({
          data: {
            bookingId: booking.id,
            passengerType: 'adult',
            firstName: guest.firstName || guestInfo?.firstName,
            lastName: guest.lastName || guestInfo?.lastName,
          },
        });
      }
    }

    // Create prebook session record
    await prisma.prebookSession.create({
      data: {
        transactionId: prebookId,
        offerId,
        hotelId,
        price: totalAmountValue,
        currency: currency,
        guestEmail: guestInfo?.email,
        guestName: guestInfo ? `${guestInfo.firstName} ${guestInfo.lastName}` : null,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
        status: 'pending',
        bookingId: booking.id,
      },
    });

    res.json({
      success: true,
      data: {
        booking,
        prebook: prebookData,
        bookingRef,
      },
    });
  } catch (error: any) {
    console.error('[Hotels] Booking error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to create hotel booking',
      message: error.message,
    });
  }
});

/**
 * @swagger
 * /api/hotels/booking/{bookingRef}:
 *   get:
 *     summary: Get hotel booking details
 *     tags: [Hotels]
 *     parameters:
 *       - in: path
 *         name: bookingRef
 *         required: true
 *         schema:
 *           type: string
 *         description: The booking reference
 *     responses:
 *       200:
 *         description: Booking details retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       404:
 *         description: Booking not found
 *       500:
 *         description: Server error
 */
router.get('/booking/:bookingRef', async (req, res: Response) => {
  try {
    const { bookingRef } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { bookingRef },
      include: {
        bookingSegments: true,
        bookingPassengers: true,
      },
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found',
      });
    }

    res.json({
      success: true,
      data: {
        booking: {
          ...booking,
          baseAmount: booking.baseAmount.toNumber(),
          taxAmount: booking.taxAmount.toNumber(),
          markupAmount: booking.markupAmount.toNumber(),
          totalAmount: booking.totalAmount.toNumber(),
        },
      },
    });
  } catch (error: any) {
    console.error('[Hotels] Get booking error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to get booking details',
    });
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
 *         description: The booking reference
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
 *         description: Bad request
 *       404:
 *         description: Booking not found
 *       500:
 *         description: Server error
 */
router.post('/booking/:bookingRef/cancel', async (req, res: Response) => {
  try {
    const { bookingRef } = req.params;
    const { reason } = req.body;

    const booking = await prisma.booking.findUnique({
      where: { bookingRef },
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found',
      });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        error: 'Booking is already cancelled',
      });
    }

    // Try to cancel with supplier if prebook session exists
    const hotelMetadata = booking.metadata as { prebookId?: string } | null;
    if (hotelMetadata?.prebookId) {
      try {
        await liteApiPost<any>('/v3.0/hotels/cancel', {
          prebookId: hotelMetadata.prebookId,
        });
      } catch (e: any) {
        console.warn('[Hotels] Could not cancel with supplier:', e.message);
      }
    }

    // Update booking status
    const updatedBooking = await prisma.booking.update({
      where: { bookingRef },
      data: {
        status: 'cancelled',
        workflowState: 'cancelled',
      },
    });

    // Create modification record
    await prisma.bookingModification.create({
      data: {
        bookingId: booking.id,
        modificationType: 'cancellation',
        status: 'completed',
        requestNote: reason,
        oldValue: { status: booking.status },
        newValue: { status: 'cancelled' },
      },
    });

    res.json({
      success: true,
      data: updatedBooking,
      message: 'Hotel booking cancelled successfully',
    });
  } catch (error: any) {
    console.error('[Hotels] Cancel booking error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel hotel booking',
    });
  }
});

/**
 * @swagger
 * /api/hotels/destinations/search:
 *   get:
 *     summary: Search hotel destinations
 *     tags: [Hotels]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for city or country
 *     responses:
 *       200:
 *         description: Destination search results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *       500:
 *         description: Server error
 */
router.get('/destinations/search', async (req, res: Response) => {
  try {
    const { search } = req.query;

    if (!search || search.toString().length < 2) {
      return res.json({
        success: true,
        data: [],
      });
    }

    const query = `
      SELECT 
        id, 
        name, 
        country_code as "countryCode", 
        latitude, 
        longitude, 
        'city' as type,
        true as "isActive"
      FROM hotel.cities
      WHERE 
        name ILIKE $1 OR 
        country_code ILIKE $1
      ORDER BY name ASC
      LIMIT 20
    `;
    const result = await staticDbPool.query(query, [`%${search}%`]);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error: any) {
    console.error('[Hotels] Destination search error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to search destinations',
    });
  }
});

/**
 * @swagger
 * /api/hotels/amenities:
 *   get:
 *     summary: Get hotel amenities
 *     tags: [Hotels]
 *     responses:
 *       200:
 *         description: Amenities list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *       500:
 *         description: Server error
 */
router.get('/amenities', async (req, res: Response) => {
  try {
    const query =
      'SELECT id, name, category, true as "isActive" FROM hotel.facilities ORDER BY category ASC, name ASC';
    const result = await staticDbPool.query(query);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error: any) {
    console.error('[Hotels] Get amenities error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to get amenities',
    });
  }
});

/**
 * @swagger
 * /api/hotels/board-types:
 *   get:
 *     summary: Get board types
 *     tags: [Hotels]
 *     responses:
 *       200:
 *         description: Board types list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *       500:
 *         description: Server error
 */
router.get('/board-types', async (req, res: Response) => {
  try {
    const boardTypes = await prisma.boardType.findMany({
      where: { isActive: true },
      orderBy: { code: 'asc' },
    });

    res.json({
      success: true,
      data: boardTypes,
    });
  } catch (error: any) {
    console.error('[Hotels] Get board types error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to get board types',
    });
  }
});

/**
 * @swagger
 * /api/hotels/{hotelId}:
 *   get:
 *     summary: Get hotel details
 *     tags: [Hotels]
 *     parameters:
 *       - in: path
 *         name: hotelId
 *         required: true
 *         schema:
 *           type: string
 *         description: The hotel ID
 *     responses:
 *       200:
 *         description: Hotel details retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       500:
 *         description: Server error
 */
router.get('/:hotelId', async (req, res: Response) => {
  try {
    const { hotelId } = req.params;

    // Try to get from canonical hotel first
    const mapping = await prisma.supplierHotelMapping.findFirst({
      where: {
        OR: [{ supplierHotelId: hotelId }, { localHotelId: hotelId }],
      },
    });

    if (mapping && mapping.localHotelId) {
      // Use the mapping data directly since there's no separate hotel model
      const canonicalHotel = {
        id: mapping.localHotelId,
        name: mapping.hotelName || '',
        description: '',
        starRating: 0,
        address: '',
        city: '',
        country: '',
        countryCode: '',
        latitude: null,
        longitude: null,
        images: [],
        amenities: [],
        reviews: [],
        checkInTime: null,
        checkOutTime: null,
        phone: null,
        email: null,
      };

      return res.json({
        success: true,
        data: {
          hotel: {
            id: canonicalHotel.id,
            name: canonicalHotel.name || '',
            description: canonicalHotel.description || '',
            starRating: canonicalHotel.starRating || 0,
            address: canonicalHotel.address,
            city: canonicalHotel.city,
            country: canonicalHotel.country,
            countryCode: canonicalHotel.countryCode,
            latitude: canonicalHotel.latitude,
            longitude: canonicalHotel.longitude,
            images: canonicalHotel.images,
            amenities: canonicalHotel.amenities,
            reviews: canonicalHotel.reviews,
            checkInTime: canonicalHotel.checkInTime || null,
            checkOutTime: canonicalHotel.checkOutTime || null,
            phone: canonicalHotel.phone || null,
            email: canonicalHotel.email || null,
          },
          supplier: mapping.supplierId,
        },
      });
    }

    // Fallback to LITEAPI
    const safeHotelId = validateLiteApiId(hotelId);
    const hotelDetails = await liteApiRequest<any>(`/v3.0/hotels/${safeHotelId}`);

    res.json({
      success: true,
      data: hotelDetails.data || hotelDetails,
    });
  } catch (error: any) {
    console.error('[Hotels] Get hotel error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to get hotel details',
    });
  }
});

/**
 * @swagger
 * /api/hotels/{hotelId}/rates:
 *   post:
 *     summary: Get hotel rates
 *     tags: [Hotels]
 *     parameters:
 *       - in: path
 *         name: hotelId
 *         required: true
 *         schema:
 *           type: string
 *         description: The hotel ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [checkIn, checkOut]
 *             properties:
 *               checkIn:
 *                 type: string
 *                 format: date
 *               checkOut:
 *                 type: string
 *                 format: date
 *               guests:
 *                 type: array
 *               rooms:
 *                 type: integer
 *                 default: 1
 *               nationality:
 *                 type: string
 *               currency:
 *                 type: string
 *                 default: USD
 *     responses:
 *       200:
 *         description: Hotel rates retrieved
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
 *         description: Bad request
 *       500:
 *         description: Server error
 */
router.post('/:hotelId/rates', async (req, res: Response) => {
  try {
    const { hotelId } = req.params;
    const { checkIn, checkOut, guests, rooms = 1, nationality, currency = 'USD' } = req.body;

    if (!checkIn || !checkOut) {
      return res.status(400).json({
        success: false,
        error: 'Check-in and check-out dates are required',
      });
    }

    const safeHotelId = validateLiteApiId(hotelId);
    const ratesResponse = await liteApiPost<any>(`/v3.0/hotels/${safeHotelId}/rates`, {
      checkIn,
      checkOut,
      guests: guests || [{ adults: 2, children: [] }],
      rooms,
      nationality: nationality || 'US',
      currency,
    });

    res.json({
      success: true,
      data: ratesResponse.data || ratesResponse,
    });
  } catch (error: any) {
    console.error('[Hotels] Get rates error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to get hotel rates',
    });
  }
});

export default router;
