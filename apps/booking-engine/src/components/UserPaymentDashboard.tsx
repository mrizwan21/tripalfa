/**
 * User Payment Dashboard - Main Container
 * Displays customer's payment history, wallet, credits, and bookings
 * 
 * Features:
 * - Tab-based navigation
 * - Payment history view
 * - Wallet management
 * - Airline credits overview
 * - Booking payment status
 * - Refund tracking
 */

import React, { useState, useEffect } from 'react';
import type { FC } from 'react';
import PaymentHistoryPanel from './PaymentHistoryPanel';
import WalletManagementPanel from './WalletManagementPanel';
import AirlineCreditsPanel from './AirlineCreditsPanel';
import BookingPaymentStatusPanel from './BookingPaymentStatusPanel';
import RefundStatusPanel from './RefundStatusPanel';

type DashboardTab = 'overview' | 'payments' | 'wallet' | 'credits' | 'refunds';

interface DashboardStats {
  totalSpent: number;
  walletBalance: number;
  availableCredits: number;
  upcomingBookings: number;
  pendingRefunds: number;
  currency: string;
}

interface UserPaymentDashboardProps {
  customerId: string;
  onNavigateToBooking?: (bookingId: string) => void;
}

const UserPaymentDashboard: FC<UserPaymentDashboardProps> = ({
  customerId,
  onNavigateToBooking,
}) => {
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardStats();
  }, [customerId]);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/customers/${customerId}/payment-dashboard`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard stats');
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="user-payment-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <h1>Payment Dashboard</h1>
        <button
          className="refresh-btn"
          onClick={fetchDashboardStats}
          disabled={loading}
          title="Refresh data"
        >
          {loading ? '⟳' : '↻'}
        </button>
      </div>

      {/* Global Error */}
      {error && (
        <div className="error-banner">
          <span>⚠️</span>
          <p>{error}</p>
          <button onClick={fetchDashboardStats}>Retry</button>
        </div>
      )}

      {/* Stats Cards */}
      {stats && !loading && (
        <div className="stats-cards">
          <div className="stat-card">
            <div className="stat-label">Total Spent</div>
            <div className="stat-value">
              {stats.currency} {stats.totalSpent.toFixed(2)}
            </div>
            <div className="stat-description">All-time purchases</div>
          </div>

          <div className="stat-card">
            <div className="stat-label">💰 Wallet Balance</div>
            <div className="stat-value">
              {stats.currency} {stats.walletBalance.toFixed(2)}
            </div>
            <div className="stat-description">Available to spend</div>
          </div>

          <div className="stat-card">
            <div className="stat-label">🎫 Airline Credits</div>
            <div className="stat-value">
              {stats.currency} {stats.availableCredits.toFixed(2)}
            </div>
            <div className="stat-description">Across all airlines</div>
          </div>

          <div className="stat-card">
            <div className="stat-label">📅 Upcoming Bookings</div>
            <div className="stat-value">{stats.upcomingBookings}</div>
            <div className="stat-description">Upcoming trips</div>
          </div>

          {stats.pendingRefunds > 0 && (
            <div className="stat-card warning">
              <div className="stat-label">⏳ Pending Refunds</div>
              <div className="stat-value">{stats.pendingRefunds}</div>
              <div className="stat-description">In progress</div>
            </div>
          )}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="loading-container">
          <div className="spinner" />
          <p>Loading your payment information...</p>
        </div>
      )}

      {/* Tab Navigation */}
      {!loading && (
        <>
          <div className="dashboard-tabs">
            <button
              className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button
              className={`tab-btn ${activeTab === 'payments' ? 'active' : ''}`}
              onClick={() => setActiveTab('payments')}
            >
              Payment History
            </button>
            <button
              className={`tab-btn ${activeTab === 'wallet' ? 'active' : ''}`}
              onClick={() => setActiveTab('wallet')}
            >
              Wallet
            </button>
            <button
              className={`tab-btn ${activeTab === 'credits' ? 'active' : ''}`}
              onClick={() => setActiveTab('credits')}
            >
              Airline Credits
            </button>
            <button
              className={`tab-btn ${activeTab === 'refunds' ? 'active' : ''}`}
              onClick={() => setActiveTab('refunds')}
            >
              Refunds
            </button>
          </div>

          {/* Tab Content */}
          <div className="dashboard-content">
            {activeTab === 'overview' && (
              <div className="overview-tab">
                <div className="overview-section">
                  <h2>Quick Links</h2>
                  <div className="quick-links">
                    <button
                      className="quick-link-btn"
                      onClick={() => setActiveTab('wallet')}
                    >
                      💰 Add Funds to Wallet
                    </button>
                    <button
                      className="quick-link-btn"
                      onClick={() => setActiveTab('payments')}
                    >
                      📊 View Payment History
                    </button>
                    <button
                      className="quick-link-btn"
                      onClick={() => setActiveTab('credits')}
                    >
                      🎫 Manage Credits
                    </button>
                  </div>
                </div>

                <BookingPaymentStatusPanel
                  customerId={customerId}
                  onNavigateToBooking={onNavigateToBooking}
                />
              </div>
            )}

            {activeTab === 'payments' && (
              <PaymentHistoryPanel customerId={customerId} />
            )}

            {activeTab === 'wallet' && (
              <WalletManagementPanel
                customerId={customerId}
                onFundsAdded={fetchDashboardStats}
              />
            )}

            {activeTab === 'credits' && (
              <AirlineCreditsPanel customerId={customerId} />
            )}

            {activeTab === 'refunds' && (
              <RefundStatusPanel customerId={customerId} />
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default UserPaymentDashboard;

/* ===== STYLES ===== */

const styles = `
.user-payment-dashboard {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  background: #f5f5f5;
  min-height: 100vh;
}

