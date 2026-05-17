import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import dns from 'dns';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const disposableDomains = require('disposable-email-domains');
import User from '../models/User.js';
import { isMailerConfigured, sendOtpEmail, sendVerifyOtpEmail } from '../utils/mailer.js';

const isDisposableDomain = (domain) => {
  if (!domain) return true;
  return disposableDomains.includes(domain.toLowerCase());
};

const verifyMxRecord = async (domain) => {
  return new Promise((resolve) => {
    dns.resolveMx(domain, (err, addresses) => {
      if (err) {
        if (err.code === 'ENOTFOUND' || err.code === 'ENODATA') {
          resolve(false);
        } else {
          // Network error (ECONNREFUSED, timeout), fail-open to not block users
          resolve(true);
        }
      } else if (!addresses || addresses.length === 0) {
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
};

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
    const normalizedEmail = email.toLowerCase().trim();

    const domain = normalizedEmail.split('@')[1];
    
    if (isDisposableDomain(domain)) {
      return res.status(400).json({ message: 'Disposable email addresses are not allowed' });
    }

    const hasMx = await verifyMxRecord(domain);
    if (!hasMx) {
      return res.status(400).json({ message: 'Invalid email provider' });
    }

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(400).json({ message: 'Email already registered' });
    }
    const user = await User.create({ name, email: normalizedEmail, password });

    // Auto-send verification OTP right after registration
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    user.verifyOtp = otp;
    user.verifyOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    if (isMailerConfigured()) {
      await sendVerifyOtpEmail({ to: user.email, otp });
    } else if (process.env.NODE_ENV !== 'production') {
      console.warn(`[DEV VERIFY OTP] ${user.email} -> ${otp}`);
    }

    // Return user but do NOT issue JWT yet — force verification first
    res.status(201).json({
      message: 'Account created. Please verify your email.',
      email: user.email,
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
    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Email not registered' });
    }
    if (!(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Incorrect password' });
    }

    // Block login if email not verified
    if (!user.isVerified) {
      return res.status(403).json({
        message: 'Please verify your email before logging in.',
        needsVerification: true,
        email: user.email,
      });
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
    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) return res.json({ success: true, message: 'If the email exists, OTP was sent.' });

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    user.resetOtp = otp;
    user.resetOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    if (isMailerConfigured()) {
      await sendOtpEmail({ to: user.email, otp });
    } else if (process.env.NODE_ENV !== 'production') {
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

// ─── NEW: Send email verification OTP ────────────────────────────────────────
export const sendVerifyOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    const normalizedEmail = email.toLowerCase().trim();
    if (!normalizedEmail) return res.status(400).json({ message: 'Email is required' });

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) return res.status(404).json({ message: 'No account found with this email' });
    if (user.isVerified) return res.status(400).json({ message: 'Email is already verified' });

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    user.verifyOtp = otp;
    user.verifyOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    if (isMailerConfigured()) {
      await sendVerifyOtpEmail({ to: user.email, otp });
    } else if (process.env.NODE_ENV !== 'production') {
      console.warn(`[DEV VERIFY OTP] ${user.email} -> ${otp}`);
      return res.json({ success: true, message: 'Dev mode: OTP logged to console.', devOtp: otp });
    } else {
      return res.status(500).json({ message: 'Email service is not configured.' });
    }

    res.json({ success: true, message: 'Verification OTP sent to your email.' });
  } catch (err) {
    next(err);
  }
};

// ─── NEW: Verify email with OTP ───────────────────────────────────────────────
export const verifyEmail = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const normalizedEmail = email.toLowerCase().trim();
    if (!normalizedEmail || !otp) return res.status(400).json({ message: 'Email and OTP are required' });

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) return res.status(404).json({ message: 'No account found with this email' });
    if (user.isVerified) return res.status(400).json({ message: 'Email is already verified' });

    if (user.verifyOtp !== String(otp)) {
      return res.status(400).json({ message: 'Incorrect OTP. Please try again.' });
    }
    if (user.verifyOtpExpires < new Date()) {
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    user.isVerified = true;
    user.verifyOtp = '';
    user.verifyOtpExpires = null;
    await user.save();

    // Issue JWT so user is logged in immediately after verifying
    const token = signToken(user._id);
    res.cookie('token', token, cookieOptions);
    res.json({
      success: true,
      message: 'Email verified! Welcome to MedSync.',
      user: { id: user._id, name: user.name, email: user.email },
      token,
    });
  } catch (err) {
    next(err);
  }
};