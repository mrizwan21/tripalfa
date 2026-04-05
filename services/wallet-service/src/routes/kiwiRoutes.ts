/**
 * Kiwi.com Deposit Account Routes
 *
 * Routes for Kiwi deposit account management:
 * - Wallet balance & top-up
 * - Booking hold/reserve flow
 * - Settlement processing
 * - Refund handling
 * - Webhook endpoint
 */

import { Router, Request, Response } from 'express';
import kiwiDepositService from '../services/kiwiDepositService.js';
import { logger } from '../utils/logger.js';

const router: Router = Router();

// ─── Wallet Endpoints ─────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/kiwi/balance:
 *   get:
 *     summary: Get Kiwi supplier wallet balance
 *     tags: [Kiwi]
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       500:
 *         description: Server error
 */
router.get('/balance', async (req: Request, res: Response) => {
  try {
    const balance = await kiwiDepositService.getBalance();
    res.json({
      success: true,
      data: balance,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get balance';
    logger.error(`[KiwiRoutes] Failed to get balance: ${errorMessage}`);
    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
});

/**
 * @swagger
 * /api/kiwi/topup:
 *   post:
 *     summary: Top-up Kiwi deposit account
 *     tags: [Kiwi]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount, gatewayReference, idempotencyKey]
 *             properties:
 *               amount:
 *                 type: number
 *               gatewayReference:
 *                 type: string
 *               idempotencyKey:
 *                 type: string
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       500:
 *         description: Server error
 */
router.post('/topup', async (req: Request, res: Response) => {
  try {
    const { amount, gatewayReference, idempotencyKey } = req.body;

    if (!amount || !gatewayReference || !idempotencyKey) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: amount, gatewayReference, idempotencyKey',
      });
    }

    const transaction = await kiwiDepositService.topup(
      parseFloat(amount),
      gatewayReference,
      idempotencyKey
    );

    res.json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Top-up failed';
    logger.error(`[KiwiRoutes] Top-up failed: ${errorMessage}`);
    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
});

// ─── Booking Hold Flow ────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/kiwi/hold:
 *   post:
 *     summary: Place a hold on funds for a pending booking
 *     tags: [Kiwi]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [bookingId, kiwiBookingId, amount]
 *             properties:
 *               bookingId:
 *                 type: string
 *               kiwiBookingId:
 *                 type: string
 *               amount:
 *                 type: number
 *               currency:
 *                 type: string
 *               metadata:
 *                 type: object
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       400:
 *         description: Bad request
 */
router.post('/hold', async (req: Request, res: Response) => {
  try {
    const { bookingId, kiwiBookingId, amount, currency, metadata } = req.body;

    if (!bookingId || !kiwiBookingId || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: bookingId, kiwiBookingId, amount',
      });
    }

    const hold = await kiwiDepositService.holdForBooking(
      bookingId,
      kiwiBookingId,
      parseFloat(amount),
      currency,
      metadata
    );

    res.json({
      success: true,
      data: hold,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Hold failed';
    logger.error(`[KiwiRoutes] Hold failed: ${errorMessage}`);
    res.status(400).json({
      success: false,
      error: errorMessage,
    });
  }
});

/**
 * @swagger
 * /api/kiwi/hold/{bookingId}/confirm:
 *   post:
 *     summary: Confirm a hold after successful ticketing
 *     tags: [Kiwi]
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       400:
 *         description: Bad request
 */
router.post('/hold/:bookingId/confirm', async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;
    const hold = await kiwiDepositService.confirmHold(bookingId);

    res.json({
      success: true,
      data: hold,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Confirm hold failed';
    logger.error(`[KiwiRoutes] Confirm hold failed for ${req.params.bookingId}: ${errorMessage}`);
    res.status(400).json({
      success: false,
      error: errorMessage,
    });
  }
});

/**
 * @swagger
 * /api/kiwi/hold/{bookingId}/release:
 *   post:
 *     summary: Release a hold (booking cancelled before ticketing)
 *     tags: [Kiwi]
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       400:
 *         description: Bad request
 */
router.post('/hold/:bookingId/release', async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;
    const hold = await kiwiDepositService.releaseHold(bookingId);

    res.json({
      success: true,
      data: hold,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Release hold failed';
    logger.error(`[KiwiRoutes] Release hold failed for ${req.params.bookingId}: ${errorMessage}`);
    res.status(400).json({
      success: false,
      error: errorMessage,
    });
  }
});

// ─── Settlement ───────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/kiwi/settle:
 *   post:
 *     summary: Process settlement after Kiwi confirms ticketing
 *     tags: [Kiwi]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [kiwiBookingId, grossAmount]
 *             properties:
 *               kiwiBookingId:
 *                 type: string
 *               grossAmount:
 *                 type: number
 *               commission:
 *                 type: number
 *               invoiceId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       500:
 *         description: Server error
 */
router.post('/settle', async (req: Request, res: Response) => {
  try {
    const { kiwiBookingId, grossAmount, commission, invoiceId } = req.body;

    if (!kiwiBookingId || !grossAmount) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: kiwiBookingId, grossAmount',
      });
    }

    const settlement = await kiwiDepositService.settleBooking(
      kiwiBookingId,
      parseFloat(grossAmount),
      parseFloat(commission || 0),
      invoiceId
    );

    res.json({
      success: true,
      data: settlement,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Settlement failed';
    logger.error(`[KiwiRoutes] Settlement failed: ${errorMessage}`);
    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
});

// ─── Refund Processing ────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/kiwi/refund:
 *   post:
 *     summary: Process refund request via Kiwi API
 *     tags: [Kiwi]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [kiwiBookingId, amount, currency, reason, idempotencyKey]
 *             properties:
 *               kiwiBookingId:
 *                 type: string
 *               amount:
 *                 type: number
 *               currency:
 *                 type: string
 *               reason:
 *                 type: string
 *               idempotencyKey:
 *                 type: string
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       500:
 *         description: Server error
 */
router.post('/refund', async (req: Request, res: Response) => {
  try {
    const { kiwiBookingId, amount, currency, reason, idempotencyKey } = req.body;

    if (!kiwiBookingId || !amount || !currency || !reason || !idempotencyKey) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: kiwiBookingId, amount, currency, reason, idempotencyKey',
      });
    }

    const result = await kiwiDepositService.processRefund({
      kiwiBookingId,
      amount: parseFloat(amount),
      currency,
      reason,
      idempotencyKey,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Refund failed';
    logger.error(`[KiwiRoutes] Refund failed: ${errorMessage}`);
    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
});

// ─── Webhook Handler ──────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/kiwi/webhook:
 *   post:
 *     summary: Handle incoming webhooks from Kiwi
 *     tags: [Kiwi]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook received
 *       500:
 *         description: Processing failed
 */
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const payload = req.body;

    logger.info(
      `[KiwiRoutes] Webhook received: ${payload.event} for booking ${payload.booking_id}`
    );

    await kiwiDepositService.handleWebhook(payload);

    res.status(200).json({ received: true });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`[KiwiRoutes] Webhook processing failed: ${errorMessage}`);
    res.status(200).json({ received: true, error: 'Processing failed' });
  }
});

