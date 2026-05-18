import mongoose from 'mongoose';

const orderMedicineSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  strength: { type: String, default: '' },
  unit: { type: String, default: '' },
  quantity: { type: Number, required: true, default: 1 },
  type: { type: String, enum: ['prescribed', 'custom'], default: 'prescribed' }
});

const orderSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    patientName: { type: String, required: true },
    pharmacyId: { type: Number, required: true },
    pharmacyName: { type: String, required: true },
    pharmacyAddress: { type: String, required: true },
    medicines: [orderMedicineSchema],
    prescription: { type: String, default: '' },
    notes: { type: String, default: '' },
    deliveryFee: { type: String, required: true },
    estimatedDelivery: { type: String, required: true },
    totalItems: { type: Number, required: true },
    totalAmount: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'],
      default: 'pending'
    },
    cancelledAt: { type: Date },
    cancelledReason: { type: String, default: '' },
    orderDate: { type: Date, default: Date.now }
  },
  { 
    timestamps: true 
  }
);

// Only create indexes once - remove any duplicate index definitions
orderSchema.index({ userId: 1, orderDate: -1 });
// orderId already has unique: true, no need for additional index

export default mongoose.model('Order', orderSchema);