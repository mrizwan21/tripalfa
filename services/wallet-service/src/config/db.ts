// src/config/db.ts
// Re-export the shared singleton PrismaClient from @tripalfa/shared-database
// This ensures all services share the same Neon connection pool.

export { prisma } from "@tripalfa/shared-database";
export { prisma as default } from "@tripalfa/shared-database";
