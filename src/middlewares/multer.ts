import multer from 'multer';
import { r2Service } from '../services/r2.service.js';
import { r2Config } from '../config/r2.config.js';
import type { Request } from 'express';
import createError from 'http-errors';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'application/pdf',
  'video/mp4',
  'video/webm',
  'audio/mpeg',
  'audio/wav',
];

const FILE_SIZE_LIMITS = {
  image: 5 * 1024 * 1024,
  video: 50 * 1024 * 1024,
  audio: 10 * 1024 * 1024,
  document: 10 * 1024 * 1024,
  default: 5 * 1024 * 1024,
};

export interface UploadOptions {
  folder?: string;
  maxSize?: number;
  allowedMimeTypes?: string[];
  fieldName?: string;
  maxFields?: number;
}

export interface MulterFile extends Express.Multer.File {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  key?: string;
  url?: string;
}

function getSizeLimit(mimeType: string): number {
  if (mimeType.startsWith('image/')) {
    return FILE_SIZE_LIMITS.image;
  } else if (mimeType.startsWith('video/')) {
    return FILE_SIZE_LIMITS.video;
  } else if (mimeType.startsWith('audio/')) {
    return FILE_SIZE_LIMITS.audio;
  } else if (mimeType === 'application/pdf') {
    return FILE_SIZE_LIMITS.document;
  }
  return FILE_SIZE_LIMITS.default;
}

function getFileCategory(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'images';
  if (mimeType.startsWith('video/')) return 'videos';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType === 'application/pdf') return 'documents';
  return 'files';
}

const localStorage = multer.memoryStorage();

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  callback: multer.FileFilterCallback
) => {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    callback(
      createError(400, `File type ${file.mimetype} is not allowed. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`)
    );
    return;
  }
  callback(null, true);
};

export function createMulterUpload(options: UploadOptions = {}) {
  const {
    folder = 'uploads',
    maxSize = FILE_SIZE_LIMITS.default,
    allowedMimeTypes = ALLOWED_MIME_TYPES,
    fieldName = 'file',
    maxFields = 10,
  } = options;

  const storage = multer.memoryStorage();

  return multer({
    storage,
    fileFilter: (
      req: Request,
      file: Express.Multer.File,
      callback: multer.FileFilterCallback
    ) => {
      if (!allowedMimeTypes.includes(file.mimetype)) {
        callback(
          createError(400, `File type ${file.mimetype} is not allowed`)
        );
        return;
      }
      callback(null, true);
    },
    limits: {
      fileSize: maxSize,
      files: maxFields,
    },
  });
}

export const uploadSingle = createMulterUpload();
export const uploadMultiple = createMulterUpload({ maxFields: 10 });
export const uploadImage = createMulterUpload({
  folder: 'images',
  maxSize: FILE_SIZE_LIMITS.image,
  allowedMimeTypes: ALLOWED_MIME_TYPES.filter((type) => type.startsWith('image/')),
});
export const uploadVideo = createMulterUpload({
  folder: 'videos',
  maxSize: FILE_SIZE_LIMITS.video,
  allowedMimeTypes: ALLOWED_MIME_TYPES.filter((type) => type.startsWith('video/')),
});
export const uploadDocument = createMulterUpload({
  folder: 'documents',
  maxSize: FILE_SIZE_LIMITS.document,
  allowedMimeTypes: ['application/pdf'],
});

export async function uploadToR2(
  req: Request,
  fieldName: string = 'file'
): Promise<void> {
  const file = req.file as Express.Multer.File | undefined;

  if (!file) {
    return;
  }

  const category = getFileCategory(file.mimetype);
  const folder = r2Config.bucketName + '/' + category;

  const result = await r2Service.uploadFile(file.buffer as Buffer, {
    folder,
    filename: file.originalname,
    contentType: file.mimetype,
  });

  (file as any).key = result.key;
  (file as any).url = result.url;
}

export async function uploadMultipleToR2(
  req: Request,
  fieldName: string = 'files'
): Promise<void> {
  const files = req.files as Express.Multer.File[] | undefined;

  if (!files || !Array.isArray(files)) {
    return;
  }

  await Promise.all(
    files.map(async (file) => {
      const category = getFileCategory(file.mimetype);
      const folder = r2Config.bucketName + '/' + category;

      const result = await r2Service.uploadFile(file.buffer as Buffer, {
        folder,
        filename: file.originalname,
        contentType: file.mimetype,
      });

      (file as any).key = result.key;
      (file as any).url = result.url;
    })
  );
}

export function createUploadMiddleware(options: UploadOptions = {}) {
  const {
    folder = 'uploads',
    maxSize = FILE_SIZE_LIMITS.default,
    allowedMimeTypes = ALLOWED_MIME_TYPES,
    fieldName = 'file',
    maxFields = 10,
  } = options;

  const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (
      req: Request,
      file: Express.Multer.File,
      callback: multer.FileFilterCallback
    ) => {
      if (!allowedMimeTypes.includes(file.mimetype)) {
        callback(
          createError(400, `File type ${file.mimetype} is not allowed`)
        );
        return;
      }
      callback(null, true);
    },
    limits: {
      fileSize: maxSize,
      files: maxFields,
    },
  });

  return {
    single: (field: string) => upload.single(field),
    array: (field: string, maxCount: number) => upload.array(field, maxCount),
    fields: (fields: { name: string; maxCount: number }[]) =>
      upload.fields(fields),
  };
}

export const uploadAvatar = createMulterUpload({
  folder: 'avatars',
  maxSize: 2 * 1024 * 1024,
  allowedMimeTypes: ALLOWED_MIME_TYPES.filter((type) =>
    type.startsWith('image/')
  ),
});

export const uploadProductImages = createMulterUpload({
  folder: 'products',
  maxSize: FILE_SIZE_LIMITS.image,
  allowedMimeTypes: ALLOWED_MIME_TYPES.filter((type) =>
    type.startsWith('image/')
  ),
  maxFields: 10,
});

export const uploadBanner = createMulterUpload({
  folder: 'banners',
  maxSize: 10 * 1024 * 1024,
  allowedMimeTypes: ALLOWED_MIME_TYPES.filter((type) =>
    type.startsWith('image/')
  ),
});
