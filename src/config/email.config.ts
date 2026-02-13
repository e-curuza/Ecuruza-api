import dotenv from 'dotenv';
dotenv.config();

export const emailConfig = {
  host: process.env.EMAIL_HOST || process.env.SMTP_HOST || 'smtp.example.com',
  port: parseInt(process.env.EMAIL_PORT || process.env.SMTP_PORT || '587', 10),
  secure: process.env.EMAIL_SECURE === 'true' || process.env.SMTP_SECURE === 'true',
  user: process.env.EMAIL_USER || process.env.SMTP_USER || '',
  password: process.env.EMAIL_PASSWORD || process.env.SMTP_PASSWORD || '',
  from: process.env.EMAIL_FROM || process.env.SMTP_FROM || 'noreply@example.com',
  fromName: process.env.EMAIL_FROM_NAME || process.env.SMTP_FROM_NAME || 'e-Curuza',
};
