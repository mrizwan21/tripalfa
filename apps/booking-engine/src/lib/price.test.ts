import { describe, it, expect } from 'vitest';
import { roomTotal, formatMoney } from './price';

describe('price utilities', () => {
  it('calculates room total correctly', () => {
    // original=100, tax=10, commission=5, nights=2, qty=1 => perNight=115 => total=230
    expect(roomTotal(100, 10, 5, 2, 1)).toBe(230);
  });

  it('formats money correctly', () => {
    expect(formatMoney(230, 'USD')).toBe('USD 230.00');
    expect(formatMoney(12.5, 'EUR')).toBe('EUR 12.50');
  });
});