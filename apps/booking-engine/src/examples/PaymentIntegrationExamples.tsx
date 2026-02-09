/**
 * PAYMENT SYSTEM INTEGRATION EXAMPLES
 * 
 * This file demonstrates how to use all payment components and APIs together
 * to create a complete payment flow in your booking application.
 */

// ===== Example 1: Basic Payment Flow Component ====

import React from 'react';
import CombinedPaymentFlow from '@/components/CombinedPaymentFlow';
import type { FC } from 'react';

const BasicPaymentExample: FC = () => {
  const booking = {
    bookingId: 'BK-123456',
    customerId: 'CUST-789',
    reference: 'AA-B2C-2024-001',
    flightDetails: 'NYC (JFK) → LAX on Jan 15, 2024',
    passengerName: 'John Doe',
    totalAmount: 450.50,
    currency: 'USD',
  };

  const handlePaymentComplete = (result: any) => {
    console.log('Payment completed:', result);
    // Redirect to booking confirmation, send email, etc.
  };

  const handleCancel = () => {
    console.log('Payment cancelled');
    // Navigate back to booking details
  };

  return (
    <CombinedPaymentFlow
      booking={booking}
      onPaymentComplete={handlePaymentComplete}
      onCancel={handleCancel}
    />
  );
};

// ===== Example 2: Using Payment Flow Hook ====

import { usePaymentFlowAuto, usePaymentConfirmation } from '@/hooks/usePaymentFlow';

const HookBasedPaymentExample: FC = () => {
  const [state, actions] = usePaymentFlowAuto({
    bookingId: 'BK-123456',
    customerId: 'CUST-789',
    totalAmount: 450.50,
    currency: 'USD',
    onSuccess: (result) => {
      console.log('Payment successful:', result);
    },
    onError: (error) => {
      console.error('Payment error:', error);
    },
    autoRetry: true,
    maxRetries: 3,
  });

  const { isConfirmed, confirmationNumber } = usePaymentConfirmation(state);

  return (
    <div>
      <h1>Payment Status: {state.step}</h1>
      {state.isLoading && <p>Loading payment options...</p>}
      {state.error && <p className="error">{state.error}</p>}
      {isConfirmed && (
        <p className="success">
          Payment confirmed! Confirmation #: {confirmationNumber}
        </p>
      )}

      {state.paymentOptions && (
        <div>
          <p>Wallet Balance: {state.paymentOptions.walletBalance}</p>
          <p>Available Credits: {state.paymentOptions.availableCredits.length}</p>
        </div>
      )}
    </div>
  );
};

// ===== Example 3: Manual Payment Control ====

import { usePaymentFlow } from '@/hooks/usePaymentFlow';

const ManualPaymentControlExample: FC = () => {
  const [state, actions] = usePaymentFlow({
    bookingId: 'BK-123456',
    customerId: 'CUST-789',
    totalAmount: 450.50,
    currency: 'USD',
  });

  React.useEffect(() => {
    // Fetch payment options when component mounts
    actions.fetchPaymentOptions();
  }, []);

  const handleProcessPayment = async () => {
    await actions.processPayment({
      customerId: 'CUST-789',
      totalAmount: 450.50,
      currency: 'USD',
      useWallet: true,
      walletAmount: 150.00,
      useCredits: true,
      creditIds: ['CREDIT-1', 'CREDIT-2'],
      cardAmount: 150.50,
    });
  };

  return (
    <div>
      {state.step === 'error' && (
        <button onClick={actions.retryPayment}>
          Retry Payment ({state.retryCount}/{3})
        </button>
      )}

      {state.step === 'processing' && <p>Processing payment...</p>}

      {state.step === 'success' && (
        <button onClick={() => actions.reset()}>
          Start New Payment
        </button>
      )}

      {state.step === 'options' && (
        <button onClick={handleProcessPayment}>
          Process Combined Payment
        </button>
      )}

      {state.step !== 'success' && (
        <button onClick={actions.cancelPayment}>
          Cancel
        </button>
      )}
    </div>
  );
};

// ===== Example 4: Custom Error Handling ====

import { usePaymentErrorRecovery } from '@/hooks/usePaymentFlow';

