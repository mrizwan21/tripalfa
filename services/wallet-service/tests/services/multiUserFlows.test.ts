// tests/services/multiUserFlows.test.ts
// Integration tests for customer->agency->supplier transaction flows

import * as walletService from "../../src/services/walletService";
import { saveSnapshot } from "../../src/services/fxService";
const pool = (global as any).PG_POOL;
import { v4 as uuidv4 } from "uuid";

describe("Multi-User Transaction Flows", () => {
  let customerId: string;
  let agencyId: string;
  let supplierId: string;

  beforeAll(async () => {
    // Set up FX snapshot
    const rates = {
      USD: 1.0,
      EUR: 0.92,
      GBP: 0.79,
    };
    await saveSnapshot("openexchangerates", "USD", rates, new Date());

    // Create test users
    customerId = uuidv4();
    agencyId = uuidv4();
    supplierId = uuidv4();

    await pool.query(
      `INSERT INTO users (id, user_type, commission_rate, email) VALUES
       ($1, 'customer', 0, 'customer@test.com'),
       ($2, 'agency', 10, 'agency@test.com'),
       ($3, 'travel_supplier', 0, 'supplier@test.com')`,
      [customerId, agencyId, supplierId],
    );

    // Create wallets
    await walletService.createWallet(customerId, "USD");
    await walletService.createWallet(agencyId, "USD");
    await walletService.createWallet(supplierId, "USD");

    // Fund customer wallet
    await walletService.topup({
      userId: customerId,
      currency: "USD",
      amount: 1000,
      gateway: "stripe",
      gatewayReference: "pi_initial_topup",
      idempotencyKey: uuidv4(),
    });
  });

  afterAll(async () => {
    await pool.query("DELETE FROM wallets WHERE user_id IN ($1, $2, $3)", [
      customerId,
      agencyId,
      supplierId,
    ]);
    await pool.query("DELETE FROM users WHERE id IN ($1, $2, $3)", [
      customerId,
      agencyId,
      supplierId,
    ]);
  });

  describe("customerPurchaseFlow", () => {
    it("should execute complete customer purchase with agency and supplier", async () => {
      const bookingId = "BK" + Date.now();
      const commissionRate = 10;
      const purchaseAmount = 100;

      const result = await walletService.customerPurchaseFlow({
        customerId,
        agencyId,
        supplierId,
        amount: purchaseAmount,
        currency: "USD",
        bookingId,
        commissionRate,
        idempotencyKey: uuidv4(),
      });

      // Verify transactions were created
      expect(result.customerTx).toBeDefined();
      expect(result.agencyTx).toBeDefined();
      expect(result.commissionTx).toBeDefined();

      // Verify transaction types
      expect(result.customerTx.type).toBe("customer_purchase");
      expect(result.agencyTx.type).toBe("agency_purchase");
      expect(result.commissionTx.type).toBe("agency_commission");

      // Verify amounts
      expect(result.customerTx.amount).toBe(purchaseAmount);
      expect(result.agencyTx.amount).toBe(purchaseAmount);
      expect(result.commissionTx.amount).toBe(10); // 10% commission

      // Verify flows
      expect(result.customerTx.flow).toBe("customer_to_supplier");
      expect(result.agencyTx.flow).toBe("customer_to_supplier");
      expect(result.commissionTx.flow).toBe("customer_to_supplier");
    });

    it("should debit customer and credit agency", async () => {
      const bookingId = "BK" + Date.now();
      const purchaseAmount = 200;

      const customerBalanceBefore = await walletService.getWalletBalance(
        customerId,
        "USD",
      );
      const agencyBalanceBefore = await walletService.getWalletBalance(
        agencyId,
        "USD",
      );

      await walletService.customerPurchaseFlow({
        customerId,
        agencyId,
        supplierId,
        amount: purchaseAmount,
        currency: "USD",
        bookingId,
        commissionRate: 15,
        idempotencyKey: uuidv4(),
      });

      const customerBalanceAfter = await walletService.getWalletBalance(
        customerId,
        "USD",
      );
      const agencyBalanceAfter = await walletService.getWalletBalance(
        agencyId,
        "USD",
      );

      // Customer should be debited
      expect(customerBalanceAfter).toBe(customerBalanceBefore - purchaseAmount);

      // Agency should be credited
      expect(agencyBalanceAfter).toBe(agencyBalanceBefore + purchaseAmount);
    });

    it("should fail if customer insufficient funds", async () => {
      const poorCustomerId = uuidv4();
      await pool.query(
        "INSERT INTO users (id, user_type, email) VALUES ($1, 'customer', 'poor@test.com')",
        [poorCustomerId],
      );
      await walletService.createWallet(poorCustomerId, "USD");

      await expect(
        walletService.customerPurchaseFlow({
          customerId: poorCustomerId,
          agencyId,
          supplierId,
          amount: 1000,
          currency: "USD",
          bookingId: "BK_FAIL",
          commissionRate: 10,
          idempotencyKey: uuidv4(),
        }),
      ).rejects.toThrow(/Insufficient customer funds/);

      await pool.query("DELETE FROM users WHERE id = $1", [poorCustomerId]);
    });

    it("should create ledger entries for all parties", async () => {
      const bookingId = "BK" + Date.now();

      const result = await walletService.customerPurchaseFlow({
        customerId,
        agencyId,
        supplierId,
        amount: 150,
        currency: "USD",
        bookingId,
        commissionRate: 12,
        idempotencyKey: uuidv4(),
      });

      // Should have ledger entries for customer, agency, and commission
      const customerLedgers = await pool.query(
        "SELECT * FROM ledger_entries WHERE transaction_id = $1",
        [result.customerTx.id],
      );
      const agencyLedgers = await pool.query(
        "SELECT * FROM ledger_entries WHERE transaction_id = $1",
        [result.agencyTx.id],
      );

      expect(customerLedgers.rowCount).toBeGreaterThan(0);
      expect(agencyLedgers.rowCount).toBeGreaterThan(0);
    });
  });

  describe("supplierSettlementFlow", () => {
    it("should settle payment from agency to supplier", async () => {
      // First do a purchase to fund agency
      const bookingId = "BK_SETTLE_" + Date.now();
      const purchaseAmount = 300;
      const commissionRate = 10;
      const commission = (purchaseAmount * commissionRate) / 100;
      const settlementAmount = purchaseAmount - commission;

      // Do purchase
      await walletService.customerPurchaseFlow({
        customerId,
        agencyId,
        supplierId,
        amount: purchaseAmount,
        currency: "USD",
        bookingId,
        commissionRate,
        idempotencyKey: uuidv4(),
      });

      const supplierBalanceBefore = await walletService.getWalletBalance(
        supplierId,
        "USD",
      );
      const agencyBalanceBefore = await walletService.getWalletBalance(
        agencyId,
        "USD",
      );

      // Then settle
      const settlementTx = await walletService.supplierSettlementFlow({
        supplierId,
        agencyId,
        settlementAmount,
        currency: "USD",
        invoiceId: "INV_" + Date.now(),
        deductedCommission: commission,
        idempotencyKey: uuidv4(),
      });

      expect(settlementTx.type).toBe("supplier_settlement");
      expect(settlementTx.amount).toBe(settlementAmount);
      expect(settlementTx.status).toBe("completed");

      // Verify balances
      const supplierBalanceAfter = await walletService.getWalletBalance(
        supplierId,
        "USD",
      );
      const agencyBalanceAfter = await walletService.getWalletBalance(
        agencyId,
        "USD",
      );

      // Supplier credited
      expect(supplierBalanceAfter).toBe(
        supplierBalanceBefore + settlementAmount,
      );

      // Agency debited (settlement + commission)
      expect(agencyBalanceAfter).toBe(
        agencyBalanceBefore - (settlementAmount + commission),
      );
    });

    it("should be idempotent", async () => {
      const invoiceId = "INV_IDEM_" + Date.now();
      const idempotencyKey = uuidv4();

      const tx1 = await walletService.supplierSettlementFlow({
        supplierId,
        agencyId,
        settlementAmount: 50,
        currency: "USD",
        invoiceId,
        deductedCommission: 5,
        idempotencyKey,
      });

      const tx2 = await walletService.supplierSettlementFlow({
        supplierId,
        agencyId,
        settlementAmount: 50,
        currency: "USD",
        invoiceId,
        deductedCommission: 5,
        idempotencyKey,
      });

      expect(tx1.id).toBe(tx2.id);
    });

    it("should fail if agency insufficient funds", async () => {
      const poorAgencyId = uuidv4();
      await pool.query(
        "INSERT INTO users (id, user_type, email) VALUES ($1, 'agency', 'poor_agency@test.com')",
        [poorAgencyId],
      );
      await walletService.createWallet(poorAgencyId, "USD");

      await expect(
        walletService.supplierSettlementFlow({
          supplierId,
          agencyId: poorAgencyId,
          settlementAmount: 1000,
          currency: "USD",
          invoiceId: "INV_FAIL",
          deductedCommission: 100,
          idempotencyKey: uuidv4(),
        }),
      ).rejects.toThrow(/Insufficient agency funds/);

      await pool.query("DELETE FROM users WHERE id = $1", [poorAgencyId]);
    });

    it("should create ledger entry for commission deduction", async () => {
      const invoiceId = "INV_COMM_" + Date.now();

      const settlementTx = await walletService.supplierSettlementFlow({
        supplierId,
        agencyId,
        settlementAmount: 80,
        currency: "USD",
        invoiceId,
        deductedCommission: 20,
        idempotencyKey: uuidv4(),
      });

      const ledgers = await pool.query(
        "SELECT * FROM ledger_entries WHERE transaction_id = $1",
        [settlementTx.id],
      );

      expect(ledgers.rowCount).toBeGreaterThanOrEqual(2);

      // Find commission ledger entry
      const commissionLedger = ledgers.rows.find((r) =>
        r.account.includes("commission"),
      );
      expect(commissionLedger).toBeDefined();
    });
  });

  describe("End-to-End Purchase + Settlement Flow", () => {
    it("should handle complete purchase and settlement cycle", async () => {
      const bookingId = "BK_E2E_" + Date.now();
      const invoiceId = "INV_E2E_" + Date.now();
      const purchaseAmount = 500;
      const commissionRate = 8;
      const commission = (purchaseAmount * commissionRate) / 100;
      const settlementAmount = purchaseAmount - commission;

      // Get initial balances
      const customerInitial = await walletService.getWalletBalance(
        customerId,
        "USD",
      );
      const agencyInitial = await walletService.getWalletBalance(
        agencyId,
        "USD",
      );
      const supplierInitial = await walletService.getWalletBalance(
        supplierId,
        "USD",
      );

      // Step 1: Customer purchase
      const purchaseResult = await walletService.customerPurchaseFlow({
        customerId,
        agencyId,
        supplierId,
        amount: purchaseAmount,
        currency: "USD",
        bookingId,
        commissionRate,
        idempotencyKey: uuidv4(),
      });

      expect(purchaseResult.customerTx.status).toBe("completed");
      expect(purchaseResult.agencyTx.status).toBe("completed");
      expect(purchaseResult.commissionTx.status).toBe("pending");

      // Verify post-purchase balances
      const customerAfterPurchase = await walletService.getWalletBalance(
        customerId,
        "USD",
      );
      const agencyAfterPurchase = await walletService.getWalletBalance(
        agencyId,
        "USD",
      );

      expect(customerAfterPurchase).toBe(customerInitial - purchaseAmount);
      expect(agencyAfterPurchase).toBe(agencyInitial + purchaseAmount);

      // Step 2: Agency settlement with supplier
      const settlementResult = await walletService.supplierSettlementFlow({
        supplierId,
        agencyId,
        settlementAmount,
        currency: "USD",
        invoiceId,
        deductedCommission: commission,
        idempotencyKey: uuidv4(),
      });

      expect(settlementResult.status).toBe("completed");

      // Verify final balances
      const customerFinal = await walletService.getWalletBalance(
        customerId,
        "USD",
      );
      const agencyFinal = await walletService.getWalletBalance(agencyId, "USD");
      const supplierFinal = await walletService.getWalletBalance(
        supplierId,
        "USD",
      );

      // Customer: reduced by purchase amount
      expect(customerFinal).toBe(customerInitial - purchaseAmount);

      // Agency: received purchase, paid settlement + commission
      expect(agencyFinal).toBe(agencyInitial + commission);

      // Supplier: received settlement amount
      expect(supplierFinal).toBe(supplierInitial + settlementAmount);

      // Net money flow: customer paid 500, supplier got 460, agency got 40
      const totalOut = customerInitial - customerFinal;
      const totalIn =
        supplierFinal - supplierInitial + (agencyFinal - agencyInitial);
      expect(totalOut).toBe(totalIn);
    });
  });
});
