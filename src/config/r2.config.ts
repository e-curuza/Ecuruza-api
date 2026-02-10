import { S3Client } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';

dotenv.config();

export const r2Config = {
  accountId: process.env.CF_ACCOUNT_ID || '',
  accessKeyId: process.env.CF_ACCESS_KEY || '',
  secretAccessKey: process.env.CF_SECRET_KEY || '',
  bucketName: process.env.CF_R2_BUCKET || 'e-curuza',
  publicUrl: process.env.CF_R2_PUBLIC_URL || '',
};

export const s3Client = new S3Client({
  region: 'auto', 
  endpoint: `https://${r2Config.accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: r2Config.accessKeyId,
    secretAccessKey: r2Config.secretAccessKey,
  },
});

export const R2_BUCKET_URL = r2Config.publicUrl || `https://${r2Config.bucketName}.${r2Config.accountId}.r2.cloudflarestorage.com`;
