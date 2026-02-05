// Wallet Service API Client
// Connects to the wallet-service backend running on port 3007

const WALLET_API_BASE = import.meta.env.VITE_WALLET_API_URL || 'http://localhost:3007/api/v1/ledger';

export interface LedgerAccount {
    id: string;
    name: string;
    type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
    currency: string;
    balance: string; // Decimal from DB
    entityType: 'USER' | 'COMPANY' | 'SYSTEM' | 'SUPPLIER';
    entityId: string;
    allowOverdraft: boolean;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface LedgerTransaction {
    id: string;
    description: string;
    reference?: string;
    type: 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER' | 'PAYMENT' | 'REFUND';
    status: 'PENDING' | 'POSTED' | 'VOID';
    postedAt: string;
}

export interface LedgerEntry {
    id: string;
    transactionId: string;
    accountId: string;
    amount: string;
    direction: 'DEBIT' | 'CREDIT';
    createdAt: string;
    transaction: LedgerTransaction;
}

export interface TransferRequest {
    fromAccountId: string;
    toAccountId: string;
    amount: number;
    description?: string;
    reference?: string;
}

export interface CreateAccountRequest {
    name: string;
    type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
    currency: string;
    entityType: 'USER' | 'COMPANY' | 'SYSTEM' | 'SUPPLIER';
    entityId: string;
    allowOverdraft?: boolean;
}

export const walletService = {
    // Create a new wallet account
    createAccount: async (data: CreateAccountRequest): Promise<LedgerAccount> => {
        const response = await fetch(WALLET_API_BASE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        const result = await response.json();
        if (!result.success) throw new Error(result.error);
        return result.data;
    },

    // Get all accounts for an entity
    getAccountsByEntity: async (entityType: string, entityId: string): Promise<LedgerAccount[]> => {
        const response = await fetch(`${WALLET_API_BASE}/${entityType}/${entityId}`);
        const result = await response.json();
        if (!result.success) throw new Error(result.error);
        return result.data;
    },

    // Get transaction history for an account
    getAccountHistory: async (accountId: string): Promise<LedgerEntry[]> => {
        const response = await fetch(`${WALLET_API_BASE}/history/${accountId}`);
        const result = await response.json();
        if (!result.success) throw new Error(result.error);
        return result.data;
    },

    // Transfer funds between accounts
    transferFunds: async (data: TransferRequest): Promise<LedgerTransaction> => {
        const response = await fetch(`${WALLET_API_BASE}/transfer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        const result = await response.json();
        if (!result.success) throw new Error(result.error);
        return result.data;
    },
};
