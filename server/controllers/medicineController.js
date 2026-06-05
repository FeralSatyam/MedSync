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
    if (req.files && req.files.prescriptionImage && req.files.prescriptionImage[0]) {
      const file = req.files.prescriptionImage[0];
      prescriptionImgUrl = file.secure_url || file.path || '';
      prescriptionImgId = file.public_id || file.filename || '';
    }

    let medicinePhotoUrl = '';
    let medicinePhotoId = '';
    if (req.files && req.files.medicinePhoto && req.files.medicinePhoto[0]) {
      const file = req.files.medicinePhoto[0];
      medicinePhotoUrl = file.secure_url || file.path || '';
      medicinePhotoId = file.public_id || file.filename || '';
    }

    let doseTimes = ['08:00'];
    if (req.body.doseTimes) {
      try { doseTimes = JSON.parse(req.body.doseTimes); } catch { /* keep default */ }
    }

    const medicine = await Medicine.create({
      patientId,
      name: req.body.name,
      medicineForm: req.body.medicineForm || 'tablets',
      strength: req.body.strength,
      unit: req.body.unit || 'mg',
      stockUnit: req.body.stockUnit || '',
      durationEstimate: req.body.durationEstimate || '',
      frequencyPerDay: Number(req.body.frequencyPerDay),
      dosePerIntake: req.body.dosePerIntake != null ? Number(req.body.dosePerIntake) : 1,
      currentStock: Number(req.body.currentStock),
      refillThreshold: req.body.refillThreshold != null ? Number(req.body.refillThreshold) : 7,
      instructions: req.body.instructions || '',
      doctorName: req.body.doctorName || '',
      hospitalName: req.body.hospitalName || '',
      prescriptionDate: req.body.prescriptionDate ? new Date(req.body.prescriptionDate) : undefined,
      prescriptionValid: req.body.prescriptionValid ? new Date(req.body.prescriptionValid) : undefined,
      prescriptionImgUrl,
      prescriptionImgId,
      medicinePhotoUrl,
      medicinePhotoId,
      firstDoseTime: doseTimes[0] || req.body.firstDoseTime || '08:00',
      doseTimes,
      remindersEnabled: req.body.remindersEnabled === 'false' || req.body.remindersEnabled === false ? false : true,
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
      'medicineForm',
      'strength',
      'unit',
      'stockUnit',
      'durationEstimate',
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
    if (req.body.doseTimes !== undefined) {
      try {
        const times = JSON.parse(req.body.doseTimes);
        medicine.doseTimes = times;
        medicine.firstDoseTime = times[0] || '08:00';
      } catch { /* keep existing */ }
    } else if (req.body.firstDoseTime !== undefined) {
      medicine.firstDoseTime = req.body.firstDoseTime;
    }
    if (req.body.remindersEnabled !== undefined) {
      medicine.remindersEnabled = req.body.remindersEnabled === 'true' || req.body.remindersEnabled === true;
    }

    if (req.files) {
      if (req.files.prescriptionImage && req.files.prescriptionImage[0]) {
        const file = req.files.prescriptionImage[0];
        if (medicine.prescriptionImgId) {
          try {
            await cloudinary.uploader.destroy(medicine.prescriptionImgId);
          } catch {
            /* ignore */
          }
        }
        medicine.prescriptionImgUrl = file.secure_url || file.path || '';
        medicine.prescriptionImgId = file.public_id || file.filename || '';
      }

      if (req.files.medicinePhoto && req.files.medicinePhoto[0]) {
        const file = req.files.medicinePhoto[0];
        if (medicine.medicinePhotoId) {
          try {
            await cloudinary.uploader.destroy(medicine.medicinePhotoId);
          } catch {
            /* ignore */
          }
        }
        medicine.medicinePhotoUrl = file.secure_url || file.path || '';
        medicine.medicinePhotoId = file.public_id || file.filename || '';
      }
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
    if (medicine.medicinePhotoId) {
      try {
        await cloudinary.uploader.destroy(medicine.medicinePhotoId);
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
