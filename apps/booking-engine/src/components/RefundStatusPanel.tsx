/**
 * Refund Status Panel
 * Displays pending refunds and their processing status
 * 
 * Features:
 * - List all refunds with status
 * - Show timeline of refund processing
 * - Display expected arrival dates
 * - Contact support for issues
 */

import React, { useState, useEffect } from 'react';
import type { FC } from 'react';

interface RefundRecord {
  id: string;
  bookingId: string;
  bookingReference: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'in-transit' | 'completed' | 'failed';
  refundReason: string;
  requestDate: string;
  expectedArrivalDate: string;
  completedDate?: string;
  refundMethod: 'original_payment' | 'wallet' | 'bank_transfer';
  timeline: Array<{
    status: RefundRecord['status'];
    date: string;
    description: string;
  }>;
}

interface RefundStatusResponse {
  refunds: RefundRecord[];
  totalCount: number;
  currency: string;
  averageProcessingTime: string;
}

interface RefundStatusPanelProps {
  customerId: string;
}

type StatusFilter = 'all' | 'pending' | 'processing' | 'completed' | 'failed';

const RefundStatusPanel: FC<RefundStatusPanelProps> = ({ customerId }) => {
  const [data, setData] = useState<RefundStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<StatusFilter>('all');
  const [expandedRefund, setExpandedRefund] = useState<string | null>(null);

  useEffect(() => {
    fetchRefundStatus();
  }, [customerId]);

  const fetchRefundStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/customers/${customerId}/refunds`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch refund status');
      }

      const responseData = await response.json();
      setData(responseData);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: RefundRecord['status']) => {
    const config = {
      pending: { label: '⏳ Pending', color: '#ff9800', icon: '⏳', step: 1 },
      processing: { label: '🔄 Processing', color: '#2196f3', icon: '🔄', step: 2 },
      'in-transit': { label: '📤 In Transit', color: '#673ab7', icon: '📤', step: 3 },
      completed: { label: '✓ Completed', color: '#4caf50', icon: '✓', step: 4 },
      failed: { label: '✕ Failed', color: '#f44336', icon: '✕', step: 0 },
    };
    return config[status];
  };

  const getRefundMethodLabel = (method: RefundRecord['refundMethod']) => {
    const labels = {
      original_payment: '💳 Original Payment Method',
      wallet: '💰 Your Wallet',
      bank_transfer: '🏦 Bank Transfer',
    };
    return labels[method];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getDaysUntilArrival = (arrivalDate: string) => {
    const now = new Date();
    const arrival = new Date(arrivalDate);
    const diff = arrival.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 3600 * 24));
    return days > 0 ? days : 0;
  };

  const filteredRefunds = data?.refunds.filter((refund) => {
    if (filterStatus === 'all') return true;
    return refund.status === filterStatus;
  }) || [];

  return (
    <div className="refund-status-panel">
      {error && (
        <div className="error-alert">
          <span>⚠️</span>
          <p>{error}</p>
          <button onClick={fetchRefundStatus}>Retry</button>
        </div>
      )}

      {loading ? (
        <div className="loading-state">
          <div className="spinner" />
          <p>Loading refund status...</p>
        </div>
      ) : data ? (
        <>
          {/* Summary Cards */}
          <div className="refund-summary-cards">
            <div className="summary-card">
              <div className="summary-icon">📊</div>
              <div className="summary-content">
                <p className="summary-label">Total Refunds</p>
                <p className="summary-value">{data.totalCount}</p>
              </div>
            </div>

            <div className="summary-card">
              <div className="summary-icon">⏱️</div>
              <div className="summary-content">
                <p className="summary-label">Avg. Processing Time</p>
                <p className="summary-value">{data.averageProcessingTime}</p>
              </div>
            </div>

            <div className="summary-card">
              <div className="summary-icon">✓</div>
              <div className="summary-content">
                <p className="summary-label">Completed</p>
                <p className="summary-value">
                  {data.refunds.filter((r) => r.status === 'completed').length}
                </p>
              </div>
            </div>

            <div className="summary-card">
              <div className="summary-icon">⏳</div>
              <div className="summary-content">
                <p className="summary-label">In Progress</p>
                <p className="summary-value">
                  {data.refunds.filter((r) => ['pending', 'processing', 'in-transit'].includes(r.status)).length}
                </p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="refund-filters">
            <button
              className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
              onClick={() => setFilterStatus('all')}
            >
              All ({data.refunds.length})
            </button>
            <button
              className={`filter-btn ${filterStatus === 'pending' ? 'active' : ''}`}
              onClick={() => setFilterStatus('pending')}
            >
              Pending ({data.refunds.filter((r) => r.status === 'pending').length})
            </button>
            <button
              className={`filter-btn ${filterStatus === 'processing' ? 'active' : ''}`}
              onClick={() => setFilterStatus('processing')}
            >
              Processing ({data.refunds.filter((r) => r.status === 'processing').length})
            </button>
            <button
              className={`filter-btn ${filterStatus === 'completed' ? 'active' : ''}`}
              onClick={() => setFilterStatus('completed')}
            >
              Completed ({data.refunds.filter((r) => r.status === 'completed').length})
            </button>
            <button
              className={`filter-btn ${filterStatus === 'failed' ? 'active' : ''}`}
              onClick={() => setFilterStatus('failed')}
            >
              Failed ({data.refunds.filter((r) => r.status === 'failed').length})
            </button>
          </div>

          {/* Refunds List */}
          {filteredRefunds.length === 0 ? (
            <div className="empty-state">
              <p>✨</p>
              <p>No refunds {filterStatus !== 'all' ? `found in this status` : 'found'}</p>
              <p className="empty-subtext">Good news! No refunds to track.</p>
            </div>
          ) : (
            <div className="refunds-list">
              {filteredRefunds.map((refund) => {
                const statusConfig = getStatusConfig(refund.status);
                const daysUntilArrival = getDaysUntilArrival(refund.expectedArrivalDate);

                return (
                  <div
                    key={refund.id}
                    className={`refund-card ${refund.status}`}
                  >
                    {/* Header */}
                    <div className="refund-header">
                      <div className="refund-info">
                        <p className="refund-ref">
                          Booking: <strong>{refund.bookingReference}</strong>
                        </p>
                        <p className="refund-reason">{refund.refundReason}</p>
                      </div>

                      <div className="refund-amount">
                        <p className="amount-value">
                          {refund.currency} {refund.amount.toFixed(2)}
                        </p>
                        <p className="amount-method">
                          {getRefundMethodLabel(refund.refundMethod)}
                        </p>
                      </div>
                    </div>

                    {/* Status Badge and Timeline */}
                    <div className="refund-status-section">
                      <div
                        className="status-badge"
                        style={{
                          backgroundColor: statusConfig.color + '20',
                          color: statusConfig.color,
                        }}
                      >
                        <span>{statusConfig.icon}</span>
                        <span>{statusConfig.label}</span>
                      </div>

                      {refund.status === 'failed' && (
                        <div className="failed-notice">
                          <span>⚠️</span>
                          <span>Refund processing failed. Please contact support.</span>
                        </div>
                      )}
                    </div>

                    {/* Dates */}
                    <div className="refund-dates">
                      <div className="date-item">
                        <span className="date-label">Requested:</span>
                        <span className="date-value">{formatDate(refund.requestDate)}</span>
                      </div>

                      {refund.status === 'completed' ? (
                        <div className="date-item">
                          <span className="date-label">Completed:</span>
                          <span className="date-value completed">
                            {refund.completedDate ? formatDate(refund.completedDate) : 'N/A'}
                          </span>
                        </div>
                      ) : (
                        <div className="date-item">
                          <span className="date-label">Expected Arrival:</span>
                          <span className={`date-value ${daysUntilArrival <= 3 ? 'soon' : ''}`}>
                            {formatDate(refund.expectedArrivalDate)}
                            {daysUntilArrival > 0 && ` (in ${daysUntilArrival} day${daysUntilArrival !== 1 ? 's' : ''})`}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Timeline */}
                    {refund.timeline && refund.timeline.length > 0 && (
                      <div className="refund-timeline">
                        <button
                          className="expand-timeline-btn"
                          onClick={() =>
                            setExpandedRefund(
                              expandedRefund === refund.id ? null : refund.id
                            )
                          }
                        >
                          {expandedRefund === refund.id ? 'Hide' : 'Show'} Timeline
                          {expandedRefund === refund.id ? ' ▼' : ' ▶'}
                        </button>

                        {expandedRefund === refund.id && (
                          <div className="timeline-content">
                            {refund.timeline.map((event, idx) => {
                              const eventConfig = getStatusConfig(event.status);
                              return (
                                <div
                                  key={idx}
                                  className="timeline-item"
                                  style={{
                                    borderLeftColor: idx === refund.timeline.length - 1 
                                      ? 'transparent' 
                                      : eventConfig.color,
                                  }}
                                >
                                  <div className="timeline-dot" style={{ backgroundColor: eventConfig.color }}>
                                    {eventConfig.icon}
                                  </div>
                                  <div className="timeline-content-inner">
                                    <p className="timeline-date">{formatDate(event.date)}</p>
                                    <p className="timeline-status">{event.status}</p>
                                    <p className="timeline-description">{event.description}</p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="refund-actions">
                      {refund.status === 'failed' && (
                        <button className="action-btn warning">
                          Contact Support
                        </button>
                      )}
                      {['pending', 'processing', 'in-transit'].includes(refund.status) && (
                        <button className="action-btn secondary">
                          Track Status
                        </button>
                      )}
                      <button className="action-btn secondary">
                        View Booking
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* FAQ Section */}
          <div className="refund-faq">
            <h3>Refund FAQ</h3>
            <div className="faq-items">
              <div className="faq-item">
                <p className="faq-question">How long do refunds take?</p>
                <p className="faq-answer">
                  Most refunds are processed within 5-7 business days, depending on your bank and payment method.
                </p>
              </div>
              <div className="faq-item">
                <p className="faq-question">Can I cancel my refund?</p>
                <p className="faq-answer">
                  Refunds can only be cancelled if they haven't been processed yet. Contact support immediately.
                </p>
              </div>
              <div className="faq-item">
                <p className="faq-question">What if my refund doesn't arrive?</p>
                <p className="faq-answer">
                  If your refund doesn't arrive within the expected timeframe, please contact support with your booking reference and transaction ID.
                </p>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};

export default RefundStatusPanel;

/* ===== STYLES ===== */

const styles = `
.refund-status-panel {
  background: white;
  border-radius: 12px;
  padding: 24px;
}

.error-alert {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #ffebee;
  border-left: 4px solid #c62828;
  border-radius: 8px;
  margin-bottom: 20px;
}

.error-alert p {
  margin: 0;
  flex: 1;
  color: #c62828;
}

.error-alert button {
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
  padding: 40px;
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

/* Summary Cards */
.refund-summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
  margin-bottom: 24px;
}

.summary-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: linear-gradient(135deg, #f5f5f5, #fafafa);
  border: 1px solid #e0e0e0;
  border-radius: 8px;
}

.summary-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.summary-content {
  flex: 1;
}

.summary-label {
  margin: 0 0 2px 0;
  font-size: 11px;
  color: #999;
  text-transform: uppercase;
  font-weight: 600;
}

.summary-value {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #1a1a1a;
}

/* Filters */
.refund-filters {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  overflow-x: auto;
  padding-bottom: 8px;
}

.filter-btn {
  padding: 8px 14px;
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 20px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  transition: all 0.2s;
}

.filter-btn:hover {
  background: #e0e0e0;
}

.filter-btn.active {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 40px 20px;
}

.empty-state p:first-child {
  font-size: 40px;
  margin: 0 0 12px 0;
}

.empty-state p {
  margin: 0;
  color: #999;
  font-size: 14px;
}

.empty-subtext {
  font-size: 12px !important;
  color: #bbb !important;
  margin-top: 8px !important;
}

/* Refunds List */
.refunds-list {
  display: grid;
  gap: 16px;
}

.refund-card {
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 16px;
  transition: all 0.2s;
}

.refund-card:hover {
  border-color: #bbb;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.refund-card.completed {
  background: #f1f8f4;
  border-left: 4px solid #4caf50;
}

.refund-card.pending {
  border-left: 4px solid #ff9800;
}

.refund-card.processing {
  border-left: 4px solid #2196f3;
}

.refund-card.full {
  border-left: 4px solid #673ab7;
}

.refund-card.failed {
  background: #fef5f5;
  border-left: 4px solid #f44336;
}

/* Refund Header */
.refund-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;
}

