import mongoose from 'mongoose';

const offerSchema = new mongoose.Schema(
  {
    pharmacistId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pharmacist',
      required: true,
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
    },
    medicineName: {
      type: String,
      required: true,
    },
    offerType: {
      type: String,
      enum: ['discount', 'special', 'other'],
      default: 'discount',
    },
    discountPercent: {
      type: Number,
      default: 0,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    fullMessage: {
      type: String,
      trim: true,
    },
    shortMessage: {
      type: String,
      trim: true,
    },
    channels: {
      type: [String],
      default: ['in_app'],
    },
    status: {
      type: String,
      default: 'pending',
    },
    expiresAt: {
      type: Date,
    },
    sentAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Offer', offerSchema);
