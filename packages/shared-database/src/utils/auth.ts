// ============================================================
// AUTHENTICATION UTILITIES
// ============================================================
// JWT token generation and verification
// Password hashing and comparison
// ============================================================

import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

// ============================================================
// JWT Configuration
// ============================================================

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_PRIVATE_KEY = process.env.JWT_PRIVATE_KEY || '';
const JWT_PUBLIC_KEY = process.env.JWT_PUBLIC_KEY || '';

// ============================================================
// Token Generation
// ============================================================

export const signToken = (payload: any, expiresIn: string = '1h'): string => {
  // Use RS256 if private key is available, otherwise use HS256
  if (JWT_PRIVATE_KEY && JWT_PRIVATE_KEY.length > 0) {
    return jwt.sign(payload, JWT_PRIVATE_KEY, {
      algorithm: 'RS256',
      expiresIn,
    } as jwt.SignOptions);
  }
  
  // Fallback to HS256 with JWT_SECRET
  const secret = JWT_SECRET || 'default-secret-key';
  return jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);
};

// ============================================================
// Token Verification
// ============================================================

export const verifyToken = (token: string): any => {
  try {
    // Use RS256 if public key is available, otherwise use HS256
    if (JWT_PUBLIC_KEY && JWT_PUBLIC_KEY.length > 0) {
      return jwt.verify(token, JWT_PUBLIC_KEY, { algorithms: ['RS256'] } as jwt.VerifyOptions);
    }
    
    const secret = JWT_SECRET || 'default-secret-key';
    return jwt.verify(token, secret);
  } catch (error) {
    return null;
  }
};

// ============================================================
// Password Hashing
// ============================================================

export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

// ============================================================
// Password Comparison
// ============================================================

export const comparePassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};

// ============================================================
// Token Refresh
// ============================================================

export const refreshToken = (refreshToken: string): any => {
  try {
    const decoded = verifyToken(refreshToken);
    
    if (!decoded) {
      return null;
    }

    // Generate new access token
    const newToken = signToken(
      { userId: decoded.userId, email: decoded.email },
      '1h'
    );

    return { token: newToken };
  } catch (error) {
    return null;
  }
};

// ============================================================
// Token Blacklist (for logout)
// ============================================================

const tokenBlacklist = new Set<string>();

export const blacklistToken = (token: string): void => {
  tokenBlacklist.add(token);
};

export const isTokenBlacklisted = (token: string): boolean => {
  return tokenBlacklist.has(token);
};

export default {
  signToken,
  verifyToken,
  hashPassword,
  comparePassword,
  refreshToken,
  blacklistToken,
  isTokenBlacklisted,
};