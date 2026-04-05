import { Router, Request, Response } from 'express';
import type { RequestHandler } from 'express';
import { fusionAuthService } from '../services/fusionauth.service.js';
import { authMiddleware, requireRole, AuthRequest } from '../middleware/auth.middleware.js';
import { prisma } from '../database.js';
import bcrypt from 'bcryptjs';

const router: Router = Router();

const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecialChar: true,
};

function validatePassword(password: string): string[] {
  const errors: string[] = [];

  if (password.length < PASSWORD_REQUIREMENTS.minLength) {
    errors.push(`Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters`);
  }

  if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (PASSWORD_REQUIREMENTS.requireNumber && !/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (
    PASSWORD_REQUIREMENTS.requireSpecialChar &&
    !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
  ) {
    errors.push('Password must contain at least one special character');
  }

  return errors;
}

/**
 * @swagger
 * /auth/fusionauth/users:
 *   get:
 *     summary: List users
 *     tags: [FusionAuth User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: applicationId
 *         schema:
 *           type: string
 *       - in: query
 *         name: results
 *         schema:
 *           type: integer
 *           default: 100
 *       - in: query
 *         name: startRow
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: Users returned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
 */
router.get(
  '/',
  authMiddleware as any,
  requireRole('SUPER_ADMIN', 'B2B_ADMIN') as any,
  async (req: AuthRequest, res: Response) => {
    try {
      const { applicationId, results, startRow } = req.query;

      const result = await fusionAuthService.listUsers(
        applicationId as string,
        parseInt(results as string) || 100,
        parseInt(startRow as string) || 0
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * @swagger
 * /auth/fusionauth/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [FusionAuth User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User returned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
 */
router.get(
  '/:id',
  authMiddleware as any,
  requireRole('SUPER_ADMIN', 'B2B_ADMIN') as any,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const user = await fusionAuthService.getUserById(userId);

      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found',
        });
        return;
      }

      res.json({
        success: true,
        data: user,
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * @swagger
 * /auth/fusionauth/users:
 *   post:
 *     summary: Create user
 *     tags: [FusionAuth User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               userType:
 *                 type: string
 *               roles:
 *                 type: array
 *                 items:
 *                   type: string
 *               sendPasswordEmail:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: User created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
 */
router.post(
  '/',
  authMiddleware as any,
  requireRole('SUPER_ADMIN', 'B2B_ADMIN') as any,
  async (req: AuthRequest, res: Response) => {
    try {
      const { email, password, firstName, lastName, userType, roles, sendPasswordEmail } = req.body;

      if (!email) {
        res.status(400).json({
          success: false,
          error: 'Email is required',
        });
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        res.status(400).json({
          success: false,
          error: 'Invalid email format',
        });
        return;
      }

      if (password) {
        const passwordErrors = validatePassword(password);
        if (passwordErrors.length > 0) {
          res.status(400).json({
            success: false,
            error: 'Password does not meet requirements',
            details: passwordErrors,
          });
          return;
        }
      }

      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        res.status(400).json({
          success: false,
          error: 'User with this email already exists',
        });
        return;
      }

      const userTypeValue = userType || 'B2C';
      const appId = fusionAuthService.getApplicationId(userTypeValue);

      const userData: any = {
        email,
        firstName,
        lastName,
        active: true,
        verified: false,
        data: {
          userType: userTypeValue,
        },
      };

      if (password && !sendPasswordEmail) {
        userData.password = password;
      }

      const fusionAuthResponse = await fusionAuthService.createUser(userData, [
        {
          applicationId: appId,
          roles: roles || [userTypeValue === 'B2B' ? 'b2b_admin' : 'b2c_user'],
        },
      ]);

      const defaultRole = await prisma.role.findFirst({
        where: {
          name: userTypeValue === 'B2B' ? 'B2B_ADMIN' : 'B2C_USER',
          userType: userTypeValue as any,
        },
      });

      const passwordHash = password ? await bcrypt.hash(password, 12) : null;

      const localUser = await prisma.user.create({
        data: {
          email,
          firstName,
          lastName,
          passwordHash,
          externalId: fusionAuthResponse.user?.id,
          userType: userTypeValue as any,
          authProvider: 'FUSIONAUTH' as any,
          isEmailVerified: false,
          roleId: defaultRole?.id,
        },
      });

      res.status(201).json({
        success: true,
        data: {
          id: localUser.id,
          fusionAuthId: fusionAuthResponse.user?.id,
          email: localUser.email,
          firstName: localUser.firstName,
          lastName: localUser.lastName,
          userType: localUser.userType,
          registrationPending: !password || sendPasswordEmail,
        },
      });
    } catch (error: unknown) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * @swagger
 * /auth/fusionauth/users/{id}:
 *   put:
 *     summary: Update user
 *     tags: [FusionAuth User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *               active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: User updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
 */
router.put(
  '/:id',
  authMiddleware as any,
  requireRole('SUPER_ADMIN', 'B2B_ADMIN') as any,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { firstName, lastName, email, active } = req.body;

      const fusionAuthUser = await fusionAuthService.updateUser(userId, {
        firstName,
        lastName,
        email,
        active,
      });

      const localUser = await prisma.user.findFirst({
        where: { externalId: userId },
      });

      if (localUser) {
        await prisma.user.update({
          where: { id: localUser.id },
          data: {
            firstName: firstName || localUser.firstName,
            lastName: lastName || localUser.lastName,
            email: email || localUser.email,
            isActive: active !== undefined ? active : localUser.isActive,
          },
        });
      }

      res.json({
        success: true,
        data: fusionAuthUser,
      });
    } catch (error: unknown) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * @swagger
 * /auth/fusionauth/users/{id}:
 *   delete:
 *     summary: Delete user
 *     tags: [FusionAuth User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
 */
router.delete(
  '/:id',
  authMiddleware as any,
  requireRole('SUPER_ADMIN') as any,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      await fusionAuthService.deleteUser(userId);

      const localUser = await prisma.user.findFirst({
        where: { externalId: userId },
      });

      if (localUser) {
        await prisma.user.update({
          where: { id: localUser.id },
          data: { isActive: false },
        });
      }

      res.json({
        success: true,
        message: 'User deleted successfully',
      });
    } catch (error: unknown) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * @swagger
 * /auth/fusionauth/users/{id}/roles:
 *   post:
 *     summary: Assign role to user
 *     tags: [FusionAuth User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - applicationId
 *               - roleName
 *             properties:
 *               applicationId:
 *                 type: string
 *               roleName:
 *                 type: string
 *     responses:
 *       200:
 *         description: Role assigned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
 */
router.post(
  '/:id/roles',
  authMiddleware as any,
  requireRole('SUPER_ADMIN', 'B2B_ADMIN') as any,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { applicationId, roleName } = req.body;

      if (!applicationId || !roleName) {
        res.status(400).json({
          success: false,
          error: 'Application ID and role name are required',
        });
        return;
      }

      await fusionAuthService.assignRoleToUser(userId, applicationId, roleName);

      res.json({
        success: true,
        message: 'Role assigned successfully',
      });
    } catch (error: unknown) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * @swagger
 * /auth/fusionauth/users/{id}/roles:
 *   delete:
 *     summary: Remove role from user
 *     tags: [FusionAuth User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - applicationId
 *               - roleName
 *             properties:
 *               applicationId:
 *                 type: string
 *               roleName:
 *                 type: string
 *     responses:
 *       200:
 *         description: Role removed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
 */
router.delete(
  '/:id/roles',
  authMiddleware as any,
  requireRole('SUPER_ADMIN', 'B2B_ADMIN') as any,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { applicationId, roleName } = req.body;

      if (!applicationId || !roleName) {
        res.status(400).json({
          success: false,
          error: 'Application ID and role name are required',
        });
        return;
      }

      await fusionAuthService.removeRoleFromUser(userId, applicationId, roleName);

      res.json({
        success: true,
        message: 'Role removed successfully',
      });
    } catch (error: unknown) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * @swagger
 * /auth/fusionauth/users/{id}/password:
 *   post:
 *     summary: Change user password
 *     tags: [FusionAuth User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newPassword
 *             properties:
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password changed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Missing password or does not meet requirements
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
 */
router.post(
  '/:id/password',
  authMiddleware as any,
  requireRole('SUPER_ADMIN', 'B2B_ADMIN') as any,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { newPassword } = req.body;

      if (!newPassword) {
        res.status(400).json({
          success: false,
          error: 'New password is required',
        });
        return;
      }

      const passwordErrors = validatePassword(newPassword);
      if (passwordErrors.length > 0) {
        res.status(400).json({
          success: false,
          error: 'Password does not meet requirements',
          details: passwordErrors,
        });
        return;
      }

      await fusionAuthService.changePassword(userId, '', newPassword);

      const localUser = await prisma.user.findFirst({
        where: { externalId: userId },
      });

      if (localUser) {
        const passwordHash = await bcrypt.hash(newPassword, 12);
        await prisma.user.update({
          where: { id: localUser.id },
          data: { passwordHash },
        });
      }

      res.json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error: unknown) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * @swagger
 * /auth/fusionauth/users/{id}/registrations:
 *   get:
 *     summary: Get user registrations
 *     tags: [FusionAuth User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Registrations returned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
 */
router.get(
  '/:id/registrations',
  authMiddleware as any,
  requireRole('SUPER_ADMIN', 'B2B_ADMIN') as any,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const registrations = await fusionAuthService.getUserRegistrations(userId);

      res.json({
        success: true,
        data: registrations,
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * @swagger
 * /auth/fusionauth/users/{id}/registrations:
 *   post:
 *     summary: Register user to application
 *     tags: [FusionAuth User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - applicationId
 *             properties:
 *               applicationId:
 *                 type: string
 *               roles:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: User registered to application
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Missing application ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
 */
router.post(
  '/:id/registrations',
  authMiddleware as any,
  requireRole('SUPER_ADMIN', 'B2B_ADMIN') as any,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { applicationId, roles } = req.body;

      if (!applicationId) {
        res.status(400).json({
          success: false,
          error: 'Application ID is required',
        });
        return;
      }

      await fusionAuthService.registerUserToApplication(userId, applicationId, roles || []);

      res.json({
        success: true,
        message: 'User registered to application successfully',
      });
    } catch (error: unknown) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

export default router;
