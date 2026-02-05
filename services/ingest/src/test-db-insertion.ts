import { enrichHotel } from './giata-importer';
import { Pool } from 'pg';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const STATIC_DATABASE_URL = process.env.STATIC_DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/staticdatabase';

const pool = new Pool({
    connectionString: STATIC_DATABASE_URL,
});

async function testActualInsertion() {
    console.log('--- Testing Actual Insertion for Hotel 119193 ---');
    try {
        await enrichHotel('119193', 'Solomons Inn Resort + Marina');
        console.log('✅ Insertion logic executed.');

        const res = await pool.query('SELECT name, giata_room_id, room_class, confidence_score, features FROM hotel_room_types WHERE hotel_id IN (SELECT id FROM hotels WHERE external_id = $1)', ['119193']);
        console.log(`🏨 Found ${res.rowCount} rooms in database:`);
        res.rows.forEach(r => {
            console.log(`  - ${r.name} (ID: ${r.giata_room_id}) | Class: ${r.room_class} | Score: ${r.confidence_score} | Features: ${r.features}`);
        });
    } catch (error: any) {
        console.error('❌ Failed:', error.message);
    } finally {
        await pool.end();
    }
}

testActualInsertion();
