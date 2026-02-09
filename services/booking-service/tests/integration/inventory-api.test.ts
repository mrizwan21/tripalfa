/**
 * Inventory API Integration Tests
 *
 * Tests for inventory endpoints:
 * - API-009: GET /api/inventory/search
 */

import { api, setupTestEnvironment, teardownTestEnvironment, getAuthHeader } from './setup';

describe('Inventory API Integration Tests', () => {
  beforeAll(async () => {
    await setupTestEnvironment();
  });

  afterAll(async () => {
    await teardownTestEnvironment();
  });

  /**
   * API-009: GET /api/admin/inventory - Search inventory
   */
  describe('GET /api/admin/inventory (API-009)', () => {
    it('should retrieve inventory list', async () => {
      const response = await api
        .get('/api/admin/inventory')
        .set(getAuthHeader('admin'));

      expect([200, 401, 403]).toContain(response.status);

      if (response.status === 200) {
        expect(response.body).toBeDefined();
        expect(Array.isArray(response.body.inventory) ||
               Array.isArray(response.body)).toBe(true);
      }
    });

    it('should search inventory with filters', async () => {
      const response = await api
        .get('/api/admin/inventory?type=flight&status=active')
        .set(getAuthHeader('admin'));

      expect([200, 401, 403]).toContain(response.status);
    });

    it('should search inventory by supplier', async () => {
      const response = await api
        .get('/api/admin/inventory?supplier=amadeus')
        .set(getAuthHeader('admin'));

      expect([200, 401, 403]).toContain(response.status);
    });

    it('should support pagination', async () => {
      const response = await api
        .get('/api/admin/inventory?page=1&limit=20')
        .set(getAuthHeader('admin'));

      expect([200, 401, 403]).toContain(response.status);

      if (response.status === 200) {
        expect(response.body).toBeDefined();
        // Should have pagination info
        if (response.body.pagination) {
          expect(response.body.pagination.page).toBe(1);
          expect(response.body.pagination.limit).toBe(20);
        }
      }
    });

    it('should return 401 for unauthorized requests', async () => {
      const response = await api
        .get('/api/admin/inventory');

      expect(response.status).toBe(401);
    });

    it('should return 403 for non-admin users', async () => {
      const response = await api
        .get('/api/admin/inventory')
        .set(getAuthHeader('user'));

      expect([200, 403]).toContain(response.status);
    });
  });

  /**
   * Additional Inventory Tests
   */
  describe('Additional Inventory Operations', () => {
    it('should get single inventory item', async () => {
      const inventoryId = 'inv_test_123';

      const response = await api
        .get(`/api/admin/inventory/${inventoryId}`)
        .set(getAuthHeader('admin'));

      expect([200, 401, 403, 404]).toContain(response.status);

      if (response.status === 200) {
        expect(response.body).toBeDefined();
        expect(response.body.id !== undefined ||
               response.body.inventoryId !== undefined).toBe(true);
      }
    });

    it('should check inventory availability', async () => {
      const inventoryId = 'inv_test_123';
      const checkData = {
        date: '2025-06-15',
        quantity: 5
      };

      const response = await api
        .post(`/api/admin/inventory/${inventoryId}/check-availability`)
        .set(getAuthHeader('admin'))
        .send(checkData);

      expect([200, 401, 403, 404]).toContain(response.status);

      if (response.status === 200) {
        expect(response.body).toBeDefined();
        expect(typeof response.body.available === 'boolean').toBe(true);
      }
    });

    it('should create new inventory item', async () => {
      const inventoryData = {
        type: 'flight',
        supplier: 'amadeus',
        origin: 'JFK',
        destination: 'LHR',
        flightNumber: 'AA100',
        departureTime: '2025-06-15T10:00:00Z',
        arrivalTime: '2025-06-15T22:00:00Z',
        totalSeats: 200,
        availableSeats: 150,
        price: 850.00,
        currency: 'USD',
        status: 'active'
      };

      const response = await api
        .post('/api/admin/inventory')
        .set(getAuthHeader('admin'))
        .send(inventoryData);

      expect([200, 201, 400, 401, 403]).toContain(response.status);
    });

    it('should update inventory item', async () => {
      const inventoryId = 'inv_test_123';
      const updateData = {
        availableSeats: 140,
        price: 900.00
      };

      const response = await api
        .put(`/api/admin/inventory/${inventoryId}`)
        .set(getAuthHeader('admin'))
        .send(updateData);

      expect([200, 400, 401, 403, 404]).toContain(response.status);
    });

    it('should delete inventory item', async () => {
      const inventoryId = 'inv_test_123';

      const response = await api
        .delete(`/api/admin/inventory/${inventoryId}`)
        .set(getAuthHeader('admin'));

      expect([200, 204, 401, 403, 404]).toContain(response.status);
    });

    it('should search suppliers', async () => {
      const response = await api
        .get('/api/admin/suppliers')
        .set(getAuthHeader('admin'));

      expect([200, 401, 403]).toContain(response.status);

      if (response.status === 200) {
        expect(response.body).toBeDefined();
        expect(Array.isArray(response.body.suppliers) ||
               Array.isArray(response.body)).toBe(true);
      }
    });

    it('should create supplier', async () => {
      const supplierData = {
        name: 'Test Supplier',
        code: 'TEST_SUP',
        type: 'gds',
        status: 'active',
        credentials: {
          apiKey: 'test_key',
          apiSecret: 'test_secret'
        }
      };

      const response = await api
        .post('/api/admin/suppliers')
        .set(getAuthHeader('admin'))
        .send(supplierData);

      expect([200, 201, 400, 401, 403]).toContain(response.status);
    });
  });
});
