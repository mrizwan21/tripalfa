import { Router, Response } from 'express';
import prisma from '../database.js';
import { staticDbPool } from '../static-db.js';
import { validateDuffelId } from '../utils/validation.js';
import { duffelClient } from '../utils/duffelClient.js';

const router: Router = Router();

/**
 * @swagger
 * /api/flights/search:
 *   post:
 *     summary: Search for flights
 *     tags: [Flights]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [slices, passengers]
 *             properties:
 *               slices:
 *                 type: array
 *                 description: Flight slices (origin, destination, departure_date)
 *               passengers:
 *                 type: array
 *                 description: Passenger details
 *               cabin_class:
 *                 type: string
 *                 default: economy
 *               max_connections:
 *                 type: integer
 *               direct_flights:
 *                 type: boolean
 *               max_price:
 *                 type: object
 *               userId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Flight search results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     offers:
 *                       type: array
 *                     offerRequestId:
 *                       type: string
 *                     expiresAt:
 *                       type: string
 *                     total:
 *                       type: integer
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 */
router.post('/search', async (req, res: Response) => {
  try {
    const {
      slices,
      passengers,
      cabin_class = 'economy',
      max_connections,
      direct_flights,
      max_price,
      sort_by,
      return_available_services = true,
      userId,
    } = req.body;

    if (!slices || !Array.isArray(slices) || slices.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Slices are required for flight search',
      });
    }

    if (!passengers || !Array.isArray(passengers) || passengers.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Passengers are required for flight search',
      });
    }

    // Validate and normalize passenger types (Duffel best practice)
    const normalizedPassengers = passengers.map((p: any) => ({
      ...p,
      type: p.type || 'adult', // Default to adult if not specified
    }));

    // Build offer request with Duffel best practices
    const offerRequestData: any = {
      slices,
      passengers: normalizedPassengers,
      cabin_class,
      return_available_services,
    };

    if (max_connections !== undefined)
      offerRequestData.max_connections = parseInt(max_connections, 10);
    if (direct_flights === true) offerRequestData.max_connections = 0;
    if (max_price)
      offerRequestData.max_price = {
        amount: parseFloat(max_price.amount || max_price),
        currency: max_price.currency || 'USD',
      };

    // 1. Create offer request in Duffel via dedicated client
    const duffelResponse = await duffelClient.post('/air/offer_requests', {
      data: offerRequestData,
    });

    const offerRequestResponse = duffelResponse.data;
    const offers = offerRequestResponse.offers || [];

    // 2. Persist Offer Request in our Neon Database
    // Only attempt if the Prisma model is available (after migration)
    if ('duffelOfferRequest' in prisma) {
      try {
        await (prisma as any).duffelOfferRequest.create({
          data: {
            id: offerRequestResponse.id,
            userId: userId || null,
            origin: slices[0].origin,
            destination: slices[0].destination,
            departureDate: new Date(slices[0].departure_date),
            returnDate: slices.length > 1 ? new Date(slices[1].departure_date) : null,
            passengers: normalizedPassengers,
            cabinClass: cabin_class,
            rawResponse: offerRequestResponse,
          },
        });
      } catch (e) {
        console.warn('Could not save DuffelOfferRequest to Neon DB (Migration pending)', e);
      }
    }

    // 3. Persist individual Offers in Neon Database
    if ('duffelOffer' in prisma && offers.length > 0) {
      try {
        await (prisma as any).duffelOffer.createMany({
          data: offers.map((o: any) => ({
            id: o.id,
            offerRequestId: offerRequestResponse.id,
            totalAmount: String(o.total_amount),
            taxAmount: String(o.tax_amount),
            currency: o.total_currency,
            ownerId: o.owner.iata_code,
            expiresAt: new Date(o.expires_at),
            rawResponse: o,
          })),
          skipDuplicates: true,
        });
      } catch (e) {
        console.warn('Could not save DuffelOffers to Neon DB (Migration pending)', e);
      }
    }

    res.json({
      success: true,
      data: {
        offers: offers,
        offerRequestId: offerRequestResponse.id,
        expiresAt: offerRequestResponse.expires_at,
        total: offers.length,
      },
    });
  } catch (error: any) {
    console.error('[Flights] Search error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to search flights',
      message: error.message,
    });
  }
});

