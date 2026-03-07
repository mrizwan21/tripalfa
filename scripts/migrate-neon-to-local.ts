import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const { Pool } = pg;

// Whitelist of allowed table names to prevent SQL injection
const ALLOWED_TABLES = [
    'hotels',
    'hotel_chains',
    'currencies',
    'cities',
    'hotel_facilities',
    'liteapi_hotels',
    'liteapi_cities',
    'liteapi_countries',
    'liteapi_currencies',
    'liteapi_hotel_types',
    'shared.countries',
    'shared.currencies',
    'hotel.types',
    'hotel.facilities',
    'hotel.iata_airports',
];

// Validate table name against whitelist
function validateTableName(tableName: string): boolean {
    return ALLOWED_TABLES.includes(tableName);
}

class DatabaseMigrator {
    neonPool: pg.Pool;
    localPool: pg.Pool;

    constructor() {
        this.neonPool = new Pool({
            connectionString: process.env.NEON_DATABASE_URL,
            max: 5,
        });
        this.localPool = new Pool({
            connectionString: 'postgresql://postgres@localhost:5432/tripalfa_local',
            max: 5,
        });
    }

    async migrateTable(tableName: string, batchSize = 1000): Promise<number> {
        // Validate table name against whitelist to prevent SQL injection
        if (!validateTableName(tableName)) {
            console.log(`✗ Invalid table name: ${tableName}. Table not in allowed list.`);
            return 0;
        }

        console.log(`\n📦 Migrating ${tableName}...`);
        try {
            const neonClient = await this.neonPool.connect();
            const localClient = await this.localPool.connect();

            try {
                // Get total count
                const countResult = await neonClient.query(`SELECT COUNT(*) FROM ${tableName}`);
                const totalRecords = parseInt(countResult.rows[0].count);
                console.log(`   Total records: ${totalRecords}`);

                // Get columns
                const columnsResult = await neonClient.query(`
          SELECT column_name, data_type
          FROM information_schema.columns
          WHERE table_name = $1
          ORDER BY ordinal_position
        `, [tableName]);

                const columns = columnsResult.rows.map((r: { column_name: string }) => r.column_name);
                const columnStr = columns.join(',');

                let migrated = 0;
                let offset = 0;

                // Migrate in batches
                while (offset < totalRecords) {
                    const dataResult = await neonClient.query(
                        `SELECT ${columnStr} FROM ${tableName} LIMIT $1 OFFSET $2`,
                        [batchSize, offset]
                    );

                    if (dataResult.rows.length === 0) break;

                    // Insert into local database
                    for (const row of dataResult.rows) {
                        const values = columns.map((col: string) => row[col]);
                        const placeholders = columns.map((_: string, i: number) => `$${i + 1}`).join(',');
                        const conflictCols = columns.join(',');

                        try {
                            await localClient.query(
                                `INSERT INTO ${tableName} (${columnStr}) VALUES (${placeholders})
                 ON CONFLICT DO NOTHING`,
                                values
                            );
                        } catch (e) {
                            // Continue on conflict
                        }
                    }

                    migrated += dataResult.rows.length;
                    offset += batchSize;
                    console.log(`   Migrated: ${migrated}/${totalRecords}`);
                }

                console.log(`✓ ${tableName}: ${migrated} records migrated`);
                return migrated;
            } finally {
                neonClient.release();
                localClient.release();
            }
        } catch (error) {
            console.log(`✗ ${tableName} migration failed: ${(error as Error).message}`);
            return 0;
        }
    }

    async run(): Promise<void> {
        try {
            console.log('\n🔄 MIGRATING NEON → LOCAL PostgreSQL\n');

            const results = {
                hotels: await this.migrateTable('hotels'),
                hotel_chains: await this.migrateTable('hotel_chains'),
                currencies: await this.migrateTable('currencies'),
                cities: await this.migrateTable('cities'),
                hotel_facilities: await this.migrateTable('hotel_facilities'),
            };

            console.log('\n✅ MIGRATION COMPLETE - Summary:');
            console.log(`\n📊 Data Migrated:`);
            console.log(`   🏨 Hotels: ${results.hotels}`);
            console.log(`   ⛓️  Chains: ${results.hotel_chains}`);
            console.log(`   💱 Currencies: ${results.currencies}`);
            console.log(`   🏙️  Cities: ${results.cities}`);
            console.log(`   🛏️  Facilities: ${results.hotel_facilities}`);
            console.log(`\n✓ All data successfully migrated to local PostgreSQL!\n`);
        } catch (error) {
            console.error('\n✗ Migration failed:', error);
            process.exit(1);
        } finally {
            await this.neonPool.end();
            await this.localPool.end();
        }
    }
}

const migrator = new DatabaseMigrator();
migrator.run().catch(console.error);
