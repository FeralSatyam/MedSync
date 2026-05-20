import express from 'express';
import { body } from 'express-validator';
import {
  getPatients,
  createPatient,
  getPatient,
  updatePatient,
  deletePatient,
  getQrData,
} from '../controllers/patientController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// ==================== PUBLIC ROUTES (No authentication required) ====================
// Get patient by QR token - for pharmacist view (no login required)
router.get('/qr/:qrToken', async (req, res) => {
  try {
    // Import Patient model dynamically to avoid circular dependencies
    const Patient = await import('../models/Patient.js').then(m => m.default);
    const patient = await Patient.findOne({ qrToken: req.params.qrToken });
    
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    // Return only necessary fields for pharmacist view (exclude sensitive data)
    res.json({
      _id: patient._id,
      name: patient.name,
      relation: patient.relation,
      allergies: patient.allergies,
      dateOfBirth: patient.dateOfBirth,
      qrToken: patient.qrToken
    });
  } catch (error) {
    console.error('Error fetching patient by QR token:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==================== PROTECTED ROUTES (Authentication required) ====================
// All routes below this line require authentication
router.use(protect);

// Validation for pharmacy PIN
const pinValidation = body('pharmacyPin')
  .matches(/^\d{4}$/)
  .withMessage('Pharmacy PIN must be exactly 4 digits');

// Get all patients for the authenticated user
router.get('/', getPatients);

// Create a new patient
router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('dateOfBirth').optional().isISO8601().withMessage('Invalid date format'),
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

// Get a single patient by ID
router.get('/:id', getPatient);

// Update a patient
router.put(
  '/:id',
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

// Delete a patient
router.delete('/:id', deletePatient);

// Get QR data for a patient (requires authentication)
router.get('/:id/qr', getQrData);

export default router;