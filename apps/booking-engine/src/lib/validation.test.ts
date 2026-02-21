import { describe, it, expect } from 'vitest';
import { isEmail, isCardNumber, isCVV } from './validation';

describe('validation utilities', () => {
  it('validates emails correctly', () => {
    expect(isEmail('user@example.com')).toBe(true);
    expect(isEmail('bad-email')).toBe(false);
    expect(isEmail('')).toBe(false);
    expect(isEmail(undefined)).toBe(false);
  });

  it('validates card numbers correctly', () => {
    expect(isCardNumber('4242424242424242')).toBe(true);
    expect(isCardNumber('1234')).toBe(false);
    expect(isCardNumber('abcd1234abcd')).toBe(false);
  });

  it('validates cvv correctly', () => {
    expect(isCVV('123')).toBe(true);
    expect(isCVV('1234')).toBe(true);
    expect(isCVV('12')).toBe(false);
    expect(isCVV('abcd')).toBe(false);
  });
});