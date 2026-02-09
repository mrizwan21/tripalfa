import { Router, Request, Response } from 'express';
import type { Router as ExpressRouter } from 'express';
import * as holdOrdersController from '../controllers/holdOrdersController';

const router: ExpressRouter = Router();

/**
 * Check Hold Eligibility
 * GET /bookings/hold/eligibility/:offerId
 * Check if an offer is eligible for hold orders (payment later)
 */
router.get('/hold/eligibility/:offerId', async (req: Request, res: Response) => {
  await holdOrdersController.checkHoldEligibility(req, res, (err: any) => {
    return res.status(err?.statusCode || 500).json({
      success: false,
      error: err?.message || 'Internal server error'
    });
  });
});

/**
 * Create Hold Order
 * POST /bookings/hold/orders
 * Create a new hold order from an offer
 */
router.post('/hold/orders', async (req: Request, res: Response) => {
  await holdOrdersController.createHoldOrder(req, res, (err: any) => {
    return res.status(err?.statusCode || 500).json({
      success: false,
      error: err?.message || 'Internal server error'
    });
  });
});

/**
 * Aliases for specific hold types
 */
router.post('/hotel/hold', async (req: Request, res: Response) => {
  req.body.type = 'hotel';
  await holdOrdersController.createHoldOrder(req, res, (err: any) => {
    return res.status(err?.statusCode || 500).json({
      success: false,
      error: err?.message || 'Internal server error'
    });
  });
});


router.post('/flight/hold', async (req: Request, res: Response) => {
  req.body.type = 'flight';
  await holdOrdersController.createHoldOrder(req, res, (err: any) => {
    return res.status(err?.statusCode || 500).json({
      success: false,
      error: err?.message || 'Internal server error'
    });
  });
});

/**
 * Get Hold Order Details
 * GET /bookings/hold/orders/:orderId
 * Retrieve complete details of a hold order
 */
router.get('/hold/orders/:orderId', async (req: Request, res: Response) => {
  await holdOrdersController.getHoldOrder(req, res, (err: any) => {
    return res.status(err?.statusCode || 500).json({
      success: false,
      error: err?.message || 'Internal server error'
    });
  });
});

/**
 * Check Price Change
 * POST /bookings/hold/orders/:orderId/check-price
 * Verify if price has changed for a hold order
 */
router.post('/hold/orders/:orderId/check-price', async (req: Request, res: Response) => {
  await holdOrdersController.checkPriceChange(req, res, (err: any) => {
    return res.status(err?.statusCode || 500).json({
      success: false,
      error: err?.message || 'Internal server error'
    });
  });
});

/**
 * Check Schedule Change
 * POST /bookings/hold/orders/:orderId/check-schedule
 * Verify if flight schedule has changed
 */
router.post('/hold/orders/:orderId/check-schedule', async (req: Request, res: Response) => {
  await holdOrdersController.checkScheduleChange(req, res, (err: any) => {
    return res.status(err?.statusCode || 500).json({
      success: false,
      error: err?.message || 'Internal server error'
    });
  });
});

/**
 * Pay for Hold Order
 * POST /bookings/hold/orders/:orderId/payment
 * Complete payment for a held order
 */
router.post('/hold/orders/:orderId/payment', async (req: Request, res: Response) => {
  await holdOrdersController.payForHoldOrder(req, res, (err: any) => {
    return res.status(err?.statusCode || 500).json({
      success: false,
      error: err?.message || 'Internal server error'
    });
  });
});

/**
 * Cancel Hold Order
 * POST /bookings/hold/orders/:orderId/cancel
 * Cancel a hold order
 */
router.post('/hold/orders/:orderId/cancel', async (req: Request, res: Response) => {
  await holdOrdersController.cancelHoldOrder(req, res, (err: any) => {
    return res.status(err?.statusCode || 500).json({
      success: false,
      error: err?.message || 'Internal server error'
    });
  });
});

/**
 * Get Available Services
 * GET /bookings/hold/orders/:orderId/services
 * List ancillary services available for the hold order
 */
router.get('/hold/orders/:orderId/services', async (req: Request, res: Response) => {
  await holdOrdersController.getAvailableServices(req, res, (err: any) => {
    return res.status(err?.statusCode || 500).json({
      success: false,
      error: err?.message || 'Internal server error'
    });
  });
});

/**
 * Add Service to Hold Order
 * POST /bookings/hold/orders/:orderId/services
 * Add an ancillary service to the hold order
 */
router.post('/hold/orders/:orderId/services', async (req: Request, res: Response) => {
  await holdOrdersController.addServiceToHoldOrder(req, res, (err: any) => {
    return res.status(err?.statusCode || 500).json({
      success: false,
      error: err?.message || 'Internal server error'
    });
  });
});

/**
 * Get Payment Details
 * GET /bookings/hold/payments/:paymentId
 * Retrieve details of a specific payment
 */
router.get('/hold/payments/:paymentId', async (req: Request, res: Response) => {
  await holdOrdersController.getPaymentDetails(req, res, (err: any) => {
    return res.status(err?.statusCode || 500).json({
      success: false,
      error: err?.message || 'Internal server error'
    });
  });
});

/**
 * Get Order Payments
 * GET /bookings/hold/orders/:orderId/payments
 * List all payments for an order
 */
router.get('/hold/orders/:orderId/payments', async (req: Request, res: Response) => {
  await holdOrdersController.getOrderPayments(req, res, (err: any) => {
    return res.status(err?.statusCode || 500).json({
      success: false,
      error: err?.message || 'Internal server error'
    });
  });
});

/**
 * Get Available Payment Methods
 * GET /bookings/hold/payment-methods
 * List all available payment methods
 */
router.get('/hold/payment-methods', async (req: Request, res: Response) => {
  await holdOrdersController.getAvailablePaymentMethods(req, res, (err: any) => {
    return res.status(err?.statusCode || 500).json({
      success: false,
      error: err?.message || 'Internal server error'
    });
  });
});

/**
 * Refund Payment
 * POST /bookings/hold/payments/:paymentId/refund
 * Refund a completed payment
 */
router.post('/hold/payments/:paymentId/refund', async (req: Request, res: Response) => {
  await holdOrdersController.refundPayment(req, res, (err: any) => {
    return res.status(err?.statusCode || 500).json({
      success: false,
      error: err?.message || 'Internal server error'
    });
  });
});

export default router;
