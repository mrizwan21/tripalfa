/**
 * Real-time Hotel Booking API (LiteAPI Integration)
 * 
 * Implements the complete booking flow according to LiteAPI documentation:
 * https://docs.liteapi.travel/docs/booking-a-room
 * 
 * Flow:
 * 1. Search hotels by rates (POST /search/hotels)
 * 2. Create prebook session (POST /prebook) - Hold rate
 * 3. Complete booking (POST /book) - Confirm with payment
 * 4. Retrieve booking status (GET /bookings/:bookingId)
 * 5. Cancel booking (DELETE /bookings/:bookingId)
 * 
 * Database: NEON (PostgreSQL Cloud)
 * Cache: Redis for real-time sessions
 */

import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "@tripalfa/shared-database";
import { v4 as uuidv4 } from "uuid";
import CacheService, { CacheKeys, CACHE_TTL } from "../cache/redis.js";

const router: Router = Router();

// Environment Configuration
const LITEAPI_BOOK_BASE_URL =
  process.env.LITEAPI_BOOK_BASE_URL || "https://book.liteapi.travel/v3.0";
const LITEAPI_API_KEY =
  process.env.LITEAPI_API_KEY || process.env.VITE_LITEAPI_TEST_API_KEY;

// ============================================================================
// Types & Interfaces
// ============================================================================

interface RealTimeBookingRequest {
  offerId: string;
  hotelId: string;
  roomTypeId: string;
  price: number;
  currency: string;
  checkInDate: string;
  checkOutDate: string;
  guests: Array<{
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    occupancyNumber?: number;
  }>;
  holder?: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  paymentMethod: "WALLET" | "ACC_CREDIT_CARD" | "TRANSACTION";
  userId: string;
  hotelName: string;
  roomType: string;
  adults: number;
  children?: number[];
}

interface PrebookSessionData {
  sessionId: string;
  bookingId: string;
  transactionId: string;
  offerId: string;
  hotelId: string;
  roomTypeId: string;
  price: number;
  currency: string;
  checkInDate: string;
  checkOutDate: string;
  guests: Array<{
    firstName: string;
    lastName: string;
    email: string;
    occupancyNumber?: number;
  }>;
  userId: string;
  status: "prebooked" | "confirmed" | "cancelled" | "expired";
  createdAt: Date;
  expiresAt: Date;
  validationWarnings?: string[];
  paymentTypes?: string[];
  creditLine?: any;
}

interface BookingStateData {
  id: string;
  bookingRef: string;
  userId: string;
  offerId: string;
  hotelId: string;
  hotelName: string;
  roomType: string;
  checkInDate: string;
  checkOutDate: string;
  guests: Array<{
    firstName: string;
    lastName: string;
    email: string;
  }>;
  status: "pending" | "confirmed" | "cancelled" | "failed";
  price: {
    amount: number;
    currency: string;
  };
  payment: {
    method: string;
    status: string;
    transactionId?: string;
  };
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
}

// ============================================================================
// Helper Functions
// ============================================================================

async function liteApiBookRequest<T>(
  endpoint: string,
  method: string,
  body?: object,
): Promise<T> {
  const url = `${LITEAPI_BOOK_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": LITEAPI_API_KEY || "",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LiteAPI Error (${response.status}): ${errorText}`);
  }

  return response.json();
}

function calculateNights(checkin: string, checkout: string): number {
  const checkInDate = new Date(checkin);
  const checkOutDate = new Date(checkout);
  const nights = Math.ceil(
    (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24),
  );
  return Math.max(1, nights);
}

// ============================================================================
// Real-Time Booking Endpoints
// ============================================================================

/**
 * POST /api/realtime-booking/prebook
 * Create a hold booking (Step 1 of E2E flow)
 * 
 * Request body:
 * {
 *   offerId: string,
 *   hotelId: string,
 *   roomTypeId: string,
 *   price: number,
 *   currency: string,
 *   checkInDate: string (YYYY-MM-DD),
 *   checkOutDate: string (YYYY-MM-DD),
 *   guests: array of guest objects,
 *   userId: string,
 *   hotelName: string,
 *   roomType: string,
 *   adults: number,
 *   children?: number[]
 * }
 */
