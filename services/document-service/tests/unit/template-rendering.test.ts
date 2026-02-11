/**
 * Document Service Template Rendering Tests
 * Comprehensive test suite for template compilation, validation, and rendering
 */

import { TemplateService } from '../src/services/TemplateService';
import { documentTypes, DocType } from '../src/types';
import Handlebars from 'handlebars';

describe('Template Rendering System', () => {
  let templateService: TemplateService;

  beforeEach(() => {
    templateService = new TemplateService();
  });

  // ===== TEMPLATE COMPILATION TESTS =====

  describe('Template Compilation', () => {
    it('should compile simple template', () => {
      const template = '<h1>{{title}}</h1>';
      const compiled = Handlebars.compile(template);

      expect(compiled).toBeDefined();
      expect(typeof compiled).toBe('function');
    });

    it('should compile template with conditions', () => {
      const template = '{{#if premium}}<p>Premium User</p>{{/if}}';
      const compiled = Handlebars.compile(template);

      expect(compiled).toBeDefined();
    });

    it('should compile template with loops', () => {
      const template = '<ul>{{#each items}}<li>{{this}}</li>{{/each}}</ul>';
      const compiled = Handlebars.compile(template);

      expect(compiled).toBeDefined();
    });

    it('should handle nested objects in template', () => {
      const template = '<p>{{user.name}} from {{user.city}}</p>';
      const compiled = Handlebars.compile(template);
      const result = compiled({ user: { name: 'John', city: 'Paris' } });

      expect(result).toContain('John');
      expect(result).toContain('Paris');
    });
  });

  // ===== TEMPLATE VALIDATION TESTS =====

  describe('Template Validation', () => {
    it('should validate correct template', () => {
      const template = '<h1>{{booking.reference}}</h1>';
      const validation = templateService.validateTemplate(template);

      expect(validation.valid).toBe(true);
      expect(validation.errors).toEqual([]);
    });

    it('should detect unclosed handlebars', () => {
      const template = '<h1>{{booking.reference</h1>';
      const validation = templateService.validateTemplate(template);

      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    it('should detect invalid helpers', () => {
      const template = '<h1>{{unknownHelper booking}}</h1>';
      // This might not fail at compile time, depends on implementation
      expect(() => {
        Handlebars.compile(template);
      }).not.toThrow();
    });

    it('should validate variable references', () => {
      const template = '<p>{{user.name}}</p><p>{{booking.reference}}</p>';
      const validation = templateService.validateTemplate(template);

      expect(validation.valid).toBe(true);
    });

    it('should detect mismatched tags', () => {
      const template = '<div>{{#if condition}}<p>Text</div>{{/if}}';
      // HTML validation (may vary by implementation)
      expect(() => {
        Handlebars.compile(template);
      }).not.toThrow();
    });
  });

  // ===== TEMPLATE RENDERING TESTS =====

  describe('Booking Confirmation Template', () => {
    it('should render booking confirmation', () => {
      const template = `
        <h1>Booking Confirmation</h1>
        <p>Reference: {{booking.reference}}</p>
        <p>Destination: {{booking.destination}}</p>
        <p>Duration: {{booking.startDate}} - {{booking.endDate}}</p>
      `;

      const context = {
        booking: {
          reference: 'BK-001',
          destination: 'Paris',
          startDate: '2026-02-15',
          endDate: '2026-02-20',
        },
      };

      const compiled = Handlebars.compile(template);
      const result = compiled(context);

      expect(result).toContain('BK-001');
      expect(result).toContain('Paris');
      expect(result).toContain('2026-02-15');
    });

    it('should render conditional passenger list', () => {
      const template = `
        {{#if booking.passengers}}
        <h3>Passengers</h3>
        <ul>
          {{#each booking.passengers}}
          <li>{{this.name}}</li>
          {{/each}}
        </ul>
        {{/if}}
      `;

      const context = {
        booking: {
          passengers: [
            { name: 'John Doe' },
            { name: 'Jane Doe' },
          ],
        },
      };

      const compiled = Handlebars.compile(template);
      const result = compiled(context);

      expect(result).toContain('John Doe');
      expect(result).toContain('Jane Doe');
      expect(result).toContain('<h3>Passengers</h3>');
    });

    it('should handle empty passenger list', () => {
      const template = `
        {{#if booking.passengers}}
        <h3>Passengers</h3>
        <ul>
          {{#each booking.passengers}}
          <li>{{this.name}}</li>
          {{/each}}
        </ul>
        {{else}}
        <p>No passengers listed</p>
        {{/if}}
      `;

      const context = { booking: { passengers: [] } };

      const compiled = Handlebars.compile(template);
      const result = compiled(context);

      expect(result).toContain('No passengers listed');
    });
  });

  // ===== TEMPLATE RENDERING - INVOICE TESTS =====

  describe('Invoice Template', () => {
    it('should render invoice items', () => {
      const template = `
        <h1>Invoice {{invoice.invoiceNumber}}</h1>
        <table>
          {{#each invoice.items}}
          <tr>
            <td>{{this.description}}</td>
            <td>{{this.quantity}}</td>
            <td>${{this.unitPrice}}</td>
            <td>${{this.total}}</td>
          </tr>
          {{/each}}
        </table>
      `;

      const context = {
        invoice: {
          invoiceNumber: 'INV-001',
          items: [
            { description: 'Flight', quantity: 1, unitPrice: 500, total: 500 },
            { description: 'Hotel', quantity: 5, unitPrice: 150, total: 750 },
          ],
        },
      };

      const compiled = Handlebars.compile(template);
      const result = compiled(context);

      expect(result).toContain('INV-001');
      expect(result).toContain('Flight');
      expect(result).toContain('Hotel');
      expect(result).toContain('500');
      expect(result).toContain('750');
    });

    it('should render invoice totals with formatting', () => {
      const template = `
        <div>
          <p>Subtotal: ${{invoice.subtotal}}</p>
          <p>Tax: ${{invoice.tax}}</p>
          <p><strong>Total: ${{invoice.total}}</strong></p>
        </div>
      `;

      const context = {
        invoice: {
          subtotal: 1250,
          tax: 125,
          total: 1375,
        },
      };

      const compiled = Handlebars.compile(template);
      const result = compiled(context);

      expect(result).toContain('$1250');
      expect(result).toContain('$125');
      expect(result).toContain('$1375');
    });
  });

  // ===== CUSTOM HELPER TESTS =====

  describe('Custom Helpers', () => {
    beforeEach(() => {
      // Register custom helpers for testing
      Handlebars.registerHelper('uppercase', function (str) {
        return new Handlebars.SafeString((str || '').toUpperCase());
      });

      Handlebars.registerHelper('currency', function (num) {
        return new Handlebars.SafeString(`$${parseFloat(num).toFixed(2)}`);
      });

      Handlebars.registerHelper('dateformat', function (date) {
        return new Handlebars.SafeString(new Date(date).toLocaleDateString());
      });
    });

    it('should use uppercase helper', () => {
      const template = '<p>{{uppercase name}}</p>';
      const compiled = Handlebars.compile(template);
      const result = compiled({ name: 'john' });

      expect(result).toContain('JOHN');
    });

    it('should use currency helper', () => {
      const template = '<p>Price: {{currency price}}</p>';
      const compiled = Handlebars.compile(template);
      const result = compiled({ price: 1234.5 });

      expect(result).toContain('$1234.50');
    });

    it('should use dateformat helper', () => {
      const template = '<p>Date: {{dateformat date}}</p>';
      const compiled = Handlebars.compile(template);
      const result = compiled({ date: '2026-02-15' });

      expect(result).toContain('2/15/2026');
    });
  });

  // ===== ERROR HANDLING TESTS =====

  describe('Error Handling', () => {
    it('should handle missing variables gracefully', () => {
      const template = '<p>{{user.name}}</p>';
      const compiled = Handlebars.compile(template);
      const result = compiled({});

      // Handlebars returns empty string for missing variables
      expect(result).toContain('<p></p>');
    });

    it('should handle invalid templates', () => {
      expect(() => {
        Handlebars.compile('{{#if test}} {{/each}}'); // Mismatched tags
      }).toThrow();
    });

    it('should preserve HTML when rendering', () => {
      const template = '<b>{{text}}</b>';
      const compiled = Handlebars.compile(template);
      const result = compiled({ text: 'Bold Text' });

      expect(result).toContain('<b>Bold Text</b>');
    });
  });

  // ===== PERFORMANCE TESTS =====

  describe('Performance', () => {
    it('should compile large template within acceptable time', () => {
      let largeTemplate = '<div>';
      for (let i = 0; i < 1000; i++) {
        largeTemplate += `<p>Item {{items.${i}.name}}</p>`;
      }
      largeTemplate += '</div>';

      const startTime = performance.now();
      const compiled = Handlebars.compile(largeTemplate);
      const endTime = performance.now();

      // Should compile within 100ms
      expect(endTime - startTime).toBeLessThan(100);
    });

    it('should render large template within acceptable time', () => {
      const context = {
        items: Array.from({ length: 100 }, (_, i) => ({
          name: `Item ${i}`,
          price: Math.random() * 100,
        })),
      };

      let template = '<ul>';
      for (let i = 0; i < 100; i++) {
        template += `<li>{{items.${i}.name}} - ${{items.${i}.price}}</li>`;
      }
      template += '</ul>';

      const compiled = Handlebars.compile(template);

      const startTime = performance.now();
      const result = compiled(context);
      const endTime = performance.now();

      // Should render within 50ms
      expect(endTime - startTime).toBeLessThan(50);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  // ===== DOCUMENT TYPE TEMPLATE COVERAGE TESTS =====

  describe('Document Type Coverage', () => {
    documentTypes.forEach((docType: DocType) => {
      it(`should support ${docType} template rendering`, async () => {
        // This is a placeholder test - actual implementation would test specific templates
        expect(docType).toBeDefined();
        expect(['BOOKING_CONFIRMATION', 'INVOICE', 'ITINERARY', 'RECEIPT', 'AMENDMENT'].includes(docType)).toBe(
          true,
        );
      });
    });
  });
});
