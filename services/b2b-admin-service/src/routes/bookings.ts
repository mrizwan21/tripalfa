import { Router, Response } from "express";
import prisma from "../database.js";
import {
  AuthRequest,
  authMiddleware,
  requirePermission,
} from "../middleware/auth.js";
import {
  validateZod,
  bookingFilterSchema,
  idParamSchema,
} from "../middleware/validate.js";
import { Prisma } from "@prisma/client";

const router: Router = Router();

// All booking routes require authentication
router.use(authMiddleware);

// Helper to convert Decimal values to numbers for JSON serialization
const serializeBooking = (booking: any) => ({
  ...booking,
  baseAmount: booking.baseAmount?.toNumber?.() ?? booking.baseAmount,
  taxAmount: booking.taxAmount?.toNumber?.() ?? booking.taxAmount,
  markupAmount: booking.markupAmount?.toNumber?.() ?? booking.markupAmount,
  totalAmount: booking.totalAmount?.toNumber?.() ?? booking.totalAmount,
});

const serializeModification = (modification: any) => ({
  ...modification,
  modificationFee:
    modification.modificationFee?.toNumber?.() ?? modification.modificationFee,
  penaltyFee: modification.penaltyFee?.toNumber?.() ?? modification.penaltyFee,
});

// GET /api/bookings - List all bookings with pagination and filters
router.get(
  "/",
  requirePermission("bookings:read"),
  validateZod(bookingFilterSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const {
        page,
        limit,
        sortBy,
        sortOrder,
        search,
        status,
        type,
        fromDate,
        toDate,
        companyId,
        userId,
      } = req.query as any;

      // Build where clause
      const where: any = {};

      if (status) {
        where.status = status;
      }

      if (type) {
        where.serviceType = type;
      }

      if (userId) {
        where.userId = userId;
      }

      if (fromDate || toDate) {
        where.createdAt = {};
        if (fromDate) {
          where.createdAt.gte = new Date(fromDate);
        }
        if (toDate) {
          where.createdAt.lte = new Date(toDate);
        }
      }

      if (search) {
        where.OR = [
          {
            bookingRef: {
              contains: search,
              mode: Prisma.QueryMode.insensitive,
            },
          },
          {
            customerEmail: {
              contains: search,
              mode: Prisma.QueryMode.insensitive,
            },
          },
          {
            customerPhone: {
              contains: search,
              mode: Prisma.QueryMode.insensitive,
            },
          },
        ];
      }

      const [bookings, total] = await Promise.all([
        prisma.booking.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: "desc" },
          include: {
            bookingSegments: {
              orderBy: { sequenceNumber: "asc" },
            },
            bookingPassengers: true,
            modifications: {
              take: 5,
              orderBy: { createdAt: "desc" },
            },
          },
        }),
        prisma.booking.count({ where }),
      ]);

      res.json({
        success: true,
        data: bookings.map(serializeBooking),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error("Error fetching bookings:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch bookings",
      });
    }
  },
);

