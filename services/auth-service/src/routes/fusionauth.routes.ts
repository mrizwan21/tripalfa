import { Router, Request, Response } from 'express';
import type { RequestHandler } from 'express';
import { randomBytes } from 'crypto';
import { fusionAuthService } from '../services/fusionauth.service.js';
import { tokenService } from '../services/token.service.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware.js';
import { prisma } from '../database.js';

const router: Router = Router();

/**
 * Normalizes request parameters that might be strings or string arrays.
 */
const getParam = (param: string | string[] | undefined): string => {
  if (Array.isArray(param)) return param[0];
  return param || '';
};

/**
 * Standardized error handler for controllers.
 */
const handleControllerError = (res: Response, error: unknown, status = 500) => {
  res.status(status).json({
    success: false,
    error: error instanceof Error ? error.message : 'Unknown error',
  });
};

interface PendingAuthCode {
  accessToken: string;
  refreshToken?: string;
  idToken?: string;
  createdAt: number;
  userType?: string;
}
const pendingAuthCodes = new Map<string, PendingAuthCode>();

setInterval(() => {
  const now = Date.now();
  for (const [code, data] of pendingAuthCodes.entries()) {
    if (now - data.createdAt > 300_000) {
      pendingAuthCodes.delete(code);
    }
  }
}, 300_000);

