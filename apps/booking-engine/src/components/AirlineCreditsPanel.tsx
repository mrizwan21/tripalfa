/**
 * Airline Credits Panel
 * Displays customer's airline credits and usage history
 *
 * Features:
 * - List all airline credits by airline
 * - Show expiration dates and balances
 * - Filter and sort options
 * - Usage history
 */

import React, { useState, useEffect } from 'react';
import type { FC } from 'react';
import { getStoredAuthToken } from '../lib/authToken';
import { Button } from '@tripalfa/ui-components';
import { formatDate } from '@tripalfa/shared-utils/date-utils';

interface AirlineCredit {
  id: string;
  code: string;
  airlineCode: string;
  airlineName: string;
  amount: number;
  usedAmount: number;
  currency: string;
  expiresAt: string;
  issuedAt: string;
  status: 'active' | 'expired' | 'used';
  reason?: string;
}

interface CreditUsageRecord {
  id: string;
  creditId: string;
  bookingId: string;
  amount: number;
  date: string;
  description: string;
}

interface AirlineCreditsResponse {
  credits: AirlineCredit[];
  totalBalance: number;
  currency: string;
  usageHistory: CreditUsageRecord[];
}

interface AirlineCreditsPanelProps {
  customerId: string;
}

type FilterStatus = 'all' | 'active' | 'expired' | 'used';

