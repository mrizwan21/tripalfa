/**
 * Payment Options Display Component
 * Shows available wallet balance, airline credits, and calculates card required amount
 * 
 * Features:
 * - Real-time wallet balance display
 * - List of available airline credits with expiration dates
 * - Card amount needed calculation
 * - Loading and error states
 * - Multi-currency support
 */

import React, { useEffect, useState } from 'react';
import type { FC } from 'react';

interface AirlineCredit {
  id: string;
  code: string;
  amount: number;
  airlineIataCode: string;
  currency: string;
  expiresAt: string;
}

interface PaymentOptionsDisplayProps {
  customerId: string;
  totalAmount: number;
  currency?: string;
  onLoadingChange?: (loading: boolean) => void;
  onErrorChange?: (error: string | null) => void;
}

interface PaymentOptions {
  walletBalance: number;
  availableCredits: AirlineCredit[];
  totalCreditAvailable: number;
  maxPaymentFromAssets: number;
  cardRequired: number;
  recommendedPaymentBreakdown: {
    fromWallet: number;
    fromCredits: number;
    fromCard: number;
  };
}

const PaymentOptionsDisplay: FC<PaymentOptionsDisplayProps> = ({
  customerId,
  totalAmount,
  currency = 'USD',
  onLoadingChange,
  onErrorChange,
}) => {
  const [paymentOptions, setPaymentOptions] = useState<PaymentOptions | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPaymentOptions = async () => {
      setLoading(true);
      onLoadingChange?.(true);
      setError(null);
      onErrorChange?.(null);

      try {
        const response = await fetch(
          `/api/bookings/${customerId}/payment-options?totalAmount=${totalAmount}&currency=${currency}`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch payment options: ${response.statusText}`);
        }

        const data = await response.json();
        setPaymentOptions(data.data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        onErrorChange?.(errorMessage);
      } finally {
        setLoading(false);
        onLoadingChange?.(false);
      }
    };

    if (customerId && totalAmount > 0) {
      fetchPaymentOptions();
    }
  }, [customerId, totalAmount, currency, onLoadingChange, onErrorChange]);

  if (loading) {
    return (
      <div className="payment-options-loading">
        <div className="spinner" />
        <p>Loading payment options...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="payment-options-error">
        <p className="error-title">⚠️ Unable to Load Payment Options</p>
        <p className="error-message">{error}</p>
      </div>
    );
  }

  if (!paymentOptions) {
    return <div>No payment options available</div>;
  }

  return (
    <div className="payment-options-container">
      <h3>💳 Available Payment Options</h3>

      {/* Wallet Balance Section */}
      <div className="payment-option-section">
        <div className="option-header">
          <span className="option-icon">💰</span>
          <span className="option-name">Wallet Balance</span>
        </div>
        <div className="option-details">
          <span className="amount">
            {currency} {paymentOptions.walletBalance.toFixed(2)}
          </span>
          <p className="option-description">
            Available funds in your digital wallet
          </p>
        </div>
      </div>

      {/* Airline Credits Section */}
      {paymentOptions.availableCredits.length > 0 && (
        <div className="payment-option-section">
          <div className="option-header">
            <span className="option-icon">✈️</span>
            <span className="option-name">Airline Credits</span>
            <span className="credit-badge">{paymentOptions.availableCredits.length}</span>
          </div>
          <div className="credits-list">
            {paymentOptions.availableCredits.map((credit) => (
              <div key={credit.id} className="credit-item">
                <div className="credit-airline">
                  <span className="airline-code">{credit.airlineIataCode}</span>
                  <span className="credit-code">{credit.code}</span>
                </div>
                <div className="credit-amount">
                  {currency} {credit.amount.toFixed(2)}
                </div>
                <div className="credit-expiry">
                  Expires: {new Date(credit.expiresAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
          <p className="total-credits">
            Total Credits: {currency} {paymentOptions.totalCreditAvailable.toFixed(2)}
          </p>
        </div>
      )}

      {/* Total Breakdown */}
      <div className="payment-breakdown">
        <div className="breakdown-item">
          <span>Total Available from Assets</span>
          <span className="amount">
            {currency} {paymentOptions.maxPaymentFromAssets.toFixed(2)}
          </span>
        </div>
        <div className="breakdown-item">
          <span>Booking Amount</span>
          <span className="amount">
            {currency} {totalAmount.toFixed(2)}
          </span>
        </div>
        <div className="breakdown-item card-required">
          <span>Card Payment Required</span>
          <span className="amount highlight">
            {currency} {paymentOptions.cardRequired.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Recommended Breakdown */}
      <div className="recommended-breakdown">
        <h4>Recommended Payment Breakdown</h4>
        <div className="breakdown-grid">
          <div className="breakdown-item-detail">
            <span className="label">From Wallet</span>
            <span className="value">
              {currency} {paymentOptions.recommendedPaymentBreakdown.fromWallet.toFixed(2)}
            </span>
          </div>
          <div className="breakdown-item-detail">
            <span className="label">From Credits</span>
            <span className="value">
              {currency} {paymentOptions.recommendedPaymentBreakdown.fromCredits.toFixed(2)}
            </span>
          </div>
          <div className="breakdown-item-detail">
            <span className="label">From Card</span>
            <span className="value">
              {currency} {paymentOptions.recommendedPaymentBreakdown.fromCard.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentOptionsDisplay;

/* ===== STYLES ===== */

const styles = `
.payment-options-container {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.payment-options-container h3 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 20px;
  color: #1a1a1a;
}

.payment-option-section {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}

.option-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  font-weight: 600;
  font-size: 14px;
}

.option-icon {
  font-size: 20px;
}

.credit-badge {
  background: #007bff;
  color: white;
  border-radius: 20px;
  padding: 2px 8px;
  font-size: 12px;
  margin-left: auto;
}

.option-details {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.amount {
  font-size: 20px;
  font-weight: 700;
  color: #007bff;
}

.option-description {
  font-size: 13px;
  color: #666;
  margin: 0;
}

.credits-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.credit-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f9f9f9;
  border-radius: 6px;
  font-size: 13px;
}

.credit-airline {
  display: flex;
  gap: 8px;
  align-items: center;
}

.airline-code {
  background: #e8f4f8;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 600;
}

.credit-code {
  color: #666;
  font-family: monospace;
}

.credit-amount {
  font-weight: 600;
  color: #28a745;
}

.credit-expiry {
  color: #999;
  font-size: 12px;
}

.total-credits {
  text-align: right;
  font-weight: 600;
  color: #28a745;
  margin: 8px 0 0 0;
}

.payment-breakdown {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}

.breakdown-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  font-size: 14px;
  border-bottom: 1px solid #f0f0f0;
}

.breakdown-item:last-child {
  border-bottom: none;
}

.breakdown-item.card-required {
  background: #fffbf0;
  padding: 12px 8px;
  margin: 8px -8px -8px -8px;
}

.breakdown-item.card-required .amount.highlight {
  color: #ff9800;
  font-weight: 700;
}

.recommended-breakdown {
  background: #f0f7ff;
  border: 1px solid #d0e8ff;
  border-radius: 8px;
  padding: 16px;
}

.recommended-breakdown h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
}

.breakdown-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.breakdown-item-detail {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px;
  background: white;
  border-radius: 6px;
  text-align: center;
}

.breakdown-item-detail .label {
  font-size: 12px;
  color: #666;
  font-weight: 500;
}

.breakdown-item-detail .value {
  font-size: 16px;
  font-weight: 700;
  color: #007bff;
}

.payment-options-loading,
.payment-options-error {
  background: white;
  border-radius: 12px;
  padding: 24px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.error-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #d32f2f;
}

.error-message {
  font-size: 14px;
  color: #666;
  margin: 0;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f0f0f0;
  border-top: 4px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 12px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
`;

export { styles };
