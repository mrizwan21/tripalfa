import { v4 as uuidv4 } from 'uuid';

/**
 * Wallet Service
 * Handles wallet operations:
 * 1. Wallet balance management
 * 2. Top-ups with credit card
 * 3. Credit card surcharge calculation
 * 4. Wallet transaction history
 * 5. Wallet debit on booking confirmation
 */

interface WalletAccount {
  customerId: string;
  balance: number;
  currency: string;
  lastTopUp?: Date;
  totalTopUps: number;
  totalDebits: number;
  createdAt: Date;
  updatedAt: Date;
}

interface WalletTransaction {
  id: string;
  customerId: string;
  type: 'credit' | 'debit';
  amount: number;
  surcharge?: number;
  totalAmount?: number;
  currency: string;
  description: string;
  paymentMethod?: string;
  reference?: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: Date;
}

interface TopUpRequest {
  customerId: string;
  amount: number;
  currency: string;
  paymentMethod: 'card' | 'bank_transfer' | 'crypto';
  cardDetails?: {
    last4: string;
    brand: string;
    expiryMonth: number;
    expiryYear: number;
  };
}

interface TopUpResponse {
  success: boolean;
  transactionId: string;
  customerId: string;
  topUpAmount: number;
  surcharge: number;
  totalDebit: number;
  newBalance: number;
  currency: string;
  message: string;
  timestamp: Date;
}

interface SurchargeCalculation {
  baseAmount: number;
  surchargePercentage: number;
  surchargeAmount: number;
  totalAmount: number;
  currency: string;
}

/**
 * Surcharge structure based on payment method
 * Card payments have higher surcharges to cover processing fees
 */
const SURCHARGE_STRUCTURE = {
  card: 2.5, // 2.5% surcharge for card payments
  bank_transfer: 0.5, // 0.5% surcharge for bank transfers
  crypto: 1.0 // 1% surcharge for crypto payments
};

class WalletService {
  private wallets: Map<string, WalletAccount> = new Map();
  private transactions: Map<string, WalletTransaction[]> = new Map();
  private defaultCurrency = 'USD';

