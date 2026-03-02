import { Router, Response } from "express";
import prisma from "../database.js";

const router: Router = Router();

// POST /api/offline-requests - Create offline request
router.post("/", async (req, res: Response) => {
  try {
    const {
      bookingId,
      bookingRef,
      requestType,
      originalDetails,
      requestedChanges,
      priority = "medium",
    } = req.body;

    if (!bookingId || !bookingRef || !requestType) {
      return res.status(400).json({
        success: false,
        error: "Booking ID, booking reference, and request type are required",
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
        submittedBy: req.body.customerId || "customer",
        requestDetails: {
          originalDetails: originalDetails || {},
          requestedChanges: requestedChanges || {},
          timeline: {
            requestedAt: new Date().toISOString(),
          },
        },
        status: "pending_staff",
      },
    });

    // Create audit log
    await prisma.offlineRequestAuditLog.create({
      data: {
        offlineRequestId: offlineRequest.id,
        action: "created",
        actorId: req.body.customerId || "customer",
        actorType: "customer",
        newStatus: offlineRequest.status,
        metadata: offlineRequest,
      },
    });

    res.status(201).json({
      success: true,
      data: offlineRequest,
      message: "Offline request created successfully",
    });
  } catch (error: any) {
    console.error("[OfflineRequests] Create error:", error.message);
    res.status(500).json({
      success: false,
      error: "Failed to create offline request",
    });
  }
});

// GET /api/offline-requests - List offline requests
router.get("/", async (req, res: Response) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      requestType,
      priority,
      search,
    } = req.query;

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
        { requestRef: { contains: search.toString(), mode: "insensitive" } },
        { bookingRef: { contains: search.toString(), mode: "insensitive" } },
      ];
    }

    const [requests, total] = await Promise.all([
      prisma.offlineChangeRequest.findMany({
        where,
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: { createdAt: "desc" },
        include: {
          auditLogs: {
            take: 5,
            orderBy: { createdAt: "desc" },
          },
        },
      }),
      prisma.offlineChangeRequest.count({ where }),
    ]);

    res.json({
      success: true,
      data: requests,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    console.error("[OfflineRequests] List error:", error.message);
    res.status(500).json({
      success: false,
      error: "Failed to list offline requests",
    });
  }
});

