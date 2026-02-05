# NEON Database Integration Guide

## Overview

This guide provides comprehensive instructions for integrating the Booking Service with NEON PostgreSQL database service. NEON offers serverless PostgreSQL with autoscaling, branching, and bottomless storage, making it ideal for our booking management system.

**Important Note**: Static data will be deployed locally using Docker containers for development and testing environments, while production will use NEON PostgreSQL for scalability and reliability.

## Prerequisites

- NEON account with project created
- Database URL from NEON dashboard
- Node.js 18+ installed
- Prisma CLI installed globally
- Docker and Docker Compose installed (for static data deployment)

## Static Data Deployment (Local Development)

For local development and testing, static data will be deployed using Docker containers. This provides a consistent environment for development teams and testing scenarios.

### Docker Compose Configuration for Static Data

Create `docker-compose.static-data.yml`:

```yaml
version: '3.8'

services:
  # Static Data API Service
  static-data-api:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: booking-service-static-data
    ports:
      - "3001:3000"
    environment:
      - NODE_ENV=development
      - PORT=3000
      - DATABASE_URL=postgresql://postgres:password@postgres-static:5432/static_data
      - REDIS_URL=redis://redis-static:6379
      - JWT_SECRET=static-data-secret-key
    volumes:
      - ./static-data:/app/static-data
      - ./logs:/app/logs
    depends_on:
      - postgres-static
      - redis-static
    networks:
      - booking-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # PostgreSQL for Static Data
  postgres-static:
    image: postgres:15-alpine
    container_name: postgres-static-data
    environment:
      POSTGRES_DB: static_data
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - postgres-static-data:/var/lib/postgresql/data
      - ./static-data/sql:/docker-entrypoint-initdb.d
    ports:
      - "5433:5432"
    networks:
      - booking-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Redis for Static Data Caching
  redis-static:
    image: redis:7-alpine
    container_name: redis-static-data
    ports:
      - "6380:6379"
    volumes:
      - redis-static-data:/data
    networks:
      - booking-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Static Data Migration Service
  static-data-migration:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: static-data-migration
    environment:
      - DATABASE_URL=postgresql://postgres:password@postgres-static:5432/static_data
      - NODE_ENV=development
    volumes:
      - ./static-data:/app/static-data
      - ./migrations:/app/migrations
    depends_on:
      - postgres-static
    networks:
      - booking-network
    command: npm run migrate:static
    profiles:
      - migration

  # Static Data Seeding Service
  static-data-seeder:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: static-data-seeder
    environment:
      - DATABASE_URL=postgresql://postgres:password@postgres-static:5432/static_data
      - NODE_ENV=development
    volumes:
      - ./static-data:/app/static-data
      - ./seeds:/app/seeds
    depends_on:
      - postgres-static
    networks:
      - booking-network
    command: npm run seed:static
    profiles:
      - seed

volumes:
  postgres-static-data:
  redis-static-data:

networks:
  booking-network:
    driver: bridge
```

### Static Data Environment Configuration

Create `.env.static-data`:

```env
# Static Data Environment
NODE_ENV=development
PORT=3000

# Static Data Database
DATABASE_URL="postgresql://postgres:password@postgres-static:5432/static_data"
POSTGRES_DB=static_data
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password

# Static Data Redis
REDIS_URL="redis://redis-static:6379"
REDIS_HOST=redis-static
REDIS_PORT=6379
REDIS_PASSWORD=

# Static Data Authentication
JWT_SECRET="static-data-secret-key"
JWT_EXPIRES_IN=24h

# Static Data Logging
LOG_LEVEL=debug
LOG_FILE_PATH=./logs/static-data.log

# Static Data Monitoring
METRICS_ENABLED=true
HEALTH_CHECK_INTERVAL=30000
```

### Static Data Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "start:static": "cross-env NODE_ENV=development node src/app.js",
    "dev:static": "cross-env NODE_ENV=development nodemon src/app.js",
    "migrate:static": "cross-env NODE_ENV=development npx prisma migrate deploy",
    "seed:static": "cross-env NODE_ENV=development node scripts/seed-static.js",
    "docker:static": "docker-compose -f docker-compose.static-data.yml up -d",
    "docker:static-down": "docker-compose -f docker-compose.static-data.yml down",
    "docker:static-logs": "docker-compose -f docker-compose.static-data.yml logs -f"
  }
}
```

### Static Data Seeding Script

Create `scripts/seed-static.js`:

```javascript
const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

