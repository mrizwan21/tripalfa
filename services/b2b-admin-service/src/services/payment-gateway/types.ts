/**
 * Payment Gateway Types & Interfaces
 * Abstracts payment gateway implementation details
 */

export interface PaymentRequest {
  supplierId: string;
  walletId: string;
  amount: number;
  currency: string;
  type: "payout" | "refund" | "adjustment";
  method: "bank_transfer" | "check" | "credit" | "cryptocurrency";
  referenceId?: string;
  description?: string;
  bankDetails?: BankDetails;
  metadata?: Record<string, any>;
}

export interface BankDetails {
  accountName: string;
  accountNumber: string;
  routingNumber?: string;
  swiftCode?: string;
  ibanCode?: string;
  bankName: string;
  bankCountry: string;
}

export interface PaymentResponse {
  transactionId: string;
  status: "pending" | "processing" | "completed" | "failed";
  amount: number;
  currency: string;
  gateway: string;
  processingTime?: number; // milliseconds
  metadata?: Record<string, any>;
}

export interface PaymentWebhook {
  id: string;
  type: string; // charge.succeeded, charge.failed, etc.
  data: Record<string, any>;
  timestamp: Date;
  signature?: string;
}

export interface RetryPolicy {
  maxRetries: number;
  initialDelay: number; // milliseconds
  maxDelay: number;
  backoffMultiplier: number;
}

export interface PaymentError {
  code: string;
  message: string;
  gateway: string;
  retriable: boolean;
  details?: Record<string, any>;
}

export interface IPaymentGateway {
  /**
   * Initialize gateway with credentials
   */
  initialize(): Promise<void>;

  /**
   * Process a payment
   */
  processPayment(request: PaymentRequest): Promise<PaymentResponse>;

  /**
   * Verify webhook signature and parse webhook data
   */
  verifyWebhook(payload: any, signature: string): boolean;

  /**
   * Parse webhook data
   */
  parseWebhook(payload: any): PaymentWebhook;

  /**
   * Retrieve payment status
   */
  getPaymentStatus(transactionId: string): Promise<PaymentResponse>;

  /**
   * Cancel/refund a payment
   */
  cancelPayment(
    transactionId: string,
    reason?: string
  ): Promise<PaymentResponse>;

  /**
   * Check if error is retriable
   */
  isRetriable(error: any): boolean;
}

export interface PaymentGatewayConfig {
  provider: "stripe" | "paypal" | "wise";
  apiKey: string;
  secretKey?: string;
  webhookSecret?: string;
  testMode?: boolean;
  timeout?: number;
}
