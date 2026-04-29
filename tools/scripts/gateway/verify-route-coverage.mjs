#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '../../..');

const routeCatalogPath = path.join(
  root,
  'infrastructure/wicked-config/routes/platform-core-routes.json'
);

const scanRoots = [
  path.join(root, 'apps/booking-engine/src'),
  path.join(root, 'apps/b2b-portal/src'),
  path.join(root, 'apps/call-center-portal/src'),
  path.join(root, 'apps/super-admin-portal/src'),
  path.join(root, 'packages/booking-service/src'),
  path.join(root, 'packages/booking-engine-service/src'),
];

const fileExtensions = new Set(['.ts', '.tsx', '.js', '.jsx']);
const endpointPattern = /\/api\/[A-Za-z0-9._~/%:@?&=+-]*/g;

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, out);
      continue;
    }
    if (fileExtensions.has(path.extname(entry.name))) out.push(full);
  }
  return out;
}

function normalizeEndpoint(value) {
  const withoutQuery = value.split('?')[0];
  return withoutQuery.replace(/\/+$/, '') || '/';
}

function main() {
  const routeCatalog = JSON.parse(fs.readFileSync(routeCatalogPath, 'utf8'));
  const routePaths = new Set(
    (routeCatalog.routes || [])
      .flatMap((r) => r.paths || [])
      .map((p) => normalizeEndpoint(p))
      .filter((p) => p.startsWith('/api'))
  );

  const files = scanRoots.flatMap((dir) => walk(dir));
  const discovered = new Set();

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    for (const match of content.matchAll(endpointPattern)) {
      const endpoint = normalizeEndpoint(match[0]);
      if (!endpoint.startsWith('/api')) continue;
      if (endpoint.length <= 4) continue;
      discovered.add(endpoint);
    }
  }

  const uncovered = [];
  for (const endpoint of discovered) {
    const covered = [...routePaths].some((routePath) => endpoint.startsWith(routePath));
    if (!covered) uncovered.push(endpoint);
  }

  uncovered.sort((a, b) => a.localeCompare(b));
  const sortedRoutes = [...routePaths].sort((a, b) => a.localeCompare(b));

  console.log(`[gateway] Route paths in catalog: ${sortedRoutes.length}`);
  console.log(`[gateway] /api endpoints discovered in code: ${discovered.size}`);
  console.log(`[gateway] Uncovered endpoints: ${uncovered.length}`);

  if (uncovered.length > 0) {
    console.log('\n[gateway] Uncovered endpoint prefixes:');
    for (const endpoint of uncovered) console.log(` - ${endpoint}`);
    process.exitCode = 1;
    return;
  }

  console.log('[gateway] All discovered endpoints are covered by route catalog.');
}

main();
