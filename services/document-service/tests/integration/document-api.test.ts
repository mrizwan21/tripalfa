/**
 * Document Service Integration Tests
 * Comprehensive test suite for all endpoints
 */

import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { createApp } from '../src/index';
import { Express } from 'express';

describe('Document Service API', () => {
  let app: Express;
  let prisma: PrismaClient;
  let authToken: string;
  let adminToken: string;
  let testDocumentId: string;
  let testTemplateId: string;

  // Mock user tokens
  const createMockToken = (userId: string, isAdmin: boolean = false) => {
    const payload = JSON.stringify({ userId, isAdmin });
    return Buffer.from(payload).toString('base64');
  };

  beforeAll(async () => {
    app = await createApp();
    prisma = new PrismaClient();

    // Create tokens
    authToken = createMockToken('user-123', false);
    adminToken = createMockToken('admin-123', true);

    // Seed default template
    const template = await prisma.documentTemplate.findFirst();
    if (template) {
      testTemplateId = template.id;
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // ===== HEALTH CHECK TESTS =====

  describe('GET /health', () => {
    it('should return healthy status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('healthy');
      expect(response.body.service).toBe('document-service');
    });
  });

  // ===== DOCUMENT GENERATION TESTS =====

  describe('POST /documents/generate', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .post('/documents/generate')
        .send({ type: 'BOOKING_CONFIRMATION' });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Unauthorized');
    });

    it('should validate document type', async () => {
      const response = await request(app)
        .post('/documents/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('required');
    });

    it('should generate booking confirmation document', async () => {
      const mockContext = {
        booking: {
          id: 'booking-123',
          reference: 'BK-001',
          status: 'confirmed',
          startDate: '2026-02-15',
          endDate: '2026-02-20',
          destination: 'Paris',
          totalCost: 2500,
          paxCount: 2,
          passengers: [{ name: 'John Doe', email: 'john@example.com', phone: '+1234567890' }],
        },
        user: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1234567890',
        },
        company: {
          name: 'TripAlfa',
          address: '123 Travel St, NY',
          phone: '+1-800-TRIPS',
          email: 'support@tripalfa.com',
        },
      };

      const response = await request(app)
        .post('/documents/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'BOOKING_CONFIRMATION',
          context: mockContext,
          format: 'BOTH',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.document).toBeDefined();
      expect(response.body.document.type).toBe('BOOKING_CONFIRMATION');
      expect(response.body.document.status).toBe('GENERATED');

      testDocumentId = response.body.document.id;
    });

    it('should generate invoice document', async () => {
      const mockContext = {
        invoice: {
          id: 'inv-123',
          invoiceNumber: 'INV-001',
          date: '2026-02-10',
          dueDate: '2026-03-10',
          items: [
            { description: 'Round trip flight', quantity: 1, unitPrice: 500, total: 500 },
            { description: 'Hotel 5 nights', quantity: 5, unitPrice: 150, total: 750 },
          ],
          subtotal: 1250,
          tax: 125,
          total: 1375,
          paymentMethod: 'Credit Card',
        },
        user: { name: 'John Doe', email: 'john@example.com' },
        company: { name: 'TripAlfa', address: '123 Travel St', phone: '+1-800-TRIPS', email: 'support@tripalfa.com' },
      };

      const response = await request(app)
        .post('/documents/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'INVOICE',
          context: mockContext,
        });

      expect(response.status).toBe(201);
      expect(response.body.document.type).toBe('INVOICE');
    });
  });

  // ===== DOCUMENT RETRIEVAL TESTS =====

  describe('GET /documents/:id', () => {
    it('should require authentication', async () => {
      const response = await request(app).get(`/documents/${testDocumentId}`);

      expect(response.status).toBe(401);
    });

    it('should return document by ID', async () => {
      const response = await request(app)
        .get(`/documents/${testDocumentId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.document.id).toBe(testDocumentId);
    });

    it('should prevent unauthorized access', async () => {
      const otherUserToken = createMockToken('other-user-456', false);

      const response = await request(app)
        .get(`/documents/${testDocumentId}`)
        .set('Authorization', `Bearer ${otherUserToken}`);

      expect(response.status).toBe(403);
    });
  });

  // ===== DOCUMENT LISTING TESTS =====

  describe('GET /documents', () => {
    it('should require authentication', async () => {
      const response = await request(app).get('/documents');

      expect(response.status).toBe(401);
    });

    it('should list user documents with pagination', async () => {
      const response = await request(app)
        .get('/documents?page=1&pageSize=10')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.items).toBeDefined();
      expect(Array.isArray(response.body.items)).toBe(true);
      expect(response.body.page).toBe(1);
      expect(response.body.pageSize).toBe(10);
    });

    it('should filter documents by type', async () => {
      const response = await request(app)
        .get('/documents?type=BOOKING_CONFIRMATION')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      response.body.items.forEach((doc: any) => {
        expect(doc.type).toBe('BOOKING_CONFIRMATION');
      });
    });
  });

  // ===== DOCUMENT SEARCH TESTS =====

  describe('GET /documents/search', () => {
    it('should require search query', async () => {
      const response = await request(app)
        .get('/documents/search')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
    });

    it('should search documents', async () => {
      const response = await request(app)
        .get('/documents/search?q=booking')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.documents)).toBe(true);
    });
  });

  // ===== DOCUMENT DELETION TESTS =====

  describe('DELETE /documents/:id', () => {
    it('should require authentication', async () => {
      const response = await request(app).delete(`/documents/${testDocumentId}`);

      expect(response.status).toBe(401);
    });

    it('should delete user document', async () => {
      const response = await request(app)
        .delete(`/documents/${testDocumentId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  // ===== TEMPLATE TESTS =====

  describe('GET /templates', () => {
    it('should list templates', async () => {
      const response = await request(app).get('/templates');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.templates)).toBe(true);
      expect(response.body.count).toBeGreaterThan(0);
    });

    it('should filter templates by type', async () => {
      const response = await request(app).get('/templates?type=BOOKING_CONFIRMATION');

      expect(response.status).toBe(200);
      response.body.templates.forEach((template: any) => {
        expect(template.type).toBe('BOOKING_CONFIRMATION');
      });
    });
  });

  describe('POST /templates/validate', () => {
    it('should validate template syntax', async () => {
      const response = await request(app)
        .post('/templates/validate')
        .send({
          content: '<h1>{{booking.reference}}</h1>',
        });

      expect(response.status).toBe(200);
      expect(response.body.valid).toBe(true);
    });

    it('should detect invalid template syntax', async () => {
      const response = await request(app)
        .post('/templates/validate')
        .send({
          content: '<h1>{{booking.reference</h1>', // Missing closing braces
        });

      expect(response.status).toBe(200);
      expect(response.body.valid).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('POST /templates/preview', () => {
    it('should preview template rendering', async () => {
      const mockContext = {
        booking: { reference: 'BK-001' },
      };

      const response = await request(app)
        .post('/templates/preview')
        .send({
          templateId: testTemplateId,
          context: mockContext,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.html).toBeDefined();
      expect(response.body.length).toBeGreaterThan(0);
    });
  });

  describe('POST /templates (admin only)', () => {
    it('should require admin role', async () => {
      const response = await request(app)
        .post('/templates')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Custom Template',
          type: 'BOOKING_CONFIRMATION',
          content: '<h1>Custom Template</h1>',
          format: 'HTML',
        });

      expect(response.status).toBe(403);
    });

    it('should create template as admin', async () => {
      const response = await request(app)
        .post('/templates')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Invoice Template',
          type: 'INVOICE',
          content: '<h1>{{invoice.invoiceNumber}}</h1>',
          format: 'HTML',
          description: 'Test template',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.template.name).toBe('Test Invoice Template');
    });
  });

  // ===== STATISTICS TESTS =====

  describe('GET /documents/stats/summary', () => {
    it('should return document statistics', async () => {
      const response = await request(app)
        .get('/documents/stats/summary')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.stats).toBeDefined();
      expect(response.body.stats.total).toBeDefined();
      expect(response.body.stats.byType).toBeDefined();
      expect(response.body.stats.byStatus).toBeDefined();
    });
  });

  // ===== ERROR CASES =====

  describe('Error Handling', () => {
    it('should return 404 for non-existent route', async () => {
      const response = await request(app).get('/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Not Found');
    });

    it('should return 415 for invalid content type', async () => {
      const response = await request(app)
        .post('/documents/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'text/plain')
        .send('invalid');

      expect(response.status).toBe(415);
    });
  });
});
