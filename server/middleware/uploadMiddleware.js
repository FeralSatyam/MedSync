import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';

const allowedMime = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
  'image/avif',
  'image/bmp',
  'image/tiff',
  'image/jfif',
  'application/pdf',
]);

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'medsync/prescriptions',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'heic', 'heif', 'avif', 'bmp', 'tiff', 'jfif'],
  },
});

function fileFilter(req, file, cb) {
  if (allowedMime.has(file.mimetype) || file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Use JPG, PNG, or PDF.'), false);
  }
}

export const uploadPrescription = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
});

const profileStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'medsync/profiles',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'heif', 'avif'],
  },
});

export const uploadProfile = multer({
  storage: profileStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
});
