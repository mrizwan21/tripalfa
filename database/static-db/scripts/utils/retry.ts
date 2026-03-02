/**
 * retry.ts
 * --------
 * Retry logic with exponential backoff for API calls.
 */

import { createLogger } from "./logger";

const log = createLogger("Retry");

export interface RetryOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  initialDelayMs: 500,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
};

export async function withRetry<T>(
  fn: () => Promise<T>,
  context: string,
  options: RetryOptions = {},
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error | null = null;
  let delayMs = opts.initialDelayMs;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err as Error;
      if (attempt === opts.maxAttempts) {
        break;
      }
      const nextDelay = Math.min(
        delayMs * opts.backoffMultiplier,
        opts.maxDelayMs,
      );
      log.warn(
        `${context} — attempt ${attempt}/${opts.maxAttempts} failed: ${(err as Error).message}, retry in ${delayMs}ms`,
      );
      await sleep(delayMs);
      delayMs = nextDelay;
    }
  }

  throw (
    lastError ||
    new Error(`${context} failed after ${opts.maxAttempts} attempts`)
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
