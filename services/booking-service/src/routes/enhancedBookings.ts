import express, { Router } from 'express';
import authenticateToken from '../middleware/authenticateToken';
import authorize from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { bookingManagementSchemas } from '../validation/bookingManagementSchemas';
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
} from '../controllers/enhancedBookingController';
import { permissionMiddleware } from '../middleware/permissionMiddleware';

const router: Router = Router();

// GET /api/bookings - Get all bookings with filters and pagination
router.get(
  '/',
  authenticateToken,
  authorize(['user', 'admin', 'agent', 'supervisor', 'manager']),
  permissionMiddleware('view_bookings'),
  validate(bookingManagementSchemas.searchBookings),
  searchBookings
);

// GET /api/bookings/:bookingId - Get single booking by ID
router.get(
  '/:bookingId',
  authenticateToken,
  authorize(['user', 'admin', 'agent', 'supervisor', 'manager']),
  permissionMiddleware('view_bookings'),
  validate(bookingManagementSchemas.searchBookings),
  searchBookings
);

// POST /api/bookings - Create a new booking
router.post(
  '/',
  authenticateToken,
  authorize(['user', 'admin', 'agent', 'supervisor', 'manager']),
  permissionMiddleware('create_booking'),
  validate(bookingManagementSchemas.createBooking),
  createBooking
);

// PUT /api/bookings/:bookingId - Update a booking
router.put(
  '/:bookingId',
  authenticateToken,
  authorize(['user', 'admin', 'agent', 'supervisor', 'manager']),
  permissionMiddleware('update_booking'),
  validate(bookingManagementSchemas.createBooking),
  createBooking
);

// DELETE /api/bookings/:bookingId - Cancel a booking
router.delete(
  '/:bookingId',
  authenticateToken,
  authorize(['user', 'admin', 'agent', 'supervisor', 'manager']),
  permissionMiddleware('cancel_booking'),
  validate(bookingManagementSchemas.createBooking),
  createBooking
);

// POST /api/bookings/:bookingId/hold - Hold inventory for a booking
// Note: Skip if bookingId is 'hotel' or 'flight' to avoid conflict with holdOrdersRoutes
router.post(
  '/:bookingId/hold',
  (req, res, next) => {
    // Skip this route for /hotel/hold and /flight/hold to prevent route collision
    if (req.params.bookingId === 'hotel' || req.params.bookingId === 'flight') {
      return next('route');
    }
    next();
  },
  authenticateToken,
  authorize(['user', 'admin', 'agent', 'supervisor', 'manager']),
  permissionMiddleware('hold_inventory'),
  validate(bookingManagementSchemas.holdInventory),
  processQueue
);

// POST /api/bookings/:bookingId/confirm - Confirm a booking
router.post(
  '/:bookingId/confirm',
  authenticateToken,
  authorize(['user', 'admin', 'agent', 'supervisor', 'manager']),
  permissionMiddleware('confirm_booking'),
  validate(bookingManagementSchemas.confirmBooking),
  processQueue
);

// POST /api/bookings/:bookingId/issue-ticket - Issue ticket for a booking
router.post(
  '/:bookingId/issue-ticket',
  authenticateToken,
  authorize(['user', 'admin', 'agent', 'supervisor', 'manager']),
  permissionMiddleware('issue_ticket'),
  validate(bookingManagementSchemas.issueTicket),
  issueTicket
);

// POST /api/bookings/:bookingId/purchase - Purchase a booking
router.post(
  '/:bookingId/purchase',
  authenticateToken,
  authorize(['user', 'admin', 'agent', 'supervisor', 'manager']),
  permissionMiddleware('purchase_booking'),
  validate(bookingManagementSchemas.createBooking),
  createBooking
);

// POST /api/bookings/:bookingId/payment - Process payment for a booking
router.post(
  '/:bookingId/payment',
  authenticateToken,
  authorize(['user', 'admin', 'agent', 'supervisor', 'manager']),
  permissionMiddleware('process_payment'),
  validate(bookingManagementSchemas.createBooking),
  processPayment
);

// GET /api/bookings/:bookingId/documents - Get booking documents
router.get(
  '/:bookingId/documents',
  authenticateToken,
  authorize(['user', 'admin', 'agent', 'supervisor', 'manager']),
  permissionMiddleware('view_documents'),
  validate(bookingManagementSchemas.searchBookings),
  getBookingDocuments
);

// POST /api/bookings/:bookingId/documents - Generate booking documents
router.post(
  '/:bookingId/documents',
  authenticateToken,
  authorize(['user', 'admin', 'agent', 'supervisor', 'manager']),
  permissionMiddleware('generate_documents'),
  validate(bookingManagementSchemas.createBooking),
  createBooking
);

