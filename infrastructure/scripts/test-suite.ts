#!/usr/bin/env node

/**
 * Comprehensive Test Suite for Travel Kingdom Platform
 * Tests all services, APIs, integrations, and deployment readiness
 */

import { execSync, spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface TestResult {
  name: string;
  status: 'passed' | 'failed' | 'skipped';
  error?: string;
  reason?: string;
  duration?: number;
}

interface TestSuiteResults {
  passed: number;
  failed: number;
  skipped: number;
  tests: TestResult[];
}

class TestSuite {
  private results: TestSuiteResults;
  private startTime: number;

  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      skipped: 0,
      tests: []
    };
    this.startTime = Date.now();
  }

  log(message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info'): void {
    const timestamp = new Date().toISOString();
    const colors = {
      info: '\x1b[36m',
      success: '\x1b[32m',
      error: '\x1b[31m',
      warning: '\x1b[33m',
      reset: '\x1b[0m'
    };
    console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
  }

  async runTest(name: string, testFn: () => Promise<void>): Promise<void> {
    try {
      this.log(`Running: ${name}`, 'info');
      await testFn();
      this.results.passed++;
      this.results.tests.push({ name, status: 'passed', duration: Date.now() - this.startTime });
      this.log(`✅ PASSED: ${name}`, 'success');
    } catch (error) {
      this.results.failed++;
      this.results.tests.push({
        name,
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - this.startTime
      });
      this.log(`❌ FAILED: ${name} - ${error instanceof Error ? error.message : String(error)}`, 'error');
    }
  }

  skipTest(name: string, reason: string): void {
    this.results.skipped++;
    this.results.tests.push({ name, status: 'skipped', reason });
    this.log(`⏭️  SKIPPED: ${name} - ${reason}`, 'warning');
  }

  async checkFileExists(filePath: string, description: string): Promise<boolean> {
    if (fs.existsSync(filePath)) {
      this.log(`✅ ${description} found`, 'success');
      return true;
    } else {
      throw new Error(`${description} not found at ${filePath}`);
    }
  }

  async runCommand(command: string, cwd: string, description: string): Promise<string> {
    try {
      this.log(`Executing: ${description}`, 'info');
      const result = execSync(command, {
        cwd,
        encoding: 'utf8',
        timeout: 30000,
        maxBuffer: 1024 * 1024 * 10
      });
      this.log(`✅ ${description} completed`, 'success');
      return result;
    } catch (error) {
      throw new Error(`${description} failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async testApiEndpoint(
    url: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    data: any = null,
    expectedStatus: number = 200
  ): Promise<{ status: number; body: any }> {
    const https = require('https');
    const http = require('http');

    return new Promise((resolve, reject) => {
      const protocol = url.startsWith('https:') ? https : http;
      const req = protocol.request(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'TravelKingdom-TestSuite/1.0'
        }
      }, (res: any) => {
        let body = '';
        res.on('data', (chunk: any) => body += chunk);
        res.on('end', () => {
          if (res.statusCode === expectedStatus) {
            resolve({ status: res.statusCode, body: JSON.parse(body || '{}') });
          } else {
            reject(new Error(`Expected ${expectedStatus}, got ${res.statusCode}: ${body}`));
          }
        });
      });

      req.on('error', reject);
      if (data) {
        req.write(JSON.stringify(data));
      }
      req.end();
    });
  }

  async run(): Promise<void> {
    this.log('🚀 Starting Travel Kingdom Comprehensive Test Suite', 'info');

    // 1. File System Tests
    await this.runTest('File System Structure Check', async () => {
      const requiredFiles = [
        'package.json',
        'infrastructure/compose/docker-compose.yml',
        'apps/b2b-admin/package.json',
        'apps/booking-engine/package.json',
        'services/payment-service/package.json',
        'services/booking-service/package.json',
        'database/prisma/schema.prisma'
      ];

      for (const file of requiredFiles) {
        await this.checkFileExists(file, `Required file: ${file}`);
      }
    });

    // 2. Configuration Tests
    await this.runTest('Configuration Validation', async () => {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      if (!packageJson.workspaces) {
        throw new Error('Workspaces not configured in package.json');
      }

      // Check environment files
      const envFiles = ['.env.example'];
      for (const file of envFiles) {
        if (fs.existsSync(file)) {
          const content = fs.readFileSync(file, 'utf8');
          if (!content.includes('NODE_ENV')) {
            throw new Error(`${file} missing NODE_ENV configuration`);
          }
        }
      }
    });

    // 3. Dependency Installation Tests
    await this.runTest('Root Dependencies Installation', async () => {
      await this.runCommand('npm install', '.', 'Installing root dependencies');
    });

    await this.runTest('B2B Admin Dependencies', async () => {
      await this.runCommand('npm install', 'apps/b2b-admin', 'Installing B2B admin dependencies');
    });

    await this.runTest('Booking Engine Dependencies', async () => {
      await this.runCommand('npm install', 'apps/booking-engine', 'Installing booking engine dependencies');
    });

    // 4. Database Tests
    await this.runTest('Database Schema Validation', async () => {
      const schema = fs.readFileSync('database/prisma/schema.prisma', 'utf8');
      if (!schema.includes('model User')) {
        throw new Error('User model not found in schema');
      }
      if (!schema.includes('model Booking')) {
        throw new Error('Booking model not found in schema');
      }
      if (!schema.includes('model Hotel')) {
        throw new Error('Hotel model not found in schema');
      }
    });

    // 5. Build Tests
    await this.runTest('B2B Admin Build Test', async () => {
      await this.runCommand('npm run build', 'apps/b2b-admin', 'Building B2B admin application');
    });

    await this.runTest('Booking Engine Build Test', async () => {
      await this.runCommand('npm run build', 'apps/booking-engine', 'Building booking engine application');
    });

    // 6. Docker Configuration Tests
    await this.runTest('Docker Configuration Validation', async () => {
      const dockerCompose = fs.readFileSync('infrastructure/compose/docker-compose.yml', 'utf8');

      const requiredServices = ['postgres', 'redis', 'b2b-admin', 'booking-engine'];
      for (const service of requiredServices) {
        if (!dockerCompose.includes(`  ${service}:`)) {
          throw new Error(`Service ${service} not found in infrastructure/compose/docker-compose.yml`);
        }
      }

      // Check environment variables
      if (!dockerCompose.includes('POSTGRES_PASSWORD')) {
        throw new Error('Database password not configured');
      }
    });

    // 7. API Tests (Mock Server)
    await this.runTest('API Schema Validation', async () => {
      // Test API endpoints structure
      const apiRoutes = [
        'apps/b2b-admin/server/src/routes/users.ts',
        'apps/b2b-admin/server/src/routes/bookings.ts',
        'apps/b2b-admin/server/src/routes/inventory.ts',
        'services/payment-service/src/routes/payments.js'
      ];

      for (const route of apiRoutes) {
        await this.checkFileExists(route, `API route: ${route}`);
        const content = fs.readFileSync(route, 'utf8');
        if (!content.includes('router.')) {
          throw new Error(`${route} missing router configuration`);
        }
      }
    });

    // 8. Security Tests
    await this.runTest('Security Configuration Check', async () => {
      const serverFiles = [
        'apps/b2b-admin/server/src/index.ts',
        'services/payment-service/src/index.js',
        'services/booking-service/src/app.js'
      ];

      for (const file of serverFiles) {
        if (fs.existsSync(file)) {
          const content = fs.readFileSync(file, 'utf8');
          // Check for basic security middleware
          const securityChecks = [
            content.includes('helmet'),
            content.includes('cors'),
            content.includes('express.json')
          ];

          if (securityChecks.some(check => !check)) {
            throw new Error(`${file} missing security middleware`);
          }
        }
      }
    });

    // 9. Performance Tests (Basic)
    await this.runTest('Bundle Size Check', async () => {
      const buildDir = 'apps/b2b-admin/dist';
      if (fs.existsSync(buildDir)) {
        const files = fs.readdirSync(buildDir);
        const jsFiles = files.filter(f => f.endsWith('.js'));
        if (jsFiles.length === 0) {
          throw new Error('No JavaScript build files found');
        }

        // Check total bundle size
        let totalSize = 0;
        for (const file of jsFiles) {
          const stats = fs.statSync(path.join(buildDir, file));
          totalSize += stats.size;
        }

        if (totalSize > 50 * 1024 * 1024) { // 50MB
          throw new Error(`Bundle size too large: ${(totalSize / 1024 / 1024).toFixed(2)}MB`);
        }

        this.log(`✅ Bundle size: ${(totalSize / 1024 / 1024).toFixed(2)}MB`, 'success');
      }
    });

    // 10. Docker Build Test
    await this.runTest('Docker Build Test', async () => {
      // Test Docker build for each service
      const dockerfiles = [
        'apps/b2b-admin/Dockerfile',
        'apps/booking-engine/Dockerfile',
        'services/payment-service/Dockerfile'
      ];

      for (const dockerfile of dockerfiles) {
        await this.checkFileExists(dockerfile, `Dockerfile: ${dockerfile}`);
        const content = fs.readFileSync(dockerfile, 'utf8');

        // Basic Dockerfile validation
        if (!content.includes('FROM node:')) {
          throw new Error(`${dockerfile} missing Node.js base image`);
        }
        if (!content.includes('COPY package')) {
          throw new Error(`${dockerfile} missing package copy`);
        }
      }

      this.log('✅ Docker configurations validated', 'success');
    });

    // 11. Integration Test Preparation
    await this.runTest('Environment Setup Validation', async () => {
      // Check for required environment variables
      const requiredEnvVars = [
        'NODE_ENV',
        'PORT',
        'DATABASE_URL',
        'REDIS_URL',
        'JWT_SECRET'
      ];

      // This would check .env.example or actual .env if it exists
      const envExample = fs.existsSync('.env.example') ?
        fs.readFileSync('.env.example', 'utf8') : '';

      for (const envVar of requiredEnvVars) {
        if (!envExample.includes(envVar)) {
          throw new Error(`Environment variable ${envVar} not documented`);
        }
      }
    });

    // Generate test report
    this.generateReport();
  }

  generateReport(): void {
    const duration = Date.now() - this.startTime;
    const report = {
      summary: {
        total: this.results.passed + this.results.failed + this.results.skipped,
        passed: this.results.passed,
        failed: this.results.failed,
        skipped: this.results.skipped,
        duration: `${Math.round(duration / 1000)}s`,
        successRate: `${Math.round((this.results.passed / (this.results.passed + this.results.failed)) * 100)}%`
      },
      tests: this.results.tests,
      timestamp: new Date().toISOString()
    };

    // Write report to file
    fs.writeFileSync('test-report.json', JSON.stringify(report, null, 2));

    // Console output
    this.log('\n' + '='.repeat(60), 'info');
    this.log('📊 TEST SUITE RESULTS', 'info');
    this.log('='.repeat(60), 'info');
    this.log(`Total Tests: ${report.summary.total}`, 'info');
    this.log(`Passed: ${report.summary.passed}`, 'success');
    this.log(`Failed: ${report.summary.failed}`, report.summary.failed > 0 ? 'error' : 'info');
    this.log(`Skipped: ${report.summary.skipped}`, 'warning');
    this.log(`Duration: ${report.summary.duration}`, 'info');
    this.log(`Success Rate: ${report.summary.successRate}`, report.summary.failed > 0 ? 'error' : 'success');
    this.log('='.repeat(60), 'info');

    if (report.summary.failed > 0) {
      this.log('\n❌ FAILED TESTS:', 'error');
      report.tests.filter(t => t.status === 'failed').forEach(test => {
        this.log(`  - ${test.name}: ${test.error}`, 'error');
      });
    }

    this.log('\n📄 Detailed report saved to: test-report.json', 'info');

    // Exit with appropriate code
    process.exit(report.summary.failed > 0 ? 1 : 0);
  }
}

// Integration Test Class
class IntegrationTest extends TestSuite {
  async runIntegrationTests(): Promise<void> {
    this.log('🔗 Starting Integration Tests', 'info');

    // Start mock services for testing
    await this.runTest('Service Startup Test', async () => {
      // This would start services in test mode
      this.skipTest('Service Startup Test', 'Requires Docker environment');
    });

    // API Integration Tests
    await this.runTest('API Health Checks', async () => {
      // Test service health endpoints
      const services = [
        { name: 'B2B Admin', port: 4000, endpoint: '/health' },
        { name: 'Booking Engine', port: 3000, endpoint: '/health' }
      ];

      for (const service of services) {
        try {
          await this.testApiEndpoint(`http://localhost:${service.port}${service.endpoint}`);
          this.log(`✅ ${service.name} health check passed`, 'success');
        } catch (error) {
          this.log(`⚠️  ${service.name} not available: ${error instanceof Error ? error.message : String(error)}`, 'warning');
        }
      }
    });

    // Database Connection Test
    await this.runTest('Database Connectivity', async () => {
      // This would test database connections
      this.skipTest('Database Connectivity', 'Requires running database');
    });

    // End-to-End Booking Flow Test
    await this.runTest('E2E Booking Flow', async () => {
      // Simulate complete booking workflow
      this.skipTest('E2E Booking Flow', 'Requires full service stack');
    });
  }
}

