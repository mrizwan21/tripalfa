import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3003;

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Helper to get or create a demo wallet for the Demo User
// We assume the Demo User (from user-service) has a company, and that company has a wallet.
// If not, we create one.
async function getDemoWallet() {
    // 1. Try to find the demo user created by user-service
    const user = await prisma.user.findFirst({
        where: { email: 'demo@tripalfa.com' },
        include: { company: true }
    });

    if (!user) {
        console.log('Demo user not found, checking for ANY company...');

        // Let's try to find ANY company
        let company = await prisma.company.findFirst();
        if (!company) {
            // Create a basic demo company if even that is missing
            try {
                company = await prisma.company.create({
                    data: {
                        name: 'TripAlfa Demo Agency',
                        code: 'DEMO001',
                        type: 'B2B_AGENCY',
                        status: 'ACTIVE',
                        email: 'agency@demo.com',
                        phone: '+1234567890'
                    }
                });
            } catch (e) {
                // Concurrency fallback
                company = await prisma.company.findFirst();
            }
        }

        if (!company) return null;

        // Now find wallet for this company
        let wallet = await prisma.wallet.findFirst({
            where: { companyId: company.id }
        });

        if (!wallet) {
            wallet = await prisma.wallet.create({
                data: {
                    companyId: company.id,
                    availableBalance: 5000.00,
                    holdBalance: 0.00,
                    currency: 'USD',
                    type: 'PREPAID',
                    status: 'ACTIVE'
                }
            });

            // Add some initial ledger entries
            await prisma.ledgerEntry.create({
                data: {
                    walletId: wallet.id,
                    entryRef: `INIT-${Date.now()}`,
                    type: 'TOPUP',
                    direction: 'CREDIT',
                    currency: 'USD',
                    amount: 5000.00,
                    balanceBefore: 0,
                    balanceAfter: 5000.00,
                    description: 'Initial Demo Top-up',
                    status: 'POSTED' // Using status field from Schema if checking LedgerEntry
                }
            });
        }
        return wallet;
    }

    // If user exists, get their company wallet
    let wallet = await prisma.wallet.findFirst({
        where: { companyId: user.companyId }
    });

    if (!wallet && user.companyId) {
        wallet = await prisma.wallet.create({
            data: {
                companyId: user.companyId,
                availableBalance: 5000.00,
                holdBalance: 0.00,
                currency: 'USD',
                type: 'PREPAID',
                status: 'ACTIVE'
            }
        });
    }
    return wallet;
}

// Routes

// Wallet Balance
app.get('/wallet', async (req, res) => {
    try {
        const wallet = await getDemoWallet();
        if (!wallet) {
            return res.status(404).json({ error: 'Wallet not found' });
        }

        res.json({
            data: {
                id: wallet.id,
                type: 'MAIN',
                currency: wallet.currency,
                balance: parseFloat(wallet.availableBalance),
                creditLimit: 50000,
                creditUsed: parseFloat(wallet.holdBalance || 0),
                availableBalance: parseFloat(wallet.availableBalance),
                lastTopUp: wallet.createdAt,
                lastTransaction: wallet.updatedAt
            }
        });
    } catch (error) {
        console.error('Error fetching wallet:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Transactions (Ledger Entries)
app.get('/wallet/transactions', async (req, res) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const skip = (page - 1) * limit;

        const wallet = await getDemoWallet();
        if (!wallet) {
            return res.json({ data: [], pagination: { total: 0, page, limit, totalPages: 0 } });
        }

        const [transactions, total] = await Promise.all([
            prisma.ledgerEntry.findMany({
                where: { walletId: wallet.id },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    transaction: true
                }
            }),
            prisma.ledgerEntry.count({ where: { walletId: wallet.id } })
        ]);

        // Map to Transaction type expected by frontend
        const mappedTransactions = transactions.map((t: any) => ({
            id: t.id,
            reference: t.entryRef,
            type: t.direction,
            category: t.type,
            amount: parseFloat(t.amount),
            currency: t.currency,
            balance: parseFloat(t.balanceAfter),
            description: t.description,
            bookingReference: t.referenceId,
            status: 'COMPLETED',
            createdAt: t.createdAt,
            createdBy: 'System'
        }));

        res.json({
            data: {
                data: mappedTransactions,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Top Up History (Transactions of type TOP_UP)
app.get('/wallet/topup-history', async (req, res) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const skip = (page - 1) * limit;

        const wallet = await getDemoWallet();

        if (!wallet) {
            return res.json({ data: [], pagination: { total: 0, page, limit, totalPages: 0 } });
        }

        const [topups, total] = await Promise.all([
            prisma.ledgerEntry.findMany({
                where: {
                    walletId: wallet.id,
                    type: 'TOPUP'
                },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' }
            }),
            prisma.ledgerEntry.count({
                where: {
                    walletId: wallet.id,
                    type: 'TOPUP'
                }
            })
        ]);

        res.json({
            data: topups,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Error fetching topup history:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/health', (req, res) => {
    res.json({ status: 'UP', service: 'payment-service', db: 'postgres' });
});

app.listen(PORT, () => {
    console.log(`Payment Service running on port ${PORT}`);
});