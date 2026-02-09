/**
 * Combined Payment Routes
 * 
 * Routes for processing combined payments (wallet + airline credits + card)
 * All endpoints are routed through the API manager for centralized routing and management
 * 
 * Base URL: /api/bookings/payment (routed through API manager)
 */

import { Router, Request, Response } from 'express';
import type { Router as ExpressRouter } from 'express';
import authenticateToken from '../middleware/authenticateToken';
import authorize from '../middleware/authorize';
import { permissionMiddleware } from '../middleware/permissionMiddleware';
import { validate } from '../middleware/validate';
import { boundBookingManagementController } from '../controllers/bookingManagementController';
import { bookingManagementSchemas } from '../validation/bookingManagementSchemas';
import logger from '../utils/logger';

const router: ExpressRouter = Router();

/**
 * POST /api/bookings/{customerId}/payment-options
 * @description Get available payment options for a customer
 * @middleware authenticateToken, authorize, permissionMiddleware
 * @param customerId - UUID of the customer
 * @query totalAmount - Total amount to be paid (required)
 * @query currency - Currency code (optional, default: USD)
 * @returns Available payment options including wallet balance, airline credits, and recommended breakdown
 * 
 * @example
 * POST /api/bookings/45e3a860-1234-5678-9abc-def012345678/payment-options?totalAmount=1000&currency=USD
 * Headers: Authorization: Bearer <token>
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "walletBalance": 500,
 *     "availableCredits": [...],
 *     "totalCreditAvailable": 300,
 *     "maxPaymentFromAssets": 800,
 *     "cardRequired": 200,
 *     "recommendedPaymentBreakdown": {...}
 *   }
 * }
 */
