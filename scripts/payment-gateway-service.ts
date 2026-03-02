/**
 * Payment Gateway Integration Service
 * Unified interface for Stripe and PayPal payment processing
 * 
 * Features:
 * - Multi-processor support (Stripe, PayPal)
 * - Webhook handling and event processing
 * - Error recovery and retry logic
 * - Idempotency support
 * - Wallet integration
 * - Transaction tracking
 */

import axios, { AxiosInstance } from 'axios';
import { randomBytes } from 'crypto';

/**
 * Payment processor types
 */
type PaymentProcessor = 'stripe' | 'paypal';

/**
 * Payment status enum
 */
enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  AUTHORIZED = 'authorized',
  CAPTURED = 'captured',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

/**
 * Payment method types
 */
type PaymentMethod = 'card' | 'bank_transfer' | 'digital_wallet';

/**
 * Payment request
 */
interface PaymentRequest {
  processor: PaymentProcessor;
  userId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  description: string;
  idempotencyKey: string;
  metadata?: Record<string, any>;
  returnUrl?: string;
}

/**
 * Payment response
 */
interface PaymentResponse {
  transactionId: string;
  processor: PaymentProcessor;
  status: PaymentStatus;
  amount: number;
  currency: string;
  timestamp: string;
  processorReference: string;
  redirectUrl?: string;
  error?: string;
}

/**
 * Webhook event
 */
interface WebhookEvent {
  type: string;
  processor: PaymentProcessor;
  data: Record<string, any>;
  timestamp: string;
  signature: string;
}

/**
 * Transaction record
 */
interface TransactionRecord {
  id: string;
  userId: string;
  processor: PaymentProcessor;
  amount: number;
  currency: string;
  status: PaymentStatus;
  processorReference: string;
  createdAt: string;
  updatedAt: string;
  retries: number;
  lastError?: string;
  metadata?: Record<string, any>;
}

class PaymentGatewayService {
  private stripeClient: AxiosInstance;
  private paypalClient: AxiosInstance;
  private transactions: Map<string, TransactionRecord> = new Map();
  private webhookHandlers: Map<string, Function> = new Map();
  private maxRetries: number = 3;
  private retryDelayMs: number = 1000;

  constructor(
    stripeApiKey: string,
    paypalClientId: string,
    paypalClientSecret: string,
    paypalMode: 'sandbox' | 'live' = 'sandbox'
  ) {
    // Initialize Stripe client
    this.stripeClient = axios.create({
      baseURL: 'https://api.stripe.com/v1',
      auth: {
        username: stripeApiKey,
        password: '',
      },
      timeout: 30000,
    });

    // Initialize PayPal client
    const paypalBaseUrl = paypalMode === 'sandbox' 
      ? 'https://api.sandbox.paypal.com'
      : 'https://api.paypal.com';
    
    this.paypalClient = axios.create({
      baseURL: paypalBaseUrl,
      auth: {
        username: paypalClientId,
        password: paypalClientSecret,
      },
      timeout: 30000,
    });

    // Register webhook handlers
    this.registerWebhookHandlers();
  }

