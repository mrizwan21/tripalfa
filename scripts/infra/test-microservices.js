#!/usr/bin/env node

/**
 * TripAlfa Microservices Testing Suite
 * Comprehensive testing for the microservices architecture
 *
 * Usage:
 * node scripts/test-microservices.js [test-type] [service-name]
 *
 * Test Types:
 * - unit: Test individual services
 * - integration: Test service-to-service communication
 * - e2e: Test complete user journeys
 * - performance: Load testing
 * - health: Check all service health endpoints
 */

const axios = require('axios');
const { Client } = require('pg');
const { performance } = require('perf_hooks');

class MicroservicesTester {
  constructor() {
    this.services = {
      'api-gateway': { port: 3000, name: 'API Gateway' },
      'booking-service': { port: 3001, name: 'Booking Service', db: 'tripalfa_booking_service' },
      'payment-service': { port: 3003, name: 'Payment Service', db: 'tripalfa_payment_service' },
      'user-service': { port: 3004, name: 'User Service', db: 'tripalfa_user_service' },
      'audit-service': { port: 3012, name: 'Audit Service', db: 'tripalfa_audit_service' },
      'notification-service': { port: 3013, name: 'Notification Service', db: 'tripalfa_notification_service' }
    };

    this.baseUrl = 'http://localhost';
    // Use DATABASE_URL from .env.local/.env.neon for DB connection
    // Example: postgresql://<username>:<password>@<host>:<port>/<database>
    this.dbUrl = process.env.DATABASE_URL || '';
  }

  async runHealthChecks() {
    console.log('🏥 Running Health Checks for All Services...\n');

    const results = {};

    for (const [service, config] of Object.entries(this.services)) {
      try {
        const startTime = performance.now();
        const response = await axios.get(`${this.baseUrl}:${config.port}/health`, {
          timeout: 5000
        });
        const endTime = performance.now();
        const responseTime = (endTime - startTime).toFixed(2);

        if (response.status === 200 && response.data.status === 'healthy') {
          console.log(`✅ ${config.name}: Healthy (${responseTime}ms)`);
          results[service] = { status: 'healthy', responseTime: `${responseTime}ms` };
        } else {
          console.log(`⚠️  ${config.name}: Unhealthy (${response.status})`);
          results[service] = { status: 'unhealthy', responseTime: `${responseTime}ms` };
        }
      } catch (error) {
        console.log(`❌ ${config.name}: Failed (${error.code || 'TIMEOUT'})`);
        results[service] = { status: 'failed', error: error.message };
      }
    }

    console.log('\n📊 Health Check Summary:');
    const healthy = Object.values(results).filter(r => r.status === 'healthy').length;
    const total = Object.keys(results).length;
    console.log(`${healthy}/${total} services healthy`);

    return results;
  }

  async testDatabaseConnections() {
    console.log('🗄️  Testing Database Connections...\n');

    const results = {};

    for (const [service, config] of Object.entries(this.services)) {
      if (!config.db) continue;

      try {
        const client = new Client({
          connectionString: `${this.dbUrl}${config.db}?sslmode=require`
        });

        await client.connect();
        await client.query('SELECT 1');
        await client.end();

        console.log(`✅ ${config.name} Database: Connected`);
        results[service] = { status: 'connected' };
      } catch (error) {
        console.log(`❌ ${config.name} Database: Failed (${error.code})`);
        results[service] = { status: 'failed', error: error.message };
      }
    }

    return results;
  }

  async runUnitTests(serviceName = null) {
    console.log('🧪 Running Unit Tests...\n');

    const servicesToTest = serviceName ? [serviceName] : Object.keys(this.services).filter(s => s !== 'api-gateway');

    for (const service of servicesToTest) {
      if (!this.services[service]) {
        console.log(`❌ Unknown service: ${service}`);
        continue;
      }

      console.log(`Testing ${this.services[service].name}...`);

      try {
        const { execSync } = require('child_process');
        execSync(`cd services/${service} && npm test`, {
          stdio: 'inherit',
          timeout: 30000
        });
        console.log(`✅ ${this.services[service].name}: Tests passed`);
      } catch (error) {
        console.log(`❌ ${this.services[service].name}: Tests failed`);
      }
    }
  }

