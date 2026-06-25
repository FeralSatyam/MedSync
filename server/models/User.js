import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },

    // existing — keep as-is
    resetOtp: { type: String, default: '' },
    resetOtpExpires: { type: Date },

    // NEW — email verification
    isVerified: { type: Boolean, default: false },
    verifyOtp: { type: String, default: '' },
    verifyOtpExpires: { type: Date },

    // NEW — contact number
    contactNumber: { type: String, unique: true, sparse: true, trim: true },

    // Account-wide pharmacy dispensing PIN (4 digits, bcrypt hashed).
    // A single PIN owned by the account holder and shared across all of their patients.
    dispensingPin: { type: String, default: '', select: false },
  },
  { timestamps: true }
);

UserSchema.pre('save', async function () {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  // Hash the dispensing PIN whenever it changes and still looks like a raw PIN.
  if (this.isModified('dispensingPin') && this.dispensingPin && this.dispensingPin.length <= 6) {
    this.dispensingPin = await bcrypt.hash(this.dispensingPin, 10);
  }
});

UserSchema.methods.matchPassword = async function (entered) {
  return await bcrypt.compare(entered, this.password);
};

UserSchema.methods.matchDispensingPin = async function (pin) {
  if (!this.dispensingPin) return false;
  return await bcrypt.compare(String(pin), this.dispensingPin);
};

export default mongoose.model('User', UserSchema);