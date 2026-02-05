import { Request, Response } from 'express';
import { prisma } from '../database/index.js';
import { cacheService, cacheKeys } from '../cache/redis.js';
import { metricsStore } from '../monitoring/metrics.js';
import logger from '../utils/logger.js';
import { Permission, UserRole } from '../types/booking.js';
import { TypedRequest } from '../types';

export class AdminBookingCardController {
  // Get all permissions
  async getPermissions(req: Request, res: Response): Promise<Response | void> {
    const typedReq = req as TypedRequest;
    try {
      const permissions = Object.values(Permission);
      
      res.json({
        success: true,
        data: {
          permissions,
          total: permissions.length
        }
      });

    } catch (error) {
      logger.error('Failed to get permissions', {
        error: error instanceof Error ? error.message : 'Unknown error',
        actor: typedReq.user?.id
      });

      res.status(500).json({
        success: false,
        error: 'Failed to get permissions'
      });
    }
  }

  // Assign permissions to user
  async assignPermissions(req: Request, res: Response): Promise<Response | void> {
    const typedReq = req as TypedRequest;
    try {
      const { userId, permissions, roleId } = typedReq.body;
      const adminId = typedReq.user?.id;

      // Validate user exists
      const user = await (prisma as any).user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      // Update user permissions
      const updatedUser = await (prisma as any).user.update({
        where: { id: userId },
        data: {
          permissions: {
            set: permissions
          },
          roles: roleId ? {
            connect: { id: roleId }
          } : undefined
        }
      });

      // Log the permission change
      await this.logPermissionChange(adminId, userId, permissions, 'assigned');

      logger.info('Permissions assigned successfully', {
        userId,
        permissions,
        roleId,
        assignedBy: adminId
      });

      res.json({
        success: true,
        data: {
          user: updatedUser,
          message: 'Permissions assigned successfully'
        }
      });

    } catch (error) {
      logger.error('Failed to assign permissions', {
        error: error instanceof Error ? error.message : 'Unknown error',
        actor: typedReq.user?.id
      });

      res.status(500).json({
        success: false,
        error: 'Failed to assign permissions'
      });
    }
  }

  // Get all roles
  async getRoles(req: Request, res: Response): Promise<Response | void> {
    const typedReq = req as TypedRequest;
    try {
      const roles = await (prisma as any).role.findMany({
        include: {
          permissions: true
        }
      });

      res.json({
        success: true,
        data: {
          roles,
          total: roles.length
        }
      });

    } catch (error) {
      logger.error('Failed to get roles', {
        error: error instanceof Error ? error.message : 'Unknown error',
        actor: typedReq.user?.id
      });

      res.status(500).json({
        success: false,
        error: 'Failed to get roles'
      });
    }
  }

  // Create role
  async createRole(req: Request, res: Response): Promise<Response | void> {
    const typedReq = req as TypedRequest;
    try {
      const roleData = typedReq.body;
      const adminId = typedReq.user?.id;

      const role = await (prisma as any).role.create({
        data: {
          ...roleData,
          createdBy: adminId
        }
      });

      logger.info('Role created successfully', {
        roleId: role.id,
        name: role.name,
        permissions: roleData.permissions,
        createdBy: adminId
      });

      res.status(201).json({
        success: true,
        data: role
      });

    } catch (error) {
      logger.error('Failed to create role', {
        error: error instanceof Error ? error.message : 'Unknown error',
        actor: typedReq.user?.id
      });

      res.status(500).json({
        success: false,
        error: 'Failed to create role'
      });
    }
  }

  // Update role
  async updateRole(req: Request, res: Response): Promise<Response | void> {
    const typedReq = req as TypedRequest;
    try {
      const { roleId } = typedReq.params;
      const updates = typedReq.body;
      const adminId = typedReq.user?.id;

      const role = await (prisma as any).role.update({
        where: { id: roleId },
        data: updates
      });

      logger.info('Role updated successfully', {
        roleId,
        updates: Object.keys(updates),
        updatedBy: adminId
      });

      res.json({
        success: true,
        data: role
      });

    } catch (error) {
      logger.error('Failed to update role', {
        error: error instanceof Error ? error.message : 'Unknown error',
        actor: typedReq.user?.id
      });

      res.status(500).json({
        success: false,
        error: 'Failed to update role'
      });
    }
  }

