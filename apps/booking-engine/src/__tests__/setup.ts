import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock Prisma client
vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn().mockImplementation(() => ({
    // Mock any Prisma methods that might be used in tests
    $connect: vi.fn(),
    $disconnect: vi.fn(),
  })),
}));

// Cleanup components after each test
afterEach(() => {
  cleanup();
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as any;

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
} as any;

// Mock scrollIntoView
Element.prototype.scrollIntoView = vi.fn();

// Suppress console warnings in tests (selectively)
const originalError = console.error;
const originalWarn = console.warn;

console.error = vi.fn((...args: any[]) => {
  // Only suppress React/testing library warnings
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('Warning: ReactDOM.render') ||
      args[0].includes('Not wrapped in act') ||
      args[0].includes('inside a test was not wrapped in act'))
  ) {
    return;
  }
  originalError.call(console, ...args);
});

console.warn = vi.fn((...args: any[]) => {
  // Only suppress specific warnings
  if (typeof args[0] === 'string' && args[0].includes('Warning:')) {
    return;
  }
  originalWarn.call(console, ...args);
});