async function seedStaticData() {
  try {
    console.log('🌱 Seeding static data...')
    
    // Seed permissions
    const permissions = [
      { name: 'read_bookings', description: 'Read booking information', category: 'booking' },
      { name: 'create_bookings', description: 'Create new bookings', category: 'booking' },
      { name: 'update_bookings', description: 'Update booking information', category: 'booking' },
      { name: 'delete_bookings', description: 'Delete bookings', category: 'booking' },
      { name: 'assign_agents', description: 'Assign agents to bookings', category: 'booking' },
      { name: 'read_users', description: 'Read user information', category: 'user' },
      { name: 'create_users', description: 'Create new users', category: 'user' },
      { name: 'update_users', description: 'Update user information', category: 'user' },
      { name: 'delete_users', description: 'Delete users', category: 'user' },
      { name: 'manage_permissions', description: 'Manage user permissions', category: 'admin' },
      { name: 'manage_roles', description: 'Manage user roles', category: 'admin' },
      { name: 'view_reports', description: 'View system reports', category: 'report' },
      { name: 'export_data', description: 'Export system data', category: 'admin' }
    ]

    for (const permission of permissions) {
      await prisma.permission.upsert({
        where: { name: permission.name },
        update: permission,
        create: permission
      })
    }

    // Seed roles
    const roles = [
      {
        name: 'admin',
        description: 'Administrator with full system access',
        permissions: {
          connect: permissions.map(p => ({ name: p.name }))
        }
      },
      {
        name: 'manager',
        description: 'Manager with booking and user management access',
        permissions: {
          connect: permissions
            .filter(p => p.category !== 'admin')
            .map(p => ({ name: p.name }))
        }
      },
      {
        name: 'supervisor',
        description: 'Supervisor with booking management access',
        permissions: {
          connect: permissions
            .filter(p => ['booking', 'user'].includes(p.category))
            .map(p => ({ name: p.name }))
        }
      },
      {
        name: 'agent',
        description: 'Agent with basic booking access',
        permissions: {
          connect: permissions
            .filter(p => p.category === 'booking' && p.name !== 'delete_bookings')
            .map(p => ({ name: p.name }))
        }
      }
    ]

    for (const role of roles) {
      await prisma.role.upsert({
        where: { name: role.name },
        update: {
          description: role.description,
          permissions: role.permissions
        },
        create: role
      })
    }

    // Seed admin user
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@booking.com' },
      update: {
        name: 'Admin User',
        role: 'admin',
        status: 'active'
      },
      create: {
        email: 'admin@booking.com',
        name: 'Admin User',
        role: 'admin',
        status: 'active'
      }
    })

    // Assign admin role to admin user
    await prisma.user.update({
      where: { id: adminUser.id },
      data: {
        roles: {
          connect: { name: 'admin' }
        }
      }
    })

    console.log('✅ Static data seeded successfully!')
    
  } catch (error) {
    console.error('❌ Static data seeding failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  seedStaticData()
}

module.exports = { seedStaticData }
```

### Static Data SQL Scripts

Create `static-data/sql/01_permissions.sql`:

```sql
-- Permissions table
CREATE TABLE IF NOT EXISTS permissions (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR UNIQUE NOT NULL,
  description TEXT,
  category VARCHAR NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Roles table
CREATE TABLE IF NOT EXISTS roles (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Role permissions junction table
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id VARCHAR REFERENCES roles(id) ON DELETE CASCADE,
  permission_id VARCHAR REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR UNIQUE NOT NULL,
  name VARCHAR,
  role VARCHAR DEFAULT 'user',
  status VARCHAR DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- User roles junction table
CREATE TABLE IF NOT EXISTS user_roles (
  user_id VARCHAR REFERENCES users(id) ON DELETE CASCADE,
  role_id VARCHAR REFERENCES roles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id)
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type VARCHAR NOT NULL,
  resource_type VARCHAR NOT NULL,
  resource_id VARCHAR,
  user_id VARCHAR REFERENCES users(id),
  user_name VARCHAR,
  details JSONB,
  ip_address VARCHAR,
  user_agent TEXT,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_permissions_category ON permissions(category);
CREATE INDEX IF NOT EXISTS idx_roles_name ON roles(name);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
```

### Usage Commands

```bash
# Start static data environment
npm run docker:static

# View logs
npm run docker:static-logs

# Seed static data
npm run seed:static

# Stop static data environment
npm run docker:static-down

# Development with static data
npm run dev:static

# Production with static data
npm run start:static
```

### Environment Switching

To switch between NEON and static data environments:

```bash
# For NEON (Production)
export NODE_ENV=production
export DATABASE_URL="postgresql://user:password@ep-xyz.us-east-1.aws.neon.tech/booking_service?sslmode=require"

# For Static Data (Development)
export NODE_ENV=development
export DATABASE_URL="postgresql://postgres:password@localhost:5433/static_data"
```

This setup provides a complete local development environment with static data while maintaining the ability to switch to NEON for production deployments.

## Configuration

### Environment Variables

Update your `.env` file with NEON-specific configuration:

```env
# Database Configuration
DATABASE_URL="postgresql://user:password@ep-xyz.us-east-1.aws.neon.tech/booking_service?sslmode=require"

# NEON-specific settings
NEON_PROJECT_ID="your-project-id"
NEON_BRANCH_ID="your-branch-id"
NEON_POOL_TIMEOUT=30000
NEON_CONNECTION_LIMIT=20

# Application settings
NODE_ENV=production
PORT=3000

# Authentication
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN=24h

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
REDIS_DB=0

# Security
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
LOG_FILE_PATH=./logs/app.log

# Monitoring
METRICS_ENABLED=true
HEALTH_CHECK_INTERVAL=60000
```

### Prisma Configuration

Update `prisma/prisma.config.ts` for NEON:

```typescript
import { defineConfig } from '@prisma/client'

export default defineConfig({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
      // NEON-specific connection options
      directUrl: process.env.DATABASE_URL,
      shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL,
    },
  },
  generator: {
    client: {
      provider: 'prisma-client-js',
      // Enable NEON-specific features
      previewFeatures: ['driverAdapters'],
    },
  },
})
```

### Database Schema Updates

Update `prisma/schema.prisma` with NEON optimizations:

```prisma
// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
  output   = "../src/generated/client"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  
  // NEON-specific settings
  directUrl = env("DATABASE_URL")
  shadowDatabaseUrl = env("SHADOW_DATABASE_URL")
  
  // Connection pooling
  connectionLimit = 20
  maxConnections = 100
  idleTimeout = 30000
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  role      String   @default("user")
  status    String   @default("active")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relationships
  bookings     Booking[]
  permissions  Permission[]
  roles        Role[]
  assignedBookings Booking[] @relation("AgentAssignments")
  
  @@map("users")
}

