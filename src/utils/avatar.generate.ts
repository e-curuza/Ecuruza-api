import sharp from 'sharp';
import { avatarConfig } from '../config/avatar.config.js';
import { uploadSingleFile, uploadAvatar } from './upload.file.js';
import crypto from 'crypto';
import { SUPPORTED_IMAGE_TYPES } from './upload.file.js';
import { logger } from './logger.js';

interface AvatarOptions {
  firstName: string;
  lastName: string;
  userId: string;
}

function getInitials(firstName: string, lastName: string): string {
  const first = firstName.charAt(0).toUpperCase();
  const last = lastName.charAt(0).toUpperCase();
  return `${first}${last}`;
}

function generateSVGAvatar(initials: string): string {
  const { width, height, fontSize, fontFamily, backgroundColor, fontColor } = avatarConfig;
  
  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${backgroundColor}"/>
      <text
        x="50%"
        y="50%"
        dy="0.35em"
        text-anchor="middle"
        fill="${fontColor}"
        font-family="${fontFamily}"
        font-size="${fontSize}"
        font-weight="bold"
      >${initials}</text>
    </svg>
  `;
}

function generateAvatarFilename(userId: string): string {
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(4).toString('hex');
  return `avatar_${userId}_${timestamp}_${randomString}.jpeg`;
}

export async function uploadAvatarToR2(
  buffer: Buffer,
  originalname: string,
  userId: string
): Promise<string> {
  try {
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(4).toString('hex');
    const extension = originalname.split('.').pop()?.toLowerCase() || 'jpg';
    const filename = `avatar_${userId}_${timestamp}_${randomString}.${extension}`;
    
    const result = await uploadSingleFile(buffer, originalname, 'image/jpeg', {
      folder: 'avatars',
      filename,
      metadata: { userId, type: 'avatar' },
    });
    
    logger.info(`Avatar uploaded successfully: ${result.key}`);
    return result.url;
  } catch (error) {
    logger.error('Failed to upload avatar to R2:', error);
    throw new Error('Failed to upload avatar');
  }
}

export async function generateAndUploadAvatar(
  firstName: string,
  lastName: string,
  userId: string
): Promise<string> {
  try {
    const initials = getInitials(firstName, lastName);
    const svg = generateSVGAvatar(initials);
    const filename = generateAvatarFilename(userId);
    
    const buffer = await sharp(Buffer.from(svg))
      .jpeg({ quality: avatarConfig.quality })
      .toBuffer();
    
    const result = await uploadAvatar(buffer, filename, userId);
    
    return result.url;
  } catch (error) {
    console.error('Failed to generate and upload avatar:', error);
    throw new Error('Failed to generate avatar');
  }
}

export async function generateAvatarDataURL(
  firstName: string,
  lastName: string
): Promise<string> {
  try {
    const initials = getInitials(firstName, lastName);
    const svg = generateSVGAvatar(initials);
    
    const buffer = await sharp(Buffer.from(svg))
      .jpeg({ quality: avatarConfig.quality })
      .toBuffer();
    
    const base64 = buffer.toString('base64');
    return `data:image/jpeg;base64,${base64}`;
  } catch (error) {
    console.error('Failed to generate avatar data URL:', error);
    throw new Error('Failed to generate avatar');
  }
}

export async function generateAvatarBuffer(
  firstName: string,
  lastName: string
): Promise<Buffer> {
  const initials = getInitials(firstName, lastName);
  const svg = generateSVGAvatar(initials);
  
  return sharp(Buffer.from(svg))
    .jpeg({ quality: avatarConfig.quality })
    .toBuffer();
}
