// src/services/walletService.ts
// Complete wallet operations supporting multi-user flows:
// Customers, Agencies, Travel Suppliers with selling, purchasing, settlement, and refund scenarios
// Now using Prisma with Neon Database

import { prisma } from '@tripalfa/shared-database';
import { getLatestSnapshot } from './fxService.js';
import { logger } from '../utils/logger.js';

import type {
  Wallet,
  WalletTransaction,
  WalletLedger,
  TransactionType,
  TransactionStatus,
  UserType,
} from '../types/wallet.js';

const SERVICE_NAME = 'walletService';

interface WalletService {
  createWallet(userId: string, currency: string): Promise<Wallet>;
  getWalletBalance(userId: string, currency: string): Promise<number | null>;
  getUserWallets(userId: string): Promise<Wallet[]>;
  creditWallet(userId: string, currency: string, amount: number, description: string, idempotencyKey: string): Promise<WalletTransaction>;
  debitWallet(userId: string, currency: string, amount: number, description: string, idempotencyKey: string): Promise<WalletTransaction>;
  getTransactionHistory(userId: string, limit?: number, offset?: number): Promise<WalletTransaction[]>;
  customerPurchaseFlow(flow: CustomerPurchaseFlow): Promise<WalletTransaction>;
  supplierSettlementFlow(flow: SupplierSettlementFlow): Promise<WalletTransaction>;
}

interface CustomerPurchaseFlow {
  customerId: string;
  agencyId: string;
  supplierId: string;
  amount: number;
  currency: string;
  bookingId: string;
  commissionRate: number;
  idempotencyKey: string;
}

interface SupplierSettlementFlow {
  supplierId: string;
  agencyId: string;
  settlementAmount: number;
  currency: string;
  invoiceId: string;
  deductedCommission: number;
  idempotencyKey: string;
}

const walletService: WalletService = {} as WalletService;

/**
 * Create a wallet for a user in a specific currency
 */
walletService.createWallet = async function(userId: string, currency: string): Promise<Wallet> {
  // Use upsert to avoid unique constraint failure if wallet already exists
  const wallet = await prisma.wallet.upsert({
    where: {
      userId_currency: { userId, currency },
    },
    update: {},
    create: {
      userId,
      currency,
      balance: 0,
      reservedBalance: 0,
      status: 'active',
    },
  });

  return wallet;
};

/**
 * Get wallet balance for a user in a specific currency
 */
walletService.getWalletBalance = async function(userId: string, currency: string): Promise<number | null> {
  const wallet = await prisma.wallet.findUnique({
    where: {
      userId_currency: { userId, currency },
    },
    select: {
      balance: true,
    },
  });

  return wallet ? Number(wallet.balance) : null;
};

/**
 * Get all wallets for a user
 */
walletService.getUserWallets = async function(userId: string): Promise<Wallet[]> {
  const wallets = await prisma.wallet.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  return wallets;
};

/**
 * Credit a wallet (top-up/deposit)
 */
walletService.creditWallet = async function(
  userId: string,
  currency: string,
  amount: number,
  description: string,
  idempotencyKey: string
): Promise<WalletTransaction> {
  // Check for existing transaction (idempotency)
  const existing = await prisma.walletTransaction.findFirst({
    where: { idempotencyKey },
  });

  if (existing) {
    return existing;
  }

  return await prisma.$transaction(async (tx) => {
    // Get or create wallet
    let wallet = await tx.wallet.findUnique({
      where: { userId_currency: { userId, currency } },
    });

    if (!wallet) {
      wallet = await tx.wallet.create({
        data: {
          userId,
          currency,
          balance: 0,
          reservedBalance: 0,
          status: 'active',
        },
      });
    }

    // Update balance
    const newBalance = Number(wallet.balance) + amount;
    await tx.wallet.update({
      where: { id: wallet.id },
      data: { balance: newBalance },
    });

    // Create transaction record
    const transaction = await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: 'deposit',
        flow: 'credit',
        amount,
        currency,
        idempotencyKey,
        description,
        status: 'completed',
      },
    });

    // Create ledger entry
    await tx.walletLedger.create({
      data: {
        transactionId: transaction.id,
        account: `wallet:${wallet.id}`,
        credit: amount,
        currency,
        description,
      },
    });

    return transaction;
  });
};

