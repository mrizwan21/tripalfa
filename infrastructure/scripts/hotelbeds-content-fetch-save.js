#!/usr/bin/env node
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

// Use global fetch if available (Node 18+), otherwise try node-fetch
let fetchFn;
try {
  fetchFn = global.fetch || require('node-fetch');
} catch (err) {
  fetchFn = global.fetch;
}

const API_KEY = process.env.HOTELBEDS_API_KEY;
const API_SECRET = process.env.HOTELBEDS_API_SECRET;
const BASE = process.env.HOTELBEDS_BASE_URL || 'https://api.test.hotelbeds.com';
const OUTPUT_DIR = path.join(process.cwd(), 'data', 'hotelbeds');
const PACE_MS = Number(process.env.HOTELBEDS_PACE_MS) || 2000;
const MAX_RETRIES = 5;

if (!API_KEY || !API_SECRET) {
  console.error('Missing credentials. Please set HOTELBEDS_API_KEY and HOTELBEDS_API_SECRET.');
  process.exit(1);
}

function makeHeaders() {
  const ts = Math.floor(Date.now() / 1000).toString();
  const signature = crypto.createHash('sha256').update(API_KEY + API_SECRET + ts).digest('hex');
  return {
    'Api-key': API_KEY,
    'X-Signature': signature,
    'Accept': 'application/json'
  };
}

function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

function slugify(p) {
  if (!p) return 'root';
  let s = p.replace(/^\//, '');
  s = s.replace(/[^a-zA-Z0-9]+/g, '-');
  s = s.replace(/^-+|-+$/g, '');
  return s.toLowerCase() || 'root';
}

async function ensureOutDir() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
}

async function writeResponse(slug, data) {
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${slug}_${ts}.json`;
  const fp = path.join(OUTPUT_DIR, filename);
  await fs.writeFile(fp, JSON.stringify(data, null, 2), 'utf8');
  console.log('Saved:', fp);
}

async function fetchWithRetry(ep) {
  const url = BASE.replace(/\/$/, '') + ep;
  let attempt = 0;
  while (attempt <= MAX_RETRIES) {
    attempt++;
    try {
      const headers = makeHeaders();
      const res = await fetchFn(url, { method: 'GET', headers });

      if (res.status === 429) {
        if (attempt > MAX_RETRIES) {
          console.log(`429 max retries for ${ep}`);
          return { status: 429, body: null };
        }
        const backoff = 1000 * Math.pow(2, attempt - 1);
        console.log(`429 for ${ep}, retry ${attempt}/${MAX_RETRIES} after ${backoff}ms`);
        await sleep(backoff);
        continue;
      }

      const text = await res.text();
      let body = text;
      try { body = JSON.parse(text); } catch (e) { /* keep raw text */ }

      return { status: res.status, body };
    } catch (err) {
      if (attempt > MAX_RETRIES) {
        console.log(`Error fetching ${ep}:`, err.message || err);
        return { status: 0, body: null };
      }
      const backoff = 1000 * Math.pow(2, attempt - 1);
      console.log(`Request error for ${ep}, retry ${attempt}/${MAX_RETRIES} after ${backoff}ms`);
      await sleep(backoff);
    }
  }
  return { status: 0, body: null };
}

(async () => {
  await ensureOutDir();

  const endpoints = [
    '/hotel-api/1.0/status',
    '/hotel-content-api/1.0/hotels',

    // Locations
    '/hotel-content-api/1.0/countries',
    '/hotel-content-api/1.0/destinations',

    // Types / Masters
    '/hotel-content-api/1.0/accommodations',
    '/hotel-content-api/1.0/boards',
    '/hotel-content-api/1.0/boardgroups',
    '/hotel-content-api/1.0/categories',
    '/hotel-content-api/1.0/chains',
    '/hotel-content-api/1.0/classifications',
    '/hotel-content-api/1.0/currencies',
    '/hotel-content-api/1.0/facilities',
    '/hotel-content-api/1.0/facilitygroups',
    '/hotel-content-api/1.0/facilitytypologies',
    '/hotel-content-api/1.0/groupcategories',
    '/hotel-content-api/1.0/imagetypes',
    '/hotel-content-api/1.0/hotelissues',
    '/hotel-content-api/1.0/languages',
    '/hotel-content-api/1.0/promotions',
    '/hotel-content-api/1.0/ratecommentdetails',
    '/hotel-content-api/1.0/ratecomments',
    '/hotel-content-api/1.0/rooms',
    '/hotel-content-api/1.0/segments',
    '/hotel-content-api/1.0/terminals'
  ];

  for (const ep of endpoints) {
    console.log('\nRequesting', ep);
    const { status, body } = await fetchWithRetry(ep);
    console.log('Status:', status);
    if (body !== null && body !== undefined) {
      const slug = slugify(ep);
      try {
        await writeResponse(slug, body);
      } catch (err) {
        console.log('Write error:', err.message || err);
      }
    }
    // pace requests to avoid hitting rate limits
    await sleep(PACE_MS);
  }

  console.log('Done. Responses saved to', OUTPUT_DIR);
})();
