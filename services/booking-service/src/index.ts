import dotenv from "dotenv";
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

// Load environment variables from root .env file BEFORE any other imports
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, "../../..");
dotenv.config({ path: resolve(rootDir, ".env") });

// Now import other modules that depend on environment variables
import express, { Express, Request, Response } from "express";
import cors from "cors";
import bookingsRoutes from "./routes/bookings.js";
import documentsRoutes from "./routes/documents.js";
import orderManagementRoutes from "./routes/order-management.js";
import inventoryRoutes from "./routes/inventory.js";
import auditRoutes from "./routes/audit.js";
import adminBookingCardRoutes from "./routes/adminBookingCard.js";
import liteApiRoutes from "./routes/liteapi.js";
import airlineCreditsRoutes from "./routes/airlineCredits.js";
import webhookRoutes from "./routes/webhooks.js";
import duffelRoutes from "./routes/duffel.js";
import flightBookingRoutes from "./routes/flight-booking.js";
import hotelBookingRoutes from "./routes/hotel-booking.js";
import realtimeBookingRoutes from "./routes/realtime-booking.js";
import hotelRoutes from "./routes/hotels.js";

// Duffel API configuration
const DUFFEL_API_URL = process.env.DUFFEL_API_URL || "https://api.duffel.com";

function resolveDuffelApiKey() {
  const normalizeToken = (value?: string) => {
    if (!value) return "";
    const trimmed = value.trim().replace(/^['\"]|['\"]$/g, "");
    const withoutBearer = trimmed.replace(/^Bearer\s+/i, "").trim();
    return withoutBearer.startsWith("duffel_") ? withoutBearer : "";
  };

  const envKey = normalizeToken(
    process.env.DUFFEL_API_KEY || process.env.DUFFEL_TEST_TOKEN,
  );
  if (envKey) {
    return envKey;
  }

  const keyPath = resolve(rootDir, "secrets", "duffel_api_key.txt");
  if (fs.existsSync(keyPath)) {
    const fileKey = normalizeToken(fs.readFileSync(keyPath, "utf8"));
    if (fileKey) {
      return fileKey;
    }
  }

  return "";
}

const DUFFEL_API_KEY = resolveDuffelApiKey();
const DUFFEL_VERSION = "v2";

// Helper to make authenticated Duffel API requests
async function duffelApi<T>(
  endpoint: string,
  method: string = "GET",
  body?: object,
): Promise<T> {
  const url = `${DUFFEL_API_URL}${endpoint}`;
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${DUFFEL_API_KEY}`,
      "Duffel-Version": DUFFEL_VERSION,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Duffel API Error (${response.status}): ${errorText}`);
  }
  return response.json();
}

const app: Express = express();
const PORT = process.env.BOOKING_SERVICE_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "healthy", service: "booking-service" });
});

// ============================================================================
// UNIFIED ROUTE ENDPOINT - For frontend compatibility
// Frontend calls POST /route with { provider: 'duffel', env, data: {...} }
// ============================================================================

