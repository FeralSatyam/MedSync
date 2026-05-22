import express from 'express';
import { body } from 'express-validator';
import { getPublicByQr, dispense, verifyOtp } from '../controllers/pharmacistController.js';

const router = express.Router();

router.get('/:qrToken', getPublicByQr);
router.post('/:qrToken/verify-otp', verifyOtp);
router.post(
  '/:qrToken/dispense',
  [body('pin').matches(/^\d{4}$/).withMessage('PIN must be 4 digits')],
  dispense
);

export default router;