model Booking {
  id              String   @id @default(cuid())
  reference       String   @unique
  type            String   // flight, hotel, package, transfer, visa, insurance
  status          String   @default("PENDING")
  customerInfo    Json
  details         Json
  pricing         Json
  bookingOptions  Json
  timeline        Json
  assignedAgentId String?
  createdByUserId String?
  paymentInfo     Json
  supplierInfo    Json
  auditTrail      Json[]
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Relationships
  assignedAgent   User?      @relation("AgentAssignments", fields: [assignedAgentId], references: [id])
  createdByUser   User?      @relation("UserBookings", fields: [createdByUserId], references: [id])
  
  @@map("bookings")
}

model Permission {
  id          String   @id @default(cuid())
  name        String   @unique
  description String?
  category    String
  createdAt   DateTime @default(now())

  // Relationships
  roles Role[]
  
  @@map("permissions")
}

model Role {
  id          String       @id @default(cuid())
  name        String       @unique
  description String?
  permissions Permission[]
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  // Relationships
  users User[]
  
  @@map("roles")
}

model AuditLog {
  id        String   @id @default(cuid())
  actionType String
  resourceType String
  resourceId String
  userId    String
  userName  String
  details   Json
  ipAddress String
  userAgent String
  timestamp DateTime @default(now())

  // Relationships
  user User @relation(fields: [userId], references: [id])
  
  @@map("audit_logs")
}

