import crypto from 'crypto';
import PharmacistInvitation from '../models/PharmacistInvitation.js';

export const generateInvitation = async (req, res) => {
  try {
    const userId = req.user._id;

    // Generate 8-digit OTP
    const otp = Math.floor(10000000 + Math.random() * 90000000).toString();

    // Generate cryptographically secure QR token
    const qrToken = crypto.randomBytes(32).toString('hex');

    // Set 5-minute expiry
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    const invitation = new PharmacistInvitation({
      userId,
      otp,
      qrToken,
      expiresAt
    });

    await invitation.save();

    // Generate Linking URL
    const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
    const linkingUrl = `${FRONTEND_URL}/link-pharmacist?token=${qrToken}`;

    // Return OTP and QR image URL 
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(linkingUrl)}`;

    res.status(201).json({
      otp,
      qrToken,
      qrImage: qrImageUrl,
      expiresAt
    });
  } catch (error) {
    console.error('Error generating pharmacist invitation:', error);
    res.status(500).json({ message: 'Failed to generate invitation' });
  }
};