/**
 * Debit a wallet (withdrawal/payment)
 */
walletService.debitWallet = async function(
  userId: string,
  currency: string,
  amount: number,
  description: string,
  idempotencyKey: string
): Promise<WalletTransaction> {
  // Check for existing transaction (idempotency)
  const existing = await prisma.walletTransaction.findFirst({
    where: { idempotencyKey },
  });

  if (existing) {
    return existing;
  }

  return await prisma.$transaction(async (tx) => {
    const wallet = await tx.wallet.findUnique({
      where: { userId_currency: { userId, currency } },
    });

    if (!wallet || Number(wallet.balance) < amount) {
      throw new Error('Insufficient balance');
    }

    const newBalance = Number(wallet.balance) - amount;
    await tx.wallet.update({
      where: { id: wallet.id },
      data: { balance: newBalance },
    });

    const transaction = await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: 'withdrawal',
        flow: 'debit',
        amount,
        currency,
        idempotencyKey,
        description,
        status: 'completed',
      },
    });

    await tx.walletLedger.create({
      data: {
        transactionId: transaction.id,
        account: `wallet:${wallet.id}`,
        debit: amount,
        currency,
        description,
      },
    });

    return transaction;
  });
};

/**
 * Get transaction history for a user
 */
walletService.getTransactionHistory = async function(
  userId: string,
  limit: number = 50,
  offset: number = 0
): Promise<WalletTransaction[]> {
  const wallets = await prisma.wallet.findMany({
    where: { userId },
    select: { id: true },
  });

  const walletIds = wallets.map(w => w.id);

  if (walletIds.length === 0) {
    return [];
  }

  return await prisma.walletTransaction.findMany({
    where: {
      walletId: { in: walletIds },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
  });
};

/**
 * Customer purchase flow: customer -> agency -> supplier with commission deduction
 */
walletService.customerPurchaseFlow = async function(flow: CustomerPurchaseFlow): Promise<WalletTransaction> {
  const { customerId, agencyId, supplierId, amount, currency, bookingId, commissionRate, idempotencyKey } = flow;

  // Check for existing transaction (idempotency)
  const existing = await prisma.walletTransaction.findFirst({
    where: { idempotencyKey },
  });

  if (existing) {
    return existing;
  }

  return await prisma.$transaction(async (tx) => {
    // Ensure customer wallet exists
    let customerWallet = await tx.wallet.findUnique({
      where: { userId_currency: { userId: customerId, currency } },
    });

    if (!customerWallet) {
      customerWallet = await tx.wallet.create({
        data: { userId: customerId, currency, balance: 0, reservedBalance: 0, status: 'active' },
      });
    }

    // Ensure agency wallet exists
    let agencyWallet = await tx.wallet.findUnique({
      where: { userId_currency: { userId: agencyId, currency } },
    });

    if (!agencyWallet) {
      agencyWallet = await tx.wallet.create({
        data: { userId: agencyId, currency, balance: 0, reservedBalance: 0, status: 'active' },
      });
    }

    // Validate and debit customer
    if (Number(customerWallet.balance) < amount) {
      throw new Error('Insufficient funds');
    }

    const customerNewBalance = Number(customerWallet.balance) - amount;
    await tx.wallet.update({
      where: { id: customerWallet.id },
      data: { balance: customerNewBalance },
    });

    // Create customer debit transaction
    const customerTx = await tx.walletTransaction.create({
      data: {
        walletId: customerWallet.id,
        type: 'purchase',
        flow: 'debit',
        amount,
        currency,
        payerId: customerId,
        payeeId: agencyId,
        bookingId,
        idempotencyKey,
        status: 'completed',
        description: 'Customer purchase',
      },
    });

    // Credit agency wallet
    const agencyNewBalance = Number(agencyWallet.balance) + amount;
    await tx.wallet.update({
      where: { id: agencyWallet.id },
      data: { balance: agencyNewBalance },
    });

    // Create agency credit transaction
    const agencyTx = await tx.walletTransaction.create({
      data: {
        walletId: agencyWallet.id,
        type: 'purchase',
        flow: 'credit',
        amount,
        currency,
        payerId: customerId,
        payeeId: agencyId,
        bookingId,
        idempotencyKey: `${idempotencyKey}_agency`,
        status: 'completed',
        description: 'Agency purchase credit',
      },
    });

    // Calculate and reserve commission
    const commission = Number((Number(amount) * (Number(commissionRate) / 100)).toFixed(6));
    const reservedBalance = Number(agencyWallet.reservedBalance) + commission;
    await tx.wallet.update({
      where: { id: agencyWallet.id },
      data: { reservedBalance },
    });

    // Create ledger entries
    await tx.walletLedger.create({
      data: {
        transactionId: customerTx.id,
        account: `wallet:${customerWallet.id}`,
        debit: amount,
        currency,
        description: 'Customer purchase debit',
      },
    });

    await tx.walletLedger.create({
      data: {
        transactionId: agencyTx.id,
        account: `wallet:${agencyWallet.id}`,
        credit: amount,
        currency,
        description: 'Agency purchase credit',
      },
    });

    return customerTx;
  });
};

/**
 * Supplier settlement flow
 */
walletService.supplierSettlementFlow = async function(flow: SupplierSettlementFlow): Promise<WalletTransaction> {
  const { supplierId, agencyId, settlementAmount, currency, invoiceId, deductedCommission, idempotencyKey } = flow;

  // Check for existing transaction (idempotency)
  const existing = await prisma.walletTransaction.findFirst({
    where: { idempotencyKey },
  });

  if (existing) {
    return existing;
  }

  return await prisma.$transaction(async (tx) => {
    // Ensure supplier wallet exists
    let supplierWallet = await tx.wallet.findUnique({
      where: { userId_currency: { userId: supplierId, currency } },
    });

    if (!supplierWallet) {
      supplierWallet = await tx.wallet.create({
        data: { userId: supplierId, currency, balance: 0, reservedBalance: 0, status: 'active' },
      });
    }

    // Ensure agency wallet exists
    let agencyWallet = await tx.wallet.findUnique({
      where: { userId_currency: { userId: agencyId, currency } },
    });

    if (!agencyWallet) {
      throw new Error('Agency wallet not found');
    }

    const totalDebit = Number(settlementAmount) + Number(deductedCommission || 0);
    
    // Validate agency has sufficient funds (including reserved)
    const availableBalance = Number(agencyWallet.balance) - Number(agencyWallet.reservedBalance);
    if (availableBalance < totalDebit) {
      throw new Error('Insufficient funds');
    }

    // Debit agency
    const agencyNewBalance = Number(agencyWallet.balance) - totalDebit;
    const agencyReservedBalance = Number(agencyWallet.reservedBalance) - Number(deductedCommission || 0);
    await tx.wallet.update({
      where: { id: agencyWallet.id },
      data: { 
        balance: agencyNewBalance,
        reservedBalance: agencyReservedBalance < 0 ? 0 : agencyReservedBalance,
      },
    });

    // Credit supplier
    const supplierNewBalance = Number(supplierWallet.balance) + Number(settlementAmount);
    await tx.wallet.update({
      where: { id: supplierWallet.id },
      data: { balance: supplierNewBalance },
    });

    // Create settlement transaction
    const settlementTx = await tx.walletTransaction.create({
      data: {
        walletId: supplierWallet.id,
        type: 'settlement',
        flow: 'credit',
        amount: Number(settlementAmount),
        currency,
        payerId: agencyId,
        payeeId: supplierId,
        invoiceId,
        idempotencyKey,
        status: 'completed',
        description: 'Supplier settlement',
      },
    });

    // Create ledger entries
    await tx.walletLedger.create({
      data: {
        transactionId: settlementTx.id,
        account: `wallet:${agencyWallet.id}`,
        debit: totalDebit,
        currency,
        description: 'Agency settlement debit',
      },
    });

    await tx.walletLedger.create({
      data: {
        transactionId: settlementTx.id,
        account: `wallet:${supplierWallet.id}`,
        credit: Number(settlementAmount),
        currency,
        description: 'Supplier settlement credit',
      },
    });

    if (deductedCommission && deductedCommission > 0) {
      await tx.walletLedger.create({
        data: {
          transactionId: settlementTx.id,
          account: `commission:deducted:${currency}`,
          credit: deductedCommission,
          currency,
          description: 'Commission deducted',
        },
      });
    }

    return settlementTx;
  });
};

// ES module export
export default walletService;
