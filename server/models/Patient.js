import mongoose from 'mongoose';

const patientSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    dateOfBirth: { type: Date },
    allergies: { type: String, default: '' },
    notes: { type: String, default: '' },
    qrToken: { type: String, unique: true, required: true },
    pharmacyPin: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model('Patient', patientSchema);
