import mongoose from 'mongoose';

const medicineSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    name: { type: String, required: true, trim: true },
    strength: { type: String, required: true, trim: true },
    frequencyPerDay: { type: Number, required: true, min: 0 },
    dosePerIntake: { type: Number, required: true, min: 0 },
    currentStock: { type: Number, required: true, min: 0 },
    refillThreshold: { type: Number, default: 7, min: 1 },
    prescriptionImageUrl: { type: String, default: '' },
    prescriptionPublicId: { type: String, default: '' },
    doctorName: { type: String, default: '' },
    hospitalName: { type: String, default: '' },
    prescriptionIssuedDate: { type: Date },
    prescriptionValidUntil: { type: Date },
    isActive: { type: Boolean, default: true },
    lastReducedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model('Medicine', medicineSchema);
