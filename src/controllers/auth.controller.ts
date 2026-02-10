import type { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import createError from 'http-errors';
import crypto from 'crypto';
import { logger } from '../utils/logger.js';
import { ApiResponseBuilder, type ApiResponse } from '../utils/ApiResponse.js';
import { hashPassword, comparePassword, generateTokenPair, verifyRefreshToken } from '../utils/auth.utils.js';
import { generateAndUploadAvatar } from '../utils/avatar.generate.js';
import {
  generateResetToken,
  hashResetToken,
  getResetTokenExpiry,
  getGoogleAuthUrl,
  exchangeCodeForTokens,
  getGoogleUserInfo,
} from '../utils/password.reset.js';
import { createOrUpdateOTP, verifyOTP, deleteOTP } from '../utils/otp.utils.js';
import { sendVerificationEmail, sendPasswordResetEmail, sendPasswordChangeConfirmationEmail } from '../services/email.service.js';
import type { AuthResponse, UserResponse, RegisterRequest, LoginRequest, AuthPayload } from '../utils/type.js';

const prisma = new PrismaClient();

export async function register(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { firstName, lastName, email, phone, password, role } = req.body as RegisterRequest;

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { phone }],
      },
    });

    if (existingUser) {
      throw createError(409, 'User with this email or phone already exists');
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        passwordHash,
        role: role || 'CUSTOMER',
      } as any,
    });

    let avatarUrl: string | undefined;
    try {
      avatarUrl = await generateAndUploadAvatar(firstName, lastName, user.id);
      await prisma.user.update({
        where: { id: user.id },
        data: { avatarUrl },
      });
    } catch (avatarError) {
      logger.warn('Failed to generate avatar:', avatarError);
    }

    const authPayload: AuthPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const { accessToken, refreshToken } = generateTokenPair(authPayload);

    const userResponse: UserResponse = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      ...(avatarUrl && { avatarUrl }),
      role: user.role,
      status: user.status,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      createdAt: user.createdAt,
    };

    const authResponse: AuthResponse = {
      user: userResponse,
      accessToken,
      refreshToken,
    };

    logger.info(`User registered: ${user.email}`);
    res.status(201).json(ApiResponseBuilder.created('User registered successfully', authResponse));
  } catch (error) {
    next(error);
  }
}

export async function login(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email, password } = req.body as LoginRequest;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw createError(401, 'Invalid email or password');
    }

    if (!user.passwordHash) {
      throw createError(401, 'Please login with Google instead');
    }

    const isPasswordValid = await comparePassword(password, user.passwordHash);

    if (!isPasswordValid) {
      throw createError(401, 'Invalid email or password');
    }

    if (user.status !== 'ACTIVE') {
      throw createError(403, 'Account is not active');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const authPayload: AuthPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const { accessToken, refreshToken } = generateTokenPair(authPayload);

    const userResponse: UserResponse = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      ...(user.avatarUrl && { avatarUrl: user.avatarUrl }),
      role: user.role,
      status: user.status,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      createdAt: user.createdAt,
    };

    const authResponse: AuthResponse = {
      user: userResponse,
      accessToken,
      refreshToken,
    };

    logger.info(`User logged in: ${user.email}`);
    res.json(ApiResponseBuilder.success('Login successful', authResponse));
  } catch (error) {
    next(error);
  }
}

export async function refreshToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw createError(400, 'Refresh token is required');
    }

    const decoded = verifyRefreshToken(refreshToken);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw createError(401, 'Invalid refresh token');
    }

    const authPayload: AuthPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const tokens = generateTokenPair(authPayload);

    res.json(ApiResponseBuilder.success('Token refreshed', tokens));
  } catch (error) {
    next(error);
  }
}

export async function getProfile(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = (req as any).user;

    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
    });

    if (!dbUser) {
      throw createError(404, 'User not found');
    }

    const userResponse: UserResponse = {
      id: dbUser.id,
      firstName: dbUser.firstName,
      lastName: dbUser.lastName,
      email: dbUser.email,
      phone: dbUser.phone,
      ...((dbUser as any).avatarUrl && { avatarUrl: (dbUser as any).avatarUrl }),
      role: dbUser.role,
      status: dbUser.status,
      emailVerified: dbUser.emailVerified,
      phoneVerified: dbUser.phoneVerified,
      createdAt: dbUser.createdAt,
    };

    res.json(ApiResponseBuilder.success('Profile retrieved', userResponse));
  } catch (error) {
    next(error);
  }
}

export async function updateProfile(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = (req as any).user;
    const { firstName, lastName, phone } = req.body;

    const updateData: any = {};

    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (phone) updateData.phone = phone;

    if (firstName || lastName) {
      const currentUser = await prisma.user.findUnique({
        where: { id: user.userId },
      });

      if (currentUser) {
        try {
          const newAvatarUrl = await generateAndUploadAvatar(
            firstName || currentUser.firstName,
            lastName || currentUser.lastName,
            user.userId
          );
          updateData.avatarUrl = newAvatarUrl;
        } catch (avatarError) {
          logger.warn('Failed to regenerate avatar:', avatarError);
        }
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.userId },
      data: updateData,
    });

    const userResponse: UserResponse = {
      id: updatedUser.id,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      email: updatedUser.email,
      phone: updatedUser.phone,
      ...((updatedUser as any).avatarUrl && { avatarUrl: (updatedUser as any).avatarUrl }),
      role: updatedUser.role,
      status: updatedUser.status,
      emailVerified: updatedUser.emailVerified,
      phoneVerified: updatedUser.phoneVerified,
      createdAt: updatedUser.createdAt,
    };

    res.json(ApiResponseBuilder.success('Profile updated', userResponse));
  } catch (error) {
    next(error);
  }
}

