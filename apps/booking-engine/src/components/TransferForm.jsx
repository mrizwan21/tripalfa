// frontend/components/TransferForm.jsx
// Transfer funds between wallets with FX preview

import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { transferBetweenWallets, getFxPreview } from '../services/walletApi.js';

export function TransferForm({ token, wallets = [] }) {
  const [fromCurrency, setFromCurrency] = useState('');
  const [toCurrency, setToCurrency] = useState('');
  const [amount, setAmount] = useState('');
  const [fxPreview, setFxPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const currencies = [...new Set(wallets.map((w) => w.currency))];

  // Fetch FX preview when inputs change
  useEffect(() => {
    if (fromCurrency && toCurrency && amount && fromCurrency !== toCurrency) {
      (async () => {
        try {
          const preview = await getFxPreview(token, fromCurrency, toCurrency, amount);
          setFxPreview(preview);
        } catch (err) {
          console.error('Failed to fetch FX preview:', err);
        }
      })();
    } else {
      setFxPreview(null);
    }
  }, [fromCurrency, toCurrency, amount, token]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!fromCurrency || !toCurrency || !amount) {
      setError('All fields are required');
      return;
    }

    if (fromCurrency === toCurrency) {
      setError('Cannot transfer to the same currency');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const result = await transferBetweenWallets(token, {
        fromCurrency,
        toCurrency,
        amount: parseFloat(amount),
        idempotencyKey: uuidv4(),
      });

      if (result.success) {
        setSuccess(
          `Transfer completed: ${amount} ${fromCurrency} → ${result.transaction.converted} ${toCurrency}`
        );
        setFromCurrency('');
        setToCurrency('');
        setAmount('');
        setFxPreview(null);
      } else {
        setError(result.error || 'Transfer failed');
      }
    } catch (err) {
      setError(err.message);
      console.error('Transfer failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="transfer-form">
      <h2>Transfer Between Wallets</h2>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>From Currency:</label>
          <select
            value={fromCurrency}
            onChange={(e) => setFromCurrency(e.target.value)}
            required
          >
            <option value="">Select currency</option>
            {currencies.map((curr) => (
              <option key={curr} value={curr}>
                {curr}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>To Currency:</label>
          <select
            value={toCurrency}
            onChange={(e) => setToCurrency(e.target.value)}
            required
          >
            <option value="">Select currency</option>
            {currencies.map((curr) => (
              <option key={curr} value={curr}>
                {curr}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Amount:</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            step="0.01"
            required
          />
        </div>

        {fxPreview && (
          <div className="fx-preview">
            <p>
              You will receive:{' '}
              <strong>
                {parseFloat(fxPreview.converted).toFixed(2)} {toCurrency}
              </strong>
            </p>
            <p className="fx-rate">
              Rate: 1 {fromCurrency} = {parseFloat(fxPreview.fxRate).toFixed(4)} {toCurrency}
            </p>
          </div>
        )}

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <button type="submit" disabled={loading}>
          {loading ? 'Processing...' : 'Transfer'}
        </button>
      </form>
    </div>
  );
}

export default TransferForm;
