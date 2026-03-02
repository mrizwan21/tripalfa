// Test data for Payment, Wallet & Finance Notification Integration Tests

export const paymentTestData = {
  successfulPayment: {
    amount: 1500.0,
    currency: "USD",
    method: "card",
    bookingRef: "BK123456",
    customerId: "user-123",
    customerName: "John Doe",
    cardDetails: {
      number: "4111111111111111",
      expiry: "12/26",
      cvc: "123",
      holderName: "John Doe",
    },
  },

  failedPayment: {
    amount: 1500.0,
    currency: "USD",
    method: "card",
    error: "insufficient_funds",
    failureCode: "card_declined",
    bookingRef: "BK123456",
    customerId: "user-123",
  },

  refund: {
    amount: 1500.0,
    currency: "USD",
    reason: "customer_cancellation",
    bookingRef: "BK123456",
    customerId: "user-123",
    refundId: "REF123456",
  },

  partialPayment: {
    paidAmount: 750.0,
    totalAmount: 1500.0,
    currency: "USD",
    remainingAmount: 750.0,
    bookingRef: "BK123456",
    customerId: "user-123",
  },

  paymentReminder: {
    bookingRef: "BK123456",
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
    amount: 1500.0,
    currency: "USD",
    customerId: "user-123",
    daysUntilDue: 3,
  },

  urgentPaymentReminder: {
    bookingRef: "BK123456",
    dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day from now
    amount: 1500.0,
    currency: "USD",
    customerId: "user-123",
    daysUntilDue: 1,
  },
};

export const walletTestData = {
  walletCredit: {
    walletId: "wallet-123",
    amount: 500.0,
    currency: "USD",
    type: "credit",
    userId: "user-123",
    newBalance: 1200.0,
    transactionId: "txn_credit_001",
  },

  walletDebit: {
    walletId: "wallet-123",
    amount: 200.0,
    currency: "USD",
    type: "debit",
    bookingId: "booking-456",
    userId: "user-123",
    remainingBalance: 1000.0,
    transactionId: "txn_debit_001",
  },

  lowBalanceAlert: {
    walletId: "wallet-123",
    currentBalance: 50.0,
    threshold: 100.0,
    currency: "USD",
    userId: "user-123",
  },

  walletTransfer: {
    fromWalletId: "wallet-123",
    toWalletId: "wallet-456",
    amount: 300.0,
    currency: "USD",
    userId: "user-123",
    remainingBalance: 700.0,
    transferId: "transfer_001",
  },

  transactionHistory: {
    walletId: "wallet-123",
    transactions: [
      {
        id: "txn1",
        type: "credit",
        amount: 500.0,
        date: "2026-01-01",
        description: "Funds added",
      },
      {
        id: "txn2",
        type: "debit",
        amount: 200.0,
        date: "2026-01-02",
        description: "Payment for booking-456",
      },
      {
        id: "txn3",
        type: "debit",
        amount: 100.0,
        date: "2026-01-03",
        description: "Transfer to wallet-456",
      },
    ],
    userId: "user-123",
  },

  failedWalletTransaction: {
    walletId: "wallet-123",
    amount: 200.0,
    currency: "USD",
    error: "insufficient_balance",
    userId: "user-123",
  },
};

export const webhookTestData = {
  paymentSuccessWebhook: {
    gateway: "stripe",
    transactionId: "txn_stripe_001",
    bookingId: "BK123456",
    amount: 1500.0,
    currency: "USD",
    status: "succeeded",
    customerId: "user-123",
    eventId: "evt_payment_success_001",
  },

  paymentFailureWebhook: {
    gateway: "stripe",
    transactionId: "txn_stripe_001",
    bookingId: "BK123456",
    amount: 1500.0,
    currency: "USD",
    status: "failed",
    failureCode: "card_declined",
    customerId: "user-123",
    eventId: "evt_payment_failure_001",
  },

  refundWebhook: {
    gateway: "stripe",
    transactionId: "txn_stripe_001",
    refundId: "ref_stripe_001",
    bookingId: "BK123456",
    amount: 1500.0,
    currency: "USD",
    status: "succeeded",
    customerId: "user-123",
    eventId: "evt_refund_001",
  },

  chargebackWebhook: {
    gateway: "stripe",
    transactionId: "txn_stripe_001",
    chargebackId: "chb_stripe_001",
    bookingId: "BK123456",
    amount: 1500.0,
    currency: "USD",
    reason: "fraudulent",
    customerId: "user-123",
    eventId: "evt_chargeback_001",
  },

  validSignature: "valid_signature_123",
  invalidSignature: "invalid_signature_123",

  idempotentWebhook: {
    eventId: "evt_123",
    transactionId: "txn_001",
    status: "succeeded",
    customerId: "user-123",
  },

  retryWebhook: {
    eventId: "evt_456",
    retryCount: 1,
    error: "temporary_service_unavailable",
    transactionId: "txn_002",
    customerId: "user-123",
  },
};