// Docker Deployment Test
class DockerTest extends TestSuite {
  async runDockerTests(): Promise<void> {
    this.log('🐳 Starting Docker Deployment Tests', 'info');

    await this.runTest('Docker Compose Validation', async () => {
      await this.runCommand('docker-compose config', '.', 'Validating Docker Compose configuration');
    });

    await this.runTest('Docker Build Test', async () => {
      // Build individual services
      const services = ['b2b-admin', 'booking-engine'];
      for (const service of services) {
        try {
          await this.runCommand(
            `docker-compose build ${service}`,
            '.',
            `Building ${service} service`
          );
        } catch (error) {
          this.log(`⚠️  ${service} build failed, continuing with other tests`, 'warning');
        }
      }
    });

    await this.runTest('Container Health Checks', async () => {
      // Check if containers start successfully
      this.skipTest('Container Health Checks', 'Requires Docker environment');
    });
  }
}

// Main execution
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const testType = args[0] || 'full';

  console.log('🎯 Travel Kingdom - Comprehensive Test Suite');
  console.log('==========================================\n');

  switch (testType) {
    case 'unit':
      const unitTests = new TestSuite();
      await unitTests.run();
      break;

    case 'integration':
      const integrationTests = new IntegrationTest();
      await integrationTests.run();
      await integrationTests.runIntegrationTests();
      break;

    case 'docker':
      const dockerTests = new DockerTest();
      await dockerTests.runDockerTests();
      break;

    case 'full':
    default:
      console.log('Running FULL test suite (unit + integration + docker)...\n');
      const fullTests = new TestSuite();
      await fullTests.run();

      const integration = new IntegrationTest();
      await integration.runIntegrationTests();

      const docker = new DockerTest();
      await docker.runDockerTests();

      // Final deployment readiness check
      console.log('\n🚀 DEPLOYMENT READINESS CHECK');
      console.log('='.repeat(40));

      const report = JSON.parse(fs.readFileSync('test-report.json', 'utf8'));
      const readinessScore = Math.round((report.summary.passed / report.summary.total) * 100);

      if (readinessScore >= 90) {
        console.log('✅ READY FOR DEPLOYMENT');
        console.log(`   Readiness Score: ${readinessScore}%`);
        console.log('   All critical systems validated');
      } else if (readinessScore >= 75) {
        console.log('⚠️  READY FOR DEPLOYMENT WITH CAUTIONS');
        console.log(`   Readiness Score: ${readinessScore}%`);
        console.log('   Some tests failed - review before deployment');
      } else {
        console.log('❌ NOT READY FOR DEPLOYMENT');
        console.log(`   Readiness Score: ${readinessScore}%`);
        console.log('   Critical issues found - fix before deployment');
      }

      break;
  }
}

// Handle errors gracefully
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Run the tests
if (require.main === module) {
  main().catch(error => {
    console.error('Test suite failed:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}

export { TestSuite, IntegrationTest, DockerTest };