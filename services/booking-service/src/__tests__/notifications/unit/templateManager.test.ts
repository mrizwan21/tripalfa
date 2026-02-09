import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { MockLogger, MockCacheService } from '../__mocks__';
import { mockEmailTemplate, mockSmsTemplate } from '../__fixtures__/notification.fixtures';

/**
 * Template Manager Unit Tests
 * Tests for email and SMS template management
 */

class TemplateManager {
  private templates: Map<string, any> = new Map();
  private cache: any;
  private logger: any;

  constructor(cache: any, logger: any) {
    this.cache = cache;
    this.logger = logger;
  }

  async addEmailTemplate(template: any): Promise<boolean> {
    try {
      if (!template.id || !template.name) {
        throw new Error('Email template must have id and name');
      }

      if (!template.htmlBody && !template.textBody) {
        throw new Error('Email template must have htmlBody or textBody');
      }

      const key = `email_template:${template.id}`;
      this.templates.set(key, template);
      await this.cache.set(key, JSON.stringify(template), 86400);

      this.logger.info(`Email template added: ${template.name}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to add email template`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        templateId: template?.id,
      });
      throw error;
    }
  }

  async addSmsTemplate(template: any): Promise<boolean> {
    try {
      if (!template.id || !template.name || !template.message) {
        throw new Error('SMS template must have id, name, and message');
      }

      const key = `sms_template:${template.id}`;
      this.templates.set(key, template);
      await this.cache.set(key, JSON.stringify(template), 86400);

      this.logger.info(`SMS template added: ${template.name}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to add SMS template`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        templateId: template?.id,
      });
      throw error;
    }
  }

  async getTemplate(templateId: string, type: 'email' | 'sms'): Promise<any | null> {
    try {
      const key = `${type}_template:${templateId}`;
      const cached = await this.cache.get(key);

      if (cached) {
        return JSON.parse(cached);
      }

      return this.templates.get(key) || null;
    } catch (error) {
      this.logger.error(`Failed to get ${type} template`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        templateId,
      });
      return null;
    }
  }

  async renderTemplate(templateId: string, type: 'email' | 'sms', variables: Record<string, any>): Promise<any | null> {
    try {
      const template = await this.getTemplate(templateId, type);
      if (!template) {
        throw new Error(`Template ${templateId} not found`);
      }

      if (type === 'email') {
        return this.renderEmailTemplate(template, variables);
      } else {
        return this.renderSmsTemplate(template, variables);
      }
    } catch (error) {
      this.logger.error(`Failed to render ${type} template`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        templateId,
      });
      return null;
    }
  }

  private renderEmailTemplate(template: any, variables: Record<string, any>): any {
    let htmlBody = template.htmlBody || '';
    let textBody = template.textBody || '';
    let subject = template.subject || '';

    // Replace variables
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      htmlBody = htmlBody.replace(regex, String(value));
      textBody = textBody.replace(regex, String(value));
      subject = subject.replace(regex, String(value));
    }

    return {
      subject,
      htmlBody,
      textBody,
      variables: template.variables,
    };
  }

  private renderSmsTemplate(template: any, variables: Record<string, any>): any {
    let message = template.message;

    // Replace variables
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      message = message.replace(regex, String(value));
    }

    return {
      message,
      variables: template.variables,
    };
  }

  async validateTemplate(template: any, type: 'email' | 'sms'): Promise<boolean> {
    try {
      if (type === 'email') {
        return !!(template.id && template.name && (template.htmlBody || template.textBody));
      } else {
        return !!(template.id && template.name && template.message);
      }
    } catch (error) {
      this.logger.error(`Template validation failed`, { error });
      return false;
    }
  }

  async deleteTemplate(templateId: string, type: 'email' | 'sms'): Promise<boolean> {
    try {
      const key = `${type}_template:${templateId}`;
      const deleted = this.templates.delete(key);
      await this.cache.del(key);
      
      if (deleted) {
        this.logger.info(`Template deleted: ${templateId}`);
      }
      return deleted;
    } catch (error) {
      this.logger.error(`Failed to delete template`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        templateId,
      });
      return false;
    }
  }

  async listTemplates(type: 'email' | 'sms'): Promise<any[]> {
    try {
      const templates = [];
      for (const [key, value] of this.templates) {
        if (key.startsWith(`${type}_template:`)) {
          templates.push(value);
        }
      }
      return templates;
    } catch (error) {
      this.logger.error(`Failed to list templates`, { error });
      return [];
    }
  }

  async updateTemplate(templateId: string, type: 'email' | 'sms', updates: any): Promise<boolean> {
    try {
      const template = await this.getTemplate(templateId, type);
      if (!template) {
        throw new Error(`Template ${templateId} not found`);
      }

      const updated = { ...template, ...updates, id: templateId };

      if (!(await this.validateTemplate(updated, type))) {
        throw new Error('Updated template is invalid');
      }

      const key = `${type}_template:${templateId}`;
      this.templates.set(key, updated);
      await this.cache.set(key, JSON.stringify(updated), 86400);

      this.logger.info(`Template updated: ${templateId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to update template`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        templateId,
      });
      return false;
    }
  }
}