.refund-info {
  flex: 1;
}

.refund-ref {
  margin: 0 0 4px 0;
  font-size: 13px;
  color: #1a1a1a;
}

.refund-reason {
  margin: 0;
  font-size: 12px;
  color: #666;
  font-style: italic;
}

.refund-amount {
  text-align: right;
}

.amount-value {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #4caf50;
}

.amount-method {
  margin: 2px 0 0 0;
  font-size: 11px;
  color: #999;
}

/* Status Section */
.refund-status-section {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.status-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 700;
}

.failed-notice {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: #ffebee;
  border-radius: 6px;
  font-size: 12px;
  color: #c62828;
  font-weight: 600;
}

/* Refund Dates */
.refund-dates {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
  padding: 12px;
  background: #f9f9f9;
  border-radius: 8px;
  margin-bottom: 12px;
}

.date-item {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

.date-label {
  font-size: 12px;
  color: #999;
  font-weight: 600;
}

.date-value {
  font-size: 13px;
  font-weight: 700;
  color: #1a1a1a;
}

.date-value.completed {
  color: #4caf50;
}

.date-value.soon {
  color: #ff9800;
}

/* Timeline */
.refund-timeline {
  margin-top: 12px;
}

.expand-timeline-btn {
  padding: 6px 12px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  color: #007bff;
  transition: all 0.2s;
}

.expand-timeline-btn:hover {
  background: #f5f5f5;
}

.timeline-content {
  margin-top: 12px;
  padding: 12px;
  background: #f9f9f9;
  border-radius: 8px;
}

.timeline-item {
  display: grid;
  grid-template-columns: 30px 1fr;
  gap: 12px;
  padding-bottom: 12px;
  margin-bottom: 12px;
  border-left: 2px solid #ddd;
  padding-left: 12px;
}

.timeline-item:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
}

