import bcrypt from 'bcryptjs';
import Patient from '../models/Patient.js';
import Medicine from '../models/Medicine.js';
import { validationResult } from 'express-validator';
import { getPharmacistStockStatus, getRefillQuantity } from '../utils/stockCalculator.js';

const PIN_MAX_ATTEMPTS = 5;
const pinFailCounts = new Map();

function pinAttemptKey(ip, qrToken) {
  return `${ip}:${qrToken}`;
}

function recordPinFailure(ip, qrToken) {
  const k = pinAttemptKey(ip, qrToken);
  const n = (pinFailCounts.get(k) || 0) + 1;
  pinFailCounts.set(k, n);
  return n;
}

function resetPinFailures(ip, qrToken) {
  pinFailCounts.delete(pinAttemptKey(ip, qrToken));
}

function enrichMedicine(m) {
  const med = m.toObject ? m.toObject() : { ...m };
  const statusInfo = getPharmacistStockStatus(med);
  med.stockStatus = statusInfo.status;
  med.daysLeft = statusInfo.daysLeft === Infinity ? null : statusInfo.daysLeft;
  med.refillQuantity = getRefillQuantity(med);
  return med;
}

function sortByUrgency(medicines) {
  const order = { red: 0, yellow: 1, green: 2 };
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
      return res.status(404).json({ message: 'Invalid or expired QR code' });
    }
    const medicinesRaw = await Medicine.find({ patientId: patient._id, isActive: true });
    const medicines = sortByUrgency(medicinesRaw.map(enrichMedicine));

    res.json({
      scanTimestamp: new Date().toISOString(),
      patient: {
        name: patient.name,
        dateOfBirth: patient.dateOfBirth,
        allergies: patient.allergies,
        notes: patient.notes,
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
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    const k = pinAttemptKey(ip, qrToken);
    if ((pinFailCounts.get(k) || 0) >= PIN_MAX_ATTEMPTS) {
      return res.status(429).json({ message: 'Too many failed PIN attempts. Try again later.' });
    }

    const patient = await Patient.findOne({ qrToken });
    if (!patient) {
      return res.status(404).json({ message: 'Invalid QR code' });
    }

    const { pin, medicines: items } = req.body;
    const ok = await bcrypt.compare(String(pin), patient.pharmacyPin);
    if (!ok) {
      const fails = recordPinFailure(ip, qrToken);
      if (fails >= PIN_MAX_ATTEMPTS) {
        return res.status(429).json({ message: 'Too many failed PIN attempts. Try again later.' });
      }
      return res.status(401).json({ message: 'Invalid PIN' });
    }
    resetPinFailures(ip, qrToken);

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'medicines array required' });
    }

    const updated = [];
    for (const row of items) {
      const { medicineId, quantityAdded } = row;
      const med = await Medicine.findOne({
        _id: medicineId,
        patientId: patient._id,
        isActive: true,
      });
      if (!med) continue;
      const q = Number(quantityAdded);
      if (Number.isNaN(q) || q < 0) continue;
      med.currentStock = Math.max(0, med.currentStock + q);
      await med.save();
      updated.push(enrichMedicine(med));
    }

    const allRaw = await Medicine.find({ patientId: patient._id, isActive: true });
    res.json({ medicines: sortByUrgency(allRaw.map(enrichMedicine)) });
  } catch (err) {
    next(err);
  }
};
