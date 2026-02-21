import { Router, Request, Response } from 'express';
import type { Router as ExpressRouter } from 'express';

const router: ExpressRouter = Router();

// Mock payment gateway integrations
const PAYMENT_GATEWAYS: Record<string, any> = {
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
    }
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
        createdAt: '2026-01-21T14:30:00Z',
        completedAt: '2026-01-21T14:31:00Z'
    }
];

// Payment processing routes
router.post('/process', (req: Request, res: Response) => {
    const { amount, currency, paymentMethod, bookingId, customerId } = req.body;

    if (!amount || !currency || !paymentMethod || !bookingId) {
        return res.status(400).json({
            error: 'Missing required fields: amount, currency, paymentMethod, bookingId'
        });
    }

    const transaction = {
        id: `txn_${String(mockTransactions.length + 1).padStart(3, '0')}`,
        bookingId,
        amount,
        currency,
        status: 'completed',
        paymentMethod,
        gateway: 'stripe',
        customerId,
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString()
    };

    mockTransactions.push(transaction);

    res.json({
        success: true,
        transaction,
        message: 'Payment processed successfully'
    });
});

router.get('/methods', (req: Request, res: Response) => {
    res.json({
        country: 'US',
        currency: 'USD',
        methods: [
            { id: 'card', name: 'Credit/Debit Card', gateways: ['stripe'] },
            { id: 'paypal', name: 'PayPal', gateways: ['paypal'] }
        ]
    });
});


// GET /payments - List all payments
router.get('/', (req: Request, res: Response) => {
    res.json(mockTransactions);
});

// GET /payments/:id - Get payment by ID
router.get('/:id', (req: Request, res: Response) => {
    const payment = mockTransactions.find(t => t.id === req.params.id);
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    res.json(payment);
});

// POST /payments/:id/refund - Refund a payment
router.post('/:id/refund', (req: Request, res: Response) => {
    const payment = mockTransactions.find(t => t.id === req.params.id);
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    if (payment.status === 'refunded') return res.status(400).json({ message: 'Already refunded' });
    payment.status = 'refunded';
    payment.refundedAt = new Date().toISOString();
    res.json(payment);
});

router.get('/analytics', (req: Request, res: Response) => {
    res.json({
        data: {
            summary: {
                totalVolume: 456780,
                totalTransactions: 1247,
                successRate: 98.2
            }
        }
    });
});

export default router;
