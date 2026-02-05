import express, { Router } from 'express';
import {
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
  downloadDocument
} from '../controllers/enhancedBookingController.js';
import { holdBooking, confirmBooking, getBooking, listBookings } from '../controllers/bookingController.js';

const router = Router();

// Simple test route without middleware
router.get('/test', (req, res) => {
  res.json({ message: 'Enhanced bookings test route works' });
});

// Hotel booking routes
router.post('/:type/hold', holdBooking);
router.post('/:type/confirm', confirmBooking);

// Flight booking routes (if needed)
// router.post('/flight/hold', holdBooking);
// router.post('/flight/confirm', confirmBooking);

export default router;