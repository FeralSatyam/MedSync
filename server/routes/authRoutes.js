import express from 'express';
import { body } from 'express-validator';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
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
import User from '../models/User.js';

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { message: 'Too many requests from this IP, please try again later.' },
});

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
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

// Public Routes
router.post('/register', authLimiter, registerValidation, register);
router.post('/login', authLimiter, loginValidation, login);
router.post('/logout', logout);

// Password Reset Routes
router.post(
  '/forgot-password/request-otp',
  authLimiter,
  [body('email').isEmail().normalizeEmail()],
  requestPasswordOtp
);
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

// Email Verification Routes
router.post(
  '/send-verify-otp',
  otpLimiter,
  [body('email').isEmail().normalizeEmail()],
  sendVerifyOtp
);
router.post(
  '/verify-email',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('otp').isLength({ min: 6, max: 6 }),
  ],
  verifyEmail
);

// Protected Routes (require authentication)
router.get('/me', protect, getMe);
router.put(
  '/me',
  protect,
  [
    body('name').optional().trim().notEmpty(),
    body('email').optional().isEmail().normalizeEmail(),
  ],
  updateMe
);
router.delete('/me', protect, deleteMe);

// Change Password Route (requires authentication)
router.put(
  '/change-password',
  protect,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  ],
  async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id;
      
      console.log('Change password request for user ID:', userId);
      
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Verify current password
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      console.log('Current password match:', isMatch);
      
      if (!isMatch) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }
      
      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      
      // Update password
      user.password = hashedPassword;
      await user.save();
      
      console.log('Password changed successfully for user:', user.email);
      
      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      console.error('Error changing password:', error);
      res.status(500).json({ message: 'Failed to change password', error: error.message });
    }
  }
);

// Debug endpoint (remove in production)
router.get('/debug/user/:email', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      isVerified: user.isVerified,
      passwordHash: user.password,
      passwordLength: user.password?.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;