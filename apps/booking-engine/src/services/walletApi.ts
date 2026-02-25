// React API client for wallet service (routed through centralized API)

import { api } from '../lib/api';

/**
 * Get user's wallets with balances
 */
export async function getUserWallets(token: string): Promise<any> {
  const response = await api.get<any>('/api/wallet');
  return response;
}

/**
 * Transfer between user's wallets
 */
export async function transferBetweenWallets(token: string, params: {
  fromCurrency: string;
  toCurrency: string;
  amount: number;
  idempotencyKey: string;
}): Promise<any> {
  const { fromCurrency, toCurrency, amount, idempotencyKey } = params;

  const response = await api.post<any>('/api/wallet/transfer', {
    fromCurrency,
    toCurrency,
    amount,
    idempotencyKey,
  });

  return response;
}

/**
 * Get transfer history
 */
export async function getTransferHistory(token: string, options: {
  limit?: number;
  offset?: number;
} = {}): Promise<any> {
  const { limit = 20, offset = 0 } = options;
  const response = await api.get<any>(`/api/wallet/history?limit=${limit}&offset=${offset}`);
  return response;
}

/**
 * Get FX preview (estimate conversion without executing)
 */
export async function getFxPreview(token: string, fromCurrency: string, toCurrency: string, amount: number): Promise<any> {
  const response = await api.get<any>(`/api/wallet/fx-preview?fromCurrency=${fromCurrency}&toCurrency=${toCurrency}&amount=${amount}`);
  return response;
}

export default {
  getUserWallets,
  transferBetweenWallets,
  getTransferHistory,
  getFxPreview,
};