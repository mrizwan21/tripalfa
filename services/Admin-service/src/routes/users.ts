import { Router, Response } from 'express';
import prisma from '../database.js';
import { AuthRequest, authMiddleware, requirePermission } from '../middleware/auth.js';
import { validateZod, paginationSchema } from '../middleware/validate.js';

const router: Router = Router();

// All user routes require authentication
router.use(authMiddleware);

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: List all users with pagination
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by email, first name, or last name
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                 pagination:
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
  requirePermission('users:read'),
  validateZod(paginationSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { page, limit, sortBy, sortOrder, search } = req.query as any;

      const where = search
        ? {
            OR: [
              { email: { contains: search } },
              { firstName: { contains: search } },
              { lastName: { contains: search } },
            ],
          }
        : {};

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
          include: {
            preferences: true,
          },
        }),
        prisma.user.count({ where }),
      ]);

      // Get user roles separately
      const userIds = users.map(u => u.id);
      const userRoles = await prisma.userRole.findMany({
        where: { userId: { in: userIds } },
        include: { role: true },
      });

      // Create a map of userId to roles
      const userRolesMap = new Map<string, string[]>();
      userRoles.forEach(ur => {
        const existing = userRolesMap.get(ur.userId) || [];
        existing.push(ur.role.name);
        userRolesMap.set(ur.userId, existing);
      });

      // Transform users to include role info
      const transformedUsers = users.map(user => ({
        ...user,
        roles: userRolesMap.get(user.id) || [],
        primaryRole: (userRolesMap.get(user.id) || [])[0] || 'user',
      }));

      res.json({
        success: true,
        data: transformedUsers,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error('Error listing users:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to list users',
      });
    }
  }
);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User details
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
router.get('/:id', requirePermission('users:read'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        preferences: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Get user roles
    const userRoles = await prisma.userRole.findMany({
      where: { userId: id },
      include: { role: true },
    });

    const transformedUser = {
      ...user,
      roles: userRoles.map(ur => ur.role.name),
      primaryRole: userRoles[0]?.role.name || 'user',
    };

    res.json({
      success: true,
      data: transformedUser,
    });
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user',
    });
  }
});

/**
 * @swagger
 * /api/users/{id}/roles:
 *   get:
 *     summary: Get user roles
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
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
 */
router.get(
  '/:id/roles',
  requirePermission('users:read'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      const userRoles = await prisma.userRole.findMany({
        where: { userId: id },
        include: { role: true },
      });

      res.json({
        success: true,
        data: userRoles.map(ur => ({
          id: ur.id,
          roleId: ur.roleId,
          roleName: ur.role.name,
        })),
      });
    } catch (error) {
      console.error('Error getting user roles:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get user roles',
      });
    }
  }
);

/**
 * @swagger
 * /api/users/{id}/roles:
 *   post:
 *     summary: Assign role to user
 *     tags: [Users]
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
 *               - roleId
 *             properties:
 *               roleId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Success
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
 *         description: User already has this role
 *       404:
 *         description: User or role not found
 *       500:
 *         description: Server error
 */
router.post(
  '/:id/roles',
  requirePermission('users:update'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { roleId } = req.body;

      // Check if user exists
      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
        });
      }

      // Check if role exists
      const role = await prisma.role.findUnique({ where: { id: roleId } });
      if (!role) {
        return res.status(404).json({
          success: false,
          error: 'Role not found',
        });
      }

      // Create user role
      const userRole = await prisma.userRole.create({
        data: {
          userId: id,
          roleId,
        },
      });

      res.json({
        success: true,
        data: userRole,
      });
    } catch (error: any) {
      console.error('Error assigning role:', error);
      if (error.code === 'P2002') {
        return res.status(400).json({
          success: false,
          error: 'User already has this role',
        });
      }
      res.status(500).json({
        success: false,
        error: 'Failed to assign role',
      });
    }
  }
);

/**
 * @swagger
 * /api/users/{id}/roles/{roleId}:
 *   delete:
 *     summary: Remove role from user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       404:
 *         description: User role not found
 *       500:
 *         description: Server error
 */
router.delete(
  '/:id/roles/:roleId',
  requirePermission('users:update'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id, roleId } = req.params;

      // Find the user role
      const userRole = await prisma.userRole.findFirst({
        where: { userId: id, roleId },
      });

      if (!userRole) {
        return res.status(404).json({
          success: false,
          error: 'User role not found',
        });
      }

      await prisma.userRole.delete({
        where: { id: userRole.id },
      });

      res.json({
        success: true,
        message: 'Role removed from user',
      });
    } catch (error) {
      console.error('Error removing role:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to remove role',
      });
    }
  }
);

/**
 * @swagger
 * /api/users/{id}/notifications:
 *   get:
 *     summary: Get user notifications
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *     responses:
 *       200:
 *         description: User notifications
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
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
  '/:id/notifications',
  requirePermission('users:read'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { page = 1, limit = 20 } = req.query as any;

      const [notifications, total] = await Promise.all([
        prisma.notification.findMany({
          where: { userId: id },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.notification.count({ where: { userId: id } }),
      ]);

      res.json({
        success: true,
        data: notifications,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error('Error getting user notifications:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get user notifications',
      });
    }
  }
);

/**
 * @swagger
 * /api/users/{id}/bookings:
 *   get:
 *     summary: Get user bookings
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *     responses:
 *       200:
 *         description: User bookings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
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
  '/:id/bookings',
  requirePermission('bookings:read'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { page = 1, limit = 20 } = req.query as any;

      const [bookings, total] = await Promise.all([
        prisma.booking.findMany({
          where: { userId: id },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            bookingSegments: true,
            bookingPassengers: true,
          },
        }),
        prisma.booking.count({ where: { userId: id } }),
      ]);

      res.json({
        success: true,
        data: bookings,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error('Error getting user bookings:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get user bookings',
      });
    }
  }
);

export default router;
