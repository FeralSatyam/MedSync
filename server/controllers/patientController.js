import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { validationResult } from 'express-validator';
import Patient from '../models/Patient.js';
import Medicine from '../models/Medicine.js';

const SALT_ROUNDS = 12;

const ensureOwner = async (patientId, userId) => {
  const patient = await Patient.findOne({ _id: patientId, userId });
  return patient;
};

export const getPatients = async (req, res, next) => {
  try {
    const patients = await Patient.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(patients);
  } catch (err) {
    next(err);
  }
};

export const createPatient = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }
    const { name, dateOfBirth, allergies, notes, pharmacyPin } = req.body;
    const qrToken = uuidv4();
    const hashedPin = await bcrypt.hash(String(pharmacyPin), SALT_ROUNDS);
    const patient = await Patient.create({
      userId: req.user._id,
      name,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      allergies: allergies || '',
      notes: notes || '',
      qrToken,
      pharmacyPin: hashedPin,
    });
    const out = patient.toObject();
    delete out.pharmacyPin;
    res.status(201).json(out);
  } catch (err) {
    next(err);
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
    next(err);
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

    const { name, dateOfBirth, allergies, notes, pharmacyPin } = req.body;
    if (name !== undefined) patient.name = name;
    if (dateOfBirth !== undefined) patient.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
    if (allergies !== undefined) patient.allergies = allergies;
    if (notes !== undefined) patient.notes = notes;
    if (pharmacyPin !== undefined && pharmacyPin !== '') {
      patient.pharmacyPin = await bcrypt.hash(String(pharmacyPin), SALT_ROUNDS);
    }
    await patient.save();
    const out = patient.toObject();
    delete out.pharmacyPin;
    res.json(out);
  } catch (err) {
    next(err);
  }
};

export const deletePatient = async (req, res, next) => {
  try {
    const patient = await ensureOwner(req.params.id, req.user._id);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });
    await Medicine.deleteMany({ patientId: patient._id });
    await patient.deleteOne();
    res.json({ message: 'Patient deleted' });
  } catch (err) {
    next(err);
  }
};

export const getQrData = async (req, res, next) => {
  try {
    const patient = await ensureOwner(req.params.id, req.user._id);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const qrUrl = `${clientUrl.replace(/\/$/, '')}/pharmacist/${patient.qrToken}`;
    res.json({ qrToken: patient.qrToken, qrUrl });
  } catch (err) {
    next(err);
  }
};
