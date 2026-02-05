import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { logger } from '../utils/logger';

// Security configuration
const SECURITY_CONFIG = {
  maxRequestSize: 10 * 1024 * 1024, // 10MB
  allowedFileTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
  maxFileNameLength: 255,
  sessionTimeout: 30 * 60 * 1000, // 30 minutes
  maxLoginAttempts: 5,
  lockoutDuration: 15 * 60 * 1000, // 15 minutes
};

// Input validation schemas
const SecurityInputSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name cannot exceed 100 characters'),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format'),
  url: z.string().url('Invalid URL format'),
});

// Security middleware functions
export class SecurityMiddleware {
  private static loginAttempts = new Map<string, { count: number; lastAttempt: number }>();
  private static blockedIPs = new Set<string>();

  static authenticate(_req: Request, _res: Response, next: NextFunction): void {
    next();
  }

  static authorize(_roles: string[]) {
    return (_req: Request, _res: Response, next: NextFunction): void => {
      next();
    };
  }

  static sanitizeEmail(email: string): string {
    return email?.toLowerCase().trim();
  }

  static sanitizePhone(phone: string): string {
    return phone?.replace(/\s+/g, '').replace(/[^+\d]/g, '');
  }

  // XSS Protection
  static sanitizeInput(input: string): string {
    if (!input || typeof input !== 'string') {
      return '';
    }
    
    return input
      .replace(/[<>]/g, '') // Remove potentially dangerous characters
      .replace(/script/gi, '') // Remove script tags
      .replace(/javascript:/gi, '') // Remove javascript: URLs
      .replace(/on\w+=/gi, '') // Remove event handlers
      .replace(/data:/gi, '') // Remove data: URLs
      .replace(/vbscript:/gi, '') // Remove vbscript: URLs
      .trim();
  }

