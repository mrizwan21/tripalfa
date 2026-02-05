import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

interface MulterFile {
  size: number;
  mimetype: string;
  originalname: string;
}

// Security configuration
export const SECURITY_CONFIG = {
  // JWT Configuration
  JWT_SECRET: process.env.JWT_SECRET || (() => {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET must be set in production environment');
    }
    console.warn('⚠️  WARNING: Using default JWT secret in development. Set JWT_SECRET environment variable.');
    return 'tripalfa-secret-key-change-in-production';
  })(),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
  REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
  BCRYPT_ROUNDS: process.env.NODE_ENV === 'production' ? 14 : 12,

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: 100,
  AUTH_RATE_LIMIT_MAX_REQUESTS: 5,
  AUTH_RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000, // 15 minutes

  // Session Security
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes

  // Password Security
  PASSWORD_MIN_LENGTH: 12,
  PASSWORD_REQUIRE_UPPERCASE: true,
  PASSWORD_REQUIRE_LOWERCASE: true,
  PASSWORD_REQUIRE_NUMBERS: true,
  PASSWORD_REQUIRE_SYMBOLS: true,

  // CORS Configuration
  CORS_ORIGINS: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3001'],
  CORS_CREDENTIALS: true,

  // Security Headers
  CSP_DIRECTIVES: {
    defaultSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
    imgSrc: ["'self'", "data:", "https:"],
    fontSrc: ["'self'", "https://fonts.gstatic.com"],
    connectSrc: ["'self'", "https://api.stripe.com", "https://api.paypal.com"],
    frameSrc: ["'self'"],
    objectSrc: ["'none'"],
    mediaSrc: ["'self'"],
    frameAncestors: ["'none'"],
  },

  // File Upload Security
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_FILE_TYPES: [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf', 'text/plain', 'application/msword'
  ],
  MAX_FILE_NAME_LENGTH: 255,

  // Database Security
  CONNECTION_POOL_MIN: 2,
  CONNECTION_POOL_MAX: 20,
  CONNECTION_TIMEOUT: 30000,
  IDLE_TIMEOUT: 30000,

  // API Security
  API_VERSION: 'v1',
  API_KEY_HEADER: 'x-api-key',
  API_SECRET_HEADER: 'x-api-secret',

  // Encryption
  ENCRYPTION_ALGORITHM: 'aes-256-gcm',
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || (() => {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('ENCRYPTION_KEY must be set in production environment');
    }
    console.warn('⚠️  WARNING: Using default encryption key in development. Set ENCRYPTION_KEY environment variable.');
    return crypto.randomBytes(32).toString('hex');
  })(),
};

