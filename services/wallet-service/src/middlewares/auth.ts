// src/middlewares/auth.ts
// JWT authentication middleware

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger.js';
import { AuthPayload } from '../types/index.js';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required. Set it before starting the server.');
}

// Note: Express Request interface is extended globally for compatibility

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'Missing or invalid authorization header',
    });
    return;
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthPayload;
    req.user = decoded;
    req.userId = decoded.userId;
    next();
  } catch (err) {
    logger.error('JWT verification failed', err as Error);
    res.status(401).json({
      error: 'Invalid or expired token',
    });
  }
}

/**
 * Generate a JWT token for a user (used in sign-up/login)
 */
export function generateToken(userId: string): string {
  return jwt.sign(
    { userId, iat: Math.floor(Date.now() / 1000) },
    JWT_SECRET,
    {
      expiresIn: '24h',
    }
  );
}

export default authMiddleware;
