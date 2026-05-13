#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '../../..');

const frontendRoots = [
  path.join(root, 'apps/booking-engine/src'),
  path.join(root, 'apps/b2b-portal/src'),
  path.join(root, 'apps/call-center-portal/src'),
  path.join(root, 'apps/super-admin-portal/src'),
];

const envRoots = [
  path.join(root, 'apps/booking-engine'),
  path.join(root, 'apps/b2b-portal'),
  path.join(root, 'apps/call-center-portal'),
  path.join(root, 'apps/super-admin-portal'),
];

const fileExtensions = new Set(['.ts', '.tsx', '.js', '.jsx']);
const envExtensions = new Set(['.env', '.env.local', '.env.development', '.env.production', '.env.example']);

const disallowedPatterns = [
  /http:\/\/localhost:3001/gi,
  /http:\/\/localhost:3002/gi,
  /http:\/\/localhost:3004/gi,
  /http:\/\/localhost:3005/gi,
  /http:\/\/localhost:3006/gi,
  /http:\/\/localhost:3007/gi,
  /http:\/\/localhost:3008/gi,
  /http:\/\/localhost:3009/gi,
  /http:\/\/localhost:3010/gi,
  /http:\/\/localhost:3011/gi,
  /http:\/\/localhost:3012/gi,
  /http:\/\/localhost:3020/gi,
  /http:\/\/localhost:3021/gi,
  /api-gateway:3000/gi,
  /REACT_APP_API_URL/gi,
];

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

function shouldIgnore(filePath) {
  return (
    filePath.includes('/__tests__/') ||
    filePath.includes('/tests/') ||
    filePath.includes('/mocks/')
  );
}

function lineNumberFromIndex(content, index) {
  let line = 1;
  for (let i = 0; i < index; i += 1) {
    if (content.charCodeAt(i) === 10) line += 1;
  }
  return line;
}

function main() {
  const offenders = [];

  // Check source files
  const files = frontendRoots.flatMap((dir) => walk(dir));
  for (const file of files) {
    if (shouldIgnore(file)) continue;
    const content = fs.readFileSync(file, 'utf8');
    for (const pattern of disallowedPatterns) {
      pattern.lastIndex = 0;
      for (const match of content.matchAll(pattern)) {
        const idx = match.index ?? 0;
        const line = lineNumberFromIndex(content, idx);
        offenders.push({
          file: path.relative(root, file),
          line,
          match: match[0],
        });
      }
    }
  }

  // Check .env files
  for (const envRoot of envRoots) {
    for (const ext of envExtensions) {
      const envFile = path.join(envRoot, ext);
      if (!fs.existsSync(envFile)) continue;
      const content = fs.readFileSync(envFile, 'utf8');
      const envPath = path.relative(root, envFile);
      let lineNum = 0;
      for (const line of content.split('\n')) {
        lineNum++;
        for (const pattern of disallowedPatterns) {
          pattern.lastIndex = 0;
          if (pattern.test(line)) {
            offenders.push({
              file: envPath,
              line: lineNum,
              match: line.trim(),
            });
            break;
          }
        }
      }
    }
  }

  if (offenders.length > 0) {
    console.log(`[gateway] Found ${offenders.length} direct service URL/API bypass references in frontend source:`);
    for (const item of offenders) {
      console.log(` - ${item.file}:${item.line} -> ${item.match}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log('[gateway] Frontend gateway-only check passed.');
}

main();
