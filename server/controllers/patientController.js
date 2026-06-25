import { v4 as uuidv4 } from 'uuid';
import { validationResult } from 'express-validator';
import Patient from '../models/Patient.js';
import Medicine from '../models/Medicine.js';
import cloudinary from '../config/cloudinary.js';

const ensureOwner = async (patientId, userId) => {
  const patient = await Patient.findOne({ _id: patientId, userId });
  return patient;
};

export const getPatients = async (req, res, next) => {
  try {
    const patients = await Patient.find({ userId: req.user._id })
      .select('-pharmacyPin')
      .sort({ createdAt: -1 });
    res.json(patients);
  } catch (err) {
    console.error('[getPatients] Error:', err);
    if (typeof next === 'function') return next(err);
    return res.status(500).json({ message: err?.message || 'Server error' });
  }
};

export const createPatient = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }
    const { name, dateOfBirth, relation, allergies } = req.body;
    const qrToken = uuidv4();
    const patient = await Patient.create({
      userId: req.user._id,
      name,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      relation,
      allergies: allergies || '',
      qrToken,
    });
    const out = patient.toObject();
    delete out.pharmacyPin;
    res.status(201).json(out);
  } catch (err) {
    console.error('[createPatient] Error:', err);
    if (typeof next === 'function') return next(err);
    return res.status(500).json({ message: err?.message || 'Server error' });
  }
};

export const getPatient = async (req, res, next) => {
  try {
    const patient = await ensureOwner(req.params.id, req.user._id);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });
    const out = patient.toObject();
    delete out.pharmacyPin;
    res.json(out);
  } catch (err) {
    console.error('[getPatient] Error:', err);
    if (typeof next === 'function') return next(err);
    return res.status(500).json({ message: err?.message || 'Server error' });
  }
};

export const updatePatient = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }
    const patient = await ensureOwner(req.params.id, req.user._id);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    const { name, dateOfBirth, relation, allergies } = req.body;
    if (name !== undefined) patient.name = name;
    if (dateOfBirth !== undefined) patient.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
    if (allergies !== undefined) patient.allergies = allergies;
    await patient.save();
    const out = patient.toObject();
    delete out.pharmacyPin;
    res.json(out);
  } catch (err) {
    console.error('[updatePatient] Error:', err);
    if (typeof next === 'function') return next(err);
    return res.status(500).json({ message: err?.message || 'Server error' });
  }
};

export const deletePatient = async (req, res, next) => {
  try {
    const patient = await ensureOwner(req.params.id, req.user._id);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });
    // Cascade delete medicines AND delete Cloudinary prescription images.
    const meds = await Medicine.find({ patientId: patient._id, prescriptionImgId: { $ne: '' } }).lean();
    for (const med of meds) {
      if (!med.prescriptionImgId) continue;
      try {
        await cloudinary.uploader.destroy(med.prescriptionImgId);
      } catch {
        /* ignore cloudinary cleanup errors */
      }
    }
    await Medicine.deleteMany({ patientId: patient._id });
    await patient.deleteOne();
    res.json({ message: 'Patient deleted' });
  } catch (err) {
    console.error('[deletePatient] Error:', err);
    if (typeof next === 'function') return next(err);
    return res.status(500).json({ message: err?.message || 'Server error' });
  }
};

function frontendBaseUrl() {
  const raw = process.env.CLIENT_URL || 'http://localhost:5173';
  const first = raw.split(',')[0].trim();
  return first.replace(/\/$/, '');
}

export const getQrData = async (req, res, next) => {
  try {
    const patient = await ensureOwner(req.params.id, req.user._id);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });
    const qrUrl = `${frontendBaseUrl()}/pharmacist/${patient.qrToken}`;
    res.json({ qrToken: patient.qrToken, qrUrl });
  } catch (err) {
    console.error('[getQrData] Error:', err);
    if (typeof next === 'function') return next(err);
    return res.status(500).json({ message: err?.message || 'Server error' });
  }
};

export const generateOtp = async (req, res, next) => {
  try {
    const patient = await ensureOwner(req.params.id, req.user._id);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    patient.tempOtp = otp;
    patient.tempOtpExpires = new Date(Date.now() + 5 * 60 * 1000);
    await patient.save();

    res.json({
      success: true,
      otp,
      expiresAt: patient.tempOtpExpires.toISOString(),
      qrToken: patient.qrToken,
    });
  } catch (err) {
    console.error('[generateOtp] Error:', err);
    if (typeof next === 'function') return next(err);
    return res.status(500).json({ message: err?.message || 'Server error' });
  }
};
