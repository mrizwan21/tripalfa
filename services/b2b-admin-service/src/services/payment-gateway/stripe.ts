/**
 * Stripe Payment Gateway Implementation
 * Handles all Stripe payment processing, webhooks, and error handling
 */

// Note: Stripe package must be installed via: pnpm add stripe
import Stripe from "stripe";
import {
  IPaymentGateway,
  PaymentRequest,
  PaymentResponse,
  PaymentWebhook,
  PaymentGatewayConfig,
} from "./types.js";

export class StripePaymentGateway implements IPaymentGateway {
  private stripe: Stripe;
  private config: PaymentGatewayConfig;
  private initialized = false;

  constructor(config: PaymentGatewayConfig) {
    if (!config.apiKey) {
      throw new Error("Stripe API key is required");
    }
    this.config = config;
    this.stripe = new Stripe(config.apiKey, {
      apiVersion: "2024-04-10",
      httpClient: new Stripe.HttpClient(),
      timeout: config.timeout || 30000,
    });
  }

  async initialize(): Promise<void> {
    try {
      // Verify API key is valid
      const account = await this.stripe.accounts.retrieve();
      this.initialized = true;
      console.log(`✅ Stripe gateway initialized for account: ${account.id}`);
    } catch (error) {
      console.error("Failed to initialize Stripe:", error);
      throw new Error("Failed to initialize Stripe payment gateway");
    }
  }

  async processPayment(request: PaymentRequest): Promise<PaymentResponse> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const startTime = Date.now();

      // Create payment based on type
      let transactionId: string;
      let status: "pending" | "processing" | "completed" | "failed" = "pending";

      switch (request.type) {
        case "payout": {
          const payout = await this.createPayout(request);
          transactionId = payout.id;
          status = this.mapStripePayoutStatus(payout.status as string);
          break;
        }
        case "refund": {
          const refund = await this.createRefund(request);
          transactionId = refund.id;
          status = this.mapStripeRefundStatus(refund.status as string);
          break;
        }
        case "adjustment": {
          // For adjustments, create a credit in the supplier account
          const charge = await this.createCredit(request);
          transactionId = charge.id;
          status = "pending";
          break;
        }
      }

      const processingTime = Date.now() - startTime;

