/**
 * Document Service Migration System Tests
 * Comprehensive test suite for Prisma migrations and data integrity
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

describe('Database Migration System', () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = new PrismaClient();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // ===== MIGRATION STATUS TESTS =====

  describe('Migration Status', () => {
    it('should have all migrations applied', async () => {
      const appliedMigrations = await prisma.$runCommandRaw({
        raw: `SELECT COUNT(*) as count FROM "_prisma_migrations"`,
      });

      expect(appliedMigrations).toBeDefined();
      expect(appliedMigrations.count).toBeGreaterThan(0);
    });

    it('should have no pending migrations', async () => {
      const result = await prisma.$queryRaw`
        SELECT name FROM "_prisma_migrations" 
        WHERE finished_at IS NULL
      `;

      expect((result as Array<any>).length).toBe(0);
    });
  });

  // ===== SCHEMA VALIDATION TESTS =====

  describe('Schema Validation', () => {
    it('should have DocumentTemplate table', async () => {
      const templates = await prisma.documentTemplate.findMany({ take: 1 });
      expect(templates).toBeDefined();
    });

    it('should have Document table', async () => {
      const documents = await prisma.document.findMany({ take: 1 });
      expect(documents).toBeDefined();
    });

    it('should have DocumentVersion table', async () => {
      const versions = await prisma.documentVersion.findMany({ take: 1 });
      expect(versions).toBeDefined();
    });

    it('should have DocumentAuditLog table', async () => {
      const logs = await prisma.documentAuditLog.findMany({ take: 1 });
      expect(logs).toBeDefined();
    });
  });

  // ===== DATA INTEGRITY TESTS =====

  describe('Data Integrity', () => {
    it('should enforce foreign key constraints', async () => {
      expect(async () => {
        await prisma.document.create({
          data: {
            id: 'doc-invalid-fk',
            type: 'BOOKING_CONFIRMATION',
            templateId: 'invalid-template-id',
            userId: 'user-123',
            bookingId: 'booking-123',
            contentPath: '/path/to/document',
            status: 'GENERATED',
            format: 'PDF',
          },
        });
      }).rejects.toThrow();
    });

    it('should enforce unique constraints', async () => {
      // Create a document
      const doc = await prisma.document.create({
        data: {
          type: 'BOOKING_CONFIRMATION',
          templateId: (await prisma.documentTemplate.findFirst()).id!,
          userId: 'user-unique-123',
          bookingId: 'booking-unique-123',
          contentPath: '/unique/path',
          status: 'GENERATED',
          format: 'PDF',
        },
      });

      // Try to create duplicate (assuming unique constraint on bookingId for given type)
      expect(async () => {
        await prisma.document.create({
          data: {
            type: 'BOOKING_CONFIRMATION',
            templateId: (await prisma.documentTemplate.findFirst()).id!,
            userId: 'user-unique-456',
            bookingId: doc.bookingId,
            contentPath: '/another/path',
            status: 'GENERATED',
            format: 'PDF',
          },
        });
      }).rejects.toThrow();
    });

    it('should maintain timestamp constraints', async () => {
      const doc = await prisma.document.create({
        data: {
          type: 'BOOKING_CONFIRMATION',
          templateId: (await prisma.documentTemplate.findFirst()).id!,
          userId: 'user-timestamp-123',
          bookingId: 'booking-timestamp-123',
          contentPath: '/timestamp/path',
          status: 'GENERATED',
          format: 'PDF',
        },
      });

      expect(doc.createdAt).toBeInstanceOf(Date);
      expect(doc.updatedAt).toBeInstanceOf(Date);
      expect(doc.createdAt.getTime()).toBeLessThanOrEqual(doc.updatedAt.getTime());
    });
  });

  // ===== DEFAULT VALUES TESTS =====

  describe('Default Values', () => {
    it('should set default status to GENERATED', async () => {
      const doc = await prisma.document.create({
        data: {
          type: 'BOOKING_CONFIRMATION',
          templateId: (await prisma.documentTemplate.findFirst()).id!,
          userId: 'user-default-123',
          bookingId: 'booking-default-123',
          contentPath: '/default/path',
          format: 'PDF',
        },
      });

      expect(doc.status).toBe('GENERATED');
    });

    it('should set default retryCount to 0', async () => {
      const doc = await prisma.document.create({
        data: {
          type: 'BOOKING_CONFIRMATION',
          templateId: (await prisma.documentTemplate.findFirst()).id!,
          userId: 'user-retry-123',
          bookingId: 'booking-retry-123',
          contentPath: '/retry/path',
          status: 'GENERATED',
          format: 'PDF',
        },
      });

      expect(doc.retryCount).toBe(0);
    });
  });

  // ===== RELATIONSHIP TESTS =====

  describe('Relationships', () => {
    it('should properly relate Document to DocumentTemplate', async () => {
      const template = await prisma.documentTemplate.findFirst();
      if (!template) return;

      const doc = await prisma.document.create({
        data: {
          type: template.type,
          templateId: template.id,
          userId: 'user-rel-123',
          bookingId: 'booking-rel-123',
          contentPath: '/rel/path',
          status: 'GENERATED',
          format: 'PDF',
        },
      });

      const docWithTemplate = await prisma.document.findUnique({
        where: { id: doc.id },
        include: { template: true },
      });

      expect(docWithTemplate?.template.id).toBe(template.id);
    });

    it('should properly relate Document to DocumentVersion', async () => {
      const template = await prisma.documentTemplate.findFirst();
      if (!template) return;

      const doc = await prisma.document.create({
        data: {
          type: template.type,
          templateId: template.id,
          userId: 'user-version-123',
          bookingId: 'booking-version-123',
          contentPath: '/version/path',
          status: 'GENERATED',
          format: 'PDF',
        },
      });

      const version = await prisma.documentVersion.create({
        data: {
          documentId: doc.id,
          versionNumber: 1,
          contentPath: '/version/1/path',
          changeNotes: 'Initial version',
          createdBy: 'system',
        },
      });

      const docWithVersions = await prisma.document.findUnique({
        where: { id: doc.id },
        include: { versions: true },
      });

      expect(docWithVersions?.versions).toContainEqual(expect.objectContaining({ id: version.id }));
    });
  });

  // ===== MIGRATION FILES TEST =====

  describe('Migration Files', () => {
    it('should have valid migration directory structure', () => {
      const migrationsDir = path.join(__dirname, '../../prisma/migrations');
      expect(fs.existsSync(migrationsDir)).toBe(true);

      const migrations = fs.readdirSync(migrationsDir).filter((f) => !f.startsWith('.'));
      expect(migrations.length).toBeGreaterThan(0);
    });

    it('should have migration.sql files for each migration', () => {
      const migrationsDir = path.join(__dirname, '../../prisma/migrations');
      const migrations = fs.readdirSync(migrationsDir).filter((f) => !f.startsWith('.'));

      migrations.forEach((migration) => {
        const migrationPath = path.join(migrationsDir, migration, 'migration.sql');
        expect(fs.existsSync(migrationPath)).toBe(true);
      });
    });
  });

  // ===== ROLLBACK SAFETY TESTS =====

  describe('Rollback Safety', () => {
    it('should maintain data consistency during updates', async () => {
      const template = await prisma.documentTemplate.findFirst();
      if (!template) return;

      const originalData = {
        type: 'INVOICE',
        templateId: template.id,
        userId: 'user-rollback-123',
        bookingId: 'booking-rollback-123',
        contentPath: '/rollback/original',
        status: 'GENERATED' as const,
        format: 'PDF' as const,
      };

      const doc = await prisma.document.create({ data: originalData });
      const updated = await prisma.document.update({
        where: { id: doc.id },
        data: { contentPath: '/rollback/updated' },
      });

      expect(updated.contentPath).toBe('/rollback/updated');
      expect(updated.id).toBe(doc.id);
      expect(updated.type).toBe(originalData.type);
    });
  });
});
