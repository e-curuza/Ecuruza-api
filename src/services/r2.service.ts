import {
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  CopyObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, r2Config, R2_BUCKET_URL } from '../config/r2.config';
import { logger } from '../utils/logger';

export interface UploadOptions {
  folder?: string;
  filename?: string;
  contentType?: string;
  metadata?: Record<string, string>;
  isPublic?: boolean;
}

export interface UploadResult {
  key: string;
  url: string;
  size: number;
  contentType: string;
}

export class R2Service {
  private bucketName: string;

  constructor() {
    this.bucketName = r2Config.bucketName;
  }

  generateKey(folder: string, filename: string): string {
    // If filename already contains a unique identifier (timestamp), use it as-is
    if (filename.match(/\d{13}/)) {
      return `${folder}/${filename}`;
    }
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const extension = filename.split('.').pop() || '';
    const nameWithoutExt = filename.replace(`.${extension}`, '');
    return `${folder}/${nameWithoutExt}_${timestamp}_${randomString}.${extension}`;
  }

  async uploadFile(
    buffer: Buffer,
    options: UploadOptions
  ): Promise<UploadResult> {
    const { folder = 'uploads', filename, contentType, metadata } = options;
    const key = this.generateKey(folder, filename || 'file');

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      Metadata: metadata,
      ACL: options.isPublic ? 'public-read' : 'private',
    });

    await s3Client.send(command);

    const url = `${R2_BUCKET_URL}/${key}`;

    logger.info(`File uploaded successfully: ${key}`);

    return {
      key,
      url,
      size: buffer.length,
      contentType: contentType || 'application/octet-stream',
    };
  }

  async uploadFromPath(
    filePath: string,
    options: UploadOptions
  ): Promise<UploadResult> {
    const fs = await import('fs');
    const buffer = fs.readFileSync(filePath);
    return this.uploadFile(buffer, options);
  }

  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    return getSignedUrl(s3Client, command, { expiresIn });
  }

  async getUploadSignedUrl(
    key: string,
    contentType: string,
    expiresIn: number = 3600
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: contentType,
    });

    return getSignedUrl(s3Client, command, { expiresIn });
  }

  async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    await s3Client.send(command);
    logger.info(`File deleted successfully: ${key}`);
  }

  async deleteFiles(keys: string[]): Promise<void> {
    await Promise.all(keys.map((key) => this.deleteFile(key)));
  }

  async copyFile(sourceKey: string, destinationKey: string): Promise<void> {
    const command = new CopyObjectCommand({
      Bucket: this.bucketName,
      CopySource: `${this.bucketName}/${sourceKey}`,
      Key: destinationKey,
    });

    await s3Client.send(command);
    logger.info(`File copied from ${sourceKey} to ${destinationKey}`);
  }

  async listFiles(prefix: string): Promise<string[]> {
    const command = new ListObjectsV2Command({
      Bucket: this.bucketName,
      Prefix: prefix,
    });

    const response = await s3Client.send(command);
    return response.Contents?.map((item) => item.Key || '') || [];
  }

  async getFileMetadata(key: string): Promise<{
    size: number;
    contentType: string;
    lastModified: Date;
    metadata: Record<string, string>;
  } | null> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    try {
      const response = await s3Client.send(command);
      return {
        size: response.ContentLength || 0,
        contentType: response.ContentType || 'application/octet-stream',
        lastModified: response.LastModified || new Date(),
        metadata: response.Metadata || {},
      };
    } catch (error) {
      logger.error(`Failed to get file metadata: ${key}`, error);
      return null;
    }
  }

  async fileExists(key: string): Promise<boolean> {
    const metadata = await this.getFileMetadata(key);
    return metadata !== null;
  }
}

export const r2Service = new R2Service();
