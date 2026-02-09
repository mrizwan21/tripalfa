import { Router, Request, Response } from 'express';
import type { Router as ExpressRouter } from 'express';
import * as paymentWalletController from '../controllers/paymentWalletController';
import paymentFinalizationService from '../services/paymentFinalizationService';

const router: ExpressRouter = Router();

/**
 * Finalize Payment for Hold Order
 * POST /bookings/payment/finalize
 * Complete payment for a hold order and generate documents
 */
router.post('/payment/finalize', async (req: Request, res: Response) => {
  await paymentWalletController.finalizePayment(req, res, (err: any) => {
    return res.status(err?.statusCode || 500).json({
      success: false,
      error: err?.message || 'Internal server error'
    });
  });
});

/**
 * Top Up Wallet
 * POST /bookings/wallet/topup
 * Add funds to user wallet with surcharge calculation
 */
router.post('/wallet/topup', async (req: Request, res: Response) => {
  await paymentWalletController.topUpWallet(req, res, (err: any) => {
    return res.status(err?.statusCode || 500).json({
      success: false,
      error: err?.message || 'Internal server error'
    });
  });
});

/**
 * Get Wallet Balance
 * GET /bookings/wallet/balance/:userId
 * Retrieve current wallet balance for a user
 */
router.get('/wallet/balance/:userId', async (req: Request, res: Response) => {
  await paymentWalletController.getWalletBalance(req, res, (err: any) => {
    return res.status(err?.statusCode || 500).json({
      success: false,
      error: err?.message || 'Internal server error'
    });
  });
});

/**
 * Get Wallet Transaction History
 * GET /bookings/wallet/transactions/:userId
 * Retrieve transaction history for a user's wallet
 */
router.get('/wallet/transactions/:userId', async (req: Request, res: Response) => {
  await paymentWalletController.getWalletTransactions(req, res, (err: any) => {
    return res.status(err?.statusCode || 500).json({
      success: false,
      error: err?.message || 'Internal server error'
    });
  });
});

/**
 * Test Payment Finalization (Development Only)
 * POST /bookings/payment/test-finalize
 * Create a mock hold order and finalize payment for testing
 */
router.post('/payment/test-finalize', async (req: Request, res: Response) => {
  try {
    // Create a mock hold order for testing
    const mockHoldOrder = {
      id: 'test-hold-order-' + Date.now(),
      bookingRef: 'TEST' + Date.now(),
      customerId: 'test-customer',
      customerName: 'Test Customer',
      type: 'flight',
      totalAmount: 500,
      currency: 'USD',
      status: 'hold',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Store mock hold order temporarily (in production this would be in database)
    (global as any).mockHoldOrders = (global as any).mockHoldOrders || new Map();
    (global as any).mockHoldOrders.set(mockHoldOrder.id, mockHoldOrder);

    // Finalize payment
    const result = await paymentFinalizationService.finalizePayment(mockHoldOrder.id, 'card', {
      cardNumber: '4111111111111111',
      expiryDate: '12/25',
      cvv: '123'
    });

    res.json({
      success: true,
      data: {
        holdOrder: mockHoldOrder,
        finalizationResult: result
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

export default router;