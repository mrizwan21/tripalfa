import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '../../..');
dotenv.config({ path: resolve(rootDir, '.env') });

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import {
  resolveEndpoint,
  checkAuth,
  rateLimit,
  forwardRequest,
} from './middleware/api-gateway.middleware.js';

const app: Express = express();
const PORT = process.env.API_GATEWAY_PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 service:
 *                   type: string
 */
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'api-gateway' });
});

/**
 * @swagger
 * /auth/oauth/google:
 *   get:
 *     summary: Google OAuth
 *     tags: [OAuth]
 *     responses:
 *       302:
 *         description: Redirect to Google OAuth
 */
app.get('/auth/oauth/google', resolveEndpoint, rateLimit, forwardRequest);
/**
 * @swagger
 * /auth/oauth/facebook:
 *   get:
 *     summary: Facebook OAuth
 *     tags: [OAuth]
 *     responses:
 *       302:
 *         description: Redirect to Facebook OAuth
 */
app.get('/auth/oauth/facebook', resolveEndpoint, rateLimit, forwardRequest);
/**
 * @swagger
 * /auth/oauth/apple:
 *   get:
 *     summary: Apple OAuth
 *     tags: [OAuth]
 *     responses:
 *       302:
 *         description: Redirect to Apple OAuth
 */
app.get('/auth/oauth/apple', resolveEndpoint, rateLimit, forwardRequest);
/**
 * @swagger
 * /auth/oauth/callback:
 *   post:
 *     summary: OAuth callback
 *     tags: [OAuth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *               provider:
 *                 type: string
 *     responses:
 *       200:
 *         description: OAuth authentication successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 */
app.post('/auth/oauth/callback', resolveEndpoint, rateLimit, forwardRequest);

/**
 * @swagger
 * /auth/linked-accounts:
 *   get:
 *     summary: Get linked accounts
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of linked accounts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 */
app.get('/auth/linked-accounts', resolveEndpoint, checkAuth, rateLimit, forwardRequest);
/**
 * @swagger
 * /auth/oauth/link/{provider}:
 *   get:
 *     summary: Link OAuth account
 *     tags: [OAuth]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: provider
 *         required: true
 *         schema:
 *           type: string
 *         description: OAuth provider name
 *     responses:
 *       302:
 *         description: Redirect to OAuth provider
 */
app.get('/auth/oauth/link/:provider', resolveEndpoint, checkAuth, rateLimit, forwardRequest);
/**
 * @swagger
 * /auth/oauth/unlink/{provider}:
 *   delete:
 *     summary: Unlink OAuth account
 *     tags: [OAuth]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: provider
 *         required: true
 *         schema:
 *           type: string
 *         description: OAuth provider name
 *     responses:
 *       200:
 *         description: Account unlinked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 */
app.delete('/auth/oauth/unlink/:provider', resolveEndpoint, checkAuth, rateLimit, forwardRequest);

/**
 * @swagger
 * /status:
 *   get:
 *     summary: Status check
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Gateway status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 service:
 *                   type: string
 *                 status:
 *                   type: string
 *                 uptime:
 *                   type: number
 *                 timestamp:
 *                   type: string
 */
