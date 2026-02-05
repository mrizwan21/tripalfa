// jobs/reconciliationJob.ts
// Daily reconciliation: match settlements to transactions, record FX P&L, handle chargebacks

import { pool } from '../config/db.js';
import { logger } from '../utils/logger.js';
import cron from 'node-cron';
import { v4 as uuidv4 } from 'uuid';

const SERVICE_NAME = 'reconciliationJob';

interface ReconciliationResult {
  success: boolean;
  matched: number;
  fxAdjustments: number;
  chargebacks: number;
  unreconciled: number;
}

interface SettlementRow {
  id: string;
  amount: string;
  currency: string;
  total_transaction_base: string;
  variance: string;
}

interface DisputeRow {
  id: string;
  transaction_id: string;
  wallet_id: string;
  amount: string;
  currency: string;
  reason_code: string;
}

/**
 * Main reconciliation flow
 */
async function runReconciliation(): Promise<ReconciliationResult> {
  const startTime = Date.now();
  logger.info(`${SERVICE_NAME}: Starting daily reconciliation`);

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Auto-match settlements to transactions
    const matchedCount = await autoMatchSettlements(client);
    logger.info(`${SERVICE_NAME}: Matched ${matchedCount} settlements to transactions`);

    // 2. Calculate and record FX adjustments
    const fxAdjustmentCount = await processFxAdjustments(client);
    logger.info(`${SERVICE_NAME}: Recorded ${fxAdjustmentCount} FX adjustments`);

    // 3. Process chargebacks
    const chargebackCount = await processChargebacks(client);
    logger.info(`${SERVICE_NAME}: Processed ${chargebackCount} chargebacks`);

    // 4. Flag unreconciled items for manual review
    const unreconciledCount = await flagUnreconciled(client);
    logger.info(`${SERVICE_NAME}: Flagged ${unreconciledCount} items for manual review`);

    await client.query('COMMIT');

    const duration = Date.now() - startTime;
    logger.info(`${SERVICE_NAME}: Reconciliation completed in ${duration}ms`, {
      matched: matchedCount,
      fxAdjustments: fxAdjustmentCount,
      chargebacks: chargebackCount,
      unreconciled: unreconciledCount,
    });

    return {
      success: true,
      matched: matchedCount,
      fxAdjustments: fxAdjustmentCount,
      chargebacks: chargebackCount,
      unreconciled: unreconciledCount,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error(`${SERVICE_NAME}: Reconciliation failed`, err);
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Auto-match settlements to transactions
 * Match by: gateway_reference, amount, currency, and date window
 */
async function autoMatchSettlements(client: any): Promise<number> {
  try {
    const result = await client.query(
      `UPDATE settlements s
       SET reconciliation_status = 'matched'
       WHERE id IN (
         SELECT s.id FROM settlements s
         JOIN transactions t ON (
           s.gateway = t.gateway
           AND s.currency = t.currency
           AND s.amount = t.amount
           AND ABS(EXTRACT(EPOCH FROM (s.settled_at - t.created_at))) < 86400 * 3
         )
         WHERE s.reconciliation_status = 'unmatched'
       )
       RETURNING id`
    );

    // Create mapping records
    for (const settlement of result.rows) {
      await client.query(
        `INSERT INTO settlement_transaction_mappings (
          settlement_id, transaction_id, mapping_type
         ) SELECT $1, t.id, 'primary'
         FROM transactions t
         JOIN settlements s ON (
           s.gateway = t.gateway
           AND s.currency = t.currency
           AND s.amount = t.amount
         )
         WHERE s.id = $1
         AND NOT EXISTS (
           SELECT 1 FROM settlement_transaction_mappings
           WHERE settlement_id = s.id AND transaction_id = t.id
         )`,
        [settlement.id]
      );
    }

    return result.rows.length;
  } catch (err) {
    logger.error(`${SERVICE_NAME}: autoMatchSettlements failed`, err);
    throw err;
  }
}

/**
 * Process FX adjustments for matched settlements
 * If settlement.amount (in base) differs from transaction.base_amount,
 * record FX gain/loss
 */
async function processFxAdjustments(client: any): Promise<number> {
  try {
    // Get matched settlements with FX variance
    const result = await client.query(
      `SELECT DISTINCT
        s.id, s.amount, s.currency,
        SUM(t.base_amount) as total_transaction_base,
        (s.amount - SUM(t.base_amount)) as variance
       FROM settlements s
       LEFT JOIN settlement_transaction_mappings m ON s.id = m.settlement_id
       LEFT JOIN transactions t ON m.transaction_id = t.id
       WHERE s.reconciliation_status = 'matched'
       AND s.status = 'completed'
       GROUP BY s.id, s.amount, s.currency
       HAVING ABS(s.amount - SUM(t.base_amount)) > 0.01`
    );

    for (const row of result.rows) {
      const variance = parseFloat(row.variance);
      const adjustmentType = variance > 0 ? 'gain' : 'loss';
      const adjustmentAmount = Math.abs(variance);

      logger.info(
        `${SERVICE_NAME}: Recording FX ${adjustmentType} for settlement ${row.id}: ${adjustmentAmount} ${row.currency}`
      );

      // Create FX adjustment ledger entry
      await client.query(
        `INSERT INTO fx_adjustments (
          settlement_id, adjustment_type, amount, currency, description
         ) VALUES (
          $1, $2, $3, $4, $5
         )`,
        [
          row.id,
          adjustmentType,
          adjustmentAmount,
          row.currency,
          `FX ${adjustmentType}: settlement variance`,
        ]
      );
    }

    return result.rows.length;
  } catch (err) {
    logger.error(`${SERVICE_NAME}: processFxAdjustments failed`, err);
    throw err;
  }
}

/**
 * Process chargebacks and disputes
 */
async function processChargebacks(client: any): Promise<number> {
  try {
    // Find disputes with lost status that haven't been processed
    const result = await client.query(
      `SELECT d.*, t.wallet_id, t.amount, t.currency
       FROM disputes d
       JOIN transactions t ON d.transaction_id = t.id
       WHERE d.status = 'lost'
       AND NOT d.processed_at
       ORDER BY d.created_at ASC`
    );

    for (const dispute of result.rows) {
      logger.info(
        `${SERVICE_NAME}: Processing lost chargeback ${dispute.id} for transaction ${dispute.transaction_id}`
      );

      // 1. Reverse the original transaction
      const reversalTxId = uuidv4();
      await client.query(
        `INSERT INTO transactions (
          id, wallet_id, type, amount, currency, status, created_at, updated_at
         ) VALUES (
          $1, $2, $3, $4, $5, $6, now(), now()
         )`,
        [
          reversalTxId,
          dispute.wallet_id,
          'reversal',
          parseFloat(dispute.amount),
          dispute.currency,
          'completed',
        ]
      );

      // 2. Debit wallet for chargeback amount
      await client.query(
        `UPDATE wallets SET balance = balance - $1, updated_at = now()
         WHERE id = $2`,
        [parseFloat(dispute.amount), dispute.wallet_id]
      );

      // 3. Create ledger entries for chargeback
      await client.query(
        `INSERT INTO ledger_entries (
          transaction_id, account, debit, credit, currency, description, created_at
         ) VALUES (
          $1, $2, $3, $4, $5, $6, now()
         )`,
        [
          reversalTxId,
          `chargebacks:${dispute.currency}`,
          parseFloat(dispute.amount),
          0,
          dispute.currency,
          `Chargeback: ${dispute.reason_code}`,
        ]
      );

      // 4. Mark dispute as processed
      await client.query(
        `UPDATE disputes SET processed_at = now() WHERE id = $1`,
        [dispute.id]
      );
    }

    return result.rows.length;
  } catch (err) {
    logger.error(`${SERVICE_NAME}: processChargebacks failed`, err);
    throw err;
  }
}

/**
 * Flag unreconciled items older than 3 days for manual review
 */
async function flagUnreconciled(client: any): Promise<number> {
  try {
    const result = await client.query(
      `UPDATE settlements
       SET reconciliation_status = 'disputed'
       WHERE reconciliation_status = 'unmatched'
       AND created_at < now() - INTERVAL '3 days'
       RETURNING id`
    );

    if (result.rows.length) {
      logger.warn(
        `${SERVICE_NAME}: ${result.rows.length} unreconciled settlements flagged for manual review`
      );
    }

    return result.rows.length;
  } catch (err) {
    logger.error(`${SERVICE_NAME}: flagUnreconciled failed`, err);
    throw err;
  }
}

/**
 * Schedule reconciliation to run daily at 2 AM UTC
 */
function scheduleReconciliation(): void {
  logger.info(`${SERVICE_NAME}: Scheduling daily reconciliation at 02:00 UTC`);

  cron.schedule('0 2 * * *', async () => {
    try {
      await runReconciliation();
    } catch (err) {
      logger.error(`${SERVICE_NAME}: Scheduled job failed`, err);
      // Alert ops
    }
  });

  logger.info(`${SERVICE_NAME}: Reconciliation job scheduled`);
}

/**
 * Manual trigger (for testing/on-demand)
 */
async function triggerNow(): Promise<void> {
  try {
    const result = await runReconciliation();
    console.log('✓ Reconciliation completed:', result);
    process.exit(0);
  } catch (err) {
    console.error('✗ Reconciliation failed:', err);
    process.exit(1);
  }
}

// ============================================================================
// ENTRY POINT
// ============================================================================

if (process.argv[2] === '--now') {
  triggerNow();
} else {
  scheduleReconciliation();
  logger.info(`${SERVICE_NAME}: Job scheduler running. Press Ctrl+C to exit.`);
}

export { runReconciliation, scheduleReconciliation, triggerNow };
