import { Router, Response, NextFunction } from 'express';
import prisma from '../database.js';
import { AuthRequest, authMiddleware, requirePermission } from '../middleware/auth.js';
import { validateZod, bookingFilterSchema, idParamSchema } from '../middleware/validate.js';

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
  modificationFee: modification.modificationFee?.toNumber?.() ?? modification.modificationFee,
  penaltyFee: modification.penaltyFee?.toNumber?.() ?? modification.penaltyFee,
});

/**
 * @swagger
 * /api/bookings:
 *   get:
 *     summary: List all bookings with pagination and filters
 *     tags: [Bookings]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page (max 500)
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, updatedAt, totalAmount, baseAmount]
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Sort order
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by booking ref, email, or phone
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filter by service type
 *       - in: query
 *         name: fromDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter from date
 *       - in: query
 *         name: toDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter to date
 *       - in: query
 *         name: companyId
 *         schema:
 *           type: string
 *         description: Filter by company ID
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filter by user ID
 *     responses:
 *       200:
 *         description: List of bookings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       400:
 *         description: Invalid pagination parameters
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
 *       500:
 *         description: Failed to fetch bookings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
 */
router.get(
  '/',
  requirePermission('bookings:read'),
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

      const parsedPage = Number(page) || 1;
      const parsedLimit = Number(limit) || 20;
      const safeSortOrder = String(sortOrder || '').toLowerCase() === 'asc' ? 'asc' : 'desc';

      // restrict sortBy to an allow-list to avoid invalid orderBy fields
      const allowedSortBy = new Set(['createdAt', 'updatedAt', 'totalAmount', 'baseAmount']);
      const safeSortBy = allowedSortBy.has(String(sortBy)) ? String(sortBy) : 'createdAt';

      if (
        !Number.isInteger(parsedPage) ||
        parsedPage <= 0 ||
        !Number.isInteger(parsedLimit) ||
        parsedLimit <= 0 ||
        parsedLimit > 500
      ) {
        return res.status(400).json({
          success: false,
          error: 'Invalid pagination: page must be >=1 and limit between 1 and 500',
        });
      }

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
              mode: 'insensitive',
            },
          },
          {
            customerEmail: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            customerPhone: {
              contains: search,
              mode: 'insensitive',
            },
          },
        ];
      }

      const [bookings, total] = await Promise.all([
        prisma.booking.findMany({
          where,
          skip: (parsedPage - 1) * parsedLimit,
          take: parsedLimit,
          orderBy: safeSortBy ? { [safeSortBy]: safeSortOrder } : { createdAt: 'desc' },
          include: {
            bookingSegments: {
              orderBy: { sequenceNumber: 'asc' },
            },
            bookingPassengers: true,
            modifications: {
              take: 5,
              orderBy: { createdAt: 'desc' },
            },
          },
        }),
        prisma.booking.count({ where }),
      ]);

      res.json({
        success: true,
        data: bookings.map(serializeBooking),
        pagination: {
          page: parsedPage,
          limit: parsedLimit,
          total,
          totalPages: Math.ceil(total / parsedLimit),
        },
      });
    } catch (error) {
      console.error('Error fetching bookings:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch bookings',
      });
    }
  }
);

/**
 * @swagger
 * /api/bookings/stats:
 *   get:
 *     summary: Get booking statistics
 *     tags: [Bookings]
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d, 1y]
 *           default: 30d
 *         description: Time period for statistics
 *       - in: query
 *         name: companyId
 *         schema:
 *           type: string
 *         description: Filter by company ID
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filter by user ID
 *     responses:
 *       200:
 *         description: Booking statistics
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
 */
