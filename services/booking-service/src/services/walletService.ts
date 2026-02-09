import { v4 as uuidv4 } from 'uuid';
import paymentService from './paymentService';

interface WalletTransaction {
  id: string;
  userId: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  timestamp: Date;
  referenceId?: string;
}

interface TopUpResult {
  transactionId: string;
  creditedAmount: number;
  surchargeAmount: number;
  totalPaid: number;
  newBalance: number;
}

class WalletService {
  private transactions: WalletTransaction[] = []; // In-memory for demo, use DB in real app
  private balances: Map<string, number> = new Map(); // In-memory balances

  /**
   * Calculate surcharge for wallet top-up
   */
  calculateSurcharge(amount: number): number {
    // Example: 2.5% surcharge
    return Math.round(amount * 0.025 * 100) / 100;
  }

  /**
   * Top up wallet with surcharge calculation
   */
  async topUpWallet(userId: string, amount: number, paymentMethod: string, paymentDetails: any): Promise<TopUpResult> {
    const surcharge = this.calculateSurcharge(amount);
    const totalToPay = amount + surcharge;

    // Process payment for total amount (including surcharge)
    const paymentResult = await paymentService.processPayment(
      `wallet-topup-${userId}-${Date.now()}`, // orderId
      totalToPay,
      'USD', // currency
      paymentMethod as 'balance' | 'card'
    );

    // Credit only the base amount to wallet
    const currentBalance = this.balances.get(userId) || 0;
    const newBalance = currentBalance + amount;
    this.balances.set(userId, newBalance);

    // Record transaction
    const transaction: WalletTransaction = {
      id: uuidv4(),
      userId,
      type: 'credit',
      amount,
      description: `Wallet top-up (surcharge: $${surcharge})`,
      timestamp: new Date(),
      referenceId: paymentResult.id
    };
    this.transactions.push(transaction);

    return {
      transactionId: transaction.id,
      creditedAmount: amount,
      surchargeAmount: surcharge,
      totalPaid: totalToPay,
      newBalance
    };
  }

  /**
   * Get wallet balance
   */
  async getWalletBalance(userId: string): Promise<number> {
    return this.balances.get(userId) || 0;
  }

  /**
   * Get wallet transaction history
   */
  async getWalletTransactions(userId: string, limit: number = 10, offset: number = 0): Promise<WalletTransaction[]> {
    const userTransactions = this.transactions
      .filter(t => t.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(offset, offset + limit);

    return userTransactions;
  }

  /**
   * Debit wallet (for future use, e.g., payments)
   */
  async debitWallet(userId: string, amount: number, description: string): Promise<boolean> {
    const currentBalance = this.balances.get(userId) || 0;
    if (currentBalance < amount) {
      throw new Error('Insufficient wallet balance');
    }

    const newBalance = currentBalance - amount;
    this.balances.set(userId, newBalance);

    const transaction: WalletTransaction = {
      id: uuidv4(),
      userId,
      type: 'debit',
      amount,
      description,
      timestamp: new Date()
    };
    this.transactions.push(transaction);

    return true;
  }
}

const walletService = new WalletService();
export default walletService;