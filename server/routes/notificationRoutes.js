import express from 'express';
import Notification from '../models/Notification.js';
import Order from '../models/Order.js';
import Patient from '../models/Patient.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/notifications - Get user's notifications
router.get('/', protect, async (req, res) => {
  try {
    const notifications = await Notification.find({
      recipientId: req.user._id,
      recipientModel: 'Patient'
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
    const notification = await Notification.findOne({
      _id: req.params.id,
      recipientId: req.user._id,
      recipientModel: 'Patient'
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
    await Notification.updateMany(
      {
        recipientId: req.user._id,
        recipientModel: 'Patient',
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
    const notification = await Notification.findOne({
      _id: req.params.id,
      recipientId: req.user._id,
      recipientModel: 'Patient'
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
