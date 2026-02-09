/**
 * Payment Confirmation Component
 * Displays final payment review and handles payment submission
 * 
 * Features:
 * - Booking details summary
 * - Payment breakdown review
 * - Payment method display
 * - Secure processing confirmation
 * - Submit and error handling
 * - Loading states during processing
 */

import React, { useState } from 'react';
import type { FC } from 'react';

interface BookingDetails {
  bookingId: string;
  reference: string;
  flightDetails: string;
  passengerName: string;
  totalAmount: number;
  currency: string;
}

interface PaymentBreakdown {
  walletAmount: number;
  creditsAmount: number;
  cardAmount: number;
  creditsUsed: Array<{ id: string; code: string; amount: number; airline: string }>;
}

interface PaymentConfirmationProps {
  bookingDetails: BookingDetails;
  paymentBreakdown: PaymentBreakdown;
  onConfirm?: () => Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
}

const PaymentConfirmation: FC<PaymentConfirmationProps> = ({
  bookingDetails,
  paymentBreakdown,
  onConfirm,
  onCancel,
  loading = false,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleConfirmPayment = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      if (onConfirm) {
        await onConfirm();
      }
      setSuccess(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Payment processing failed';
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  if (success) {
    return (
      <div className="payment-success">
        <div className="success-icon">✅</div>
        <h2>Payment Successful!</h2>
        <p className="confirmation-number">
          Confirmation: <strong>{bookingDetails.reference}</strong>
        </p>
        <p className="success-message">
          Your payment has been processed successfully. You will receive a confirmation email shortly.
        </p>
        <div className="success-details">
          <div className="detail-item">
            <span>Booking ID:</span>
            <span>{bookingDetails.bookingId}</span>
          </div>
          <div className="detail-item">
            <span>Total Amount:</span>
            <span>{bookingDetails.currency} {bookingDetails.totalAmount.toFixed(2)}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-confirmation">
      <h2>Confirm Your Payment</h2>

      {/* Booking Summary */}
      <section className="confirmation-section">
        <h3>Booking Details</h3>
        <div className="booking-summary">
          <div className="summary-row">
            <span className="label">Booking Reference:</span>
            <span className="value reference">{bookingDetails.reference}</span>
          </div>
          <div className="summary-row">
            <span className="label">Passenger Name:</span>
            <span className="value">{bookingDetails.passengerName}</span>
          </div>
          <div className="summary-row">
            <span className="label">Flight Details:</span>
            <span className="value">{bookingDetails.flightDetails}</span>
          </div>
        </div>
      </section>

      {/* Payment Breakdown */}
      <section className="confirmation-section">
        <h3>Payment Breakdown</h3>
        <div className="payment-breakdown-detail">
          {paymentBreakdown.walletAmount > 0 && (
            <div className="breakdown-row">
              <div className="payment-method">
                <span className="icon">💰</span>
                <span className="name">Wallet Payment</span>
              </div>
              <span className="amount">
                {bookingDetails.currency} {paymentBreakdown.walletAmount.toFixed(2)}
              </span>
            </div>
          )}

          {paymentBreakdown.creditsUsed.length > 0 && (
            <div className="breakdown-row">
              <div className="payment-method">
                <span className="icon">✈️</span>
                <span className="name">Airline Credits</span>
              </div>
              <span className="amount">
                {bookingDetails.currency} {paymentBreakdown.creditsAmount.toFixed(2)}
              </span>
            </div>
          )}

          {paymentBreakdown.creditsUsed.length > 0 && (
            <div className="credits-details">
              <p className="details-header">Credits Used:</p>
              {paymentBreakdown.creditsUsed.map((credit) => (
                <div key={credit.id} className="credit-detail">
                  <span className="airline-code">{credit.airline}</span>
                  <span className="credit-code">{credit.code}</span>
                  <span className="amount">
                    -{bookingDetails.currency} {credit.amount.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {paymentBreakdown.cardAmount > 0 && (
            <div className="breakdown-row card-row">
              <div className="payment-method">
                <span className="icon">💳</span>
                <span className="name">Card Payment</span>
              </div>
              <span className="amount">
                {bookingDetails.currency} {paymentBreakdown.cardAmount.toFixed(2)}
              </span>
            </div>
          )}

          <div className="breakdown-row total-row">
            <div className="payment-method">
              <span className="name">Total Amount</span>
            </div>
            <span className="amount total">
              {bookingDetails.currency} {bookingDetails.totalAmount.toFixed(2)}
            </span>
          </div>
        </div>
      </section>

      {/* Payment Method Info */}
      <section className="confirmation-section">
        <h3>Payment Information</h3>
        <div className="payment-info">
          {paymentBreakdown.cardAmount > 0 && (
            <div className="info-box">
              <p className="info-title">💳 Card Payment</p>
              <p className="info-text">
                Your card will be charged {bookingDetails.currency} {paymentBreakdown.cardAmount.toFixed(2)} at checkout.
              </p>
              <p className="info-note">
                All transactions are secured with 256-bit encryption.
              </p>
            </div>
          )}

          {paymentBreakdown.walletAmount > 0 && (
            <div className="info-box">
              <p className="info-title">💰 Wallet Deduction</p>
              <p className="info-text">
                {bookingDetails.currency} {paymentBreakdown.walletAmount.toFixed(2)} will be deducted from your wallet.
              </p>
            </div>
          )}

          {paymentBreakdown.creditsAmount > 0 && (
            <div className="info-box">
              <p className="info-title">✈️ Credits Applied</p>
              <p className="info-text">
                {paymentBreakdown.creditsUsed.length} airline credit(s) totaling{' '}
                {bookingDetails.currency} {paymentBreakdown.creditsAmount.toFixed(2)} will be applied.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Error Display */}
      {error && (
        <div className="error-alert">
          <p className="error-title">⚠️ Payment Processing Error</p>
          <p className="error-message">{error}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="confirmation-actions">
        <button
          onClick={onCancel}
          disabled={isProcessing}
          className="btn btn-secondary"
        >
          Cancel
        </button>
        <button
          onClick={handleConfirmPayment}
          disabled={isProcessing}
          className="btn btn-primary"
        >
          {isProcessing ? (
            <>
              <span className="spinner-mini" />
              Processing...
            </>
          ) : (
            `Pay ${bookingDetails.currency} ${bookingDetails.totalAmount.toFixed(2)}`
          )}
        </button>
      </div>

      {/* Security Badge */}
      <div className="security-badge">
        <span className="badge-icon">🔒</span>
        <span className="badge-text">Secure Payment Processing</span>
      </div>
    </div>
  );
};

export default PaymentConfirmation;

/* ===== STYLES ===== */

const styles = `
.payment-confirmation {
  background: white;
  border-radius: 12px;
  padding: 28px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  max-width: 600px;
  margin: 0 auto;
}

.payment-confirmation h2 {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 28px;
  color: #1a1a1a;
  text-align: center;
}

.confirmation-section {
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid #e0e0e0;
}

.confirmation-section:last-of-type {
  border-bottom: none;
}

.confirmation-section h3 {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #333;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.booking-summary {
  background: #f9f9f9;
  border-radius: 8px;
  padding: 16px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 8px 0;
  font-size: 14px;
}

.summary-row .label {
  color: #666;
  font-weight: 500;
}

.summary-row .value {
  color: #1a1a1a;
  text-align: right;
  max-width: 250px;
  word-break: break-word;
}

.summary-row .value.reference {
  font-family: monospace;
  background: #e8f4f8;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 600;
}

.payment-breakdown-detail {
  background: #f0f7ff;
  border: 1px solid #d0e8ff;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.breakdown-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: white;
  border-radius: 6px;
  font-size: 14px;
}

.payment-method {
  display: flex;
  align-items: center;
  gap: 10px;
}

.payment-method .icon {
  font-size: 18px;
}

.payment-method .name {
  font-weight: 500;
  color: #333;
}

.breakdown-row .amount {
  font-weight: 600;
  color: #007bff;
  font-size: 16px;
}

.breakdown-row.card-row {
  background: #fff9f3;
  border: 1px solid #ffe0b2;
}

.breakdown-row.card-row .amount {
  color: #ff9800;
}

.breakdown-row.total-row {
  background: #e8f4f8;
  border: 2px solid #007bff;
  margin-top: 8px;
}

.breakdown-row.total-row .amount.total {
  color: #007bff;
  font-size: 18px;
}

.credits-details {
  background: white;
  border-radius: 6px;
  padding: 12px;
  margin-top: 4px;
}

.details-header {
  font-size: 12px;
  font-weight: 600;
  color: #666;
  margin: 0 0 8px 0;
  text-transform: uppercase;
}

.credit-detail {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  font-size: 12px;
  color: #666;
  border-top: 1px solid #f0f0f0;
}

.credit-detail:first-child {
  border-top: none;
}

.airline-code {
  background: #e8f4f8;
  padding: 2px 6px;
  border-radius: 3px;
  font-weight: 600;
  min-width: 35px;
  text-align: center;
}

.credit-code {
  font-family: monospace;
  color: #999;
}

.payment-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-box {
  background: #f9f9f9;
  border-left: 4px solid #007bff;
  padding: 12px;
  border-radius: 4px;
}

.info-title {
  font-size: 13px;
  font-weight: 600;
  margin: 0 0 6px 0;
  color: #1a1a1a;
}

.info-text {
  font-size: 13px;
  color: #666;
  margin: 4px 0;
}

.info-note {
  font-size: 12px;
  color: #999;
  margin: 6px 0 0 0;
}

.error-alert {
  background: #ffebee;
  border: 1px solid #ef5350;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
}

.error-title {
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 6px 0;
  color: #c62828;
}

.error-message {
  font-size: 13px;
  color: #d32f2f;
  margin: 0;
}

.confirmation-actions {
  display: flex;
  gap: 12px;
  margin-top: 28px;
  margin-bottom: 16px;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: #007bff;
  color: white;
  flex: 1;
}

.btn-primary:hover:not(:disabled) {
  background: #0056b3;
  box-shadow: 0 2px 8px rgba(0, 123, 255, 0.3);
}

.btn-secondary {
  background: white;
  color: #666;
  border: 1px solid #ddd;
}

.btn-secondary:hover:not(:disabled) {
  background: #f5f5f5;
}

.spinner-mini {
  display: inline-block;
  width: 12px;
  height: 12px;
  border: 2px solid #ffffff;
  border-top: 2px solid transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.security-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px;
  background: #e8f5e9;
  border-radius: 6px;
  font-size: 13px;
  color: #2e7d32;
  font-weight: 500;
}

.badge-icon {
  font-size: 16px;
}

/* Success State */
.payment-success {
  text-align: center;
  padding: 40px 28px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  max-width: 500px;
  margin: 0 auto;
}

.success-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.payment-success h2 {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 12px;
  color: #2e7d32;
}

.confirmation-number {
  font-size: 14px;
  color: #666;
  margin-bottom: 12px;
}

.confirmation-number strong {
  font-family: monospace;
  background: #e8f5e9;
  padding: 4px 8px;
  border-radius: 4px;
}

.success-message {
  font-size: 14px;
  color: #666;
  margin-bottom: 20px;
}

.success-details {
  background: #f5f5f5;
  border-radius: 8px;
  padding: 16px;
  text-align: left;
}

.success-details .detail-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  font-size: 13px;
}

.success-details .detail-item span:first-child {
  color: #666;
}

.success-details .detail-item span:last-child {
  font-weight: 600;
  color: #1a1a1a;
}
`;

export { styles };
