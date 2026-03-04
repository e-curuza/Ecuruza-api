import nodemailer from 'nodemailer';
import { emailConfig } from '../config/email.config.js';
import { logger } from '../utils/logger.js';
import { AppError, ErrorCode } from '../utils/AppError.js';
import dns from 'node:dns';
import { promisify } from 'node:util';

// Force IPv4 resolution to avoid IPv6 connectivity issues
dns.setDefaultResultOrder('ipv4first');

const dnsLookupAsync = promisify(dns.lookup);

// Custom DNS lookup function that forces IPv4 with fallback
const dnsLookup = async (hostname: string, options: any, callback: any) => {
  try {
    // First try: Force IPv4 lookup
    const result = await dnsLookupAsync(hostname, { family: 4, all: false });
    logger.debug(`DNS resolved ${hostname} to ${result.address} (IPv4)`);
    callback(null, result.address, 4);
  } catch (err: any) {
    logger.error(`DNS lookup failed for ${hostname}:`, err);
    
    // Fallback: Try resolving with default settings
    try {
      const fallbackResult = await dnsLookupAsync(hostname, { all: false });
      logger.warn(`DNS fallback resolved ${hostname} to ${fallbackResult.address}`);
      callback(null, fallbackResult.address, fallbackResult.family);
    } catch (fallbackErr) {
      logger.error(`DNS fallback also failed for ${hostname}:`, fallbackErr);
      callback(fallbackErr);
    }
  }
};

const transporter = nodemailer.createTransport({
  host: emailConfig.host,
  port: emailConfig.port,
  secure: emailConfig.secure,
  auth: {
    user: emailConfig.user,
    pass: emailConfig.password,
  },
  dnsTimeout: 30000,
  connectionTimeout: 30000,
  greetingTimeout: 30000,
  socketTimeout: 30000,
  // Force IPv4 by using custom DNS lookup
  dnsLookup,
  tls: {
    rejectUnauthorized: true,
    minVersion: 'TLSv1.2',
  },
  // Additional options to help with connectivity
  pool: true,
  maxConnections: 5,
  maxMessages: 100,
  rateDelta: 1000,
  rateLimit: 5,
  // Disable IPv6
  family: 4,
} as nodemailer.TransportOptions);

// Retry helper function for transient network errors
const retryOperation = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> => {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      // Check if error is retryable (network errors, timeouts, etc.)
      const isRetryable = 
        error.code === 'ENETUNREACH' ||
        error.code === 'ETIMEDOUT' ||
        error.code === 'ECONNREFUSED' ||
        error.code === 'ENOTFOUND' ||
        error.message?.includes('timeout') ||
        error.message?.includes('Connection timeout');
      
      if (!isRetryable || attempt === maxRetries) {
        throw error;
      }
      
      logger.warn(`Attempt ${attempt}/${maxRetries} failed, retrying in ${delayMs}ms...`, {
        error: error.message,
        code: error.code
      });
      
      // Wait before retrying with exponential backoff
      await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
    }
  }
  
  throw lastError;
};

