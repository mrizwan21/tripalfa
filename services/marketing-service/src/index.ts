import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { prisma } from "@tripalfa/shared-database";
import { z } from "zod";
import jwt from "jsonwebtoken";

dotenv.config();

const app: Express = express();
const PORT = process.env.MARKETING_SERVICE_PORT || process.env.PORT || 3012;

// JWT configuration - MUST be set via environment variables
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_ISSUER = process.env.JWT_ISSUER || "tripalfa-auth";

if (!JWT_SECRET) {
  console.error(
    "[MarketingService] FATAL: JWT_SECRET environment variable is not set!",
  );
  console.error(
    "[MarketingService] Authentication will fail for all requests.",
  );
}

// ============================================
// AUTHENTICATION MIDDLEWARE
// ============================================

/**
 * Extended request interface with authenticated user
 * Compatible with global Express.User augmentation from organization-service
 */
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    companyId: string; // Required by global Express.User type augmentation
  };
}

/**
 * JWT token payload interface
 */
interface JwtPayload {
  id: string;
  email: string;
  role: string;
  companyId?: string;
  iat?: number;
  exp?: number;
  iss?: string;
}

/**
 * Verify JWT token from Authorization header
 * Supports both JWT tokens and internal API key for service-to-service calls
 */
async function verifyToken(token: string): Promise<{
  id: string;
  email: string;
  role: string;
  companyId: string;
} | null> {
  try {
    // Extract token value from Bearer scheme
    const tokenValue = token.startsWith("Bearer ") ? token.substring(7) : token;

    // Service-to-service authentication with API key
    // This allows internal services to authenticate without JWT
    if (
      tokenValue === process.env.INTERNAL_API_KEY &&
      process.env.INTERNAL_API_KEY
    ) {
      return {
        id: "system",
        email: "system@internal",
        role: "admin",
        companyId: "system",
      };
    }

    // JWT verification - requires JWT_SECRET to be configured
    if (!JWT_SECRET) {
      console.error(
        "[MarketingService] Cannot verify JWT: JWT_SECRET is not configured",
      );
      return null;
    }

    try {
      const decoded = jwt.verify(tokenValue, JWT_SECRET, {
        issuer: JWT_ISSUER,
      }) as JwtPayload;

      // Validate required fields in token
      if (!decoded.id || !decoded.email || !decoded.role) {
        console.error("[MarketingService] JWT token missing required fields");
        return null;
      }

      return {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
        companyId: decoded.companyId || "unknown",
      };
    } catch (jwtError) {
      if (jwtError instanceof jwt.TokenExpiredError) {
        console.warn(
          "[MarketingService] JWT token expired:",
          jwtError.expiredAt,
        );
      } else if (jwtError instanceof jwt.JsonWebTokenError) {
        console.warn("[MarketingService] Invalid JWT token:", jwtError.message);
      } else if (jwtError instanceof jwt.NotBeforeError) {
        console.warn("[MarketingService] JWT token not yet valid");
      } else {
        console.error("[MarketingService] JWT verification error:", jwtError);
      }
      return null;
    }
  } catch (error) {
    console.error("[MarketingService] Token verification failed:", error);
    return null;
  }
}

/**
 * Authentication middleware for Marketing endpoints
 * Requires valid Authorization header with Bearer token
 */
async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({
      error: "Unauthorized",
      message: "Authorization header is required",
    });
    return;
  }

  const user = await verifyToken(authHeader);

  if (!user) {
    res.status(401).json({
      error: "Unauthorized",
      message: "Invalid or expired token",
    });
    return;
  }

  // Attach user to request for use in route handlers
  (req as AuthenticatedRequest).user = user;
  next();
}

/**
 * Admin-only middleware for sensitive operations
 * Requires the authenticated user to have 'admin' role
 */
function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const user = (req as AuthenticatedRequest).user;

  if (!user || user.role !== "admin") {
    res.status(403).json({
      error: "Forbidden",
      message: "Admin access required for this operation",
    });
    return;
  }

  next();
}

