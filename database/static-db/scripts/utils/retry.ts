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
  enableJitter?: boolean;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 5, // Increased from 3
  initialDelayMs: 1000, // Increased from 500ms
  maxDelayMs: 30000, // Increased from 10s to 30s
  backoffMultiplier: 2,
  enableJitter: true, // Add jitter to prevent thundering herd
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
      
      // Calculate delay with jitter
      const baseDelay = Math.min(delayMs * opts.backoffMultiplier, opts.maxDelayMs);
      const jitter = opts.enableJitter ? Math.random() * 1000 : 0;
      const nextDelay = Math.floor(baseDelay + jitter);
      
      log.warn(
        `${context} — attempt ${attempt}/${opts.maxAttempts} failed: ${(err as Error).message}, retry in ${nextDelay}ms`,
      );
      await sleep(nextDelay);
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