// Security middleware factory functions
export const createRateLimiter = (maxRequests: number, windowMs: number, message: string) => {
  return rateLimit({
    windowMs,
    max: maxRequests,
    message: {
      error: 'Too many requests',
      message,
      retryAfter: Math.ceil(windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      console.warn(`Rate limit exceeded for IP: ${req.ip}, User-Agent: ${req.get('User-Agent')}`);
      res.status(429).json({
        error: 'Too many requests',
        message,
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
  });
};

// Production security headers
export const getSecurityHeaders = () => {
  return helmet({
    contentSecurityPolicy: {
      directives: SECURITY_CONFIG.CSP_DIRECTIVES,
    },
    crossOriginEmbedderPolicy: false,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    },
    noSniff: true,
    xssFilter: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    hidePoweredBy: true,
    frameguard: { action: 'deny' },
    permittedCrossDomainPolicies: false,
  });
};

// CORS configuration
export const getCorsOptions = () => {
  return {
    origin: SECURITY_CONFIG.CORS_ORIGINS,
    credentials: SECURITY_CONFIG.CORS_CREDENTIALS,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-API-Key',
      'X-API-Secret',
      'X-CSRF-Token'
    ],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
    maxAge: 86400, // 24 hours
  };
};

// Password strength validation
export const validatePasswordStrength = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (password.length < SECURITY_CONFIG.PASSWORD_MIN_LENGTH) {
    errors.push(`Password must be at least ${SECURITY_CONFIG.PASSWORD_MIN_LENGTH} characters long`);
  }

  if (SECURITY_CONFIG.PASSWORD_REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (SECURITY_CONFIG.PASSWORD_REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (SECURITY_CONFIG.PASSWORD_REQUIRE_NUMBERS && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (SECURITY_CONFIG.PASSWORD_REQUIRE_SYMBOLS && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  // Check for common patterns
  const commonPatterns = [
    /password/i, /123456/, /qwerty/, /admin/, /user/, /test/
  ];
  
  for (const pattern of commonPatterns) {
    if (pattern.test(password)) {
      errors.push('Password contains common patterns and is not secure');
      break;
    }
  }

  // Check for repeated characters
  if (/(.)\1{2,}/.test(password)) {
    errors.push('Password should not contain repeated characters');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Input sanitization
export const sanitizeInput = (input: string): string => {
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
    .replace(/<iframe/gi, '') // Remove iframe tags
    .replace(/<object/gi, '') // Remove object tags
    .replace(/<embed/gi, '') // Remove embed tags
    .replace(/<form/gi, '') // Remove form tags
    .replace(/<input/gi, '') // Remove input tags
    .trim();
};

// SQL injection protection
export const sanitizeSQLInput = (input: string): string => {
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
    .replace(/union\s+select/gi, '') // Remove UNION SELECT
    .replace(/drop\s+(table|database|view)/gi, '') // Remove DROP statements
    .replace(/create\s+(table|database|view)/gi, '') // Remove CREATE statements
    .replace(/alter\s+table/gi, '') // Remove ALTER TABLE
    .trim();
};

// File upload validation
export const validateFileUpload = (file: MulterFile): { isValid: boolean; error?: string } => {
  // Check file size
  if (file.size > SECURITY_CONFIG.MAX_FILE_SIZE) {
    return { isValid: false, error: 'File size exceeds maximum allowed size (5MB)' };
  }

  // Check file type
  if (!SECURITY_CONFIG.ALLOWED_FILE_TYPES.includes(file.mimetype)) {
    return { isValid: false, error: 'File type not allowed' };
  }

  // Check file name
  if (file.originalname.length > SECURITY_CONFIG.MAX_FILE_NAME_LENGTH) {
    return { isValid: false, error: 'File name too long' };
  }

  // Check for dangerous file extensions
  const dangerousExtensions = ['.exe', '.bat', '.cmd', '.com', '.pif', '.vbs', '.js', '.jar', '.scr', '.php', '.asp', '.aspx'];
  const fileExtension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
  
  if (dangerousExtensions.includes(fileExtension)) {
    return { isValid: false, error: 'File extension not allowed' };
  }

  // Check for double extensions
  const doubleExtensions = ['.exe.js', '.exe.vbs', '.bat.exe', '.com.exe'];
  for (const ext of doubleExtensions) {
    if (file.originalname.toLowerCase().includes(ext)) {
      return { isValid: false, error: 'File contains dangerous double extension' };
    }
  }

  return { isValid: true };
};

// CSRF protection
export const generateCSRFToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

export const validateCSRFToken = (token: string, expectedToken: string): boolean => {
  return token === expectedToken;
};

// Encryption utilities
export const encrypt = (text: string): string => {
  const algorithm = 'aes-256-cbc';
  const key = crypto.scryptSync(SECURITY_CONFIG.ENCRYPTION_KEY, 'salt', 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
};

export const decrypt = (text: string): string => {
  const textParts = text.split(':');
  const iv = Buffer.from(textParts[0], 'hex');
  const encryptedText = textParts[1];
  const algorithm = 'aes-256-cbc';
  const key = crypto.scryptSync(SECURITY_CONFIG.ENCRYPTION_KEY, 'salt', 32);
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

// Security event logging
export const logSecurityEvent = (event: string, details: { ip?: string; userAgent?: string; severity?: string; [key: string]: unknown }, userId?: string) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    event,
    userId,
    details,
    ip: details.ip || 'unknown',
    userAgent: details.userAgent || 'unknown',
    severity: details.severity || 'info'
  };

  // In a real application, this would be sent to a logging service
  console.log('🔒 Security Event:', JSON.stringify(logEntry, null, 2));
};

// IP blocking utilities
export class IPBlocker {
  private static blockedIPs = new Set<string>();
  private static blockedUntil = new Map<string, number>();

  static blockIP(ip: string, duration: number = SECURITY_CONFIG.LOCKOUT_DURATION) {
    this.blockedIPs.add(ip);
    this.blockedUntil.set(ip, Date.now() + duration);
    
    setTimeout(() => {
      this.blockedIPs.delete(ip);
      this.blockedUntil.delete(ip);
    }, duration);
  }

  static isIPBlocked(ip: string): boolean {
    const blockedUntil = this.blockedUntil.get(ip);
    if (blockedUntil && Date.now() > blockedUntil) {
      this.blockedIPs.delete(ip);
      this.blockedUntil.delete(ip);
      return false;
    }
    return this.blockedIPs.has(ip);
  }

  static getBlockedIPs(): string[] {
    return Array.from(this.blockedIPs);
  }
}

// Request validation middleware
export const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  // Check for suspicious headers
  const suspiciousHeaders = ['x-forwarded-for', 'x-real-ip', 'x-cluster-client-ip'];
  for (const header of suspiciousHeaders) {
    const value = req.get(header);
    if (value && value.includes(';') || value && value.includes('<') || value && value.includes('>')) {
      logSecurityEvent('SUSPICIOUS_HEADER', { header, value, ip: req.ip });
      return res.status(400).json({ error: 'Invalid request headers' });
    }
  }

  // Check for SQL injection patterns in query parameters
  const queryString = JSON.stringify(req.query);
  if (/['";]|union|select|insert|update|delete|drop|create|alter/i.test(queryString)) {
    logSecurityEvent('SQL_INJECTION_ATTEMPT', { query: req.query, ip: req.ip });
    return res.status(400).json({ error: 'Invalid query parameters' });
  }

  next();
};

// Production environment validation
export const validateEnvironment = () => {
  const requiredEnvVars = ['JWT_SECRET', 'ENCRYPTION_KEY', 'DATABASE_URL'];
  
  if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'production') {
    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        throw new Error(`Missing required environment variable: ${envVar}`);
      }
    }
  }
};

// Security middleware stack
export const securityMiddleware = [
  getSecurityHeaders(),
  validateRequest,
  (req: Request, res: Response, next: NextFunction) => {
    // Add security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Remove server information
    res.removeHeader('X-Powered-By');
    
    next();
  }
];

export default {
  SECURITY_CONFIG,
  createRateLimiter,
  getSecurityHeaders,
  getCorsOptions,
  validatePasswordStrength,
  sanitizeInput,
  sanitizeSQLInput,
  validateFileUpload,
  generateCSRFToken,
  validateCSRFToken,
  encrypt,
  decrypt,
  logSecurityEvent,
  IPBlocker,
  validateRequest,
  validateEnvironment,
  securityMiddleware
};