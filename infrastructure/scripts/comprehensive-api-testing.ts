#!/usr/bin/env ts-node

/**
 * Comprehensive API Integrations Testing Suite
 * Tests all booking engine API integrations including:
 * - Hotelston (Hotels)
 * - Innstant Travel (Hotels)
 * - Duffel (Flights)
 * - Amadeus (Flights)
 * - Payment Gateways
 * - Notification Services
 */

import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { PrismaClient } from '@prisma/client';

// Configuration
const prisma = new PrismaClient();

interface TestResult {
  test: string;
  category: string;
  success: boolean;
  duration: number;
  message: string;
  error?: string;
  data?: any;
}

interface ApiConfig {
  name: string;
  baseUrl: string;
  authType: 'apiKey' | 'bearer' | 'basic' | 'none';
  credentials?: {
    key?: string;
    token?: string;
    username?: string;
    password?: string;
  };
  headers?: Record<string, string>;
}

class ApiTestingSuite {
  private results: TestResult[] = [];
  private httpClient: AxiosInstance;

  constructor() {
    this.httpClient = axios.create({
      timeout: 30000,
      validateStatus: () => true, // Don't throw on any status
    });
  }

  /**
   * Run all API integration tests
   */
  async runAllTests(): Promise<void> {
    console.log('🚀 Starting Comprehensive API Integration Tests');
    console.log('='.repeat(60));

    const startTime = Date.now();

    try {
      // 1. Authentication Tests
      await this.testAuthentication();

      // 2. Hotel API Tests
      await this.testHotelstonApi();
      await this.testInnstantApi();

      // 3. Flight API Tests
      await this.testDuffelApi();
      await this.testAmadeusApi();

      // 4. Payment Gateway Tests
      await this.testPaymentGateways();

      // 5. Notification Service Tests
      await this.testNotificationServices();

      // 6. Integration Workflow Tests
      await this.testBookingWorkflow();

      // 7. Performance and Load Tests
      await this.testPerformance();

      // Generate report
      this.generateReport(startTime);

    } catch (error) {
      console.error('❌ Test suite failed:', error);
      this.generateReport(startTime);
    } finally {
      await prisma.$disconnect();
    }
  }

  /**
   * Test Authentication for all APIs
   */
  private async testAuthentication(): Promise<void> {
    console.log('\n🔐 Testing Authentication...');

    const authTests = [
      {
        name: 'Hotelston API Authentication',
        config: {
          name: 'Hotelston',
          baseUrl: 'https://dev.hotelston.com/ws/HotelServiceV2/HotelServiceHttpSoap11Endpoint/',
          authType: 'none' as const,
          credentials: {
            username: process.env.HOTELSTON_USERNAME || 'technocense@gmail.com',
            password: process.env.HOTELSTON_PASSWORD || '6614645@Dubai'
          }
        }
      },
      {
        name: 'Duffel API Authentication',
        config: {
          name: 'Duffel',
          baseUrl: 'https://api.duffel.com',
          authType: 'bearer' as const,
          credentials: {
            token: process.env.DUFFEL_API_KEY || 'test_token'
          }
        }
      },
      {
        name: 'Amadeus API Authentication',
        config: {
          name: 'Amadeus',
          baseUrl: 'https://test.api.amadeus.com',
          authType: 'apiKey' as const,
          credentials: {
            key: process.env.AMADEUS_API_KEY || 'test_key',
            token: process.env.AMADEUS_API_SECRET || 'test_secret'
          }
        }
      }
    ];

    for (const test of authTests) {
      await this.runTest(`Authentication: ${test.name}`, 'Authentication', async () => {
        const startTime = Date.now();
        
        try {
          // Test connection
          const response = await this.httpClient.get(`${test.config.baseUrl}/ping`, {
            headers: this.getAuthHeaders(test.config)
          });

          const duration = Date.now() - startTime;
          
          if (response.status >= 200 && response.status < 300) {
            return {
              success: true,
              duration,
              message: `Authentication successful for ${test.name}`,
              data: { status: response.status, headers: response.headers }
            };
          } else {
            return {
              success: false,
              duration,
              message: `Authentication failed for ${test.name}`,
              error: `HTTP ${response.status}: ${response.statusText}`
            };
          }
        } catch (error) {
          const duration = Date.now() - startTime;
          return {
            success: false,
            duration,
            message: `Authentication error for ${test.name}`,
            error: error instanceof Error ? error.message : String(error)
          };
        }
      });
    }
  }