// NEON-specific optimizations
model Branch {
  id        String   @id @default(cuid())
  name      String   @unique
  projectId String
  createdAt DateTime @default(now())
  
  @@map("neon_branches")
}
```

## NEON-Specific Optimizations

### Connection Pooling

Create `src/config/database.ts`:

```typescript
import { PrismaClient } from '@prisma/client'
import { logger } from '../utils/logger'

// NEON connection pooling configuration
const prisma = new PrismaClient({
  log: [
    {
      emit: 'event',
      level: 'query',
    },
    {
      emit: 'event',
      level: 'error',
    },
    {
      emit: 'event',
      level: 'info',
    },
    {
      emit: 'event',
      level: 'warn',
    },
  ],
  // NEON-specific connection settings
  connectionLimit: 20,
  maxConnections: 100,
  idleTimeout: 30000,
})

// Log queries for debugging (remove in production)
prisma.$on('query', (e) => {
  if (process.env.NODE_ENV === 'development') {
    logger.debug(`Query: ${e.query}`)
    logger.debug(`Params: ${e.params}`)
    logger.debug(`Duration: ${e.duration}ms`)
  }
})

prisma.$on('error', (e) => {
  logger.error('Prisma error:', e)
})

prisma.$on('info', (e) => {
  logger.info('Prisma info:', e.message)
})

prisma.$on('warn', (e) => {
  logger.warn('Prisma warning:', e.message)
})

export { prisma }
```

### NEON Branch Management

Create `src/services/neonService.ts`:

```typescript
import { PrismaClient } from '@prisma/client'
import { logger } from '../utils/logger'
import axios from 'axios'

interface NeonBranch {
  id: string
  name: string
  projectId: string
  createdAt: string
  updatedAt: string
}

interface NeonProject {
  id: string
  name: string
  createdAt: string
}

export class NeonService {
  private prisma: PrismaClient
  private apiKey: string
  private projectId: string
  private baseUrl = 'https://console.neon.tech/api/v2'

  constructor() {
    this.prisma = new PrismaClient()
    this.apiKey = process.env.NEON_API_KEY || ''
    this.projectId = process.env.NEON_PROJECT_ID || ''
  }

