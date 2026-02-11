/**
 * Statistics Controller
 * REST API endpoints for reporting and statistics
 */

import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

/**
 * Extended Express Request with authenticated user info
 */
interface AuthRequest extends Request {
  userId?: string;
  isAdmin?: boolean;
}

/**
 * Statistics Controller handling statistics and reporting endpoints
 */
export class StatisticsController {
  constructor(private prisma: PrismaClient) {}

  /**
   * Get document statistics for user
   * GET /documents/stats/summary
   */
  async getDocumentStatistics(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.userId!;
      const { startDate, endDate } = req.query;

      const whereClause: any = { userId };
      if (startDate) whereClause.createdAt = { gte: new Date(startDate as string) };
      if (endDate) {
        if (!whereClause.createdAt) whereClause.createdAt = {};
        whereClause.createdAt.lte = new Date(endDate as string);
      }

      // Get counts by type
      const [byType, byStatus, total, durations] = await Promise.all([
        this.prisma.document.groupBy({
          by: ['type'],
          where: whereClause,
          _count: true,
        }),
        this.prisma.document.groupBy({
          by: ['status'],
          where: whereClause,
          _count: true,
        }),
        this.prisma.document.count({ where: whereClause }),
        this.prisma.document.findMany({
          where: whereClause,
          select: { generatedAt: true },
        }),
      ]);

      // Calculate average generation time (from createdAt to generatedAt)
      const avgGenerationTime =
        durations.length > 0
          ? durations.reduce((sum, d) => {
              if (d.generatedAt) {
                return sum + (new Date(d.generatedAt).getTime() - new Date(d.generatedAt).getTime());
              }
              return sum;
            }, 0) / durations.length
          : 0;

      // Calculate total file size
      const sizeData = await this.prisma.document.aggregate({
        where: whereClause,
        _sum: { fileSize: true },
      });

      const typeStats: Record<string, number> = {};
      byType.forEach((item: any) => {
        typeStats[item.type] = item._count;
      });

      const statusStats: Record<string, number> = {};
      byStatus.forEach((item: any) => {
        statusStats[item.status] = item._count;
      });

      res.json({
        success: true,
        stats: {
          total,
          byType: typeStats,
          byStatus: statusStats,
          averageGenerationTime: Math.round(avgGenerationTime),
          totalFileSize: sizeData._sum.fileSize || 0,
          period: {
            startDate: startDate || null,
            endDate: endDate || null,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get template statistics
   * GET /templates/stats/summary
   */
  async getTemplateStatistics(
    _req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const byType = await this.prisma.documentTemplate.groupBy({
        by: ['type'],
        _count: true,
      });

      const total = await this.prisma.documentTemplate.count();

      const typeStats: Record<string, number> = {};
      byType.forEach((item: any) => {
        typeStats[item.type] = item._count;
      });

      res.json({
        success: true,
        stats: {
          total,
          byType: typeStats,
          defaultOnly: await this.prisma.documentTemplate.count({ where: { isActive: true } }),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get system-wide statistics (admin only)
   * GET /system/stats/summary
   */
  async getSystemStatistics(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.isAdmin) {
        res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Admin access required' },
        });
        return;
      }

      const [totalDocuments, totalTemplates, documentsByType, documentsByStatus] = await Promise.all([
        this.prisma.document.count(),
        this.prisma.documentTemplate.count(),
        this.prisma.document.groupBy({
          by: ['type'],
          _count: true,
        }),
        this.prisma.document.groupBy({
          by: ['status'],
          _count: true,
        }),
      ]);

      const typeStats: Record<string, number> = {};
      documentsByType.forEach((item: any) => {
        typeStats[item.type] = item._count;
      });

      const statusStats: Record<string, number> = {};
      documentsByStatus.forEach((item: any) => {
        statusStats[item.status] = item._count;
      });

      res.json({
        success: true,
        stats: {
          totalDocuments,
          totalTemplates,
          documentsByType: typeStats,
          documentsByStatus: statusStats,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get audit log summary
   * GET /audit/summary
   */
  async getAuditSummary(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.isAdmin) {
        res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Admin access required' },
        });
        return;
      }

      const { days = 7 } = req.query;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(days as string));

      const logs = await this.prisma.documentAccess.groupBy({
        by: ['action'],
        where: {
          timestamp: { gte: startDate },
        },
        _count: true,
      });

      const actionStats: Record<string, number> = {};
      logs.forEach((log: any) => {
        actionStats[log.action] = log._count;
      });

      res.json({
        success: true,
        stats: {
          auditLogs: actionStats,
          period: {
            days: parseInt(days as string),
            startDate,
            endDate: new Date(),
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get performance metrics
   * GET /system/metrics/performance
   */
  async getPerformanceMetrics(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.isAdmin) {
        res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Admin access required' },
        });
        return;
      }

      const { hours = 24 } = req.query;
      const startTime = Date.now() - parseInt(hours as string) * 3600000;

      const documents = await this.prisma.document.findMany({
        where: {
          createdAt: {
            gte: new Date(startTime),
          },
        },
        select: {
          createdAt: true,
          generatedAt: true,
          fileSize: true,
          status: true,
        },
      });

      if (documents.length === 0) {
        res.json({
          success: true,
          metrics: {
            period: { hours: parseInt(hours as string) },
            documentCount: 0,
          },
        });
        return;
      }

      const avgGenerationTime = documents.reduce((sum, d) => {
        if (d.generatedAt && d.createdAt) {
          return sum + (new Date(d.generatedAt).getTime() - new Date(d.createdAt).getTime());
        }
        return sum;
      }, 0) / documents.length;
      const avgFileSize = documents.reduce((sum, d) => sum + (d.fileSize || 0), 0) / documents.length;

      const successCount = documents.filter((d) => d.status === 'GENERATED').length;
      const errorCount = documents.filter((d) => d.status === 'FAILED').length;

      res.json({
        success: true,
        metrics: {
          period: { hours: parseInt(hours as string), startTime: new Date(startTime), endTime: new Date() },
          documentCount: documents.length,
          performance: {
            averageGenerationTime: Math.round(avgGenerationTime),
            averageFileSize: Math.round(avgFileSize),
          },
          status: {
            successful: successCount,
            failed: errorCount,
            successRate: ((successCount / documents.length) * 100).toFixed(2) + '%',
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
