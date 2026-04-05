import { validationResult } from 'express-validator';
import Medicine from '../models/Medicine.js';
import Patient from '../models/Patient.js';
import cloudinary from '../config/cloudinary.js';
import { getStockStatus } from '../utils/stockUtils.js';

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
    const medicines = await Medicine.find({ patientId, isActive: true });

    const enriched = medicines.map((m) => {
      const obj = m.toObject();
      const { status, daysLeft } = getStockStatus(obj);
      obj.stockStatus = status;
      obj.daysLeft = daysLeft;
      return obj;
    });

    const order = { red: 0, amber: 1, green: 2 };
    enriched.sort((a, b) => (order[a.stockStatus] ?? 3) - (order[b.stockStatus] ?? 3));

    res.json(enriched);
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

    let prescriptionImgUrl = '';
    let prescriptionImgId = '';
    if (req.file) {
      prescriptionImgUrl = req.file.secure_url || req.file.path || '';
      prescriptionImgId = req.file.public_id || req.file.filename || '';
    }

    const medicine = await Medicine.create({
      patientId,
      name: req.body.name,
      strength: req.body.strength,
      unit: req.body.unit || 'mg',
      frequencyPerDay: Number(req.body.frequencyPerDay),
      dosePerIntake: Number(req.body.dosePerIntake),
      currentStock: Number(req.body.currentStock),
      refillThreshold: req.body.refillThreshold != null ? Number(req.body.refillThreshold) : 7,
      instructions: req.body.instructions || '',
      doctorName: req.body.doctorName || '',
      hospitalName: req.body.hospitalName || '',
      prescriptionDate: req.body.prescriptionDate ? new Date(req.body.prescriptionDate) : undefined,
      prescriptionValid: req.body.prescriptionValid ? new Date(req.body.prescriptionValid) : undefined,
      prescriptionImgUrl,
      prescriptionImgId,
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
      'unit',
      'frequencyPerDay',
      'dosePerIntake',
      'currentStock',
      'refillThreshold',
      'instructions',
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
    if (req.body.prescriptionDate !== undefined) {
      medicine.prescriptionDate = req.body.prescriptionDate ? new Date(req.body.prescriptionDate) : null;
    }
    if (req.body.prescriptionValid !== undefined) {
      medicine.prescriptionValid = req.body.prescriptionValid ? new Date(req.body.prescriptionValid) : null;
    }

    if (req.file) {
      if (medicine.prescriptionImgId) {
        try {
          await cloudinary.uploader.destroy(medicine.prescriptionImgId);
        } catch {
          /* ignore */
        }
      }
      medicine.prescriptionImgUrl = req.file.secure_url || req.file.path || '';
      medicine.prescriptionImgId = req.file.public_id || req.file.filename || '';
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
    const add = Number(req.body.quantity);
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
    if (medicine.prescriptionImgId) {
      try {
        await cloudinary.uploader.destroy(medicine.prescriptionImgId);
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