  private getAuthHeaders() {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    }
  }

  async createBranch(name: string, parentBranchId?: string): Promise<NeonBranch> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/projects/${this.projectId}/branches`,
        {
          branch: {
            name,
            parent_id: parentBranchId,
          },
        },
        {
          headers: this.getAuthHeaders(),
        }
      )

      logger.info(`Created NEON branch: ${name}`)
      return response.data.branch
    } catch (error) {
      logger.error('Failed to create NEON branch:', error)
      throw error
    }
  }

  async listBranches(): Promise<NeonBranch[]> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/projects/${this.projectId}/branches`,
        {
          headers: this.getAuthHeaders(),
        }
      )

      return response.data.branches
    } catch (error) {
      logger.error('Failed to list NEON branches:', error)
      throw error
    }
  }

  async getBranch(branchId: string): Promise<NeonBranch> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/projects/${this.projectId}/branches/${branchId}`,
        {
          headers: this.getAuthHeaders(),
        }
      )

      return response.data.branch
    } catch (error) {
      logger.error('Failed to get NEON branch:', error)
      throw error
    }
  }

  async deleteBranch(branchId: string): Promise<boolean> {
    try {
      await axios.delete(
        `${this.baseUrl}/projects/${this.projectId}/branches/${branchId}`,
        {
          headers: this.getAuthHeaders(),
        }
      )

      logger.info(`Deleted NEON branch: ${branchId}`)
      return true
    } catch (error) {
      logger.error('Failed to delete NEON branch:', error)
      throw error
    }
  }

  async createMigrationBranch(migrationName: string): Promise<NeonBranch> {
    const branchName = `migration-${migrationName}-${Date.now()}`
    return this.createBranch(branchName, 'main')
  }

  async promoteBranchToMain(branchId: string): Promise<NeonBranch> {
    try {
      // First, create a new main branch from the migration branch
      const newMainBranch = await this.createBranch('main-temp', branchId)
      
      // Delete the old main branch
      await this.deleteBranch('main')
      
      // Rename the temp branch to main
      // Note: This is a simplified approach. In production, you'd want
      // to use NEON's branching and promotion features more carefully.
      
      logger.info(`Promoted branch ${branchId} to main`)
      return newMainBranch
    } catch (error) {
      logger.error('Failed to promote branch to main:', error)
      throw error
    }
  }

  async getProjectInfo(): Promise<NeonProject> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/projects/${this.projectId}`,
        {
          headers: this.getAuthHeaders(),
        }
      )

      return response.data.project
    } catch (error) {
      logger.error('Failed to get NEON project info:', error)
      throw error
    }
  }

  async getUsageMetrics(): Promise<any> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/projects/${this.projectId}/usage`,
        {
          headers: this.getAuthHeaders(),
        }
      )

      return response.data
    } catch (error) {
      logger.error('Failed to get NEON usage metrics:', error)
      throw error
    }
  }

  async scaleCompute(branchId: string, settings: {
    pgSettings?: Record<string, any>
    autoscaling?: {
      enabled: boolean
      min_cu: number
      max_cu: number
    }
  }): Promise<any> {
    try {
      const response = await axios.patch(
        `${this.baseUrl}/projects/${this.projectId}/branches/${branchId}/compute`,
        {
          settings,
        },
        {
          headers: this.getAuthHeaders(),
        }
      )

      logger.info(`Scaled compute for branch ${branchId}`)
      return response.data
    } catch (error) {
      logger.error('Failed to scale compute:', error)
      throw error
    }
  }
}

export const neonService = new NeonService()
```

### Database Migration Strategy

Create `scripts/migrate-neon.js`:

```javascript
const { neonService } = require('../services/neonService')
const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

async function migrateToNeon() {
  try {
    console.log('🚀 Starting NEON migration process...')
    
    // 1. Create a new migration branch
    const migrationName = `migration-${Date.now()}`
    console.log(`📝 Creating migration branch: ${migrationName}`)
    const migrationBranch = await neonService.createMigrationBranch(migrationName)
    
    // 2. Update environment to use the new branch
    const branchUrl = process.env.DATABASE_URL.replace(
      /@[^/]+/,
      `@${migrationBranch.id}.us-east-1.aws.neon.tech`
    )
    
    // 3. Run Prisma migrations
    console.log('🔄 Running Prisma migrations...')
    process.env.DATABASE_URL = branchUrl
    execSync('npx prisma migrate deploy', { stdio: 'inherit' })
    
    // 4. Seed the database if needed
    console.log('🌱 Seeding database...')
    if (fs.existsSync(path.join(__dirname, 'seed.js'))) {
      execSync('node scripts/seed.js', { stdio: 'inherit' })
    }
    
    // 5. Run tests against the new branch
    console.log('🧪 Running tests...')
    execSync('npm test', { stdio: 'inherit' })
    
    // 6. Promote to main if tests pass
    console.log('⬆️ Promoting to main branch...')
    await neonService.promoteBranchToMain(migrationBranch.id)
    
    console.log('✅ Migration completed successfully!')
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  migrateToNeon()
}

module.exports = { migrateToNeon }
```

## Deployment Configuration

### Docker Configuration

Update `Dockerfile` for NEON:

