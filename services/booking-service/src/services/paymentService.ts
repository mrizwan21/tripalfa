import { v4 as uuidv4 } from 'uuid';

interface PaymentRecord {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  method: 'balance' | 'card';
  reference: string;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface PaymentGatewayConfig {
  type: 'stripe' | 'paypal' | 'balance' | 'bank_transfer';
  apiKey?: string;
  enabled: boolean;
}

class PaymentService {
  private paymentRecords: Map<string, PaymentRecord> = new Map();
  private paymentGateways: Map<string, PaymentGatewayConfig> = new Map([
    ['balance', { type: 'balance', enabled: true }],
    ['card', { type: 'bank_transfer', enabled: true }],
    ['stripe', { type: 'stripe', enabled: false }],
    ['paypal', { type: 'paypal', enabled: false }]
  ]);

  /**
   * Process payment for hold order
   */
  async processPayment(
    orderId: string,
    amount: number,
    currency: string,
    method: 'balance' | 'card' = 'balance'
  ): Promise<PaymentRecord> {
    try {
      const paymentId = uuidv4();

      // Validate inputs
      if (!orderId || amount <= 0 || !currency) {
        throw new Error('Invalid payment parameters');
      }

      // Check if gateway is enabled
      const gateway = this.paymentGateways.get(method);
      if (!gateway?.enabled) {
        throw new Error(`Payment method ${method} is not enabled`);
      }

      const record: PaymentRecord = {
        id: paymentId,
        orderId,
        amount,
        currency,
        status: 'pending',
        method,
        reference: `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Simulate payment processing based on method
      switch (method) {
        case 'balance':
          record.status = await this.processBalancePayment(orderId, amount, currency);
          break;
        case 'card':
          record.status = await this.processCardPayment(orderId, amount, currency);
          break;
        default:
          throw new Error(`Unknown payment method: ${method}`);
      }

      record.updatedAt = new Date();
      this.paymentRecords.set(paymentId, record);

      return record;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Payment processing failed: ${errorMsg}`);
    }
  }

  /**
   * Process balance/wallet payment
   */
  private async processBalancePayment(
    orderId: string,
    amount: number,
    currency: string
  ): Promise<'completed' | 'failed'> {
    // Simulate balance check and deduction
    // In production, this would verify wallet balance and deduct funds
    try {
      // Simulate wallet check (90% success rate for demo)
      if (Math.random() > 0.1) {
        return 'completed';
      } else {
        throw new Error('Insufficient balance');
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Process card payment
   */
  private async processCardPayment(
    orderId: string,
    amount: number,
    currency: string
  ): Promise<'completed' | 'failed'> {
    // In production, this would integrate with Stripe or other payment gateway
    // For now, simulate successful payment
    return 'completed';
  }

  /**
   * Get payment details
   */
  async getPaymentDetails(paymentId: string): Promise<PaymentRecord | null> {
    return this.paymentRecords.get(paymentId) || null;
  }

  /**
   * List payments for an order
   */
  async getOrderPayments(orderId: string): Promise<PaymentRecord[]> {
    const payments: PaymentRecord[] = [];
    this.paymentRecords.forEach(record => {
      if (record.orderId === orderId) {
        payments.push(record);
      }
    });
    return payments;
  }

  /**
   * Refund payment
   */
  async refundPayment(paymentId: string, reason?: string): Promise<{
    success: boolean;
    refundId: string;
    message: string;
  }> {
    const payment = this.paymentRecords.get(paymentId);
    if (!payment) {
      throw new Error(`Payment ${paymentId} not found`);
    }

    if (payment.status !== 'completed') {
      throw new Error(`Cannot refund payment with status: ${payment.status}`);
    }

    const refundId = `REF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    payment.status = 'cancelled';
    payment.updatedAt = new Date();

    return {
      success: true,
      refundId,
      message: `Refund initiated for payment ${paymentId}. Reason: ${reason || 'No reason provided'}`
    };
  }

  /**
   * Get payment statistics
   */
  async getPaymentStats(): Promise<{
    totalPayments: number;
    completedAmount: number;
    failedAmount: number;
    averagePaymentValue: number;
  }> {
    let completed = 0;
    let failed = 0;
    let total = 0;

    this.paymentRecords.forEach(record => {
      total += record.amount;
      if (record.status === 'completed') {
        completed += record.amount;
      } else if (record.status === 'failed') {
        failed += record.amount;
      }
    });

    return {
      totalPayments: this.paymentRecords.size,
      completedAmount: completed,
      failedAmount: failed,
      averagePaymentValue: this.paymentRecords.size > 0 ? total / this.paymentRecords.size : 0
    };
  }

  /**
   * Enable/disable payment gateway
   */
  setGatewayStatus(gateway: string, enabled: boolean): void {
    const config = this.paymentGateways.get(gateway);
    if (config) {
      config.enabled = enabled;
    }
  }

  /**
   * Get payment methods status
   */
  getAvailablePaymentMethods(): string[] {
    const available: string[] = [];
    this.paymentGateways.forEach((config, key) => {
      if (config.enabled) {
        available.push(key);
      }
    });
    return available;
  }
}

export default new PaymentService();
