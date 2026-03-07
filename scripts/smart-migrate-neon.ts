import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const { Pool } = pg;

class SmartMigrator {
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

    async migrateCitiesSmartly(): Promise<number> {
        console.log('\n🏙️  Smart Migrating Cities (330K+ records)...');
        let migrated = 0;
        const batchSize = 5000;
        let offset = 0;
        const totalRecords = 535654;

        const neonClient = await this.neonPool.connect();
        const localClient = await this.localPool.connect();

        try {
            while (offset < totalRecords) {
                const result = await neonClient.query(
                    `SELECT id, name, country_code, latitude, longitude FROM cities LIMIT $1 OFFSET $2`,
                    [batchSize, offset]
                );

                if (result.rows.length === 0) break;

                for (const city of result.rows) {
                    try {
                        await localClient.query(
                            `INSERT INTO cities (id, name, country_code, latitude, longitude)
               VALUES ($1, $2, $3, $4, $5)
               ON CONFLICT (id) DO UPDATE SET
                 name = EXCLUDED.name,
                 country_code = EXCLUDED.country_code`,
                            [
                                city.id,
                                city.name,
                                city.country_code,
                                city.latitude,
                                city.longitude
                            ]
                        );
                        migrated++;
                    } catch (e) {
                        // Continue on error
                    }
                }

                offset += batchSize;
                console.log(`   Progress: ${offset}/${totalRecords} (${migrated} inserted)`);
            }
        } finally {
            neonClient.release();
            localClient.release();
        }

        console.log(`✓ Cities: ${migrated} records migrated`);
        return migrated;
    }

    async migrateFacilities(): Promise<number> {
        console.log('\n🛏️  Migrating Facilities...');
        const neonClient = await this.neonPool.connect();
        const localClient = await this.localPool.connect();

        try {
            const result = await neonClient.query(`SELECT id, name FROM hotel_facilities`);

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
            console.log('\n🔄 SMART MIGRATION: NEON → LOCAL PostgreSQL\n');

            const cities = await this.migrateCitiesSmartly();
            const facilities = await this.migrateFacilities();

            console.log('\n✅ MIGRATION COMPLETE!\n');
            console.log(`📊 Data Migrated:`);
            console.log(`   🏙️  Cities: ${cities}`);
            console.log(`   🛏️  Facilities: ${facilities}`);
            console.log(`\n✓ Smart migration finished!\n`);
        } finally {
            await this.neonPool.end();
            await this.localPool.end();
        }
    }
}

const migrator = new SmartMigrator();
migrator.run().catch(console.error);