export const sendVerificationEmail = async (
  email: string,
  code: string,
  expiresIn: number = 2
): Promise<boolean> => {
  try {
    const mailOptions = {
      from: `"${emailConfig.fromName}" <${emailConfig.from}>`,
      to: email,
      subject: 'Verify your email - e-Curuza',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">e-Curuza</h1>
            <p style="color: white; margin: 10px 0 0;">Verify Your Email</p>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px;">Hi there,</p>
            <p style="font-size: 16px;">Thank you for registering with e-Curuza. Please use the verification code below to verify your email address:</p>
            
            <div style="background: white; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0; border: 2px solid #667eea;">
              <p style="font-size: 14px; color: #666; margin: 0 0 10px;">Your verification code is:</p>
              <p style="font-size: 32px; font-weight: bold; color: #667eea; margin: 0; letter-spacing: 8px;">${code}</p>
            </div>
            
            <p style="font-size: 14px; color: #666;">This code will expire in <strong>${expiresIn} minutes</strong>.</p>
            
            <p style="font-size: 14px; color: #666; margin-top: 20px;">If you didn't create an account with e-Curuza, please ignore this email.</p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            
            <p style="font-size: 12px; color: #999; text-align: center;">
              © ${new Date().getFullYear()} e-Curuza. All rights reserved.
            </p>
          </div>
        </body>
        </html>
      `,
    };

    await retryOperation(async () => {
      await transporter.sendMail(mailOptions);
    });
    
    logger.info(`Verification email sent to ${email}`);
    return true;
  } catch (error) {
    logger.error(`Failed to send verification email to ${email}:`, error);
    throw new AppError({
      code: ErrorCode.EXTERNAL_SERVICE_ERROR,
      message: 'Failed to send verification email',
      statusCode: 500,
      action: 'Please try again later or contact support',
      meta: { email, operation: 'sendVerificationEmail' },
    });
  }
}

export const sendPasswordResetEmail = async (
  email: string,
  resetUrl: string,
  expiresInHours: number = 1
): Promise<boolean> => {
  try {
    const mailOptions = {
      from: `"${emailConfig.fromName}" <${emailConfig.from}>`,
      to: email,
      subject: 'Reset your password - e-Curuza',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">e-Curuza</h1>
            <p style="color: white; margin: 10px 0 0;">Reset Your Password</p>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px;">Hi there,</p>
            <p style="font-size: 16px;">You requested to reset your password for your e-Curuza account. Click the button below to reset your password:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Reset Password</a>
            </div>
            
            <p style="font-size: 14px; color: #666;">This link will expire in <strong>${expiresInHours} hour(s)</strong>.</p>
            
            <p style="font-size: 14px; color: #666; margin-top: 20px;">If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            
            <p style="font-size: 12px; color: #999; text-align: center;">
              © ${new Date().getFullYear()} e-Curuza. All rights reserved.
            </p>
          </div>
        </body>
        </html>
      `,
    };

    await retryOperation(async () => {
      await transporter.sendMail(mailOptions);
    });
    
    logger.info(`Password reset email sent to ${email}`);
    return true;
  } catch (error) {
    logger.error(`Failed to send password reset email to ${email}:`, error);
    throw new AppError({
      code: ErrorCode.EXTERNAL_SERVICE_ERROR,
      message: 'Failed to send password reset email',
      statusCode: 500,
      action: 'Please try again later or contact support',
      meta: { email, operation: 'sendPasswordResetEmail' },
    });
  }
}

export const sendPasswordChangeConfirmationEmail = async (
  email: string,
  firstName: string
): Promise<boolean> => {
  try {
    const mailOptions = {
      from: `"${emailConfig.fromName}" <${emailConfig.from}>`,
      to: email,
      subject: 'Password changed successfully - e-Curuza',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">e-Curuza</h1>
            <p style="color: white; margin: 10px 0 0;">Password Changed</p>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px;">Hi ${firstName},</p>
            <p style="font-size: 16px;">Your password has been changed successfully.</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
              <p style="font-size: 14px; color: #28a745; margin: 0;">✓ Password updated successfully</p>
            </div>
            
            <p style="font-size: 14px; color: #666; margin-top: 20px;">If you didn't make this change, please contact our support team immediately.</p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            
            <p style="font-size: 12px; color: #999; text-align: center;">
              © ${new Date().getFullYear()} e-Curuza. All rights reserved.
            </p>
          </div>
        </body>
        </html>
      `,
    };

    await retryOperation(async () => {
      await transporter.sendMail(mailOptions);
    });
    
    logger.info(`Password change confirmation email sent to ${email}`);
    return true;
  } catch (error) {
    logger.error(`Failed to send password change confirmation email to ${email}:`, error);
    throw new AppError({
      code: ErrorCode.EXTERNAL_SERVICE_ERROR,
      message: 'Failed to send password change confirmation email',
      statusCode: 500,
      action: 'Please try again later or contact support',
      meta: { email, operation: 'sendPasswordChangeConfirmationEmail' },
    });
  }
}

export const sendEmail = async (
  to: string,
  subject: string,
  html: string
): Promise<boolean> => {
  try {
    const mailOptions = {
      from: `"${emailConfig.fromName}" <${emailConfig.from}>`,
      to,
      subject,
      html,
    };

    await retryOperation(async () => {
      await transporter.sendMail(mailOptions);
    });
    
    logger.info(`Email sent to ${to}: ${subject}`);
    return true;
  } catch (error) {
    logger.error(`Failed to send email to ${to}:`, error);
    throw new AppError({
      code: ErrorCode.EXTERNAL_SERVICE_ERROR,
      message: 'Failed to send email',
      statusCode: 500,
      action: 'Please try again later or contact support',
      meta: { to, subject, operation: 'sendEmail' },
    });
  }
}

export const verifyEmailConfig = async (): Promise<boolean> => {
  try {
    await transporter.verify();
    logger.info('Email server is ready');
    return true;
  } catch (error) {
    logger.error('Email server verification failed:', error);
    throw new AppError({
      code: ErrorCode.EXTERNAL_SERVICE_ERROR,
      message: 'Email server verification failed',
      statusCode: 500,
      action: 'Check email configuration and try again',
      meta: { operation: 'verifyEmailConfig' },
    });
  }
}