router.get(
  '/stats',
  requirePermission('bookings:read'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { period = '30d', companyId, userId } = req.query;

      // Calculate date range
      const now = new Date();
      const startDate = new Date();
      switch (period) {
        case '7d':
          startDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(now.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(now.getDate() - 90);
          break;
        case '1y':
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
        by: ['status'],
        where,
        _count: true,
        _sum: {
          totalAmount: true,
        },
      });

      // Get service type breakdown
      const serviceTypeBreakdown = await prisma.booking.groupBy({
        by: ['serviceType'],
        where,
        _count: true,
        _sum: {
          totalAmount: true,
        },
      });

      // Get payment status breakdown
      const paymentStatusBreakdown = await prisma.booking.groupBy({
        by: ['paymentStatus'],
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
          statusBreakdown: statusBreakdown.map(s => ({
            status: s.status,
            count: s._count,
            amount: s._sum.totalAmount?.toNumber?.() ?? 0,
          })),
          serviceTypeBreakdown: serviceTypeBreakdown.map(s => ({
            serviceType: s.serviceType,
            count: s._count,
            amount: s._sum.totalAmount?.toNumber?.() ?? 0,
          })),
          paymentStatusBreakdown: paymentStatusBreakdown.map(s => ({
            paymentStatus: s.paymentStatus,
            count: s._count,
            amount: s._sum.totalAmount?.toNumber?.() ?? 0,
          })),
          period,
        },
      });
    } catch (error) {
      console.error('Error fetching booking stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch booking statistics',
      });
    }
  }
);

/**
 * @swagger
 * /api/bookings/{id}:
 *   get:
 *     summary: Get booking by ID
 *     tags: [Bookings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     responses:
 *       200:
 *         description: Booking details
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
 */
router.get(
  '/:id',
  requirePermission('bookings:read'),
  validateZod(idParamSchema),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      // Avoid shadowing static routes - these are defined elsewhere in the router
      // If the ID matches a static route, pass to next() to avoid 404
      if (id === 'queues' || id === 'stats' || id === 'ref' || id === 'search') {
        return next();
      }

      const booking = await prisma.booking.findUnique({
        where: { id },
        include: {
          bookingSegments: {
            orderBy: { sequenceNumber: 'asc' },
          },
          bookingPassengers: true,
          modifications: {
            orderBy: { createdAt: 'desc' },
          },
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
        data: serializeBooking(booking),
      });
    } catch (error) {
      console.error('Error fetching booking:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch booking',
      });
    }
  }
);

/**
 * @swagger
 * /api/bookings/ref/{bookingRef}:
 *   get:
 *     summary: Get booking by reference
 *     tags: [Bookings]
 *     parameters:
 *       - in: path
 *         name: bookingRef
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking reference number
 *     responses:
 *       200:
 *         description: Booking details
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
 */
router.get(
  '/ref/:bookingRef',
  requirePermission('bookings:read'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { bookingRef } = req.params;

      const booking = await prisma.booking.findUnique({
        where: { bookingRef },
        include: {
          bookingSegments: {
            orderBy: { sequenceNumber: 'asc' },
          },
          bookingPassengers: true,
          modifications: {
            orderBy: { createdAt: 'desc' },
          },
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
        data: serializeBooking(booking),
      });
    } catch (error) {
      console.error('Error fetching booking:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch booking',
      });
    }
  }
);

/**
 * @swagger
 * /api/bookings/{id}/status:
 *   put:
 *     summary: Update booking status
 *     tags: [Bookings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *               reason:
 *                 type: string
 *               workflowState:
 *                 type: string
 *               paymentStatus:
 *                 type: string
 *     responses:
 *       200:
 *         description: Booking status updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                 message:
 *                   type: string
 *       404:
 *         description: Booking not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
 */
router.put(
  '/:id/status',
  requirePermission('bookings:update'),
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
          error: 'Booking not found',
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
            modificationType: 'status_change',
            status: 'completed',
            requestNote: reason,
            oldValue: { status: booking.status },
            newValue: updateData,
          },
        });
      }

      res.json({
        success: true,
        data: serializeBooking(updatedBooking),
        message: 'Booking status updated successfully',
      });
    } catch (error) {
      console.error('Error updating booking status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update booking status',
      });
    }
  }
);

/**
 * @swagger
 * /api/bookings/{id}/cancel:
 *   post:
 *     summary: Cancel booking
 *     tags: [Bookings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *               refundAmount:
 *                 type: number
 *               processedBy:
 *                 type: string
 *     responses:
 *       200:
 *         description: Booking cancelled
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
 *       404:
 *         description: Booking not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
 */
