/**
 * API Integration Test Setup
 *
 * Configures Supertest and test database for API integration tests.
 */

import request from 'supertest';
import app from '../../src/app.js';

// Test configuration
export const TEST_CONFIG = {
  baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3001',
  timeout: 30000,
  testUser: {
    email: 'testuser1@example.com',
    password: 'Test@123',
    role: 'user'
  },
  adminUser: {
    email: 'admin@example.com',
    password: 'Admin@123',
    role: 'admin'
  }
};

// Supertest request instance
export const api = request(app);

// Test tokens storage
export let authTokens: {
  user?: string;
  admin?: string;
} = {};

/**
 * Generate a test JWT token for authentication
 * Note: In real tests, this would come from the auth service
 */
export function generateTestToken(user: { email: string; role: string }): string {
  // Simple mock token for testing
  // In production, this would be a real JWT from your auth service
  const payload = {
    email: user.email,
    role: user.role,
    iat: Date.now(),
    exp: Date.now() + 3600000 // 1 hour
  };
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

/**
 * Setup function to run before all tests
 */
export async function setupTestEnvironment(): Promise<void> {
  // Generate test tokens
  authTokens.user = generateTestToken(TEST_CONFIG.testUser);
  authTokens.admin = generateTestToken(TEST_CONFIG.adminUser);

  // Verify API is running
  const response = await api.get('/health');
  if (response.status !== 200) {
    throw new Error('API health check failed. Is the server running?');
  }
}

/**
 * Teardown function to run after all tests
 */
export async function teardownTestEnvironment(): Promise<void> {
  // Cleanup test data if needed
  authTokens = {};
}

/**
 * Get authorization header for requests
 */
export function getAuthHeader(role: 'user' | 'admin' = 'user'): { Authorization: string } {
  const token = role === 'admin' ? authTokens.admin : authTokens.user;
  return { Authorization: `Bearer ${token}` };
}

/**
 * Helper to create a test booking
 */
export async function createTestBooking(bookingData: any): Promise<any> {
  const response = await api
    .post('/api/bookings')
    .set(getAuthHeader())
    .send(bookingData);

  return response.body;
}

/**
 * Helper to cleanup test bookings
 */
export async function cleanupTestBooking(bookingId: string): Promise<void> {
  await api
    .delete(`/api/bookings/${bookingId}`)
    .set(getAuthHeader());
}

// Default export for Jest setup
export default {
  setupTestEnvironment,
  teardownTestEnvironment,
  getAuthHeader,
  createTestBooking,
  cleanupTestBooking
};