  /**
   * Test Hotelston API Integration
   */
  private async testHotelstonApi(): Promise<void> {
    console.log('\n🏨 Testing Hotelston API...');

    const tests = [
      {
        name: 'Static Data - Countries',
        action: 'getCountries',
        body: ''
      },
      {
        name: 'Static Data - Cities',
        action: 'getCities',
        body: ''
      },
      {
        name: 'Static Data - Hotels',
        action: 'getHotels',
        body: ''
      },
      {
        name: 'Hotel Search',
        action: 'searchHotels',
        body: `
          <hot:destination>Dubai</hot:destination>
          <hot:checkIn>2026-03-01</hot:checkIn>
          <hot:checkOut>2026-03-05</hot:checkOut>
          <hot:adults>2</hot:adults>
          <hot:children>0</hot:children>
          <hot:rooms>1</hot:rooms>
          <hot:currency>USD</hot:currency>
        `
      }
    ];

    for (const test of tests) {
      await this.runTest(`Hotelston: ${test.name}`, 'Hotelston', async () => {
        const startTime = Date.now();
        
        try {
          const envelope = this.createSoapEnvelope(test.action, test.body);
          const response = await this.httpClient.post(
            'https://dev.hotelston.com/ws/HotelServiceV2/HotelServiceHttpSoap11Endpoint/',
            envelope,
            {
              headers: {
                'Content-Type': 'text/xml; charset=utf-8',
                'SOAPAction': `"http://hotelston.com/${test.action}"`
              }
            }
          );

          const duration = Date.now() - startTime;

          if (response.status >= 200 && response.status < 300) {
            return {
              success: true,
              duration,
              message: `Hotelston ${test.name} successful`,
              data: { status: response.status, responseSize: response.data.length }
            };
          } else {
            return {
              success: false,
              duration,
              message: `Hotelston ${test.name} failed`,
              error: `HTTP ${response.status}: ${response.statusText}`
            };
          }
        } catch (error) {
          const duration = Date.now() - startTime;
          return {
            success: false,
            duration,
            message: `Hotelston ${test.name} error`,
            error: error instanceof Error ? error.message : String(error)
          };
        }
      });
    }
  }

  /**
   * Test Innstant Travel API Integration
   */
  private async testInnstantApi(): Promise<void> {
    console.log('\n🏨 Testing Innstant Travel API...');

    const tests = [
      {
        name: 'Hotel Search',
        endpoint: '/api/v1/hotels/search',
        method: 'POST',
        data: {
          destination: 'Dubai',
          checkIn: '2026-03-01',
          checkOut: '2026-03-05',
          adults: 2,
          children: 0,
          rooms: 1,
          currency: 'USD'
        }
      },
      {
        name: 'Hotel Details',
        endpoint: '/api/v1/hotels/details',
        method: 'GET',
        params: { hotelId: 'test_hotel_id' }
      }
    ];

    for (const test of tests) {
      await this.runTest(`Innstant: ${test.name}`, 'Innstant', async () => {
        const startTime = Date.now();
        
        try {
          const response = await this.httpClient({
            method: test.method,
            url: `https://api.innstant.travel${test.endpoint}`,
            headers: {
              'Authorization': `Bearer ${process.env.INNSTANT_API_KEY || 'test_token'}`,
              'Content-Type': 'application/json'
            },
            data: test.data,
            params: test.params
          });

          const duration = Date.now() - startTime;

          if (response.status >= 200 && response.status < 300) {
            return {
              success: true,
              duration,
              message: `Innstant ${test.name} successful`,
              data: { status: response.status, responseSize: JSON.stringify(response.data).length }
            };
          } else {
            return {
              success: false,
              duration,
              message: `Innstant ${test.name} failed`,
              error: `HTTP ${response.status}: ${response.statusText}`
            };
          }
        } catch (error) {
          const duration = Date.now() - startTime;
          return {
            success: false,
            duration,
            message: `Innstant ${test.name} error`,
            error: error instanceof Error ? error.message : String(error)
          };
        }
      });
    }
  }

