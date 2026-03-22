import express from 'express';
import { body } from 'express-validator';
import rateLimit from 'express-rate-limit';
import { getPublicByQr, dispense } from '../controllers/pharmacistController.js';

const router = express.Router();

const dispenseLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { message: 'Too many dispense attempts. Try again later.' },
});

router.get('/:qrToken', getPublicByQr);
router.post(
  '/:qrToken/dispense',
  dispenseLimiter,
  [body('pin').matches(/^\d{4}$/).withMessage('PIN must be 4 digits')],
  dispense
);

export default router;
