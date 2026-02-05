#!/usr/bin/env node

const INNSTANT_API_KEY = '$2y$10$yWot7dUYoc7.viH8vK1s0OG.D0n5uKm19Z84WznDiB.ESBnPOikr6';
const INNSTANT_BASE_URL = 'https://static-data.innstant-servers.com';

async function testFetch() {
    const endpoint = '/airports';
    try {
        const response = await fetch(`${INNSTANT_BASE_URL}${endpoint}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${INNSTANT_API_KEY}`,
                'Content-Type': 'application/json',
            },
        });

        const data = await response.json();
        process.stderr.write(`DEBUG: Data keys: ${Object.keys(data).join(', ')}\n`);
        if (Array.isArray(data)) {
            process.stderr.write(`DEBUG: Data is an array with ${data.length} items\n`);
        } else if (data.airports) {
            process.stderr.write(`DEBUG: airports key is an array with ${data.airports.length} items\n`);
        } else {
            process.stderr.write(`DEBUG: Full data sample: ${JSON.stringify(data).substring(0, 500)}\n`);
        }
    } catch (error) {
        process.stderr.write(`ERROR: ${error.message}\n`);
    }
}

testFetch();