const AirlineCreditsPanel: FC<AirlineCreditsPanelProps> = ({ customerId }) => {
  const [data, setData] = useState<AirlineCreditsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [expandedCredit, setExpandedCredit] = useState<string | null>(null);

  useEffect(() => {
    fetchAirlineCredits();
  }, [customerId]);

  const fetchAirlineCredits = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/customers/${customerId}/airline-credits`, {
        headers: {
          Authorization: `Bearer ${getStoredAuthToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch airline credits');
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

  const getStatusBadge = (status: AirlineCredit['status']) => {
    const config = {
      active: {
        label: 'Active',
        color: 'hsl(var(--secondary))',
        bgColor: 'hsl(var(--secondary) / 0.14)',
        icon: '✓',
      },
      expired: {
        label: 'Expired',
        color: 'hsl(var(--destructive))',
        bgColor: 'hsl(var(--destructive) / 0.14)',
        icon: '✕',
      },
      used: {
        label: 'Used',
        color: 'hsl(var(--primary))',
        bgColor: 'hsl(var(--primary) / 0.14)',
        icon: '✓',
      },
    };
    return config[status];
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  const getDaysUntilExpiration = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 3600 * 24));
  };

  const filteredCredits =
    data?.credits.filter(credit => {
      if (filterStatus === 'all') return true;
      return credit.status === filterStatus;
    }) || [];

  const groupedByAirline = filteredCredits.reduce(
    (acc, credit) => {
      if (!acc[credit.airlineCode]) {
        acc[credit.airlineCode] = [];
      }
      acc[credit.airlineCode].push(credit);
      return acc;
    },
    {} as Record<string, AirlineCredit[]>
  );

  return (
    <div className="airline-credits-panel">
      {error && (
        <div className="error-alert">
          <span>⚠️</span>
          <p>{error}</p>
          <Button variant="outline" size="default" onClick={fetchAirlineCredits}>
            Retry
          </Button>
        </div>
      )}

      {loading ? (
        <div className="loading-state">
          <div className="spinner" />
          <p>Loading airline credits...</p>
        </div>
      ) : data ? (
        <>
          {/* Total Balance */}
          <div className="total-credits-card">
            <div className="total-content">
              <p className="total-label">Total Airline Credits</p>
              <p className="total-amount">
                {data.currency} {data.totalBalance.toFixed(2)}
              </p>
            </div>
            <div className="total-icon">🎫</div>
          </div>

          {/* Filter */}
          <div className="credit-filters">
            <Button
              variant="outline"
              size="default"
              className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
              onClick={() => setFilterStatus('all')}
            >
              All ({data.credits.length})
            </Button>
            <Button
              variant="outline"
              size="default"
              className={`filter-btn ${filterStatus === 'active' ? 'active' : ''}`}
              onClick={() => setFilterStatus('active')}
            >
              Active ({data.credits.filter(c => c.status === 'active').length})
            </Button>
            <Button
              variant="outline"
              size="default"
              className={`filter-btn ${filterStatus === 'expired' ? 'active' : ''}`}
              onClick={() => setFilterStatus('expired')}
            >
              Expired ({data.credits.filter(c => c.status === 'expired').length})
            </Button>
            <Button
              variant="outline"
              size="default"
              className={`filter-btn ${filterStatus === 'used' ? 'active' : ''}`}
              onClick={() => setFilterStatus('used')}
            >
              Used ({data.credits.filter(c => c.status === 'used').length})
            </Button>
          </div>

          {/* Credits by Airline */}
          {Object.keys(groupedByAirline).length === 0 ? (
            <div className="empty-state">
              <p>🎫</p>
              <p>No airline credits found</p>
            </div>
          ) : (
            <div className="credits-list">
              {Object.entries(groupedByAirline).map(([airlineCode, credits]) => (
                <div key={airlineCode} className="airline-group">
                  <div className="airline-header">
                    <span className="airline-name">
                      {credits[0].airlineName} ({airlineCode})
                    </span>
                    <span className="airline-total">
                      {data.currency}{' '}
                      {credits.reduce((sum, c) => sum + (c.amount - c.usedAmount), 0).toFixed(2)}
                    </span>
                  </div>

                  <div className="credits-items">
                    {credits.map(credit => {
                      const statusConfig = getStatusBadge(credit.status);
                      const daysLeft = getDaysUntilExpiration(credit.expiresAt);
                      const balance = credit.amount - credit.usedAmount;

                      return (
                        <div key={credit.id} className={`credit-item ${credit.status}`}>
                          <div
                            className="credit-header-row"
                            onClick={() =>
                              setExpandedCredit(expandedCredit === credit.id ? null : credit.id)
                            }
                          >
                            <div className="credit-left">
                              <p className="credit-code">{credit.code}</p>
                              <p className="credit-issued">Issued: {formatDate(credit.issuedAt)}</p>
                            </div>

                            <div className="credit-middle">
                              <span
                                className="status-badge"
                                style={{
                                  backgroundColor: statusConfig.bgColor,
                                  color: statusConfig.color,
                                }}
                              >
                                {statusConfig.label}
                              </span>
                            </div>

                            <div className="credit-right">
                              <p className="credit-balance">
                                {data.currency} {balance.toFixed(2)}
                              </p>
                              {credit.status === 'active' && daysLeft <= 30 && (
                                <p className="expiry-warning">
                                  Expires in {daysLeft} day
                                  {daysLeft !== 1 ? 's' : ''}
                                </p>
                              )}
                              {credit.status === 'expired' && (
                                <p className="expired-date">
                                  Expired: {formatDate(credit.expiresAt)}
                                </p>
                              )}
                            </div>

                            <div className="expand-icon">
                              {expandedCredit === credit.id ? '▼' : '▶'}
                            </div>
                          </div>

                          {/* Expanded Details */}
                          {expandedCredit === credit.id && (
                            <div className="credit-details">
                              <div className="detail-row">
                                <span className="detail-label">Original Amount:</span>
                                <span className="detail-value">
                                  {data.currency} {credit.amount.toFixed(2)}
                                </span>
                              </div>
                              <div className="detail-row">
                                <span className="detail-label">Used Amount:</span>
                                <span className="detail-value">
                                  {data.currency} {credit.usedAmount.toFixed(2)}
                                </span>
                              </div>
                              <div className="detail-row">
                                <span className="detail-label">Remaining:</span>
                                <span className="detail-value">
                                  {data.currency} {balance.toFixed(2)}
                                </span>
                              </div>
                              <div className="detail-row">
                                <span className="detail-label">Expires:</span>
                                <span className="detail-value">{formatDate(credit.expiresAt)}</span>
                              </div>
                              {credit.reason && (
                                <div className="detail-row">
                                  <span className="detail-label">Reason:</span>
                                  <span className="detail-value">{credit.reason}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Usage History */}
          {data.usageHistory.length > 0 && (
            <div className="usage-history">
              <h3>Recent Usage</h3>
              <div className="history-items">
                {data.usageHistory.slice(0, 5).map(record => (
                  <div key={record.id} className="history-item">
                    <div className="history-icon">🎫</div>
                    <div className="history-details">
                      <p className="history-description">{record.description}</p>
                      <p className="history-date">{formatDate(record.date)}</p>
                    </div>
                    <div className="history-amount">
                      -{data.currency} {record.amount.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="credits-info">
            <h4>About Airline Credits</h4>
            <ul>
              <li>Credits are automatically applied to your next booking</li>
              <li>Credits are prioritized by expiration date</li>
              <li>Unused credits will expire on the date shown</li>
              <li>Combine credits with wallet and card for flexible payments</li>
              <li>Check back regularly for new credits from your bookings</li>
            </ul>
          </div>
        </>
      ) : null}
    </div>
  );
};

export default AirlineCreditsPanel;

/* ===== STYLES ===== */

const styles = `
.airline-credits-panel {
  background: white;
  border-radius: 12px;
  padding: 24px;
}

.error-alert {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: hsl(var(--destructive) / 0.12);
  border-left: 4px solid hsl(var(--destructive));
  border-radius: 8px;
  margin-bottom: 20px;
}

.error-alert p {
  margin: 0;
  flex: 1;
  color: hsl(var(--destructive));
}

.error-alert button {
  padding: 6px 12px;
  background: white;
  border: 1px solid hsl(var(--destructive));
  border-radius: 4px;
  color: hsl(var(--destructive));
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
  border: 3px solid hsl(var(--muted));
  border-top-color: hsl(var(--primary));
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 12px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Total Credits Card */
.total-credits-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, hsl(var(--secondary) / 0.16), hsl(var(--secondary) / 0.12));
  border: 1px solid hsl(var(--secondary) / 0.4);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
}

.total-content {
  flex: 1;
}

.total-label {
  margin: 0 0 8px 0;
  font-size: 12px;
  color: hsl(var(--muted-foreground));
  text-transform: uppercase;
  font-weight: 600;
}

.total-amount {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: hsl(var(--secondary));
}

.total-icon {
  font-size: 40px;
  margin-left: 20px;
}

/* Filters */
.credit-filters {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  overflow-x: auto;
  padding-bottom: 8px;
}

.filter-btn {
  padding: 8px 16px;
  background: hsl(var(--muted));
  border: 1px solid hsl(var(--border));
  border-radius: 20px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  transition: all 0.2s;
}

.filter-btn:hover {
  background: hsl(var(--border));
}

.filter-btn.active {
  background: hsl(var(--primary));
  color: white;
  border-color: hsl(var(--primary));
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
  color: hsl(var(--muted-foreground));
}

/* Credits List */
.credits-list {
  display: grid;
  gap: 20px;
}

.airline-group {
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
  overflow: hidden;
}

.airline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: hsl(var(--muted));
  border-bottom: 1px solid hsl(var(--border));
  font-weight: 700;
}

.airline-name {
  font-size: 14px;
  color: hsl(var(--foreground));
}

.airline-total {
  color: hsl(var(--secondary));
}

.credits-items {
  display: grid;
  gap: 0;
}

.credit-item {
  border-bottom: 1px solid hsl(var(--border));
}

.credit-item:last-child {
  border-bottom: none;
}

.credit-header-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1.5fr 0.5fr;
  gap: 16px;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  transition: background 0.2s;
}

.credit-header-row:hover {
  background: hsl(var(--muted));
}

.credit-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.credit-code {
  margin: 0;
  font-size: 13px;
  font-weight: 700;
  color: hsl(var(--foreground));
}

.credit-issued {
  margin: 0;
  font-size: 11px;
  color: hsl(var(--muted-foreground));
}

.status-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 700;
  text-align: center;
}

.credit-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.credit-balance {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: hsl(var(--primary));
}

.expiry-warning {
  margin: 0;
  font-size: 11px;
  color: hsl(var(--secondary));
  font-weight: 600;
}

.expired-date {
  margin: 0;
  font-size: 11px;
  color: hsl(var(--destructive));
}

.expand-icon {
  font-size: 12px;
  color: hsl(var(--muted-foreground));
  text-align: center;
}

/* Expanded Details */
.credit-details {
  background: hsl(var(--background));
  padding: 12px 16px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.detail-label {
  font-size: 12px;
  color: hsl(var(--muted-foreground));
  font-weight: 600;
}

.detail-value {
  font-size: 13px;
  color: hsl(var(--foreground));
  font-weight: 700;
}

/* Usage History */
.usage-history {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 2px solid hsl(var(--border));
}

.usage-history h3 {
  margin: 0 0 16px 0;
  font-size: 14px;
  font-weight: 700;
  color: hsl(var(--foreground));
}

.history-items {
  display: grid;
  gap: 8px;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: hsl(var(--muted));
  border-radius: 6px;
}

.history-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.history-details {
  flex: 1;
}

.history-description {
  margin: 0 0 2px 0;
  font-size: 13px;
  font-weight: 600;
  color: hsl(var(--foreground));
}

.history-date {
  margin: 0;
  font-size: 11px;
  color: hsl(var(--muted-foreground));
}

.history-amount {
  font-size: 13px;
  font-weight: 700;
  color: hsl(var(--destructive));
}

/* Info Box */
.credits-info {
  background: hsl(var(--accent) / 0.16);
  border: 1px solid hsl(var(--accent) / 0.4);
  border-radius: 8px;
  padding: 16px;
  margin-top: 24px;
}

.credits-info h4 {
  margin: 0 0 12px 0;
  font-size: 12px;
  font-weight: 700;
  color: hsl(var(--primary));
  text-transform: uppercase;
}

.credits-info ul {
  margin: 0;
  padding-left: 20px;
  list-style: none;
}

.credits-info li {
  font-size: 12px;
  color: hsl(var(--foreground));
  margin-bottom: 6px;
}

.credits-info li:before {
  content: "✓ ";
  color: hsl(var(--primary));
  font-weight: 700;
  margin-right: 6px;
}

@media (max-width: 768px) {
  .credit-header-row {
    grid-template-columns: 1fr;
  }

  .credit-details {
    grid-template-columns: 1fr;
  }

  .total-credits-card {
    flex-direction: column;
  }

  .total-icon {
    margin: 12px 0 0 0;
  }
}
`;

{
  styles;
}
