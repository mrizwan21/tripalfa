import { Request, Response, NextFunction } from "express";
import enhancedBookingService from "../services/enhancedBookingService";
import {
  CreateBookingRequest,
  SearchBookingRequest,
} from "../types/enhancedBooking";

// Create B2B/B2C booking
const createBooking = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const bookingData: CreateBookingRequest = req.body;
    const userId = req.user?.id || req.body.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "User ID is required",
      });
    }

    const booking = await enhancedBookingService.createBooking({
      ...bookingData,
      customerId: userId,
    });

    res.status(201).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

// Import booking from GDS
const importFromGDS = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { gdsType, pnr, supplierRef } = req.body;

    if (!gdsType || !pnr) {
      return res.status(400).json({
        success: false,
        error: "GDS type and PNR are required",
      });
    }

    const booking = await enhancedBookingService.importFromGDS(
      gdsType,
      pnr,
      supplierRef,
    );

    res.status(201).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

// Search bookings with advanced filtering
const searchBookings = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const searchParams: SearchBookingRequest = req.query;
    const userId = req.user?.id || req.query.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "User ID is required for searching bookings",
      });
    }

    const result = await enhancedBookingService.searchBookings({
      ...searchParams,
      customerId: userId,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Process booking queues
const processQueue = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { queueType, bookingId, action } = req.params;
    const bookingIdStr = String(bookingId);
    const { reason } = req.body;
    const userId = req.user?.id || req.body.userId;

    if (!queueType || !bookingId || !action) {
      return res.status(400).json({
        success: false,
        error: "Queue type, booking ID, and action are required",
      });
    }

    const booking = await enhancedBookingService.processQueue(
      String(queueType),
      String(bookingId),
      String(action),
      reason,
    );

    res.json({
      success: true,
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

// Process payments
const processPayment = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { bookingId } = req.params;
    const bookingIdStr = String(bookingId);
    const { amount, paymentMethod } = req.body;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        error: "Booking ID is required",
      });
    }

    const booking = await enhancedBookingService.processPayment(
      bookingIdStr,
      amount,
      paymentMethod,
    );

    res.json({
      success: true,
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

// Process refunds
const processRefund = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { bookingId } = req.params;
    const bookingIdStr = String(bookingId);
    const { refundType, reason, amount } = req.body;

    if (!bookingId || !refundType || !reason) {
      return res.status(400).json({
        success: false,
        error: "Booking ID, refund type, and reason are required",
      });
    }

    const booking = await enhancedBookingService.processRefund(
      bookingIdStr,
      refundType,
      reason,
      amount,
    );

    res.json({
      success: true,
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

// Process amendments
const processAmendment = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { bookingId } = req.params;
    const bookingIdStr = String(bookingId);
    const { changes, reason } = req.body;

    if (!bookingId || !changes || !reason) {
      return res.status(400).json({
        success: false,
        error: "Booking ID, changes, and reason are required",
      });
    }

    const booking = await enhancedBookingService.processAmendment(
      bookingIdStr,
      changes,
      reason,
    );

    res.json({
      success: true,
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

// Issue ticket/voucher for hold booking
const issueTicket = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { bookingId } = req.params;
    const bookingIdStr = String(bookingId);
    const ticketDetails = req.body;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        error: "Booking ID is required",
      });
    }

    const booking = await enhancedBookingService.issueTicket(
      bookingIdStr,
      ticketDetails,
    );

    res.json({
      success: true,
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

// Get booking history
const getBookingHistory = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { bookingId } = req.params;
    const bookingIdStr = String(bookingId);

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        error: "Booking ID is required",
      });
    }

    const history =
      await enhancedBookingService.getBookingHistory(bookingIdStr);

    res.json({
      success: true,
      data: history,
    });
  } catch (error) {
    next(error);
  }
};

// Get booking documents
const getBookingDocuments = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { bookingId } = req.params;
    const bookingIdStr = String(bookingId);

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        error: "Booking ID is required",
      });
    }

    const documents =
      await enhancedBookingService.getBookingDocuments(bookingIdStr);

    res.json({
      success: true,
      data: documents,
    });
  } catch (error) {
    next(error);
  }
};

// Send document to customer
const sendDocument = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { documentId } = req.params;
    const documentIdStr = Array.isArray(documentId)
      ? documentId[0]
      : (documentId as string);
    const { email } = req.body;

    if (!documentId || !email) {
      return res.status(400).json({
        success: false,
        error: "Document ID and email are required",
      });
    }

    const result = await enhancedBookingService.sendDocument(
      documentIdStr,
      email,
    );

    res.json({
      success: true,
      data: { sent: result },
    });
  } catch (error) {
    next(error);
  }
};

// Download document
const downloadDocument = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { documentId } = req.params;
    const documentIdStr = Array.isArray(documentId)
      ? documentId[0]
      : (documentId as string);

    if (!documentId) {
      return res.status(400).json({
        success: false,
        error: "Document ID is required",
      });
    }

    const documentBuffer =
      await enhancedBookingService.downloadDocument(documentIdStr);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=document_${documentId}.pdf`,
    );
    res.send(documentBuffer);
  } catch (error) {
    next(error);
  }
};

export {
  createBooking,
  importFromGDS,
  searchBookings,
  processQueue,
  processPayment,
  processRefund,
  processAmendment,
  issueTicket,
  getBookingHistory,
  getBookingDocuments,
  sendDocument,
  downloadDocument,
};