app.post("/route", async (req: Request, res: Response) => {
  try {
    const { provider, env, data } = req.body;

    if (provider !== "duffel") {
      return res
        .status(400)
        .json({ error: "Only duffel provider is supported" });
    }

    console.log(
      `[Route] Duffel request - env: ${env}, data keys:`,
      Object.keys(data || {}),
    );

    // Forward to Duffel API - create offer request
    const duffelResponse = await duffelApi<any>("/air/offer_requests", "POST", {
      data: {
        slices: data?.slices,
        passengers: data?.passengers,
        cabin_class: data?.cabin_class || "economy",
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
    console.error("[Route] Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// BOOKINGS FLIGHT ENDPOINTS - For frontend booking flow
// ============================================================================

function normalizePassenger(p: any) {
  const rawGender = String(p.gender || "M").toLowerCase();
  const gender = rawGender === "m" || rawGender === "male" ? "m" : "f";
  const bornOn = p.born_on || p.born_at || p.dob;

  return {
    id: p.id,
    given_name: p.given_name || p.firstName,
    family_name: p.family_name || p.lastName,
    email: p.email,
    phone_number: p.phone_number,
    born_on: bornOn,
    title: (p.title || (gender === "m" ? "mr" : "ms")).toLowerCase(),
    gender,
    type: p.type || "adult",
  };
}

function normalizePaymentAmount(rawAmount: any) {
  const amountNumber = Number(rawAmount);
  if (!Number.isFinite(amountNumber)) return "0.00";

  if (Number.isInteger(amountNumber) && amountNumber >= 1000) {
    return (amountNumber / 100).toFixed(2);
  }

  return amountNumber.toFixed(2);
}

app.post("/bookings/flight/order", async (req: Request, res: Response) => {
  try {
    const { selectedOffers, passengers, orderType, paymentMethod } = req.body;

    console.log("[Bookings] Creating flight order:", {
      selectedOffers,
      passengerCount: passengers?.length,
      orderType,
    });

    const mappedPassengers = passengers?.map((p: any) => normalizePassenger(p));
    const requestedOrderType = String(orderType || "hold").toLowerCase();
    const createUnpaidHold = requestedOrderType === "hold";

    if (createUnpaidHold) {
      const firstOfferId = selectedOffers?.[0];
      if (!firstOfferId) {
        return res
          .status(400)
          .json({ error: "selectedOffers is required for hold orders" });
      }

      const offerResponse = await duffelApi<any>(`/air/offers/${firstOfferId}`);
      const requiresInstantPayment =
        offerResponse?.data?.payment_requirements?.requires_instant_payment;

      if (requiresInstantPayment !== false) {
        return res.status(400).json({
          error:
            "Selected offer does not allow holds. Choose an offer with payment_requirements.requires_instant_payment = false",
          payment_requirements: offerResponse?.data?.payment_requirements,
        });
      }
    }

    // Create order in Duffel
    const duffelResponse = await duffelApi<any>("/air/orders", "POST", {
      data: {
        ...(createUnpaidHold ? { type: "hold" } : {}),
        selected_offers: selectedOffers,
        passengers: mappedPassengers,
        ...(!createUnpaidHold
          ? {
              payments: [
                {
                  type:
                    paymentMethod?.type === "balance"
                      ? "balance"
                      : "arc_bsp_cash",
                  amount: normalizePaymentAmount(
                    paymentMethod?.amount?.amount || paymentMethod?.amount,
                  ),
                  currency: String(
                    paymentMethod?.amount?.currency ||
                      paymentMethod?.currency ||
                      "USD",
                  ).toUpperCase(),
                },
              ],
            }
          : {}),
      },
    });

    res.json({
      success: true,
      order: duffelResponse.data,
      orderId: duffelResponse.data?.id,
      id: duffelResponse.data?.id,
      payment_required_by: duffelResponse.data?.payment_required_by,
      data: duffelResponse.data,
    });
  } catch (error: any) {
    console.error("[Bookings] Create order error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get(
  "/bookings/flight/order/:orderId",
  async (req: Request, res: Response) => {
    try {
      const { orderId } = req.params;
      const duffelResponse = await duffelApi<any>(`/air/orders/${orderId}`);

      res.json({
        success: true,
        id: duffelResponse.data?.id,
        order: duffelResponse.data,
        data: duffelResponse.data,
      });
    } catch (error: any) {
      console.error("[Bookings] Get order error:", error.message);
      res.status(500).json({ error: error.message });
    }
  },
);

app.post(
  "/bookings/flight/payment-intent",
  async (req: Request, res: Response) => {
    try {
      const { order_id, amount } = req.body;

      if (!order_id) {
        return res.status(400).json({ error: "order_id is required" });
      }

      const paymentAmount = normalizePaymentAmount(amount?.amount ?? amount);
      const paymentCurrency = String(amount?.currency || "USD").toUpperCase();

      let duffelResponse: any;
      try {
        duffelResponse = await duffelApi<any>("/air/payments", "POST", {
          data: {
            order_id,
            payment: {
              type: "balance",
              amount: paymentAmount,
              currency: paymentCurrency,
            },
          },
        });
      } catch (primaryError) {
        duffelResponse = await duffelApi<any>("/air/payments", "POST", {
          data: {
            order_id,
            payments: [
              {
                type: "balance",
                amount: paymentAmount,
                currency: paymentCurrency,
              },
            ],
          },
        });
      }

      res.json({
        success: true,
        id: duffelResponse.data?.id,
        paymentId: duffelResponse.data?.id,
        data: duffelResponse.data,
      });
    } catch (error: any) {
      console.error("[Bookings] Payment intent error:", error.message);
      res.status(500).json({ error: error.message });
    }
  },
);

app.post(
  "/bookings/flight/order/:orderId/confirm",
  async (req: Request, res: Response) => {
    try {
      const { orderId } = req.params;

      let confirmResponse: any = null;
      try {
        confirmResponse = await duffelApi<any>(
          `/air/orders/${orderId}/confirm_payment`,
          "POST",
          {
            data: {},
          },
        );
      } catch {
        confirmResponse = await duffelApi<any>(`/air/orders/${orderId}`);
      }

      res.json({
        success: true,
        id: confirmResponse.data?.id,
        data: confirmResponse.data,
        order: confirmResponse.data,
      });
    } catch (error: any) {
      console.error("[Bookings] Confirm order error:", error.message);
      res.status(500).json({ error: error.message });
    }
  },
);

app.post("/search/flights", async (req: Request, res: Response) => {
  try {
    const {
      slices,
      passengers,
      cabin_class,
      // Pagination parameters
      limit = 20,
      offset = 0,
      // Filter parameters
      maxPrice,
      stops,
      airlines,
      departureTime,
      // Sort parameters
      sortBy,
      sortOrder,
    } = req.body;

    console.log("[Search] Flight search:", {
      slices,
      passengers,
      cabin_class,
      limit,
      offset,
    });

    const duffelResponse = await duffelApi<any>("/air/offer_requests", "POST", {
      data: {
        slices,
        passengers,
        cabin_class: cabin_class || "economy",
        return_available_services: true,
      },
    });

    let offers = duffelResponse.data?.offers || [];

    // Transform offers for frontend
    let transformedOffers = offers.map((offer: any) => {
      const firstSlice = offer.slices?.[0];
      const firstSegment = firstSlice?.segments?.[0];
      const lastSegment =
        firstSlice?.segments?.[firstSlice.segments.length - 1];

      return {
        id: offer.id,
        offerId: offer.id,
        airline:
          firstSegment?.operating_carrier?.name ||
          firstSegment?.marketing_carrier?.name ||
          "Unknown",
        airlineCode: firstSegment?.marketing_carrier?.iata_code || "",
        flightNumber: firstSegment?.marketing_carrier_flight_number || "",
        carrierCode: firstSegment?.marketing_carrier?.iata_code || "",
        departureTime: firstSegment?.departing_at || "",
        arrivalTime: lastSegment?.arriving_at || "",
        origin: firstSegment?.origin?.iata_code || "",
        destination: lastSegment?.destination?.iata_code || "",
        duration: firstSlice?.duration || "",
        stops: (firstSlice?.segments?.length || 1) - 1,
        amount: parseFloat(offer.total_amount) || 0,
        currency: offer.total_currency || "USD",
        cabin:
          firstSegment?.passengers?.[0]?.cabin_class ||
          cabin_class ||
          "economy",
        refundable: offer.conditions?.refund_before_departure?.allowed || false,
        changeable: offer.conditions?.change_before_departure?.allowed || false,
        refundPenalty: offer.conditions?.refund_before_departure?.penalty_amount
          ? `${offer.conditions.refund_before_departure.penalty_currency || "USD"} ${offer.conditions.refund_before_departure.penalty_amount}`
          : null,
        changePenalty: offer.conditions?.change_before_departure?.penalty_amount
          ? `${offer.conditions.change_before_departure.penalty_currency || "USD"} ${offer.conditions.change_before_departure.penalty_amount}`
          : null,
        segments:
          firstSlice?.segments?.map((seg: any) => ({
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

    // Apply filters
    if (maxPrice !== undefined) {
      transformedOffers = transformedOffers.filter(
        (o: any) => o.amount <= Number(maxPrice),
      );
    }
    if (stops !== undefined) {
      const stopFilter = Number(stops);
      transformedOffers = transformedOffers.filter(
        (o: any) => o.stops === stopFilter,
      );
    }
    if (airlines && Array.isArray(airlines) && airlines.length > 0) {
      transformedOffers = transformedOffers.filter((o: any) =>
        airlines.some(
          (a: string) =>
            o.airlineCode?.toLowerCase() === a.toLowerCase() ||
            o.airline?.toLowerCase().includes(a.toLowerCase()),
        ),
      );
    }

    // Apply sorting
    if (sortBy) {
      const isAsc = sortOrder === "asc";

      transformedOffers.sort((a: any, b: any) => {
        let aVal: any, bVal: any;

        switch (sortBy) {
          case "price":
            aVal = a.amount;
            bVal = b.amount;
            break;
          case "duration":
            // Parse duration (e.g., "PT2H30M" -> minutes)
            aVal = parseDuration(a.duration);
            bVal = parseDuration(b.duration);
            break;
          case "departure":
            aVal = new Date(a.departureTime).getTime();
            bVal = new Date(b.departureTime).getTime();
            break;
          case "airline":
            aVal = a.airline || "";
            bVal = b.airline || "";
            return isAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
          default:
            return 0;
        }

        return isAsc ? aVal - bVal : bVal - aVal;
      });
    }

    const total = transformedOffers.length;

    // Apply pagination
    if (offset !== undefined && limit !== undefined) {
      transformedOffers = transformedOffers.slice(
        Number(offset),
        Number(offset) + Number(limit),
      );
    }

    res.json({
      results: transformedOffers,
      total,
      offer_request_id: duffelResponse.data?.id,
      expires_at: duffelResponse.data?.expires_at,
    });
  } catch (error: any) {
    console.error("[Search] Flight search error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Helper function to parse ISO 8601 duration to minutes
function parseDuration(duration: string): number {
  if (!duration) return 0;
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || "0", 10);
  const minutes = parseInt(match[2] || "0", 10);
  return hours * 60 + minutes;
}

// API Routes
app.use("/api/bookings", bookingsRoutes);

// Document Routes - for generating all document types
app.use("/api/documents", documentsRoutes);

// V2 Booking Routes (with workflow state machine)
// app.use('/api/v2/admin/bookings', bookingsV2Routes)

// Legacy admin routes
app.use("/api/order-management", orderManagementRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/admin-bookings", adminBookingCardRoutes);

// LITEAPI Routes (Hotels & Loyalty)
app.use("/api", liteApiRoutes);

// Airline Credits Routes (Duffel Frequent Flyer)
app.use("/api/airline-credits", airlineCreditsRoutes);

// Webhook Routes (Duffel & LITEAPI)
app.use("/api/webhooks", webhookRoutes);

// Duffel Flight API Routes (Offers, Orders, Cancellations, Changes)
app.use("/api/duffel", duffelRoutes);

// Flight Booking Orchestrator Routes (E2E booking flow)
app.use("/api/flight-booking", flightBookingRoutes);

// Hotel Booking Orchestrator Routes (E2E hotel booking flow)
app.use("/api/hotel-booking", hotelBookingRoutes);

// Real-Time Hotel Booking Routes (LiteAPI direct integration with NEON DB)
app.use("/api/realtime-booking", realtimeBookingRoutes);

// Hotel Routes (Hybrid: Static DB + Live Rates from LiteAPI)
app.use("/api/hotels", hotelRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: "Not Found" });
});

// Error Handler
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    console.error("[BookingService] Error:", err);
    res.status(500).json({
      error: "Internal Server Error",
      message: err.message || "Unknown error",
    });
  },
);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Booking Service running on port ${PORT}`);
});

export default app;