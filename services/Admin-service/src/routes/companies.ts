import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../database.js';
import { AuthRequest, authMiddleware, requirePermission } from '../middleware/auth.js';
import {
  validateZod,
  createCompanySchema,
  updateCompanySchema,
  paginationSchema,
} from '../middleware/validate.js';

const router: Router = Router();

// All company routes require authentication
router.use(authMiddleware);

/**
 * @swagger
 * /api/companies:
 *   get:
 *     summary: List all companies with pagination
 *     tags: [Companies]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *       - in: query
 *         name: search
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
 *                 pagination:
 *                   type: object
 *       500:
 *         description: Server error
 */
router.get(
  '/',
  requirePermission('companies:read'),
  validateZod(
    z.object({
      query: z.object({
        page: z.coerce.number().min(1).default(1),
        limit: z.coerce.number().min(1).max(100).default(10),
        sortBy: z.string().optional(),
        sortOrder: z.enum(['asc', 'desc']).default('desc'),
        search: z.string().optional(),
      }),
    })
  ),
  async (req: AuthRequest, res: Response) => {
    try {
      const { page, limit, sortBy, sortOrder, search } = req.query as any;

      // Ensure proper type conversion
      const pageNum = Number(page) || 1;
      const limitNum = Number(limit) || 10;

      const where = search
        ? {
            OR: [
              {
                name: { contains: search, mode: 'insensitive' },
              },
              {
                email: { contains: search, mode: 'insensitive' },
              },
            ],
          }
        : {};

      const [companies, total] = await Promise.all([
        prisma.company.findMany({
          where,
          skip: (pageNum - 1) * limitNum,
          take: limitNum,
          orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
          include: {
            _count: {
              select: { departments: true, designations: true },
            },
          },
        }),
        prisma.company.count({ where }),
      ]);

      res.json({
        success: true,
        data: companies,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    } catch (error) {
      console.error('Error fetching companies:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch companies',
      });
    }
  }
);

/**
 * @swagger
 * /api/companies/{id}:
 *   get:
 *     summary: Get company by ID
 *     tags: [Companies]
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
 *                   type: object
 *       404:
 *         description: Company not found
 *       500:
 *         description: Server error
 */
router.get('/:id', requirePermission('companies:read'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        departments: {
          where: { isActive: true },
          orderBy: { name: 'asc' },
        },
        designations: {
          where: { isActive: true },
          orderBy: { name: 'asc' },
        },
        costCenters: {
          where: { isActive: true },
          orderBy: { name: 'asc' },
        },
        campaigns: {
          where: { status: 'active' },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!company) {
      return res.status(404).json({
        success: false,
        error: 'Company not found',
      });
    }

    res.json({
      success: true,
      data: company,
    });
  } catch (error) {
    console.error('Error fetching company:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch company',
    });
  }
});

/**
 * @swagger
 * /api/companies:
 *   post:
 *     summary: Create a new company
 *     tags: [Companies]
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
 *               code:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *               taxId:
 *                 type: string
 *               metadata:
 *                 type: object
 *     responses:
 *       201:
 *         description: Company created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                 message:
 *                   type: string
 *       400:
 *         description: Validation error or duplicate company
 *       500:
 *         description: Server error
 */
router.post(
  '/',
  requirePermission('companies:create'),
  validateZod(createCompanySchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const data = req.body;

      // Generate code if not provided
      if (!data.code) {
        data.code = data.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
      }

      // Check if code already exists
      const existingCompany = await prisma.company.findFirst({
        where: { code: data.code },
      });

      if (existingCompany) {
        return res.status(400).json({
          success: false,
          error: 'Company with this code already exists',
        });
      }

      const company = await prisma.company.create({
        data: {
          name: data.name,
          code: data.code,
          email: data.email || null,
          phone: data.phone || null,
          address: data.address || null,
          taxId: data.taxId || null,
          metadata: data.metadata || null,
        },
      });

      res.status(201).json({
        success: true,
        data: company,
        message: 'Company created successfully',
      });
    } catch (error) {
      console.error('Error creating company:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create company',
      });
    }
  }
);

/**
 * @swagger
 * /api/companies/{id}:
 *   put:
 *     summary: Update an existing company
 *     tags: [Companies]
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
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *               taxId:
 *                 type: string
 *               metadata:
 *                 type: object
 *     responses:
 *       200:
 *         description: Company updated successfully
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
 *         description: Company not found
 *       500:
 *         description: Server error
 */
