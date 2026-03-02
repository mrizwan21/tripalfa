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

import { Router, Request, Response } from "express";
import kiwiDepositService from "../services/kiwiDepositService.js";
import { logger } from "../utils/logger.js";

const router: Router = Router();

// ─── Wallet Endpoints ─────────────────────────────────────────────────────────

/**
 * GET /api/kiwi/balance
 * Get Kiwi supplier wallet balance
 */
router.get("/balance", async (req: Request, res: Response) => {
  try {
    const balance = await kiwiDepositService.getBalance();
    res.json({
      success: true,
      data: balance,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to get balance";
    logger.error(`[KiwiRoutes] Failed to get balance: ${errorMessage}`);
    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
});

/**
 * POST /api/kiwi/topup
 * Top-up Kiwi deposit account
 */
router.post("/topup", async (req: Request, res: Response) => {
  try {
    const { amount, gatewayReference, idempotencyKey } = req.body;

    if (!amount || !gatewayReference || !idempotencyKey) {
      return res.status(400).json({
        success: false,
        error:
          "Missing required fields: amount, gatewayReference, idempotencyKey",
      });
    }

    const transaction = await kiwiDepositService.topup(
      parseFloat(amount),
      gatewayReference,
      idempotencyKey,
    );

    res.json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Top-up failed";
    logger.error(`[KiwiRoutes] Top-up failed: ${errorMessage}`);
    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
});

// ─── Booking Hold Flow ────────────────────────────────────────────────────────

/**
 * POST /api/kiwi/hold
 * Place a hold on funds for a pending booking
 */
router.post("/hold", async (req: Request, res: Response) => {
  try {
    const { bookingId, kiwiBookingId, amount, currency, metadata } = req.body;

    if (!bookingId || !kiwiBookingId || !amount) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: bookingId, kiwiBookingId, amount",
      });
    }

    const hold = await kiwiDepositService.holdForBooking(
      bookingId,
      kiwiBookingId,
      parseFloat(amount),
      currency,
      metadata,
    );

    res.json({
      success: true,
      data: hold,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Hold failed";
    logger.error(`[KiwiRoutes] Hold failed: ${errorMessage}`);
    res.status(400).json({
      success: false,
      error: errorMessage,
    });
  }
});

/**
 * POST /api/kiwi/hold/:bookingId/confirm
 * Confirm a hold after successful ticketing
 */
router.post("/hold/:bookingId/confirm", async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;
    const hold = await kiwiDepositService.confirmHold(bookingId);

    res.json({
      success: true,
      data: hold,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Confirm hold failed";
    logger.error(
      `[KiwiRoutes] Confirm hold failed for ${req.params.bookingId}: ${errorMessage}`,
    );
    res.status(400).json({
      success: false,
      error: errorMessage,
    });
  }
});

/**
 * POST /api/hold/:bookingId/release
 * Release a hold (booking cancelled before ticketing)
 */
router.post("/hold/:bookingId/release", async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;
    const hold = await kiwiDepositService.releaseHold(bookingId);

    res.json({
      success: true,
      data: hold,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Release hold failed";
    logger.error(
      `[KiwiRoutes] Release hold failed for ${req.params.bookingId}: ${errorMessage}`,
    );
    res.status(400).json({
      success: false,
      error: errorMessage,
    });
  }
});

// ─── Settlement ───────────────────────────────────────────────────────────────

/**
 * POST /api/kiwi/settle
 * Process settlement after Kiwi confirms ticketing
 */
router.post("/settle", async (req: Request, res: Response) => {
  try {
    const { kiwiBookingId, grossAmount, commission, invoiceId } = req.body;

    if (!kiwiBookingId || !grossAmount) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: kiwiBookingId, grossAmount",
      });
    }

    const settlement = await kiwiDepositService.settleBooking(
      kiwiBookingId,
      parseFloat(grossAmount),
      parseFloat(commission || 0),
      invoiceId,
    );

    res.json({
      success: true,
      data: settlement,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Settlement failed";
    logger.error(`[KiwiRoutes] Settlement failed: ${errorMessage}`);
    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
});

// ─── Refund Processing ────────────────────────────────────────────────────────

/**
 * POST /api/kiwi/refund
 * Process refund request via Kiwi API
 */
router.post("/refund", async (req: Request, res: Response) => {
  try {
    const { kiwiBookingId, amount, currency, reason, idempotencyKey } =
      req.body;

    if (!kiwiBookingId || !amount || !currency || !reason || !idempotencyKey) {
      return res.status(400).json({
        success: false,
        error:
          "Missing required fields: kiwiBookingId, amount, currency, reason, idempotencyKey",
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
    const errorMessage =
      error instanceof Error ? error.message : "Refund failed";
    logger.error(`[KiwiRoutes] Refund failed: ${errorMessage}`);
    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
});

// ─── Webhook Handler ──────────────────────────────────────────────────────────

/**
 * POST /api/kiwi/webhook
 * Handle incoming webhooks from Kiwi
 *
 * Supported events:
 * - booking_confirmed
 * - booking_cancelled
 * - price_change
 * - schedule_change
 * - refund_processed
 */
router.post("/webhook", async (req: Request, res: Response) => {
  try {
    const payload = req.body;

    logger.info(
      `[KiwiRoutes] Webhook received: ${payload.event} for booking ${payload.booking_id}`,
    );

    // Verify webhook signature (if implemented by Kiwi)
    // const signature = req.headers['x-kiwi-signature'];
    // TODO: Verify signature

    await kiwiDepositService.handleWebhook(payload);

    // Always return 200 to acknowledge receipt
    res.status(200).json({ received: true });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    logger.error(`[KiwiRoutes] Webhook processing failed: ${errorMessage}`);
    // Still return 200 to prevent Kiwi from retrying
    res.status(200).json({ received: true, error: "Processing failed" });
  }
});

// ─── Ancillary Services ───────────────────────────────────────────────────────

/**
 * POST /api/kiwi/ancillary/baggage
 * Add baggage to booking
 */
router.post("/ancillary/baggage", async (req: Request, res: Response) => {
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
    const errorMessage =
      error instanceof Error ? error.message : "Add baggage failed";
    logger.error(`[KiwiRoutes] Add baggage failed: ${errorMessage}`);
    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
});

/**
 * POST /api/kiwi/ancillary/seating
 * Add seats to booking
 */
router.post("/ancillary/seating", async (req: Request, res: Response) => {
  try {
    const { kiwiBookingId, seats } = req.body;

    const result = await kiwiDepositService.addSeating(kiwiBookingId, seats);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Add seating failed";
    logger.error(`[KiwiRoutes] Add seating failed: ${errorMessage}`);
    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
});

/**
 * POST /api/kiwi/ancillary/disruption-protection
 * Add premium disruption protection
 */
router.post(
  "/ancillary/disruption-protection",
  async (req: Request, res: Response) => {
    try {
      const { kiwiBookingId } = req.body;

      const result =
        await kiwiDepositService.addDisruptionProtection(kiwiBookingId);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Add disruption protection failed";
      logger.error(
        `[KiwiRoutes] Add disruption protection failed: ${errorMessage}`,
      );
      res.status(500).json({
        success: false,
        error: errorMessage,
      });
    }
  },
);

// ─── Balance Monitoring ───────────────────────────────────────────────────────

/**
 * GET /api/kiwi/balance/alert
 * Check if balance is below threshold
 */
router.get("/balance/alert", async (req: Request, res: Response) => {
  try {
    const alert = await kiwiDepositService.checkBalanceAlert();
    res.json({
      success: true,
      data: alert,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Balance alert check failed";
    logger.error(`[KiwiRoutes] Balance alert check failed: ${errorMessage}`);
    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
});

/**
 * POST /api/kiwi/holds/release-expired
 * Release all expired holds (admin/cron endpoint)
 */
router.post("/holds/release-expired", async (req: Request, res: Response) => {
  try {
    const count = await kiwiDepositService.releaseExpiredHolds();
    res.json({
      success: true,
      data: { releasedCount: count },
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Release expired holds failed";
    logger.error(`[KiwiRoutes] Release expired holds failed: ${errorMessage}`);
    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
});

export default router;
