import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.STATIC_DATABASE_URL
});

async function inspectDb() {
    try {
        console.log('Inspecting STATIC_DATABASE_URL...');

        const tables = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        `);
        console.log('\nTables found:', tables.rows.map(r => r.table_name).join(', '));

        const targetTables = ['countries', 'currencies', 'hotel_types', 'hotel_chains', 'cities', 'hotels'];

        for (const table of targetTables) {
            const cols = await pool.query(`
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns 
                WHERE table_name = $1
                ORDER BY ordinal_position;
            `, [table]);

            if (cols.rows.length > 0) {
                console.log(`\nColumns for table '${table}':`);
                cols.rows.forEach(r => console.log(` - ${r.column_name} (${r.data_type}, nullable: ${r.is_nullable})`));
            } else {
                console.log(`\nTable '${table}' not found or has no columns.`);
            }
        }

    } catch (err) {
        console.error('Diagnostic failed:', err.message);
    } finally {
        await pool.end();
    }
}

inspectDb();
