#!/usr/bin/env node

/**
 * TripAlfa Apps Restructuring Script
 * Aligns frontend apps with microservices architecture
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Starting TripAlfa Apps Restructuring...\n');

// Phase 1: Create API Clients Package
console.log('📦 Phase 1: Creating API Clients Package...');

const apiClientsDir = 'packages/api-clients';
if (!fs.existsSync(apiClientsDir)) {
  fs.mkdirSync(apiClientsDir, { recursive: true });
}

// Create package.json for API clients
const apiClientsPackage = {
  "name": "@tripalfa/api-clients",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "axios": "^1.7.7",
    "@tripalfa/shared-types": "workspace:*",
    "@tripalfa/shared-utils": "workspace:*"
  },
  "devDependencies": {
    "typescript": "^5.6.3",
    "@types/node": "^20.19.30"
  }
};

fs.writeFileSync(
  path.join(apiClientsDir, 'package.json'),
  JSON.stringify(apiClientsPackage, null, 2)
);

// Create tsconfig.json
const tsconfig = {
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["dist", "node_modules"]
};

fs.writeFileSync(
  path.join(apiClientsDir, 'tsconfig.json'),
  JSON.stringify(tsconfig, null, 2)
);

// Create src directory
fs.mkdirSync(path.join(apiClientsDir, 'src'), { recursive: true });

// Move service clients from b2b-admin to api-clients
const b2bServicesDir = 'apps/b2b-admin/src/services';
const apiClientsSrcDir = path.join(apiClientsDir, 'src');

if (fs.existsSync(b2bServicesDir)) {
  const serviceFiles = fs.readdirSync(b2bServicesDir).filter(file =>
    file.endsWith('.ts') && !file.includes('api-manager')
  );

  serviceFiles.forEach(file => {
    const srcPath = path.join(b2bServicesDir, file);
    const destPath = path.join(apiClientsSrcDir, file.toLowerCase());

    console.log(`  Moving ${file} to api-clients...`);
    fs.copyFileSync(srcPath, destPath);
  });
}

// Create index.ts for API clients
const indexContent = `// API Clients Index
export { default as AuditService } from './auditservice';
export { default as KYCService } from './kycservice';
export { default as MarketingService } from './marketingservice';
export { default as PaymentService } from './paymentservice';
export { default as SupportService } from './supportservice';
export { default as TaxService } from './taxservice';

// Re-export types
export type * from '@tripalfa/shared-types';
`;

fs.writeFileSync(path.join(apiClientsSrcDir, 'index.ts'), indexContent);

// Phase 2: Move Types to Shared
console.log('\n📝 Phase 2: Consolidating Types...');

// Move booking-engine types to shared-types
const bookingTypesDir = 'apps/booking-engine/src/types';
const sharedTypesDir = 'packages/shared-types/types';

if (fs.existsSync(bookingTypesDir)) {
  const typeFiles = fs.readdirSync(bookingTypesDir);

  typeFiles.forEach(file => {
    const srcPath = path.join(bookingTypesDir, file);
    const content = fs.readFileSync(srcPath, 'utf8');

    // Create booking subdirectory in shared-types
    const bookingTypesDest = path.join(sharedTypesDir, 'booking');
    if (!fs.existsSync(bookingTypesDest)) {
      fs.mkdirSync(bookingTypesDest, { recursive: true });
    }

    const destPath = path.join(bookingTypesDest, file);
    console.log(`  Moving ${file} to shared-types/booking/...`);
    fs.writeFileSync(destPath, content);
  });

  // Update shared-types index.ts
  const sharedTypesIndex = path.join(sharedTypesDir, 'index.ts');
  let indexContent = fs.readFileSync(sharedTypesIndex, 'utf8');

  if (!indexContent.includes('booking')) {
    indexContent += `
// Booking Engine Types
export * from './booking/loyalty';
export * from './booking/lucide-react';
`;
    fs.writeFileSync(sharedTypesIndex, indexContent);
  }
}

// Phase 3: Remove App ESLint Configs
console.log('\n⚙️ Phase 3: Consolidating ESLint Configuration...');

// Remove app-specific ESLint configs
const b2bEslint = 'apps/b2b-admin/eslint.config.js';
const bookingEslint = 'apps/booking-engine/eslint.config.js';

if (fs.existsSync(b2bEslint)) {
  console.log('  Removing b2b-admin eslint.config.js...');
  fs.unlinkSync(b2bEslint);
}

if (fs.existsSync(bookingEslint)) {
  console.log('  Removing booking-engine eslint.config.js...');
  fs.unlinkSync(bookingEslint);
}

// Phase 4: Update App Dependencies
console.log('\n📦 Phase 4: Optimizing App Dependencies...');

// Update b2b-admin package.json
const b2bPackagePath = 'apps/b2b-admin/package.json';
if (fs.existsSync(b2bPackagePath)) {
  const b2bPackage = JSON.parse(fs.readFileSync(b2bPackagePath, 'utf8'));

  // Add API clients dependency
  if (!b2bPackage.dependencies['@tripalfa/api-clients']) {
    b2bPackage.dependencies['@tripalfa/api-clients'] = 'workspace:*';
  }

  // Remove service files from b2b-admin src/services
  const servicesToRemove = [
    'AuditService.ts', 'KYCService.ts', 'MarketingService.ts',
    'PaymentService.ts', 'SupportService.ts', 'TaxService.ts'
  ];

  servicesToRemove.forEach(service => {
    const servicePath = path.join(b2bServicesDir, service);
    if (fs.existsSync(servicePath)) {
      console.log(`  Removing ${service} from b2b-admin...`);
      fs.unlinkSync(servicePath);
    }
  });

  fs.writeFileSync(b2bPackagePath, JSON.stringify(b2bPackage, null, 2));
}

// Update booking-engine package.json
const bookingPackagePath = 'apps/booking-engine/package.json';
if (fs.existsSync(bookingPackagePath)) {
  const bookingPackage = JSON.parse(fs.readFileSync(bookingPackagePath, 'utf8'));

  // Add API clients dependency
  if (!bookingPackage.dependencies['@tripalfa/api-clients']) {
    bookingPackage.dependencies['@tripalfa/api-clients'] = 'workspace:*';
  }

  fs.writeFileSync(bookingPackagePath, JSON.stringify(bookingPackage, null, 2));
}

// Phase 5: Update Workspace Configuration
console.log('\n🔧 Phase 5: Updating Workspace Configuration...');

const rootPackagePath = 'package.json';
const rootPackage = JSON.parse(fs.readFileSync(rootPackagePath, 'utf8'));

// Add api-clients to workspaces
if (!rootPackage.workspaces.includes('packages/api-clients')) {
  rootPackage.workspaces.push('packages/api-clients');
  fs.writeFileSync(rootPackagePath, JSON.stringify(rootPackage, null, 2));
}

// Phase 6: Create Architecture Documentation
console.log('\n📚 Phase 6: Creating Architecture Documentation...');

const architectureDoc = `# TripAlfa Frontend Architecture

## Overview
TripAlfa uses a microservices-aligned frontend architecture with thin client applications that consume backend APIs through shared API clients.

## Architecture Principles

### 1. Separation of Concerns
- **Backend Services**: Business logic, data persistence, API endpoints
- **Frontend Apps**: UI rendering, user interaction, state management
- **Shared Packages**: Reusable components, types, utilities, API clients

### 2. Shared Resources
- **@tripalfa/api-clients**: Centralized API client implementations
- **@tripalfa/shared-types**: All TypeScript type definitions
- **@tripalfa/ui-components**: Reusable UI components
- **@tripalfa/shared-utils**: Common utility functions

### 3. App Structure
Each frontend app follows this structure:
\`\`\`
apps/[app-name]/
├── src/
│   ├── components/     # UI components only
│   ├── pages/         # Page components
│   ├── hooks/         # React hooks for state/logic
│   ├── utils/         # App-specific utilities
│   ├── config/        # App configuration
│   └── lib/           # External library configurations
├── public/
├── tests/
└── package.json       # Minimal dependencies
\`\`\`

## API Client Usage

### Importing API Clients
\`\`\`typescript
import { AuditService, PaymentService } from '@tripalfa/api-clients';
import type { Payment, AuditLog } from '@tripalfa/shared-types';
\`\`\`

### Using API Clients
\`\`\`typescript
const auditService = new AuditService();
const paymentService = new PaymentService();

// Make API calls
const audits = await auditService.getAudits({ userId });
const payment = await paymentService.processPayment(paymentData);
\`\`\`

## Development Guidelines

### 1. No Business Logic in Frontend
- Business logic belongs in backend services
- Frontend apps should only handle UI and user interaction
- API calls should go through shared API clients

### 2. Use Shared Types
- Always import types from @tripalfa/shared-types
- Do not define duplicate types in apps
- Keep type definitions centralized

### 3. Shared Components
- Use components from @tripalfa/ui-components
- Create app-specific components only when necessary
- Follow established design patterns

### 4. Dependency Management
- Keep app package.json minimal
- Use workspace references for shared packages
- Avoid duplicating dependencies

## Migration Notes

### From Old Structure
- ❌ Service implementations in apps
- ❌ Duplicated types across apps
- ❌ App-specific ESLint configs
- ❌ Heavy app dependencies

### To New Structure
- ✅ Thin API clients in shared package
- ✅ Centralized type definitions
- ✅ Single ESLint configuration
- ✅ Minimal app dependencies

## Benefits

### Maintainability
- Single source of truth for API clients
- Consistent types across all apps
- Easier updates and bug fixes

### Scalability
- Independent app deployments
- Shared resources updated once
- Technology flexibility per app

### Developer Experience
- Clear architecture boundaries
- Consistent development patterns
- Reduced cognitive load
`;

fs.writeFileSync('docs/FRONTEND_ARCHITECTURE.md', architectureDoc);

console.log('\n✅ Apps Restructuring Complete!');
console.log('\n📋 Next Steps:');
console.log('1. Run: npm install');
console.log('2. Run: npm run build --workspace=@tripalfa/api-clients');
console.log('3. Update app imports to use @tripalfa/api-clients');
console.log('4. Test all applications');
console.log('5. Remove any remaining duplicated code');

console.log('\n🎯 Architecture successfully aligned with microservices principles!');