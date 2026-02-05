import { getRedisClient } from '../../cache/redisClient';
import { queryRealtime } from '../../db-connector/src';
import { RealtimeData } from '../../../packages/shared-types/src';

const client = getRedisClient();
const STREAM_KEY = process.env.INGEST_STREAM || 'ingest:stream';
const CONSUMER_GROUP = process.env.INGEST_GROUP || 'ingest-group';
const CONSUMER_NAME = process.env.INGEST_CONSUMER || `consumer-${process.pid}`;

async function ensureGroup() {
  try {
    // Try creating the consumer group; ignore if exists
    await client.xgroup('CREATE', STREAM_KEY, CONSUMER_GROUP, '$', 'MKSTREAM');
  } catch (err: any) {
    if (!/BUSYGROUP/.test(String(err))) {
      console.error('xgroup create error', err);
    }
  }
}

async function processMessage(id: string, fields: Record<string, string>) {
  try {
    const raw = fields.payload || fields.data || '';
    const vendor = fields.vendor || 'unknown';
    const parsed = raw ? JSON.parse(raw) : {};

    // dedupe using a Redis key with NX and TTL
    const dedupeKey = `ingest:dedupe:${vendor}:${parsed.id || parsed.requestId || id}`;
    const set = await client.set(dedupeKey, '1', 'EX', 60, 'NX');
    if (!set) {
      // already processed
      return;
    }

    const realtime: RealtimeData = {
      id: parsed.id || id,
      vendor,
      productId: parsed.productId || parsed.pid || 'unknown',
      payload: parsed,
      ts: (parsed.ts as string) || new Date().toISOString(),
      sequence: parsed.sequence || undefined,
    };

    // Insert into realtime DB (Neon)
    await queryRealtime(
      'INSERT INTO realtime_data(id, vendor, product_id, payload, ts, sequence) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(id) DO UPDATE SET payload = EXCLUDED.payload, ts = EXCLUDED.ts',
      [realtime.id, realtime.vendor, realtime.productId, realtime.payload, realtime.ts, realtime.sequence]
    );
  } catch (err) {
    console.error('processMessage error', err);
  }
}

async function run() {
  await ensureGroup();
  console.log('ingest worker started, group=', CONSUMER_GROUP, 'consumer=', CONSUMER_NAME);

  while (true) {
    try {
      const resp = await client.xreadgroup('GROUP', CONSUMER_GROUP, CONSUMER_NAME, 'COUNT', 10, 'BLOCK', 5000, 'STREAMS', STREAM_KEY, '>');
      if (!resp) continue;
      for (const stream of resp) {
        const [streamKey, messages] = stream as any;
        for (const msg of messages) {
          const [id, pairs] = msg;
          const obj: Record<string, string> = {};
          for (let i = 0; i < pairs.length; i += 2) {
            obj[pairs[i]] = pairs[i + 1];
          }
          await processMessage(id, obj);
          // Acknowledge
          await client.xack(STREAM_KEY, CONSUMER_GROUP, id);
        }
      }
    } catch (err) {
      console.error('ingest loop error', err);
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
}

run().catch((e) => {
  console.error('ingest worker fatal', e);
  process.exit(1);
});
