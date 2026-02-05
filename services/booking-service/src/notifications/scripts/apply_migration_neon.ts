import fs from 'fs/promises';
import { Client } from 'pg';

async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL || process.env.PG_CONN;
  if (!databaseUrl) {
    console.error('DATABASE_URL or PG_CONN must be set to your Neon connection string.');
    process.exit(2);
  }

  const sqlPath = new URL('../../../../database/migrations/20260129_create_notifications_table.sql', import.meta.url).pathname;
  const sql = await fs.readFile(sqlPath, 'utf8');

  const useNeon = (process.env.USE_NEON === 'true') || (process.env.PGSSLMODE === 'require') || databaseUrl.includes('neon');

  // Default: verify TLS. To explicitly disable verification (not recommended), set PG_SSL_NO_VERIFY=1.
  let ssl: boolean | { rejectUnauthorized: boolean } = false;
  if (useNeon) {
    if (process.env.PG_SSL_NO_VERIFY === '1') {
      // explicit opt-in to bypass verification (dangerous for production)
       
      console.warn('Warning: PG_SSL_NO_VERIFY=1 set — TLS verification will be disabled for this connection.');
      ssl = { rejectUnauthorized: false };
    } else {
      ssl = { rejectUnauthorized: true };
    }
  }

  const client = new Client({ connectionString: databaseUrl, // pg types accept boolean|object
    ssl: ssl as any,
  });

  await client.connect();
  try {
    // redact host in logs
     
    console.log('Applying migration to', databaseUrl.replace(/(postgres:\/\/).*@/, '$1<redacted>@'));
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
     
    console.log('Migration applied successfully');
  } catch (err: unknown) {
     
    console.error('Migration failed:', (err && (err as Error).message) ? (err as Error).message : err);
    try {
      await client.query('ROLLBACK');
    } catch (e) {
       
      console.error('Rollback failed:', (e && (e as Error).message) ? (e as Error).message : e);
    }
    process.exit(1);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
   
  console.error('Unhandled error:', (err && (err as Error).message) ? (err as Error).message : err);
  process.exit(1);
});
