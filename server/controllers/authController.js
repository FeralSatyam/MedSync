import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import User from '../models/User.js';
import PendingRegistration from '../models/PendingRegistration.js';
import { isMailerConfigured, sendOtpEmail, sendVerifyOtpEmail } from '../utils/mailer.js';
import { sendVerificationEmail, sendOTPEmail } from '../config/email.js';

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
  });

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const generateVerifyOtp = () => String(Math.floor(100000 + Math.random() * 900000));

async function deliverVerifyOtp({ email, otp, name }) {
  if (isMailerConfigured()) {
    await sendVerifyOtpEmail({ to: email, otp });
    return true;
  }
  const sent = await sendVerificationEmail(email, otp, name || 'User');
  return sent;
}

async function deliverResetOtp({ email, otp, name }) {
  if (isMailerConfigured()) {
    await sendOtpEmail({ to: email, otp });
    return true;
  }
  const sent = await sendOTPEmail(email, otp, name || 'User');
  return sent;
}

export const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { name, email, password, contactNumber } = req.body;

    if (await User.findOne({ email })) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    if (contactNumber) {
      if (await User.findOne({ contactNumber })) {
        return res.status(400).json({ message: 'Contact number already registered' });
      }
      const pendingPhone = await PendingRegistration.findOne({ contactNumber });
      if (pendingPhone && pendingPhone.email !== email) {
        return res.status(400).json({ message: 'Contact number already registered' });
      }
    }

    const otp = generateVerifyOtp();
    const verifyOtpExpires = new Date(Date.now() + 10 * 60 * 1000);

    let pending = await PendingRegistration.findOne({ email });
    if (pending) {
      pending.name = name;
      pending.password = password;
      pending.contactNumber = contactNumber;
      pending.verifyOtp = otp;
      pending.verifyOtpExpires = verifyOtpExpires;
      await pending.save();
    } else {
      pending = await PendingRegistration.create({
        name,
        email,
        password,
        contactNumber,
        verifyOtp: otp,
        verifyOtpExpires,
      });
    }

    const emailed = await deliverVerifyOtp({ email: pending.email, otp, name: pending.name });
    if (!emailed) {
      return res.status(500).json({ message: 'Could not send verification email. Check SMTP settings.' });
    }

    res.status(201).json({
      message: 'Verification code sent. Please verify your email to complete registration.',
      email: pending.email,
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
    const loginIdentifier = email.includes('@') ? email.toLowerCase().trim() : email.trim();

    const user = await User.findOne({
      $or: [{ email: loginIdentifier }, { contactNumber: loginIdentifier }],
    }).select('+password');

    if (!user) {
      const pending = await PendingRegistration.findOne({
        $or: [{ email: loginIdentifier }, { contactNumber: loginIdentifier }],
      });
      if (pending && pending.password === password) {
        return res.status(403).json({
          message: 'Please verify your email before logging in.',
          needsVerification: true,
          email: pending.email,
        });
      }
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (!(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

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
      user: { id: user._id, name: user.name, email: user.email, contactNumber: user.contactNumber },
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
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        contactNumber: req.user.contactNumber,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const updateMe = async (req, res, next) => {
  try {
    const { name, email, contactNumber } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (email && email !== user.email) {
      const exists = await User.findOne({ email });
      if (exists) return res.status(400).json({ message: 'Email already in use' });
      user.email = email;
    }
    if (contactNumber && contactNumber !== user.contactNumber) {
      const exists = await User.findOne({ contactNumber });
      if (exists) return res.status(400).json({ message: 'Contact number already in use' });
      user.contactNumber = contactNumber;
    }
    if (name) user.name = name;

    await user.save();
    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        contactNumber: user.contactNumber,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const deleteMe = async (req, res, next) => {
  try {
    await User.findByIdAndDelete(req.user._id);
    res.clearCookie('token', { ...cookieOptions, maxAge: 0 });
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
    if (!user) {
      return res.json({ success: true, message: 'If the email exists, OTP was sent.' });
    }

    const otp = generateVerifyOtp();
    user.resetOtp = otp;
    user.resetOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    const emailed = await deliverResetOtp({ email: user.email, otp, name: user.name });
    if (!emailed) {
      return res.status(500).json({ message: 'Could not send OTP email. Check SMTP settings.' });
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
    if (
      !user.resetOtp ||
      user.resetOtp !== String(otp) ||
      !user.resetOtpExpires ||
      user.resetOtpExpires < now
    ) {
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

export const sendVerifyOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await User.findOne({ email });
    if (user?.isVerified) {
      return res.status(400).json({ message: 'Email is already verified' });
    }

    const pending = await PendingRegistration.findOne({ email });
    if (!pending && !user) {
      return res.status(404).json({ message: 'No pending registration found with this email' });
    }

    const otp = generateVerifyOtp();
    const verifyOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
    const recipientName = pending?.name || user?.name;

    if (pending) {
      pending.verifyOtp = otp;
      pending.verifyOtpExpires = verifyOtpExpires;
      await pending.save();
    } else {
      user.verifyOtp = otp;
      user.verifyOtpExpires = verifyOtpExpires;
      await user.save();
    }

    const emailed = await deliverVerifyOtp({ email, otp, name: recipientName });
    if (!emailed) {
      return res.status(500).json({ message: 'Could not send verification email. Check SMTP settings.' });
    }

    res.json({ success: true, message: 'Verification OTP sent to your email.' });
  } catch (err) {
    next(err);
  }
};

export const verifyEmail = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    const pending = await PendingRegistration.findOne({ email });
    if (pending) {
      if (pending.verifyOtp !== String(otp)) {
        return res.status(400).json({ message: 'Incorrect OTP. Please try again.' });
      }
      if (pending.verifyOtpExpires < new Date()) {
        return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
      }

      if (await User.findOne({ email })) {
        await PendingRegistration.deleteOne({ _id: pending._id });
        return res.status(400).json({ message: 'Email already registered' });
      }

      const user = await User.create({
        name: pending.name,
        email: pending.email,
        password: pending.password,
        contactNumber: pending.contactNumber,
        isVerified: true,
      });

      await PendingRegistration.deleteOne({ _id: pending._id });

      const token = signToken(user._id);
      res.cookie('token', token, cookieOptions);
      return res.json({
        success: true,
        message: 'Email verified! Welcome to MedSync.',
        user: { id: user._id, name: user.name, email: user.email, contactNumber: user.contactNumber },
        token,
      });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'No account found with this email' });
    if (user.isVerified) return res.status(400).json({ message: 'Email is already verified' });

    if (user.verifyOtp !== String(otp)) {
      return res.status(400).json({ message: 'Incorrect OTP. Please try again.' });
    }
    if (!user.verifyOtpExpires || user.verifyOtpExpires < new Date()) {
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    user.isVerified = true;
    user.verifyOtp = '';
    user.verifyOtpExpires = null;
    await user.save();

    const token = signToken(user._id);
    res.cookie('token', token, cookieOptions);
    res.json({
      success: true,
      message: 'Email verified! Welcome to MedSync.',
      user: { id: user._id, name: user.name, email: user.email, contactNumber: user.contactNumber },
      token,
    });
  } catch (err) {
    next(err);
  }
};
