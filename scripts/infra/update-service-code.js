#!/usr/bin/env node

/**
 * TripAlfa Service Code Update Script
 * Updates service code to use service-specific databases and API communication
 *
 * Usage:
 * node scripts/update-service-code.js [service-name]
 *
 * If no service-name is provided, updates all services
 */

const fs = require('fs').promises;
const path = require('path');
const { glob } = require('glob');

class ServiceCodeUpdater {
  constructor() {
    this.services = [
      'user-service',
      'audit-service',
      'payment-service',
      'booking-service',
      'notification-service'
    ];
  }

  async updateServiceImports(serviceName) {
    console.log(`🔄 Updating imports for ${serviceName}...`);

    const servicePath = path.join('services', serviceName);
    const srcPath = path.join(servicePath, 'src');

    // Find all TypeScript files
    const tsFiles = await glob('**/*.ts', { cwd: srcPath });

    for (const file of tsFiles) {
      const filePath = path.join(srcPath, file);
      let content = await fs.readFile(filePath, 'utf8');
      let updated = false;

      // Replace shared Prisma imports with service-specific imports
      if (content.includes('@prisma/client')) {
        // Replace with service-specific database import
        content = content.replace(
          /import\s+{\s*PrismaClient\s*}\s+from\s+['"]@prisma\/client['"]/g,
          `import { prisma } from '../database.js'`
        );
        updated = true;
      }

      // Replace shared database imports
      if (content.includes('@tripalfa/shared-database')) {
        content = content.replace(
          /import\s+.*from\s+['"]@tripalfa\/shared-database['"]/g,
          `import { prisma } from '../database.js'`
        );
        updated = true;
      }

      // Replace direct database queries with API calls for cross-service communication
      if (serviceName === 'booking-service' && content.includes('User')) {
        // Replace direct user queries with API calls
        content = content.replace(
          /prisma\.user\./g,
          `// TODO: Replace with user-service API call\n    // `
        );
        updated = true;
      }

      if (updated) {
        await fs.writeFile(filePath, content, 'utf8');
        console.log(`  ✅ Updated ${file}`);
      }
    }
  }

  async createApiClients(serviceName) {
    console.log(`🌐 Creating API clients for ${serviceName}...`);

    const servicePath = path.join('services', serviceName);
    const srcPath = path.join(servicePath, 'src');
    const clientsPath = path.join(srcPath, 'clients');

    // Create clients directory
    await fs.mkdir(clientsPath, { recursive: true });

    // Create API client for cross-service communication
    const apiClientContent = `/**
 * API Client for ${serviceName}
 * Handles communication with other microservices
 */

import axios, { AxiosInstance } from 'axios';

export class ApiClient {
  private httpClient: AxiosInstance;

  constructor(baseURL?: string) {
    this.httpClient = axios.create({
      baseURL: baseURL || process.env.API_GATEWAY_URL || 'http://localhost:3000',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor for authentication
    this.httpClient.interceptors.request.use((config) => {
      // Add JWT token if available
      const token = process.env.JWT_TOKEN || '';
      if (token) {
        config.headers.Authorization = \`Bearer \${token}\`;
      }
      return config;
    });
  }

  // User Service API calls
  async getUser(userId: string) {
    const response = await this.httpClient.get(\`/api/users/\${userId}\`);
    return response.data;
  }

  async getUserByEmail(email: string) {
    const response = await this.httpClient.get(\`/api/users/by-email/\${email}\`);
    return response.data;
  }

  async createUser(userData: any) {
    const response = await this.httpClient.post('/api/users', userData);
    return response.data;
  }

  async updateUser(userId: string, userData: any) {
    const response = await this.httpClient.put(\`/api/users/\${userId}\`, userData);
    return response.data;
  }

  // Booking Service API calls
  async getBooking(bookingId: string) {
    const response = await this.httpClient.get(\`/api/bookings/\${bookingId}\`);
    return response.data;
  }

  async createBooking(bookingData: any) {
    const response = await this.httpClient.post('/api/bookings', bookingData);
    return response.data;
  }

  async updateBookingStatus(bookingId: string, status: string) {
    const response = await this.httpClient.patch(\`/api/bookings/\${bookingId}/status\`, { status });
    return response.data;
  }

  // Payment Service API calls
  async processPayment(paymentData: any) {
    const response = await this.httpClient.post('/api/payments', paymentData);
    return response.data;
  }

  async getPaymentStatus(paymentId: string) {
    const response = await this.httpClient.get(\`/api/payments/\${paymentId}/status\`);
    return response.data;
  }

  // Notification Service API calls
  async sendNotification(notificationData: any) {
    const response = await this.httpClient.post('/api/notifications', notificationData);
    return response.data;
  }

  async getNotificationTemplates() {
    const response = await this.httpClient.get('/api/notifications/templates');
    return response.data;
  }

  // Audit Service API calls
  async logEvent(eventData: any) {
    const response = await this.httpClient.post('/api/audit/events', eventData);
    return response.data;
  }

  async getAuditLogs(filters: any = {}) {
    const response = await this.httpClient.get('/api/audit/logs', { params: filters });
    return response.data;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
`;

    await fs.writeFile(path.join(clientsPath, 'api-client.ts'), apiClientContent);
    console.log(`  ✅ Created API client for ${serviceName}`);
  }

  async updateServiceConfiguration(serviceName) {
    console.log(`⚙️  Updating configuration for ${serviceName}...`);

    const servicePath = path.join('services', serviceName);
    const envExamplePath = path.join(servicePath, '.env.example');

    // Create or update .env.example with service-specific database URL
    const envContent = `# ${serviceName.toUpperCase().replace('-', '_')} Configuration

# Database
# Set this to your PostgreSQL connection string
# Example: postgresql://user:password@host:port/database?sslmode=require
DATABASE_URL=

# Service Configuration
NODE_ENV=development
PORT=3001
LOG_LEVEL=debug

# JWT
JWT_SECRET=your-jwt-secret-key-change-in-production

# API Gateway
API_GATEWAY_URL=http://localhost:3000

# External APIs (service-specific)
# Add your service-specific API keys and configurations here
`;

    await fs.writeFile(envExamplePath, envContent);
    console.log(`  ✅ Updated .env.example for ${serviceName}`);
  }

  async createHealthCheck(serviceName) {
    console.log(`🏥 Creating health check for ${serviceName}...`);

    const servicePath = path.join('services', serviceName);
    const srcPath = path.join(servicePath, 'src');

    const healthCheckContent = `/**
 * Health Check Endpoint for ${serviceName}
 */

import express, { Request, Response } from 'express';
import { prisma } from '../database.js';

export const healthRouter = express.Router();

// Basic health check
healthRouter.get('/health', async (req: Request, res: Response) => {
  try {
    // Check database connectivity
    await prisma.$queryRaw\`SELECT 1\`;

    res.json({
      status: 'healthy',
      service: '${serviceName}',
      timestamp: new Date().toISOString(),
      database: 'connected',
      version: process.env.npm_package_version || '1.0.0'
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      service: '${serviceName}',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message
    });
  }
});

// Detailed health check
healthRouter.get('/health/detailed', async (req: Request, res: Response) => {
  const checks = {
    database: false,
    memory: true,
    uptime: process.uptime()
  };

  try {
    // Database check
    await prisma.$queryRaw\`SELECT 1\`;
    checks.database = true;
  } catch (error) {
    console.error('Database health check failed:', error);
  }

  const isHealthy = Object.values(checks).every(check => check === true);

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'unhealthy',
    service: '${serviceName}',
    timestamp: new Date().toISOString(),
    checks,
    version: process.env.npm_package_version || '1.0.0'
  });
});
`;

    await fs.writeFile(path.join(srcPath, 'health.ts'), healthCheckContent);
    console.log(`  ✅ Created health check for ${serviceName}`);
  }

  async updatePackageJson(serviceName) {
    console.log(`📦 Updating package.json for ${serviceName}...`);

    const servicePath = path.join('services', serviceName);
    const packageJsonPath = path.join(servicePath, 'package.json');

    try {
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));

      // Add API client dependencies
      if (!packageJson.dependencies.axios) {
        packageJson.dependencies.axios = '^1.6.0';
      }

      // Update scripts
      packageJson.scripts = {
        ...packageJson.scripts,
        'dev': 'tsx watch src/index.ts',
        'build': 'tsc',
        'start': 'node dist/index.js',
        'lint': 'eslint src --ext .ts',
        'test': 'jest',
        'db:generate': 'prisma generate',
        'db:push': 'prisma db push',
        'db:migrate': 'prisma migrate dev',
        'db:studio': 'prisma studio'
      };

      await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
      console.log(`  ✅ Updated package.json for ${serviceName}`);

    } catch (error) {
      console.error(`❌ Error updating package.json for ${serviceName}:`, error);
    }
  }

