import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const { Pool } = pg;

const pool = new Pool({
    connectionString: 'postgresql://postgres@localhost:5432/tripalfa_local',
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
});

async function checkDatabaseStructure() {
    console.log('🗄️  Checking Database Structure\n');

    const client = await pool.connect();
    try {
        // Check schemas
        const schemas = await client.query<{ schema_name: string }>(`
            SELECT schema_name 
            FROM information_schema.schemata 
            WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
        `);

        console.log('Available schemas:');
        schemas.rows.forEach(row => console.log(`  - ${row.schema_name}`));

        // Check tables in each schema
        for (const schema of schemas.rows) {
            const tables = await client.query<{ table_name: string }>(`
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = $1
            `, [schema.schema_name]);

            if (tables.rows.length > 0) {
                console.log(`\nTables in ${schema.schema_name}:`);
                tables.rows.forEach(row => console.log(`  - ${row.table_name}`));
            }
        }

        // Check for any hotel-related tables
        const hotelTables = await client.query<{ table_schema: string, table_name: string }>(`
            SELECT table_schema, table_name 
            FROM information_schema.tables 
            WHERE table_name ILIKE '%hotel%'
        `);

        if (hotelTables.rows.length > 0) {
            console.log('\n🏨 Hotel-related tables found:');
            hotelTables.rows.forEach(row => console.log(`  - ${row.table_schema}.${row.table_name}`));
        } else {
            console.log('\n❌ No hotel-related tables found');
        }

        // Check for any tables with 'liteapi' in the name
        const liteapiTables = await client.query<{ table_schema: string, table_name: string }>(`
            SELECT table_schema, table_name 
            FROM information_schema.tables 
            WHERE table_name ILIKE '%liteapi%'
        `);

        if (liteapiTables.rows.length > 0) {
            console.log('\n🔌 LiteAPI-related tables found:');
            liteapiTables.rows.forEach(row => console.log(`  - ${row.table_schema}.${row.table_name}`));
        }

    } finally {
        client.release();
        await pool.end();
    }
}

checkDatabaseStructure().catch(console.error);
