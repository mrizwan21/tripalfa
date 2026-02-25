/**
 * seed.ts
 * ------------------------------------
 * Main orchestrator for the static DB sync pipeline.
 *
 * Run order (dependency chain):
 *   1. sync-exchange-rates  — populates shared.currencies ROEs
 *   2. sync-liteapi         — needs currencies + countries
 *   3. sync-duffel          — needs countries for FK consistency
 *
 * Usage:
 *   npx ts-node scripts/seed.ts               # full sync
 *   npx ts-node scripts/seed.ts --only=rates  # exchange rates only
 *   npx ts-node scripts/seed.ts --only=liteapi
 *   npx ts-node scripts/seed.ts --only=duffel
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { closePool } from './utils/db';
import { createLogger } from './utils/logger';
import { syncExchangeRates } from './sync-exchange-rates';
import { syncLiteAPI } from './sync-liteapi';
import { syncDuffel } from './sync-duffel';

const log = createLogger('Seed');

// ---- CLI arg parsing -------------------------------------------

function parseArgs(): { only?: 'rates' | 'liteapi' | 'duffel' } {
  const onlyArg = process.argv.find((a) => a.startsWith('--only='));
  if (onlyArg) {
    const val = onlyArg.split('=')[1] as 'rates' | 'liteapi' | 'duffel';
    if (!['rates', 'liteapi', 'duffel'].includes(val)) {
      console.error(`Unknown --only value: "${val}". Must be rates | liteapi | duffel`);
      process.exit(1);
    }
    return { only: val };
  }
  return {};
}

// ---- Timer util ------------------------------------------------

function formatMs(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60_000)}m ${Math.round((ms % 60_000) / 1000)}s`;
}

// ---- Main ------------------------------------------------------

async function main(): Promise<void> {
  const { only } = parseArgs();
  const startAll = Date.now();

  log.info(`Static DB seed starting${only ? ` (--only=${only})` : ''}`);
  log.info('─'.repeat(50));

  const steps: Array<{ label: string; fn: () => Promise<void>; key: string }> = [
    { label: 'Exchange Rates (OER)', key: 'rates',   fn: syncExchangeRates },
    { label: 'LiteAPI (hotels)',     key: 'liteapi', fn: syncLiteAPI },
    { label: 'Duffel (flights)',     key: 'duffel',  fn: syncDuffel },
  ];

  const results: Array<{ label: string; durationMs: number; status: 'ok' | 'error'; error?: string }> = [];

  for (const step of steps) {
    if (only && step.key !== only) continue;

    const t0 = Date.now();
    log.info(`\n▶  ${step.label}`);
    try {
      await step.fn();
      const durationMs = Date.now() - t0;
      results.push({ label: step.label, durationMs, status: 'ok' });
      log.success(`✓  ${step.label}  [${formatMs(durationMs)}]`);
    } catch (err) {
      const durationMs = Date.now() - t0;
      const errMsg = (err as Error).message;
      results.push({ label: step.label, durationMs, status: 'error', error: errMsg });
      log.error(`✗  ${step.label}  [${formatMs(durationMs)}]: ${errMsg}`);
    }
  }

  // Summary table
  const totalMs = Date.now() - startAll;
  log.info('\n' + '─'.repeat(50));
  log.info('SYNC SUMMARY');
  log.info('─'.repeat(50));
  for (const r of results) {
    const icon = r.status === 'ok' ? '✅' : '❌';
    log.info(`${icon}  ${r.label.padEnd(30)} ${formatMs(r.durationMs)}`);
    if (r.error) log.info(`   Error: ${r.error}`);
  }
  log.info('─'.repeat(50));
  log.info(`Total time: ${formatMs(totalMs)}`);

  const failed = results.filter((r) => r.status === 'error');
  if (failed.length) {
    log.error(`${failed.length} step(s) failed`);
    process.exit(1);
  }
}

main()
  .then(() => closePool())
  .catch((err: unknown) => {
    log.error((err as Error).message);
    closePool().finally(() => process.exit(1));
  });
