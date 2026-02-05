import { jest } from '@jest/globals';
import * as jwt from 'jsonwebtoken';

/**
 * Integration test utilities for common requests and assertions
 */

// Request helpers
export const get = (path: string) => (global as any).api.get(path);
export const post = (path: string, data?: any) => (global as any).api.post(path).send(data);
export const put = (path: string, data?: any) => (global as any).api.put(path).send(data);
export const del = (path: string) => (global as any).api.delete(path);

// Auth helpers
export const withAuth = (token?: string) => ({
  Authorization: `Bearer ${token || createAuthToken('test-user-id', 'admin')}`
});

// Role-based auth token helpers
export const createAuthToken = (userId: string, role: string, email?: string) => {
  const payload = { id: userId, role, email };
  return jwt.sign(payload, process.env.JWT_SECRET || 'test-jwt-secret-key');
};

export const createAdminToken = (userId?: string) => {
  return createAuthToken(userId || 'admin-user', 'admin');
};

export const createAgentToken = (userId?: string) => {
  return createAuthToken(userId || 'agent-user', 'agent');
};

export const createSupervisorToken = (userId?: string) => {
  return createAuthToken(userId || 'supervisor-user', 'supervisor');
};

export const createManagerToken = (userId?: string) => {
  return createAuthToken(userId || 'manager-user', 'manager');
};

// Enhanced HTTP request helpers
export const getAuth = (path: string, role: string) => {
  const token = createAuthToken('test-user', role);
  return get(path).set(withAuth(token));
};

export const postAuth = (path: string, data: any, role: string) => {
  const token = createAuthToken('test-user', role);
  return post(path, data).set(withAuth(token));
};

export const putAuth = (path: string, data: any, role: string) => {
  const token = createAuthToken('test-user', role);
  return put(path, data).set(withAuth(token));
};

export const delAuth = (path: string, role: string) => {
  const token = createAuthToken('test-user', role);
  return del(path).set(withAuth(token));
};

export const postJson = (path: string, data?: any, auth?: string | boolean) => {
  let req = post(path, data).set('Content-Type', 'application/json');
  if (auth === true) req = req.set(withAuth());
  if (typeof auth === 'string') req = req.set(withAuth(auth));
  return req;
};

// Response assertions
export const expectSuccess = (res: any, status = 200) => {
  expect(res.status).toBe(status);
  expect(res.body).not.toHaveProperty('error');
};

export const expectError = (res: any, status = 400, message?: string) => {
  expect(res.status).toBe(status);
  expect(res.body).toHaveProperty('error');
  if (message) {
    expect(res.body.message).toContain(message);
  }
};

export const expectValidationError = (res: any, field?: string) => {
  expect(res.status).toBe(400);
  expect(res.body).toHaveProperty('error');
  if (field) {
    expect(res.body.details).toHaveProperty(field);
  }
};

// Advanced assertion helpers
export const expectPagination = (res: any, expectedFields?: any) => {
  expectSuccess(res);
  expect(res.body).toHaveProperty('data');
  expect(res.body).toHaveProperty('pagination');
  expect(res.body.pagination).toHaveProperty('page');
  expect(res.body.pagination).toHaveProperty('limit');
  expect(res.body.pagination).toHaveProperty('total');
  expect(Array.isArray(res.body.data)).toBe(true);
  if (expectedFields) {
    Object.keys(expectedFields).forEach(key => {
      expect(res.body.pagination).toHaveProperty(key, expectedFields[key]);
    });
  }
};

export const expectBookingResponse = (res: any, expectedFields?: any) => {
  expectSuccess(res);
  // Handle both response shapes: { data: booking } and { data: { booking } }
  const booking = res.body.data?.booking ?? res.body.data ?? res.body;
  expect(booking).toHaveProperty('id');
  expect(booking).toHaveProperty('reference');
  expect(booking).toHaveProperty('segment');
  expect(booking).toHaveProperty('status');
  expect(booking).toHaveProperty('customerName');
  expect(booking).toHaveProperty('customerEmail');
  expect(booking).toHaveProperty('serviceType');
  expect(booking).toHaveProperty('customerPrice');
  expect(booking).toHaveProperty('currency');
  if (expectedFields) {
    Object.keys(expectedFields).forEach(key => {
      expect(booking).toHaveProperty(key, expectedFields[key]);
    });
  }
};

export const expectCustomerResponse = (res: any, expectedFields?: any) => {
  expectSuccess(res);
  const customer = res.body.data ?? res.body;
  expect(customer).toHaveProperty('id');
  expect(customer).toHaveProperty('name');
  expect(customer).toHaveProperty('email');
  expect(customer).toHaveProperty('type');
  expect(customer).toHaveProperty('createdAt');
  if (expectedFields) {
    Object.keys(expectedFields).forEach(key => {
      expect(customer).toHaveProperty(key, expectedFields[key]);
    });
  }
};

export const expectSupplierResponse = (res: any, expectedFields?: any) => {
  expectSuccess(res);
  const supplier = res.body.data ?? res.body;
  expect(supplier).toHaveProperty('id');
  expect(supplier).toHaveProperty('name');
  expect(supplier).toHaveProperty('type');
  expect(supplier).toHaveProperty('createdAt');
  if (expectedFields) {
    Object.keys(expectedFields).forEach(key => {
      expect(supplier).toHaveProperty(key, expectedFields[key]);
    });
  }
};

export const expectPermissionDenied = (res: any) => {
  expect(res.status).toBe(403);
  expect(res.body).toHaveProperty('error');
  expect(res.body.message).toMatch(/permission|forbidden|unauthorized/i);
};

