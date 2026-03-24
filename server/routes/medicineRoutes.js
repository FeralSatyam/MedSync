import express from 'express';
import { body } from 'express-validator';
import {
  getMedicinesByPatient,
  createMedicine,
  updateMedicine,
  restockMedicine,
  deleteMedicine,
} from '../controllers/medicineController.js';
import { protect } from '../middleware/authMiddleware.js';
import { uploadPrescription } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.use(protect);

const medicineFields = [
  body('patientId').notEmpty().withMessage('patientId required'),
  body('name').trim().notEmpty(),
  body('strength').trim().notEmpty(),
  body('unit').optional().isIn(['mg', 'ml', 'IU', 'mcg']),
  body('frequencyPerDay').isFloat({ min: 1, max: 24 }),
  body('dosePerIntake').isFloat({ min: 0.5 }),
  body('currentStock').isFloat({ min: 0 }),
  body('refillThreshold').optional().isFloat({ min: 1 }),
  body('doctorName').optional().isString(),
  body('hospitalName').optional().isString(),
  body('instructions').optional().isString(),
  body('prescriptionDate').optional().isISO8601(),
  body('prescriptionValid').optional().isISO8601(),
];

router.get('/patient/:patientId', getMedicinesByPatient);
function uploadPrescriptionSafe(req, res, next) {
  uploadPrescription.single('prescriptionImage')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message || 'Prescription upload failed' });
    }
    next();
  });
}
router.post('/', uploadPrescriptionSafe, medicineFields, createMedicine);

function multipartOrJson(req, res, next) {
  const ct = req.headers['content-type'] || '';
  if (ct.includes('multipart/form-data')) {
    return uploadPrescriptionSafe(req, res, next);
  }
  return next();
}

router.put('/:id', multipartOrJson, updateMedicine);
router.patch('/:id/restock', [body('quantity').isFloat({ min: 0 })], restockMedicine);
router.delete('/:id', deleteMedicine);

export default router;