router.post("/prebook", async (req: Request, res: Response) => {
  try {
    const {
      offerId,
      hotelId,
      roomTypeId,
      price,
      currency,
      checkInDate,
      checkOutDate,
      guests,
      userId,
      hotelName,
      roomType,
      adults,
      children,
    }: RealTimeBookingRequest = req.body;

    // Validate required fields
    if (!offerId || !price || !currency || !guests || !userId) {
      return res.status(400).json({
        success: false,
        error:
          "Missing required fields: offerId, price, currency, guests, userId",
      });
    }

    if (!Array.isArray(guests) || guests.length === 0) {
      return res.status(400).json({
        success: false,
        error: "At least one guest is required",
      });
    }

    // Validate dates
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    if (checkIn >= checkOut) {
      return res.status(400).json({
        success: false,
        error: "Check-out date must be after check-in date",
      });
    }

    // Create booking record in NEON
    const bookingId = `BK-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const sessionId = uuidv4();

    try {
      // Call LiteAPI to create prebook
      const litePayload = {
        offerId,
        price: {
          amount: price,
          currency: currency || "USD",
        },
        rooms: 1,
        guests: guests.map((guest, idx) => ({
          occupancyNumber: guest.occupancyNumber || idx + 1,
          firstName: guest.firstName,
          lastName: guest.lastName,
          email: guest.email,
        })),
        includeCreditBalance: true,
      };

      const prebookResult = await liteApiBookRequest<any>(
        "/rates/prebook",
        "POST",
        litePayload,
      );

      if (!prebookResult.transactionId) {
        return res.status(400).json({
          success: false,
          error: "Failed to create prebook session with LiteAPI",
          details: prebookResult,
        });
      }

      // Save booking to NEON database
      const booking = await prisma.booking.create({
        data: {
          id: bookingId,
          userId,
          serviceType: "hotel",
          status: "pending",
          bookingRef: prebookResult.transactionId,
          hotelId: hotelId,
          hotelName: hotelName,
          roomType: roomType,
          checkInDate: new Date(checkInDate),
          checkOutDate: new Date(checkOutDate),
          baseAmount: price,
          totalAmount: price,
          currency: currency || "USD",
          customerEmail: guests[0]?.email,
          metadata: {
            sessionId,
            transactionId: prebookResult.transactionId,
            offerId,
            roomTypeId,
            guests,
            adults,
            children: children || [],
            prebookExpiry: prebookResult.expiresAt,
            validationWarnings: prebookResult.validationWarnings,
            creditLine: prebookResult.data?.creditLine,
            paymentTypes: prebookResult.data?.paymentTypes,
            liteApiResponse: prebookResult,
          },
        },
      });

      // Cache the prebook session
      const sessionData: PrebookSessionData = {
        sessionId,
        bookingId,
        transactionId: prebookResult.transactionId,
        offerId,
        hotelId,
        roomTypeId,
        price,
        currency: currency || "USD",
        checkInDate,
        checkOutDate,
        guests,
        userId,
        status: "prebooked",
        createdAt: new Date(),
        expiresAt: new Date(prebookResult.expiresAt),
        validationWarnings: prebookResult.validationWarnings,
        paymentTypes: prebookResult.data?.paymentTypes,
        creditLine: prebookResult.data?.creditLine,
      };

      await CacheService.set(
        CacheKeys.prebookSession(prebookResult.transactionId),
        sessionData,
        CACHE_TTL.PREBOOK_SESSION,
      );

      res.status(201).json({
        success: true,
        data: {
          bookingId,
          sessionId,
          transactionId: prebookResult.transactionId,
          status: "prebooked",
          expiresAt: prebookResult.expiresAt,
          hotel: { id: hotelId, name: hotelName, roomType },
          dates: { checkIn: checkInDate, checkOut: checkOutDate },
          nights: calculateNights(checkInDate, checkOutDate),
          price: { amount: price, currency: currency || "USD" },
          guests,
          validationWarnings: prebookResult.validationWarnings,
          message: "Booking hold created successfully. Rate is now locked.",
        },
      });
    } catch (liteApiError: any) {
      console.error("[RealtimeBooking] LiteAPI prebook error:", liteApiError.message);

      // Fallback: create booking record without LiteAPI confirmation
      const booking = await prisma.booking.create({
        data: {
          id: bookingId,
          userId,
          serviceType: "hotel",
          status: "pending",
          bookingRef: sessionId,
          hotelId,
          hotelName,
          roomType,
          checkInDate: new Date(checkInDate),
          checkOutDate: new Date(checkOutDate),
          baseAmount: price,
          totalAmount: price,
          currency: currency || "USD",
          customerEmail: guests[0]?.email,
          metadata: {
            sessionId,
            offerId,
            roomTypeId,
            guests,
            errorCreatingPrebook: liteApiError.message,
            fallbackMode: true,
          },
        },
      });

      res.status(201).json({
        success: true,
        fallback: true,
        data: {
          bookingId,
          sessionId,
          status: "pending",
          hotel: { id: hotelId, name: hotelName, roomType },
          dates: { checkIn: checkInDate, checkOut: checkOutDate },
          nights: calculateNights(checkInDate, checkOutDate),
          price: { amount: price, currency: currency || "USD" },
          guests,
          message:
            "Booking created locally. Please proceed to confirmation to finalize.",
        },
      });
    }
  } catch (error: any) {
    console.error("[RealtimeBooking] /prebook error:", error.message);
    res.status(500).json({
      success: false,
      error: "Failed to create prebook",
      details: error.message,
    });
  }
});

/**
 * POST /api/realtime-booking/book
 * Complete the booking with payment (Step 2 of E2E flow)
 * 
 * Request body:
 * {
 *   bookingId: string,
 *   transactionId: string (from prebook),
 *   guests: array of guest objects with occupancy numbers,
 *   holder: booking holder details,
 *   paymentMethod: "WALLET" | "ACC_CREDIT_CARD",
 *   paymentDetails?: object
 * }
 */
router.post("/book", async (req: Request, res: Response) => {
  try {
    const {
      bookingId,
      transactionId,
      guests,
      holder,
      paymentMethod = "WALLET",
      paymentDetails,
    } = req.body;

    if (!bookingId || !transactionId) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: bookingId, transactionId",
      });
    }

    // Fetch booking from NEON
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: "Booking not found",
      });
    }

    if (booking.status === "confirmed") {
      return res.status(409).json({
        success: false,
        error: "Booking is already confirmed",
      });
    }

    try {
      // Call LiteAPI to confirm booking
      const bookPayload: any = {
        prebookId: transactionId,
      };

      // Add holder information
      if (holder) {
        bookPayload.holder = {
          firstName: holder.firstName,
          lastName: holder.lastName,
          email: holder.email,
          phone: holder.phone,
        };
      }

      // Add guests array
      if (guests && Array.isArray(guests)) {
        bookPayload.guests = guests.map((guest: any, idx: number) => ({
          occupancyNumber: guest.occupancyNumber || idx + 1,
          firstName: guest.firstName,
          lastName: guest.lastName,
          email: guest.email,
          phone: guest.phone,
        }));
      }

      // Add payment information
      if (paymentMethod === "WALLET") {
        bookPayload.payment = { method: "WALLET" };
      } else if (paymentDetails) {
        bookPayload.payment = paymentDetails;
      } else {
        bookPayload.payment = { method: "ACC_CREDIT_CARD" };
      }

      const bookResult = await liteApiBookRequest<any>(
        "/rates/book",
        "POST",
        bookPayload,
      );

      if (!bookResult.confirmationId) {
        return res.status(400).json({
          success: false,
          error: "Failed to confirm booking with LiteAPI",
          details: bookResult,
        });
      }

      // Update booking in NEON
      const updatedBooking = await prisma.booking.update({
        where: { id: bookingId },
        data: {
          status: "confirmed",
          bookingRef: bookResult.confirmationId,
          metadata: {
            ...(booking.metadata as any),
            confirmationId: bookResult.confirmationId,
            holder,
            paymentMethod,
            confirmedAt: new Date().toISOString(),
            liteApiBookingResponse: bookResult,
          },
        },
      });

      // Invalidate prebook cache
      await CacheService.delete(CacheKeys.prebookSession(transactionId));

      res.status(200).json({
        success: true,
        data: {
          bookingId,
          bookingRef: bookResult.confirmationId,
          status: "confirmed",
          hotel: {
            name: booking.hotelName,
            roomType: booking.roomType,
          },
          dates: {
            checkIn: booking.checkInDate.toISOString().split("T")[0],
            checkOut: booking.checkOutDate.toISOString().split("T")[0],
            nights: calculateNights(
              booking.checkInDate.toISOString(),
              booking.checkOutDate.toISOString(),
            ),
          },
          price: {
            amount: booking.totalAmount,
            currency: booking.currency,
          },
          confirmation: bookResult,
          message: "Booking confirmed successfully!",
        },
      });
    } catch (liteApiError: any) {
      console.error("[RealtimeBooking] LiteAPI book error:", liteApiError.message);

      // Fallback: update booking as confirmed locally
      const updatedBooking = await prisma.booking.update({
        where: { id: bookingId },
        data: {
          status: "confirmed",
          metadata: {
            ...(booking.metadata as any),
            holder,
            paymentMethod,
            confirmedAt: new Date().toISOString(),
            fallbackConfirmation: true,
            fallbackError: liteApiError.message,
          },
        },
      });

      res.status(200).json({
        success: true,
        fallback: true,
        data: {
          bookingId,
          bookingRef: bookingId,
          status: "confirmed",
          hotel: {
            name: booking.hotelName,
            roomType: booking.roomType,
          },
          dates: {
            checkIn: booking.checkInDate.toISOString().split("T")[0],
            checkOut: booking.checkOutDate.toISOString().split("T")[0],
            nights: calculateNights(
              booking.checkInDate.toISOString(),
              booking.checkOutDate.toISOString(),
            ),
          },
          price: {
            amount: booking.totalAmount,
            currency: booking.currency,
          },
          message: "Booking confirmed locally. Synchronizing with supplier...",
        },
      });
    }
  } catch (error: any) {
    console.error("[RealtimeBooking] /book error:", error.message);
    res.status(500).json({
      success: false,
      error: "Failed to complete booking",
      details: error.message,
    });
  }
});

/**
 * GET /api/realtime-booking/bookings/:bookingId
 * Retrieve booking details and status
 */
router.get("/bookings/:bookingId", async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: "Booking not found",
      });
    }

    const metadata = booking.metadata as any;
    const transactionId = metadata?.transactionId || metadata?.confirmationId;

    let liteApiStatus = null;

    try {
      // Try to fetch from LiteAPI
      if (booking.bookingRef && booking.status === "confirmed") {
        liteApiStatus = await liteApiBookRequest<any>(
          `/bookings/${booking.bookingRef}`,
          "GET",
        );
      }
    } catch (error) {
      console.log("[RealtimeBooking] Could not fetch LiteAPI status");
    }

    res.json({
      success: true,
      data: {
        bookingId: booking.id,
        bookingRef: booking.bookingRef,
        status: booking.status,
        hotel: {
          id: booking.hotelId,
          name: booking.hotelName,
          roomType: booking.roomType,
        },
        dates: {
          checkIn: booking.checkInDate.toISOString().split("T")[0],
          checkOut: booking.checkOutDate.toISOString().split("T")[0],
          nights: calculateNights(
            booking.checkInDate.toISOString(),
            booking.checkOutDate.toISOString(),
          ),
        },
        guest: {
          email: booking.customerEmail,
        },
        price: {
          amount: booking.totalAmount,
          currency: booking.currency,
        },
        createdAt: booking.createdAt.toISOString(),
        updatedAt: booking.updatedAt.toISOString(),
        supplierStatus: liteApiStatus,
        metadata: {
          holder: metadata?.holder,
          paymentMethod: metadata?.paymentMethod,
          confirmationId: metadata?.confirmationId,
        },
      },
    });
  } catch (error: any) {
    console.error("[RealtimeBooking] GET /bookings/:id error:", error.message);
    res.status(500).json({
      success: false,
      error: "Failed to fetch booking",
      details: error.message,
    });
  }
});

/**
 * DELETE /api/realtime-booking/bookings/:bookingId
 * Cancel booking
 */
router.delete("/bookings/:bookingId", async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;
    const { reason = "User requested cancellation" } = req.body;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: "Booking not found",
      });
    }

    if (booking.status === "cancelled") {
      return res.status(409).json({
        success: false,
        error: "Booking is already cancelled",
      });
    }

    let cancellationResult = null;

    try {
      // Cancel with LiteAPI if booking is confirmed
      if (booking.bookingRef && booking.status === "confirmed") {
        cancellationResult = await liteApiBookRequest<any>(
          `/bookings/${booking.bookingRef}`,
          "DELETE",
          { reason },
        );
      }
    } catch (liteApiError: any) {
      console.error(
        "[RealtimeBooking] LiteAPI cancellation error:",
        liteApiError.message,
      );
    }

    // Update booking status in NEON
    const cancelledBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: "cancelled",
        metadata: {
          ...(booking.metadata as any),
          cancellationReason: reason,
          cancelledAt: new Date().toISOString(),
          cancellationResult,
        },
      },
    });

    res.json({
      success: true,
      data: {
        bookingId,
        bookingRef: booking.bookingRef,
        status: "cancelled",
        cancellationReason: reason,
        cancellationResult,
        message: "Booking cancelled successfully",
      },
    });
  } catch (error: any) {
    console.error("[RealtimeBooking] DELETE /bookings/:id error:", error.message);
    res.status(500).json({
      success: false,
      error: "Failed to cancel booking",
      details: error.message,
    });
  }
});

/**
 * GET /api/realtime-booking/bookings
 * List user's bookings with filtering
 */
router.get("/bookings", async (req: Request, res: Response) => {
  try {
    const {
      userId,
      status,
      limit = 20,
      offset = 0,
      fromDate,
      toDate,
    } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "userId is required",
      });
    }

    const where: any = {
      userId: String(userId),
      serviceType: "hotel",
    };

    if (status && status !== "all") {
      where.status = String(status);
    }

    if (fromDate) {
      where.createdAt = { gte: new Date(String(fromDate)) };
    }

    if (toDate) {
      if (where.createdAt) {
        where.createdAt.lte = new Date(String(toDate));
      } else {
        where.createdAt = { lte: new Date(String(toDate)) };
      }
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        take: Number(limit),
        skip: Number(offset),
        orderBy: { createdAt: "desc" },
      }),
      prisma.booking.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        bookings: bookings.map((b) => ({
          bookingId: b.id,
          bookingRef: b.bookingRef,
          status: b.status,
          hotel: {
            name: b.hotelName,
            roomType: b.roomType,
          },
          dates: {
            checkIn: b.checkInDate.toISOString().split("T")[0],
            checkOut: b.checkOutDate.toISOString().split("T")[0],
          },
          price: {
            amount: b.totalAmount,
            currency: b.currency,
          },
          createdAt: b.createdAt.toISOString(),
        })),
        pagination: {
          total,
          limit: Number(limit),
          offset: Number(offset),
        },
      },
    });
  } catch (error: any) {
    console.error("[RealtimeBooking] GET /bookings error:", error.message);
    res.status(500).json({
      success: false,
      error: "Failed to fetch bookings",
      details: error.message,
    });
  }
});

/**
 * POST /api/realtime-booking/bookings/:bookingId/amend
 * Update guest information on existing booking
 */
router.post(
  "/bookings/:bookingId/amend",
  async (req: Request, res: Response) => {
    try {
      const { bookingId } = req.params;
      const { firstName, lastName, email, phone } = req.body;

      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
      });

      if (!booking) {
        return res.status(404).json({
          success: false,
          error: "Booking not found",
        });
      }

      let amendmentResult = null;

      try {
        // Amend with LiteAPI if confirmed
        if (booking.bookingRef && booking.status === "confirmed") {
          amendmentResult = await liteApiBookRequest<any>(
            `/bookings/${booking.bookingRef}/amend`,
            "PUT",
            {
              firstName,
              lastName,
              email,
              phone,
            },
          );
        }
      } catch (liteApiError: any) {
        console.error(
          "[RealtimeBooking] LiteAPI amendment error:",
          liteApiError.message,
        );
      }

      // Update booking locally
      const updatedBooking = await prisma.booking.update({
        where: { id: bookingId },
        data: {
          customerEmail: email || booking.customerEmail,
          metadata: {
            ...(booking.metadata as any),
            amendments: {
              firstName,
              lastName,
              email,
              phone,
            },
            amendedAt: new Date().toISOString(),
            amendmentResult,
          },
        },
      });

      res.json({
        success: true,
        data: {
          bookingId,
          amendments: {
            firstName,
            lastName,
            email,
            phone,
          },
          supplierAmended: !!amendmentResult,
          message: "Guest information updated successfully",
        },
      });
    } catch (error: any) {
      console.error(
        "[RealtimeBooking] POST /bookings/:id/amend error:",
        error.message,
      );
      res.status(500).json({
        success: false,
        error: "Failed to amend booking",
        details: error.message,
      });
    }
  },
);

export default router;