/* Header */
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.dashboard-header h1 {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: #1a1a1a;
}

.refresh-btn {
  padding: 10px 16px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  font-size: 18px;
  transition: all 0.2s;
}

.refresh-btn:hover:not(:disabled) {
  background: #f0f0f0;
}

.refresh-btn:disabled {
  opacity: 0.5;
}

/* Error Banner */
.error-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #ffebee;
  border-left: 4px solid #c62828;
  border-radius: 6px;
  margin-bottom: 20px;
}

.error-banner p {
  margin: 0;
  color: #c62828;
  flex: 1;
}

.error-banner button {
  padding: 6px 12px;
  background: white;
  border: 1px solid #c62828;
  border-radius: 4px;
  color: #c62828;
  cursor: pointer;
  font-size: 12px;
}

/* Stats Cards */
.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
  margin-bottom: 30px;
}

.stat-card {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: all 0.2s;
}

.stat-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-card.warning {
  background: #fff3cd;
  border-left: 4px solid #ffc107;
}

.stat-label {
  font-size: 12px;
  color: #999;
  font-weight: 600;
  text-transform: uppercase;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #007bff;
  margin-bottom: 4px;
}

.stat-description {
  font-size: 12px;
  color: #666;
}

/* Loading Container */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  background: white;
  border-radius: 12px;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f0f0f0;
  border-top: 4px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-container p {
  color: #666;
  font-size: 14px;
}

/* Tab Navigation */
.dashboard-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  border-bottom: 2px solid #e0e0e0;
  overflow-x: auto;
}

.tab-btn {
  padding: 12px 16px;
  background: transparent;
  border: none;
  border-bottom: 3px solid transparent;
  color: #666;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.tab-btn:hover {
  color: #007bff;
}

.tab-btn.active {
  color: #007bff;
  border-bottom-color: #007bff;
}

/* Tab Content */
.dashboard-content {
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Overview Tab */
.overview-tab {
  display: grid;
  gap: 20px;
}

.overview-section {
  background: white;
  padding: 20px;
  border-radius: 12px;
}

.overview-section h2 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 700;
  color: #1a1a1a;
}

.quick-links {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.quick-link-btn {
  padding: 16px;
  background: linear-gradient(135deg, #e3f2fd, #f5f5f5);
  border: 1px solid #ddd;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  color: #007bff;
  transition: all 0.2s;
}

.quick-link-btn:hover {
  background: linear-gradient(135deg, #bbdefb, #eeeeee);
  box-shadow: 0 2px 8px rgba(0, 123, 255, 0.2);
}

/* Responsive */
@media (max-width: 768px) {
  .stats-cards {
    grid-template-columns: repeat(2, 1fr);
  }

  .dashboard-tabs {
    gap: 4px;
  }

  .tab-btn {
    padding: 10px 12px;
    font-size: 12px;
  }

  .quick-links {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .stats-cards {
    grid-template-columns: 1fr;
  }

  .dashboard-header {
    flex-direction: column;
    gap: 12px;
    text-align: center;
  }
}
`;

export { styles };
