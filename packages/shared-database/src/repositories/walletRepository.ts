/**
 * Wallet Repository
 * Shared access for Wallet and Transaction management.
 */

import { Prisma } from '../../generated/prisma-client';
import { getBookingDb } from '../index';

export interface WalletSummary {
  totalBalance: number;
  availableCredit: number;
  pendingTransactions: number;
  currency: string;
  wallets: Array<{
    id: string;
    name: string;
    balance: number;
    currency: string;
  }>;
}

/**
 * Get a summary of all wallets for a specific owner or globally (if no ownerId)
 */
export async function getWalletSummary(ownerId?: string): Promise<WalletSummary> {
  const db = getBookingDb();
  
  const where: Prisma.WalletWhereInput = ownerId ? { ownerId } : {};
  
  const wallets = await db.wallet.findMany({
    where,
    select: {
      id: true,
      ownerName: true,
      balance: true,
      creditLimit: true,
      currency: true,
    }
  });

  const totalBalance = wallets.reduce((sum: number, w: any) => sum + (w.balance || 0), 0);
  const totalCredit = wallets.reduce((sum: number, w: any) => sum + (w.creditLimit || 0), 0);

  return {
    totalBalance,
    availableCredit: totalCredit,
    pendingTransactions: 0,
    currency: wallets[0]?.currency || 'USD',
    wallets: wallets.map((w: any) => ({
      id: w.id,
      name: w.ownerName,
      balance: w.balance,
      currency: w.currency,
    })),
  };
}

/**
 * Find a wallet by ID with optional relations
 */
export async function findWalletById(id: string, options?: { includeAccounts?: boolean; includeCreditLimits?: boolean; includeCorporate?: boolean }) {
  return getBookingDb().wallet.findUnique({
    where: { id },
    include: {
      currencyAccounts: options?.includeAccounts || false,
      creditLimits: options?.includeCreditLimits || false,
      corporateAccounts: options?.includeCorporate || false,
    }
  });
}

/**
 * Find a wallet by owner details
 */
export async function findWalletByOwner(ownerType: string, ownerId: string) {
  return getBookingDb().wallet.findFirst({
    where: { ownerType: ownerType as any, ownerId },
    include: {
      currencyAccounts: true,
      creditLimits: true,
    }
  });
}

/**
 * Create a new wallet with an initial currency account
 */
export async function createWallet(data: any) {
  return getBookingDb().wallet.create({
    data,
    include: {
      currencyAccounts: true
    }
  });
}

/**
 * Get or create a currency account for a wallet
 */
export async function getOrCreateCurrencyAccount(walletId: string, currency: string) {
  const db = getBookingDb();
  
  let account = await db.currencyAccount.findFirst({
    where: { walletId, currency }
  });

  if (!account) {
    account = await db.currencyAccount.create({
      data: {
        walletId,
        currency,
        computedBalance: 0,
        availableBalance: 0,
        blockedBalance: 0
      }
    });
  }
  
  return account;
}

/**
 * Create a wallet transaction and update the currency account balance
 */
export async function createWalletTransaction(data: any) {
  return getBookingDb().walletTransaction.create({ data });
}

/**
 * Atomic balance updates for a currency account
 */
export async function updateCurrencyAccountBalance(accountId: string, data: { computedDelta?: number; availableDelta?: number; blockedDelta?: number }) {
  const updateData: any = {};
  if (data.computedDelta !== undefined) updateData.computedBalance = { increment: data.computedDelta };
  if (data.availableDelta !== undefined) updateData.availableBalance = { increment: data.availableDelta };
  if (data.blockedDelta !== undefined) updateData.blockedBalance = { increment: data.blockedDelta };

  return getBookingDb().currencyAccount.update({
    where: { id: accountId },
    data: updateData
  });
}

/**
 * Update the primary wallet balance
 */
export async function updateWalletBalance(walletId: string, balance: number) {
  return getBookingDb().wallet.update({
    where: { id: walletId },
    data: { balance }
  });
}

/**
 * Create a wallet hold
 */
export async function createWalletHold(data: any) {
  return getBookingDb().walletHold.create({ data });
}

/**
 * Find a hold by ID
 */
export async function findWalletHoldById(id: string) {
  return getBookingDb().walletHold.findUnique({
    where: { id },
    include: { wallet: { include: { currencyAccounts: true } } }
  });
}

/**
 * Update a hold status
 */
export async function updateWalletHoldStatus(id: string, data: any) {
  return getBookingDb().walletHold.update({
    where: { id },
    data
  });
}

/**
 * Find transactions with optional filters
 */
export async function findTransactions(filters: { walletId?: string; fromDate?: Date; take?: number }) {
  const where: any = {};
  if (filters.walletId) where.walletId = filters.walletId;
  if (filters.fromDate) where.createdAt = { gte: filters.fromDate };

  return getBookingDb().walletTransaction.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: filters.take || 100,
  });
}
