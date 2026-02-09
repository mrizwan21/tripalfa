/**
 * Payment History Panel
 * Displays customer's past payments and transactions
 * 
 * Features:
 * - Sortable payment history
 * - Filter by date range
 * - Payment status indicators
 * - Download receipts
 * - Payment method icons
 */

import React, { useState, useEffect } from 'react';
import type { FC } from 'react';
import PaymentReceiptModal from './PaymentReceiptModal';

interface Payment {
  id: string;
  transactionId: string;
  bookingId: string;
  reference: string;
  amount: number;
  currency: string;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  paymentMethod: 'wallet' | 'credit' | 'card';
  paymentBreakdown?: {
    walletAmount: number;
    creditsAmount: number;
    cardAmount: number;
  };
  date: string;
  airline?: string;
}

interface PaymentHistoryPanelProps {
  customerId: string;
}

type SortField = 'date' | 'amount' | 'status';
type SortOrder = 'asc' | 'desc';

const PaymentHistoryPanel: FC<PaymentHistoryPanelProps> = ({ customerId }) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  useEffect(() => {
    fetchPaymentHistory();
  }, [customerId]);

  const fetchPaymentHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/customers/${customerId}/payment-history`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch payment history');
      }

      const data = await response.json();
      setPayments(data.payments || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const sortedPayments = [...payments].sort((a, b) => {
    let aVal, bVal;

    switch (sortField) {
      case 'date':
        aVal = new Date(a.date).getTime();
        bVal = new Date(b.date).getTime();
        break;
      case 'amount':
        aVal = a.amount;
        bVal = b.amount;
        break;
      case 'status':
        aVal = a.status.localeCompare(b.status);
        bVal = 0;
        break;
      default:
        return 0;
    }

    return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
  });

  const getStatusBadge = (status: Payment['status']) => {
    const config = {
      completed: { label: 'Completed', color: '#4caf50' },
      pending: { label: 'Pending', color: '#ff9800' },
      failed: { label: 'Failed', color: '#f44336' },
      refunded: { label: 'Refunded', color: '#2196f3' },
    };
    return config[status];
  };

  const getPaymentMethodIcon = (method: Payment['paymentMethod']) => {
    const icons = {
      wallet: '💰',
      credit: '🎫',
      card: '💳',
    };
    return icons[method];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDownloadReceipt = (payment: Payment) => {
    setSelectedPayment(payment);
    setShowReceiptModal(true);
  };

  return (
    <div className="payment-history-panel">
      {error && (
        <div className="error-message">
          <span>⚠️ {error}</span>
          <button onClick={fetchPaymentHistory}>Retry</button>
        </div>
      )}

      {loading ? (
        <div className="loading-state">
          <div className="spinner" />
          <p>Loading payment history...</p>
        </div>
      ) : payments.length === 0 ? (
        <div className="empty-state">
          <p>📭</p>
          <p>No payments found</p>
          <p className="empty-description">
            Your payment history will appear here once you make a booking.
          </p>
        </div>
      ) : (
        <>
          {/* Table Header */}
          <div className="history-table">
            <div className="table-header">
              <div className="col col-reference">
                <span>Booking Reference</span>
              </div>
              <div className="col col-date">
                <button className="sort-btn" onClick={() => handleSort('date')}>
                  Date
                  {sortField === 'date' && (
                    <span>{sortOrder === 'asc' ? ' ↑' : ' ↓'}</span>
                  )}
                </button>
              </div>
              <div className="col col-method">
                <span>Payment Method</span>
              </div>
              <div className="col col-amount">
                <button className="sort-btn" onClick={() => handleSort('amount')}>
                  Amount
                  {sortField === 'amount' && (
                    <span>{sortOrder === 'asc' ? ' ↑' : ' ↓'}</span>
                  )}
                </button>
              </div>
              <div className="col col-status">
                <button className="sort-btn" onClick={() => handleSort('status')}>
                  Status
                  {sortField === 'status' && (
                    <span>{sortOrder === 'asc' ? ' ↑' : ' ↓'}</span>
                  )}
                </button>
              </div>
              <div className="col col-actions">
                <span>Actions</span>
              </div>
            </div>

            {/* Table Rows */}
            {sortedPayments.map((payment) => {
              const statusConfig = getStatusBadge(payment.status);
              const methodIcon = getPaymentMethodIcon(payment.paymentMethod);

              return (
                <div key={payment.id} className="table-row">
                  <div className="col col-reference">
                    <div className="reference-cell">
                      <span className="airline">{payment.airline || 'Flight'}</span>
                      <span className="reference">{payment.reference}</span>
                    </div>
                  </div>
                  <div className="col col-date">
                    <span>{formatDate(payment.date)}</span>
                  </div>
                  <div className="col col-method">
                    <span className="method-badge">
                      {methodIcon}
                      <span className="capitalize">{payment.paymentMethod}</span>
                    </span>
                  </div>
                  <div className="col col-amount">
                    <span className="amount">
                      {payment.currency} {payment.amount.toFixed(2)}
                    </span>
                  </div>
                  <div className="col col-status">
                    <span
                      className="status-badge"
                      style={{ backgroundColor: statusConfig.color + '20', color: statusConfig.color }}
                    >
                      {statusConfig.label}
                    </span>
                  </div>
                  <div className="col col-actions">
                    <button
                      className="action-btn"
                      onClick={() => handleDownloadReceipt(payment)}
                      title="Download receipt"
                    >
                      📥
                    </button>
                    {payment.paymentBreakdown && (
                      <button
                        className="action-btn"
                        title="View breakdown"
                        onClick={() => alert(
                          `Wallet: ${payment.currency} ${payment.paymentBreakdown?.walletAmount.toFixed(2)}\n` +
                          `Credits: ${payment.currency} ${payment.paymentBreakdown?.creditsAmount.toFixed(2)}\n` +
                          `Card: ${payment.currency} ${payment.paymentBreakdown?.cardAmount.toFixed(2)}`
                        )}
                      >
                        📊
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary */}
          <div className="history-summary">
            <p>Showing {sortedPayments.length} payment(s)</p>
          </div>
        </>
      )}

      {/* Receipt Modal */}
      {showReceiptModal && selectedPayment && (
        <PaymentReceiptModal
          receipt={selectedPayment as any}
          isOpen={showReceiptModal}
          onClose={() => setShowReceiptModal(false)}
        />
      )}
    </div>
  );
};

export default PaymentHistoryPanel;

/* ===== STYLES ===== */

const styles = `
.payment-history-panel {
  background: white;
  border-radius: 12px;
  overflow: hidden;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #ffebee;
  color: #c62828;
  border-bottom: 1px solid #ef5350;
}