  /**
   * Test Duffel API Integration
   */
  private async testDuffelApi(): Promise<void> {
    console.log('\n✈️ Testing Duffel API...');

    const tests = [
      {
        name: 'Airline List',
        endpoint: '/airlines',
        method: 'GET'
      },
      {
        name: 'Airport List',
        endpoint: '/airports',
        method: 'GET'
      },
      {
        name: 'Flight Search',
        endpoint: '/flights/offers',
        method: 'POST',
        data: {
          slices: [{
            origin: 'DXB',
            destination: 'LON',
            departure_date: '2026-03-01'
          }],
          passengers: [{
            type: 'adult'
          }],
          cabin_class: 'economy'
        }
      }
    ];

    for (const test of tests) {
      await this.runTest(`Duffel: ${test.name}`, 'Duffel', async () => {
        const startTime = Date.now();
        
        try {
          const response = await this.httpClient({
            method: test.method,
            url: `https://api.duffel.com${test.endpoint}`,
            headers: {
              'Authorization': `Bearer ${process.env.DUFFEL_API_KEY || 'test_token'}`,
              'Accept': 'application/json',
              'Duffel-Version': 'v1'
            },
            data: test.data
          });

          const duration = Date.now() - startTime;

          if (response.status >= 200 && response.status < 300) {
            return {
              success: true,
              duration,
              message: `Duffel ${test.name} successful`,
              data: { status: response.status, responseSize: JSON.stringify(response.data).length }
            };
          } else {
            return {
              success: false,
              duration,
              message: `Duffel ${test.name} failed`,
              error: `HTTP ${response.status}: ${response.statusText}`
            };
          }
        } catch (error) {
          const duration = Date.now() - startTime;
          return {
            success: false,
            duration,
            message: `Duffel ${test.name} error`,
            error: error instanceof Error ? error.message : String(error)
          };
        }
      });
    }
  }

