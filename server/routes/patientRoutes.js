import express from 'express';
import { body } from 'express-validator';
import {
  getPatients,
  createPatient,
  getPatient,
  updatePatient,
  deletePatient,
  getQrData,
  generateQrOtp,
} from '../controllers/patientController.js';
import { protect } from '../middleware/authMiddleware.js';
import { uploadProfile } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.use(protect);

const pinValidation = body('pharmacyPin')
  .matches(/^\d{4}$/)
  .withMessage('Pharmacy PIN must be exactly 4 digits');

router.get('/', getPatients);
router.post(
  '/',
  uploadProfile.single('profilePic'),
  [
    body('name').trim().notEmpty(),
    body('dateOfBirth').optional().isISO8601(),
    body('relation')
      .trim()
      .notEmpty()
      .isIn(['self', 'mother', 'father', 'grandmother', 'grandfather', 'spouse', 'other'])
      .withMessage('Relation is invalid'),
    body('allergies').optional().isString(),
    pinValidation,
  ],
  createPatient
);
router.get('/:id', getPatient);
router.put(
  '/:id',
  uploadProfile.single('profilePic'),
  [
    body('name').optional().trim().notEmpty(),
    body('dateOfBirth').optional().isISO8601(),
    body('relation')
      .optional()
      .trim()
      .isIn(['self', 'mother', 'father', 'grandmother', 'grandfather', 'spouse', 'other'])
      .withMessage('Relation is invalid'),
    body('allergies').optional().isString(),
  ],
  updatePatient
);
router.delete('/:id', deletePatient);
router.get('/:id/qr', getQrData);
router.post('/:id/generate-otp', generateQrOtp);

export default router;
