// frontend/components/WalletBalance.tsx
// Display wallet balances for user

import React, { useEffect, useState } from "react";
import { getUserWallets } from "../services/walletApi.js";

interface Wallet {
  id: string;
  currency: string;
  balance: number;
  status: string;
}

interface WalletsResponse {
  wallets: Wallet[];
}

interface WalletBalanceProps {
  token: string;
  refreshInterval?: number;
}

export function WalletBalance({
  token,
  refreshInterval = 30000,
}: WalletBalanceProps): React.ReactElement {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWallets = async (): Promise<void> => {
      try {
        setLoading(true);
        const data: WalletsResponse = await getUserWallets(token);
        setWallets(data.wallets || []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        console.error("Failed to fetch wallets:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchWallets();

    // Refresh periodically
    const interval = setInterval(fetchWallets, refreshInterval);
    return () => clearInterval(interval);
  }, [token, refreshInterval]);

  if (loading) return <div className="wallet-loading">Loading wallets...</div>;
  if (error) return <div className="wallet-error">Error: {error}</div>;

  return (
    <div className="wallet-balances">
      <h2>My Wallets</h2>
      <div className="wallet-grid">
        {wallets.map((wallet) => (
          <div key={wallet.id} className="wallet-card">
            <div className="wallet-currency">{wallet.currency}</div>
            <div className="wallet-balance">
              {parseFloat(wallet.balance.toString()).toFixed(2)}
            </div>
            <div className="wallet-status">{wallet.status}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default WalletBalance;