/**
 * Rate limiting middleware (basic implementation)
 * In production, use express-rate-limit or similar
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100;

function rateLimiter(req: Request, res: Response, next: NextFunction): void {
  const ip = req.ip || req.connection.remoteAddress || "unknown";
  const now = Date.now();

  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    next();
    return;
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    res.status(429).json({
      error: "Too Many Requests",
      message: "Rate limit exceeded. Please try again later.",
      retryAfter: Math.ceil((record.resetTime - now) / 1000),
    });
    return;
  }

  record.count++;
  next();
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(rateLimiter);

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health Check (no auth required)
app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "healthy", service: "marketing-service" });
});

// Validation schemas - aligned with actual Prisma schema
const createMarketingCampaignSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  campaignType: z
    .enum([
      "email",
      "sms",
      "push",
      "social",
      "display",
      "affiliate",
      "referral",
    ])
    .optional(),
  status: z
    .enum(["draft", "active", "paused", "completed", "cancelled"])
    .optional(),
  targetSegment: z.record(z.unknown()).optional(),
  content: z.record(z.unknown()).optional(),
  schedule: z.record(z.unknown()).optional(),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}/)
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}/)
    .optional(),
  budget: z.number().min(0).optional(),
  currency: z.string().max(10).optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

const updateMarketingCampaignSchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    description: z.string().optional(),
    campaignType: z
      .enum([
        "email",
        "sms",
        "push",
        "social",
        "display",
        "affiliate",
        "referral",
      ])
      .optional(),
    status: z
      .enum(["draft", "active", "paused", "completed", "cancelled"])
      .optional(),
    targetSegment: z.record(z.unknown()).optional(),
    content: z.record(z.unknown()).optional(),
    schedule: z.record(z.unknown()).optional(),
    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}/)
      .optional(),
    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}/)
      .optional(),
    budget: z.number().min(0).optional(),
    actualSpend: z.number().min(0).optional(),
    currency: z.string().max(10).optional(),
    tags: z.array(z.string()).optional(),
    metadata: z.record(z.unknown()).optional(),
  })
  .strict();

const createPromoCodeSchema = z.object({
  code: z.string().min(1).max(50),
  name: z.string().max(200).optional(),
  description: z.string().optional(),
  discountType: z.enum(["percentage", "fixed"]),
  discountValue: z.number().min(0),
  currency: z.string().max(10).optional(),
  minOrderAmount: z.number().min(0).optional(),
  maxDiscount: z.number().min(0).optional(),
  usageLimit: z.number().int().min(1).optional(),
  serviceTypes: z.array(z.string()).optional(),
  validFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}/),
  validTo: z.string().regex(/^\d{4}-\d{2}-\d{2}/),
  isActive: z.boolean().optional(),
  metadata: z.record(z.unknown()).optional(),
});

const validatePromoCodeSchema = z.object({
  code: z.string().min(1).max(50),
  userId: z.string().optional(),
  bookingType: z.enum(["flight", "hotel", "package"]).optional(),
  purchaseAmount: z.number().min(0).optional(),
});

// ============================================
// MARKETING CAMPAIGN ROUTES (Admin only for write operations)
// ============================================

// GET /api/marketing/campaigns - List all marketing campaigns (requires auth)
app.get(
  "/api/marketing/campaigns",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const { limit = "20", offset = "0", status, campaignType } = req.query;
      const limitNum = Math.min(parseInt(limit as string), 100);
      const offsetNum = parseInt(offset as string);

      const where: any = {};
      if (status) where.status = status;
      if (campaignType) where.campaignType = campaignType;

      const [campaigns, total] = await Promise.all([
        prisma.marketingCampaign.findMany({
          where,
          take: limitNum,
          skip: offsetNum,
          orderBy: { createdAt: "desc" },
        }),
        prisma.marketingCampaign.count({ where }),
      ]);

      res.json({
        data: campaigns,
        pagination: {
          limit: limitNum,
          offset: offsetNum,
          total,
        },
      });
    } catch (error) {
      console.error("[MarketingService] List campaigns error:", error);
      res.status(500).json({
        error: "Failed to list campaigns",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

// POST /api/marketing/campaigns - Create a new marketing campaign (Admin only)
app.post(
  "/api/marketing/campaigns",
  requireAuth,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const validationResult = createMarketingCampaignSchema.safeParse(
        req.body,
      );
      if (!validationResult.success) {
        return res.status(400).json({
          error: "Invalid request body",
          details: validationResult.error.flatten().fieldErrors,
        });
      }

      const data = validationResult.data;

      // Check for duplicate name
      const existingCampaign = await prisma.marketingCampaign.findFirst({
        where: { name: data.name },
      });

      if (existingCampaign) {
        return res.status(409).json({
          error: "Campaign with this name already exists",
        });
      }

      const campaign = await prisma.marketingCampaign.create({
        data: {
          name: data.name,
          description: data.description,
          campaignType: data.campaignType || "email",
          status: data.status || "draft",
          targetSegment: data.targetSegment as any,
          content: data.content as any,
          schedule: data.schedule as any,
          startDate: data.startDate ? new Date(data.startDate) : null,
          endDate: data.endDate ? new Date(data.endDate) : null,
          budget: data.budget,
          currency: data.currency || "USD",
          tags: data.tags || [],
          metadata: data.metadata as any,
        },
      });

      console.log(
        `[MarketingService] Marketing campaign created: ${campaign.id}`,
      );

      res.status(201).json(campaign);
    } catch (error) {
      console.error("[MarketingService] Create campaign error:", error);
      res.status(500).json({
        error: "Failed to create campaign",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

// GET /api/marketing/campaigns/:id - Get marketing campaign by ID (requires auth)
app.get(
  "/api/marketing/campaigns/:id",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;

      const campaign = await prisma.marketingCampaign.findUnique({
        where: { id },
      });

      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }

      res.json(campaign);
    } catch (error) {
      console.error("[MarketingService] Get campaign error:", error);
      res.status(500).json({
        error: "Failed to get campaign",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

// PATCH /api/marketing/campaigns/:id - Update marketing campaign (Admin only)
app.patch(
  "/api/marketing/campaigns/:id",
  requireAuth,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;

      // Validate input with Zod schema
      const validationResult = updateMarketingCampaignSchema.safeParse(
        req.body,
      );
      if (!validationResult.success) {
        return res.status(400).json({
          error: "Invalid request body",
          details: validationResult.error.flatten().fieldErrors,
        });
      }

      const updateData = validationResult.data;

      const campaign = await prisma.marketingCampaign.update({
        where: { id },
        data: {
          name: updateData.name,
          description: updateData.description,
          campaignType: updateData.campaignType,
          status: updateData.status,
          targetSegment: updateData.targetSegment as any,
          content: updateData.content as any,
          schedule: updateData.schedule as any,
          startDate: updateData.startDate
            ? new Date(updateData.startDate)
            : null,
          endDate: updateData.endDate ? new Date(updateData.endDate) : null,
          budget: updateData.budget,
          actualSpend: updateData.actualSpend,
          currency: updateData.currency,
          tags: updateData.tags,
          metadata: updateData.metadata as any,
        },
      });

      res.json(campaign);
    } catch (error) {
      console.error("[MarketingService] Update campaign error:", error);
      res.status(500).json({
        error: "Failed to update campaign",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

// POST /api/marketing/campaigns/:id/activate - Activate campaign (Admin only)
app.post(
  "/api/marketing/campaigns/:id/activate",
  requireAuth,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;

      const campaign = await prisma.marketingCampaign.update({
        where: { id },
        data: { status: "active" },
      });

      console.log(`[MarketingService] Campaign activated: ${id}`);

      res.json(campaign);
    } catch (error) {
      console.error("[MarketingService] Activate campaign error:", error);
      res.status(500).json({
        error: "Failed to activate campaign",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

// POST /api/marketing/campaigns/:id/deactivate - Deactivate campaign (Admin only)
app.post(
  "/api/marketing/campaigns/:id/deactivate",
  requireAuth,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;

      const campaign = await prisma.marketingCampaign.update({
        where: { id },
        data: { status: "paused" },
      });

      console.log(`[MarketingService] Campaign deactivated: ${id}`);

      res.json(campaign);
    } catch (error) {
      console.error("[MarketingService] Deactivate campaign error:", error);
      res.status(500).json({
        error: "Failed to deactivate campaign",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

// DELETE /api/marketing/campaigns/:id - Delete marketing campaign (Admin only)
app.delete(
  "/api/marketing/campaigns/:id",
  requireAuth,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;

      await prisma.marketingCampaign.delete({
        where: { id },
      });

      res.status(204).send();
    } catch (error) {
      console.error("[MarketingService] Delete campaign error:", error);
      res.status(500).json({
        error: "Failed to delete campaign",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

// ============================================
// PROMO CODE ROUTES
// ============================================

// GET /api/marketing/promo-codes - List all promo codes (requires auth)
app.get(
  "/api/marketing/promo-codes",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const { limit = "20", offset = "0", isActive } = req.query;
      const limitNum = Math.min(parseInt(limit as string), 100);
      const offsetNum = parseInt(offset as string);

      const where: any = {};
      if (isActive !== undefined) where.isActive = isActive === "true";

      const [promoCodes, total] = await Promise.all([
        prisma.promoCode.findMany({
          where,
          take: limitNum,
          skip: offsetNum,
          orderBy: { createdAt: "desc" },
        }),
        prisma.promoCode.count({ where }),
      ]);

      res.json({
        data: promoCodes,
        pagination: {
          limit: limitNum,
          offset: offsetNum,
          total,
        },
      });
    } catch (error) {
      console.error("[MarketingService] List promo codes error:", error);
      res.status(500).json({
        error: "Failed to list promo codes",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

// POST /api/marketing/promo-codes - Create a new promo code (Admin only)
app.post(
  "/api/marketing/promo-codes",
  requireAuth,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const validationResult = createPromoCodeSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          error: "Invalid request body",
          details: validationResult.error.flatten().fieldErrors,
        });
      }

      const data = validationResult.data;

      // Check for duplicate code
      const existingCode = await prisma.promoCode.findUnique({
        where: { code: data.code },
      });

      if (existingCode) {
        return res.status(409).json({
          error: "Promo code already exists",
        });
      }

      const promoCode = await prisma.promoCode.create({
        data: {
          code: data.code.toUpperCase(),
          name: data.name,
          description: data.description,
          discountType: data.discountType,
          discountValue: data.discountValue,
          currency: data.currency || "USD",
          minOrderAmount: data.minOrderAmount,
          maxDiscount: data.maxDiscount,
          usageLimit: data.usageLimit,
          serviceTypes: data.serviceTypes || [],
          validFrom: data.validFrom ? new Date(data.validFrom) : null,
          validTo: data.validTo ? new Date(data.validTo) : null,
          isActive: data.isActive ?? true,
          metadata: data.metadata as any,
        },
      });

      console.log(`[MarketingService] Promo code created: ${promoCode.code}`);

      res.status(201).json(promoCode);
    } catch (error) {
      console.error("[MarketingService] Create promo code error:", error);
      res.status(500).json({
        error: "Failed to create promo code",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

// POST /api/marketing/promo-codes/validate - Validate a promo code (Public endpoint for booking flow)
app.post(
  "/api/marketing/promo-codes/validate",
  async (req: Request, res: Response) => {
    try {
      const validationResult = validatePromoCodeSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          error: "Invalid request body",
          details: validationResult.error.flatten().fieldErrors,
        });
      }

      const { code, userId, bookingType, purchaseAmount } =
        validationResult.data;

      const promoCode = await prisma.promoCode.findUnique({
        where: { code: code.toUpperCase() },
      });

      if (!promoCode) {
        return res.status(404).json({
          valid: false,
          error: "Promo code not found",
        });
      }

      // Check if active
      if (!promoCode.isActive) {
        return res.status(400).json({
          valid: false,
          error: "Promo code is not active",
        });
      }

      // Check dates - using validFrom and validTo from schema
      const now = new Date();
      if (promoCode.validFrom && now < promoCode.validFrom) {
        return res.status(400).json({
          valid: false,
          error: "Promo code is not yet valid",
        });
      }
      if (promoCode.validTo && now > promoCode.validTo) {
        return res.status(400).json({
          valid: false,
          error: "Promo code has expired",
        });
      }

      // Check usage limit - using usageCount from schema
      if (
        promoCode.usageLimit &&
        promoCode.usageCount >= promoCode.usageLimit
      ) {
        return res.status(400).json({
          valid: false,
          error: "Promo code usage limit reached",
        });
      }

      // Check minimum purchase - using minOrderAmount from schema
      if (
        promoCode.minOrderAmount &&
        purchaseAmount &&
        purchaseAmount < promoCode.minOrderAmount
      ) {
        return res.status(400).json({
          valid: false,
          error: `Minimum purchase amount is ${promoCode.minOrderAmount}`,
        });
      }

      // Check applicable booking type - using serviceTypes from schema
      if (
        promoCode.serviceTypes &&
        promoCode.serviceTypes.length > 0 &&
        bookingType
      ) {
        const serviceTypeMap: Record<string, string> = {
          flight: "flights",
          hotel: "hotels",
          package: "packages",
        };
        const mappedType = serviceTypeMap[bookingType] || bookingType;
        if (
          !promoCode.serviceTypes.includes(mappedType) &&
          !promoCode.serviceTypes.includes("all")
        ) {
          return res.status(400).json({
            valid: false,
            error: "Promo code is not applicable to this booking type",
          });
        }
      }

      // Calculate discount
      let discountAmount = 0;
      if (purchaseAmount) {
        if (promoCode.discountType === "percentage") {
          discountAmount =
            purchaseAmount * (Number(promoCode.discountValue) / 100);
          if (promoCode.maxDiscount) {
            discountAmount = Math.min(
              discountAmount,
              Number(promoCode.maxDiscount),
            );
          }
        } else {
          discountAmount = Number(promoCode.discountValue);
        }
      }

      res.json({
        valid: true,
        promoCode: {
          id: promoCode.id,
          code: promoCode.code,
          discountType: promoCode.discountType,
          discountValue: promoCode.discountValue,
          maxDiscount: promoCode.maxDiscount,
          minOrderAmount: promoCode.minOrderAmount,
          serviceTypes: promoCode.serviceTypes,
        },
        discountAmount,
        finalAmount: purchaseAmount
          ? purchaseAmount - discountAmount
          : undefined,
      });
    } catch (error) {
      console.error("[MarketingService] Validate promo code error:", error);
      res.status(500).json({
        error: "Failed to validate promo code",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

// POST /api/marketing/promo-codes/:id/apply - Apply promo code (increment usage) (requires auth)
app.post(
  "/api/marketing/promo-codes/:id/apply",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const { userId, bookingId } = req.body;

      const promoCode = await prisma.promoCode.update({
        where: { id },
        data: {
          usageCount: { increment: 1 }, // Using usageCount from schema
        },
      });

      // Log usage
      console.log(
        `[MarketingService] Promo code ${promoCode.code} applied by user ${userId} for booking ${bookingId}`,
      );

      res.json({
        success: true,
        usageCount: promoCode.usageCount, // Using usageCount from schema
      });
    } catch (error) {
      console.error("[MarketingService] Apply promo code error:", error);
      res.status(500).json({
        error: "Failed to apply promo code",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

// DELETE /api/marketing/promo-codes/:id - Delete promo code (Admin only)
app.delete(
  "/api/marketing/promo-codes/:id",
  requireAuth,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;

      await prisma.promoCode.delete({
        where: { id },
      });

      res.status(204).send();
    } catch (error) {
      console.error("[MarketingService] Delete promo code error:", error);
      res.status(500).json({
        error: "Failed to delete promo code",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

// ============================================
// ANALYTICS ROUTES (Admin only)
// ============================================

// GET /api/marketing/analytics/overview - Get marketing analytics overview (Admin only)
app.get(
  "/api/marketing/analytics/overview",
  requireAuth,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const [
        totalCampaigns,
        activeCampaigns,
        totalPromoCodes,
        activePromoCodes,
        totalUsage,
      ] = await Promise.all([
        prisma.marketingCampaign.count(),
        prisma.marketingCampaign.count({ where: { status: "active" } }),
        prisma.promoCode.count(),
        prisma.promoCode.count({ where: { isActive: true } }),
        prisma.promoCode.aggregate({
          _sum: { usageCount: true }, // Using usageCount from schema
        }),
      ]);

      res.json({
        campaigns: {
          total: totalCampaigns,
          active: activeCampaigns,
        },
        promoCodes: {
          total: totalPromoCodes,
          active: activePromoCodes,
          totalUsage: totalUsage._sum.usageCount || 0, // Using usageCount from schema
        },
      });
    } catch (error) {
      console.error("[MarketingService] Analytics overview error:", error);
      res.status(500).json({
        error: "Failed to get analytics overview",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: "Not Found",
    path: req.path,
  });
});

// Error Handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("[MarketingService] Error:", err);
  res.status(500).json({
    error: "Internal Server Error",
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "An unexpected error occurred",
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Marketing Service running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);

  // Security configuration check
  if (!JWT_SECRET) {
    console.error(
      "[MarketingService] SECURITY WARNING: JWT_SECRET is not configured. " +
        "All JWT authentication will fail. Only INTERNAL_API_KEY will work.",
    );
  }

  if (!process.env.INTERNAL_API_KEY) {
    console.warn(
      "[MarketingService] WARNING: INTERNAL_API_KEY is not configured. " +
        "Service-to-service authentication will not be available.",
    );
  }
});

export default app;
