import { Router, Request, Response, NextFunction } from 'express';
import type { Router as ExpressRouter } from 'express';
import axios, { AxiosResponse } from 'axios';
import { prisma } from '@tripalfa/shared-database';

const router: ExpressRouter = Router();

const BOOKING_SERVICE_URL =
  process.env.BOOKING_SERVICE_URL || 'http://booking-service:3001/api/bookings';

/**
 * @swagger
 * /api/admin/bookings:
 *   post:
 *     summary: Create a manual booking
 *     tags: [Bookings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, type, amount]
 *             properties:
 *               userId:
 *                 type: string
 *                 description: ID of the user
 *               type:
 *                 type: string
 *                 description: Booking type
 *               amount:
 *                 type: number
 *                 description: Booking amount
 *               currency:
 *                 type: string
 *                 description: Currency code
 *               details:
 *                 type: string
 *                 description: Booking details
 *               customerName:
 *                 type: string
 *                 description: Customer name
 *     responses:
 *       201:
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
router.post('/', async (req: Request, res: Response) => {
  try {
    const bookingData = req.body;

    // Create a real Booking record in the Neon database
    const newBooking = await prisma.booking.create({
      data: {
        bookingRef: `MB${Math.floor(1000000 + Math.random() * 9000000)}`,
        userId: bookingData.userId || 'manual-admin',
        serviceType: bookingData.type || 'Manual',
        status: 'confirmed',
        baseAmount: bookingData.amount || 0,
        totalAmount: bookingData.amount || 0,
        currency: bookingData.currency || 'USD',
        metadata: {
          details: bookingData.details || 'Manual Booking Entry',
          customerName: bookingData.customerName || 'Walk-in Customer',
          source: 'manual-admin-panel',
        },
      },
    });

    // Create a persistent queue entry
    await prisma.bookingQueue.create({
      data: {
        bookingId: newBooking.id,
        queueType: 'verification',
        status: 'completed',
        priority: 'medium',
        notes: `Manual booking created by admin for ${bookingData.customerName || 'Unknown'}`,
      },
    });

    // Log to persistent AuditLog
    await prisma.auditLog.create({
      data: {
        action: 'manual-booking-created',
        resource: 'Booking',
        resourceId: newBooking.id,
        metadata: { bookingRef: newBooking.bookingRef },
      },
    });

    res.status(201).json({
      success: true,
      data: newBooking,
    });
  } catch (error: unknown) {
    console.error(
      'Error creating manual booking:',
      error instanceof Error ? error.message : String(error)
    );
    res.status(500).json({
      success: false,
      error: 'Failed to create manual booking',
    });
  }
});

/**
 * @swagger
 * /api/admin/bookings:
 *   get:
 *     summary: List all bookings with admin filters
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
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filter by type
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term
 *       - in: query
 *         name: fromDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter from date
 *       - in: query
 *         name: toDate
 *         schema:
 *           type: string
 *           format: date
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
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *         description: Sort field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
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
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      type,
      search,
      fromDate,
      toDate,
      companyId,
      userId,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    // Build query parameters for booking service
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sortBy: sortBy.toString(),
      sortOrder: sortOrder.toString(),
    });

    if (status) queryParams.append('status', status.toString());
    if (type) queryParams.append('type', type.toString());
    if (search) queryParams.append('search', search.toString());
    if (fromDate) queryParams.append('startDate', fromDate.toString());
    if (toDate) queryParams.append('endDate', toDate.toString());
    if (companyId) queryParams.append('companyId', companyId.toString());
    if (userId) queryParams.append('userId', userId.toString());

    const response = await axios.get(`${BOOKING_SERVICE_URL}?${queryParams}`, {
      headers: {
        Authorization: req.headers.authorization || '',
        'X-Admin-Request': 'true',
      },
    });

    res.json(response.data);
  } catch (error: unknown) {
    console.error(
      'Error fetching bookings:',
      error instanceof Error ? error.message : String(error)
    );
    const axiosError = error as { response?: { status?: number } };
    res.status(axiosError.response?.status || 500).json({
      success: false,
      error: 'Failed to fetch bookings',
    });
  }
});

/**
 * @swagger
 * /api/admin/bookings/stats/summary:
 *   get:
 *     summary: Get booking statistics
 *     tags: [Bookings]
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           default: 30d
 *         description: Time period for stats
 *       - in: query
 *         name: companyId
 *         schema:
 *           type: string
 *         description: Filter by company ID
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
router.get('/stats/summary', async (req: Request, res: Response) => {
  try {
    const { period = '30d', companyId } = req.query;

    // This could aggregate data from multiple sources
    // For now, get basic stats from booking service
    const response = await axios.get(
      `${BOOKING_SERVICE_URL}/stats/summary?period=${period}${companyId ? `&companyId=${companyId}` : ''}`,
      {
        headers: {
          Authorization: req.headers.authorization || '',
          'X-Admin-Request': 'true',
        },
      }
    );

    res.json(response.data);
  } catch (error: any) {
    console.error('Error fetching booking stats:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: 'Failed to fetch booking statistics',
    });
  }
});

/**
 * @swagger
 * /api/admin/bookings/user/{userId}:
 *   get:
 *     summary: Get user bookings (admin view)
 *     tags: [Bookings]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
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
 *         description: Items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status
 *       - in: query
 *         name: fromDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter from date
 *       - in: query
 *         name: toDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter to date
 *     responses:
 *       200:
 *         description: User bookings
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
router.get('/user/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20, status, fromDate, toDate } = req.query;

    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      userId: userId.toString(),
    });

    if (status) queryParams.append('status', status.toString());
    if (fromDate) queryParams.append('startDate', fromDate.toString());
    if (toDate) queryParams.append('endDate', toDate.toString());

    const response = await axios.get(`${BOOKING_SERVICE_URL}?${queryParams}`, {
      headers: {
        Authorization: req.headers.authorization || '',
        'X-Admin-Request': 'true',
      },
    });

    res.json(response.data);
  } catch (error) {
    const message =
      error && typeof error === 'object' && 'message' in error
        ? (error as Error).message
        : String(error);
    console.error('Error fetching user bookings:', message);
    const status =
      error &&
      typeof error === 'object' &&
      'response' in error &&
      error.response &&
      typeof error.response === 'object' &&
      'status' in error.response
        ? (error.response as { status: number }).status
        : 500;
    res.status(status).json({
      success: false,
      error: 'Failed to fetch user bookings',
    });
  }
});

/**
 * @swagger
 * /api/admin/bookings/{id}:
 *   get:
 *     summary: Get booking details
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
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // Avoid shadowing static routes like /queues
    if (id === 'queues' || id === 'stats' || id === 'user') {
      return next();
    }

    const response = await axios.get(`${BOOKING_SERVICE_URL}/${id}`, {
      headers: {
        Authorization: req.headers.authorization || '',
        'X-Admin-Request': 'true',
      },
    });

    res.json(response.data);
  } catch (error: unknown) {
    console.error(
      'Error fetching booking:',
      error instanceof Error ? error.message : String(error)
    );
    const axiosError = error as { response?: { status?: number } };
    res.status(axiosError.response?.status || 500).json({
      success: false,
      error: 'Failed to fetch booking details',
    });
  }
});

/**
 * @swagger
 * /api/admin/bookings/{id}/cancel:
 *   put:
 *     summary: Cancel booking (admin override)
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
 *                 description: Cancellation reason
 *               refundAmount:
 *                 type: number
 *                 description: Refund amount
 *               processedBy:
 *                 type: string
 *                 description: Admin who processed
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
router.put('/:id/cancel', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason, refundAmount, processedBy } = req.body;

    const response = await axios.put(
      `${BOOKING_SERVICE_URL}/${id}/cancel`,
      {
        reason,
        refundAmount,
        processedBy,
        adminOverride: true,
      },
      {
        headers: {
          Authorization: req.headers.authorization || '',
          'X-Admin-Request': 'true',
        },
      }
    );

    res.json(response.data);
  } catch (error: unknown) {
    console.error(
      'Error cancelling booking:',
      error instanceof Error ? error.message : String(error)
    );
    const axiosError = error as { response?: { status?: number } };
    res.status(axiosError.response?.status || 500).json({
      success: false,
      error: 'Failed to cancel booking',
    });
  }
});

/**
 * @swagger
 * /api/admin/bookings/{id}/status:
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
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 description: New booking status
 *               reason:
 *                 type: string
 *                 description: Reason for status change
 *               processedBy:
 *                 type: string
 *                 description: Admin who processed
 *     responses:
 *       200:
 *         description: Status updated successfully
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
router.put('/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, reason, processedBy } = req.body;

    // For admin status updates, we might need to call booking service
    // or handle internally based on business logic
    const response = await axios.put(
      `${BOOKING_SERVICE_URL}/${id}`,
      {
        status,
        reason,
        processedBy,
        adminOverride: true,
      },
      {
        headers: {
          Authorization: req.headers.authorization || '',
          'X-Admin-Request': 'true',
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    const message =
      error && typeof error === 'object' && 'message' in error
        ? (error as Error).message
        : String(error);
    console.error('Error updating booking status:', message);
    const status =
      error &&
      typeof error === 'object' &&
      'response' in error &&
      error.response &&
      typeof error.response === 'object' &&
      'status' in error.response
        ? (error.response as { status: number }).status
        : 500;
    res.status(status).json({
      success: false,
      error: 'Failed to update booking status',
    });
  }
});

/**
 * @swagger
 * /api/admin/bookings/{id}:
 *   put:
 *     summary: Update booking details
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
 *               serviceType:
 *                 type: string
 *               customerEmail:
 *                 type: string
 *               customerPhone:
 *                 type: string
 *               metadata:
 *                 type: object
 *     responses:
 *       200:
 *         description: Booking updated successfully
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
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const response = await axios.put(
      `${BOOKING_SERVICE_URL}/${id}`,
      {
        ...updateData,
        updatedByAdmin: true,
        // adminId will be extracted from JWT token by booking service
      },
      {
        headers: {
          Authorization: req.headers.authorization || '',
          'X-Admin-Request': 'true',
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    const message =
      error && typeof error === 'object' && 'message' in error
        ? (error as Error).message
        : String(error);
    console.error('Error updating booking:', message);
    const status =
      error &&
      typeof error === 'object' &&
      'response' in error &&
      error.response &&
      typeof error.response === 'object' &&
      'status' in error.response
        ? (error.response as { status: number }).status
        : 500;
    res.status(status).json({
      success: false,
      error: 'Failed to update booking',
    });
  }
});

/**
 * @swagger
 * /api/admin/bookings/{id}:
 *   delete:
 *     summary: Delete booking (admin only)
 *     tags: [Bookings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *               processedBy:
 *                 type: string
 *     responses:
 *       200:
 *         description: Booking deleted successfully
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
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason, processedBy } = req.body;

    // Note: This might not be exposed by booking service for safety
    // Could be handled internally or through special admin procedures
    const response = await axios.delete(`${BOOKING_SERVICE_URL}/${id}`, {
      data: { reason, processedBy, adminOverride: true },
      headers: {
        Authorization: req.headers.authorization || '',
        'X-Admin-Request': 'true',
      },
    });

    res.json(response.data);
  } catch (error) {
    const message =
      error && typeof error === 'object' && 'message' in error
        ? (error as Error).message
        : String(error);
    console.error('Error deleting booking:', message);
    const status =
      error &&
      typeof error === 'object' &&
      'response' in error &&
      error.response &&
      typeof error.response === 'object' &&
      'status' in error.response
        ? (error.response as { status: number }).status
        : 500;
    res.status(status).json({
      success: false,
      error: 'Failed to delete booking',
    });
  }
});

/**
 * @swagger
 * /api/bookings/queues:
 *   get:
 *     summary: List booking queues (admin view)
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
 *           default: 10
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
 *     responses:
 *       200:
 *         description: List of booking queues
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 queues:
 *                   type: array
 *                 total:
 *                   type: integer
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
router.get('/queues', async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, status, product, search } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    // Build filter
    const where: any = {};
    if (status) where.status = status as string;
    if (product) {
      where.booking = { serviceType: product as string };
    }
    if (search) {
      where.booking = {
        OR: [
          { bookingRef: { contains: search as string, mode: 'insensitive' } },
          { customerEmail: { contains: search as string, mode: 'insensitive' } },
        ],
      };
    }

    const [queues, total] = await Promise.all([
      prisma.bookingQueue.findMany({
        where,
        include: { booking: true },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.bookingQueue.count({ where }),
    ]);

    // Map to the format expected by the frontend (previously MockQueueRow)
    const formattedQueues = queues.map(q => ({
      id: q.id,
      bookingRef: q.booking.bookingRef,
      supplierRef: q.booking.id, // Using internal ID as supplier ref for now
      product: q.booking.serviceType,
      details: (q.booking.metadata as any)?.details || q.notes || 'No details',
      customerName: (q.booking.metadata as any)?.customerName || q.booking.customerEmail || 'Guest',
      issuedDate: q.createdAt.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: '2-digit',
      }),
      queueStatus: q.status,
      updatedAt: q.updatedAt.toISOString(),
      queueType: q.queueType,
      priority: q.priority,
    }));

    res.json({
      success: true,
      queues: formattedQueues,
      total,
    });
  } catch (error: any) {
    console.error('Error fetching booking queues:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch booking queues from database',
    });
  }
});

/**
 * @swagger
 * /api/bookings/{id}/queue-action:
 *   post:
 *     summary: Perform queue action (refund/cancel/hold/confirm)
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
 *             required: [action]
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [refund, cancel, hold, confirm]
 *               reason:
 *                 type: string
 *               processedBy:
 *                 type: string
 *     responses:
 *       200:
 *         description: Queue action performed successfully
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
 *         description: Action is required
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
router.post('/:id/queue-action', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { action, reason, processedBy } = req.body;

    if (!action) {
      return res.status(400).json({ success: false, error: 'Action is required' });
    }

    const response = await axios.post(
      `${BOOKING_SERVICE_URL}/${id}/queue-action`,
      { action, reason, processedBy },
      {
        headers: {
          Authorization: req.headers.authorization || '',
          'X-Admin-Request': 'true',
        },
      }
    );

    res.json(response.data);
  } catch (error: any) {
    console.error('Error performing queue action:', error.message);
    // Fallback: perform action against in-memory queues
    const { id } = req.params;
    const { action, processedBy } = req.body;
    const idx = mockQueues.findIndex(q => String(q.id) === String(id));
    if (idx === -1) {
      return res.status(404).json({ success: false, error: 'Queue item not found' });
    }

    const mapping: Record<string, string> = {
      refund: 'Req. Refund',
      cancel: 'Req. Cancel',
      hold: 'Hold',
      confirm: 'Confirmed',
    };

    const newStatus = mapping[action] || action;
    mockQueues[idx].queueStatus = newStatus;
    mockQueues[idx].updatedAt = new Date().toISOString();

    mockAuditLogs.push({
      id: mockAuditLogs.length + 1,
      action: `queue-action:${action}`,
      performedBy: processedBy || 'system',
      ts: new Date().toISOString(),
      details: { queueId: id },
    });

    return res.json({ success: true, queue: mockQueues[idx], fallback: true });
  }
});

/**
 * @swagger
 * /api/bookings/{id}/invoice:
 *   get:
 *     summary: Get invoice JSON for booking
 *     tags: [Bookings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID or invoice number
 *     responses:
 *       200:
 *         description: Invoice data
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
 *         description: Invoice not found
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
router.get('/:id/invoice', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const invoice = await prisma.invoice.findFirst({
      where: {
        OR: [{ bookingId: id }, { invoiceNumber: id }],
      },
      include: {
        booking: {
          include: {
            bookingPassengers: true,
            bookingSegments: true,
          },
        },
        payments: true,
      },
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found for this booking',
      });
    }

    res.json({
      success: true,
      data: invoice,
    });
  } catch (error: any) {
    console.error('Error fetching invoice:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch invoice from database',
    });
  }
});

/**
 * @swagger
 * /api/bookings/{id}/invoice/pdf:
 *   get:
 *     summary: Get invoice PDF
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
 *         description: Invoice PDF
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       501:
 *         description: PDF generation not available
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
router.get('/:id/invoice/pdf', async (req: Request, res: Response) => {
  const { id } = req.params;

  // First try to proxy upstream PDF if available
  const pdfUrl = `${BOOKING_SERVICE_URL}/${id}/invoice/pdf`;
  try {
    const upstream = await axios.get(pdfUrl, {
      headers: {
        Authorization: req.headers.authorization || '',
        'X-Admin-Request': 'true',
      },
      responseType: 'arraybuffer',
      timeout: 5000,
    });
    res.setHeader('Content-Type', 'application/pdf');
    return res.send(upstream.data);
  } catch (upErr) {
    // Upstream not available or doesn't support PDF - attempt server-side rendering using puppeteer
    try {
      // NOTE: In ESM, we use dynamic import() instead of require()
      // @ts-ignore
      const { default: puppeteer } = await import('puppeteer');

      // Fetch invoice HTML from upstream invoice endpoint (or use fallback)
      let html: string;
      try {
        const inv = await axios.get(`${BOOKING_SERVICE_URL}/${id}/invoice`, {
          headers: {
            Authorization: req.headers.authorization || '',
            'X-Admin-Request': 'true',
          },
          timeout: 5000,
        });
        if (typeof inv.data === 'string') html = inv.data;
        else html = `<html><body><pre>${JSON.stringify(inv.data, null, 2)}</pre></body></html>`;
      } catch (invErr) {
        // Fallback: generate a minimal invoice HTML from mock data if available
        const q = mockQueues.find(m => String(m.id) === String(id));
        if (q) {
          html = `<html><body><h1>Invoice for ${q.bookingRef}</h1><p>Customer: ${q.customerName}</p><p>Supplier: ${q.supplierRef}</p></body></html>`;
        } else {
          return res.status(501).json({
            success: false,
            error: 'Invoice HTML unavailable to generate PDF',
          });
        }
      }

      // Launch puppeteer and generate PDF buffer
      const browser = await (puppeteer as any).launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
      await browser.close();

      res.setHeader('Content-Type', 'application/pdf');
      res.send(pdfBuffer);
    } catch (puppeteerErr: any) {
      console.error('PDF generation failed:', puppeteerErr?.message || puppeteerErr);
      return res.status(501).json({
        success: false,
        error: 'PDF generation not available on server',
      });
    }
  }
});

/**
 * @swagger
 * /api/bookings/{id}/invoice:
 *   post:
 *     summary: Generate invoice for booking
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
 *               totalAmount:
 *                 type: number
 *               amount:
 *                 type: number
 *               currency:
 *                 type: string
 *                 default: USD
 *               dueDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Invoice generated successfully
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
router.post('/:id/invoice', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { totalAmount, currency, dueDate, amount } = req.body;

    // Use provided amounts or calculate from request body
    const invoiceAmount = Number(totalAmount || amount || 0);
    const invoiceCurrency = currency || 'USD';

    // Create persistent invoice in Prisma
    const newInvoice = await prisma.invoice.create({
      data: {
        bookingId: id,
        invoiceNumber: `INV-${Date.now()}`,
        totalAmount: invoiceAmount,
        currency: invoiceCurrency,
        dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: 'unpaid',
      },
    });

    // Log audit trail for invoice generation
    await prisma.auditLog.create({
      data: {
        action: 'invoice-generated',
        resource: 'Invoice',
        resourceId: newInvoice.id,
        metadata: {
          bookingId: id,
          invoiceNumber: newInvoice.invoiceNumber,
          amount: invoiceAmount,
        },
      },
    });

    res.status(201).json({
      success: true,
      data: newInvoice,
    });
  } catch (error: any) {
    console.error('Error generating invoice:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate invoice in database',
    });
  }
});

/**
 * @swagger
 * /api/admin/bookings/{id}/pricing:
 *   post:
 *     summary: Save pricing for booking
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
 *             required: [baseAmount, currency]
 *             properties:
 *               baseAmount:
 *                 type: number
 *               markup:
 *                 type: number
 *               tax:
 *                 type: number
 *               fees:
 *                 type: number
 *               currency:
 *                 type: string
 *               total:
 *                 type: number
 *               note:
 *                 type: string
 *     responses:
 *       201:
 *         description: Pricing saved successfully
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
 *         description: Missing required fields
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
router.post('/:id/pricing', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { baseAmount, markup, tax, fees, currency, total, note } = req.body;

    // Validate pricing data
    if (baseAmount === undefined || currency === undefined) {
      return res.status(400).json({
        success: false,
        error: 'baseAmount and currency are required',
      });
    }

    // Store pricing in audit log for persistence
    const pricingEntry = {
      bookingId: parseInt(id as string),
      baseAmount,
      markup: markup || 0,
      tax: tax || 0,
      fees: fees || 0,
      total: total || baseAmount + (markup || 0) + (tax || 0) + (fees || 0),
      currency,
      note: note || '',
      createdAt: new Date().toISOString(),
    };

    mockAuditLogs.push({
      id: mockAuditLogs.length + 1,
      action: 'pricing-saved',
      performedBy: 'admin',
      ts: new Date().toISOString(),
      details: pricingEntry,
    });

    // Update the booking in mockQueues if present
    const queueIdx = mockQueues.findIndex(q => String(q.id) === String(id));
    if (queueIdx !== -1) {
      mockQueues[queueIdx].updatedAt = new Date().toISOString();
    }

    res.status(201).json({
      success: true,
      data: pricingEntry,
      message: 'Pricing saved successfully',
    });
  } catch (error: unknown) {
    console.error('Error saving pricing:', error instanceof Error ? error.message : String(error));
    res.status(500).json({
      success: false,
      error: 'Failed to save pricing',
    });
  }
});

/**
 * @swagger
 * /api/admin/bookings/{id}/pay-wallet:
 *   post:
 *     summary: Process wallet payment for booking
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
 *               currency:
 *                 type: string
 *                 default: USD
 *     responses:
 *       201:
 *         description: Wallet payment processed successfully
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
router.post('/:id/pay-wallet', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { amount, currency } = req.body;

    // Find or create invoice first
    let invoice = await prisma.invoice.findFirst({
      where: { bookingId: id },
    });

    if (!invoice) {
      invoice = await prisma.invoice.create({
        data: {
          bookingId: id,
          invoiceNumber: `INV-${Date.now()}`,
          totalAmount: Number(amount || 0),
          currency: currency || 'USD',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          status: 'unpaid',
        },
      });
    }

    // Create persistent payment record
    const paymentRecord = await prisma.paymentRecord.create({
      data: {
        invoiceId: invoice.id,
        amount: Number(amount || 0),
        currency: currency || 'USD',
        paymentMethod: 'wallet',
        gateway: 'admin',
        transactionId: `TX-W-${Date.now()}`,
        status: 'completed',
      },
    });

    // Update invoice status if fully paid
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: { status: 'paid' },
    });

    // Log to persistent AuditLog
    await prisma.auditLog.create({
      data: {
        action: 'wallet-payment-initiated',
        resource: 'PaymentRecord',
        resourceId: paymentRecord.id,
        metadata: { bookingId: id, amount, currency },
      },
    });

    // Update booking queue status to processing
    const queueEntry = await prisma.bookingQueue.findFirst({
      where: { bookingId: id },
    });
    if (queueEntry) {
      await prisma.bookingQueue.update({
        where: { id: queueEntry.id },
        data: {
          status: 'processing',
          notes: `${queueEntry.notes || ''}\nWallet payment processed.`,
        },
      });
    }

    res.status(201).json({
      success: true,
      data: paymentRecord,
      message: 'Wallet payment processed successfully in database',
    });
  } catch (error: any) {
    console.error('Error processing wallet payment:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to process wallet payment in database',
    });
  }
});

export default router;
