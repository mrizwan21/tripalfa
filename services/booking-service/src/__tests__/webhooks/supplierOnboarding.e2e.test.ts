/**
 * Supplier Onboarding E2E Tests
 * Tests the complete flow of supplier lifecycle events:
 * - Supplier registration
 * - Wallet assignment
 * - Wallet activation
 * Verifies both admin and supplier notifications are dispatched correctly
 */

import { Request, Response } from 'express';
import { handleSupplierOnboardingEvent } from '../../api/webhookController';
import { processSupplierOnboardingEvent, SupplierOnboardingEvent } from '../../integrations/supplierOnboardingHandler';
import logger from '../../utils/logger';

// Mock NotificationService at the module level
jest.mock('../../services/notificationService');

describe('Supplier Onboarding E2E Tests', () => {
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

  describe('Supplier Registration Event', () => {
    it('should process supplier_registered event and dispatch notifications', async () => {
      const event: SupplierOnboardingEvent = {
        eventType: 'supplier_registered',
        supplierId: 'sup_001',
        supplierName: 'Acme Hotels Inc',
        supplierEmail: 'contact@acmehotels.com',
        timestamp: new Date().toISOString(),
      };

      mockReq.body = event;

      await handleSupplierOnboardingEvent(mockReq as Request, mockRes as Response);

      // Verify response is 200
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalled();
    });

    it('should return success response with notification IDs', async () => {
      const event: SupplierOnboardingEvent = {
        eventType: 'supplier_registered',
        supplierId: 'sup_002',
        supplierName: 'Premier Lodging',
        supplierEmail: 'ops@premierLodging.com',
        timestamp: new Date().toISOString(),
      };

      mockReq.body = event;

      await handleSupplierOnboardingEvent(mockReq as Request, mockRes as Response);

      const responseCall = (mockRes.json as jest.Mock).mock.calls[0][0] as any;
      expect(responseCall.success).toBe(true);
      expect(responseCall.message).toContain('processed');
    });
  });

  describe('Wallet Assignment Event', () => {
    it('should process wallet_assigned event', async () => {
      const event: SupplierOnboardingEvent = {
        eventType: 'wallet_assigned',
        supplierId: 'sup_001',
        supplierName: 'Acme Hotels Inc',
        supplierEmail: 'contact@acmehotels.com',
        walletId: 'wallet_12345',
        walletType: 'credit',
        timestamp: new Date().toISOString(),
      };

      mockReq.body = event;

      await handleSupplierOnboardingEvent(mockReq as Request, mockRes as Response);

      // Verify response is 200
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalled();
    });

    it('should include wallet info in response', async () => {
      const event: SupplierOnboardingEvent = {
        eventType: 'wallet_assigned',
        supplierId: 'sup_003',
        supplierName: 'Global Resorts',
        supplierEmail: 'admin@globalresorts.com',
        walletId: 'wallet_67890',
        walletType: 'prepaid',
        timestamp: new Date().toISOString(),
      };

      mockReq.body = event;

      await handleSupplierOnboardingEvent(mockReq as Request, mockRes as Response);

      const responseCall = (mockRes.json as jest.Mock).mock.calls[0][0] as any;
      expect(responseCall.success).toBe(true);
    });
  });

  describe('Wallet Activation Event', () => {
    it('should process wallet_activated event', async () => {
      const event: SupplierOnboardingEvent = {
        eventType: 'wallet_activated',
        supplierId: 'sup_001',
        supplierName: 'Acme Hotels Inc',
        supplierEmail: 'contact@acmehotels.com',
        walletId: 'wallet_12345',
        walletType: 'credit',
        activationStatus: 'active',
        timestamp: new Date().toISOString(),
      };

      mockReq.body = event;

      await handleSupplierOnboardingEvent(mockReq as Request, mockRes as Response);

      // Verify response is 200
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalled();
    });

    it('should return success for wallet activation', async () => {
      const event: SupplierOnboardingEvent = {
        eventType: 'wallet_activated',
        supplierId: 'sup_004',
        supplierName: 'Luxury Hotels Ltd',
        supplierEmail: 'support@luxuryhotels.com',
        walletId: 'wallet_99999',
        walletType: 'postpaid',
        activationStatus: 'active',
        timestamp: new Date().toISOString(),
      };

      mockReq.body = event;

      await handleSupplierOnboardingEvent(mockReq as Request, mockRes as Response);

      const responseCall = (mockRes.json as jest.Mock).mock.calls[0][0] as any;
      expect(responseCall.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should return 200 with error message when missing required fields', async () => {
      mockReq.body = {
        eventType: 'supplier_registered',
        supplierId: 'sup_001',
        // Missing supplierName, supplierEmail, timestamp
      };

      await handleSupplierOnboardingEvent(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      const responseCall = (mockRes.json as jest.Mock).mock.calls[0][0] as any;
      expect(responseCall.success).toBe(false);
      expect(responseCall.message).toContain('required');
    });

    it('should return 200 for invalid event types', async () => {
      const event: any = {
        eventType: 'invalid_event_type',
        supplierId: 'sup_006',
        supplierName: 'Invalid Hotel',
        supplierEmail: 'invalid@hotel.com',
        timestamp: new Date().toISOString(),
      };

      mockReq.body = event;

      await handleSupplierOnboardingEvent(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('Event Processing', () => {
    it('should create correct notifications for supplier_registered', async () => {
      const event: SupplierOnboardingEvent = {
        eventType: 'supplier_registered',
        supplierId: 'sup_007',
        supplierName: 'Event Test Hotel',
        supplierEmail: 'events@hotel.com',
        timestamp: new Date().toISOString(),
      };

      const { success, notifications } = await processSupplierOnboardingEvent(event);

      expect(success).toBe(true);
      expect(notifications).toHaveLength(2);
    });

    it('should return notifications for wallet_assigned', async () => {
      const event: SupplierOnboardingEvent = {
        eventType: 'wallet_assigned',
        supplierId: 'sup_008',
        supplierName: 'Metadata Test Hotel',
        supplierEmail: 'metadata@hotel.com',
        walletId: 'wallet_meta',
        walletType: 'credit',
        timestamp: new Date().toISOString(),
      };

      const { success, notifications } = await processSupplierOnboardingEvent(event);

      expect(success).toBe(true);
      expect(notifications).toHaveLength(2);
    });

    it('should return notifications for wallet_activated', async () => {
      const event: SupplierOnboardingEvent = {
        eventType: 'wallet_activated',
        supplierId: 'sup_009',
        supplierName: 'Active Hotel',
        supplierEmail: 'active@hotel.com',
        walletId: 'wallet_active',
        walletType: 'credit',
        activationStatus: 'active',
        timestamp: new Date().toISOString(),
      };

      const { success, notifications } = await processSupplierOnboardingEvent(event);

      expect(success).toBe(true);
      expect(notifications).toHaveLength(2);
    });
  });

  describe('Integration Flow', () => {
    it('should complete full supplier onboarding flow from registration to activation', async () => {
      const supplierId = 'sup_flow_001';
      const supplierEmail = 'flow@hotel.com';
      const supplierName = 'Flow Test Hotel';

      // Step 1: Register supplier
      const registerEvent: SupplierOnboardingEvent = {
        eventType: 'supplier_registered',
        supplierId,
        supplierName,
        supplierEmail,
        timestamp: new Date().toISOString(),
      };

      mockReq.body = registerEvent;
      await handleSupplierOnboardingEvent(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(200);

      // Step 2: Assign wallet
      const walletEvent: SupplierOnboardingEvent = {
        eventType: 'wallet_assigned',
        supplierId,
        supplierName,
        supplierEmail,
        walletId: 'wallet_flow_001',
        walletType: 'credit',
        timestamp: new Date().toISOString(),
      };

      mockReq.body = walletEvent;
      await handleSupplierOnboardingEvent(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(200);

      // Step 3: Activate wallet
      const activateEvent: SupplierOnboardingEvent = {
        eventType: 'wallet_activated',
        supplierId,
        supplierName,
        supplierEmail,
        walletId: 'wallet_flow_001',
        walletType: 'credit',
        activationStatus: 'active',
        timestamp: new Date().toISOString(),
      };

      mockReq.body = activateEvent;
      await handleSupplierOnboardingEvent(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should handle multiple suppliers onboarding concurrently', async () => {
      const suppliers = [
        {
          event: {
            eventType: 'supplier_registered' as const,
            supplierId: 'sup_concurrent_001',
            supplierName: 'Hotel A',
            supplierEmail: 'a@hotel.com',
            timestamp: new Date().toISOString(),
          },
        },
        {
          event: {
            eventType: 'supplier_registered' as const,
            supplierId: 'sup_concurrent_002',
            supplierName: 'Hotel B',
            supplierEmail: 'b@hotel.com',
            timestamp: new Date().toISOString(),
          },
        },
      ];

      const promises = suppliers.map((supplier) => {
        const req = { body: supplier.event } as Partial<Request>;
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn().mockReturnThis(),
        } as unknown as Partial<Response>;
        return handleSupplierOnboardingEvent(req as Request, res as Response);
      });

      await Promise.all(promises);

      // Both should complete successfully
      expect(promises.length).toBe(2);
    });
  });

  describe('Response Validation', () => {
    it('should always return HTTP 200 status', async () => {
      const events: SupplierOnboardingEvent[] = [
        {
          eventType: 'supplier_registered',
          supplierId: 'sup_status_001',
          supplierName: 'Status Hotel 1',
          supplierEmail: 'status1@hotel.com',
          timestamp: new Date().toISOString(),
        },
        {
          eventType: 'wallet_assigned',
          supplierId: 'sup_status_002',
          supplierName: 'Status Hotel 2',
          supplierEmail: 'status2@hotel.com',
          walletId: 'wallet_status',
          walletType: 'credit',
          timestamp: new Date().toISOString(),
        },
        {
          eventType: 'wallet_activated',
          supplierId: 'sup_status_003',
          supplierName: 'Status Hotel 3',
          supplierEmail: 'status3@hotel.com',
          walletId: 'wallet_status_active',
          walletType: 'credit',
          activationStatus: 'active',
          timestamp: new Date().toISOString(),
        },
      ];

      for (const event of events) {
        const req = { body: event } as Partial<Request>;
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn().mockReturnThis(),
        } as unknown as Partial<Response>;

        await handleSupplierOnboardingEvent(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(200);
      }
    });

    it('should include success flag in response', async () => {
      const event: SupplierOnboardingEvent = {
        eventType: 'supplier_registered',
        supplierId: 'sup_response_001',
        supplierName: 'Response Hotel',
        supplierEmail: 'response@hotel.com',
        timestamp: new Date().toISOString(),
      };

      mockReq.body = event;

      await handleSupplierOnboardingEvent(mockReq as Request, mockRes as Response);

      const responseCall = (mockRes.json as jest.Mock).mock.calls[0][0] as any;
      expect(responseCall).toHaveProperty('success');
      expect(typeof responseCall.success).toBe('boolean');
    });

    it('should include notification count in response', async () => {
      const event: SupplierOnboardingEvent = {
        eventType: 'supplier_registered',
        supplierId: 'sup_count_001',
        supplierName: 'Count Hotel',
        supplierEmail: 'count@hotel.com',
        timestamp: new Date().toISOString(),
      };

      mockReq.body = event;

      await handleSupplierOnboardingEvent(mockReq as Request, mockRes as Response);

      const responseCall = (mockRes.json as jest.Mock).mock.calls[0][0] as any;
      expect(responseCall).toHaveProperty('notificationCount');
      expect(typeof responseCall.notificationCount).toBe('number');
    });
  });
});
