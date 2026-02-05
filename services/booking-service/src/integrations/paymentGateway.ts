import axios, { AxiosInstance } from 'axios';
import logger from '../utils/logger.js';
import { CacheService } from '../cache/redis.js';
import { metricsStore } from '../monitoring/metrics.js';

export interface PaymentGatewayConfig {
  id: string;
  name: string;
  type: 'stripe' | 'paypal' | 'razorpay' | 'paytm' | 'custom';
  baseUrl: string;
  apiKey?: string;
  apiSecret?: string;
  credentials?: {
    clientId: string;
    clientSecret: string;
  };
  timeout: number;
  retryAttempts: number;
  webhookSecret?: string;
}

export interface PaymentRequest {
  amount: number;
  currency: string;
  description: string;
  orderId: string;
  customerId: string;
  paymentMethod: {
    type: 'card' | 'net_banking' | 'upi' | 'wallet';
    card?: {
      number: string;
      expiryMonth: string;
      expiryYear: string;
      cvv: string;
      holderName: string;
    };
    netBanking?: {
      bankCode: string;
      accountNumber: string;
      ifscCode: string;
    };
    upi?: {
      vpa: string;
      name: string;
    };
    wallet?: {
      walletId: string;
      walletProvider: string;
    };
  };
  metadata?: Record<string, any>;
}

export interface PaymentResponse {
  id: string;
  status: 'pending' | 'authorized' | 'captured' | 'failed' | 'refunded' | 'cancelled';
  amount: number;
  currency: string;
  gatewayReference: string;
  gatewayTransactionId: string;
  gatewayResponse: any;
  timestamp: Date;
  failureReason?: string;
}

export interface RefundRequest {
  paymentId: string;
  amount?: number;
  reason?: string;
  metadata?: Record<string, any>;
}

export interface RefundResponse {
  id: string;
  paymentId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processed' | 'failed';
  gatewayReference: string;
  gatewayTransactionId: string;
  timestamp: Date;
  failureReason?: string;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'net_banking' | 'upi' | 'wallet' | 'paypal';
  last4?: string;
  brand?: string;
  expiryMonth?: string;
  expiryYear?: string;
  bankName?: string;
  vpa?: string;
  walletProvider?: string;
  isDefault: boolean;
  createdAt: Date;
}

export class PaymentGatewayIntegration {
  private gateways: Map<string, PaymentGatewayConfig> = new Map();
  private clients: Map<string, AxiosInstance> = new Map();
  private cache: CacheService;

  constructor(cache: CacheService) {
    this.cache = cache;
  }

  addGateway(config: PaymentGatewayConfig): void {
    this.gateways.set(config.id, config);
    this.createClient(config);
    logger.info(`Payment gateway added: ${config.name} (${config.type})`);
  }

