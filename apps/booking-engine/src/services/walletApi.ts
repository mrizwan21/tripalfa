// React API client for wallet service (routed through API Gateway)

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

/**
 * Get user's wallets with balances
 */
export async function getUserWallets(token: string): Promise<any> {
  const response = await fetch(`${API_BASE}/api/wallet`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error(`Failed to fetch wallets: ${response.statusText}`);
  return response.json();
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

  const response = await fetch(`${API_BASE}/api/wallet/transfer`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      fromCurrency,
      toCurrency,
      amount,
      idempotencyKey,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Transfer failed');
  }

  return response.json();
}

/**
 * Get transfer history
 */
export async function getTransferHistory(token: string, options: {
  limit?: number;
  offset?: number;
} = {}): Promise<any> {
  const { limit = 20, offset = 0 } = options;
  const query = new URLSearchParams({ limit: limit.toString(), offset: offset.toString() });
  const response = await fetch(`${API_BASE}/api/wallet/history?${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) throw new Error(`Failed to fetch history: ${response.statusText}`);
  return response.json();
}

/**
 * Get FX preview (estimate conversion without executing)
 */
export async function getFxPreview(token: string, fromCurrency: string, toCurrency: string, amount: number): Promise<any> {
  const query = new URLSearchParams({
    fromCurrency,
    toCurrency,
    amount: amount.toString(),
  });

  const response = await fetch(`${API_BASE}/api/wallet/fx-preview?${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) throw new Error('Failed to get FX preview');
  return response.json();
}

export default {
  getUserWallets,
  transferBetweenWallets,
  getTransferHistory,
  getFxPreview,
};