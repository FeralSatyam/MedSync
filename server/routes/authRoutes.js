import express from 'express';
import { body } from 'express-validator';
import rateLimit from 'express-rate-limit';
import {
  register,
  login,
  logout,
  getMe,
  updateMe,
  deleteMe,
  requestPasswordOtp,
  resetPasswordWithOtp,
  sendVerifyOtp,
  verifyEmail,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { message: 'Too many requests from this IP, please try again later.' },
});

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // max 5 OTP requests per 15 min
  message: { message: 'Too many OTP requests. Please wait 15 minutes.' },
});

const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
];

router.post('/register', authLimiter, registerValidation, register);
router.post('/login', authLimiter, loginValidation, login);
router.post('/logout', logout);
router.post('/forgot-password/request-otp', authLimiter, [body('email').isEmail().normalizeEmail()], requestPasswordOtp);
router.post(
  '/forgot-password/reset',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('otp').isLength({ min: 6, max: 6 }),
    body('newPassword').isLength({ min: 6 }),
  ],
  resetPasswordWithOtp
);
router.get('/me', protect, getMe);
router.put('/me', protect, [body('name').optional().trim().notEmpty(), body('email').optional().isEmail().normalizeEmail()], updateMe);
router.delete('/me', protect, deleteMe);

// NEW
router.post('/send-verify-otp', otpLimiter, [body('email').isEmail().normalizeEmail()], sendVerifyOtp);
router.post('/verify-email', authLimiter, [body('email').isEmail().normalizeEmail(), body('otp').isLength({ min: 6, max: 6 })], verifyEmail);

export default router;