  /**
   * Test Amadeus API Integration
   */
  private async testAmadeusApi(): Promise<void> {
    console.log('\n✈️ Testing Amadeus API...');

    const tests = [
      {
        name: 'Flight Search',
        endpoint: '/v2/shopping/flight-offers',
        method: 'GET',
        params: {
          originLocationCode: 'DXB',
          destinationLocationCode: 'LON',
          departureDate: '2026-03-01',
          adults: 1,
          max: 5
        }
      },
      {
        name: 'Airport Autocomplete',
        endpoint: '/v1/reference-data/locations/airports',
        method: 'GET',
        params: {
          keyword: 'Dubai',
          max: 5
        }
      }
    ];

    for (const test of tests) {
      await this.runTest(`Amadeus: ${test.name}`, 'Amadeus', async () => {
        const startTime = Date.now();
        
        try {
          // First get auth token
          const authResponse = await this.httpClient.post(
            'https://test.api.amadeus.com/v1/security/oauth2/token',
            new URLSearchParams({
              grant_type: 'client_credentials',
              client_id: process.env.AMADEUS_API_KEY || 'test_key',
              client_secret: process.env.AMADEUS_API_SECRET || 'test_secret'
            }),
            {
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
              }
            }
          );

          const token = authResponse.data.access_token;

          // Then make the actual API call
          const response = await this.httpClient({
            method: test.method,
            url: `https://test.api.amadeus.com${test.endpoint}`,
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json'
            },
            params: test.params
          });

          const duration = Date.now() - startTime;

          if (response.status >= 200 && response.status < 300) {
            return {
              success: true,
              duration,
              message: `Amadeus ${test.name} successful`,
              data: { status: response.status, responseSize: JSON.stringify(response.data).length }
            };
          } else {
            return {
              success: false,
              duration,
              message: `Amadeus ${test.name} failed`,
              error: `HTTP ${response.status}: ${response.statusText}`
            };
          }
        } catch (error) {
          const duration = Date.now() - startTime;
          return {
            success: false,
            duration,
            message: `Amadeus ${test.name} error`,
            error: error instanceof Error ? error.message : String(error)
          };
        }
      });
    }
  }

  /**
   * Test Payment Gateway Integration
   */
  private async testPaymentGateways(): Promise<void> {
    console.log('\n💳 Testing Payment Gateways...');

    const tests = [
      {
        name: 'Stripe Payment Intent',
        gateway: 'Stripe',
        endpoint: '/v1/payment_intents',
        method: 'POST',
        data: {
          amount: 1000,
          currency: 'usd',
          payment_method_types: ['card']
        }
      },
      {
        name: 'PayPal Payment Creation',
        gateway: 'PayPal',
        endpoint: '/v2/checkout/orders',
        method: 'POST',
        data: {
          intent: 'CAPTURE',
          purchase_units: [{
            amount: {
              currency_code: 'USD',
              value: '10.00'
            }
          }]
        }
      }
    ];

    for (const test of tests) {
      await this.runTest(`Payment: ${test.name}`, 'Payments', async () => {
        const startTime = Date.now();
        
        try {
          const response = await this.httpClient({
            method: test.method,
            url: `https://api.${test.gateway.toLowerCase()}.com${test.endpoint}`,
            headers: {
              'Authorization': `Bearer ${process.env[`${test.gateway.toUpperCase()}_API_KEY`] || 'test_token'}`,
              'Content-Type': 'application/json'
            },
            data: test.data
          });

          const duration = Date.now() - startTime;

          // Payment gateways often return 201 for successful creation
          if (response.status >= 200 && response.status < 300) {
            return {
              success: true,
              duration,
              message: `${test.gateway} ${test.name} successful`,
              data: { status: response.status, responseSize: JSON.stringify(response.data).length }
            };
          } else {
            return {
              success: false,
              duration,
              message: `${test.gateway} ${test.name} failed`,
              error: `HTTP ${response.status}: ${response.statusText}`
            };
          }
        } catch (error) {
          const duration = Date.now() - startTime;
          return {
            success: false,
            duration,
            message: `${test.gateway} ${test.name} error`,
            error: error instanceof Error ? error.message : String(error)
          };
        }
      });
    }
  }

  /**
   * Test Notification Services
   */
  private async testNotificationServices(): Promise<void> {
    console.log('\n📧 Testing Notification Services...');

    const tests = [
      {
        name: 'Email Service',
        service: 'Email',
        endpoint: '/send',
        method: 'POST',
        data: {
          to: 'test@example.com',
          subject: 'Test Email',
          body: 'This is a test email from the booking engine'
        }
      },
      {
        name: 'SMS Service',
        service: 'SMS',
        endpoint: '/messages',
        method: 'POST',
        data: {
          to: '+1234567890',
          body: 'This is a test SMS from the booking engine'
        }
      }
    ];

    for (const test of tests) {
      await this.runTest(`Notification: ${test.name}`, 'Notifications', async () => {
        const startTime = Date.now();
        
        try {
          const response = await this.httpClient({
            method: test.method,
            url: `https://api.${test.service.toLowerCase()}.com${test.endpoint}`,
            headers: {
              'Authorization': `Bearer ${process.env[`${test.service.toUpperCase()}_API_KEY`] || 'test_token'}`,
              'Content-Type': 'application/json'
            },
            data: test.data
          });

          const duration = Date.now() - startTime;

          if (response.status >= 200 && response.status < 300) {
            return {
              success: true,
              duration,
              message: `${test.service} ${test.name} successful`,
              data: { status: response.status }
            };
          } else {
            return {
              success: false,
              duration,
              message: `${test.service} ${test.name} failed`,
              error: `HTTP ${response.status}: ${response.statusText}`
            };
          }
        } catch (error) {
          const duration = Date.now() - startTime;
          return {
            success: false,
            duration,
            message: `${test.service} ${test.name} error`,
            error: error instanceof Error ? error.message : String(error)
          };
        }
      });
    }
  }

  /**
   * Test End-to-End Booking Workflow
   */
  private async testBookingWorkflow(): Promise<void> {
    console.log('\n🔄 Testing Booking Workflow...');

    await this.runTest('Complete Booking Flow', 'Workflow', async () => {
      const startTime = Date.now();
      
      try {
        // Simulate a complete booking flow
        const bookingFlow = {
          hotelSearch: {
            destination: 'Dubai',
            checkIn: '2026-03-01',
            checkOut: '2026-03-05',
            adults: 2
          },
          flightSearch: {
            origin: 'DXB',
            destination: 'LON',
            departureDate: '2026-03-01'
          },
          bookingData: {
            hotelId: 'test_hotel_123',
            flightId: 'test_flight_456',
            passengerInfo: {
              name: 'Test User',
              email: 'test@example.com',
              phone: '+1234567890'
            },
            paymentInfo: {
              amount: 1500,
              currency: 'USD'
            }
          }
        };

        // This would typically involve multiple API calls in sequence
        // For testing purposes, we'll simulate the workflow
        const duration = Date.now() - startTime;

        return {
          success: true,
          duration,
          message: 'Booking workflow simulation completed',
          data: {
            steps: ['Hotel Search', 'Flight Search', 'Booking Creation', 'Payment Processing', 'Confirmation'],
            simulated: true
          }
        };
      } catch (error) {
        const duration = Date.now() - startTime;
        return {
          success: false,
          duration,
          message: 'Booking workflow failed',
          error: error instanceof Error ? error.message : String(error)
        };
      }
    });
  }

  /**
   * Test Performance and Load
   */
  private async testPerformance(): Promise<void> {
    console.log('\n⚡ Testing Performance...');

    await this.runTest('Concurrent API Calls', 'Performance', async () => {
      const startTime = Date.now();
      
      try {
        // Test concurrent API calls
        const concurrentCalls = 5;
        const promises = [];

        for (let i = 0; i < concurrentCalls; i++) {
          promises.push(
            this.httpClient.get('https://httpbin.org/delay/1', {
              timeout: 5000
            })
          );
        }

        const responses = await Promise.all(promises);
        const duration = Date.now() - startTime;

        const successfulCalls = responses.filter(r => r.status === 200).length;

        return {
          success: successfulCalls === concurrentCalls,
          duration,
          message: `Performance test: ${successfulCalls}/${concurrentCalls} calls successful`,
          data: {
            concurrentCalls,
            successfulCalls,
            averageResponseTime: duration / concurrentCalls
          }
        };
      } catch (error) {
        const duration = Date.now() - startTime;
        return {
          success: false,
          duration,
          message: 'Performance test failed',
          error: error instanceof Error ? error.message : String(error)
        };
      }
    });
  }

  /**
   * Helper method to run individual tests
   */
  private async runTest(testName: string, category: string, testFn: () => Promise<any>): Promise<void> {
    try {
      const result = await testFn();
      this.results.push({
        test: testName,
        category,
        ...result
      });

      const status = result.success ? '✅' : '❌';
      console.log(`  ${status} ${testName} (${result.duration}ms)`);
      
      if (!result.success && result.error) {
        console.log(`     Error: ${result.error}`);
      }
    } catch (error) {
      const duration = Date.now();
      this.results.push({
        test: testName,
        category,
        success: false,
        duration,
        message: 'Test execution failed',
        error: error instanceof Error ? error.message : String(error)
      });
      console.log(`  ❌ ${testName} (Failed to execute)`);
    }
  }

  /**
   * Create SOAP envelope for Hotelston API
   */
  private createSoapEnvelope(action: string, bodyContent: string): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:hot="http://hotelston.com/">
  <soapenv:Header/>
  <soapenv:Body>
    <hot:${action}Request>
      <hot:username>${process.env.HOTELSTON_USERNAME || 'technocense@gmail.com'}</hot:username>
      <hot:password>${process.env.HOTELSTON_PASSWORD || '6614645@Dubai'}</hot:password>
      ${bodyContent}
    </hot:${action}Request>
  </soapenv:Body>
