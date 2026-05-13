/**
 * B2B Routes Integration Tests
 *
 * Integration tests for the B2B API endpoints.
 * Mocks the Prisma client and auth middleware to test route logic in isolation.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';

// Use hoisted to create mocks before vi.mock is called
const { mockPrismaClient: prismaMock } = vi.hoisted(() => ({
  mockPrismaClient: {
    tenant: {
      findMany: vi.fn(),
      count: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    partner: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    agreement: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    b2BBooking: {
      findMany: vi.fn(),
      count: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

// Mock the auth middleware
vi.mock('../middleware/auth.middleware', () => ({
  authenticateToken: (_req: any, _res: any, next: any) => next(),
}));

// Mock Prisma
vi.mock('../database/prisma', () => ({
  prisma: prismaMock,
}));

// Import the route under test after mocking
import b2bRoutes from '../routes/b2b.routes';

const mockPrismaClient = prismaMock;

describe('B2B Routes', () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use('/api/b2b', b2bRoutes);
  });

  // ─── TENANTS ─────────────────────────────────────────────────
  describe('GET /api/b2b/tenants', () => {
    it('should return list with data, total, page, pageSize', async () => {
      const mockTenants = [
        { id: 't1', name: 'Tenant A', agentCode: 'A001', status: 'ACTIVE', createdAt: new Date().toISOString() },
        { id: 't2', name: 'Tenant B', agentCode: 'A002', status: 'ACTIVE', createdAt: new Date().toISOString() },
      ];

      mockPrismaClient.tenant.findMany.mockResolvedValue(mockTenants);
      mockPrismaClient.tenant.count.mockResolvedValue(2);

      const res = await request(app)
        .get('/api/b2b/tenants')
        .set('Authorization', 'Bearer test-token');

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual(mockTenants);
      expect(res.body.meta).toMatchObject({
        page: 1,
        pageSize: 50,
        totalItems: 2,
        totalPages: 1,
      });
    });
  });

  describe('POST /api/b2b/tenants', () => {
    it('should create a tenant', async () => {
      const payload = {
        name: 'New Tenant',
        agentCode: 'NEW001',
        contactEmail: 'new@example.com',
        type: 'CORPORATE',
      };
      const createdTenant = { id: 't3', ...payload, status: 'ACTIVE', createdAt: new Date().toISOString() };

      mockPrismaClient.tenant.create.mockResolvedValue(createdTenant);

      const res = await request(app)
        .post('/api/b2b/tenants')
        .set('Authorization', 'Bearer test-token')
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.data).toEqual(createdTenant);
      expect(mockPrismaClient.tenant.create).toHaveBeenCalledWith({
        data: { ...payload, status: 'ACTIVE', creditLimit: 0 },
      });
    });

    it('should return 400 when required fields are missing', async () => {
      const res = await request(app)
        .post('/api/b2b/tenants')
        .set('Authorization', 'Bearer test-token')
        .send({ name: 'Incomplete' });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/b2b/tenants/:id', () => {
    it('should return a single tenant', async () => {
      const tenant = { id: 't1', name: 'Tenant A', agentCode: 'A001', status: 'ACTIVE' };
      mockPrismaClient.tenant.findUnique.mockResolvedValue(tenant);

      const res = await request(app)
        .get('/api/b2b/tenants/t1')
        .set('Authorization', 'Bearer test-token');

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual(tenant);
    });

    it('should return 404 for non-existent tenant', async () => {
      mockPrismaClient.tenant.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .get('/api/b2b/tenants/unknown')
        .set('Authorization', 'Bearer test-token');

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/b2b/tenants/:id', () => {
    it('should update a tenant', async () => {
      const existing = { id: 't1', name: 'Old Name', status: 'ACTIVE' };
      const updated = { ...existing, name: 'Updated Name' };

      mockPrismaClient.tenant.findUnique.mockResolvedValue(existing);
      mockPrismaClient.tenant.update.mockResolvedValue(updated);

      const res = await request(app)
        .put('/api/b2b/tenants/t1')
        .set('Authorization', 'Bearer test-token')
        .send({ name: 'Updated Name' });

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual(updated);
    });

    it('should return 400 when no fields to update', async () => {
      mockPrismaClient.tenant.findUnique.mockResolvedValue({ id: 't1' });

      const res = await request(app)
        .put('/api/b2b/tenants/t1')
        .set('Authorization', 'Bearer test-token')
        .send({});

      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /api/b2b/tenants/:id', () => {
    it('should soft delete a tenant (update status to archived/inactive)', async () => {
      const tenant = { id: 't1', name: 'Tenant A', status: 'ACTIVE' };
      mockPrismaClient.tenant.findUnique.mockResolvedValue(tenant);
      mockPrismaClient.tenant.update.mockResolvedValue({ ...tenant, status: 'INACTIVE' });

      const res = await request(app)
        .delete('/api/b2b/tenants/t1')
        .set('Authorization', 'Bearer test-token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockPrismaClient.tenant.update).toHaveBeenCalledWith({
        where: { id: 't1' },
        data: { status: 'INACTIVE' },
      });
    });

    it('should return 404 for non-existent tenant on delete', async () => {
      mockPrismaClient.tenant.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .delete('/api/b2b/tenants/unknown')
        .set('Authorization', 'Bearer test-token');

      expect(res.status).toBe(404);
    });
  });

  // ─── PARTNERS ────────────────────────────────────────────────
  describe('GET /api/b2b/partners', () => {
    it('should return list of partners', async () => {
      const partners = [
        { id: 'p1', name: 'Partner A', tenantId: 't1', status: 'ACTIVE', tenant: { name: 'Tenant A' } },
      ];
      mockPrismaClient.partner.findMany.mockResolvedValue(partners);
      mockPrismaClient.partner.count.mockResolvedValue(1);

      const res = await request(app)
        .get('/api/b2b/partners')
        .set('Authorization', 'Bearer test-token');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.meta.totalItems).toBe(1);
    });
  });

  // ─── AGREEMENTS ──────────────────────────────────────────────
  describe('GET /api/b2b/agreements', () => {
    it('should return list of agreements', async () => {
      const agreements = [
        {
          id: 'a1',
          title: 'Agreement 1',
          tenantId: 't1',
          partnerId: 'p1',
          status: 'ACTIVE',
          tenant: { name: 'Tenant A' },
          partner: { name: 'Partner A' },
        },
      ];
      mockPrismaClient.agreement.findMany.mockResolvedValue(agreements);
      mockPrismaClient.agreement.count.mockResolvedValue(1);

      const res = await request(app)
        .get('/api/b2b/agreements')
        .set('Authorization', 'Bearer test-token');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.meta.totalItems).toBe(1);
    });
  });

  // ─── BOOKINGS ────────────────────────────────────────────────
  describe('GET /api/b2b/bookings', () => {
    it('should return list of b2b bookings', async () => {
      const bookings = [
        {
          id: 'b1',
          bookingRef: 'BK001',
          tenantId: 't1',
          partnerId: 'p1',
          status: 'PENDING',
          tenant: { name: 'Tenant A' },
          partner: { name: 'Partner A' },
        },
      ];
      mockPrismaClient.b2BBooking.findMany.mockResolvedValue(bookings);
      mockPrismaClient.b2BBooking.count.mockResolvedValue(1);

      const res = await request(app)
        .get('/api/b2b/bookings')
        .set('Authorization', 'Bearer test-token');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.meta.totalItems).toBe(1);
    });
  });

  describe('PATCH /api/b2b/bookings/:id/status', () => {
    it('should update booking status', async () => {
      const booking = { id: 'b1', bookingRef: 'BK001', status: 'PENDING' };
      const updated = { ...booking, status: 'CONFIRMED' };

      mockPrismaClient.b2BBooking.findUnique.mockResolvedValue(booking);
      mockPrismaClient.b2BBooking.update.mockResolvedValue(updated);

      const res = await request(app)
        .patch('/api/b2b/bookings/b1/status')
        .set('Authorization', 'Bearer test-token')
        .send({ status: 'CONFIRMED' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('CONFIRMED');
      expect(mockPrismaClient.b2BBooking.update).toHaveBeenCalledWith({
        where: { id: 'b1' },
        data: { status: 'CONFIRMED' },
      });
    });

    it('should return 400 when status is missing', async () => {
      const res = await request(app)
        .patch('/api/b2b/bookings/b1/status')
        .set('Authorization', 'Bearer test-token')
        .send({});

      expect(res.status).toBe(400);
    });

    it('should return 404 for non-existent booking', async () => {
      mockPrismaClient.b2BBooking.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .patch('/api/b2b/bookings/unknown/status')
        .set('Authorization', 'Bearer test-token')
        .send({ status: 'CONFIRMED' });

      expect(res.status).toBe(404);
    });
  });
});
