/**
 * Frontend Duffel Integration Verification Script
 * Verifies that all 19 Duffel endpoints are integrated with frontend
 * 
 * Run with: npm run test:api:frontend:integration
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface EndpointMapping {
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  backendPath: string;
  apiPath: string;
  expectedFrontendFile?: string;
  frontendMethod?: string;
  status: 'FOUND' | 'NOT_FOUND' | 'INCOMPLETE';
  details?: string;
}

class FrontendIntegrationVerifier {
  private endpoints: EndpointMapping[] = [];
  private projectRoot: string;
  private bookingEngineRoot: string;
  private b2bAdminRoot: string;

  constructor() {
    this.projectRoot = process.cwd();
    this.bookingEngineRoot = path.join(this.projectRoot, 'apps', 'booking-engine', 'src');
    this.b2bAdminRoot = path.join(this.projectRoot, 'apps', 'b2b-admin', 'src');
  }

  /**
   * Define all 19 Duffel endpoints
   */
  private defineEndpoints(): void {
    this.endpoints = [
      // Seat Maps (2)
      {
        name: 'Get seat maps for booking',
        method: 'GET',
        backendPath: '/bookings/flight/seat-maps',
        apiPath: 'GET /api/bookings/flight/seat-maps',
        expectedFrontendFile: 'services/seatMapsApi.ts',
        frontendMethod: 'getSeatMaps()',
        status: 'NOT_FOUND'
      },
      {
        name: 'Select seats for flight',
        method: 'POST',
        backendPath: '/bookings/flight/seat-maps/select',
        apiPath: 'POST /api/bookings/flight/seat-maps/select',
        expectedFrontendFile: 'services/seatMapsApi.ts',
        frontendMethod: 'selectSeats()',
        status: 'NOT_FOUND'
      },

      // Ancillary Services (4)
      {
        name: 'Get available ancillary services',
        method: 'GET',
        backendPath: '/bookings/ancillary/services',
        apiPath: 'GET /api/bookings/ancillary/services',
        expectedFrontendFile: 'services/ancillaryServicesApi.ts',
        frontendMethod: 'getAvailableServices()',
        status: 'NOT_FOUND'
      },
      {
        name: 'Select ancillary services',
        method: 'POST',
        backendPath: '/bookings/ancillary/services/select',
        apiPath: 'POST /api/bookings/ancillary/services/select',
        expectedFrontendFile: 'services/ancillaryServicesApi.ts',
        frontendMethod: 'selectServices()',
        status: 'NOT_FOUND'
      },
      {
        name: 'Get service categories',
        method: 'GET',
        backendPath: '/bookings/ancillary/services/categories',
        apiPath: 'GET /api/bookings/ancillary/services/categories',
        expectedFrontendFile: 'services/ancillaryServicesApi.ts',
        frontendMethod: 'getServiceCategories()',
        status: 'NOT_FOUND'
      },
      {
        name: 'Get service details',
        method: 'GET',
        backendPath: '/bookings/ancillary/services/details/:serviceId',
        apiPath: 'GET /api/bookings/ancillary/services/details',
        expectedFrontendFile: 'services/ancillaryServicesApi.ts',
        frontendMethod: 'getServiceDetails()',
        status: 'NOT_FOUND'
      },

      // Order Management (2)
      {
        name: 'Cancel order',
        method: 'POST',
        backendPath: '/admin/orders/cancel',
        apiPath: 'POST /api/admin/orders/cancel',
        expectedFrontendFile: 'services/orderManagementApi.ts',
        frontendMethod: 'cancelOrder()',
        status: 'NOT_FOUND'
      },
      {
        name: 'Get cancellation status',
        method: 'GET',
        backendPath: '/admin/orders/cancellation-status',
        apiPath: 'GET /api/admin/orders/cancellation-status',
        expectedFrontendFile: 'services/orderManagementApi.ts',
        frontendMethod: 'getCancellationStatus()',
        status: 'NOT_FOUND'
      },

      // Baggage Management (4)
      {
        name: 'Check baggage eligibility',
        method: 'GET',
        backendPath: '/bookings/orders/:orderId/baggage-eligibility',
        apiPath: 'GET /api/bookings/orders/:orderId/baggage-eligibility',
        expectedFrontendFile: 'services/baggageApi.ts',
        frontendMethod: 'checkBaggageEligibility()',
        status: 'NOT_FOUND'
      },
      {
        name: 'Get available baggage services',
        method: 'GET',
        backendPath: '/bookings/orders/:orderId/available-baggage',
        apiPath: 'GET /api/bookings/orders/:orderId/available-baggage',
        expectedFrontendFile: 'services/baggageApi.ts',
        frontendMethod: 'getAvailableBaggage()',
        status: 'NOT_FOUND'
      },
      {
        name: 'Book baggage services',
        method: 'POST',
        backendPath: '/bookings/orders/:orderId/book-baggage',
        apiPath: 'POST /api/bookings/orders/:orderId/book-baggage',
        expectedFrontendFile: 'services/baggageApi.ts',
        frontendMethod: 'bookBaggage()',
        status: 'NOT_FOUND'
      },
      {
        name: 'Get booked baggage services',
        method: 'GET',
        backendPath: '/bookings/orders/:orderId/baggage-services',
        apiPath: 'GET /api/bookings/orders/:orderId/baggage-services',
        expectedFrontendFile: 'services/baggageApi.ts',
        frontendMethod: 'getBookedBaggage()',
        status: 'NOT_FOUND'
      },

      // Order Change (5)
      {
        name: 'Check order change eligibility',
        method: 'GET',
        backendPath: '/bookings/orders/:orderId/change-eligibility',
        apiPath: 'GET /api/bookings/orders/:orderId/change-eligibility',
        expectedFrontendFile: 'services/orderChangeApi.ts',
        frontendMethod: 'checkOrderChangeEligibility()',
        status: 'NOT_FOUND'
      },
      {
        name: 'Create order change request',
        method: 'POST',
        backendPath: '/bookings/orders/:orderId/change-request',
        apiPath: 'POST /api/bookings/orders/:orderId/change-request',
        expectedFrontendFile: 'services/orderChangeApi.ts',
        frontendMethod: 'createOrderChangeRequest()',
        status: 'NOT_FOUND'
      },
      {
        name: 'Get order change offers',
        method: 'GET',
        backendPath: '/bookings/order-changes/:orderChangeRequestId/offers',
        apiPath: 'GET /api/bookings/order-changes/:orderChangeRequestId/offers',
        expectedFrontendFile: 'services/orderChangeApi.ts',
        frontendMethod: 'getOrderChangeOffers()',
        status: 'NOT_FOUND'
      },
      {
        name: 'Create pending order change',
        method: 'POST',
        backendPath: '/bookings/order-changes/pending',
        apiPath: 'POST /api/bookings/order-changes/pending',
        expectedFrontendFile: 'services/orderChangeApi.ts',
        frontendMethod: 'createPendingOrderChange()',
        status: 'NOT_FOUND'
      },
      {
        name: 'Confirm order change',
        method: 'POST',
        backendPath: '/bookings/order-changes/:orderChangeId/confirm',
        apiPath: 'POST /api/bookings/order-changes/:orderChangeId/confirm',
        expectedFrontendFile: 'services/orderChangeApi.ts',
        frontendMethod: 'confirmOrderChange()',
        status: 'NOT_FOUND'
      },

      // Airline Credits (2)
      {
        name: 'Get airline credits for customer',
        method: 'GET',
        backendPath: '/admin/customers/:customerId/airline-credits',
        apiPath: 'GET /api/admin/customers/:customerId/airline-credits',
        expectedFrontendFile: 'services/airlineCreditsApi.ts',
        frontendMethod: 'getAirlineCredits()',
        status: 'NOT_FOUND'
      },
      {
        name: 'Get airline credits for booking',
        method: 'GET',
        backendPath: '/admin/bookings/:bookingId/airline-credits',
        apiPath: 'GET /api/admin/bookings/:bookingId/airline-credits',
        expectedFrontendFile: 'services/airlineCreditsApi.ts',
        frontendMethod: 'getBookingAirlineCredits()',
        status: 'NOT_FOUND'
      }
    ];
  }

  /**
   * Search for API endpoint usage in files
   */
  private async searchInFile(filePath: string, pattern: string): Promise<boolean> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return content.includes(pattern);
    } catch {
      return false;
    }
  }

  /**
   * Find all TypeScript files in a directory
   */
  private async findFilesRecursive(dir: string, pattern: RegExp = /\.ts$/): Promise<string[]> {
    const files: string[] = [];

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory()) {
          if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
            files.push(...await this.findFilesRecursive(path.join(dir, entry.name), pattern));
          }
        } else if (pattern.test(entry.name)) {
          files.push(path.join(dir, entry.name));
        }
      }
    } catch {
      // Directory might not exist
    }

    return files;
  }

  /**
   * Verify each endpoint
   */
  async verifyEndpoints(): Promise<void> {
    console.log('\n🔍 Verifying Frontend Integration for Duffel Endpoints...\n');

    this.defineEndpoints();

    for (const endpoint of this.endpoints) {
      console.log(`Checking: ${endpoint.name}`);

      // Search for API path patterns
      const searchPatterns = [
        endpoint.apiPath,
        endpoint.backendPath,
        endpoint.frontendMethod || '',
        `'${endpoint.apiPath}'`,
        `"${endpoint.apiPath}"`,
        endpoint.backendPath.replace(':', '')
      ];

      // Look in booking engine
      const bookingEngineFiles = await this.findFilesRecursive(this.bookingEngineRoot);
      let found = false;

      for (const file of bookingEngineFiles) {
        for (const pattern of searchPatterns) {
          if (await this.searchInFile(file, pattern)) {
            endpoint.status = 'FOUND';
            endpoint.details = `Found in: ${file.replace(this.projectRoot, '')}`;
            found = true;
            break;
          }
        }
        if (found) break;
      }

      // Look in B2B admin if not found
      if (!found) {
        const b2bFiles = await this.findFilesRecursive(this.b2bAdminRoot);
        for (const file of b2bFiles) {
          for (const pattern of searchPatterns) {
            if (await this.searchInFile(file, pattern)) {
              endpoint.status = 'FOUND';
              endpoint.details = `Found in: ${file.replace(this.projectRoot, '')}`;
              found = true;
              break;
            }
          }
          if (found) break;
        }
      }

      const statusIcon = endpoint.status === 'FOUND' ? '✅' : '❌';
      console.log(`  ${statusIcon} ${endpoint.status}\n`);
    }
  }

  /**
   * Generate detailed report
   */
  generateReport(): void {
    console.log('\n\n📊 FRONTEND INTEGRATION REPORT');
    console.log('═'.repeat(60));

    const found = this.endpoints.filter(e => e.status === 'FOUND').length;
    const total = this.endpoints.length;
    const coverage = ((found / total) * 100).toFixed(2);

    console.log(`\nTotal Endpoints:        ${total}`);
    console.log(`Integrated Endpoints:   ${found}`);
    console.log(`Missing Endpoints:      ${total - found}`);
    console.log(`Integration Coverage:   ${coverage}%\n`);

    // Found endpoints
    console.log('✅ INTEGRATED ENDPOINTS:');
    console.log('─'.repeat(60));
    this.endpoints
      .filter(e => e.status === 'FOUND')
      .forEach(e => {
        console.log(`• ${e.name}`);
        console.log(`  ${e.apiPath}`);
        if (e.details) console.log(`  ${e.details}`);
        console.log();
      });

    // Missing endpoints
    const missing = this.endpoints.filter(e => e.status !== 'FOUND');
    if (missing.length > 0) {
      console.log('\n❌ MISSING FRONTEND INTEGRATION:');
      console.log('─'.repeat(60));
      missing.forEach(e => {
        console.log(`• ${e.name}`);
        console.log(`  ${e.apiPath}`);
        console.log(`  Expected file: ${e.expectedFrontendFile}`);
        console.log(`  Expected method: ${e.frontendMethod}`);
        console.log();
      });
    }

    // Recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    console.log('─'.repeat(60));

    if (coverage === '100') {
      console.log('✨ All Duffel endpoints are integrated with frontend!');
    } else {
      console.log(`${missing.length} endpoints need frontend integration:`);
      missing.forEach((e, i) => {
        console.log(`\n${i + 1}. ${e.name}`);
        console.log(`   Create/Update: ${e.expectedFrontendFile}`);
        console.log(`   Add method: async ${e.frontendMethod || 'method()'}`);
        console.log(`   API call: ${e.method} ${e.apiPath}`);
      });
    }
  }

  /**
   * Save detailed report to file
   */
  async saveDetailedReport(): Promise<void> {
    const reportDir = path.join(process.cwd(), 'test-results');
    await fs.ensureDir(reportDir);

    const timestamp = new Date().toISOString().split('T')[0];
    const reportPath = path.join(reportDir, `duffel-frontend-integration-${timestamp}.json`);

    const report = {
      timestamp: new Date().toISOString(),
      totalEndpoints: this.endpoints.length,
      integratedEndpoints: this.endpoints.filter(e => e.status === 'FOUND').length,
      coverage: `${((this.endpoints.filter(e => e.status === 'FOUND').length / this.endpoints.length) * 100).toFixed(2)}%`,
      endpoints: this.endpoints
    };

    await fs.writeJSON(reportPath, report, { spaces: 2 });
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  }
}

// Run verification
async function main(): Promise<void> {
  try {
    const verifier = new FrontendIntegrationVerifier();
    await verifier.verifyEndpoints();
    verifier.generateReport();
    await verifier.saveDetailedReport();
  } catch (error) {
    console.error('❌ Verification error:', error);
    process.exit(1);
  }
}

main();