router.post(
  '/:id/cancel',
  requirePermission('bookings:update'),
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
          error: 'Booking not found',
        });
      }

      // Check if booking can be cancelled
      if (booking.status === 'cancelled') {
        return res.status(400).json({
          success: false,
          error: 'Booking is already cancelled',
        });
      }

      if (booking.status === 'completed') {
        return res.status(400).json({
          success: false,
          error: 'Cannot cancel a completed booking',
        });
      }

      // Update booking status
      const updatedBooking = await prisma.booking.update({
        where: { id },
        data: {
          status: 'cancelled',
          workflowState: 'cancelled',
        },
      });

      // Create modification record
      await prisma.bookingModification.create({
        data: {
          bookingId: id,
          modificationType: 'cancellation',
          status: 'completed',
          requestNote: reason,
          oldValue: { status: booking.status },
          newValue: { status: 'cancelled', refundAmount },
          internalNote: `Cancelled by: ${processedBy || 'admin'}`,
        },
      });

      res.json({
        success: true,
        data: serializeBooking(updatedBooking),
        message: 'Booking cancelled successfully',
      });
    } catch (error) {
      console.error('Error cancelling booking:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to cancel booking',
      });
    }
  }
);

/**
 * @swagger
 * /api/bookings/{id}/refund:
 *   post:
 *     summary: Process refund
 *     tags: [Bookings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *               reason:
 *                 type: string
 *               processedBy:
 *                 type: string
 *     responses:
 *       200:
 *         description: Refund processed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
 *       404:
 *         description: Booking not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
 */
router.post(
  '/:id/refund',
  requirePermission('bookings:update'),
  validateZod(idParamSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { amount, reason, processedBy } = req.body;

      const parsedAmount = amount === undefined ? null : Number(amount);
      if (parsedAmount !== null && (!Number.isFinite(parsedAmount) || parsedAmount < 0)) {
        return res.status(400).json({
          success: false,
          error: 'amount must be a non-negative number',
        });
      }

      const booking = await prisma.booking.findUnique({
        where: { id },
      });

      if (!booking) {
        return res.status(404).json({
          success: false,
          error: 'Booking not found',
        });
      }

      // Create modification record for refund
      const modification = await prisma.bookingModification.create({
        data: {
          bookingId: id,
          modificationType: 'refund',
          status: 'completed',
          requestNote: reason,
          modificationFee: parsedAmount !== null ? String(parsedAmount) : null,
          internalNote: `Processed by: ${processedBy || 'admin'}`,
        },
      });

      res.json({
        success: true,
        data: serializeModification(modification),
        message: 'Refund processed successfully',
      });
    } catch (error) {
      console.error('Error processing refund:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process refund',
      });
    }
  }
);

/**
 * @swagger
 * /api/bookings/{id}/modifications:
 *   get:
 *     summary: Get booking modification history
 *     tags: [Bookings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     responses:
 *       200:
 *         description: Success
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
router.get(
  '/:id/modifications',
  requirePermission('bookings:read'),
  validateZod(idParamSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      const modifications = await prisma.bookingModification.findMany({
        where: { bookingId: id },
        orderBy: { createdAt: 'desc' },
      });

      // Cast to any to handle Prisma Decimal fields that may not be in generated types
      res.json({
        success: true,
        data: (modifications as any[]).map(serializeModification),
      });
    } catch (error) {
      console.error('Error fetching modifications:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch modification history',
      });
    }
  }
);

/**
 * @swagger
 * /api/bookings/{id}/documents:
 *   get:
 *     summary: Get booking documents
 *     tags: [Bookings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     responses:
 *       200:
 *         description: Success
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
router.get(
  '/:id/documents',
  requirePermission('bookings:read'),
  validateZod(idParamSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      const documents = await prisma.document.findMany({
        where: { bookingId: id },
        orderBy: { createdAt: 'desc' },
        include: {
          template: {
            select: {
              name: true,
              type: true,
            },
          },
          access: {
            take: 5,
            orderBy: { timestamp: 'desc' },
          },
        },
      });

      res.json({
        success: true,
        data: documents,
      });
    } catch (error) {
      console.error('Error fetching documents:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch documents',
      });
    }
  }
);

/**
 * @swagger
 * /api/bookings/queues:
 *   get:
 *     summary: Get booking queues for admin processing
 *     tags: [Bookings]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: product
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: fromDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: toDate
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *       400:
 *         description: Invalid pagination parameters
 *       500:
 *         description: Server error
 */
