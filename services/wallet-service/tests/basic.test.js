// Basic CommonJS test to verify Jest configuration
const { describe, it, expect } = require('@jest/globals');

describe('Basic Jest Configuration', () => {
  it('should run a simple test', () => {
    expect(2 + 2).toBe(4);
  });
});