/**
 * Duffel Airline Credits API Routes
 *
 * Handles frequent flyer points/credits integration with Duffel API.
 * Documentation: https://duffel.com/docs/api/v2/airline-credits
 *
 * Endpoints:
 * - GET  /api/airline-credits - List all airline credits
 * - GET  /api/airline-credits/:id - Get single airline credit
 * - POST /api/airline-credits - Create airline credit
 */

import { Router, Request, Response, NextFunction } from "express";
import type { Router as ExpressRouter } from "express";
import { prisma } from "@tripalfa/shared-database";

const router: ExpressRouter = Router();

// Environment Configuration
const DUFFEL_API_URL = process.env.DUFFEL_API_URL || "https://api.duffel.com";
const DUFFEL_API_KEY =
  process.env.DUFFEL_API_KEY || process.env.DUFFEL_TEST_TOKEN;
const DUFFEL_VERSION = "v2";

// ============================================
// Duffel API Helper Functions
// ============================================

/**
 * Make authenticated request to Duffel API
 */
async function duffelRequest<T>(
  endpoint: string,
  method: string = "GET",
  body?: object,
): Promise<T> {
  const url = `${DUFFEL_API_URL}${endpoint}`;

  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${DUFFEL_API_KEY}`,
      "Duffel-Version": DUFFEL_VERSION,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Duffel API Error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return data.data;
}

// ============================================
// Type Definitions
// ============================================

interface AirlineCredit {
  id: string;
  created_at: string;
  updated_at: string;
  customer_id: string;
  airline_iata_code: string;
  frequent_flyer_number: string;
  total_points: number;
  available_points: number;
  status: "active" | "expired" | "expiring_soon";
  expiry_date?: string;
  program_name?: string;
  tier_status?: string;
  metadata?: Record<string, any>;
}

interface CreateAirlineCreditRequest {
  customerId: string;
  airlineIataCode: string;
  frequentFlyerNumber: string;
  totalPoints?: number;
  programName?: string;
  metadata?: Record<string, any>;
}

// ============================================
// API Routes
// ============================================

// GET /api/airline-credits - List all airline credits
router.get("/", async (req: Request, res: Response) => {
  try {
    const {
      limit = 50,
      offset = 0,
      customerId,
      airlineIataCode,
      status,
    } = req.query;

    // Try Duffel API first
    try {
      const params = new URLSearchParams();
      params.append("limit", String(limit));
      params.append("offset", String(offset));
      if (customerId) params.append("customer_id", String(customerId));
      if (airlineIataCode)
        params.append("airline_iata_code", String(airlineIataCode));

      const duffelCredits = await duffelRequest<any[]>(
        `/air/airline_credits?${params}`,
      );

      return res.json({
        success: true,
        data: duffelCredits,
        pagination: {
          limit: Number(limit),
          offset: Number(offset),
          total: duffelCredits.length,
        },
      });
    } catch (duffelError: any) {
      console.log(
        "[AirlineCredits] Duffel API failed, falling back to database",
      );
    }

    // Fallback: Get from database
    const where: any = {};
    if (customerId) where.userId = customerId;
    if (airlineIataCode) where.airlineCode = airlineIataCode;
    if (status && status !== "all") where.status = status;

    const credits = await prisma.booking.findMany({
      where: {
        serviceType: "airline_credit",
        ...where,
      },
      take: Number(limit),
      skip: Number(offset),
      orderBy: { createdAt: "desc" },
    });

    // Transform database records to airline credit format
    const transformedCredits = credits.map((credit) => ({
      id: credit.id,
      created_at: credit.createdAt.toISOString(),
      updated_at: credit.updatedAt.toISOString(),
      customer_id: credit.userId,
      airline_iata_code: (credit.metadata as any)?.airlineCode || "XX",
      frequent_flyer_number:
        (credit.metadata as any)?.frequentFlyerNumber || "",
      total_points: Number(credit.totalAmount) || 0,
      available_points: Number(credit.totalAmount) || 0,
      status: credit.status === "confirmed" ? "active" : "expired",
      expiry_date: (credit.metadata as any)?.expiryDate,
      program_name: (credit.metadata as any)?.programName,
      tier_status: (credit.metadata as any)?.tierStatus,
    }));

    res.json({
      success: true,
      data: transformedCredits,
      pagination: {
        limit: Number(limit),
        offset: Number(offset),
        total: transformedCredits.length,
      },
    });
  } catch (error: any) {
    console.error("[AirlineCredits] List error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/airline-credits/:id - Get single airline credit
router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);

    // Avoid shadowing static route segments like /customer/:customerId
    if (id === "customer") {
      return next();
    }

    // Try Duffel API first
    try {
      const credit = await duffelRequest<any>(`/air/airline_credits/${id}`);
      return res.json({
        success: true,
        data: credit,
      });
    } catch (duffelError: any) {
      console.log("[AirlineCredits] Duffel API fetch failed, trying database");
    }

    // Fallback: Get from database
    const credit = await prisma.booking.findFirst({
      where: {
        OR: [{ id: String(id) }, { bookingRef: String(id) }],
        serviceType: "airline_credit",
      },
    });

    if (!credit) {
      return res.status(404).json({
        success: false,
        error: "Airline credit not found",
      });
    }

    const transformedCredit = {
      id: credit.id,
      created_at: credit.createdAt.toISOString(),
      updated_at: credit.updatedAt.toISOString(),
      customer_id: credit.userId,
      airline_iata_code: (credit.metadata as any)?.airlineCode || "XX",
      frequent_flyer_number:
        (credit.metadata as any)?.frequentFlyerNumber || "",
      total_points: Number(credit.totalAmount) || 0,
      available_points: Number(credit.totalAmount) || 0,
      status: credit.status === "confirmed" ? "active" : "expired",
      expiry_date: (credit.metadata as any)?.expiryDate,
      program_name: (credit.metadata as any)?.programName,
      tier_status: (credit.metadata as any)?.tierStatus,
    };

    res.json({
      success: true,
      data: transformedCredit,
    });
  } catch (error: any) {
    console.error("[AirlineCredits] Get error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/airline-credits - Create airline credit
router.post("/", async (req: Request, res: Response) => {
  try {
    const {
      customerId,
      airlineIataCode,
      frequentFlyerNumber,
      totalPoints = 0,
      programName,
      metadata,
    } = req.body as CreateAirlineCreditRequest;

    if (!customerId || !airlineIataCode || !frequentFlyerNumber) {
      return res.status(400).json({
        success: false,
        error:
          "customerId, airlineIataCode, and frequentFlyerNumber are required",
      });
    }

    // Try Duffel API first
    try {
      const duffelCredit = await duffelRequest<any>(
        "/air/airline_credits",
        "POST",
        {
          customer_id: customerId,
          airline_iata_code: airlineIataCode,
          frequent_flyer_number: frequentFlyerNumber,
          total_points: totalPoints,
          program_name: programName,
          metadata,
        },
      );

      return res.status(201).json({
        success: true,
        data: duffelCredit,
      });
    } catch (duffelError: any) {
      console.log(
        "[AirlineCredits] Duffel API create failed, storing in database",
      );
    }

    // Fallback: Store in database
    const credit = await prisma.booking.create({
      data: {
        userId: String(customerId),
        bookingRef: `AFC-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`,
        serviceType: "airline_credit",
        status: "confirmed",
        baseAmount: totalPoints,
        taxAmount: 0,
        markupAmount: 0,
        totalAmount: totalPoints,
        currency: "POINTS",
        metadata: {
          airlineCode: airlineIataCode,
          frequentFlyerNumber,
          programName,
          ...metadata,
          source: "tripalfa_database",
        },
      },
    });

    res.status(201).json({
      success: true,
      data: {
        id: credit.id,
        created_at: credit.createdAt.toISOString(),
        customer_id: credit.userId,
        airline_iata_code: airlineIataCode,
        frequent_flyer_number: frequentFlyerNumber,
        total_points: totalPoints,
        available_points: totalPoints,
        status: "active",
        program_name: programName,
      },
    });
  } catch (error: any) {
    console.error("[AirlineCredits] Create error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PATCH /api/airline-credits/:id - Update airline credit
router.patch("/:id", async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const {
      totalPoints,
      availablePoints,
      status,
      expiryDate,
      tierStatus,
      metadata,
    } = req.body;

    // Try Duffel API first (if supported)
    try {
      const updateData: any = {};
      if (totalPoints !== undefined) updateData.total_points = totalPoints;
      if (availablePoints !== undefined)
        updateData.available_points = availablePoints;
      if (status) updateData.status = status;
      if (expiryDate) updateData.expiry_date = expiryDate;
      if (tierStatus) updateData.tier_status = tierStatus;
      if (metadata) updateData.metadata = metadata;

      const duffelCredit = await duffelRequest<any>(
        `/air/airline_credits/${id}`,
        "PATCH",
        updateData,
      );

      return res.json({
        success: true,
        data: duffelCredit,
      });
    } catch (duffelError: any) {
      console.log(
        "[AirlineCredits] Duffel API update failed, updating database",
      );
    }

    // Fallback: Update in database
    const existingCredit = await prisma.booking.findFirst({
      where: {
        OR: [{ id: String(id) }, { bookingRef: String(id) }],
        serviceType: "airline_credit",
      },
    });

    if (!existingCredit) {
      return res.status(404).json({
        success: false,
        error: "Airline credit not found",
      });
    }

    const updatedCredit = await prisma.booking.update({
      where: { id: existingCredit.id },
      data: {
        totalAmount: totalPoints ?? existingCredit.totalAmount,
        status: status === "active" ? "confirmed" : status,
        metadata: {
          ...((existingCredit.metadata as object) || {}),
          ...(totalPoints !== undefined && { totalPoints }),
          ...(availablePoints !== undefined && { availablePoints }),
          ...(expiryDate && { expiryDate }),
          ...(tierStatus && { tierStatus }),
          ...(metadata && { ...metadata }),
          updatedAt: new Date().toISOString(),
        },
      },
    });

    res.json({
      success: true,
      data: {
        id: updatedCredit.id,
        total_points: Number(updatedCredit.totalAmount),
        available_points: availablePoints ?? Number(updatedCredit.totalAmount),
        status: updatedCredit.status,
        updated_at: updatedCredit.updatedAt.toISOString(),
      },
    });
  } catch (error: any) {
    console.error("[AirlineCredits] Update error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/airline-credits/:id - Delete airline credit
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);

    // Try Duffel API first
    try {
      await duffelRequest<any>(`/air/airline_credits/${id}`, "DELETE");
      return res.json({
        success: true,
        message: "Airline credit deleted from Duffel",
      });
    } catch (duffelError: any) {
      console.log(
        "[AirlineCredits] Duffel API delete failed, deleting from database",
      );
    }

    // Fallback: Delete from database
    const credit = await prisma.booking.findFirst({
      where: {
        OR: [{ id: String(id) }, { bookingRef: String(id) }],
        serviceType: "airline_credit",
      },
    });

    if (!credit) {
      return res.status(404).json({
        success: false,
        error: "Airline credit not found",
      });
    }

    await prisma.booking.delete({
      where: { id: credit.id },
    });

    res.json({
      success: true,
      message: "Airline credit deleted",
    });
  } catch (error: any) {
    console.error("[AirlineCredits] Delete error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// Additional Helper Endpoints
// ============================================

// GET /api/airline-credits/customer/:customerId - Get all credits for a customer
router.get("/customer/:customerId", async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    // Get airline credits from database
    const credits = await prisma.booking.findMany({
      where: {
        userId: String(customerId),
        serviceType: "airline_credit",
      },
      take: Number(limit),
      skip: Number(offset),
      orderBy: { createdAt: "desc" },
    });

    // Calculate totals
    const totalPoints = credits.reduce(
      (sum, c) => sum + Number(c.totalAmount),
      0,
    );
    const airlines = [
      ...new Set(
        credits.map((c) => (c.metadata as any)?.airlineCode).filter(Boolean),
      ),
    ];

    res.json({
      success: true,
      data: {
        customerId,
        credits: credits.map((credit) => ({
          id: credit.id,
          airline_iata_code: (credit.metadata as any)?.airlineCode,
          frequent_flyer_number: (credit.metadata as any)?.frequentFlyerNumber,
          points: Number(credit.totalAmount),
          status: credit.status === "confirmed" ? "active" : "expired",
          program_name: (credit.metadata as any)?.programName,
        })),
        summary: {
          totalPoints,
          totalCredits: credits.length,
          airlines,
        },
      },
      pagination: {
        limit: Number(limit),
        offset: Number(offset),
        total: credits.length,
      },
    });
  } catch (error: any) {
    console.error("[AirlineCredits] Customer credits error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/airline-credits/:id/transfer - Transfer points
router.post("/:id/transfer", async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const { toCreditId, points, reason } = req.body;

    if (!toCreditId || !points) {
      return res.status(400).json({
        success: false,
        error: "toCreditId and points are required",
      });
    }

    // Get source credit
    const sourceCredit = await prisma.booking.findFirst({
      where: {
        OR: [{ id: String(id) }, { bookingRef: String(id) }],
        serviceType: "airline_credit",
      },
    });

    if (!sourceCredit) {
      return res.status(404).json({
        success: false,
        error: "Source airline credit not found",
      });
    }

    const sourcePoints = Number(sourceCredit.totalAmount);
    if (sourcePoints < points) {
      return res.status(400).json({
        success: false,
        error: "Insufficient points for transfer",
      });
    }

    // Get destination credit
    const destCredit = await prisma.booking.findFirst({
      where: {
        OR: [{ id: toCreditId }, { bookingRef: toCreditId }],
        serviceType: "airline_credit",
      },
    });

    if (!destCredit) {
      return res.status(404).json({
        success: false,
        error: "Destination airline credit not found",
      });
    }

    // Update points
    await prisma.booking.update({
      where: { id: sourceCredit.id },
      data: {
        totalAmount: sourcePoints - points,
        metadata: {
          ...((sourceCredit.metadata as object) || {}),
          lastTransfer: {
            to: toCreditId,
            points,
            reason,
            date: new Date().toISOString(),
          },
        },
      },
    });

    await prisma.booking.update({
      where: { id: destCredit.id },
      data: {
        totalAmount: Number(destCredit.totalAmount) + points,
        metadata: {
          ...((destCredit.metadata as object) || {}),
          lastTransfer: {
            from: id,
            points,
            reason,
            date: new Date().toISOString(),
          },
        },
      },
    });

    res.json({
      success: true,
      message: "Points transferred successfully",
      transfer: {
        from: id,
        to: toCreditId,
        points,
        reason,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error("[AirlineCredits] Transfer error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/airline-credits/:id/redeem - Redeem points for booking
router.post("/:id/redeem", async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const { bookingId, points, description } = req.body;

    if (!bookingId || !points) {
      return res.status(400).json({
        success: false,
        error: "bookingId and points are required",
      });
    }

    // Get credit
    const credit = await prisma.booking.findFirst({
      where: {
        OR: [{ id: String(id) }, { bookingRef: String(id) }],
        serviceType: "airline_credit",
      },
    });

    if (!credit) {
      return res.status(404).json({
        success: false,
        error: "Airline credit not found",
      });
    }

    const availablePoints = Number(credit.totalAmount);
    if (availablePoints < points) {
      return res.status(400).json({
        success: false,
        error: "Insufficient points for redemption",
        available: availablePoints,
        requested: points,
      });
    }

    // Update credit with redemption
    const updatedCredit = await prisma.booking.update({
      where: { id: credit.id },
      data: {
        totalAmount: availablePoints - points,
        metadata: {
          ...((credit.metadata as object) || {}),
          lastRedemption: {
            bookingId,
            points,
            description,
            date: new Date().toISOString(),
          },
          totalRedeemed:
            ((credit.metadata as any)?.totalRedeemed || 0) + points,
        },
      },
    });

    // Log the redemption
    console.log(
      `[AirlineCredits] Redeemed ${points} points from credit ${id} for booking ${bookingId}`,
    );

    res.json({
      success: true,
      message: "Points redeemed successfully",
      redemption: {
        creditId: id,
        bookingId,
        points,
        description,
        remainingPoints: Number(updatedCredit.totalAmount),
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error("[AirlineCredits] Redemption error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