.error-message button {
  margin-left: auto;
  padding: 6px 12px;
  background: white;
  border: 1px solid #c62828;
  border-radius: 4px;
  color: #c62828;
  cursor: pointer;
  font-size: 12px;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f0f0f0;
  border-top-color: #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 12px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-state p {
  color: #666;
  font-size: 14px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.empty-state p:first-child {
  font-size: 48px;
  margin: 0 0 12px 0;
}

.empty-state p:nth-child(2) {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
}

.empty-description {
  font-size: 13px;
  color: #999;
  margin-top: 8px;
}

/* History Table */
.history-table {
  overflow-x: auto;
}

.table-header {
  display: grid;
  grid-template-columns: 2fr 1.5fr 1fr 1.2fr 1fr 0.8fr;
  gap: 16px;
  padding: 16px 20px;
  background: #f9f9f9;
  border-bottom: 2px solid #e0e0e0;
  font-size: 12px;
  font-weight: 700;
  color: #666;
  text-transform: uppercase;
  align-items: center;
}

.col {
  display: flex;
  align-items: center;
}

.sort-btn {
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  font-weight: 700;
  font-size: 12px;
  text-transform: uppercase;
}

.sort-btn:hover {
  color: #007bff;
}

.table-row {
  display: grid;
  grid-template-columns: 2fr 1.5fr 1fr 1.2fr 1fr 0.8fr;
  gap: 16px;
  padding: 16px 20px;
  border-bottom: 1px solid #e0e0e0;
  align-items: center;
  transition: background 0.2s;
}

.table-row:hover {
  background: #f5f5f5;
}

.reference-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.airline {
  font-size: 11px;
  color: #999;
  text-transform: uppercase;
  font-weight: 600;
}

.reference {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
}

.method-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.capitalize {
  text-transform: capitalize;
}

.amount {
  font-weight: 700;
  font-size: 14px;
  color: #007bff;
}

.status-badge {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.action-btn {
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  padding: 4px 8px;
  transition: transform 0.2s;
}

.action-btn:hover {
  transform: scale(1.2);
}

.history-summary {
  padding: 16px 20px;
  background: #f9f9f9;
  border-top: 1px solid #e0e0e0;
  font-size: 12px;
  color: #666;
}

.history-summary p {
  margin: 0;
}

@media (max-width: 768px) {
  .table-header,
  .table-row {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .col {
    flex-wrap: wrap;
  }

  .table-header .col::before {
    content: attr(data-label);
    font-weight: 700;
    display: block;
    width: 100%;
  }
}
`;

export { styles };
