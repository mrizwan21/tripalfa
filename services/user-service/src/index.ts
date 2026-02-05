import dotenv from 'dotenv';
import http, { IncomingMessage, ServerResponse } from 'http';
import { Pool } from 'pg';

dotenv.config();

const DATABASE_URL =
  process.env.STATIC_DATABASE_URL ||
  process.env.DATABASE_URL ||
  'postgres://postgres:postgres@localhost:5432/staticdatabase';

const pool = new Pool({ connectionString: DATABASE_URL });

type PreferencesPayload = {
  language?: string;
  currency?: string;
  notifications?: boolean;
  email?: string;
};

function parseJsonBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += String(chunk);
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body) as Record<string, unknown>);
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

function extractUserIdFromAuth(req: IncomingMessage): string {
  const auth = req.headers['authorization'] || '';
  const url = new URL(req.url || '/', 'http://localhost');
  if (!auth) return url.searchParams.get('userId') || 'user_1';
  const parts = String(auth).split(' ');
  if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') return parts[1];
  return url.searchParams.get('userId') || 'user_1';
}

async function handleGetPreferences(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const userId = extractUserIdFromAuth(req);
  try {
    const result = await pool.query(
      'SELECT id, email, language, currency, notifications FROM users WHERE id = $1',
      [userId]
    );
    if (result.rows.length === 0) {
      const fallback = { id: userId, language: 'English', currency: 'USD', notifications: true };
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(fallback));
      return;
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result.rows[0]));
  } catch (err) {
    console.error('GET /user/preferences error', err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Failed to fetch preferences' }));
  }
}

async function handlePostPreferences(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const userId = extractUserIdFromAuth(req);
  try {
    const body = (await parseJsonBody(req)) as PreferencesPayload;
    const { language, currency, notifications, email } = body || {};
    const emailToSave = email || `user+${userId}@local`;
    console.log('POST /user/preferences payload:', { userId, emailToSave, language, currency, notifications });

    const result = await pool.query(
      `INSERT INTO users (id, email, language, currency, notifications)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE
         SET language = COALESCE(EXCLUDED.language, users.language),
             currency = COALESCE(EXCLUDED.currency, users.currency),
             notifications = COALESCE(EXCLUDED.notifications, users.notifications),
             email = COALESCE(EXCLUDED.email, users.email)
       RETURNING id, email, language, currency, notifications`,
      [
        userId,
        emailToSave,
        language || 'English',
        currency || 'USD',
        notifications === undefined ? true : notifications
      ]
    );
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result.rows[0]));
  } catch (err) {
    console.error('POST /user/preferences error', err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Failed to save preferences' }));
  }
}

const server = http.createServer(async (req, res) => {
  if (!req.url) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Bad request' }));
    return;
  }
  if (req.method === 'GET' && req.url.startsWith('/user/preferences')) {
    await handleGetPreferences(req, res);
    return;
  }
  if (req.method === 'POST' && req.url.startsWith('/user/preferences')) {
    await handlePostPreferences(req, res);
    return;
  }
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

const port = process.env.USER_SERVICE_PORT || 3003;
server.listen(port, () => {
  console.log(`User service (http) listening on port ${port}`);
});