```dockerfile
# Multi-stage build for NEON compatibility
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN \
  if [ -f yarn.lock ]; then \
    yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then \
    npm ci; \
  elif [ -f pnpm-lock.yaml ]; then \
    yarn global add pnpm && pnpm install --frozen-lockfile; \
  else \
    echo "Lockfile not found." && exit 1; \
  fi


# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
# ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
# Uncomment the following line in case you want to disable telemetry during runtime.
# ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

### Kubernetes Configuration

Update `k8s/deployment.yaml` for NEON:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: booking-service
  labels:
    app: booking-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: booking-service
  template:
    metadata:
      labels:
        app: booking-service
    spec:
      containers:
      - name: booking-service
        image: booking-service:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: PORT
          value: "3000"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: neon-secrets
              key: database-url
        - name: NEON_PROJECT_ID
          valueFrom:
            secretKeyRef:
              name: neon-secrets
              key: project-id
        - name: NEON_API_KEY
          valueFrom:
            secretKeyRef:
              name: neon-secrets
              key: api-key
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: jwt-secret
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: redis-secrets
              key: redis-url
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Secret
metadata:
  name: neon-secrets
type: Opaque
stringData:
  database-url: "postgresql://user:password@ep-xyz.us-east-1.aws.neon.tech/booking_service?sslmode=require"
  project-id: "your-project-id"
  api-key: "your-neon-api-key"
---
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
type: Opaque
stringData:
  jwt-secret: "your-super-secret-jwt-key"
---
apiVersion: v1
kind: Secret
metadata:
  name: redis-secrets
type: Opaque
stringData:
  redis-url: "redis://user:password@redis-service:6379"
```

## Monitoring and Observability

### NEON-specific Metrics

Create `src/monitoring/neonMetrics.ts`:

```typescript
import { neonService } from '../services/neonService'
import { metricsStore } from './metrics'
import { logger } from '../utils/logger'

export class NeonMetrics {
  private static instance: NeonMetrics
  private monitoringInterval: NodeJS.Timeout | null = null

  static getInstance(): NeonMetrics {
    if (!NeonMetrics.instance) {
      NeonMetrics.instance = new NeonMetrics()
    }
    return NeonMetrics.instance
  }

  startMonitoring() {
    if (this.monitoringInterval) {
      return
    }

    this.monitoringInterval = setInterval(async () => {
      try {
        await this.collectMetrics()
      } catch (error) {
        logger.error('Failed to collect NEON metrics:', error)
      }
    }, 60000) // Collect metrics every minute

    logger.info('NEON metrics monitoring started')
  }

  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
      logger.info('NEON metrics monitoring stopped')
    }
  }

  private async collectMetrics() {
    try {
      // Get usage metrics
      const usage = await neonService.getUsageMetrics()
      
      // Record metrics
      metricsStore.gauge('neon.cpu_usage', usage.cpu_usage)
      metricsStore.gauge('neon.memory_usage', usage.memory_usage)
      metricsStore.gauge('neon.storage_usage', usage.storage_usage)
      metricsStore.gauge('neon.active_connections', usage.active_connections)
      
      // Get project info
      const project = await neonService.getProjectInfo()
      metricsStore.gauge('neon.project_age_days', 
        (Date.now() - new Date(project.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      )
      
      // Get branch info
      const branches = await neonService.listBranches()
      metricsStore.gauge('neon.branch_count', branches.length)
      
      logger.debug('NEON metrics collected successfully')
    } catch (error) {
      logger.error('Failed to collect NEON metrics:', error)
    }
  }

  async getBranchMetrics(branchId: string) {
    try {
      const branch = await neonService.getBranch(branchId)
      return {
        id: branch.id,
        name: branch.name,
        createdAt: branch.createdAt,
        updatedAt: branch.updatedAt,
      }
    } catch (error) {
      logger.error('Failed to get branch metrics:', error)
      throw error
    }
  }
}

export const neonMetrics = NeonMetrics.getInstance()
```

### Health Checks

Update health check endpoint to include NEON status:

```typescript
// In src/routes/health.ts
import { neonService } from '../services/neonService'
import { neonMetrics } from '../monitoring/neonMetrics'

app.get('/health', async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: await checkDatabaseHealth(),
        redis: await checkRedisHealth(),
        cache: await checkCacheHealth(),
        neon: await checkNeonHealth()
      },
      metrics: await getSystemMetrics()
    }

    res.json({
      success: true,
      data: health
    })
  } catch (error) {
    logger.error('Health check failed', { error: error instanceof Error ? error.message : 'Unknown error' })
    res.status(500).json({
      success: false,
      error: 'Health check failed'
    })
  }
})

async function checkNeonHealth() {
  try {
    const project = await neonService.getProjectInfo()
    const branches = await neonService.listBranches()
    
    return {
      status: 'healthy',
      projectId: project.id,
      branchCount: branches.length,
      lastUpdated: new Date().toISOString()
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
```

