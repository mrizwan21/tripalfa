/**
 * @tripalfa/shared-validation
 * 
 * Shared validation utilities and schemas for TripAlfa platform
 */

// Export schemas
export * from './schemas/tenant.schema';

// Export middleware
export * from './middleware/validate';

// Export utilities
export * from './utils/sanitizers';

// Re-export Zod for convenience
export { z } from 'zod';

/**
 * Common validation utilities
 */
export const ValidationUtils = {
  /**
   * Check if value is empty
   */
  isEmpty: (value: any): boolean => {
    if (value === null || value === undefined) {
      return true;
    }
    
    if (typeof value === 'string') {
      return value.trim().length === 0;
    }
    
    if (Array.isArray(value)) {
      return value.length === 0;
    }
    
    if (typeof value === 'object') {
      return Object.keys(value).length === 0;
    }
    
    return false;
  },
  
  /**
   * Validate email address
   */
  isValidEmail: (email: string): boolean => {
    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    return emailRegex.test(email);
  },
  
  /**
   * Validate phone number (international format)
   */
  isValidPhone: (phone: string): boolean => {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  },
  
  /**
   * Validate URL
   */
  isValidUrl: (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },
  
  /**
   * Validate password strength
   */
  isStrongPassword: (password: string): {
    valid: boolean;
    errors: string[];
  } => {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  },
  
  /**
   * Validate date is in the future
   */
  isFutureDate: (date: Date | string): boolean => {
    const inputDate = typeof date === 'string' ? new Date(date) : date;
    return inputDate > new Date();
  },
  
  /**
   * Validate date is in the past
   */
  isPastDate: (date: Date | string): boolean => {
    const inputDate = typeof date === 'string' ? new Date(date) : date;
    return inputDate < new Date();
  },
  
  /**
   * Validate number is within range
   */
  isInRange: (value: number, min: number, max: number): boolean => {
    return value >= min && value <= max;
  },
};

/**
 * Error types for validation
 */
export enum ValidationErrorType {
  REQUIRED = 'REQUIRED',
  INVALID_FORMAT = 'INVALID_FORMAT',
  TOO_SHORT = 'TOO_SHORT',
  TOO_LONG = 'TOO_LONG',
  OUT_OF_RANGE = 'OUT_OF_RANGE',
  INVALID_TYPE = 'INVALID_TYPE',
  CUSTOM = 'CUSTOM',
}

/**
 * Validation error interface
 */
export interface ValidationError {
  field: string;
  type: ValidationErrorType;
  message: string;
  value?: any;
}

/**
 * Validation result interface
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * Create a validation result
 */
export const createValidationResult = (
  valid: boolean,
  errors: ValidationError[] = []
): ValidationResult => ({
  valid,
  errors,
});

/**
 * Create a validation error
 */
export const createValidationError = (
  field: string,
  type: ValidationErrorType,
  message: string,
  value?: any
): ValidationError => ({
  field,
  type,
  message,
  value,
});

/**
 * Common validation patterns
 */
export const ValidationPatterns = {
  EMAIL: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
  PHONE: /^\+?[1-9]\d{1,14}$/,
  URL: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,
  ALPHANUMERIC: /^[a-zA-Z0-9]+$/,
  ALPHANUMERIC_WITH_SPACES: /^[a-zA-Z0-9\s]+$/,
  NUMERIC: /^[0-9]+$/,
  DECIMAL: /^[0-9]+(\.[0-9]+)?$/,
  HEX_COLOR: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  CUID: /^c[^\s-]{8,}$/i,
};

/**
 * Default validation messages
 */
export const ValidationMessages = {
  REQUIRED: (field: string) => `${field} is required`,
  INVALID_EMAIL: 'Invalid email address',
  INVALID_PHONE: 'Invalid phone number',
  INVALID_URL: 'Invalid URL',
  TOO_SHORT: (field: string, min: number) => `${field} must be at least ${min} characters`,
  TOO_LONG: (field: string, max: number) => `${field} must be less than ${max} characters`,
  OUT_OF_RANGE: (field: string, min: number, max: number) => `${field} must be between ${min} and ${max}`,
  INVALID_FORMAT: (field: string) => `${field} has an invalid format`,
};