.timeline-dot {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  margin-left: -21px;
  color: white;
  flex-shrink: 0;
}

.timeline-content-inner {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.timeline-date {
  margin: 0;
  font-size: 11px;
  color: #999;
  font-weight: 600;
}

.timeline-status {
  margin: 0;
  font-size: 12px;
  font-weight: 700;
  color: #1a1a1a;
  text-transform: uppercase;
}

.timeline-description {
  margin: 0;
  font-size: 12px;
  color: #666;
}

/* Refund Actions */
.refund-actions {
  display: flex;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid #e0e0e0;
  flex-wrap: wrap;
}

.action-btn {
  padding: 8px 14px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  color: #666;
  transition: all 0.2s;
}

.action-btn:hover {
  background: #f5f5f5;
}

.action-btn.warning {
  background: #ffebee;
  border-color: #f44336;
  color: #f44336;
}

.action-btn.warning:hover {
  background: #ffcdd2;
}

.action-btn.secondary {
  background: #e3f2fd;
  border-color: #2196f3;
  color: #2196f3;
}

.action-btn.secondary:hover {
  background: #bbdefb;
}

/* FAQ Section */
.refund-faq {
  margin-top: 32px;
  padding: 20px;
  background: #f3e5f5;
  border-radius: 12px;
}

.refund-faq h3 {
  margin: 0 0 16px 0;
  font-size: 14px;
  font-weight: 700;
  color: #6a1b9a;
}

.faq-items {
  display: grid;
  gap: 12px;
}

.faq-item {
  padding: 12px;
  background: white;
  border-radius: 8px;
}

.faq-question {
  margin: 0 0 6px 0;
  font-size: 12px;
  font-weight: 700;
  color: #1a1a1a;
}

.faq-answer {
  margin: 0;
  font-size: 12px;
  color: #666;
  line-height: 1.5;
}

@media (max-width: 768px) {
  .refund-summary-cards {
    grid-template-columns: repeat(2, 1fr);
  }

  .refund-dates {
    grid-template-columns: 1fr;
  }

  .refund-header {
    flex-direction: column;
  }

  .refund-amount {
    text-align: left;
  }
}
`;

export { styles };
