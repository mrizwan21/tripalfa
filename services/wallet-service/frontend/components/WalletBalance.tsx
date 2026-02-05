// frontend/components/WalletBalance.tsx
// React component for displaying wallet balance

import React, { useState, useEffect } from 'react';
import type { Wallet } from '../services/walletApi.js';
import { walletApi } from '../services/walletApi.js';

interface WalletBalanceProps {
  currency?: string;
  showAll?: boolean;
  refreshInterval?: number; // milliseconds
  onBalanceUpdate?: (balance: number) => void;
}

export const WalletBalance: React.FC<WalletBalanceProps> = ({
  currency,
  showAll = false,
  refreshInterval = 30000, // 30 seconds
  onBalanceUpdate,
}) => {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Fetch wallets
  const fetchWallets = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await walletApi.getUserWallets();

      // Filter by currency if specified
      const filtered = currency ? data.filter((w) => w.currency === currency) : data;

      setWallets(filtered);
      setLastUpdated(new Date());

      // Notify parent component of balance update
      if (onBalanceUpdate && filtered.length > 0) {
        onBalanceUpdate(filtered[0].balance);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch wallets';
      setError(message);
      console.error('Error fetching wallets:', err);
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh wallets
  useEffect(() => {
    fetchWallets();

    const interval = setInterval(() => {
      fetchWallets();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [currency, refreshInterval]);

  if (loading && wallets.length === 0) {
    return (
      <div className="wallet-balance-container">
        <div className="loading">Loading wallet balance...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="wallet-balance-container">
        <div className="error-message">
          <p>Error: {error}</p>
          <button onClick={fetchWallets}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="wallet-balance-container">
      {wallets.length === 0 ? (
        <div className="no-wallets">No wallets found</div>
      ) : (
        <div className="wallet-list">
          {wallets.map((wallet) => (
            <div key={wallet.id} className="wallet-card">
              <div className="wallet-header">
                <h3 className="currency-code">{wallet.currency}</h3>
                <span className={`wallet-status status-${wallet.status}`}>{wallet.status}</span>
              </div>

              <div className="wallet-balance">
                <span className="balance-label">Balance</span>
                <span className="balance-amount">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: wallet.currency,
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 6,
                  }).format(wallet.balance)}
                </span>
              </div>

              <div className="wallet-meta">
                <small className="created-date">
                  Created: {new Date(wallet.createdAt).toLocaleDateString()}
                </small>
                <small className="updated-date">
                  Updated: {new Date(wallet.updatedAt).toLocaleDateString()}
                </small>
              </div>

              {showAll && (
                <div className="wallet-details">
                  <p>
                    <strong>Wallet ID:</strong> <code>{wallet.id}</code>
                  </p>
                  <p>
                    <strong>User ID:</strong> <code>{wallet.userId}</code>
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="wallet-footer">
        <small className="last-updated">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </small>
        <button className="refresh-button" onClick={fetchWallets} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <style>{`
        .wallet-balance-container {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        }

        .loading,
        .error-message,
        .no-wallets {
          padding: 20px;
          text-align: center;
          border-radius: 8px;
          background: #f5f5f5;
        }

        .error-message {
          background: #fee;
          color: #c33;
          border: 1px solid #fcc;
        }

        .error-message button {
          margin-top: 10px;
          padding: 8px 16px;
          background: #c33;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        .wallet-list {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 16px;
          margin-bottom: 16px;
        }

        .wallet-card {
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          padding: 16px;
          background: white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          transition: box-shadow 0.2s;
        }

        .wallet-card:hover {
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        }

        .wallet-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          border-bottom: 2px solid #f0f0f0;
          padding-bottom: 8px;
        }

        .currency-code {
          margin: 0;
          font-size: 18px;
          font-weight: bold;
          color: #333;
        }

        .wallet-status {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: bold;
          text-transform: uppercase;
        }

        .status-active {
          background: #d4edda;
          color: #155724;
        }

        .status-inactive {
          background: #f8d7da;
          color: #721c24;
        }

        .wallet-balance {
          margin: 16px 0;
          padding: 12px;
          background: #f9f9f9;
          border-left: 4px solid #4caf50;
          border-radius: 4px;
        }

        .balance-label {
          display: block;
          font-size: 12px;
          color: #999;
          text-transform: uppercase;
          margin-bottom: 4px;
        }

        .balance-amount {
          display: block;
          font-size: 24px;
          font-weight: bold;
          color: #4caf50;
        }

        .wallet-meta {
          margin: 12px 0;
          padding: 8px 0;
          border-top: 1px solid #f0f0f0;
          border-bottom: 1px solid #f0f0f0;
        }

        .wallet-meta small {
          display: block;
          color: #999;
          font-size: 11px;
          margin: 4px 0;
        }

        .wallet-details {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid #f0f0f0;
          font-size: 12px;
        }

        .wallet-details p {
          margin: 4px 0;
          word-break: break-all;
        }

        .wallet-details code {
          background: #f5f5f5;
          padding: 2px 4px;
          border-radius: 2px;
          font-size: 10px;
        }

        .wallet-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-top: 1px solid #e0e0e0;
        }

        .last-updated {
          color: #999;
          font-size: 12px;
        }

        .refresh-button {
          padding: 8px 16px;
          background: #2196f3;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          transition: background 0.2s;
        }

        .refresh-button:hover:not(:disabled) {
          background: #1976d2;
        }

        .refresh-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default WalletBalance;