const ErrorHandlingExample: FC = () => {
  const [error, setError] = React.useState<string | null>(null);
  const { suggestion, recoveryAction } = usePaymentErrorRecovery(error);

  return (
    <div>
      {error && (
        <div className="error-container">
          <h3>Payment Error</h3>
          <p>{error}</p>
          {suggestion && <p className="suggestion">{suggestion}</p>}
          {recoveryAction && (
            <button onClick={recoveryAction}>
              Retry
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// ===== Example 5: API Client Direct Usage ====

import { getPaymentApiClient, handlePaymentError } from '@/api/paymentApi';

const DirectApiUsageExample: FC = () => {
  const handleFetchOptions = async () => {
    try {
      const apiClient = getPaymentApiClient();

      // Fetch available payment options
      const options = await apiClient.getPaymentOptions(
        'CUST-789',
        450.50,
        'USD'
      );

      console.log('Wallet Balance:', options.walletBalance);
      console.log('Available Credits:', options.availableCredits);
      console.log('Recommended Breakdown:', options.recommendedBreakdown);
    } catch (error) {
      const message = handlePaymentError(error);
      console.error('Error:', message);
    }
  };

  const handleProcessPayment = async () => {
    try {
      const apiClient = getPaymentApiClient();

      // Process combined payment
      const result = await apiClient.processPayment('BK-123456', {
        customerId: 'CUST-789',
        totalAmount: 450.50,
        currency: 'USD',
        useWallet: true,
        walletAmount: 150.00,
        useCredits: true,
        creditIds: ['CREDIT-1'],
        cardAmount: 150.50,
      });

      console.log('Payment Result:', result);
      console.log('Transaction ID:', result.transactionId);
      console.log('Confirmation #:', result.confirmationNumber);
    } catch (error) {
      const message = handlePaymentError(error);
      console.error('Error:', message);
    }
  };

  const handleRefund = async () => {
    try {
      const apiClient = getPaymentApiClient();

      // Request refund
      const result = await apiClient.refundPayment('BK-123456', {
        transactionId: 'TXN-123456',
        reason: 'Customer requested cancellation',
        amount: 450.50,
      });

      console.log('Refund Result:', result);
      console.log('Refund ID:', result.refundId);
    } catch (error) {
      const message = handlePaymentError(error);
      console.error('Error:', message);
    }
  };

  return (
    <div>
      <button onClick={handleFetchOptions}>Fetch Payment Options</button>
      <button onClick={handleProcessPayment}>Process Payment</button>
      <button onClick={handleRefund}>Request Refund</button>
    </div>
  );
};

// ===== Example 6: Complete Payment Flow in Page ====

interface CompletePaymentPageExampleProps {
  bookingId: string;
  onPaymentComplete: (result: any) => void;
}

const CompletePaymentPageExample: FC<CompletePaymentPageExampleProps> = ({
  bookingId,
  onPaymentComplete,
}) => {
  return (
    <div className="payment-page">
      <div className="payment-container">
        <header className="page-header">
          <h1>Complete Your Booking</h1>
          <p>Secure payment with multiple options available</p>
        </header>

        <main className="payment-main">
          <CombinedPaymentFlow
            booking={{
              bookingId,
              customerId: 'CUST-789',
              reference: 'AA-B2C-2024-001',
              flightDetails: 'NYC (JFK) → LAX',
              passengerName: 'John Doe',
              totalAmount: 450.50,
              currency: 'USD',
            }}
            onPaymentComplete={onPaymentComplete}
            onCancel={() => window.history.back()}
          />
        </main>

        <aside className="payment-sidebar">
          <div className="order-summary">
            <h3>Order Summary</h3>
            <div className="summary-item">
              <span>Flight</span>
              <span>$425.00</span>
            </div>
            <div className="summary-item">
              <span>Taxes & Fees</span>
              <span>$25.50</span>
            </div>
            <div className="summary-item total">
              <span>Total</span>
              <span>$450.50</span>
            </div>
          </div>

          <div className="payment-security">
            <h3>🔒 Payment Security</h3>
            <ul>
              <li>Encrypted with SSL</li>
              <li>PCI DSS Compliant</li>
              <li>Secure Card Processing</li>
              <li>Money-back Guarantee</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
};

// ===== Example 7: Retry Strategy Implementation ====

import { usePaymentRetry } from '@/hooks/usePaymentFlow';

const RetryStrategyExample: FC = () => {
  const retry = usePaymentRetry(1000, 3);

  const handlePaymentWithRetry = async () => {
    while (retry.shouldRetry()) {
      try {
        const apiClient = getPaymentApiClient();
        await apiClient.processPayment('BK-123456', {
          customerId: 'CUST-789',
          totalAmount: 450.50,
          currency: 'USD',
          useWallet: true,
          walletAmount: 150.00,
          useCredits: false,
          creditIds: [],
          cardAmount: 300.50,
        });

        retry.reset();
        break; // Success
      } catch (error) {
        retry.recordAttempt();

        if (retry.shouldRetry()) {
          const delay = retry.getBackoffDelay();
          console.log(`Retrying in ${delay}ms... (Attempt ${retry.attempts})`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        } else {
          console.error('Payment failed after max retries');
          throw error;
        }
      }
    }
  };

  return (
    <button onClick={handlePaymentWithRetry}>
      Pay with Retry Logic
    </button>
  );
};

// ===== Example 8: TypeScript Integration ====

interface BookingPageState {
  booking: {
    id: string;
    customerId: string;
    amount: number;
    currency: string;
  };
  payment: {
    status: 'pending' | 'in-progress' | 'completed' | 'failed';
    transactionId: string | null;
    error: string | null;
  };
}

const TypeScriptIntegrationExample: FC = () => {
  const [state, setState] = React.useState<BookingPageState>({
    booking: {
      id: 'BK-123456',
      customerId: 'CUST-789',
      amount: 450.50,
      currency: 'USD',
    },
    payment: {
      status: 'pending',
      transactionId: null,
      error: null,
    },
  });

  const handlePayment = async (request: any) => {
    setState((s) => ({
      ...s,
      payment: { ...s.payment, status: 'in-progress' },
    }));

    try {
      const apiClient = getPaymentApiClient();
      const result = await apiClient.processPayment(state.booking.id, request);

      setState((s) => ({
        ...s,
        payment: {
          status: 'completed',
          transactionId: result.transactionId,
          error: null,
        },
      }));
    } catch (error) {
      const errorMsg = handlePaymentError(error);
      setState((s) => ({
        ...s,
        payment: {
          status: 'failed',
          transactionId: null,
          error: errorMsg,
        },
      }));
    }
  };

  return (
    <div>
      <h1>Booking: {state.booking.id}</h1>
      <p>Amount: {state.booking.currency} {state.booking.amount}</p>
      {state.payment.status === 'completed' && (
        <p>✓ Payment successful! ID: {state.payment.transactionId}</p>
      )}
      {state.payment.error && (
        <p className="error">Error: {state.payment.error}</p>
      )}
    </div>
  );
};

// ===== EXPORTS =====

export {
  BasicPaymentExample,
  HookBasedPaymentExample,
  ManualPaymentControlExample,
  ErrorHandlingExample,
  DirectApiUsageExample,
  CompletePaymentPageExample,
  RetryStrategyExample,
  TypeScriptIntegrationExample,
};

// ===== USAGE GUIDE =====

/**
 * QUICK START GUIDE
 * 
 * 1. Basic Usage:
 *    import CombinedPaymentFlow from '@/components/CombinedPaymentFlow'
 *    <CombinedPaymentFlow booking={...} onPaymentComplete={...} />
 * 
 * 2. Hook-Based:
 *    const [state, actions] = usePaymentFlowAuto({...})
 *    Then use state.step to render different UI
 * 
 * 3. Direct API:
 *    const apiClient = getPaymentApiClient()
 *    const result = await apiClient.processPayment(...)
 * 
 * 4. Error Handling:
 *    Use handlePaymentError() to convert errors to user-friendly messages
 * 
 * 5. Manual Control:
 *    Use usePaymentFlow() for full control over flow
 *    Actions: fetchPaymentOptions, processPayment, cancelPayment, reset
 */
