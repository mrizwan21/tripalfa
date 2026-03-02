// tests/services/walletService.test.ts
// Integration tests for wallet operations with database

// Bootstrap environment and DB pool synchronously before importing service modules

const path = require("path");
// __dirname is tests/services; go up two levels to service root
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const pg = require("pg");
if (pg && pg.types && typeof pg.types.setTypeParser === "function") {
  pg.types.setTypeParser(1700, (val) =>
    val === null ? null : parseFloat(val),
  );
}
const { Pool } = pg;
const connStr = (process.env.DATABASE_URL || "").replace(/^"|"$/g, "");
global.PG_POOL = new Pool({ connectionString: connStr });
const walletService = require("../../src/services/walletService");
// Since it's CommonJS, require returns the exports object directly
const WS = walletService;
const { v4: uuidv4 } = require("uuid");
// Access global pool without TypeScript `as` cast to avoid parser issues
const pool = global["PG_POOL"];

describe("walletService", () => {
  let userId1;
  let userId2;
  let userId3;

  beforeAll(async () => {
    // Ensure both pools use the test schema
    try {
      const db = require("../../src/config/db");
      await db.pool.query("SET search_path TO wallet_test,public");
    } catch (e) {
      // ignore
    }
    try {
      await pool.query("SET search_path TO wallet_test,public");
    } catch (e) {
      // ignore
    }
    // Set up FX snapshot for tests by inserting directly into DB (avoid fxService import)
    const rates = {
      USD: 1.0,
      EUR: 0.92,
      GBP: 0.79,
      JPY: 149.5,
    };
    await pool.query(
      `INSERT INTO exchange_rate_snapshots (source, base_currency, rates, fetched_at, status)
       VALUES ($1, $2, $3, $4, 'active')`,
      ["openexchangerates", "USD", JSON.stringify(rates), new Date()],
    );

    // Create test users
    userId1 = uuidv4(); // Customer
    userId2 = uuidv4(); // Agency
    userId3 = uuidv4(); // Supplier

    // Insert users into database
    await pool.query(
      `INSERT INTO users (id, user_type, email) VALUES
       ($1, 'customer', 'customer@test.com'),
       ($2, 'agency', 'agency@test.com'),
       ($3, 'travel_supplier', 'supplier@test.com')`,
      [userId1, userId2, userId3],
    );
  });

  afterAll(async () => {
    // Clean up
    await pool.query("DELETE FROM wallets WHERE user_id IN ($1, $2, $3)", [
      userId1,
      userId2,
      userId3,
    ]);
    await pool.query("DELETE FROM users WHERE id IN ($1, $2, $3)", [
      userId1,
      userId2,
      userId3,
    ]);
    await pool.end();
  });

  describe("createWallet", () => {
    it("should create a new wallet", async () => {
      const wallet = await WS.createWallet(userId1, "USD");

      expect(wallet).toBeDefined();
      expect(wallet.userId).toBe(userId1);
      expect(wallet.currency).toBe("USD");
      expect(wallet.balance).toBe(0);
      expect(wallet.status).toBe("active");
    });

    it("should reactivate existing wallet", async () => {
      const wallet1 = await WS.createWallet(userId1, "EUR");
      const wallet2 = await WS.createWallet(userId1, "EUR");

      expect(wallet1.id).toBe(wallet2.id);
      expect(wallet2.status).toBe("active");
    });

    it("should create wallets for different currencies", async () => {
      const walletUSD = await WS.createWallet(userId1, "USD");
      const walletEUR = await WS.createWallet(userId1, "EUR");

      expect(walletUSD.currency).toBe("USD");
      expect(walletEUR.currency).toBe("EUR");
      expect(walletUSD.id).not.toBe(walletEUR.id);
    });
  });

  describe("topup", () => {
    it("should add funds to wallet", async () => {
      const walletBefore = await WS.createWallet(userId1, "USD");
      const initialBalance = walletBefore.balance;

      const tx = await WS.topup({
        userId: userId1,
        currency: "USD",
        amount: 100,
        gateway: "stripe",
        gatewayReference: "pi_123456",
        idempotencyKey: uuidv4(),
      });

      expect(tx).toBeDefined();
      expect(tx.type).toBe("topup");
      expect(tx.amount).toBe(100);
      expect(tx.status).toBe("completed");

      const walletAfter = await walletService.getWalletBalance(userId1, "USD");
      expect(walletAfter).toBe(initialBalance + 100);
    });

    it("should be idempotent", async () => {
      const idempotencyKey = uuidv4();

      const tx1 = await WS.topup({
        userId: userId1,
        currency: "USD",
        amount: 50,
        gateway: "stripe",
        gatewayReference: "pi_789012",
        idempotencyKey,
      });

      const tx2 = await WS.topup({
        userId: userId1,
        currency: "USD",
        amount: 50,
        gateway: "stripe",
        gatewayReference: "pi_789012",
        idempotencyKey,
      });

      expect(tx1.id).toBe(tx2.id);

      const walletBalance = await walletService.getWalletBalance(
        userId1,
        "USD",
      );
      // Should only have one 50 deposit, not two
      expect(walletBalance).toBe(150);
    });

    it("should create ledger entries", async () => {
      const idempotencyKey = uuidv4();
      const tx = await WS.topup({
        userId: userId1,
        currency: "USD",
        amount: 75,
        gateway: "paypal",
        gatewayReference: "pp_123456",
        idempotencyKey,
      });

      const ledgers = await pool.query(
        "SELECT * FROM ledger_entries WHERE transaction_id = $1",
        [tx.id],
      );

      expect(ledgers.rowCount).toBe(2); // Debit and credit
      expect(ledgers.rows[0].debit + ledgers.rows[1].debit).toBe(75);
      expect(ledgers.rows[0].credit + ledgers.rows[1].credit).toBe(75);
    });
  });

  describe("getWalletBalance", () => {
    it("should return wallet balance", async () => {
      await WS.createWallet(userId2, "EUR");
      const balance = await WS.getWalletBalance(userId2, "EUR");

      expect(balance).toBe(0);
    });

    it("should return null if wallet does not exist", async () => {
      const balance = await WS.getWalletBalance(userId3, "XXX");
      expect(balance).toBeNull();
    });
  });

  describe("getUserWallets", () => {
    it("should return all user wallets", async () => {
      await WS.createWallet(userId2, "USD");
      await WS.createWallet(userId2, "EUR");

      const wallets = await walletService.getUserWallets(userId2);

      expect(wallets.length).toBeGreaterThanOrEqual(2);
      expect(wallets.some((w) => w.currency === "USD")).toBe(true);
      expect(wallets.some((w) => w.currency === "EUR")).toBe(true);
    });
  });

  describe("refund", () => {
    it("should refund full amount", async () => {
      // First topup
      const topupTx = await WS.topup({
        userId: userId1,
        currency: "USD",
        amount: 100,
        gateway: "stripe",
        gatewayReference: "pi_refund_test",
        idempotencyKey: uuidv4(),
      });

      const balanceBeforeRefund = await walletService.getWalletBalance(
        userId1,
        "USD",
      );
      expect(balanceBeforeRefund).not.toBeNull();

      // Then refund
      const refundTx = await WS.refund({
        originalTransactionId: topupTx.id,
        userId: userId1,
        amount: 100,
        reason: "full refund",
        idempotencyKey: uuidv4(),
      });

      expect(refundTx.type).toBe("refund");
      expect(refundTx.amount).toBe(100);

      const balanceAfterRefund = await walletService.getWalletBalance(
        userId1,
        "USD",
      );
      expect(balanceAfterRefund).toBe(balanceBeforeRefund + 100);
    });

    it("should refund partial amount", async () => {
      const topupTx = await WS.topup({
        userId: userId1,
        currency: "USD",
        amount: 200,
        gateway: "stripe",
        gatewayReference: "pi_partial_refund",
        idempotencyKey: uuidv4(),
      });

      const balanceBeforeRefund = await walletService.getWalletBalance(
        userId1,
        "USD",
      );
      expect(balanceBeforeRefund).not.toBeNull();

      const refundTx = await WS.refund({
        originalTransactionId: topupTx.id,
        userId: userId1,
        amount: 50,
        reason: "partial refund",
        idempotencyKey: uuidv4(),
      });

      expect(refundTx.amount).toBe(50);
      const balanceAfterRefund = await walletService.getWalletBalance(
        userId1,
        "USD",
      );
      expect(balanceAfterRefund).toBe(balanceBeforeRefund + 50);
    });

    it("should fail if refund exceeds original", async () => {
      const topupTx = await WS.topup({
        userId: userId1,
        currency: "USD",
        amount: 100,
        gateway: "stripe",
        gatewayReference: "pi_exceed_test",
        idempotencyKey: uuidv4(),
      });

      await expect(
        WS.refund({
          originalTransactionId: topupTx.id,
          userId: userId1,
          amount: 150,
          reason: "over refund attempt",
          idempotencyKey: uuidv4(),
        }),
      ).rejects.toThrow(/exceeds original/);
    });
  });
});