/**
 * @swagger
 * /auth/fusionauth/health:
 *   get:
 *     summary: Check FusionAuth health status
 *     tags: [FusionAuth]
 *     responses:
 *       200:
 *         description: Health check successful
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
router.get('/health', async (req: Request, res: Response) => {
  try {
    const health = await fusionAuthService.healthCheck();
    res.json({
      success: true,
      data: health,
    });
  } catch (error: unknown) {
      handleControllerError(res, error);
    }
});

/**
 * @swagger
 * /auth/fusionauth/login:
 *   get:
 *     summary: Get FusionAuth login URL
 *     tags: [FusionAuth]
 *     parameters:
 *       - in: query
 *         name: userType
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
 *         description: Login URL returned
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
router.get('/login', (req: Request, res: Response) => {
  try {
    const { userType, redirectUri, state } = req.query;

    const appId = fusionAuthService.getApplicationId((userType as string) || 'B2C');

    const authUrl = fusionAuthService.getAuthorizationUrl(
      appId,
      redirectUri as string,
      state as string
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
 * /auth/fusionauth/login:
 *   post:
 *     summary: Login with email and password via FusionAuth
 *     tags: [FusionAuth]
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
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               userType:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
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
 *                     user:
 *                       type: object
 *                     accessToken:
 *                       type: string
 *                     refreshToken:
 *                       type: string
 *                     idToken:
 *                       type: string
 *                     expiresIn:
 *                       type: integer
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
 *       401:
 *         description: Authentication failed
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
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password, userType } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: 'Email and password are required',
      });
      return;
    }

    const appId = fusionAuthService.getApplicationId(userType || 'B2C');

    const fusionAuthResponse = await fusionAuthService.login(email, password, appId);

    const localUser = await fusionAuthService.syncUserToLocal(fusionAuthResponse.user);

    const permissions = localUser.role?.permissions?.map((rp: any) => rp.permission?.name) || [];

    const userData = {
      id: localUser.id,
      email: localUser.email,
      firstName: localUser.firstName,
      lastName: localUser.lastName,
      userType: localUser.userType,
      role: localUser.role?.name,
      companyId: localUser.companyId,
      permissions,
    };

    const accessToken = await tokenService.generateAccessToken({
      ...userData,
      role: localUser.role?.name || '',
    });

    const refreshToken = await tokenService.generateRefreshToken(localUser.id);

    await prisma.session_state.create({
      data: {
        userId: localUser.id,
        sessionToken: accessToken,
        refreshToken,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        issuedAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    res.cookie('token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
    });

    if (refreshToken) {
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
    }

    res.json({
      success: true,
      data: {
        user: userData,
        accessToken: fusionAuthResponse.token || accessToken,
        refreshToken: fusionAuthResponse.refreshToken || refreshToken,
        idToken: fusionAuthResponse.idToken,
        expiresIn: 15 * 60,
      },
    });
  } catch (error: unknown) {
      handleControllerError(res, error, 401);
    }
});

/**
 * @swagger
 * /auth/fusionauth/callback:
 *   get:
 *     summary: Handle FusionAuth OAuth callback
 *     tags: [FusionAuth]
 *     parameters:
 *       - in: query
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *       - in: query
 *         name: userType
 *         schema:
 *           type: string
 *     responses:
 *       302:
 *         description: Redirect to frontend with auth code
 *       400:
 *         description: Missing authorization code
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
router.get('/callback', async (req: Request, res: Response) => {
  try {
    const { code, state, userType } = req.query;

    if (!code) {
      res.status(400).json({
        success: false,
        error: 'Authorization code missing',
      });
      return;
    }

    let userTypeValue = 'B2C';
    if (state) {
      try {
        const stateData = JSON.parse(state as string);
        userTypeValue = stateData.userType || 'B2C';
      } catch {
        // State is not JSON, use as-is
      }
    }

    const appId = fusionAuthService.getApplicationId(userTypeValue);
    const frontendUrl = fusionAuthService.getFrontendUrl(userTypeValue);

    const tokens = await fusionAuthService.exchangeCodeForTokens(
      code as string,
      appId,
      `${frontendUrl}/auth/callback`
    );

    const userInfo = await fusionAuthService.validateToken(tokens.access_token);

    const localUser = await fusionAuthService.syncUserToLocal(userInfo);

    const authCode = randomBytes(32).toString('hex');
    pendingAuthCodes.set(authCode, {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      idToken: tokens.id_token,
      createdAt: Date.now(),
      userType: userTypeValue,
    });

    const redirectUrl = `${frontendUrl}/auth/callback?code=${authCode}`;
    res.redirect(redirectUrl);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/error?message=${encodeURIComponent(errorMessage)}`;
    res.redirect(errorUrl);
  }
});

/**
 * @swagger
 * /auth/fusionauth/exchange:
 *   post:
 *     summary: Exchange one-time auth code for tokens
 *     tags: [FusionAuth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *             properties:
 *               code:
 *                 type: string
 *     responses:
 *       200:
 *         description: Tokens returned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *                 idToken:
 *                   type: string
 *       400:
 *         description: Missing auth code
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
 *       401:
 *         description: Invalid or expired auth code
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
router.post('/exchange', (async (req: Request, res: Response): Promise<void> => {
  const { code } = req.body;

  if (!code || typeof code !== 'string') {
    res.status(400).json({
      success: false,
      error: 'Auth code is required',
    });
    return;
  }

  const pending = pendingAuthCodes.get(code);
  if (!pending) {
    res.status(401).json({
      success: false,
      error: 'Invalid or expired auth code',
    });
    return;
  }

  pendingAuthCodes.delete(code);

  if (Date.now() - pending.createdAt > 300_000) {
    res.status(401).json({
      success: false,
      error: 'Auth code has expired',
    });
    return;
  }

  res.json({
    success: true,
    accessToken: pending.accessToken,
    refreshToken: pending.refreshToken,
    idToken: pending.idToken,
  });
}) as RequestHandler);

/**
 * @swagger
 * /auth/fusionauth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [FusionAuth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *               userType:
 *                 type: string
 *     responses:
 *       200:
 *         description: New tokens returned
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
 *                     accessToken:
 *                       type: string
 *                     refreshToken:
 *                       type: string
 *                     idToken:
 *                       type: string
 *                     expiresIn:
 *                       type: integer
 *       400:
 *         description: Missing refresh token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
 *       401:
 *         description: Invalid refresh token
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
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken, userType } = req.body;

    if (!refreshToken) {
      res.status(400).json({
        success: false,
        error: 'Refresh token is required',
      });
      return;
    }

    const appId = fusionAuthService.getApplicationId(userType || 'B2C');

    const tokens = await fusionAuthService.refreshToken(refreshToken, appId);

    res.json({
      success: true,
      data: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        idToken: tokens.id_token,
        expiresIn: tokens.expires_in,
      },
    });
  } catch (error: unknown) {
      handleControllerError(res, error, 401);
    }
});

/**
 * @swagger
 * /auth/fusionauth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [FusionAuth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               global:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Logged out successfully
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
router.post('/logout', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { global } = req.body;
    const authHeader = req.headers.authorization;
    const accessToken = authHeader?.substring(7) || '';

    if (accessToken) {
      await fusionAuthService.logout(accessToken, global || false);
    }

    if (req.user) {
      await prisma.session_state.updateMany({
        where: {
          userId: req.user.sub,
          sessionToken: accessToken,
        },
        data: {
          isValid: false,
        },
      });
    }

    res.clearCookie('token');
    res.clearCookie('refreshToken');

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error: unknown) {
      handleControllerError(res, error);
    }
});

/**
 * @swagger
 * /auth/fusionauth/userinfo:
 *   get:
 *     summary: Get user info from FusionAuth
 *     tags: [FusionAuth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User info returned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       401:
 *         description: Unauthorized
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
router.get('/userinfo', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    const accessToken = authHeader?.substring(7) || '';

    if (!accessToken) {
      res.status(401).json({
        success: false,
        error: 'Access token required',
      });
      return;
    }

    const userInfo = await fusionAuthService.validateToken(accessToken);

    res.json({
      success: true,
      data: userInfo,
    });
  } catch (error: unknown) {
      handleControllerError(res, error, 401);
    }
});

/**
 * @swagger
 * /auth/fusionauth/me:
 *   get:
 *     summary: Get current user info
 *     tags: [FusionAuth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user info returned
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
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     firstName:
 *                       type: string
 *                     lastName:
 *                       type: string
 *                     avatarUrl:
 *                       type: string
 *                     userType:
 *                       type: string
 *                     companyId:
 *                       type: string
 *                     role:
 *                       type: string
 *                     mfaEnabled:
 *                       type: boolean
 *                     lastLoginAt:
 *                       type: string
 *                     createdAt:
 *                       type: string
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
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.sub },
      include: {
        role: true,
        company: true,
      },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatarUrl,
        userType: user.userType,
        companyId: user.companyId,
        company: user.company,
        role: user.role?.name,
        mfaEnabled: user.mfaEnabled,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
      },
    });
  } catch (error: unknown) {
      handleControllerError(res, error);
    }
});

export default router;
