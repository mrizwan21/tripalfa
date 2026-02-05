/**
 * Ingest Hotelbeds hotels from local JSON file
 * Usage: npx ts-node ingest-hotelbeds-local.ts [limit]
 */
import { Pool } from 'pg';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { HotelbedsImporter } from './hotelbeds-importer';

// Load environment
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const STATIC_DATABASE_URL = process.env.STATIC_DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/staticdatabase';

async function main() {
    const pool = new Pool({ connectionString: STATIC_DATABASE_URL });

    // Find the most recent hotels file
    const dataDir = path.resolve(__dirname, '../../../data/hotelbeds');
    const files = fs.readdirSync(dataDir)
        .filter((f: string) => f.includes('hotel-content-api-1-0-hotels_') && f.endsWith('.json'))
        .sort()
        .reverse();

    if (files.length === 0) {
        console.error('❌ No hotel data files found in data/hotelbeds');
        process.exit(1);
    }

    const latestFile = path.join(dataDir, files[0]);
    console.log(`📁 Using file: ${latestFile}`);

    // Create importer with dummy credentials (not needed for local file)
    const importer = new HotelbedsImporter(pool, [{ apiKey: 'local', secret: 'local' }]);

    // Accept limit from CLI
    const limit = process.argv[2] ? parseInt(process.argv[2]) : undefined;

    try {
        const result = await importer.ingestFromLocalFile(latestFile, limit);
        console.log('📊 Final Result:', result);
    } catch (error: any) {
        console.error('❌ Ingestion failed:', error.message);
    } finally {
        await pool.end();
    }
}

main();
