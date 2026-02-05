import { Pool } from 'pg';
import Redis from 'ioredis';
import type { SuperAdminNotification as Notification } from '@tripalfa/shared-types';

const postgresUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL || '';
const redisUrl = process.env.REDIS_URL || '';

const PG_POOL_MAX = parseInt(process.env.PG_POOL_MAX || '20', 10);
const PG_IDLE_MS = parseInt(process.env.PG_IDLE_MS || '30000', 10);
const PG_CONN_TIMEOUT_MS = parseInt(process.env.PG_CONN_TIMEOUT_MS || '2000', 10);
const NOTIFICATIONS_CACHE_TTL = parseInt(process.env.NOTIFICATIONS_CACHE_TTL || '5', 10); // seconds

let pgPool: Pool | null = null;
let redisClient: Redis | null = null;

if (postgresUrl) {
  pgPool = new Pool({
    connectionString: postgresUrl,
    max: PG_POOL_MAX,
    idleTimeoutMillis: PG_IDLE_MS,
    connectionTimeoutMillis: PG_CONN_TIMEOUT_MS,
  });

  // create table and index if not exists (idempotent init)
  (async () => {
    const client = await pgPool!.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS superadmin_notifications (
          id TEXT PRIMARY KEY,
          tenant_id TEXT NOT NULL,
          type TEXT,
          message TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL
        );
      `);

      // add index for tenant + recent reads
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_superadmin_notifications_tenant_created_at
        ON superadmin_notifications (tenant_id, created_at DESC);
      `);
    } finally {
      client.release();
    }
  })().catch((e) => console.error('pg init error', e));
}

if (redisUrl) {
  redisClient = new Redis(redisUrl);
  redisClient.on('error', (err) => console.error('redis error', err));
}

// Save notification and invalidate cache(s)
export async function saveToPostgres(n: Notification) {
  if (!pgPool) return null;
  const client = await pgPool.connect();
  try {
    // use named prepared statement for repeated inserts
    await client.query({
      name: 'insert_notification',
      text: 'INSERT INTO superadmin_notifications(id, tenant_id, type, message, created_at) VALUES($1,$2,$3,$4,$5) ON CONFLICT (id) DO NOTHING',
      values: [n.id, n.tenantId, n.type, n.message, n.createdAt],
    });

    // Invalidate redis cache for tenant and global lists
    if (redisClient) {
      const tenantKey = `superadmin:notifications:${n.tenantId}`;
      const globalKey = `superadmin:notifications:all`;
      try {
        await Promise.all([redisClient.del(tenantKey), redisClient.del(globalKey)]);
      } catch (err) {
        console.error('redis invalidate error', err);
      }
    }

    return n;
  } finally {
    client.release();
  }
}

// Backwards-compatible generic list (no tenant filtering)
export async function listFromPostgres(limit = 100): Promise<Notification[]> {
  return listFromPostgresByTenant(undefined, limit);
}

export async function listFromPostgresByTenant(tenantId: string | undefined, limit = 100): Promise<Notification[]> {
  if (!pgPool) return [];
  const client = await pgPool.connect();
  try {
    if (tenantId) {
      const res = await client.query({
        name: 'select_notifications_tenant',
        text: 'SELECT id, tenant_id, type, message, created_at FROM superadmin_notifications WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT $2',
        values: [tenantId, limit],
      });
      return res.rows.map((r: any) => ({ id: r.id, tenantId: r.tenant_id, type: r.type, message: r.message, createdAt: r.created_at.toISOString() }));
    }

    const res = await client.query({
      name: 'select_notifications_all',
      text: 'SELECT id, tenant_id, type, message, created_at FROM superadmin_notifications ORDER BY created_at DESC LIMIT $1',
      values: [limit],
    });
    return res.rows.map((r: any) => ({ id: r.id, tenantId: r.tenant_id, type: r.type, message: r.message, createdAt: r.created_at.toISOString() }));
  } finally {
    client.release();
  }
}

export async function pushToRedis(n: Notification) {
  if (!redisClient) return null;
  // push JSON to list for backwards compatibility (global list)
  await redisClient.lpush('superadmin:notifications', JSON.stringify(n));
  await redisClient.ltrim('superadmin:notifications', 0, 999);
  return n;
}

export async function listFromRedis(limit = 100): Promise<Notification[]> {
  if (!redisClient) return [];
  const vals = await redisClient.lrange('superadmin:notifications', 0, limit - 1);
  return vals.map((v) => {
    try {
      return JSON.parse(v) as Notification;
    } catch {
      return null;
    }
  }).filter(Boolean) as Notification[];
}

// Read-through cache: fetch cached tenant list or populate from Postgres
export async function listNotifications(tenantId?: string, limit = 100): Promise<Notification[]> {
  const key = tenantId ? `superadmin:notifications:${tenantId}` : `superadmin:notifications:all`;
  if (redisClient) {
    try {
      const cached = await redisClient.get(key);
      if (cached) {
        return JSON.parse(cached) as Notification[];
      }
    } catch (err) {
      console.error('redis read error', err);
    }
  }

  const rows = await listFromPostgresByTenant(tenantId, limit);

  if (redisClient) {
    try {
      await redisClient.set(key, JSON.stringify(rows), 'EX', NOTIFICATIONS_CACHE_TTL);
    } catch (err) {
      console.error('redis write error', err);
    }
  }

  return rows;
}