// GET /api/bookings/stats - Get booking statistics
router.get(
  "/stats",
  requirePermission("bookings:read"),
  async (req: AuthRequest, res: Response) => {
    try {
      const { period = "30d", companyId, userId } = req.query;

      // Calculate date range
      const now = new Date();
      const startDate = new Date();
      switch (period) {
        case "7d":
          startDate.setDate(now.getDate() - 7);
          break;
        case "30d":
          startDate.setDate(now.getDate() - 30);
          break;
        case "90d":
          startDate.setDate(now.getDate() - 90);
          break;
        case "1y":
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      const where: any = {
        createdAt: { gte: startDate },
      };

      if (userId) {
        where.userId = userId;
      }

      // Get aggregated stats
      const stats = await prisma.booking.aggregate({
        where,
        _count: true,
        _sum: {
          baseAmount: true,
          taxAmount: true,
          markupAmount: true,
          totalAmount: true,
        },
      });

      // Get status breakdown
      const statusBreakdown = await prisma.booking.groupBy({
        by: ["status"],
        where,
        _count: true,
        _sum: {
          totalAmount: true,
        },
      });

      // Get service type breakdown
      const serviceTypeBreakdown = await prisma.booking.groupBy({
        by: ["serviceType"],
        where,
        _count: true,
        _sum: {
          totalAmount: true,
        },
      });

      // Get payment status breakdown
      const paymentStatusBreakdown = await prisma.booking.groupBy({
        by: ["paymentStatus"],
        where,
        _count: true,
        _sum: {
          totalAmount: true,
        },
      });

      res.json({
        success: true,
        data: {
          totalBookings: stats._count,
          totalRevenue: stats._sum.totalAmount?.toNumber?.() ?? 0,
          totalBaseAmount: stats._sum.baseAmount?.toNumber?.() ?? 0,
          totalTax: stats._sum.taxAmount?.toNumber?.() ?? 0,
          totalMarkup: stats._sum.markupAmount?.toNumber?.() ?? 0,
          statusBreakdown: statusBreakdown.map((s) => ({
            status: s.status,
            count: s._count,
            amount: s._sum.totalAmount?.toNumber?.() ?? 0,
          })),
          serviceTypeBreakdown: serviceTypeBreakdown.map((s) => ({
            serviceType: s.serviceType,
            count: s._count,
            amount: s._sum.totalAmount?.toNumber?.() ?? 0,
          })),
          paymentStatusBreakdown: paymentStatusBreakdown.map((s) => ({
            paymentStatus: s.paymentStatus,
            count: s._count,
            amount: s._sum.totalAmount?.toNumber?.() ?? 0,
          })),
          period,
        },
      });
    } catch (error) {
      console.error("Error fetching booking stats:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch booking statistics",
      });
    }
  },
);

// GET /api/bookings/:id - Get booking by ID
router.get(
  "/:id",
  requirePermission("bookings:read"),
  validateZod(idParamSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      const booking = await prisma.booking.findUnique({
        where: { id },
        include: {
          bookingSegments: {
            orderBy: { sequenceNumber: "asc" },
          },
          bookingPassengers: true,
          modifications: {
            orderBy: { createdAt: "desc" },
          },
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
        data: serializeBooking(booking),
      });
    } catch (error) {
      console.error("Error fetching booking:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch booking",
      });
    }
  },
);

// GET /api/bookings/ref/:bookingRef - Get booking by reference
router.get(
  "/ref/:bookingRef",
  requirePermission("bookings:read"),
  async (req: AuthRequest, res: Response) => {
    try {
      const { bookingRef } = req.params;

      const booking = await prisma.booking.findUnique({
        where: { bookingRef },
        include: {
          bookingSegments: {
            orderBy: { sequenceNumber: "asc" },
          },
          bookingPassengers: true,
          modifications: {
            orderBy: { createdAt: "desc" },
          },
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
        data: serializeBooking(booking),
      });
    } catch (error) {
      console.error("Error fetching booking:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch booking",
      });
    }
  },
);

// PUT /api/bookings/:id/status - Update booking status
router.put(
  "/:id/status",
  requirePermission("bookings:update"),
  validateZod(idParamSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { status, reason, workflowState, paymentStatus } = req.body;

      const booking = await prisma.booking.findUnique({
        where: { id },
      });

      if (!booking) {
        return res.status(404).json({
          success: false,
          error: "Booking not found",
        });
      }

      const updateData: any = {};
      if (status) updateData.status = status;
      if (workflowState) updateData.workflowState = workflowState;
      if (paymentStatus) updateData.paymentStatus = paymentStatus;

      const updatedBooking = await prisma.booking.update({
        where: { id },
        data: updateData,
      });

      // Create modification record if there's a reason
      if (reason) {
        await prisma.bookingModification.create({
          data: {
            bookingId: id,
            modificationType: "status_change",
            status: "completed",
            requestNote: reason,
            oldValue: { status: booking.status },
            newValue: updateData,
          },
        });
      }

      res.json({
        success: true,
        data: serializeBooking(updatedBooking),
        message: "Booking status updated successfully",
      });
    } catch (error) {
      console.error("Error updating booking status:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update booking status",
      });
    }
  },
);