router.get(
  '/queues',
  requirePermission('bookings:read'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 20, status, product, search, fromDate, toDate } = req.query;

      const parsedPage = Number(page) || 1;
      const parsedLimit = Number(limit) || 20;

      if (
        !Number.isInteger(parsedPage) ||
        parsedPage <= 0 ||
        !Number.isInteger(parsedLimit) ||
        parsedLimit <= 0 ||
        parsedLimit > 500
      ) {
        return res.status(400).json({
          success: false,
          error: 'Invalid pagination: page must be >=1 and limit between 1 and 500',
        });
      }

      // Build where clause for bookings that need attention
      const where: any = {
        OR: [{ status: 'pending' }, { status: 'on_hold' }, { workflowState: 'requires_attention' }],
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
              mode: 'insensitive',
            },
          },
          {
            customerEmail: {
              contains: search as string,
              mode: 'insensitive',
            },
          },
        ];
      }

      const [bookings, total] = await Promise.all([
        prisma.booking.findMany({
          where,
          skip: (parsedPage - 1) * parsedLimit,
          take: parsedLimit,
          orderBy: { createdAt: 'asc' }, // Oldest first for queue processing
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
      const queues = bookings.map(booking => ({
        id: booking.id,
        bookingRef: booking.bookingRef,
        product: booking.serviceType,
        details:
          booking.bookingSegments[0]?.flightNumber ||
          booking.bookingSegments[0]?.hotelName ||
          'N/A',
        customerName: booking.bookingPassengers[0]
          ? `${booking.bookingPassengers[0].firstName} ${booking.bookingPassengers[0].lastName}`
          : booking.customerEmail || 'N/A',
        issuedDate: booking.createdAt.toISOString(),
        queueStatus: booking.status,
        totalAmount: booking.totalAmount.toNumber(),
        currency: booking.currency,
      }));

      res.json({
        success: true,
        data: queues,
        pagination: {
          page: parsedPage,
          limit: parsedLimit,
          total,
          totalPages: Math.ceil(total / parsedLimit),
        },
      });
    } catch (error) {
      console.error('Error fetching booking queues:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch booking queues',
      });
    }
  }
);

/**
 * @swagger
 * /api/bookings/{id}/queue-action:
 *   post:
 *     summary: Perform queue action on booking
 *     tags: [Bookings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [confirm, hold, cancel, refund]
 *               reason:
 *                 type: string
 *               processedBy:
 *                 type: string
 *     responses:
 *       200:
 *         description: Queue action completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid request
 *       404:
 *         description: Booking not found
 *       500:
 *         description: Server error
 */
router.post(
  '/:id/queue-action',
  requirePermission('bookings:update'),
  validateZod(idParamSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { action, reason, processedBy } = req.body;

      if (!action) {
        return res.status(400).json({
          success: false,
          error: 'Action is required',
        });
      }

      const booking = await prisma.booking.findUnique({
        where: { id },
      });

      if (!booking) {
        return res.status(404).json({
          success: false,
          error: 'Booking not found',
        });
      }

      let updateData: any = {};
      let modificationType = action;

      switch (action) {
        case 'confirm':
          updateData = { status: 'confirmed', workflowState: 'confirmed' };
          break;
        case 'hold':
          updateData = { status: 'on_hold', workflowState: 'on_hold' };
          break;
        case 'cancel':
          updateData = { status: 'cancelled', workflowState: 'cancelled' };
          modificationType = 'cancellation';
          break;
        case 'refund':
          updateData = { status: 'refunded', workflowState: 'refunded' };
          modificationType = 'refund';
          break;
        default:
          return res.status(400).json({
            success: false,
            error: 'Invalid action',
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
          status: 'completed',
          requestNote: reason,
          oldValue: { status: booking.status },
          newValue: updateData,
          internalNote: `Action: ${action} by ${processedBy || 'admin'}`,
        },
      });

      res.json({
        success: true,
        data: serializeBooking(updatedBooking),
        message: `Booking ${action} action completed successfully`,
      });
    } catch (error) {
      console.error('Error performing queue action:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to perform queue action',
      });
    }
  }
);

export default router;
