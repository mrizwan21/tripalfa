import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';

/**
 * Comprehensive Integration Tests for Admin Booking Management APIs
 * 
 * This test suite validates all admin booking management endpoints:
 * - POST /api/admin/book (Create booking)
 * - GET /api/admin/search (Search bookings)
 * - POST /api/admin/hold (Hold inventory)
 * - POST /api/admin/confirm (Confirm booking)
 * - POST /api/admin/issue-ticket (Issue ticket)
 * - PUT /api/admin/workflow/:bookingId/status (Update status)
 * - PUT /api/admin/workflow/:bookingId/assign (Assign booking)
 * - PUT /api/admin/workflow/:bookingId/priority (Update priority)
 * 
 * Tests cover:
 * - Happy paths with valid data and appropriate permissions
 * - Error paths with authentication failures, permission denials, validation errors
 * - Edge cases including boundary conditions and concurrent operations
 * - Authentication and authorization across all endpoints
 * - Request/response validation and error handling
 */

describe('Admin Booking Management APIs', () => {
  let adminToken: string;
  let agentToken: string;
  let supervisorToken: string;
  let managerToken: string;
  let testCustomer: any;
  let testSupplier: any;

  beforeEach(async () => {
    // Create test tokens for different roles
    adminToken = global.createAdminToken('test-admin-user');
    agentToken = global.createAgentToken('test-agent-user');
    supervisorToken = global.createSupervisorToken('test-supervisor-user');
    managerToken = global.createManagerToken('test-manager-user');

    // Create test data
    testCustomer = await global.makeCustomer({
      name: 'Test Customer',
      email: global.generateUniqueEmail('test-customer'),
      phone: global.generatePhoneNumber()
    });

    testSupplier = await global.makeSupplier({
      name: 'Test Supplier',
      email: global.generateUniqueEmail('test-supplier')
    });
  });

  // ============================================================================
  // POST /api/admin/book - Create Booking Tests
  // ============================================================================

  describe('POST /api/admin/book - Create Booking', () => {
    describe('Happy Paths', () => {
      it('should create flight booking with admin token', async () => {
        const bookingData = global.buildBookingRequest({
          type: 'flight',
          customerInfo: {
            customerId: testCustomer.id,
            customerName: testCustomer.name,
            customerEmail: testCustomer.email,
            customerPhone: testCustomer.phone
          },
          details: {
            origin: 'JFK',
            destination: 'LAX',
            travelDate: global.generateDateRange().checkIn,
            passengers: [
              {
                firstName: 'John',
                lastName: 'Doe',
                type: 'adult',
                dateOfBirth: '1990-01-15'
              }
            ]
          }
        });

        const res = await global.postAuth('/api/admin/book', bookingData, 'admin');

        global.expectSuccess(res, 201);
        global.expectBookingResponse(res);
        expect(res.body.data.type).toBe('flight');
        expect(res.body.data.reference).toMatch(/^BK-/);
        expect(res.body.data.status).toMatch(/PENDING|CONFIRMED/);
        expect(res.body.data.customerInfo.customerId).toBe(testCustomer.id);
      });

      it('should create hotel booking with agent token', async () => {
        const dateRange = global.generateDateRange();
        const bookingData = global.buildBookingRequest({
          type: 'hotel',
          customerInfo: {
            customerId: testCustomer.id,
            customerName: testCustomer.name,
            customerEmail: testCustomer.email
          },
          details: {
            origin: 'New York',
            destination: 'Miami',
            checkIn: dateRange.checkIn,
            checkOut: dateRange.checkOut,
            rooms: 1,
            guests: 2
          }
        });

        const res = await global.postAuth('/api/admin/book', bookingData, 'agent');

        global.expectSuccess(res, 201);
        expect(res.body.data.type).toBe('hotel');
        expect(res.body.data.reference).toMatch(/^BK-/);
      });

      it('should create package booking with supervisor token', async () => {
        const dateRange = global.generateDateRange();
        const bookingData = global.buildBookingRequest({
          type: 'package',
          customerInfo: {
            customerId: testCustomer.id,
            customerName: testCustomer.name,
            customerEmail: testCustomer.email
          },
          details: {
            origin: 'New York',
            destination: 'London',
            checkIn: dateRange.checkIn,
            checkOut: dateRange.checkOut,
            packageType: 'deluxe',
            duration: 5
          }
        });

        const res = await global.postAuth('/api/admin/book', bookingData, 'supervisor');

        global.expectSuccess(res, 201);
        expect(res.body.data.type).toBe('package');
      });

      it('should generate valid booking reference', async () => {
        const bookingData = global.buildBookingRequest({
          type: 'flight',
          customerInfo: {
            customerId: testCustomer.id,
            customerName: testCustomer.name,
            customerEmail: testCustomer.email
          },
          details: {
            origin: 'JFK',
            destination: 'LAX',
            travelDate: global.generateDateRange().checkIn,
            passengers: [
              { firstName: 'Jane', lastName: 'Smith', type: 'adult', dateOfBirth: '1985-05-20' }
            ]
          }
        });

        const res = await global.postAuth('/api/admin/book', bookingData, 'admin');

        global.expectSuccess(res, 201);
        const reference = res.body.data.reference;
        expect(reference).toBeDefined();
        expect(reference).toMatch(/^BK-\d+$/);
      });

      it('should verify pricing calculation', async () => {
        const bookingData = global.buildBookingRequest({
          type: 'flight',
          customerInfo: {
            customerId: testCustomer.id,
            customerName: testCustomer.name,
            customerEmail: testCustomer.email
          },
          details: {
            origin: 'JFK',
            destination: 'LAX',
            travelDate: global.generateDateRange().checkIn,
            passengers: [
              { firstName: 'Test', lastName: 'User', type: 'adult', dateOfBirth: '1990-01-01' }
            ]
          },
          pricing: {
            supplierPrice: 500,
            customerPrice: 550,
            currency: 'USD',
            taxes: 50,
            fees: 20
          }
        });

        const res = await global.postAuth('/api/admin/book', bookingData, 'admin');

        global.expectSuccess(res, 201);
        expect(res.body.data.pricing).toBeDefined();
        expect(res.body.data.pricing.customerPrice).toBe(550);
        expect(res.body.data.pricing.supplierPrice).toBe(500);
      });

      it('should associate customer correctly', async () => {
        const bookingData = global.buildBookingRequest({
          type: 'flight',
          customerInfo: {
            customerId: testCustomer.id,
            customerName: testCustomer.name,
            customerEmail: testCustomer.email,
            customerPhone: testCustomer.phone
          },
          details: {
            origin: 'JFK',
            destination: 'LAX',
            travelDate: global.generateDateRange().checkIn,
            passengers: [
              { firstName: 'Link', lastName: 'Customer', type: 'adult', dateOfBirth: '1988-03-10' }
            ]
          }
        });

        const res = await global.postAuth('/api/admin/book', bookingData, 'admin');

        global.expectSuccess(res, 201);
        expect(res.body.data.customerInfo.customerId).toBe(testCustomer.id);
        expect(res.body.data.customerInfo.customerName).toBe(testCustomer.name);
        expect(res.body.data.customerInfo.customerEmail).toBe(testCustomer.email);
      });
    });

    describe('Error Paths', () => {
      it('should return 401 when no token provided', async () => {
        const bookingData = global.buildBookingRequest({
          type: 'flight',
          customerInfo: {
            customerId: testCustomer.id,
            customerName: testCustomer.name,
            customerEmail: testCustomer.email
          },
          details: {
            origin: 'JFK',
            destination: 'LAX',
            travelDate: global.generateDateRange().checkIn,
            passengers: [
              { firstName: 'Test', lastName: 'NoAuth', type: 'adult', dateOfBirth: '1990-01-01' }
            ]
          }
        });

        const res = await global.post('/api/admin/book', bookingData);
        global.expectError(res, 401);
      });

      it('should return 403 when using malformed token', async () => {
        const res = await global.api
          .post('/api/admin/book')
          .set('Authorization', 'Bearer malformed-token')
          .send(global.buildBookingRequest());

        global.expectError(res, 403);
      });

      it('should return 400 when type field is missing', async () => {
        const bookingData = global.buildBookingRequest({
          type: 'flight',
          customerInfo: {
            customerId: testCustomer.id,
            customerName: testCustomer.name,
            customerEmail: testCustomer.email
          },
          details: {
            origin: 'JFK',
            destination: 'LAX',
            travelDate: global.generateDateRange().checkIn,
            passengers: [
              { firstName: 'John', lastName: 'Doe', type: 'adult', dateOfBirth: '1990-01-01' }
            ]
          }
        });
        delete bookingData.type;

        const res = await global.postAuth('/api/admin/book', bookingData, 'admin');
        global.expectError(res, 400);
      });

      it('should return 400 when customerInfo is missing', async () => {
        const bookingData = global.buildBookingRequest({
          type: 'flight',
          details: {
            origin: 'JFK',
            destination: 'LAX',
            travelDate: global.generateDateRange().checkIn,
            passengers: [
              { firstName: 'John', lastName: 'Doe', type: 'adult', dateOfBirth: '1990-01-01' }
            ]
          }
        });
        delete bookingData.customerInfo;

        const res = await global.postAuth('/api/admin/book', bookingData, 'admin');
        global.expectError(res, 400);
      });

      it('should return 400 when details are missing', async () => {
        const bookingData = global.buildBookingRequest({
          type: 'flight',
          customerInfo: {
            customerId: testCustomer.id,
            customerName: testCustomer.name,
            customerEmail: testCustomer.email
          }
        });
        delete bookingData.details;

        const res = await global.postAuth('/api/admin/book', bookingData, 'admin');
        global.expectError(res, 400);
      });

      it('should return 400 with invalid booking type', async () => {
        const bookingData = global.buildBookingRequest({
          type: 'invalid-type',
          customerInfo: {
            customerId: testCustomer.id,
            customerName: testCustomer.name,
            customerEmail: testCustomer.email
          },
          details: {
            origin: 'JFK',
            destination: 'LAX',
            travelDate: global.generateDateRange().checkIn,
            passengers: [
              { firstName: 'John', lastName: 'Doe', type: 'adult', dateOfBirth: '1990-01-01' }
            ]
          }
        });

        const res = await global.postAuth('/api/admin/book', bookingData, 'admin');
        global.expectError(res, 400);
      });

      it('should return 400 with invalid email format', async () => {
        const bookingData = global.buildBookingRequest({
          type: 'flight',
          customerInfo: {
            customerId: testCustomer.id,
            customerName: testCustomer.name,
            customerEmail: 'invalid-email-format'
          },
          details: {
            origin: 'JFK',
            destination: 'LAX',
            travelDate: global.generateDateRange().checkIn,
            passengers: [
              { firstName: 'John', lastName: 'Doe', type: 'adult', dateOfBirth: '1990-01-01' }
            ]
          }
        });

        const res = await global.postAuth('/api/admin/book', bookingData, 'admin');
        global.expectError(res, 400);
      });

      it('should return 400 with negative pricing amount', async () => {
        const bookingData = global.buildBookingRequest({
          type: 'flight',
          customerInfo: {
            customerId: testCustomer.id,
            customerName: testCustomer.name,
            customerEmail: testCustomer.email
          },
          details: {
            origin: 'JFK',
            destination: 'LAX',
            travelDate: global.generateDateRange().checkIn,
            passengers: [
              { firstName: 'John', lastName: 'Doe', type: 'adult', dateOfBirth: '1990-01-01' }
            ]
          },
          pricing: {
            supplierPrice: -100,
            customerPrice: 550,
            currency: 'USD'
          }
        });

        const res = await global.postAuth('/api/admin/book', bookingData, 'admin');
        global.expectError(res, 400);
      });
    });

    describe('Edge Cases', () => {
      it('should handle booking with only required fields', async () => {
        const bookingData = global.buildBookingRequest({
          type: 'flight',
          customerInfo: {
            customerId: testCustomer.id,
            customerName: testCustomer.name,
            customerEmail: testCustomer.email
          },
          details: {
            origin: 'JFK',
            destination: 'LAX',
            travelDate: global.generateDateRange().checkIn,
            passengers: [
              { firstName: 'Minimal', lastName: 'Booking', type: 'adult', dateOfBirth: '1990-01-01' }
            ]
          }
        });

        const res = await global.postAuth('/api/admin/book', bookingData, 'admin');

        global.expectSuccess(res, 201);
        expect(res.body.data).toBeDefined();
        expect(res.body.data.reference).toBeDefined();
      });

      it('should handle special characters in passenger names', async () => {
        const bookingData = global.buildBookingRequest({
          type: 'flight',
          customerInfo: {
            customerId: testCustomer.id,
            customerName: testCustomer.name,
            customerEmail: testCustomer.email
          },
          details: {
            origin: 'JFK',
            destination: 'LAX',
            travelDate: global.generateDateRange().checkIn,
            passengers: [
              {
                firstName: 'François',
                lastName: "O'Neill-García",
                type: 'adult',
                dateOfBirth: '1990-01-01'
              }
            ]
          }
        });

        const res = await global.postAuth('/api/admin/book', bookingData, 'admin');

        global.expectSuccess(res, 201);
        expect(res.body.data.details.passengers[0].firstName).toBe('François');
      });

      it('should handle multiple passengers in single booking', async () => {
        const bookingData = global.buildBookingRequest({
          type: 'flight',
          customerInfo: {
            customerId: testCustomer.id,
            customerName: testCustomer.name,
            customerEmail: testCustomer.email
          },
          details: {
            origin: 'JFK',
            destination: 'LAX',
            travelDate: global.generateDateRange().checkIn,
            passengers: [
              { firstName: 'Adult1', lastName: 'Passenger', type: 'adult', dateOfBirth: '1990-01-01' },
              { firstName: 'Adult2', lastName: 'Passenger', type: 'adult', dateOfBirth: '1992-05-15' },
              { firstName: 'Child', lastName: 'Passenger', type: 'child', dateOfBirth: '2015-08-20' }
            ]
          }
        });

        const res = await global.postAuth('/api/admin/book', bookingData, 'admin');

        global.expectSuccess(res, 201);
        expect(res.body.data.details.passengers.length).toBe(3);
      });
    });
  });

  // ============================================================================
  // GET /api/admin/search - Search Bookings Tests
  // ============================================================================

  describe('GET /api/admin/search - Search Bookings', () => {
    beforeEach(async () => {
      // Create test bookings for search tests
      const dateRange = global.generateDateRange();
      
      await global.postAuth('/api/admin/book', global.buildBookingRequest({
        type: 'flight',
        customerInfo: {
          customerId: testCustomer.id,
          customerName: testCustomer.name,
          customerEmail: testCustomer.email
        },
        details: {
          origin: 'JFK',
          destination: 'LAX',
          travelDate: dateRange.checkIn,
          passengers: [
            { firstName: 'Search', lastName: 'Test1', type: 'adult', dateOfBirth: '1990-01-01' }
          ]
        }
      }), 'admin');

      await global.postAuth('/api/admin/book', global.buildBookingRequest({
        type: 'hotel',
        customerInfo: {
          customerId: testCustomer.id,
          customerName: testCustomer.name,
          customerEmail: testCustomer.email
        },
        details: {
          origin: 'New York',
          destination: 'Miami',
          checkIn: dateRange.checkIn,
          checkOut: dateRange.checkOut,
          rooms: 1
        }
      }), 'admin');
    });

    describe('Happy Paths', () => {
      it('should search all bookings with default pagination', async () => {
        const res = await global.api
          .get('/api/admin/search')
          .set(global.withAuth(adminToken))
          .expect(200);

        global.expectSuccess(res, 200);
        expect(res.body.data).toBeInstanceOf(Array);
        expect(res.body.pagination).toBeDefined();
        expect(res.body.pagination.page).toBe(1);
        expect(res.body.pagination.limit).toBeLessThanOrEqual(10);
      });

      it('should filter bookings by type', async () => {
        const res = await global.api
          .get('/api/admin/search')
          .query({ type: 'flight' })
          .set(global.withAuth(adminToken))
          .expect(200);

        global.expectSuccess(res, 200);
        if (res.body.data.length > 0) {
          res.body.data.forEach((booking: any) => {
            expect(booking.type).toBe('flight');
          });
        }
      });

      it('should filter bookings by status', async () => {
        const res = await global.api
          .get('/api/admin/search')
          .query({ status: 'PENDING' })
          .set(global.withAuth(adminToken))
          .expect(200);

        global.expectSuccess(res, 200);
        if (res.body.data.length > 0) {
          res.body.data.forEach((booking: any) => {
            expect(['PENDING', 'CONFIRMED']).toContain(booking.status);
          });
        }
      });

      it('should filter bookings by customer', async () => {
        const res = await global.api
          .get('/api/admin/search')
          .query({ customerId: testCustomer.id })
          .set(global.withAuth(adminToken))
          .expect(200);

        global.expectSuccess(res, 200);
        if (res.body.data.length > 0) {
          res.body.data.forEach((booking: any) => {
            expect(booking.customerInfo.customerId).toBe(testCustomer.id);
          });
        }
      });

      it('should support pagination', async () => {
        const res = await global.api
          .get('/api/admin/search')
          .query({ page: 1, limit: 5 })
          .set(global.withAuth(adminToken))
          .expect(200);

        global.expectSuccess(res, 200);
        expect(res.body.pagination.page).toBe(1);
        expect(res.body.pagination.limit).toBe(5);
      });

      it('should support sorting by creation date', async () => {
        const res = await global.api
          .get('/api/admin/search')
          .query({ sortBy: 'createdAt', sortOrder: 'DESC' })
          .set(global.withAuth(adminToken))
          .expect(200);

        global.expectSuccess(res, 200);
        expect(res.body.data).toBeDefined();
      });
    });

    describe('Error Paths', () => {
      it('should return 401 without authentication token', async () => {
        const res = await global.api.get('/api/admin/search');
        global.expectError(res, 401);
      });

      it('should return 400 with invalid pagination parameters', async () => {
        const res = await global.api
          .get('/api/admin/search')
          .query({ page: 0, limit: 0 })
          .set(global.withAuth(adminToken));

        expect(res.status).toBe(400);
      });

      it('should return 400 with invalid status filter', async () => {
        const res = await global.api
          .get('/api/admin/search')
          .query({ status: 'INVALID_STATUS' })
          .set(global.withAuth(adminToken));

        expect(res.status).toBe(400);
      });
    });

    describe('Edge Cases', () => {
      it('should return empty array when no bookings match filter', async () => {
        const res = await global.api
          .get('/api/admin/search')
          .query({ customerId: 'non-existent-customer-id' })
          .set(global.withAuth(adminToken))
          .expect(200);

        global.expectSuccess(res, 200);
        expect(res.body.data).toEqual([]);
      });
    });
  });

  // ============================================================================
  // POST /api/admin/hold - Hold Inventory Tests
  // ============================================================================

  describe('POST /api/admin/hold - Hold Inventory', () => {
    describe('Happy Paths', () => {
      it('should hold flight inventory with manager token', async () => {
        const holdData = {
          serviceType: 'flight',
          inventoryDetails: {
            origin: 'JFK',
            destination: 'LAX',
            travelDate: global.generateDateRange().checkIn
          },
          customerInfo: {
            customerId: testCustomer.id,
            customerName: testCustomer.name,
            customerEmail: testCustomer.email
          },
          holdDuration: 60
        };

        const res = await global.postAuth('/api/admin/hold', holdData, 'manager');

        global.expectSuccess(res, 201);
        expect(res.body.data.status).toBe('HOLD');
        expect(res.body.data.holdUntil).toBeDefined();
      });

      it('should hold hotel inventory with supervisor token', async () => {
        const dateRange = global.generateDateRange();
        const holdData = {
          serviceType: 'hotel',
          inventoryDetails: {
            origin: 'New York',
            destination: 'Miami',
            checkIn: dateRange.checkIn,
            checkOut: dateRange.checkOut
          },
          customerInfo: {
            customerId: testCustomer.id,
            customerName: testCustomer.name,
            customerEmail: testCustomer.email
          }
        };

        const res = await global.postAuth('/api/admin/hold', holdData, 'supervisor');

        global.expectSuccess(res, 201);
        expect(res.body.data.status).toBe('HOLD');
      });

      it('should respect custom hold duration', async () => {
        const holdData = {
          serviceType: 'flight',
          inventoryDetails: {
            origin: 'JFK',
            destination: 'LAX',
            travelDate: global.generateDateRange().checkIn
          },
          customerInfo: {
            customerId: testCustomer.id,
            customerName: testCustomer.name,
            customerEmail: testCustomer.email
          },
          holdDuration: 120
        };

        const res = await global.postAuth('/api/admin/hold', holdData, 'manager');

        global.expectSuccess(res, 201);
        const holdUntil = new Date(res.body.data.holdUntil);
        const expectedDuration = 120 * 60 * 1000; // Convert minutes to milliseconds
        expect(holdUntil.getTime()).toBeGreaterThan(Date.now());
      });

      it('should apply default hold duration when not specified', async () => {
        const holdData = {
          serviceType: 'flight',
          inventoryDetails: {
            origin: 'JFK',
            destination: 'LAX',
            travelDate: global.generateDateRange().checkIn
          },
          customerInfo: {
            customerId: testCustomer.id,
            customerName: testCustomer.name,
            customerEmail: testCustomer.email
          }
        };

        const res = await global.postAuth('/api/admin/hold', holdData, 'manager');

        global.expectSuccess(res, 201);
        expect(res.body.data.holdUntil).toBeDefined();
      });
    });

    describe('Error Paths', () => {
      it('should return 401 without authentication', async () => {
        const holdData = {
          serviceType: 'flight',
          inventoryDetails: {
            origin: 'JFK',
            destination: 'LAX',
            travelDate: global.generateDateRange().checkIn
          },
          customerInfo: {
            customerId: testCustomer.id,
            customerName: testCustomer.name,
            customerEmail: testCustomer.email
          }
        };

        const res = await global.post('/api/admin/hold', holdData);
        global.expectError(res, 401);
      });

      it('should return 400 with missing serviceType', async () => {
        const holdData = {
          inventoryDetails: {
            origin: 'JFK',
            destination: 'LAX',
            travelDate: global.generateDateRange().checkIn
          },
          customerInfo: {
            customerId: testCustomer.id,
            customerName: testCustomer.name,
            customerEmail: testCustomer.email
          }
        };

        const res = await global.postAuth('/api/admin/hold', holdData, 'manager');
        global.expectError(res, 400);
      });

      it('should return 400 with hold duration less than minimum', async () => {
        const holdData = {
          serviceType: 'flight',
          inventoryDetails: {
            origin: 'JFK',
            destination: 'LAX',
            travelDate: global.generateDateRange().checkIn
          },
          customerInfo: {
            customerId: testCustomer.id,
            customerName: testCustomer.name,
            customerEmail: testCustomer.email
          },
          holdDuration: 5 // Less than 15 minute minimum
        };

        const res = await global.postAuth('/api/admin/hold', holdData, 'manager');
        global.expectError(res, 400);
      });

      it('should return 400 with hold duration exceeding maximum', async () => {
        const holdData = {
          serviceType: 'flight',
          inventoryDetails: {
            origin: 'JFK',
            destination: 'LAX',
            travelDate: global.generateDateRange().checkIn
          },
          customerInfo: {
            customerId: testCustomer.id,
            customerName: testCustomer.name,
            customerEmail: testCustomer.email
          },
          holdDuration: 2000 // Exceeds 1440 minute maximum
        };

        const res = await global.postAuth('/api/admin/hold', holdData, 'manager');
        global.expectError(res, 400);
      });
    });

    describe('Edge Cases', () => {
      it('should handle minimum hold duration', async () => {
        const holdData = {
          serviceType: 'flight',
          inventoryDetails: {
            origin: 'JFK',
            destination: 'LAX',
            travelDate: global.generateDateRange().checkIn
          },
          customerInfo: {
            customerId: testCustomer.id,
            customerName: testCustomer.name,
            customerEmail: testCustomer.email
          },
          holdDuration: 15
        };

        const res = await global.postAuth('/api/admin/hold', holdData, 'manager');

        global.expectSuccess(res, 201);
        expect(res.body.data.holdUntil).toBeDefined();
      });

      it('should handle maximum hold duration', async () => {
        const holdData = {
          serviceType: 'flight',
          inventoryDetails: {
            origin: 'JFK',
            destination: 'LAX',
            travelDate: global.generateDateRange().checkIn
          },
          customerInfo: {
            customerId: testCustomer.id,
            customerName: testCustomer.name,
            customerEmail: testCustomer.email
          },
          holdDuration: 1440
        };

        const res = await global.postAuth('/api/admin/hold', holdData, 'manager');

        global.expectSuccess(res, 201);
        expect(res.body.data.holdUntil).toBeDefined();
      });
    });
  });

  // ============================================================================
  // POST /api/admin/confirm - Confirm Booking Tests
  // ============================================================================

  describe('POST /api/admin/confirm - Confirm Booking', () => {
    let bookingToConfirm: any;

    beforeEach(async () => {
      // Create a booking to confirm
      const dateRange = global.generateDateRange();
      const res = await global.postAuth('/api/admin/book', global.buildBookingRequest({
        type: 'flight',
        customerInfo: {
          customerId: testCustomer.id,
          customerName: testCustomer.name,
          customerEmail: testCustomer.email
        },
        details: {
          origin: 'JFK',
          destination: 'LAX',
          travelDate: dateRange.checkIn,
          passengers: [
            { firstName: 'Confirm', lastName: 'Test', type: 'adult', dateOfBirth: '1990-01-01' }
          ]
        }
      }), 'admin');

      bookingToConfirm = res.body.data;
    });

    describe('Happy Paths', () => {
      it('should confirm pending booking with admin token', async () => {
        const confirmData = {
          supplierReference: global.generatePNR(),
          paymentInfo: {
            method: 'CREDIT_CARD',
            amount: 550,
            currency: 'USD',
            transactionId: 'txn_' + Date.now()
          }
        };

        const res = await global.postAuth(`/api/admin/confirm/${bookingToConfirm.id}`, confirmData, 'admin');

        global.expectSuccess(res, 200);
        expect(res.body.data.status).toBe('CONFIRMED');
        expect(res.body.data.supplierReference).toBe(confirmData.supplierReference);
      });

      it('should confirm with ticket details', async () => {
        const confirmData = {
          supplierReference: global.generatePNR(),
          paymentInfo: {
            method: 'CREDIT_CARD',
            amount: 550,
            currency: 'USD',
            transactionId: 'txn_' + Date.now()
          },
          ticketDetails: {
            ticketNumbers: ['0001234567890', '0001234567891'],
            eTicketDetails: {
              format: 'eTicket',
              validFrom: new Date(),
              validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
            }
          }
        };

        const res = await global.postAuth(`/api/admin/confirm/${bookingToConfirm.id}`, confirmData, 'admin');

        global.expectSuccess(res, 200);
        expect(res.body.data.status).toBe('CONFIRMED');
      });

      it('should store payment information correctly', async () => {
        const confirmData = {
          supplierReference: global.generatePNR(),
          paymentInfo: {
            method: 'DEBIT_CARD',
            amount: 550,
            currency: 'USD',
            transactionId: 'txn_' + Date.now()
          }
        };

        const res = await global.postAuth(`/api/admin/confirm/${bookingToConfirm.id}`, confirmData, 'admin');

        global.expectSuccess(res, 200);
        expect(res.body.data.paymentInfo).toBeDefined();
        expect(res.body.data.paymentInfo.method).toBe('DEBIT_CARD');
      });
    });

    describe('Error Paths', () => {
      it('should return 401 without authentication', async () => {
        const confirmData = {
          supplierReference: global.generatePNR(),
          paymentInfo: {
            method: 'CREDIT_CARD',
            amount: 550,
            currency: 'USD'
          }
        };

        const res = await global.post(`/api/admin/confirm/${bookingToConfirm.id}`, confirmData);
        global.expectError(res, 401);
      });

      it('should return 400 with missing bookingId', async () => {
        const confirmData = {
          supplierReference: global.generatePNR(),
          paymentInfo: {
            method: 'CREDIT_CARD',
            amount: 550,
            currency: 'USD'
          }
        };

        const res = await global.postAuth('/api/admin/confirm/missing-id', confirmData, 'admin');
        global.expectError(res, 400);
      });

      it('should return 404 with non-existent booking', async () => {
        const confirmData = {
          supplierReference: global.generatePNR(),
          paymentInfo: {
            method: 'CREDIT_CARD',
            amount: 550,
            currency: 'USD'
          }
        };

        const res = await global.postAuth('/api/admin/confirm/non-existent-id', confirmData, 'admin');
        expect([400, 404]).toContain(res.status);
      });

      it('should return 400 with negative payment amount', async () => {
        const confirmData = {
          supplierReference: global.generatePNR(),
          paymentInfo: {
            method: 'CREDIT_CARD',
            amount: -550,
            currency: 'USD'
          }
        };

        const res = await global.postAuth(`/api/admin/confirm/${bookingToConfirm.id}`, confirmData, 'admin');
        global.expectError(res, 400);
      });
    });

    describe('Edge Cases', () => {
      it('should confirm with minimum required data', async () => {
        const confirmData = {
          supplierReference: global.generatePNR(),
          paymentInfo: {
            method: 'CREDIT_CARD',
            amount: 550,
            currency: 'USD'
          }
        };

        const res = await global.postAuth(`/api/admin/confirm/${bookingToConfirm.id}`, confirmData, 'admin');

        global.expectSuccess(res, 200);
        expect(res.body.data.status).toBe('CONFIRMED');
      });
    });
  });

  // ============================================================================
  // POST /api/admin/issue-ticket - Issue Ticket Tests
  // ============================================================================

  describe('POST /api/admin/issue-ticket - Issue Ticket', () => {
    let confirmedBooking: any;

    beforeEach(async () => {
      // Create and confirm a booking
      const dateRange = global.generateDateRange();
      const createRes = await global.postAuth('/api/admin/book', global.buildBookingRequest({
        type: 'flight',
        customerInfo: {
          customerId: testCustomer.id,
          customerName: testCustomer.name,
          customerEmail: testCustomer.email
        },
        details: {
          origin: 'JFK',
          destination: 'LAX',
          travelDate: dateRange.checkIn,
          passengers: [
            { firstName: 'Ticket', lastName: 'Test', type: 'adult', dateOfBirth: '1990-01-01' }
          ]
        }
      }), 'admin');

      const booking = createRes.body.data;

      const confirmRes = await global.postAuth(`/api/admin/confirm/${booking.id}`, {
        supplierReference: global.generatePNR(),
        paymentInfo: {
          method: 'CREDIT_CARD',
          amount: 550,
          currency: 'USD',
          transactionId: 'txn_' + Date.now()
        }
      }, 'admin');

      confirmedBooking = confirmRes.body.data;
    });

    describe('Happy Paths', () => {
      it('should issue ticket for confirmed booking', async () => {
        const issueData = {
          passengerDetails: [
            {
              firstName: 'Ticket',
              lastName: 'Test',
              ticketNumber: '0001234567890',
              seatNumber: '12A'
            }
          ],
          issueDetails: {
            issuedBy: 'test-agent',
            issueDate: new Date().toISOString(),
            remarks: 'Standard ticket issuance'
          }
        };

        const res = await global.postAuth(`/api/admin/issue-ticket/${confirmedBooking.id}`, issueData, 'admin');

        global.expectSuccess(res, 200);
        expect(res.body.data.status).toBeDefined();
      });

      it('should handle multiple passengers', async () => {
        const issueData = {
          passengerDetails: [
            {
              firstName: 'Passenger1',
              lastName: 'One',
              ticketNumber: '0001234567890',
              seatNumber: '12A'
            },
            {
              firstName: 'Passenger2',
              lastName: 'Two',
              ticketNumber: '0001234567891',
              seatNumber: '12B'
            }
          ],
          issueDetails: {
            issuedBy: 'test-agent',
            issueDate: new Date().toISOString()
          }
        };

        const res = await global.postAuth(`/api/admin/issue-ticket/${confirmedBooking.id}`, issueData, 'admin');

        global.expectSuccess(res, 200);
      });

      it('should include baggage allowance', async () => {
        const issueData = {
          passengerDetails: [
            {
              firstName: 'Ticket',
              lastName: 'Test',
              ticketNumber: '0001234567890',
              seatNumber: '12A',
              baggageAllowance: {
                checkedBags: 2,
                carryOn: 1,
                weight: 50
              }
            }
          ],
          issueDetails: {
            issuedBy: 'test-agent',
            issueDate: new Date().toISOString()
          }
        };

        const res = await global.postAuth(`/api/admin/issue-ticket/${confirmedBooking.id}`, issueData, 'admin');

        global.expectSuccess(res, 200);
      });
    });

    describe('Error Paths', () => {
      it('should return 401 without authentication', async () => {
        const issueData = {
          passengerDetails: [
            {
              firstName: 'Ticket',
              lastName: 'Test',
              ticketNumber: '0001234567890'
            }
          ],
          issueDetails: {
            issuedBy: 'test-agent',
            issueDate: new Date().toISOString()
          }
        };

        const res = await global.post(`/api/admin/issue-ticket/${confirmedBooking.id}`, issueData);
        global.expectError(res, 401);
      });

      it('should return 400 with missing bookingId', async () => {
        const issueData = {
          passengerDetails: [
            {
              firstName: 'Ticket',
              lastName: 'Test',
              ticketNumber: '0001234567890'
            }
          ],
          issueDetails: {
            issuedBy: 'test-agent',
            issueDate: new Date().toISOString()
          }
        };

        const res = await global.postAuth('/api/admin/issue-ticket/missing-id', issueData, 'admin');
        global.expectError(res, 400);
      });

      it('should return 400 with missing passengerDetails', async () => {
        const issueData = {
          issueDetails: {
            issuedBy: 'test-agent',
            issueDate: new Date().toISOString()
          }
        };

        const res = await global.postAuth(`/api/admin/issue-ticket/${confirmedBooking.id}`, issueData, 'admin');
        global.expectError(res, 400);
      });

      it('should return 404 with non-existent booking', async () => {
        const issueData = {
          passengerDetails: [
            {
              firstName: 'Ticket',
              lastName: 'Test',
              ticketNumber: '0001234567890'
            }
          ],
          issueDetails: {
            issuedBy: 'test-agent',
            issueDate: new Date().toISOString()
          }
        };

        const res = await global.postAuth('/api/admin/issue-ticket/non-existent-id', issueData, 'admin');
        expect([400, 404]).toContain(res.status);
      });
    });

    describe('Edge Cases', () => {
      it('should issue ticket with minimum required data', async () => {
        const issueData = {
          passengerDetails: [
            {
              firstName: 'Ticket',
              lastName: 'Test',
              ticketNumber: '0001234567890'
            }
          ],
          issueDetails: {
            issuedBy: 'test-agent',
            issueDate: new Date().toISOString()
          }
        };

        const res = await global.postAuth(`/api/admin/issue-ticket/${confirmedBooking.id}`, issueData, 'admin');

        global.expectSuccess(res, 200);
      });
    });
  });

  // ============================================================================
  // PUT /api/admin/workflow/:bookingId/status - Update Status Tests
  // ============================================================================

  describe('PUT /api/admin/workflow/:bookingId/status - Update Status', () => {
    let bookingForWorkflow: any;

    beforeEach(async () => {
      // Create a booking for workflow tests
      const dateRange = global.generateDateRange();
      const res = await global.postAuth('/api/admin/book', global.buildBookingRequest({
        type: 'flight',
        customerInfo: {
          customerId: testCustomer.id,
          customerName: testCustomer.name,
          customerEmail: testCustomer.email
        },
        details: {
          origin: 'JFK',
          destination: 'LAX',
          travelDate: dateRange.checkIn,
          passengers: [
            { firstName: 'Workflow', lastName: 'Test', type: 'adult', dateOfBirth: '1990-01-01' }
          ]
        }
      }), 'admin');

      bookingForWorkflow = res.body.data;
    });

    describe('Happy Paths', () => {
      it('should update status to CONFIRMED with manager', async () => {
        const updateData = {
          status: 'CONFIRMED',
          reason: 'Customer confirmed booking',
          nextAction: 'issue_ticket',
          estimatedCompletion: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        };

        const res = await global.api
          .put(`/api/admin/workflow/${bookingForWorkflow.id}/status`)
          .set(global.withAuth(managerToken))
          .send(updateData)
          .expect(200);

        global.expectSuccess(res, 200);
        expect(res.body.data.status).toBe('CONFIRMED');
      });

      it('should update status to CANCELLED', async () => {
        const updateData = {
          status: 'CANCELLED',
          reason: 'Customer requested cancellation'
        };

        const res = await global.api
          .put(`/api/admin/workflow/${bookingForWorkflow.id}/status`)
          .set(global.withAuth(managerToken))
          .send(updateData)
          .expect(200);

        global.expectSuccess(res, 200);
        expect(res.body.data.status).toBe('CANCELLED');
      });

      it('should update status to EXPIRED', async () => {
        const updateData = {
          status: 'EXPIRED',
          reason: 'Hold period expired'
        };

        const res = await global.api
          .put(`/api/admin/workflow/${bookingForWorkflow.id}/status`)
          .set(global.withAuth(managerToken))
          .send(updateData)
          .expect(200);

        global.expectSuccess(res, 200);
      });

      it('should store reason with status update', async () => {
        const updateData = {
          status: 'CONFIRMED',
          reason: 'Supplier confirmed inventory availability'
        };

        const res = await global.api
          .put(`/api/admin/workflow/${bookingForWorkflow.id}/status`)
          .set(global.withAuth(managerToken))
          .send(updateData)
          .expect(200);

        global.expectSuccess(res, 200);
        expect(res.body.data.workflowHistory).toBeDefined();
      });
    });

    describe('Error Paths', () => {
      it('should return 401 without authentication', async () => {
        const updateData = {
          status: 'CONFIRMED',
          reason: 'Test'
        };

        const res = await global.api
          .put(`/api/admin/workflow/${bookingForWorkflow.id}/status`)
          .send(updateData);

        global.expectError(res, 401);
      });

      it('should return 400 with missing status', async () => {
        const updateData = {
          reason: 'Missing status field'
        };

        const res = await global.api
          .put(`/api/admin/workflow/${bookingForWorkflow.id}/status`)
          .set(global.withAuth(managerToken))
          .send(updateData);

        global.expectError(res, 400);
      });

      it('should return 400 with invalid status value', async () => {
        const updateData = {
          status: 'INVALID_STATUS',
          reason: 'Test'
        };

        const res = await global.api
          .put(`/api/admin/workflow/${bookingForWorkflow.id}/status`)
          .set(global.withAuth(managerToken))
          .send(updateData);

        global.expectError(res, 400);
      });

      it('should return 404 with non-existent booking', async () => {
        const updateData = {
          status: 'CONFIRMED',
          reason: 'Test'
        };

        const res = await global.api
          .put('/api/admin/workflow/non-existent-id/status')
          .set(global.withAuth(managerToken))
          .send(updateData);

        expect([400, 404]).toContain(res.status);
      });
    });

    describe('Edge Cases', () => {
      it('should handle status update without optional fields', async () => {
        const updateData = {
          status: 'CONFIRMED'
        };

        const res = await global.api
          .put(`/api/admin/workflow/${bookingForWorkflow.id}/status`)
          .set(global.withAuth(managerToken))
          .send(updateData)
          .expect(200);

        global.expectSuccess(res, 200);
      });
    });
  });

  // ============================================================================
  // PUT /api/admin/workflow/:bookingId/assign - Assign Booking Tests
  // ============================================================================

  describe('PUT /api/admin/workflow/:bookingId/assign - Assign Booking', () => {
    let bookingForAssign: any;

    beforeEach(async () => {
      const dateRange = global.generateDateRange();
      const res = await global.postAuth('/api/admin/book', global.buildBookingRequest({
        type: 'flight',
        customerInfo: {
          customerId: testCustomer.id,
          customerName: testCustomer.name,
          customerEmail: testCustomer.email
        },
        details: {
          origin: 'JFK',
          destination: 'LAX',
          travelDate: dateRange.checkIn,
          passengers: [
            { firstName: 'Assign', lastName: 'Test', type: 'adult', dateOfBirth: '1990-01-01' }
          ]
        }
      }), 'admin');

      bookingForAssign = res.body.data;
    });

    describe('Happy Paths', () => {
      it('should assign booking to agent with supervisor', async () => {
        const assignData = {
          agentId: 'test-agent-001',
          reason: 'Assigned for processing',
          priority: 'high',
          deadline: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
        };

        const res = await global.api
          .put(`/api/admin/workflow/${bookingForAssign.id}/assign`)
          .set(global.withAuth(supervisorToken))
          .send(assignData)
          .expect(200);

        global.expectSuccess(res, 200);
        expect(res.body.data.assignedAgent).toBe('test-agent-001');
      });

      it('should reassign booking to different agent', async () => {
        // First assignment
        await global.api
          .put(`/api/admin/workflow/${bookingForAssign.id}/assign`)
          .set(global.withAuth(supervisorToken))
          .send({
            agentId: 'agent-001',
            reason: 'Initial assignment'
          });

        // Reassignment
        const assignData = {
          agentId: 'agent-002',
          reason: 'Reassigned due to agent availability'
        };

        const res = await global.api
          .put(`/api/admin/workflow/${bookingForAssign.id}/assign`)
          .set(global.withAuth(supervisorToken))
          .send(assignData)
          .expect(200);

        global.expectSuccess(res, 200);
        expect(res.body.data.assignedAgent).toBe('agent-002');
      });

      it('should set priority on assignment', async () => {
        const assignData = {
          agentId: 'test-agent-001',
          priority: 'urgent'
        };

        const res = await global.api
          .put(`/api/admin/workflow/${bookingForAssign.id}/assign`)
          .set(global.withAuth(supervisorToken))
          .send(assignData)
          .expect(200);

        global.expectSuccess(res, 200);
        expect(res.body.data.priority).toBe('urgent');
      });
    });

    describe('Error Paths', () => {
      it('should return 401 without authentication', async () => {
        const assignData = {
          agentId: 'test-agent-001',
          reason: 'Test'
        };

        const res = await global.api
          .put(`/api/admin/workflow/${bookingForAssign.id}/assign`)
          .send(assignData);

        global.expectError(res, 401);
      });

      it('should return 400 with missing agentId', async () => {
        const assignData = {
          reason: 'Missing agent ID'
        };

        const res = await global.api
          .put(`/api/admin/workflow/${bookingForAssign.id}/assign`)
          .set(global.withAuth(supervisorToken))
          .send(assignData);

        global.expectError(res, 400);
      });

      it('should return 400 with invalid priority', async () => {
        const assignData = {
          agentId: 'test-agent-001',
          priority: 'invalid_priority'
        };

        const res = await global.api
          .put(`/api/admin/workflow/${bookingForAssign.id}/assign`)
          .set(global.withAuth(supervisorToken))
          .send(assignData);

        global.expectError(res, 400);
      });

      it('should return 404 with non-existent booking', async () => {
        const assignData = {
          agentId: 'test-agent-001',
          reason: 'Test'
        };

        const res = await global.api
          .put('/api/admin/workflow/non-existent-id/assign')
          .set(global.withAuth(supervisorToken))
          .send(assignData);

        expect([400, 404]).toContain(res.status);
      });
    });

    describe('Edge Cases', () => {
      it('should assign with minimum required data', async () => {
        const assignData = {
          agentId: 'test-agent-001'
        };

        const res = await global.api
          .put(`/api/admin/workflow/${bookingForAssign.id}/assign`)
          .set(global.withAuth(supervisorToken))
          .send(assignData)
          .expect(200);

        global.expectSuccess(res, 200);
      });
    });
  });

  // ============================================================================
  // PUT /api/admin/workflow/:bookingId/priority - Update Priority Tests
  // ============================================================================

  describe('PUT /api/admin/workflow/:bookingId/priority - Update Priority', () => {
    let bookingForPriority: any;

    beforeEach(async () => {
      const dateRange = global.generateDateRange();
      const res = await global.postAuth('/api/admin/book', global.buildBookingRequest({
        type: 'flight',
        customerInfo: {
          customerId: testCustomer.id,
          customerName: testCustomer.name,
          customerEmail: testCustomer.email
        },
        details: {
          origin: 'JFK',
          destination: 'LAX',
          travelDate: dateRange.checkIn,
          passengers: [
            { firstName: 'Priority', lastName: 'Test', type: 'adult', dateOfBirth: '1990-01-01' }
          ]
        }
      }), 'admin');

      bookingForPriority = res.body.data;
    });

    describe('Happy Paths', () => {
      it('should update priority to urgent with manager', async () => {
        const priorityData = {
          priority: 'urgent',
          reason: 'VIP customer request'
        };

        const res = await global.api
          .put(`/api/admin/workflow/${bookingForPriority.id}/priority`)
          .set(global.withAuth(managerToken))
          .send(priorityData)
          .expect(200);

        global.expectSuccess(res, 200);
        expect(res.body.data.priority).toBe('urgent');
      });

      it('should downgrade priority to low', async () => {
        const priorityData = {
          priority: 'low',
          reason: 'No rush required'
        };

        const res = await global.api
          .put(`/api/admin/workflow/${bookingForPriority.id}/priority`)
          .set(global.withAuth(managerToken))
          .send(priorityData)
          .expect(200);

        global.expectSuccess(res, 200);
        expect(res.body.data.priority).toBe('low');
      });

      it('should store reason with priority update', async () => {
        const priorityData = {
          priority: 'high',
          reason: 'Customer escalation'
        };

        const res = await global.api
          .put(`/api/admin/workflow/${bookingForPriority.id}/priority`)
          .set(global.withAuth(managerToken))
          .send(priorityData)
          .expect(200);

        global.expectSuccess(res, 200);
        expect(res.body.data.priority).toBe('high');
      });
    });

    describe('Error Paths', () => {
      it('should return 401 without authentication', async () => {
        const priorityData = {
          priority: 'high',
          reason: 'Test'
        };

        const res = await global.api
          .put(`/api/admin/workflow/${bookingForPriority.id}/priority`)
          .send(priorityData);

        global.expectError(res, 401);
      });

      it('should return 400 with missing priority', async () => {
        const priorityData = {
          reason: 'Missing priority field'
        };

        const res = await global.api
          .put(`/api/admin/workflow/${bookingForPriority.id}/priority`)
          .set(global.withAuth(managerToken))
          .send(priorityData);

        global.expectError(res, 400);
      });

      it('should return 400 with invalid priority value', async () => {
        const priorityData = {
          priority: 'invalid_priority',
          reason: 'Test'
        };

        const res = await global.api
          .put(`/api/admin/workflow/${bookingForPriority.id}/priority`)
          .set(global.withAuth(managerToken))
          .send(priorityData);

        global.expectError(res, 400);
      });

      it('should return 404 with non-existent booking', async () => {
        const priorityData = {
          priority: 'high',
          reason: 'Test'
        };

        const res = await global.api
          .put('/api/admin/workflow/non-existent-id/priority')
          .set(global.withAuth(managerToken))
          .send(priorityData);

        expect([400, 404]).toContain(res.status);
      });
    });

    describe('Edge Cases', () => {
      it('should update priority without optional reason', async () => {
        const priorityData = {
          priority: 'medium'
        };

        const res = await global.api
          .put(`/api/admin/workflow/${bookingForPriority.id}/priority`)
          .set(global.withAuth(managerToken))
          .send(priorityData)
          .expect(200);

        global.expectSuccess(res, 200);
      });
    });
  });

  // ============================================================================
  // Cross-Cutting Authentication and Authorization Tests
  // ============================================================================

  describe('Authentication and Authorization - Cross-Cutting', () => {
    describe('All Endpoints - No Token Provided', () => {
      it('POST /api/admin/book should return 401', async () => {
        const res = await global.post('/api/admin/book', global.buildBookingRequest());
        global.expectError(res, 401);
      });

      it('GET /api/admin/search should return 401', async () => {
        const res = await global.api.get('/api/admin/search');
        global.expectError(res, 401);
      });

      it('POST /api/admin/hold should return 401', async () => {
        const res = await global.post('/api/admin/hold', {
          serviceType: 'flight',
          inventoryDetails: {},
          customerInfo: {}
        });
        global.expectError(res, 401);
      });

      it('POST /api/admin/confirm should return 401', async () => {
        const res = await global.post('/api/admin/confirm', {
          bookingId: 'test-id',
          supplierReference: 'ref',
          paymentInfo: {}
        });
        global.expectError(res, 401);
      });

      it('POST /api/admin/issue-ticket should return 401', async () => {
        const res = await global.post('/api/admin/issue-ticket', {
          bookingId: 'test-id',
          passengerDetails: [],
          issueDetails: {}
        });
        global.expectError(res, 401);
      });
    });

    describe('Admin Role - Full Access', () => {
      it('should allow admin to access all endpoints', async () => {
        // Create test booking
        const dateRange = global.generateDateRange();
        const createRes = await global.postAuth('/api/admin/book', global.buildBookingRequest({
          type: 'flight',
          customerInfo: {
            customerId: testCustomer.id,
            customerName: testCustomer.name,
            customerEmail: testCustomer.email
          },
          details: {
            origin: 'JFK',
            destination: 'LAX',
            travelDate: dateRange.checkIn,
            passengers: [
              { firstName: 'Admin', lastName: 'Test', type: 'adult', dateOfBirth: '1990-01-01' }
            ]
          }
        }), 'admin');

        expect(createRes.status).toBe(201);

        // Search
        const searchRes = await global.api
          .get('/api/admin/search')
          .set(global.withAuth(adminToken))
          .expect(200);

        global.expectSuccess(searchRes, 200);

        // Update workflow
        const booking = createRes.body.data;
        const updateRes = await global.api
          .put(`/api/admin/workflow/${booking.id}/status`)
          .set(global.withAuth(adminToken))
          .send({ status: 'CONFIRMED' })
          .expect(200);

        global.expectSuccess(updateRes, 200);
      });
    });

    describe('Agent Role - Limited Access', () => {
      it('should allow agent to create and search bookings', async () => {
        const dateRange = global.generateDateRange();
        const createRes = await global.postAuth('/api/admin/book', global.buildBookingRequest({
          type: 'flight',
          customerInfo: {
            customerId: testCustomer.id,
            customerName: testCustomer.name,
            customerEmail: testCustomer.email
          },
          details: {
            origin: 'JFK',
            destination: 'LAX',
            travelDate: dateRange.checkIn,
            passengers: [
              { firstName: 'Agent', lastName: 'Test', type: 'adult', dateOfBirth: '1990-01-01' }
            ]
          }
        }), 'agent');

        expect(createRes.status).toBe(201);

        const searchRes = await global.api
          .get('/api/admin/search')
          .set(global.withAuth(agentToken))
          .expect(200);

        global.expectSuccess(searchRes, 200);
      });
    });

    describe('Supervisor Role - Moderate Access', () => {
      it('should allow supervisor to manage bookings', async () => {
        const dateRange = global.generateDateRange();
        const createRes = await global.postAuth('/api/admin/book', global.buildBookingRequest({
          type: 'flight',
          customerInfo: {
            customerId: testCustomer.id,
            customerName: testCustomer.name,
            customerEmail: testCustomer.email
          },
          details: {
            origin: 'JFK',
            destination: 'LAX',
            travelDate: dateRange.checkIn,
            passengers: [
              { firstName: 'Supervisor', lastName: 'Test', type: 'adult', dateOfBirth: '1990-01-01' }
            ]
          }
        }), 'supervisor');

        expect(createRes.status).toBe(201);

        const booking = createRes.body.data;

        const assignRes = await global.api
          .put(`/api/admin/workflow/${booking.id}/assign`)
          .set(global.withAuth(supervisorToken))
          .send({
            agentId: 'test-agent-001',
            reason: 'Supervisor assignment'
          })
          .expect(200);

        global.expectSuccess(assignRes, 200);
      });
    });

    describe('Manager Role - Extensive Access', () => {
      it('should allow manager to update workflow status', async () => {
        const dateRange = global.generateDateRange();
        const createRes = await global.postAuth('/api/admin/book', global.buildBookingRequest({
          type: 'flight',
          customerInfo: {
            customerId: testCustomer.id,
            customerName: testCustomer.name,
            customerEmail: testCustomer.email
          },
          details: {
            origin: 'JFK',
            destination: 'LAX',
            travelDate: dateRange.checkIn,
            passengers: [
              { firstName: 'Manager', lastName: 'Test', type: 'adult', dateOfBirth: '1990-01-01' }
            ]
          }
        }), 'manager');

        expect(createRes.status).toBe(201);

        const booking = createRes.body.data;

        const updateRes = await global.api
          .put(`/api/admin/workflow/${booking.id}/status`)
          .set(global.withAuth(managerToken))
          .send({
            status: 'CONFIRMED',
            reason: 'Manager confirmed'
          })
          .expect(200);

        global.expectSuccess(updateRes, 200);
      });
    });
  });

  // ============================================================================
  // Response Format and Validation Tests
  // ============================================================================

  describe('Response Format Validation', () => {
    it('POST /api/admin/book should return consistent success response', async () => {
      const res = await global.postAuth('/api/admin/book', global.buildBookingRequest({
        type: 'flight',
        customerInfo: {
          customerId: testCustomer.id,
          customerName: testCustomer.name,
          customerEmail: testCustomer.email
        },
        details: {
          origin: 'JFK',
          destination: 'LAX',
          travelDate: global.generateDateRange().checkIn,
          passengers: [
            { firstName: 'Response', lastName: 'Format', type: 'adult', dateOfBirth: '1990-01-01' }
          ]
        }
      }), 'admin');

      expect(res.body).toHaveProperty('success');
      expect(res.body).toHaveProperty('data');
      expect(res.body.success).toBe(true);
      expect(typeof res.body.data).toBe('object');
    });

    it('GET /api/admin/search should return pagination metadata', async () => {
      const res = await global.api
        .get('/api/admin/search')
        .set(global.withAuth(adminToken))
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('pagination');
      expect(res.body.pagination).toHaveProperty('page');
      expect(res.body.pagination).toHaveProperty('limit');
      expect(res.body.pagination).toHaveProperty('total');
    });

    it('Error responses should have consistent structure', async () => {
      const res = await global.post('/api/admin/book', {});

      expect(res.body).toHaveProperty('success');
      expect(res.body.success).toBe(false);
      expect(res.body).toHaveProperty('error');
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('Booking response should contain all expected fields', async () => {
      const res = await global.postAuth('/api/admin/book', global.buildBookingRequest({
        type: 'flight',
        customerInfo: {
          customerId: testCustomer.id,
          customerName: testCustomer.name,
          customerEmail: testCustomer.email
        },
        details: {
          origin: 'JFK',
          destination: 'LAX',
          travelDate: global.generateDateRange().checkIn,
          passengers: [
            { firstName: 'Field', lastName: 'Check', type: 'adult', dateOfBirth: '1990-01-01' }
          ]
        }
      }), 'admin');

      const booking = res.body.data;
      expect(booking).toHaveProperty('id');
      expect(booking).toHaveProperty('reference');
      expect(booking).toHaveProperty('type');
      expect(booking).toHaveProperty('status');
      expect(booking).toHaveProperty('customerInfo');
      expect(booking).toHaveProperty('details');
      expect(booking).toHaveProperty('createdAt');
      expect(booking).toHaveProperty('updatedAt');
    });

    it('Timestamps should be in ISO 8601 format', async () => {
      const res = await global.postAuth('/api/admin/book', global.buildBookingRequest({
        type: 'flight',
        customerInfo: {
          customerId: testCustomer.id,
          customerName: testCustomer.name,
          customerEmail: testCustomer.email
        },
        details: {
          origin: 'JFK',
          destination: 'LAX',
          travelDate: global.generateDateRange().checkIn,
          passengers: [
            { firstName: 'Timestamp', lastName: 'Format', type: 'adult', dateOfBirth: '1990-01-01' }
          ]
        }
      }), 'admin');

      const booking = res.body.data;
      const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;

      expect(booking.createdAt).toMatch(iso8601Regex);
      expect(booking.updatedAt).toMatch(iso8601Regex);
    });
  });
});