  async run(serviceName = null) {
    const startTime = Date.now();

    try {
      const servicesToUpdate = serviceName ? [serviceName] : this.services;

      for (const service of servicesToUpdate) {
        if (!this.services.includes(service)) {
          console.error(`❌ Unknown service: ${service}`);
          continue;
        }

        console.log(`\n🔄 Updating service: ${service}`);

        await this.updateServiceImports(service);
        await this.createApiClients(service);
        await this.updateServiceConfiguration(service);
        await this.createHealthCheck(service);
        await this.updatePackageJson(service);

        console.log(`✅ Service ${service} updated successfully`);
      }

      const duration = (Date.now() - startTime) / 1000;
      console.log(`\n🎉 All services updated successfully in ${duration.toFixed(2)} seconds`);

      console.log(`\n📋 Next steps:`);
      console.log(`1. Review and fix any TODO comments in the updated code`);
      console.log(`2. Update API Gateway routes to proxy to individual services`);
      console.log(`3. Test service-to-service communication`);
      console.log(`4. Update frontend applications to use new API endpoints`);

    } catch (error) {
      console.error('💥 Service update failed:', error);
      process.exit(1);
    }
  }
}

// CLI interface
async function main() {
  const serviceName = process.argv[2];

  if (serviceName && !['user-service', 'audit-service', 'payment-service', 'booking-service', 'notification-service'].includes(serviceName)) {
    console.error('❌ Invalid service name. Valid options: user-service, audit-service, payment-service, booking-service, notification-service');
    process.exit(1);
  }

  const updater = new ServiceCodeUpdater();
  await updater.run(serviceName);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = ServiceCodeUpdater;
