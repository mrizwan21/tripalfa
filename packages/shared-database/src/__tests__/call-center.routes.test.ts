/**
 * Call Center Routes Integration Tests
 *
 * Integration tests for the Call Center API endpoints.
 * Mocks the Prisma client and auth middleware to test route logic in isolation.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';

// Use hoisted to create mocks before vi.mock is called
const { mockPrismaClient: prismaMock } = vi.hoisted(() => ({
  mockPrismaClient: {
    callCenterAgent: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    callQueue: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    call: {
      findMany: vi.fn(),
      count: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    callInteraction: {
      findMany: vi.fn(),
      count: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    callQueueAssignment: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
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
import callCenterRoutes from '../routes/call-center.routes';

const mockPrismaClient = prismaMock;

describe('Call Center Routes', () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use('/api/call-center', callCenterRoutes);
  });

  // ─── AGENTS ──────────────────────────────────────────────────
  describe('GET /api/call-center/agents', () => {
    it('should return list of agents', async () => {
      const agents = [
        {
          id: 'a1',
          username: 'agent1',
          name: 'Agent One',
          email: 'agent1@example.com',
          role: 'AGENT',
          status: 'ONLINE',
          isActive: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'a2',
          username: 'agent2',
          name: 'Agent Two',
          email: 'agent2@example.com',
          role: 'SUPERVISOR',
          status: 'OFFLINE',
          isActive: true,
          createdAt: new Date().toISOString(),
        },
      ];

      mockPrismaClient.callCenterAgent.findMany.mockResolvedValue(agents);
      mockPrismaClient.callCenterAgent.count.mockResolvedValue(2);

      const res = await request(app)
        .get('/api/call-center/agents')
        .set('Authorization', 'Bearer test-token');

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual(agents);
      expect(res.body.meta).toMatchObject({
        page: 1,
        pageSize: 50,
        totalItems: 2,
        totalPages: 1,
      });
    });
  });

  describe('POST /api/call-center/agents', () => {
    it('should create an agent', async () => {
      const payload = {
        tenantId: 't1',
        username: 'newagent',
        email: 'new@example.com',
        name: 'New Agent',
        password: 'securepass123',
        role: 'AGENT',
      };
      const createdAgent = {
        id: 'a3',
        ...payload,
        passwordHash: 'hashedpass',
        status: 'OFFLINE',
        skills: [],
        languages: [],
        maxConcurrentCalls: 1,
        isActive: true,
        createdAt: new Date().toISOString(),
      };

      mockPrismaClient.callCenterAgent.create.mockResolvedValue(createdAgent);

      const res = await request(app)
        .post('/api/call-center/agents')
        .set('Authorization', 'Bearer test-token')
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.data).toEqual(createdAgent);
      expect(mockPrismaClient.callCenterAgent.create).toHaveBeenCalled();
    });

    it('should return 400 when required fields are missing', async () => {
      const res = await request(app)
        .post('/api/call-center/agents')
        .set('Authorization', 'Bearer test-token')
        .send({ username: 'incomplete' });

      expect(res.status).toBe(400);
    });
  });

  // ─── QUEUES ──────────────────────────────────────────────────
  describe('GET /api/call-center/queues', () => {
    it('should return list of queues', async () => {
      const queues = [
        {
          id: 'q1',
          name: 'General Support',
          code: 'GEN',
          status: 'ACTIVE',
          priority: 0,
          slaTimeout: 300,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'q2',
          name: 'VIP Support',
          code: 'VIP',
          status: 'ACTIVE',
          priority: 1,
          slaTimeout: 180,
          createdAt: new Date().toISOString(),
        },
      ];

      mockPrismaClient.callQueue.findMany.mockResolvedValue(queues);
      mockPrismaClient.callQueue.count.mockResolvedValue(2);

      const res = await request(app)
        .get('/api/call-center/queues')
        .set('Authorization', 'Bearer test-token');

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual(queues);
      expect(res.body.meta).toMatchObject({
        page: 1,
        pageSize: 50,
        totalItems: 2,
        totalPages: 1,
      });
    });
  });

  // ─── CALLS ───────────────────────────────────────────────────
  describe('GET /api/call-center/calls', () => {
    it('should return list of calls', async () => {
      const calls = [
        {
          id: 'c1',
          callId: 'CALL001',
          direction: 'INBOUND',
          status: 'WAITING',
          callerNumber: '+1234567890',
          duration: 0,
          waitTime: 0,
          talkTime: 0,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'c2',
          callId: 'CALL002',
          direction: 'OUTBOUND',
          status: 'COMPLETED',
          callerNumber: '+0987654321',
          duration: 120,
          waitTime: 5,
          talkTime: 115,
          createdAt: new Date().toISOString(),
        },
      ];

      mockPrismaClient.call.findMany.mockResolvedValue(calls);
      mockPrismaClient.call.count.mockResolvedValue(2);

      const res = await request(app)
        .get('/api/call-center/calls')
        .set('Authorization', 'Bearer test-token');

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual(calls);
      expect(res.body.meta).toMatchObject({
        page: 1,
        pageSize: 50,
        totalItems: 2,
        totalPages: 1,
      });
    });
  });

  // ─── INTERACTIONS ────────────────────────────────────────────
  describe('GET /api/call-center/calls/:callId/interactions', () => {
    it('should return call interactions', async () => {
      const interactions = [
        {
          id: 'i1',
          callId: 'c1',
          type: 'NOTE',
          content: 'Customer requested callback',
          agentName: 'Agent One',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'i2',
          callId: 'c1',
          type: 'EMAIL',
          content: 'Sent confirmation email',
          agentName: 'Agent Two',
          createdAt: new Date().toISOString(),
        },
      ];

      mockPrismaClient.callInteraction.findMany.mockResolvedValue(interactions);

      const res = await request(app)
        .get('/api/call-center/calls/c1/interactions')
        .set('Authorization', 'Bearer test-token');

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual(interactions);
      expect(mockPrismaClient.callInteraction.findMany).toHaveBeenCalledWith({
        where: { callId: 'c1' },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return empty array when no interactions exist', async () => {
      mockPrismaClient.callInteraction.findMany.mockResolvedValue([]);

      const res = await request(app)
        .get('/api/call-center/calls/c99/interactions')
        .set('Authorization', 'Bearer test-token');

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });
  });

  // ─── CALL QUEUE ASSIGNMENTS ──────────────────────────────────
  describe('GET /api/call-center/call-queue-assignments', () => {
    it('should return list of assignments', async () => {
      const assignments = [
        {
          id: 'ca1',
          agentId: 'a1',
          queueId: 'q1',
          priority: 0,
          isActive: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'ca2',
          agentId: 'a2',
          queueId: 'q2',
          priority: 1,
          isActive: true,
          createdAt: new Date().toISOString(),
        },
      ];

      mockPrismaClient.callQueueAssignment.findMany.mockResolvedValue(assignments);

      const res = await request(app)
        .get('/api/call-center/call-queue-assignments')
        .set('Authorization', 'Bearer test-token');

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual(assignments);
      expect(mockPrismaClient.callQueueAssignment.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should filter assignments by agentId', async () => {
      const assignments = [
        {
          id: 'ca1',
          agentId: 'a1',
          queueId: 'q1',
          priority: 0,
          isActive: true,
          createdAt: new Date().toISOString(),
        },
      ];

      mockPrismaClient.callQueueAssignment.findMany.mockResolvedValue(assignments);

      const res = await request(app)
        .get('/api/call-center/call-queue-assignments?agentId=a1')
        .set('Authorization', 'Bearer test-token');

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual(assignments);
      expect(mockPrismaClient.callQueueAssignment.findMany).toHaveBeenCalledWith({
        where: { agentId: 'a1' },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should filter assignments by queueId', async () => {
      const assignments = [
        {
          id: 'ca1',
          agentId: 'a1',
          queueId: 'q1',
          priority: 0,
          isActive: true,
          createdAt: new Date().toISOString(),
        },
      ];

      mockPrismaClient.callQueueAssignment.findMany.mockResolvedValue(assignments);

      const res = await request(app)
        .get('/api/call-center/call-queue-assignments?queueId=q1')
        .set('Authorization', 'Bearer test-token');

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual(assignments);
      expect(mockPrismaClient.callQueueAssignment.findMany).toHaveBeenCalledWith({
        where: { queueId: 'q1' },
        orderBy: { createdAt: 'desc' },
      });
    });
  });
});
