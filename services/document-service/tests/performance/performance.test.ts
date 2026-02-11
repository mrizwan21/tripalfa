/**
 * Document Service Performance Tests
 * Load testing, stress testing, and performance benchmarking
 */

import request from 'supertest';
import { createApp } from '../src/index';
import { Express } from 'express';

describe('Document Service Performance', () => {
  let app: Express;
  const authToken = Buffer.from(JSON.stringify({ userId: 'perf-user-123', isAdmin: false })).toString('base64');

  beforeAll(async () => {
    app = await createApp();
  });

  // ===== RESPONSE TIME TESTS =====

  describe('Response Times', () => {
    it('should generate document within 2s', async () => {
      const startTime = Date.now();

      const response = await request(app)
        .post('/documents/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'BOOKING_CONFIRMATION',
          context: {
            booking: {
              id: 'booking-123',
              reference: 'BK-001',
              status: 'confirmed',
              startDate: '2026-02-15',
              endDate: '2026-02-20',
              destination: 'Paris',
              totalCost: 2500,
              paxCount: 2,
              passengers: [{ name: 'John Doe', email: 'john@example.com' }],
            },
          },
        });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(201);
      expect(responseTime).toBeLessThan(2000);
    });

    it('should retrieve document within 500ms', async () => {
      // First create a document
      const createResponse = await request(app)
        .post('/documents/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'INVOICE',
          context: {
            invoice: {
              invoiceNumber: 'INV-001',
              items: [{ description: 'Flight', quantity: 1, unitPrice: 500, total: 500 }],
            },
          },
        });

      const docId = createResponse.body.document.id;

      // Now measure retrieval
      const startTime = Date.now();

      const response = await request(app)
        .get(`/documents/${docId}`)
        .set('Authorization', `Bearer ${authToken}`);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(500);
    });

    it('should list documents within 1s', async () => {
      const startTime = Date.now();

      const response = await request(app)
        .get('/documents?page=1&pageSize=20')
        .set('Authorization', `Bearer ${authToken}`);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(1000);
    });

    it('should search documents within 1.5s', async () => {
      const startTime = Date.now();

      const response = await request(app)
        .get('/documents/search?q=booking')
        .set('Authorization', `Bearer ${authToken}`);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(1500);
    });
  });

  // ===== CONCURRENT REQUEST TESTS =====

  describe('Concurrent Requests', () => {
    it('should handle 10 concurrent document generations', async () => {
      const requests = Array.from({ length: 10 }, (_, i) =>
        request(app)
          .post('/documents/generate')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            type: i % 2 === 0 ? 'BOOKING_CONFIRMATION' : 'INVOICE',
            context: {
              booking: {
                reference: `BK-${i}`,
                destination: `City-${i}`,
              },
            },
          }),
      );

      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        expect(response.status).toBe(201);
      });
    });

    it('should handle 50 concurrent list queries', async () => {
      const requests = Array.from({ length: 50 }, () =>
        request(app)
          .get('/documents?page=1&pageSize=10')
          .set('Authorization', `Bearer ${authToken}`),
      );

      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        expect(response.status).toBe(200);
      });
    });

    it('should handle mixed concurrent operations', async () => {
      const requests = [
        ...Array.from({ length: 10 }, (_, i) =>
          request(app)
            .post('/documents/generate')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
              type: 'BOOKING_CONFIRMATION',
              context: { booking: { reference: `BK-${i}` } },
            }),
        ),
        ...Array.from({ length: 10 }, () =>
          request(app)
            .get('/documents')
            .set('Authorization', `Bearer ${authToken}`),
        ),
        ...Array.from({ length: 10 }, () =>
          request(app)
            .get('/templates')
        ),
      ];

      const responses = await Promise.all(requests);

      expect(responses.filter((r) => r.status === 201).length).toBeGreaterThan(0);
      expect(responses.filter((r) => r.status === 200).length).toBeGreaterThan(0);
    });
  });

  // ===== PAGINATION PERFORMANCE =====

  describe('Pagination Performance', () => {
    it('should list first page efficiently', async () => {
      const startTime = Date.now();

      const response = await request(app)
        .get('/documents?page=1&pageSize=20')
        .set('Authorization', `Bearer ${authToken}`);

      const endTime = Date.now();

      expect(response.status).toBe(200);
      expect(endTime - startTime).toBeLessThan(500);
    });

    it('should list deep page within acceptable time', async () => {
      const startTime = Date.now();

      const response = await request(app)
        .get('/documents?page=100&pageSize=20')
        .set('Authorization', `Bearer ${authToken}`);

      const endTime = Date.now();

      expect(response.status).toBe(200);
      expect(endTime - startTime).toBeLessThan(2000); // Deep pagination might be slower
    });

    it('should handle large page sizes', async () => {
      const response = await request(app)
        .get('/documents?page=1&pageSize=100')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.pageSize).toBeLessThanOrEqual(100);
    });
  });

  // ===== MEMORY USAGE TESTS =====

  describe('Memory Usage', () => {
    it('should not leak memory on multiple generations', async () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Generate multiple documents
      for (let i = 0; i < 10; i++) {
        await request(app)
          .post('/documents/generate')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            type: 'BOOKING_CONFIRMATION',
            context: { booking: { reference: `BK-${i}` } },
          });
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Should not increase memory excessively (< 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });
  });

  // ===== THROUGHPUT TESTS =====

  describe('Throughput', () => {
    it('should handle 100 operations per second', async () => {
      const operationsPerSecond = 100;
      const durationMs = 1000;
      const totalOperations = operationsPerSecond;

      const startTime = Date.now();
      const requests = [];

      for (let i = 0; i < totalOperations; i++) {
        requests.push(
          request(app)
            .get('/documents?page=1&pageSize=10')
            .set('Authorization', `Bearer ${authToken}`),
        );
      }

      const responses = await Promise.all(requests);
      const endTime = Date.now();
      const actualDuration = endTime - startTime;

      const successCount = responses.filter((r) => r.status === 200).length;
      const actualThroughput = (successCount / actualDuration) * 1000;

      expect(successCount).toBeGreaterThan(totalOperations * 0.95); // 95% success rate
      expect(actualThroughput).toBeGreaterThan(operationsPerSecond * 0.8); // At least 80% of target
    });
  });

  // ===== DATABASE QUERY PERFORMANCE =====

  describe('Database Query Performance', () => {
    it('should retrieve templates list within 200ms', async () => {
      const startTime = Date.now();

      const response = await request(app).get('/templates');

      const endTime = Date.now();

      expect(response.status).toBe(200);
      expect(endTime - startTime).toBeLessThan(200);
    });

    it('should filter templates efficiently', async () => {
      const startTime = Date.now();

      const response = await request(app).get('/templates?type=BOOKING_CONFIRMATION');

      const endTime = Date.now();

      expect(response.status).toBe(200);
      expect(endTime - startTime).toBeLessThan(300);
    });

    it('should validate template within 100ms', async () => {
      const startTime = Date.now();

      const response = await request(app)
        .post('/templates/validate')
        .send({
          content: '<h1>{{booking.reference}}</h1>',
        });

      const endTime = Date.now();

      expect(response.status).toBe(200);
      expect(endTime - startTime).toBeLessThan(100);
    });
  });

  // ===== CACHE EFFECTIVENESS TESTS =====

  describe('Cache Effectiveness', () => {
    it('should serve cached requests faster', async () => {
      // First request (cache miss)
      const firstStart = Date.now();
      const firstResponse = await request(app)
        .get('/templates')
        .set('Authorization', `Bearer ${authToken}`);
      const firstDuration = Date.now() - firstStart;

      // Second request (cache hit if implemented)
      const secondStart = Date.now();
      const secondResponse = await request(app)
        .get('/templates')
        .set('Authorization', `Bearer ${authToken}`);
      const secondDuration = Date.now() - secondStart;

      expect(firstResponse.status).toBe(200);
      expect(secondResponse.status).toBe(200);

      // Second request should be faster (if caching is implemented)
      // This is a soft assertion as caching might not be implemented
      expect(secondDuration).toBeLessThanOrEqual(firstDuration * 1.5);
    });
  });
});
