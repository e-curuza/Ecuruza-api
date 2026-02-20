import { r2Service } from '../services/r2.service.js';
import type { UploadOptions, UploadResult } from '../services/r2.service.js';
import { logger } from './logger.js';
import createError from 'http-errors';
import crypto from 'crypto';

export const SUPPORTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
];

export const SUPPORTED_DOCUMENT_TYPES = ['application/pdf'];

export const SUPPORTED_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
];

export interface ImageDimensions {
  width: number;
  height: number;
  maxWidth?: number;
  maxHeight?: number;
  minWidth?: number;
  minHeight?: number;
}

export const sanitizeFilename = (filename: string): string => {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_')
    .toLowerCase();
}

export const getFileExtension = (filename: string): string => {
  return filename.split('.').pop()?.toLowerCase() || '';
}

export const generateUniqueFilename = (
  originalname: string,
  prefix?: string
): string => {
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(4).toString('hex');
  const sanitized = sanitizeFilename(originalname);
  const extension = getFileExtension(sanitized);
  const nameWithoutExt = sanitized.replace(`.${extension}`, '');
  
  return prefix 
    ? `${prefix}_${timestamp}_${randomString}.${extension}`
    : `${nameWithoutExt}_${timestamp}_${randomString}.${extension}`;
}

export const isImage = (mimeType: string): boolean => {
  return SUPPORTED_IMAGE_TYPES.includes(mimeType);
}

export const isDocument = (mimeType: string): boolean => {
  return SUPPORTED_DOCUMENT_TYPES.includes(mimeType);
}

export const isVideo = (mimeType: string): boolean => {
  return SUPPORTED_VIDEO_TYPES.includes(mimeType);
}

export const getFileCategory = (mimeType: string): string => {
  if (isImage(mimeType)) return 'images';
  if (isVideo(mimeType)) return 'videos';
  if (isDocument(mimeType)) return 'documents';
  return 'files';
}

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export const validateImageDimensions = (
  dimensions: ImageDimensions
): { valid: boolean; error?: string } => {
  const { width, height, maxWidth, maxHeight, minWidth, minHeight } = dimensions;
  
  if (maxWidth && width > maxWidth) {
    return { valid: false, error: `Image width (${width}px) exceeds maximum allowed (${maxWidth}px)` };
  }
  
  if (maxHeight && height > maxHeight) {
    return { valid: false, error: `Image height (${height}px) exceeds maximum allowed (${maxHeight}px)` };
  }
  
  if (minWidth && width < minWidth) {
    return { valid: false, error: `Image width (${width}px) is below minimum required (${minWidth}px)` };
  }
  
  if (minHeight && height < minHeight) {
    return { valid: false, error: `Image height (${height}px) is below minimum required (${minHeight}px)` };
  }
  
  return { valid: true };
}

export const uploadSingleFile = async (
  buffer: Buffer,
  originalname: string,
  mimeType: string,
  options?: Partial<UploadOptions>
): Promise<UploadResult> => {
  try {
    const folder = options?.folder || getFileCategory(mimeType);
    const filename = options?.filename || generateUniqueFilename(originalname);
    
    const result = await r2Service.uploadFile(buffer, {
      folder,
      filename,
      contentType: mimeType,
      metadata: options?.metadata || {},
      isPublic: options?.isPublic ?? false,
    });
    
    logger.info(`File uploaded successfully: ${result.key}`);
    return result;
  } catch (error) {
    logger.error('Failed to upload file to R2', error);
    throw createError(500, 'Failed to upload file');
  }
}

export const uploadMultipleFiles = async (
  files: Array<{ buffer: Buffer; originalname: string; mimetype: string }>,
  options?: Partial<UploadOptions>
): Promise<UploadResult[]> => {
  try {
    const uploadPromises = files.map((file) =>
      uploadSingleFile(file.buffer, file.originalname, file.mimetype, options)
    );
    
    const results = await Promise.all(uploadPromises);
    logger.info(`${results.length} files uploaded successfully`);
    return results;
  } catch (error) {
    logger.error('Failed to upload multiple files to R2', error);
    throw createError(500, 'Failed to upload files');
  }
}

export const uploadAvatar = async (
  buffer: Buffer,
  originalname: string,
  userId: string
): Promise<UploadResult> => {
  const filename = generateUniqueFilename(originalname, `avatar_${userId}`);
  
  return uploadSingleFile(buffer, originalname, 'image/jpeg', {
    folder: 'avatars',
    filename,
    metadata: { userId, type: 'avatar' },
  });
}

export const uploadProductImage = async (
  buffer: Buffer,
  originalname: string,
  productId: string,
  index: number
): Promise<UploadResult> => {
  const filename = generateUniqueFilename(originalname, `product_${productId}_${index}`);
  
  return uploadSingleFile(buffer, originalname, 'image/jpeg', {
    folder: 'products',
    filename,
    metadata: { productId, imageIndex: String(index) },
  });
}

export const uploadShopLogo = async (
  buffer: Buffer,
  originalname: string,
  shopId: string
): Promise<UploadResult> => {
  const filename = generateUniqueFilename(originalname, `logo_${shopId}`);
  
  return uploadSingleFile(buffer, originalname, 'image/jpeg', {
    folder: 'shop-logos',
    filename,
    metadata: { shopId, type: 'logo' },
  });
}

export const uploadShopBanner = async (
  buffer: Buffer,
  originalname: string,
  shopId: string
): Promise<UploadResult> => {
  const filename = generateUniqueFilename(originalname, `banner_${shopId}`);
  
  return uploadSingleFile(buffer, originalname, 'image/jpeg', {
    folder: 'shop-banners',
    filename,
    metadata: { shopId, type: 'banner' },
  });
}

export const deleteFile = async (key: string): Promise<void> => {
  try {
    await r2Service.deleteFile(key);
    logger.info(`File deleted successfully: ${key}`);
  } catch (error) {
    logger.error(`Failed to delete file: ${key}`, error);
    throw createError(500, 'Failed to delete file');
  }
}

export const deleteFiles = async (keys: string[]): Promise<void> => {
  try {
    await r2Service.deleteFiles(keys);
    logger.info(`${keys.length} files deleted successfully`);
  } catch (error) {
    logger.error('Failed to delete files', error);
    throw createError(500, 'Failed to delete files');
  }
}

export const getSignedDownloadUrl = async (
  key: string,
  expiresIn: number = 3600
): Promise<string> => {
  try {
    return await r2Service.getSignedUrl(key, expiresIn);
  } catch (error) {
    logger.error(`Failed to generate signed URL for: ${key}`, error);
    throw createError(500, 'Failed to generate download URL');
  }
}

export const getSignedUploadUrl = async (
  key: string,
  contentType: string,
  expiresIn: number = 3600
): Promise<string> => {
  try {
    return await r2Service.getUploadSignedUrl(key, contentType, expiresIn);
  } catch (error) {
    logger.error(`Failed to generate upload signed URL for: ${key}`, error);
    throw createError(500, 'Failed to generate upload URL');
  }
}

export const extractKeyFromUrl = (url: string): string => {
  try {
    const urlObj = new URL(url);
    return urlObj.pathname.substring(1);
  } catch (error) {
    logger.error('Invalid R2 URL', error);
    throw createError(400, 'Invalid R2 URL');
  }
}

export const fileExists = async (key: string): Promise<boolean> => {
  return r2Service.fileExists(key);
}
