import { describe, it, expect } from 'vitest';
import { 
  validateCompany, 
  validateBranch, 
  validateDepartment, 
  validateBooking, 
  validateUser,
  sanitizeInput,
  sanitizeEmail,
  sanitizePhone,
  formatValidationErrors,
  createRateLimiter
} from '../lib/validation';

describe('Validation Utilities', () => {
  describe('Company Validation', () => {
    it('should validate a complete company object', () => {
      const validCompany = {
        name: 'Test Company',
        legalName: 'Test Company Inc.',
        registrationNumber: 'REG123456',
        taxId: 'TAX123',
        email: 'contact@test.com',
        phone: '+1234567890',
        website: 'https://test.com',
        address: '123 Test Street',
        city: 'Test City',
        country: 'Test Country',
        status: 'active',
        tier: 'premium'
      };

      const result = validateCompany(validCompany);
      expect(result.success).toBe(true);
    });

    it('should reject company with invalid email', () => {
      const invalidCompany = {
        name: 'Test Company',
        legalName: 'Test Company Inc.',
        registrationNumber: 'REG123456',
        taxId: 'TAX123',
        email: 'invalid-email',
        phone: '+1234567890',
        address: '123 Test Street',
        city: 'Test City',
        country: 'Test Country',
        status: 'active',
        tier: 'premium'
      };

      const result = validateCompany(invalidCompany);
      expect(result.success).toBe(false);
      expect(result.error?.issues).toContainEqual(
        expect.objectContaining({
          path: ['email'],
          message: 'Invalid email format'
        })
      );
    });

    it('should reject company with too short name', () => {
      const invalidCompany = {
        name: 'T',
        legalName: 'Test Company Inc.',
        registrationNumber: 'REG123456',
        taxId: 'TAX123',
        email: 'contact@test.com',
        phone: '+1234567890',
        address: '123 Test Street',
        city: 'Test City',
        country: 'Test Country',
        status: 'active',
        tier: 'premium'
      };

      const result = validateCompany(invalidCompany);
      expect(result.success).toBe(false);
      expect(result.error?.issues).toContainEqual(
        expect.objectContaining({
          path: ['name'],
          message: 'Company name must be at least 2 characters'
        })
      );
    });
  });

  describe('Branch Validation', () => {
    it('should validate a complete branch object', () => {
      const validBranch = {
        companyId: 'company-123',
        name: 'Test Branch',
        code: 'TB001',
        iataCode: 'TST',
        officeId: 'OFF001',
        address: {
          formattedAddress: '123 Test Street, Test City',
          street: '123 Test Street',
          city: 'Test City',
          country: 'Test Country',
          postalCode: '12345',
          coordinates: {
            lng: -74.006,
            lat: 40.7128
          }
        },
        phone: '+1234567890',
        email: 'branch@test.com',
        managerId: 'manager-123'
      };

      const result = validateBranch(validBranch);
      expect(result.success).toBe(true);
    });

    it('should reject branch with invalid coordinates', () => {
      const invalidBranch = {
        companyId: 'company-123',
        name: 'Test Branch',
        code: 'TB001',
        iataCode: 'TST',
        officeId: 'OFF001',
        address: {
          formattedAddress: '123 Test Street, Test City',
          street: '123 Test Street',
          city: 'Test City',
          country: 'Test Country',
          postalCode: '12345',
          coordinates: {
            lng: 200, // Invalid longitude
            lat: 40.7128
          }
        },
        phone: '+1234567890',
        email: 'branch@test.com',
        managerId: 'manager-123'
      };

      const result = validateBranch(invalidBranch);
      expect(result.success).toBe(false);
      expect(result.error?.issues).toContainEqual(
        expect.objectContaining({
          path: ['address', 'coordinates', 'lng'],
          message: 'Longitude must be between -180 and 180'
        })
      );
    });
  });

  describe('Department Validation', () => {
    it('should validate a complete department object', () => {
      const validDepartment = {
        companyId: 'company-123',
        name: 'Engineering',
        code: 'ENG',
        employeeCount: 50
      };

      const result = validateDepartment(validDepartment);
      expect(result.success).toBe(true);
    });

    it('should reject department with negative employee count', () => {
      const invalidDepartment = {
        companyId: 'company-123',
        name: 'Engineering',
        code: 'ENG',
        employeeCount: -5
      };

      const result = validateDepartment(invalidDepartment);
      expect(result.success).toBe(false);
      expect(result.error?.issues).toContainEqual(
        expect.objectContaining({
          path: ['employeeCount'],
          message: 'Employee count cannot be negative'
        })
      );
    });
  });

  describe('Booking Validation', () => {
    it('should validate a complete booking object', () => {
      const validBooking = {
        companyId: 'company-123',
        customerId: 'customer-456',
        bookingRef: 'BK123456',
        status: 'confirmed',
        totalAmount: 1000,
        currency: 'USD'
      };

      const result = validateBooking(validBooking);
      expect(result.success).toBe(true);
    });

    it('should reject booking with invalid currency', () => {
      const invalidBooking = {
        companyId: 'company-123',
        customerId: 'customer-456',
        bookingRef: 'BK123456',
        status: 'confirmed',
        totalAmount: 1000,
        currency: 'US' // Too short
      };

      const result = validateBooking(invalidBooking);
      expect(result.success).toBe(false);
      expect(result.error?.issues).toContainEqual(
        expect.objectContaining({
          path: ['currency'],
          message: 'Currency must be exactly 3 characters'
        })
      );
    });
  });

  describe('User Validation', () => {
    it('should validate a complete user object', () => {
      const validUser = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        role: 'admin',
        status: 'active'
      };

      const result = validateUser(validUser);
      expect(result.success).toBe(true);
    });

    it('should reject user with invalid email', () => {
      const invalidUser = {
        name: 'John Doe',
        email: 'invalid-email',
        role: 'admin',
        status: 'active'
      };

      const result = validateUser(invalidUser);
      expect(result.success).toBe(false);
      expect(result.error?.issues).toContainEqual(
        expect.objectContaining({
          path: ['email'],
          message: 'Invalid email format'
        })
      );
    });
  });
});

