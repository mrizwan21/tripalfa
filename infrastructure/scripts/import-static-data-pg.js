#!/usr/bin/env node

/**
 * Import full dataset from Innstant Travel Static Data API to local PostgreSQL using pg client
 */

import pg from 'pg';
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

async function fetchInnstantData(endpoint) {
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
        console.error(`✗ Failed to fetch ${endpoint}:`, error.message);
        return null;
    }
}

async function main() {
    try {
        console.log('🚀 Starting Data Import...');
        await client.connect();
        console.log('🔗 Connected to Postgres');

        for (const { name, endpoint, table } of ENDPOINTS) {
            console.log(`📦 Processing ${name}...`);
            const data = await fetchInnstantData(endpoint);
            if (!data) continue;

            // Extract array based on key (airports, airlines, etc)
            const key = name.replace('-', '_');
            const items = data[name] || data[key] || [];

            if (!Array.isArray(items)) {
                console.log(`⚠️ No array found for ${name}`);
                continue;
            }

            console.log(`💾 Importing ${items.length} records into ${table}...`);

            // Clear existing data
            await client.query(`DELETE FROM ${table}`);

            for (const item of items) {
                try {
                    if (table === 'airports') {
                        await client.query(
                            'INSERT INTO airports (iata_code, icao_code, name, city, country, country_code, latitude, longitude, timezone) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) ON CONFLICT (iata_code) DO NOTHING',
                            [item.iata_code || item.code, item.icao_code, item.name || item.airport_name, item.city || item.city_name, item.country || item.country_name, item.country_code, item.latitude, item.longitude, item.timezone]
                        );
                    } else if (table === 'airlines') {
                        await client.query(
                            'INSERT INTO airlines (iata_code, icao_code, name, country, logo_url, website, alliance) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (iata_code) DO NOTHING',
                            [item.iata_code || item.code, item.icao_code, item.name || item.airline_name, item.country, item.logo_url, item.website, item.alliance]
                        );
                    } else if (table === 'nationalities') {
                        await client.query(
                            'INSERT INTO nationalities (code, name, country) VALUES ($1, $2, $3) ON CONFLICT (code) DO NOTHING',
                            [item.code, item.name, item.name]
                        );
                    } else if (table === 'currencies') {
                        await client.query(
                            'INSERT INTO currencies (code, name, symbol) VALUES ($1, $2, $3) ON CONFLICT (code) DO NOTHING',
                            [item.code, item.name, item.symbol]
                        );
                    } else if (table === 'loyalty_programs') {
                        await client.query(
                            'INSERT INTO loyalty_programs (name, code, airline_id) VALUES ($1, $2, $3) ON CONFLICT (code) DO NOTHING',
                            [item.name, item.id || item.code, item.owner_airline_id]
                        );
                    }
                } catch (e) {
                    // Skip individual errors
                }
            }
            console.log(`✅ Finished ${name}`);
        }

        console.log('🎉 Import completed successfully!');
    } catch (error) {
        console.error('💥 Import failed:', error);
    } finally {
        await client.end();
    }
}

main();
