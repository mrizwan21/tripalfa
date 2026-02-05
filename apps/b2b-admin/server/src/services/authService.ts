import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { 
  User, 
  UserCreate, 
  LoginRequest, 
  LoginResponse, 
  UserRole, 
  AuthToken,
  LoginAttempt,
  SecurityEvent
} from '../types/auth';
import { Database } from '../utils/database.js';
import { SecurityMiddleware } from '../middleware/security.js';
import { logger } from '../utils/logger.js';

const JWT_SECRET = process.env.JWT_SECRET || 'tripalfa-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

export class AuthService {
  private db: Database;
  private rateLimiter = SecurityMiddleware.createRateLimiter(5, 300000); // 5 attempts per 5 minutes

  constructor() {
    this.db = new Database();
  }

  /**
   * Register a new user
   */
  async register(userData: UserCreate): Promise<User> {
    try {
      // Validate input
      const sanitizedData = {
        ...userData,
        email: SecurityMiddleware.sanitizeEmail(userData.email),
        name: SecurityMiddleware.sanitizeInput(userData.name),
        phone: userData.phone ? SecurityMiddleware.sanitizePhone(userData.phone) : undefined
      };

      // Check if user already exists
      const existingUser = await this.db.findUserByEmail(sanitizedData.email);
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(sanitizedData.password, saltRounds);

      // Create user
      const user: User = {
        id: uuidv4(),
        email: sanitizedData.email,
        name: sanitizedData.name,
        phone: sanitizedData.phone,
        password: hashedPassword,
        isActive: true,
        isVerified: false,
        role: sanitizedData.role || UserRole.B2B,
        companyId: sanitizedData.companyId,
        branchId: sanitizedData.branchId,
        createdAt: new Date(),
        updatedAt: new Date(),
        failedLoginAttempts: 0,
        lastLoginAt: undefined,
        lockedUntil: undefined
      };

      const createdUser = await this.db.createUser(user);

      // Log security event
      await this.logSecurityEvent('USER_REGISTERED', {
        userId: createdUser.id,
        email: createdUser.email,
        role: createdUser.role
      });

      logger.info(`User registered: ${createdUser.email}`, { userId: createdUser.id });

      // Remove password from response
      const { password, ...userResponse } = createdUser;
      return userResponse;
    } catch (error) {
      logger.error('Registration failed', error);
      throw error;
    }
  }

