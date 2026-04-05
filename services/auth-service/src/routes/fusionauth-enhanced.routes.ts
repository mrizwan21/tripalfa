import { Router, Request, Response } from 'express';
import type { RequestHandler } from 'express';
import { fusionAuthRoleService } from '../services/fusionauth-role.service.js';
import { fusionAuthService } from '../services/fusionauth-social.service.js';
import { fusionAuthMFAService } from '../services/fusionauth-mfa.service.js';
import { fusionAuthSSOService } from '../services/fusionauth-sso.service.js';
import { authMiddleware, requireRole, AuthRequest } from '../middleware/auth.middleware.js';
import { prisma } from '../database.js';

const router: Router = Router();

/**
 * @swagger
 * /auth/fusionauth/roles/{applicationId}:
 *   get:
 *     summary: Get all roles for an application
 *     tags: [FusionAuth Enhanced]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: applicationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Roles returned
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
  '/roles/:applicationId',
  authMiddleware as any,
  requireRole('SUPER_ADMIN', 'B2B_ADMIN') as any,
  async (req: AuthRequest, res: Response) => {
    try {
      const roles = await fusionAuthRoleService.getApplicationRoles(
        Array.isArray(req.params.applicationId)
          ? req.params.applicationId[0]
          : req.params.applicationId
      );

      res.json({
        success: true,
        data: roles,
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
 * /auth/fusionauth/roles/{applicationId}:
 *   post:
 *     summary: Create a new role
 *     tags: [FusionAuth Enhanced]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: applicationId
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
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               isDefault:
 *                 type: boolean
 *               isSuperRole:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Role created
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
 *         description: Missing role name or bad request
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
  '/roles/:applicationId',
  authMiddleware as any,
  requireRole('SUPER_ADMIN', 'B2B_ADMIN') as any,
  async (req: AuthRequest, res: Response) => {
    try {
      const { name, description, isDefault, isSuperRole } = req.body;

      if (!name) {
        res.status(400).json({
          success: false,
          error: 'Role name is required',
        });
        return;
      }

      const role = await fusionAuthRoleService.createRole(
        Array.isArray(req.params.applicationId)
          ? req.params.applicationId[0]
          : req.params.applicationId,
        {
          name,
          description,
          isDefault,
          isSuperRole,
        }
      );

      res.status(201).json({
        success: true,
        data: role,
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
 * /auth/fusionauth/roles/{applicationId}/{roleName}:
 *   put:
 *     summary: Update a role
 *     tags: [FusionAuth Enhanced]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: applicationId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: roleName
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Role updated
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
  '/roles/:applicationId/:roleName',
  authMiddleware as any,
  requireRole('SUPER_ADMIN', 'B2B_ADMIN') as any,
  async (req: AuthRequest, res: Response) => {
    try {
      const role = await fusionAuthRoleService.updateRole(
        Array.isArray(req.params.applicationId)
          ? req.params.applicationId[0]
          : req.params.applicationId,
        Array.isArray(req.params.roleName) ? req.params.roleName[0] : req.params.roleName,
        req.body
      );

      res.json({
        success: true,
        data: role,
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
 * /auth/fusionauth/roles/{applicationId}/{roleName}:
 *   delete:
 *     summary: Delete a role
 *     tags: [FusionAuth Enhanced]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: applicationId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: roleName
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Role deleted
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
  '/roles/:applicationId/:roleName',
  authMiddleware as any,
  requireRole('SUPER_ADMIN') as any,
  async (req: AuthRequest, res: Response) => {
    try {
      await fusionAuthRoleService.deleteRole(
        Array.isArray(req.params.applicationId)
          ? req.params.applicationId[0]
          : req.params.applicationId,
        Array.isArray(req.params.roleName) ? req.params.roleName[0] : req.params.roleName
      );

      res.json({
        success: true,
        message: 'Role deleted successfully',
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
 * /auth/fusionauth/users/{userId}/roles/{applicationId}/{roleName}:
 *   post:
 *     summary: Assign role to user
 *     tags: [FusionAuth Enhanced]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: applicationId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: roleName
 *         required: true
 *         schema:
 *           type: string
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
  '/users/:userId/roles/:applicationId/:roleName',
  authMiddleware as any,
  requireRole('SUPER_ADMIN', 'B2B_ADMIN') as any,
  async (req: AuthRequest, res: Response) => {
    try {
      await fusionAuthRoleService.assignRoleToUser(
        Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId,
        Array.isArray(req.params.applicationId)
          ? req.params.applicationId[0]
          : req.params.applicationId,
        Array.isArray(req.params.roleName) ? req.params.roleName[0] : req.params.roleName
      );

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
 * /auth/fusionauth/users/{userId}/roles/{applicationId}/{roleName}:
 *   delete:
 *     summary: Remove role from user
 *     tags: [FusionAuth Enhanced]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: applicationId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: roleName
 *         required: true
 *         schema:
 *           type: string
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
  '/users/:userId/roles/:applicationId/:roleName',
  authMiddleware as any,
  requireRole('SUPER_ADMIN', 'B2B_ADMIN') as any,
  async (req: AuthRequest, res: Response) => {
    try {
      await fusionAuthRoleService.removeRoleFromUser(
        Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId,
        Array.isArray(req.params.applicationId)
          ? req.params.applicationId[0]
          : req.params.applicationId,
        Array.isArray(req.params.roleName) ? req.params.roleName[0] : req.params.roleName
      );

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
 * /auth/fusionauth/users/{userId}/roles/{applicationId}:
 *   get:
 *     summary: Get user roles for application
 *     tags: [FusionAuth Enhanced]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: applicationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User roles returned
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
  '/users/:userId/roles/:applicationId',
  authMiddleware as any,
  async (req: AuthRequest, res: Response) => {
    try {
      const roles = await fusionAuthRoleService.getUserRoles(
        Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId,
        Array.isArray(req.params.applicationId)
          ? req.params.applicationId[0]
          : req.params.applicationId
      );

      res.json({
        success: true,
        data: roles,
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
 * /auth/fusionauth/roles/initialize/b2b:
 *   post:
 *     summary: Initialize B2B roles
 *     tags: [FusionAuth Enhanced]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: B2B roles initialized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
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
router.post(
  '/roles/initialize/b2b',
  authMiddleware as any,
  requireRole('SUPER_ADMIN') as any,
  async (req: AuthRequest, res: Response) => {
    try {
      await fusionAuthRoleService.initializeB2BRoles();

      res.json({
        success: true,
        message: 'B2B roles initialized successfully',
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
 * /auth/fusionauth/roles/initialize/b2c:
 *   post:
 *     summary: Initialize B2C roles
 *     tags: [FusionAuth Enhanced]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: B2C roles initialized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
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
router.post(
  '/roles/initialize/b2c',
  authMiddleware as any,
  requireRole('SUPER_ADMIN') as any,
  async (req: AuthRequest, res: Response) => {
    try {
      await fusionAuthRoleService.initializeB2CRoles();

      res.json({
        success: true,
        message: 'B2C roles initialized successfully',
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
 * /auth/fusionauth/social/providers:
 *   get:
 *     summary: Get configured social providers
 *     tags: [FusionAuth Enhanced]
 *     responses:
 *       200:
 *         description: Social providers returned
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
router.get('/social/providers', (req: Request, res: Response) => {
  try {
    const providers = fusionAuthService.getConfiguredProviders();

    res.json({
      success: true,
      data: providers,
    });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @swagger
 * /auth/fusionauth/mfa/status:
 *   get:
 *     summary: Check MFA status
 *     tags: [FusionAuth Security]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: MFA status returned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     enabled:
 *                       type: boolean
 *                     methods:
 *                       type: array
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
router.get('/mfa/status', authMiddleware as any, async (req: AuthRequest, res: Response) => {
  try {
    const enabled = await fusionAuthMFAService.isMFAEnabled(req.user!.sub);
    const methods = await fusionAuthMFAService.getMFAMethods(req.user!.sub);

    res.json({
      success: true,
      data: {
        enabled,
        methods,
      },
    });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @swagger
 * /auth/fusionauth/mfa/recovery-codes:
 *   post:
 *     summary: Generate recovery codes
 *     tags: [FusionAuth Security]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Recovery codes generated
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
router.post(
  '/mfa/recovery-codes',
  authMiddleware as any,
  async (req: AuthRequest, res: Response) => {
    try {
      const codes = await fusionAuthMFAService.generateRecoveryCodes(req.user!.sub);

      res.json({
        success: true,
        data: codes,
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
 * /auth/fusionauth/sso/config/{companyId}:
 *   get:
 *     summary: Get SSO config for company
 *     tags: [FusionAuth Security]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: SSO config returned
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
  '/sso/config/:companyId',
  authMiddleware as any,
  requireRole('SUPER_ADMIN', 'B2B_ADMIN') as any,
  async (req: AuthRequest, res: Response) => {
    try {
      const companyId = Array.isArray(req.params.companyId)
        ? req.params.companyId[0]
        : req.params.companyId;
      const config = await fusionAuthSSOService.getSSOConfig(companyId);

      res.json({
        success: true,
        data: config,
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
 * /auth/fusionauth/sso/saml/{companyId}:
 *   post:
 *     summary: Configure SAML SSO
 *     tags: [FusionAuth Security]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: SAML SSO configured
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
  '/sso/saml/:companyId',
  authMiddleware as any,
  requireRole('SUPER_ADMIN', 'B2B_ADMIN') as any,
  async (req: AuthRequest, res: Response) => {
    try {
      const companyId = Array.isArray(req.params.companyId)
        ? req.params.companyId[0]
        : req.params.companyId;
      const config = await fusionAuthSSOService.configureSAMLSSO({
        ...req.body,
        companyId,
        provider: 'saml',
      });

      res.json({
        success: true,
        data: config,
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
 * /auth/fusionauth/sso/oidc/{companyId}:
 *   post:
 *     summary: Configure OIDC SSO
 *     tags: [FusionAuth Security]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: OIDC SSO configured
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
  '/sso/oidc/:companyId',
  authMiddleware as any,
  requireRole('SUPER_ADMIN', 'B2B_ADMIN') as any,
  async (req: AuthRequest, res: Response) => {
    try {
      const companyId = Array.isArray(req.params.companyId)
        ? req.params.companyId[0]
        : req.params.companyId;
      const config = await fusionAuthSSOService.configureOIDCSSO({
        ...req.body,
        companyId,
        provider: 'oidc',
      });

      res.json({
        success: true,
        data: config,
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
 * /auth/fusionauth/sso/login/{providerId}:
 *   get:
 *     summary: Get SSO login URL
 *     tags: [FusionAuth Security]
 *     parameters:
 *       - in: path
 *         name: providerId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: redirectUri
 *         schema:
 *           type: string
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: SSO login URL returned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     authUrl:
 *                       type: string
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
router.get('/sso/login/:providerId', (req: Request, res: Response) => {
  try {
    const { providerId } = req.params;
    const { redirectUri, state } = req.query;

    const authUrl = fusionAuthSSOService.getSSOLoginUrl(
      Array.isArray(providerId) ? providerId[0] : providerId,
      typeof redirectUri === 'string' ? redirectUri : undefined,
      typeof state === 'string' ? state : undefined
    );

    res.json({
      success: true,
      authUrl,
    });
  } catch (error: unknown) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @swagger
 * /auth/fusionauth/sso/callback:
 *   get:
 *     summary: Handle SSO callback
 *     tags: [FusionAuth Security]
 *     parameters:
 *       - in: query
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: providerId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: redirectUri
 *         schema:
 *           type: string
 *     responses:
 *       302:
 *         description: Redirect to frontend with tokens
 *       400:
 *         description: Missing required parameters
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
router.get('/sso/callback', async (req: Request, res: Response) => {
  try {
    const { code, providerId, redirectUri } = req.query;

    if (!code || !providerId) {
      res.status(400).json({
        success: false,
        error: 'Code and provider ID are required',
      });
      return;
    }

    const result = await fusionAuthSSOService.handleSSOCallback(
      code as string,
      providerId as string,
      redirectUri as string
    );

    if (result.success) {
      const frontendUrl = process.env.B2B_FRONTEND_URL || 'http://localhost:5173';
      const params = new URLSearchParams({
        access_token: result.accessToken || '',
        refresh_token: result.refreshToken || '',
      });

      res.redirect(`${frontendUrl}/auth/callback?${params.toString()}`);
    } else {
      const errorUrl = `${process.env.B2B_FRONTEND_URL || 'http://localhost:5173'}/auth/error?message=${encodeURIComponent(result.error || 'SSO login failed')}`;
      res.redirect(errorUrl);
    }
  } catch (error: unknown) {
    const errorUrl = `${process.env.B2B_FRONTEND_URL || 'http://localhost:5173'}/auth/error?message=${encodeURIComponent(error instanceof Error ? error.message : 'Unknown error')}`;
    res.redirect(errorUrl);
  }
});

/**
 * @swagger
 * /auth/fusionauth/sso/enable/{companyId}:
 *   post:
 *     summary: Enable SSO for company
 *     tags: [FusionAuth Security]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: SSO enabled
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
router.post(
  '/sso/enable/:companyId',
  authMiddleware as any,
  requireRole('SUPER_ADMIN', 'B2B_ADMIN') as any,
  async (req: AuthRequest, res: Response) => {
    try {
      const companyId = Array.isArray(req.params.companyId)
        ? req.params.companyId[0]
        : req.params.companyId;
      await fusionAuthSSOService.enableSSO(companyId);

      res.json({
        success: true,
        message: 'SSO enabled successfully',
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
 * /auth/fusionauth/sso/disable/{companyId}:
 *   post:
 *     summary: Disable SSO for company
 *     tags: [FusionAuth Security]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: SSO disabled
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
router.post(
  '/sso/disable/:companyId',
  authMiddleware as any,
  requireRole('SUPER_ADMIN', 'B2B_ADMIN') as any,
  async (req: AuthRequest, res: Response) => {
    try {
      const companyId = Array.isArray(req.params.companyId)
        ? req.params.companyId[0]
        : req.params.companyId;
      await fusionAuthSSOService.disableSSO(companyId);

      res.json({
        success: true,
        message: 'SSO disabled successfully',
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
 * /auth/fusionauth/sso/check/{companyId}:
 *   get:
 *     summary: Check if company has SSO enabled
 *     tags: [FusionAuth Security]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: SSO status returned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     enabled:
 *                       type: boolean
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
  '/sso/check/:companyId',
  authMiddleware as any,
  async (req: AuthRequest, res: Response) => {
    try {
      const companyId = Array.isArray(req.params.companyId)
        ? req.params.companyId[0]
        : req.params.companyId;
      const enabled = await fusionAuthSSOService.isSSOEnabled(companyId);

      res.json({
        success: true,
        data: { enabled },
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
 * /auth/fusionauth/sso/domain/{domain}:
 *   get:
 *     summary: Get SSO provider for domain
 *     tags: [FusionAuth Security]
 *     parameters:
 *       - in: path
 *         name: domain
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: SSO provider returned
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
router.get('/sso/domain/:domain', async (req: Request, res: Response) => {
  try {
    const config = await fusionAuthSSOService.getSSOProviderForDomain(
      Array.isArray(req.params.domain) ? req.params.domain[0] : req.params.domain
    );

    res.json({
      success: true,
      data: config,
    });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