  async runIntegrationTests() {
    console.log('🔗 Running Integration Tests...\n');

    const tests = [
      {
        name: 'User Service → Booking Service',
        test: async () => {
          // Test user creation and booking association
          const userResponse = await axios.post(`${this.baseUrl}:3004/api/users`, {
            email: `test-${Date.now()}@example.com`,
            name: 'Test User',
            password: 'testpass123'
          });

          const bookingResponse = await axios.post(`${this.baseUrl}:3001/api/bookings`, {
            userId: userResponse.data.id,
            bookingReference: `TEST-${Date.now()}`,
            totalAmount: 1000,
            currency: 'USD'
          });

          return { userId: userResponse.data.id, bookingId: bookingResponse.data.id };
        }
      },
      {
        name: 'Booking Service → Payment Service',
        test: async () => {
          const paymentResponse = await axios.post(`${this.baseUrl}:3003/api/payments`, {
            amount: 1000,
            currency: 'USD',
            bookingId: 'test-booking-id',
            paymentMethod: 'card'
          });

          return { paymentId: paymentResponse.data.id };
        }
      },
      {
        name: 'Payment Success → Notification Service',
        test: async () => {
          const notificationResponse = await axios.post(`${this.baseUrl}:3013/api/notifications`, {
            type: 'payment_success',
            recipient: 'test@example.com',
            data: { amount: 1000, bookingRef: 'TEST-123' }
          });

          return { notificationId: notificationResponse.data.id };
        }
      }
    ];

    const results = {};

    for (const test of tests) {
      try {
        console.log(`Testing: ${test.name}`);
        const startTime = performance.now();
        const result = await test.test();
        const endTime = performance.now();
        const duration = (endTime - startTime).toFixed(2);

        console.log(`✅ ${test.name}: Passed (${duration}ms)`);
        results[test.name] = { status: 'passed', duration: `${duration}ms`, data: result };
      } catch (error) {
        console.log(`❌ ${test.name}: Failed (${error.response?.status || error.code})`);
        results[test.name] = {
          status: 'failed',
          error: error.message,
          statusCode: error.response?.status
        };
      }
    }

    return results;
  }

  async runEndToEndTests() {
    console.log('🌐 Running End-to-End Tests...\n');

    const testScenarios = [
      {
        name: 'Complete Booking Flow',
        steps: [
          {
            name: 'Create User',
            action: async () => {
              const response = await axios.post(`${this.baseUrl}:3004/api/users`, {
                email: `e2e-${Date.now()}@example.com`,
                name: 'E2E Test User',
                password: 'testpass123'
              });
              return response.data;
            }
          },
          {
            name: 'Create Booking',
            action: async (context) => {
              const response = await axios.post(`${this.baseUrl}:3001/api/bookings`, {
                userId: context.user.id,
                bookingReference: `E2E-${Date.now()}`,
                totalAmount: 1500,
                currency: 'USD',
                departureDate: new Date(Date.now() + 86400000).toISOString(),
                returnDate: new Date(Date.now() + 172800000).toISOString()
              });
              return response.data;
            }
          },
          {
            name: 'Process Payment',
            action: async (context) => {
              const response = await axios.post(`${this.baseUrl}:3003/api/payments`, {
                bookingId: context.booking.id,
                amount: context.booking.totalAmount,
                currency: context.booking.currency,
                paymentMethod: 'card'
              });
              return response.data;
            }
          },
          {
            name: 'Send Confirmation',
            action: async (context) => {
              const response = await axios.post(`${this.baseUrl}:3013/api/notifications`, {
                type: 'booking_confirmation',
                recipient: context.user.email,
                data: {
                  bookingRef: context.booking.bookingReference,
                  amount: context.booking.totalAmount
                }
              });
              return response.data;
            }
          }
        ]
      }
    ];

    const results = {};

    for (const scenario of testScenarios) {
      console.log(`Running scenario: ${scenario.name}`);
      const context = {};
      const stepResults = [];

      for (const step of scenario.steps) {
        try {
          console.log(`  → ${step.name}`);
          const startTime = performance.now();
          const result = await step.action(context);
          const endTime = performance.now();
          const duration = (endTime - startTime).toFixed(2);

          context[step.name.toLowerCase().replace(' ', '')] = result;
          stepResults.push({
            name: step.name,
            status: 'passed',
            duration: `${duration}ms`,
            data: result
          });

          console.log(`    ✅ ${step.name}: Passed (${duration}ms)`);
        } catch (error) {
          console.log(`    ❌ ${step.name}: Failed (${error.response?.status || error.code})`);
          stepResults.push({
            name: step.name,
            status: 'failed',
            error: error.message,
            statusCode: error.response?.status
          });
          break;
        }
      }

      results[scenario.name] = {
        status: stepResults.every(s => s.status === 'passed') ? 'passed' : 'failed',
        steps: stepResults
      };
    }

    return results;
  }

