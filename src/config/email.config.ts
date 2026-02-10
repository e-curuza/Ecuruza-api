import dotenv from 'dotenv';
dotenv.config();

export const emailConfig = {
  host: process.env.SMTP_HOST || 'smtp.example.com',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: process.env.SMTP_SECURE === 'true',
  user: process.env.SMTP_USER || '',
  password: process.env.SMTP_PASSWORD || '',
  from: process.env.SMTP_FROM || 'noreply@example.com',
  fromName: process.env.SMTP_FROM_NAME || 'e-Curuza',
};
