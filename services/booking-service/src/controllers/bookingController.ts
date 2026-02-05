import { Request, Response, NextFunction } from 'express';
import bookingService from '../services/bookingService.js';
import { BookingData, BookingResponse, SearchParams, UserBookingStats } from '../types/index.js';

// Create a new booking
const createBooking = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bookingData = req.body;
    const userId = req.user?.id || req.body.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required',
      });
    }

    const booking = await bookingService.createBooking(bookingData, userId);

    res.status(201).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

// Get booking by ID
const getBooking = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : (req.params.id as string);
    const booking = await bookingService.getBookingById(id);

    res.json({
      success: true,
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

// Cancel booking
const cancelBooking = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : (req.params.id as string);
    const { reason } = req.body;
    const userId = req.user?.id || req.body.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required',
      });
    }

    const booking = await bookingService.cancelBooking(id, reason, userId);

    res.json({
      success: true,
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

// Search bookings
const searchBookings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const searchParams = req.query;
    const userId = req.user?.id || (Array.isArray(req.query.userId) ? req.query.userId[0] : String(req.query.userId));

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required for searching bookings',
      });
    }

    const result = await bookingService.searchBookings(searchParams as any, String(userId));

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Get user bookings
const getUserBookings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : (req.params.userId as string);
    const status = Array.isArray(req.query.status) ? req.query.status[0] : String(req.query.status || '');
    const type = Array.isArray(req.query.type) ? req.query.type[0] : String(req.query.type || '');

    const bookings = await bookingService.getUserBookings(userId, String(status), String(type));

    res.json({
      success: true,
      data: bookings,
    });
  } catch (error) {
    next(error);
  }
};

// Get user booking stats
const getUserBookingStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : (req.params.userId as string);

    const stats = await bookingService.getUserBookingStats(userId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

// Hold booking
const holdBooking = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type } = req.params;
    const bookingData = { ...req.body, type };
    const userId = req.user?.id || req.body.userId || 'guest';
    const booking = await bookingService.holdBooking(bookingData, userId);
    res.status(201).json({
      success: true,
      bookingId: booking.id,
      id: booking.id,
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

// Confirm booking
const confirmBooking = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { bookingId, paymentDetails } = req.body;
    if (!bookingId) {
      return res.status(400).json({ success: false, error: 'bookingId is required' });
    }
    const booking = await bookingService.confirmBooking(String(bookingId), paymentDetails);
    res.json({ success: true, status: 'confirmed', data: booking });
  } catch (error) {
    next(error);
  }
};

// List bookings
const listBookings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const scopeParam: string = Array.isArray(req.query.scope)
      ? String(req.query.scope[0])
      : (typeof req.query.scope === 'string' ? req.query.scope : 'all');
    const userIdParam: string = Array.isArray(req.query.userId)
      ? String(req.query.userId[0])
      : (typeof req.query.userId === 'string' ? req.query.userId : '');
    const userId: string | undefined = typeof req.user?.id === 'string' ? req.user.id : (userIdParam || undefined);
    const bookings = await bookingService.listBookings(scopeParam, userId);
    res.json({ bookings });
  } catch (error) {
    next(error);
  }
};

export {
  createBooking,
  getBooking,
  cancelBooking,
  searchBookings,
  getUserBookings,
  getUserBookingStats,
  holdBooking,
  confirmBooking,
  listBookings,
};