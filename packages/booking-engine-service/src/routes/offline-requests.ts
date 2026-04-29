import { Router, Response } from 'express';
import prisma from '../database.js';

const router: Router = Router();

/**
 * @swagger
 * /api/offline-requests:
 *   post:
 *     summary: Create an offline change request
 *     tags: [Offline Requests]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [bookingId, bookingRef, requestType]
 *             properties:
 *               bookingId:
 *                 type: string
 *               bookingRef:
 *                 type: string
 *               requestType:
 *                 type: string
 *               originalDetails:
 *                 type: object
 *               requestedChanges:
 *                 type: object
 *               priority:
 *                 type: string
 *                 default: medium
 *               customerId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Offline request created
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
 *         description: Bad request
 *       500:
 *         description: Server error
 */
router.post('/', async (req, res: Response) => {
  try {
    const {
      bookingId,
      bookingRef,
      requestType,
      originalDetails,
      requestedChanges,
      priority = 'medium',
    } = req.body;

    if (!bookingId || !bookingRef || !requestType) {
      return res.status(400).json({
        success: false,
        error: 'Booking ID, booking reference, and request type are required',
      });
    }

    // Generate request reference
    const requestRef = `OCR-${Date.now().toString(36).toUpperCase()}`;

    const offlineRequest = await prisma.offlineChangeRequest.create({
      data: {
        requestRef,
        bookingId,
        bookingRef,
        requestType,
        priority,
        submittedBy: req.body.customerId || 'customer',
        requestDetails: {
          customerId: req.body.customerId || 'customer',
          originalDetails: originalDetails || {},
          requestedChanges: requestedChanges || {},
          timeline: {
            requestedAt: new Date().toISOString(),
          },
        },
        status: 'pending_staff',
      },
    });

    // Create audit log
    await prisma.offlineRequestAuditLog.create({
      data: {
        offlineRequestId: offlineRequest.id,
        action: 'created',
        actorId: req.body.customerId || 'customer',
        actorType: 'customer',
        newStatus: offlineRequest.status,
        metadata: offlineRequest,
      },
    });

    res.status(201).json({
      success: true,
      data: offlineRequest,
      message: 'Offline request created successfully',
    });
  } catch (error: any) {
    console.error('[OfflineRequests] Create error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to create offline request',
    });
  }
});

/**
 * @swagger
 * /api/offline-requests:
 *   get:
 *     summary: List offline change requests
 *     tags: [Offline Requests]
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
 *         description: Items per page (max 200)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status
 *       - in: query
 *         name: requestType
 *         schema:
 *           type: string
 *         description: Filter by request type
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *         description: Filter by priority
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by requestRef or bookingRef
 *     responses:
 *       200:
 *         description: List of offline requests with pagination
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
 *         description: Bad request
 *       500:
 *         description: Server error
 */
router.get('/', async (req, res: Response) => {
  try {
    const { page = 1, limit = 20, status, requestType, priority, search } = req.query;

    const parsedPage = Number(page);
    const parsedLimit = Number(limit);

    if (
      !Number.isInteger(parsedPage) ||
      parsedPage <= 0 ||
      !Number.isInteger(parsedLimit) ||
      parsedLimit <= 0 ||
      parsedLimit > 200
    ) {
      return res.status(400).json({
        success: false,
        error: 'Invalid pagination values: page >= 1, limit in [1, 200]',
      });
    }

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (requestType) {
      where.requestType = requestType;
    }

    if (priority) {
      where.priority = priority;
    }

    if (search) {
      where.OR = [
        { requestRef: { contains: search.toString(), mode: 'insensitive' } },
        { bookingRef: { contains: search.toString(), mode: 'insensitive' } },
      ];
    }

    const [requests, total] = await Promise.all([
      prisma.offlineChangeRequest.findMany({
        where,
        skip: (parsedPage - 1) * parsedLimit,
        take: parsedLimit,
        orderBy: { createdAt: 'desc' },
        include: {
          auditLogs: {
            take: 5,
            orderBy: { createdAt: 'desc' },
          },
        },
      }),
      prisma.offlineChangeRequest.count({ where }),
    ]);

    res.json({
      success: true,
      data: requests,
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total,
        totalPages: Math.ceil(total / parsedLimit),
      },
    });
  } catch (error: any) {
    console.error('[OfflineRequests] List error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to list offline requests',
    });
  }
});

/**
 * @swagger
 * /api/offline-requests/{id}:
 *   get:
 *     summary: Get offline request details
 *     tags: [Offline Requests]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The offline request ID
 *     responses:
 *       200:
 *         description: Offline request details
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
 *         description: Offline request not found
 *       500:
 *         description: Server error
 */
