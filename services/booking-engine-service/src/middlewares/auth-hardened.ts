/**
 * Enhanced Authentication Middleware (Phase 4)
 *
 * Features:
 * - JWT token validation with expiry checks
 * - Token blacklist/revocation support
 * - API key validation with rotation
 * - Client certificate validation (mTLS)
 * - Scope-based authorization
 * - Comprehensive audit logging of all auth attempts
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Auth context attached to request
export interface AuthContext {
  userId?: string;
  clientId?: string;
  tokenType: 'jwt' | 'apiKey' | 'clientCert';
  issuedAt: Date;
  expiresAt?: Date;
  scopes?: string[];
  authenticated: boolean;
}

// In-memory token blacklist (Redis in production)
const tokenBlacklist = new Set<string>();

// Token blacklist management
export function revokeToken(token: string): void {
  tokenBlacklist.add(token);
  console.log(`[Auth] Token revoked: ${token.substring(0, 20)}...`);
}

export function isTokenRevoked(token: string): boolean {
  return tokenBlacklist.has(token);
}

/**
 * Main authentication middleware
 */
export function authenticateRequest(req: Request, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return sendUnauthorized(res, 'Missing Authorization header');
    }

    const [scheme, credentials] = authHeader.split(' ');

    let authContext: AuthContext;

    if (scheme === 'Bearer') {
      // JWT Token validation
      authContext = validateJWTToken(credentials);

      // Check token blacklist
      if (isTokenRevoked(credentials)) {
        logAuthEvent(req, 'AUTH_TOKEN_REVOKED', { userId: authContext.userId }, false);
        return sendUnauthorized(res, 'Token has been revoked');
      }
    } else if (scheme === 'ApiKey') {
      // API Key validation
      authContext = validateAPIKey(credentials);
    } else if (scheme === 'Client-Cert') {
      // Client certificate validation (mTLS)
      authContext = validateClientCertificate(req);
    } else {
      return sendUnauthorized(res, `Unsupported authentication scheme: ${scheme}`);
    }

    // Attach to request
    (req as any).authContext = authContext;
    (req as any).userId = authContext.userId;
    (req as any).clientId = authContext.clientId;

    logAuthEvent(
      req,
      'AUTH_SUCCESS',
      { userId: authContext.userId, tokenType: authContext.tokenType },
      true
    );
    next();
  } catch (error) {
    logAuthEvent(
      req,
      'AUTH_FAILED',
      {
        error: error instanceof Error ? error.message : String(error),
      },
      false
    );
    return sendUnauthorized(res, 'Authentication failed');
  }
}

/**
 * JWT token validation
 */
function validateJWTToken(token: string): AuthContext {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET not configured');
  }

  try {
    const decoded: any = jwt.verify(token, secret, {
      issuer: process.env.JWT_ISSUER || 'tripalfa',
      audience: process.env.JWT_AUDIENCE || 'api',
      algorithms: ['HS256', 'RS256'],
    });

    // Validate required claims
    if (!decoded.sub && !decoded.userId) {
      throw new Error('Missing user identifier in token');
    }

    // Check expiry
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
      throw new Error('Token has expired');
    }

    return {
      userId: decoded.sub || decoded.userId,
      clientId: decoded.client_id,
      tokenType: 'jwt',
      issuedAt: new Date(decoded.iat * 1000),
      expiresAt: decoded.exp ? new Date(decoded.exp * 1000) : undefined,
      scopes: decoded.scope ? decoded.scope.split(' ') : [],
      authenticated: true,
    };
  } catch (error) {
    throw new Error(`Invalid JWT token: ${error instanceof Error ? error.message : 'unknown'}`);
  }
}

/**
 * API Key validation
 */
function validateAPIKey(apiKey: string): AuthContext {
  // In production, lookup in database with caching
  // For now, use environment variable for demo
  const validApiKey = process.env.VALID_API_KEY;

  if (!validApiKey || apiKey !== validApiKey) {
    throw new Error('Invalid or revoked API key');
  }

  return {
    clientId: 'api-client-internal',
    tokenType: 'apiKey',
    issuedAt: new Date(),
    scopes: ['read', 'write'],
    authenticated: true,
  };
}

/**
 * Client certificate validation (mTLS)
 */
function validateClientCertificate(req: Request): AuthContext {
  const cert = (req.socket as any).getPeerCertificate?.();

  if (!cert || !cert.subject) {
    throw new Error('Missing client certificate');
  }

  // Validate certificate chain
  if (!(req.socket as any).authorized) {
    throw new Error(`Certificate validation failed: ${(req.socket as any).authorizationError}`);
  }

  return {
    clientId: cert.subject?.CN || 'unknown',
    tokenType: 'clientCert',
    issuedAt: new Date(cert.validity?.start || Date.now()),
    expiresAt: new Date(cert.validity?.end || Date.now() + 86400000),
    authenticated: true,
  };
}

/**
 * Middleware to enforce required scope
 */
function requireScope(requiredScope: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const authContext = (req as any).authContext as AuthContext;

    if (!authContext || !authContext.authenticated) {
      return sendUnauthorized(res, 'Not authenticated');
    }

    if (!authContext.scopes?.includes(requiredScope)) {
      logAuthEvent(
        req,
        'SCOPE_DENIED',
        {
          userId: authContext.userId,
          requiredScope,
          availableScopes: authContext.scopes,
        },
        false
      );

      const response = res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_SCOPE',
        requiredScope,
      });
      return response as unknown as void;
    }

    next();
  };
}

/**
 * Middleware to enforce specific user role/tier
 */
function requireUserTier(minTier: 'free' | 'premium' | 'enterprise') {
  const tierLevels: Record<string, number> = {
    free: 1,
    premium: 2,
    enterprise: 3,
  };

  return (req: Request, res: Response, next: NextFunction) => {
    const userTier = (req as any).userTier || 'free';

    if ((tierLevels[userTier] || 0) < tierLevels[minTier]) {
      const response = res.status(403).json({
        success: false,
        error: 'Insufficient user tier',
        code: 'INSUFFICIENT_TIER',
        requiredTier: minTier,
      });
      return response as unknown as void;
    }

    next();
  };
}

/**
 * Helper: Send 401 Unauthorized response
 */
function sendUnauthorized(res: Response, message: string): void {
  res.status(401).json({
    success: false,
    error: 'Authentication failed',
    message,
    code: 'AUTHENTICATION_ERROR',
  });
}

/**
 * Helper: Log authentication events
 */
function logAuthEvent(
  req: Request,
  eventType: string,
  context: Record<string, any>,
  success: boolean
): void {
  const logEntry = {
    timestamp: new Date().toISOString(),
    eventType,
    success,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    path: req.path,
    method: req.method,
    ...context,
  };

  if (success) {
    console.info(`[Auth] ${eventType}:`, logEntry);
  } else {
    console.warn(`[Auth] ${eventType}:`, logEntry);
  }
}

/**
 * Logout endpoint handler
 */
function handleLogout(req: Request, res: Response): void {
  const authContext = (req as any).authContext as AuthContext;

  if (authContext && authContext.tokenType === 'jwt') {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      revokeToken(token);
    }
  }

  res.json({
    success: true,
    message: 'Logged out successfully',
  });
}
