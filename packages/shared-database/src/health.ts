import { type PrismaClient } from "./generated/index.js";

/**
 * Database health check result.
 * Used by service `/health` endpoints to monitor Neon connectivity.
 */
export interface DatabaseHealthResult {
    status: "healthy" | "degraded" | "unhealthy";
    latencyMs: number;
    timestamp: string;
    details?: string;
}

/**
 * Performs a lightweight health check against the Neon database.
 *
 * Executes `SELECT 1` to measure round-trip latency and categorises:
 *  - healthy:   latency < 100ms
 *  - degraded:  latency 100–500ms (Neon cold-start)
 *  - unhealthy: latency > 500ms or connection failure
 *
 * @param client - The PrismaClient instance to check (avoids circular import)
 */
export async function checkDatabaseHealth(
    client: PrismaClient,
): Promise<DatabaseHealthResult> {
    const start = performance.now();

    try {
        await client.$queryRaw`SELECT 1`;
        const latencyMs = Math.round(performance.now() - start);

        let status: DatabaseHealthResult["status"] = "healthy";
        let details: string | undefined;

        if (latencyMs > 500) {
            status = "unhealthy";
            details = `High latency: ${latencyMs}ms (threshold: 500ms)`;
        } else if (latencyMs > 100) {
            status = "degraded";
            details = `Elevated latency: ${latencyMs}ms (possible Neon cold-start)`;
        }

        return {
            status,
            latencyMs,
            timestamp: new Date().toISOString(),
            details,
        };
    } catch (error: unknown) {
        const latencyMs = Math.round(performance.now() - start);
        const message =
            error instanceof Error ? error.message : "Unknown database error";

        return {
            status: "unhealthy",
            latencyMs,
            timestamp: new Date().toISOString(),
            details: `Connection failed: ${message}`,
        };
    }
}
