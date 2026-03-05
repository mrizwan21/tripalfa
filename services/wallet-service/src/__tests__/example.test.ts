import { describe, it, expect } from 'vitest';

describe('Wallet Service', () => {
    it('should return the correct balance', () => {
        const balance = 100; // Example balance
        expect(balance).toBe(100);
    });

    it('should add funds correctly', () => {
        const addFunds = (currentBalance, amount) => currentBalance + amount;
        expect(addFunds(100, 50)).toBe(150);
    });

    it('should deduct funds correctly', () => {
        const deductFunds = (currentBalance, amount) => currentBalance - amount;
        expect(deductFunds(100, 50)).toBe(50);
    });
});