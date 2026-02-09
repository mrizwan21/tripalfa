/**
 * Payment Method Selector Component
 * Allows customers to select payment methods (wallet, credits, card) and amounts
 * 
 * Features:
 * - Toggle wallet payment
 * - Select specific airline credits
 * - Adjust payment amounts manually
 * - Real-time validation
 * - Summary of selected amounts
 * - Error handling for invalid selections
 */

import React, { useState, useEffect } from 'react';
import type { FC } from 'react';

interface AirlineCredit {
  id: string;
  code: string;
  amount: number;
  airlineIataCode: string;
  currency: string;
  expiresAt: string;
}

interface PaymentMethodSelectorProps {
  totalAmount: number;
  walletBalance: number;
  availableCredits: AirlineCredit[];
  currency?: string;
  onPaymentMethodChange?: (selection: PaymentMethodSelection) => void;
  onValidationChange?: (isValid: boolean) => void;
}

export interface PaymentMethodSelection {
  useWallet: boolean;
  walletAmount: number;
  useCredits: boolean;
  selectedCreditIds: string[];
  creditsAmount: number;
  cardAmount: number;
  isValid: boolean;
  errors: string[];
}

const PaymentMethodSelector: FC<PaymentMethodSelectorProps> = ({
  totalAmount,
  walletBalance,
  availableCredits,
  currency = 'USD',
  onPaymentMethodChange,
  onValidationChange,
}) => {
  const [selection, setSelection] = useState<PaymentMethodSelection>({
    useWallet: false,
    walletAmount: 0,
    useCredits: false,
    selectedCreditIds: [],
    creditsAmount: 0,
    cardAmount: totalAmount,
    isValid: true,
    errors: [],
  });

  // Calculate selected credits amount
  const calculateCreditsAmount = (creditIds: string[]) => {
    return availableCredits
      .filter((c) => creditIds.includes(c.id))
      .reduce((sum, c) => sum + c.amount, 0);
  };

  // Validate payment selection
  const validateSelection = (newSelection: PaymentMethodSelection) => {
    const errors: string[] = [];

    if (newSelection.walletAmount > walletBalance) {
      errors.push(`Wallet amount exceeds available balance (${currency} ${walletBalance.toFixed(2)})`);
    }

    if (newSelection.creditsAmount > calculateCreditsAmount(newSelection.selectedCreditIds)) {
      errors.push('Selected credits amount is invalid');
    }

    const totalUsed = newSelection.walletAmount + newSelection.creditsAmount + newSelection.cardAmount;
    if (Math.abs(totalUsed - totalAmount) > 0.01) {
      errors.push(
        `Payment amounts don't match booking total. Total: ${currency} ${totalUsed.toFixed(2)}, Required: ${currency} ${totalAmount.toFixed(2)}`
      );
    }

    if (newSelection.cardAmount > totalAmount) {
      errors.push('Card amount cannot exceed booking total');
    }

    if (newSelection.cardAmount < 0) {
      errors.push('Card amount cannot be negative');
    }

    const isValid = errors.length === 0;
    newSelection.errors = errors;
    newSelection.isValid = isValid;

    return newSelection;
  };

  // Handle wallet toggle
  const handleWalletToggle = (useWallet: boolean) => {
    let newSelection = { ...selection, useWallet };

    if (!useWallet) {
      newSelection.walletAmount = 0;
    } else if (walletBalance > 0) {
      // Auto-select wallet amount (up to wallet balance)
      newSelection.walletAmount = Math.min(walletBalance, totalAmount);
    }

    newSelection.cardAmount = totalAmount - newSelection.walletAmount - newSelection.creditsAmount;
    newSelection = validateSelection(newSelection);
    setSelection(newSelection);
    onPaymentMethodChange?.(newSelection);
    onValidationChange?.(newSelection.isValid);
  };

  // Handle wallet amount change
  const handleWalletAmountChange = (amount: string) => {
    const walletAmount = parseFloat(amount) || 0;
    let newSelection = {
      ...selection,
      walletAmount: Math.min(walletAmount, walletBalance),
    };

    newSelection.cardAmount = totalAmount - newSelection.walletAmount - newSelection.creditsAmount;
    newSelection = validateSelection(newSelection);
    setSelection(newSelection);
    onPaymentMethodChange?.(newSelection);
    onValidationChange?.(newSelection.isValid);
  };

  // Handle credit selection
  const handleCreditToggle = (creditId: string) => {
    let selectedCreditIds = [...selection.selectedCreditIds];

    if (selectedCreditIds.includes(creditId)) {
      selectedCreditIds = selectedCreditIds.filter((id) => id !== creditId);
    } else {
      selectedCreditIds.push(creditId);
    }

    const creditsAmount = calculateCreditsAmount(selectedCreditIds);
    let newSelection = {
      ...selection,
      useCredits: selectedCreditIds.length > 0,
      selectedCreditIds,
      creditsAmount,
    };

    newSelection.cardAmount = totalAmount - newSelection.walletAmount - newSelection.creditsAmount;
    newSelection = validateSelection(newSelection);
    setSelection(newSelection);
    onPaymentMethodChange?.(newSelection);
    onValidationChange?.(newSelection.isValid);
  };

  // Handle card amount change
  const handleCardAmountChange = (amount: string) => {
    const cardAmount = parseFloat(amount) || 0;
    let newSelection = { ...selection, cardAmount };
    newSelection = validateSelection(newSelection);
    setSelection(newSelection);
    onPaymentMethodChange?.(newSelection);
    onValidationChange?.(newSelection.isValid);
  };

  return (
    <div className="payment-method-selector">
      <h3>🛒 Select Payment Methods</h3>

      {/* Wallet Payment Option */}
      <div className="payment-method-option">
        <div className="option-header">
          <input
            type="checkbox"
            id="use-wallet"
            checked={selection.useWallet}
            onChange={(e) => handleWalletToggle(e.target.checked)}
            disabled={walletBalance <= 0}
            className="payment-checkbox"
          />
          <label htmlFor="use-wallet" className="option-label">
            <span className="icon">💰</span>
            <span className="name">Use Wallet</span>
            <span className="available">
              {walletBalance > 0 ? `(${currency} ${walletBalance.toFixed(2)} available)` : '(Empty)'}
            </span>
          </label>
        </div>

        {selection.useWallet && walletBalance > 0 && (
          <div className="option-details">
            <div className="input-group">
              <label htmlFor="wallet-amount">Amount:</label>
              <div className="amount-input">
                <span className="currency">{currency}</span>
                <input
                  type="number"
                  id="wallet-amount"
                  value={selection.walletAmount}
                  onChange={(e) => handleWalletAmountChange(e.target.value)}
                  min="0"
                  max={walletBalance}
                  step="0.01"
                  className="input"
                />
              </div>
            </div>
            <div className="preset-buttons">
              <button
                onClick={() => handleWalletAmountChange('0')}
                className="preset-btn"
              >
                Clear
              </button>
              <button
                onClick={() => handleWalletAmountChange(walletBalance.toString())}
                className="preset-btn primary"
              >
                Use All
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Airline Credits Option */}
      {availableCredits.length > 0 && (
        <div className="payment-method-option">
          <div className="option-header">
            <input
              type="checkbox"
              id="use-credits"
              checked={selection.useCredits}
              onChange={(e) => {
                if (!e.target.checked) {
                  handleCreditToggle('');
                  setSelection((prev) => ({
                    ...prev,
                    selectedCreditIds: [],
                    useCredits: false,
                  }));
                }
              }}
              className="payment-checkbox"
            />
            <label htmlFor="use-credits" className="option-label">
              <span className="icon">✈️</span>
              <span className="name">Use Airline Credits</span>
              <span className="count">({availableCredits.length} available)</span>
            </label>
          </div>

          {selection.useCredits && (
            <div className="credits-options">
              {availableCredits.map((credit) => (
                <div key={credit.id} className="credit-checkbox-item">
                  <input
                    type="checkbox"
                    id={`credit-${credit.id}`}
                    checked={selection.selectedCreditIds.includes(credit.id)}
                    onChange={() => handleCreditToggle(credit.id)}
                    className="credit-checkbox"
                  />
                  <label htmlFor={`credit-${credit.id}`} className="credit-label">
                    <span className="airline-badge">{credit.airlineIataCode}</span>
                    <span className="credit-info">
                      <span className="code">{credit.code}</span>
                      <span className="amount">{currency} {credit.amount.toFixed(2)}</span>
                      <span className="expiry">
                        Expires {new Date(credit.expiresAt).toLocaleDateString()}
                      </span>
                    </span>
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Card Payment */}
      <div className="payment-method-option">
        <div className="option-header">
          <span className="option-label">
            <span className="icon">💳</span>
            <span className="name">Card Payment</span>
          </span>
        </div>

        <div className="option-details">
          <div className="input-group">
            <label htmlFor="card-amount">Amount:</label>
            <div className="amount-input">
              <span className="currency">{currency}</span>
              <input
                type="number"
                id="card-amount"
                value={selection.cardAmount}
                onChange={(e) => handleCardAmountChange(e.target.value)}
                min="0"
                step="0.01"
                className="input"
              />
            </div>
          </div>
          <p className="field-description">
            The remaining balance after using wallet and credits
          </p>
        </div>
      </div>

      {/* Validation Errors */}
      {selection.errors.length > 0 && (
        <div className="validation-errors">
          {selection.errors.map((error, idx) => (
            <p key={idx} className="error-message">
              ⚠️ {error}
            </p>
          ))}
        </div>
      )}

      {/* Payment Summary */}
      <div className="payment-summary">
        <h4>Payment Summary</h4>
        <div className="summary-rows">
          <div className="summary-row">
            <span>From Wallet:</span>
            <span className="amount">{currency} {selection.walletAmount.toFixed(2)}</span>
          </div>
          <div className="summary-row">
            <span>From Credits:</span>
            <span className="amount">{currency} {selection.creditsAmount.toFixed(2)}</span>
          </div>
          <div className="summary-row">
            <span>From Card:</span>
            <span className="amount card">{currency} {selection.cardAmount.toFixed(2)}</span>
          </div>
          <div className="summary-row total">
            <span>Total:</span>
            <span className="amount">{currency} {totalAmount.toFixed(2)}</span>
          </div>
        </div>

        <div className={`validation-status ${selection.isValid ? 'valid' : 'invalid'}`}>
          {selection.isValid ? '✅ Ready to proceed' : '❌ Please fix errors above'}
        </div>
      </div>
    </div>
  );
};

export default PaymentMethodSelector;

/* ===== STYLES ===== */

const styles = `
.payment-method-selector {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.payment-method-selector h3 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 20px;
  color: #1a1a1a;
}

.payment-method-option {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}

.option-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.payment-checkbox {
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.payment-checkbox:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.option-label {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  font-weight: 600;
  cursor: pointer;
  font-size: 15px;
}

.option-label .icon {
  font-size: 18px;
}

.option-label .name {
  color: #1a1a1a;
}

.option-label .available,
.option-label .count {
  color: #666;
  font-weight: 400;
  font-size: 13px;
  margin-left: auto;
}

.option-details {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.input-group {
  margin-bottom: 12px;
}

.input-group label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 6px;
  color: #333;
}

.amount-input {
  display: flex;
  align-items: center;
  background: #f9f9f9;
  border: 1px solid #ddd;
  border-radius: 6px;
  overflow: hidden;
}

.currency {
  padding: 10px 12px;
  background: #f0f0f0;
  font-weight: 600;
  font-size: 14px;
  border-right: 1px solid #ddd;
}

.amount-input .input {
  flex: 1;
  border: none;
  padding: 10px 12px;
  font-size: 14px;
  outline: none;
}

.preset-buttons {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.preset-btn {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.preset-btn:hover {
  background: #f5f5f5;
}

.preset-btn.primary {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

.preset-btn.primary:hover {
  background: #0056b3;
}

.credits-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
}

.credit-checkbox-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f9f9f9;
  border-radius: 6px;
  cursor: pointer;
}

.credit-checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.credit-label {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  cursor: pointer;
}

.airline-badge {
  background: #e8f4f8;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 600;
  font-size: 12px;
  min-width: 40px;
  text-align: center;
}

.credit-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  font-size: 13px;
}

.credit-info .code {
  color: #666;
  font-family: monospace;
}

.credit-info .amount {
  font-weight: 600;
  color: #28a745;
  margin-left: auto;
}

.credit-info .expiry {
  color: #999;
  font-size: 12px;
}

.field-description {
  font-size: 12px;
  color: #999;
  margin-top: 8px;
}

.validation-errors {
  background: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 16px;
}

.error-message {
  font-size: 13px;
  color: #856404;
  margin: 4px 0;
}

.error-message:last-child {
  margin-bottom: 0;
}

.payment-summary {
  background: #f0f7ff;
  border: 1px solid #d0e8ff;
  border-radius: 8px;
  padding: 16px;
  margin-top: 16px;
}

.payment-summary h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
}

.summary-rows {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #666;
}

.summary-row .amount {
  font-weight: 600;
  color: #007bff;
}

.summary-row .amount.card {
  color: #ff9800;
}

.summary-row.total {
  border-top: 1px solid #d0e8ff;
  padding-top: 8px;
  margin-top: 8px;
  font-weight: 600;
  color: #1a1a1a;
}

.validation-status {
  text-align: center;
  padding: 8px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
}

.validation-status.valid {
  background: #d4edda;
  color: #155724;
}

.validation-status.invalid {
  background: #f8d7da;
  color: #721c24;
}
`;

export { styles };
