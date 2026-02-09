import { Router } from 'express';
import paymentWalletController from '../controllers/paymentWalletController.js';

const router = Router();

// ============ PAYMENT FINALIZATION ROUTES ============

/**
 * POST /payment/finalize
 * Finalize payment for a hold order
 * Triggers: status update, document generation, notifications
 */
router.post('/payment/finalize', async (req, res) => {
  await paymentWalletController.finalizePayment(req, res);
});

/**
 * GET /payment/status/:paymentId
 * Get payment finalization status and documents
 */
router.get('/payment/status/:paymentId', async (req, res) => {
  await paymentWalletController.getPaymentStatus(req, res);
});

/**
 * GET /payment/statistics
 * Get payment finalization statistics
 */
router.get('/payment/statistics', async (req, res) => {
  await paymentWalletController.getPaymentStatistics(req, res);
});

// ============ WALLET TOP-UP ROUTES ============

/**
 * POST /wallet/topup
 * Top up wallet with credit card or other payment method
 * Applies surcharge based on payment method
 */
router.post('/wallet/topup', async (req, res) => {
  await paymentWalletController.topUpWallet(req, res);
});

/**
 * GET /wallet/balance/:customerId
 * Get current wallet balance
 */
router.get('/wallet/balance/:customerId', async (req, res) => {
  await paymentWalletController.getWalletBalance(req, res);
});

/**
 * GET /wallet/history/:customerId
 * Get wallet transaction history
 */
router.get('/wallet/history/:customerId', async (req, res) => {
  await paymentWalletController.getWalletHistory(req, res);
});

/**
 * GET /wallet/statistics/:customerId
 * Get wallet statistics (total top-ups, debits)
 */
router.get('/wallet/statistics/:customerId', async (req, res) => {
  await paymentWalletController.getWalletStatistics(req, res);
});

/**
 * GET /wallet/surcharges
 * Get surcharge information for different payment methods
 */
router.get('/wallet/surcharges', async (req, res) => {
  await paymentWalletController.getSurchargeInfo(req, res);
});

/**
 * POST /wallet/calculate-cost
 * Calculate total cost including surcharge
 */
router.post('/wallet/calculate-cost', async (req, res) => {
  await paymentWalletController.calculateTotalCost(req, res);
});

export default router;