/**
 * @swagger
 * /api/flights/offers/{offerId}:
 *   get:
 *     summary: Get flight offer details
 *     tags: [Flights]
 *     parameters:
 *       - in: path
 *         name: offerId
 *         required: true
 *         schema:
 *           type: string
 *         description: The offer ID
 *     responses:
 *       200:
 *         description: Offer details retrieved
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
router.get('/offers/:offerId', async (req, res: Response) => {
  try {
    const { offerId } = req.params;
    const safeOfferId = validateDuffelId(offerId);

    const duffelResponse = await duffelClient.get(`/air/offers/${safeOfferId}`);

    res.json({
      success: true,
      data: duffelResponse.data,
    });
  } catch (error: any) {
    console.error('[Flights] Get offer error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to get offer details',
    });
  }
});

/**
 * @swagger
 * /api/flights/offers/{offerId}/price:
 *   post:
 *     summary: Price a flight offer
 *     tags: [Flights]
 *     parameters:
 *       - in: path
 *         name: offerId
 *         required: true
 *         schema:
 *           type: string
 *         description: The offer ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               payment_type:
 *                 type: string
 *                 default: arc_bsp_cash
 *     responses:
 *       200:
 *         description: Offer priced successfully
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
router.post('/offers/:offerId/price', async (req, res: Response) => {
  try {
    const { offerId } = req.params;
    const safeOfferId = validateDuffelId(offerId);
    const { payment_type = 'arc_bsp_cash' } = req.body;

    const duffelResponse = await duffelClient.post(`/air/offers/${safeOfferId}/actions/price`, {
      data: {
        payment: {
          type: payment_type,
        },
      },
    });

    res.json({
      success: true,
      data: duffelResponse.data,
    });
  } catch (error: any) {
    console.error('[Flights] Price offer error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to price offer',
    });
  }
});

/**
 * @swagger
 * /api/flights/book:
 *   post:
 *     summary: Create a flight booking
 *     tags: [Flights]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [selectedOffers, passengers]
 *             properties:
 *               selectedOffers:
 *                 type: array
 *               passengers:
 *                 type: array
 *               paymentMethod:
 *                 type: object
 *               guestInfo:
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
 *                   properties:
 *                     booking:
 *                       type: object
 *                     duffelOrder:
 *                       type: object
 *                     bookingRef:
 *                       type: string
 *                     orderId:
 *                       type: string
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 */
router.post('/book', async (req, res: Response) => {
  try {
    const { selectedOffers, passengers, paymentMethod, guestInfo, metadata } = req.body;

    if (!selectedOffers || !Array.isArray(selectedOffers) || selectedOffers.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Selected offers are required',
      });
    }

    if (!passengers || !Array.isArray(passengers) || passengers.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Passengers are required',
      });
    }

    console.log('[Flights] Creating booking:', {
      selectedOffers,
      passengerCount: passengers.length,
    });

    // Create order in Duffel
    const duffelResponse = await duffelClient.post('/air/orders', {
      data: {
        selected_offers: selectedOffers,
        passengers: passengers.map((p: any) => ({
          id: p.id,
          given_name: p.given_name || p.firstName,
          family_name: p.family_name || p.lastName,
          email: p.email,
          phone_number: p.phone_number,
          born_at: p.born_at || p.dob,
          title: p.title || (p.gender === 'M' ? 'Mr' : 'Ms'),
          gender: p.gender,
          type: p.type || 'adult',
        })),
        payment: paymentMethod?.type === 'balance' ? { type: 'balance' } : { type: 'arc_bsp_cash' },
      },
    });

    const orderData = duffelResponse.data;
    // Extract values with proper typing
    const baseAmount = Number(orderData?.base_amount || 0);
    const taxAmount = Number(orderData?.tax_amount || 0);
    const totalAmount = Number(orderData?.total_amount || 0);
    const currency = String(orderData?.total_currency || 'USD');
    const orderId = String(orderData?.id || '');
    const bookingReference = String(orderData?.booking_reference || '');
    const slices = orderData?.slices || [];
    const baseAmountValue = String(baseAmount);
    const taxAmountValue = String(taxAmount);
    const totalAmountValue = String(totalAmount);

    // Create local booking record
    const bookingRef = `FLT-${Date.now().toString(36).toUpperCase()}`;

    const booking = await prisma.booking.create({
      data: {
        bookingRef,
        userId: guestInfo?.id || 'guest',
        serviceType: 'flight',
        status: 'confirmed',
        workflowState: 'confirmed',
        paymentStatus: paymentMethod?.type === 'balance' ? 'paid' : 'pending',
        customerEmail: guestInfo?.email || passengers[0]?.email,
        customerPhone: guestInfo?.phone || passengers[0]?.phone_number,
        baseAmount: baseAmountValue,
        taxAmount: taxAmountValue,
        markupAmount: '0',
        totalAmount: totalAmountValue,
        currency: currency,
        metadata: {
          duffelOrderId: orderId,
          duffelBookingRef: bookingReference,
          ...metadata,
        },
      },
    });

    // Create Duffel order record
    await prisma.duffelOrder.create({
      data: {
        externalId: orderId,
        offerId: selectedOffers[0],
        customerEmail: guestInfo?.email || passengers[0]?.email,
        customerPhone: guestInfo?.phone || passengers[0]?.phone_number,
        bookingReference: bookingRef,
        localBookingId: booking.id,
        baseAmount: baseAmountValue,
        taxAmount: taxAmountValue,
        totalAmount: totalAmountValue,
        currency: currency,
        status: 'confirmed',
        type: 'instant',
        slices: slices,
        passengers: passengers,
        confirmedAt: new Date(),
      },
    });

    // Create booking segments
    if (slices && Array.isArray(slices)) {
      for (let i = 0; i < slices.length; i++) {
        const slice = slices[i];
        for (const segment of slice.segments || []) {
          await prisma.bookingSegment.create({
            data: {
              bookingId: booking.id,
              segmentType: i === 0 ? 'outbound' : 'return',
              sequenceNumber: segment.segment_number || 0,
              flightNumber: segment.marketing_carrier_flight_number,
              airline: segment.marketing_carrier?.name,
              departureAirport: segment.origin?.iata_code,
              arrivalAirport: segment.destination?.iata_code,
              departureTime: segment.departing_at ? new Date(segment.departing_at) : null,
              arrivalTime: segment.arriving_at ? new Date(segment.arriving_at) : null,
            },
          });
        }
      }
    }

    // Create booking passengers
    for (const passenger of passengers) {
      await prisma.bookingPassenger.create({
        data: {
          bookingId: booking.id,
          passengerType: passenger.type || 'adult',
          title: passenger.title,
          firstName: passenger.given_name || passenger.firstName,
          lastName: passenger.family_name || passenger.lastName,
          dateOfBirth:
            passenger.born_at || passenger.dob
              ? new Date(passenger.born_at || passenger.dob)
              : null,
          passportNumber: passenger.passport_number,
          passportExpiry: passenger.passport_expiry ? new Date(passenger.passport_expiry) : null,
        },
      });
    }

    res.json({
      success: true,
      data: {
        booking,
        duffelOrder: orderData,
        bookingRef,
        orderId: orderId,
      },
    });
  } catch (error: any) {
    console.error('[Flights] Booking error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to create booking',
      message: error.message,
    });
  }
});

