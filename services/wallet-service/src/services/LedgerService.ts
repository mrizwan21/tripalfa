import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class LedgerService {
    /**
     * Creates a new Ledger Account (Wallet)
     */
    async createAccount(data) {
        return prisma.ledgerAccount.create({
            data: {
                ...data,
                balance: 0,
            },
        });
    }

    /**
     * Posts a new transaction to the ledger.
     * Enforces Double-Entry Accounting Rules:
     * 1. Total Debits must equal Total Credits.
     * 2. Transaction is atomic.
     */
    async postTransaction(req) {
        // 1. Validate Balance (Debits == Credits)
        const totalDebits = req.entries
            .filter(e => e.direction === 'DEBIT')
            .reduce((sum, e) => sum + e.amount, 0);

        const totalCredits = req.entries
            .filter(e => e.direction === 'CREDIT')
            .reduce((sum, e) => sum + e.amount, 0);

        // Allow for tiny floating point differences, but generally enforce exact match
        if (Math.abs(totalDebits - totalCredits) > 0.0001) {
            throw new Error(`Transaction Unbalanced: Debits (${totalDebits}) != Credits (${totalCredits})`);
        }

        // 2. Execute Atomic Transaction
        return prisma.$transaction(async (tx) => {
            // Create Transaction Record
            const transaction = await tx.ledgerTransaction.create({
            data: {
                description: req.description,
                reference: req.reference,
                type: req.type,
                status: 'POSTED',
                metadata: req.metadata,
            },
            });

            // Create Entries and Update Balances
            for (const entry of req.entries) {
                // Create Entry
                await tx.ledgerEntry.create({
                    data: {
                        transactionId: transaction.id,
                        accountId: entry.accountId,
                        amount: entry.amount,
                        direction: entry.direction,
                    },
                });

                // Update Account Balance
                // Logic:
                // ASSET/EXPENSE (Debit Normal): Debit increases, Credit decreases
                // LIABILITY/EQUITY/REVENUE (Credit Normal): Credit increases, Debit decreases

                const account = await tx.ledgerAccount.findUniqueOrThrow({
                    where: { id: entry.accountId }
                });

                let balanceChange = Number(entry.amount);
                const isDebitNormal = ['ASSET', 'EXPENSE'].includes(account.type);

                if (isDebitNormal) {
                    if (entry.direction === 'CREDIT') balanceChange = -balanceChange;
                } else {
                    // Credit Normal
                    if (entry.direction === 'DEBIT') balanceChange = -balanceChange;
                }

                const newBalance = Number(account.balance) + balanceChange;

                // Check Overdraft
                if (newBalance < 0 && !account.allowOverdraft) {
                    throw new Error(`Insufficient Funds in Account ${account.name} (${account.id})`);
                }

                await tx.ledgerAccount.update({
                    where: { id: entry.accountId },
                    data: { balance: newBalance },
                });
            }

            return transaction;
        });
    }

    /**
     * Retrieves account balance and details
     */
    async getAccount(accountId) {
        return prisma.ledgerAccount.findUnique({
            where: { id: accountId }
        });
    }

    /**
     * Retrieves accounts for a specific entity
     */
    async getAccountsByEntity(entityType, entityId) {
        return prisma.ledgerAccount.findMany({
            where: { entityType, entityId }
        });
    }

    /**
     * Get transaction history for an account
     */
    async getAccountHistory(accountId) {
        return prisma.ledgerEntry.findMany({
            where: { accountId },
            include: { transaction: true },
            orderBy: { createdAt: 'desc' }
        });
    }
}

export default new LedgerService();