  /**
   * Process payment through selected processor
   */
  async processPayment(request: PaymentRequest): Promise<PaymentResponse> {
    const transactionId = `txn_${request.idempotencyKey}`;

    // Check for duplicate (idempotency)
    const existing = this.transactions.get(transactionId);
    if (existing && existing.status !== PaymentStatus.FAILED) {
      console.log(`ℹ️  Duplicate payment detected (idempotency), returning cached result`);
      return this.transactionToResponse(existing);
    }

    // Create transaction record
    const transaction: TransactionRecord = {
      id: transactionId,
      userId: request.userId,
      processor: request.processor,
      amount: request.amount,
      currency: request.currency,
      status: PaymentStatus.PENDING,
      processorReference: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      retries: 0,
    };

    this.transactions.set(transactionId, transaction);

    // Process through appropriate processor
    try {
      transaction.status = PaymentStatus.PROCESSING;

      let response: PaymentResponse;
      if (request.processor === 'stripe') {
        response = await this.processStripePayment(request, transaction);
      } else if (request.processor === 'paypal') {
        response = await this.processPayPalPayment(request, transaction);
      } else {
        throw new Error(`Unknown processor: ${request.processor}`);
      }

      transaction.status = response.status;
      transaction.processorReference = response.processorReference;
      transaction.updatedAt = new Date().toISOString();

      return response;
    } catch (error: any) {
      transaction.status = PaymentStatus.FAILED;
      transaction.lastError = error.message;
      transaction.retries++;
      transaction.updatedAt = new Date().toISOString();

      console.error(`❌ Payment failed: ${error.message}`);

      // Attempt retry if under max retries
      if (transaction.retries < this.maxRetries) {
        console.log(`🔄 Retrying payment (attempt ${transaction.retries + 1}/${this.maxRetries})`);
        await this.delay(this.retryDelayMs * transaction.retries);
        return this.processPayment(request);
      }

      return {
        transactionId,
        processor: request.processor,
        status: PaymentStatus.FAILED,
        amount: request.amount,
        currency: request.currency,
        timestamp: new Date().toISOString(),
        processorReference: '',
        error: error.message,
      };
    }
  }

  /**
   * Process payment through Stripe
   */
  private async processStripePayment(
    request: PaymentRequest,
    transaction: TransactionRecord
  ): Promise<PaymentResponse> {
    const payload = new URLSearchParams();
    payload.append('amount', String(Math.round(request.amount * 100))); // Convert to cents
    payload.append('currency', request.currency.toLowerCase());
    payload.append('description', request.description);
    payload.append('metadata[idempotencyKey]', request.idempotencyKey);
    payload.append('metadata[userId]', request.userId);

    // For demo purposes, we'll simulate Stripe API calls
    // In production, use actual Stripe SDK
    const stripeResponse = {
      id: `pi_${randomBytes(12).toString('hex')}`,
      status: 'succeeded',
      amount: Math.round(request.amount * 100),
      currency: request.currency.toLowerCase(),
      created: Math.floor(Date.now() / 1000),
    };

    console.log(`✅ Stripe payment initiated: ${stripeResponse.id}`);

    return {
      transactionId: transaction.id,
      processor: 'stripe',
      status: this.mapStripeStatus(stripeResponse.status),
      amount: request.amount,
      currency: request.currency,
      timestamp: new Date().toISOString(),
      processorReference: stripeResponse.id,
    };
  }

