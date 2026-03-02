import { Request, Response, NextFunction } from "express";
import { createLogger } from "@tripalfa/shared-utils/logger";
const logger = createLogger({ serviceName: "booking-engine" });
import offlineRequestService from "../services/offlineRequestService";
import {
  CreateOfflineRequestPayload,
  SubmitPricingPayload,
  OfflineRequestStatus,
  OfflineChangeRequest,
  OfflineRequestAuditLog,
} from "@tripalfa/shared-types";

/**
 * Helper to safely extract string parameters from request
 */
const getStringParam = (param: string | string[] | undefined): string => {
  if (Array.isArray(param)) {
    return param[0] || "";
  }
  return param || "";
};

/**
 * Create a new offline change request
 * POST /api/offline-requests
 */
export const createOfflineRequest = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const payload: CreateOfflineRequestPayload = req.body;
    const userId = (req as any).user?.id;

    // Validation
    if (!payload.bookingId || !payload.bookingRef) {
      res.status(400).json({
        error: "Missing required fields",
        message: "bookingId and bookingRef are required",
      });
      return;
    }

    const request = await offlineRequestService.createRequest(payload, userId);

    logger.info(`Offline request created: ${request.requestRef}`, {
      requestId: request.id,
      bookingId: payload.bookingId,
      userId,
    });

    res.status(201).json({
      success: true,
      data: request,
      message: `Offline request ${request.requestRef} created successfully`,
    });
  } catch (error) {
    logger.error("Error creating offline request", { error });
    next(error);
  }
};

/**
 * Get offline request by ID
 * GET /api/offline-requests/:id
 */
export const getOfflineRequest = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = getStringParam(req.params.id);
    const request = await offlineRequestService.getRequestById(id);

    if (!request) {
      res.status(404).json({
        error: "Not found",
        message: `Offline request ${id} not found`,
      });
      return;
    }

    res.json({
      success: true,
      data: request,
    });
  } catch (error) {
    logger.error("Error retrieving offline request", { error });
    next(error);
  }
};

/**
 * Get offline request by reference
 * GET /api/offline-requests/ref/:requestRef
 */
export const getOfflineRequestByRef = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const requestRef = getStringParam(req.params.requestRef);
    const request = await offlineRequestService.getRequestByRef(requestRef);

    if (!request) {
      res.status(404).json({
        error: "Not found",
        message: `Offline request ${requestRef} not found`,
      });
      return;
    }

    res.json({
      success: true,
      data: request,
    });
  } catch (error) {
    logger.error("Error retrieving offline request by ref", { error });
    next(error);
  }
};

/**
 * Get customer's offline requests
 * GET /api/offline-requests/customer/my-requests
 */
export const getCustomerRequests = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { bookingId } = req.query;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    if (!bookingId) {
      res.status(400).json({
        error: "Missing required fields",
        message: "bookingId is required",
      });
      return;
    }

    const result = await offlineRequestService.getCustomerRequests(
      bookingId as string,
      limit,
      offset,
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error("Error retrieving customer requests", { error });
    next(error);
  }
};

/**
 * Get staff queue
 * GET /api/offline-requests/queue
 */
export const getStaffQueue = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const status =
      (req.query.status as OfflineRequestStatus) ||
      OfflineRequestStatus.PENDING_STAFF;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    const result = await offlineRequestService.getStaffQueue(
      status,
      limit,
      offset,
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error("Error retrieving staff queue", { error });
    next(error);
  }
};

/**
 * Get offline requests for a specific booking (staff view)
 * GET /api/offline-requests/booking/:bookingId
 */
export const getRequestsByBooking = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const bookingId = getStringParam(req.params.bookingId);

    if (!bookingId) {
      res.status(400).json({
        error: "Missing required fields",
        message: "bookingId is required",
      });
      return;
    }

    const requests =
      await offlineRequestService.getRequestsByBooking(bookingId);

    res.json({
      success: true,
      data: {
        items: requests,
        total: requests.length,
      },
    });
  } catch (error) {
    logger.error("Error retrieving requests by booking", { error });
    next(error);
  }
};

/**
 * Submit pricing for offline request
 * PUT /api/offline-requests/:id/pricing
 */
export const submitPricing = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = getStringParam(req.params.id);
    const payload: SubmitPricingPayload = req.body;
    const staffId = (req as any).user?.id;

    // Validation
    if (
      payload.newBaseFare === undefined ||
      payload.newTaxes === undefined ||
      payload.newMarkup === undefined ||
      payload.currency === undefined ||
      payload.newTotalPrice === undefined
    ) {
      res.status(400).json({
        error: "Missing required fields",
        message:
          "newBaseFare, newTaxes, newMarkup, currency, and newTotalPrice are required",
      });
      return;
    }

    const request = await offlineRequestService.submitPricing(
      id,
      payload,
      staffId,
    );

    logger.info(
      `Pricing submitted for offline request: ${request.requestRef}`,
      {
        requestId: id,
        staffId,
      },
    );

    res.json({
      success: true,
      data: request,
      message: "Pricing submitted successfully",
    });
  } catch (error) {
    logger.error("Error submitting pricing", { error });
    next(error);
  }
};

