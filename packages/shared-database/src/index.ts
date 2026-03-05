import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

// Load environment variables from root .env file BEFORE initializing Prisma
const moduleFilename = fileURLToPath(import.meta.url);
const moduleDirname = dirname(moduleFilename);
const rootDir = resolve(moduleDirname, "../../../");
dotenv.config({ path: resolve(rootDir, ".env") });

import { PrismaClient } from "@prisma/client";
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
  });

  const adapter = new PrismaPg(pool);

  // NOTE: Type cast required because PrismaPg adapter returns a client with
  // a different internal type signature than the standard PrismaClient.
  // This is a known pattern when using database adapters with Prisma.
  // The cast is safe because the adapter provides a fully compatible API.
  return new PrismaClient({
    adapter,
    log: ["error", "warn"],
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

  console.log("Connecting to database:", databaseUrl.substring(0, 30) + "...");

  // For Neon - use standard pg adapter for transaction support
  // Note: NeonPool/PrismaNeon has issues with interactive transactions
  if (databaseUrl.includes("neon.tech") || databaseUrl.includes("neondb")) {
    try {
      console.log("Using PrismaPg adapter for Neon (transaction support)");
      return createPrismaClient(databaseUrl, true);
    } catch (e) {
      console.error("Failed to create Neon client:", e);
      throw e;
    }
  }

  // For standard PostgreSQL (Docker, local, etc.)
  try {
    return createPrismaClient(databaseUrl, false);
  } catch (e) {
    console.error("Failed to create PostgreSQL client:", e);
    throw e;
  }
}

export const prisma = globalForPrisma.prisma || initPrisma();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export * from "@prisma/client";
export default prisma;
