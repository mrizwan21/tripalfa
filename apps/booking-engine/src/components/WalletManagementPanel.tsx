/**
 * Wallet Management Panel
 * Displays wallet balance and allows adding funds
 *
 * Features:
 * - Current wallet balance
 * - Recent transactions
 * - Add funds form
 * - Payment method selection
 * - Transaction history
 */

import React, { useState, useEffect } from 'react';
import type { FC } from 'react';
import { getStoredAuthToken } from '../lib/authToken';
import { formatDateTime } from '@tripalfa/shared-utils/date-utils';

interface WalletTransaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  date: string;
  balance: number;
}

interface WalletInfo {
  balance: number;
  currency: string;
  lastUpdate: string;
  transactions: WalletTransaction[];
}

interface WalletManagementPanelProps {
  customerId: string;
  onFundsAdded?: () => void;
}

type AddFundsTab = 'add' | 'transactions';

const WalletManagementPanel: FC<WalletManagementPanelProps> = ({ customerId, onFundsAdded }) => {
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AddFundsTab>('add');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchWalletInfo();
  }, [customerId]);

  const fetchWalletInfo = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/customers/${customerId}/wallet`, {
        headers: {
          Authorization: `Bearer ${getStoredAuthToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch wallet information');
      }

      const data = await response.json();
      setWalletInfo(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFunds = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || parseFloat(amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch(`/api/customers/${customerId}/wallet/add-funds`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${getStoredAuthToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          paymentMethod,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to add funds');
      }

      setSuccess(true);
      setAmount('');
      await fetchWalletInfo();
      onFundsAdded?.();

      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const presetAmounts = [50, 100, 200, 500];

  return (
    <div className="wallet-management-panel">
      {error && (
        <div className="error-alert">
          <span>⚠️</span>
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="success-alert">
          <span>✓</span>
          <p>Funds added successfully!</p>
        </div>
      )}

      {loading ? (
        <div className="loading-state">
          <div className="spinner" />
          <p>Loading wallet information...</p>
        </div>
      ) : walletInfo ? (
        <>
          {/* Wallet Balance Card */}
          <div className="wallet-balance-card">
            <div className="balance-content">
              <p className="balance-label">Current Balance</p>
              <p className="balance-amount">
                {walletInfo.currency} {walletInfo.balance.toFixed(2)}
              </p>
              <p className="balance-updated">Updated: {formatDateTime(walletInfo.lastUpdate)}</p>
            </div>
            <div className="balance-icon">💰</div>
          </div>

          {/* Tab Navigation */}
          <div className="wallet-tabs">
            <button
              className={`tab-btn ${activeTab === 'add' ? 'active' : ''}`}
              onClick={() => setActiveTab('add')}
            >
              Add Funds
            </button>
            <button
              className={`tab-btn ${activeTab === 'transactions' ? 'active' : ''}`}
              onClick={() => setActiveTab('transactions')}
            >
              Transactions
            </button>
          </div>

          {/* Add Funds Tab */}
          {activeTab === 'add' && (
            <form onSubmit={handleAddFunds} className="add-funds-form space-y-6">
              <div className="form-group">
                <label htmlFor="amount">Amount to Add</label>
                <div className="amount-input-wrapper">
                  <span className="currency">{walletInfo.currency}</span>
                  <input
                    id="amount"
                    type="number"
                    min="1"
                    step="0.01"
                    max="99999"
                    placeholder="0.00"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    disabled={isProcessing}
                    required
                  />
                </div>
              </div>

              {/* Preset Amounts */}
              <div className="form-group">
                <label>Quick Amounts</label>
                <div className="preset-amounts">
                  {presetAmounts.map(preset => (
                    <button
                      key={preset}
                      type="button"
                      className="preset-btn px-4 py-2 rounded-md text-sm font-medium"
                      onClick={() => setAmount(preset.toString())}
                      disabled={isProcessing}
                    >
                      {walletInfo.currency} {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Method */}
              <div className="form-group">
                <label htmlFor="paymentMethod">Payment Method</label>
                <select
                  id="paymentMethod"
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value)}
                  disabled={isProcessing}
                >
                  <option value="card">💳 Credit/Debit Card</option>
                  <option value="bank">🏦 Bank Transfer</option>
                  <option value="wallet">📱 Digital Wallet</option>
                </select>
              </div>

              {/* Terms */}
              <div className="terms-checkbox">
                <input type="checkbox" id="terms" defaultChecked disabled={isProcessing} />
                <label htmlFor="terms">I agree to the wallet terms and conditions</label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="submit-btn px-4 py-2 rounded-md text-sm font-medium"
                disabled={!amount || isProcessing}
              >
                {isProcessing ? (
                  <>
                    <span className="spinner-small" />
                    Processing...
                  </>
                ) : (
                  `Add ${walletInfo.currency} ${amount || '0'} to Wallet`
                )}
              </button>
            </form>
          )}

          {/* Transactions Tab */}
          {activeTab === 'transactions' && (
            <div className="transactions-list">
              {walletInfo.transactions.length === 0 ? (
                <div className="empty-transactions">
                  <p>📭 No transactions yet</p>
                </div>
              ) : (
                <>
                  {walletInfo.transactions.map(tx => (
                    <div key={tx.id} className="transaction-item">
                      <div className="tx-icon">{tx.type === 'credit' ? '➕' : '➖'}</div>
                      <div className="tx-details">
                        <p className="tx-description">{tx.description}</p>
                        <p className="tx-date">{formatDateTime(tx.date)}</p>
                      </div>
                      <div className="tx-amount">
                        <span className={`amount ${tx.type}`}>
                          {tx.type === 'credit' ? '+' : '-'}
                          {walletInfo.currency} {tx.amount.toFixed(2)}
                        </span>
                        <span className="balance">
                          Balance: {walletInfo.currency} {tx.balance.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {/* Info Box */}
          <div className="wallet-info-box">
            <h4>About Your Wallet</h4>
            <ul>
              <li>Use your wallet balance for faster checkout on future bookings</li>
              <li>Wallet funds don't expire</li>
              <li>Get refunds directly to your wallet</li>
              <li>Combine wallet with airline credits and card payments</li>
            </ul>
          </div>
        </>
      ) : null}
    </div>
  );
};

export default WalletManagementPanel;

/* ===== STYLES ===== */

const styles = `
.wallet-management-panel {
  background: hsl(var(--card));
  border-radius: 12px;
  padding: 24px;
}

.error-alert,
.success-alert {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-size: 14px;
  font-weight: 500;
}

.error-alert {
  background: hsl(var(--destructive) / 0.12);
  color: hsl(var(--destructive));
  border-left: 4px solid hsl(var(--destructive));
}

.success-alert {
  background: hsl(var(--secondary));
  color: hsl(var(--primary));
  border-left: 4px solid hsl(var(--primary));
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid hsl(var(--border));
  border-top-color: hsl(var(--primary));
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 12px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-state p {
  color: hsl(var(--muted-foreground));
  font-size: 14px;
}

/* Wallet Balance Card */
.wallet-balance-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, hsl(var(--accent)), hsl(var(--muted)));
  border: 1px solid hsl(var(--border));
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
}

.balance-content {
  flex: 1;
}

.balance-label {
  margin: 0 0 8px 0;
  font-size: 12px;
  color: hsl(var(--muted-foreground));
  text-transform: uppercase;
  font-weight: 600;
}

.balance-amount {
  margin: 0 0 4px 0;
  font-size: 32px;
  font-weight: 700;
  color: hsl(var(--primary));
}

.balance-updated {
  margin: 0;
  font-size: 12px;
  color: hsl(var(--muted-foreground));
}

.balance-icon {
  font-size: 48px;
  margin-left: 20px;
}

/* Tabs */
.wallet-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  border-bottom: 2px solid hsl(var(--border));
}

.tab-btn {
  padding: 12px 16px;
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  color: hsl(var(--muted-foreground));
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn:hover {
  color: hsl(var(--primary));
}

.tab-btn.active {
  color: hsl(var(--primary));
  border-bottom-color: hsl(var(--primary));
}

/* Add Funds Form */
.add-funds-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 12px;
  font-weight: 700;
  color: hsl(var(--foreground));
  text-transform: uppercase;
}

.amount-input-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
  background: hsl(var(--muted));
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
  padding: 0 12px;
}

.currency {
  font-weight: 700;
  color: hsl(var(--primary));
  font-size: 16px;
}

.amount-input-wrapper input {
  flex: 1;
  background: transparent;
  border: none;
  padding: 12px 0;
  font-size: 16px;
  outline: none;
}

.amount-input-wrapper input:disabled {
  color: hsl(var(--muted-foreground));
}

.preset-amounts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
  gap: 8px;
}

.preset-btn {
  padding: 10px;
  background: hsl(var(--muted));
  border: 1px solid hsl(var(--border));
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  color: hsl(var(--primary));
  transition: all 0.2s;
}

.preset-btn:hover:not(:disabled) {
  background: hsl(var(--accent));
  border-color: hsl(var(--primary));
}

.preset-btn:disabled {
  opacity: 0.5;
}

.form-group select {
  padding: 12px;
  border: 1px solid hsl(var(--border));
  border-radius: 6px;
  font-size: 14px;
  background: hsl(var(--card));
  cursor: pointer;
}

.form-group select:disabled {
  background: hsl(var(--muted));
  color: hsl(var(--muted-foreground));
}

.terms-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
}

.terms-checkbox input[type="checkbox"] {
  cursor: pointer;
  width: 18px;
  height: 18px;
}

.terms-checkbox label {
  font-size: 13px;
  color: hsl(var(--muted-foreground));
  cursor: pointer;
  margin: 0;
  text-transform: none;
  font-weight: 400;
}

.submit-btn {
  padding: 14px;
  background: linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.9));
  color: hsl(var(--primary-foreground));
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.submit-btn:hover:not(:disabled) {
  box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
  transform: translateY(-2px);
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.spinner-small {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: hsl(var(--primary-foreground));
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

/* Transactions List */
.transactions-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.empty-transactions {
  text-align: center;
  padding: 40px 20px;
  color: hsl(var(--muted-foreground));
}

.empty-transactions p {
  margin: 0;
  font-size: 14px;
}

.transaction-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: hsl(var(--muted));
  border-radius: 8px;
  border-left: 3px solid transparent;
}

.transaction-item:nth-child(odd) {
  background: hsl(var(--card));
  border-left-color: hsl(var(--primary));
}

.transaction-item:nth-child(even) {
  background: hsl(var(--muted));
  border-left-color: hsl(var(--destructive));
}

.tx-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.tx-details {
  flex: 1;
}

.tx-description {
  margin: 0 0 4px 0;
  font-size: 13px;
  font-weight: 600;
  color: hsl(var(--foreground));
}

.tx-date {
  margin: 0;
  font-size: 12px;
  color: hsl(var(--muted-foreground));
}

.tx-amount {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.amount {
  font-size: 13px;
  font-weight: 700;
}

.amount.credit {
  color: hsl(var(--primary));
}

.amount.debit {
  color: hsl(var(--destructive));
}

.balance {
  font-size: 11px;
  color: hsl(var(--muted-foreground));
}

/* Info Box */
.wallet-info-box {
  background: hsl(var(--accent));
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
  padding: 16px;
  margin-top: 24px;
}

.wallet-info-box h4 {
  margin: 0 0 12px 0;
  font-size: 13px;
  font-weight: 700;
  color: hsl(var(--primary));
  text-transform: uppercase;
}

.wallet-info-box ul {
  margin: 0;
  padding-left: 20px;
  list-style: none;
}

.wallet-info-box li {
  font-size: 13px;
  color: hsl(var(--foreground));
  margin-bottom: 6px;
}

.wallet-info-box li:before {
  content: "✓ ";
  color: hsl(var(--primary));
  font-weight: 700;
  margin-right: 8px;
}

@media (max-width: 600px) {
  .wallet-balance-card {
    flex-direction: column;
    text-align: center;
  }

  .balance-icon {
    margin: 12px 0 0 0;
  }

  .preset-amounts {
    grid-template-columns: repeat(2, 1fr);
  }
}
`;

{
  styles;
}