      return {
        transactionId,
        status,
        amount: request.amount,
        currency: request.currency,
        gateway: "stripe",
        processingTime,
        metadata: {
          gatewayReference: transactionId,
          supplierId: request.supplierId,
          walletId: request.walletId,
          paymentType: request.type,
          initiatedAt: new Date().toISOString(),
        },
      };
    } catch (error: any) {
      console.error("Stripe payment processing error:", error);
      throw this.parseStripeError(error);
    }
  }

  private async createPayout(request: PaymentRequest): Promise<Stripe.Payout> {
    // Validate bank details for payout
    if (!request.bankDetails) {
      throw new Error("Bank details required for payout");
    }

    // In a real scenario, you would:
    // 1. Create a connected account for the supplier in Stripe
    // 2. Use bank account tokens for transfers
    // For this implementation, we'll use Stripe's transfer to bank account API

    // Get or create a bank account token
    const bankAccount = await this.createBankAccountToken(request.bankDetails);

    // Create transfer to bank account
    const transfer = await this.stripe.transfers.create({
      amount: Math.round(request.amount * 100), // Convert to cents
      currency: request.currency.toLowerCase(),
      destination: bankAccount.id,
      description: request.description || `Payout for supplier ${request.supplierId}`,
      metadata: {
        supplierId: request.supplierId,
        walletId: request.walletId,
        referenceId: request.referenceId,
      },
    });

    // Wrap transfer as payout-like response
    return transfer as unknown as Stripe.Payout;
  }

  private async createBankAccountToken(
    bankDetails: any
  ): Promise<Stripe.BankAccount> {
    return await this.stripe.customers.createSource("dummy_customer_id", {
      object: "bank_account",
      country: bankDetails.bankCountry,
      currency: "usd",
      account_holder_name: bankDetails.accountName,
      account_holder_type: "individual",
      account_number: bankDetails.accountNumber,
      routing_number: bankDetails.routingNumber,
    }) as unknown as Stripe.BankAccount;
  }

  private async createRefund(request: PaymentRequest): Promise<Stripe.Refund> {
    // In a real scenario, you would refund a previous charge by charge ID
    // For this implementation, we're simulating a refund
    // You'd normally have: await this.stripe.refunds.create({charge: chargeId})

    // Create a credit memo (simulated refund)
    const creditNote = await this.stripe.creditNotes.create({
      invoice: "dummy_invoice_id",
      amount: Math.round(request.amount * 100),
      reason: "product_unsatisfactory" as any,
      memo: request.description || "Refund processed",
      metadata: {
        supplierId: request.supplierId,
        walletId: request.walletId,
      },
    });

    // Convert to refund-like response
    return {
      id: creditNote.id,
      status: "succeeded",
    } as Stripe.Refund;
  }

  private async createCredit(request: PaymentRequest): Promise<Stripe.Charge> {
    // Create an invoice item for credit
    // Note: invoiceItems require a customer; creating a temporary one if needed
    const dummyCustomerId = "cust_dummy_supplier";
    
    const invoiceItem = await this.stripe.invoiceItems.create({
      customer: dummyCustomerId,
      description: request.description || `Credit adjustment for supplier ${request.supplierId}`,
      amount: Math.round(request.amount * 100),
      currency: request.currency.toLowerCase(),
      metadata: {
        supplierId: request.supplierId,
        walletId: request.walletId,
        adjustmentType: "credit",
      },
    });

    // Return as charge-like response
    return {
      id: invoiceItem.id,
      status: "pending",
    } as Stripe.Charge;
  }

  async getPaymentStatus(transactionId: string): Promise<PaymentResponse> {
    try {
      // Attempt to fetch as different resources
      let status: PaymentResponse["status"] = "pending";

      try {
        const transfer = await this.stripe.transfers.retrieve(transactionId);
        status = transfer.reversed ? "failed" : "completed";
        return {
          transactionId,
          status,
          amount: (transfer.amount || 0) / 100,
          currency: transfer.currency.toUpperCase(),
          gateway: "stripe",
        };
      } catch {
        // Try as refund
        const refund = await this.stripe.refunds.retrieve(transactionId);
        status = refund.status === "succeeded" ? "completed" : "failed";
        return {
          transactionId,
          status,
          amount: (refund.charge as any)?.amount_refunded || (refund.amount || 0) / 100,
          currency: refund.currency.toUpperCase(),
          gateway: "stripe",
        };
      }
    } catch (error: any) {
      console.error("Failed to fetch payment status:", error);
      throw this.parseStripeError(error);
    }
  }

  async cancelPayment(
    transactionId: string,
    reason?: string
  ): Promise<PaymentResponse> {
    try {
      // Attempt to reverse transfer
      const transfer = await this.stripe.transfers.createReversal(
        transactionId,
        {
          metadata: {
            cancellationReason: reason || "canceled",
          },
        }
      );

      return {
        transactionId: transfer.id,
        status: "completed",
        amount: (transfer.amount || 0) / 100,
        currency: transfer.currency.toUpperCase(),
        gateway: "stripe",
      };
    } catch (error: any) {
      console.error("Failed to cancel payment:", error);
      throw this.parseStripeError(error);
    }
  }

  verifyWebhook(payload: any, signature: string): boolean {
    if (!this.config.webhookSecret) {
      console.warn("No webhook secret configured");
      return false;
    }

    try {
      const crypto = require("crypto");
      const expectedSignature = crypto
        .createHmac("sha256", this.config.webhookSecret)
        .update(JSON.stringify(payload))
        .digest("hex");

      return expectedSignature === signature;
    } catch (error) {
      console.error("Webhook verification failed:", error);
      return false;
    }
  }

  parseWebhook(payload: any): PaymentWebhook {
    return {
      id: payload.id,
      type: payload.type,
      data: payload.data,
      timestamp: new Date(payload.created * 1000),
      signature: payload.signature,
    };
  }

  isRetriable(error: any): boolean {
    if (error.type === "StripeConnectionError") return true;
    if (error.type === "StripeRateLimitError") return true;
    if (error.type === "StripeServiceError") return true;

    // HTTP 5xx errors are retriable
    if (error.status && error.status >= 500) return true;

    // Timeout errors are retriable
    if (error.code === "ETIMEDOUT") return true;
    if (error.code === "ECONNRESET") return true;

    // Specific non-retriable errors
    const nonRetriableTypes = [
      "StripeAuthenticationError",
      "StripePermissionError",
      "StripeInvalidRequestError",
    ];

    return !nonRetriableTypes.includes(error.type);
  }

  // ============================================
  // PRIVATE HELPERS
  // ============================================

  private mapStripePayoutStatus(
    status: string
  ): "pending" | "processing" | "completed" | "failed" {
    switch (status) {
      case "paid":
        return "completed";
      case "in_transit":
        return "processing";
      case "failed":
        return "failed";
      default:
        return "pending";
    }
  }

  private mapStripeRefundStatus(
    status: string
  ): "pending" | "processing" | "completed" | "failed" {
    switch (status) {
      case "succeeded":
        return "completed";
      case "pending":
        return "processing";
      case "failed":
        return "failed";
      default:
        return "pending";
    }
  }

  private parseStripeError(error: any): Error {
    const stripeErrors: Record<string, string> = {
      StripeInvalidRequestError: "Invalid request parameters",
      StripeAuthenticationError: "Authentication failed",
      StripePermissionError: "Insufficient permissions",
      StripeRateLimitError: "Rate limit exceeded",
      StripeConnectionError: "Connection error",
      StripeServiceError: "Service unavailable",
    };

    const message =
      error.message || stripeErrors[error.type] || "Stripe payment failed";
    const err = new Error(message);
    (err as any).code = error.code || error.type;
    (err as any).retriable = this.isRetriable(error);
    (err as any).details = error;

    return err;
  }
}

export default StripePaymentGateway;