router.get(
  '/:customerId/payment-options',
  authenticateToken,
  authorize(['customer', 'agent', 'admin']),
  permissionMiddleware('view_bookings'),
  validate(bookingManagementSchemas.getPaymentOptions),
  async (req: Request, res: Response) => {
    try {
      logger.info('GET /payment-options requested', {
        customerId: req.params.customerId,
        query: req.query
      });
      await boundBookingManagementController.getPaymentOptions(req, res);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error in payment-options endpoint', { error: errorMsg });
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
);

/**
 * POST /api/bookings/{bookingId}/pay
 * @description Process combined payment for a booking
 * @middleware authenticateToken, authorize, permissionMiddleware
 * @param bookingId - UUID of the booking
 * @body CombinedPaymentRequest - Payment details including wallet, credits, and card amounts
 * @returns Payment breakdown and confirmation
 * 
 * @example
 * POST /api/bookings/45e3a860-1234-5678-9abc-def012345678/pay
 * Headers: Authorization: Bearer <token>
 * Body:
 * {
 *   "customerId": "...",
 *   "totalAmount": 1000,
 *   "currency": "USD",
 *   "useWallet": true,
 *   "walletAmount": 500,
 *   "useCredits": true,
 *   "creditIds": ["credit-id-1", "credit-id-2"],
 *   "cardAmount": 200
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "totalAmount": 1000,
 *     "walletUsed": 500,
 *     "creditsUsed": 300,
 *     "cardRequired": 200,
 *     "creditsApplied": [...],
 *     "currency": "USD"
 *   },
 *   "message": "Combined payment processed successfully"
 * }
 */
router.post(
  '/:bookingId/pay',
  authenticateToken,
  authorize(['customer', 'agent', 'admin']),
  permissionMiddleware('manage_bookings'),
  validate(bookingManagementSchemas.combinedPayment),
  async (req: Request, res: Response) => {
    try {
      logger.info('POST /pay requested', {
        bookingId: req.params.bookingId,
        customerId: req.body.customerId,
        totalAmount: req.body.totalAmount
      });
      await boundBookingManagementController.processCombinedPayment(req, res);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error in pay endpoint', { error: errorMsg });
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
);

/**
 * GET /api/bookings/{bookingId}/payment-details
 * @description Get payment details for a booking
 * @middleware authenticateToken, authorize, permissionMiddleware
 * @param bookingId - UUID of the booking
 * @returns Complete payment breakdown with wallet, credits, and card information
 * 
 * @example
 * GET /api/bookings/45e3a860-1234-5678-9abc-def012345678/payment-details
 * Headers: Authorization: Bearer <token>
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "bookingId": "...",
 *     "reference": "BK123456",
 *     "totalAmount": 1000,
 *     "walletUsed": 500,
 *     "creditsUsed": 300,
 *     "cardUsed": 200,
 *     "appliedCredits": [...],
 *     "currency": "USD",
 *     "status": "CONFIRMED"
 *   }
 * }
 */
router.get(
  '/:bookingId/payment-details',
  authenticateToken,
  authorize(['customer', 'agent', 'admin']),
  permissionMiddleware('view_bookings'),
  async (req: Request, res: Response) => {
    try {
      logger.info('GET /payment-details requested', {
        bookingId: req.params.bookingId
      });
      await boundBookingManagementController.getBookingPaymentDetails(req, res);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error in payment-details endpoint', { error: errorMsg });
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
);

/**
 * POST /api/bookings/{bookingId}/refund
 * @description Refund combined payment for a booking
 * @middleware authenticateToken, authorize, permissionMiddleware
 * @param bookingId - UUID of the booking
 * @returns Refund confirmation
 * 
 * @example
 * POST /api/bookings/45e3a860-1234-5678-9abc-def012345678/refund
 * Headers: Authorization: Bearer <token>
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "Combined payment refunded successfully"
 * }
 */
router.post(
  '/:bookingId/refund',
  authenticateToken,
  authorize(['agent', 'admin']),
  permissionMiddleware('manage_bookings'),
  async (req: Request, res: Response) => {
    try {
      logger.info('POST /refund requested', {
        bookingId: req.params.bookingId,
        userId: req.headers['x-user-id'] || 'unknown'
      });
      await boundBookingManagementController.refundCombinedPayment(req, res);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error in refund endpoint', { error: errorMsg });
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
);

/**
 * POST /api/bookings/create-with-payment
 * @description Create booking with combined payment in one transaction
 * @middleware authenticateToken, authorize, permissionMiddleware
 * @body CreateBookingWithCombinedPaymentRequest - Booking and payment details
 * @returns Booking reference and payment confirmation
 * 
 * @example
 * POST /api/bookings/create-with-payment
 * Headers: Authorization: Bearer <token>
 * Body:
 * {
 *   "serviceType": "flight",
 *   "customerId": "...",
 *   "customerName": "John Doe",
 *   "customerEmail": "john@example.com",
 *   "customerPhone": "+1234567890",
 *   "totalAmount": 1000,
 *   "currency": "USD",
 *   "useWallet": true,
 *   "walletAmount": 500,
 *   "useCredits": true,
 *   "creditIds": ["..."],
 *   "cardAmount": 200
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "booking": {
 *       "id": "...",
 *       "reference": "BK123456",
 *       "status": "PENDING"
 *     },
 *     "payment": {...}
 *   },
 *   "message": "Booking created with combined payment"
 * }
 */
router.post(
  '/create-with-payment',
  authenticateToken,
  authorize(['customer', 'agent', 'admin']),
  permissionMiddleware('manage_bookings'),
  validate(bookingManagementSchemas.createBookingWithCombinedPayment),
  async (req: Request, res: Response) => {
    try {
      logger.info('POST /create-with-payment requested', {
        customerId: req.body.customerId,
        serviceType: req.body.serviceType,
        totalAmount: req.body.totalAmount
      });
      await boundBookingManagementController.createBookingWithCombinedPayment(req, res);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error in create-with-payment endpoint', { error: errorMsg });
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
);

/**
 * POST /api/bookings/{bookingId}/apply-credits
 * @description Apply airline credits to an existing booking
 * @middleware authenticateToken, authorize, permissionMiddleware
 * @param bookingId - UUID of the booking
 * @body ApplyCreditsRequest - Array of credit IDs to apply
 * @returns Payment breakdown after credit application
 * 
 * @example
 * POST /api/bookings/45e3a860-1234-5678-9abc-def012345678/apply-credits
 * Headers: Authorization: Bearer <token>
 * Body:
 * {
 *   "creditIds": ["credit-id-1", "credit-id-2"]
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "totalAmount": 1000,
 *     "creditsUsed": 300,
 *     "cardRequired": 700,
 *     "creditsApplied": [...]
 *   },
 *   "message": "Credits applied to booking successfully"
 * }
 */
router.post(
  '/:bookingId/apply-credits',
  authenticateToken,
  authorize(['customer', 'agent', 'admin']),
  permissionMiddleware('manage_bookings'),
  validate(bookingManagementSchemas.applyCreditsToBooking),
  async (req: Request, res: Response) => {
    try {
      logger.info('POST /apply-credits requested', {
        bookingId: req.params.bookingId,
        creditsCount: req.body.creditIds.length
      });
      await boundBookingManagementController.applyCreditsToBooking(req, res);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error in apply-credits endpoint', { error: errorMsg });
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
);

export default router;

/**
 * API Manager Integration Notes:
 * 
 * These routes should be registered with the API manager as:
 * - Base path: /api/bookings/payment
 * - Service: booking-service
 * 
 * Kong/API Manager Configuration Example:
 * These routes expose payment endpoints for combined wallet + credit + card payments
 * 
 * Endpoint Mapping (via API Manager):
 * - GET  payment-options
 * - POST pay endpoint
 * - GET  payment-details
 * - POST refund endpoint
 * - POST create-with-payment
 * - POST apply-credits
 * 
 * All endpoints require:
 * - Authentication: Bearer token
 * - Authorization: Appropriate roles and permissions
 * - Validation: Request body/query validation
 * - Rate limiting: Applied via API manager
 */