export const expectUnauthorized = (res: any) => {
  expect(res.status).toBe(401);
  expect(res.body).toHaveProperty('error');
  expect(res.body.message).toMatch(/unauthorized|token|authentication/i);
};

export const expectNotFound = (res: any, resource = 'resource') => {
  expect(res.status).toBe(404);
  expect(res.body).toHaveProperty('error');
  expect(res.body.message).toMatch(new RegExp(`${resource}.*not found`, 'i'));
};

export const expectFieldValidation = (res: any, field: string, message?: string) => {
  expectValidationError(res, field);
  if (message) {
    expect(res.body.details[field]).toContain(message);
  }
};

// Request body builders
export const buildBookingRequest = (overrides?: any) => {
  const dateRange = generateDateRange();
  const today = new Date();
  const dob = new Date(today.getFullYear() - 30, today.getMonth(), today.getDate());
  
  return {
    type: 'flight',
    details: {
      origin: 'JFK',
      destination: 'LHR',
      travelDate: dateRange.checkIn,
      returnDate: dateRange.checkOut,
      passengers: [{
        firstName: 'John',
        lastName: 'Doe',
        type: 'adult',
        dateOfBirth: dob.toISOString().split('T')[0],
        passportNumber: 'AB123456',
        nationality: 'US'
      }],
      serviceDetails: {}
    },
    customerInfo: {
      type: 'individual',
      name: 'John Doe',
      email: `john.${Date.now()}@example.com`,
      phone: '+12025551234',
      address: '123 Main St, New York, NY 10001'
    },
    paymentInfo: {
      method: 'wallet',
      amount: 1500,
      currency: 'USD',
      paymentReference: `REF-${Date.now()}`
    },
    bookingOptions: {
      hold: false,
      priority: 'medium',
      remarks: 'Test booking',
      tags: ['test']
    },
    ...overrides
  };
};

export const buildCustomerRequest = (overrides?: any) => ({
  name: 'John Doe',
  email: `john.${Date.now()}@example.com`,
  phone: '+1234567890',
  type: 'individual',
  ...overrides
});

export const buildSupplierRequest = (overrides?: any) => ({
  name: 'Test Supplier',
  contactEmail: `supplier.${Date.now()}@example.com`,
  type: 'airline',
  contactPhone: '+1987654321',
  contactName: 'Test Contact',
  ...overrides
});

export const buildInventoryRequest = (overrides?: any) => ({
  supplierId: 'test-supplier-id',
  productCode: `PROD-${Date.now()}`,
  name: 'Test Flight Inventory',
  description: 'Test inventory for flights',
  quantity: 100,
  price: 150.00,
  currency: 'USD',
  minimumPrice: 120.00,
  status: 'active',
  serviceTypes: ['flight'],
  ...overrides
});

export const expectInventoryResponse = (res: any, expectedFields?: any) => {
  expectSuccess(res);
  const inventory = res.body.data ?? res.body;
  expect(inventory).toHaveProperty('id');
  expect(inventory).toHaveProperty('supplierId');
  expect(inventory).toHaveProperty('productCode');
  expect(inventory).toHaveProperty('name');
  expect(inventory).toHaveProperty('quantity');
  expect(inventory).toHaveProperty('available');
  expect(inventory).toHaveProperty('price');
  expect(inventory).toHaveProperty('status');
  if (expectedFields) {
    Object.keys(expectedFields).forEach(key => {
      expect(inventory).toHaveProperty(key, expectedFields[key]);
    });
  }
};

export const buildSearchParams = (overrides?: any) => ({
  page: 1,
  limit: 10,
  sortBy: 'createdAt',
  sortOrder: 'desc',
  ...overrides
});

// Test data helpers
export const generateUniqueEmail = () => `test.${Date.now()}@${Math.random().toString(36).slice(2)}.com`;

export const generatePhoneNumber = () => `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`;

export const generatePNR = () => `PNR${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

export const generateDateRange = (daysFromNow = 30) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() + daysFromNow);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 7);
  return {
    checkIn: startDate.toISOString().split('T')[0],
    checkOut: endDate.toISOString().split('T')[0]
  };
};

// Data helpers
export const createTestCustomer = async (overrides: Record<string, unknown> = {}) => {
  return (global as any).makeCustomer(overrides);
};

export const createTestSupplier = async (overrides: Record<string, unknown> = {}) => {
  return (global as any).makeSupplier(overrides);
};

export const createTestBooking = async (overrides: Record<string, unknown> = {}) => {
  return (global as any).makeBooking(overrides);
};

// Database helpers
export const clearDatabase = async () => {
  if (process.env.INTEGRATION_DB === 'true') {
    // This will be handled by the setup.ts beforeEach
    return;
  }
  // Mock implementation for unit tests
  jest.clearAllMocks();
};

export const seedDatabase = async (data: any = {}) => {
  if (process.env.INTEGRATION_DB === 'true') {
    const customers = data.customers || [];
    const suppliers = data.suppliers || [];
    const bookings = data.bookings || [];

    for (const customer of customers) {
      await (global as any).makeCustomer(customer);
    }
    for (const supplier of suppliers) {
      await (global as any).makeSupplier(supplier);
    }
    for (const booking of bookings) {
      await (global as any).makeBooking(booking);
    }
  }
  // Mock implementation for unit tests
  return data;
};

// Time helpers
export const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock helpers
export const mockExternalService = (service: string, method: string, response: any) => {
  // Note: jest.mock must be called at the top level, this is just a helper
  console.warn('mockExternalService: jest.mock must be called at module level');
};

export const resetMocks = () => {
  jest.clearAllMocks();
  jest.resetAllMocks();
};