export const bankTestData = {
  bankTransferInitiated: {
    transferId: "btx_001",
    amount: 2500.0,
    currency: "USD",
    bankName: "Chase Bank",
    accountLast4: "1234",
    customerId: "user-123",
  },

  bankTransferCompleted: {
    transferId: "btx_001",
    amount: 2500.0,
    currency: "USD",
    bankName: "Chase Bank",
    reference: "REF123456",
    customerId: "user-123",
  },

  bankTransferFailed: {
    transferId: "btx_001",
    amount: 2500.0,
    currency: "USD",
    bankName: "Chase Bank",
    error: "insufficient_funds",
    customerId: "user-123",
  },

  bankAccountVerification: {
    accountId: "acc_001",
    bankName: "Chase Bank",
    accountLast4: "1234",
    verificationStatus: "verified",
    customerId: "user-123",
  },

  wireTransferDetails: {
    accountName: "TripAlfa Inc",
    accountNumber: "1234567890",
    routingNumber: "021000021",
    bankName: "Chase Bank",
    swiftCode: "CHASUS33",
    amount: 5000.0,
    currency: "USD",
    customerId: "user-123",
  },
};

export const holdOrderTestData = {
  flightHoldOrder: {
    holdOrderId: "HOLD123456",
    totalAmount: 1500.0,
    currency: "USD",
    customerId: "user-123",
    customerName: "John Doe",
    type: "flight",
    expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
  },

  hotelHoldOrder: {
    holdOrderId: "HOLD789012",
    totalAmount: 800.0,
    currency: "USD",
    customerId: "user-123",
    customerName: "John Doe",
    type: "hotel",
    expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
  },
};

export const bookingTestData = {
  flightBooking: {
    id: "BK123456",
    reference: "BK123456",
    type: "flight",
    customerInfo: {
      name: "John Doe",
      email: "john.doe@example.com",
    },
    pricing: {
      sellingAmount: 1500.0,
      currency: "USD",
    },
    timeline: {
      bookingDate: new Date().toISOString(),
      travelDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
    },
    createdByUser: {
      id: "user-123",
      name: "John Doe",
    },
  },

  hotelBooking: {
    id: "BK789012",
    reference: "BK789012",
    type: "hotel",
    customerInfo: {
      name: "Jane Smith",
      email: "jane.smith@example.com",
    },
    pricing: {
      sellingAmount: 800.0,
      currency: "USD",
    },
    timeline: {
      bookingDate: new Date().toISOString(),
      travelDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
    },
    createdByUser: {
      id: "user-456",
      name: "Jane Smith",
    },
  },
};

// Test scenarios combining multiple data types
export const testScenarios = {
  successfulPaymentFlow: {
    holdOrder: holdOrderTestData.flightHoldOrder,
    payment: paymentTestData.successfulPayment,
    booking: bookingTestData.flightBooking,
    expectedNotifications: ["payment_received", "booking_confirmed"],
    expectedChannels: ["email", "sms", "in_app"],
    expectedPriority: "high",
  },

  failedPaymentFlow: {
    payment: paymentTestData.failedPayment,
    booking: bookingTestData.flightBooking,
    expectedNotifications: ["payment_failed"],
    expectedChannels: ["email", "sms", "in_app"],
    expectedPriority: "high",
  },

  refundProcessing: {
    refund: paymentTestData.refund,
    booking: bookingTestData.flightBooking,
    expectedNotifications: ["payment_refunded"],
    expectedChannels: ["email", "in_app"],
    expectedPriority: "medium",
  },

  walletTransactionFlow: {
    walletCredit: walletTestData.walletCredit,
    walletDebit: walletTestData.walletDebit,
    lowBalanceAlert: walletTestData.lowBalanceAlert,
    expectedNotifications: [
      "wallet_credit",
      "wallet_debit",
      "low_balance_alert",
    ],
  },

  paymentReminderFlow: {
    reminder: paymentTestData.paymentReminder,
    urgentReminder: paymentTestData.urgentPaymentReminder,
    booking: bookingTestData.flightBooking,
    expectedNotifications: ["payment_reminder", "urgent_payment_reminder"],
  },
};