  /**
   * Authenticate user login
   */
  async login(loginData: LoginRequest, ipAddress: string, userAgent: string): Promise<LoginResponse> {
    try {
      const { email, password, rememberMe = false } = loginData;

      // Rate limiting
      const identifier = `${ipAddress}:${email}`;
      const rateLimitResult = this.rateLimiter(identifier);
      
      if (!rateLimitResult.allowed) {
        throw new Error(`Too many login attempts. Try again in ${Math.ceil((rateLimitResult.resetTime! - Date.now()) / 60000)} minutes.`);
      }

      // Sanitize input
      const sanitizedEmail = SecurityMiddleware.sanitizeEmail(email);

      // Find user
      const user = await this.db.findUserByEmail(sanitizedEmail);
      if (!user) {
        await this.recordLoginAttempt(sanitizedEmail, ipAddress, userAgent, false);
        throw new Error('Invalid email or password');
      }

      // Check if account is locked
      if (user.lockedUntil && user.lockedUntil > new Date()) {
        throw new Error('Account is temporarily locked due to too many failed login attempts');
      }

      // Check if account is active
      if (!user.isActive) {
        throw new Error('Account is deactivated');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      
      if (!isPasswordValid) {
        await this.recordLoginAttempt(sanitizedEmail, ipAddress, userAgent, false);
        
        // Increment failed attempts
        const newFailedAttempts = user.failedLoginAttempts + 1;
        const lockedUntil = newFailedAttempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : undefined;

        await this.db.updateUser(user.id, {
          failedLoginAttempts: newFailedAttempts,
          lockedUntil
        });

        throw new Error('Invalid email or password');
      }

      // Successful login
      await this.recordLoginAttempt(sanitizedEmail, ipAddress, userAgent, true);
      await this.db.updateUser(user.id, {
        failedLoginAttempts: 0,
        lockedUntil: undefined,
        lastLoginAt: new Date()
      });

      // Generate tokens
      const expiresIn = rememberMe ? '30d' : JWT_EXPIRES_IN;
      const token = this.generateAccessToken(user, expiresIn);
      const refreshToken = this.generateRefreshToken(user);

      // Log security event
      await this.logSecurityEvent('USER_LOGIN_SUCCESS', {
        userId: user.id,
        email: user.email,
        ipAddress,
        userAgent
      });

      logger.info(`User logged in: ${user.email}`, { userId: user.id, ipAddress });

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          companyId: user.companyId,
          branchId: user.branchId,
          isActive: user.isActive
        },
        token,
        refreshToken,
        expiresIn: this.parseExpiresIn(expiresIn)
      };
    } catch (error) {
      logger.error('Login failed', error);
      throw error;
    }
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken: string): Promise<{ token: string; expiresIn: number }> {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, JWT_SECRET) as AuthToken;
      
      // Check if user still exists and is active
      const user = await this.db.findUserById(decoded.userId);
      if (!user || !user.isActive) {
        throw new Error('Invalid refresh token');
      }

      // Generate new access token
      const token = this.generateAccessToken(user);
      const expiresIn = this.parseExpiresIn(JWT_EXPIRES_IN);

      logger.info(`Token refreshed for user: ${user.email}`, { userId: user.id });

      return { token, expiresIn };
    } catch (error) {
      logger.error('Token refresh failed', error);
      throw new Error('Invalid refresh token');
    }
  }

  /**
   * Change user password
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    try {
      const user = await this.db.findUserById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        throw new Error('Current password is incorrect');
      }

      // Validate new password
      const passwordValidation = SecurityMiddleware.validatePasswordStrength(newPassword);
      if (!passwordValidation.isValid) {
        throw new Error(`Password validation failed: ${passwordValidation.errors.join(', ')}`);
      }

      // Hash new password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      await this.db.updateUser(userId, { password: hashedPassword });

      // Log security event
      await this.logSecurityEvent('PASSWORD_CHANGED', {
        userId,
        email: user.email
      });

      logger.info(`Password changed for user: ${user.email}`, { userId });
    } catch (error) {
      logger.error('Password change failed', error);
      throw error;
    }
  }

  /**
   * Verify JWT token
   */
  verifyToken(token: string): AuthToken | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as AuthToken;
      return decoded;
    } catch (error) {
      logger.error('Token verification failed', error);
      return null;
    }
  }

  /**
   * Check if user has required permissions
   */
  async checkPermission(userId: string, resource: string, action: string): Promise<boolean> {
    try {
      const user = await this.db.findUserById(userId);
      if (!user || !user.isActive) {
        return false;
      }

      // For now, implement basic role-based permissions
      // In a full implementation, this would check against a permissions table
      const rolePermissions: Record<UserRole, string[]> = {
        [UserRole.SUPER_ADMIN]: ['*'],
        [UserRole.ADMIN]: ['company:read', 'company:update', 'user:read', 'user:update'],
        [UserRole.B2B]: ['company:read', 'user:read'],
        [UserRole.B2C]: ['user:read'],
        [UserRole.API]: ['api:access']
      };

      const userPermissions = rolePermissions[user.role] || [];
      
      // Check if user has wildcard permissions or specific permission
      return userPermissions.includes('*') || userPermissions.includes(`${resource}:${action}`);
    } catch (error) {
      logger.error('Permission check failed', error);
      return false;
    }
  }

  /**
   * Generate access token
   */
  private generateAccessToken(user: User, expiresIn: string = JWT_EXPIRES_IN): string {
    const payload: AuthToken = {
      userId: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
      branchId: user.branchId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + this.parseExpiresIn(expiresIn)
    };

    return jwt.sign(payload, JWT_SECRET, { expiresIn: expiresIn as any });
  }

  /**
   * Generate refresh token
   */
  private generateRefreshToken(user: User): string {
    const payload = {
      userId: user.id,
      type: 'refresh',
      iat: Math.floor(Date.now() / 1000)
    };

    return jwt.sign(payload, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN as any });
  }

  /**
   * Parse expires in string to seconds
   */
  private parseExpiresIn(expiresIn: string): number {
    const units: Record<string, number> = {
      's': 1,
      'm': 60,
      'h': 3600,
      'd': 86400
    };

    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) {
      return 86400; // Default 24 hours
    }

    const [, value, unit] = match;
    return parseInt(value) * units[unit];
  }

  /**
   * Record login attempt
   */
  private async recordLoginAttempt(email: string, ipAddress: string, userAgent: string, success: boolean): Promise<void> {
    const loginAttempt: LoginAttempt = {
      id: uuidv4(),
      email,
      ipAddress,
      userAgent,
      success,
      createdAt: new Date()
    };

    await this.db.createLoginAttempt(loginAttempt);
  }

  /**
   * Log security event
   */
  private async logSecurityEvent(action: string, details: Record<string, unknown>): Promise<void> {
    const securityEvent: SecurityEvent = {
      id: uuidv4(),
      action,
      resource: 'auth',
      details,
      ipAddress: details.ipAddress as string || 'unknown',
      userAgent: details.userAgent as string || 'unknown',
      createdAt: new Date()
    };

    await this.db.createSecurityEvent(securityEvent);
  }
}

export const authService = new AuthService();