## Backup and Recovery

### Automated Backups

Create `scripts/backup-neon.js`:

```javascript
const { neonService } = require('../services/neonService')
const fs = require('fs')
const path = require('path')

async function createBackup() {
  try {
    console.log('💾 Creating NEON backup...')
    
    // Create a new branch for backup
    const backupName = `backup-${new Date().toISOString().replace(/[:.]/g, '-')}`
    const backupBranch = await neonService.createBranch(backupName, 'main')
    
    console.log(`✅ Backup created: ${backupBranch.name}`)
    console.log(`🔗 Backup branch ID: ${backupBranch.id}`)
    
    // Store backup info
    const backupInfo = {
      name: backupName,
      branchId: backupBranch.id,
      projectId: backupBranch.projectId,
      createdAt: backupBranch.createdAt,
      type: 'automated'
    }
    
    // Save backup info to file
    const backupDir = path.join(__dirname, '../backups')
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true })
    }
    
    fs.writeFileSync(
      path.join(backupDir, `${backupName}.json`),
      JSON.stringify(backupInfo, null, 2)
    )
    
    console.log('📁 Backup info saved')
    
    // Clean up old backups (keep last 10)
    await cleanupOldBackups()
    
  } catch (error) {
    console.error('❌ Backup failed:', error)
    throw error
  }
}

async function cleanupOldBackups() {
  try {
    const backupDir = path.join(__dirname, '../backups')
    if (!fs.existsSync(backupDir)) {
      return
    }
    
    const files = fs.readdirSync(backupDir)
      .filter(file => file.startsWith('backup-'))
      .sort()
      .reverse()
    
    // Keep only the last 10 backups
    const filesToDelete = files.slice(10)
    
    for (const file of filesToDelete) {
      const filePath = path.join(backupDir, file)
      const backupInfo = JSON.parse(fs.readFileSync(filePath, 'utf8'))
      
      // Delete the branch
      await neonService.deleteBranch(backupInfo.branchId)
      
      // Delete the file
      fs.unlinkSync(filePath)
      
      console.log(`🗑️ Deleted old backup: ${file}`)
    }
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error)
  }
}

if (require.main === module) {
  createBackup()
}

module.exports = { createBackup, cleanupOldBackups }
```

## Troubleshooting

### Common Issues

1. **Connection Timeouts**
   ```bash
   # Check connection settings
   export DATABASE_URL="postgresql://user:password@ep-xyz.us-east-1.aws.neon.tech/booking_service?sslmode=require&connection_limit=20"
   ```

2. **Migration Failures**
   ```bash
   # Create a new branch for migrations
   node scripts/migrate-neon.js
   ```

3. **Performance Issues**
   ```bash
   # Scale compute resources
   node -e "const { neonService } = require('./services/neonService'); neonService.scaleCompute('main', { autoscaling: { enabled: true, min_cu: 1, max_cu: 4 } })"
   ```

### Monitoring Commands

```bash
# Check NEON project status
curl -H "Authorization: Bearer $NEON_API_KEY" \
  "https://console.neon.tech/api/v2/projects/$NEON_PROJECT_ID"

# Get usage metrics
curl -H "Authorization: Bearer $NEON_API_KEY" \
  "https://console.neon.tech/api/v2/projects/$NEON_PROJECT_ID/usage"

# List branches
curl -H "Authorization: Bearer $NEON_API_KEY" \
  "https://console.neon.tech/api/v2/projects/$NEON_PROJECT_ID/branches"
```

## Best Practices

1. **Use Branches for Development**: Create separate branches for features and testing
2. **Monitor Usage**: Set up alerts for high usage or performance issues
3. **Regular Backups**: Automate backup creation and cleanup
4. **Connection Pooling**: Configure appropriate connection limits
5. **SSL Connections**: Always use SSL mode for security
6. **Environment Separation**: Use different NEON projects for dev/staging/prod

This NEON integration provides a robust, scalable database solution for the Booking Service with automatic scaling, branching, and comprehensive monitoring capabilities.