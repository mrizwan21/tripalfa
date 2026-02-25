import { Router, Response } from 'express';
import prisma, { Decimal } from '../database.js';
import { v4 as uuidv4 } from 'uuid';
import { Prisma } from '@prisma/client';

const router: Router = Router();

// Duffel API configuration
const DUFFEL_API_URL = process.env.DUFFEL_API_URL || 'https://api.duffel.com';
const DUFFEL_API_KEY = process.env.DUFFEL_API_KEY || process.env.DUFFEL_TEST_TOKEN;
const DUFFEL_VERSION = 'v2';

// Helper to make authenticated Duffel API requests
async function duffelApi<T>(endpoint: string, method: string = 'GET', body?: object): Promise<T> {
    const url = `${DUFFEL_API_URL}${endpoint}`;
    const response = await fetch(url, {
        method,
        headers: {
            'Authorization': `Bearer ${DUFFEL_API_KEY}`,
            'Duffel-Version': DUFFEL_VERSION,
            'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Duffel API Error (${response.status}): ${errorText}`);
    }

    return response.json();
}

// POST /api/flights/search - Search for flights
// Implements Duffel Best Practices: https://duffel.com/docs/guides/following-search-best-practices
router.post('/search', async (req, res: Response) => {
    try {
        // Extract search parameters including Duffel best practice options
        const { 
            slices, 
            passengers, 
            cabin_class = 'economy',
            // Duffel best practice parameters
            max_connections,
            direct_flights,
            max_price,
            sort_by,
            return_available_services = true
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

        console.log('[Flights] Searching flights:', { slices, passengers: normalizedPassengers, cabin_class, max_connections, direct_flights, max_price, sort_by });

        // Build offer request with Duffel best practices
        const offerRequestData: any = {
            slices,
            passengers: normalizedPassengers,
            cabin_class,
            return_available_services,
        };

        // Apply Duffel best practice filters
        if (max_connections !== undefined) {
            // Limit number of connections (0 = direct only)
            offerRequestData.max_connections = parseInt(max_connections, 10);
        }

        if (direct_flights === true) {
            // Request only direct flights - shorthand for max_connections: 0
            offerRequestData.max_connections = 0;
        }

        if (max_price) {
            // Set maximum price to filter expensive flights
            offerRequestData.max_price = {
                amount: parseFloat(max_price.amount || max_price),
                currency: max_price.currency || 'USD',
            };
        }

        if (sort_by) {
            // Sort results: 'total_amount' (cheapest), 'duration' (fastest), 'departure', 'arrival'
            offerRequestData.sort_by = sort_by;
        }

        // Create offer request in Duffel
        const duffelResponse = await duffelApi<any>('/air/offer_requests', 'POST', {
            data: offerRequestData,
        });

        const offers = duffelResponse.data?.offers || [];
        const offerRequestId = duffelResponse.data?.id;

        // Store offer request in database
        await prisma.duffelOfferRequest.create({
            data: {
                externalId: offerRequestId,
                slices: slices,
                passengers: passengers,
                cabinClass: cabin_class,
                offersCount: offers.length,
                expiresAt: duffelResponse.data?.expires_at ? new Date(duffelResponse.data.expires_at) : null,
                status: 'completed',
            },
        });

        // Transform offers for frontend
        const transformedOffers = offers.map((offer: any) => {
            const firstSlice = offer.slices?.[0];
            const firstSegment = firstSlice?.segments?.[0];
            const lastSegment = firstSlice?.segments?.[firstSlice.segments.length - 1];

            return {
                id: offer.id,
                offerId: offer.id,
                airline: firstSegment?.operating_carrier?.name || firstSegment?.marketing_carrier?.name || 'Unknown',
                flightNumber: firstSegment?.marketing_carrier_flight_number || '',
                carrierCode: firstSegment?.marketing_carrier?.iata_code || '',
                departureTime: firstSegment?.departing_at || '',
                arrivalTime: lastSegment?.arriving_at || '',
                origin: firstSegment?.origin?.iata_code || '',
                destination: lastSegment?.destination?.iata_code || '',
                duration: firstSlice?.duration || '',
                stops: (firstSlice?.segments?.length || 1) - 1,
                amount: parseFloat(offer.total_amount) || 0,
                currency: offer.total_currency || 'USD',
                cabin: firstSegment?.passengers?.[0]?.cabin_class || cabin_class,
                refundable: offer.conditions?.refund_before_departure?.allowed || false,
                segments: firstSlice?.segments?.map((seg: any) => ({
                    origin: seg.origin?.iata_code,
                    destination: seg.destination?.iata_code,
                    departureTime: seg.departing_at,
                    arrivalTime: seg.arriving_at,
                    carrierCode: seg.marketing_carrier?.iata_code,
                    flightNumber: seg.marketing_carrier_flight_number,
                    carrier: seg.marketing_carrier?.name,
                    duration: seg.duration,
                    aircraft: seg.aircraft?.name,
                })) || [],
                rawOffer: offer,
            };
        });

        res.json({
            success: true,
            data: {
                offers: transformedOffers,
                offerRequestId,
                expiresAt: duffelResponse.data?.expires_at,
                total: transformedOffers.length,
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

// GET /api/flights/offers/:offerId - Get offer details
router.get('/offers/:offerId', async (req, res: Response) => {
    try {
        const { offerId } = req.params;

        const duffelResponse = await duffelApi<any>(`/air/offers/${offerId}`);

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

// POST /api/flights/book - Create a flight booking
router.post('/book', async (req, res: Response) => {
    try {
        const {
            selectedOffers,
            passengers,
            paymentMethod,
            guestInfo,
            metadata
        } = req.body;

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

        console.log('[Flights] Creating booking:', { selectedOffers, passengerCount: passengers.length });

        // Create order in Duffel
        const duffelResponse = await duffelApi<any>('/air/orders', 'POST', {
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
                payment: paymentMethod?.type === 'balance'
                    ? { type: 'balance' }
                    : { type: 'arc_bsp_cash' },
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
                baseAmount: new Decimal(baseAmount),
                taxAmount: new Decimal(taxAmount),
                markupAmount: new Decimal(0),
                totalAmount: new Decimal(totalAmount),
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
                baseAmount: new Decimal(baseAmount),
                taxAmount: new Decimal(taxAmount),
                totalAmount: new Decimal(totalAmount),
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
                    dateOfBirth: passenger.born_at || passenger.dob ? new Date(passenger.born_at || passenger.dob) : null,
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

// GET /api/flights/booking/:bookingRef - Get booking details
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
                duffelOrder = await duffelApi<any>(`/air/orders/${metadata.duffelOrderId}`);
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

// POST /api/flights/booking/:bookingRef/cancel - Cancel booking
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
        const cancelMetadata = booking.metadata as { duffelOrderId?: string } | null;
        if (cancelMetadata?.duffelOrderId) {
            try {
                cancellation = await duffelApi<any>('/air/order_cancellations', 'POST', {
                    data: {
                        order_id: cancelMetadata.duffelOrderId,
                    },
                });
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

// GET /api/flights/airports - Search airports
router.get('/airports', async (req, res: Response) => {
    try {
        const { search } = req.query;

        if (!search || search.toString().length < 2) {
            return res.json({
                success: true,
                data: [],
            });
        }

        const airports = await prisma.airport.findMany({
            where: {
                OR: [
                    { iata_code: { contains: search.toString().toUpperCase() } },
                    { name: { contains: search.toString(), mode: Prisma.QueryMode.insensitive } },
                    { city: { contains: search.toString(), mode: Prisma.QueryMode.insensitive } },
                ],
                is_active: true,
            },
            take: 20,
            orderBy: { name: 'asc' },
        });

        res.json({
            success: true,
            data: airports,
        });
    } catch (error: any) {
        console.error('[Flights] Airport search error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to search airports',
        });
    }
});

// GET /api/flights/airlines - Get airlines
router.get('/airlines', async (req, res: Response) => {
    try {
        const { search } = req.query;

        const where = search ? {
            OR: [
                { iata_code: { contains: search.toString().toUpperCase() } },
                { name: { contains: search.toString(), mode: Prisma.QueryMode.insensitive } },
            ],
        } : {};

        const airlines = await prisma.airline.findMany({
            where: {
                ...where,
                is_active: true,
            },
            take: 50,
            orderBy: { name: 'asc' },
        });

        res.json({
            success: true,
            data: airlines,
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