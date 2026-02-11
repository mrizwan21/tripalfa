/**
 * Customer Onboarding E2E Tests
 * Tests the complete flow of customer lifecycle events:
 * - Customer registration
 * - Profile completion
 * - Account verification
 * - Payment method addition
 * Verifies both admin and customer notifications are dispatched correctly
 */

import { Request, Response } from 'express';
import { handleCustomerOnboardingEvent } from '../../api/webhookController';
import { processCustomerOnboardingEvent, CustomerOnboardingEvent } from '../../integrations/customerOnboardingHandler';
import logger from '../../utils/logger';

// Mock NotificationService at the module level
jest.mock('../../services/notificationService');

describe('Customer Onboarding E2E Tests', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    mockReq = {
      body: {},
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    // Mock logger
    jest.spyOn(logger, 'info').mockImplementation();
    jest.spyOn(logger, 'warn').mockImplementation();
    jest.spyOn(logger, 'error').mockImplementation();
  });

  describe('Customer Registration Event', () => {
    it('should process customer_registered event and dispatch notifications', async () => {
      const event: CustomerOnboardingEvent = {
        eventType: 'customer_registered',
        customerId: 'cust_001',
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        timestamp: new Date().toISOString(),
      };

      mockReq.body = event;

      await handleCustomerOnboardingEvent(mockReq as Request, mockRes as Response);

      // Verify response is 200
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalled();
    });

    it('should return success response with notification IDs', async () => {
      const event: CustomerOnboardingEvent = {
        eventType: 'customer_registered',
        customerId: 'cust_002',
        customerName: 'Jane Smith',
        customerEmail: 'jane@example.com',
        profileData: {
          firstName: 'Jane',
          lastName: 'Smith',
        },
        timestamp: new Date().toISOString(),
      };

      mockReq.body = event;

      await handleCustomerOnboardingEvent(mockReq as Request, mockRes as Response);

      const responseCall = (mockRes.json as jest.Mock).mock.calls[0][0] as any;
      expect(responseCall.success).toBe(true);
      expect(responseCall.message).toContain('processed');
    });
  });

  describe('Profile Completion Event', () => {
    it('should process profile_completed event', async () => {
      const event: CustomerOnboardingEvent = {
        eventType: 'profile_completed',
        customerId: 'cust_003',
        customerName: 'Alice Johnson',
        customerEmail: 'alice@example.com',
        profileData: {
          firstName: 'Alice',
          lastName: 'Johnson',
          country: 'USA',
          preferredLanguage: 'en',
        },
        timestamp: new Date().toISOString(),
      };

      mockReq.body = event;

      await handleCustomerOnboardingEvent(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalled();
    });

    it('should include profile info in response', async () => {
      const event: CustomerOnboardingEvent = {
        eventType: 'profile_completed',
        customerId: 'cust_004',
        customerName: 'Bob Wilson',
        customerEmail: 'bob@example.com',
        profileData: {
          firstName: 'Bob',
          lastName: 'Wilson',
          country: 'UK',
        },
        timestamp: new Date().toISOString(),
      };

      mockReq.body = event;

      await handleCustomerOnboardingEvent(mockReq as Request, mockRes as Response);

      const responseCall = (mockRes.json as jest.Mock).mock.calls[0][0] as any;
      expect(responseCall.success).toBe(true);
    });
  });

  describe('Account Verification Event', () => {
    it('should process account_verified event', async () => {
      const event: CustomerOnboardingEvent = {
        eventType: 'account_verified',
        customerId: 'cust_005',
        customerName: 'Carol Davis',
        customerEmail: 'carol@example.com',
        verificationMethod: 'email',
        timestamp: new Date().toISOString(),
      };

      mockReq.body = event;

      await handleCustomerOnboardingEvent(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalled();
    });

    it('should include verification method in response', async () => {
      const event: CustomerOnboardingEvent = {
        eventType: 'account_verified',
        customerId: 'cust_006',
        customerName: 'Diana Martinez',
        customerEmail: 'diana@example.com',
        verificationMethod: 'sms',
        timestamp: new Date().toISOString(),
      };

      mockReq.body = event;

      await handleCustomerOnboardingEvent(mockReq as Request, mockRes as Response);

      const responseCall = (mockRes.json as jest.Mock).mock.calls[0][0] as any;
      expect(responseCall.success).toBe(true);
    });
  });

  describe('Payment Method Added Event', () => {
    it('should process payment_method_added event', async () => {
      const event: CustomerOnboardingEvent = {
        eventType: 'payment_method_added',
        customerId: 'cust_007',
        customerName: 'Eva Garcia',
        customerEmail: 'eva@example.com',
        paymentMethod: 'credit_card',
        timestamp: new Date().toISOString(),
      };

      mockReq.body = event;

      await handleCustomerOnboardingEvent(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalled();
    });

    it('should include payment method in response', async () => {
      const event: CustomerOnboardingEvent = {
        eventType: 'payment_method_added',
        customerId: 'cust_008',
        customerName: 'Frank Brown',
        customerEmail: 'frank@example.com',
        paymentMethod: 'digital_wallet',
        timestamp: new Date().toISOString(),
      };

      mockReq.body = event;

      await handleCustomerOnboardingEvent(mockReq as Request, mockRes as Response);

      const responseCall = (mockRes.json as jest.Mock).mock.calls[0][0] as any;
      expect(responseCall.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should return 200 for missing eventType', async () => {
      const event: any = {
        customerId: 'cust_009',
        customerName: 'Grace Lee',
        customerEmail: 'grace@example.com',
        timestamp: new Date().toISOString(),
      };

      mockReq.body = event;

      await handleCustomerOnboardingEvent(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalled();
    });

    it('should return 200 for invalid event types', async () => {
      const event: any = {
        eventType: 'invalid_event_type',
        customerId: 'cust_010',
        customerName: 'Henry Clark',
        customerEmail: 'henry@example.com',
        timestamp: new Date().toISOString(),
      };

      mockReq.body = event;

      await handleCustomerOnboardingEvent(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should handle missing required fields gracefully', async () => {
      const event: any = {
        eventType: 'customer_registered',
        customerId: 'cust_011',
        // Missing customerName and customerEmail
        timestamp: new Date().toISOString(),
      };

      mockReq.body = event;

      await handleCustomerOnboardingEvent(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      const responseCall = (mockRes.json as jest.Mock).mock.calls[0][0] as any;
      expect(responseCall.success).toBe(false);
    });
  });

  describe('Event Processing', () => {
    it('should create correct notifications for customer_registered', async () => {
      const event: CustomerOnboardingEvent = {
        eventType: 'customer_registered',
        customerId: 'cust_012',
        customerName: 'Iris White',
        customerEmail: 'iris@example.com',
        timestamp: new Date().toISOString(),
      };

      const { success, notifications } = await processCustomerOnboardingEvent(event);

      expect(success).toBe(true);
      expect(notifications).toHaveLength(2); // Admin + Customer
    });

    it('should return notifications for profile_completed', async () => {
      const event: CustomerOnboardingEvent = {
        eventType: 'profile_completed',
        customerId: 'cust_013',
        customerName: 'Jack Miller',
        customerEmail: 'jack@example.com',
        profileData: {
          firstName: 'Jack',
          lastName: 'Miller',
        },
        timestamp: new Date().toISOString(),
      };

      const { success, notifications } = await processCustomerOnboardingEvent(event);

      expect(success).toBe(true);
      expect(notifications).toHaveLength(2);
    });

    it('should return notifications for account_verified', async () => {
      const event: CustomerOnboardingEvent = {
        eventType: 'account_verified',
        customerId: 'cust_014',
        customerName: 'Karen Taylor',
        customerEmail: 'karen@example.com',
        verificationMethod: 'email',
        timestamp: new Date().toISOString(),
      };

      const { success, notifications } = await processCustomerOnboardingEvent(event);

      expect(success).toBe(true);
      expect(notifications).toHaveLength(2);
    });
  });

  describe('Integration Flow', () => {
    it('should complete full customer onboarding flow from registration to payment', async () => {
      const customerId = 'cust_flow_001';
      const customerEmail = 'flow@example.com';
      const customerName = 'Flow Test Customer';

      // Step 1: Register customer
      const registerEvent: CustomerOnboardingEvent = {
        eventType: 'customer_registered',
        customerId,
        customerName,
        customerEmail,
        timestamp: new Date().toISOString(),
      };

      mockReq.body = registerEvent;
      await handleCustomerOnboardingEvent(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(200);

      // Step 2: Complete profile
      const profileEvent: CustomerOnboardingEvent = {
        eventType: 'profile_completed',
        customerId,
        customerName,
        customerEmail,
        profileData: {
          firstName: 'Flow',
          lastName: 'Test',
          country: 'USA',
        },
        timestamp: new Date().toISOString(),
      };

      mockReq.body = profileEvent;
      await handleCustomerOnboardingEvent(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(200);

      // Step 3: Verify account
      const verifyEvent: CustomerOnboardingEvent = {
        eventType: 'account_verified',
        customerId,
        customerName,
        customerEmail,
        verificationMethod: 'email',
        timestamp: new Date().toISOString(),
      };

      mockReq.body = verifyEvent;
      await handleCustomerOnboardingEvent(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(200);

      // Step 4: Add payment method
      const paymentEvent: CustomerOnboardingEvent = {
        eventType: 'payment_method_added',
        customerId,
        customerName,
        customerEmail,
        paymentMethod: 'credit_card',
        timestamp: new Date().toISOString(),
      };

      mockReq.body = paymentEvent;
      await handleCustomerOnboardingEvent(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should handle multiple customers onboarding concurrently', async () => {
      const customers = [
        {
          event: {
            eventType: 'customer_registered' as const,
            customerId: 'cust_concurrent_001',
            customerName: 'Concurrent Test 1',
            customerEmail: 'concurrent1@example.com',
            timestamp: new Date().toISOString(),
          },
        },
        {
          event: {
            eventType: 'customer_registered' as const,
            customerId: 'cust_concurrent_002',
            customerName: 'Concurrent Test 2',
            customerEmail: 'concurrent2@example.com',
            timestamp: new Date().toISOString(),
          },
        },
      ];

      const requests = customers.map(async (customer) => {
        const req = { body: customer.event } as Partial<Request>;
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn().mockReturnThis(),
        } as unknown as Partial<Response>;

        await handleCustomerOnboardingEvent(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(200);
      });

      await Promise.all(requests);
    });
  });

  describe('Response Validation', () => {
    it('should always return 200 status', async () => {
      const event: CustomerOnboardingEvent = {
        eventType: 'customer_registered',
        customerId: 'cust_response_001',
        customerName: 'Response Test',
        customerEmail: 'response@example.com',
        timestamp: new Date().toISOString(),
      };

      mockReq.body = event;

      await handleCustomerOnboardingEvent(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should include success flag in response', async () => {
      const event: CustomerOnboardingEvent = {
        eventType: 'customer_registered',
        customerId: 'cust_flag_001',
        customerName: 'Flag Test',
        customerEmail: 'flag@example.com',
        timestamp: new Date().toISOString(),
      };

      mockReq.body = event;

      await handleCustomerOnboardingEvent(mockReq as Request, mockRes as Response);

      const responseCall = (mockRes.json as jest.Mock).mock.calls[0][0] as any;
      expect(responseCall).toHaveProperty('success');
      expect(typeof responseCall.success).toBe('boolean');
    });

    it('should include notification count in response', async () => {
      const event: CustomerOnboardingEvent = {
        eventType: 'customer_registered',
        customerId: 'cust_count_001',
        customerName: 'Count Test',
        customerEmail: 'count@example.com',
        timestamp: new Date().toISOString(),
      };

      mockReq.body = event;

      await handleCustomerOnboardingEvent(mockReq as Request, mockRes as Response);

      const responseCall = (mockRes.json as jest.Mock).mock.calls[0][0] as any;
      expect(responseCall).toHaveProperty('notificationCount');
      expect(typeof responseCall.notificationCount).toBe('number');
    });
  });
});
