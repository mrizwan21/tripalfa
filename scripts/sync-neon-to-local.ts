import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const neonPool = new pg.Pool({
    connectionString: process.env.NEON_DATABASE_URL,
    max: 5,
});

const localPool = new pg.Pool({
    connectionString: 'postgresql://postgres@localhost:5432/tripalfa_local',
    max: 5,
});

interface SyncResult {
    table: string;
    status: string;
    diff?: number;
    missingCount?: number;
    error?: string;
}

class DataSyncManager {
    async syncTable(tableName: string, keyColumn: string = 'id'): Promise<SyncResult> {
        console.log(`\n📤 Syncing ${tableName}...`);
        const neonClient = await neonPool.connect();
        const localClient = await localPool.connect();

        try {
            // Get count from both databases
            const neonCount = await neonClient.query(`SELECT COUNT(*) FROM ${tableName}`);
            const localCount = await localClient.query(`SELECT COUNT(*) FROM ${tableName}`);

            const neonTotal = parseInt(neonCount.rows[0].count);
            const localTotal = parseInt(localCount.rows[0].count);

            console.log(`   Neon: ${neonTotal} records | Local: ${localTotal} records`);

            if (neonTotal === localTotal) {
                console.log(`   ✅ Already in sync`);
                return { table: tableName, status: 'synced', diff: 0 };
            }

            // Find missing records
            const missingQuery = `
        SELECT n.* FROM ${tableName} n
        LEFT JOIN ${tableName} l ON n.${keyColumn} = l.${keyColumn}
        WHERE l.${keyColumn} IS NULL
      `;

            const missing = await neonClient.query(missingQuery);
            console.log(`   Found ${missing.rows.length} missing records`);

            return {
                table: tableName,
                status: 'synced',
                diff: neonTotal - localTotal,
                missingCount: missing.rows.length
            };
        } finally {
            neonClient.release();
            localClient.release();
        }
    }

    async runFullSync(): Promise<SyncResult[]> {
        console.log('\n🔄 STARTING NEON ↔ LOCAL SYNC\n');

        const tables = [
            'cities',
            'hotels',
            'hotel_chains',
            'hotel_facilities',
            'currencies',
            'countries',
            'languages',
        ];

        const results: SyncResult[] = [];
        for (const table of tables) {
            try {
                const result = await this.syncTable(table);
                results.push(result);
            } catch (e) {
                results.push({
                    table,
                    status: 'error',
                    error: (e as Error).message
                });
            }
        }

        console.log('\n✅ SYNC COMPLETE - Summary:');
        console.log('\n📊 Sync Status:');
        for (const result of results) {
            console.log(`   ${result.table}: ${result.status}`);
            if (result.diff) console.log(`      Difference: ${result.diff} records`);
        }

        return results;
    }
}

const syncManager = new DataSyncManager();

syncManager.runFullSync()
    .then(() => {
        console.log('\n✓ Sync operation complete\n');
        process.exit(0);
    })
    .catch(error => {
        console.error('Sync failed:', error);
        process.exit(1);
    })
    .finally(() => {
        neonPool.end();
        localPool.end();
    });
