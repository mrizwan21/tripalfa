import fetch from 'node-fetch';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const { Pool } = pg;

const pool = new Pool({
    connectionString: 'postgresql://postgres@localhost:5432/tripalfa_local',
    max: 5,
});

const BASE_URL = 'https://api.liteapi.travel/v3.0/data';

async function createTables(): Promise<void> {
    const client = await pool.connect();
    try {
        await client.query(`
      CREATE TABLE IF NOT EXISTS languages (
        code TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

        await client.query(`
      CREATE TABLE IF NOT EXISTS countries (
        code TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

        console.log('✓ Tables created/verified');
    } finally {
        client.release();
    }
}

class LiteAPIImporter {
    async importLanguages(): Promise<number> {
        console.log('\n🌐 Importing Languages...');
        try {
            const response = await fetch(`${BASE_URL}/languages`, {
                headers: {
                    'X-API-Key': process.env.LITEAPI_API_KEY || '',
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            console.log(`   Raw response keys: ${Object.keys(data).join(', ')}`);

            const languages = data.data || [];
            console.log(`   Found ${languages.length} languages`);

            if (languages.length === 0) {
                console.log('ℹ️  No language data available');
                return 0;
            }

            const client = await pool.connect();
            try {
                let imported = 0;
                for (const lang of languages) {
                    try {
                        await client.query(
                            `INSERT INTO languages (code, name)
               VALUES ($1, $2)
               ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name`,
                            [lang.code, lang.name]
                        );
                        imported++;
                    } catch (e) {
                        console.log(`   Error inserting ${lang.code}: ${(e as Error).message}`);
                    }
                }
                console.log(`✓ Imported ${imported} languages`);
                return imported;
            } finally {
                client.release();
            }
        } catch (error) {
            console.log(`✗ Languages import failed: ${(error as Error).message}`);
            return 0;
        }
    }

    async importCountries(): Promise<number> {
        console.log('\n🌍 Importing Countries...');
        try {
            const response = await fetch(`${BASE_URL}/countries`, {
                headers: {
                    'X-API-Key': process.env.LITEAPI_API_KEY || '',
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            console.log(`   Raw response keys: ${Object.keys(data).join(', ')}`);

            const countries = data.data || [];
            console.log(`   Found ${countries.length} countries`);

            if (countries.length === 0) {
                console.log('ℹ️  No country data available');
                return 0;
            }

            const client = await pool.connect();
            try {
                let imported = 0;
                for (const country of countries) {
                    try {
                        await client.query(
                            `INSERT INTO countries (code, name)
               VALUES ($1, $2)
               ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name`,
                            [country.code, country.name]
                        );
                        imported++;
                    } catch (e) {
                        console.log(`   Error inserting ${country.code}: ${(e as Error).message}`);
                    }
                }
                console.log(`✓ Imported ${imported} countries`);
                return imported;
            } finally {
                client.release();
            }
        } catch (error) {
            console.log(`✗ Countries import failed: ${(error as Error).message}`);
            return 0;
        }
    }

    async run(): Promise<void> {
        try {
            console.log('\n🌐 IMPORTING REMAINING LiteApi static DATA\n');

            await createTables();

            const results = {
                languages: await this.importLanguages(),
                countries: await this.importCountries(),
            };

            console.log('\n✅ IMPORT COMPLETE - Summary:');
            console.log(`\n📊 Data Imported:`);
            console.log(`   🌐 Languages: ${results.languages}`);
            console.log(`   🌍 Countries: ${results.countries}`);
            console.log(`\n✓ Available LiteAPI static data imported successfully!\n`);
        } catch (error) {
            console.error('\n✗ Import failed:', error);
        } finally {
            await pool.end();
        }
    }
}

const importer = new LiteAPIImporter();
importer.run().catch(console.error);
