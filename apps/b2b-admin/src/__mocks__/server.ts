/**
 * Mock server setup for tests
 * Uses Vitest mocks instead of MSW
 */

// Mock server functions for testing
export const mockFetch = {
  get: (url: string, handler: any) => handler(),
  post: (url: string, handler: any) => handler(),
  patch: (url: string, handler: any) => handler(),
  delete: (url: string, handler: any) => handler(),
};

// Global mock setup
export const setupServer = () => {
  // Vitest will handle mocking through vi.fn()
};

export const server = {
  listen: () => {},
  close: () => {},
  resetHandlers: () => {},
};
