import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/error.middleware.js';
import { poolLocal } from '../database/client.js';
import { signToken, refreshToken } from '../utils/auth.js';
import { hashPassword, comparePassword } from '../utils/auth.js';

const router: Router = Router();

/**
 * @openapi
 * /api/v1/auth/login:
 *   post:
 *     tags: [Authentication]
 *     summary: Login and receive JWT token
 *     description: Authenticate with email and password to receive JWT token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     token: { type: string }
 *                     refreshToken: { type: string }
 *                     expiresIn: { type: integer }
 *                     user:
 *                       type: object
 *                       properties:
 *                         id: { type: string }
 *                         email: { type: string }
 *                         name: { type: string }
 *                         roles: { type: array }
 *                         permissions: { type: array }
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    const error: any = new Error('Email and password are required');
    error.status = 400;
    error.code = 'VALIDATION_FAILED';
    throw error;
  }

  // Check core.users table
  const userResult = await poolLocal.query(
    'SELECT id, email, "passwordHash", name, status FROM core.users WHERE email = $1 AND status = \'active\'',
    [email]
  );

  if (userResult.rows.length === 0) {
    const error: any = new Error('Invalid email or password');
    error.status = 401;
    error.code = 'UNAUTHORIZED';
    throw error;
  }

  const user = userResult.rows[0];
  const isValidPassword = await comparePassword(password, user.passwordHash);

  if (!isValidPassword) {
    const error: any = new Error('Invalid email or password');
    error.status = 401;
    error.code = 'UNAUTHORIZED';
    throw error;
  }

  // Get user roles and permissions
  const rolesResult = await poolLocal.query(
    `SELECT r.id, r.name, r.user_type, r.permissions, r.service_access
     FROM core.roles r
     JOIN core.user_role ur ON r.id = ur.role_id
     WHERE ur.user_id = $1`,
    [user.id]
  );

  const permissionsResult = await poolLocal.query(
    `SELECT DISTINCT p.name, p.service
     FROM core.permissions p
     JOIN core.role_permission rp ON p.id = rp.permission_id
     JOIN core.user_role ur ON rp.role_id = ur.role_id
     WHERE ur.user_id = $1`,
    [user.id]
  );

  // Generate tokens
  const token = signToken({
    userId: user.id,
    email: user.email,
    roles: rolesResult.rows.map((r: any) => r.name)
  });

  const refresh = refreshToken(token);

  res.json({
    success: true,
    data: {
      token,
      refreshToken: refresh?.token,
      expiresIn: 3600,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        roles: rolesResult.rows,
        permissions: permissionsResult.rows.map((p: any) => `${p.service}:${p.name}`)
      }
    }
  });
}));

/**
 * @openapi
 * /api/v1/auth/refresh:
 *   post:
 *     tags: [Authentication]
 *     summary: Refresh JWT token
 *     description: Refresh expired JWT token using refresh token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *       401:
 *         description: Invalid refresh token
 */
router.post('/refresh', asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    const error: any = new Error('Refresh token is required');
    error.status = 400;
    error.code = 'VALIDATION_FAILED';
    throw error;
  }

  const result = refreshToken(refreshToken);

  if (!result) {
    const error: any = new Error('Invalid refresh token');
    error.status = 401;
    error.code = 'UNAUTHORIZED';
    throw error;
  }

  res.json({
    success: true,
    data: result
  });
}));

/**
 * @openapi
 * /api/v1/auth/logout:
 *   post:
 *     tags: [Authentication]
 *     summary: Logout and invalidate token
 *     description: Logout current user and invalidate JWT token
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 */
router.post('/logout', asyncHandler(async (req: Request, res: Response) => {
  // Note: In a production environment, you would add the token to a blacklist
  // For now, we'll just return success
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
}));

export default router;