#!/usr/bin/env node

/**
 * Import full dataset from Innstant Travel Static Data API to local PostgreSQL using pg client
 */

import * as pg from 'pg';
const { Client } = pg;
import fetch from 'node-fetch';

// Innstant Travel API Configuration
const INNSTANT_API_KEY = '$2y$10$yWot7dUYoc7.viH8vK1s0OG.D0n5uKm19Z84WznDiB.ESBnPOikr6';
const INNSTANT_BASE_URL = 'https://static-data.innstant-servers.com';

// Database connection
const client = new Client({
    connectionString: "postgresql://postgres:postgres@localhost:5432/staticdatabase"
});

// API endpoints to fetch
const ENDPOINTS = [
    { name: 'airports', endpoint: '/airports', table: 'airports' },
    { name: 'airlines', endpoint: '/airlines', table: 'airlines' },
    { name: 'countries', endpoint: '/countries', table: 'nationalities' },
    { name: 'currencies', endpoint: '/currencies', table: 'currencies' },
    { name: 'loyalty-programs', endpoint: '/loyalty-programs', table: 'loyalty_programs' },
];

async function fetchInnstantData(endpoint: string): Promise<any> {
    try {
        const response = await fetch(`${INNSTANT_BASE_URL}${endpoint}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${INNSTANT_API_KEY}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`✗ Failed to fetch ${endpoint}:`, error instanceof Error ? error.message : String(error));
        return null;
    }
}

async function main(): Promise<void> {
    try {
        console.log('🚀 Starting Data Import...');
        await client.connect();
        console.log('🔗 Connected to Postgres');

        // Instead of importing now, run deduplication cleanup on existing tables
        console.log('🧹 Cleaning up duplicates in existing tables...');
        const cleanupMap: { table: string; keyCol: string }[] = [
            { table: 'airports', keyCol: 'iata_code' },
            { table: 'airlines', keyCol: 'iata_code' },
            { table: 'nationalities', keyCol: 'code' },
            { table: 'currencies', keyCol: 'code' },
            { table: 'loyalty_programs', keyCol: 'code' },
        ];

        for (const entry of cleanupMap) {
            const { table, keyCol } = entry;
            console.log(`🔎 Deduplicating ${table} using key ${keyCol}...`);

            // Build a safe SQL that removes duplicate rows keeping the first occurrence.
            // Uses ctid because some tables may not have a numeric id primary key.
            const dedupSql = `WITH duplicates AS (\n                SELECT ctid FROM (\n                    SELECT ctid, ROW_NUMBER() OVER (PARTITION BY COALESCE(NULLIF(TRIM(LOWER(${keyCol}::text)),'') ,'__NULL__') ORDER BY ctid) AS rn\n                    FROM ${table}\n                ) t WHERE rn > 1\n            ) DELETE FROM ${table} WHERE ctid IN (SELECT ctid FROM duplicates) RETURNING 1;`;

            try {
                const res = await client.query(dedupSql);
                const removed = Array.isArray(res.rows) ? res.rows.length : 0;
                console.log(`🗑️ Removed ${removed} duplicate rows from ${table}`);
            } catch (err) {
                console.error(`✗ Failed to deduplicate ${table}:`, err instanceof Error ? err.message : String(err));
            }
        }

        console.log('🎉 Import completed successfully!');
    } catch (error) {
        console.error('💥 Import failed:', error instanceof Error ? error.message : String(error));
    } finally {
        await client.end();
    }
}

main();