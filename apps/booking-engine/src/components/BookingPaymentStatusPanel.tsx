/**
 * Booking Payment Status Panel
 * Displays upcoming bookings and their payment status
 *
 * Features:
 * - List all upcoming bookings
 * - Show payment status indicators
 * - Quick actions to view booking details
 * - Payment breakdown view
 */

import React, { useState, useEffect } from 'react';
import type { FC } from 'react';
import { getStoredAuthToken } from '../lib/authToken';
import { Button } from '@/components/ui/button';
import { formatDate } from '@tripalfa/shared-utils/date-utils';

interface BookingDetails {
  id: string;
  reference: string;
  confirmation: string;
  route: string;
  routes: Array<{
    departure: string;
    arrival: string;
    departureTime: string;
    arrivalTime: string;
    airline: string;
  }>;
  passengers: number;
  totalAmount: number;
  currency: string;
  paymentStatus: 'paid' | 'pending' | 'failed' | 'partial';
  paymentBreakdown?: {
    walletAmount: number;
    creditAmount: number;
    cardAmount: number;
  };
  departureDate: string;
  returnDate?: string;
  outboundDate?: string;
  airline: string;
  daysUntilDeparture: number;
}

interface BookingPaymentStatusResponse {
  bookings: BookingDetails[];
  totalCount: number;
  currency: string;
}

interface BookingPaymentStatusPanelProps {
  customerId: string;
  onNavigateToBooking?: (bookingId: string) => void;
}

type SortField = 'date' | 'amount' | 'status';

