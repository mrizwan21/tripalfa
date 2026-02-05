// frontend/services/walletApi.ts
// TypeScript API client for wallet operations

import type { AxiosInstance, AxiosError } from 'axios';
import axios from 'axios';

// Types
export interface Wallet {
  id: string;
  userId: string;
  currency: string;
  balance: number;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  type: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
}

export interface TransferRequest {
  fromCurrency: string;
  toCurrency: string;
  amount: number;
  idempotencyKey: string;
}

export interface PurchaseRequest {
  amount: number;
  currency: string;
  agencyId: string;
  supplierId: string;
  bookingId: string;
  commissionRate: number;
  idempotencyKey: string;
}

export interface SettlementRequest {
  supplierId: string;
  settlementAmount: number;
  deductedCommission: number;
  currency: string;
  invoiceId: string;
  idempotencyKey: string;
}

export interface FxPreview {
  fromCurrency: string;
  toCurrency: string;
  amount: number;
  convertedAmount: number;
  fxRate: number;
  fetchedAt: string;
}

export interface TransferHistory {
  id: string;
  type: string;
  fromCurrency: string;
  toCurrency: string;
  amount: number;
  convertedAmount: number;
  fxRate: number;
  status: string;
  createdAt: string;
}

class WalletApiClient {
  private api: AxiosInstance;
  private baseURL: string;

  constructor(baseURL: string = '/api/wallet') {
    this.baseURL = baseURL;

    this.api = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add auth token to requests
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Handle errors
    this.api.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Clear token and redirect to login
          localStorage.removeItem('authToken');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get all wallets for the authenticated user
   */
  async getUserWallets(): Promise<Wallet[]> {
    const response = await this.api.get<Wallet[]>('/wallets');
    return response.data;
  }

  /**
   * Get wallet balance for a specific currency
   */
  async getWalletBalance(currency: string): Promise<number> {
    const response = await this.api.get<{ balance: number }>(`/balance/${currency}`);
    return response.data.balance;
  }

  /**
   * Transfer funds between currencies
   */
  async transferBetweenCurrencies(request: TransferRequest): Promise<Transaction> {
    const response = await this.api.post<{ success: boolean; transaction: Transaction }>(
      '/transfer',
      request
    );

    if (!response.data.success) {
      throw new Error('Transfer failed');
    }

    return response.data.transaction;
  }

  /**
   * Customer purchase with agency intermediary and supplier
   */
  async customerPurchase(request: PurchaseRequest): Promise<{
    customerTx: Transaction;
    agencyTx: Transaction;
    commissionTx: Transaction;
  }> {
    const response = await this.api.post<{
      success: boolean;
      transactions: {
        customer: Transaction;
        agency: Transaction;
        commission: Transaction;
      };
    }>('/purchase', request);

    if (!response.data.success) {
      throw new Error('Purchase failed');
    }

    return {
      customerTx: response.data.transactions.customer,
      agencyTx: response.data.transactions.agency,
      commissionTx: response.data.transactions.commission,
    };
  }

  /**
   * Agency settlement with supplier
   */
  async supplierSettlement(request: SettlementRequest): Promise<Transaction> {
    const response = await this.api.post<{ success: boolean; transaction: Transaction }>(
      '/settlement',
      request
    );

    if (!response.data.success) {
      throw new Error('Settlement failed');
    }

    return response.data.transaction;
  }

  /**
   * Get FX preview for a currency pair
   */
  async getFxPreview(fromCurrency: string, toCurrency: string, amount: number): Promise<FxPreview> {
    const response = await this.api.get<FxPreview>('/fx-preview', {
      params: {
        from: fromCurrency,
        to: toCurrency,
        amount,
      },
    });

    return response.data;
  }

  /**
   * Get transfer history for a wallet
   */
  async getTransferHistory(
    currency?: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<TransferHistory[]> {
    const response = await this.api.get<TransferHistory[]>('/history', {
      params: {
        currency,
        limit,
        offset,
      },
    });

    return response.data;
  }

  /**
   * Get transaction details
   */
  async getTransaction(transactionId: string): Promise<Transaction> {
    const response = await this.api.get<Transaction>(`/transactions/${transactionId}`);
    return response.data;
  }

  /**
   * Request refund for a transaction
   */
  async requestRefund(transactionId: string, amount?: number): Promise<Transaction> {
    const response = await this.api.post<{ success: boolean; transaction: Transaction }>(
      `/refund/${transactionId}`,
      {
        amount,
        idempotencyKey: this.generateIdempotencyKey(),
      }
    );

    if (!response.data.success) {
      throw new Error('Refund request failed');
    }

    return response.data.transaction;
  }

  /**
   * Generate a unique idempotency key (UUID v4)
   */
  private generateIdempotencyKey(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}

// Export singleton instance
export const walletApi = new WalletApiClient();
export default walletApi;
