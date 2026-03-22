import { validationResult } from 'express-validator';
import Medicine from '../models/Medicine.js';
import Patient from '../models/Patient.js';
import cloudinary from '../config/cloudinary.js';

const ensurePatientOwned = async (patientId, userId) => {
  return Patient.findOne({ _id: patientId, userId });
};

const ensureMedicineOwned = async (medicineId, userId) => {
  const med = await Medicine.findById(medicineId).populate('patientId');
  if (!med || !med.patientId) return null;
  if (String(med.patientId.userId) !== String(userId)) return null;
  return med;
};

export const getMedicinesByPatient = async (req, res, next) => {
  try {
    const { patientId } = req.params;
    const patient = await ensurePatientOwned(patientId, req.user._id);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });
    const medicines = await Medicine.find({ patientId, isActive: true }).sort({ name: 1 });
    res.json(medicines);
  } catch (err) {
    next(err);
  }
};

export const createMedicine = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }
    const { patientId } = req.body;
    const patient = await ensurePatientOwned(patientId, req.user._id);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    let prescriptionImageUrl = '';
    let prescriptionPublicId = '';
    if (req.file) {
      prescriptionImageUrl = req.file.path || req.file.secure_url || '';
      prescriptionPublicId = req.file.filename || req.file.public_id || '';
    }

    const medicine = await Medicine.create({
      patientId,
      name: req.body.name,
      strength: req.body.strength,
      frequencyPerDay: Number(req.body.frequencyPerDay),
      dosePerIntake: Number(req.body.dosePerIntake),
      currentStock: Number(req.body.currentStock),
      refillThreshold: req.body.refillThreshold != null ? Number(req.body.refillThreshold) : 7,
      prescriptionImageUrl,
      prescriptionPublicId,
      doctorName: req.body.doctorName || '',
      hospitalName: req.body.hospitalName || '',
      prescriptionIssuedDate: req.body.prescriptionIssuedDate
        ? new Date(req.body.prescriptionIssuedDate)
        : undefined,
      prescriptionValidUntil: req.body.prescriptionValidUntil
        ? new Date(req.body.prescriptionValidUntil)
        : undefined,
    });
    res.status(201).json(medicine);
  } catch (err) {
    next(err);
  }
};

export const updateMedicine = async (req, res, next) => {
  try {
    const medicine = await ensureMedicineOwned(req.params.id, req.user._id);
    if (!medicine) return res.status(404).json({ message: 'Medicine not found' });

    const fields = [
      'name',
      'strength',
      'frequencyPerDay',
      'dosePerIntake',
      'currentStock',
      'refillThreshold',
      'doctorName',
      'hospitalName',
      'isActive',
    ];
    for (const f of fields) {
      if (req.body[f] !== undefined) {
        if (['frequencyPerDay', 'dosePerIntake', 'currentStock', 'refillThreshold'].includes(f)) {
          medicine[f] = Number(req.body[f]);
        } else if (f === 'isActive') {
          medicine[f] = req.body[f] === true || req.body[f] === 'true';
        } else {
          medicine[f] = req.body[f];
        }
      }
    }
    if (req.body.prescriptionIssuedDate !== undefined) {
      medicine.prescriptionIssuedDate = req.body.prescriptionIssuedDate
        ? new Date(req.body.prescriptionIssuedDate)
        : null;
    }
    if (req.body.prescriptionValidUntil !== undefined) {
      medicine.prescriptionValidUntil = req.body.prescriptionValidUntil
        ? new Date(req.body.prescriptionValidUntil)
        : null;
    }

    if (req.file) {
      if (medicine.prescriptionPublicId) {
        try {
          await cloudinary.uploader.destroy(medicine.prescriptionPublicId);
        } catch {
          /* ignore */
        }
      }
      medicine.prescriptionImageUrl = req.file.path || req.file.secure_url || '';
      medicine.prescriptionPublicId = req.file.filename || req.file.public_id || '';
    }

    await medicine.save();
    res.json(medicine);
  } catch (err) {
    next(err);
  }
};

export const restockMedicine = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }
    const medicine = await ensureMedicineOwned(req.params.id, req.user._id);
    if (!medicine) return res.status(404).json({ message: 'Medicine not found' });
    const add = Number(req.body.quantityAdded);
    medicine.currentStock = Math.max(0, medicine.currentStock + add);
    await medicine.save();
    res.json(medicine);
  } catch (err) {
    next(err);
  }
};

export const deleteMedicine = async (req, res, next) => {
  try {
    const medicine = await ensureMedicineOwned(req.params.id, req.user._id);
    if (!medicine) return res.status(404).json({ message: 'Medicine not found' });
    if (medicine.prescriptionPublicId) {
      try {
        await cloudinary.uploader.destroy(medicine.prescriptionPublicId);
      } catch {
        /* ignore */
      }
    }
    await medicine.deleteOne();
    res.json({ message: 'Medicine deleted' });
  } catch (err) {
    next(err);
  }
};