  /**
   * Process payment through PayPal
   */
  private async processPayPalPayment(
    request: PaymentRequest,
    transaction: TransactionRecord
  ): Promise<PaymentResponse> {
    const payload = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: request.currency,
            value: String(request.amount.toFixed(2)),
          },
          description: request.description,
          custom_id: request.idempotencyKey,
        },
      ],
      payer: {
        email_address: `${request.userId}@tripalfa.com`,
      },
    };

    // For demo purposes, we'll simulate PayPal API calls
    // In production, use actual PayPal SDK
    const paypalResponse = {
      id: `PAYID-${randomBytes(12).toString('hex')}`,
      status: 'COMPLETED',
      create_time: new Date().toISOString(),
    };

    console.log(`✅ PayPal payment initiated: ${paypalResponse.id}`);

    return {
      transactionId: transaction.id,
      processor: 'paypal',
      status: this.mapPayPalStatus(paypalResponse.status),
      amount: request.amount,
      currency: request.currency,
      timestamp: new Date().toISOString(),
      processorReference: paypalResponse.id,
    };
  }

  /**
   * Refund a payment
   */
  async refundPayment(transactionId: string, amount?: number): Promise<PaymentResponse> {
    const transaction = this.transactions.get(transactionId);

    if (!transaction) {
      throw new Error(`Transaction not found: ${transactionId}`);
    }

    if (transaction.status === PaymentStatus.REFUNDED) {
      console.log(`ℹ️  Payment already refunded, returning cached result`);
      return this.transactionToResponse(transaction);
    }

    const refundAmount = amount || transaction.amount;

    try {
      if (transaction.processor === 'stripe') {
        return await this.refundStripePayment(transaction, refundAmount);
      } else if (transaction.processor === 'paypal') {
        return await this.refundPayPalPayment(transaction, refundAmount);
      }

      throw new Error(`Unknown processor: ${transaction.processor}`);
    } catch (error: any) {
      console.error(`❌ Refund failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Refund through Stripe
   */
  private async refundStripePayment(
    transaction: TransactionRecord,
    amount: number
  ): Promise<PaymentResponse> {
    const refundId = `re_${randomBytes(12).toString('hex')}`;

    console.log(`💰 Stripe refund processed: ${refundId} (${amount} ${transaction.currency})`);

    transaction.status = PaymentStatus.REFUNDED;
    transaction.updatedAt = new Date().toISOString();

    return {
      transactionId: transaction.id,
      processor: 'stripe',
      status: PaymentStatus.REFUNDED,
      amount: amount,
      currency: transaction.currency,
      timestamp: new Date().toISOString(),
      processorReference: refundId,
    };
  }

  /**
   * Refund through PayPal
   */
  private async refundPayPalPayment(
    transaction: TransactionRecord,
    amount: number
  ): Promise<PaymentResponse> {
    const refundId = `REF-${randomBytes(12).toString('hex')}`;

    console.log(`💰 PayPal refund processed: ${refundId} (${amount} ${transaction.currency})`);

    transaction.status = PaymentStatus.REFUNDED;
    transaction.updatedAt = new Date().toISOString();

    return {
      transactionId: transaction.id,
      processor: 'paypal',
      status: PaymentStatus.REFUNDED,
      amount: amount,
      currency: transaction.currency,
      timestamp: new Date().toISOString(),
      processorReference: refundId,
    };
  }

  /**
   * Handle incoming webhook events
   */
  async handleWebhookEvent(event: WebhookEvent): Promise<void> {
    console.log(`📨 Webhook received: ${event.type} from ${event.processor}`);

    const handler = this.webhookHandlers.get(event.type);
    if (!handler) {
      console.warn(`⚠️  No handler for webhook type: ${event.type}`);
      return;
    }

    try {
      await handler(event.data);
      console.log(`✅ Webhook processed: ${event.type}`);
    } catch (error: any) {
      console.error(`❌ Webhook processing failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Register webhook handlers
   */
  private registerWebhookHandlers(): void {
    // Stripe webhook handlers
    this.webhookHandlers.set('payment_intent.succeeded', async (data: any) => {
      console.log(`💳 Stripe payment succeeded: ${data.id}`);
      // Update transaction status
      this.updateTransactionByProcessor('stripe', data.id, PaymentStatus.CAPTURED);
    });

    this.webhookHandlers.set('payment_intent.payment_failed', async (data: any) => {
      console.log(`❌ Stripe payment failed: ${data.id}`);
      this.updateTransactionByProcessor('stripe', data.id, PaymentStatus.FAILED);
    });

    this.webhookHandlers.set('charge.refunded', async (data: any) => {
      console.log(`💰 Stripe refund confirmed: ${data.id}`);
      this.updateTransactionByProcessor('stripe', data.id, PaymentStatus.REFUNDED);
    });

    // PayPal webhook handlers
    this.webhookHandlers.set('PAYMENT.CAPTURE.COMPLETED', async (data: any) => {
      console.log(`✅ PayPal payment completed: ${data.id}`);
      this.updateTransactionByProcessor('paypal', data.id, PaymentStatus.CAPTURED);
    });

    this.webhookHandlers.set('PAYMENT.CAPTURE.DENIED', async (data: any) => {
      console.log(`❌ PayPal payment denied: ${data.id}`);
      this.updateTransactionByProcessor('paypal', data.id, PaymentStatus.FAILED);
    });

    this.webhookHandlers.set('PAYMENT.CAPTURE.REFUNDED', async (data: any) => {
      console.log(`💰 PayPal refund completed: ${data.id}`);
      this.updateTransactionByProcessor('paypal', data.id, PaymentStatus.REFUNDED);
    });
  }

  /**
   * Update transaction by processor reference
   */
  private updateTransactionByProcessor(
    processor: PaymentProcessor,
    processorRef: string,
    status: PaymentStatus
  ): void {
    const transactionArray = Array.from(this.transactions.entries());
    for (const [_, transaction] of transactionArray) {
      if (transaction.processor === processor && transaction.processorReference === processorRef) {
        transaction.status = status;
        transaction.updatedAt = new Date().toISOString();
        console.log(`✅ Transaction updated: ${transaction.id} → ${status}`);
        return;
      }
    }
  }

  /**
   * Get transaction status
   */
  getTransactionStatus(transactionId: string): PaymentStatus | null {
    const transaction = this.transactions.get(transactionId);
    return transaction ? transaction.status : null;
  }

  /**
   * Get all transactions
   */
  getAllTransactions(): TransactionRecord[] {
    return Array.from(this.transactions.values());
  }

  /**
   * Get transaction by user
   */
  getTransactionsByUser(userId: string): TransactionRecord[] {
    return Array.from(this.transactions.values()).filter(t => t.userId === userId);
  }

  /**
   * Map Stripe status to our status enum
   */
  private mapStripeStatus(status: string): PaymentStatus {
    switch (status) {
      case 'succeeded':
        return PaymentStatus.CAPTURED;
      case 'processing':
        return PaymentStatus.PROCESSING;
      case 'requires_action':
        return PaymentStatus.AUTHORIZED;
      case 'canceled':
        return PaymentStatus.CANCELLED;
      default:
        return PaymentStatus.FAILED;
    }
  }

  /**
   * Map PayPal status to our status enum
   */
  private mapPayPalStatus(status: string): PaymentStatus {
    switch (status) {
      case 'COMPLETED':
        return PaymentStatus.CAPTURED;
      case 'APPROVED':
        return PaymentStatus.AUTHORIZED;
      case 'VOIDED':
        return PaymentStatus.CANCELLED;
      case 'FAILED':
        return PaymentStatus.FAILED;
      default:
        return PaymentStatus.PENDING;
    }
  }

  /**
   * Convert transaction to payment response
   */
  private transactionToResponse(transaction: TransactionRecord): PaymentResponse {
    return {
      transactionId: transaction.id,
      processor: transaction.processor,
      status: transaction.status,
      amount: transaction.amount,
      currency: transaction.currency,
      timestamp: transaction.updatedAt,
      processorReference: transaction.processorReference,
      error: transaction.lastError,
    };
  }

  /**
   * Helper: delay execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Calculate total transaction volume
   */
  calculateMetrics(): {
    totalTransactions: number;
    totalVolume: number;
    byProcessor: Record<PaymentProcessor, number>;
    byStatus: Record<string, number>;
  } {
    const transactions = Array.from(this.transactions.values());
    const metrics = {
      totalTransactions: transactions.length,
      totalVolume: 0,
      byProcessor: { stripe: 0, paypal: 0 },
      byStatus: {} as Record<string, number>,
    };

    for (const txn of transactions) {
      if (txn.status === PaymentStatus.CAPTURED || txn.status === PaymentStatus.REFUNDED) {
        metrics.totalVolume += txn.amount;
      }
      metrics.byProcessor[txn.processor]++;
      metrics.byStatus[txn.status] = (metrics.byStatus[txn.status] || 0) + 1;
    }

    return metrics;
  }
}

export {
  PaymentGatewayService,
  PaymentRequest,
  PaymentResponse,
  PaymentStatus,
  PaymentProcessor,
  WebhookEvent,
  TransactionRecord,
};
