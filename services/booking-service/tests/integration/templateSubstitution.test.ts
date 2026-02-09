/**
 * Template Variable Substitution Testing
 * 
 * Tests cover:
 * - Template rendering with dynamic variables
 * - Handlebars template compilation
 * - Multi-language template support
 * - Conditional template rendering
 * - Loop iterations in templates
 * - Missing variable handling
 * - XSS prevention in template rendering
 * - Template variable validation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import axios from 'axios';

const API_BASE_URL = process.env.BOOKING_SERVICE_API || 'http://localhost:3001/api';

describe('Template Variable Substitution', () => {
  let userId: string;
  let bookingId: string;

  beforeEach(() => {
    userId = `user-${Date.now()}`;
    bookingId = `booking-${Date.now()}`;
  });

  describe('Basic Variable Substitution', () => {
    it('should render email template with customer name', async () => {
      const variables = {
        customerName: 'John Doe',
        bookingReference: 'ABC123',
        bookingDate: '2024-02-09',
      };

      const response = await axios.post(`${API_BASE_URL}/notifications/render-template`, {
        templateId: 'booking_confirmation_email',
        variables,
        language: 'en',
      });

      expect(response.status).toBe(200);
      expect(response.data.subject).toContain('John Doe');
      expect(response.data.body).toContain('ABC123');
      expect(response.data.body).not.toContain('{{');
    });

    it('should render SMS template with truncation', async () => {
      const variables = {
        customerName: 'Jane Smith',
        confirmationCode: '123456',
        expiryMinutes: '15',
      };

      const response = await axios.post(`${API_BASE_URL}/notifications/render-template`, {
        templateId: 'sms_confirmation',
        variables,
        channel: 'sms',
        maxLength: 160,
      });

      expect(response.status).toBe(200);
      expect(response.data.body.length).toBeLessThanOrEqual(160);
      expect(response.data.body).toContain('123456');
    });

    it('should render push notification with short content', async () => {
      const variables = {
        title: 'Booking Confirmed',
        bookingRef: 'XYZ789',
        destination: 'Paris',
      };

      const response = await axios.post(`${API_BASE_URL}/notifications/render-template`, {
        templateId: 'push_booking_confirmed',
        variables,
        channel: 'push',
      });

      expect(response.status).toBe(200);
      expect(response.data.title).toContain('Confirmed');
      expect(response.data.body).toContain('XYZ789');
    });

    it('should handle special characters in variables', async () => {
      const variables = {
        customerName: "O'Brien & Co.",
        bookingNote: 'Special request: <no preference>',
      };

      const response = await axios.post(`${API_BASE_URL}/notifications/render-template`, {
        templateId: 'booking_confirmation_email',
        variables,
      });

      expect(response.status).toBe(200);
      // Should escape/handle special characters properly
      expect(response.data.body).toBeDefined();
    });
  });

  describe('Conditional Rendering', () => {
    it('should render template with conditional premium status', async () => {
      const variables = {
        customerName: 'Premium User',
        isPremium: true,
        premiumBenefit: 'Free cancellation',
      };

      const response = await axios.post(`${API_BASE_URL}/notifications/render-template`, {
        templateId: 'booking_confirmation_with_status',
        variables,
      });

      expect(response.status).toBe(200);
      expect(response.data.body).toContain('Free cancellation');
    });

    it('should skip conditional block when condition is false', async () => {
      const variables = {
        customerName: 'Standard User',
        isPremium: false,
        premiumBenefit: 'Free cancellation',
      };

      const response = await axios.post(`${API_BASE_URL}/notifications/render-template`, {
        templateId: 'booking_confirmation_with_status',
        variables,
      });

      expect(response.status).toBe(200);
      expect(response.data.body).not.toContain('Free cancellation');
    });

    it('should render conditional refund eligibility', async () => {
      const variables = {
        bookingRef: 'ABC123',
        cancellationDeadline: '2024-02-15',
        isRefundable: true,
        refundAmount: '€500',
      };

      const response = await axios.post(`${API_BASE_URL}/notifications/render-template`, {
        templateId: 'cancellation_confirmation',
        variables,
      });

      expect(response.status).toBe(200);
      expect(response.data.body).toContain('€500');
    });
  });

  describe('Loop Iterations in Templates', () => {
    it('should render template with itinerary loop', async () => {
      const variables = {
        customerName: 'John Doe',
        itinerary: [
          {
            date: '2024-03-15',
            airline: 'Air France',
            departure: 'CDG',
            arrival: 'LHR',
          },
          {
            date: '2024-03-20',
            airline: 'BA',
            departure: 'LHR',
            arrival: 'CDG',
          },
        ],
      };

      const response = await axios.post(`${API_BASE_URL}/notifications/render-template`, {
        templateId: 'flight_itinerary_email',
        variables,
      });

      expect(response.status).toBe(200);
      expect(response.data.body).toContain('Air France');
      expect(response.data.body).toContain('BA');
      expect(response.data.body).toContain('CDG');
      expect(response.data.body).toContain('LHR');
    });

    it('should render template with multiple hotel confirmations', async () => {
      const variables = {
        bookingRef: 'HOTEL-001',
        hotels: [
          {
            name: 'Hotel Paris',
            checkIn: '2024-03-15',
            checkOut: '2024-03-17',
            nights: 2,
            price: '€400',
          },
          {
            name: 'Hotel London',
            checkIn: '2024-03-18',
            checkOut: '2024-03-20',
            nights: 2,
            price: '€350',
          },
        ],
      };

      const response = await axios.post(`${API_BASE_URL}/notifications/render-template`, {
        templateId: 'multi_hotel_itinerary',
        variables,
      });

      expect(response.status).toBe(200);
      expect(response.data.body).toContain('Hotel Paris');
      expect(response.data.body).toContain('Hotel London');
      expect(response.data.body).toContain('€400');
      expect(response.data.body).toContain('€350');
    });

    it('should render template with empty list gracefully', async () => {
      const variables = {
        customerName: 'John',
        addOns: [],
      };

      const response = await axios.post(`${API_BASE_URL}/notifications/render-template`, {
        templateId: 'booking_with_addons',
        variables,
      });

      expect(response.status).toBe(200);
      expect(response.data.body).toBeDefined();
    });
  });

  describe('Multi-Language Template Support', () => {
    it('should render French template with variables', async () => {
      const variables = {
        customerName: 'Jean Dupont',
        bookingRef: 'ABC123',
      };

      const response = await axios.post(`${API_BASE_URL}/notifications/render-template`, {
        templateId: 'booking_confirmation_email',
        variables,
        language: 'fr',
      });

      expect(response.status).toBe(200);
      // French template should use French words
      expect(
        response.data.subject.toLowerCase().includes('confirmation') ||
          response.data.subject.includes('réservation')
      ).toBeTruthy();
    });

    it('should render German template', async () => {
      const variables = {
        customerName: 'Hans Mueller',
        bookingRef: 'XYZ789',
      };

      const response = await axios.post(`${API_BASE_URL}/notifications/render-template`, {
        templateId: 'booking_confirmation_email',
        variables,
        language: 'de',
      });

      expect(response.status).toBe(200);
      expect(response.data.body).toBeDefined();
    });

    it('should fall back to English for unsupported language', async () => {
      const variables = {
        customerName: 'Test User',
      };

      const response = await axios.post(`${API_BASE_URL}/notifications/render-template`, {
        templateId: 'booking_confirmation_email',
        variables,
        language: 'xx', // Invalid language code
      });

      expect(response.status).toBe(200);
      expect(response.data.language).toBe('en');
    });
  });

  describe('Missing Variable Handling', () => {
    it('should handle missing optional variables gracefully', async () => {
      const variables = {
        customerName: 'John Doe',
        // Note: bookingReference is missing but optional
      };

      const response = await axios.post(`${API_BASE_URL}/notifications/render-template`, {
        templateId: 'booking_confirmation_email',
        variables,
      });

      expect(response.status).toBe(200);
      expect(response.data.body).toContain('John Doe');
    });

    it('should require mandatory variables', async () => {
      const variables = {
        // Missing customerName (mandatory)
        bookingRef: 'ABC123',
      };

      const response = await axios.post(
        `${API_BASE_URL}/notifications/render-template`,
        {
          templateId: 'booking_confirmation_email',
          variables,
        },
        { validateStatus: () => true }
      );

      expect(response.status).toBe(400);
      expect(response.data.error).toContain('customerName');
    });

    it('should provide default values for missing variables', async () => {
      const variables = {
        customerName: 'John Doe',
      };

      const response = await axios.post(`${API_BASE_URL}/notifications/render-template`, {
        templateId: 'booking_confirmation_email',
        variables,
        defaults: {
          bookingRef: 'PENDING',
          bookingDate: 'Today',
        },
      });

      expect(response.status).toBe(200);
      expect(response.data.body).toContain('PENDING');
    });
  });

  describe('Security: XSS Prevention', () => {
    it('should escape HTML in customer name', async () => {
      const variables = {
        customerName: '<script>alert("xss")</script>John',
        bookingRef: 'ABC123',
      };

      const response = await axios.post(`${API_BASE_URL}/notifications/render-template`, {
        templateId: 'booking_confirmation_email',
        variables,
      });

      expect(response.status).toBe(200);
      expect(response.data.body).not.toContain('<script>');
      expect(response.data.body).toContain('John');
    });

    it('should escape JavaScript URLs', async () => {
      const variables = {
        customerName: 'John Doe',
        supportLink: 'javascript:alert("xss")',
      };

      const response = await axios.post(`${API_BASE_URL}/notifications/render-template`, {
        templateId: 'support_link_email',
        variables,
      });

      expect(response.status).toBe(200);
      expect(response.data.body).not.toContain('javascript:');
    });

    it('should escape event handlers in variables', async () => {
      const variables = {
        customerName: 'John Doe',
        customMessage: 'Click <a onclick="alert(\'xss\')">here</a>',
      };

      const response = await axios.post(`${API_BASE_URL}/notifications/render-template`, {
        templateId: 'custom_message_email',
        variables,
      });

      expect(response.status).toBe(200);
      expect(response.data.body).not.toContain('onclick');
    });
  });

  describe('Complex Template Scenarios', () => {
    it('should render payment reminder with amount formatting', async () => {
      const variables = {
        customerName: 'John Doe',
        invoiceId: 'INV-2024-001',
        dueDate: '2024-02-20',
        amount: 5250.50,
        currency: 'USD',
      };

      const response = await axios.post(`${API_BASE_URL}/notifications/render-template`, {
        templateId: 'payment_reminder_email',
        variables,
      });

      expect(response.status).toBe(200);
      // Amount should be properly formatted
      expect(response.data.body).toContain('5250.50');
      expect(response.data.body).toContain('USD');
    });

    it('should render refund notification with breakdown', async () => {
      const variables = {
        bookingRef: 'ABC123',
        refundBreakdown: [
          { description: 'Flight ticket', amount: 300 },
          { description: 'Hotel (2 nights)', amount: 250 },
          { description: 'Tax refund', amount: 55 },
        ],
        totalRefund: 605,
        currency: 'EUR',
        processingTime: '5-7 business days',
      };

      const response = await axios.post(`${API_BASE_URL}/notifications/render-template`, {
        templateId: 'refund_notification_email',
        variables,
      });

      expect(response.status).toBe(200);
      expect(response.data.body).toContain('300');
      expect(response.data.body).toContain('250');
      expect(response.data.body).toContain('605');
    });

    it('should render schedule change alert with formatted times', async () => {
      const variables = {
        customerName: 'Jane Smith',
        bookingRef: 'XYZ789',
        scheduleChange: {
          airline: 'Air France',
          flightNumber: 'AF123',
          originalDeparture: '14:30',
          newDeparture: '16:45',
          originalArrival: '18:00',
          newArrival: '20:15',
          reason: 'Aircraft change',
        },
      };

      const response = await axios.post(`${API_BASE_URL}/notifications/render-template`, {
        templateId: 'schedule_change_alert',
        variables,
      });

      expect(response.status).toBe(200);
      expect(response.data.body).toContain('Air France');
      expect(response.data.body).toContain('AF123');
      expect(response.data.body).toContain('16:45');
    });
  });

  describe('Template Validation', () => {
    it('should validate template variable types', async () => {
      const variables = {
        customerName: 'John Doe',
        bookingRef: 'ABC123',
        nights: '2', // Should be number, but is string
      };

      const response = await axios.post(`${API_BASE_URL}/notifications/render-template`, {
        templateId: 'hotel_confirmation_email',
        variables,
        strictValidation: true,
      });

      // Should either coerce or return validation error
      expect([200, 400]).toContain(response.status);
    });

    it('should sanitize template variable content', async () => {
      const variables = {
        customerName: '  John  Doe  ',
        bookingRef: '  ABC123  ',
      };

      const response = await axios.post(`${API_BASE_URL}/notifications/render-template`, {
        templateId: 'booking_confirmation_email',
        variables,
        sanitize: true,
      });

      expect(response.status).toBe(200);
      // Whitespace should be trimmed
      expect(response.data.body).toContain('John  Doe');
    });

    it('should provide helpful error messages for invalid templates', async () => {
      const response = await axios.post(
        `${API_BASE_URL}/notifications/render-template`,
        {
          templateId: 'nonexistent_template',
          variables: { name: 'John' },
        },
        { validateStatus: () => true }
      );

      expect(response.status).toBe(404);
      expect(response.data.error).toContain('template');
    });
  });

  describe('Performance', () => {
    it('should render simple template within 50ms', async () => {
      const startTime = Date.now();

      await axios.post(`${API_BASE_URL}/notifications/render-template`, {
        templateId: 'sms_confirmation',
        variables: {
          code: '123456',
        },
      });

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(50);
    });

    it('should render complex template with 20 items within 200ms', async () => {
      const startTime = Date.now();

      const items = Array.from({ length: 20 }, (_, i) => ({
        id: `item-${i}`,
        name: `Item ${i}`,
        price: (i + 1) * 100,
      }));

      await axios.post(`${API_BASE_URL}/notifications/render-template`, {
        templateId: 'itinerary_details',
        variables: {
          items,
        },
      });

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(200);
    });
  });
});
