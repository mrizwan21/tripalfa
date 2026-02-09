/**
 * Payment API Client Module
 * Handles all payment-related API calls
 * 
 * Features:
 * - Centralized API endpoints
 * - Request/response interceptors
 * - Error handling and retry logic
 * - Authentication header management
 * - Response type safety
 */

import type { AxiosInstance, AxiosError } from 'axios';

// ===== TYPE DEFINITIONS =====

export interface PaymentOption {
  id: string;
  code: string;
  amount: number;
  airlineIataCode: string;
  currency: string;
  expiresAt: Date;
}

export interface PaymentOptionsResponse {
  walletBalance: number;
  availableCredits: PaymentOption[];
  cardRequired: number;
  recommendedBreakdown: {
    walletAmount: number;
    creditsAmount: number;
    cardAmount: number;
  };
  currency: string;
  totalAmount: number;
}

export interface PaymentRequest {
  customerId: string;
  totalAmount: number;
  currency: string;
  useWallet: boolean;
  walletAmount: number;
  useCredits: boolean;
  creditIds: string[];
  cardAmount: number;
}

export interface PaymentResponse {
  bookingId: string;
  transactionId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  paymentBreakdown: {
    walletDeducted: number;
    creditsApplied: number;
    cardCharged: number;
  };
  confirmationNumber: string;
  timestamp: Date;
}

export interface CardPaymentRequest {
  cardholderName: string;
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  amount: number;
  currency: string;
  stripeToken?: string;
}

export interface RefundRequest {
  transactionId: string;
  reason: string;
  amount?: number;
}

export interface RefundResponse {
  refundId: string;
  transactionId: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  timestamp: Date;
}

// ===== API CLIENT CLASS =====

class PaymentApiClient {
  private readonly baseURL: string;
  private readonly timeout: number;
  private readonly maxRetries: number;

  constructor(
    baseURL: string = '/api',
    timeout: number = 30000,
    maxRetries: number = 3
  ) {
    this.baseURL = baseURL;
    this.timeout = timeout;
    this.maxRetries = maxRetries;
  }

  /**
   * Get authorization headers with Bearer token
   */
  private getHeaders(): Record<string, string> {
    const token = this.getAuthToken();
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Get auth token from localStorage
   */
  private getAuthToken(): string {
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('No authentication token found. Please login first.');
    }
    return token;
  }

  /**
   * Retry logic with exponential backoff
   */
  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    retries: number = this.maxRetries
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (retries === 0) {
        throw error;
      }

