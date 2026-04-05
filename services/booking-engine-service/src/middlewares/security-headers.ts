/**
 * Security Headers Middleware (Phase 4)
 * 
 * Implements OWASP security best practices:
 * - Content Security Policy (CSP)
 * - HTTP Strict Transport Security (HSTS)
 * - X-Frame-Options (clickjacking protection)
 * - X-Content-Type-Options (MIME sniffing prevention)
 * - Referrer-Policy (privacy)
 * - Permissions-Policy (feature control)
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Apply security headers middleware
 */
export function securityHeaders(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Content Security Policy
  res.setHeader(
    'Content-Security-Policy',
    buildCSP()
  );

  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Enable XSS Protection (deprecated but still useful)
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions Policy (Feature Policy)
  res.setHeader(
    'Permissions-Policy',
    buildPermissionsPolicy()
  );

  // HTTP Strict Transport Security
  if (isProduction()) {
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  // Remove identifying headers
  res.removeHeader('Server');
  res.removeHeader('X-Powered-By');
  res.removeHeader('X-AspNet-Version');
  res.removeHeader('X-AspNetMvc-Version');

  next();
}

/**
 * Build Content Security Policy header value
 */
function buildCSP(): string {
  const isDev = !isProduction();

  const cspDirectives = [
    "default-src 'self'",
    getDevelopmentDirectives(isDev),
    "script-src 'self' https://cdn.jsdelivr.net",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https:",
    "font-src 'self' 'unsafe-inline' https://fonts.gstatic.com data:",
    "connect-src 'self' https://api.liteapi.io https://api.duffel.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
    "block-all-mixed-content",
  ];

  return cspDirectives.join('; ');
}

/**
 * Build Permissions Policy header value
 */
function buildPermissionsPolicy(): string {
  return [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'payment=(self)',
    'usb=()',
    'accelerometer=()',
    'gyroscope=()',
    'magnetometer=()',
  ].join(', ');
}

/**
 * Get development-specific CSP directives
 */
function getDevelopmentDirectives(isDev: boolean): string {
  if (!isDev) {
    return '';
  }

  // Allow unsafe-inline for development (live reload, hot module replacement)
  return "script-src 'self' 'unsafe-inline' 'unsafe-eval'";
}

/**
 * Check if running in production
 */
function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Get security headers summary (for debugging)
 */
export function getSecurityHeadersSummary(): Record<string, string> {
  const isDev = !isProduction();

  return {
    'Content-Security-Policy': buildCSP(),
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': buildPermissionsPolicy(),
    'Strict-Transport-Security': isProduction()
      ? 'max-age=31536000; includeSubDomains; preload'
      : '(development - HSTS disabled)',
  };
}

/**
 * Middleware to log security headers (debugging)
 */
function logSecurityHeaders(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const originalSend = res.send;

  res.send = function(data: any) {
    const headers = getSecurityHeadersSummary();
    console.debug('[Security] Applied headers:', {
      path: req.path,
      method: req.method,
      headers,
    });

    return originalSend.call(this, data);
  };

  next();
}

/**
 * Middleware to enforce HTTPS redirect (production)
 */
function enforceHttps(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!isProduction()) {
    return next();
  }

  // Check for HTTPS
  if (req.header('x-forwarded-proto') !== 'https' && req.protocol !== 'https') {
    return res.redirect(301, `https://${req.get('host')}${req.url}`);
  }

  next();
}