router.get('/:id', async (req, res: Response) => {
  try {
    const { id } = req.params;

    const offlineRequest = await prisma.offlineChangeRequest.findUnique({
      where: { id },
      include: {
        auditLogs: {
          orderBy: { createdAt: 'desc' },
        },
        notifications: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!offlineRequest) {
      return res.status(404).json({
        success: false,
        error: 'Offline request not found',
      });
    }

    res.json({
      success: true,
      data: offlineRequest,
    });
  } catch (error: any) {
    console.error('[OfflineRequests] Get error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to get offline request',
    });
  }
});

/**
 * @swagger
 * /api/offline-requests/{id}/pricing:
 *   put:
 *     summary: Submit pricing for offline request
 *     tags: [Offline Requests]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The offline request ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [staffId]
 *             properties:
 *               staffId:
 *                 type: string
 *               staffPricing:
 *                 type: object
 *               priceDifference:
 *                 type: number
 *               staffNotes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Pricing submitted successfully
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
 *         description: Bad request
 *       404:
 *         description: Offline request not found
 *       500:
 *         description: Server error
 */
router.put('/:id/pricing', async (req, res: Response) => {
  try {
    const { id } = req.params;
    const { staffPricing, priceDifference, staffNotes, staffId } = req.body;

    if (!staffId || typeof staffId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'staffId is required',
      });
    }

    const offlineRequest = await prisma.offlineChangeRequest.findUnique({
      where: { id },
    });

    if (!offlineRequest) {
      return res.status(404).json({
        success: false,
        error: 'Offline request not found',
      });
    }

    if (offlineRequest.status !== 'pending_staff') {
      return res.status(400).json({
        success: false,
        error: 'Request is not in pending_staff status',
      });
    }

    const updatedRequest = await prisma.offlineChangeRequest.update({
      where: { id },
      data: {
        resolution: {
          ...(offlineRequest.resolution as any),
          staffPricing,
          priceDifference,
          staffPricedAt: new Date().toISOString(),
          staffId,
        },
        status: 'pricing_submitted',
        notes: staffNotes,
      },
    });

    // Create audit log
    await prisma.offlineRequestAuditLog.create({
      data: {
        offlineRequestId: id,
        action: 'pricing_submitted',
        actorId: staffId,
        actorType: 'staff',
        previousStatus: offlineRequest.status,
        newStatus: 'pricing_submitted',
        notes: staffNotes,
        metadata: { staffPricing, priceDifference },
      },
    });

    // Create notification queue entry
    const requestDetails = (offlineRequest.requestDetails as any) || {};
    await prisma.offlineRequestNotificationQueue.create({
      data: {
        offlineRequestId: id,
        status: 'pending',
        notificationType: 'offline_request_priced',
        recipientId: requestDetails?.customerId || 'customer',
        payload: {
          requestRef: offlineRequest.requestRef,
          priceDifference,
        },
      },
    });

    res.json({
      success: true,
      data: updatedRequest,
      message: 'Pricing submitted successfully',
    });
  } catch (error: any) {
    console.error('[OfflineRequests] Pricing error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to submit pricing',
    });
  }
});

/**
 * @swagger
 * /api/offline-requests/{id}/approve:
 *   put:
 *     summary: Approve or reject offline request
 *     tags: [Offline Requests]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The offline request ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [approved, customerId]
 *             properties:
 *               approved:
 *                 type: boolean
 *               customerId:
 *                 type: string
 *               rejectionReason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Approval processed successfully
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
 *         description: Bad request
 *       404:
 *         description: Offline request not found
 *       500:
 *         description: Server error
 */
router.put('/:id/approve', async (req, res: Response) => {
  try {
    const { id } = req.params;
    const { approved, rejectionReason, customerId } = req.body;

    if (!customerId || typeof customerId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'customerId is required',
      });
    }

    if (typeof approved !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'approved must be a boolean',
      });
    }

    const offlineRequest = await prisma.offlineChangeRequest.findUnique({
      where: { id },
    });

    if (!offlineRequest) {
      return res.status(404).json({
        success: false,
        error: 'Offline request not found',
      });
    }

    if (offlineRequest.status !== 'pricing_submitted') {
      return res.status(400).json({
        success: false,
        error: 'Request is not in pricing_submitted status',
      });
    }

    const finalStatus = approved ? 'payment_pending' : 'rejected';
    const updateData: any = {
      status: finalStatus,
      resolution: {
        ...(offlineRequest.resolution as any),
        customerApproval: {
          approved,
          approvalDate: new Date().toISOString(),
          rejectionReason: approved ? null : rejectionReason,
        },
      },
    };

    const updatedRequest = await prisma.offlineChangeRequest.update({
      where: { id },
      data: updateData,
    });

    // Create audit log
    await prisma.offlineRequestAuditLog.create({
      data: {
        offlineRequestId: id,
        action: approved ? 'approved' : 'rejected',
        actorId: customerId,
        actorType: 'customer',
        previousStatus: offlineRequest.status,
        newStatus: finalStatus,
        metadata: { approved },
      },
    });

    res.json({
      success: true,
      data: updatedRequest,
      message: approved ? 'Request approved and moved to payment_pending' : 'Request rejected',
    });
  } catch (error: any) {
    console.error('[OfflineRequests] Approval error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to process approval',
    });
  }
});

