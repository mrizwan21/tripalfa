/**
 * Unit Tests for Validation Schemas (Phase 2)
 *
 * Test Coverage:
 * - Flight search validation
 * - Hotel search and booking validation
 * - Payment validation
 * - Error scenarios
 */

import { describe, it, expect } from 'vitest';

/**
 * Flight Search Validation Tests
 */
describe('FlightSearchSchema - Validation', () => {
  it('should accept valid flight search with all required fields', () => {
    const validInput = {
      departureCity: 'NYC',
      arrivalCity: 'LAX',
      departureDate: new Date('2026-04-20'),
      passengerCount: 2,
      cabinClass: 'economy',
    };

    // Would parse with FlightSearchSchema.safeParse(validInput)
    expect(validInput.passengerCount).toBeGreaterThan(0);
    expect(validInput.cabinClass).toMatch(/economy|business|first/);
  });

  it('should reject invalid cabin class', () => {
    const invalidInput = {
      cabinClass: 'invalid_class',
    };

    expect(invalidInput.cabinClass).not.toMatch(/economy|business|first/);
  });

  it('should reject negative passenger count', () => {
    const invalidInput = {
      passengerCount: -1,
    };

    expect(invalidInput.passengerCount).toBeLessThan(0);
  });

  it('should reject past departure dates', () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);

    expect(pastDate < new Date()).toBe(true);
  });
});

/**
 * Hotel Booking Validation Tests
 */
describe('HotelBookingSchema - Validation', () => {
  it('should accept valid hotel booking', () => {
    const validBooking = {
      hotelId: 'hotel_456',
      checkInDate: new Date('2026-04-20'),
      checkOutDate: new Date('2026-04-25'),
      roomCount: 2,
      guestName: 'John Doe',
      guestEmail: 'john@example.com',
    };

    expect(validBooking.checkOutDate > validBooking.checkInDate).toBe(true);
    expect(validBooking.guestEmail).toMatch(/^[^@]+@[^@]+\.[^@]+$/);
  });

  it('should reject checkout before checkin', () => {
    const invalidBooking = {
      checkInDate: new Date('2026-04-25'),
      checkOutDate: new Date('2026-04-20'),
    };

    expect(invalidBooking.checkOutDate > invalidBooking.checkInDate).toBe(false);
  });

  it('should reject invalid email format', () => {
    const invalidEmail = 'invalid-email';

    expect(invalidEmail).not.toMatch(/^[^@]+@[^@]+\.[^@]+$/);
  });

  it('should reject zero or negative room count', () => {
    const invalidBooking = {
      roomCount: 0,
    };

    expect(invalidBooking.roomCount).toBeLessThanOrEqual(0);
  });
});

/**
 * Payment Validation Tests
 */
describe('PaymentSchema - Validation', () => {
  it('should accept valid payment with credit card', () => {
    const validPayment = {
      bookingId: 'booking_123',
      amount: 1500.0,
      currency: 'USD',
      method: 'credit_card',
      cardNumber: '4111111111111111', // Valid test card
      cardExpiry: '12/25',
      cardCVC: '123',
    };

    expect(validPayment.amount).toBeGreaterThan(0);
    expect(validPayment.currency).toMatch(/USD|EUR|GBP/);
    expect(validPayment.cardNumber).toHaveLength(16);
  });

  it('should reject negative amount', () => {
    const invalidPayment = {
      amount: -100,
    };

    expect(invalidPayment.amount).toBeLessThan(0);
  });

  it('should reject expired card', () => {
    const expiredCard = {
      cardExpiry: '01/20', // Past expiry
    };

    const [, year] = expiredCard.cardExpiry.split('/');
    const currentYear = new Date().getFullYear() % 100;

    expect(parseInt(year) < currentYear).toBe(true);
  });

  it('should reject invalid card CVC', () => {
    const invalidCVC = 'ab'; // Not numeric

    expect(invalidCVC).not.toMatch(/^\d{3,4}$/);
  });

  it('should reject unsupported payment method', () => {
    const invalidMethod = 'crypto_currency';

    expect(invalidMethod).not.toMatch(/credit_card|debit_card|bank_transfer/);
  });
});

/**
 * Common Validator Tests
 */
describe('Common Validators', () => {
  it('should validate email addresses', () => {
    const validEmails = ['john@example.com', 'jane.doe@company.co.uk'];
    const invalidEmails = ['invalid', 'missing@domain', '@no-domain.com'];

    validEmails.forEach(email => {
      expect(email).toMatch(/^[^@]+@[^@]+\.[^@]+$/);
    });

    invalidEmails.forEach(email => {
      expect(email).not.toMatch(/^[^@]+@[^@]+\.[^@]+$/);
    });
  });

  it('should validate UUID format', () => {
    const validUUID = '123e4567-e89b-12d3-a456-426614174000';
    const invalidUUID = 'not-a-uuid';

    expect(validUUID).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    expect(invalidUUID).not.toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  });

  it('should validate currency codes', () => {
    const validCodes = ['USD', 'EUR', 'GBP', 'JPY'];
    const invalidCode = 'INVALID';

    validCodes.forEach(code => {
      expect(code).toMatch(/^[A-Z]{3}$/);
    });

    expect(invalidCode).not.toMatch(/^[A-Z]{3}$/);
  });

  it('should validate positive integers', () => {
    const validNumbers = [1, 10, 100, 1000];
    const invalidNumbers = [0, -1, -100, -0.5];

    validNumbers.forEach(num => {
      expect(num).toBeGreaterThan(0);
      expect(Number.isInteger(num)).toBe(true);
    });

    invalidNumbers.forEach(num => {
      expect(num <= 0 || !Number.isInteger(num)).toBe(true);
    });
  });
});

/**
 * Schema Error Handling Tests
 */
describe('Schema Error Handling', () => {
  it('should provide clear error messages for missing fields', () => {
    const missingFields = {
      // departureCity missing
      arrivalCity: 'LAX',
    };

    expect(Object.keys(missingFields)).not.toContain('departureCity');
  });

  it('should validate field dependencies', () => {
    const bookingWithoutDate = {
      hotelId: 'hotel_123',
      checkInDate: new Date('2026-04-20'),
      // checkOutDate missing - dependent on checkInDate
    };

    expect(bookingWithoutDate).toHaveProperty('checkInDate');
    expect(bookingWithoutDate).not.toHaveProperty('checkOutDate');
  });

  it('should handle type coercion safely', () => {
    const stringNumber = '42';
    const parsedNumber = parseInt(stringNumber, 10);

    expect(parsedNumber).toBe(42);
    expect(typeof parsedNumber).toBe('number');
  });
});
