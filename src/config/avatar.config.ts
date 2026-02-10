import dotenv from 'dotenv';

dotenv.config();

export const avatarConfig = {
  width: 200,
  height: 200,
  backgroundColor: '#6366f1',
  fontColor: '#ffffff',
  fontSize: 80,
  fontFamily: 'Arial, sans-serif',
  quality: 90,
  format: 'jpeg' as const,
};
