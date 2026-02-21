// src/services/walletOps.ts
// Prisma-based wallet operations
import { prisma } from '@tripalfa/shared-database';
import type { Wallet, WalletTransaction } from '../types/wallet.js';

export async function ensureWalletExists(userId: string, currency: string): Promise<Wallet> {
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
}

export async function checkIdempotency(idempotencyKey: string): Promise<void> {
  if (!idempotencyKey) return;

  const existing = await prisma.walletTransaction.findFirst({
    where: { idempotencyKey },
  });

  if (existing) throw new Error('Duplicate transaction');
}

export async function lockWallet(userId: string, currency: string): Promise<Wallet> {
  // Prisma doesn't support FOR UPDATE, but transactions provide isolation
  const wallet = await prisma.wallet.findUnique({
    where: {
      userId_currency: { userId, currency },
    },
  });

  if (!wallet) throw new Error('Wallet not found');
  return wallet;
}

export async function processCustomerDebit(
  customerId: string,
  currency: string,
  amount: number,
  agencyId: string,
  bookingId: string,
  idempotencyKey?: string
): Promise<{ customerTx: WalletTransaction; customerWallet: Wallet }> {
  return await prisma.$transaction(async (tx) => {
    // Ensure wallet exists
    let customerWallet = await tx.wallet.findUnique({
      where: { userId_currency: { userId: customerId, currency } },
    });

    if (!customerWallet) {
      customerWallet = await tx.wallet.create({
        data: {
          userId: customerId,
          currency,
          balance: 0,
          reservedBalance: 0,
          status: 'active',
        },
      });
    }

    // Check balance
    if (Number(customerWallet.balance) < amount) {
      throw new Error('Insufficient funds');
    }

    // Debit wallet
    const newBalance = Number(customerWallet.balance) - amount;
    await tx.wallet.update({
      where: { id: customerWallet.id },
      data: { balance: newBalance },
    });

    // Create transaction record
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
      },
    });

    return { customerTx, customerWallet };
  });
}

export async function processAgencyCredit(
  agencyId: string,
  currency: string,
  amount: number,
  customerId: string,
  bookingId: string
): Promise<{ agencyTx: WalletTransaction; agencyWallet: Wallet }> {
  return await prisma.$transaction(async (tx) => {
    // Ensure wallet exists
    let agencyWallet = await tx.wallet.findUnique({
      where: { userId_currency: { userId: agencyId, currency } },
    });

    if (!agencyWallet) {
      agencyWallet = await tx.wallet.create({
        data: {
          userId: agencyId,
          currency,
          balance: 0,
          reservedBalance: 0,
          status: 'active',
        },
      });
    }

    // Credit wallet
    const newBalance = Number(agencyWallet.balance) + amount;
    await tx.wallet.update({
      where: { id: agencyWallet.id },
      data: { balance: newBalance },
    });

    // Create transaction record
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
        status: 'completed',
      },
    });

    return { agencyTx, agencyWallet };
  });
}

export default {
  ensureWalletExists,
  checkIdempotency,
  lockWallet,
  processCustomerDebit,
  processAgencyCredit
};
