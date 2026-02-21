#!/usr/bin/env node
/* eslint-disable no-undef */
const fs = require('fs');
const path = require('path');
// __dirname is automatically available in CommonJS

const services = [
  'user-service',
  'booking-service',
  'payment-service',
  'notification-service',
  'rule-engine-service',
  'organization-service'
];

// Find the correct prisma client path
const pnpmPath = path.join(__dirname, '..', 'node_modules', '.pnpm');
let correctPath = null;

try {
  const entries = fs.readdirSync(pnpmPath, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith('@prisma+client@7.4.0') && entry.isDirectory()) {
      const clientPath = path.join(pnpmPath, entry.name, 'node_modules', '@prisma', 'client');
      if (fs.existsSync(clientPath)) {
        const indexDts = path.join(clientPath, 'index.d.ts');
        if (fs.existsSync(indexDts)) {
          const content = fs.readFileSync(indexDts, 'utf8');
          if (content.includes('.prisma/client')) {
            correctPath = clientPath;
            console.log(`Found correct Prisma client at: ${entry.name}`);
            break;
          }
        }
      }
    }
  }
} catch (e) {
  console.error('Error finding prisma client:', e.message);
  process.exit(1);
}

if (!correctPath) {
  console.error('Could not find correct Prisma client');
  process.exit(1);
}

// Fix symlinks for each service
const rootDir = path.join(__dirname, '..');
for (const service of services) {
  const targetDir = path.join(rootDir, 'services', service, 'node_modules', '@prisma', 'client');
  const relativePath = path.relative(path.dirname(targetDir), correctPath);
  
  try {
    fs.mkdirSync(path.dirname(targetDir), { recursive: true });
    if (fs.existsSync(targetDir)) {
      fs.unlinkSync(targetDir);
    }
    fs.symlinkSync(relativePath, targetDir, 'junction');
    console.log(`Fixed: ${service}`);
  } catch (e) {
    console.error(`Error fixing ${service}:`, e.message);
  }
}

console.log('Done fixing Prisma symlinks');
