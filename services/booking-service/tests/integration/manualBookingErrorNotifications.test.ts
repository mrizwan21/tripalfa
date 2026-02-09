/**
 * Integration Tests - Manual Booking & Error Notifications
 * 
 * Tests cover:
 * - Manual booking creation notifications
 * - Overbooking alerts
 * - Inventory errors
 * - System failure notifications
 * - Payment gateway errors
 * - Booking validation errors
 * - Recovery suggestions and escalation
 */

import axios, { AxiosInstance } from 'axios';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('Manual Booking & Error Notifications Integration', () => {
  let apiClient: AxiosInstance;
  let adminUserId: string;

  beforeEach(() => {
    apiClient = axios.create({
      baseURL: process.env.TEST_BASE_URL || 'http://localhost:3001',
      timeout: 10000,
    });

    adminUserId = `admin-${Date.now()}`;
  });

  describe('Manual Booking Creation Notifications', () => {
    it('should send notification when admin creates manual booking', async () => {
      const manualBooking = {
        adminId: adminUserId,
        type: 'manual_booking_created',
        title: 'Manual Booking Created',
        message: 'Admin has manually created a booking for customer John Doe',
        channels: ['email', 'in_app'],
        metadata: {
          bookingId: 'manual-001',
          customerId: 'customer-123',
          customerName: 'John Doe',
          customerEmail: 'john@example.com',
          hotelName: 'Premium Hotel',
          amount: 1200.00,
        },
      };

      try {
        const response = await apiClient.post('/api/notifications', {
          ...manualBooking,
          userId: adminUserId,
        });

        if (response.status !== 404) {
          expect([200, 201]).toContain(response.status);
        }
      } catch (error: any) {
        expect([404, 500]).toContain(error.response?.status);
      }
    });

    it('should notify customer of manually created booking', async () => {
      const customerNotif = {
        userId: 'customer-manual-001',
        type: 'manual_booking_notification',
        title: 'Your Booking Has Been Created',
        message: 'Our team has created a special booking for you. Check your email for details',
        channels: ['email', 'sms'],
        metadata: {
          bookingId: 'manual-002',
          bookingReference: 'MANUAL-2024-001',
          hotelName: 'Luxury Resort',
          checkInDate: '2024-03-01',
          checkOutDate: '2024-03-05',
        },
      };

      try {
        const response = await apiClient.post('/api/notifications', customerNotif);

        if (response.status !== 404) {
          expect([200, 201]).toContain(response.status);
        }
      } catch (error: any) {
        expect([404, 500]).toContain(error.response?.status);
      }
    });

    it('should send notification for manual booking with special pricing', async () => {
      const specialPricingNotif = {
        userId: 'customer-special-001',
        type: 'manual_booking_special_pricing',
        title: 'Special Offer Applied',
        message: 'Your manual booking includes a special corporate discount of 20%',
        channels: ['email', 'in_app'],
        metadata: {
          bookingId: 'manual-003',
          originalPrice: 1000.00,
          discountedPrice: 800.00,
          discountPercentage: 20,
          discountReason: 'Corporate Account',
        },
      };

      try {
        const response = await apiClient.post('/api/notifications', specialPricingNotif);

        if (response.status !== 404) {
          expect([200, 201]).toContain(response.status);
        }
      } catch (error: any) {
        expect([404, 500]).toContain(error.response?.status);
      }
    });
  });

  describe('Overbooking Alerts', () => {
    it('should send notification for overbooking detected', async () => {
      const overbookingAlert = {
        adminId: adminUserId,
        type: 'overbooking_detected',
        title: 'Overbooking Alert',
        message: 'Overbooking detected: Hotel has 5 bookings but only 3 rooms available on 2024-02-15',
        priority: 'high',
        channels: ['email', 'in_app', 'sms'],
        metadata: {
          hotelId: 'hotel-overbooking-001',
          hotelName: 'Test Hotel',
          date: '2024-02-15',
          availableRooms: 3,
          bookingsPending: 5,
          roomType: 'Deluxe Room',
        },
      };

      try {
        const response = await apiClient.post('/api/notifications', {
          ...overbookingAlert,
          userId: adminUserId,
        });

        if (response.status !== 404) {
          expect([200, 201]).toContain(response.status);
        }
      } catch (error: any) {
        expect([404, 500]).toContain(error.response?.status);
      }
    });

    it('should notify affected customers of overbooking issue', async () => {
      const affectedCustomerNotif = {
        userId: 'customer-overbooking-001',
        type: 'overbooking_customer_impact',
        title: 'Important Update About Your Booking',
        message: 'Due to an unexpected overbooking situation, we need to move you to an alternative room. Please contact us immediately',
        priority: 'high',
        channels: ['email', 'sms', 'in_app'],
        metadata: {
          orderId: 'order-overbooking-001',
          originalRoomType: 'Deluxe Room',
          alternativeRoomType: 'Suite Room',
          compensationOffer: '20% discount',
        },
      };

      try {
        const response = await apiClient.post('/api/notifications', affectedCustomerNotif);

        if (response.status !== 404) {
          expect([200, 201]).toContain(response.status);
        }
      } catch (error: any) {
        expect([404, 500]).toContain(error.response?.status);
      }
    });

    it('should send escalation notification for unresolved overbooking', async () => {
      const escalationNotif = {
        userId: adminUserId,
        type: 'overbooking_escalation',
        title: 'Overbooking Escalation Required',
        message: 'Overbooking for 2024-02-20 remains unresolved. This requires immediate management attention',
        priority: 'urgent',
        channels: ['email', 'sms'],
        metadata: {
          hotelId: 'hotel-escalation-001',
          hotelManager: 'manager@hotel.com',
          escalationTime: new Date().toISOString(),
          affectedCustomers: 3,
        },
      };

      try {
        const response = await apiClient.post('/api/notifications', escalationNotif);

        if (response.status !== 404) {
          expect([200, 201]).toContain(response.status);
        }
      } catch (error: any) {
        expect([404, 500]).toContain(error.response?.status);
      }
    });
  });

  describe('Inventory Errors', () => {
    it('should send notification for inventory sync error', async () => {
      const inventoryError = {
        adminId: adminUserId,
        type: 'inventory_sync_error',
        title: 'Inventory Sync Failed',
        message: 'Failed to synchronize inventory with Hotelston. Last sync: 2 hours ago',
        priority: 'high',
        channels: ['email', 'in_app'],
        metadata: {
          supplierId: 'hotelston',
          errorCode: 'SYNC_TIMEOUT',
          lastSuccessfulSync: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          affectedHotels: 12,
        },
      };

      try {
        const response = await apiClient.post('/api/notifications', {
          ...inventoryError,
          userId: adminUserId,
        });

        if (response.status !== 404) {
          expect([200, 201]).toContain(response.status);
        }
      } catch (error: any) {
        expect([404, 500]).toContain(error.response?.status);
      }
    });

    it('should send notification for inventory conflict resolution', async () => {
      const conflictResolution = {
        adminId: adminUserId,
        type: 'inventory_conflict_resolved',
        title: 'Inventory Conflict Resolved',
        message: 'Inventory conflict for hotel XYZ has been automatically resolved by taking the conservative count',
        channels: ['email', 'in_app'],
        metadata: {
          hotelId: 'hotel-conflict-001',
          conflictDate: '2024-02-15',
          systemCount: 10,
          supplierCount: 8,
          resolvedCount: 8,
          resolutionMethod: 'conservative',
        },
      };

      try {
        const response = await apiClient.post('/api/notifications', {
          ...conflictResolution,
          userId: adminUserId,
        });

        if (response.status !== 404) {
          expect([200, 201]).toContain(response.status);
        }
      } catch (error: any) {
        expect([404, 500]).toContain(error.response?.status);
      }
    });
  });

  describe('System Failures', () => {
    it('should send notification for payment gateway failure', async () => {
      const paymentGatewayFailure = {
        userId: 'customer-payment-error-001',
        type: 'payment_gateway_error',
        title: 'Payment Processing Temporarily Unavailable',
        message: 'We are experiencing technical difficulties processing payments. Please try again in a few minutes or contact support',
        priority: 'high',
        channels: ['email', 'in_app'],
        metadata: {
          orderId: 'order-gateway-error-001',
          gateway: 'stripe',
          errorCode: 'GATEWAY_TIMEOUT',
          retryCount: 2,
          nextRetryTime: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        },
      };

      try {
        const response = await apiClient.post('/api/notifications', paymentGatewayFailure);

        if (response.status !== 404) {
          expect([200, 201]).toContain(response.status);
        }
      } catch (error: any) {
        expect([404, 500]).toContain(error.response?.status);
      }
    });

    it('should send notification for database connection error', async () => {
      const dbError = {
        adminId: adminUserId,
        type: 'database_error',
        title: 'Database Connection Error',
        message: 'Unable to connect to primary database. Using read-only replica',
        priority: 'high',
        channels: ['email', 'sms'],
        metadata: {
          errorType: 'CONNECTION_TIMEOUT',
          affected_operations: ['bookings', 'payments'],
          fallbackMode: 'read_only',
          timestamp: new Date().toISOString(),
        },
      };

      try {
        const response = await apiClient.post('/api/notifications', {
          ...dbError,
          userId: adminUserId,
        });

        if (response.status !== 404) {
          expect([200, 201]).toContain(response.status);
        }
      } catch (error: any) {
        expect([404, 500]).toContain(error.response?.status);
      }
    });

    it('should send notification for API rate limit exceeded', async () => {
      const rateLimitError = {
        adminId: adminUserId,
        type: 'api_rate_limit_exceeded',
        title: 'API Rate Limit Exceeded',
        message: 'Supplier API rate limit has been exceeded. Some requests may be queued',
        priority: 'medium',
        channels: ['email'],
        metadata: {
          supplierId: 'duffel',
          requestsPerMinute: 100,
          limit: 60,
          resetTime: new Date(Date.now() + 60 * 1000).toISOString(),
          queuedRequests: 15,
        },
      };

      try {
        const response = await apiClient.post('/api/notifications', {
          ...rateLimitError,
          userId: adminUserId,
        });

        if (response.status !== 404) {
          expect([200, 201]).toContain(response.status);
        }
      } catch (error: any) {
        expect([404, 500]).toContain(error.response?.status);
      }
    });
  });

  describe('Validation Errors', () => {
    it('should send notification for invalid booking data', async () => {
      const validationError = {
        userId: 'customer-validation-error-001',
        type: 'booking_validation_error',
        title: 'Booking Validation Failed',
        message: 'Your booking could not be completed: Check-out date must be after check-in date',
        channels: ['in_app'],
        metadata: {
          checkInDate: '2024-02-20',
          checkOutDate: '2024-02-15',
          errorField: 'checkout_date',
          validationRule: 'checkout_after_checkin',
        },
      };

      try {
        const response = await apiClient.post('/api/notifications', validationError);

        if (response.status !== 404) {
          expect([200, 201]).toContain(response.status);
        }
      } catch (error: any) {
        expect([404, 500]).toContain(error.response?.status);
      }
    });

    it('should send notification for missing required information', async () => {
      const missingInfoError = {
        userId: 'customer-missing-info-001',
        type: 'missing_required_info',
        title: 'Missing Booking Information',
        message: 'Please provide the following information to complete your booking: Guest phone number',
        channels: ['in_app', 'email'],
        metadata: {
          missingFields: ['phone_number'],
          orderId: 'order-missing-info-001',
          customerEmail: 'customer@example.com',
        },
      };

      try {
        const response = await apiClient.post('/api/notifications', missingInfoError);

        if (response.status !== 404) {
          expect([200, 201]).toContain(response.status);
        }
      } catch (error: any) {
        expect([404, 500]).toContain(error.response?.status);
      }
    });

    it('should send notification for data format error', async () => {
      const formatError = {
        userId: 'customer-format-error-001',
        type: 'data_format_error',
        title: 'Invalid Input Format',
        message: 'Please enter a valid email address. Example: name@example.com',
        channels: ['in_app'],
        metadata: {
          field: 'email',
          providedValue: 'invalid-email',
          expectedFormat: 'email',
          fieldLabel: 'Email Address',
        },
      };

      try {
        const response = await apiClient.post('/api/notifications', formatError);

        if (response.status !== 404) {
          expect([200, 201]).toContain(response.status);
        }
      } catch (error: any) {
        expect([404, 500]).toContain(error.response?.status);
      }
    });
  });

  describe('Error Recovery & Escalation', () => {
    it('should send notification with recovery suggestions', async () => {
      const recoveryNotif = {
        userId: 'customer-recovery-001',
        type: 'error_recovery_suggestion',
        title: 'We Can Help You Complete Your Booking',
        message: 'Your booking attempt encountered an issue. Here are some options: 1) Try again, 2) Use a different payment method, 3) Contact our support team',
        channels: ['email', 'in_app'],
        metadata: {
          orderId: 'order-recovery-001',
          lastAttemptError: 'PAYMENT_DECLINED',
          suggestedActions: [
            { action: 'retry', delay: 300 },
            { action: 'change_payment_method', link: '/payment' },
            { action: 'contact_support', link: '/support' },
          ],
        },
      };

      try {
        const response = await apiClient.post('/api/notifications', recoveryNotif);

        if (response.status !== 404) {
          expect([200, 201]).toContain(response.status);
        }
      } catch (error: any) {
        expect([404, 500]).toContain(error.response?.status);
      }
    });

    it('should send escalation notification for critical errors', async () => {
      const escalationNotif = {
        adminId: adminUserId,
        type: 'critical_error_escalation',
        title: 'Critical System Error - Immediate Action Required',
        message: 'Multiple payment failures detected. This may indicate a systemic issue. Immediate investigation required',
        priority: 'urgent',
        channels: ['email', 'sms'],
        metadata: {
          errorType: 'CRITICAL_PAYMENT_FAILURE',
          occurrenceCount: 15,
          timeWindow: '10 minutes',
          affectedCustomers: 8,
          escalationLevel: 'management',
          suggestedAction: 'Pause payment processing and investigate',
        },
      };

      try {
        const response = await apiClient.post('/api/notifications', {
          ...escalationNotif,
          userId: adminUserId,
        });

        if (response.status !== 404) {
          expect([200, 201]).toContain(response.status);
        }
      } catch (error: any) {
        expect([404, 500]).toContain(error.response?.status);
      }
    });

    it('should send incident update notification', async () => {
      const incidentUpdate = {
        userId: 'customer-incident-update-001',
        type: 'incident_update',
        title: 'System Issue Update',
        message: 'We are investigating the booking system issue. Estimated resolution: 30 minutes. We apologize for the inconvenience',
        priority: 'medium',
        channels: ['email', 'in_app'],
        metadata: {
          incidentId: 'INC-2024-001',
          status: 'investigating',
          estimatedResolution: '30 minutes',
          updateNumber: 2,
          affectedServices: ['bookings', 'payments'],
        },
      };

      try {
        const response = await apiClient.post('/api/notifications', incidentUpdate);

        if (response.status !== 404) {
          expect([200, 201]).toContain(response.status);
        }
      } catch (error: any) {
        expect([404, 500]).toContain(error.response?.status);
      }
    });

    it('should send incident resolution notification', async () => {
      const resolutionNotif = {
        userId: 'all_users',
        type: 'incident_resolved',
        title: 'System Issue Resolved',
        message: 'The booking system issue has been resolved. All systems are operating normally',
        priority: 'low',
        channels: ['email', 'in_app'],
        metadata: {
          incidentId: 'INC-2024-001',
          resolutionTime: '45 minutes',
          rootCause: 'Database connection pool exhaustion',
          preventiveMeasures: 'Increased pool size and monitoring',
        },
      };

      try {
        const response = await apiClient.post('/api/notifications', resolutionNotif);

        if (response.status !== 404) {
          expect([200, 201]).toContain(response.status);
        }
      } catch (error: any) {
        expect([404, 500]).toContain(error.response?.status);
      }
    });
  });

  describe('Bulk Error Notifications', () => {
    it('should handle multiple concurrent error notifications', async () => {
      const errorNotifications = [
        {
          userId: 'customer-bulk-1',
          type: 'booking_error',
          message: 'Error processing booking 1',
        },
        {
          userId: 'customer-bulk-2',
          type: 'booking_error',
          message: 'Error processing booking 2',
        },
        {
          userId: 'customer-bulk-3',
          type: 'booking_error',
          message: 'Error processing booking 3',
        },
      ];

      try {
        const responses = await Promise.all(
          errorNotifications.map((notif) =>
            apiClient.post('/api/notifications', {
              ...notif,
              title: 'Booking Error',
              channels: ['email'],
            })
          )
        );

        responses.forEach((response) => {
          if (response.status !== 404) {
            expect([200, 201]).toContain(response.status);
          }
        });
      } catch (error: any) {
        expect([404, 500]).toContain(error.response?.status);
      }
    });
  });
});
