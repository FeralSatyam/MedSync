import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

export const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }
    const { name, email, password, contactNumber } = req.body;
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'Email already registered' });
    }
    if (contactNumber) {
      const existingPhone = await User.findOne({ contactNumber });
      if (existingPhone) {
        return res.status(400).json({ message: 'Contact number already registered' });
      }
    }
    const user = await User.create({ name, email, password, contactNumber });

    // Auto-send verification OTP right after registration
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    user.verifyOtp = otp;
    user.verifyOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();
    
    console.log(`Verification OTP for ${email}: ${otp}`);
    
    res.status(201).json({
      message: 'User created. Please verify your email.',
      email: user.email,
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Check if it's an email to lowercase/normalize it, otherwise keep as is
    const loginIdentifier = email.includes('@') ? email.toLowerCase().trim() : email.trim();
    
    const user = await User.findOne({
      $or: [
        { email: loginIdentifier },
        { contactNumber: loginIdentifier }
      ]
    }).select('+password');
    
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    if (!user.isVerified) {
      return res.status(401).json({ 
        message: 'Please verify your email first',
        needsVerification: true,
        email: user.email 
      });
    }
    
    const token = generateToken(user._id);
    
    res.json({
      user: { id: user._id, name: user.name, email: user.email, contactNumber: user.contactNumber },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const logout = (req, res) => {
  res.json({ message: 'Logged out successfully' });
};

export const getMe = async (req, res) => {
  try {
    res.json({
      user: { 
        id: req.user._id, 
        name: req.user.name, 
        email: req.user.email,
        contactNumber: req.user.contactNumber
      },
    });
  } catch (err) {
    next(err);
  }
};

export const updateMe = async (req, res) => {
  try {
    const { name, email, contactNumber } = req.body;
    const user = await User.findById(req.user._id).select('+password');
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
    if (email) user.email = email;
    
    await user.save();
    res.json({ 
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email,
        contactNumber: user.contactNumber
      } 
    });
  } catch (err) {
    next(err);
  }
};

export const deleteMe = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user.id);
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete me error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const requestPasswordOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.json({ message: 'If an account exists, an OTP will be sent' });
    }
    
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    
    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();
    
    console.log(`Password reset OTP for ${email}: ${otp}`);
    
    res.json({ message: 'OTP sent to your email' });
  } catch (error) {
    console.error('Request OTP error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const resetPasswordWithOtp = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (user.otp !== otp || user.otpExpires < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }
    
    user.password = newPassword;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();
    
    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const sendVerifyOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (user.isVerified) {
      return res.status(400).json({ message: 'Email already verified' });
    }
    
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    
    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();
    
    console.log(`Verification OTP for ${email}: ${otp}`);
    
    res.json({ message: 'Verification OTP sent to your email' });
  } catch (error) {
    console.error('Send verify OTP error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (user.otp !== otp || user.otpExpires < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }
    
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();
    
    const token = generateToken(user._id);
    
    res.json({
      success: true,
      message: 'Email verified! Welcome to MedSync.',
      user: { id: user._id, name: user.name, email: user.email, contactNumber: user.contactNumber },
      token,
    });
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};