import { Request, Response } from 'express';
import LedgerService from '../services/LedgerService.js';

export class WalletController {

    // Create a new wallet account
    async createAccount(req, res) {
        try {
            const { name, type, currency, entityType, entityId, allowOverdraft } = req.body;

            const account = await LedgerService.createAccount({
                name,
                type,
                currency,
                entityType,
                entityId,
                allowOverdraft,
            });

            res.status(201).json({ success: true, data: account });
        } catch (error) {
            const err = error;
            res.status(400).json({ success: false, error: err.message });
        }
    }

    // Get all accounts for an entity
    async getEntityAccounts(req, res) {
        try {
            const { entityType, entityId } = req.params;
            const accounts = await LedgerService.getAccountsByEntity(entityType, entityId);
            res.json({ success: true, data: accounts });
        } catch (error) {
            const err = error;
            res.status(500).json({ success: false, error: err.message });
        }
    }

    // Get transaction history for an account
    async getAccountHistory(req, res) {
        try {
            const { accountId } = req.params;
            const history = await LedgerService.getAccountHistory(accountId);
            res.json({ success: true, data: history });
        } catch (error) {
            const err = error;
            res.status(500).json({ success: false, error: err.message });
        }
    }

    // Execute a transfer (Simple abstraction over postTransaction)
    async transferFunds(req, res) {
        try {
            const { fromAccountId, toAccountId, amount, description, reference } = req.body;

            if (!fromAccountId || !toAccountId || !amount) {
                res.status(400).json({ success: false, error: 'Missing required fields' });
                return;
            }

            // Construct Ledger Transaction
            const transaction = await LedgerService.postTransaction({
                description: description || 'Fund Transfer',
                reference,
                type: 'TRANSFER',
                entries: [
                    {
                        accountId: fromAccountId,
                        amount: parseFloat(amount),
                        direction: 'CREDIT', // Credit sender (Decrease Asset)
                    },
                    {
                        accountId: toAccountId,
                        amount: parseFloat(amount),
                        direction: 'DEBIT', // Debit receiver (Increase Asset)
                    },
                ],
            });

            res.status(200).json({ success: true, data: transaction });
        } catch (error) {
            const err = error;
            res.status(400).json({ success: false, error: err.message });
        }
    }

    // Deposit funds into an account (for system/admin use)
    async depositFunds(req, res) {
        try {
            const { accountId, amount, description, reference, systemAccountId } = req.body;

            if (!accountId || !amount) {
                res.status(400).json({ success: false, error: 'Missing required fields' });
                return;
            }

            // For a proper double-entry deposit:
            // - DEBIT the target account (increases ASSET balance)
            // - CREDIT the system/source account (increases LIABILITY = money owed to system)
            const transaction = await LedgerService.postTransaction({
                description: description || 'Funds Deposit',
                reference,
                type: 'DEPOSIT',
                entries: [
                    {
                        accountId: accountId,
                        amount: parseFloat(amount),
                        direction: 'DEBIT', // Debit increases ASSET
                    },
                    {
                        accountId: systemAccountId || 'cmkyj613w0008x35qihu2jimg', // Default SYSTEM account
                        amount: parseFloat(amount),
                        direction: 'CREDIT', // Credit increases LIABILITY
                    },
                ],
            });

            res.status(200).json({ success: true, data: transaction });
        } catch (error) {
            const err = error;
            res.status(400).json({ success: false, error: err.message });
        }
    }
}

export default new WalletController();
