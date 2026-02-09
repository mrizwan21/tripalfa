import { jest } from '@jest/globals';

/**
 * Mock service helpers for unit testing
 */

// Prisma mock
export const mockPrisma = (): any => {
  const mockPrismaClient = {
    customer: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    supplier: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    booking: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    $transaction: jest.fn(),
  };

  return mockPrismaClient;
};

// Redis mock
export const mockRedis = (): any => {
  const mockRedisClient = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    expire: jest.fn(),
    publish: jest.fn(),
    subscribe: jest.fn(),
    on: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
  };

  return mockRedisClient;
};

// External API mock
export const mockExternalAPI = (service: string, method: string, response: any): any => {
  // Note: jest.mock must be called at the top level, this is just a helper
  console.warn('mockExternalAPI: jest.mock must be called at module level');

  // Return a mock function that can be used in tests
  // @ts-ignore - Jest typing issue
  return jest.fn().mockResolvedValue(response);
};

// JWT mock (already exists in setup.ts, documented here for reference)
export const mockJWT = (): any => {
  const jwt = require('jsonwebtoken');
  return {
    sign: jest.spyOn(jwt, 'sign').mockImplementation(() => 'mock.jwt.token'),
    verify: jest.spyOn(jwt, 'verify').mockImplementation(((token: string, secret: string, callback?: (err: any, decoded: any) => void) => {
      if (callback) {
        callback(null, { id: 'test-user', role: 'user' });
      }
      return { id: 'test-user', role: 'user' };
    }) as any),
  };
};

// Reset all mocks
export const resetAllMocks = (): void => {
  jest.clearAllMocks();
  jest.resetAllMocks();
  jest.restoreAllMocks();
};