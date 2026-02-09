/**
 * Combined Payment Flow Component (Main Container)
 * Orchestrates the complete payment wizard flow
 * 
 * Features:
 * - Multi-step payment wizard
 * - Step navigation and progress tracking
 * - Data persistence between steps
 * - Complete payment orchestration
 * - Error recovery and retry logic
 * - Success handling
 */

import React, { useState, useCallback } from 'react';
import type { FC } from 'react';
import PaymentOptionsDisplay from './PaymentOptionsDisplay';
import PaymentMethodSelector, { type PaymentMethodSelection } from './PaymentMethodSelector';
import PaymentConfirmation from './PaymentConfirmation';

interface BookingDetails {
  bookingId: string;
  customerId: string;
  reference: string;
  flightDetails: string;
  passengerName: string;
  totalAmount: number;
  currency: string;
}

type PaymentStep = 'review' | 'select' | 'confirm' | 'success';

interface PaymentFlowState {
  currentStep: PaymentStep;
  paymentSelection: PaymentMethodSelection | null;
  error: string | null;
  loading: boolean;
}

interface CombinedPaymentFlowProps {
  booking: BookingDetails;
  onPaymentComplete?: (result: any) => void;
  onCancel?: () => void;
}

const CombinedPaymentFlow: FC<CombinedPaymentFlowProps> = ({
  booking,
  onPaymentComplete,
  onCancel,
}) => {
  const [flowState, setFlowState] = useState<PaymentFlowState>({
    currentStep: 'review',
    paymentSelection: null,
    error: null,
    loading: false,
  });

  const [paymentOptions, setPaymentOptions] = useState<any>(null);

  const handleStepChange = useCallback((step: PaymentStep) => {
    setFlowState((prev) => ({
      ...prev,
      currentStep: step,
      error: null,
    }));
  }, []);

  const handlePaymentMethodChange = useCallback((selection: PaymentMethodSelection) => {
    setFlowState((prev) => ({
      ...prev,
      paymentSelection: selection,
    }));
  }, []);

  const handleConfirmPayment = useCallback(async () => {
    if (!flowState.paymentSelection) {
      setFlowState((prev) => ({
        ...prev,
        error: 'Payment selection not configured',
      }));
      return;
    }

    setFlowState((prev) => ({
      ...prev,
      loading: true,
      error: null,
    }));

    try {
      // Call the backend API to process combined payment
      const response = await fetch(
        `/api/bookings/${booking.bookingId}/pay`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            customerId: booking.customerId,
            totalAmount: booking.totalAmount,
            currency: booking.currency,
            useWallet: flowState.paymentSelection.useWallet,
            walletAmount: flowState.paymentSelection.walletAmount,
            useCredits: flowState.paymentSelection.useCredits,
            creditIds: flowState.paymentSelection.selectedCreditIds,
            cardAmount: flowState.paymentSelection.cardAmount,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Payment processing failed');
      }

      const result = await response.json();

      setFlowState((prev) => ({
        ...prev,
        currentStep: 'success',
        loading: false,
      }));

      onPaymentComplete?.(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setFlowState((prev) => ({
        ...prev,
        error: errorMessage,
        loading: false,
      }));
    }
  }, [flowState.paymentSelection, booking, onPaymentComplete]);

  const getProgressPercentage = (): number => {
    const steps: PaymentStep[] = ['review', 'select', 'confirm', 'success'];
    const currentIndex = steps.indexOf(flowState.currentStep);
    return ((currentIndex + 1) / steps.length) * 100;
  };

  return (
    <div className="combined-payment-flow">
      {/* Progress Bar */}
      <div className="progress-section">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${getProgressPercentage()}%` }} />
        </div>
        <div className="step-indicator">
          <div className={`step ${flowState.currentStep === 'review' ? 'active' : 'completed'}`}>
            1. Review
          </div>
          <div className={`step ${flowState.currentStep === 'select' ? 'active' : ''}`}>
            2. Select
          </div>
          <div className={`step ${flowState.currentStep === 'confirm' ? 'active' : ''}`}>
            3. Confirm
          </div>
          <div className={`step ${flowState.currentStep === 'success' ? 'active' : ''}`}>
            4. Done
          </div>
        </div>
      </div>

      {/* Booking Info Header */}
      <div className="booking-header">
        <div className="booking-info">
          <h2>{booking.reference}</h2>
          <p className="passenger-info">
            {booking.passengerName} • {booking.flightDetails}
          </p>
        </div>
        <div className="amount-display">
          <span className="label">Total Amount</span>
          <span className="amount">
            {booking.currency} {booking.totalAmount.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Global Error Display */}
      {flowState.error && (
        <div className="error-banner">
          <span className="error-icon">⚠️</span>
          <div className="error-content">
            <p className="error-message">{flowState.error}</p>
            {flowState.currentStep !== 'review' && (
              <button
                className="error-action"
                onClick={() => handleStepChange('review')}
              >
                Go back to review
              </button>
            )}
          </div>
        </div>
      )}

      {/* Step 1: Review Payment Options */}
      {flowState.currentStep === 'review' && (
        <div className="step-content">
          <PaymentOptionsDisplay
            customerId={booking.customerId}
            totalAmount={booking.totalAmount}
            currency={booking.currency}
            onLoadingChange={(loading) =>
              setFlowState((prev) => ({ ...prev, loading }))
            }
            onErrorChange={(error) =>
              setFlowState((prev) => ({ ...prev, error }))
            }
          />
        </div>
      )}

      {/* Step 2: Select Payment Methods */}
      {flowState.currentStep === 'select' && paymentOptions && (
        <div className="step-content">
          <PaymentMethodSelector
            totalAmount={booking.totalAmount}
            walletBalance={paymentOptions.walletBalance || 0}
            availableCredits={paymentOptions.availableCredits || []}
            currency={booking.currency}
            onPaymentMethodChange={handlePaymentMethodChange}
            onValidationChange={(isValid) => {
              // Enable/disable confirm button based on validation
            }}
          />
        </div>
      )}

      {/* Step 3: Confirm Payment */}
      {flowState.currentStep === 'confirm' && flowState.paymentSelection && (
        <div className="step-content">
          <PaymentConfirmation
            bookingDetails={booking}
            paymentBreakdown={{
              walletAmount: flowState.paymentSelection.walletAmount,
              creditsAmount: flowState.paymentSelection.creditsAmount,
              cardAmount: flowState.paymentSelection.cardAmount,
              creditsUsed: [], // Would be populated from payment options
            }}
            onConfirm={handleConfirmPayment}
            onCancel={() => handleStepChange('select')}
            loading={flowState.loading}
          />
        </div>
      )}

      {/* Step 4: Success */}
      {flowState.currentStep === 'success' && (
        <div className="step-content success-state">
          <div className="success-card">
            <div className="success-icon">✅</div>
            <h2>Payment Complete!</h2>
            <p>Your booking has been confirmed and payment processed successfully.</p>
            <button
              onClick={onCancel}
              className="btn btn-primary"
            >
              Return to Bookings
            </button>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      {flowState.currentStep !== 'success' && (
        <div className="flow-navigation">
          <button
            onClick={onCancel}
            className="btn btn-secondary"
            disabled={flowState.loading}
          >
            Cancel
          </button>

          {flowState.currentStep === 'review' && (
            <button
              onClick={() => handleStepChange('select')}
              className="btn btn-primary"
              disabled={flowState.loading}
            >
              Continue
            </button>
          )}

          {flowState.currentStep === 'select' && (
            <>
              <button
                onClick={() => handleStepChange('review')}
                className="btn btn-secondary"
                disabled={flowState.loading}
              >
                Back
              </button>
              <button
                onClick={() => handleStepChange('confirm')}
                className="btn btn-primary"
                disabled={flowState.loading || !flowState.paymentSelection?.isValid}
              >
                Review & Confirm
              </button>
            </>
          )}
        </div>
      )}

      {/* Loading Overlay */}
      {flowState.loading && (
        <div className="loading-overlay">
          <div className="spinner" />
          <p>Processing your payment...</p>
        </div>
      )}
    </div>
  );
};

export default CombinedPaymentFlow;

/* ===== STYLES ===== */

const styles = `
.combined-payment-flow {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

/* Progress Section */
.progress-section {
  margin-bottom: 40px;
}

.progress-bar {
  height: 4px;
  background: #e0e0e0;
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 20px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #007bff, #0056b3);
  transition: width 0.3s ease;
}

.step-indicator {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.step {
  flex: 1;
  padding: 12px;
  text-align: center;
  font-size: 13px;
  font-weight: 600;
  border-radius: 8px;
  background: #f5f5f5;
  color: #999;
  transition: all 0.2s;
}

.step.active {
  background: #e3f2fd;
  color: #007bff;
}

.step.completed {
  background: #e8f5e9;
  color: #4caf50;
}

/* Booking Header */
.booking-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: #f9f9f9;
  border-radius: 12px;
  margin-bottom: 24px;
  border: 1px solid #e0e0e0;
}

.booking-info h2 {
  margin: 0 0 4px 0;
  font-size: 18px;
  font-weight: 700;
  color: #1a1a1a;
}

.passenger-info {
  margin: 0;
  font-size: 13px;
  color: #666;
}

.amount-display {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  text-align: right;
}

.amount-display .label {
  font-size: 12px;
  color: #999;
  margin-bottom: 4px;
}

.amount-display .amount {
  font-size: 24px;
  font-weight: 700;
  color: #007bff;
}

/* Error Banner */
.error-banner {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #ffebee;
  border: 1px solid #ef5350;
  border-radius: 8px;
  margin-bottom: 20px;
}

.error-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.error-content {
  flex: 1;
}

.error-message {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #c62828;
  font-weight: 500;
}

.error-action {
  padding: 6px 12px;
  background: white;
  border: 1px solid #ef5350;
  border-radius: 4px;
  color: #c62828;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.error-action:hover {
  background: #f5f5f5;
}

/* Step Content */
.step-content {
  animation: fadeIn 0.3s ease-in;
  margin-bottom: 24px;
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

.step-content.success-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
}

.success-card {
  text-align: center;
  padding: 40px 28px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.success-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.success-card h2 {
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 12px 0;
  color: #2e7d32;
}

.success-card p {
  font-size: 14px;
  color: #666;
  margin: 0 0 20px 0;
}

/* Navigation */
.flow-navigation {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding-top: 20px;
  border-top: 1px solid #e0e0e0;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: #007bff;
  color: white;
  min-width: 120px;
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

/* Loading Overlay */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(2px);
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

.loading-overlay p {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

/* Responsive */
@media (max-width: 600px) {
  .step-indicator {
    flex-wrap: wrap;
  }

  .booking-header {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }

  .booking-info {
    text-align: center;
  }

  .amount-display {
    align-items: center;
    text-align: center;
  }

  .flow-navigation {
    flex-direction: column;
    gap: 8px;
  }

  .btn {
    width: 100%;
  }
}
`;

export { styles };
