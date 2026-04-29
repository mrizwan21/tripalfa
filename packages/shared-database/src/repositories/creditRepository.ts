/**
 * Credit Repository
 * Manages agent credit limits and utilization alerts.
 */

import { getBookingDb } from '../index';

/**
 * Upsert a credit limit for a wallet
 */
export async function upsertCreditLimit(walletId: string, creditLimit: number) {
  return getBookingDb().agentCreditLimit.upsert({
    where: { walletId },
    update: { creditLimit },
    create: {
      walletId,
      creditLimit,
      currency: 'USD'
    },
  });
}

/**
 * Find all wallets with their credit limits for monitoring
 */
export async function findAllWalletsWithCreditLimits() {
  return getBookingDb().wallet.findMany({
    include: { creditLimits: true }
  });
}
