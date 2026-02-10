import crypto from 'crypto';
import { passwordResetConfig } from '../config/auth.config';

export function generateResetToken(): string {
  return crypto.randomBytes(passwordResetConfig.tokenLength).toString('hex');
}

export function hashResetToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function isResetTokenExpired(expiresAt: Date | null): boolean {
  if (!expiresAt) return true;
  return new Date() > expiresAt;
}

export function getResetTokenExpiry(): Date {
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + passwordResetConfig.expiryMinutes);
  return expiry;
}

export function getGoogleAuthUrl(state: string): string {
  const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  
  googleAuthUrl.searchParams.set('client_id', process.env.GOOGLE_CLIENT_ID || '');
  googleAuthUrl.searchParams.set('redirect_uri', process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/api/auth/google/callback');
  googleAuthUrl.searchParams.set('response_type', 'code');
  googleAuthUrl.searchParams.set('scope', 'openid email profile');
  googleAuthUrl.searchParams.set('access_type', 'offline');
  googleAuthUrl.searchParams.set('prompt', 'consent');
  googleAuthUrl.searchParams.set('state', state);
  
  return googleAuthUrl.toString();
}

export async function exchangeCodeForTokens(code: string): Promise<{
  access_token: string;
  id_token: string;
  refresh_token?: string;
}> {
  const tokenUrl = 'https://oauth2.googleapis.com/token';
  
  const params = new URLSearchParams({
    code,
    client_id: process.env.GOOGLE_CLIENT_ID || '',
    client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
    redirect_uri: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/api/auth/google/callback',
    grant_type: 'authorization_code',
  });

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to exchange code for tokens: ${error}`);
  }

  return response.json();
}

export async function getGoogleUserInfo(accessToken: string): Promise<{
  id: string;
  email: string;
  name: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
}> {
  const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to get user info from Google');
  }

  return response.json();
}
