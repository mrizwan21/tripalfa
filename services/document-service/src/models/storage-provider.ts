/**
 * Storage Provider Implementation
 * Abstraction layer for document storage (S3, Local, Azure)
 */

import fs from 'fs';
import path from 'path';
import { promises as fsPromises } from 'fs';
import AWS from 'aws-sdk';
import { IStorageProvider } from './types';

/**
 * Local file system storage provider
 * Used for development and local testing
 */
export class LocalStorageProvider implements IStorageProvider {
  private basePath: string;

  constructor(basePath: string = './storage/documents') {
    this.basePath = basePath;
    // Ensure base directory exists
    if (!fs.existsSync(this.basePath)) {
      fs.mkdirSync(this.basePath, { recursive: true });
    }
  }

  /**
   * Upload file to local storage
   */
  async upload(key: string, buffer: Buffer, _contentType: string): Promise<string> {
    try {
      const fullPath = path.join(this.basePath, key);
      const directory = path.dirname(fullPath);

      // Create nested directories if needed
      await fsPromises.mkdir(directory, { recursive: true });

      // Write file
      await fsPromises.writeFile(fullPath, buffer);

      console.log(`[LocalStorage] Uploaded: ${key}`);
      return `file://${fullPath}`;
    } catch (error) {
      throw new Error(`Failed to upload to local storage: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Download file from local storage
   */
  async download(key: string): Promise<Buffer> {
    try {
      const fullPath = path.join(this.basePath, key);

      if (!fs.existsSync(fullPath)) {
        throw new Error(`File not found: ${key}`);
      }

      const buffer = await fsPromises.readFile(fullPath);
      console.log(`[LocalStorage] Downloaded: ${key}`);
      return buffer;
    } catch (error) {
      throw new Error(`Failed to download from local storage: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Delete file from local storage
   */
  async delete(key: string): Promise<void> {
    try {
      const fullPath = path.join(this.basePath, key);

      if (fs.existsSync(fullPath)) {
        await fsPromises.unlink(fullPath);
        console.log(`[LocalStorage] Deleted: ${key}`);
      }
    } catch (error) {
      throw new Error(`Failed to delete from local storage: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Check if file exists in local storage
   */
  async exists(key: string): Promise<boolean> {
    try {
      const fullPath = path.join(this.basePath, key);
      return fs.existsSync(fullPath);
    } catch (error) {
      return false;
    }
  }

  /**
   * Get signed URL for local storage (returns file:// URL)
   */
  async getSignedUrl(key: string, _expirationSeconds?: number): Promise<string> {
    const fullPath = path.join(this.basePath, key);
    return `file://${fullPath}`;
  }
}

/**
 * AWS S3 storage provider
 * Used for production deployment
 */
export class S3StorageProvider implements IStorageProvider {
  private s3Client: AWS.S3;
  private bucketName: string;

  constructor(
    bucketName: string,
    _region: string = 'us-east-1',
    accessKeyId?: string,
    secretAccessKey?: string,
  ) {
    this.bucketName = bucketName;

    // Initialize S3 client
    this.s3Client = new AWS.S3({
      region: _region,
      ...(accessKeyId && secretAccessKey && { accessKeyId, secretAccessKey }),
    });
  }

  /**
   * Upload file to S3
   */
  async upload(key: string, buffer: Buffer, contentType: string): Promise<string> {
    try {
      const params: AWS.S3.PutObjectRequest = {
        Bucket: this.bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        ServerSideEncryption: 'AES256',
        CacheControl: 'max-age=31536000', // Cache for 1 year
      };

      await this.s3Client.upload(params).promise();
      console.log(`[S3Storage] Uploaded: s3://${this.bucketName}/${key}`);

      return `s3://${this.bucketName}/${key}`;
    } catch (error) {
      throw new Error(`Failed to upload to S3: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Download file from S3
   */
  async download(key: string): Promise<Buffer> {
    try {
      const params: AWS.S3.GetObjectRequest = {
        Bucket: this.bucketName,
        Key: key,
      };

      const data = await this.s3Client.getObject(params).promise();
      console.log(`[S3Storage] Downloaded: s3://${this.bucketName}/${key}`);

      return data.Body as Buffer;
    } catch (error) {
      throw new Error(`Failed to download from S3: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Delete file from S3
   */
  async delete(key: string): Promise<void> {
    try {
      const params: AWS.S3.DeleteObjectRequest = {
        Bucket: this.bucketName,
        Key: key,
      };

      await this.s3Client.deleteObject(params).promise();
      console.log(`[S3Storage] Deleted: s3://${this.bucketName}/${key}`);
    } catch (error) {
      throw new Error(`Failed to delete from S3: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Check if file exists in S3
   */
  async exists(key: string): Promise<boolean> {
    try {
      const params: AWS.S3.HeadObjectRequest = {
        Bucket: this.bucketName,
        Key: key,
      };

      await this.s3Client.headObject(params).promise();
      return true;
    } catch (error: any) {
      if (error.code === 'NotFound' || error.statusCode === 404) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Get signed URL for S3 download
   */
  async getSignedUrl(key: string, expirationSeconds: number = 3600): Promise<string> {
    try {
      const params: AWS.S3.GetObjectRequest = {
        Bucket: this.bucketName,
        Key: key,
      };

      const url = this.s3Client.getSignedUrl('getObject', {
        ...params,
        Expires: expirationSeconds,
      });

      return url;
    } catch (error) {
      throw new Error(`Failed to generate signed URL: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

/**
 * Factory function to create appropriate storage provider
 */
export function createStorageProvider(
  providerType: 'local' | 's3' | string = 'local',
  config?: {
    bucketName?: string;
    region?: string;
    accessKeyId?: string;
    secretAccessKey?: string;
    basePath?: string;
  },
): IStorageProvider {
  if (providerType === 's3') {
    return new S3StorageProvider(
      config?.bucketName || process.env.AWS_S3_BUCKET || 'documents',
      config?.region || process.env.AWS_REGION || 'us-east-1',
      config?.accessKeyId || process.env.AWS_ACCESS_KEY_ID,
      config?.secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY,
    );
  }

  // Default to local storage
  return new LocalStorageProvider(config?.basePath || process.env.STORAGE_LOCAL_PATH || './storage/documents');
}
