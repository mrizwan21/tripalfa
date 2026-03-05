// Simple CommonJS test to verify Jest configuration
const { describe, it, expect } = require('@jest/globals');

describe('Simple Test', () => {
  it('should pass', () => {
    expect(true).toBe(true);
  });
});