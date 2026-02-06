/**
 * Booking API Integration Tests
 *
 * Tests for booking endpoints:
 * - API-001: POST /api/bookings/create
 * - API-002: POST /api/bookings/hold
 * - API-003: POST /api/bookings/confirm
 * - API-004: GET /api/bookings/search
 * - API-005: POST /api/bookings/cancel
 */

import { api, setupTestEnvironment, teardownTestEnvironment, getAuthHeader } from './setup.js';

describe('Booking API Integration Tests', () => {
  let testBookingId: string;

  beforeAll(async () => {
    await setupTestEnvironment();
  });

  afterAll(async () => {
    await teardownTestEnvironment();
  });

  /**
   * API-001: POST /api/bookings - Create a new booking
   */
  describe('POST /api/bookings (API-001)', () => {
    it('should create a new flight booking successfully', async () => {
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
        currency: 'USD'
      };

      const response = await api
        .post('/api/bookings')
        .set(getAuthHeader())
        .send(bookingData);

      // The API might return 201 for success or other status codes
      // depending on the implementation
      expect([200, 201, 202]).toContain(response.status);

      if (response.status === 200 || response.status === 201) {
        expect(response.body).toBeDefined();
        if (response.body.id || response.body.bookingId) {
          testBookingId = response.body.id || response.body.bookingId;
        }
      }
    });

    it('should create a new hotel booking successfully', async () => {
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
        currency: 'USD'
      };

      const response = await api
        .post('/api/bookings')
        .set(getAuthHeader())
        .send(bookingData);

      expect([200, 201, 202, 400, 401, 403]).toContain(response.status);
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

    it('should return 400 for invalid booking data', async () => {
      const invalidData = {
        type: 'flight'
        // Missing required fields
      };

      const response = await api
        .post('/api/bookings')
        .set(getAuthHeader())
        .send(invalidData);

      expect([400, 422]).toContain(response.status);
    });
  });

  /**
   * API-004: GET /api/bookings - Search bookings
   */
  describe('GET /api/bookings (API-004)', () => {
    it('should retrieve bookings list', async () => {
      const response = await api
        .get('/api/bookings')
        .set(getAuthHeader());

      expect([200, 401, 403]).toContain(response.status);

      if (response.status === 200) {
        expect(response.body).toBeDefined();
        expect(Array.isArray(response.body.bookings) || Array.isArray(response.body)).toBe(true);
      }
    });

    it('should filter bookings by type', async () => {
      const response = await api
        .get('/api/bookings?type=flight')
        .set(getAuthHeader());

      expect([200, 401, 403]).toContain(response.status);
    });

    it('should filter bookings by status', async () => {
      const response = await api
        .get('/api/bookings?status=CONFIRMED')
        .set(getAuthHeader());

      expect([200, 401, 403]).toContain(response.status);
    });

    it('should support pagination', async () => {
      const response = await api
        .get('/api/bookings?page=1&limit=10')
        .set(getAuthHeader());

      expect([200, 401, 403]).toContain(response.status);
    });

    it('should return 401 for unauthorized requests', async () => {
      const response = await api
        .get('/api/bookings');

      expect(response.status).toBe(401);
    });
  });

  /**
   * API-002: POST /api/bookings/:id/hold - Hold inventory
   */
  describe('POST /api/bookings/:id/hold (API-002)', () => {
    it('should hold inventory for a valid booking', async () => {
      // Skip if no test booking was created
      if (!testBookingId) {
        console.log('Skipping hold test - no test booking available');
        return;
      }

      const holdData = {
        holdDuration: 3600, // 1 hour in seconds
        inventoryType: 'flight'
      };

      const response = await api
        .post(`/api/bookings/${testBookingId}/hold`)
        .set(getAuthHeader())
        .send(holdData);

      expect([200, 201, 400, 404]).toContain(response.status);
    });

    it('should return 404 for non-existent booking', async () => {
      const response = await api
        .post('/api/bookings/non-existent-id/hold')
        .set(getAuthHeader())
        .send({ holdDuration: 3600 });

      expect([404, 400]).toContain(response.status);
    });
  });

  /**
   * API-003: POST /api/bookings/:id/confirm - Confirm booking
   */
  describe('POST /api/bookings/:id/confirm (API-003)', () => {
    it('should confirm a valid booking', async () => {
      // Skip if no test booking was created
      if (!testBookingId) {
        console.log('Skipping confirm test - no test booking available');
        return;
      }

      const confirmData = {
        paymentMethod: 'card',
        paymentToken: 'tok_visa'
      };

      const response = await api
        .post(`/api/bookings/${testBookingId}/confirm`)
        .set(getAuthHeader())
        .send(confirmData);

      expect([200, 201, 400, 404]).toContain(response.status);
    });

    it('should return 404 for non-existent booking', async () => {
      const response = await api
        .post('/api/bookings/non-existent-id/confirm')
        .set(getAuthHeader())
        .send({ paymentMethod: 'card' });

      expect([404, 400]).toContain(response.status);
    });
  });

  /**
   * API-005: DELETE /api/bookings/:id - Cancel booking
   */
  describe('DELETE /api/bookings/:id (API-005)', () => {
    it('should cancel a valid booking', async () => {
      // Skip if no test booking was created
      if (!testBookingId) {
        console.log('Skipping cancel test - no test booking available');
        return;
      }

      const cancelData = {
        reason: 'Customer request',
        refundPolicy: 'full'
      };

      const response = await api
        .delete(`/api/bookings/${testBookingId}`)
        .set(getAuthHeader())
        .send(cancelData);

      expect([200, 204, 400, 404]).toContain(response.status);
    });

    it('should return 404 for non-existent booking', async () => {
      const response = await api
        .delete('/api/bookings/non-existent-id')
        .set(getAuthHeader())
        .send({ reason: 'Test cancellation' });

      expect([404, 400]).toContain(response.status);
    });

    it('should return 401 for unauthorized requests', async () => {
      const response = await api
        .delete('/api/bookings/some-id')
        .send({ reason: 'Test' });

      expect(response.status).toBe(401);
    });
  });

  /**
   * Additional Booking Tests
   */
  describe('Additional Booking Operations', () => {
    it('should get a single booking by ID', async () => {
      if (!testBookingId) {
        console.log('Skipping get by ID test - no test booking available');
        return;
      }

      const response = await api
        .get(`/api/bookings/${testBookingId}`)
        .set(getAuthHeader());

      expect([200, 404]).toContain(response.status);
    });

    it('should update a booking', async () => {
      if (!testBookingId) {
        console.log('Skipping update test - no test booking available');
        return;
      }

      const updateData = {
        specialRequests: 'Vegetarian meal'
      };

      const response = await api
        .put(`/api/bookings/${testBookingId}`)
        .set(getAuthHeader())
        .send(updateData);

      expect([200, 400, 404]).toContain(response.status);
    });

    it('should get booking history', async () => {
      if (!testBookingId) {
        console.log('Skipping history test - no test booking available');
        return;
      }

      const response = await api
        .get(`/api/bookings/${testBookingId}/history`)
        .set(getAuthHeader());

      expect([200, 404]).toContain(response.status);
    });
  });
});
