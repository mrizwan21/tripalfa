import axios from "axios";
import { Pool, PoolConfig } from "pg";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, "../../../../.env") });

const IPAPI_KEY = process.env.IPAPI_API_KEY;
const STATIC_DATABASE_URL = process.env.STATIC_DATABASE_URL || "postgresql://postgres@localhost:5432/staticdatabase";

async function initIpLocationsTable(client: any) {
    console.log("🏗️ Initializing hotel.ip_locations table...");
    await client.query(`
        CREATE SCHEMA IF NOT EXISTS hotel;
        CREATE TABLE IF NOT EXISTS hotel.ip_locations (
            ip VARCHAR(45) PRIMARY KEY,
            city VARCHAR(100),
            region VARCHAR(100),
            country VARCHAR(100),
            country_code CHAR(2),
            timezone VARCHAR(50),
            utc_offset VARCHAR(10),
            latitude DECIMAL(10, 8),
            longitude DECIMAL(11, 8),
            currency VARCHAR(10),
            languages VARCHAR(100),
            metadata JSONB,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_ip_locations_updated ON hotel.ip_locations(updated_at);
    `);
    console.log("✅ Table hotel.ip_locations initialized.");
}

async function main() {
    const poolConfig: PoolConfig = {
        connectionString: STATIC_DATABASE_URL,
    };

    const pool = new Pool(poolConfig);

    try {
        const client = await pool.connect();
        await initIpLocationsTable(client);
        client.release();
        console.log("🚀 IP Locations initialization complete.");
    } catch (error: any) {
        console.error("❌ Failed to initialize IP locations:", error.message);
    } finally {
        await pool.end();
    }
}

main();
