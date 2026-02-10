import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { logger } from './logger';
import type { AuthPayload, TokenPayload } from './type';
import createError from 'http-errors';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-change-in-production';

const ACCESS_TOKEN_EXPIRY = 24 * 60 * 60;
const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60;

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateAccessToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });
}

export function generateRefreshToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  });
}

export function verifyAccessToken(token: string): TokenPayload {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    logger.error('Failed to verify access token', error);
    throw createError(401, 'Invalid or expired access token');
  }
}

export function verifyRefreshToken(token: string): TokenPayload {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as TokenPayload;
  } catch (error) {
    logger.error('Failed to verify refresh token', error);
    throw createError(401, 'Invalid or expired refresh token');
  }
}

export function generateTokenPair(payload: AuthPayload): {
  accessToken: string;
  refreshToken: string;
} {
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);
  return { accessToken, refreshToken };
}

export function extractTokenFromHeader(
  authHeader: string | undefined
): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

export function decodeToken(token: string): TokenPayload | null {
  try {
    return jwt.decode(token) as TokenPayload;
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) {
    return true;
  }
  return Date.now() >= decoded.exp * 1000;
}

export function getTokenExpirationTime(token: string): number | null {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) {
    return null;
  }
  return decoded.exp - Math.floor(Date.now() / 1000);
}
