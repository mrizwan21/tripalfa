/**
 * Payment Webhook Handler
 * Processes webhooks from payment gateways and updates payment status
 */

import { Router, Request, Response } from "express";
import { prisma } from "../database.js";
import PaymentGatewayFactory from "../services/payment-gateway/factory.js";
import { PaymentWebhook } from "../services/payment-gateway/types.js";

const router: Router = Router();

/**
 * POST /webhooks/stripe
 * Stripe webhook endpoint for payment confirmations
 */
router.post("/stripe", async (req: Request, res: Response) => {
  try {
    const signature = req.headers["stripe-signature"] as string;

    if (!signature) {
      res.status(400).json({ error: "Missing Stripe signature" });
      return;
    }

    // Verify webhook signature
    const gatewayConfig = {
      provider: "stripe",
      apiKey: process.env.STRIPE_API_KEY || "",
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
      testMode: process.env.NODE_ENV !== "production",
    };

    const gateway = PaymentGatewayFactory.getGateway(gatewayConfig as any);
    const isValid = gateway.verifyWebhook(req.body, signature);

    if (!isValid) {
      console.warn("Invalid Stripe webhook signature");
      res.status(401).json({ error: "Invalid signature" });
      return;
    }

    // Parse webhook
    const webhook = gateway.parseWebhook(req.body);

    // Handle different webhook types
    await handleStripeWebhook(webhook);

    res.json({ received: true });
  } catch (error: any) {
    console.error("Webhook processing error:", error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
});

/**
 * POST /webhooks/paypal
 * PayPal webhook endpoint placeholder
 */
router.post("/paypal", async (req: Request, res: Response) => {
  // TODO: Implement PayPal webhook handler
  res.status(501).json({ error: "PayPal webhooks not yet implemented" });
});

/**
 * POST /webhooks/test
 * Test webhook endpoint for development
 */
router.post("/test", async (req: Request, res: Response) => {
  try {
    console.log("📨 Test webhook received:", req.body);

    const webhook = {
      id: req.body.id || "test_webhook",
      type: req.body.type || "test.event",
      data: req.body.data || {},
      timestamp: new Date(),
    };

    await handleStripeWebhook(webhook as PaymentWebhook);

    res.json({
      received: true,
      webhook: webhook.type,
      processed: true,
    });
  } catch (error: any) {
    console.error("Test webhook error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get webhook events for a payment
 */
router.get("/payment/:paymentId/events", async (req: Request, res: Response) => {
  try {
    const { paymentId } = req.params;

    const payment = await prisma.supplierPayment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      res.status(404).json({ error: "Payment not found" });
      return;
    }

    const metadata = payment.metadata as any;

    res.json({
      paymentId,
      status: payment.status,
      webhookEvents: metadata?.webhookEvents || [],
      transactionId: payment.transactionReference,
      lastUpdate: payment.updatedAt,
    });
  } catch (error: any) {
    console.error("Error fetching webhook events:", error);
    res.status(500).json({ error: "Failed to fetch webhook events" });
  }
});

// ============================================
// WEBHOOK HANDLERS
// ============================================

/**
 * Handle Stripe webhook events
 */
async function handleStripeWebhook(webhook: PaymentWebhook): Promise<void> {
  console.log(`📨 Processing Stripe webhook: ${webhook.type}`);

  const handlers: Record<string, (data: any) => Promise<void>> = {
    "charge.succeeded": handleChargeSucceeded,
    "charge.failed": handleChargeFailed,
    "payout.completed": handlePayoutCompleted,
    "payout.failed": handlePayoutFailed,
    "payout.paid": handlePayoutPaid,
  };

  const handler = handlers[webhook.type];
  if (!handler) {
    console.warn(`No handler for webhook type: ${webhook.type}`);
    return;
  }

  await handler(webhook.data);
}

/**
 * Handle charge.succeeded webhook
 */
async function handleChargeSucceeded(data: any): Promise<void> {
  console.log("✅ Charge succeeded:", data.id);

  // Find payment by transaction ID
  const payment = await prisma.supplierPayment.findFirst({
    where: {
      transactionReference: data.id,
    },
  });

  if (!payment) {
    console.warn(`Payment not found for charge ${data.id}`);
    return;
  }

  // Update payment status
  await updatePaymentStatus(payment.id, "completed", data.id, {
    chargeId: data.id,
    amount: (data.amount || 0) / 100,
    currency: data.currency,
    receiptUrl: data.receipt_url,
    webhookType: "charge.succeeded",
  });

  // Update wallet balance
  const wallet = await prisma.supplierWallet.findUnique({
    where: { id: payment.walletId },
  });

  if (wallet && payment.paymentType === "payout") {
    const currentBalance = Number(wallet.balance);
    await prisma.supplierWallet.update({
      where: { id: payment.walletId },
      data: {
        balance: currentBalance - Number(payment.amount),
      },
    });
  }
}

/**
 * Handle charge.failed webhook
 */
async function handleChargeFailed(data: any): Promise<void> {
  console.log("❌ Charge failed:", data.id);

  const payment = await prisma.supplierPayment.findFirst({
    where: {
      transactionReference: data.id,
    },
  });

  if (!payment) {
    console.warn(`Payment not found for charge ${data.id}`);
    return;
  }

  await updatePaymentStatus(payment.id, "failed", data.id, {
    error: data.failure_message,
    errorCode: data.failure_code,
    reason: data.failure_reason,
    webhookType: "charge.failed",
  });
}

/**
 * Handle payout.paid webhook
 */
async function handlePayoutPaid(data: any): Promise<void> {
  console.log("✅ Payout paid:", data.id);

  const payment = await prisma.supplierPayment.findFirst({
    where: {
      transactionReference: data.id,
    },
  });

  if (!payment) {
    console.warn(`Payment not found for payout ${data.id}`);
    return;
  }

  await updatePaymentStatus(payment.id, "completed", data.id, {
    payoutId: data.id,
    amount: (data.amount || 0) / 100,
    currency: data.currency,
    arrivalDate: data.arrival_date,
    webhookType: "payout.paid",
  });
}

/**
 * Handle payout.completed webhook
 */
async function handlePayoutCompleted(data: any): Promise<void> {
  console.log("✅ Payout completed:", data.id);

  const payment = await prisma.supplierPayment.findFirst({
    where: {
      transactionReference: data.id,
    },
  });

  if (!payment) {
    console.warn(`Payment not found for payout ${data.id}`);
    return;
  }

  await updatePaymentStatus(payment.id, "processing", data.id, {
    payoutId: data.id,
    status: data.status,
    webhookType: "payout.completed",
  });
}

/**
 * Handle payout.failed webhook
 */
async function handlePayoutFailed(data: any): Promise<void> {
  console.log("❌ Payout failed:", data.id);

  const payment = await prisma.supplierPayment.findFirst({
    where: {
      transactionReference: data.id,
    },
  });

  if (!payment) {
    console.warn(`Payment not found for payout ${data.id}`);
    return;
  }

  await updatePaymentStatus(payment.id, "failed", data.id, {
    failureReason: data.failure_reason,
    failureCode: data.failure_code,
    webhookType: "payout.failed",
  });
}

/**
 * Update payment status and log webhook event
 */
async function updatePaymentStatus(
  paymentId: string,
  status: string,
  transactionId: string,
  metadata: Record<string, any>
): Promise<void> {
  const payment = await prisma.supplierPayment.findUnique({
    where: { id: paymentId },
  });

  if (!payment) {
    return;
  }

  const currentMetadata = payment.metadata as any;
  const webhookEvents = currentMetadata?.webhookEvents || [];

  await prisma.supplierPayment.update({
    where: { id: paymentId },
    data: {
      status,
      transactionReference: transactionId,
      processedAt: status === "completed" ? new Date() : payment.processedAt,
      metadata: {
        ...currentMetadata,
        ...metadata,
        webhookEvents: [
          ...webhookEvents,
          {
            type: metadata.webhookType,
            timestamp: new Date().toISOString(),
            status,
          },
        ],
        lastWebhookAt: new Date().toISOString(),
      },
    },
  });

  // Log payment audit
  await prisma.supplierPaymentLog.create({
    data: {
      supplierId: payment.supplierId,
      walletId: payment.walletId,
      paymentId,
      action: status === "completed" ? "processed" : "failed",
      actorType: "system",
      actorId: "webhook:stripe",
      notes: `Webhook processed: ${metadata.webhookType}`,
      metadata: {
        webhookType: metadata.webhookType,
        transactionId,
      },
    },
  });

  console.log(`📝 Payment ${paymentId} updated to ${status}`);
}

export default router;
