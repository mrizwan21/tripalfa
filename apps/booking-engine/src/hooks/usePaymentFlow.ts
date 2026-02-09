/**
 * usePaymentFlow Hook
 * Custom React hook for managing the complete payment flow
 * 
 * Features:
 * - State management for multi-step payment process
 * - API integration with error handling
 * - Retry logic
 * - Progress tracking
 * - Success/failure handling
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { getPaymentApiClient, handlePaymentError } from '../api/paymentApi';
import type {
  PaymentOptionsResponse,
  PaymentRequest,
  PaymentResponse,
  RefundResponse,
} from '../api/paymentApi';

// ===== TYPE DEFINITIONS =====

export interface PaymentFlowState {
  step: 'initial' | 'loading' | 'options' | 'selection' | 'confirmation' | 'processing' | 'success' | 'error';
  paymentOptions: PaymentOptionsResponse | null;
  paymentResult: PaymentResponse | null;
  error: string | null;
  isLoading: boolean;
  retryCount: number;
  transactionId: string | null;
}

export interface UsePaymentFlowProps {
  bookingId: string;
  customerId: string;
  totalAmount: number;
  currency: string;
  onSuccess?: (result: PaymentResponse) => void;
  onError?: (error: string) => void;
  onStateChange?: (state: PaymentFlowState) => void;
  autoRetry?: boolean;
  maxRetries?: number;
}

export interface PaymentFlowActions {
  fetchPaymentOptions: () => Promise<void>;
  processPayment: (request: PaymentRequest) => Promise<void>;
  cancelPayment: () => Promise<void>;
  retryPayment: () => Promise<void>;
  reset: () => void;
  goToStep: (step: PaymentFlowState['step']) => void;
}

// ===== HOOK IMPLEMENTATION =====

export function usePaymentFlow({
  bookingId,
  customerId,
  totalAmount,
  currency,
  onSuccess,
  onError,
  onStateChange,
  autoRetry = true,
  maxRetries = 3,
}: UsePaymentFlowProps): [PaymentFlowState, PaymentFlowActions] {
  const [state, setState] = useState<PaymentFlowState>({
    step: 'initial',
    paymentOptions: null,
    paymentResult: null,
    error: null,
    isLoading: false,
    retryCount: 0,
    transactionId: null,
  });

  const retryTimeoutRef = useRef<NodeJS.Timeout>();
  const lastPaymentRequestRef = useRef<PaymentRequest | null>(null);

  // Utility to update state
  const updateState = useCallback((updates: Partial<PaymentFlowState>) => {
    setState((prev) => {
      const newState = { ...prev, ...updates };
      onStateChange?.(newState);
      return newState;
    });
  }, [onStateChange]);

  // Fetch payment options
  const fetchPaymentOptions = useCallback(async () => {
    updateState({ step: 'loading', isLoading: true, error: null });

    try {
      const apiClient = getPaymentApiClient();
      const options = await apiClient.getPaymentOptions(customerId, totalAmount, currency);

      updateState({
        step: 'options',
        paymentOptions: options,
        isLoading: false,
      });
    } catch (error) {
      const errorMessage = handlePaymentError(error);
      updateState({
        step: 'error',
        error: errorMessage,
        isLoading: false,
      });
      onError?.(errorMessage);
    }
  }, [customerId, totalAmount, currency, updateState, onError]);

  // Process payment
  const processPayment = useCallback(
    async (request: PaymentRequest) => {
      updateState({ step: 'processing', isLoading: true, error: null });
      lastPaymentRequestRef.current = request;

      try {
        const apiClient = getPaymentApiClient();
        const result = await apiClient.processPayment(bookingId, request);

        updateState({
          step: 'success',
          paymentResult: result,
          transactionId: result.transactionId,
          isLoading: false,
          retryCount: 0,
        });

        onSuccess?.(result);
      } catch (error) {
        const errorMessage = handlePaymentError(error);
        const newRetryCount = state.retryCount + 1;

        if (autoRetry && newRetryCount < maxRetries) {
          // Auto-retry with exponential backoff
          const backoffDelay = Math.pow(2, newRetryCount) * 1000;

          retryTimeoutRef.current = setTimeout(() => {
            updateState({
              retryCount: newRetryCount,
              step: 'processing',
            });
            processPayment(request);
          }, backoffDelay);
        } else {
          updateState({
            step: 'error',
            error: errorMessage,
            isLoading: false,
            retryCount: newRetryCount,
          });
          onError?.(errorMessage);
        }
      }
    },
    [bookingId, autoRetry, maxRetries, onSuccess, onError, state.retryCount, updateState]
  );

  // Cancel payment
  const cancelPayment = useCallback(async () => {
    try {
      const apiClient = getPaymentApiClient();
      await apiClient.cancelPayment(bookingId);

      updateState({
        step: 'initial',
        paymentResult: null,
        transactionId: null,
        error: null,
      });
    } catch (error) {
      const errorMessage = handlePaymentError(error);
      updateState({ error: errorMessage });
    }
  }, [bookingId, updateState]);

  // Retry payment
  const retryPayment = useCallback(async () => {
    if (!lastPaymentRequestRef.current) {
      updateState({ error: 'No previous payment request to retry' });
      return;
    }

    await processPayment(lastPaymentRequestRef.current);
  }, [processPayment, updateState]);

  // Reset state
  const reset = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }

    setState({
      step: 'initial',
      paymentOptions: null,
      paymentResult: null,
      error: null,
      isLoading: false,
      retryCount: 0,
      transactionId: null,
    });

    lastPaymentRequestRef.current = null;
  }, []);

  // Go to specific step
  const goToStep = useCallback(
    (step: PaymentFlowState['step']) => {
      updateState({ step });
    },
    [updateState]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  const actions: PaymentFlowActions = {
    fetchPaymentOptions,
    processPayment,
    cancelPayment,
    retryPayment,
    reset,
    goToStep,
  };

  return [state, actions];
}

// ===== HELPER HOOKS =====

/**
 * Hook to manage payment flow with auto-load
 */
