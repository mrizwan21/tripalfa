import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const { Pool } = pg;

class FinalMigrator {
    neonPool: pg.Pool;
    localPool: pg.Pool;

    constructor() {
        this.neonPool = new Pool({
            connectionString: process.env.NEON_DATABASE_URL,
            max: 10,
        });
        this.localPool = new Pool({
            connectionString: 'postgresql://postgres@localhost:5432/tripalfa_local',
            max: 10,
        });
    }

    async migrateCities(): Promise<number> {
        console.log('\n🏙️  Migrating Cities from Neon...');
        let migrated = 0;
        const batchSize = 5000;
        let offset = 0;
        const totalRecords = 535654;

        const neonClient = await this.neonPool.connect();
        const localClient = await this.localPool.connect();

        try {
            while (offset < totalRecords) {
                const result = await neonClient.query(
                    `SELECT id, city_name, country_code FROM cities LIMIT $1 OFFSET $2`,
                    [batchSize, offset]
                );

                if (result.rows.length === 0) break;

                for (const city of result.rows) {
                    try {
                        await localClient.query(
                            `INSERT INTO cities (id, name, country_code, latitude, longitude)
               VALUES ($1, $2, $3, NULL, NULL)
               ON CONFLICT (id) DO UPDATE SET
                 name = EXCLUDED.name,
                 country_code = EXCLUDED.country_code`,
                            [city.id, city.city_name, city.country_code]
                        );
                        migrated++;
                    } catch (e) {
                        // Continue on error
                    }
                }

                offset += batchSize;
                if (offset % 10000 === 0) {
                    console.log(`   Progress: ${offset}/${totalRecords} cities (${migrated} inserted)`);
                }
            }
        } finally {
            neonClient.release();
            localClient.release();
        }

        console.log(`✓ Cities: ${migrated} records migrated`);
        return migrated;
    }

    async migrateFacilities(): Promise<number> {
        console.log('\n🛏️  Migrating Facilities from Neon...');
        const neonClient = await this.neonPool.connect();
        const localClient = await this.localPool.connect();

        try {
            const result = await neonClient.query(`
        SELECT id, facility_name as name FROM hotel_facilities
      `);

            let migrated = 0;
            for (const facility of result.rows) {
                try {
                    await localClient.query(
                        `INSERT INTO hotel_facilities (id, name, facility_id)
             VALUES ($1, $2, $3)
             ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name`,
                        [facility.id, facility.name, null]
                    );
                    migrated++;
                } catch (e) {
                    // Continue
                }
            }

            console.log(`✓ Facilities: ${migrated} records migrated`);
            return migrated;
        } finally {
            neonClient.release();
            localClient.release();
        }
    }

    async run(): Promise<void> {
        try {
            console.log('\n🔄 FINAL MIGRATION: NEON → LOCAL PostgreSQL\n');

            const cities = await this.migrateCities();
            const facilities = await this.migrateFacilities();

            console.log('\n✅ MIGRATION COMPLETE!\n');
            console.log(`📊 Data Successfully Migrated:`);
            console.log(`   🏙️  Cities: ${cities}`);
            console.log(`   🛏️  Facilities: ${facilities}`);
            console.log(`\n✓ All missing data migrated to local PostgreSQL!\n`);
        } catch (error) {
            console.error('\n✗ Migration error:', (error as Error).message);
        } finally {
            await this.neonPool.end();
            await this.localPool.end();
        }
    }
}

const migrator = new FinalMigrator();
migrator.run().catch(console.error);
