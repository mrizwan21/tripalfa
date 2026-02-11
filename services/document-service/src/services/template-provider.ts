/**
 * Template Provider Service
 * Handles template management and Handlebars rendering
 */

import Handlebars from 'handlebars';
import { PrismaClient } from '@prisma/client';
import {
  DocumentTemplate,
  DocumentType,
  DocumentFormat,
  TemplateContext,
  TemplateNotFound,
  TemplateRenderError,
  CreateTemplateRequest,
} from '../models/types';

/**
 * Template provider for managing and rendering document templates
 */
export class TemplateProvider {
  private prisma: PrismaClient;
  private templateCache: Map<string, Handlebars.TemplateDelegate> = new Map();

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.registerHandlebarsHelpers();
  }

  /**
   * Register custom Handlebars helpers
   */
  private registerHandlebarsHelpers(): void {
    // Currency formatter
    Handlebars.registerHelper('currency', (value: number) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(value);
    });

    // Date formatter
    Handlebars.registerHelper('dateFormat', (date: Date | string, format: string = 'MM/DD/YYYY') => {
      const d = typeof date === 'string' ? new Date(date) : date;

      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');

      const formatMap: Record<string, string> = {
        YYYY: String(year),
        MM: month,
        DD: day,
        HH: hours,
        mm: minutes,
        'MM/DD/YYYY': `${month}/${day}/${year}`,
        'DD/MM/YYYY': `${day}/${month}/${year}`,
        'YYYY-MM-DD': `${year}-${month}-${day}`,
      };

      return formatMap[format] || d.toLocaleDateString();
    });

    // Conditional (if-else)
    Handlebars.registerHelper('ifeq', function (this: any, a: any, b: any, options: any) {
      return a === b ? options.fn(this) : options.inverse(this);
    });

    // Iteration counter
    Handlebars.registerHelper('counter', function (this: any, index: any) {
      return index + 1;
    });

    // Truncate text
    Handlebars.registerHelper('truncate', (text: string, length: number = 50) => {
      if (text.length > length) {
        return text.substring(0, length) + '...';
      }
      return text;
    });

    // URL encode
    Handlebars.registerHelper('urlencode', (text: string) => {
      return encodeURIComponent(text);
    });

    // Safe HTML (unescaped)
    Handlebars.registerHelper('safe', (text: string) => {
      return new Handlebars.SafeString(text);
    });

    console.log('[TemplateProvider] Handlebars helpers registered');
  }

  /**
   * Create a new template
   */
  async createTemplate(data: CreateTemplateRequest): Promise<DocumentTemplate> {
    try {
      // Get the latest version for this template name/type
      const latestVersion = await this.prisma.documentTemplate.findFirst({
        where: {
          name: data.name,
          type: data.type,
        },
        orderBy: { version: 'desc' },
      });

      const nextVersion = (latestVersion?.version || 0) + 1;

      const template = await this.prisma.documentTemplate.create({
        data: {
          name: data.name,
          type: data.type,
          content: data.content,
          format: data.format,
          description: data.description,
          version: nextVersion,
        },
      });

      // Clear cache for this template
      this.templateCache.delete(template.id);

      console.log(`[TemplateProvider] Created template: ${template.name} v${template.version}`);
      return template;
    } catch (error) {
      throw new Error(`Failed to create template: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get template by ID
   */
  async getTemplate(templateId: string): Promise<DocumentTemplate> {
    try {
      const template = await this.prisma.documentTemplate.findUnique({
        where: { id: templateId },
      });

      if (!template) {
        throw new TemplateNotFound(templateId);
      }

      return template;
    } catch (error) {
      if (error instanceof TemplateNotFound) throw error;
      throw new Error(`Failed to get template: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get default active template for document type
   */
  async getActiveTemplate(type: DocumentType): Promise<DocumentTemplate> {
    try {
      const template = await this.prisma.documentTemplate.findFirst({
        where: {
          type,
          isActive: true,
        },
        orderBy: { version: 'desc' },
      });

      if (!template) {
        throw new Error(`No active template found for type: ${type}`);
      }

      return template;
    } catch (error) {
      throw new Error(`Failed to get active template: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Update template
   */
  async updateTemplate(templateId: string, data: Partial<CreateTemplateRequest>): Promise<DocumentTemplate> {
    try {
      const template = await this.getTemplate(templateId);

      // If content changed, create new version instead of updating
      if (data.content && data.content !== template.content) {
        console.log(`[TemplateProvider] Content changed, creating new version`);
        return this.createTemplate({
          name: data.name || template.name,
          type: template.type,
          content: data.content,
          format: (data.format as DocumentFormat) || template.format,
          description: (data.description || template.description || undefined) as string | undefined,
        });
      }

      // Direct update for metadata changes
      const updated = await this.prisma.documentTemplate.update({
        where: { id: templateId },
        data: {
          name: data.name || template.name,
          description: data.description ?? template.description ?? undefined,
          isActive: template.isActive, // Can be toggled separately
        },
      });

      this.templateCache.delete(templateId);
      return updated;
    } catch (error) {
      throw new Error(`Failed to update template: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * List templates
   */
  async listTemplates(type?: DocumentType): Promise<DocumentTemplate[]> {
    try {
      return await this.prisma.documentTemplate.findMany({
        where: type ? { type } : {},
        orderBy: [{ type: 'asc' }, { name: 'asc' }, { version: 'desc' }],
      });
    } catch (error) {
      throw new Error(`Failed to list templates: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Render template with context
   */
  async renderTemplate(templateId: string, context: TemplateContext): Promise<string> {
    try {
      const template = await this.getTemplate(templateId);
      return this.renderTemplateContent(template.content, context, templateId);
    } catch (error) {
      if (error instanceof TemplateRenderError) throw error;
      throw new Error(`Failed to render template: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Render template content directly (for preview)
   */
  renderTemplateContent(content: string, context: TemplateContext, templateId: string = 'preview'): string {
    try {
      // Check cache
      let compiledTemplate = this.templateCache.get(templateId);

      if (!compiledTemplate) {
        compiledTemplate = Handlebars.compile(content);
        this.templateCache.set(templateId, compiledTemplate);
      }

      const html = compiledTemplate(context);
      console.log(`[TemplateProvider] Rendered template: ${templateId} (${html.length} bytes)`);
      return html;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      throw new TemplateRenderError(templateId, errorMsg);
    }
  }

  /**
   * Validate template syntax
   */
  validateTemplateSyntax(content: string): { valid: boolean; error?: string } {
    try {
      Handlebars.compile(content);
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Toggle template active status
   */
  async toggleTemplateActiveStatus(templateId: string, isActive: boolean): Promise<DocumentTemplate> {
    try {
      const template = await this.prisma.documentTemplate.update({
        where: { id: templateId },
        data: { isActive },
      });

      this.templateCache.delete(templateId);
      console.log(`[TemplateProvider] Template ${templateId} active status: ${isActive}`);
      return template;
    } catch (error) {
      throw new Error(`Failed to toggle template: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get template history/versions
   */
  async getTemplateVersions(name: string, type: DocumentType): Promise<DocumentTemplate[]> {
    try {
      return await this.prisma.documentTemplate.findMany({
        where: {
          name,
          type,
        },
        orderBy: { version: 'desc' },
      });
    } catch (error) {
      throw new Error(`Failed to get template versions: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Delete template
   */
  async deleteTemplate(templateId: string): Promise<void> {
    try {
      await this.prisma.documentTemplate.delete({
        where: { id: templateId },
      });

      this.templateCache.delete(templateId);
      console.log(`[TemplateProvider] Deleted template: ${templateId}`);
    } catch (error) {
      throw new Error(`Failed to delete template: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Clear template cache
   */
  clearCache(templateId?: string): void {
    if (templateId) {
      this.templateCache.delete(templateId);
    } else {
      this.templateCache.clear();
    }
    console.log('[TemplateProvider] Cache cleared');
  }
}

/**
 * Create default templates for new installations
 */
export async function createDefaultTemplates(prisma: PrismaClient): Promise<void> {
  console.log('[TemplateProvider] Creating default templates...');

  // Booking Confirmation Template
  const bookingTemplate = `
<html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; margin: 20px; }
      .header { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
      .section { margin-top: 20px; }
      .label { color: #666; font-weight: bold; }
      table { width: 100%; border-collapse: collapse; }
      th, td { text-align: left; padding: 8px; border-bottom: 1px solid #ddd; }
      th { background-color: #f5f5f5; }
    </style>
  </head>
  <body>
    <div class="header">
      <h2>Booking Confirmation</h2>
      <p>Confirmation #: {{booking.reference}}</p>
    </div>
    
    <div class="section">
      <h3>Trip Details</h3>
      <table>
        <tr><td class="label">Destination:</td><td>{{booking.destination}}</td></tr>
        <tr><td class="label">Start Date:</td><td>{{dateFormat booking.startDate 'MM/DD/YYYY'}}</td></tr>
        <tr><td class="label">End Date:</td><td>{{dateFormat booking.endDate 'MM/DD/YYYY'}}</td></tr>
        <tr><td class="label">Number of Passengers:</td><td>{{booking.paxCount}}</td></tr>
        <tr><td class="label">Total Cost:</td><td>{{currency booking.totalCost}}</td></tr>
      </table>
    </div>
    
    <div class="section">
      <h3>Contact Information</h3>
      <table>
        <tr><td class="label">Name:</td><td>{{user.name}}</td></tr>
        <tr><td class="label">Email:</td><td>{{user.email}}</td></tr>
        <tr><td class="label">Phone:</td><td>{{user.phone}}</td></tr>
      </table>
    </div>
    
    <div class="section" style="margin-top: 40px; color: #666; font-size: 12px;">
      <p>Thank you for booking with {{company.name}}!</p>
      <p>{{company.address}} | {{company.phone}} | {{company.email}}</p>
    </div>
  </body>
</html>
  `;

  // Invoice Template
  const invoiceTemplate = `
<html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; margin: 20px; }
      .header { display: flex; justify-content: space-between; margin-bottom: 30px; }
      .company { font-weight: bold; font-size: 18px; }
      .invoice-title { font-size: 24px; color: #333; }
      table { width: 100%; border-collapse: collapse; margin-top: 20px; }
      th, td { text-align: left; padding: 10px; border-bottom: 1px solid #ddd; }
      th { background-color: #f5f5f5; font-weight: bold; }
      .total-row { background-color: #f5f5f5; font-weight: bold; }
      .amount { text-align: right; }
      .footer { margin-top: 40px; font-size: 12px; color: #666; }
    </style>
  </head>
  <body>
    <div class="header">
      <div>
        <div class="company">{{company.name}}</div>
        <div style="font-size: 12px; color: #666;">{{company.address}}</div>
      </div>
      <div style="text-align: right;">
        <div class="invoice-title">INVOICE</div>
        <div><strong>Invoice #:</strong> {{invoice.invoiceNumber}}</div>
        <div><strong>Date:</strong> {{dateFormat invoice.date 'MM/DD/YYYY'}}</div>
      </div>
    </div>
    
    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th class="amount">Quantity</th>
          <th class="amount">Unit Price</th>
          <th class="amount">Total</th>
        </tr>
      </thead>
      <tbody>
        {{#each invoice.items}}
        <tr>
          <td>{{this.description}}</td>
          <td class="amount">{{this.quantity}}</td>
          <td class="amount">{{currency this.unitPrice}}</td>
          <td class="amount">{{currency this.total}}</td>
        </tr>
        {{/each}}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="3" style="text-align: right;">Subtotal:</td>
          <td class="amount"><strong>{{currency invoice.subtotal}}</strong></td>
        </tr>
        <tr>
          <td colspan="3" style="text-align: right;">Tax:</td>
          <td class="amount"><strong>{{currency invoice.tax}}</strong></td>
        </tr>
        <tr class="total-row">
          <td colspan="3" style="text-align: right;">TOTAL:</td>
          <td class="amount">{{currency invoice.total}}</td>
        </tr>
      </tfoot>
    </table>
    
    <div class="footer">
      <p>Thank you for your business!</p>
      <p>{{company.phone}} | {{company.email}}</p>
    </div>
  </body>
</html>
  `;

  // Receipt Template
  const receiptTemplate = `
<html>
  <head>
    <style>
      body { font-family: monospace; margin: 20px; max-width: 400px; }
      .receipt-header { text-align: center; font-weight: bold; border-bottom: 2px dashed #000; padding-bottom: 10px; }
      .receipt-content { margin-top: 10px; }
      .receipt-footer { text-align: center; margin-top: 20px; border-top: 2px dashed #000; padding-top: 10px; }
      .row { display: flex; justify-content: space-between; margin: 5px 0; }
      .total { font-weight: bold; font-size: 16px; margin-top: 10px; }
    </style>
  </head>
  <body>
    <div class="receipt-header">
      {{company.name}}
      <div style="font-size: 12px;">RECEIPT</div>
    </div>
    
    <div class="receipt-content">
      <div class="row">
        <span>Date:</span>
        <span>{{dateFormat receipt.date 'MM/DD/YYYY HH:mm'}}</span>
      </div>
      <div class="row">
        <span>Transaction:</span>
        <span>{{receipt.transactionId}}</span>
      </div>
      <div class="row">
        <span>Description:</span>
        <span>{{receipt.description}}</span>
      </div>
      <div class="row total">
        <span>Amount:</span>
        <span>{{currency receipt.amount}}</span>
      </div>
      <div class="row">
        <span>Method:</span>
        <span>{{receipt.paymentMethod}}</span>
      </div>
    </div>
    
    <div class="receipt-footer">
      <p>Thank you!</p>
      <p style="font-size: 11px;">{{company.phone}}</p>
    </div>
  </body>
</html>
  `;

  try {
    // Check if templates already exist
    const existingTemplates = await prisma.documentTemplate.findMany();

    if (existingTemplates.length === 0) {
      await prisma.documentTemplate.createMany({
        data: [
          {
            name: 'Booking Confirmation',
            type: 'BOOKING_CONFIRMATION',
            content: bookingTemplate,
            format: 'BOTH',
            version: 1,
            isActive: true,
            description: 'Default booking confirmation template',
          },
          {
            name: 'Invoice',
            type: 'INVOICE',
            content: invoiceTemplate,
            format: 'BOTH',
            version: 1,
            isActive: true,
            description: 'Default invoice template',
          },
          {
            name: 'Receipt',
            type: 'RECEIPT',
            content: receiptTemplate,
            format: 'HTML',
            version: 1,
            isActive: true,
            description: 'Default receipt template',
          },
        ],
      });

      console.log('[TemplateProvider] Default templates created successfully');
    } else {
      console.log('[TemplateProvider] Templates already exist, skipping defaults');
    }
  } catch (error) {
    console.error('[TemplateProvider] Error creating default templates:', error);
  }
}