router.put(
  '/:id',
  requirePermission('companies:update'),
  validateZod(updateCompanySchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const data = req.body;

      // Check if company exists
      const existingCompany = await prisma.company.findUnique({
        where: { id },
      });

      if (!existingCompany) {
        return res.status(404).json({
          success: false,
          error: 'Company not found',
        });
      }

      // If code is being updated, check for duplicates
      if (data.code && data.code !== existingCompany.code) {
        const codeExists = await prisma.company.findFirst({
          where: { code: data.code, NOT: { id } },
        });

        if (codeExists) {
          return res.status(400).json({
            success: false,
            error: 'Company with this code already exists',
          });
        }
      }

      const company = await prisma.company.update({
        where: { id },
        data: {
          name: data.name,
          code: data.code,
          email: data.email,
          phone: data.phone,
          address: data.address,
          taxId: data.taxId,
          metadata: data.metadata,
        },
      });

      res.json({
        success: true,
        data: company,
        message: 'Company updated successfully',
      });
    } catch (error) {
      console.error('Error updating company:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update company',
      });
    }
  }
);

/**
 * @swagger
 * /api/companies/{id}:
 *   delete:
 *     summary: Soft delete a company
 *     tags: [Companies]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Company deactivated successfully
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
 *         description: Company not found
 *       500:
 *         description: Server error
 */
router.delete(
  '/:id',
  requirePermission('companies:delete'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      const company = await prisma.company.findUnique({
        where: { id },
      });

      if (!company) {
        return res.status(404).json({
          success: false,
          error: 'Company not found',
        });
      }

      // Soft delete by setting isActive to false
      await prisma.company.update({
        where: { id },
        data: { isActive: false },
      });

      res.json({
        success: true,
        message: 'Company deactivated successfully',
      });
    } catch (error) {
      console.error('Error deleting company:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete company',
      });
    }
  }
);

/**
 * @swagger
 * /api/companies/{id}/departments:
 *   get:
 *     summary: Get company departments
 *     tags: [Companies]
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
  '/:id/departments',
  requirePermission('companies:read'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      const departments = await prisma.department.findMany({
        where: { companyId: id, isActive: true },
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: { designations: true, costCenters: true },
          },
        },
      });

      res.json({
        success: true,
        data: departments,
      });
    } catch (error) {
      console.error('Error fetching departments:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch departments',
      });
    }
  }
);

/**
 * @swagger
 * /api/companies/{id}/departments:
 *   post:
 *     summary: Create a new department for a company
 *     tags: [Companies]
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
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *               description:
 *                 type: string
 *               headId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Department created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                 message:
 *                   type: string
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.post(
  '/:id/departments',
  requirePermission('companies:update'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { name, code, description, headId } = req.body;

      if (!name) {
        return res.status(400).json({
          success: false,
          error: 'Department name is required',
        });
      }

      const department = await prisma.department.create({
        data: {
          companyId: id,
          name,
          code: code || null,
          description: description || null,
          headId: headId || null,
        },
      });

      res.status(201).json({
        success: true,
        data: department,
        message: 'Department created successfully',
      });
    } catch (error) {
      console.error('Error creating department:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create department',
      });
    }
  }
);

/**
 * @swagger
 * /api/companies/{id}/stats:
 *   get:
 *     summary: Get company statistics
 *     tags: [Companies]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d, 1y]
 *           default: 30d
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
 *                   properties:
 *                     totalBookings:
 *                       type: integer
 *                     totalRevenue:
 *                       type: number
 *                     totalUsers:
 *                       type: integer
 *                     totalDepartments:
 *                       type: integer
 *                     period:
 *                       type: string
 *       500:
 *         description: Server error
 */
router.get(
  '/:id/stats',
  requirePermission('companies:read'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { period = '30d' } = req.query;

      // Calculate date range
      const now = new Date();
      const startDate = new Date();
      switch (period) {
        case '7d':
          startDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(now.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(now.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      // Get booking stats
      const bookingStats = await prisma.booking.aggregate({
        where: {
          createdAt: { gte: startDate },
          // Note: In real implementation, filter by company's users
        },
        _count: true,
        _sum: {
          totalAmount: true,
        },
      });

      // Get user count
      const userCount = await prisma.user.count();

      // Get department count
      const departmentCount = await prisma.department.count({
        where: { companyId: id, isActive: true },
      });

      res.json({
        success: true,
        data: {
          totalBookings: bookingStats._count,
          totalRevenue: bookingStats._sum.totalAmount || 0,
          totalUsers: userCount,
          totalDepartments: departmentCount,
          period,
        },
      });
    } catch (error) {
      console.error('Error fetching company stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch company statistics',
      });
    }
  }
);

export default router;
