#!/usr/bin/env node
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

async function call(path) {
  const url = BASE + path;
  const headers = makeHeaders();
  console.log('\n-> GET', url);
  const res = await fetchFn(url, { headers });
  const text = await res.text();
  let body = text;
  try { body = JSON.parse(text); } catch (e) { /* keep raw text */ }
  console.log('Status:', res.status);
  if (typeof body === 'string') {
    console.log('Body (snippet):', body.slice(0, 1000));
  } else {
    const out = JSON.stringify(body, null, 2).slice(0, 2000);
    console.log('Body (json snippet):', out);
  }
}

(async () => {
  const endpoints = [
    '/hotel-api/1.0/status',

    // Hotels
    '/hotel-content-api/1.0/hotels',
    '/hotel-api/1.0/hotels',
    '/hotel-content-api/1.0/hotel',
    '/hotel-api/1.0/hotel',

    // Locations
    '/hotel-content-api/1.0/countries',
    '/hotel-content-api/1.0/destinations',
    '/hotel-content-api/1.0/zones',
    '/hotel-content-api/1.0/locations',

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
    '/hotel-content-api/1.0/terminals',

    // Common master prefix variations
    '/hotel-content-api/1.0/master/countries',
    '/hotel-content-api/1.0/master/destinations',
    '/hotel-content-api/1.0/master/facilities',
    '/hotel-content-api/1.0/master/boards'
  ];

  for (const ep of endpoints) {
    try {
      await call(ep);
    } catch (err) {
      console.error('Error calling', ep, err && err.message ? err.message : err);
    }
  }
})();
