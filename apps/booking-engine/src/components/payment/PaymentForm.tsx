import React, { useState, useEffect } from 'react';
import './PaymentForm.css';

interface PaymentFormProps {
  orderId: string;
  totalAmount: number;
  currency: string;
  onPaymentSuccess?: () => void;
  onPaymentFailed?: (error: string) => void;
  onLoading?: (isLoading: boolean) => void;
}

interface PaymentMethod {
  id: string;
  name: string;
  enabled: boolean;
}

const PaymentForm: React.FC<PaymentFormProps> = ({
  orderId,
  totalAmount,
  currency,
  onPaymentSuccess,
  onPaymentFailed,
  onLoading
}) => {
  const [loading, setLoading] = useState(false);
  const [verifyingPrice, setVerifyingPrice] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'balance' | 'card'>('balance');
  const [availableMethods, setAvailableMethods] = useState<PaymentMethod[]>([]);
  const [currentPrice, setCurrentPrice] = useState(totalAmount);
  const [priceChanged, setPriceChanged] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  useEffect(() => {
    fetchAvailablePaymentMethods();
    // Verify price before showing form
    verifyCurrentPrice();
  }, [orderId]);

  useEffect(() => {
    onLoading?.(loading);
  }, [loading, onLoading]);

  const fetchAvailablePaymentMethods = async () => {
    try {
      const response = await fetch('/api/bookings/hold/payment-methods');
      if (response.ok) {
        const result = await response.json();
        setAvailableMethods(result.data.map((method: string) => ({
          id: method,
          name: method === 'balance' ? 'Wallet Balance' : 'Credit Card',
          enabled: true
        })));
      }
    } catch (err) {
      console.error('Failed to fetch payment methods', err);
      // Set default methods
      setAvailableMethods([
        { id: 'balance', name: 'Wallet Balance', enabled: true },
        { id: 'card', name: 'Credit Card', enabled: false }
      ]);
    }
  };

  const verifyCurrentPrice = async () => {
    try {
      setVerifyingPrice(true);
      const response = await fetch(`/api/bookings/hold/orders/${orderId}/check-price`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          lastKnownPrice: totalAmount,
          currency
        })
      });

      if (response.ok) {
        const result = await response.json();
        const data = result.data;

        if (data.priceChanged) {
          setPriceChanged(true);
          setCurrentPrice(data.currentPrice);
          setError(`Price has changed. New amount: ${data.currentPrice} ${currency}`);
        } else {
          setPriceChanged(false);
          setCurrentPrice(data.currentPrice);
          setError('');
        }
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to verify price';
      setError(errorMsg);
    } finally {
      setVerifyingPrice(false);
    }
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // If price changed, require user to verify
    if (priceChanged) {
      setError('Please verify the new price before proceeding');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/bookings/hold/orders/${orderId}/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: currentPrice,
          currency,
          paymentMethod
        })
      });

      if (!response.ok) {
        const error = await response.json();
        
        // Handle specific error scenarios
        if (error.error?.includes('PRICE_CHANGED')) {
          setPriceChanged(true);
          const newError = 'Price has changed. Please review before paying.';
          setError(newError);
          onPaymentFailed?.(newError);
        } else if (error.error?.includes('SCHEDULE_CHANGED')) {
          const newError = 'Flight schedule has changed. Please review the new itinerary before paying.';
          setError(newError);
          onPaymentFailed?.(newError);
        } else {
          throw new Error(error.error || 'Payment failed');
        }
        return;
      }

      const result = await response.json();
      setSuccess('✓ Payment processed successfully!');
      onPaymentSuccess?.();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Payment processing failed';
      setError(errorMsg);
      onPaymentFailed?.(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="payment-form">
      <h2>Complete Payment</h2>

      {error && <div className="alert-error">{error}</div>}
      {success && <div className="alert-success">{success}</div>}

      <form onSubmit={handlePayment}>
        {/* Price Display */}
        <div className="price-section">
          <div className="price-display">
            <span className="label">Total Amount</span>
            <div className="amount-row">
              <span className={`amount ${priceChanged ? 'changed' : ''}`}>
                {currentPrice}
              </span>
              <span className="currency">{currency}</span>
            </div>
            {priceChanged && (
              <p className="original-price">
                Original: {totalAmount} {currency}
              </p>
            )}
          </div>
          <button
            type="button"
            className="btn-check-price"
            onClick={verifyCurrentPrice}
            disabled={loading || verifyingPrice}
          >
            {verifyingPrice ? '⟳ Checking...' : '⟳ Verify Price'}
          </button>
        </div>

        {/* Payment Method Selection */}
        <fieldset>
          <legend>Payment Method</legend>
          <div className="payment-methods">
            {availableMethods.map((method) => (
              <label key={method.id} className="payment-option">
                <input
                  type="radio"
                  name="paymentMethod"
                  value={method.id}
                  checked={paymentMethod === method.id}
                  onChange={(e) => setPaymentMethod(e.target.value as 'balance' | 'card')}
                  disabled={!method.enabled || loading}
                />
                <span className="option-label">
                  {method.name}
                  {!method.enabled && <span className="disabled-badge">Coming Soon</span>}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        {/* Payment Details */}
        <div className="payment-details">
          <h3>Payment Details</h3>
          <div className="detail-row">
            <span>Subtotal:</span>
            <span>{currentPrice} {currency}</span>
          </div>
          <div className="detail-row total">
            <span>Total:</span>
            <span>{currentPrice} {currency}</span>
          </div>
        </div>

        {/* Terms & Conditions */}
        <label className="terms-checkbox">
          <input type="checkbox" required />
          <span>
            I confirm that I have reviewed the booking details and terms of payment
          </span>
        </label>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || verifyingPrice || !availableMethods.some(m => m.enabled && m.id === paymentMethod)}
          className="btn-submit"
        >
          {loading ? (
            <>
              <span className="spinner"></span>
              Processing Payment...
            </>
          ) : (
            `Pay ${currentPrice} ${currency}`
          )}
        </button>

        {/* Security Message */}
        <p className="security-message">
          🔒 Your payment information is secure and encrypted
        </p>
      </form>
    </div>
  );
};

export default PaymentForm;
