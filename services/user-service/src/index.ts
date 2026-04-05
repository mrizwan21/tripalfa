import dotenv from 'dotenv';
import http, { IncomingMessage, ServerResponse } from 'http';
import { prisma } from '@tripalfa/shared-database';
import { setupUserSwagger } from './swagger.js';

dotenv.config();

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
    const preferences = await prisma.userPreferences.findUnique({
      where: { userId },
      include: { user: true },
    });

    if (!preferences) {
      const fallback = {
        id: userId,
        language: 'English',
        currency: 'USD',
        notifications: true,
      };
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(fallback));
      return;
    }

    const result = {
      id: userId,
      email: preferences.user.email,
      language: preferences.language,
      currency: preferences.currency,
      notifications: preferences.emailNotifications,
    };

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result));
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

    const updatedPreferences = await prisma.$transaction(async tx => {
      // Ensure user exists
      const user = await tx.user.upsert({
        where: { id: userId },
        update: { email: emailToSave },
        create: { id: userId, email: emailToSave },
      });

      // Upsert preferences
      return tx.userPreferences.upsert({
        where: { userId },
        update: {
          language: language || undefined,
          currency: currency || undefined,
          emailNotifications: notifications !== undefined ? notifications : undefined,
        },
        create: {
          userId,
          language: language || 'English',
          currency: currency || 'USD',
          emailNotifications: notifications === undefined ? true : notifications,
        },
      });
    });

    const result = {
      id: userId,
      email: emailToSave,
      language: updatedPreferences.language,
      currency: updatedPreferences.currency,
      notifications: updatedPreferences.emailNotifications,
    };

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result));
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
  // Health check endpoint
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'healthy', service: 'user-service' }));
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
setupUserSwagger(server as any);
server.listen(port, () => {
  console.log(`🚀 User Service running on port ${port}`);
});