// ─── Ancillary Services ───────────────────────────────────────────────────────

/**
 * @swagger
 * /api/kiwi/ancillary/baggage:
 *   post:
 *     summary: Add baggage to booking
 *     tags: [Kiwi]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               kiwiBookingId:
 *                 type: string
 *               weight:
 *                 type: number
 *               count:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       500:
 *         description: Server error
 */
router.post('/ancillary/baggage', async (req: Request, res: Response) => {
  try {
    const { kiwiBookingId, weight, count } = req.body;

    const result = await kiwiDepositService.addBaggage(kiwiBookingId, {
      weight,
      count,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Add baggage failed';
    logger.error(`[KiwiRoutes] Add baggage failed: ${errorMessage}`);
    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
});

/**
 * @swagger
 * /api/kiwi/ancillary/seating:
 *   post:
 *     summary: Add seats to booking
 *     tags: [Kiwi]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               kiwiBookingId:
 *                 type: string
 *               seats:
 *                 type: array
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       500:
 *         description: Server error
 */
router.post('/ancillary/seating', async (req: Request, res: Response) => {
  try {
    const { kiwiBookingId, seats } = req.body;

    const result = await kiwiDepositService.addSeating(kiwiBookingId, seats);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Add seating failed';
    logger.error(`[KiwiRoutes] Add seating failed: ${errorMessage}`);
    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
});

/**
 * @swagger
 * /api/kiwi/ancillary/disruption-protection:
 *   post:
 *     summary: Add premium disruption protection
 *     tags: [Kiwi]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               kiwiBookingId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       500:
 *         description: Server error
 */
router.post('/ancillary/disruption-protection', async (req: Request, res: Response) => {
  try {
    const { kiwiBookingId } = req.body;

    const result = await kiwiDepositService.addDisruptionProtection(kiwiBookingId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Add disruption protection failed';
    logger.error(`[KiwiRoutes] Add disruption protection failed: ${errorMessage}`);
    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
});

// ─── Balance Monitoring ───────────────────────────────────────────────────────

/**
 * @swagger
 * /api/kiwi/balance/alert:
 *   get:
 *     summary: Check if balance is below threshold
 *     tags: [Kiwi]
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       500:
 *         description: Server error
 */
router.get('/balance/alert', async (req: Request, res: Response) => {
  try {
    const alert = await kiwiDepositService.checkBalanceAlert();
    res.json({
      success: true,
      data: alert,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Balance alert check failed';
    logger.error(`[KiwiRoutes] Balance alert check failed: ${errorMessage}`);
    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
});

/**
 * @swagger
 * /api/kiwi/holds/release-expired:
 *   post:
 *     summary: Release all expired holds (admin/cron endpoint)
 *     tags: [Kiwi]
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       500:
 *         description: Server error
 */
router.post('/holds/release-expired', async (req: Request, res: Response) => {
  try {
    const count = await kiwiDepositService.releaseExpiredHolds();
    res.json({
      success: true,
      data: { releasedCount: count },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Release expired holds failed';
    logger.error(`[KiwiRoutes] Release expired holds failed: ${errorMessage}`);
    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
});

export default router;