  /**
   * Initialize or get wallet for customer
   */
  private ensureWallet(customerId: string, currency: string = this.defaultCurrency): WalletAccount {
    if (!this.wallets.has(customerId)) {
      const wallet: WalletAccount = {
        customerId,
        balance: 0,
        currency,
        totalTopUps: 0,
        totalDebits: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.wallets.set(customerId, wallet);
      this.transactions.set(customerId, []);

      console.log(`[WALLET] Wallet created for customer: ${customerId}`, { currency });
    }

    return this.wallets.get(customerId)!;
  }

  /**
   * Calculate surcharge for top-up
   */
  private calculateSurcharge(
    baseAmount: number,
    paymentMethod: 'card' | 'bank_transfer' | 'crypto'
  ): SurchargeCalculation {
    const surchargePercentage = SURCHARGE_STRUCTURE[paymentMethod];
    const surchargeAmount = baseAmount * (surchargePercentage / 100);

    return {
      baseAmount,
      surchargePercentage,
      surchargeAmount,
      totalAmount: baseAmount + surchargeAmount,
      currency: this.defaultCurrency
    };
  }

  /**
   * Top up wallet with credit card or other payment method
   * The surcharge is ADDED to the top-up amount and debited from customer
   * The base amount is what's CREDITED to the wallet
   */
  async topUpWallet(request: TopUpRequest): Promise<TopUpResponse> {
    try {
      const transactionId = uuidv4();

      console.log(`[WALLET_TOPUP] Starting top-up: ${transactionId}`, {
        customerId: request.customerId,
        amount: request.amount,
        method: request.paymentMethod
      });

      // 1. Ensure wallet exists
      const wallet = this.ensureWallet(request.customerId, request.currency);

      // 2. Validate top-up request
      this.validateTopUpRequest(request);

      // 3. Calculate surcharge based on payment method
      const surchargeCalc = this.calculateSurcharge(request.amount, request.paymentMethod);

      // 4. In real implementation, process payment through payment gateway
      // For now, we'll assume payment succeeds
      const paymentProcessed = await this.processPaymentGateway(request, surchargeCalc);

      if (!paymentProcessed) {
        throw new Error('Payment processing failed');
      }

      // 5. Credit base amount to wallet (surcharge is not added to wallet)
      wallet.balance += request.amount;
      wallet.lastTopUp = new Date();
      wallet.totalTopUps += 1;
      wallet.updatedAt = new Date();

      // 6. Record transaction
      const transaction: WalletTransaction = {
        id: transactionId,
        customerId: request.customerId,
        type: 'credit',
        amount: request.amount,
        surcharge: surchargeCalc.surchargeAmount,
        totalAmount: surchargeCalc.totalAmount,
        currency: request.currency,
        description: `Top-up via ${request.paymentMethod} - Base: ${request.amount}, Surcharge: ${surchargeCalc.surchargeAmount.toFixed(2)}`,
        paymentMethod: request.paymentMethod,
        reference: request.cardDetails?.last4 ? `Card ending in ${request.cardDetails.last4}` : undefined,
        status: 'completed',
        createdAt: new Date()
      };

      if (!this.transactions.has(request.customerId)) {
        this.transactions.set(request.customerId, []);
      }
      this.transactions.get(request.customerId)!.push(transaction);

      console.log(`[WALLET_TOPUP] Top-up completed: ${transactionId}`, {
        baseAmount: request.amount,
        surcharge: surchargeCalc.surchargeAmount,
        newBalance: wallet.balance
      });

      return {
        success: true,
        transactionId,
        customerId: request.customerId,
        topUpAmount: request.amount,
        surcharge: surchargeCalc.surchargeAmount,
        totalDebit: surchargeCalc.totalAmount,
        newBalance: wallet.balance,
        currency: wallet.currency,
        message: `Top-up successful. Wallet credited ${request.amount} ${wallet.currency}. Surcharge: ${surchargeCalc.surchargeAmount.toFixed(2)} ${wallet.currency}`,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('[WALLET_TOPUP] Error during top-up:', error);

      return {
        success: false,
        transactionId: '',
        customerId: request.customerId,
        topUpAmount: request.amount,
        surcharge: 0,
        totalDebit: 0,
        newBalance: 0,
        currency: request.currency,
        message: `Top-up failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date()
      };
    }
  }

  /**
   * Validate top-up request
   */
  private validateTopUpRequest(request: TopUpRequest): void {
    if (!request.customerId) {
      throw new Error('Customer ID is required');
    }

    if (request.amount <= 0) {
      throw new Error('Top-up amount must be greater than 0');
    }

    if (!request.currency) {
      throw new Error('Currency is required');
    }

    if (!['card', 'bank_transfer', 'crypto'].includes(request.paymentMethod)) {
      throw new Error(`Invalid payment method: ${request.paymentMethod}`);
    }

    if (request.paymentMethod === 'card' && !request.cardDetails) {
      throw new Error('Card details are required for card payments');
    }
  }

  /**
   * Simulate payment gateway processing
   */
  private async processPaymentGateway(
    request: TopUpRequest,
    surchargeCalc: SurchargeCalculation
  ): Promise<boolean> {
    try {
      console.log(`[PAYMENT_GATEWAY] Processing ${request.paymentMethod}:`, {
        amount: surchargeCalc.totalAmount,
        customer: request.customerId
      });

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 100));

      // In real implementation, this would call actual payment gateway
      // For now, always succeed
      console.log(`[PAYMENT_GATEWAY] Payment processed successfully`);
      return true;
    } catch (error) {
      console.error('[PAYMENT_GATEWAY] Payment processing error:', error);
      return false;
    }
  }

  /**
   * Debit wallet for booking confirmation
   */
  async debitWallet(customerId: string, amount: number, reference: string): Promise<{
    success: boolean;
    newBalance: number;
    message: string;
  }> {
    try {
      const wallet = this.ensureWallet(customerId);

      if (wallet.balance < amount) {
        throw new Error('Insufficient wallet balance');
      }

      wallet.balance -= amount;
      wallet.totalDebits += 1;
      wallet.updatedAt = new Date();

      // Record transaction
      const transaction: WalletTransaction = {
        id: uuidv4(),
        customerId,
        type: 'debit',
        amount,
        currency: wallet.currency,
        description: `Booking confirmation - ${reference}`,
        reference,
        status: 'completed',
        createdAt: new Date()
      };

      this.transactions.get(customerId)!.push(transaction);

      console.log(`[WALLET_DEBIT] Wallet debited: ${customerId}`, {
        amount,
        newBalance: wallet.balance
      });

      return {
        success: true,
        newBalance: wallet.balance,
        message: `Wallet debited ${amount} ${wallet.currency}. New balance: ${wallet.balance}`
      };
    } catch (error) {
      console.error('[WALLET_DEBIT] Error debiting wallet:', error);
      throw error;
    }
  }

  /**
   * Get wallet balance
   */
  async getWalletBalance(customerId: string): Promise<{
    customerId: string;
    balance: number;
    currency: string;
    lastTopUp?: Date;
  }> {
    const wallet = this.ensureWallet(customerId);

    return {
      customerId: wallet.customerId,
      balance: wallet.balance,
      currency: wallet.currency,
      lastTopUp: wallet.lastTopUp
    };
  }

  /**
   * Get wallet transaction history
   */
  getWalletTransactionHistory(customerId: string, limit: number = 50): WalletTransaction[] {
    const transactions = this.transactions.get(customerId) || [];
    return transactions.slice(-limit).reverse();
  }

  /**
   * Get wallet statistics
   */
  async getWalletStats(customerId: string): Promise<{
    balance: number;
    currency: string;
    totalTopUps: number;
    totalDebits: number;
    lastTopUp?: Date;
  }> {
    const wallet = this.ensureWallet(customerId);

    return {
      balance: wallet.balance,
      currency: wallet.currency,
      totalTopUps: wallet.totalTopUps,
      totalDebits: wallet.totalDebits,
      lastTopUp: wallet.lastTopUp
    };
  }

  /**
   * Get surcharge information
   */
  getSurchargeInfo(): Record<string, number> {
    return SURCHARGE_STRUCTURE;
  }

  /**
   * Calculate total cost including surcharge
   */
  calculateTotalCost(amount: number, paymentMethod: 'card' | 'bank_transfer' | 'crypto'): SurchargeCalculation {
    return this.calculateSurcharge(amount, paymentMethod);
  }
}

export default new WalletService();
export { TopUpRequest, TopUpResponse, WalletTransaction, SurchargeCalculation };