const BookingPaymentStatusPanel: FC<BookingPaymentStatusPanelProps> = ({
  customerId,
  onNavigateToBooking,
}) => {
  const [data, setData] = useState<BookingPaymentStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [expandedBooking, setExpandedBooking] = useState<string | null>(null);

  useEffect(() => {
    fetchBookingStatus();
  }, [customerId]);

  const fetchBookingStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/customers/${customerId}/booking-payment-status`, {
        headers: {
          Authorization: `Bearer ${getStoredAuthToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch booking status');
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

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getSortedBookings = () => {
    if (!data) return [];

    const sorted = [...data.bookings].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'date':
          comparison = new Date(a.departureDate).getTime() - new Date(b.departureDate).getTime();
          break;
        case 'amount':
          comparison = a.totalAmount - b.totalAmount;
          break;
        case 'status':
          comparison = a.paymentStatus.localeCompare(b.paymentStatus);
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return sorted;
  };

  const getStatusConfig = (status: BookingDetails['paymentStatus']) => {
    const config = {
      paid: {
        label: '✓ Paid',
        color: 'hsl(var(--primary))',
        icon: '✓',
        bgColor: 'hsl(var(--primary) / 0.15)',
      },
      pending: {
        label: '⏳ Pending',
        color: 'hsl(var(--accent-foreground))',
        icon: '⏳',
        bgColor: 'hsl(var(--accent) / 0.7)',
      },
      failed: {
        label: '✕ Failed',
        color: 'hsl(var(--destructive))',
        icon: '✕',
        bgColor: 'hsl(var(--destructive) / 0.15)',
      },
      partial: {
        label: '◐ Partial',
        color: 'hsl(var(--secondary-foreground))',
        icon: '◐',
        bgColor: 'hsl(var(--secondary) / 0.7)',
      },
    };
    return config[status];
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const sortedBookings = getSortedBookings();

  return (
    <div className="booking-payment-status-panel">
      {error && (
        <div className="error-alert">
          <span>⚠️</span>
          <p>{error}</p>
          <Button variant="outline" size="default" onClick={fetchBookingStatus}>
            Retry
          </Button>
        </div>
      )}

      {loading ? (
        <div className="loading-state">
          <div className="spinner" />
          <p>Loading bookings...</p>
        </div>
      ) : data ? (
        <>
          {/* Summary */}
          <div className="booking-summary">
            <p className="summary-text">
              You have <strong>{data.totalCount}</strong> upcoming booking
              {data.totalCount !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Sort Controls */}
          <div className="sort-controls">
            <Button
              variant="outline"
              size="default"
              className={`sort-btn ${sortField === 'date' ? 'active' : ''}`}
              onClick={() => handleSort('date')}
            >
              Departure Date
              {sortField === 'date' && (sortOrder === 'asc' ? ' ↑' : ' ↓')}
            </Button>
            <Button
              variant="outline"
              size="default"
              className={`sort-btn ${sortField === 'amount' ? 'active' : ''}`}
              onClick={() => handleSort('amount')}
            >
              Amount
              {sortField === 'amount' && (sortOrder === 'asc' ? ' ↑' : ' ↓')}
            </Button>
            <Button
              variant="outline"
              size="default"
              className={`sort-btn ${sortField === 'status' ? 'active' : ''}`}
              onClick={() => handleSort('status')}
            >
              Payment Status
              {sortField === 'status' && (sortOrder === 'asc' ? ' ↑' : ' ↓')}
            </Button>
          </div>

          {/* Bookings List */}
          {sortedBookings.length === 0 ? (
            <div className="empty-state">
              <p>✈️</p>
              <p>No upcoming bookings</p>
              <p className="empty-subtext">Your next adventure awaits! Book now.</p>
            </div>
          ) : (
            <div className="bookings-list">
              {sortedBookings.map(booking => {
                const statusConfig = getStatusConfig(booking.paymentStatus);
                const mainRoute = booking.routes[0];

                return (
                  <div key={booking.id} className={`booking-card ${booking.paymentStatus}`}>
                    {/* Header */}
                    <div className="booking-header">
                      <div className="booking-header-main">
                        <div className="booking-ref">
                          <span className="ref-label">Booking</span>
                          <span className="ref-value">{booking.reference}</span>
                        </div>

                        <div className="booking-route">
                          <div className="route-segment">
                            <span className="airport-code">{mainRoute.departure}</span>
                            <span className="route-arrow">→</span>
                            <span className="airport-code">{mainRoute.arrival}</span>
                          </div>
                          <span className="route-airline">{booking.airline}</span>
                        </div>

                        <div className="booking-date">
                          <span className="date-icon">📅</span>
                          <span className="date-value">{formatDate(booking.departureDate)}</span>
                          <span className="days-until">
                            ({booking.daysUntilDeparture} day
                            {booking.daysUntilDeparture !== 1 ? 's' : ''})
                          </span>
                        </div>
                      </div>

                      <div
                        className="status-badge"
                        style={{
                          backgroundColor: statusConfig.bgColor,
                          color: statusConfig.color,
                        }}
                      >
                        {statusConfig.label}
                      </div>
                    </div>

                    {/* Details */}
                    <div className="booking-details">
                      <div className="detail-item">
                        <span className="detail-label">Passengers</span>
                        <span className="detail-value">{booking.passengers}</span>
                      </div>

                      <div className="detail-item">
                        <span className="detail-label">Total Amount</span>
                        <span className="detail-value">
                          {data.currency} {booking.totalAmount.toFixed(2)}
                        </span>
                      </div>

                      {booking.returnDate && (
                        <div className="detail-item">
                          <span className="detail-label">Return</span>
                          <span className="detail-value">{formatDate(booking.returnDate)}</span>
                        </div>
                      )}

                      <div className="detail-item">
                        <span className="detail-label">Confirmation</span>
                        <span className="detail-value">{booking.confirmation}</span>
                      </div>
                    </div>

                    {/* Payment Breakdown (if payment status is pending or partial) */}
                    {booking.paymentBreakdown &&
                      ['pending', 'partial'].includes(booking.paymentStatus) && (
                        <div className="payment-breakdown">
                          <p className="breakdown-label">Payment Breakdown:</p>
                          <div className="breakdown-items">
                            {booking.paymentBreakdown.walletAmount > 0 && (
                              <div className="breakdown-item">
                                <span className="breakdown-method">💰 Wallet</span>
                                <span className="breakdown-amount">
                                  {data.currency} {booking.paymentBreakdown.walletAmount.toFixed(2)}
                                </span>
                              </div>
                            )}
                            {booking.paymentBreakdown.creditAmount > 0 && (
                              <div className="breakdown-item">
                                <span className="breakdown-method">🎫 Airline Credit</span>
                                <span className="breakdown-amount">
                                  {data.currency} {booking.paymentBreakdown.creditAmount.toFixed(2)}
                                </span>
                              </div>
                            )}
                            {booking.paymentBreakdown.cardAmount > 0 && (
                              <div className="breakdown-item">
                                <span className="breakdown-method">💳 Card</span>
                                <span className="breakdown-amount">
                                  {data.currency} {booking.paymentBreakdown.cardAmount.toFixed(2)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                    {/* Actions */}
                    <div className="booking-actions">
                      <Button
                        variant="outline"
                        size="default"
                        className="action-btn primary"
                        onClick={() => onNavigateToBooking?.(booking.id)}
                      >
                        View Booking
                      </Button>
                      {booking.paymentStatus === 'pending' && (
                        <Button variant="outline" size="default" className="action-btn">
                          Complete Payment
                        </Button>
                      )}
                      {booking.paymentStatus === 'failed' && (
                        <Button variant="outline" size="default" className="action-btn warning">
                          Retry Payment
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="default"
                        className="action-btn secondary"
                        onClick={() =>
                          setExpandedBooking(expandedBooking === booking.id ? null : booking.id)
                        }
                      >
                        {expandedBooking === booking.id ? 'Hide' : 'Show'} Details
                      </Button>
                    </div>

                    {/* Expanded Details */}
                    {expandedBooking === booking.id && (
                      <div className="expanded-details">
                        <h4>Flight Details</h4>
                        {booking.routes.map((route, idx) => (
                          <div key={idx} className="flight-route">
                            <div className="route-header">
                              <span>{idx === 0 ? 'Outbound' : 'Return'}</span>
                              <span>{route.airline}</span>
                            </div>
                            <div className="route-times">
                              <div>
                                <p className="airport">{route.departure}</p>
                                <p className="time">{formatTime(route.departureTime)}</p>
                              </div>
                              <div className="flight-icon">✈️</div>
                              <div>
                                <p className="airport">{route.arrival}</p>
                                <p className="time">{formatTime(route.arrivalTime)}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : null}
    </div>
  );
};

export default BookingPaymentStatusPanel;

/* ===== STYLES ===== */

const styles = `
.booking-payment-status-panel {
  background: hsl(var(--background));
  border-radius: 12px;
  padding: 24px;
}

.error-alert {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: hsl(var(--destructive) / 0.1);
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
  background: hsl(var(--background));
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
  border: 3px solid hsl(var(--border));
  border-top-color: hsl(var(--primary));
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 12px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.booking-summary {
  margin-bottom: 20px;
}

.summary-text {
  margin: 0;
  font-size: 14px;
  color: hsl(var(--muted-foreground));
}

/* Sort Controls */
.sort-controls {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  overflow-x: auto;
  padding-bottom: 8px;
}

.sort-btn {
  padding: 8px 14px;
  background: hsl(var(--muted));
  border: 1px solid hsl(var(--border));
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  transition: all 0.2s;
}

.sort-btn:hover {
  background: hsl(var(--accent));
}

.sort-btn.active {
  background: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
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
  font-size: 14px;
}

.empty-subtext {
  font-size: 12px !important;
  color: hsl(var(--muted-foreground)) !important;
  margin-top: 8px !important;
}

/* Bookings List */
.bookings-list {
  display: grid;
  gap: 16px;
}

.booking-card {
  border: 1px solid hsl(var(--border));
  border-radius: 12px;
  padding: 16px;
  transition: all 0.2s;
}

.booking-card:hover {
  border-color: hsl(var(--accent-foreground) / 0.35);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.booking-card.paid {
  border-left: 4px solid hsl(var(--primary));
}

.booking-card.pending {
  border-left: 4px solid hsl(var(--accent-foreground));
}

.booking-card.failed {
  border-left: 4px solid hsl(var(--destructive));
}

.booking-card.partial {
  border-left: 4px solid hsl(var(--secondary-foreground));
}

/* Booking Header */
.booking-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.booking-header-main {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 16px;
  align-items: center;
  flex: 1;
  min-width: 0;
}

.booking-ref {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.ref-label {
  font-size: 11px;
  color: hsl(var(--muted-foreground));
  text-transform: uppercase;
  font-weight: 600;
}

.ref-value {
  font-size: 16px;
  font-weight: 700;
  color: hsl(var(--foreground));
}

.booking-route {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.route-segment {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
}

.airport-code {
  font-size: 14px;
  color: hsl(var(--foreground));
}

.route-arrow {
  color: hsl(var(--muted-foreground));
}

.route-airline {
  font-size: 11px;
  color: hsl(var(--muted-foreground));
}

.booking-date {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: hsl(var(--muted-foreground));
}

.date-icon {
  font-size: 14px;
}

.date-value {
  font-weight: 700;
}

.days-until {
  font-size: 11px;
  color: hsl(var(--muted-foreground));
}

.status-badge {
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

/* Booking Details */
.booking-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
  padding: 12px;
  background: hsl(var(--muted));
  border-radius: 8px;
  margin-bottom: 12px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.detail-label {
  font-size: 11px;
  color: hsl(var(--muted-foreground));
  text-transform: uppercase;
  font-weight: 600;
}

.detail-value {
  font-size: 13px;
  font-weight: 700;
  color: hsl(var(--foreground));
}

/* Payment Breakdown */
.payment-breakdown {
  padding: 12px;
  background: hsl(var(--accent));
  border-radius: 8px;
  margin-bottom: 12px;
}

.breakdown-label {
  margin: 0 0 8px 0;
  font-size: 12px;
  font-weight: 700;
  color: hsl(var(--accent-foreground));
}

.breakdown-items {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 8px;
}

.breakdown-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 8px;
  background: hsl(var(--background));
  border-radius: 4px;
  font-size: 12px;
}

.breakdown-method {
  font-weight: 600;
}

.breakdown-amount {
  font-weight: 700;
  color: hsl(var(--primary));
}

/* Booking Actions */
.booking-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  padding-top: 12px;
  border-top: 1px solid hsl(var(--border));
}

.action-btn {
  padding: 8px 14px;
  border: 1px solid hsl(var(--border));
  border-radius: 6px;
  background: hsl(var(--background));
  color: hsl(var(--muted-foreground));
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  transition: all 0.2s;
}

.action-btn:hover {
  background: hsl(var(--muted));
}

.action-btn.primary {
  background: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
  border-color: hsl(var(--primary));
}

.action-btn.primary:hover {
  background: hsl(var(--primary) / 0.85);
}

.action-btn.warning {
  background: hsl(var(--accent-foreground));
  color: hsl(var(--accent));
  border-color: hsl(var(--accent-foreground));
}

.action-btn.warning:hover {
  background: hsl(var(--accent-foreground) / 0.85);
}

.action-btn.secondary {
  background: hsl(var(--muted));
  border-color: hsl(var(--border));
}

/* Expanded Details */
.expanded-details {
  margin-top: 12px;
  padding: 12px;
  background: hsl(var(--muted));
  border-radius: 8px;
  animation: slideDown 0.2s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.expanded-details h4 {
  margin: 0 0 12px 0;
  font-size: 12px;
  color: hsl(var(--muted-foreground));
  text-transform: uppercase;
  font-weight: 700;
}

.flight-route {
  margin-bottom: 12px;
}

.flight-route:last-child {
  margin-bottom: 0;
}

.route-header {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  font-weight: 700;
  color: hsl(var(--foreground));
  margin-bottom: 8px;
}

.route-times {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  background: hsl(var(--background));
  border-radius: 6px;
}

.route-times > div {
  flex: 1;
  text-align: center;
}

.airport {
  margin: 0;
  font-size: 12px;
  font-weight: 700;
  color: hsl(var(--foreground));
}

.time {
  margin: 2px 0 0 0;
  font-size: 11px;
  color: hsl(var(--muted-foreground));
}

.flight-icon {
  font-size: 20px;
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .booking-header-main {
    grid-template-columns: 1fr;
  }

  .booking-details {
    grid-template-columns: 1fr;
  }
}
`;

{
  styles;
}
