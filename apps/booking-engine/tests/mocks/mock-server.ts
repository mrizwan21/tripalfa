import express from 'express';
import crypto from 'crypto';

const app = express();

// Mock /api/hotels/search endpoint for E2E tests
app.get('/api/hotels/search', (req: express.Request, res: express.Response) => {
  // Support pagination via ?page=1&pageSize=10
  const page = parseInt(req.query.page as string || '1', 10);
  const pageSize = parseInt(req.query.pageSize as string || '10', 10);
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
  res.json({
    hotels: paginatedHotels,
    total,
    page,
    pageSize
  });
});

const PORT = 3004;

app.use(express.json());

// Health check endpoint
app.get('/', (req: express.Request, res: express.Response) => {
  res.json({ status: 'ok', message: 'Mock API server is running' });
});

// Authentication endpoint
app.post('/api/auth/login', (req: express.Request, res: express.Response) => {
  const { email, password, testMode } = req.body;

  // In test mode, accept any credentials
  if (testMode || (email && password)) {
    res.json({
      token: 'mock_jwt_token_12345',
      user: {
        id: 'user_123',
        email: email || 'test@example.com',
        name: 'Test User',
        role: 'customer'
      }
    });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Mock Duffel API
app.post('/duffel/orders', (req: express.Request, res: express.Response) => {
  const orderId = `ord_${crypto.randomBytes(8).toString('hex')}`;
  res.json({
    id: orderId,
    status: 'confirmed',
    passengers: req.body.passengers || [],
    slices: req.body.slices || []
  });
});

app.get('/duffel/orders/:id', (req: express.Request, res: express.Response) => {
  res.json({
    id: req.params.id,
    status: 'confirmed',
    passengers: [{ name: 'John Doe' }],
    slices: [{
      origin: { iata_code: 'JFK' },
      destination: { iata_code: 'LHR' },
      departure_date: '2026-03-15'
    }]
  });
});

// Mock Hotelston API
app.get('/hotelston/search', (req: express.Request, res: express.Response) => {
  res.json({
    hotels: [
      {
        id: 'hotel_123',
        name: 'Test Hotel',
        location: 'New York',
        price: 200,
        rating: 4.5
      }
    ]
  });
});

app.post('/hotelston/bookings', (req: express.Request, res: express.Response) => {
  res.json({
    booking_id: `booking_${crypto.randomBytes(8).toString('hex')}`,
    status: 'confirmed',
    hotel_id: req.body.hotel_id,
    check_in: req.body.check_in,
    check_out: req.body.check_out
  });
});

// Mock Payment Gateway (Stripe)
app.post('/stripe/payment_intents', (req: express.Request, res: express.Response) => {
  res.json({
    id: `pi_${crypto.randomBytes(8).toString('hex')}`,
    status: 'succeeded',
    amount: req.body.amount,
    currency: req.body.currency
  });
});

// Mock SMS Service (Twilio)
app.post('/twilio/messages', (req: express.Request, res: express.Response) => {
  res.json({
    sid: `SM${crypto.randomBytes(16).toString('hex').toUpperCase()}`,
    status: 'sent',
    to: req.body.to,
    body: req.body.body
  });
});

// Mock Email Service (SendGrid)
app.post('/sendgrid/mail/send', (req: express.Request, res: express.Response) => {
  res.json({
    message: 'Email sent successfully',
    message_id: crypto.randomBytes(16).toString('hex')
  });
});

// Mock Push Notification Service
app.post('/push/send', (req: express.Request, res: express.Response) => {
  res.json({
    success: true,
    message_id: crypto.randomBytes(16).toString('hex'),
    recipients: req.body.tokens?.length || 1
  });
});

// Mock Authentication Service
app.post('/auth/login', (req: express.Request, res: express.Response) => {
  const { email, password } = req.body;

  // Simple mock authentication
  if (email && password) {
    res.json({
      token: `jwt_${crypto.randomBytes(32).toString('hex')}`,
      user: {
        id: 'user_123',
        email: email,
        name: 'Test User'
      }
    });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// In-memory storage for test data
let sentNotifications: any[] = [];
let webhookEvents: any[] = [];
let walletBalances = new Map<string, number>();
let paymentTransactions: any[] = [];

// Mock Webhook endpoints for testing
app.post('/webhooks/duffel', (req: express.Request, res: express.Response) => {
  console.log('📨 Received Duffel webhook:', req.body);
  webhookEvents.push({ type: 'duffel', data: req.body, timestamp: new Date() });
  res.json({ received: true });
});

app.post('/webhooks/payment', (req: express.Request, res: express.Response) => {
  console.log('💳 Received payment webhook:', req.body);
  const event = { type: 'payment', data: req.body, timestamp: new Date() };
  webhookEvents.push(event);

  // Trigger notification based on payment status
  if (req.body.status === 'succeeded') {
    sentNotifications.push({
      type: 'payment_received',
      channels: ['email', 'sms', 'in_app'],
      priority: 'high',
      data: req.body,
      timestamp: new Date()
    });
  } else if (req.body.status === 'failed') {
    sentNotifications.push({
      type: 'payment_failed',
      channels: ['email', 'sms', 'in_app'],
      priority: 'high',
      data: req.body,
      timestamp: new Date()
    });
  }

  res.json({ received: true });
});

app.post('/webhooks/payment/success', (req: express.Request, res: express.Response) => {
  console.log('✅ Payment success webhook:', req.body);
  webhookEvents.push({ type: 'payment_success', data: req.body, timestamp: new Date() });

  sentNotifications.push({
    type: 'payment_received',
    channels: ['email', 'sms', 'in_app'],
    priority: 'high',
    data: req.body,
    timestamp: new Date()
  });

  res.json({ received: true });
});

app.post('/webhooks/payment/failure', (req: express.Request, res: express.Response) => {
  console.log('❌ Payment failure webhook:', req.body);
  webhookEvents.push({ type: 'payment_failure', data: req.body, timestamp: new Date() });

  sentNotifications.push({
    type: 'payment_failed',
    channels: ['email', 'sms', 'in_app'],
    priority: 'high',
    data: req.body,
    timestamp: new Date()
  });

  res.json({ received: true });
});

app.post('/webhooks/refund', (req: express.Request, res: express.Response) => {
  console.log('💸 Refund webhook:', req.body);
  webhookEvents.push({ type: 'refund', data: req.body, timestamp: new Date() });

  sentNotifications.push({
    type: 'payment_refunded',
    channels: ['email', 'in_app'],
    priority: 'medium',
    data: req.body,
    timestamp: new Date()
  });

  res.json({ received: true });
});

app.post('/webhooks/chargeback', (req: express.Request, res: express.Response) => {
  console.log('⚠️ Chargeback webhook:', req.body);
  webhookEvents.push({ type: 'chargeback', data: req.body, timestamp: new Date() });

  sentNotifications.push({
    type: 'chargeback_notification',
    channels: ['email'],
    priority: 'high',
    data: req.body,
    timestamp: new Date()
  });

  res.json({ received: true });
});

// Wallet service mocks
app.post('/wallet/transactions', (req: express.Request, res: express.Response) => {
  console.log('💰 Wallet transaction:', req.body);
  const transaction = {
    id: `txn_${crypto.randomBytes(8).toString('hex')}`,
    ...req.body,
    timestamp: new Date()
  };

  // Update wallet balance
  const userId = req.body.userId || 'user_123';
  const currentBalance = walletBalances.get(userId) || 0;
  let newBalance = currentBalance;

  if (req.body.type === 'credit') {
    newBalance = currentBalance + req.body.amount;
    sentNotifications.push({
      type: 'wallet_credit',
      channels: ['in_app'],
      priority: 'medium',
      data: { ...req.body, newBalance },
      timestamp: new Date()
    });
  } else if (req.body.type === 'debit') {
    newBalance = currentBalance - req.body.amount;
    sentNotifications.push({
      type: 'wallet_debit',
      channels: ['in_app'],
      priority: 'medium',
      data: { ...req.body, remainingBalance: newBalance },
      timestamp: new Date()
    });

    // Check for low balance alert
    if (newBalance < 100) {
      sentNotifications.push({
        type: 'low_balance_alert',
        channels: ['in_app', 'email'],
        priority: 'medium',
        data: { currentBalance: newBalance, threshold: 100 },
        timestamp: new Date()
      });
    }
  }

  walletBalances.set(userId, newBalance);

  res.json({
    transactionId: transaction.id,
    balance: newBalance,
    transaction
  });
});

app.get('/wallet/balance/:userId', (req: express.Request, res: express.Response) => {
  const balance = walletBalances.get(req.params.userId) || 0;
  res.json({ balance, currency: 'USD' });
});

app.post('/wallet/transfer', (req: express.Request, res: express.Response) => {
  console.log('🔄 Wallet transfer:', req.body);
  const transfer = {
    id: `transfer_${crypto.randomBytes(8).toString('hex')}`,
    ...req.body,
    timestamp: new Date()
  };

  // Update balances
  const fromBalance = walletBalances.get(req.body.fromWalletId) || 0;
  const toBalance = walletBalances.get(req.body.toWalletId) || 0;

  walletBalances.set(req.body.fromWalletId, fromBalance - req.body.amount);
  walletBalances.set(req.body.toWalletId, toBalance + req.body.amount);

  sentNotifications.push({
    type: 'wallet_transfer',
    channels: ['in_app'],
    priority: 'medium',
    data: {
      ...req.body,
      remainingBalance: fromBalance - req.body.amount,
      transferId: transfer.id
    },
    timestamp: new Date()
  });

  res.json({ transferId: transfer.id, status: 'completed' });
});

// Notification service mocks
app.post('/notifications/send', (req: express.Request, res: express.Response) => {
  console.log('📢 Send notification:', req.body);
  sentNotifications.push({
    ...req.body,
    timestamp: new Date()
  });
  res.json({ sent: true, notificationId: crypto.randomBytes(8).toString('hex') });
});

app.get('/notifications/sent', (req: express.Request, res: express.Response) => {
  res.json({ notifications: sentNotifications });
});

app.delete('/notifications/sent', (req: express.Request, res: express.Response) => {
  sentNotifications = [];
  res.json({ cleared: true });
});

// Bank transfer mocks
app.post('/bank/transfer/initiate', (req: express.Request, res: express.Response) => {
  console.log('🏦 Bank transfer initiated:', req.body);
  const transfer = {
    id: `btx_${crypto.randomBytes(8).toString('hex')}`,
    ...req.body,
    status: 'initiated',
    timestamp: new Date()
  };

  sentNotifications.push({
    type: 'bank_transfer_initiated',
    channels: ['email', 'in_app'],
    priority: 'medium',
    data: req.body,
    timestamp: new Date()
  });

  res.json(transfer);
});

app.post('/bank/transfer/complete/:transferId', (req: express.Request, res: express.Response) => {
  const transferId = req.params.transferId as string;
  console.log('✅ Bank transfer completed:', transferId);
  sentNotifications.push({
    type: 'bank_transfer_completed',
    channels: ['email', 'in_app'],
    priority: 'medium',
    data: { transferId, ...req.body },
    timestamp: new Date()
  });

  res.json({ status: 'completed', transferId });
});

app.post('/bank/transfer/fail/:transferId', (req: express.Request, res: express.Response) => {
  console.log('❌ Bank transfer failed:', req.params.transferId);
  sentNotifications.push({
    type: 'bank_transfer_failed',
    channels: ['email', 'in_app'],
    priority: 'high',
    data: { transferId: req.params.transferId, ...req.body },
    timestamp: new Date()
  });

  res.json({ status: 'failed', transferId: req.params.transferId });
});

// Payment reminder mocks
app.post('/payments/reminder', (req: express.Request, res: express.Response) => {
  console.log('⏰ Payment reminder scheduled:', req.body);
  setTimeout(() => {
    sentNotifications.push({
      type: 'payment_reminder',
      channels: ['email', 'in_app'],
      priority: 'medium',
      data: req.body,
      timestamp: new Date()
    });
  }, 1000); // Simulate delay

  res.json({ scheduled: true, reminderId: crypto.randomBytes(8).toString('hex') });
});

app.post('/payments/reminder/urgent', (req: express.Request, res: express.Response) => {
  console.log('🚨 Urgent payment reminder:', req.body);
  sentNotifications.push({
    type: 'urgent_payment_reminder',
    channels: ['email', 'sms', 'in_app'],
    priority: 'high',
    data: req.body,
    timestamp: new Date()
  });

  res.json({ sent: true, reminderId: crypto.randomBytes(8).toString('hex') });
});

// Health check endpoint
app.get('/health', (req: express.Request, res: express.Response) => {
  res.json({ status: 'ok', service: 'mock-api-server' });
});

app.listen(PORT, () => {
  console.log(`🎭 Mock API server running on http://localhost:${PORT}`);
  console.log('Available endpoints:');
  console.log('  POST /duffel/orders - Create order');
  console.log('  GET  /duffel/orders/:id - Get order');
  console.log('  GET  /hotelston/search - Search hotels');
  console.log('  POST /hotelston/bookings - Book hotel');
  console.log('  POST /stripe/payment_intents - Process payment');
  console.log('  POST /twilio/messages - Send SMS');
  console.log('  POST /sendgrid/mail/send - Send email');
  console.log('  POST /push/send - Send push notification');
  console.log('  POST /auth/login - User authentication');
  console.log('  POST /webhooks/* - Webhook endpoints');
});
