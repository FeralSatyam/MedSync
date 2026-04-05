import mongoose from 'mongoose';
//production
const MedicineSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    name: { type: String, required: true, trim: true },
    strength: { type: String, required: true },
    unit: { type: String, enum: ['mg', 'ml', 'IU', 'mcg'], default: 'mg' },
    frequencyPerDay: { type: Number, required: true, min: 1, max: 24 },
    dosePerIntake: { type: Number, required: true, min: 0.5 },
    currentStock: { type: Number, required: true, min: 0 },
    refillThreshold: { type: Number, default: 7 },
    instructions: { type: String, default: '' },
    doctorName: { type: String, default: '' },
    hospitalName: { type: String, default: '' },
    prescriptionDate: { type: Date },
    prescriptionValid: { type: Date },
    prescriptionImgUrl: { type: String, default: '' },
    prescriptionImgId: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    lastReducedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model('Medicine', MedicineSchema);