  async runPerformanceTests() {
    console.log('⚡ Running Performance Tests...\n');

    const performanceTests = [
      {
        name: 'API Gateway Throughput',
        endpoint: `${this.baseUrl}:3000/health`,
        concurrentUsers: 10,
        duration: 10000 // 10 seconds
      },
      {
        name: 'Booking Service Load',
        endpoint: `${this.baseUrl}:3001/health`,
        concurrentUsers: 5,
        duration: 5000
      },
      {
        name: 'User Service Load',
        endpoint: `${this.baseUrl}:3004/health`,
        concurrentUsers: 5,
        duration: 5000
      }
    ];

    const results = {};

    for (const test of performanceTests) {
      console.log(`Testing: ${test.name}`);

      const requests = [];
      const startTime = performance.now();

      // Generate concurrent requests
      for (let i = 0; i < test.concurrentUsers; i++) {
        requests.push(this.runLoadTest(test.endpoint, test.duration));
      }

      try {
        const loadResults = await Promise.all(requests);
        const endTime = performance.now();
        const totalDuration = (endTime - startTime) / 1000;

        const totalRequests = loadResults.reduce((sum, result) => sum + result.requests, 0);
        const totalErrors = loadResults.reduce((sum, result) => sum + result.errors, 0);
        const avgResponseTime = loadResults.reduce((sum, result) => sum + result.avgResponseTime, 0) / loadResults.length;

        const rps = totalRequests / totalDuration;

        console.log(`✅ ${test.name}:`);
        console.log(`   Requests/sec: ${rps.toFixed(2)}`);
        console.log(`   Total requests: ${totalRequests}`);
        console.log(`   Errors: ${totalErrors}`);
        console.log(`   Avg response time: ${avgResponseTime.toFixed(2)}ms`);

        results[test.name] = {
          status: 'completed',
          rps: rps.toFixed(2),
          totalRequests,
          errors: totalErrors,
          avgResponseTime: `${avgResponseTime.toFixed(2)}ms`
        };

      } catch (error) {
        console.log(`❌ ${test.name}: Failed`);
        results[test.name] = { status: 'failed', error: error.message };
      }
    }

    return results;
  }

