/**
 * Payment Receipt Modal
 * Displays payment receipt with breakdown and print/download options
 *
 * Features:
 * - Show full payment details
 * - Display payment method breakdown
 * - Print receipt button
 * - Download as PDF
 * - Email receipt option
 */

import React, { useState, useRef } from 'react';
import type { FC } from 'react';
import { getStoredAuthToken } from '../lib/authToken';
import { Button } from '@tripalfa/ui-components';
import { formatDateTime } from '@tripalfa/shared-utils/date-utils';

interface PaymentBreakdown {
  walletAmount: number;
  creditAmount: number;
  cardAmount: number;
}

interface Receipt {
  id: string;
  transactionId: string;
  bookingId: string;
  bookingReference: string;
  amount: number;
  currency: string;
  paymentDate: string;
  paymentStatus: string;
  paymentMethod: string;
  paymentBreakdown?: PaymentBreakdown;
  airline?: string;
  route?: string;
  passengers?: number;
  customerName?: string;
  customerEmail?: string;
  confirmation?: string;
}

interface PaymentReceiptModalProps {
  receipt: Receipt | null;
  isOpen: boolean;
  onClose: () => void;
}

const PaymentReceiptModal: FC<PaymentReceiptModalProps> = ({ receipt, isOpen, onClose }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !receipt) {
    return null;
  }

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Payment Receipt - ${receipt.transactionId}</title>
          <style>
            ${receiptStyles}
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.print();
  };

  const handleDownloadPDF = async () => {
    try {
      setIsDownloading(true);
      setMessage(null);

      const response = await fetch(`/api/receipts/${receipt.id}/download`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${getStoredAuthToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          format: 'pdf',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to download receipt');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `receipt-${receipt.transactionId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setMessage({ type: 'success', text: 'Receipt downloaded successfully!' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setMessage({ type: 'error', text: message });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSendEmail = async () => {
    if (!emailInput.trim()) {
      setMessage({ type: 'error', text: 'Please enter an email address' });
      return;
    }

    try {
      setIsSendingEmail(true);
      setMessage(null);

      const response = await fetch(`/api/receipts/${receipt.id}/email`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${getStoredAuthToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: emailInput,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send email');
      }

      setMessage({
        type: 'success',
        text: `Receipt sent to ${emailInput}!`,
      });
      setShowEmailForm(false);
      setEmailInput('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setMessage({ type: 'error', text: message });
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <div className="payment-receipt-modal-overlay" onClick={onClose}>
      <div className="payment-receipt-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h2>Payment Receipt</h2>
          <Button variant="outline" size="default" className="close-btn" onClick={onClose}>
            ✕
          </Button>
        </div>

        {/* Messages */}
        {message && (
          <div className={`message-alert ${message.type}`}>
            <span>{message.type === 'success' ? '✓' : '✕'}</span>
            <span>{message.text}</span>
          </div>
        )}

        {/* Modal Content */}
        <div className="modal-content">
          <div className="receipt-container" ref={printRef}>
            {/* Receipt Header */}
            <div className="receipt-header">
              <div className="receipt-title">
                <h3>PAYMENT RECEIPT</h3>
                <p className="receipt-subtitle">Transaction Record</p>
              </div>
              <div className="receipt-status">
                <span className={`status-badge ${receipt.paymentStatus.toLowerCase()}`}>
                  {receipt.paymentStatus === 'completed' ? '✓' : '⏳'} {receipt.paymentStatus}
                </span>
              </div>
            </div>

            {/* Transaction Details */}
            <div className="receipt-details-section">
              <h4>Transaction Details</h4>
              <div className="details-grid gap-4">
                <div className="detail-row">
                  <span className="detail-label">Transaction ID:</span>
                  <span className="detail-value">{receipt.transactionId}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Date & Time:</span>
                  <span className="detail-value">{formatDateTime(receipt.paymentDate)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Booking Reference:</span>
                  <span className="detail-value">{receipt.bookingReference}</span>
                </div>
                {receipt.confirmation && (
                  <div className="detail-row">
                    <span className="detail-label">Confirmation:</span>
                    <span className="detail-value">{receipt.confirmation}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Booking Information */}
            {(receipt.route || receipt.airline || receipt.passengers) && (
              <div className="receipt-details-section">
                <h4>Booking Information</h4>
                <div className="details-grid gap-4">
                  {receipt.route && (
                    <div className="detail-row">
                      <span className="detail-label">Route:</span>
                      <span className="detail-value">{receipt.route}</span>
                    </div>
                  )}
                  {receipt.airline && (
                    <div className="detail-row">
                      <span className="detail-label">Airline:</span>
                      <span className="detail-value">{receipt.airline}</span>
                    </div>
                  )}
                  {receipt.passengers && (
                    <div className="detail-row">
                      <span className="detail-label">Passengers:</span>
                      <span className="detail-value">{receipt.passengers}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Payment Breakdown */}
            <div className="receipt-details-section">
              <h4>Payment Breakdown</h4>
              {receipt.paymentBreakdown ? (
                <div className="payment-breakdown-table">
                  {receipt.paymentBreakdown.walletAmount > 0 && (
                    <div className="breakdown-row">
                      <span>💰 Wallet Payment</span>
                      <span>
                        {receipt.currency} {receipt.paymentBreakdown.walletAmount.toFixed(2)}
                      </span>
                    </div>
                  )}
                  {receipt.paymentBreakdown.creditAmount > 0 && (
                    <div className="breakdown-row">
                      <span>🎫 Airline Credit</span>
                      <span>
                        {receipt.currency} {receipt.paymentBreakdown.creditAmount.toFixed(2)}
                      </span>
                    </div>
                  )}
                  {receipt.paymentBreakdown.cardAmount > 0 && (
                    <div className="breakdown-row">
                      <span>💳 Card Payment</span>
                      <span>
                        {receipt.currency} {receipt.paymentBreakdown.cardAmount.toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="breakdown-row total">
                    <span>Total</span>
                    <span>
                      {receipt.currency} {receipt.amount.toFixed(2)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="single-payment">
                  <p>{receipt.paymentMethod}</p>
                  <p className="amount">
                    {receipt.currency} {receipt.amount.toFixed(2)}
                  </p>
                </div>
              )}
            </div>

            {/* Customer Information */}
            {(receipt.customerName || receipt.customerEmail) && (
              <div className="receipt-details-section">
                <h4>Customer Information</h4>
                <div className="details-grid gap-4">
                  {receipt.customerName && (
                    <div className="detail-row">
                      <span className="detail-label">Name:</span>
                      <span className="detail-value">{receipt.customerName}</span>
                    </div>
                  )}
                  {receipt.customerEmail && (
                    <div className="detail-row">
                      <span className="detail-label">Email:</span>
                      <span className="detail-value">{receipt.customerEmail}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="receipt-footer">
              <p>Thank you for your payment!</p>
              <p className="receipt-note">Please keep this receipt for your records.</p>
              <p className="receipt-date">Printed on: {formatDateTime(new Date().toISOString())}</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="modal-footer">
          <div className="action-group">
            <Button
              variant="outline"
              size="default"
              className="action-btn primary no-print"
              onClick={handlePrint}
            >
              🖨️ Print
            </Button>
            <Button
              variant="outline"
              size="default"
              className="action-btn no-print"
              onClick={handleDownloadPDF}
              disabled={isDownloading}
            >
              📥 {isDownloading ? 'Downloading...' : 'Download PDF'}
            </Button>
            <Button
              variant="outline"
              size="default"
              className="action-btn no-print"
              onClick={() => setShowEmailForm(!showEmailForm)}
            >
              📧 Email
            </Button>
          </div>

          {showEmailForm && (
            <div className="email-form">
              <input
                type="email"
                placeholder="Enter email address"
                value={emailInput}
                onChange={e => setEmailInput(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && handleSendEmail()}
              />
              <Button
                variant="outline"
                size="default"
                onClick={handleSendEmail}
                disabled={isSendingEmail}
                className="send-btn"
              >
                {isSendingEmail ? 'Sending...' : 'Send'}
              </Button>
            </div>
          )}

          <Button
            variant="outline"
            size="default"
            className="action-btn secondary no-print"
            onClick={onClose}
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PaymentReceiptModal;

/* ===== RECEIPT STYLES ===== */

const receiptStyles = `
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    line-height: 1.6;
    color: hsl(var(--foreground));
    margin: 0;
    padding: 0;
  }

  .receipt-container {
    width: 100%;
    max-width: 600px;
    margin: 0 auto;
    padding: 40px;
    background: hsl(var(--card));
  }

  .receipt-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30px;
    border-bottom: 2px solid hsl(var(--border));
    padding-bottom: 20px;
  }

  .receipt-title {
    margin: 0;
  }

  .receipt-title h3 {
    margin: 0;
    font-size: 24px;
    font-weight: 700;
  }

  .receipt-subtitle {
    margin: 4px 0 0 0;
    font-size: 12px;
    color: hsl(var(--muted-foreground));
  }

  .status-badge {
    padding: 6px 12px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 700;
  }

  .status-badge.completed {
    background: hsl(var(--secondary));
    color: hsl(var(--primary));
  }

  .status-badge.pending {
    background: hsl(var(--accent));
    color: hsl(var(--foreground));
  }

  .receipt-details-section {
    margin-bottom: 24px;
  }

  .receipt-details-section h4 {
    margin: 0 0 12px 0;
    font-size: 12px;
    text-transform: uppercase;
    color: hsl(var(--muted-foreground));
    font-weight: 700;
  }

  .details-grid {
    display: grid;
    gap: 8px;
  }

  .detail-row {
    display: flex;
    justify-content: space-between;
    gap: 16px;
  }

  .detail-label {
    font-size: 13px;
    color: hsl(var(--muted-foreground));
    font-weight: 600;
  }

  .detail-value {
    font-size: 13px;
    color: hsl(var(--foreground));
    font-weight: 700;
    text-align: right;
  }

  .payment-breakdown-table {
    border: 1px solid hsl(var(--border));
    border-radius: 4px;
    overflow: hidden;
  }

  .breakdown-row {
    display: flex;
    justify-content: space-between;
    padding: 10px 12px;
    border-bottom: 1px solid hsl(var(--border));
    font-size: 13px;
  }

  .breakdown-row:last-child {
    border-bottom: none;
  }

  .breakdown-row.total {
    background: hsl(var(--muted));
    font-weight: 700;
  }

  .single-payment {
    text-align: center;
  }

  .single-payment p {
    margin: 0;
    font-size: 13px;
  }

  .single-payment .amount {
    font-size: 24px;
    font-weight: 700;
    color: hsl(var(--primary));
  }

  .receipt-footer {
    text-align: center;
    margin-top: 40px;
    padding-top: 20px;
    border-top: 2px solid hsl(var(--border));
  }

  .receipt-footer p {
    margin: 8px 0;
    font-size: 13px;
  }

  .receipt-note {
    color: hsl(var(--muted-foreground));
    font-style: italic;
  }

  .receipt-date {
    font-size: 11px;
    color: hsl(var(--muted-foreground));
  }

  @media print {
    body {
      padding: 0;
      margin: 0;
    }
    .no-print {
      display: none !important;
    }
  }
`;

/* ===== MODAL STYLES ===== */

const styles = `
.payment-receipt-modal-overlay {
  display: flex;
  align-items: center;
  justify-content: center;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.payment-receipt-modal {
  background: hsl(var(--card));
  border-radius: 12px;
  width: 90%;
  max-width: 700px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid hsl(var(--border));
}

.modal-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: hsl(var(--foreground));
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: hsl(var(--muted-foreground));
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: hsl(var(--muted));
  color: hsl(var(--foreground));
}

.message-alert {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 12px 24px 0 24px;
  padding: 10px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
}

.message-alert.success {
  background: hsl(var(--secondary));
  color: hsl(var(--primary));
}

.message-alert.error {
  background: hsl(var(--destructive) / 0.12);
  color: hsl(var(--destructive));
}

.modal-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
}

.receipt-container {
  background: hsl(var(--muted));
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
  padding: 24px;
}

.receipt-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid hsl(var(--border));
}

.receipt-title h3 {
  margin: 0 0 4px 0;
  font-size: 18px;
  font-weight: 700;
  color: hsl(var(--foreground));
}

.receipt-title p {
  margin: 0;
  font-size: 12px;
  color: hsl(var(--muted-foreground));
}

.receipt-status {
  text-align: right;
}

.status-badge {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 700;
}

.status-badge.completed {
  background: hsl(var(--secondary));
  color: hsl(var(--primary));
}

.status-badge.pending {
  background: hsl(var(--accent));
  color: hsl(var(--foreground));
}

.receipt-details-section {
  margin-bottom: 20px;
}

.receipt-details-section h4 {
  margin: 0 0 12px 0;
  font-size: 11px;
  text-transform: uppercase;
  color: hsl(var(--muted-foreground));
  font-weight: 700;
  letter-spacing: 0.5px;
}

.details-grid {
  display: grid;
  gap: 8px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 8px 0;
  border-bottom: 1px solid hsl(var(--border));
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-label {
  font-size: 12px;
  color: hsl(var(--muted-foreground));
  font-weight: 600;
}

.detail-value {
  font-size: 12px;
  color: hsl(var(--foreground));
  font-weight: 700;
  text-align: right;
}

.payment-breakdown-table {
  border: 1px solid hsl(var(--border));
  border-radius: 6px;
  overflow: hidden;
}

.breakdown-row {
  display: flex;
  justify-content: space-between;
  padding: 10px 12px;
  border-bottom: 1px solid hsl(var(--border));
  font-size: 12px;
}

.breakdown-row:last-child {
  border-bottom: none;
}

.breakdown-row.total {
  background: hsl(var(--accent));
  font-weight: 700;
  color: hsl(var(--primary));
}

.single-payment {
  text-align: center;
  padding: 16px;
  background: hsl(var(--card));
  border-radius: 6px;
}

.single-payment p {
  margin: 0;
  font-size: 12px;
  color: hsl(var(--muted-foreground));
}

.single-payment .amount {
  font-size: 20px;
  font-weight: 700;
  color: hsl(var(--primary));
  margin-top: 8px;
}

.receipt-footer {
  text-align: center;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid hsl(var(--border));
}

.receipt-footer p {
  margin: 4px 0;
  font-size: 11px;
  color: hsl(var(--muted-foreground));
}

.receipt-footer p:first-child {
  font-size: 12px;
  color: hsl(var(--foreground));
  font-weight: 600;
}

.modal-footer {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid hsl(var(--border));
}

.action-group {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.action-btn {
  padding: 10px 16px;
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  color: hsl(var(--muted-foreground));
  transition: all 0.2s;
  flex: 1;
  min-width: 100px;
}

.action-btn:hover:not(:disabled) {
  background: hsl(var(--muted));
  border-color: hsl(var(--border));
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-btn.primary {
  background: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
  border-color: hsl(var(--primary));
}

.action-btn.primary:hover:not(:disabled) {
  background: hsl(var(--primary) / 0.9);
  border-color: hsl(var(--primary) / 0.9);
}

.action-btn.secondary {
  background: hsl(var(--muted));
  border-color: hsl(var(--border));
  color: hsl(var(--muted-foreground));
}

.email-form {
  display: flex;
  gap: 8px;
}

.email-form input {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid hsl(var(--border));
  border-radius: 6px;
  font-size: 13px;
}

.email-form input:focus {
  outline: none;
  border-color: hsl(var(--primary));
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.1);
}

.send-btn {
  padding: 10px 16px;
  background: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.2s;
}

.send-btn:hover:not(:disabled) {
  background: hsl(var(--primary) / 0.9);
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 600px) {
  .payment-receipt-modal {
    width: 95%;
    max-height: 95vh;
  }

  .action-group {
    flex-direction: column;
  }

  .action-btn {
    width: 100%;
  }

  .receipt-header {
    flex-direction: column;
  }

  .receipt-status {
    text-align: left;
  }

  .detail-row {
    flex-direction: column;
    text-align: right;
  }

  .detail-label {
    text-align: left;
  }
}

@media print {
  .payment-receipt-modal-overlay {
    background: hsl(var(--card));
  }

  .payment-receipt-modal {
    box-shadow: none;
    max-width: 100%;
    width: 100%;
    height: auto;
    border-radius: 0;
  }

  .modal-header,
  .modal-footer,
  .no-print {
    display: none !important;
  }

  .modal-content {
    padding: 0;
    max-height: none;
  }

  .receipt-container {
    background: white;
    border: none;
    box-shadow: none;
    padding: 40px;
  }
}
`;
