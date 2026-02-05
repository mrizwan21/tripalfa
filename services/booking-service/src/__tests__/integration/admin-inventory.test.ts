import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';

/**
 * Admin Inventory Management API Integration Tests
 * 
 * Tests all inventory CRUD endpoints:
 * - GET /api/admin/inventory (List/search with pagination)
 * - POST /api/admin/inventory (Create inventory)
 * - PUT /api/admin/inventory/:inventoryId (Update inventory)
 * - DELETE /api/admin/inventory/:inventoryId (Delete inventory)
 * 
 * Coverage:
 * - Happy paths: Successful CRUD operations
 * - Error paths: Auth failures, validation errors, not found
 * - Edge cases: Boundary values, availability checks, filters
 * - Authorization: Role-based access control
 */

describe('Admin Inventory Management API', () => {
  let adminToken: string;
  let managerToken: string;
  let supervisorToken: string;
  let agentToken: string;
  let testSupplier: any;

  beforeEach(async () => {
    adminToken = global.createAdminToken();
    managerToken = global.createManagerToken();
    supervisorToken = global.createSupervisorToken();
    agentToken = global.createAgentToken();
    testSupplier = await global.makeSupplier();
  });

  // ============================================================================
  // GET /api/admin/inventory - List/Search Tests
  // ============================================================================

  describe('GET /api/admin/inventory - List/Search', () => {
    describe('Happy Paths', () => {
      it('should list all inventory with default pagination', async () => {
        await global.makeInventory({ supplierId: testSupplier.id });
        await global.makeInventory({ supplierId: testSupplier.id });

        const res = await global.api
          .get('/api/admin/inventory')
          .set('Authorization', `Bearer ${adminToken}`);

        global.expectSuccess(res, 200);
        expect(res.body.data).toHaveProperty('inventory');
        expect(res.body.data).toHaveProperty('pagination');
        expect(Array.isArray(res.body.data.inventory)).toBe(true);
        expect(res.body.data.pagination.page).toBe(1);
        expect(res.body.data.pagination.limit).toBe(10);
      });

      it('should list with custom pagination', async () => {
        await global.makeInventory({ supplierId: testSupplier.id });
        await global.makeInventory({ supplierId: testSupplier.id });

        const res = await global.api
          .get('/api/admin/inventory')
          .query({ page: 1, limit: 5 })
          .set('Authorization', `Bearer ${adminToken}`);

        global.expectSuccess(res, 200);
        expect(res.body.data.pagination.page).toBe(1);
        expect(res.body.data.pagination.limit).toBe(5);
      });

      it('should filter by supplier ID', async () => {
        const otherSupplier = await global.makeSupplier();
        await global.makeInventory({ supplierId: testSupplier.id, name: 'Supplier A Item' });
        await global.makeInventory({ supplierId: otherSupplier.id, name: 'Supplier B Item' });

        const res = await global.api
          .get('/api/admin/inventory')
          .query({ supplierId: testSupplier.id })
          .set('Authorization', `Bearer ${adminToken}`);

        global.expectSuccess(res, 200);
        res.body.data.inventory.forEach((item: any) => {
          expect(item.supplierId).toBe(testSupplier.id);
        });
      });

      it('should filter by status', async () => {
        await global.makeInventory({ supplierId: testSupplier.id, status: 'active' });
        await global.makeInventory({ supplierId: testSupplier.id, status: 'inactive' });

        const res = await global.api
          .get('/api/admin/inventory')
          .query({ status: ['active'] })
          .set('Authorization', `Bearer ${adminToken}`);

        global.expectSuccess(res, 200);
        res.body.data.inventory.forEach((item: any) => {
          expect(item.status).toBe('active');
        });
      });

      it('should filter by price range', async () => {
        await global.makeInventory({ supplierId: testSupplier.id, price: 100 });
        await global.makeInventory({ supplierId: testSupplier.id, price: 200 });
        await global.makeInventory({ supplierId: testSupplier.id, price: 300 });

        const res = await global.api
          .get('/api/admin/inventory')
          .query({ minPrice: 150, maxPrice: 250 })
          .set('Authorization', `Bearer ${adminToken}`);

        global.expectSuccess(res, 200);
        res.body.data.inventory.forEach((item: any) => {
          expect(item.price).toBeGreaterThanOrEqual(150);
          expect(item.price).toBeLessThanOrEqual(250);
        });
      });

      it('should filter by minimum available quantity', async () => {
        await global.makeInventory({ supplierId: testSupplier.id, available: 10 });
        await global.makeInventory({ supplierId: testSupplier.id, available: 50 });
        await global.makeInventory({ supplierId: testSupplier.id, available: 100 });

        const res = await global.api
          .get('/api/admin/inventory')
          .query({ minAvailable: 60 })
          .set('Authorization', `Bearer ${adminToken}`);

        global.expectSuccess(res, 200);
        res.body.data.inventory.forEach((item: any) => {
          expect(item.available).toBeGreaterThanOrEqual(60);
        });
      });

      it('should filter by service types', async () => {
        await global.makeInventory({ supplierId: testSupplier.id, serviceTypes: ['flight'] });
        await global.makeInventory({ supplierId: testSupplier.id, serviceTypes: ['hotel'] });

        const res = await global.api
          .get('/api/admin/inventory')
          .query({ serviceTypes: ['flight'] })
          .set('Authorization', `Bearer ${adminToken}`);

        global.expectSuccess(res, 200);
        res.body.data.inventory.forEach((item: any) => {
          expect(item.serviceTypes).toContain('flight');
        });
      });

      it('should search by name', async () => {
        await global.makeInventory({ supplierId: testSupplier.id, name: 'Business Class Flight' });
        await global.makeInventory({ supplierId: testSupplier.id, name: 'Economy Hotel' });

        const res = await global.api
          .get('/api/admin/inventory')
          .query({ search: 'Business' })
          .set('Authorization', `Bearer ${adminToken}`);

        global.expectSuccess(res, 200);
        res.body.data.inventory.forEach((item: any) => {
          expect(item.name.toLowerCase()).toContain('business');
        });
      });

      it('should return empty results when no matches', async () => {
        const res = await global.api
          .get('/api/admin/inventory')
          .query({ productCode: 'NONEXISTENT' })
          .set('Authorization', `Bearer ${adminToken}`);

        global.expectSuccess(res, 200);
        expect(res.body.data.inventory).toEqual([]);
      });

      it('should include pagination metadata', async () => {
        await global.makeInventory({ supplierId: testSupplier.id });

        const res = await global.api
          .get('/api/admin/inventory')
          .set('Authorization', `Bearer ${adminToken}`);

        global.expectSuccess(res, 200);
        const { pagination } = res.body.data;
        expect(pagination).toHaveProperty('page');
        expect(pagination).toHaveProperty('limit');
        expect(pagination).toHaveProperty('total');
        expect(pagination).toHaveProperty('pages');
      });
    });

    describe('Error Paths', () => {
      it('should return 401 without auth token', async () => {
        const res = await global.api.get('/api/admin/inventory');
        global.expectError(res, 401);
      });

      it('should return 400 with invalid pagination (page=0)', async () => {
        const res = await global.api
          .get('/api/admin/inventory')
          .query({ page: 0 })
          .set('Authorization', `Bearer ${adminToken}`);

        global.expectError(res, 400);
      });

      it('should return 400 with invalid pagination (limit=101)', async () => {
        const res = await global.api
          .get('/api/admin/inventory')
          .query({ limit: 101 })
          .set('Authorization', `Bearer ${adminToken}`);

        global.expectError(res, 400);
      });

      it('should return 400 when minPrice > maxPrice', async () => {
        const res = await global.api
          .get('/api/admin/inventory')
          .query({ minPrice: 300, maxPrice: 100 })
          .set('Authorization', `Bearer ${adminToken}`);

        global.expectError(res, 400);
      });
    });

    describe('Edge Cases', () => {
      it('should handle boundary pagination (limit=1)', async () => {
        await global.makeInventory({ supplierId: testSupplier.id });

        const res = await global.api
          .get('/api/admin/inventory')
          .query({ limit: 1 })
          .set('Authorization', `Bearer ${adminToken}`);

        global.expectSuccess(res, 200);
        expect(res.body.data.inventory.length).toBeLessThanOrEqual(1);
      });

      it('should handle page boundary (requesting beyond total)', async () => {
        const res = await global.api
          .get('/api/admin/inventory')
          .query({ page: 999 })
          .set('Authorization', `Bearer ${adminToken}`);

        global.expectSuccess(res, 200);
        expect(res.body.data.inventory).toEqual([]);
      });
    });
  });

  // ============================================================================
  // POST /api/admin/inventory - Create Tests
  // ============================================================================

  describe('POST /api/admin/inventory - Create', () => {
    describe('Happy Paths', () => {
      it('should create inventory with all required fields', async () => {
        const payload = global.buildInventoryRequest({
          supplierId: testSupplier.id
        });

        const res = await global.api
          .post('/api/admin/inventory')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(payload);

        global.expectSuccess(res, 201);
        global.expectInventoryResponse(res);
        expect(res.body.data.supplierId).toBe(testSupplier.id);
        expect(res.body.data.quantity).toBe(payload.quantity);
        expect(res.body.data.available).toBe(payload.quantity);
      });

      it('should create with optional fields', async () => {
        const payload = global.buildInventoryRequest({
          supplierId: testSupplier.id,
          description: 'Premium flight inventory',
          minimumPrice: 100
        });

        const res = await global.api
          .post('/api/admin/inventory')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(payload);

        global.expectSuccess(res, 201);
        expect(res.body.data.description).toBe('Premium flight inventory');
        expect(res.body.data.minimumPrice).toBe(100);
      });

      it('should create with multiple service types', async () => {
        const payload = global.buildInventoryRequest({
          supplierId: testSupplier.id,
          serviceTypes: ['flight', 'hotel', 'transfer']
        });

        const res = await global.api
          .post('/api/admin/inventory')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(payload);

        global.expectSuccess(res, 201);
        expect(res.body.data.serviceTypes).toContain('flight');
        expect(res.body.data.serviceTypes).toContain('hotel');
        expect(res.body.data.serviceTypes).toContain('transfer');
      });

      it('should set default status to active', async () => {
        const payload = global.buildInventoryRequest({
          supplierId: testSupplier.id
        });

        const res = await global.api
          .post('/api/admin/inventory')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(payload);

        global.expectSuccess(res, 201);
        expect(res.body.data.status).toBe('active');
      });

      it('should set reserved to 0 by default', async () => {
        const payload = global.buildInventoryRequest({
          supplierId: testSupplier.id
        });

        const res = await global.api
          .post('/api/admin/inventory')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(payload);

        global.expectSuccess(res, 201);
        expect(res.body.data.reserved).toBe(0);
      });
    });

    describe('Error Paths', () => {
      it('should return 401 without auth token', async () => {
        const payload = global.buildInventoryRequest({ supplierId: testSupplier.id });
        const res = await global.api.post('/api/admin/inventory').send(payload);
        global.expectError(res, 401);
      });

      it('should return 403 for supervisor role', async () => {
        const payload = global.buildInventoryRequest({ supplierId: testSupplier.id });
        const res = await global.api
          .post('/api/admin/inventory')
          .set('Authorization', `Bearer ${supervisorToken}`)
          .send(payload);
        expect(res.status).toBe(403);
      });

      it('should return 403 for agent role', async () => {
        const payload = global.buildInventoryRequest({ supplierId: testSupplier.id });
        const res = await global.api
          .post('/api/admin/inventory')
          .set('Authorization', `Bearer ${agentToken}`)
          .send(payload);
        expect(res.status).toBe(403);
      });

      it('should return 400 when missing supplierId', async () => {
        const payload = global.buildInventoryRequest({});
        delete payload.supplierId;

        const res = await global.api
          .post('/api/admin/inventory')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(payload);

        global.expectError(res, 400);
      });

      it('should return 400 when missing productCode', async () => {
        const payload = global.buildInventoryRequest({ supplierId: testSupplier.id });
        delete payload.productCode;

        const res = await global.api
          .post('/api/admin/inventory')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(payload);

        global.expectError(res, 400);
      });

      it('should return 400 when missing name', async () => {
        const payload = global.buildInventoryRequest({ supplierId: testSupplier.id });
        delete payload.name;

        const res = await global.api
          .post('/api/admin/inventory')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(payload);

        global.expectError(res, 400);
      });

      it('should return 400 with negative quantity', async () => {
        const payload = global.buildInventoryRequest({
          supplierId: testSupplier.id,
          quantity: -5
        });

        const res = await global.api
          .post('/api/admin/inventory')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(payload);

        global.expectError(res, 400);
      });

      it('should return 400 with negative price', async () => {
        const payload = global.buildInventoryRequest({
          supplierId: testSupplier.id,
          price: -50
        });

        const res = await global.api
          .post('/api/admin/inventory')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(payload);

        global.expectError(res, 400);
      });

      it('should return 400 with invalid currency', async () => {
        const payload = global.buildInventoryRequest({
          supplierId: testSupplier.id,
          currency: 'INVALID'
        });

        const res = await global.api
          .post('/api/admin/inventory')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(payload);

        global.expectError(res, 400);
      });

      it('should return 409 for duplicate productCode', async () => {
        const inventory = await global.makeInventory({ supplierId: testSupplier.id });

        const payload = global.buildInventoryRequest({
          supplierId: testSupplier.id,
          productCode: inventory.productCode
        });

        const res = await global.api
          .post('/api/admin/inventory')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(payload);

        expect(res.status).toBe(409);
      });

      it('should return 404 for non-existent supplierId', async () => {
        const payload = global.buildInventoryRequest({
          supplierId: 'nonexistent-supplier-id'
        });

        const res = await global.api
          .post('/api/admin/inventory')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(payload);

        expect(res.status).toBe(404);
      });
    });

    describe('Edge Cases', () => {
      it('should allow quantity=0', async () => {
        const payload = global.buildInventoryRequest({
          supplierId: testSupplier.id,
          quantity: 0
        });

        const res = await global.api
          .post('/api/admin/inventory')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(payload);

        global.expectSuccess(res, 201);
        expect(res.body.data.quantity).toBe(0);
        expect(res.body.data.available).toBe(0);
      });

      it('should allow very large quantity', async () => {
        const payload = global.buildInventoryRequest({
          supplierId: testSupplier.id,
          quantity: 999999
        });

        const res = await global.api
          .post('/api/admin/inventory')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(payload);

        global.expectSuccess(res, 201);
        expect(res.body.data.quantity).toBe(999999);
      });

      it('should allow empty serviceTypes array', async () => {
        const payload = global.buildInventoryRequest({
          supplierId: testSupplier.id,
          serviceTypes: []
        });

        const res = await global.api
          .post('/api/admin/inventory')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(payload);

        global.expectSuccess(res, 201);
        expect(res.body.data.serviceTypes).toEqual([]);
      });
    });
  });

  // ============================================================================
  // PUT /api/admin/inventory/:inventoryId - Update Tests
  // ============================================================================

  describe('PUT /api/admin/inventory/:inventoryId - Update', () => {
    describe('Happy Paths', () => {
      it('should update name', async () => {
        const inventory = await global.makeInventory({ supplierId: testSupplier.id });

        const res = await global.api
          .put(`/api/admin/inventory/${inventory.id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ name: 'Updated Product Name' });

        global.expectSuccess(res, 200);
        expect(res.body.data.name).toBe('Updated Product Name');
      });

      it('should update price', async () => {
        const inventory = await global.makeInventory({ supplierId: testSupplier.id });

        const res = await global.api
          .put(`/api/admin/inventory/${inventory.id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ price: 200 });

        global.expectSuccess(res, 200);
        expect(res.body.data.price).toBe(200);
      });

      it('should update status', async () => {
        const inventory = await global.makeInventory({ supplierId: testSupplier.id, status: 'active' });

        const res = await global.api
          .put(`/api/admin/inventory/${inventory.id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ status: 'inactive' });

        global.expectSuccess(res, 200);
        expect(res.body.data.status).toBe('inactive');
      });

      it('should update quantity and available', async () => {
        const inventory = await global.makeInventory({ supplierId: testSupplier.id, quantity: 50 });

        const res = await global.api
          .put(`/api/admin/inventory/${inventory.id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ quantity: 100, available: 80 });

        global.expectSuccess(res, 200);
        expect(res.body.data.quantity).toBe(100);
        expect(res.body.data.available).toBe(80);
      });

      it('should update serviceTypes', async () => {
        const inventory = await global.makeInventory({ supplierId: testSupplier.id });

        const res = await global.api
          .put(`/api/admin/inventory/${inventory.id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ serviceTypes: ['hotel', 'transfer'] });

        global.expectSuccess(res, 200);
        expect(res.body.data.serviceTypes).toContain('hotel');
        expect(res.body.data.serviceTypes).toContain('transfer');
      });

      it('should allow partial updates', async () => {
        const inventory = await global.makeInventory({ supplierId: testSupplier.id });
        const originalPrice = inventory.price;

        const res = await global.api
          .put(`/api/admin/inventory/${inventory.id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ name: 'Only Name Changed' });

        global.expectSuccess(res, 200);
        expect(res.body.data.name).toBe('Only Name Changed');
        expect(res.body.data.price).toBe(originalPrice);
      });

      it('should update lastUpdated timestamp', async () => {
        const inventory = await global.makeInventory({ supplierId: testSupplier.id });
        const originalTime = new Date(inventory.lastUpdated);

        // Wait a bit to ensure timestamp changes
        await new Promise(resolve => setTimeout(resolve, 100));

        const res = await global.api
          .put(`/api/admin/inventory/${inventory.id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ name: 'Updated' });

        global.expectSuccess(res, 200);
        const newTime = new Date(res.body.data.lastUpdated);
        expect(newTime.getTime()).toBeGreaterThan(originalTime.getTime());
      });
    });

    describe('Error Paths', () => {
      it('should return 401 without auth token', async () => {
        const inventory = await global.makeInventory({ supplierId: testSupplier.id });

        const res = await global.api
          .put(`/api/admin/inventory/${inventory.id}`)
          .send({ name: 'Updated' });

        global.expectError(res, 401);
      });

      it('should return 403 for supervisor role', async () => {
        const inventory = await global.makeInventory({ supplierId: testSupplier.id });

        const res = await global.api
          .put(`/api/admin/inventory/${inventory.id}`)
          .set('Authorization', `Bearer ${supervisorToken}`)
          .send({ name: 'Updated' });

        expect(res.status).toBe(403);
      });

      it('should return 404 for non-existent inventory', async () => {
        const res = await global.api
          .put('/api/admin/inventory/nonexistent-id')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ name: 'Updated' });

        expect(res.status).toBe(404);
      });

      it('should return 400 with negative quantity', async () => {
        const inventory = await global.makeInventory({ supplierId: testSupplier.id });

        const res = await global.api
          .put(`/api/admin/inventory/${inventory.id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ quantity: -10 });

        global.expectError(res, 400);
      });

      it('should return 400 when available > quantity', async () => {
        const inventory = await global.makeInventory({ supplierId: testSupplier.id, quantity: 100 });

        const res = await global.api
          .put(`/api/admin/inventory/${inventory.id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ quantity: 50, available: 100 });

        global.expectError(res, 400);
      });

      it('should return 400 with invalid status', async () => {
        const inventory = await global.makeInventory({ supplierId: testSupplier.id });

        const res = await global.api
          .put(`/api/admin/inventory/${inventory.id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ status: 'invalid_status' });

        global.expectError(res, 400);
      });
    });

    describe('Edge Cases', () => {
      it('should allow update with no changes', async () => {
        const inventory = await global.makeInventory({ supplierId: testSupplier.id });

        const res = await global.api
          .put(`/api/admin/inventory/${inventory.id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({});

        global.expectSuccess(res, 200);
      });

      it('should allow setting quantity to 0', async () => {
        const inventory = await global.makeInventory({ supplierId: testSupplier.id });

        const res = await global.api
          .put(`/api/admin/inventory/${inventory.id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ quantity: 0, available: 0, reserved: 0 });

        global.expectSuccess(res, 200);
        expect(res.body.data.quantity).toBe(0);
      });
    });
  });

  // ============================================================================
  // DELETE /api/admin/inventory/:inventoryId - Delete Tests
  // ============================================================================

  describe('DELETE /api/admin/inventory/:inventoryId - Delete', () => {
    describe('Happy Paths', () => {
      it('should delete existing inventory', async () => {
        const inventory = await global.makeInventory({ supplierId: testSupplier.id });

        const res = await global.api
          .delete(`/api/admin/inventory/${inventory.id}`)
          .set('Authorization', `Bearer ${adminToken}`);

        global.expectSuccess(res, 200);
        expect(res.body.data).toHaveProperty('message');
      });

      it('should return 200 on successful delete', async () => {
        const inventory = await global.makeInventory({ supplierId: testSupplier.id });

        const res = await global.api
          .delete(`/api/admin/inventory/${inventory.id}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
      });
    });

    describe('Error Paths', () => {
      it('should return 401 without auth token', async () => {
        const inventory = await global.makeInventory({ supplierId: testSupplier.id });

        const res = await global.api.delete(`/api/admin/inventory/${inventory.id}`);

        global.expectError(res, 401);
      });

      it('should return 403 for supervisor role', async () => {
        const inventory = await global.makeInventory({ supplierId: testSupplier.id });

        const res = await global.api
          .delete(`/api/admin/inventory/${inventory.id}`)
          .set('Authorization', `Bearer ${supervisorToken}`);

        expect(res.status).toBe(403);
      });

      it('should return 404 for non-existent inventory', async () => {
        const res = await global.api
          .delete('/api/admin/inventory/nonexistent-id')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(404);
      });

      it('should return 404 when deleting already deleted item', async () => {
        const inventory = await global.makeInventory({ supplierId: testSupplier.id });

        // Delete once
        await global.api
          .delete(`/api/admin/inventory/${inventory.id}`)
          .set('Authorization', `Bearer ${adminToken}`);

        // Try to delete again
        const res = await global.api
          .delete(`/api/admin/inventory/${inventory.id}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(404);
      });
    });

    describe('Edge Cases', () => {
      it('should allow deleting inventory with quantity=0', async () => {
        const inventory = await global.makeInventory({
          supplierId: testSupplier.id,
          quantity: 0,
          available: 0
        });

        const res = await global.api
          .delete(`/api/admin/inventory/${inventory.id}`)
          .set('Authorization', `Bearer ${adminToken}`);

        global.expectSuccess(res, 200);
      });
    });
  });

  // ============================================================================
  // POST /api/admin/inventory/:inventoryId/check-availability - Check Availability
  // ============================================================================

  describe('POST /api/admin/inventory/:inventoryId/check-availability', () => {
    describe('Happy Paths', () => {
      it('should check availability successfully', async () => {
        const inventory = await global.makeInventory({
          supplierId: testSupplier.id,
          available: 100
        });

        const res = await global.api
          .post(`/api/admin/inventory/${inventory.id}/check-availability`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ quantity: 50 });

        global.expectSuccess(res, 200);
        expect(res.body.data).toHaveProperty('isAvailable', true);
        expect(res.body.data).toHaveProperty('canReserve', true);
      });

      it('should indicate unavailable when quantity exceeds available', async () => {
        const inventory = await global.makeInventory({
          supplierId: testSupplier.id,
          available: 50
        });

        const res = await global.api
          .post(`/api/admin/inventory/${inventory.id}/check-availability`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ quantity: 100 });

        global.expectSuccess(res, 200);
        expect(res.body.data.isAvailable).toBe(false);
      });

      it('should include inventory details in response', async () => {
        const inventory = await global.makeInventory({
          supplierId: testSupplier.id,
          available: 100
        });

        const res = await global.api
          .post(`/api/admin/inventory/${inventory.id}/check-availability`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ quantity: 50 });

        global.expectSuccess(res, 200);
        expect(res.body.data).toHaveProperty('productCode');
        expect(res.body.data).toHaveProperty('name');
        expect(res.body.data).toHaveProperty('availableQuantity');
        expect(res.body.data).toHaveProperty('price');
      });

      it('should allow agent to check availability', async () => {
        const inventory = await global.makeInventory({
          supplierId: testSupplier.id,
          available: 100
        });

        const res = await global.api
          .post(`/api/admin/inventory/${inventory.id}/check-availability`)
          .set('Authorization', `Bearer ${agentToken}`)
          .send({ quantity: 50 });

        global.expectSuccess(res, 200);
      });
    });

    describe('Error Paths', () => {
      it('should return 401 without auth token', async () => {
        const inventory = await global.makeInventory({ supplierId: testSupplier.id });

        const res = await global.api
          .post(`/api/admin/inventory/${inventory.id}/check-availability`)
          .send({ quantity: 50 });

        global.expectError(res, 401);
      });

      it('should return 404 for non-existent inventory', async () => {
        const res = await global.api
          .post('/api/admin/inventory/nonexistent-id/check-availability')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ quantity: 50 });

        expect(res.status).toBe(404);
      });

      it('should return 400 with invalid quantity', async () => {
        const inventory = await global.makeInventory({ supplierId: testSupplier.id });

        const res = await global.api
          .post(`/api/admin/inventory/${inventory.id}/check-availability`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ quantity: -5 });

        global.expectError(res, 400);
      });

      it('should return 400 with missing quantity', async () => {
        const inventory = await global.makeInventory({ supplierId: testSupplier.id });

        const res = await global.api
          .post(`/api/admin/inventory/${inventory.id}/check-availability`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({});

        global.expectError(res, 400);
      });
    });

    describe('Edge Cases', () => {
      it('should handle exact quantity match', async () => {
        const inventory = await global.makeInventory({
          supplierId: testSupplier.id,
          available: 100
        });

        const res = await global.api
          .post(`/api/admin/inventory/${inventory.id}/check-availability`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ quantity: 100 });

        global.expectSuccess(res, 200);
        expect(res.body.data.isAvailable).toBe(true);
      });

      it('should handle quantity=1', async () => {
        const inventory = await global.makeInventory({
          supplierId: testSupplier.id,
          available: 1
        });

        const res = await global.api
          .post(`/api/admin/inventory/${inventory.id}/check-availability`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ quantity: 1 });

        global.expectSuccess(res, 200);
        expect(res.body.data.isAvailable).toBe(true);
      });

      it('should indicate unavailable when inventory status is inactive', async () => {
        const inventory = await global.makeInventory({
          supplierId: testSupplier.id,
          available: 100,
          status: 'inactive'
        });

        const res = await global.api
          .post(`/api/admin/inventory/${inventory.id}/check-availability`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ quantity: 50 });

        global.expectSuccess(res, 200);
        expect(res.body.data.canReserve).toBe(false);
      });
    });
  });

  // ============================================================================
  // Authorization & Permissions Tests
  // ============================================================================

  describe('Authorization & Permissions', () => {
    it('admin should have full access', async () => {
      const inventory = await global.makeInventory({ supplierId: testSupplier.id });

      const getRes = await global.api
        .get('/api/admin/inventory')
        .set('Authorization', `Bearer ${adminToken}`);
      global.expectSuccess(getRes, 200);

      const createRes = await global.api
        .post('/api/admin/inventory')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(global.buildInventoryRequest({ supplierId: testSupplier.id }));
      global.expectSuccess(createRes, 201);

      const updateRes = await global.api
        .put(`/api/admin/inventory/${inventory.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated' });
      global.expectSuccess(updateRes, 200);

      const deleteRes = await global.api
        .delete(`/api/admin/inventory/${inventory.id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      global.expectSuccess(deleteRes, 200);
    });

    it('manager should have full access', async () => {
      const inventory = await global.makeInventory({ supplierId: testSupplier.id });

      const getRes = await global.api
        .get('/api/admin/inventory')
        .set('Authorization', `Bearer ${managerToken}`);
      global.expectSuccess(getRes, 200);

      const createRes = await global.api
        .post('/api/admin/inventory')
        .set('Authorization', `Bearer ${managerToken}`)
        .send(global.buildInventoryRequest({ supplierId: testSupplier.id }));
      global.expectSuccess(createRes, 201);
    });

    it('supervisor should have read-only access', async () => {
      const getRes = await global.api
        .get('/api/admin/inventory')
        .set('Authorization', `Bearer ${supervisorToken}`);
      global.expectSuccess(getRes, 200);

      const createRes = await global.api
        .post('/api/admin/inventory')
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send(global.buildInventoryRequest({ supplierId: testSupplier.id }));
      expect(createRes.status).toBe(403);
    });

    it('agent should have read-only access', async () => {
      const getRes = await global.api
        .get('/api/admin/inventory')
        .set('Authorization', `Bearer ${agentToken}`);
      global.expectSuccess(getRes, 200);

      const createRes = await global.api
        .post('/api/admin/inventory')
        .set('Authorization', `Bearer ${agentToken}`)
        .send(global.buildInventoryRequest({ supplierId: testSupplier.id }));
      expect(createRes.status).toBe(403);
    });
  });

  // ============================================================================
  // Response Format Validation
  // ============================================================================

  describe('Response Format Validation', () => {
    it('success response should have consistent format', async () => {
      const res = await global.api
        .get('/api/admin/inventory')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');
    });

    it('list response should have pagination metadata', async () => {
      const res = await global.api
        .get('/api/admin/inventory')
        .set('Authorization', `Bearer ${adminToken}`);

      global.expectSuccess(res, 200);
      const { pagination } = res.body.data;
      expect(pagination).toHaveProperty('page');
      expect(pagination).toHaveProperty('limit');
      expect(pagination).toHaveProperty('total');
      expect(pagination).toHaveProperty('pages');
    });

    it('error response should have consistent format', async () => {
      const res = await global.api.get('/api/admin/inventory');

      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('error');
    });

    it('inventory objects should have required fields', async () => {
      const inventory = await global.makeInventory({ supplierId: testSupplier.id });

      const res = await global.api
        .get(`/api/admin/inventory`)
        .set('Authorization', `Bearer ${adminToken}`);

      global.expectSuccess(res, 200);
      if (res.body.data.inventory.length > 0) {
        const item = res.body.data.inventory[0];
        expect(item).toHaveProperty('id');
        expect(item).toHaveProperty('supplierId');
        expect(item).toHaveProperty('productCode');
        expect(item).toHaveProperty('name');
        expect(item).toHaveProperty('quantity');
        expect(item).toHaveProperty('available');
        expect(item).toHaveProperty('price');
        expect(item).toHaveProperty('status');
      }
    });

    it('timestamps should be ISO 8601 format', async () => {
      const inventory = await global.makeInventory({ supplierId: testSupplier.id });

      const res = await global.api
        .get(`/api/admin/inventory`)
        .set('Authorization', `Bearer ${adminToken}`);

      global.expectSuccess(res, 200);
      if (res.body.data.inventory.length > 0) {
        const item = res.body.data.inventory[0];
        const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
        expect(item.createdAt).toMatch(iso8601Regex);
        expect(item.lastUpdated).toMatch(iso8601Regex);
      }
    });
  });
});
