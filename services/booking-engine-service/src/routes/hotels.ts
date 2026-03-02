import { Router, Response } from "express";
import axios from "axios";
import { randomUUID } from "node:crypto";
import prisma, { Decimal } from "../database.js";
import { Prisma } from "@prisma/client";
import { validateLiteApiId } from "../utils/validation.js";

const router: Router = Router();

// LITEAPI configuration
const LITEAPI_BASE_URL =
  process.env.LITEAPI_BASE_URL || "https://api.liteapi.travel";
const LITEAPI_API_KEY = process.env.LITEAPI_API_KEY || "";

// Helper for LITEAPI requests
async function liteApiRequest<T>(
  endpoint: string,
  params: Record<string, any> = {},
): Promise<T> {
  const response = await axios.get(`${LITEAPI_BASE_URL}${endpoint}`, {
    headers: {
      "X-API-Key": LITEAPI_API_KEY,
      Accept: "application/json",
    },
    params,
  });
  return response.data;
}

async function liteApiPost<T>(
  endpoint: string,
  data: Record<string, any>,
): Promise<T> {
  const response = await axios.post(`${LITEAPI_BASE_URL}${endpoint}`, data, {
    headers: {
      "X-API-Key": LITEAPI_API_KEY,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });
  return response.data;
}

// POST /api/hotels/search - Search for hotels
router.post("/search", async (req, res: Response) => {
  try {
    const {
      destination,
      checkIn,
      checkOut,
      guests,
      rooms = 1,
      nationality,
      currency = "USD",
    } = req.body;

    if (!destination || !checkIn || !checkOut) {
      return res.status(400).json({
        success: false,
        error: "Destination, check-in, and check-out dates are required",
      });
    }

    console.log("[Hotels] Searching hotels:", {
      destination,
      checkIn,
      checkOut,
      guests,
      rooms,
    });

    // Search hotels via LITEAPI
    const searchResponse = await liteApiPost<any>("/v3.0/hotels/search", {
      destination,
      checkIn,
      checkOut,
      guests: guests || [{ adults: 2, children: [] }],
      rooms,
      nationality: nationality || "US",
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
            name: mapping.hotelName || "",
            starRating: 0,
            address: "",
            city: "",
            countryCode: "",
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
      }),
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
    console.error("[Hotels] Search error:", error.message);
    res.status(500).json({
      success: false,
      error: "Failed to search hotels",
      message: error.message,
    });
  }
});

// GET /api/hotels/:hotelId - Get hotel details
router.get("/:hotelId", async (req, res: Response) => {
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
        name: mapping.hotelName || "",
        description: "",
        starRating: 0,
        address: "",
        city: "",
        country: "",
        countryCode: "",
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
            name: canonicalHotel.name || "",
            description: canonicalHotel.description || "",
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
    const hotelDetails = await liteApiRequest<any>(
      `/v3.0/hotels/${safeHotelId}`,
    );

    res.json({
      success: true,
      data: hotelDetails.data || hotelDetails,
    });
  } catch (error: any) {
    console.error("[Hotels] Get hotel error:", error.message);
    res.status(500).json({
      success: false,
      error: "Failed to get hotel details",
    });
  }
});

// POST /api/hotels/:hotelId/rates - Get hotel rates
router.post("/:hotelId/rates", async (req, res: Response) => {
  try {
    const { hotelId } = req.params;
    const {
      checkIn,
      checkOut,
      guests,
      rooms = 1,
      nationality,
      currency = "USD",
    } = req.body;

    if (!checkIn || !checkOut) {
      return res.status(400).json({
        success: false,
        error: "Check-in and check-out dates are required",
      });
    }

    const safeHotelId = validateLiteApiId(hotelId);
    const ratesResponse = await liteApiPost<any>(
      `/v3.0/hotels/${safeHotelId}/rates`,
      {
        checkIn,
        checkOut,
        guests: guests || [{ adults: 2, children: [] }],
        rooms,
        nationality: nationality || "US",
        currency,
      },
    );

    res.json({
      success: true,
      data: ratesResponse.data || ratesResponse,
    });
  } catch (error: any) {
    console.error("[Hotels] Get rates error:", error.message);
    res.status(500).json({
      success: false,
      error: "Failed to get hotel rates",
    });
  }
});