/**
 * @swagger
 * /api/offline-requests/{id}/payment:
 *   put:
 *     summary: Process payment for offline request
 *     tags: [Offline Requests]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The offline request ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [paymentId, amount, method]
 *             properties:
 *               paymentId:
 *                 type: string
 *               amount:
 *                 type: number
 *               method:
 *                 type: string
 *               transactionRef:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment processed successfully
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
 *         description: Bad request
 *       404:
 *         description: Offline request not found
 *       500:
 *         description: Server error
 */
router.put('/:id/payment', async (req, res: Response) => {
  try {
    const { id } = req.params;
    const { paymentId, amount, method, transactionRef } = req.body;

    const parsedAmount = Number(amount);
    if (!paymentId || !method || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'paymentId, method, and positive numeric amount are required',
      });
    }

    const offlineRequest = await prisma.offlineChangeRequest.findUnique({
      where: { id },
    });

    if (!offlineRequest) {
      return res.status(404).json({
        success: false,
        error: 'Offline request not found',
      });
    }

    if (offlineRequest.status !== 'payment_pending') {
      return res.status(400).json({
        success: false,
        error: 'Request is not in payment_pending status',
      });
    }

    const updatedRequest = await prisma.offlineChangeRequest.update({
      where: { id },
      data: {
        resolution: {
          ...(offlineRequest.resolution as any),
          payment: {
            paymentId,
            amount: parsedAmount,
            method,
            transactionRef,
            status: 'completed',
            paidAt: new Date().toISOString(),
          },
        },
        status: 'completed',
      },
    });

    // Create audit log
    await prisma.offlineRequestAuditLog.create({
      data: {
        offlineRequestId: id,
        action: 'payment_processed',
        actorId: 'system',
        actorType: 'system',
        previousStatus: offlineRequest.status,
        newStatus: 'completed',
        metadata: { paymentId, amount: parsedAmount, method, transactionRef },
      },
    });

    res.json({
      success: true,
      data: updatedRequest,
      message: 'Payment processed successfully',
    });
  } catch (error: any) {
    console.error('[OfflineRequests] Payment error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to process payment',
    });
  }
});

/**
 * @swagger
 * /api/offline-requests/{id}/documents:
 *   put:
 *     summary: Issue documents for offline request
 *     tags: [Offline Requests]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The offline request ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ticketNumbers:
 *                 type: array
 *                 items:
 *                   type: string
 *               voucherNumbers:
 *                 type: array
 *                 items:
 *                   type: string
 *               invoiceId:
 *                 type: string
 *               documentUrls:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Documents issued successfully
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
 *         description: Offline request not found
 *       500:
 *         description: Server error
 */
router.put('/:id/documents', async (req, res: Response) => {
  try {
    const { id } = req.params;
    const { ticketNumbers, voucherNumbers, invoiceId, documentUrls } = req.body;

    const offlineRequest = await prisma.offlineChangeRequest.findUnique({
      where: { id },
    });

    if (!offlineRequest) {
      return res.status(404).json({
        success: false,
        error: 'Offline request not found',
      });
    }

    const updatedRequest = await prisma.offlineChangeRequest.update({
      where: { id },
      data: {
        resolution: {
          ...(offlineRequest.resolution as any),
          reissuedDocuments: {
            ticketNumbers,
            voucherNumbers,
            invoiceId,
            documentUrls,
            issuedAt: new Date().toISOString(),
          },
        },
      },
    });

    // Create audit log
    await prisma.offlineRequestAuditLog.create({
      data: {
        offlineRequestId: id,
        action: 'documents_issued',
        actorId: 'system',
        actorType: 'system',
        metadata: { ticketNumbers, voucherNumbers, invoiceId },
      },
    });

    res.json({
      success: true,
      data: updatedRequest,
      message: 'Documents issued successfully',
    });
  } catch (error: any) {
    console.error('[OfflineRequests] Documents error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to issue documents',
    });
  }
});

/**
 * @swagger
 * /api/offline-requests/{id}/audit:
 *   get:
 *     summary: Get audit log for offline request
 *     tags: [Offline Requests]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The offline request ID
 *     responses:
 *       200:
 *         description: Audit log entries
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
 *       500:
 *         description: Server error
 */
router.get('/:id/audit', async (req, res: Response) => {
  try {
    const { id } = req.params;

    const auditLog = await prisma.offlineRequestAuditLog.findMany({
      where: { offlineRequestId: id },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: auditLog,
    });
  } catch (error: any) {
    console.error('[OfflineRequests] Audit log error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to get audit log',
    });
  }
});

export default router;
