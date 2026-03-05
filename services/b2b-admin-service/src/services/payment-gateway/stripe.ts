/**
 * Stripe Payment Gateway Implementation
 * Handles all Stripe payment processing, webhooks, and error handling
 */

// Note: Stripe package must be installed via: pnpm add stripe
import Stripe from "stripe";
import { createHmac } from "crypto";
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
    // Use the latest stable API version supported by the installed SDK
    // The SDK types may lag behind the actual API, so we use a type assertion
    // See: https://docs.stripe.com/changelog for latest API versions
    const apiVersion: Stripe.LatestApiVersion = "2023-10-16";
    this.stripe = new Stripe(config.apiKey, {
      apiVersion,
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

    // Validate connected account ID for the supplier
    // In production, this should be stored in the supplier's record
    const connectedAccountId = request.metadata?.connectedAccountId;
    
    if (!connectedAccountId) {
      throw new Error(
        "connectedAccountId is required for payouts. " +
        "Supplier must have a Stripe connected account. " +
        "Use Stripe Connect to onboard suppliers first."
      );
    }

    // Get or create a bank account token on the connected account
    const bankAccount = await this.createBankAccountToken(
      request.bankDetails,
      connectedAccountId
    );

    // Create transfer to bank account via Stripe Connect
    const transfer = await this.stripe.transfers.create({
      amount: Math.round(request.amount * 100), // Convert to cents
      currency: request.currency.toLowerCase(),
      destination: connectedAccountId, // Transfer to connected account
      description: request.description || `Payout for supplier ${request.supplierId}`,
      metadata: {
        supplierId: request.supplierId,
        walletId: request.walletId,
        referenceId: request.referenceId,
      },
    });

    // Create a payout object from the transfer
    // Note: In a full implementation, you'd create a Payout directly on the connected account
    const payoutResponse: Partial<Stripe.Payout> = {
      id: `po_${transfer.id}`,
      amount: transfer.amount,
      currency: transfer.currency,
      status: transfer.reversed ? 'failed' : 'paid',
    };
    
    return payoutResponse as Stripe.Payout;
  }

  private async createBankAccountToken(
    bankDetails: any,
    connectedAccountId: string
  ): Promise<Stripe.BankAccount> {
    // Bank account token creation using Stripe's source API
    // For connected accounts, we create the token directly on the connected account
    
    // Validate required bank details
    if (!bankDetails.bankCountry || !bankDetails.accountNumber) {
      throw new Error("Bank country and account number are required");
    }
    
    // Use Stripe's token API to create a bank account token
    // This is the recommended approach for connected accounts
    const token = await this.stripe.tokens.create(
      {
        bank_account: {
          country: bankDetails.bankCountry,
          currency: bankDetails.currency?.toLowerCase() || "usd",
          account_holder_name: bankDetails.accountName || "",
          account_holder_type: (bankDetails.accountHolderType as "individual" | "company") || "individual",
          account_number: bankDetails.accountNumber,
          routing_number: bankDetails.routingNumber,
        },
      },
      { stripeAccount: connectedAccountId }
    );
    
    // Create a bank account source using the token
    const result = await this.stripe.customers.createSource(
      connectedAccountId,
      { source: token.id },
      { stripeAccount: connectedAccountId }
    );
    
    // Handle different possible result types
    if (result.object === "bank_account") {
      return result;
    }
    
    throw new Error(`Unexpected source type: ${result.object}. Expected bank_account.`);
  }

  private async createRefund(request: PaymentRequest): Promise<Stripe.Refund> {
    // Refund a previous charge by charge ID
    // The chargeId should be provided in the request metadata or referenceId
    const chargeId = request.referenceId || request.metadata?.chargeId;
    
    if (!chargeId) {
      throw new Error(
        "chargeId is required for refunds. Provide referenceId or chargeId in metadata."
      );
    }

    // Create actual refund using Stripe's refund API
    const refund = await this.stripe.refunds.create({
      charge: chargeId,
      amount: Math.round(request.amount * 100), // Optional: partial refund amount in cents
      reason: "requested_by_customer",
      metadata: {
        supplierId: request.supplierId,
        walletId: request.walletId,
      },
    });

    return refund;
  }

  private async createCredit(request: PaymentRequest): Promise<Stripe.Charge> {
    // For credits/adjustments, we need a real Stripe customer ID
    // This should be stored in the supplier's record in the database
    const supplierStripeCustomerId = request.metadata?.supplierStripeCustomerId;
    
    if (!supplierStripeCustomerId) {
      throw new Error(
        "supplierStripeCustomerId is required for credits. " +
        "Register supplier's Stripe customer ID in the system first."
      );
    }
    
    const invoiceItem = await this.stripe.invoiceItems.create({
      customer: supplierStripeCustomerId,
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
    // Partial type for simulated charge response
    const chargeResponse: Partial<Stripe.Charge> = {
      id: invoiceItem.id,
      status: "pending",
    };
    return chargeResponse as Stripe.Charge;
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
          amount: (refund.amount || 0) / 100,
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
      const expectedSignature = createHmac("sha256", this.config.webhookSecret)
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
    
    // Create extended error with additional properties
    interface StripeError extends Error {
      code?: string;
      retriable?: boolean;
      details?: unknown;
    }
    
    const err: StripeError = new Error(message);
    err.code = error.code || error.type;
    err.retriable = this.isRetriable(error);
    err.details = error;

    return err;
  }
}

export default StripePaymentGateway;