// GET /api/bookings/:bookingId/notifications - Get booking notifications
router.get(
  '/:bookingId/notifications',
  authenticateToken,
  authorize(['user', 'admin', 'agent', 'supervisor', 'manager']),
  permissionMiddleware('view_notifications'),
  validate(bookingManagementSchemas.searchBookings),
  getBookingDocuments
);

// POST /api/bookings/:bookingId/notifications - Send booking notification
router.post(
  '/:bookingId/notifications',
  authenticateToken,
  authorize(['user', 'admin', 'agent', 'supervisor', 'manager']),
  permissionMiddleware('send_notification'),
  validate(bookingManagementSchemas.createBooking),
  createBooking
);

// GET /api/bookings/:bookingId/history - Get booking history
router.get(
  '/:bookingId/history',
  authenticateToken,
  authorize(['user', 'admin', 'agent', 'supervisor', 'manager']),
  permissionMiddleware('view_history'),
  validate(bookingManagementSchemas.searchBookings),
  getBookingHistory
);

// POST /api/bookings/:bookingId/comments - Add comment to booking
router.post(
  '/:bookingId/comments',
  authenticateToken,
  authorize(['user', 'admin', 'agent', 'supervisor', 'manager']),
  permissionMiddleware('add_comment'),
  validate(bookingManagementSchemas.createBooking),
  createBooking
);

// GET /api/bookings/:bookingId/comments - Get booking comments
router.get(
  '/:bookingId/comments',
  authenticateToken,
  authorize(['user', 'admin', 'agent', 'supervisor', 'manager']),
  permissionMiddleware('view_comments'),
  validate(bookingManagementSchemas.searchBookings),
  getBookingHistory
);

// PUT /api/bookings/:bookingId/comments/:commentId - Update comment
router.put(
  '/:bookingId/comments/:commentId',
  authenticateToken,
  authorize(['user', 'admin', 'agent', 'supervisor', 'manager']),
  permissionMiddleware('update_comment'),
  validate(bookingManagementSchemas.createBooking),
  createBooking
);

// DELETE /api/bookings/:bookingId/comments/:commentId - Delete comment
router.delete(
  '/:bookingId/comments/:commentId',
  authenticateToken,
  authorize(['user', 'admin', 'agent', 'supervisor', 'manager']),
  permissionMiddleware('delete_comment'),
  validate(bookingManagementSchemas.createBooking),
  createBooking
);

// GET /api/bookings/:bookingId/attachments - Get booking attachments
router.get(
  '/:bookingId/attachments',
  authenticateToken,
  authorize(['user', 'admin', 'agent', 'supervisor', 'manager']),
  permissionMiddleware('view_attachments'),
  validate(bookingManagementSchemas.searchBookings),
  getBookingDocuments
);

// POST /api/bookings/:bookingId/attachments - Upload attachment
router.post(
  '/:bookingId/attachments',
  authenticateToken,
  authorize(['user', 'admin', 'agent', 'supervisor', 'manager']),
  permissionMiddleware('upload_attachment'),
  validate(bookingManagementSchemas.createBooking),
  createBooking
);

// DELETE /api/bookings/:bookingId/attachments/:attachmentId - Delete attachment
router.delete(
  '/:bookingId/attachments/:attachmentId',
  authenticateToken,
  authorize(['user', 'admin', 'agent', 'supervisor', 'manager']),
  permissionMiddleware('delete_attachment'),
  validate(bookingManagementSchemas.createBooking),
  createBooking
);

// GET /api/bookings/:bookingId/metrics - Get booking metrics
router.get(
  '/:bookingId/metrics',
  authenticateToken,
  authorize(['user', 'admin', 'agent', 'supervisor', 'manager']),
  permissionMiddleware('view_metrics'),
  validate(bookingManagementSchemas.searchBookings),
  getBookingHistory
);

// POST /api/bookings/:bookingId/metrics - Update booking metrics
router.post(
  '/:bookingId/metrics',
  authenticateToken,
  authorize(['user', 'admin', 'agent', 'supervisor', 'manager']),
  permissionMiddleware('update_metrics'),
  validate(bookingManagementSchemas.createBooking),
  createBooking
);

// --- LiteAPI Specific Real-time Endpoints ---

// POST /api/bookings/rates/prebook
router.post(
  '/rates/prebook',
  authenticateToken,
  async (req, res) => {
    try {
      const liteApiClient = (await import('../services/LiteAPIClient')).default;
      const result = await liteApiClient.prebook(req.body);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// POST /api/bookings/rates/book
router.post(
  '/rates/book',
  authenticateToken,
  async (req, res) => {
    try {
      const liteApiClient = (await import('../services/LiteAPIClient')).default;
      const result = await liteApiClient.book(req.body);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

export default router;