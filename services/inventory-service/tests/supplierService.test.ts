import { describe, it, expect, beforeEach, afterEach, jest } from 'vitest';
import { PrismaClient } from '@prisma/client';
import SupplierOrchestrator from '../src/services/SupplierOrchestrator';
import * as DuffelClient from '../src/services/DuffelClient';
import * as LiteAPIClient from '../src/services/LiteAPIClient';

// Mock Prisma
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    supplier: {
      findMany: jest.fn(),
    },
    pricingRule: {
      findMany: jest.fn(),
    },
  })),
}));

// Mock API clients
jest.mock('../src/services/DuffelClient');
jest.mock('../src/services/LiteAPIClient');

describe('SupplierOrchestrator', () => {
  let orchestrator: SupplierOrchestrator;
  let mockDynamicPrisma: any;
  let mockStaticPrisma: any;

  beforeEach(() => {
    orchestrator = new SupplierOrchestrator();
    mockDynamicPrisma = {
      supplier: { findMany: jest.fn() },
      pricingRule: { findMany: jest.fn() }
    };
    mockStaticPrisma = {
      flightRoute: { findMany: jest.fn() },
      hotel: { findMany: jest.fn() }
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('searchFlights', () => {
    it('should search flights from live API vendors', async () => {
      // Mock supplier with Duffel vendor
      const mockSuppliers = [
        {
          id: '1',
          category: 'flights',
          isActive: true,
          vendor: { code: 'DUFFEL' }
        }
      ];

      mockDynamicPrisma.supplier.findMany.mockResolvedValue(mockSuppliers);
      (DuffelClient.searchFlights as jest.Mock).mockResolvedValue([
        {
          id: 'flight-1',
          airline: 'Test Airline',
          amount: 100,
          currency: 'USD'
        }
      ]);

      const params = {
        origin: 'JFK',
        destination: 'LAX',
        departureDate: '2024-10-25'
      };

      const result = await orchestrator.searchFlights(params);

      expect(mockDynamicPrisma.supplier.findMany).toHaveBeenCalledWith({
        where: {
          isActive: true,
          category: 'flights',
        },
        include: { vendor: true }
      });
      expect(DuffelClient.searchFlights).toHaveBeenCalledWith(params, 'test');
      expect(result).toHaveLength(1);
      expect(result[0].airline).toBe('Test Airline');
    });

    it('should search flights from local database', async () => {
      const mockSuppliers = [
        {
          id: '2',
          category: 'LOCAL',
          isActive: true,
          vendor: null
        }
      ];

      const mockRoutes = [
        {
          id: 1,
          airline: { name: 'Local Airline', iataCode: 'LA' },
          originAirport: { iataCode: 'JFK' },
          destinationAirport: { iataCode: 'LAX' },
          departureTime: new Date('2024-10-25T10:00:00'),
          arrivalTime: new Date('2024-10-25T14:00:00'),
          durationMinutes: 240
        }
      ];

      mockDynamicPrisma.supplier.findMany.mockResolvedValue(mockSuppliers);
      mockStaticPrisma.flightRoute.findMany.mockResolvedValue(mockRoutes);

      const params = {
        origin: 'JFK',
        destination: 'LAX',
        departureDate: '2024-10-25'
      };

      const result = await orchestrator.searchFlights(params);

      expect(mockStaticPrisma.flightRoute.findMany).toHaveBeenCalledWith({
        where: {
          isActive: true,
          originAirport: { iataCode: 'JFK' },
          destinationAirport: { iataCode: 'LAX' }
        },
        include: {
          airline: true,
          originAirport: true,
          destinationAirport: true
        }
      });
      expect(result).toHaveLength(1);
      expect(result[0].airline).toBe('Local Airline');
      expect(result[0].amount).toBe(150); // Static price
    });

    it('should apply pricing rules to flight results', async () => {
      const mockSuppliers = [
        {
          id: '1',
          category: 'flights',
          isActive: true,
          vendor: { code: 'DUFFEL' }
        }
      ];

      const mockRules = [
        {
          name: 'Test Markup',
          markupType: 'PERCENTAGE',
          markupValue: 10,
          priority: 1,
          status: 'ACTIVE'
        }
      ];

      mockDynamicPrisma.supplier.findMany.mockResolvedValue(mockSuppliers);
      mockDynamicPrisma.pricingRule.findMany.mockResolvedValue(mockRules);
      (DuffelClient.searchFlights as jest.Mock).mockResolvedValue([
        {
          id: 'flight-1',
          airline: 'Test Airline',
          amount: 100,
          currency: 'USD'
        }
      ]);

      const params = {
        origin: 'JFK',
        destination: 'LAX',
        departureDate: '2024-10-25'
      };

      const result = await orchestrator.searchFlights(params, { tenantId: 'test-tenant' });

      expect(result).toHaveLength(1);
      expect(result[0].amount).toBe(110); // 100 + 10% markup
      expect(result[0].markupApplied).toBe('Test Markup');
    });

    it('should handle multiple suppliers and merge results', async () => {
      const mockSuppliers = [
        {
          id: '1',
          category: 'flights',
          isActive: true,
          vendor: { code: 'DUFFEL' }
        },
        {
          id: '2',
          category: 'LOCAL',
          isActive: true,
          vendor: null
        }
      ];

      const mockDuffelResults = [
        { id: 'duffel-1', airline: 'Duffel Air', amount: 200, currency: 'USD' }
      ];
      const mockLocalResults = [
        { id: 'local-1', airline: 'Local Air', amount: 150, currency: 'USD' }
      ];

      mockDynamicPrisma.supplier.findMany.mockResolvedValue(mockSuppliers);
      (DuffelClient.searchFlights as jest.Mock).mockResolvedValue(mockDuffelResults);
      mockStaticPrisma.flightRoute.findMany.mockResolvedValue([
        {
          id: 1,
          airline: { name: 'Local Air' },
          originAirport: { iataCode: 'JFK' },
          destinationAirport: { iataCode: 'LAX' },
          departureTime: new Date(),
          arrivalTime: new Date()
        }
      ]);

      const params = {
        origin: 'JFK',
        destination: 'LAX',
        departureDate: '2024-10-25'
      };

      const result = await orchestrator.searchFlights(params);

      expect(result).toHaveLength(2);
      expect(result.some(r => r.airline === 'Duffel Air')).toBe(true);
      expect(result.some(r => r.airline === 'Local Air')).toBe(true);
    });
  });

  describe('searchHotels', () => {
    it('should search hotels from live API vendors', async () => {
      const mockSuppliers = [
        {
          id: '1',
          category: 'hotels',
          isActive: true,
          vendor: { code: 'LITEAPI' }
        }
      ];

      const mockLiteAPIResults = [
        {
          id: 'hotel-1',
          name: 'Test Hotel',
          pricePerNight: 100,
          currency: 'USD'
        }
      ];

      mockDynamicPrisma.supplier.findMany.mockResolvedValue(mockSuppliers);
      (LiteAPIClient.searchHotels as jest.Mock).mockResolvedValue(mockLiteAPIResults);

      const params = {
        location: 'New York',
        checkin: '2024-10-25',
        checkout: '2024-10-26',
        adults: 2
      };

      const result = await orchestrator.searchHotels(params);

      expect(LiteAPIClient.searchHotels).toHaveBeenCalledWith(params, 'test');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Test Hotel');
    });

    it('should search hotels from local database', async () => {
      const mockSuppliers = [
        {
          id: '2',
          category: 'LOCAL',
          isActive: true,
          vendor: null
        }
      ];

      const mockHotels = [
        {
          id: 1,
          name: 'Local Hotel',
          city: 'New York',
          pricePerNight: 120
        }
      ];

      mockDynamicPrisma.supplier.findMany.mockResolvedValue(mockSuppliers);
      mockStaticPrisma.hotel.findMany.mockResolvedValue(mockHotels);

      const params = {
        location: 'New York',
        checkin: '2024-10-25',
        checkout: '2024-10-26',
        adults: 2
      };

      const result = await orchestrator.searchHotels(params);

      expect(mockStaticPrisma.hotel.findMany).toHaveBeenCalledWith({
        where: {
          isActive: true,
          OR: [
            { city: { contains: 'New York', mode: 'insensitive' } },
            { name: { contains: 'New York', mode: 'insensitive' } }
          ]
        }
      });
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Local Hotel');
    });
  });

  describe('applyPricingRules', () => {
    it('should apply percentage markup', () => {
      const results = [
        { id: '1', amount: 100, currency: 'USD' }
      ];

      const mockRules = [
        {
          name: 'Test Markup',
          markupType: 'PERCENTAGE',
          markupValue: 20,
          status: 'ACTIVE'
        }
      ];

      const context = { tenantId: 'test-tenant' };

      // Mock the pricing rule query
      mockDynamicPrisma.pricingRule.findMany.mockResolvedValue(mockRules);

      const result = (orchestrator as any).applyPricingRules(results, 'FLIGHT', context);

      expect(result[0].amount).toBe(120); // 100 + 20%
      expect(result[0].markupApplied).toBe('Test Markup');
    });

    it('should apply fixed markup', () => {
      const results = [
        { id: '1', amount: 100, currency: 'USD' }
      ];

      const mockRules = [
        {
          name: 'Fixed Markup',
          markupType: 'FIXED',
          markupValue: 50,
          status: 'ACTIVE'
        }
      ];

      const context = { tenantId: 'test-tenant' };

      // Mock the pricing rule query
      mockDynamicPrisma.pricingRule.findMany.mockResolvedValue(mockRules);

      const result = (orchestrator as any).applyPricingRules(results, 'FLIGHT', context);

      expect(result[0].amount).toBe(150); // 100 + 50
      expect(result[0].markupApplied).toBe('Fixed Markup');
    });

    it('should return original results when no rules match', () => {
      const results = [
        { id: '1', amount: 100, currency: 'USD' }
      ];

      const mockRules: any[] = [];

      const context = { tenantId: 'test-tenant' };

      // Mock the pricing rule query
      mockDynamicPrisma.pricingRule.findMany.mockResolvedValue(mockRules);

      const result = (orchestrator as any).applyPricingRules(results, 'FLIGHT', context);

      expect(result[0].amount).toBe(100);
      expect(result[0].markupApplied).toBeUndefined();
    });
  });
});