import mongoose from 'mongoose';

const PendingRegistrationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    contactNumber: { type: String, unique: true, sparse: true, trim: true },
    verifyOtp: { type: String, required: true },
    verifyOtpExpires: { type: Date, required: true },
  },
  { timestamps: true }
);

PendingRegistrationSchema.index({ verifyOtpExpires: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('PendingRegistration', PendingRegistrationSchema);