/**
 * Customer approves the pricing
 * PUT /api/offline-requests/:id/approve
 */
export const approveRequest = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = getStringParam(req.params.id);
    const { approved, rejectionReason } = req.body;
    const userId = (req as any).user?.id;

    // Validate required fields
    if (approved === undefined || approved === null) {
      res.status(400).json({
        error: "Missing required fields",
        message: "approved flag is required",
      });
      return;
    }

    // If rejecting, rejectionReason must be provided
    if (
      !approved &&
      (!rejectionReason || typeof rejectionReason !== "string")
    ) {
      res.status(400).json({
        error: "Missing required fields",
        message: "rejectionReason is required when rejecting (approved=false)",
      });
      return;
    }

    const request = await offlineRequestService.approveRequest(
      id,
      userId,
      approved,
      rejectionReason,
    );

    const action = approved ? "approved" : "rejected";
    logger.info(`Offline request ${action}: ${request.requestRef}`, {
      requestId: id,
      userId,
    });

    res.json({
      success: true,
      data: request,
      message: `Request ${action} successfully`,
    });
  } catch (error) {
    logger.error("Error approving/rejecting request", { error });
    next(error);
  }
};

/**
 * Record payment for approved request
 * POST /api/offline-requests/:id/payment
 */
export const recordPayment = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = getStringParam(req.params.id);
    const { paymentId, amount, method, transactionRef, paymentDetails } =
      req.body;

    // Validation
    if (!paymentId || !amount || !method) {
      res.status(400).json({
        error: "Missing required fields",
        message: "paymentId, amount, and method are required",
      });
      return;
    }

    if (typeof amount !== "number" || amount <= 0) {
      res.status(400).json({
        error: "Invalid payment amount",
        message: "amount must be a positive number",
      });
      return;
    }

    const request = await offlineRequestService.recordPayment(
      id,
      paymentId,
      amount,
      method,
      transactionRef,
      paymentDetails,
    );

    logger.info(
      `Payment processed for offline request: ${request.requestRef}`,
      {
        requestId: id,
        paymentId,
        amount,
        method,
      },
    );

    res.json({
      success: true,
      data: request,
      message: "Payment processed successfully",
    });
  } catch (error) {
    logger.error("Error processing payment", { error });
    next(error);
  }
};

/**
 * Complete offline request
 * PUT /api/offline-requests/:id/complete
 */
export const completeRequest = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = getStringParam(req.params.id);
    const { documentUrls = [] } = req.body;

    const request = await offlineRequestService.completeRequest(
      id,
      documentUrls,
    );

    logger.info(`Offline request completed: ${request.requestRef}`, {
      requestId: id,
    });

    res.json({
      success: true,
      data: request,
      message: "Request completed successfully",
    });
  } catch (error) {
    logger.error("Error completing request", { error });
    next(error);
  }
};

/**
 * Cancel offline request
 * PUT /api/offline-requests/:id/cancel
 */
export const cancelRequest = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = getStringParam(req.params.id);
    const { reason } = req.body;
    const userId = (req as any).user?.id;

    if (!reason) {
      res.status(400).json({
        error: "Missing required fields",
        message: "reason is required",
      });
      return;
    }

    const request = await offlineRequestService.cancelRequest(
      id,
      userId,
      reason,
    );

    logger.info(`Offline request cancelled: ${request.requestRef}`, {
      requestId: id,
      userId,
    });

    res.json({
      success: true,
      data: request,
      message: "Request cancelled successfully",
    });
  } catch (error) {
    logger.error("Error cancelling request", { error });
    next(error);
  }
};

/**
 * Add internal note to offline request
 * POST /api/offline-requests/:id/notes
 */
export const addInternalNote = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = getStringParam(req.params.id);
    const { note } = req.body;
    const staffId = (req as any).user?.id;

    if (!note) {
      res.status(400).json({
        error: "Missing required fields",
        message: "note is required",
      });
      return;
    }

    const request = await offlineRequestService.addInternalNote(
      id,
      note,
      staffId,
    );

    logger.info(
      `Internal note added to offline request: ${request.requestRef}`,
      {
        requestId: id,
        staffId,
      },
    );

    res.json({
      success: true,
      data: request,
      message: "Note added successfully",
    });
  } catch (error) {
    logger.error("Error adding internal note", { error });
    next(error);
  }
};

/**
 * Get audit log for offline request
 * GET /api/offline-requests/:id/audit
 */
export const getAuditLog = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = getStringParam(req.params.id);
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 500);
    const offset = parseInt(req.query.offset as string) || 0;

    const result = await offlineRequestService.getAuditLog(id, limit, offset);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error("Error retrieving audit log", { error });
    next(error);
  }
};
