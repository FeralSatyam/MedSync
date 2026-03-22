import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';

const allowedMime = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
]);

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'medsync/prescriptions',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf'],
  },
});

function fileFilter(req, file, cb) {
  if (allowedMime.has(file.mimetype)) {
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
