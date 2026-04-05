import { getCoreDb } from '../database.js';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';

export class FlyerService {
  private flyerStoragePath = process.env.FLYER_STORAGE_PATH || './uploads/flyers';

  /**
   * Create flyer
   */
  async createFlyer(
    title: string,
    designJson: any,
    uploadedBy: string,
    data?: {
      description?: string;
      thumbnailUrl?: string;
    }
  ) {
    try {
      const flyerId = `flyer_${Date.now()}`;
      const shareableLink = `flyer_${uuidv4().substring(0, 8)}`;

      const flyer = await getCoreDb().marketing_flyer.create({
        data: {
          flyerId,
          title,
          description: data?.description,
          designJson,
          thumbnailUrl: data?.thumbnailUrl,
          shareableLink,
          createdBy: uploadedBy,
          isPublished: false,
        },
      });

      return flyer;
    } catch (error: unknown) {
      console.error('Error creating flyer:', error);
      throw error;
    }
  }

  /**
   * Get flyer
   */
  async getFlyer(flyerId: string) {
    try {
      return await getCoreDb().marketing_flyer.findUnique({
        where: { flyerId },
        include: {
          shareLinks: true,
        },
      });
    } catch (error: unknown) {
      console.error('Error fetching flyer:', error);
      throw error;
    }
  }

  /**
   * Get flyer by share link
   */
  async getFlyerByShareLink(shareableLink: string) {
    try {
      const flyer = await getCoreDb().marketing_flyer.findUnique({
        where: { shareableLink },
      });

      if (flyer) {
        // Increment views
        await getCoreDb().marketing_flyer.update({
          where: { flyerId: flyer.flyerId },
          data: { shareViews: { increment: 1 } },
        });
      }

      return flyer;
    } catch (error: unknown) {
      console.error('Error fetching flyer by share link:', error);
      throw error;
    }
  }

  /**
   * Update flyer
   */
  async updateFlyer(
    flyerId: string,
    data: {
      title?: string;
      description?: string;
      designJson?: any;
      thumbnailUrl?: string;
    }
  ) {
    try {
      return await getCoreDb().marketing_flyer.update({
        where: { flyerId },
        data: {
          ...data,
          updatedAt: new Date(),
        },
      });
    } catch (error: unknown) {
      console.error('Error updating flyer:', error);
      throw error;
    }
  }

  /**
   * Publish flyer
   */
  async publishFlyer(flyerId: string) {
    try {
      return await getCoreDb().marketing_flyer.update({
        where: { flyerId },
        data: { isPublished: true },
      });
    } catch (error: unknown) {
      console.error('Error publishing flyer:', error);
      throw error;
    }
  }

  /**
   * Track share
   */
  async trackShare(flyerId: string, platform: string) {
    try {
      await getCoreDb().marketing_flyer.update({
        where: { flyerId },
        data: {
          totalShares: { increment: 1 },
          [`${platform}Shares`]: { increment: 1 },
        },
      });

      return { success: true };
    } catch (error: unknown) {
      console.error('Error tracking share:', error);
      throw error;
    }
  }

  /**
   * Upload image for flyer
   */
  async uploadImage(
    fileName: string,
    fileBuffer: Buffer,
    uploadedBy: string,
    options?: {
      altText?: string;
      width?: number;
      height?: number;
    }
  ) {
    try {
      // Generate unique file names
      const unique = `${Date.now()}_${uuidv4().substring(0, 8)}`;
      const originalPath = path.join(this.flyerStoragePath, `${unique}_${fileName}`);
      const backupPath = path.join(this.flyerStoragePath, `backup_${unique}_${fileName}`);

      // Ensure directory exists
      await fs.mkdir(this.flyerStoragePath, { recursive: true });

      // Save original
      await fs.writeFile(originalPath, fileBuffer);

      // Save backup
      await fs.writeFile(backupPath, fileBuffer);

      // Create asset record
      const asset = await getCoreDb().asset_file.create({
        data: {
          fileName: `${unique}_${fileName}`,
          originalFileName: fileName,
          fileType: 'image/' + path.extname(fileName).substring(1),
          fileSize: fileBuffer.length,
          mimeType: 'image/' + path.extname(fileName).substring(1),
          storagePath: originalPath,
          uploadedBy,
          width: options?.width,
          height: options?.height,
          altText: options?.altText,
          isBackup: false,
          cleanupAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });

      return {
        fileId: asset.id,
        url: `/uploads/flyers/${unique}_${fileName}`,
        asset,
      };
    } catch (error: unknown) {
      console.error('Error uploading image:', error);
      throw error;
    }
  }

  /**
   * Delete old files
   */
  async cleanupOldFiles() {
    try {
      const now = new Date();

      // Find old files
      const oldFiles = await getCoreDb().asset_file.findMany({
        where: {
          cleanupAt: { lt: now },
          isBackup: true,
        },
      });

      // Delete from filesystem
      for (const file of oldFiles) {
        try {
          await fs.unlink(file.storagePath);
        } catch (e) {
          console.error(`Error deleting file ${file.storagePath}:`, e);
        }
      }

      // Delete from database
      await getCoreDb().asset_file.deleteMany({
        where: {
          cleanupAt: { lt: now },
          isBackup: true,
        },
      });

      return { deleted: oldFiles.length };
    } catch (error: unknown) {
      console.error('Error cleaning up files:', error);
      throw error;
    }
  }

  /**
   * Create share link
   */
  async createShareLink(
    flyerId: string,
    platform: string,
    utmParams?: {
      source?: string;
      medium?: string;
      campaign?: string;
      content?: string;
    }
  ) {
    try {
      const shareKey = `share_${uuidv4().substring(0, 16)}`;

      const link = await getCoreDb().flyer_share_link.create({
        data: {
          flyerId,
          shareKey,
          platform,
          utmSource: utmParams?.source,
          utmMedium: utmParams?.medium,
          utmCampaign: utmParams?.campaign,
        },
      });

      return link;
    } catch (error: unknown) {
      console.error('Error creating share link:', error);
      throw error;
    }
  }

  /**
   * Track share link click
   */
  async trackShareLinkClick(shareKey: string) {
    try {
      return await getCoreDb().flyer_share_link.update({
        where: { shareKey },
        data: { clicks: { increment: 1 } },
      });
    } catch (error: unknown) {
      console.error('Error tracking share link click:', error);
      throw error;
    }
  }

  /**
   * List flyers
   */
  async listFlyers(
    filters?: {
      isPublished?: boolean;
      featured?: boolean;
      limit?: number;
      offset?: number;
    }
  ) {
    try {
      const where: any = {};
      if (filters?.isPublished !== undefined) where.isPublished = filters.isPublished;
      if (filters?.featured !== undefined) where.featured = filters.featured;

      const [flyers, total] = await Promise.all([
        getCoreDb().marketing_flyer.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: filters?.limit || 20,
          skip: filters?.offset || 0,
        }),
        getCoreDb().marketing_flyer.count({ where }),
      ]);

      return { flyers, total, pages: Math.ceil(total / (filters?.limit || 20)) };
    } catch (error: unknown) {
      console.error('Error listing flyers:', error);
      throw error;
    }
  }
}

export const flyerService = new FlyerService();
