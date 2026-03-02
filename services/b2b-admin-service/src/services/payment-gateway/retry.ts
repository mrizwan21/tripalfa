/**
 * Payment Retry Service
 * Handles retrying failed payments with exponential backoff
 */

import { prisma } from "../../database.js";
import { RetryPolicy } from "./types.js";
import PaymentGatewayFactory from "./factory.js";

export interface RetryablePaymentRequest {
  paymentId: string;
  supplierId: string;
  walletId: string;
  amount: number;
  currency: string;
  retryCount: number;
  lastError?: string;
  nextRetryAt?: Date;
}

export class PaymentRetryService {
  private defaultPolicy: RetryPolicy = {
    maxRetries: 3,
    initialDelay: 5000, // 5 seconds
    maxDelay: 300000, // 5 minutes
    backoffMultiplier: 2,
  };

  /**
   * Schedule payment for retry
   */
  async scheduleRetry(
    payment: any,
    error: any,
    policy: Partial<RetryPolicy> = {}
  ): Promise<void> {
    const mergedPolicy = { ...this.defaultPolicy, ...policy };

    const nextRetryCount = (payment.retryCount || 0) + 1;

    // Check if we should retry
    if (nextRetryCount > mergedPolicy.maxRetries) {
      await this.markPaymentFailed(
        payment.id,
        `Max retries (${mergedPolicy.maxRetries}) exceeded`
      );
      return;
    }

    // Calculate next retry time with exponential backoff
    const delayMs = Math.min(
      mergedPolicy.initialDelay * Math.pow(mergedPolicy.backoffMultiplier, nextRetryCount - 1),
      mergedPolicy.maxDelay
    );

    const nextRetryAt = new Date(Date.now() + delayMs);

    // Update payment metadata with retry info
    await prisma.supplierPayment.update({
      where: { id: payment.id },
      data: {
        metadata: {
          ...payment.metadata,
          retryCount: nextRetryCount,
          lastError: error.message,
          nextRetryAt: nextRetryAt.toISOString(),
          lastRetryAt: new Date().toISOString(),
        },
      },
    });

    console.log(
      `📅 Payment ${payment.id} scheduled for retry #${nextRetryCount} at ${nextRetryAt.toISOString()}`
    );
  }

  /**
   * Process all payments pending retry
   */
  async processRetries(): Promise<{
    processed: number;
    succeeded: number;
    failed: number;
  }> {
    const now = new Date();

    // Find all payments due for retry
    const paymentsToRetry = await prisma.supplierPayment.findMany({
      where: {
        status: "failed",
        metadata: {
          path: ["nextRetryAt"],
          lte: now.toISOString(),
        },
      },
    });

    let succeeded = 0;
    let failed = 0;

    for (const payment of paymentsToRetry) {
      try {
        await this.retryPayment(payment);
        succeeded++;
      } catch (error: any) {
        console.error(`Failed to retry payment ${payment.id}:`, error.message);
        failed++;

        // Schedule next retry if not max retries
        const metadata = payment.metadata as any;
        if (!metadata?.nextRetryAt || metadata.retryCount < this.defaultPolicy.maxRetries) {
          await this.scheduleRetry(payment, error);
        } else {
          await this.markPaymentFailed(payment.id, "Max retries exceeded");
        }
      }
    }

    return {
      processed: paymentsToRetry.length,
      succeeded,
      failed,
    };
  }

  /**
   * Retry a single payment
   */
  private async retryPayment(payment: any): Promise<void> {
    const supplier = await prisma.supplier.findUnique({
      where: { id: payment.supplierId },
    });

    if (!supplier) {
      throw new Error("Supplier not found");
    }

    const wallet = await prisma.supplierWallet.findUnique({
      where: { id: payment.walletId },
    });

    if (!wallet) {
      throw new Error("Wallet not found");
    }

    // Get gateway
    const gatewayConfig = {
      provider: (payment.metadata as any)?.gatewayProvider || "stripe",
      apiKey: process.env.STRIPE_API_KEY || "",
      testMode: process.env.NODE_ENV !== "production",
    };

    const gateway = PaymentGatewayFactory.getGateway(gatewayConfig as any);

    // Attempt payment
    const response = await gateway.processPayment({
      supplierId: payment.supplierId,
      walletId: payment.walletId,
      amount: Number(payment.amount),
      currency: payment.currency,
      type: payment.paymentType || "payout",
      method: payment.paymentMethod || "bank_transfer",
      description: `Retry #${(payment.metadata as any)?.retryCount || 1}: ${payment.description}`,
      metadata: {
        ...payment.metadata,
        isRetry: true,
        originalPaymentId: payment.id,
      },
    });

    // Update payment with new transaction ID
    await prisma.supplierPayment.update({
      where: { id: payment.id },
      data: {
        status: response.status,
        transactionReference: response.transactionId,
        metadata: {
          ...payment.metadata,
          retryCount: ((payment.metadata as any)?.retryCount || 0) + 1,
          lastRetryAt: new Date().toISOString(),
          retriedTransactionId: response.transactionId,
        },
      },
    });

    // If payment completed, update wallet
    if (response.status === "completed") {
      const wallet = await prisma.supplierWallet.findUnique({
        where: { id: payment.walletId },
      });

      if (wallet) {
        const currentBalance = Number(wallet.balance);
        let newBalance = currentBalance;

        if (payment.paymentType === "payout") {
          newBalance = currentBalance - Number(payment.amount);
        } else if (payment.paymentType === "refund") {
          newBalance = currentBalance + Number(payment.amount);
        }

        await prisma.supplierWallet.update({
          where: { id: payment.walletId },
          data: { balance: newBalance },
        });

        // Log audit
        await prisma.supplierPaymentLog.create({
          data: {
            supplierId: payment.supplierId,
            walletId: payment.walletId,
            paymentId: payment.id,
            action: "processed",
            previousBalance: wallet.balance,
            newBalance,
            actorId: "system:retry",
            actorType: "system",
            notes: `Payment retry completed with transaction ${response.transactionId}`,
            metadata: {
              retryCount: (payment.metadata as any)?.retryCount || 1,
              originalError: (payment.metadata as any)?.lastError,
            },
          },
        });
      }
    }

    console.log(
      `✅ Retry succeeded for payment ${payment.id}: ${response.transactionId}`
    );
  }

  /**
   * Mark payment as permanently failed
   */
  private async markPaymentFailed(paymentId: string, reason: string): Promise<void> {
    await prisma.supplierPayment.update({
      where: { id: paymentId },
      data: {
        status: "failed",
        failureReason: reason,
        metadata: {
          failedAt: new Date().toISOString(),
          manualReviewRequired: true,
        },
      },
    });

    console.error(`❌ Payment ${paymentId} marked as failed: ${reason}`);
  }

  /**
   * Get retry statistics
   */
  async getRetryStats(): Promise<{
    pendingRetry: number;
    failed: number;
    averageRetries: number;
  }> {
    const payments = await prisma.supplierPayment.findMany({
      where: {
        status: { in: ["failed", "processing"] },
      },
    });

    const paymentsWithRetries = payments.filter((p) => 
      (p.metadata as any)?.retryCount
    );

    const averageRetries =
      paymentsWithRetries.length > 0
        ? paymentsWithRetries.reduce((sum, p) => sum + ((p.metadata as any)?.retryCount || 0), 0) /
          paymentsWithRetries.length
        : 0;

    return {
      pendingRetry: payments.filter((p) => p.status === "processing").length,
      failed: payments.filter((p) => p.status === "failed").length,
      averageRetries: Math.round(averageRetries * 10) / 10,
    };
  }
}

export default PaymentRetryService;