  // Delete role
  async deleteRole(req: Request, res: Response): Promise<Response | void> {
    const typedReq = req as TypedRequest;
    try {
      const { roleId } = typedReq.params;
      const adminId = typedReq.user?.id;

      await (prisma as any).role.delete({
        where: { id: roleId }
      });

      logger.info('Role deleted successfully', {
        roleId,
        deletedBy: adminId
      });

      res.json({
        success: true,
        message: 'Role deleted successfully'
      });

    } catch (error) {
      logger.error('Failed to delete role', {
        error: error instanceof Error ? error.message : 'Unknown error',
        actor: typedReq.user?.id
      });

      res.status(500).json({
        success: false,
        error: 'Failed to delete role'
      });
    }
  }

  // Get user roles
  async getUserRoles(req: Request, res: Response): Promise<Response | void> {
    const typedReq = req as TypedRequest;
    try {
      const { userId } = typedReq.params;

      const user = await (prisma as any).user.findUnique({
        where: { id: userId },
        include: {
          roles: {
            include: {
              permissions: true
            }
          }
        }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            roles: user.roles
          }
        }
      });

    } catch (error) {
      logger.error('Failed to get user roles', {
        error: error instanceof Error ? error.message : 'Unknown error',
        actor: typedReq.user?.id
      });

      res.status(500).json({
        success: false,
        error: 'Failed to get user roles'
      });
    }
  }

  // Assign user role
  async assignUserRole(req: Request, res: Response): Promise<Response | void> {
    const typedReq = req as TypedRequest;
    try {
      const { userId, roleId } = typedReq.body;
      const adminId = typedReq.user?.id;

      // Validate user and role exist
      const [user, role] = await Promise.all([
        (prisma as any).user.findUnique({ where: { id: userId } }),
        (prisma as any).role.findUnique({ where: { id: roleId } })
      ]);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      if (!role) {
        return res.status(404).json({
          success: false,
          error: 'Role not found'
        });
      }

      // Assign role to user
      const updatedUser = await (prisma as any).user.update({
        where: { id: userId },
        data: {
          roles: {
            connect: { id: roleId }
          }
        }
      });

      logger.info('User role assigned successfully', {
        userId,
        roleId,
        roleName: role.name,
        assignedBy: adminId
      });

      res.json({
        success: true,
        data: {
          user: updatedUser,
          message: 'User role assigned successfully'
        }
      });

    } catch (error) {
      logger.error('Failed to assign user role', {
        error: error instanceof Error ? error.message : 'Unknown error',
        actor: typedReq.user?.id
      });

      res.status(500).json({
        success: false,
        error: 'Failed to assign user role'
      });
    }
  }

  // Remove user role
  async removeUserRole(req: Request, res: Response): Promise<Response | void> {
    const typedReq = req as TypedRequest;
    try {
      const { userId, roleId } = typedReq.params;
      const adminId = typedReq.user?.id;

      // Validate user and role exist
      const [user, role] = await Promise.all([
        (prisma as any).user.findUnique({ where: { id: userId } }),
        (prisma as any).role.findUnique({ where: { id: roleId } })
      ]);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      if (!role) {
        return res.status(404).json({
          success: false,
          error: 'Role not found'
        });
      }

      // Remove role from user
      const updatedUser = await (prisma as any).user.update({
        where: { id: userId },
        data: {
          roles: {
            disconnect: { id: roleId }
          }
        }
      });

      logger.info('User role removed successfully', {
        userId,
        roleId,
        roleName: role.name,
        removedBy: adminId
      });

      res.json({
        success: true,
        data: {
          user: updatedUser,
          message: 'User role removed successfully'
        }
      });

    } catch (error) {
      logger.error('Failed to remove user role', {
        error: error instanceof Error ? error.message : 'Unknown error',
        actor: typedReq.user?.id
      });

      res.status(500).json({
        success: false,
        error: 'Failed to remove user role'
      });
    }
  }

  // Get booking queues
  async getBookingQueues(req: Request, res: Response): Promise<Response | void> {
    const typedReq = req as TypedRequest;
    try {
      const { queueType } = typedReq.query;
      const page = parseInt(typedReq.query.page as string) || 1;
      const limit = parseInt(typedReq.query.limit as string) || 10;
      const offset = (page - 1) * limit;

      const whereConditions: any = {};

      if (queueType === 'pending') {
        whereConditions.status = 'PENDING';
      } else if (queueType === 'processing') {
        whereConditions.status = { in: ['CONFIRMED', 'HOLD'] };
      } else if (queueType === 'completed') {
        whereConditions.status = { in: ['CANCELLED', 'REFUNDED'] };
      }

      const [bookings, total] = await Promise.all([
        prisma.booking.findMany({
          where: whereConditions,
          skip: offset,
          take: limit,
          orderBy: { bookedAt: 'desc' },
          include: {
            customer: true,
          }
        }),
        prisma.booking.count({ where: whereConditions })
      ]);

      const totalPages = Math.ceil(total / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      res.json({
        success: true,
        data: {
          bookings,
          queueType,
          pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNextPage,
            hasPrevPage
          }
        }
      });

    } catch (error) {
      logger.error('Failed to get booking queues', {
        error: error instanceof Error ? error.message : 'Unknown error',
        actor: typedReq.user?.id
      });

      res.status(500).json({
        success: false,
        error: 'Failed to get booking queues'
      });
    }
  }

  // Get agent assignments
  async getAgentAssignments(req: Request, res: Response): Promise<Response | void> {
    const typedReq = req as TypedRequest;
    try {
      const { agentId } = typedReq.params;
      const page = parseInt(typedReq.query.page as string) || 1;
      const limit = parseInt(typedReq.query.limit as string) || 10;
      const offset = (page - 1) * limit;

      const [bookings, total] = await Promise.all([
        prisma.booking.findMany({
          where: { assignedAgent: agentId },
          skip: offset,
          take: limit,
          orderBy: { bookedAt: 'desc' },
          include: {
            customer: true,
          }
        }),
        prisma.booking.count({ where: { assignedAgent: agentId } })
      ]);

      const totalPages = Math.ceil(total / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      res.json({
        success: true,
        data: {
          bookings,
          agentId,
          pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNextPage,
            hasPrevPage
          }
        }
      });

    } catch (error) {
      logger.error('Failed to get agent assignments', {
        error: error instanceof Error ? error.message : 'Unknown error',
        actor: typedReq.user?.id
      });

      res.status(500).json({
        success: false,
        error: 'Failed to get agent assignments'
      });
    }
  }

  // Get booking statistics
  async getBookingStatistics(req: Request, res: Response): Promise<Response | void> {
    const typedReq = req as TypedRequest;
    try {
      const { dateRange } = typedReq.query;
      const startDate = dateRange ? new Date(dateRange as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Last 30 days
      const endDate = new Date();

      const stats = await prisma.$transaction([
        prisma.booking.count({
          where: {
            bookedAt: {
              gte: startDate,
              lte: endDate
            }
          }
        }),
        prisma.booking.groupBy({
          by: ['status'],
          _count: true,
          orderBy: { status: 'asc' },
          where: {
            bookedAt: {
              gte: startDate,
              lte: endDate
            }
          }
        }),
        prisma.booking.groupBy({
          by: ['serviceType'],
          _count: true,
          orderBy: { serviceType: 'asc' },
          where: {
            bookedAt: {
              gte: startDate,
              lte: endDate
            }
          }
        }),
        prisma.booking.aggregate({
          _sum: {
            'customerPrice': true
          },
          where: {
            bookedAt: {
              gte: startDate,
              lte: endDate
            }
          }
        })
      ]);

      const totalBookings = stats[0];
      const statusStats = stats[1];
      const typeStats = stats[2];
      const revenueStats = stats[3];

      res.json({
        success: true,
        data: {
          totalBookings,
          statusDistribution: statusStats,
          typeDistribution: typeStats,
          totalRevenue: revenueStats._sum['customerPrice'] || 0,
          dateRange: {
            startDate,
            endDate
          }
        }
      });

    } catch (error) {
      logger.error('Failed to get booking statistics', {
        error: error instanceof Error ? error.message : 'Unknown error',
        actor: typedReq.user?.id
      });

      res.status(500).json({
        success: false,
        error: 'Failed to get booking statistics'
      });
    }
  }

  // Get user activity
  async getUserActivity(req: Request, res: Response): Promise<Response | void> {
    const typedReq = req as TypedRequest;
    try {
      const { userId } = typedReq.params;
      const page = parseInt(typedReq.query.page as string) || 1;
      const limit = parseInt(typedReq.query.limit as string) || 10;
      const offset = (page - 1) * limit;

      const [activities, total] = await Promise.all([
        prisma.auditLog.findMany({
          where: { actor: userId },
          skip: offset,
          take: limit,
          orderBy: { timestamp: 'desc' }
        }),
        prisma.auditLog.count({ where: { actor: userId } })
      ]);

      const totalPages = Math.ceil(total / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      res.json({
        success: true,
        data: {
          activities,
          userId,
          pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNextPage,
            hasPrevPage
          }
        }
      });

    } catch (error) {
      logger.error('Failed to get user activity', {
        error: error instanceof Error ? error.message : 'Unknown error',
        actor: typedReq.user?.id
      });

      res.status(500).json({
        success: false,
        error: 'Failed to get user activity'
      });
    }
  }

  // Get system health
  async getSystemHealth(req: Request, res: Response): Promise<Response | void> {
    const typedReq = req as TypedRequest;
    try {
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          database: await this.checkDatabaseHealth(),
          redis: await this.checkRedisHealth(),
          cache: await this.checkCacheHealth()
        },
        metrics: await this.getSystemMetrics()
      };

      res.json({
        success: true,
        data: health
      });

    } catch (error) {
      logger.error('Failed to get system health', {
        error: error instanceof Error ? error.message : 'Unknown error',
        actor: typedReq.user?.id
      });

      res.status(500).json({
        success: false,
        error: 'Failed to get system health'
      });
    }
  }

  // Helper methods
  private async logPermissionChange(adminId: string | undefined, userId: string, permissions: string[], action: string): Promise<void> {
    // TODO: Implement audit logging for permission changes
    // This requires bookingId which doesn't make sense for user permissions
    // await prisma.auditLog.create({
    //   data: {
    //     actor: adminId || 'system',
    //     action: 'permission_change',
    //     details: {
    //       action,
    //       permissions,
    //       changedBy: adminId
    //     }
    //   }
    // });
  }

  private async checkDatabaseHealth(): Promise<{ status: string; responseTime: number }> {
    const startTime = Date.now();
    try {
      await prisma.$queryRaw`SELECT 1`;
      return {
        status: 'healthy',
        responseTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime
      };
    }
  }

  private async checkRedisHealth(): Promise<{ status: string; responseTime: number }> {
    const startTime = Date.now();
    try {
      await cacheService.ping();
      return {
        status: 'healthy',
        responseTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime
      };
    }
  }

  private async checkCacheHealth(): Promise<{ status: string; hitRate: number }> {
    try {
      // Test cache operations
      await cacheService.set('health_check', 'test', 10);
      const value = await cacheService.get('health_check');
      await cacheService.del('health_check');

      if (value === 'test') {
        return {
          status: 'healthy',
          hitRate: 100
        };
      } else {
        return {
          status: 'unhealthy',
          hitRate: 0
        };
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        hitRate: 0
      };
    }
  }

  private async getSystemMetrics(): Promise<any> {
    return {
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime(),
      nodeVersion: process.version
    };
  }
}

export const adminBookingCardController = new AdminBookingCardController();