// POST /api/bookings/:id/cancel - Cancel booking
router.post(
  "/:id/cancel",
  requirePermission("bookings:update"),
  validateZod(idParamSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { reason, refundAmount, processedBy } = req.body;

      const booking = await prisma.booking.findUnique({
        where: { id },
      });

      if (!booking) {
        return res.status(404).json({
          success: false,
          error: "Booking not found",
        });
      }

      // Check if booking can be cancelled
      if (booking.status === "cancelled") {
        return res.status(400).json({
          success: false,
          error: "Booking is already cancelled",
        });
      }

      if (booking.status === "completed") {
        return res.status(400).json({
          success: false,
          error: "Cannot cancel a completed booking",
        });
      }

      // Update booking status
      const updatedBooking = await prisma.booking.update({
        where: { id },
        data: {
          status: "cancelled",
          workflowState: "cancelled",
        },
      });

      // Create modification record
      await prisma.bookingModification.create({
        data: {
          bookingId: id,
          modificationType: "cancellation",
          status: "completed",
          requestNote: reason,
          oldValue: { status: booking.status },
          newValue: { status: "cancelled", refundAmount },
          internalNote: `Cancelled by: ${processedBy || "admin"}`,
        },
      });

      res.json({
        success: true,
        data: serializeBooking(updatedBooking),
        message: "Booking cancelled successfully",
      });
    } catch (error) {
      console.error("Error cancelling booking:", error);
      res.status(500).json({
        success: false,
        error: "Failed to cancel booking",
      });
    }
  },
);

// POST /api/bookings/:id/refund - Process refund
router.post(
  "/:id/refund",
  requirePermission("bookings:update"),
  validateZod(idParamSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { amount, reason, processedBy } = req.body;

      const booking = await prisma.booking.findUnique({
        where: { id },
      });

      if (!booking) {
        return res.status(404).json({
          success: false,
          error: "Booking not found",
        });
      }

      // Create modification record for refund
      const modification = await prisma.bookingModification.create({
        data: {
          bookingId: id,
          modificationType: "refund",
          status: "completed",
          requestNote: reason,
          modificationFee: amount ? new Prisma.Decimal(amount) : null,
          internalNote: `Processed by: ${processedBy || "admin"}`,
        },
      });

      res.json({
        success: true,
        data: serializeModification(modification),
        message: "Refund processed successfully",
      });
    } catch (error) {
      console.error("Error processing refund:", error);
      res.status(500).json({
        success: false,
        error: "Failed to process refund",
      });
    }
  },
);

// GET /api/bookings/:id/modifications - Get booking modification history
router.get(
  "/:id/modifications",
  requirePermission("bookings:read"),
  validateZod(idParamSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      const modifications = await prisma.bookingModification.findMany({
        where: { bookingId: id },
        orderBy: { createdAt: "desc" },
      });

      // Cast to any to handle Prisma Decimal fields that may not be in generated types
      res.json({
        success: true,
        data: (modifications as any[]).map(serializeModification),
      });
    } catch (error) {
      console.error("Error fetching modifications:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch modification history",
      });
    }
  },
);

// GET /api/bookings/:id/documents - Get booking documents
router.get(
  "/:id/documents",
  requirePermission("bookings:read"),
  validateZod(idParamSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      const documents = await prisma.document.findMany({
        where: { bookingId: id },
        orderBy: { createdAt: "desc" },
        include: {
          template: {
            select: {
              name: true,
              type: true,
            },
          },
          access: {
            take: 5,
            orderBy: { timestamp: "desc" },
          },
        },
      });

      res.json({
        success: true,
        data: documents,
      });
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch documents",
      });
    }
  },
);