export async function changePassword(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = (req as any).user;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw createError(400, 'Current and new password required');
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
    });

    if (!dbUser) {
      throw createError(404, 'User not found');
    }

    if (!dbUser.passwordHash) {
      throw createError(400, 'Please login with Google to set a password');
    }

    const isPasswordValid = await comparePassword(currentPassword, dbUser.passwordHash);

    if (!isPasswordValid) {
      throw createError(401, 'Current password is incorrect');
    }

    const newPasswordHash = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.userId },
      data: { passwordHash: newPasswordHash } as any,
    });

    await sendPasswordChangeConfirmationEmail(dbUser.email, dbUser.firstName);

    logger.info(`Password changed for: ${dbUser.email}`);
    res.json(ApiResponseBuilder.success('Password changed successfully'));
  } catch (error) {
    next(error);
  }
}

export async function forgotPassword(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email } = req.body;

    if (!email) {
      throw createError(400, 'Email is required');
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      logger.info(`Password reset requested for non-existent email: ${email}`);
      res.json(ApiResponseBuilder.success('If an account exists, a reset link will be sent'));
      return;
    }

    const resetToken = generateResetToken();
    const hashedToken = hashResetToken(resetToken);
    const expiresAt = getResetTokenExpiry();

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: expiresAt,
      } as any,
    });

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    await sendPasswordResetEmail(email, resetUrl, 1);

    logger.info(`Password reset email sent to: ${email}`);
    res.json(ApiResponseBuilder.success('If an account exists, a reset link will be sent'));
  } catch (error) {
    next(error);
  }
}

export async function resetPassword(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      throw createError(400, 'Token and new password are required');
    }

    const hashedToken = hashResetToken(token);

    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: {
          gt: new Date(),
        },
      } as any,
    });

    if (!user) {
      throw createError(400, 'Invalid or expired reset token');
    }

    const passwordHash = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      } as any,
    });

    await sendPasswordChangeConfirmationEmail(user.email, user.firstName);

    logger.info(`Password reset for user: ${user.email}`);
    res.json(ApiResponseBuilder.success('Password has been reset successfully'));
  } catch (error) {
    next(error);
  }
}

export function getGoogleAuthUrlController(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const state = crypto.randomBytes(16).toString('hex');
    const authUrl = getGoogleAuthUrl(state);
    
    res.cookie('google_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 10 * 60 * 1000,
    });

    res.json(ApiResponseBuilder.success('Google auth URL', { authUrl }));
  } catch (error) {
    next(error);
  }
}

export async function googleCallback(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { code, state } = req.query;

    if (!code || !state) {
      throw createError(400, 'Authorization code and state are required');
    }

    const storedState = req.cookies?.google_oauth_state;
    if (state !== storedState) {
      throw createError(400, 'Invalid state parameter');
    }

    const tokens = await exchangeCodeForTokens(code as string);
    const googleUser = await getGoogleUserInfo(tokens.access_token);

    let user = await prisma.user.findUnique({
      where: { email: googleUser.email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          firstName: googleUser.given_name || 'User',
          lastName: googleUser.family_name || '',
          email: googleUser.email,
          phone: '',
          passwordHash: null,
          avatarUrl: googleUser.picture,
          role: 'CUSTOMER',
          status: 'ACTIVE',
          emailVerified: true,
        } as any,
      });
    } else {
      if (user.status !== 'ACTIVE') {
        throw createError(403, 'Account is not active');
      }
    }

    const authPayload: AuthPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const { accessToken, refreshToken } = generateTokenPair(authPayload);

    const userResponse: UserResponse = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      ...(user.avatarUrl && { avatarUrl: user.avatarUrl }),
      role: user.role,
      status: user.status,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      createdAt: user.createdAt,
    };

    const authResponse: AuthResponse = {
      user: userResponse,
      accessToken,
      refreshToken,
    };

    res.clearCookie('google_oauth_state');

    logger.info(`Google login successful for: ${user.email}`);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/callback?token=${accessToken}&refreshToken=${refreshToken}`);
  } catch (error) {
    next(error);
  }
}

export async function verifyEmail(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email, code } = req.body as { email: string; code: string };

    if (!email || !code) {
      throw createError(400, 'Email and verification code are required');
    }

    const isValid = await verifyOTP(email, code);

    if (!isValid) {
      throw createError(400, 'Invalid or expired verification code');
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw createError(404, 'User not found');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true },
    });

    await deleteOTP(email);

    logger.info(`Email verified for: ${email}`);
    res.json(ApiResponseBuilder.success('Email verified successfully'));
  } catch (error) {
    next(error);
  }
}

export async function resendVerificationCode(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email } = req.body;

    if (!email) {
      throw createError(400, 'Email is required');
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.json(ApiResponseBuilder.success('If an account exists, a verification code will be sent'));
      return;
    }

    if (user.emailVerified) {
      res.json(ApiResponseBuilder.success('Email is already verified'));
      return;
    }

    const otp = await createOrUpdateOTP(email);

    await sendVerificationEmail(email, otp.code);

    logger.info(`Verification code resent to: ${email}`);
    res.json(ApiResponseBuilder.success('Verification code sent successfully'));
  } catch (error) {
    next(error);
  }
}

export async function logout(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = (req as any).user;

    logger.info(`User logged out: ${user.email}`);
    res.json(ApiResponseBuilder.success('Logged out successfully'));
  } catch (error) {
    next(error);
  }
}
