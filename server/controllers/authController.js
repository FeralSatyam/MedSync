import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import User from '../models/User.js';
import { isMailerConfigured, sendOtpEmail } from '../utils/mailer.js';

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }
    const { name, email, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'Email already registered' });
    }
    // User model pre-save hook hashes `password`.
    const user = await User.create({ name, email, password });
    const token = signToken(user._id);
    res.cookie('token', token, cookieOptions);
    res.status(201).json({
      user: { id: user._id, name: user.name, email: user.email },
      token,
    });
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    const token = signToken(user._id);
    res.cookie('token', token, cookieOptions);
    res.json({
      user: { id: user._id, name: user.name, email: user.email },
      token,
    });
  } catch (err) {
    next(err);
  }
};

export const logout = (req, res) => {
  res.clearCookie('token', { ...cookieOptions, maxAge: 0 });
  res.json({ message: 'Logged out' });
};

export const getMe = async (req, res, next) => {
  try {
    res.json({
      user: { id: req.user._id, name: req.user.name, email: req.user.email },
    });
  } catch (err) {
    next(err);
  }
};

export const updateMe = async (req, res, next) => {
  try {
    const { name, email } = req.body;
    const user = await User.findById(req.user._id).select('+password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (email && email !== user.email) {
      const exists = await User.findOne({ email });
      if (exists) return res.status(400).json({ message: 'Email already in use' });
      user.email = email;
    }
    if (name) user.name = name;
    await user.save();

    res.json({ user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    next(err);
  }
};

export const deleteMe = async (req, res, next) => {
  try {
    await User.findByIdAndDelete(req.user._id);
    res.json({ message: 'Account deleted' });
  } catch (err) {
    next(err);
  }
};

export const requestPasswordOtp = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }
    const { email } = req.body;
    const user = await User.findOne({ email });
    // Always return success-like response to avoid account enumeration.
    if (!user) return res.json({ success: true, message: 'If the email exists, OTP was sent.' });

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    user.resetOtp = otp;
    user.resetOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    if (isMailerConfigured()) {
      await sendOtpEmail({ to: user.email, otp });
    } else if (process.env.NODE_ENV !== 'production') {
      // Dev fallback so forgot-password flow is testable without SMTP.
      console.warn(`[DEV OTP] ${user.email} -> ${otp}`);
      return res.json({
        success: true,
        message: 'SMTP not configured. OTP returned for development use.',
        devOtp: otp,
      });
    } else {
      return res.status(500).json({ message: 'Email service is not configured.' });
    }

    res.json({ success: true, message: 'OTP sent to your email.' });
  } catch (err) {
    next(err);
  }
};

export const resetPasswordWithOtp = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }
    const { email, otp, newPassword } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(400).json({ message: 'Invalid OTP or expired OTP' });

    const now = new Date();
    if (!user.resetOtp || user.resetOtp !== String(otp) || !user.resetOtpExpires || user.resetOtpExpires < now) {
      return res.status(400).json({ message: 'Invalid OTP or expired OTP' });
    }

    user.password = newPassword;
    user.resetOtp = '';
    user.resetOtpExpires = null;
    await user.save();

    res.json({ success: true, message: 'Password has been reset. Please log in.' });
  } catch (err) {
    next(err);
  }
};
