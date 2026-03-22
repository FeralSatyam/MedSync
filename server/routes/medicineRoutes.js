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
  body('frequencyPerDay').isFloat({ min: 0 }),
  body('dosePerIntake').isFloat({ min: 0 }),
  body('currentStock').isFloat({ min: 0 }),
  body('refillThreshold').optional().isFloat({ min: 1 }),
  body('doctorName').optional().isString(),
  body('hospitalName').optional().isString(),
  body('prescriptionIssuedDate').optional().isISO8601(),
  body('prescriptionValidUntil').optional().isISO8601(),
];

router.get('/patient/:patientId', getMedicinesByPatient);
router.post('/', uploadPrescription.single('prescription'), medicineFields, createMedicine);

function multipartOrJson(req, res, next) {
  const ct = req.headers['content-type'] || '';
  if (ct.includes('multipart/form-data')) {
    return uploadPrescription.single('prescription')(req, res, next);
  }
  return next();
}

router.put('/:id', multipartOrJson, updateMedicine);
router.put('/:id/restock', [body('quantityAdded').isFloat({ min: 0 })], restockMedicine);
router.delete('/:id', deleteMedicine);

export default router;
