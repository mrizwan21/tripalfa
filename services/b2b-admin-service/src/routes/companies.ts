import { Router, Response } from 'express';
import prisma from '../database.js';
import { AuthRequest, authMiddleware, requirePermission } from '../middleware/auth.js';
import { validateZod, createCompanySchema, updateCompanySchema, paginationSchema } from '../middleware/validate.js';
import { Prisma } from '@prisma/client';

const router: Router = Router();

// All company routes require authentication
router.use(authMiddleware);

// GET /api/companies - List all companies with pagination
router.get('/',
    requirePermission('companies:read'),
    validateZod(paginationSchema),
    async (req: AuthRequest, res: Response) => {
        try {
            const { page, limit, sortBy, sortOrder, search } = req.query as any;

            const where = search ? {
                OR: [
                    { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
                    { email: { contains: search, mode: Prisma.QueryMode.insensitive } },
                    { city: { contains: search, mode: Prisma.QueryMode.insensitive } },
                ],
            } : {};

            const [companies, total] = await Promise.all([
                prisma.company.findMany({
                    where,
                    skip: (page - 1) * limit,
                    take: limit,
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
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
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

// GET /api/companies/:id - Get company by ID
router.get('/:id',
    requirePermission('companies:read'),
    async (req: AuthRequest, res: Response) => {
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
    }
);

// POST /api/companies - Create new company
router.post('/',
    requirePermission('companies:create'),
    validateZod(createCompanySchema),
    async (req: AuthRequest, res: Response) => {
        try {
            const data = req.body;

            // Generate slug if not provided
            if (!data.slug) {
                data.slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            }

            // Check if slug already exists
            const existingCompany = await prisma.company.findFirst({
                where: { slug: data.slug },
            });

            if (existingCompany) {
                return res.status(400).json({
                    success: false,
                    error: 'Company with this slug already exists',
                });
            }

            const company = await prisma.company.create({
                data: {
                    name: data.name,
                    slug: data.slug,
                    email: data.email || null,
                    phone: data.phone || null,
                    address: data.address || null,
                    city: data.city || null,
                    country: data.country || null,
                    businessType: data.businessType || null,
                    registrationNumber: data.registrationNumber || null,
                    taxId: data.taxId || null,
                    subscriptionPlan: data.subscriptionPlan || 'free',
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

// PUT /api/companies/:id - Update company
router.put('/:id',
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

            // If slug is being updated, check for duplicates
            if (data.slug && data.slug !== existingCompany.slug) {
                const slugExists = await prisma.company.findFirst({
                    where: { slug: data.slug, NOT: { id } },
                });

                if (slugExists) {
                    return res.status(400).json({
                        success: false,
                        error: 'Company with this slug already exists',
                    });
                }
            }

            const company = await prisma.company.update({
                where: { id },
                data: {
                    name: data.name,
                    slug: data.slug,
                    email: data.email,
                    phone: data.phone,
                    address: data.address,
                    city: data.city,
                    country: data.country,
                    businessType: data.businessType,
                    registrationNumber: data.registrationNumber,
                    taxId: data.taxId,
                    status: data.status,
                    subscriptionPlan: data.subscriptionPlan,
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

// DELETE /api/companies/:id - Soft delete company (set status to inactive)
router.delete('/:id',
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

            // Soft delete by setting status to inactive
            await prisma.company.update({
                where: { id },
                data: { status: 'inactive' },
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

// GET /api/companies/:id/departments - Get company departments
router.get('/:id/departments',
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

// POST /api/companies/:id/departments - Create department
router.post('/:id/departments',
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

// GET /api/companies/:id/stats - Get company statistics
router.get('/:id/stats',
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
