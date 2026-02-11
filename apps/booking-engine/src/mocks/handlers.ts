import { http, HttpResponse } from 'msw';

// Mock API handlers for frontend testing
export const handlers = [
  // Authentication
  http.post('/api/auth/login', async ({ request }) => {
    const body = await request.json();
    const { email, password, testMode } = body as { email: string; password: string; testMode?: boolean };

    // In test mode, accept any credentials
    if (testMode || (email && password)) {
      return HttpResponse.json({
        token: 'mock_jwt_token_12345',
        user: {
          id: 'user_123',
          email: email || 'test@example.com',
          name: 'Test User',
          role: 'customer'
        }
      });
    }

    return HttpResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }),

  // Flight search
    http.get('/api/flights/search', ({ request }) => {
      // Support pagination via ?page=1&pageSize=10
      const url = new URL(request.url);
      const page = parseInt(url.searchParams.get('page') || '1', 10);
      const pageSize = parseInt(url.searchParams.get('pageSize') || '10', 10);
      const total = 39;
      const flights = Array.from({ length: total }, (_, i) => ({
        id: `flight_${i + 1}`,
        airline: `Test Airlines ${i + 1}`,
        flight_number: `TA${100 + i}`,
        departure: { airport: 'JFK', time: `2026-03-15T${(10 + i % 10).toString().padStart(2, '0')}:00:00Z` },
        arrival: { airport: 'LHR', time: `2026-03-15T${(22 + i % 2).toString().padStart(2, '0')}:00:00Z` },
        price: 1200 + i * 10,
        currency: 'USD'
      }));
      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      const paginatedFlights = flights.slice(start, end);
      return HttpResponse.json({
        flights: paginatedFlights,
        total,
        page,
        pageSize
      });
    }),

  // Hotel search with pagination
  http.get('/api/hotels/search', ({ request }) => {
    // Support pagination via ?page=1&pageSize=10
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10', 10);
    const total = 25;
    const hotels = Array.from({ length: total }, (_, i) => ({
      id: `hotel_${i + 1}`,
      name: `Test Hotel ${i + 1}`,
      location: ['New York', 'London', 'Paris', 'Tokyo'][i % 4],
      price: 200 + i * 5,
      rating: 4 + (i % 2) * 0.5,
      amenities: ['WiFi', 'Pool', 'Gym', 'Spa'].slice(0, (i % 4) + 1)
    }));
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginatedHotels = hotels.slice(start, end);
    return HttpResponse.json({
      hotels: paginatedHotels,
      total,
      page,
      pageSize
    });
  }),

  // Booking creation
  http.post('/api/bookings', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      booking_id: `booking_${Date.now()}`,
      status: 'confirmed',
      ...body,
      created_at: new Date().toISOString()
    });
  }),

  // Payment processing
  http.post('/api/payments', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      payment_id: `payment_${Date.now()}`,
      status: 'succeeded',
      amount: body.amount,
      currency: body.currency
    });
  }),

  // Notifications
  http.get('/api/notifications', () => {
    return HttpResponse.json({
      notifications: [
        {
          id: 'notif_1',
          type: 'booking_confirmed',
          title: 'Booking Confirmed',
          message: 'Your flight booking has been confirmed',
          read: false,
          created_at: new Date().toISOString()
        }
      ]
    });
  }),

  // Wallet operations
  http.get('/api/wallet/balance', () => {
    return HttpResponse.json({
      balance: 500,
      currency: 'USD'
    });
  }),

  http.post('/api/wallet/fund', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      transaction_id: `txn_${Date.now()}`,
      amount: body.amount,
      new_balance: 500 + body.amount
    });
  }),

  // User preferences
  http.get('/api/user/preferences', () => {
    return HttpResponse.json({
      email_enabled: true,
      sms_enabled: true,
      push_enabled: false,
      in_app_enabled: true
    });
  }),

  http.put('/api/user/preferences', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      ...body,
      updated_at: new Date().toISOString()
    });
  }),

  // ============================================================================
  // PAYMENT GATEWAY WEBHOOK MOCKS
  // ============================================================================

  // Payment success webhook
  http.post('/api/webhooks/payments/success', async ({ request }) => {
    const body = await request.json();
    const { transactionId, bookingId, amount, currency, customerId } = body as any;

    // Trigger frontend event for testing
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('mockPaymentSuccessWebhook', {
        detail: {
          gateway: 'stripe',
          transactionId,
          bookingId,
          amount,
          currency,
          status: 'succeeded',
          customerId
        }
      }));
    }

    return HttpResponse.json({
      received: true,
      status: 'processed',
      notification_sent: true
    });
  }),

  // Payment failure webhook
  http.post('/api/webhooks/payments/failure', async ({ request }) => {
    const body = await request.json();
    const { transactionId, bookingId, amount, currency, failureCode, customerId } = body as any;

    // Trigger frontend event for testing
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('mockPaymentFailureWebhook', {
        detail: {
          gateway: 'stripe',
          transactionId,
          bookingId,
          amount,
          currency,
          status: 'failed',
          failureCode,
          customerId
        }
      }));
    }

    return HttpResponse.json({
      received: true,
      status: 'processed',
      notification_sent: true
    });
  }),

  // Refund webhook
  http.post('/api/webhooks/payments/refund', async ({ request }) => {
    const body = await request.json();
    const { transactionId, refundId, bookingId, amount, currency, customerId } = body as any;

    // Trigger frontend event for testing
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('mockRefundWebhook', {
        detail: {
          gateway: 'stripe',
          transactionId,
          refundId,
          bookingId,
          amount,
          currency,
          status: 'succeeded',
          customerId
        }
      }));
    }

    return HttpResponse.json({
      received: true,
      status: 'processed',
      notification_sent: true
    });
  }),

  // Chargeback webhook
  http.post('/api/webhooks/payments/chargeback', async ({ request }) => {
    const body = await request.json();
    const { transactionId, chargebackId, bookingId, amount, currency, reason, customerId } = body as any;

    // Trigger frontend event for testing
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('mockChargebackWebhook', {
        detail: {
          gateway: 'stripe',
          transactionId,
          chargebackId,
          bookingId,
          amount,
          currency,
          reason,
          customerId
        }
      }));
    }

    return HttpResponse.json({
      received: true,
      status: 'processed',
      notification_sent: true
    });
  }),

  // Webhook with signature validation
  http.post('/api/webhooks/payments/signature-test', async ({ request }) => {
    const signature = request.headers.get('x-webhook-signature');
    const body = await request.json();

    if (signature === 'valid_signature_123') {
      // Trigger frontend event for testing
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('mockWebhookWithValidSignature', {
          detail: {
            gateway: 'stripe',
            signature,
            payload: body
          }
        }));
      }

      return HttpResponse.json({
        received: true,
        signature_valid: true,
        status: 'processed'
      });
    } else {
      // Trigger frontend event for testing
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('mockWebhookWithInvalidSignature', {
          detail: {
            gateway: 'stripe',
            signature,
            payload: body
          }
        }));
      }

      return HttpResponse.json({
        error: 'Invalid signature',
        signature_valid: false
      }, { status: 401 });
    }
  }),

  // Idempotent webhook
  http.post('/api/webhooks/payments/idempotent', async ({ request }) => {
    const body = await request.json();
    const { eventId, transactionId, status, customerId } = body as any;

    // Check for duplicate event ID (simple mock)
    const processedEvents = (global as any).processedWebhookEvents || new Set();
    if (processedEvents.has(eventId)) {
      // Trigger frontend event for testing
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('mockIdempotentWebhook', {
          detail: {
            gateway: 'stripe',
            eventId,
            transactionId,
            status,
            customerId,
            duplicate: true
          }
        }));
      }

      return HttpResponse.json({
        received: true,
        duplicate: true,
        status: 'already_processed'
      });
    }

    // Mark as processed
    processedEvents.add(eventId);
    (global as any).processedWebhookEvents = processedEvents;

    // Trigger frontend event for testing
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('mockIdempotentWebhook', {
        detail: {
          gateway: 'stripe',
          eventId,
          transactionId,
          status,
          customerId,
          duplicate: false
        }
      }));
    }

    return HttpResponse.json({
      received: true,
      status: 'processed',
      notification_sent: true
    });
  }),

  // Webhook retry handling
  http.post('/api/webhooks/payments/retry', async ({ request }) => {
    const body = await request.json();
    const { eventId, retryCount, error } = body as any;

    // Simulate failure on first attempt
    if (retryCount === 1) {
      // Trigger frontend event for testing
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('mockWebhookProcessingFailure', {
          detail: {
            gateway: 'stripe',
            eventId,
            retryCount,
            error
          }
        }));
      }

      return HttpResponse.json({
        error: 'Temporary service unavailable',
        retry: true
      }, { status: 503 });
    }

    // Success on retry
    // Trigger frontend event for testing
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('mockWebhookRetrySuccess', {
        detail: {
          gateway: 'stripe',
          eventId,
          retryCount,
          status: 'processed'
        }
      }));
    }

    return HttpResponse.json({
      received: true,
      status: 'processed',
      notification_sent: true
    });
  }),

  // ============================================================================
  // WALLET TRANSACTION MOCKS
  // ============================================================================

  // Wallet credit
  http.post('/api/wallet/credit', async ({ request }) => {
    const body = await request.json();
    const { walletId, amount, currency, userId } = body as any;

    const newBalance = 1200.00; // Mock balance

    // Trigger frontend event for testing
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('mockWalletCredit', {
        detail: {
          walletId,
          amount,
          currency,
          type: 'credit',
          userId,
          newBalance
        }
      }));
    }

    return HttpResponse.json({
      transaction_id: `txn_credit_${Date.now()}`,
      amount,
      currency,
      new_balance: newBalance,
      notification_sent: true
    });
  }),

  // Wallet debit
  http.post('/api/wallet/debit', async ({ request }) => {
    const body = await request.json();
    const { walletId, amount, currency, bookingId, userId } = body as any;

    const remainingBalance = 1000.00; // Mock balance

    // Trigger frontend event for testing
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('mockWalletDebit', {
        detail: {
          walletId,
          amount,
          currency,
          type: 'debit',
          bookingId,
          userId,
          remainingBalance
        }
      }));
    }

    return HttpResponse.json({
      transaction_id: `txn_debit_${Date.now()}`,
      amount,
      currency,
      remaining_balance: remainingBalance,
      notification_sent: true
    });
  }),

  // Low balance alert
  http.post('/api/wallet/check-balance', async ({ request }) => {
    const body = await request.json();
    const { walletId, threshold, userId } = body as any;

    const currentBalance = 50.00; // Mock low balance

    // Trigger frontend event for testing
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('mockLowWalletBalance', {
        detail: {
          walletId,
          currentBalance,
          threshold,
          currency: 'USD',
          userId
        }
      }));
    }

    return HttpResponse.json({
      balance: currentBalance,
      threshold,
      alert_sent: true
    });
  }),

  // Wallet transfer
  http.post('/api/wallet/transfer', async ({ request }) => {
    const body = await request.json();
    const { fromWalletId, toWalletId, amount, currency, userId } = body as any;

    const remainingBalance = 700.00; // Mock balance

    // Trigger frontend event for testing
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('mockWalletTransfer', {
        detail: {
          fromWalletId,
          toWalletId,
          amount,
          currency,
          userId,
          remainingBalance
        }
      }));
    }

    return HttpResponse.json({
      transfer_id: `transfer_${Date.now()}`,
      amount,
      currency,
      remaining_balance: remainingBalance,
      notification_sent: true
    });
  }),

  // Transaction history
  http.get('/api/wallet/transactions', () => {
    const transactions = [
      { id: 'txn1', type: 'credit', amount: 500.00, date: '2026-01-01' },
      { id: 'txn2', type: 'debit', amount: 200.00, date: '2026-01-02' }
    ];

    // Trigger frontend event for testing
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('mockTransactionHistory', {
        detail: {
          walletId: 'wallet-123',
          transactions,
          userId: 'user-123'
        }
      }));
    }

    return HttpResponse.json({
      transactions,
      notification_sent: true
    });
  }),

  // Failed wallet transaction
  http.post('/api/wallet/transaction-failed', async ({ request }) => {
    const body = await request.json();
    const { walletId, amount, currency, error, userId } = body as any;

    // Trigger frontend event for testing
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('mockWalletTransactionFailed', {
        detail: {
          walletId,
          amount,
          currency,
          error,
          userId
        }
      }));
    }

    return HttpResponse.json({
      error,
      notification_sent: true
    });
  }),

  // ============================================================================
  // PAYMENT FINALIZATION MOCKS
  // ============================================================================

  // Hold order creation
  http.post('/api/hold-orders', async ({ request }) => {
    const body = await request.json();
    const { totalAmount, currency, customerId, customerName, type } = body as any;

    const holdOrderId = `HOLD${Date.now()}`;

    // Trigger frontend event for testing
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('mockHoldOrderCreated', {
        detail: {
          holdOrderId,
          totalAmount,
          currency,
          customerId,
          customerName,
          type
        }
      }));
    }

    return HttpResponse.json({
      hold_order_id: holdOrderId,
      status: 'created',
      expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutes
    });
  }),

  // Payment finalization
  http.post('/api/payments/finalize/:holdOrderId', async ({ request }) => {
    const { holdOrderId } = request.params as any;
    const body = await request.json();
    const { paymentMethod, amount, currency } = body as any;

    // Trigger frontend event for testing
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('mockPaymentFinalization', {
        detail: {
          holdOrderId,
          paymentMethod,
          amount,
          currency,
          bookingId: `BK${Date.now()}`,
          status: 'confirmed'
        }
      }));
    }

    return HttpResponse.json({
      booking_id: `BK${Date.now()}`,
      payment_id: `PAY${Date.now()}`,
      status: 'confirmed',
      documents_generated: true,
      notifications_sent: true
    });
  }),

  // ============================================================================
  // PAYMENT PROCESSING MOCKS
  // ============================================================================

  // Payment success
  http.post('/api/payments/success', async ({ request }) => {
    const body = await request.json();
    const { transactionId, bookingId, amount, currency, method, customerId } = body as any;

    // Trigger frontend event for testing
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('mockPaymentSuccess', {
        detail: {
          transactionId,
          bookingId,
          amount,
          currency,
          method,
          customerId
        }
      }));
    }

    return HttpResponse.json({
      status: 'success',
      notification_sent: true
    });
  }),

  // Payment failure
  http.post('/api/payments/failure', async ({ request }) => {
    const body = await request.json();
    const { bookingId, amount, currency, error, customerId } = body as any;

    // Trigger frontend event for testing
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('mockPaymentFailure', {
        detail: {
          bookingId,
          amount,
          currency,
          error,
          customerId
        }
      }));
    }

    return HttpResponse.json({
      status: 'failed',
      error,
      notification_sent: true
    });
  }),

  // Refund processing
  http.post('/api/payments/refund', async ({ request }) => {
    const body = await request.json();
    const { transactionId, bookingId, refundAmount, currency, reason, customerId } = body as any;

    // Trigger frontend event for testing
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('mockRefundProcessed', {
        detail: {
          transactionId,
          bookingId,
          refundAmount,
          currency,
          reason,
          customerId
        }
      }));
    }

    return HttpResponse.json({
      refund_id: `REF${Date.now()}`,
      status: 'processed',
      notification_sent: true
    });
  }),

  // Partial payment
  http.post('/api/payments/partial', async ({ request }) => {
    const body = await request.json();
    const { bookingId, paidAmount, totalAmount, currency, remainingAmount, customerId } = body as any;

    // Trigger frontend event for testing
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('mockPartialPayment', {
        detail: {
          bookingId,
          paidAmount,
          totalAmount,
          currency,
          remainingAmount,
          customerId
        }
      }));
    }

    return HttpResponse.json({
      status: 'partial',
      paid_amount: paidAmount,
      remaining_amount: remainingAmount,
      notification_sent: true
    });
  }),

  // Payment reminder
  http.post('/api/payments/reminder', async ({ request }) => {
    const body = await request.json();
    const { bookingId, dueDate, amount, currency, customerId, daysUntilDue } = body as any;

    // Trigger frontend event for testing
    if (typeof window !== 'undefined') {
      if (daysUntilDue === 3) {
        window.dispatchEvent(new CustomEvent('mockPaymentReminderTrigger', {
          detail: { daysUntilDue }
        }));
      } else if (daysUntilDue === 1) {
        window.dispatchEvent(new CustomEvent('mockUrgentPaymentReminder', {
          detail: {
            daysUntilDue,
            bookingId,
            amount,
            currency,
            customerId
          }
        }));
      }
    }

    return HttpResponse.json({
      reminder_id: `REM${Date.now()}`,
      status: 'sent',
      notification_sent: true
    });
  }),

  // Booking with pending payment
  http.post('/api/bookings/pending-payment', async ({ request }) => {
    const body = await request.json();
    const { bookingId, dueDate, amount, currency, customerId } = body as any;

    // Trigger frontend event for testing
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('mockBookingWithPendingPayment', {
        detail: {
          bookingId,
          dueDate,
          amount,
          currency,
          customerId
        }
      }));
    }

    return HttpResponse.json({
      booking_id: bookingId,
      status: 'pending_payment',
      reminder_scheduled: true
    });
  }),

  // ============================================================================
  // BANK NOTIFICATION MOCKS
  // ============================================================================

  // Bank transfer initiated
  http.post('/api/bank/transfers/initiate', async ({ request }) => {
    const body = await request.json();
    const { amount, currency, bankName, accountLast4, customerId } = body as any;

    const transferId = `btx_${Date.now()}`;

    // Trigger frontend event for testing
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('mockBankTransferInitiated', {
        detail: {
          transferId,
          amount,
          currency,
          bankName,
          accountLast4,
          customerId
        }
      }));
    }

    return HttpResponse.json({
      transfer_id: transferId,
      status: 'initiated',
      notification_sent: true
    });
  }),

  // Bank transfer completed
  http.post('/api/bank/transfers/complete', async ({ request }) => {
    const body = await request.json();
    const { transferId, amount, currency, bankName, reference, customerId } = body as any;

    // Trigger frontend event for testing
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('mockBankTransferCompleted', {
        detail: {
          transferId,
          amount,
          currency,
          bankName,
          reference,
          customerId
        }
      }));
    }

    return HttpResponse.json({
      transfer_id: transferId,
      status: 'completed',
      notification_sent: true
    });
  }),

  // Bank transfer failed
  http.post('/api/bank/transfers/fail', async ({ request }) => {
    const body = await request.json();
    const { transferId, amount, currency, bankName, error, customerId } = body as any;

    // Trigger frontend event for testing
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('mockBankTransferFailed', {
        detail: {
          transferId,
          amount,
          currency,
          bankName,
          error,
          customerId
        }
      }));
    }

    return HttpResponse.json({
      transfer_id: transferId,
      status: 'failed',
      error,
      notification_sent: true
    });
  }),

  // Bank account verification
  http.post('/api/bank/accounts/verify', async ({ request }) => {
    const body = await request.json();
    const { accountId, bankName, accountLast4, verificationStatus, customerId } = body as any;

    // Trigger frontend event for testing
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('mockBankAccountVerification', {
        detail: {
          accountId,
          bankName,
          accountLast4,
          verificationStatus,
          customerId
        }
      }));
    }

    return HttpResponse.json({
      account_id: accountId,
      status: verificationStatus,
      notification_sent: true
    });
  }),

  // Wire transfer details
  http.get('/api/bank/wire-details', ({ request }) => {
    const url = new URL(request.url);
    const amount = url.searchParams.get('amount') || '5000';
    const currency = url.searchParams.get('currency') || 'USD';

    const wireDetails = {
      accountName: 'TripAlfa Inc',
      accountNumber: '1234567890',
      routingNumber: '021000021',
      bankName: 'Chase Bank',
      swiftCode: 'CHASUS33',
      amount: parseFloat(amount),
      currency
    };

    // Trigger frontend event for testing
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('mockWireTransferDetails', {
        detail: {
          ...wireDetails,
          customerId: 'user-123'
        }
      }));
    }

    return HttpResponse.json({
      ...wireDetails,
      notification_sent: true
    });
  }),

  // ============================================================================
  // PAYMENT GATEWAY PROCESSING MOCKS
  // ============================================================================

  // Payment gateway processing
  http.post('/api/gateway/process', async ({ request }) => {
    const body = await request.json();
    const { bookingId, amount, currency } = body as any;

    // Trigger frontend event for testing
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('mockPaymentGatewayProcessing', {
        detail: { bookingId, amount, currency }
      }));
    }

    return HttpResponse.json({
      status: 'processing',
      gateway_reference: `gw_${Date.now()}`
    });
  }),

  // Payment gateway rejection
  http.post('/api/gateway/reject', async ({ request }) => {
    const body = await request.json();
    const { bookingId, amount, currency, error } = body as any;

    // Trigger frontend event for testing
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('mockPaymentGatewayRejection', {
        detail: {
          bookingId,
          amount,
          currency,
          error: error || 'insufficient_funds'
        }
      }));
    }

    return HttpResponse.json({
      status: 'rejected',
      error: error || 'insufficient_funds'
    });
  }),

  // Refund processing
  http.post('/api/gateway/refund', async ({ request }) => {
    const body = await request.json();
    const { bookingId, refundAmount, currency, reason } = body as any;

    // Trigger frontend event for testing
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('mockRefundProcessing', {
        detail: {
          bookingId,
          refundAmount,
          currency,
          reason
        }
      }));
    }

    return HttpResponse.json({
      refund_id: `ref_gw_${Date.now()}`,
      status: 'processing'
    });
  }),

  // Admin refund initiation
  http.post('/api/admin/refunds/initiate', async ({ request }) => {
    const body = await request.json();
    const { bookingId, amount, reason } = body as any;

    // Trigger frontend event for testing
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('mockRefundInitiation', {
        detail: {
          bookingId,
          amount,
          reason
        }
      }));
    }

    return HttpResponse.json({
      refund_request_id: `rr_${Date.now()}`,
      status: 'initiated'
    });
  })
];
