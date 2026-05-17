import Patient from '../models/Patient.js';
import Medicine from '../models/Medicine.js';
import { validationResult } from 'express-validator';
import { getStockStatus, getRefillQuantity } from '../utils/stockUtils.js';

function enrichMedicine(m) {
  const obj = m.toObject ? m.toObject() : { ...m };
  const { status, daysLeft } = getStockStatus(obj);
  obj.stockStatus = status;
  obj.daysLeft = daysLeft;
  obj.refillQuantity = getRefillQuantity(obj);
  return obj;
}

function sortByUrgency(medicines) {
  const order = { red: 0, amber: 1, green: 2 };
  return [...medicines].sort((a, b) => {
    const sa = order[a.stockStatus] ?? 3;
    const sb = order[b.stockStatus] ?? 3;
    if (sa !== sb) return sa - sb;
    const da = a.daysLeft ?? 999;
    const db = b.daysLeft ?? 999;
    return da - db;
  });
}

export const getPublicByQr = async (req, res, next) => {
  try {
    const { qrToken } = req.params;
    const patient = await Patient.findOne({ qrToken }).lean();
    if (!patient) {
      return res.status(404).json({ message: 'Invalid QR code' });
    }

    res.json({
      requiresOtp: true,
      scanTimestamp: new Date().toISOString(),
      patient: {
        name: patient.name,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const verifyOtp = async (req, res, next) => {
  try {
    const { qrToken } = req.params;
    const { otp } = req.body;
    const patient = await Patient.findOne({ qrToken });
    if (!patient) return res.status(404).json({ message: 'Invalid QR code' });
    
    if (!patient.viewOtp || patient.viewOtp !== String(otp) || !patient.viewOtpExpires || patient.viewOtpExpires < new Date()) {
      return res.status(401).json({ message: 'Invalid or expired OTP' });
    }

    const medicinesRaw = await Medicine.find({ patientId: patient._id, isActive: true });
    const medicines = sortByUrgency(medicinesRaw.map(enrichMedicine));

    res.json({
      scanTimestamp: new Date().toISOString(),
      patient: {
        name: patient.name,
        dateOfBirth: patient.dateOfBirth,
        allergies: patient.allergies,
        profilePicUrl: patient.profilePicUrl,
      },
      medicines,
    });
  } catch (err) {
    next(err);
  }
};

export const dispense = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }
    const { qrToken } = req.params;
    const patient = await Patient.findOne({ qrToken });
    if (!patient) {
      return res.status(404).json({ message: 'Invalid QR code' });
    }

    const { pin, items } = req.body;
    const ok = await patient.verifyPin(pin);
    if (!ok) return res.status(401).json({ message: 'Invalid PIN' });

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'items array required' });
    }

    const ops = items
      .filter((row) => row?.medicineId && row?.quantity != null)
      .map((row) => {
        const q = Number(row.quantity);
        if (Number.isNaN(q) || q < 0) return null;
        return {
          updateOne: {
            filter: { _id: row.medicineId, patientId: patient._id, isActive: true },
            update: { $inc: { currentStock: q } },
          },
        };
      })
      .filter(Boolean);

    if (ops.length) await Medicine.bulkWrite(ops, { ordered: false });

    const allRaw = await Medicine.find({ patientId: patient._id, isActive: true });
    const medicines = sortByUrgency(allRaw.map(enrichMedicine));
    res.json({ success: true, medicines });
  } catch (err) {
    next(err);
  }
};