export function usePaymentFlowAuto(
  props: UsePaymentFlowProps
): [PaymentFlowState, PaymentFlowActions] {
  const [state, actions] = usePaymentFlow(props);

  useEffect(() => {
    actions.fetchPaymentOptions();
  }, [props.bookingId, props.customerId, actions]);

  return [state, actions];
}

/**
 * Hook to detect payment confirmation
 */
export function usePaymentConfirmation(state: PaymentFlowState) {
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [confirmationNumber, setConfirmationNumber] = useState<string | null>(null);

  useEffect(() => {
    if (state.step === 'success' && state.paymentResult) {
      setIsConfirmed(true);
      setConfirmationNumber(state.paymentResult.confirmationNumber);
    } else {
      setIsConfirmed(false);
      setConfirmationNumber(null);
    }
  }, [state.step, state.paymentResult]);

  return { isConfirmed, confirmationNumber };
}

/**
 * Hook to handle payment errors with recovery suggestions
 */
export function usePaymentErrorRecovery(error: string | null) {
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [recoveryAction, setRecoveryAction] = useState<(() => void) | null>(null);

  useEffect(() => {
    if (!error) {
      setSuggestion(null);
      setRecoveryAction(null);
      return;
    }

    if (error.includes('network') || error.includes('connection')) {
      setSuggestion('Check your internet connection and try again.');
      setRecoveryAction(() => window.location.reload);
    } else if (error.includes('session') || error.includes('expired')) {
      setSuggestion('Your session has expired. Please login again.');
      setRecoveryAction(() => () => window.location.href = '/login');
    } else if (error.includes('card')) {
      setSuggestion('Please check your card details and try again.');
    } else if (error.includes('insufficient')) {
      setSuggestion('You have insufficient funds. Please add funds or use another payment method.');
    } else if (error.includes('declined')) {
      setSuggestion('Your payment was declined. Please try another card or contact your bank.');
    } else {
      setSuggestion('An error occurred. Please try again or contact support.');
    }
  }, [error]);

  return { suggestion, recoveryAction };
}

/**
 * Hook for payment retry strategy
 */
export function usePaymentRetry(
  initialDelay: number = 1000,
  maxAttempts: number = 3
) {
  const [attempts, setAttempts] = useState(0);
  const [canRetry, setCanRetry] = useState(true);

  const shouldRetry = useCallback((): boolean => {
    return canRetry && attempts < maxAttempts;
  }, [canRetry, attempts, maxAttempts]);

  const getBackoffDelay = useCallback((): number => {
    return initialDelay * Math.pow(2, attempts);
  }, [initialDelay, attempts]);

  const recordAttempt = useCallback(() => {
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);

    if (newAttempts >= maxAttempts) {
      setCanRetry(false);
    }
  }, [attempts, maxAttempts]);

  const reset = useCallback(() => {
    setAttempts(0);
    setCanRetry(true);
  }, []);

  return {
    attempts,
    canRetry,
    shouldRetry,
    getBackoffDelay,
    recordAttempt,
    reset,
  };
}

// ===== EXPORT ALL =====

export default usePaymentFlow;
