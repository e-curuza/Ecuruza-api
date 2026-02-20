import crypto from 'crypto';
import { prisma } from '../config/db.js';

export const otpConfig = {
  expiryMinutes: 10,
  length: 6,
};

export const generateOTP = (): string => {
  return crypto.randomInt(
    Math.pow(10, otpConfig.length - 1),
    Math.pow(10, otpConfig.length) - 1
  ).toString().padStart(otpConfig.length, '0');
}

export const getOTPExpiry = (): Date => {
  return new Date(Date.now() + otpConfig.expiryMinutes * 60 * 1000);
}

export const createOrUpdateOTP = async (email: string): Promise<{ code: string; expiresAt: Date }> => {
  const code = generateOTP();
  const expiresAt = getOTPExpiry();

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new Error('User not found');
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerificationCode: code,
      emailVerificationExpires: expiresAt,
    },
  });

  return { code, expiresAt };
}

export const verifyOTP = async (email: string, code: string): Promise<boolean> => {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return false;
  }

  if (!user.emailVerificationCode || !user.emailVerificationExpires) {
    return false;
  }

  // Normalize both codes to ensure consistent comparison
  const normalizedInputCode = code.trim();
  const storedCode = user.emailVerificationCode.trim();

  if (normalizedInputCode !== storedCode) {
    return false;
  }

  if (new Date() > user.emailVerificationExpires) {
    
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationCode: null,
        emailVerificationExpires: null,
      },
    });
    return false;
  }

  return true;
}

export const deleteOTP = async (email: string): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (user) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationCode: null,
        emailVerificationExpires: null,
      },
    });
  }
}

export const cleanupExpiredOTPs = async (): Promise<number> => {
  const result = await prisma.user.updateMany({
    where: {
      emailVerificationExpires: {
        lt: new Date(),
      },
      emailVerificationCode: {
        not: null,
      },
    },
    data: {
      emailVerificationCode: null,
      emailVerificationExpires: null,
    },
  });
  return result.count;
}
