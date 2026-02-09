import { prisma } from '../database/index';
import logger from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import axios, { AxiosInstance } from 'axios';

/**
 * Wallet Service Client Configuration
 */
const WALLET_SERVICE_URL = process.env.WALLET_SERVICE_URL || 'http://wallet-service:3005';
const WALLET_SERVICE_TIMEOUT = parseInt(process.env.WALLET_SERVICE_TIMEOUT || '5000', 10);
const WALLET_API_KEY = process.env.WALLET_API_KEY || process.env.API_KEY || 'default-key';

/**
 * Create HTTP client for Wallet Service
 */
const walletClient: AxiosInstance = axios.create({
  baseURL: WALLET_SERVICE_URL,
  timeout: WALLET_SERVICE_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': WALLET_API_KEY,
    'X-Service': 'booking-service',
  },
});

/**
 * Add request/response interceptors for logging
 */
walletClient.interceptors.request.use(
  (config) => {
    config.headers['X-Request-ID'] = uuidv4();
    logger.debug('Wallet Service Request', {
      method: config.method,
      url: config.url,
      requestId: config.headers['X-Request-ID'],
    });
    return config;
  },
  (error) => Promise.reject(error)
);

walletClient.interceptors.response.use(
  (response) => {
    logger.debug('Wallet Service Response', {
      status: response.status,
      url: response.config.url,
      requestId: response.config.headers['X-Request-ID'],
    });
    return response;
  },
  (error) => {
    logger.error('Wallet Service Error', {
      status: error.response?.status,
      url: error.config?.url,
      error: error.message,
      requestId: error.config?.headers['X-Request-ID'],
    });
    return Promise.reject(error);
  }
);

/**
 * Wallet Service Response Types
 */
interface WalletBalance {
  entityType: string;
  entityId: string;
  currency: string;
  balance: number;
  lastUpdated: string;
}

interface TransactionResponse {
  transactionId: string;
  status: 'success' | 'pending' | 'failed';
  amount: number;
  currency: string;
  balance: number;
}

/**
 * Retry logic for wallet service calls
 */
const retryConfig = {
  maxRetries: 3,
  retryDelay: 1000, // ms
  backoffMultiplier: 2,
};

