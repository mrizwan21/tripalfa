export interface WalletManagerConfig {
  prisma: any;
}

type Wallet = any;
type WalletTransaction = any;
type WalletLedger = any;

export class WalletManager {
  private prisma: any;

  constructor(config: WalletManagerConfig) {
    this.prisma = config.prisma;
  }

  /**
   * Credit a wallet (Top-up) - Idempotent using idempotencyKey
   */
  async creditWallet(
    userId: string,
    currency: string,
    amount: number,
    description: string,
    idempotencyKey: string,
  ): Promise<WalletTransaction> {
    // 1. Check for existing transaction for idempotency
    const existing = await this.prisma.walletTransaction.findFirst({
      where: { idempotencyKey },
    });

    if (existing) {
      return existing;
    }

    // 2. Start transaction
    return await this.prisma.$transaction(async (tx) => {
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
            status: "active",
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
          wallet: { connect: { id: wallet.id } },
          type: "deposit",
          flow: "credit",
          amount,
          balance: newBalance,
          credit: amount,
          currency,
          idempotencyKey,
          description,
          status: "completed",
        },
      });

      // Create ledger entry - debit the system account, credit the wallet
      await tx.walletLedger.create({
        data: {
          wallet: { connect: { id: wallet.id } },
          transaction: { connect: { id: transaction.id } },
          entryType: "credit",
          amount,
          balance: newBalance,
          accountType: "wallet",
          account: `wallet:${wallet.id}`,
          credit: amount,
          currency,
        },
      });

      return transaction;
    });
  }

  /**
   * Debit a wallet (Withdrawal/Payment) - Idempotent
   */
  async debitWallet(
    userId: string,
    currency: string,
    amount: number,
    description: string,
    idempotencyKey: string,
  ): Promise<WalletTransaction> {
    const existing = await this.prisma.walletTransaction.findFirst({
      where: { idempotencyKey },
    });

    if (existing) {
      return existing;
    }

    return await this.prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({
        where: { userId_currency: { userId, currency } },
      });

      if (!wallet || Number(wallet.balance) < amount) {
        throw new Error("Insufficient balance");
      }

      const newBalance = Number(wallet.balance) - amount;
      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: newBalance },
      });

      const transaction = await tx.walletTransaction.create({
        data: {
          wallet: { connect: { id: wallet.id } },
          type: "withdrawal",
          flow: "debit",
          amount,
          balance: newBalance,
          debit: amount,
          currency,
          idempotencyKey,
          description,
          status: "completed",
        },
      });

      // Create ledger entry - debit the wallet, credit the system account
      await tx.walletLedger.create({
        data: {
          wallet: { connect: { id: wallet.id } },
          transaction: { connect: { id: transaction.id } },
          entryType: "debit",
          amount,
          balance: newBalance,
          accountType: "wallet",
          account: `wallet:${wallet.id}`,
          debit: amount,
          currency,
        },
      });

      return transaction;
    });
  }

  async getWallet(userId: string, currency: string): Promise<Wallet | null> {
    return await this.prisma.wallet.findUnique({
      where: { userId_currency: { userId, currency } },
    });
  }

  async getUserWallets(userId: string): Promise<Wallet[]> {
    return await this.prisma.wallet.findMany({
      where: { userId },
    });
  }

  async getWalletBalance(
    userId: string,
    currency: string,
  ): Promise<{ balance: number; currency: string }> {
    const wallet = await this.getWallet(userId, currency);
    return {
      balance: wallet ? Number(wallet.balance) : 0,
      currency,
    };
  }

  async getTransactionHistory(
    userId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<WalletTransaction[]> {
    const wallets = await this.getUserWallets(userId);
    const walletIds = wallets.map((w) => w.id);

    if (walletIds.length === 0) {
      return [];
    }

    return await this.prisma.walletTransaction.findMany({
      where: {
        walletId: { in: walletIds },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });
  }

  async transferBetweenCurrencies(
    userId: string,
    fromCurrency: string,
    toCurrency: string,
    amount: number,
    idempotencyKey: string,
  ): Promise<WalletTransaction> {
    // Basic implementation for type coverage
    // In reality, this would involve exchange rates and two transactions
    const existing = await this.prisma.walletTransaction.findFirst({
      where: { idempotencyKey },
    });

    if (existing) return existing;

    return await this.prisma.$transaction(async (tx) => {
      // Debit from source
      await this.debitWallet(
        userId,
        fromCurrency,
        amount,
        `Transfer to ${toCurrency}`,
        `${idempotencyKey}_debit`,
      );
      // Credit to target (assuming 1:1 for now, or fetch rates)
      return await this.creditWallet(
        userId,
        toCurrency,
        amount,
        `Transfer from ${fromCurrency}`,
        `${idempotencyKey}_credit`,
      );
    });
  }
}

export function initializeWallet(prisma: any): WalletManager {
  return new WalletManager({ prisma });
}
