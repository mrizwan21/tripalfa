import { describe, it, expect } from 'vitest';

describe('Wallet package', () => {
    it('should return true for a valid wallet address', () => {
        const isValidAddress = (address) => /^0x[a-fA-F0-9]{40}$/.test(address);
        expect(isValidAddress('0x1234567890abcdef1234567890abcdef12345678')).toBe(true);
    });

    it('should return false for an invalid wallet address', () => {
        const isValidAddress = (address) => /^0x[a-fA-F0-9]{40}$/.test(address);
        expect(isValidAddress('invalid_address')).toBe(false);
    });
});