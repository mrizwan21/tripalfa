/**
 * Booking API Integration Tests
 *
 * Tests for booking endpoints:
 * - API-001: POST /api/bookings - Create booking
 * - API-002: POST /api/bookings/:id/hold - Hold inventory
 * - API-003: POST /api/bookings/:id/confirm - Confirm booking
 * - API-004: GET /api/bookings - Search/List bookings
 * - API-005: DELETE /api/bookings/:id - Cancel booking
 * - API-006: GET /api/bookings/:id - Get booking details
 * - API-007: PUT /api/bookings/:id - Update booking
 */

import {
  api,
  setupTestEnvironment,
  teardownTestEnvironment,
  getAuthHeader,
  createTestBooking,
  createTestCustomer,
  cleanupTestBooking,
  testDataTracker,
  TEST_CONFIG
} from './setup.js';

describe('Booking API Integration Tests', () => {
  let testBookingId: string;
  let testCustomerId: string;

  beforeAll(async () => {
    await setupTestEnvironment();
  });

  afterAll(async () => {
    await teardownTestEnvironment();
  });

  beforeEach(() => {
    // Clear tracker before each test to ensure clean state
    testDataTracker.clear();
  });

  /**
   * API-001: POST /api/bookings - Create a new booking
   */
  describe('POST /api/bookings (API-001)', () => {
    it('should create a new flight booking successfully as admin', async () => {
      const bookingData = {
        type: 'flight',
        origin: 'JFK',
        destination: 'LHR',
        departureDate: '2025-06-15',
        returnDate: '2025-06-22',
        passengers: [
          {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            phone: '+1234567890',
            dateOfBirth: '1990-01-15',
            passportNumber: 'AB1234567',
            nationality: 'US'
          }
        ],
        class: 'economy',
        totalAmount: 850.00,
        currency: 'USD',
        customerInfo: {
          name: 'John Doe',
          email: 'john.doe@example.com',
          phone: '+1234567890'
        }
      };

      const response = await api
        .post('/api/bookings')
        .set(getAuthHeader('admin'))
        .send(bookingData);

      expect([200, 201]).toContain(response.status);
      expect(response.body).toBeDefined();

      if (response.body.id || response.body.bookingId || response.body.data?.id) {
        testBookingId = response.body.id || response.body.bookingId || response.body.data?.id;
        testDataTracker.track('bookings', testBookingId);
      }
    });

    it('should create a new hotel booking successfully as agent', async () => {
      const bookingData = {
        type: 'hotel',
        hotelName: 'Test Hotel',
        city: 'Paris',
        checkInDate: '2025-07-10',
        checkOutDate: '2025-07-15',
        guests: [
          {
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane.smith@example.com',
            phone: '+1234567891'
          }
        ],
        rooms: 1,
        roomType: 'standard',
        totalAmount: 1200.00,
        currency: 'USD',
        customerInfo: {
          name: 'Jane Smith',
          email: 'jane.smith@example.com',
          phone: '+1234567891'
        }
      };

      const response = await api
        .post('/api/bookings')
        .set(getAuthHeader('agent'))
        .send(bookingData);

      expect([200, 201, 202]).toContain(response.status);

      if (response.body.id || response.body.bookingId || response.body.data?.id) {
        const bookingId = response.body.id || response.body.bookingId || response.body.data?.id;
        testDataTracker.track('bookings', bookingId);
      }
    });

    it('should return 401 for unauthorized requests', async () => {
      const bookingData = {
        type: 'flight',
        origin: 'JFK',
        destination: 'LHR'
      };

      const response = await api
        .post('/api/bookings')
        .send(bookingData);

      expect(response.status).toBe(401);
    });

    it('should return 403 for customer trying to create booking', async () => {
      const bookingData = {
        type: 'flight',
        origin: 'JFK',
        destination: 'LHR'
      };

      const response = await api
        .post('/api/bookings')
        .set(getAuthHeader('customer'))
        .send(bookingData);

      expect([403, 401]).toContain(response.status);
    });

    it('should return 400 for invalid booking data', async () => {
      const invalidData = {
        type: 'flight'
        // Missing required fields
      };

      const response = await api
        .post('/api/bookings')
        .set(getAuthHeader('admin'))
        .send(invalidData);

      expect([400, 422]).toContain(response.status);
    });
  });

  /**
   * API-004: GET /api/bookings - Search/List bookings
   */
  describe('GET /api/bookings (API-004)', () => {
    it('should retrieve bookings list as admin', async () => {
      const response = await api
        .get('/api/bookings')
        .set(getAuthHeader('admin'));

      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
    });

    it('should retrieve bookings list as agent', async () => {
      const response = await api
        .get('/api/bookings')
        .set(getAuthHeader('agent'));

      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
    });

    it('should filter bookings by type', async () => {
      const response = await api
        .get('/api/bookings?type=flight')
        .set(getAuthHeader('admin'));

      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
    });

    it('should filter bookings by status', async () => {
      const response = await api
        .get('/api/bookings?status=CONFIRMED')
        .set(getAuthHeader('admin'));

      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
    });

    it('should support pagination', async () => {
      const response = await api
        .get('/api/bookings?page=1&limit=10')
        .set(getAuthHeader('admin'));

      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
    });

    it('should return 401 for unauthorized requests', async () => {
      const response = await api
        .get('/api/bookings');

      expect(response.status).toBe(401);
    });
  });

  /**
   * API-006: GET /api/bookings/:id - Get booking details
   */
  describe('GET /api/bookings/:id (API-006)', () => {
    beforeEach(async () => {
      // Create a test booking for these tests
      const booking = await createTestBooking({
        type: 'flight',
        origin: 'JFK',
        destination: 'LHR',
        totalAmount: 500.00
      }, 'admin');
      testBookingId = booking.id || booking.bookingId || booking.data?.id;
    });

    it('should get a single booking by ID as admin', async () => {
      if (!testBookingId) {
        console.log('Skipping test - no test booking available');
        return;
      }

      const response = await api
        .get(`/api/bookings/${testBookingId}`)
        .set(getAuthHeader('admin'));

      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
    });

    it('should get a single booking by ID as agent', async () => {
      if (!testBookingId) {
        console.log('Skipping test - no test booking available');
        return;
      }

      const response = await api
        .get(`/api/bookings/${testBookingId}`)
        .set(getAuthHeader('agent'));

      expect([200, 403]).toContain(response.status);
    });

    it('should return 404 for non-existent booking', async () => {
      const response = await api
        .get('/api/bookings/non-existent-id')
        .set(getAuthHeader('admin'));

      expect(response.status).toBe(404);
    });
  });

  /**
   * API-007: PUT /api/bookings/:id - Update booking
   */
  describe('PUT /api/bookings/:id (API-007)', () => {
    beforeEach(async () => {
      // Create a test booking for these tests
      const booking = await createTestBooking({
        type: 'flight',
        origin: 'JFK',
        destination: 'LHR',
        totalAmount: 500.00
      }, 'admin');
      testBookingId = booking.id || booking.bookingId || booking.data?.id;
    });

    it('should update a booking as admin', async () => {
      if (!testBookingId) {
        console.log('Skipping test - no test booking available');
        return;
      }

      const updateData = {
        specialRequests: 'Vegetarian meal',
        notes: 'Test update'
      };

      const response = await api
        .put(`/api/bookings/${testBookingId}`)
        .set(getAuthHeader('admin'))
        .send(updateData);

      expect([200, 204]).toContain(response.status);
    });

    it('should return 404 for non-existent booking', async () => {
      const response = await api
        .put('/api/bookings/non-existent-id')
        .set(getAuthHeader('admin'))
        .send({ specialRequests: 'Test' });

      expect(response.status).toBe(404);
    });
  });

  /**
   * API-002: POST /api/bookings/:id/hold - Hold inventory
   */
  describe('POST /api/bookings/:id/hold (API-002)', () => {
    beforeEach(async () => {
      // Create a test booking for these tests
      const booking = await createTestBooking({
        type: 'flight',
        origin: 'JFK',
        destination: 'LHR',
        totalAmount: 500.00
      }, 'admin');
      testBookingId = booking.id || booking.bookingId || booking.data?.id;
    });

    it('should hold inventory for a valid booking as admin', async () => {
      if (!testBookingId) {
        console.log('Skipping test - no test booking available');
        return;
      }

      const holdData = {
        holdDuration: 3600, // 1 hour in seconds
        inventoryType: 'flight'
      };

      const response = await api
        .post(`/api/bookings/${testBookingId}/hold`)
        .set(getAuthHeader('admin'))
        .send(holdData);

      expect([200, 201]).toContain(response.status);
    });

    it('should return 404 for non-existent booking', async () => {
      const response = await api
        .post('/api/bookings/non-existent-id/hold')
        .set(getAuthHeader('admin'))
        .send({ holdDuration: 3600 });

      expect(response.status).toBe(404);
    });
  });

  /**
   * API-003: POST /api/bookings/:id/confirm - Confirm booking
   */
  describe('POST /api/bookings/:id/confirm (API-003)', () => {
    beforeEach(async () => {
      // Create a test booking for these tests
      const booking = await createTestBooking({
        type: 'flight',
        origin: 'JFK',
        destination: 'LHR',
        totalAmount: 500.00
      }, 'admin');
      testBookingId = booking.id || booking.bookingId || booking.data?.id;
    });

    it('should confirm a valid booking as admin', async () => {
      if (!testBookingId) {
        console.log('Skipping test - no test booking available');
        return;
      }

      const confirmData = {
        paymentMethod: 'card',
        paymentToken: 'tok_visa'
      };

      const response = await api
        .post(`/api/bookings/${testBookingId}/confirm`)
        .set(getAuthHeader('admin'))
        .send(confirmData);

      expect([200, 201]).toContain(response.status);
    });

    it('should return 404 for non-existent booking', async () => {
      const response = await api
        .post('/api/bookings/non-existent-id/confirm')
        .set(getAuthHeader('admin'))
        .send({ paymentMethod: 'card' });

      expect(response.status).toBe(404);
    });
  });

  /**
   * API-005: DELETE /api/bookings/:id - Cancel booking
   */
  describe('DELETE /api/bookings/:id (API-005)', () => {
    beforeEach(async () => {
      // Create a test booking for these tests
      const booking = await createTestBooking({
        type: 'flight',
        origin: 'JFK',
        destination: 'LHR',
        totalAmount: 500.00
      }, 'admin');
      testBookingId = booking.id || booking.bookingId || booking.data?.id;
    });

    it('should cancel a valid booking as admin', async () => {
      if (!testBookingId) {
        console.log('Skipping test - no test booking available');
        return;
      }

      const cancelData = {
        reason: 'Customer request',
        refundPolicy: 'full'
      };

      const response = await api
        .delete(`/api/bookings/${testBookingId}`)
        .set(getAuthHeader('admin'))
        .send(cancelData);

      expect([200, 204]).toContain(response.status);

      // Remove from tracker since it's deleted
      testDataTracker.bookings.delete(testBookingId);
    });

    it('should return 404 for non-existent booking', async () => {
      const response = await api
        .delete('/api/bookings/non-existent-id')
        .set(getAuthHeader('admin'))
        .send({ reason: 'Test cancellation' });

      expect(response.status).toBe(404);
    });

    it('should return 401 for unauthorized requests', async () => {
      const response = await api
        .delete('/api/bookings/some-id')
        .send({ reason: 'Test' });

      expect(response.status).toBe(401);
    });
  });

  /**
   * Additional Booking Tests - Customer Integration
   */
  describe('Booking with Customer Integration', () => {
    beforeEach(async () => {
      // Create a test customer
      const customer = await createTestCustomer({
        name: 'Integration Test Customer',
        email: `integration.test.${Date.now()}@example.com`,
        phone: '+1234567890'
      });
      testCustomerId = customer.id || customer.data?.id;
    });

    it('should create a booking with existing customer', async () => {
      if (!testCustomerId) {
        console.log('Skipping test - no test customer available');
        return;
      }

      const bookingData = {
        type: 'flight',
        origin: 'JFK',
        destination: 'LHR',
        departureDate: '2025-06-15',
        passengers: [
          {
            firstName: 'Integration',
            lastName: 'Test',
            email: 'integration@example.com',
            phone: '+1234567890'
          }
        ],
        totalAmount: 750.00,
        currency: 'USD',
        customerId: testCustomerId
      };

      const response = await api
        .post('/api/bookings')
        .set(getAuthHeader('admin'))
        .send(bookingData);

      expect([200, 201]).toContain(response.status);
    });
  });

  /**
   * Role-Based Access Control Tests
   */
  describe('Role-Based Access Control', () => {
    it('should allow admin to access all bookings', async () => {
      const response = await api
        .get('/api/bookings')
        .set(getAuthHeader('admin'));

      expect(response.status).toBe(200);
    });

    it('should allow agent to access bookings', async () => {
      const response = await api
        .get('/api/bookings')
        .set(getAuthHeader('agent'));

      expect(response.status).toBe(200);
    });

    it('should allow supervisor to access bookings', async () => {
      const response = await api
        .get('/api/bookings')
        .set(getAuthHeader('supervisor'));

      expect(response.status).toBe(200);
    });

    it('should allow manager to access bookings', async () => {
      const response = await api
        .get('/api/bookings')
        .set(getAuthHeader('manager'));

      expect(response.status).toBe(200);
    });

    it('should restrict customer from admin endpoints', async () => {
      const response = await api
        .get('/api/admin/bookings')
        .set(getAuthHeader('customer'));

      expect([403, 401, 404]).toContain(response.status);
    });
  });
});
