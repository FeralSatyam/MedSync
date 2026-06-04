import express from 'express';
import mongoose from 'mongoose';
import Notification from '../models/Notification.js';
import Order from '../models/Order.js';
import Patient from '../models/Patient.js';
import Offer from '../models/Offer.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/notifications - Get user's notifications (synchronized with Offers in-app channel)
router.get('/', protect, async (req, res) => {
  try {
    // 1. Find all patient profiles belonging to this user
    const patients = await Patient.find({ userId: req.user._id });
    const patientIds = patients.map((p) => p._id);

    // 2. Find all offers sent to these patients that have 'in_app' in channels
    const offers = await Offer.find({
      patientId: { $in: patientIds },
      channels: 'in_app',
    });

    // 3. Sync offers to notifications collection
    for (const offer of offers) {
      const existingNotif = await Notification.findOne({ offerId: offer._id });
      if (!existingNotif) {
        let pharmacist = null;
        try {
          pharmacist = await mongoose.connection.db
            .collection('pharmacists')
            .findOne({ _id: offer.pharmacistId });
        } catch (dbErr) {
          console.error('Error fetching pharmacist info:', dbErr);
        }

        await Notification.create({
          recipientId: offer.patientId, // Use patient ID here as the recipient
          recipientModel: 'Patient',
          type: 'offer',
          title: offer.title,
          message: offer.shortMessage || offer.fullMessage,
          offerId: offer._id,
          patientId: offer.patientId,
          pharmacyName: pharmacist?.pharmacyName || 'Partner Pharmacy',
          pharmacyAddress: pharmacist?.address || '',
          pharmacyPhone: pharmacist?.phone || '',
          offerTitle: offer.title,
          offerMessage: offer.fullMessage || offer.shortMessage,
          medicineName: offer.medicineName,
          discountPercent: offer.discountPercent,
          offerType: offer.offerType,
          expiresAt: offer.expiresAt,
          read: false,
        });
      }
    }

    // 4. Fetch and return all notifications for the user's patients
    const notifications = await Notification.find({
      $or: [
        { recipientId: { $in: patientIds }, recipientModel: 'Patient' },
        { patientId: { $in: patientIds } }
      ]
    }).sort({ createdAt: -1 });

    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
});

// PUT /api/notifications/:id/read - Mark notification as read
router.put('/:id/read', protect, async (req, res) => {
  try {
    // Ensure the notification belongs to one of the authenticated user's patients
    const patients = await Patient.find({ userId: req.user._id });
    const patientIds = patients.map((p) => p._id);

    const notification = await Notification.findOne({
      _id: req.params.id,
      $or: [
        { recipientId: { $in: patientIds }, recipientModel: 'Patient' },
        { patientId: { $in: patientIds } }
      ]
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    notification.read = true;
    notification.readAt = new Date();
    await notification.save();

    res.json(notification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Failed to mark notification as read' });
  }
});

// PUT /api/notifications/mark-all-read - Mark all notifications as read
router.put('/mark-all-read', protect, async (req, res) => {
  try {
    // Mark all notifications for this user's patients as read
    const patients = await Patient.find({ userId: req.user._id });
    const patientIds = patients.map((p) => p._id);

    await Notification.updateMany(
      {
        $or: [
          { recipientId: { $in: patientIds }, recipientModel: 'Patient' },
          { patientId: { $in: patientIds } }
        ],
        read: false
      },
      {
        read: true,
        readAt: new Date()
      }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ message: 'Failed to mark all notifications as read' });
  }
});

// PUT /api/notifications/:id/place-order - Place order from offer notification
router.put('/:id/place-order', protect, async (req, res) => {
  try {
    // Ensure the notification belongs to one of the authenticated user's patients
    const patients = await Patient.find({ userId: req.user._id });
    const patientIds = patients.map((p) => p._id);

    const notification = await Notification.findOne({
      _id: req.params.id,
      $or: [
        { recipientId: { $in: patientIds }, recipientModel: 'Patient' },
        { patientId: { $in: patientIds } }
      ]
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    if (notification.orderPlaced) {
      return res.status(400).json({ message: 'Order already placed for this offer' });
    }

    if (notification.expiresAt && new Date(notification.expiresAt) < new Date()) {
      return res.status(400).json({ message: 'This offer has expired' });
    }

    // Find patient record
    const patient = await Patient.findOne({ userId: req.user._id });
    if (!patient) {
      return res.status(404).json({ message: 'Patient record not found' });
    }

    // Create order
    const order = await Order.create({
      userId: req.user._id,
      orderId: 'ORD' + Date.now(),
      pharmacyName: notification.pharmacyName,
      pharmacyAddress: notification.pharmacyAddress,
      patientId: patient._id,
      patientName: patient.name,
      medicines: [{
        name: notification.medicineName,
        quantity: 1,
        type: 'offer'
      }],
      notes: notification.offerMessage,
      status: 'pending',
      deliveryFee: 'To be confirmed',
      estimatedDelivery: 'Contact pharmacy',
      totalItems: 1,
      totalAmount: 'Discounted price',
      orderDate: new Date()
    });

    // Update notification
    notification.orderPlaced = true;
    notification.orderPlacedAt = new Date();
    await notification.save();

    res.json({
      success: true,
      orderId: order.orderId,
      order
    });
  } catch (error) {
    console.error('Error placing order from notification:', error);
    res.status(500).json({ message: 'Failed to place order' });
  }
});

export default router;
