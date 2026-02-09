import { Request, Response } from 'express';
import paymentFinalizationService from '../services/paymentFinalizationService.js';
import walletService from '../services/walletService.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Payment & Wallet Controller
 * Handles endpoints for:
 * 1. Payment finalization
 * 2. Wallet top-ups
 * 3. Wallet balance inquiries
 * 4. Transaction history
 */

class PaymentWalletController {
  /**
   * POST /bookings/payment/finalize
   * Finalize payment for a hold order
   */
  async finalizePayment(req: Request, res: Response): Promise<void> {
    try {
      const { orderId, bookingId, customerId, amount, currency, paymentMethod, paymentDetails, metadata } =
        req.body;

      // Validate required fields
      if (!orderId || !bookingId || !customerId || !amount || !currency || !paymentMethod) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: orderId, bookingId, customerId, amount, currency, paymentMethod'
        });
        return;
      }

      console.log('[CONTROLLER] Payment finalization request:', { orderId, bookingId, amount });

      const result = await paymentFinalizationService.finalizePayment({
        orderId,
        bookingId,
        customerId,
        amount,
        currency,
        paymentMethod,
        paymentDetails,
        metadata
      });

      if (result.success) {
        res.status(200).json({
          success: true,
          data: result,
          message: 'Payment finalized successfully'
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.message,
          data: result
        });
      }
    } catch (error) {
      console.error('[CONTROLLER] Error finalizing payment:', error);

      res.status(500).json({
        success: false,
        error: `Payment finalization error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  }

  /**
   * GET /bookings/payment/status/:paymentId
   * Get payment finalization status
   */
  async getPaymentStatus(req: Request, res: Response): Promise<void> {
    try {
      const { paymentId } = req.params;

      if (!paymentId) {
        res.status(400).json({
          success: false,
          error: 'Payment ID is required'
        });
        return;
      }

      const status = await paymentFinalizationService.getFinalizationStatus(paymentId);

      if (status) {
        res.status(200).json({
          success: true,
          data: status
        });
      } else {
        res.status(404).json({
          success: false,
          error: `Payment ${paymentId} not found`
        });
      }
    } catch (error) {
      console.error('[CONTROLLER] Error getting payment status:', error);

      res.status(500).json({
        success: false,
        error: `Error retrieving payment status: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  }

  /**
   * GET /bookings/payment/statistics
   * Get payment statistics
   */
  async getPaymentStatistics(req: Request, res: Response): Promise<void> {
    try {
      const stats = await paymentFinalizationService.getPaymentStats();

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('[CONTROLLER] Error getting payment statistics:', error);

      res.status(500).json({
        success: false,
        error: `Error retrieving statistics: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  }

  /**
   * POST /wallet/topup
   * Top up wallet with credit card or other payment method
   */
  async topUpWallet(req: Request, res: Response): Promise<void> {
    try {
      const { customerId, amount, currency = 'USD', paymentMethod, cardDetails } = req.body;

      // Validate required fields
      if (!customerId || !amount || !paymentMethod) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: customerId, amount, paymentMethod'
        });
        return;
      }

      if (paymentMethod === 'card' && !cardDetails) {
        res.status(400).json({
          success: false,
          error: 'Card details are required for card payments'
        });
        return;
      }

      console.log('[CONTROLLER] Wallet top-up request:', { customerId, amount, paymentMethod });

      const result = await walletService.topUpWallet({
        customerId,
        amount,
        currency,
        paymentMethod,
        cardDetails
      });

      if (result.success) {
        res.status(200).json({
          success: true,
          data: result,
          message: 'Wallet top-up successful'
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.message,
          data: result
        });
      }
    } catch (error) {
      console.error('[CONTROLLER] Error topping up wallet:', error);

      res.status(500).json({
        success: false,
        error: `Wallet top-up error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  }

  /**
   * GET /wallet/balance/:customerId
   * Get wallet balance
   */
  async getWalletBalance(req: Request, res: Response): Promise<void> {
    try {
      const { customerId } = req.params;

      if (!customerId) {
        res.status(400).json({
          success: false,
          error: 'Customer ID is required'
        });
        return;
      }

      const balance = await walletService.getWalletBalance(customerId);

      res.status(200).json({
        success: true,
        data: balance
      });
    } catch (error) {
      console.error('[CONTROLLER] Error getting wallet balance:', error);

      res.status(500).json({
        success: false,
        error: `Error retrieving balance: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  }

  /**
   * GET /wallet/history/:customerId
   * Get wallet transaction history
   */
  async getWalletHistory(req: Request, res: Response): Promise<void> {
    try {
      const { customerId } = req.params;
      const { limit = '50' } = req.query;

      if (!customerId) {
        res.status(400).json({
          success: false,
          error: 'Customer ID is required'
        });
        return;
      }

      const transactions = walletService.getWalletTransactionHistory(customerId, parseInt(limit as string));

      res.status(200).json({
        success: true,
        data: transactions,
        count: transactions.length
      });
    } catch (error) {
      console.error('[CONTROLLER] Error getting wallet history:', error);

      res.status(500).json({
        success: false,
        error: `Error retrieving transaction history: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  }

  /**
   * GET /wallet/statistics/:customerId
   * Get wallet statistics
   */
  async getWalletStatistics(req: Request, res: Response): Promise<void> {
    try {
      const { customerId } = req.params;

      if (!customerId) {
        res.status(400).json({
          success: false,
          error: 'Customer ID is required'
        });
        return;
      }

      const stats = await walletService.getWalletStats(customerId);

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('[CONTROLLER] Error getting wallet statistics:', error);

      res.status(500).json({
        success: false,
        error: `Error retrieving statistics: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  }

  /**
   * GET /wallet/surcharges
   * Get surcharge information for different payment methods
   */
  async getSurchargeInfo(req: Request, res: Response): Promise<void> {
    try {
      const surcharges = walletService.getSurchargeInfo();

      res.status(200).json({
        success: true,
        data: surcharges,
        message: 'Surcharge rates for wallet top-ups'
      });
    } catch (error) {
      console.error('[CONTROLLER] Error getting surcharge info:', error);

      res.status(500).json({
        success: false,
        error: `Error retrieving surcharge information: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  }

  /**
   * POST /wallet/calculate-cost
   * Calculate total cost including surcharge
   */
  async calculateTotalCost(req: Request, res: Response): Promise<void> {
    try {
      const { amount, paymentMethod } = req.body;

      if (!amount || !paymentMethod) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: amount, paymentMethod'
        });
        return;
      }

      const calculation = walletService.calculateTotalCost(amount, paymentMethod);

      res.status(200).json({
        success: true,
        data: calculation
      });
    } catch (error) {
      console.error('[CONTROLLER] Error calculating total cost:', error);

      res.status(500).json({
        success: false,
        error: `Error calculating cost: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  }
}

export default new PaymentWalletController();
