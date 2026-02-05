// frontend/components/TransferForm.tsx
// React component for wallet transfers between currencies

import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { FxPreview, TransferRequest } from '../services/walletApi.js';
import { walletApi } from '../services/walletApi.js';

interface TransferFormProps {
  defaultFromCurrency?: string;
  defaultToCurrency?: string;
  onTransferSuccess?: (transactionId: string) => void;
  onTransferError?: (error: string) => void;
}

export const TransferForm: React.FC<TransferFormProps> = ({
  defaultFromCurrency = 'USD',
  defaultToCurrency = 'EUR',
  onTransferSuccess,
  onTransferError,
}) => {
  const [fromCurrency, setFromCurrency] = useState(defaultFromCurrency);
  const [toCurrency, setToCurrency] = useState(defaultToCurrency);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fxPreview, setFxPreview] = useState<FxPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  // Supported currencies
  const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'INR'];

  // Fetch FX preview when amount changes
  useEffect(() => {
    if (!amount || parseFloat(amount) <= 0) {
      setFxPreview(null);
      return;
    }

    const fetchPreview = async () => {
      try {
        setPreviewLoading(true);
        setError(null);

        const preview = await walletApi.getFxPreview(
          fromCurrency,
          toCurrency,
          parseFloat(amount)
        );

        setFxPreview(preview);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch FX preview';
        setError(message);
        console.error('Error fetching FX preview:', err);
      } finally {
        setPreviewLoading(false);
      }
    };

    // Debounce preview fetch
    const timer = setTimeout(fetchPreview, 500);
    return () => clearTimeout(timer);
  }, [amount, fromCurrency, toCurrency]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (!amount || parseFloat(amount) <= 0) {
        throw new Error('Please enter a valid amount');
      }

      if (fromCurrency === toCurrency) {
        throw new Error('Please select different currencies');
      }

      const request: TransferRequest = {
        fromCurrency,
        toCurrency,
        amount: parseFloat(amount),
        idempotencyKey: uuidv4(),
      };

      const transaction = await walletApi.transferBetweenCurrencies(request);

      setSuccess(
        `Transfer successful! Transaction ID: ${transaction.id.substring(0, 8)}...`
      );
      setAmount('');
      setFxPreview(null);

      // Notify parent component
      if (onTransferSuccess) {
        onTransferSuccess(transaction.id);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Transfer failed';
      setError(message);

      if (onTransferError) {
        onTransferError(message);
      }

      console.error('Transfer error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="transfer-form-container">
      <h2>Transfer Between Currencies</h2>

      <form onSubmit={handleSubmit} className="transfer-form">
        {/* Error Message */}
        {error && <div className="alert alert-error">{error}</div>}

        {/* Success Message */}
        {success && <div className="alert alert-success">{success}</div>}

        {/* From Currency Section */}
        <div className="form-group">
          <label htmlFor="from-currency">From Currency</label>
          <select
            id="from-currency"
            value={fromCurrency}
            onChange={(e) => setFromCurrency(e.target.value)}
            disabled={loading}
          >
            {currencies.map((curr) => (
              <option key={curr} value={curr}>
                {curr}
              </option>
            ))}
          </select>
        </div>

        {/* Amount Input */}
        <div className="form-group">
          <label htmlFor="amount">
            Amount ({fromCurrency})
          </label>
          <input
            id="amount"
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            disabled={loading}
            required
          />
        </div>

        {/* To Currency Section */}
        <div className="form-group">
          <label htmlFor="to-currency">To Currency</label>
          <select
            id="to-currency"
            value={toCurrency}
            onChange={(e) => setToCurrency(e.target.value)}
            disabled={loading}
          >
            {currencies.map((curr) => (
              <option key={curr} value={curr}>
                {curr}
              </option>
            ))}
          </select>
        </div>

        {/* FX Preview */}
        {fxPreview && !previewLoading && (
          <div className="fx-preview">
            <div className="preview-header">
              <h4>Exchange Preview</h4>
              <span className="fx-rate">Rate: {fxPreview.fxRate.toFixed(6)}</span>
            </div>

            <div className="preview-items">
              <div className="preview-item">
                <span className="label">You Send</span>
                <span className="amount">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: fromCurrency,
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 6,
                  }).format(fxPreview.amount)}
                </span>
              </div>

              <div className="preview-arrow">→</div>

              <div className="preview-item">
                <span className="label">You Receive</span>
                <span className="amount">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: toCurrency,
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 6,
                  }).format(fxPreview.convertedAmount)}
                </span>
              </div>
            </div>

            <div className="preview-meta">
              <small>
                Rate fetched: {new Date(fxPreview.fetchedAt).toLocaleTimeString()}
              </small>
            </div>
          </div>
        )}

        {previewLoading && amount && (
          <div className="fx-preview loading">
            <p>Loading exchange rate...</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          className="submit-button"
          disabled={loading || !amount || parseFloat(amount) <= 0 || fromCurrency === toCurrency}
        >
          {loading ? 'Processing...' : 'Transfer'}
        </button>
      </form>

      <style>{`
        .transfer-form-container {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          max-width: 500px;
          margin: 0 auto;
          padding: 20px;
        }

        h2 {
          color: #333;
          margin-bottom: 24px;
        }

        .transfer-form {
          background: white;
          padding: 24px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .alert {
          padding: 12px;
          border-radius: 4px;
          margin-bottom: 16px;
          font-size: 14px;
        }

        .alert-error {
          background: #fee;
          color: #c33;
          border: 1px solid #fcc;
        }

        .alert-success {
          background: #efe;
          color: #3c3;
          border: 1px solid #cfc;
        }

        .form-group {
          margin-bottom: 16px;
        }

        label {
          display: block;
          margin-bottom: 6px;
          color: #333;
          font-weight: 500;
          font-size: 14px;
        }

        input,
        select {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
          font-family: inherit;
          transition: border-color 0.2s;
          box-sizing: border-box;
        }

        input:focus,
        select:focus {
          outline: none;
          border-color: #2196f3;
          box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.1);
        }

        input:disabled,
        select:disabled {
          background: #f5f5f5;
          color: #999;
          cursor: not-allowed;
        }

        .fx-preview {
          margin: 16px 0;
          padding: 16px;
          background: #f9f9f9;
          border-left: 4px solid #2196f3;
          border-radius: 4px;
        }

        .fx-preview.loading {
          text-align: center;
          color: #999;
        }

        .preview-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          border-bottom: 1px solid #e0e0e0;
          padding-bottom: 8px;
        }

        .preview-header h4 {
          margin: 0;
          color: #333;
          font-size: 14px;
        }

        .fx-rate {
          font-size: 12px;
          color: #2196f3;
          font-weight: bold;
        }

        .preview-items {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin: 12px 0;
        }

        .preview-item {
          flex: 1;
          text-align: center;
        }

        .preview-item .label {
          display: block;
          font-size: 12px;
          color: #999;
          margin-bottom: 4px;
        }

        .preview-item .amount {
          display: block;
          font-size: 16px;
          font-weight: bold;
          color: #333;
        }

        .preview-arrow {
          color: #ddd;
          font-size: 18px;
          margin: 0 8px;
        }

        .preview-meta {
          text-align: center;
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px solid #e0e0e0;
        }

        .preview-meta small {
          color: #999;
          font-size: 11px;
        }

        .submit-button {
          width: 100%;
          padding: 12px;
          margin-top: 8px;
          background: #2196f3;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 16px;
          font-weight: bold;
          cursor: pointer;
          transition: background 0.2s;
        }

        .submit-button:hover:not(:disabled) {
          background: #1976d2;
        }

        .submit-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default TransferForm;