/**
 * @swagger
 * /api/flights/booking/{bookingRef}:
 *   get:
 *     summary: Get flight booking details
 *     tags: [Flights]
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
 *                   properties:
 *                     booking:
 *                       type: object
 *                     duffelOrder:
 *                       type: object
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
        bookingSegments: {
          orderBy: { sequenceNumber: 'asc' },
        },
        bookingPassengers: true,
      },
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found',
      });
    }

    // Get Duffel order if available
    let duffelOrder = null;
    const metadata = booking.metadata as { duffelOrderId?: string } | null;
    if (metadata?.duffelOrderId) {
      try {
        const safeDuffelOrderId = validateDuffelId(metadata.duffelOrderId);
        const duffelResponse = await duffelClient.get(`/air/orders/${safeDuffelOrderId}`);
        duffelOrder = duffelResponse.data;
      } catch (e) {
        console.warn('[Flights] Could not fetch Duffel order:', e);
      }
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
        duffelOrder: duffelOrder?.data || null,
      },
    });
  } catch (error: any) {
    console.error('[Flights] Get booking error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to get booking details',
    });
  }
});

/**
 * @swagger
 * /api/flights/booking/{bookingRef}/cancel:
 *   post:
 *     summary: Cancel a flight booking
 *     tags: [Flights]
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

    // Create cancellation request in Duffel
    let cancellation = null;
    const cancelMetadata = booking.metadata as {
      duffelOrderId?: string;
    } | null;
    if (cancelMetadata?.duffelOrderId) {
      try {
        const duffelResponse = await duffelClient.post('/air/order_cancellations', {
          data: {
            order_id: cancelMetadata.duffelOrderId,
          },
        });
        cancellation = duffelResponse.data;
      } catch (e: any) {
        console.warn('[Flights] Could not create Duffel cancellation:', e.message);
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
      data: {
        booking: updatedBooking,
        cancellation: cancellation?.data || null,
      },
      message: 'Booking cancelled successfully',
    });
  } catch (error: any) {
    console.error('[Flights] Cancel booking error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel booking',
    });
  }
});

/**
 * @swagger
 * /api/flights/airports:
 *   get:
 *     summary: Search airports
 *     tags: [Flights]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for airport name or code
 *     responses:
 *       200:
 *         description: Airport search results
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
router.get('/airports', async (req, res: Response) => {
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
        iata_code as "iataCode", 
        name, 
        city_name as city, 
        true as "isActive"
      FROM flight.airports
      WHERE 
        iata_code ILIKE $1 OR 
        name ILIKE $1 OR 
        city_name ILIKE $1
      ORDER BY name ASC
      LIMIT 20
    `;
    const result = await staticDbPool.query(query, [`%${search}%`]);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error: any) {
    console.error('[Flights] Airport search error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to search airports',
    });
  }
});

/**
 * @swagger
 * /api/flights/airlines:
 *   get:
 *     summary: Get airlines
 *     tags: [Flights]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for airline name or code
 *     responses:
 *       200:
 *         description: Airlines list
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
router.get('/airlines', async (req, res: Response) => {
  try {
    const { search } = req.query;

    let query = `
      SELECT 
        iata_code as "iataCode", 
        name, 
        true as "isActive"
      FROM flight.airlines
    `;
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      query += ` WHERE iata_code ILIKE $1 OR name ILIKE $1`;
    }
    query += ' ORDER BY name ASC LIMIT 50';

    const result = await staticDbPool.query(query, params);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error: any) {
    console.error('[Flights] Airlines fetch error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch airlines',
    });
  }
});

export default router;
