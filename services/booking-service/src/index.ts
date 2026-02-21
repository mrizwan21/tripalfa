import express, { Express, Request, Response } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import bookingsRoutes from './routes/bookings.js'
import documentsRoutes from './routes/documents.js'
// import bookingsV2Routes from './routes/bookingsV2.js'
import orderManagementRoutes from './routes/order-management.js'
import inventoryRoutes from './routes/inventory.js'
import auditRoutes from './routes/audit.js'
import adminBookingCardRoutes from './routes/adminBookingCard.js'
import liteApiRoutes from './routes/liteapi.js'
import airlineCreditsRoutes from './routes/airlineCredits.js'
import webhookRoutes from './routes/webhooks.js'
import duffelRoutes from './routes/duffel.js'
import staticDataRoutes from './routes/static-data.js'

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

dotenv.config()

const app: Express = express()
const PORT = process.env.BOOKING_SERVICE_PORT || 3001

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`)
  next()
})

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'booking-service' })
})

// ============================================================================
// UNIFIED ROUTE ENDPOINT - For frontend compatibility
// Frontend calls POST /route with { provider: 'duffel', env, data: {...} }
// ============================================================================

app.post('/route', async (req: Request, res: Response) => {
  try {
    const { provider, env, data } = req.body;

    if (provider !== 'duffel') {
      return res.status(400).json({ error: 'Only duffel provider is supported' });
    }

    console.log(`[Route] Duffel request - env: ${env}, data keys:`, Object.keys(data || {}));

    // Forward to Duffel API - create offer request
    const duffelResponse = await duffelApi<any>('/air/offer_requests', 'POST', {
      data: {
        slices: data?.slices,
        passengers: data?.passengers,
        cabin_class: data?.cabin_class || 'economy',
        return_available_services: data?.return_available_services ?? true,
      },
    });

    // Return offers in expected format
    res.json({
      offers: duffelResponse.data?.offers || [],
      offer_request_id: duffelResponse.data?.id,
      expires_at: duffelResponse.data?.expires_at,
    });
  } catch (error: any) {
    console.error('[Route] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// BOOKINGS FLIGHT ENDPOINTS - For frontend booking flow
// ============================================================================

app.post('/bookings/flight/order', async (req: Request, res: Response) => {
  try {
    const { selectedOffers, passengers, orderType, paymentMethod } = req.body;

    console.log('[Bookings] Creating flight order:', { selectedOffers, passengerCount: passengers?.length });

    // Create order in Duffel
    const duffelResponse = await duffelApi<any>('/air/orders', 'POST', {
      data: {
        selected_offers: selectedOffers,
        passengers: passengers?.map((p: any) => ({
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

    res.json({
      success: true,
      order: duffelResponse.data,
      orderId: duffelResponse.data?.id,
    });
  } catch (error: any) {
    console.error('[Bookings] Create order error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post('/search/flights', async (req: Request, res: Response) => {
  try {
    const { slices, passengers, cabin_class } = req.body;

    console.log('[Search] Flight search:', { slices, passengers, cabin_class });

    const duffelResponse = await duffelApi<any>('/air/offer_requests', 'POST', {
      data: {
        slices,
        passengers,
        cabin_class: cabin_class || 'economy',
        return_available_services: true,
      },
    });

    const offers = duffelResponse.data?.offers || [];

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
        cabin: firstSegment?.passengers?.[0]?.cabin_class || cabin_class || 'economy',
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

    res.json(transformedOffers);
  } catch (error: any) {
    console.error('[Search] Flight search error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// API Routes
app.use('/api/bookings', bookingsRoutes)

// Document Routes - for generating all document types
app.use('/api/documents', documentsRoutes)

// V2 Booking Routes (with workflow state machine)
// app.use('/api/v2/admin/bookings', bookingsV2Routes)

// Legacy admin routes
app.use('/api/order-management', orderManagementRoutes)
app.use('/api/inventory', inventoryRoutes)
app.use('/api/audit', auditRoutes)
app.use('/api/admin-bookings', adminBookingCardRoutes)

// LITEAPI Routes (Hotels & Loyalty)
app.use('/api', liteApiRoutes)

// Airline Credits Routes (Duffel Frequent Flyer)
app.use('/api/airline-credits', airlineCreditsRoutes)

// Webhook Routes (Duffel & LITEAPI)
app.use('/api/webhooks', webhookRoutes)

// Duffel Flight API Routes (Offers, Orders, Cancellations, Changes)
app.use('/api/duffel', duffelRoutes)

// Static Data Routes (Hotel Amenities, Room Types, Board Types from PostgreSQL)
// Mounted at BOTH /api/static-data AND / for frontend proxy compatibility
app.use('/api/static-data', staticDataRoutes)
app.use('/', staticDataRoutes)

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' })
})

// Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[BookingService] Error:', err)
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message || 'Unknown error',
  })
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Booking Service running on port ${PORT}`)
})

export default app