  async runLoadTest(endpoint, duration) {
    const requests = [];
    const errors = [];
    const responseTimes = [];
    const endTime = Date.now() + duration;

    while (Date.now() < endTime) {
      const startTime = performance.now();

      try {
        await axios.get(endpoint, { timeout: 5000 });
        const responseTime = performance.now() - startTime;
        responseTimes.push(responseTime);
        requests.push(true);
      } catch (error) {
        errors.push(error);
      }

      // Small delay to prevent overwhelming
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    const avgResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
      : 0;

    return {
      requests: requests.length,
      errors: errors.length,
      avgResponseTime
    };
  }

  async runAllTests() {
    console.log('🚀 Starting Comprehensive Microservices Testing Suite\n');
    console.log('=' .repeat(60));

    const startTime = performance.now();
    const results = {
      health: await this.runHealthChecks(),
      databases: await this.testDatabaseConnections(),
      unit: await this.runUnitTests(),
      integration: await this.runIntegrationTests(),
      e2e: await this.runEndToEndTests(),
      performance: await this.runPerformanceTests()
    };

    const endTime = performance.now();
    const totalDuration = ((endTime - startTime) / 1000).toFixed(2);

    console.log('\n' + '=' .repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('=' .repeat(60));

    // Health Summary
    const healthyServices = Object.values(results.health).filter(r => r.status === 'healthy').length;
    const totalServices = Object.keys(results.health).length;
    console.log(`🏥 Health Checks: ${healthyServices}/${totalServices} services healthy`);

    // Database Summary
    const connectedDBs = Object.values(results.databases).filter(r => r.status === 'connected').length;
    const totalDBs = Object.keys(results.databases).length;
    console.log(`🗄️  Databases: ${connectedDBs}/${totalDBs} databases connected`);

    // Integration Tests Summary
    const passedIntegrations = Object.values(results.integration).filter(r => r.status === 'passed').length;
    const totalIntegrations = Object.keys(results.integration).length;
    console.log(`🔗 Integration Tests: ${passedIntegrations}/${totalIntegrations} tests passed`);

    // E2E Tests Summary
    const passedE2E = Object.values(results.e2e).filter(r => r.status === 'passed').length;
    const totalE2E = Object.keys(results.e2e).length;
    console.log(`🌐 E2E Tests: ${passedE2E}/${totalE2E} scenarios passed`);

    console.log(`⏱️  Total Test Duration: ${totalDuration} seconds`);

    // Overall Status
    const allHealthy = healthyServices === totalServices;
    const allDBsConnected = connectedDBs === totalDBs;
    const allIntegrationsPassed = passedIntegrations === totalIntegrations;
    const allE2EPassed = passedE2E === totalE2E;

    const overallStatus = allHealthy && allDBsConnected && allIntegrationsPassed && allE2EPassed;

    console.log('\n🎯 OVERALL STATUS: ' + (overallStatus ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'));

    if (overallStatus) {
      console.log('\n🎉 Congratulations! Your microservices architecture is fully operational!');
      console.log('🚀 Ready for production deployment!');
    } else {
      console.log('\n⚠️  Some tests failed. Please review the results above and fix any issues.');
      console.log('🔧 Check service logs and database connections.');
    }

    return results;
  }

  async run(testType = 'all', serviceName = null) {
    switch (testType) {
      case 'health':
        return await this.runHealthChecks();
      case 'db':
      case 'database':
        return await this.testDatabaseConnections();
      case 'unit':
        return await this.runUnitTests(serviceName);
      case 'integration':
        return await this.runIntegrationTests();
      case 'e2e':
        return await this.runEndToEndTests();
      case 'performance':
      case 'perf':
        return await this.runPerformanceTests();
      case 'all':
      default:
        return await this.runAllTests();
    }
  }
}

// CLI interface
async function main() {
  const [,, testType, serviceName] = process.argv;

  const tester = new MicroservicesTester();
  const results = await tester.run(testType, serviceName);

  // Exit with appropriate code
  const hasFailures = JSON.stringify(results).includes('"status":"failed"') ||
                     JSON.stringify(results).includes('"status":"unhealthy"');

  process.exit(hasFailures ? 1 : 0);
}

if (require.main === module) {
  main().catch(error => {
    console.error('💥 Testing failed:', error);
    process.exit(1);
  });
}

module.exports = MicroservicesTester;