describe('Input Sanitization', () => {
  describe('sanitizeInput', () => {
    it('should remove dangerous characters', () => {
      const maliciousInput = "<script>alert('xss')</script>Hello World";
      const sanitized = sanitizeInput(maliciousInput);
      expect(sanitized).toBe('Hello World');
    });

    it('should remove javascript: URLs', () => {
      const maliciousInput = "javascript:alert('xss')";
      const sanitized = sanitizeInput(maliciousInput);
      expect(sanitized).toBe("alert('xss')");
    });

    it('should remove event handlers', () => {
      const maliciousInput = "onclick='alert(\\'xss\\')'";
      const sanitized = sanitizeInput(maliciousInput);
      expect(sanitized).toBe("onclick='alert(\\'xss\\')'");
    });

    it('should trim whitespace', () => {
      const input = '  Hello World  ';
      const sanitized = sanitizeInput(input);
      expect(sanitized).toBe('Hello World');
    });
  });

  describe('sanitizeEmail', () => {
    it('should lowercase and trim email', () => {
      const email = '  JOHN.DOE@EXAMPLE.COM  ';
      const sanitized = sanitizeEmail(email);
      expect(sanitized).toBe('john.doe@example.com');
    });
  });

  describe('sanitizePhone', () => {
    it('should remove non-numeric characters except +', () => {
      const phone = '+1 (555) 123-4567';
      const sanitized = sanitizePhone(phone);
      expect(sanitized).toBe('+15551234567');
    });
  });
});

describe('Error Formatting', () => {
  it('should format validation errors correctly', () => {
    const errors = {
      errors: [
        { path: ['name'], message: 'Name is required' },
        { path: ['email'], message: 'Invalid email format' }
      ]
    };

    const formatted = formatValidationErrors(errors);
    expect(formatted).toEqual([
      'name: Name is required',
      'email: Invalid email format'
    ]);
  });

  it('should handle invalid error format', () => {
    const formatted = formatValidationErrors(null);
    expect(formatted).toEqual(['Invalid data format']);
  });
});

describe('Rate Limiting', () => {
  it('should allow requests under the limit', () => {
    const rateLimiter = createRateLimiter(5, 60000); // 5 requests per minute
    const identifier = 'test-user';

    for (let i = 0; i < 5; i++) {
      expect(rateLimiter(identifier)).toBe(true);
    }
  });

  it('should block requests over the limit', () => {
    const rateLimiter = createRateLimiter(2, 60000); // 2 requests per minute
    const identifier = 'test-user';

    rateLimiter(identifier); // 1st request
    rateLimiter(identifier); // 2nd request

    expect(rateLimiter(identifier)).toBe(false); // 3rd request should be blocked
  });

  it('should reset window after timeout', (done) => {
    const rateLimiter = createRateLimiter(1, 100); // 1 request per 100ms
    const identifier = 'test-user';

    expect(rateLimiter(identifier)).toBe(true); // 1st request
    expect(rateLimiter(identifier)).toBe(false); // 2nd request blocked

    setTimeout(() => {
      expect(rateLimiter(identifier)).toBe(true); // Should be allowed after window reset
      done();
    }, 150);
  });
});