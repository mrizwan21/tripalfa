import { queryRealtime } from '../../db-connector/src';
import fetch from 'node-fetch';

// Simple alert rule evaluator: rules stored in table `alert_rules` with columns (id, name, sql, endpoint)
// This service periodically loads rules and evaluates the associated SQL against realtime DB. If any row returned, it posts to endpoint.

const POLL_INTERVAL = Number(process.env.POLL_INTERVAL_MS || 10000);

async function loadRules() {
  const res = await queryRealtime('SELECT id, name, sql, endpoint FROM alert_rules');
  return res.rows || [];
}

async function evalRule(rule: any) {
  try {
    const rows = await queryRealtime(rule.sql);
    if (rows.rowCount && rule.endpoint) {
      await fetch(rule.endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ruleId: rule.id, name: rule.name, rows: rows.rows })
      });
    }
  } catch (err) {
    console.error('evalRule error', err);
  }
}

async function run() {
  while (true) {
    try {
      const rules = await loadRules();
      for (const r of rules) {
        await evalRule(r);
      }
    } catch (err) {
      console.error('alerts loop error', err);
    }
    await new Promise((r) => setTimeout(r, POLL_INTERVAL));
  }
}

run().catch((e) => {
  console.error('alerts fatal', e);
  process.exit(1);
});
