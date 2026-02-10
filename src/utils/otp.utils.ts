import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const otpConfig = {
  expiryMinutes: 2,
  length: 6,
};

export function generateOTP(): string {
  return crypto.randomInt(
    Math.pow(10, otpConfig.length - 1),
    Math.pow(10, otpConfig.length) - 1
  ).toString().padStart(otpConfig.length, '0');
}

export function getOTPExpiry(): Date {
  return new Date(Date.now() + otpConfig.expiryMinutes * 60 * 1000);
}

export async function createOrUpdateOTP(email: string): Promise<{ code: string; expiresAt: Date }> {
  const code = generateOTP();
  const expiresAt = getOTPExpiry();

  await prisma.emailVerification.deleteMany({
    where: { email },
  });

  await prisma.emailVerification.create({
    data: {
      email,
      code,
      expiresAt,
    },
  });

  return { code, expiresAt };
}

export async function verifyOTP(email: string, code: string): Promise<boolean> {
  const verification = await prisma.emailVerification.findFirst({
    where: {
      email,
      code,
    },
  });

  if (!verification) {
    return false;
  }

  if (new Date() > verification.expiresAt) {
    await prisma.emailVerification.delete({
      where: { id: verification.id },
    });
    return false;
  }

  await prisma.emailVerification.delete({
    where: { id: verification.id },
  });

  return true;
}

export async function deleteOTP(email: string): Promise<void> {
  await prisma.emailVerification.deleteMany({
    where: { email },
  });
}

export async function cleanupExpiredOTPs(): Promise<number> {
  const result = await prisma.emailVerification.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  });
  return result.count;
}
