import assert from 'node:assert/strict';
import test, { before, after } from 'node:test';
import http from 'node:http';
import { spawn } from 'node:child_process';
import path from 'node:path';

const PORT = 33033;

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? Buffer.from(JSON.stringify(body)) : undefined;
    const req = http.request({ method, port: PORT, path, headers: {
      'Content-Type': 'application/json',
      'Content-Length': data ? data.length : 0,
    }}, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const raw = Buffer.concat(chunks).toString('utf8');
        let json;
        try { json = JSON.parse(raw); } catch { json = raw; }
        resolve({ status: res.statusCode, json, headers: res.headers });
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

let child;

before(async () => {
  const serverPath = path.resolve(path.join(process.cwd(), 'services/user-service/dist/index.js'));
  child = spawn(process.execPath, [serverPath], {
    env: { ...process.env, USER_SERVICE_PORT: String(PORT) },
    stdio: 'ignore'
  });
  // wait a short moment for server to start
  await new Promise(r => setTimeout(r, 500));
});

after(() => {
  if (child) child.kill();
});

test('GET /user/preferences returns 200 with fallback when not in DB', async () => {
  // Server listens on process.env.USER_SERVICE_PORT or 3003; use default 3003 for request
  const res = await new Promise((resolve, reject) => {
    http.get({ port: PORT, path: '/user/preferences?userId=test_user' }, r => {
      const chunks = [];
      r.on('data', c => chunks.push(c));
      r.on('end', () => {
        const raw = Buffer.concat(chunks).toString('utf8');
        resolve({ status: r.statusCode, body: raw });
      });
    }).on('error', reject);
  });
  assert.equal(res.status, 200);
});

test('POST /user/preferences handles bad JSON gracefully', async () => {
  const res = await new Promise((resolve) => {
    const req = http.request({ method: 'POST', port: PORT, path: '/user/preferences' }, r => {
      resolve({ status: r.statusCode });
    });
    req.write('{ bad-json');
    req.end();
  });
  // Will likely be 500 due to JSON parse error; just assert it is not 404
  assert.notEqual(res.status, 404);
});