// GET /api/offline-requests/:id - Get offline request details
router.get("/:id", async (req, res: Response) => {
  try {
    const { id } = req.params;

    const offlineRequest = await prisma.offlineChangeRequest.findUnique({
      where: { id },
      include: {
        auditLogs: {
          orderBy: { createdAt: "desc" },
        },
        notifications: {
          take: 10,
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!offlineRequest) {
      return res.status(404).json({
        success: false,
        error: "Offline request not found",
      });
    }

    res.json({
      success: true,
      data: offlineRequest,
    });
  } catch (error: any) {
    console.error("[OfflineRequests] Get error:", error.message);
    res.status(500).json({
      success: false,
      error: "Failed to get offline request",
    });
  }
});

// PUT /api/offline-requests/:id/pricing - Submit pricing (staff action)
router.put("/:id/pricing", async (req, res: Response) => {
  try {
    const { id } = req.params;
    const { staffPricing, priceDifference, staffNotes, staffId } = req.body;

    const offlineRequest = await prisma.offlineChangeRequest.findUnique({
      where: { id },
    });

    if (!offlineRequest) {
      return res.status(404).json({
        success: false,
        error: "Offline request not found",
      });
    }

    if (offlineRequest.status !== "pending_staff") {
      return res.status(400).json({
        success: false,
        error: "Request is not in pending_staff status",
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
        status: "pricing_submitted",
        notes: staffNotes,
      },
    });

    // Create audit log
    await prisma.offlineRequestAuditLog.create({
      data: {
        offlineRequestId: id,
        action: "pricing_submitted",
        actorId: staffId,
        actorType: "staff",
        previousStatus: offlineRequest.status,
        newStatus: "pricing_submitted",
        notes: staffNotes,
        metadata: { staffPricing, priceDifference },
      },
    });

    // Create notification queue entry
    const requestDetails = (offlineRequest.requestDetails as any) || {};
    await prisma.offlineRequestNotificationQueue.create({
      data: {
        offlineRequestId: id,
        status: "pending",
        notificationType: "offline_request_priced",
        recipientId: requestDetails?.customerId || "customer",
        payload: {
          requestRef: offlineRequest.requestRef,
          priceDifference,
        },
      },
    });

    res.json({
      success: true,
      data: updatedRequest,
      message: "Pricing submitted successfully",
    });
  } catch (error: any) {
    console.error("[OfflineRequests] Pricing error:", error.message);
    res.status(500).json({
      success: false,
      error: "Failed to submit pricing",
    });
  }
});

// PUT /api/offline-requests/:id/approve - Customer approval
router.put("/:id/approve", async (req, res: Response) => {
  try {
    const { id } = req.params;
    const { approved, rejectionReason, customerId } = req.body;

    const offlineRequest = await prisma.offlineChangeRequest.findUnique({
      where: { id },
    });

    if (!offlineRequest) {
      return res.status(404).json({
        success: false,
        error: "Offline request not found",
      });
    }

    if (offlineRequest.status !== "pricing_submitted") {
      return res.status(400).json({
        success: false,
        error: "Request is not in pricing_submitted status",
      });
    }

    const newStatus = approved ? "approved" : "rejected";
    const updateData: any = {
      status: newStatus,
      resolution: {
        ...(offlineRequest.resolution as any),
        customerApproval: {
          approved,
          approvalDate: new Date().toISOString(),
          rejectionReason: approved ? null : rejectionReason,
        },
      },
    };

    if (approved) {
      updateData.status = "payment_pending";
    }

    const updatedRequest = await prisma.offlineChangeRequest.update({
      where: { id },
      data: updateData,
    });

    // Create audit log
    await prisma.offlineRequestAuditLog.create({
      data: {
        offlineRequestId: id,
        action: approved ? "approved" : "rejected",
        actorId: customerId,
        actorType: "customer",
        previousStatus: offlineRequest.status,
        newStatus,
        metadata: { approved },
      },
    });

    res.json({
      success: true,
      data: updatedRequest,
      message: approved ? "Request approved successfully" : "Request rejected",
    });
  } catch (error: any) {
    console.error("[OfflineRequests] Approval error:", error.message);
    res.status(500).json({
      success: false,
      error: "Failed to process approval",
    });
  }
});

// PUT /api/offline-requests/:id/payment - Process payment
router.put("/:id/payment", async (req, res: Response) => {
  try {
    const { id } = req.params;
    const { paymentId, amount, method, transactionRef } = req.body;

    const offlineRequest = await prisma.offlineChangeRequest.findUnique({
      where: { id },
    });

    if (!offlineRequest) {
      return res.status(404).json({
        success: false,
        error: "Offline request not found",
      });
    }

    if (offlineRequest.status !== "payment_pending") {
      return res.status(400).json({
        success: false,
        error: "Request is not in payment_pending status",
      });
    }

    const updatedRequest = await prisma.offlineChangeRequest.update({
      where: { id },
      data: {
        resolution: {
          ...(offlineRequest.resolution as any),
          payment: {
            paymentId,
            amount,
            method,
            transactionRef,
            status: "completed",
            paidAt: new Date().toISOString(),
          },
        },
        status: "completed",
      },
    });

    // Create audit log
    await prisma.offlineRequestAuditLog.create({
      data: {
        offlineRequestId: id,
        action: "payment_processed",
        actorId: "system",
        actorType: "system",
        previousStatus: offlineRequest.status,
        newStatus: "completed",
        metadata: { paymentId, amount, method, transactionRef },
      },
    });

    res.json({
      success: true,
      data: updatedRequest,
      message: "Payment processed successfully",
    });
  } catch (error: any) {
    console.error("[OfflineRequests] Payment error:", error.message);
    res.status(500).json({
      success: false,
      error: "Failed to process payment",
    });
  }
});

// PUT /api/offline-requests/:id/documents - Issue documents
router.put("/:id/documents", async (req, res: Response) => {
  try {
    const { id } = req.params;
    const { ticketNumbers, voucherNumbers, invoiceId, documentUrls } = req.body;

    const offlineRequest = await prisma.offlineChangeRequest.findUnique({
      where: { id },
    });

    if (!offlineRequest) {
      return res.status(404).json({
        success: false,
        error: "Offline request not found",
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
        action: "documents_issued",
        actorId: "system",
        actorType: "system",
        metadata: { ticketNumbers, voucherNumbers, invoiceId },
      },
    });

    res.json({
      success: true,
      data: updatedRequest,
      message: "Documents issued successfully",
    });
  } catch (error: any) {
    console.error("[OfflineRequests] Documents error:", error.message);
    res.status(500).json({
      success: false,
      error: "Failed to issue documents",
    });
  }
});

// GET /api/offline-requests/:id/audit - Get audit log
router.get("/:id/audit", async (req, res: Response) => {
  try {
    const { id } = req.params;

    const auditLog = await prisma.offlineRequestAuditLog.findMany({
      where: { offlineRequestId: id },
      orderBy: { createdAt: "desc" },
    });

    res.json({
      success: true,
      data: auditLog,
    });
  } catch (error: any) {
    console.error("[OfflineRequests] Audit log error:", error.message);
    res.status(500).json({
      success: false,
      error: "Failed to get audit log",
    });
  }
});

export default router;
