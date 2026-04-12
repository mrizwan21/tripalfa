import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { log } from "@tripalfa/shared-utils/logging";

// Load environment variables from root .env file BEFORE initializing Prisma
const moduleFilename = fileURLToPath(import.meta.url);
const moduleDirname = dirname(moduleFilename);
const rootDir = resolve(moduleDirname, "../../../");
dotenv.config({ path: resolve(rootDir, ".env") });

import { PrismaClient } from "./generated/index.js";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

function createPrismaClient(databaseUrl: string, useSsl: boolean): PrismaClient {
  // Allow strict SSL validation in production via environment variable
  const strictSsl = process.env.DB_SSL_REJECT_UNAUTHORIZED === "true";
  const pool = new Pool({
    connectionString: databaseUrl,
    ...(useSsl
      ? { ssl: { rejectUnauthorized: strictSsl } }
      : {}),
    max: parseInt(process.env.DB_POOL_MAX || "10", 10),
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT_MS || "30000", 10),
    connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT_MS || "10000", 10),
    statement_timeout: parseInt(process.env.DB_STATEMENT_TIMEOUT_MS || "30000", 10),
  });

  const adapter = new PrismaPg(pool);

  // NOTE: Type cast required because PrismaPg adapter returns a client with
  // a different internal type signature than the standard PrismaClient.
  // This is a known pattern when using database adapters with Prisma.
  // The cast is safe because the adapter provides a fully compatible API.
  const isDev = process.env.NODE_ENV !== "production";
  return new PrismaClient({
    adapter,
    log: isDev
      ? ["error", "warn", { emit: "event", level: "query" }]
      : ["error", "warn"],
  }) as unknown as PrismaClient;
}

// Synchronous initialization using proper ESM imports
function initPrisma(): PrismaClient {
  // For Neon with transactions: prefer DIRECT_DATABASE_URL (no pgbouncer)
  // Pgbouncer connections don't support transactions properly
  // STATIC_DATABASE_URL is for static reference data (hotel + flight) via pg.Pool services — never used here
  const databaseUrl =
    process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL;

  if (!databaseUrl) {
    const availableEnvVars = Object.keys(process.env).filter(
      (k) => k.includes("DATABASE") || k.includes("DB") || k.includes("POSTGRES")
    );

    console.error("=".repeat(60));
    console.error("DATABASE CONFIGURATION ERROR");
    console.error("=".repeat(60));
    console.error("\nNo database URL found. Please set one of the following:");
    console.error("  - DIRECT_DATABASE_URL (recommended for Neon)");
    console.error("  - DATABASE_URL (fallback)");
    console.error("\nAvailable environment variables found:");
    console.error(availableEnvVars.length > 0
      ? availableEnvVars.map(v => `  - ${v}`).join("\n")
      : "  (none found)"
    );
    console.error("\nExample .env entry:");
    console.error('  DIRECT_DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"');
    console.error("=".repeat(60));

    throw new Error(
      "Database configuration error: Set DIRECT_DATABASE_URL or DATABASE_URL environment variable. " +
      "See console output above for details.",
    );
  }

  log.database.connect(databaseUrl);

  // For Neon - use standard pg adapter for transaction support
  // Note: NeonPool/PrismaNeon has issues with interactive transactions
  if (databaseUrl.includes("neon.tech") || databaseUrl.includes("neondb")) {
    try {
      log.info("Using PrismaPg adapter for Neon (transaction support)");
      return createPrismaClient(databaseUrl, true);
    } catch (e) {
      log.database.error("Neon client creation", e as Error);
      throw e;
    }
  }

  // For standard PostgreSQL (local, cloud, etc.)
  try {
    return createPrismaClient(databaseUrl, false);
  } catch (e) {
    log.database.error("PostgreSQL client creation", e as Error);
    throw e;
  }
}

export const prisma = globalForPrisma.prisma || initPrisma();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// ============================================
// Graceful Shutdown
// ============================================

async function gracefulShutdown(signal: string) {
  log.info(`Received ${signal}, disconnecting Prisma...`);
  try {
    await prisma.$disconnect();
    log.info("Prisma disconnected cleanly.");
  } catch (e) {
    log.error("Error during disconnect", e as Error);
  }
  process.exit(0);
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// ============================================
// Retry Wrapper for Neon Cold-Start Transients
// ============================================

/**
 * Wraps a database operation with automatic retry logic for transient
 * Neon connection failures (cold-start wake-up takes ~300ms).
 *
 * Retries on:
 *  - XX000: Internal error (Neon compute waking up)
 *  - 57P01: Admin shutdown (connection recycled)
 *  - 08006: Connection failure
 *  - ECONNRESET: TCP reset
 *
 * @param fn - Async function performing the database operation
 * @param retries - Max retry attempts (default: 3)
 * @param delayMs - Base delay in ms, multiplied by attempt number (default: 500)
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delayMs = 500,
): Promise<T> {
  if (retries < 1) {
    return fn();
  }
  
  const RETRYABLE_CODES = new Set(["XX000", "57P01", "08006", "ECONNRESET"]);

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error: unknown) {
      const errCode =
        typeof error === 'object' && error !== null
          ? (error as { code?: string }).code ??
            (error as { message?: string }).message
          : String(error);

      const isRetryable =
        RETRYABLE_CODES.has(errCode) ||
        (typeof errCode === "string" && errCode.includes("ECONNRESET"));

      if (!isRetryable || attempt === retries) {
        throw error;
      }

      const waitMs = delayMs * attempt;
      log.warn(
        `Transient error (${errCode}), retrying in ${waitMs}ms (attempt ${attempt}/${retries})...`,
      );
      await new Promise((r) => setTimeout(r, waitMs));
    }
  }
  
  throw new Error("Retry logic failed unexpectedly");
}

export * from "./generated/index.js";
export { checkDatabaseHealth, type DatabaseHealthResult } from "./health.js";
export default prisma;