async function retryableWalletCall<T>(
  fn: () => Promise<T>,
  operation: string
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= retryConfig.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      logger.warn(`Wallet service ${operation} failed (attempt ${attempt}/${retryConfig.maxRetries})`, {
        error: lastError.message,
      });
      
      if (attempt < retryConfig.maxRetries) {
        const delay = retryConfig.retryDelay * Math.pow(retryConfig.backoffMultiplier, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error(`Failed after ${retryConfig.maxRetries} retries`);
}

/**
 * Interface for payment breakdown
 */
interface PaymentBreakdown {
  totalAmount: number;
  walletUsed: number;
  creditsUsed: number;
  cardRequired: number;
  creditsApplied: Array<{
    id: string;
    code: string;
    amount: number;
    airlineIataCode: string;
  }>;
  currency: string;
}

/**
 * Interface for payment request with combined methods
 */
interface CombinedPaymentRequest {
  bookingId: string;
  customerId: string;
  totalAmount: number;
  currency: string;
  useWallet?: boolean;
  walletAmount?: number;
  useCredits?: boolean;
  creditIds?: string[];
  cardAmount?: number;
}

/**
 * Interface for available payment options
 */
interface AvailablePaymentOptions {
  walletBalance: number;
  availableCredits: Array<{
    id: string;
    code: string;
    amount: number;
    airlineIataCode: string;
    expiresAt: Date;
  }>;
  totalCreditAvailable: number;
  maxPaymentFromAssets: number;
  cardRequired: number;
  recommendedPaymentBreakdown: PaymentBreakdown;
}

class BookingPaymentService {
  /**
   * Get available payment options for customer
   */
  async getAvailablePaymentOptions(
    customerId: string,
    totalAmount: number,
    currency: string = 'USD'
  ): Promise<AvailablePaymentOptions> {
    try {
      // Get wallet balance
      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
        select: {
          id: true,
          email: true,
        },
      });

      if (!customer) {
        throw new Error(`Customer ${customerId} not found`);
      }

      // For now, assume wallet balance is in a separate wallet service
      // In production, integrate with actual wallet service
      const walletBalance = await this.getWalletBalance(customerId, currency);

      // Get available airline credits
      const availableCredits = await prisma.airlineCredit.findMany({
        where: {
          customerId,
          status: 'active',
          availableForUse: true,
          expiresAt: { gt: new Date() },
          spentAt: null,
          invalidatedAt: null,
        },
        select: {
          id: true,
          code: true,
          amount: true,
          airlineIataCode: true,
          currency: true,
          expiresAt: true,
        },
        orderBy: { expiresAt: 'asc' },
      });

      // Calculate totals
      const totalCreditAvailable = availableCredits.reduce(
        (sum: number, credit: any) => sum + Number(credit.amount),
        0
      );

      const maxPaymentFromAssets = walletBalance + totalCreditAvailable;
      const cardRequired = Math.max(0, totalAmount - maxPaymentFromAssets);

      // Recommend optimal payment breakdown
      const recommendedPaymentBreakdown = this.recommendPaymentBreakdown(
        totalAmount,
        walletBalance,
        availableCredits,
        currency
      );

      logger.info('Retrieved available payment options', {
        customerId,
        totalAmount,
        walletBalance,
        totalCreditAvailable,
        cardRequired,
      });

      return {
        walletBalance,
        availableCredits: availableCredits.map((credit: any) => ({
          id: credit.id,
          code: credit.code,
          amount: Number(credit.amount),
          airlineIataCode: credit.airlineIataCode,
          expiresAt: credit.expiresAt,
        })),
        totalCreditAvailable,
        maxPaymentFromAssets,
        cardRequired,
        recommendedPaymentBreakdown,
      };
    } catch (error) {
      logger.error('Error getting available payment options', {
        customerId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Process combined payment (wallet + credits + card)
   */
  async processCombinedPayment(
    request: CombinedPaymentRequest
  ): Promise<PaymentBreakdown> {
    try {
      logger.info('Processing combined payment', {
        bookingId: request.bookingId,
        customerId: request.customerId,
        totalAmount: request.totalAmount,
      });

      // Validate inputs
      if (request.totalAmount <= 0) {
        throw new Error('Total amount must be greater than 0');
      }

      let walletUsed = 0;
      let creditsUsed = 0;
      const appliedCredits: PaymentBreakdown['creditsApplied'] = [];

      // Step 1: Use wallet if requested
      if (request.useWallet) {
        const walletBalance = await this.getWalletBalance(request.customerId, request.currency);
        walletUsed = Math.min(request.walletAmount || walletBalance, walletBalance);

        if (walletUsed > 0) {
          await this.deductFromWallet(request.customerId, walletUsed, {
            type: 'booking_payment',
            bookingId: request.bookingId,
            amount: walletUsed,
            currency: request.currency,
          });
          logger.info('Deducted from wallet', {
            customerId: request.customerId,
            amount: walletUsed,
            bookingId: request.bookingId,
          });
        }
      }

      // Step 2: Apply airline credits if requested
      let remainingAmount = request.totalAmount - walletUsed;

      if (request.useCredits && request.creditIds && request.creditIds.length > 0) {
        const creditApplicationResult = await this.applyAirlineCredits(
          request.customerId,
          request.creditIds,
          remainingAmount,
          request.currency
        );

        creditsUsed = creditApplicationResult.totalApplied;
        appliedCredits.push(...creditApplicationResult.appliedCredits);
        remainingAmount -= creditsUsed;

        logger.info('Applied airline credits', {
          customerId: request.customerId,
          creditsApplied: appliedCredits.length,
          totalApplied: creditsUsed,
          bookingId: request.bookingId,
        });
      }

      // Step 3: Calculate card amount needed
      const cardRequired = Math.max(0, remainingAmount);

      if (cardRequired > 0 && !request.cardAmount) {
        throw new Error(
          `Card payment required: ${cardRequired}. Please provide cardAmount.`
        );
      }

      // Validate card amount
      if (request.cardAmount && request.cardAmount < cardRequired) {
        throw new Error(
          `Insufficient card payment. Required: ${cardRequired}, Provided: ${request.cardAmount}`
        );
      }

      // Step 4: Update booking with payment breakdown
      const paymentBreakdown: PaymentBreakdown = {
        totalAmount: request.totalAmount,
        walletUsed,
        creditsUsed,
        cardRequired,
        creditsApplied: appliedCredits,
        currency: request.currency,
      };

      await prisma.booking.update({
        where: { id: request.bookingId },
        data: {
          walletAmountUsed: walletUsed,
          creditAmountUsed: creditsUsed,
          cardAmountUsed: request.cardAmount || cardRequired,
          creditsApplied: appliedCredits.map((c) => c.id),
          paymentBreakdown: paymentBreakdown as any,
          paymentStatus: 'PENDING_CARD' as any,
        },
      });

      logger.info('Combined payment processed successfully', {
        bookingId: request.bookingId,
        paymentBreakdown,
      });

      return paymentBreakdown;
    } catch (error) {
      logger.error('Error processing combined payment', {
        bookingId: request.bookingId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Apply airline credits to booking
   */
  private async applyAirlineCredits(
    customerId: string,
    creditIds: string[],
    maxAmount: number,
    currency: string
  ): Promise<{
    totalApplied: number;
    appliedCredits: PaymentBreakdown['creditsApplied'];
  }> {
    const appliedCredits: PaymentBreakdown['creditsApplied'] = [];
    let totalApplied = 0;
    let remainingAmount = maxAmount;

    // Fetch credits in order of expiration (soonest first)
    const credits = await prisma.airlineCredit.findMany({
      where: {
        id: { in: creditIds },
        customerId,
        status: 'active',
        availableForUse: true,
        expiresAt: { gt: new Date() },
        spentAt: null,
        invalidatedAt: null,
      },
      orderBy: { expiresAt: 'asc' },
    });

    if (credits.length === 0) {
      throw new Error('No valid airline credits found');
    }

    for (const credit of credits) {
      if (remainingAmount <= 0) break;

      const creditAmount = Number(credit.amount);
      const amountToUse = Math.min(creditAmount, remainingAmount);

      // Mark credit as spent (or partially spent)
      await prisma.airlineCredit.update({
        where: { id: credit.id },
        data: {
          spentAt: new Date(),
          status: 'spent',
          availableForUse: false,
        },
      });

      appliedCredits.push({
        id: credit.id,
        code: credit.code,
        amount: amountToUse,
        airlineIataCode: credit.airlineIataCode,
      });

      totalApplied += amountToUse;
      remainingAmount -= amountToUse;

      logger.info('Applied airline credit to booking', {
        creditId: credit.id,
        amount: amountToUse,
        airlineIataCode: credit.airlineIataCode,
      });
    }

    return { totalApplied, appliedCredits };
  }

  /**
   * Recommend optimal payment breakdown
   */
  private recommendPaymentBreakdown(
    totalAmount: number,
    walletBalance: number,
    credits: any[],
    currency: string
  ): PaymentBreakdown {
    // Strategy: Use wallet first, then expiring credits, then remaining credits
    let walletUsed = Math.min(totalAmount, walletBalance);
    let remainingAmount = totalAmount - walletUsed;

    const creditsApplied: PaymentBreakdown['creditsApplied'] = [];
    let creditsUsed = 0;

    // Sort credits by expiration date (soonest first)
    const sortedCredits = [...credits].sort(
      (a, b) => new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime()
    );

    for (const credit of sortedCredits) {
      if (remainingAmount <= 0) break;

      const creditAmount = Number(credit.amount);
      const amountToUse = Math.min(creditAmount, remainingAmount);

      creditsApplied.push({
        id: credit.id,
        code: credit.code,
        amount: amountToUse,
        airlineIataCode: credit.airlineIataCode,
      });

      creditsUsed += amountToUse;
      remainingAmount -= amountToUse;
    }

    const cardRequired = Math.max(0, remainingAmount);

    return {
      totalAmount,
      walletUsed,
      creditsUsed,
      cardRequired,
      creditsApplied,
      currency,
    };
  }

  /**
   * Get wallet balance from Wallet Service
   */
  private async getWalletBalance(customerId: string, currency: string = 'USD'): Promise<number> {
    try {
      return await retryableWalletCall(
        async () => {
          const response = await walletClient.get<WalletBalance>(
            `/api/v1/ledger/customer/${customerId}`,
            {
              params: { currency },
            }
          );
          
          const balance = response.data.balance || 0;
          logger.info('Retrieved wallet balance', {
            customerId,
            currency,
            balance,
          });
          
          return balance;
        },
        `getBalance(${customerId})`
      );
    } catch (error) {
      logger.error('Failed to get wallet balance', {
        customerId,
        currency,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      
      // Fallback: return 0 to indicate sufficient balance (will require card payment)
      // This prevents payment failures due to wallet service outage
      return 0;
    }
  }

  /**
   * Deduct from wallet using Wallet Service
   */
  private async deductFromWallet(
    customerId: string,
    amount: number,
    metadata: any
  ): Promise<void> {
    if (amount <= 0) {
      logger.debug('Skipping zero/negative wallet deduction', { customerId, amount });
      return;
    }
    
    try {
      return await retryableWalletCall(
        async () => {
          const response = await walletClient.post<TransactionResponse>(
            '/api/wallet/debit',
            {
              customerId,
              amount,
              currency: metadata.currency || 'USD',
              description: `Booking payment: ${metadata.bookingId}`,
              reference: `booking-${metadata.bookingId}`,
              metadata: {
                bookingId: metadata.bookingId,
                type: 'booking_payment',
                timestamp: new Date().toISOString(),
              },
              idempotencyKey: `debit-${metadata.bookingId}-${amount}`,
            }
          );
          
          if (response.data.status === 'failed') {
            throw new Error(`Wallet debit failed: insufficient balance or service error`);
          }
          
          logger.info('Successfully deducted from wallet', {
            customerId,
            amount,
            transactionId: response.data.transactionId,
            remainingBalance: response.data.balance,
          });
        },
        `deductFromWallet(${customerId}, ${amount})`
      );
    } catch (error) {
      logger.error('Failed to deduct from wallet', {
        customerId,
        amount,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      
      // Don't suppress error - payment must fail if wallet deduction fails
      throw error;
    }
  }

  /**
   * Refund combined payment (reverse all transactions)
   */
  async refundCombinedPayment(bookingId: string): Promise<void> {
    try {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        select: {
          walletAmountUsed: true,
          creditAmountUsed: true,
          creditsApplied: true,
          customerId: true,
          currency: true,
        },
      });

      if (!booking) {
        throw new Error(`Booking ${bookingId} not found`);
      }

      // Refund wallet amount
      if (booking.walletAmountUsed && Number(booking.walletAmountUsed) > 0) {
        await this.refundToWallet(booking.customerId, Number(booking.walletAmountUsed), {
          type: 'booking_refund',
          bookingId,
          currency: booking.currency,
        });
      }

      // Re-activate airline credits
      if (booking.creditsApplied && booking.creditsApplied.length > 0) {
        await prisma.airlineCredit.updateMany({
          where: { id: { in: booking.creditsApplied } },
          data: {
            spentAt: null,
            status: 'active',
            availableForUse: true,
          },
        });

        logger.info('Re-activated airline credits', {
          bookingId,
          count: booking.creditsApplied.length,
        });
      }

      logger.info('Refunded combined payment', {
        bookingId,
        walletAmount: booking.walletAmountUsed,
        creditsCount: booking.creditsApplied?.length || 0,
      });
    } catch (error) {
      logger.error('Error refunding combined payment', {
        bookingId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Refund to wallet using Wallet Service
   */
  private async refundToWallet(
    customerId: string,
    amount: number,
    metadata: any
  ): Promise<void> {
    if (amount <= 0) {
      logger.debug('Skipping zero/negative wallet refund', { customerId, amount });
      return;
    }
    
    try {
      return await retryableWalletCall(
        async () => {
          const response = await walletClient.post<TransactionResponse>(
            '/api/wallet/credit',
            {
              customerId,
              amount,
              currency: metadata.currency || 'USD',
              description: `Booking refund: ${metadata.bookingId}`,
              reference: `refund-${metadata.bookingId}`,
              metadata: {
                bookingId: metadata.bookingId,
                type: metadata.type || 'booking_refund',
                originalTransaction: metadata.originalTransaction,
                timestamp: new Date().toISOString(),
              },
              idempotencyKey: `credit-${metadata.bookingId}-${amount}`,
            }
          );
          
          if (response.data.status === 'failed') {
            throw new Error(`Wallet credit failed: service error`);
          }
          
          logger.info('Successfully refunded to wallet', {
            customerId,
            amount,
            transactionId: response.data.transactionId,
            newBalance: response.data.balance,
          });
        },
        `refundToWallet(${customerId}, ${amount})`
      );
    } catch (error) {
      logger.error('Failed to refund to wallet', {
        customerId,
        amount,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      
      // Log error but don't throw - refund should be retryable via support
      logger.warn('Refund transaction needs manual review', {
        customerId,
        amount,
        bookingId: metadata.bookingId,
      });
    }
  }

  /**
   * Get payment details for a booking
   */
  async getBookingPaymentDetails(bookingId: string) {
    try {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        select: {
          id: true,
          reference: true,
          customerPrice: true,
          currency: true,
          walletAmountUsed: true,
          creditAmountUsed: true,
          cardAmountUsed: true,
          creditsApplied: true,
          paymentBreakdown: true,
          paymentStatus: true,
        },
      });

      if (!booking) {
        throw new Error(`Booking ${bookingId} not found`);
      }

      // Fetch applied credits details
      const appliedCredits = booking.creditsApplied
        ? await prisma.airlineCredit.findMany({
            where: { id: { in: booking.creditsApplied } },
            select: {
              id: true,
              code: true,
              amount: true,
              airlineIataCode: true,
              expiresAt: true,
            },
          })
        : [];

      return {
        bookingId: booking.id,
        bookingReference: booking.reference,
        totalAmount: Number(booking.customerPrice),
        currency: booking.currency,
        paymentBreakdown: {
          walletUsed: Number(booking.walletAmountUsed || 0),
          creditsUsed: Number(booking.creditAmountUsed || 0),
          cardUsed: Number(booking.cardAmountUsed || 0),
          appliedCredits: appliedCredits.map((c: any) => ({
            id: c.id,
            code: c.code,
            amount: Number(c.amount),
            airlineIataCode: c.airlineIataCode,
          })),
        },
        paymentStatus: booking.paymentStatus,
        breakdown: booking.paymentBreakdown,
      };
    } catch (error) {
      logger.error('Error getting booking payment details', {
        bookingId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
}

export default new BookingPaymentService();
