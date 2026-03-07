import "dotenv/config";
import { defineConfig, env } from "@prisma/config";

// Get database URL with runtime validation (not at import time)
// This allows the config to load in environments where env vars may not be set yet
function getDatabaseUrl(): string {
    const dbUrl =
        env("DIRECT_DATABASE_URL") ||
        env("DATABASE_URL") ||
        env("DIRECT_NEON_DATABASE_URL") ||
        env("NEON_DATABASE_URL");

    if (!dbUrl) {
        throw new Error(
            "No database URL configured. Please set one of: DIRECT_DATABASE_URL, DATABASE_URL, DIRECT_NEON_DATABASE_URL, or NEON_DATABASE_URL"
        );
    }

    return dbUrl;
}

export default defineConfig({
    schema: "database/prisma/schema.prisma",
    migrations: {
        path: "database/prisma/migrations",
    },
    datasource: {
        // Application DB only (Neon/PostgreSQL). Never route Prisma to STATIC_DATABASE_URL.
        // Validation happens at runtime when Prisma actually connects
        url: getDatabaseUrl(),
    },
});
