import express from 'express';
import axios from 'axios';
const router = express.Router();
// Mock payment gateway integrations
const PAYMENT_GATEWAYS = {
    stripe: {
        name: 'Stripe',
        supportedCurrencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'],
        supportedMethods: ['card', 'apple_pay', 'google_pay', 'link'],
        processingFee: 0.029, // 2.9%
        fixedFee: 0.30
    },
    paypal: {
        name: 'PayPal',
        supportedCurrencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY'],
        supportedMethods: ['paypal', 'venmo', 'pay_later'],
        processingFee: 0.034, // 3.4%
        fixedFee: 0.49
    },
    adyen: {
        name: 'Adyen',
        supportedCurrencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF'],
        supportedMethods: ['card', 'ideal', 'sofort', 'giropay', 'apple_pay', 'google_pay'],
        processingFee: 0.025, // 2.5%
        fixedFee: 0.25
    }
};
// Mock exchange rates (in real app, use a service like Open Exchange Rates)
const EXCHANGE_RATES = {
    'USD_EUR': 0.85,
    'USD_GBP': 0.73,
    'USD_CAD': 1.25,
    'USD_AUD': 1.35,
    'USD_JPY': 110.0,
    'EUR_USD': 1.18,
    'EUR_GBP': 0.86,
    'GBP_USD': 1.37,
    'CAD_USD': 0.80,
    'AUD_USD': 0.74,
    'JPY_USD': 0.0091
};
// Mock transactions data
const mockTransactions: any[] = [
    {
        id: 'txn_001',
        bookingId: 'BK-2026-001247',
        amount: 1213.00,
        currency: 'USD',
        status: 'completed',
        paymentMethod: 'card',
        gateway: 'stripe',
        customerId: 'user123',
        description: 'Flight + Hotel Package',
        fees: { gateway: 37.12, currency: 2.42, total: 39.54 },
        netAmount: 1173.46,
        createdAt: '2026-01-21T14:30:00Z',
        completedAt: '2026-01-21T14:31:00Z',
        metadata: {
            cardLast4: '4242',
            cardBrand: 'visa',
            riskScore: 15,
            fraudCheck: 'passed'
        }
    },
    {
        id: 'txn_002',
        bookingId: 'BK-2026-001248',
        amount: 850.00,
        currency: 'EUR',
        status: 'completed',
        paymentMethod: 'paypal',
        gateway: 'paypal',
        customerId: 'user456',
        description: 'Hotel Booking - Paris',
        fees: { gateway: 28.90, currency: 0, total: 28.90 },
        netAmount: 821.10,
        createdAt: '2026-01-21T16:45:00Z',
        completedAt: '2026-01-21T16:46:00Z',
        metadata: {
            paypalEmail: 'customer@email.com',
            riskScore: 8,
            fraudCheck: 'passed'
        }
    }
];
// Payment processing routes
router.post('/process', async (req, res) => {
    try {
        const { amount, currency, paymentMethod, gateway = 'stripe', bookingId, customerId, description, metadata = {} } = req.body;
        const gatewayKey = gateway as keyof typeof PAYMENT_GATEWAYS;
        if (!amount || !currency || !paymentMethod || !bookingId) {
            return res.status(400).json({
                error: 'Missing required fields: amount, currency, paymentMethod, bookingId'
            });
        }
        // Validate gateway
        if (!PAYMENT_GATEWAYS[gatewayKey]) {
            return res.status(400).json({ error: 'Unsupported payment gateway' });
        }
        const gatewayConfig = PAYMENT_GATEWAYS[gatewayKey];
        // Validate currency support
        if (!gatewayConfig.supportedCurrencies.includes(currency)) {
            return res.status(400).json({
                error: `Currency ${currency} not supported by ${gatewayConfig.name}`
            });
        }
        // Fraud risk assessment (mock)
        const riskScore = Math.floor(Math.random() * 100);
        const fraudCheck = riskScore > 70 ? 'flagged' : riskScore > 40 ? 'review' : 'passed';
        // Calculate fees
        const gatewayFee = (amount * gatewayConfig.processingFee) + gatewayConfig.fixedFee;
        const currencyFee = currency !== 'USD' ? amount * 0.015 : 0; // 1.5% for non-USD
        const totalFees = gatewayFee + currencyFee;
        // Process payment
        let transaction;
        const transactionId = `txn_${String(mockTransactions.length + 1).padStart(3, '0')}`;

        if (gateway === 'stripe') {
            try {
                const gatewayResponse = await axios.post(process.env.API_GATEWAY_URL || 'http://api-gateway:3000/api/route', {
                    intent: 'ADAPTER',
                    body: {
                        action: 'create_payment_intent',
                        body: {
                            amount,
                            currency,
                            metadata: { ...metadata, bookingId, customerId }
                        }
                    },
                    meta: { adapter: 'stripe', vendor: 'STRIPE' }
                });

                const stripeData = gatewayResponse.data;

                transaction = {
                    id: transactionId,
                    bookingId,
                    amount,
                    currency,
                    status: 'completed',
                    paymentMethod,
                    gateway: 'stripe',
                    customerId,
                    description,
                    fees: {
                        gateway: Math.round(gatewayFee * 100) / 100,
                        currency: Math.round(currencyFee * 100) / 100,
                        total: Math.round(totalFees * 100) / 100
                    },
                    netAmount: Math.round((amount - totalFees) * 100) / 100,
                    createdAt: new Date().toISOString(),
                    completedAt: new Date().toISOString(),
                    metadata: {
                        ...metadata,
                        stripePaymentIntentId: stripeData.id,
                        riskScore,
                        fraudCheck
                    }
                };
            } catch (error: any) {
                console.error('Stripe Gateway Call Failed:', error.response?.data || error.message);
                return res.status(502).json({ error: 'Payment gateway integration failed' });
            }
        } else {
            // Process other gateways (mock)
            transaction = {
                id: transactionId,
                bookingId,
                amount,
                currency,
                status: fraudCheck === 'passed' ? 'completed' : 'pending_review',
                paymentMethod,
                gateway,
                customerId,
                description,
                fees: {
                    gateway: Math.round(gatewayFee * 100) / 100,
                    currency: Math.round(currencyFee * 100) / 100,
                    total: Math.round(totalFees * 100) / 100
                },
                netAmount: Math.round((amount - totalFees) * 100) / 100,
                createdAt: new Date().toISOString(),
                completedAt: fraudCheck === 'passed' ? new Date().toISOString() : null,
                metadata: {
                    ...metadata,
                    riskScore,
                    fraudCheck,
                    processingTime: Math.floor(Math.random() * 3000) + 500
                }
            };
        }

        mockTransactions.push(transaction);
        res.json({
            success: true,
            transaction,
            message: transaction.status === 'completed' ? 'Payment processed successfully' : 'Payment requires review'
        });
    }
    catch (error) {
        console.error('Payment processing failed:', error);
        res.status(500).json({ error: 'Payment processing failed' });
    }
});
// Currency conversion
router.get('/convert', (req, res) => {
    try {
        const { amount, from, to } = req.query as { amount: string; from: string; to: string };
        if (!amount || !from || !to) {
            return res.status(400).json({ error: 'Missing required parameters: amount, from, to' });
        }
        const numAmount = parseFloat(amount);
        const key = `${from}_${to}` as keyof typeof EXCHANGE_RATES;
        if (!EXCHANGE_RATES[key]) {
            return res.status(400).json({ error: 'Currency pair not supported' });
        }
        const rate = EXCHANGE_RATES[key];
        const convertedAmount = Math.round((numAmount * rate) * 100) / 100;
        // Add spread (we make money on conversion)
        const spread = 0.02; // 2% spread
        const finalAmount = Math.round((convertedAmount * (1 - spread)) * 100) / 100;
        res.json({
            originalAmount: numAmount,
            convertedAmount: finalAmount,
            exchangeRate: rate,
            spread: spread,
            spreadAmount: Math.round((convertedAmount * spread) * 100) / 100,
            fromCurrency: from,
            toCurrency: to
        });
    }
    catch (error) {
        console.error('Currency conversion failed:', error);
        res.status(500).json({ error: 'Currency conversion failed' });
    }
});
// Get payment methods for a region
router.get('/methods', (req, res) => {
    try {
        const { country = 'US', currency = 'USD' } = req.query;
        // Mock payment methods based on country
        const paymentMethods = {
            US: [
                { id: 'card', name: 'Credit/Debit Card', gateways: ['stripe', 'adyen'] },
                { id: 'paypal', name: 'PayPal', gateways: ['paypal'] },
                { id: 'apple_pay', name: 'Apple Pay', gateways: ['stripe'] },
                { id: 'google_pay', name: 'Google Pay', gateways: ['stripe', 'adyen'] },
                { id: 'venmo', name: 'Venmo', gateways: ['paypal'] }
            ],
            GB: [
                { id: 'card', name: 'Credit/Debit Card', gateways: ['stripe', 'adyen'] },
                { id: 'paypal', name: 'PayPal', gateways: ['paypal'] },
                { id: 'apple_pay', name: 'Apple Pay', gateways: ['stripe'] },
                { id: 'google_pay', name: 'Google Pay', gateways: ['stripe', 'adyen'] }
            ],
            DE: [
                { id: 'card', name: 'Credit/Debit Card', gateways: ['stripe', 'adyen'] },
                { id: 'paypal', name: 'PayPal', gateways: ['paypal'] },
                { id: 'sofort', name: 'Sofort', gateways: ['adyen'] },
                { id: 'giropay', name: 'Giropay', gateways: ['adyen'] }
            ]
        };
        const methods = (paymentMethods as any)[country as any] || paymentMethods.US;
        // Filter by currency support
        const supportedMethods = methods.filter((method: any) => method.gateways.some((gateway: string) => PAYMENT_GATEWAYS[gateway as keyof typeof PAYMENT_GATEWAYS]?.supportedCurrencies.includes(currency as string)));
        res.json({
            country,
            currency,
            methods: supportedMethods
        });
    }
    catch (error) {
        console.error('Get payment methods failed:', error);
        res.status(500).json({ error: 'Failed to get payment methods' });
    }
});
// Get transaction details
router.get('/transactions/:id', (req, res) => {
    try {
        const transaction = mockTransactions.find(t => t.id === req.params.id);
        if (!transaction) {
            return res.status(404).json({ error: 'Transaction not found' });
        }
        res.json({ data: transaction });
    }
    catch (error) {
        console.error('Get transaction failed:', error);
        res.status(500).json({ error: 'Failed to get transaction' });
    }
});
// Get transactions list
router.get('/transactions', (req, res) => {
    try {
        const { status, gateway, customerId, limit = '20', offset = '0' } = req.query as any;
        let transactions = [...mockTransactions];
        if (status) {
            transactions = transactions.filter(t => t.status === status);
        }
        if (gateway) {
            transactions = transactions.filter(t => t.gateway === gateway);
        }
        if (customerId) {
            transactions = transactions.filter(t => t.customerId === customerId);
        }
        const paginatedTransactions = transactions.slice(parseInt(offset), parseInt(offset) + parseInt(limit));
        res.json({
            data: paginatedTransactions,
            pagination: {
                total: transactions.length,
                limit: parseInt(limit),
                offset: parseInt(offset),
                hasMore: parseInt(offset) + parseInt(limit) < transactions.length
            }
        });
    }
    catch (error) {
        console.error('Get transactions failed:', error);
        res.status(500).json({ error: 'Failed to get transactions' });
    }
});
// Refund transaction
router.post('/transactions/:id/refund', (req, res) => {
    try {
        const { amount, reason } = req.body;
        const transaction = mockTransactions.find(t => t.id === req.params.id);
        if (!transaction) {
            return res.status(404).json({ error: 'Transaction not found' });
        }
        if (transaction.status !== 'completed') {
            return res.status(400).json({ error: 'Only completed transactions can be refunded' });
        }
        const refundAmount = amount || transaction.amount;
        if (refundAmount > transaction.amount) {
            return res.status(400).json({ error: 'Refund amount cannot exceed transaction amount' });
        }
        // Process refund (mock)
        transaction.status = refundAmount === transaction.amount ? 'refunded' : 'partially_refunded';
        const refund = {
            id: `ref_${transaction.id}`,
            transactionId: transaction.id,
            amount: refundAmount,
            currency: transaction.currency,
            reason: reason || 'Customer request',
            status: 'completed',
            processedAt: new Date().toISOString()
        };
        res.json({
            success: true,
            refund,
            transaction
        });
    }
    catch (error) {
        console.error('Refund failed:', error);
        res.status(500).json({ error: 'Refund failed' });
    }
});
// Payment analytics
router.get('/analytics', (req, res) => {
    try {
        const { period = '30d' } = req.query as { period?: string };
        // Mock analytics data
        const analytics = {
            period,
            summary: {
                totalVolume: 456780,
                totalTransactions: 1247,
                successRate: 98.2,
                averageTicket: 366.60,
                totalFees: 14250
            },
            byGateway: [
                { gateway: 'stripe', volume: 234560, transactions: 623, successRate: 98.5 },
                { gateway: 'paypal', volume: 156780, transactions: 456, successRate: 97.8 },
                { gateway: 'adyen', volume: 65440, transactions: 168, successRate: 98.8 }
            ],
            byCurrency: [
                { currency: 'USD', volume: 345670, transactions: 892 },
                { currency: 'EUR', volume: 78234, transactions: 245 },
                { currency: 'GBP', volume: 32876, transactions: 110 }
            ],
            trends: {
                dailyVolume: [12000, 15800, 14200, 18900, 22100, 19800, 23400],
                successRate: [97.8, 98.1, 97.9, 98.3, 98.5, 98.2, 98.4]
            }
        };
        res.json({ data: analytics });
    }
    catch (error) {
        console.error('Analytics failed:', error);
        res.status(500).json({ error: 'Failed to get analytics' });
    }
});
// Webhook handler for payment gateway notifications
router.post('/webhooks/:gateway', (req, res) => {
    try {
        const { gateway } = req.params;
        const webhookData = req.body;
        console.log(`Received webhook from ${gateway}:`, webhookData);
        // Process webhook (update transaction status, etc.)
        // In real implementation, verify webhook signature
        res.json({ received: true });
    }
    catch (error) {
        console.error('Webhook processing failed:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
});
export default router;
