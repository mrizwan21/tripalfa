const { Pool } = require('pg');
const Redis = require('ioredis');

async function verifyConnections() {
    console.log('--- Starting Database Connection Verification ---');

    // 1. Neon Postgres
    // Try with ssl: { rejectUnauthorized: false } which is often needed for serverless environments
    const neonPool = new Pool({
        connectionString: "postgresql://neondb_owner:REDACTED@ep-ancient-base-afwb58uq-pooler.c-2.us-west-2.aws.neon.tech/neondb",
        ssl: { rejectUnauthorized: false }
    });
    try {
        const res = await neonPool.query('SELECT NOW()');
        console.log('✅ Neon Postgres: Connected successfully', res.rows[0].now);
    } catch (err) {
        console.error('❌ Neon Postgres: Connection failed', err.message);
    } finally {
        await neonPool.end();
    }

    // 2. Local Postgres
    const localPool = new Pool({
        connectionString: 'postgresql://postgres:postgres@localhost:5432/staticdatabase'
    });
    try {
        const res = await localPool.query('SELECT NOW()');
        console.log('✅ Local Postgres: Connected successfully', res.rows[0].now);
    } catch (err) {
        console.error('❌ Local Postgres: Connection failed', err.message);
    } finally {
        await localPool.end();
    }

    // 3. Redis
    const redis = new Redis('redis://localhost:6379');
    try {
        await redis.ping();
        console.log('✅ Redis: Connected successfully');
    } catch (err) {
        console.error('❌ Redis: Connection failed', err.message);
    } finally {
        redis.disconnect();
    }

    console.log('--- Verification Complete ---');
}

verifyConnections();