// GET /api/bookings/queues - Get booking queues (for admin processing)
router.get(
  "/queues",
  requirePermission("bookings:read"),
  async (req: AuthRequest, res: Response) => {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        product,
        search,
        fromDate,
        toDate,
      } = req.query;

      // Build where clause for bookings that need attention
      const where: any = {
        OR: [
          { status: "pending" },
          { status: "on_hold" },
          { workflowState: "requires_attention" },
        ],
      };

      if (status) {
        where.status = status;
        delete where.OR;
      }

      if (fromDate || toDate) {
        where.createdAt = {};
        if (fromDate) {
          where.createdAt.gte = new Date(fromDate as string);
        }
        if (toDate) {
          where.createdAt.lte = new Date(toDate as string);
        }
      }

      if (search) {
        where.OR = [
          {
            bookingRef: {
              contains: search as string,
              mode: Prisma.QueryMode.insensitive,
            },
          },
          {
            customerEmail: {
              contains: search as string,
              mode: Prisma.QueryMode.insensitive,
            },
          },
        ];
      }

      const [bookings, total] = await Promise.all([
        prisma.booking.findMany({
          where,
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit),
          orderBy: { createdAt: "asc" }, // Oldest first for queue processing
          include: {
            bookingSegments: {
              take: 1,
            },
            bookingPassengers: {
              take: 1,
            },
          },
        }),
        prisma.booking.count({ where }),
      ]);

      // Transform to queue format
      const queues = bookings.map((booking) => ({
        id: booking.id,
        bookingRef: booking.bookingRef,
        product: booking.serviceType,
        details:
          booking.bookingSegments[0]?.flightNumber ||
          booking.bookingSegments[0]?.hotelName ||
          "N/A",
        customerName: booking.bookingPassengers[0]
          ? `${booking.bookingPassengers[0].firstName} ${booking.bookingPassengers[0].lastName}`
          : booking.customerEmail || "N/A",
        issuedDate: booking.createdAt.toISOString(),
        queueStatus: booking.status,
        totalAmount: booking.totalAmount.toNumber(),
        currency: booking.currency,
      }));

      res.json({
        success: true,
        data: queues,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      console.error("Error fetching booking queues:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch booking queues",
      });
    }
  },
);

// POST /api/bookings/:id/queue-action - Perform queue action
router.post(
  "/:id/queue-action",
  requirePermission("bookings:update"),
  validateZod(idParamSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { action, reason, processedBy } = req.body;

      if (!action) {
        return res.status(400).json({
          success: false,
          error: "Action is required",
        });
      }

      const booking = await prisma.booking.findUnique({
        where: { id },
      });

      if (!booking) {
        return res.status(404).json({
          success: false,
          error: "Booking not found",
        });
      }

      let updateData: any = {};
      let modificationType = action;

      switch (action) {
        case "confirm":
          updateData = { status: "confirmed", workflowState: "confirmed" };
          break;
        case "hold":
          updateData = { status: "on_hold", workflowState: "on_hold" };
          break;
        case "cancel":
          updateData = { status: "cancelled", workflowState: "cancelled" };
          modificationType = "cancellation";
          break;
        case "refund":
          updateData = { status: "refunded", workflowState: "refunded" };
          modificationType = "refund";
          break;
        default:
          return res.status(400).json({
            success: false,
            error: "Invalid action",
          });
      }

      const updatedBooking = await prisma.booking.update({
        where: { id },
        data: updateData,
      });

      // Create modification record
      await prisma.bookingModification.create({
        data: {
          bookingId: id,
          modificationType,
          status: "completed",
          requestNote: reason,
          oldValue: { status: booking.status },
          newValue: updateData,
          internalNote: `Action: ${action} by ${processedBy || "admin"}`,
        },
      });

      res.json({
        success: true,
        data: serializeBooking(updatedBooking),
        message: `Booking ${action} action completed successfully`,
      });
    } catch (error) {
      console.error("Error performing queue action:", error);
      res.status(500).json({
        success: false,
        error: "Failed to perform queue action",
      });
    }
  },
);

export default router;