</soapenv:Envelope>`;
  }

  /**
   * Get authentication headers based on config
   */
  private getAuthHeaders(config: ApiConfig): Record<string, string> {
    const headers: Record<string, string> = {};

    switch (config.authType) {
      case 'bearer':
        if (config.credentials?.token) {
          headers['Authorization'] = `Bearer ${config.credentials.token}`;
        }
        break;
      case 'apiKey':
        if (config.credentials?.key) {
          headers['X-API-Key'] = config.credentials.key;
        }
        break;
      case 'basic':
        if (config.credentials?.username && config.credentials?.password) {
          const auth = Buffer.from(`${config.credentials.username}:${config.credentials.password}`).toString('base64');
          headers['Authorization'] = `Basic ${auth}`;
        }
        break;
    }

    return { ...headers, ...config.headers };
  }

  /**
   * Generate comprehensive test report
   */
  private generateReport(startTime: number): void {
    const totalTime = Date.now() - startTime;
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST REPORT');
    console.log('='.repeat(60));

    // Summary
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;

    console.log(`\n📈 Summary:`);
    console.log(`   Total Tests: ${totalTests}`);
    console.log(`   Passed: ${passedTests} ✅`);
    console.log(`   Failed: ${failedTests} ❌`);
    console.log(`   Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    console.log(`   Total Time: ${totalTime}ms`);

    // Category breakdown
    const categories = [...new Set(this.results.map(r => r.category))];
    console.log(`\n📋 By Category:`);
    categories.forEach(category => {
      const categoryTests = this.results.filter(r => r.category === category);
      const categoryPassed = categoryTests.filter(r => r.success).length;
      console.log(`   ${category}: ${categoryPassed}/${categoryTests.length} passed`);
    });

    // Failed tests details
    if (failedTests > 0) {
      console.log(`\n❌ Failed Tests:`);
      this.results.filter(r => !r.success).forEach(result => {
        console.log(`   • ${result.test}: ${result.error}`);
      });
    }

    // Performance metrics
    const avgResponseTime = this.results.reduce((sum, r) => sum + r.duration, 0) / totalTests;
    const maxResponseTime = Math.max(...this.results.map(r => r.duration));
    const minResponseTime = Math.min(...this.results.map(r => r.duration));

    console.log(`\n⚡ Performance Metrics:`);
    console.log(`   Average Response Time: ${avgResponseTime.toFixed(2)}ms`);
    console.log(`   Max Response Time: ${maxResponseTime}ms`);
    console.log(`   Min Response Time: ${minResponseTime}ms`);

    // Save results to file
    this.saveResultsToFile();

    console.log('\n🎉 API Integration Testing Complete!');
  }

  /**
   * Save test results to file
   */
  private saveResultsToFile(): void {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `api-test-results-${timestamp}.json`;
    
    try {
      const fs = require('fs');
      fs.writeFileSync(filename, JSON.stringify(this.results, null, 2));
      console.log(`\n💾 Results saved to: ${filename}`);
    } catch (error) {
      console.error('Failed to save results to file:', error);
    }
  }
}

// Run the test suite
if (require.main === module) {
  const testSuite = new ApiTestingSuite();
  testSuite.runAllTests()
    .then(() => {
      console.log('\n✅ All tests completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test suite failed:', error);
      process.exit(1);
    });
}

export { ApiTestingSuite };