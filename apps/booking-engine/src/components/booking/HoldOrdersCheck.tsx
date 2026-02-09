import React, { useState, useEffect } from 'react';
import HoldOrderForm from './HoldOrderForm';
import HoldOrderDetails from './HoldOrderDetails';
import './HoldOrdersCheck.css';

interface HoldOrdersCheckProps {
  offerId: string;
  onSuccess?: (holdOrder: any) => void;
}

type ViewState = 'eligibility-check' | 'create-form' | 'hold-details' | 'complete' | 'error';

const HoldOrdersCheck: React.FC<HoldOrdersCheckProps> = ({ offerId, onSuccess }) => {
  const [viewState, setViewState] = useState<ViewState>('eligibility-check');
  const [eligibility, setEligibility] = useState<any>(null);
  const [holdOrder, setHoldOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [completionMessage, setCompletionMessage] = useState<string>('');

  useEffect(() => {
    checkEligibility();
  }, [offerId]);

  const checkEligibility = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/bookings/hold/eligibility/${offerId}`);

      if (!response.ok) {
        throw new Error('Failed to check hold eligibility');
      }

      const result = await response.json();
      setEligibility(result.data);

      if (result.data.eligible) {
        setViewState('create-form');
      } else {
        setError(result.data.message || 'This offer is not eligible for hold orders. Instant payment is required.');
        setViewState('error');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to check eligibility';
      setError(errorMsg);
      setViewState('error');
    } finally {
      setLoading(false);
    }
  };

  const handleHoldOrderCreated = (order: any) => {
    setHoldOrder(order);
    setViewState('hold-details');
    setCompletionMessage(`✓ Hold order created successfully!\nOrder Reference: ${order.reference}\nPayment Deadline: ${new Date(order.paymentRequiredBy).toLocaleDateString()}`);
  };

  const handlePriceChange = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/bookings/hold/orders/${holdOrder.orderId}/check-price`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lastKnownPrice: holdOrder.totalAmount,
          currency: holdOrder.currency
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.data.priceChanged) {
          setError(`Price has changed from ${holdOrder.totalAmount} to ${result.data.currentPrice} ${holdOrder.currency}`);
          setHoldOrder({
            ...holdOrder,
            totalAmount: result.data.currentPrice
          });
        } else {
          setError('');
        }
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to check price';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelHold = async () => {
    if (window.confirm('Are you sure you want to cancel this hold order?')) {
      setLoading(true);
      try {
        const response = await fetch(`/api/bookings/hold/orders/${holdOrder.orderId}/cancel`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason: 'User initiated cancellation' })
        });

        if (response.ok) {
          setCompletionMessage('Hold order has been cancelled.');
          setViewState('complete');
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to cancel hold order';
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="hold-orders-check">
      {error && (
        <div className="error-banner">
          <div className="error-content">
            <span className="error-icon">⚠</span>
            <div>
              <h3>Error</h3>
              <p>{error}</p>
            </div>
            <button className="error-close" onClick={() => setError('')}>×</button>
          </div>
        </div>
      )}

      {/* Eligibility Check */}
      {viewState === 'eligibility-check' && (
        <div className="loading-state">
          <div className="spinner-large"></div>
          <p>Checking if this offer is eligible for hold orders...</p>
        </div>
      )}

      {/* Create Form */}
      {viewState === 'create-form' && eligibility && (
        <div className="create-form-container">
          <div className="eligibility-info">
            <h3>✓ This offer is eligible for hold orders</h3>
            <div className="eligibility-details">
              <div className="detail">
                <span className="label">Payment Required By:</span>
                <span className="value">
                  {new Date(eligibility.paymentRequiredBy).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              {eligibility.priceGuaranteeExpiresAt && (
                <div className="detail">
                  <span className="label">Price Guaranteed Until:</span>
                  <span className="value">
                    {new Date(eligibility.priceGuaranteeExpiresAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              )}
            </div>
          </div>
          <HoldOrderForm
            offerId={offerId}
            onHoldOrderCreated={handleHoldOrderCreated}
            onError={setError}
          />
        </div>
      )}

      {/* Hold Order Details */}
      {viewState === 'hold-details' && holdOrder && (
        <div className="hold-details-container">
          {completionMessage && (
            <div className="success-banner">
              <p>{completionMessage}</p>
            </div>
          )}
          <HoldOrderDetails
            holdOrder={holdOrder}
            onCancelClick={handleCancelHold}
            onCheckPriceClick={handlePriceChange}
            loading={loading}
          />
        </div>
      )}

      {/* Completion */}
      {viewState === 'complete' && (
        <div className="completion-state">
          <div className="completion-icon">✓</div>
          <h2>Hold Order Confirmed</h2>
          <p>{completionMessage}</p>
          <div className="completion-actions">
            <button
              className="btn-primary"
              onClick={() => window.location.href = '/bookings'}
            >
              View Your Bookings
            </button>
            <button
              className="btn-secondary"
              onClick={() => window.location.reload()}
            >
              Start New Booking
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {viewState === 'error' && (
        <div className="error-state">
          <div className="error-icon">✗</div>
          <h2>Not Eligible for Hold Orders</h2>
          <p>{error}</p>
          <div className="error-actions">
            <button
              className="btn-primary"
              onClick={() => window.location.href = '/bookings'}
            >
              Back to Bookings
            </button>
            <button
              className="btn-secondary"
              onClick={checkEligibility}
            >
              Try Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HoldOrdersCheck;