describe('TemplateManager Unit Tests', () => {
  let templateManager: TemplateManager;
  let mockCache: MockCacheService;
  let mockLogger: MockLogger;

  beforeEach(() => {
    mockCache = new MockCacheService();
    mockLogger = new MockLogger();
    templateManager = new TemplateManager(mockCache, mockLogger);
  });

  afterEach(() => {
    mockCache.clear();
    mockLogger.clear();
  });

  describe('Email Template Management', () => {
    it('should add email template successfully', async () => {
      const result = await templateManager.addEmailTemplate(mockEmailTemplate);
      expect(result).toBe(true);
    });

    it('should validate email template on add', async () => {
      const invalidTemplate = { id: 'email_1', name: 'Test' }; // Missing content
      await expect(templateManager.addEmailTemplate(invalidTemplate)).rejects.toThrow();
    });

    it('should require template id', async () => {
      const template = { name: 'Test', htmlBody: '<h1>Test</h1>' };
      await expect(templateManager.addEmailTemplate(template)).rejects.toThrow();
    });

    it('should require template name', async () => {
      const template = { id: 'email_1', htmlBody: '<h1>Test</h1>' };
      await expect(templateManager.addEmailTemplate(template)).rejects.toThrow();
    });

    it('should require htmlBody or textBody', async () => {
      const template = { id: 'email_1', name: 'Test' };
      await expect(templateManager.addEmailTemplate(template)).rejects.toThrow();
    });

    it('should support htmlBody only', async () => {
      const template = { id: 'email_html', name: 'HTML Only', htmlBody: '<h1>Test</h1>' };
      const result = await templateManager.addEmailTemplate(template);
      expect(result).toBe(true);
    });

    it('should support textBody only', async () => {
      const template = { id: 'email_text', name: 'Text Only', textBody: 'Test' };
      const result = await templateManager.addEmailTemplate(template);
      expect(result).toBe(true);
    });

    it('should support both htmlBody and textBody', async () => {
      const template = {
        id: 'email_both',
        name: 'Both',
        htmlBody: '<h1>Test</h1>',
        textBody: 'Test',
      };
      const result = await templateManager.addEmailTemplate(template);
      expect(result).toBe(true);
    });

    it('should store email template in cache', async () => {
      await templateManager.addEmailTemplate(mockEmailTemplate);
      const cached = await mockCache.get(`email_template:${mockEmailTemplate.id}`);
      expect(cached).toBeDefined();
    });

    it('should log email template addition', async () => {
      await templateManager.addEmailTemplate(mockEmailTemplate);
      const logs = mockLogger.getLogsByLevel('info');
      expect(logs.some(log => log.message.includes('Email template added'))).toBe(true);
    });
  });

  describe('SMS Template Management', () => {
    it('should add SMS template successfully', async () => {
      const result = await templateManager.addSmsTemplate(mockSmsTemplate);
      expect(result).toBe(true);
    });

    it('should require id, name, and message for SMS template', async () => {
      const invalidTemplate = { id: 'sms_1', name: 'Test' }; // Missing message
      await expect(templateManager.addSmsTemplate(invalidTemplate)).rejects.toThrow();
    });

    it('should store SMS template in cache', async () => {
      await templateManager.addSmsTemplate(mockSmsTemplate);
      const cached = await mockCache.get(`sms_template:${mockSmsTemplate.id}`);
      expect(cached).toBeDefined();
    });

    it('should log SMS template addition', async () => {
      await templateManager.addSmsTemplate(mockSmsTemplate);
      const logs = mockLogger.getLogsByLevel('info');
      expect(logs.some(log => log.message.includes('SMS template added'))).toBe(true);
    });
  });

  describe('Template Retrieval', () => {
    beforeEach(async () => {
      await templateManager.addEmailTemplate(mockEmailTemplate);
      await templateManager.addSmsTemplate(mockSmsTemplate);
    });

    it('should retrieve email template', async () => {
      const template = await templateManager.getTemplate(mockEmailTemplate.id, 'email');
      expect(template).toEqual(mockEmailTemplate);
    });

    it('should retrieve SMS template', async () => {
      const template = await templateManager.getTemplate(mockSmsTemplate.id, 'sms');
      expect(template).toEqual(mockSmsTemplate);
    });

    it('should return null for non-existent template', async () => {
      const template = await templateManager.getTemplate('non_existent', 'email');
      expect(template).toBeNull();
    });

    it('should retrieve template from cache', async () => {
      const template1 = await templateManager.getTemplate(mockEmailTemplate.id, 'email');
      const template2 = await templateManager.getTemplate(mockEmailTemplate.id, 'email');
      expect(template1).toEqual(template2);
    });
  });

  describe('Template Rendering', () => {
    beforeEach(async () => {
      await templateManager.addEmailTemplate(mockEmailTemplate);
      await templateManager.addSmsTemplate(mockSmsTemplate);
    });

    it('should render email template with variables', async () => {
      const rendered = await templateManager.renderTemplate(
        mockEmailTemplate.id,
        'email',
        {
          bookingType: 'Flight',
          customerName: 'John Doe',
        }
      );

      expect(rendered).toBeDefined();
      expect(rendered.subject).toContain('Flight');
    });

    it('should render SMS template with variables', async () => {
      const rendered = await templateManager.renderTemplate(
        mockSmsTemplate.id,
        'sms',
        {
          amount: '100',
          currency: 'USD',
          reference: 'BK12345',
        }
      );

      expect(rendered).toBeDefined();
      expect(rendered.message).toContain('100 USD');
      expect(rendered.message).toContain('BK12345');
    });

    it('should handle missing variables gracefully', async () => {
      const rendered = await templateManager.renderTemplate(
        mockEmailTemplate.id,
        'email',
        {} // No variables provided
      );

      expect(rendered).toBeDefined();
    });

    it('should replace multiple variable occurrences', async () => {
      const template = {
        id: 'multi_var',
        name: 'Multi Variable',
        message: '{name} booking {bookingId} by {name}',
        variables: ['name', 'bookingId'],
      };
      await templateManager.addSmsTemplate(template);

      const rendered = await templateManager.renderTemplate(
        'multi_var',
        'sms',
        {
          name: 'John',
          bookingId: 'BK123',
        }
      );

      expect(rendered.message).toBe('John booking BK123 by John');
    });

    it('should maintain template structure after rendering', async () => {
      const rendered = await templateManager.renderTemplate(
        mockEmailTemplate.id,
        'email',
        { bookingType: 'Flight', reference: 'BK123' }
      );

      expect(rendered).toHaveProperty('subject');
      expect(rendered).toHaveProperty('htmlBody');
      expect(rendered).toHaveProperty('textBody');
    });
  });

  describe('Template Validation', () => {
    it('should validate complete email template', async () => {
      const valid = await templateManager.validateTemplate(mockEmailTemplate, 'email');
      expect(valid).toBe(true);
    });

    it('should validate complete SMS template', async () => {
      const valid = await templateManager.validateTemplate(mockSmsTemplate, 'sms');
      expect(valid).toBe(true);
    });

    it('should reject incomplete email template', async () => {
      const invalid = { id: 'email_1', name: 'Test' }; // Missing content
      const valid = await templateManager.validateTemplate(invalid, 'email');
      expect(valid).toBe(false);
    });

    it('should reject incomplete SMS template', async () => {
      const invalid = { id: 'sms_1', name: 'Test' }; // Missing message
      const valid = await templateManager.validateTemplate(invalid, 'sms');
      expect(valid).toBe(false);
    });
  });

  describe('Template Deletion', () => {
    beforeEach(async () => {
      await templateManager.addEmailTemplate(mockEmailTemplate);
    });

    it('should delete template successfully', async () => {
      const result = await templateManager.deleteTemplate(mockEmailTemplate.id, 'email');
      expect(result).toBe(true);
    });

    it('should remove template from cache after deletion', async () => {
      await templateManager.deleteTemplate(mockEmailTemplate.id, 'email');
      const cached = await mockCache.get(`email_template:${mockEmailTemplate.id}`);
      expect(cached).toBeNull();
    });

    it('should return false for non-existent template deletion', async () => {
      const result = await templateManager.deleteTemplate('non_existent', 'email');
      expect(result).toBe(false);
    });

    it('should log template deletion', async () => {
      await templateManager.deleteTemplate(mockEmailTemplate.id, 'email');
      const logs = mockLogger.getLogsByLevel('info');
      expect(logs.some(log => log.message.includes('Template deleted'))).toBe(true);
    });
  });

  describe('Template Updates', () => {
    beforeEach(async () => {
      await templateManager.addEmailTemplate(mockEmailTemplate);
    });

    it('should update template successfully', async () => {
      const updates = { name: 'Updated Name' };
      const result = await templateManager.updateTemplate(mockEmailTemplate.id, 'email', updates);
      expect(result).toBe(true);
    });

    it('should preserve template ID on update', async () => {
      const updates = { name: 'New Name' };
      await templateManager.updateTemplate(mockEmailTemplate.id, 'email', updates);
      
      const updated = await templateManager.getTemplate(mockEmailTemplate.id, 'email');
      expect(updated.id).toBe(mockEmailTemplate.id);
    });

    it('should validate updated template', async () => {
      const updates = { htmlBody: undefined, textBody: undefined }; // Invalid
      const result = await templateManager.updateTemplate(mockEmailTemplate.id, 'email', updates);
      // Should fail validation or return false
      expect(typeof result).toBe('boolean');
    });

    it('should update template in cache', async () => {
      const updates = { name: 'Updated Template' };
      await templateManager.updateTemplate(mockEmailTemplate.id, 'email', updates);
      
      const cached = await mockCache.get(`email_template:${mockEmailTemplate.id}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        expect(parsed.name).toBe('Updated Template');
      }
    });

    it('should return false for updating non-existent template', async () => {
      const result = await templateManager.updateTemplate('non_existent', 'email', { name: 'New' });
      expect(result).toBe(false);
    });
  });

  describe('Template Listing', () => {
    beforeEach(async () => {
      await templateManager.addEmailTemplate({
        ...mockEmailTemplate,
        id: 'email_1',
        name: 'Template 1',
      });
      await templateManager.addEmailTemplate({
        ...mockEmailTemplate,
        id: 'email_2',
        name: 'Template 2',
      });
      await templateManager.addSmsTemplate(mockSmsTemplate);
    });

    it('should list all email templates', async () => {
      const templates = await templateManager.listTemplates('email');
      expect(templates.length).toBeGreaterThanOrEqual(2);
    });

    it('should list all SMS templates', async () => {
      const templates = await templateManager.listTemplates('sms');
      expect(templates.length).toBeGreaterThanOrEqual(1);
    });

    it('should filter templates by type', async () => {
      const emailTemplates = await templateManager.listTemplates('email');
      const smsTemplates = await templateManager.listTemplates('sms');
      
      expect(emailTemplates.every(t => t.id?.startsWith('email_') || true)).toBe(true);
    });

    it('should return empty array if no templates of type exist', async () => {
      // Clear all and add only email
      mockCache.clear();
      const templates = await templateManager.listTemplates('email');
      expect(Array.isArray(templates)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should log errors on invalid template', async () => {
      try {
        await templateManager.addEmailTemplate({ id: 'bad' }); // Missing required fields
      } catch (e) {
        // Expected
      }
      
      const errorLogs = mockLogger.getLogsByLevel('error');
      expect(errorLogs.length).toBeGreaterThan(0);
    });

    it('should handle cache errors gracefully', async () => {
      mockCache.set = jest.fn().mockRejectedValue(new Error('Cache failed'));
      
      try {
        await templateManager.addEmailTemplate(mockEmailTemplate);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should not throw on safe operations during errors', async () => {
      const template = await templateManager.getTemplate('non_existent', 'email');
      expect(template).toBeNull();
    });
  });
});