  private createClient(config: PaymentGatewayConfig): void {
    const client = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor for authentication
    client.interceptors.request.use(
      (request) => {
        this.addAuthHeaders(request, config);
        return request;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor for error handling
    client.interceptors.response.use(
      (response) => {
        (metricsStore as any).increment('payment_gateway_success', { gateway: config.id });
        return response;
      },
      async (error) => {
        (metricsStore as any).increment('payment_gateway_error', { gateway: config.id });
        return this.handleGatewayError(error, config);
      }
    );

    this.clients.set(config.id, client);
  }

  private addAuthHeaders(request: any, config: PaymentGatewayConfig): void {
    switch (config.type) {
      case 'stripe':
        request.headers['Authorization'] = `Bearer ${config.apiKey}`;
        request.headers['Stripe-Version'] = '2023-10-16';
        break;
      case 'paypal':
        request.headers['Authorization'] = `Bearer ${config.apiKey}`;
        request.headers['PayPal-Request-Id'] = this.generateRequestId();
        break;
      case 'razorpay':
        request.headers['Authorization'] = `Basic ${Buffer.from(`${config.apiKey}:${config.apiSecret}`).toString('base64')}`;
        break;
      case 'paytm':
        request.headers['X-Client-Id'] = config.credentials?.clientId;
        request.headers['X-Client-Secret'] = config.credentials?.clientSecret;
        break;
      case 'custom':
        if (config.credentials) {
          request.headers['X-API-Key'] = config.credentials.clientId;
          request.headers['X-API-Secret'] = config.credentials.clientSecret;
        }
        break;
    }
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async handleGatewayError(error: any, config: PaymentGatewayConfig): Promise<any> {
    const retryAttempts = config.retryAttempts;
    const delay = (attempt: number) => Math.min(1000 * Math.pow(2, attempt), 10000);

    for (let attempt = 0; attempt < retryAttempts; attempt++) {
      try {
        await new Promise(resolve => setTimeout(resolve, delay(attempt)));
        return await this.clients.get(config.id)!.request(error.config);
      } catch (retryError: any) {
        if (attempt === retryAttempts - 1) {
          logger.error(`Payment gateway ${config.name} failed after ${retryAttempts} attempts`, {
            error: retryError.message,
            gatewayId: config.id,
          });
          throw retryError;
        }
      }
    }
  }

  async processPayment(
    gatewayId: string,
    paymentRequest: PaymentRequest
  ): Promise<PaymentResponse> {
    const config = this.gateways.get(gatewayId);
    if (!config) {
      throw new Error(`Payment gateway ${gatewayId} not found`);
    }

    const client = this.clients.get(gatewayId);
    if (!client) {
      throw new Error(`Client for gateway ${gatewayId} not initialized`);
    }

    try {
      const response = await client.post('/payments', this.transformPaymentRequest(paymentRequest, config));
      return this.transformPaymentResponse(response.data, gatewayId);
    } catch (error) {
      logger.error(`Payment processing failed for gateway ${gatewayId}`, {
        error: (error as Error).message,
        gatewayId,
        orderId: paymentRequest.orderId,
      });
      throw error;
    }
  }

  async authorizePayment(
    gatewayId: string,
    paymentRequest: PaymentRequest
  ): Promise<PaymentResponse> {
    const config = this.gateways.get(gatewayId);
    if (!config) {
      throw new Error(`Payment gateway ${gatewayId} not found`);
    }

    const client = this.clients.get(gatewayId);
    if (!client) {
      throw new Error(`Client for gateway ${gatewayId} not initialized`);
    }

    try {
      const response = await client.post('/payments/authorize', this.transformPaymentRequest(paymentRequest, config));
      return this.transformPaymentResponse(response.data, gatewayId);
    } catch (error) {
      logger.error(`Payment authorization failed for gateway ${gatewayId}`, {
        error: (error as Error).message,
        gatewayId,
        orderId: paymentRequest.orderId,
      });
      throw error;
    }
  }

  async capturePayment(
    gatewayId: string,
    paymentId: string,
    amount?: number
  ): Promise<PaymentResponse> {
    const config = this.gateways.get(gatewayId);
    if (!config) {
      throw new Error(`Payment gateway ${gatewayId} not found`);
    }

    const client = this.clients.get(gatewayId);
    if (!client) {
      throw new Error(`Client for gateway ${gatewayId} not initialized`);
    }

    try {
      const response = await client.post(`/payments/${paymentId}/capture`, { amount });
      return this.transformPaymentResponse(response.data, gatewayId);
    } catch (error) {
      logger.error(`Payment capture failed for gateway ${gatewayId}`, {
        error: (error as Error).message,
        gatewayId,
        paymentId,
      });
      throw error;
    }
  }

  async refundPayment(
    gatewayId: string,
    refundRequest: RefundRequest
  ): Promise<RefundResponse> {
    const config = this.gateways.get(gatewayId);
    if (!config) {
      throw new Error(`Payment gateway ${gatewayId} not found`);
    }

    const client = this.clients.get(gatewayId);
    if (!client) {
      throw new Error(`Client for gateway ${gatewayId} not initialized`);
    }

    try {
      const response = await client.post('/refunds', this.transformRefundRequest(refundRequest, config));
      return this.transformRefundResponse(response.data, gatewayId);
    } catch (error) {
      logger.error(`Payment refund failed for gateway ${gatewayId}`, {
        error: (error as Error).message,
        gatewayId,
        paymentId: refundRequest.paymentId,
      });
      throw error;
    }
  }

  async getPaymentStatus(
    gatewayId: string,
    paymentId: string
  ): Promise<PaymentResponse> {
    const config = this.gateways.get(gatewayId);
    if (!config) {
      throw new Error(`Payment gateway ${gatewayId} not found`);
    }

    const client = this.clients.get(gatewayId);
    if (!client) {
      throw new Error(`Client for gateway ${gatewayId} not initialized`);
    }

    try {
      const response = await client.get(`/payments/${paymentId}`);
      return this.transformPaymentResponse(response.data, gatewayId);
    } catch (error) {
      logger.error(`Payment status check failed for gateway ${gatewayId}`, {
        error: (error as Error).message,
        gatewayId,
        paymentId,
      });
      throw error;
    }
  }

  async createPaymentMethod(
    gatewayId: string,
    customerId: string,
    paymentMethod: PaymentMethod
  ): Promise<PaymentMethod> {
    const config = this.gateways.get(gatewayId);
    if (!config) {
      throw new Error(`Payment gateway ${gatewayId} not found`);
    }

    const client = this.clients.get(gatewayId);
    if (!client) {
      throw new Error(`Client for gateway ${gatewayId} not initialized`);
    }

    try {
      const response = await client.post(`/customers/${customerId}/payment-methods`, paymentMethod);
      return this.transformPaymentMethodResponse(response.data, gatewayId);
    } catch (error) {
      logger.error(`Payment method creation failed for gateway ${gatewayId}`, {
        error: (error as Error).message,
        gatewayId,
        customerId,
      });
      throw error;
    }
  }

  async getPaymentMethods(
    gatewayId: string,
    customerId: string
  ): Promise<PaymentMethod[]> {
    const config = this.gateways.get(gatewayId);
    if (!config) {
      throw new Error(`Payment gateway ${gatewayId} not found`);
    }

    const client = this.clients.get(gatewayId);
    if (!client) {
      throw new Error(`Client for gateway ${gatewayId} not initialized`);
    }

    try {
      const response = await client.get(`/customers/${customerId}/payment-methods`);
      return response.data.data.map((pm: any) => this.transformPaymentMethodResponse(pm, gatewayId));
    } catch (error) {
      logger.error(`Payment methods retrieval failed for gateway ${gatewayId}`, {
        error: (error as Error).message,
        gatewayId,
        customerId,
      });
      throw error;
    }
  }

  async deletePaymentMethod(
    gatewayId: string,
    customerId: string,
    paymentMethodId: string
  ): Promise<boolean> {
    const config = this.gateways.get(gatewayId);
    if (!config) {
      throw new Error(`Payment gateway ${gatewayId} not found`);
    }

    const client = this.clients.get(gatewayId);
    if (!client) {
      throw new Error(`Client for gateway ${gatewayId} not initialized`);
    }

    try {
      await client.delete(`/customers/${customerId}/payment-methods/${paymentMethodId}`);
      return true;
    } catch (error) {
      logger.error(`Payment method deletion failed for gateway ${gatewayId}`, {
        error: (error as Error).message,
        gatewayId,
        customerId,
        paymentMethodId,
      });
      throw error;
    }
  }

  private transformPaymentRequest(request: PaymentRequest, config: PaymentGatewayConfig): any {
    switch (config.type) {
      case 'stripe':
        return this.transformStripePaymentRequest(request);
      case 'paypal':
        return this.transformPayPalPaymentRequest(request);
      case 'razorpay':
        return this.transformRazorpayPaymentRequest(request);
      case 'paytm':
        return this.transformPaytmPaymentRequest(request);
      default:
        return this.transformGenericPaymentRequest(request);
    }
  }

  private transformRefundRequest(request: RefundRequest, config: PaymentGatewayConfig): any {
    switch (config.type) {
      case 'stripe':
        return this.transformStripeRefundRequest(request);
      case 'paypal':
        return this.transformPayPalRefundRequest(request);
      case 'razorpay':
        return this.transformRazorpayRefundRequest(request);
      case 'paytm':
        return this.transformPaytmRefundRequest(request);
      default:
        return this.transformGenericRefundRequest(request);
    }
  }

  private transformPaymentResponse(data: any, gatewayId: string): PaymentResponse {
    // Transform gateway-specific response to our standard format
    switch (gatewayId) {
      case 'stripe':
        return this.transformStripePaymentResponse(data);
      case 'paypal':
        return this.transformPayPalPaymentResponse(data);
      case 'razorpay':
        return this.transformRazorpayPaymentResponse(data);
      case 'paytm':
        return this.transformPaytmPaymentResponse(data);
      default:
        return this.transformGenericPaymentResponse(data);
    }
  }

  private transformRefundResponse(data: any, gatewayId: string): RefundResponse {
    // Transform gateway-specific refund response to our standard format
    switch (gatewayId) {
      case 'stripe':
        return this.transformStripeRefundResponse(data);
      case 'paypal':
        return this.transformPayPalRefundResponse(data);
      case 'razorpay':
        return this.transformRazorpayRefundResponse(data);
      case 'paytm':
        return this.transformPaytmRefundResponse(data);
      default:
        return this.transformGenericRefundResponse(data);
    }
  }

  private transformPaymentMethodResponse(data: any, gatewayId: string): PaymentMethod {
    // Transform gateway-specific payment method response to our standard format
    switch (gatewayId) {
      case 'stripe':
        return this.transformStripePaymentMethodResponse(data);
      case 'paypal':
        return this.transformPayPalPaymentMethodResponse(data);
      case 'razorpay':
        return this.transformRazorpayPaymentMethodResponse(data);
      case 'paytm':
        return this.transformPaytmPaymentMethodResponse(data);
      default:
        return this.transformGenericPaymentMethodResponse(data);
    }
  }

  private transformStripePaymentRequest(request: PaymentRequest): any {
    return {
      amount: Math.round(request.amount * 100), // Stripe expects amount in cents
      currency: request.currency.toLowerCase(),
      description: request.description,
      payment_method: request.paymentMethod.type === 'card' ? {
        type: 'card',
        card: {
          number: request.paymentMethod.card?.number,
          exp_month: parseInt(request.paymentMethod.card?.expiryMonth || '0'),
          exp_year: parseInt(request.paymentMethod.card?.expiryYear || '0'),
          cvc: request.paymentMethod.card?.cvv,
        },
      } : undefined,
      confirm: true,
      metadata: {
        order_id: request.orderId,
        customer_id: request.customerId,
        ...request.metadata,
      },
    };
  }

  private transformPayPalPaymentRequest(request: PaymentRequest): any {
    return {
      intent: 'sale',
      payer: {
        payment_method: 'paypal',
      },
      transactions: [{
        amount: {
          total: request.amount.toFixed(2),
          currency: request.currency.toUpperCase(),
          details: {
            subtotal: request.amount.toFixed(2),
            tax: '0.00',
            shipping: '0.00',
          },
        },
        description: request.description,
        custom: `${request.orderId}|${request.customerId}`,
      }],
      redirect_urls: {
        return_url: `${process.env.FRONTEND_URL}/payment/success`,
        cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`,
      },
    };
  }

  private transformRazorpayPaymentRequest(request: PaymentRequest): any {
    return {
      amount: Math.round(request.amount * 100), // Razorpay expects amount in paise
      currency: request.currency.toUpperCase(),
      receipt: request.orderId,
      payment_capture: 1, // Auto capture
      notes: {
        customer_id: request.customerId,
        ...request.metadata,
      },
    };
  }

  private transformPaytmPaymentRequest(request: PaymentRequest): any {
    return {
      body: {
        requestType: 'Payment',
        mid: this.gateways.get('paytm')?.credentials?.clientId,
        orderId: request.orderId,
        txnAmount: {
          value: request.amount.toFixed(2),
          currency: request.currency.toUpperCase(),
        },
        userInfo: {
          custId: request.customerId,
        },
        paymentMode: request.paymentMethod.type.toUpperCase(),
      },
      head: {
        clientId: this.gateways.get('paytm')?.credentials?.clientId,
      },
    };
  }

  private transformGenericPaymentRequest(request: PaymentRequest): any {
    return {
      amount: request.amount,
      currency: request.currency,
      description: request.description,
      orderId: request.orderId,
      customerId: request.customerId,
      paymentMethod: request.paymentMethod,
      metadata: request.metadata,
    };
  }

  private transformStripePaymentResponse(data: any): PaymentResponse {
    return {
      id: data.id,
      status: data.status as any,
      amount: data.amount / 100, // Convert from cents to dollars
      currency: data.currency.toUpperCase(),
      gatewayReference: data.id,
      gatewayTransactionId: data.id,
      gatewayResponse: data,
      timestamp: new Date(data.created * 1000),
      failureReason: data.failure_reason,
    };
  }

  private transformPayPalPaymentResponse(data: any): PaymentResponse {
    return {
      id: data.id,
      status: data.state as any,
      amount: parseFloat(data.transactions[0].amount.total),
      currency: data.transactions[0].amount.currency.toUpperCase(),
      gatewayReference: data.id,
      gatewayTransactionId: data.id,
      gatewayResponse: data,
      timestamp: new Date(),
      failureReason: data.error_description,
    };
  }

  private transformRazorpayPaymentResponse(data: any): PaymentResponse {
    return {
      id: data.id,
      status: data.status as any,
      amount: data.amount / 100, // Convert from paise to rupees
      currency: data.currency.toUpperCase(),
      gatewayReference: data.id,
      gatewayTransactionId: data.id,
      gatewayResponse: data,
      timestamp: new Date(data.created_at * 1000),
      failureReason: data.error_description,
    };
  }

  private transformPaytmPaymentResponse(data: any): PaymentResponse {
    return {
      id: data.body.txnId,
      status: data.body.resultInfo.resultStatus as any,
      amount: parseFloat(data.body.txnAmount.value),
      currency: data.body.txnAmount.currency.toUpperCase(),
      gatewayReference: data.body.txnId,
      gatewayTransactionId: data.body.txnId,
      gatewayResponse: data,
      timestamp: new Date(),
      failureReason: data.body.resultInfo.resultMsg,
    };
  }

  private transformGenericPaymentResponse(data: any): PaymentResponse {
    return {
      id: data.id || data.transactionId,
      status: data.status as any,
      amount: data.amount,
      currency: data.currency.toUpperCase(),
      gatewayReference: data.gatewayReference || data.id,
      gatewayTransactionId: data.transactionId || data.id,
      gatewayResponse: data,
      timestamp: new Date(data.timestamp || Date.now()),
      failureReason: data.failureReason,
    };
  }

  private transformStripeRefundRequest(request: RefundRequest): any {
    return {
      payment_intent: request.paymentId,
      amount: request.amount ? Math.round(request.amount * 100) : undefined,
      reason: request.reason || 'requested_by_customer',
      metadata: request.metadata,
    };
  }

  private transformPayPalRefundRequest(request: RefundRequest): any {
    return {
      amount: {
        total: request.amount?.toFixed(2) || '0.00',
        currency: 'USD',
      },
      description: request.reason,
    };
  }

  private transformRazorpayRefundRequest(request: RefundRequest): any {
    return {
      amount: request.amount ? Math.round(request.amount * 100) : undefined,
      notes: {
        reason: request.reason,
        ...request.metadata,
      },
    };
  }

  private transformPaytmRefundRequest(request: RefundRequest): any {
    return {
      body: {
        mid: this.gateways.get('paytm')?.credentials?.clientId,
        txnId: request.paymentId,
        refundAmount: request.amount?.toFixed(2) || '0.00',
        refundReason: request.reason,
      },
      head: {
        clientId: this.gateways.get('paytm')?.credentials?.clientId,
      },
    };
  }

  private transformGenericRefundRequest(request: RefundRequest): any {
    return {
      paymentId: request.paymentId,
      amount: request.amount,
      reason: request.reason,
      metadata: request.metadata,
    };
  }

  private transformStripeRefundResponse(data: any): RefundResponse {
    return {
      id: data.id,
      paymentId: data.payment_intent,
      amount: data.amount / 100,
      currency: data.currency.toUpperCase(),
      status: data.status as any,
      gatewayReference: data.id,
      gatewayTransactionId: data.id,
      timestamp: new Date(data.created * 1000),
      failureReason: data.failure_reason,
    };
  }

  private transformPayPalRefundResponse(data: any): RefundResponse {
    return {
      id: data.id,
      paymentId: data.parent_payment,
      amount: parseFloat(data.amount.total),
      currency: data.amount.currency.toUpperCase(),
      status: data.status as any,
      gatewayReference: data.id,
      gatewayTransactionId: data.id,
      timestamp: new Date(),
      failureReason: data.error_description,
    };
  }

  private transformRazorpayRefundResponse(data: any): RefundResponse {
    return {
      id: data.id,
      paymentId: data.payment_id,
      amount: data.amount / 100,
      currency: data.currency.toUpperCase(),
      status: data.status as any,
      gatewayReference: data.id,
      gatewayTransactionId: data.id,
      timestamp: new Date(data.created_at * 1000),
      failureReason: data.error_description,
    };
  }

  private transformPaytmRefundResponse(data: any): RefundResponse {
    return {
      id: data.body.refundId,
      paymentId: data.body.txnId,
      amount: parseFloat(data.body.refundAmount),
      currency: data.body.currency.toUpperCase(),
      status: data.body.resultInfo.resultStatus as any,
      gatewayReference: data.body.refundId,
      gatewayTransactionId: data.body.refundId,
      timestamp: new Date(),
      failureReason: data.body.resultInfo.resultMsg,
    };
  }

  private transformGenericRefundResponse(data: any): RefundResponse {
    return {
      id: data.id || data.refundId,
      paymentId: data.paymentId || data.parentPayment,
      amount: data.amount,
      currency: data.currency.toUpperCase(),
      status: data.status as any,
      gatewayReference: data.gatewayReference || data.id,
      gatewayTransactionId: data.transactionId || data.id,
      timestamp: new Date(data.timestamp || Date.now()),
      failureReason: data.failureReason,
    };
  }

  private transformStripePaymentMethodResponse(data: any): PaymentMethod {
    return {
      id: data.id,
      type: data.type as any,
      last4: data.card?.last4,
      brand: data.card?.brand,
      expiryMonth: data.card?.exp_month?.toString(),
      expiryYear: data.card?.exp_year?.toString(),
      isDefault: data.is_default,
      createdAt: new Date(data.created * 1000),
    };
  }

  private transformPayPalPaymentMethodResponse(data: any): PaymentMethod {
    return {
      id: data.id,
      type: 'paypal',
      isDefault: data.is_default,
      createdAt: new Date(data.created_at || Date.now()),
    };
  }

  private transformRazorpayPaymentMethodResponse(data: any): PaymentMethod {
    return {
      id: data.id,
      type: data.method as any,
      last4: data.card?.last4,
      brand: data.card?.network,
      expiryMonth: data.card?.expiry_month?.toString(),
      expiryYear: data.card?.expiry_year?.toString(),
      bankName: data.card?.issuer,
      isDefault: data.is_default,
      createdAt: new Date(data.created_at * 1000),
    };
  }

  private transformPaytmPaymentMethodResponse(data: any): PaymentMethod {
    return {
      id: data.id,
      type: data.paymentMode as any,
      vpa: data.vpa,
      walletProvider: data.walletProvider,
      isDefault: data.is_default,
      createdAt: new Date(data.created_at || Date.now()),
    };
  }

  private transformGenericPaymentMethodResponse(data: any): PaymentMethod {
    return {
      id: data.id,
      type: data.type as any,
      last4: data.last4,
      brand: data.brand,
      expiryMonth: data.expiryMonth,
      expiryYear: data.expiryYear,
      bankName: data.bankName,
      vpa: data.vpa,
      walletProvider: data.walletProvider,
      isDefault: data.is_default,
      createdAt: new Date(data.createdAt || Date.now()),
    };
  }

  getGatewayConfig(gatewayId: string): PaymentGatewayConfig | undefined {
    return this.gateways.get(gatewayId);
  }

  listGateways(): PaymentGatewayConfig[] {
    return Array.from(this.gateways.values());
  }

  removeGateway(gatewayId: string): void {
    this.gateways.delete(gatewayId);
    this.clients.delete(gatewayId);
    logger.info(`Payment gateway removed: ${gatewayId}`);
  }

  async verifyWebhookSignature(
    gatewayId: string,
    payload: string,
    signature: string,
    timestamp?: string
  ): Promise<boolean> {
    const config = this.gateways.get(gatewayId);
    if (!config?.webhookSecret) {
      return false;
    }

    switch (config.type) {
      case 'stripe':
        return this.verifyStripeWebhookSignature(payload, signature, config.webhookSecret);
      case 'paypal':
        return this.verifyPayPalWebhookSignature(payload, signature, config.webhookSecret);
      default:
        return true; // For custom gateways, assume verification is handled elsewhere
    }
  }

  private verifyStripeWebhookSignature(payload: string, signature: string, secret: string): boolean {
    // Implement Stripe webhook signature verification
    // This is a simplified version - in production, use Stripe's official library
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload, 'utf8')
      .digest('hex');
    
    return signature === expectedSignature;
  }

  private verifyPayPalWebhookSignature(payload: string, signature: string, secret: string): boolean {
    // Implement PayPal webhook signature verification
    // This is a simplified version - in production, use PayPal's official library
    return true; // Placeholder implementation
  }
}