// POST /api/hotels/book - Create hotel booking
router.post("/book", async (req, res: Response) => {
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
        error: "Hotel ID, offer ID, check-in, and check-out dates are required",
      });
    }

    console.log("[Hotels] Creating booking:", {
      hotelId,
      offerId,
      checkIn,
      checkOut,
    });

    // Create prebook session
    const prebookResponse = await liteApiPost<any>("/v3.0/hotels/prebook", {
      offerId,
      guestInfo: {
        email: guestInfo?.email,
        firstName: guestInfo?.firstName,
        lastName: guestInfo?.lastName,
        phone: guestInfo?.phone,
      },
    });

    if (!prebookResponse.success && !prebookResponse.data) {
      return res.status(400).json({
        success: false,
        error: prebookResponse.message || "Failed to prebook hotel",
      });
    }

    // Extract values with proper typing
    const prebookData = prebookResponse.data;
    const baseAmount = Number(
      prebookData?.baseAmount || prebookData?.price || 0,
    );
    const taxAmount = Number(prebookData?.taxAmount || 0);
    const totalAmount = Number(
      prebookData?.totalAmount || prebookData?.price || 0,
    );
    const currency = String(prebookData?.currency || "USD");
    const prebookId = String(
      prebookData?.prebookId || prebookData?.id || randomUUID(),
    );
    const hotelName = String(prebookData?.hotelName || "");

    // Create local booking record
    const bookingRef = `HTL-${Date.now().toString(36).toUpperCase()}`;

    const booking = await prisma.booking.create({
      data: {
        bookingRef,
        userId: guestInfo?.id || "guest",
        serviceType: "hotel",
        status: "confirmed",
        workflowState: "confirmed",
        paymentStatus: "pending",
        customerEmail: guestInfo?.email,
        customerPhone: guestInfo?.phone,
        baseAmount: new Decimal(baseAmount),
        taxAmount: new Decimal(taxAmount),
        markupAmount: new Decimal(0),
        totalAmount: new Decimal(totalAmount),
        currency: currency,
        travelDate: new Date(checkIn),
        returnDate: new Date(checkOut),
        metadata: {
          hotelId,
          offerId,
          prebookId: prebookId,
          rooms,
          specialRequests,
          ...metadata,
        },
      },
    });

    // Create booking segment
    await prisma.bookingSegment.create({
      data: {
        bookingId: booking.id,
        segmentType: "hotel_checkin",
        sequenceNumber: 0,
        hotelName: hotelName || metadata?.hotelName,
        checkInDate: new Date(checkIn),
        checkOutDate: new Date(checkOut),
        roomType: rooms?.[0]?.roomType || "Standard",
        supplierHotelId: hotelId,
      },
    });

    // Create booking passengers (guests)
    if (guests && Array.isArray(guests)) {
      for (const guest of guests) {
        await prisma.bookingPassenger.create({
          data: {
            bookingId: booking.id,
            passengerType: "adult",
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
        price: new Decimal(totalAmount),
        currency: currency,
        guestEmail: guestInfo?.email,
        guestName: guestInfo
          ? `${guestInfo.firstName} ${guestInfo.lastName}`
          : null,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
        status: "pending",
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
    console.error("[Hotels] Booking error:", error.message);
    res.status(500).json({
      success: false,
      error: "Failed to create hotel booking",
      message: error.message,
    });
  }
});

// GET /api/hotels/booking/:bookingRef - Get hotel booking
router.get("/booking/:bookingRef", async (req, res: Response) => {
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
        error: "Booking not found",
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
    console.error("[Hotels] Get booking error:", error.message);
    res.status(500).json({
      success: false,
      error: "Failed to get booking details",
    });
  }
});

// POST /api/hotels/booking/:bookingRef/cancel - Cancel hotel booking
router.post("/booking/:bookingRef/cancel", async (req, res: Response) => {
  try {
    const { bookingRef } = req.params;
    const { reason } = req.body;

    const booking = await prisma.booking.findUnique({
      where: { bookingRef },
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: "Booking not found",
      });
    }

    if (booking.status === "cancelled") {
      return res.status(400).json({
        success: false,
        error: "Booking is already cancelled",
      });
    }

    // Try to cancel with supplier if prebook session exists
    const hotelMetadata = booking.metadata as { prebookId?: string } | null;
    if (hotelMetadata?.prebookId) {
      try {
        await liteApiPost<any>("/v3.0/hotels/cancel", {
          prebookId: hotelMetadata.prebookId,
        });
      } catch (e: any) {
        console.warn("[Hotels] Could not cancel with supplier:", e.message);
      }
    }

    // Update booking status
    const updatedBooking = await prisma.booking.update({
      where: { bookingRef },
      data: {
        status: "cancelled",
        workflowState: "cancelled",
      },
    });

    // Create modification record
    await prisma.bookingModification.create({
      data: {
        bookingId: booking.id,
        modificationType: "cancellation",
        status: "completed",
        requestNote: reason,
        oldValue: { status: booking.status },
        newValue: { status: "cancelled" },
      },
    });

    res.json({
      success: true,
      data: updatedBooking,
      message: "Hotel booking cancelled successfully",
    });
  } catch (error: any) {
    console.error("[Hotels] Cancel booking error:", error.message);
    res.status(500).json({
      success: false,
      error: "Failed to cancel hotel booking",
    });
  }
});

// GET /api/hotels/destinations - Search destinations
router.get("/destinations/search", async (req, res: Response) => {
  try {
    const { search } = req.query;

    if (!search || search.toString().length < 2) {
      return res.json({
        success: true,
        data: [],
      });
    }

    // Search in destinations table
    const destinations = await prisma.destination.findMany({
      where: {
        OR: [
          { name: { contains: search.toString() } },
          { code: { contains: search.toString().toUpperCase() } },
          { countryCode: { contains: search.toString().toUpperCase() } },
        ],
        isActive: true,
      },
      take: 20,
      orderBy: { createdAt: "desc" },
    });

    res.json({
      success: true,
      data: destinations,
    });
  } catch (error: any) {
    console.error("[Hotels] Destination search error:", error.message);
    res.status(500).json({
      success: false,
      error: "Failed to search destinations",
    });
  }
});

// GET /api/hotels/amenities - Get hotel amenities
router.get("/amenities", async (req, res: Response) => {
  try {
    const amenities = await prisma.hotelAmenity.findMany({
      where: { isActive: true },
      orderBy: { category: "asc" },
    });

    res.json({
      success: true,
      data: amenities,
    });
  } catch (error: any) {
    console.error("[Hotels] Get amenities error:", error.message);
    res.status(500).json({
      success: false,
      error: "Failed to get amenities",
    });
  }
});

// GET /api/hotels/board-types - Get board types
router.get("/board-types", async (req, res: Response) => {
  try {
    const boardTypes = await prisma.boardType.findMany({
      where: { isActive: true },
      orderBy: { code: "asc" },
    });

    res.json({
      success: true,
      data: boardTypes,
    });
  } catch (error: any) {
    console.error("[Hotels] Get board types error:", error.message);
    res.status(500).json({
      success: false,
      error: "Failed to get board types",
    });
  }
});

export default router;
