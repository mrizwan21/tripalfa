#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '../../..');

const apisCatalogPath = path.join(root, 'infrastructure/wicked-config/apis/apis.json');
const apisBaseDir = path.join(root, 'infrastructure/wicked-config/apis');
const routesCatalogPath = path.join(
  root,
  'infrastructure/wicked-config/routes/platform-core-routes.json'
);
const outputDir = path.join(root, 'infrastructure/kong');
const outputPath = path.join(outputDir, 'kong.yml');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function ensureLeadingSlash(input) {
  if (!input || input === '/') return '/';
  return input.startsWith('/') ? input : `/${input}`;
}

function sanitizeName(name) {
  return String(name)
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function toYaml(value, indent = 0) {
  const pad = ' '.repeat(indent);
  const isScalar =
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean';

  if (isScalar) {
    if (value === null) return 'null';
    if (typeof value === 'string') return JSON.stringify(value);
    return String(value);
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    return value
      .map((item) => {
        const scalar =
          item === null ||
          typeof item === 'string' ||
          typeof item === 'number' ||
          typeof item === 'boolean';
        if (scalar) return `${pad}- ${toYaml(item, indent + 2)}`;
        const nested = toYaml(item, indent + 2);
        return `${pad}-\n${nested}`;
      })
      .join('\n');
  }

  const entries = Object.entries(value);
  if (entries.length === 0) return '{}';

  return entries
    .map(([key, val]) => {
      const scalar =
        val === null || typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean';
      if (scalar) return `${pad}${key}: ${toYaml(val, indent + 2)}`;
      if (Array.isArray(val) && val.length === 0) return `${pad}${key}: []`;
      if (!Array.isArray(val) && val && Object.keys(val).length === 0) return `${pad}${key}: {}`;
      return `${pad}${key}:\n${toYaml(val, indent + 2)}`;
    })
    .join('\n');
}

function normalizePlugin(plugin) {
  if (!plugin || typeof plugin !== 'object' || !plugin.name) return null;
  return {
    name: plugin.name,
    config: plugin.config ?? {},
  };
}

function build() {
  const catalog = readJson(apisCatalogPath);
  const routeCatalog = readJson(routesCatalogPath);

  const services = [];
  const routes = [];
  const plugins = [];
  const routeNames = new Set();

  for (const api of catalog.apis || []) {
    const serviceId = sanitizeName(api.id);
    const configPath = path.join(apisBaseDir, api.id, 'config.json');
    if (!fs.existsSync(configPath)) {
      console.warn(`[gateway] Skipping ${api.id} - missing config.json`);
      continue;
    }

    const config = readJson(configPath);
    const upstreamUrl = config?.api?.upstream_url;
    if (!upstreamUrl) {
      console.warn(`[gateway] Skipping ${api.id} - missing api.upstream_url`);
      continue;
    }

    const parsed = new URL(upstreamUrl);
    const service = {
      name: serviceId,
      protocol: parsed.protocol.replace(':', ''),
      host: parsed.hostname,
      port: Number(parsed.port || (parsed.protocol === 'https:' ? 443 : 80)),
      path: parsed.pathname && parsed.pathname !== '/' ? parsed.pathname : '/',
      retries: 2,
      connect_timeout: 6000,
      write_timeout: 15000,
      read_timeout: 15000,
      tags: Array.isArray(api.tags) ? api.tags : [],
    };
    services.push(service);

    const servicePlugins = (config.plugins || []).map(normalizePlugin).filter(Boolean);
    for (const plugin of servicePlugins) {
      plugins.push({
        ...plugin,
        service: { name: serviceId },
      });
    }
  }

  for (const route of routeCatalog.routes || []) {
    const routeName = sanitizeName(route.name);
    if (routeNames.has(routeName)) {
      throw new Error(`[gateway] Duplicate route name found: ${routeName}`);
    }
    routeNames.add(routeName);

    const entity = {
      name: routeName,
      service: { name: sanitizeName(route.service) },
      paths: (route.paths || []).map(ensureLeadingSlash),
      strip_path: route.strip_path ?? false,
      preserve_host: false,
      protocols: ['http', 'https'],
      methods: route.methods || ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      tags: route.tags || ['tripalfa', 'wicked'],
    };
    routes.push(entity);
  }

  const declarative = {
    _format_version: '3.0',
    _transform: true,
    services,
    routes,
    plugins: [
      {
        name: 'cors',
        config: {
          origins: ['*'],
          methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
          headers: ['Authorization', 'Content-Type', 'X-Requested-With', 'x-sales-channel', 'x-tenant-id'],
          exposed_headers: ['X-Request-Id'],
          credentials: true,
          max_age: 3600,
        },
      },
      ...plugins,
    ],
  };

  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, `${toYaml(declarative)}\n`, 'utf8');

  console.log(`[gateway] Generated ${path.relative(root, outputPath)}`);
  console.log(`[gateway] Services: ${services.length}`);
  console.log(`[gateway] Routes: ${routes.length}`);
  console.log(`[gateway] Plugins: ${declarative.plugins.length}`);
}

build();