  // SQL Injection Protection
  static sanitizeSQLInput(input: string): string {
    if (!input || typeof input !== 'string') {
      return '';
    }
    
    return input
      .replace(/'/g, "''") // Escape single quotes
      .replace(/;/g, '') // Remove semicolons
      .replace(/--/g, '') // Remove SQL comments
      .replace(/\/\*.*?\*\//g, '') // Remove block comments
      .replace(/xp_/gi, '') // Remove xp_ stored procedures
      .replace(/sp_/gi, '') // Remove sp_ stored procedures
      .trim();
  }

  // File Upload Security
  static validateFileUpload(file: any): { isValid: boolean; error?: string } {
    // Check file size
    if (file.size > SECURITY_CONFIG.maxRequestSize) {
      return { isValid: false, error: 'File size exceeds maximum allowed size' };
    }

    // Check file type
    if (!SECURITY_CONFIG.allowedFileTypes.includes(file.mimetype)) {
      return { isValid: false, error: 'File type not allowed' };
    }

    // Check file name
    if (file.originalname.length > SECURITY_CONFIG.maxFileNameLength) {
      return { isValid: false, error: 'File name too long' };
    }

    // Check for dangerous file extensions
    const dangerousExtensions = ['.exe', '.bat', '.cmd', '.com', '.pif', '.vbs', '.js', '.jar', '.scr'];
    const fileExtension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
    
    if (dangerousExtensions.includes(fileExtension)) {
      return { isValid: false, error: 'File extension not allowed' };
    }

    return { isValid: true };
  }

  // Rate Limiting
  static createRateLimiter(maxRequests: number, windowMs: number) {
    const requests = new Map<string, number[]>();
    
    return (identifier: string): { allowed: boolean; resetTime?: number } => {
      const now = Date.now();
      const windowStart = now - windowMs;
      
      if (!requests.has(identifier)) {
        requests.set(identifier, []);
      }
      
      const userRequests = requests.get(identifier)!;
      
      // Remove old requests outside the window
      const validRequests = userRequests.filter(timestamp => timestamp > windowStart);
      requests.set(identifier, validRequests);
      
      // Check if under limit
      if (validRequests.length >= maxRequests) {
        const oldestRequest = Math.min(...validRequests);
        const resetTime = oldestRequest + windowMs;
        return { allowed: false, resetTime };
      }
      
      // Add current request
      validRequests.push(now);
      return { allowed: true };
    };
  }

  // Login Attempt Tracking
  static trackLoginAttempt(identifier: string, success: boolean): { blocked: boolean; resetTime?: number } {
    if (success) {
      this.loginAttempts.delete(identifier);
      return { blocked: false };
    }

    const now = Date.now();
    const attempts = this.loginAttempts.get(identifier);

    if (!attempts) {
      this.loginAttempts.set(identifier, { count: 1, lastAttempt: now });
      return { blocked: false };
    }

    // Check if user is still locked out
    if (attempts.count >= SECURITY_CONFIG.maxLoginAttempts) {
      const timeSinceLastAttempt = now - attempts.lastAttempt;
      if (timeSinceLastAttempt < SECURITY_CONFIG.lockoutDuration) {
        return { 
          blocked: true, 
          resetTime: attempts.lastAttempt + SECURITY_CONFIG.lockoutDuration 
        };
      } else {
        // Reset attempts after lockout period
        this.loginAttempts.set(identifier, { count: 1, lastAttempt: now });
        return { blocked: false };
      }
    }

    // Increment attempts
    attempts.count++;
    attempts.lastAttempt = now;

    if (attempts.count >= SECURITY_CONFIG.maxLoginAttempts) {
      return { 
        blocked: true, 
        resetTime: now + SECURITY_CONFIG.lockoutDuration 
      };
    }

    return { blocked: false };
  }

  // IP Blocking
  static blockIP(ip: string, duration: number = SECURITY_CONFIG.lockoutDuration) {
    this.blockedIPs.add(ip);
    setTimeout(() => {
      this.blockedIPs.delete(ip);
    }, duration);
  }

  static isIPBlocked(ip: string): boolean {
    return this.blockedIPs.has(ip);
  }

  // CSRF Protection
  static generateCSRFToken(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  static validateCSRFToken(token: string, expectedToken: string): boolean {
    return token === expectedToken;
  }

  // Content Security Policy
  static getCSPHeader(): string {
    return [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self'",
      "connect-src 'self' https:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; ');
  }

  // Security Headers
  static getSecurityHeaders(): Record<string, string> {
    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Content-Security-Policy': this.getCSPHeader(),
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
    };
  }

  // Password Strength Validation
  static validatePasswordStrength(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Email Validation
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Phone Number Validation
  static validatePhoneNumber(phone: string): boolean {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phone);
  }

  // URL Validation
  static validateURL(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  // Session Management
  static createSessionToken(userId: string, expiresIn: number = SECURITY_CONFIG.sessionTimeout): string {
    const payload = {
      userId,
      issuedAt: Date.now(),
      expiresAt: Date.now() + expiresIn
    };

    // In a real application, this would be properly encrypted/signatured
    return btoa(JSON.stringify(payload));
  }

  static validateSessionToken(token: string): { valid: boolean; userId?: string; expired?: boolean } {
    try {
      const payload = JSON.parse(atob(token));
      const now = Date.now();

      if (now > payload.expiresAt) {
        return { valid: false, expired: true };
      }

      return { valid: true, userId: payload.userId };
    } catch {
      return { valid: false };
    }
  }

  // Audit Logging
  static logSecurityEvent(event: string, details: any, userId?: string) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      userId,
      details,
      ip: details.ip || 'unknown',
      userAgent: details.userAgent || 'unknown'
    };

    // In a real application, this would be sent to a logging service
    logger.info('Security Event', logEntry);
  }

  // Input Validation
  static validateInput<T>(input: any, schema: z.ZodSchema<T>): { valid: boolean; data?: T; errors?: string[] } {
    const result = schema.safeParse(input);
    
    if (result.success) {
      return { valid: true, data: result.data };
    }

    const errors = result.error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
    return { valid: false, errors };
  }
}

// Express middleware functions
export const sanitizeInputs = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Sanitize query parameters
    if (req.query) {
      for (const key in req.query) {
        if (typeof req.query[key] === 'string') {
          req.query[key] = SecurityMiddleware.sanitizeInput(req.query[key] as string);
        }
      }
    }

    // Sanitize body parameters
    if (req.body) {
      for (const key in req.body) {
        if (typeof req.body[key] === 'string') {
          req.body[key] = SecurityMiddleware.sanitizeInput(req.body[key]);
        }
      }
    }

    next();
  } catch (error) {
    logger.error('Input sanitization failed', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const addSecurityHeaders = (req: Request, res: Response, next: NextFunction) => {
  const headers = SecurityMiddleware.getSecurityHeaders();
  for (const [key, value] of Object.entries(headers)) {
    res.setHeader(key, value);
  }
  next();
};

export const rateLimit = (maxRequests: number, windowMs: number) => {
  const rateLimiter = SecurityMiddleware.createRateLimiter(maxRequests, windowMs);
  
  return (req: Request, res: Response, next: NextFunction) => {
    const identifier = req.ip || req.connection.remoteAddress || 'unknown';
    const result = rateLimiter(identifier);
    
    if (!result.allowed) {
      logger.warn('Rate limit exceeded', { ip: identifier, userAgent: req.get('User-Agent') });
      return res.status(429).json({
        error: 'Too many requests',
        retryAfter: Math.ceil((result.resetTime! - Date.now()) / 1000)
      });
    }
    
    next();
  };
};

export const validateFileUploadMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (req.file) {
    const validation = SecurityMiddleware.validateFileUpload(req.file);
    if (!validation.isValid) {
      return res.status(400).json({
        error: 'File validation failed',
        message: validation.error
      });
    }
  }
  next();
};

// Export security utilities
export const {
  sanitizeInput,
  sanitizeSQLInput,
  validateFileUpload,
  createRateLimiter,
  trackLoginAttempt,
  blockIP,
  isIPBlocked,
  generateCSRFToken,
  validateCSRFToken,
  getCSPHeader,
  getSecurityHeaders,
  validatePasswordStrength,
  validateEmail,
  validatePhoneNumber,
  validateURL,
  createSessionToken,
  validateSessionToken,
  logSecurityEvent,
  validateInput
} = SecurityMiddleware;

// Export additional utility functions
export const sanitizeEmail = (email: string): string => {
  return email.toLowerCase().trim();
};

export const sanitizePhone = (phone: string): string => {
  return phone.replace(/\s+/g, '').replace(/[^+\d]/g, '');
};

// Default rate limiters
export const apiRateLimiter = SecurityMiddleware.createRateLimiter(100, 60000); // 100 requests per minute
export const authRateLimiter = SecurityMiddleware.createRateLimiter(5, 300000); // 5 requests per 5 minutes
export const fileUploadRateLimiter = SecurityMiddleware.createRateLimiter(10, 60000); // 10 uploads per minute
