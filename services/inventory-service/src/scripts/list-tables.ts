import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } // Assuming Neon or similar cloud DB requires SSL
});

async function listTables() {
    try {
        const res = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        `);

        console.log('Tables found:');
        res.rows.forEach(row => console.log(row.table_name));

        // Also check columns for key tables
        const tablesToCheck = ['City', 'city', 'Hotel', 'hotel', 'Country', 'country'];
        for (const t of tablesToCheck) {
            const cols = await pool.query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = $1;
            `, [t]);

            if (cols.rows.length > 0) {
                console.log(`\nColumns for table '${t}':`);
                cols.rows.forEach(r => console.log(` - ${r.column_name} (${r.data_type})`));
            }
        }

    } catch (err: any) {
        console.error('Error listing tables:', err.message);
    } finally {
        await pool.end();
    }
}

listTables();