      const delay = Math.pow(2, this.maxRetries - retries) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));

      return this.retryWithBackoff(fn, retries - 1);
    }
  }

  /**
   * Fetch available payment options for a booking
   * GET /bookings/{customerId}/payment-options
   */
  async getPaymentOptions(
    customerId: string,
    totalAmount: number,
    currency: string
  ): Promise<PaymentOptionsResponse> {
    const url = `${this.baseURL}/bookings/${customerId}/payment-options`;
    const params = new URLSearchParams({
      totalAmount: String(totalAmount),
      currency,
    });

    return this.retryWithBackoff(async () => {
      const response = await fetch(`${url}?${params}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch payment options');
      }

      const data = await response.json();

      return {
        walletBalance: data.walletBalance,
        availableCredits: data.availableCredits || [],
        cardRequired: data.cardRequired || totalAmount,
        recommendedBreakdown: data.recommendedBreakdown,
        currency,
        totalAmount,
      };
    });
  }

  /**
   * Process a combined payment
   * POST /bookings/{bookingId}/pay
   */
  async processPayment(
    bookingId: string,
    request: PaymentRequest
  ): Promise<PaymentResponse> {
    const url = `${this.baseURL}/bookings/${bookingId}/pay`;

    return this.retryWithBackoff(async () => {
      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Payment processing failed');
      }

      return response.json();
    });
  }

  /**
   * Process card payment
   * POST /bookings/{bookingId}/process-card-payment
   */
  async processCardPayment(
    bookingId: string,
    cardPayment: CardPaymentRequest
  ): Promise<PaymentResponse> {
    const url = `${this.baseURL}/bookings/${bookingId}/process-card-payment`;

    return this.retryWithBackoff(async () => {
      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(cardPayment),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Card payment failed');
      }

      return response.json();
    });
  }

  /**
   * Get payment status
   * GET /bookings/{bookingId}/payment-status
   */
  async getPaymentStatus(bookingId: string): Promise<PaymentResponse> {
    const url = `${this.baseURL}/bookings/${bookingId}/payment-status`;

    return this.retryWithBackoff(async () => {
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch payment status');
      }

      return response.json();
    });
  }

  /**
   * Refund a payment
   * POST /bookings/{bookingId}/refund
   */
  async refundPayment(
    bookingId: string,
    request: RefundRequest
  ): Promise<RefundResponse> {
    const url = `${this.baseURL}/bookings/${bookingId}/refund`;

    return this.retryWithBackoff(async () => {
      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Refund processing failed');
      }

      return response.json();
    });
  }

  /**
   * Validate payment selection
   * POST /bookings/{bookingId}/validate-payment
   */
  async validatePayment(
    bookingId: string,
    request: PaymentRequest
  ): Promise<{ valid: boolean; errors?: string[] }> {
    const url = `${this.baseURL}/bookings/${bookingId}/validate-payment`;

    return this.retryWithBackoff(async () => {
      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.json();
        return {
          valid: false,
          errors: [error.message || 'Validation failed'],
        };
      }

      return response.json();
    });
  }

  /**
   * Get wallet balance
   * GET /bookings/{customerId}/wallet-balance
   */
  async getWalletBalance(customerId: string, currency: string): Promise<number> {
    const url = `${this.baseURL}/bookings/${customerId}/wallet-balance`;
    const params = new URLSearchParams({ currency });

    return this.retryWithBackoff(async () => {
      const response = await fetch(`${url}?${params}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch wallet balance');
      }

      const data = await response.json();
      return data.balance || 0;
    });
  }

  /**
   * Get airline credits
   * GET /bookings/{customerId}/airline-credits
   */
  async getAirlineCredits(customerId: string): Promise<PaymentOption[]> {
    const url = `${this.baseURL}/bookings/${customerId}/airline-credits`;

    return this.retryWithBackoff(async () => {
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch airline credits');
      }

      const data = await response.json();
      return data.credits || [];
    });
  }

  /**
   * Apply airline credit to booking
   * POST /bookings/{bookingId}/apply-credit
   */
  async applyCredit(
    bookingId: string,
    creditId: string,
    amount: number
  ): Promise<{ success: boolean; appliedAmount: number }> {
    const url = `${this.baseURL}/bookings/${bookingId}/apply-credit`;

    return this.retryWithBackoff(async () => {
      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ creditId, amount }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to apply credit');
      }

      return response.json();
    });
  }

  /**
   * Cancel payment and release held funds
   * POST /bookings/{bookingId}/cancel-payment
   */
  async cancelPayment(bookingId: string): Promise<{ success: boolean; message: string }> {
    const url = `${this.baseURL}/bookings/${bookingId}/cancel-payment`;

    return this.retryWithBackoff(async () => {
      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to cancel payment');
      }

      return response.json();
    });
  }

  /**
   * Get payment history
   * GET /bookings/{customerId}/payment-history
   */
  async getPaymentHistory(
    customerId: string,
    limit: number = 10
  ): Promise<PaymentResponse[]> {
    const url = `${this.baseURL}/bookings/${customerId}/payment-history`;
    const params = new URLSearchParams({ limit: String(limit) });

    return this.retryWithBackoff(async () => {
      const response = await fetch(`${url}?${params}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch payment history');
      }

      const data = await response.json();
      return data.payments || [];
    });
  }
}

// ===== SINGLETON INSTANCE =====

let paymentApiClient: PaymentApiClient | null = null;

/**
 * Get or create the payment API client instance
 */
export function getPaymentApiClient(): PaymentApiClient {
  if (!paymentApiClient) {
    paymentApiClient = new PaymentApiClient();
  }
  return paymentApiClient;
}

/**
 * Reset the payment API client (useful for testing)
 */
export function resetPaymentApiClient(): void {
  paymentApiClient = null;
}

// ===== ERROR HANDLER UTILITY =====

export class PaymentApiError extends Error {
  constructor(
    public readonly statusCode?: number,
    public readonly detail?: string,
    message?: string
  ) {
    super(message || 'Payment API error');
    this.name = 'PaymentApiError';
  }
}

/**
 * Handle payment API errors with user-friendly messages
 */
export function handlePaymentError(error: unknown): string {
  if (error instanceof PaymentApiError) {
    const baseMessage = error.message;

    if (error.statusCode === 401) {
      return 'Your session has expired. Please login again.';
    }
    if (error.statusCode === 403) {
      return 'You do not have permission to perform this action.';
    }
    if (error.statusCode === 404) {
      return 'The requested payment record was not found.';
    }
    if (error.statusCode === 409) {
      return 'This payment has already been processed.';
    }
    if (error.statusCode === 422) {
      return `Invalid payment data: ${error.detail || 'Please check your input'}`;
    }
    if (error.statusCode === 500) {
      return 'A server error occurred. Please try again later.';
    }

    return baseMessage;
  }

  if (error instanceof Error) {
    if (error.message.includes('Failed to fetch')) {
      return 'Network error. Please check your connection and try again.';
    }
    if (error.message.includes('token')) {
      return 'Authentication failed. Please login again.';
    }
    return error.message;
  }

  return 'An unexpected error occurred. Please try again.';
}

// ===== EXPORT SINGLETON =====

export default getPaymentApiClient();