app.get('/status', (req, res) => {
  res.json({
    service: 'api-gateway',
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

if (process.env.NODE_ENV === 'development') {
  console.log('[API Gateway] Development mode: Mock endpoints enabled');

  /**
   * @swagger
   * /api/admin/suppliers:
   *   get:
   *     summary: Get all suppliers (dev only)
   *     tags: [Health]
   *     responses:
   *       200:
   *         description: List of suppliers
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: array
   */
  app.get('/api/admin/suppliers', (req, res) => {
    res.json({
      data: [
        {
          id: '1',
          name: 'American Airlines',
          category: 'flight',
          isActive: true,
          vendor: { name: 'AA Vendor' },
          code: 'AA',
        },
        {
          id: '2',
          name: 'Marriott Hotels',
          category: 'hotel',
          isActive: true,
          vendor: { name: 'Marriott Corp' },
          code: 'MQ',
        },
        {
          id: '3',
          name: 'Delta Airlines',
          category: 'flight',
          isActive: false,
          vendor: { name: 'Delta Vendor' },
          code: 'DL',
        },
      ],
    });
  });

  /**
   * @swagger
   * /api/organization:
   *   get:
   *     summary: Get all organizations (dev only)
   *     tags: [Health]
   *     responses:
   *       200:
   *         description: List of organizations
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: array
   */
  app.get('/api/organization', (req, res) => {
    res.json({
      data: [
        {
          id: '1',
          name: 'TripAlfa Corp',
          domain: 'tripalfa.com',
          status: 'active',
          creditLimit: 100000,
          balance: 25000,
        },
        {
          id: '2',
          name: 'Global Travel Solutions',
          domain: 'globaltravel.com',
          status: 'active',
          creditLimit: 50000,
          balance: 15000,
        },
        {
          id: '3',
          name: 'SkyHigh Airlines',
          domain: 'skyhigh.com',
          status: 'suspended',
          creditLimit: 75000,
          balance: 5000,
        },
      ],
    });
  });

  /**
   * @swagger
   * /api/organization/{companyId}/branches:
   *   get:
   *     summary: Get organization branches (dev only)
   *     tags: [Health]
   *     parameters:
   *       - in: path
   *         name: companyId
   *         required: true
   *         schema:
   *           type: string
   *         description: Organization ID
   *     responses:
   *       200:
   *         description: List of branches
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: array
   */
  app.get('/api/organization/:companyId/branches', (req, res) => {
    const { companyId } = req.params;
    res.json([
      {
        id: '1',
        name: 'Dubai HQ',
        code: 'DBX-HQ',
        address: { city: 'Dubai' },
        status: 'active',
      },
      {
        id: '2',
        name: 'London Office',
        code: 'LON-OF',
        address: { city: 'London' },
        status: 'active',
      },
      {
        id: '3',
        name: 'Mumbai Branch',
        code: 'MUM-BR',
        address: { city: 'Mumbai' },
        status: 'inactive',
      },
    ]);
  });

  /**
   * @swagger
   * /api/organization/departments:
   *   get:
   *     summary: Get organization departments (dev only)
   *     tags: [Health]
   *     responses:
   *       200:
   *         description: List of departments
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: array
   */
  app.get('/api/organization/departments', (req, res) => {
    res.json({
      data: [
        { id: '1', name: 'Operations', code: 'OPS' },
        { id: '2', name: 'Finance', code: 'FIN' },
        { id: '3', name: 'IT', code: 'IT' },
        { id: '4', name: 'Sales', code: 'SAL' },
        { id: '5', name: 'Marketing', code: 'MKT' },
      ],
    });
  });

  /**
   * @swagger
   * /api/organization/designations:
   *   get:
   *     summary: Get organization designations (dev only)
   *     tags: [Health]
   *     responses:
   *       200:
   *         description: List of designations
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: array
   */
  app.get('/api/organization/designations', (req, res) => {
    res.json({
      data: [
        { id: '1', name: 'Manager', code: 'MGR' },
        { id: '2', name: 'Senior Manager', code: 'SMGR' },
        { id: '3', name: 'Director', code: 'DIR' },
        { id: '4', name: 'VP', code: 'VP' },
        { id: '5', name: 'CEO', code: 'CEO' },
      ],
    });
  });

  /**
   * @swagger
   * /api/users:
   *   get:
   *     summary: Get all users (dev only)
   *     tags: [Health]
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *         description: Page number
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *         description: Items per page
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *         description: Search by name or email
   *     responses:
   *       200:
   *         description: Paginated list of users
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: array
   *                 pagination:
   *                   type: object
   */
  app.get('/api/users', (req, res) => {
    const pageStr = req.query.page as string | undefined;
    const limitStr = req.query.limit as string | undefined;
    const search = req.query.search as string | undefined;
    const page = pageStr ? parseInt(pageStr) : 1;
    const limit = limitStr ? parseInt(limitStr) : 10;
    const allUsers = [
      {
        id: '1',
        name: 'John Doe',
        email: 'john.doe@tripalfa.com',
        role: 'admin',
        status: 'active',
        department: 'Operations',
        branch: 'Dubai HQ',
        lastLogin: '2024-02-15T10:30:00Z',
      },
      {
        id: '2',
        name: 'Jane Smith',
        email: 'jane.smith@tripalfa.com',
        role: 'manager',
        status: 'active',
        department: 'Finance',
        branch: 'London Office',
        lastLogin: '2024-02-14T15:45:00Z',
      },
      {
        id: '3',
        name: 'Bob Johnson',
        email: 'bob.johnson@tripalfa.com',
        role: 'user',
        status: 'inactive',
        department: 'IT',
        branch: 'Mumbai Branch',
        lastLogin: '2024-02-10T09:15:00Z',
      },
      {
        id: '4',
        name: 'Alice Brown',
        email: 'alice.brown@tripalfa.com',
        role: 'user',
        status: 'active',
        department: 'Sales',
        branch: 'Dubai HQ',
        lastLogin: '2024-02-15T08:20:00Z',
      },
      {
        id: '5',
        name: 'Charlie Wilson',
        email: 'charlie.wilson@tripalfa.com',
        role: 'manager',
        status: 'active',
        department: 'Marketing',
        branch: 'London Office',
        lastLogin: '2024-02-13T14:10:00Z',
      },
    ];

    let filteredUsers = allUsers;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredUsers = allUsers.filter(
        user =>
          user.name.toLowerCase().includes(searchLower) ||
          user.email.toLowerCase().includes(searchLower)
      );
    }

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

    res.json({
      data: paginatedUsers,
      pagination: {
        page,
        limit,
        total: filteredUsers.length,
        pages: Math.ceil(filteredUsers.length / limit),
      },
    });
  });

  /**
   * @swagger
   * /api/users:
   *   post:
   *     summary: Create a new user (dev only)
   *     tags: [Health]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *               email:
   *                 type: string
   *               role:
   *                 type: string
   *     responses:
   *       201:
   *         description: User created successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: object
   */
  app.post('/api/users', (req, res) => {
    const newUser = {
      id: Date.now().toString(),
      ...req.body,
      status: 'active',
      lastLogin: new Date().toISOString(),
    };
    res.status(201).json({
      message: 'User created successfully',
      data: newUser,
    });
  });

  /**
   * @swagger
   * /api/users/{id}/details:
   *   put:
   *     summary: Update user details (dev only)
   *     tags: [Health]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: User ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *     responses:
   *       200:
   *         description: User updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: object
   */
  app.put('/api/users/:id/details', (req, res) => {
    const { id } = req.params;
    const updatedUser = {
      id,
      ...req.body,
      lastLogin: new Date().toISOString(),
    };
    res.json({
      message: 'User updated successfully',
      data: updatedUser,
    });
  });

  /**
   * @swagger
   * /api/users/{id}:
   *   delete:
   *     summary: Delete a user (dev only)
   *     tags: [Health]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: User ID
   *     responses:
   *       200:
   *         description: User deleted successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   */
  app.delete('/api/users/:id', (req, res) => {
    const { id } = req.params;
    res.json({
      message: 'User deleted successfully',
    });
  });
}

const DEPRECATION_WARNING =
  'This endpoint is deprecated and will be removed in a future version. Please migrate to the new API routes.';

app.all(
  /^\/bookings\/flight\/.*/,
  (req, res, next) => {
    console.warn(`[DEPRECATED] ${req.method} ${req.path} - ${DEPRECATION_WARNING}`);
    res.setHeader('X-Deprecation-Warning', DEPRECATION_WARNING);
    res.setHeader('X-Deprecation-Date', '2025-06-01');
    res.setHeader('X-Deprecation-Migration', 'Use /api/flight-booking/* instead');
    req.url = req.url.replace('/bookings/flight/', '/api/flight-booking/');
    next();
  },
  resolveEndpoint,
  checkAuth,
  rateLimit,
  forwardRequest
);

app.all(
  /^\/bookings\/hotel\/.*/,
  (req, res, next) => {
    console.warn(`[DEPRECATED] ${req.method} ${req.path} - ${DEPRECATION_WARNING}`);
    res.setHeader('X-Deprecation-Warning', DEPRECATION_WARNING);
    res.setHeader('X-Deprecation-Date', '2025-06-01');
    res.setHeader('X-Deprecation-Migration', 'Use /api/hotel-booking/* instead');
    req.url = req.url.replace('/bookings/hotel/', '/api/hotel-booking/');
    next();
  },
  resolveEndpoint,
  checkAuth,
  rateLimit,
  forwardRequest
);

app.all(/\/api\/.+/, resolveEndpoint, checkAuth, rateLimit, forwardRequest);

app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.path,
    method: req.method,
  });
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[APIGateway] Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message || 'Unknown error',
  });
});

import { setupGatewaySwagger } from './swagger.js';

setupGatewaySwagger(app);
app.listen(PORT, () => {
  console.log(`🚀 API Gateway running on port ${PORT}`);
});

export default app;
