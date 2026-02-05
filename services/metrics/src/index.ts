import Fastify from 'fastify';
import { queryRealtime } from '../../db-connector/src';
import { Metric } from '../../../packages/shared-types/src';

const server = Fastify({ logger: true });

server.post('/metrics/ingest', async (request, reply) => {
  const body = request.body as Metric | Metric[];
  const items = Array.isArray(body) ? body : [body];

  const insertText = 'INSERT INTO metrics(name, tags, value, ts) VALUES($1, $2, $3, $4)';
  for (const m of items) {
    await queryRealtime(insertText, [m.name, m.tags || {}, m.value, m.ts || new Date().toISOString()]);
  }
  return { ok: true, inserted: items.length };
});

// Simple query endpoint: aggregate sum over time range
server.get('/metrics/query', async (request, reply) => {
  const q = request.query as any;
  const name = q.name;
  const from = q.from || new Date(Date.now() - 1000 * 60 * 60).toISOString();
  const to = q.to || new Date().toISOString();

  if (!name) return reply.code(400).send({ error: 'missing name' });

  const rows = await queryRealtime(
    'SELECT date_trunc($3::text, ts) AS bucket, sum(value) AS value FROM metrics WHERE name = $1 AND ts BETWEEN $2 AND $4 GROUP BY bucket ORDER BY bucket',
    [name, from, q.resolution || 'minute', to]
  );
  return rows.rows;
});

const start = async () => {
  try {
    await server.listen({ port: Number(process.env.PORT || 3010), host: '0.0.0.0' });
    server.log.info('metrics service listening');
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
