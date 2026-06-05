import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MobileBottomNav from '../components/MobileBottomNav';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import toast from 'react-hot-toast';
import { getPatients } from '../api/patientApi';
import { getMedicinesForPatient } from '../api/medicineApi';
import { createOrder, getUserOrders, cancelOrder } from '../api/orderApi';
import { getNotifications, markNotificationAsRead } from '../api/notificationApi';
import { useAuthStore } from '../store/authStore';

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker icons
const userLocationIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const pharmacyIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const selectedPharmacyIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Component to center map
function MapCenterUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, 14);
    }
  }, [center, map]);
  return null;
}

// SVG Icons
const Icons = {
  Location: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7z"/>
      <circle cx="12" cy="9" r="3"/>
    </svg>
  ),
  Clock: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 6v6l4 2"/>
    </svg>
  ),
  Star: ({ filled = false }) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5">
      <path d="M12 2l3.1 6.3L22 9.3l-4.5 4.4 1.1 6.3L12 17.2l-6.6 3.5 1.1-6.3L2 9.3l6.9-1L12 2z"/>
    </svg>
  ),
  Cart: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="9" cy="20" r="1.5"/>
      <circle cx="18" cy="20" r="1.5"/>
      <path d="M3 4h3l2 12h12l2-8H7"/>
    </svg>
  ),
  Close: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 6L6 18M6 6L18 18"/>
    </svg>
  ),
  ArrowLeft: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M15 18L9 12L15 6"/>
    </svg>
  ),
  Plus: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 5v14M5 12h14"/>
    </svg>
  ),
  Minus: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 12h14"/>
    </svg>
  ),
  Trash: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 7h16M10 11v6M14 11v6M5 7l1 13a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-13M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3"/>
    </svg>
  ),
  Package: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 7l-8-4-8 4m16 0v10l-8 4-8-4V7m8-4v18"/>
    </svg>
  ),
  Eye: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  Check: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M20 6L9 17L4 12"/>
    </svg>
  ),
  Truck: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
    </svg>
  ),
};

// Mock pharmacy data
const MOCK_PHARMACIES = [
  {
    id: 1,
    name: "MedLife Pharmacy",
    address: "Baneshwor, Kathmandu",
    lat: 27.6866,
    lng: 85.3374,
    phone: "+977-1-1234567",
    rating: 4.5,
    reviews: 128,
    openingHours: "8:00 AM - 9:00 PM",
    distance: "0.8 km",
    deliveryTime: "20-30 min",
    deliveryFee: "Rs. 50",
  },
  {
    id: 2,
    name: "Lumbini Medical Hall",
    address: "New Baneshwor, Kathmandu",
    lat: 27.6787,
    lng: 85.3394,
    phone: "+977-1-2345678",
    rating: 4.2,
    reviews: 95,
    openingHours: "7:00 AM - 10:00 PM",
    distance: "1.2 km",
    deliveryTime: "25-35 min",
    deliveryFee: "Rs. 60",
  },
  {
    id: 3,
    name: "Siddhartha Pharmacy",
    address: "Gairidhara, Kathmandu",
    lat: 27.7125,
    lng: 85.3245,
    phone: "+977-1-3456789",
    rating: 4.8,
    reviews: 210,
    openingHours: "24 hours",
    distance: "2.1 km",
    deliveryTime: "35-45 min",
    deliveryFee: "Rs. 80",
  },
  {
    id: 4,
    name: "Himalayan Pharmacy",
    address: "Thamel, Kathmandu",
    lat: 27.7162,
    lng: 85.3125,
    phone: "+977-1-4567890",
    rating: 4.3,
    reviews: 167,
    openingHours: "9:00 AM - 8:00 PM",
    distance: "2.5 km",
    deliveryTime: "40-50 min",
    deliveryFee: "Rs. 90",
  },
  {
    id: 5,
    name: "Patan Pharmacy",
    address: "Patan, Lalitpur",
    lat: 27.6644,
    lng: 85.3188,
    phone: "+977-1-5678901",
    rating: 4.6,
    reviews: 142,
    openingHours: "8:00 AM - 9:30 PM",
    distance: "3.0 km",
    deliveryTime: "45-55 min",
    deliveryFee: "Rs. 100",
  },
];

// Pharmacy Card Component
function PharmacyCard({ pharmacy, onSelect, onOrder, isSelected }) {
  return (
    <div
      className={`bg-white rounded-2xl p-4 border border-border transition-all cursor-pointer ${
        isSelected ? 'border-mint ring-2 ring-mint-light' : 'hover:border-mint'
      }`}
      onClick={() => onSelect(pharmacy)}
    >
      <div className="flex gap-3">
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold text-navy">{pharmacy.name}</h3>
              <div className="flex items-center gap-1 mt-1">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Icons.Star key={i} filled={i < Math.floor(pharmacy.rating)} />
                  ))}
                </div>
                <span className="text-xs text-muted">({pharmacy.reviews})</span>
              </div>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onOrder(pharmacy); }}
              className="bg-mint text-white rounded-full px-5 py-2.5 text-sm font-semibold hover:opacity-90 flex items-center gap-1"
            >
              <Icons.Cart />
              Order
            </button>
          </div>
          <div className="mt-2 text-xs text-muted space-y-1">
            <div className="flex items-center gap-1">
              <Icons.Location />
              <span>{pharmacy.address}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1"><Icons.Clock /> {pharmacy.openingHours}</span>
              <span>🚚 {pharmacy.deliveryTime}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const STATUS_STEPS = [
  { key: 'pending',          label: 'Order Placed',     desc: 'Your order has been received',        Icon: Icons.Clock   },
  { key: 'confirmed',        label: 'Confirmed',         desc: 'Pharmacy confirmed your order',       Icon: Icons.Check   },
  { key: 'preparing',        label: 'Preparing',         desc: 'Pharmacy is packing your medicines',  Icon: Icons.Package },
  { key: 'out_for_delivery', label: 'Out for Delivery',  desc: 'Your order is on the way',            Icon: Icons.Truck   },
  { key: 'delivered',        label: 'Delivered',         desc: 'Your order has been delivered',       Icon: Icons.Check   },
];

const STATUS_LABEL = {
  pending:          { text: 'Pending',         cls: 'bg-amber-light text-amber' },
  confirmed:        { text: 'Confirmed',        cls: 'bg-mint-light text-mint'   },
  preparing:        { text: 'Preparing',        cls: 'bg-mint-light text-mint'   },
  out_for_delivery: { text: 'Out for Delivery', cls: 'bg-amber-light text-amber' },
  delivered:        { text: 'Delivered',        cls: 'bg-mint-light text-mint'   },
  cancelled:        { text: 'Cancelled',        cls: 'bg-red-light text-red'     },
};

// Order Details Modal Component
function OrderDetailsModal({ order, onClose, onCancel }) {
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const isCancelled = order.status === 'cancelled';
  const isCancellable = !isCancelled && order.status !== 'delivered';
  const currentStep = STATUS_STEPS.findIndex((s) => s.key === order.status);
  const sl = STATUS_LABEL[order.status] || { text: order.status, cls: 'bg-faint text-muted' };

  const handleCancelConfirm = () => {
    if (!cancelReason.trim()) {
      toast.error('Please provide a reason for cancellation');
      return;
    }
    onCancel(order.orderId, cancelReason);
    setShowCancelConfirm(false);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-navy/30 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-white rounded-2xl border border-border max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>

          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-border px-5 py-4 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-navy">Order Details</h2>
              <p className="text-xs text-muted mt-0.5">{order.orderId}</p>
            </div>
            <button onClick={onClose} className="p-1 text-muted hover:text-navy rounded-lg">
              <Icons.Close />
            </button>
          </div>

          <div className="p-5 space-y-5">

            {/* Current Status Banner */}
            {isCancelled ? (
              <div className="bg-red-light border border-red rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <svg className="w-4 h-4 text-red shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <p className="font-semibold text-red text-sm">Order Cancelled</p>
                </div>
                {order.cancelledReason && (
                  <p className="text-xs text-red ml-6">Reason: {order.cancelledReason}</p>
                )}
                {order.cancelledAt && (
                  <p className="text-xs text-red ml-6 mt-0.5">On {new Date(order.cancelledAt).toLocaleString()}</p>
                )}
              </div>
            ) : (
              <div className="bg-faint rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted mb-1">Current Status</p>
                  <span className={`text-sm font-bold px-3 py-1 rounded-full ${sl.cls}`}>{sl.text}</span>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted">Updated by pharmacy</p>
                  <p className="text-xs text-navy font-medium mt-0.5">{order.pharmacyName}</p>
                </div>
              </div>
            )}

            {/* Status Timeline */}
            {!isCancelled && (
              <div className="bg-white rounded-xl border border-border p-4">
                <p className="text-sm font-semibold text-navy mb-4">Order Progress</p>
                <div className="space-y-0">
                  {STATUS_STEPS.map((step, idx) => {
                    const isCompleted = idx <= currentStep;
                    const isCurrent = idx === currentStep;
                    const { Icon } = step;
                    return (
                      <div key={step.key} className="flex items-start gap-3">
                        <div className="flex flex-col items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all ${
                            isCompleted ? 'bg-mint text-white' : 'bg-faint text-muted'
                          } ${isCurrent ? 'ring-4 ring-mint/20' : ''}`}>
                            <Icon />
                          </div>
                          {idx < STATUS_STEPS.length - 1 && (
                            <div className={`w-0.5 h-8 mt-0.5 ${idx < currentStep ? 'bg-mint' : 'bg-border'}`} />
                          )}
                        </div>
                        <div className="pb-3 pt-1 flex-1 min-w-0">
                          <p className={`text-sm font-semibold leading-tight ${isCompleted ? 'text-navy' : 'text-muted'}`}>
                            {step.label}
                            {isCurrent && (
                              <span className="ml-2 text-[10px] font-bold text-mint bg-mint-light px-2 py-0.5 rounded-full align-middle">Now</span>
                            )}
                          </p>
                          <p className="text-xs text-muted mt-0.5">{step.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Order Info */}
            <div className="bg-faint rounded-xl p-4 space-y-2 text-sm">
              <p className="font-semibold text-navy mb-1">Order Information</p>
              <div className="flex justify-between">
                <span className="text-muted">Pharmacy</span>
                <span className="font-medium text-navy">{order.pharmacyName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Patient</span>
                <span className="font-medium text-navy">{order.patientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Placed on</span>
                <span className="text-navy">{new Date(order.orderDate).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Delivery fee</span>
                <span className="font-medium text-navy">{order.deliveryFee}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Est. delivery</span>
                <span className="text-navy">{order.estimatedDelivery}</span>
              </div>
            </div>

            {/* Medicines */}
            <div>
              <p className="text-sm font-semibold text-navy mb-2">Medicines ({order.totalItems} {order.totalItems === 1 ? 'item' : 'items'})</p>
              <div className="space-y-2">
                {order.medicines.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center py-2 px-3 bg-faint rounded-xl">
                    <div>
                      <p className="text-sm font-medium text-navy">{item.name}</p>
                      {item.strength && <p className="text-xs text-muted">{item.strength} {item.unit}</p>}
                    </div>
                    <span className="text-xs font-semibold text-mint bg-mint-light px-2 py-0.5 rounded-full">×{item.quantity}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            {order.notes && (
              <div>
                <p className="text-sm font-semibold text-navy mb-1">Special Instructions</p>
                <p className="text-sm text-muted bg-faint p-3 rounded-xl">{order.notes}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-1">
              {isCancellable && (
                <button
                  onClick={() => setShowCancelConfirm(true)}
                  className="flex-1 border border-red bg-white text-red rounded-full px-5 py-2.5 text-sm font-semibold hover:bg-red-light"
                >
                  Cancel Order
                </button>
              )}
              <button
                onClick={onClose}
                className="flex-1 bg-mint text-white rounded-full px-5 py-2.5 text-sm font-semibold hover:opacity-90"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      {showCancelConfirm && (
        <div className="fixed inset-0 bg-navy/30 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowCancelConfirm(false)}>
          <div className="bg-white rounded-2xl border border-border max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-navy mb-4">Cancel Order</h3>
            <p className="text-muted mb-4">Are you sure you want to cancel this order?</p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-navy mb-1">Reason for cancellation</label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Please tell us why you're cancelling..."
                rows={3}
                className="rounded-xl border border-border bg-faint px-4 py-3 text-sm focus:outline-none focus:border-mint w-full"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 border border-border bg-white text-navy rounded-full px-5 py-2.5 text-sm font-semibold hover:bg-faint"
              >
                No, Keep Order
              </button>
              <button
                onClick={handleCancelConfirm}
                className="flex-1 border border-red bg-white text-red rounded-full px-5 py-2.5 text-sm font-semibold hover:bg-red-light"
              >
                Yes, Cancel Order
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Order Card Component
function OrderCard({ order, onViewDetails, onCancel }) {
  const statusColors = {
    pending: 'bg-amber-light text-amber border border-border',
    confirmed: 'bg-faint text-muted border border-border',
    preparing: 'bg-faint text-muted border border-border',
    out_for_delivery: 'bg-faint text-muted border border-border',
    delivered: 'bg-mint-light text-mint',
    cancelled: 'bg-red-light text-red',
  };

  const isCancelled = order.status === 'cancelled';
  const canCancel = !isCancelled && order.status !== 'delivered';

  return (
    <div className={`bg-white rounded-2xl p-4 border border-border transition-shadow ${isCancelled ? 'opacity-70' : ''}`}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <p className="text-xs text-muted">Order ID</p>
          <p className="font-semibold text-navy">{order.orderId}</p>
        </div>
        <span className={`rounded-full text-xs font-semibold px-2.5 py-0.5 ${statusColors[order.status]}`}>
          {order.status.replace('_', ' ')}
        </span>
      </div>

      <div className="mb-3">
        <p className="text-sm text-muted">{order.pharmacyName}</p>
        <p className="text-xs text-muted mt-1">{new Date(order.orderDate).toLocaleDateString()}</p>
      </div>

      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm font-medium text-navy">{order.totalItems} items</p>
          <p className="text-xs text-muted">{order.deliveryFee} delivery</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onViewDetails(order)}
            className="flex items-center gap-1 bg-mint text-white rounded-full px-5 py-2.5 text-sm font-semibold hover:opacity-90"
          >
            <Icons.Eye />
            View Details
          </button>
          {canCancel && (
            <button
              onClick={() => onCancel(order)}
              className="flex items-center gap-1 border border-red bg-white text-red rounded-full px-5 py-2.5 text-sm font-semibold hover:bg-red-light"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Order Success Modal
function OrderSuccessModal({ order, onClose }) {
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const orderUrl = `${window.location.origin}/order-tracking/${order.orderId}`;

  useEffect(() => {
    QRCode.toDataURL(orderUrl, { width: 200, margin: 1 }, (err, url) => {
      if (!err) {
        setQrCodeUrl(url);
      }
    });
  }, [orderUrl]);

  return (
    <div className="fixed inset-0 bg-navy/30 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl border border-border max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-border p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-navy">Order Placed Successfully!</h2>
          <button onClick={onClose} className="text-muted hover:text-navy">
            <Icons.Close />
          </button>
        </div>

        <div className="p-6 text-center">
          <div className="w-20 h-20 bg-mint-light rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-mint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h3 className="text-lg font-semibold text-navy mb-2">Order #{order.orderId}</h3>
          <p className="text-sm text-muted mb-4">Your order has been placed successfully!</p>

          <div className="bg-faint rounded-lg p-4 mb-4">
            <p className="text-sm font-medium text-navy mb-2">Order QR Code</p>
            {qrCodeUrl && (
              <img src={qrCodeUrl} alt="Order QR Code" className="w-48 h-48 mx-auto mb-2" />
            )}
            <p className="text-xs text-muted">Scan to view order details</p>
          </div>

          <button
            onClick={onClose}
            className="w-full bg-mint text-white rounded-full px-5 py-2.5 text-sm font-semibold hover:opacity-90"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// Order Modal Component
function OrderModal({ pharmacy, onClose, onSubmit }) {
  const navigate = useNavigate();
  const [selectedPatient, setSelectedPatient] = useState('');
  const [medicines, setMedicines] = useState([]);
  const [selectedMedicines, setSelectedMedicines] = useState({});
  const [medicineQuantities, setMedicineQuantities] = useState({});
  const [patients, setPatients] = useState([]);
  const [prescription, setPrescription] = useState(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMedicines, setLoadingMedicines] = useState(false);
  const [customMedicineName, setCustomMedicineName] = useState('');
  const [customMedicines, setCustomMedicines] = useState([]);

  const currentUser = useAuthStore((s) => s.user);
  const userId = currentUser?._id || currentUser?.id;

  useEffect(() => {
    loadPatients();
  }, []);

  useEffect(() => {
    if (selectedPatient) {
      loadMedicinesForPatient(selectedPatient);
    } else {
      setMedicines([]);
      setSelectedMedicines({});
      setMedicineQuantities({});
    }
  }, [selectedPatient]);

  const loadPatients = async () => {
    try {
      const patientsData = await getPatients();
      setPatients(patientsData);
    } catch (error) {
      console.error('Error loading patients:', error);
      toast.error('Failed to load patients');
    }
  };

  const loadMedicinesForPatient = async (patientId) => {
    setLoadingMedicines(true);
    try {
      const meds = await getMedicinesForPatient(patientId);
      setMedicines(meds);
      setSelectedMedicines({});
      setMedicineQuantities({});
    } catch (error) {
      console.error('Error loading medicines:', error);
      toast.error('Failed to load medicines for this patient');
      setMedicines([]);
    } finally {
      setLoadingMedicines(false);
    }
  };

  const handleMedicineToggle = (medicineId) => {
    setSelectedMedicines(prev => ({
      ...prev,
      [medicineId]: !prev[medicineId]
    }));

    if (!selectedMedicines[medicineId]) {
      setMedicineQuantities(prev => ({
        ...prev,
        [medicineId]: 1
      }));
    } else {
      setMedicineQuantities(prev => {
        const newQuantities = { ...prev };
        delete newQuantities[medicineId];
        return newQuantities;
      });
    }
  };

  const updateQuantity = (medicineId, delta) => {
    setMedicineQuantities(prev => ({
      ...prev,
      [medicineId]: Math.max(1, (prev[medicineId] || 1) + delta)
    }));
  };

  const addCustomMedicine = () => {
    if (!customMedicineName.trim()) {
      toast.error('Please enter a medicine name');
      return;
    }

    const newId = `custom_${Date.now()}`;
    setCustomMedicines(prev => [...prev, {
      id: newId,
      name: customMedicineName,
      isCustom: true,
      quantity: 1
    }]);
    setSelectedMedicines(prev => ({ ...prev, [newId]: true }));
    setMedicineQuantities(prev => ({ ...prev, [newId]: 1 }));
    setCustomMedicineName('');
    toast.success('Custom medicine added');
  };

  const removeCustomMedicine = (id) => {
    setCustomMedicines(prev => prev.filter(m => m.id !== id));
    setSelectedMedicines(prev => {
      const newSelected = { ...prev };
      delete newSelected[id];
      return newSelected;
    });
    setMedicineQuantities(prev => {
      const newQuantities = { ...prev };
      delete newQuantities[id];
      return newQuantities;
    });
  };

  const calculateTotal = () => {
    const deliveryFeeNum = parseInt(pharmacy.deliveryFee.replace('Rs. ', ''));
    return `Rs. ${deliveryFeeNum}`;
  };

  const handleSubmit = async () => {
    if (!selectedPatient) {
      toast.error('Please select a patient');
      return;
    }

    const selectedMeds = Object.keys(selectedMedicines).filter(key => selectedMedicines[key]);
    if (selectedMeds.length === 0) {
      toast.error('Please select at least one medicine');
      return;
    }

    if (!userId) {
      toast.error('Please log in to place an order');
      return;
    }

    setLoading(true);

    const selectedMedicineDetails = [
      ...medicines
        .filter(med => selectedMedicines[med._id])
        .map(med => ({
          id: med._id,
          name: med.name,
          strength: med.strength || '',
          unit: med.unit || '',
          quantity: medicineQuantities[med._id] || 1,
          type: 'prescribed'
        })),
      ...customMedicines
        .filter(med => selectedMedicines[med.id])
        .map(med => ({
          id: med.id,
          name: med.name,
          strength: '',
          unit: '',
          quantity: medicineQuantities[med.id] || 1,
          type: 'custom'
        }))
    ];

    const totalItems = selectedMedicineDetails.reduce((sum, item) => sum + item.quantity, 0);
    const deliveryFeeNum = parseInt(pharmacy.deliveryFee.replace('Rs. ', ''));

    const orderData = {
      orderId: `ORD${Date.now()}`,
      userId: userId,
      pharmacyId: pharmacy.id,
      pharmacyName: pharmacy.name,
      pharmacyAddress: pharmacy.address,
      patientId: selectedPatient,
      patientName: patients.find(p => p._id === selectedPatient)?.name,
      medicines: selectedMedicineDetails,
      prescription: prescription ? prescription.name : '',
      notes: notes,
      orderDate: new Date().toISOString(),
      status: 'pending',
      estimatedDelivery: pharmacy.deliveryTime,
      deliveryFee: pharmacy.deliveryFee,
      totalItems,
      totalAmount: `Rs. ${deliveryFeeNum}`
    };

    try {
      const savedOrder = await createOrder(orderData);
      toast.success(`Order placed successfully to ${pharmacy.name}!`);
      onSubmit(savedOrder);
      onClose();
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error(error.response?.data?.message || 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const totalSelectedCount = Object.keys(selectedMedicines).filter(key => selectedMedicines[key]).length;

  return (
    <div className="fixed inset-0 bg-navy/30 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl border border-border max-w-lg w-full max-h-[90vh] overflow-y-auto relative" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-border p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-navy">Order from {pharmacy.name}</h2>
          <button onClick={onClose} className="text-muted hover:text-navy">
            <Icons.Close />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-navy mb-1">Select Patient *</label>
            <select
              value={selectedPatient}
              onChange={(e) => setSelectedPatient(e.target.value)}
              className="rounded-xl border border-border bg-faint px-4 py-3 text-sm focus:outline-none focus:border-mint w-full"
            >
              <option value="">Select a patient</option>
              {patients.map(p => (
                <option key={p._id} value={p._id}>{p.name}</option>
              ))}
            </select>
          </div>

          {selectedPatient && (
            <div>
              <label className="block text-sm font-medium text-navy mb-2">
                Select Medicines *
                {loadingMedicines && <span className="ml-2 text-xs text-muted">Loading...</span>}
              </label>

              {loadingMedicines ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mint"></div>
                </div>
              ) : (
                <>
                  {medicines.length > 0 && (
                    <div className="space-y-2 max-h-48 overflow-y-auto border border-border rounded-xl p-2 mb-3">
                      <p className="text-xs font-semibold text-muted px-2 pt-1">Prescribed Medicines</p>
                      {medicines.map(med => (
                        <div key={med._id} className="flex items-center gap-3 p-2 hover:bg-faint rounded-xl">
                          <input
                            type="checkbox"
                            checked={selectedMedicines[med._id] || false}
                            onChange={() => handleMedicineToggle(med._id)}
                            className="w-4 h-4 text-mint rounded focus:ring-mint"
                          />
                          <div className="flex-1">
                            <p className="font-medium text-navy">{med.name}</p>
                            <p className="text-xs text-muted">
                              {med.strength}{med.unit} - Stock: {med.currentStock}
                            </p>
                          </div>
                          {selectedMedicines[med._id] && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => updateQuantity(med._id, -1)}
                                className="p-1 text-muted hover:text-mint"
                              >
                                <Icons.Minus />
                              </button>
                              <span className="w-8 text-center font-medium">{medicineQuantities[med._id] || 1}</span>
                              <button
                                onClick={() => updateQuantity(med._id, 1)}
                                className="p-1 text-muted hover:text-mint"
                              >
                                <Icons.Plus />
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {customMedicines.length > 0 && (
                    <div className="space-y-2 max-h-32 overflow-y-auto border border-border rounded-xl p-2 mb-3">
                      <p className="text-xs font-semibold text-muted px-2 pt-1">Custom Medicines</p>
                      {customMedicines.map(med => (
                        <div key={med.id} className="flex items-center gap-3 p-2 hover:bg-faint rounded-xl">
                          <input
                            type="checkbox"
                            checked={selectedMedicines[med.id] || false}
                            onChange={() => handleMedicineToggle(med.id)}
                            className="w-4 h-4 text-mint rounded focus:ring-mint"
                          />
                          <div className="flex-1">
                            <p className="font-medium text-navy">{med.name}</p>
                            <p className="text-xs text-muted">Custom added</p>
                          </div>
                          {selectedMedicines[med.id] && (
                            <>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => updateQuantity(med.id, -1)}
                                  className="p-1 text-muted hover:text-mint"
                                >
                                  <Icons.Minus />
                                </button>
                                <span className="w-8 text-center font-medium">{medicineQuantities[med.id] || 1}</span>
                                <button
                                  onClick={() => updateQuantity(med.id, 1)}
                                  className="p-1 text-muted hover:text-mint"
                                >
                                  <Icons.Plus />
                                </button>
                              </div>
                              <button
                                onClick={() => removeCustomMedicine(med.id)}
                                className="p-1 text-red hover:text-red"
                              >
                                <Icons.Trash />
                              </button>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2 mt-2">
                    <input
                      type="text"
                      value={customMedicineName}
                      onChange={(e) => setCustomMedicineName(e.target.value)}
                      placeholder="Add other medicine name..."
                      className="flex-1 rounded-xl border border-border bg-faint px-4 py-3 text-sm focus:outline-none focus:border-mint"
                    />
                    <button
                      onClick={addCustomMedicine}
                      className="px-3 py-2 bg-faint text-navy rounded-xl hover:bg-border transition-colors"
                    >
                      <Icons.Plus />
                    </button>
                  </div>

                  {medicines.length === 0 && customMedicines.length === 0 && (
                    <div className="text-center py-8 bg-faint rounded-xl">
                      <p className="text-muted">No medicines added</p>
                      <button
                        onClick={() => navigate('/add-medicine')}
                        className="mt-2 text-sm text-mint hover:underline"
                      >
                        Add Medicine
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-navy mb-1">Upload Prescription (Optional)</label>
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => setPrescription(e.target.files?.[0])}
              className="rounded-xl border border-border bg-faint px-4 py-3 text-sm focus:outline-none focus:border-mint w-full"
            />
            {prescription && (
              <p className="text-xs text-mint mt-1">✓ {prescription.name} selected</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-navy mb-1">Additional Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special instructions for the pharmacy..."
              rows={3}
              className="rounded-xl border border-border bg-faint px-4 py-3 text-sm focus:outline-none focus:border-mint w-full"
            />
          </div>

          <div className="bg-faint rounded-xl p-3">
            <p className="text-sm font-medium text-navy mb-2">Order Summary</p>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Items:</span>
                <span className="font-medium">{totalSelectedCount} items</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Delivery Fee:</span>
                <span className="font-medium">{pharmacy.deliveryFee}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-border">
                <span className="font-semibold">Total:</span>
                <span className="font-semibold text-mint">{calculateTotal()}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 border border-border bg-white text-navy rounded-full px-5 py-2.5 text-sm font-semibold hover:bg-faint">
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !selectedPatient || totalSelectedCount === 0}
              className="flex-1 bg-navy text-white rounded-full px-5 py-2.5 text-sm font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Placing Order...' : 'Place Order'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Offer Card ───────────────────────────────────────────────────────────────
function OfferCard({ offer, patientName, onAccept, onDismiss }) {
  const isExpired = offer.expiresAt && new Date(offer.expiresAt) < new Date();
  const daysLeft = offer.expiresAt
    ? Math.max(0, Math.ceil((new Date(offer.expiresAt) - new Date()) / 86400000))
    : null;

  return (
    <div className={`bg-white rounded-2xl border border-border overflow-hidden transition-all ${isExpired ? 'opacity-60' : 'hover:border-mint'}`}>
      {/* Header strip */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-2 min-w-0">
          {/* Pharmacy icon */}
          <div className="shrink-0 w-9 h-9 rounded-xl bg-mint-light flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00A878" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-navy truncate">{offer.pharmacyName || 'Partner Pharmacy'}</p>
            {offer.pharmacyAddress && (
              <p className="text-xs text-muted truncate">{offer.pharmacyAddress}</p>
            )}
          </div>
        </div>
        <button
          onClick={() => onDismiss(offer._id || offer.id)}
          className="shrink-0 ml-2 w-7 h-7 flex items-center justify-center rounded-full text-muted hover:bg-faint hover:text-navy transition-colors text-lg leading-none"
          title="Dismiss offer"
        >
          ×
        </button>
      </div>

      {/* Offer body */}
      <div className="px-4 pb-4 space-y-3">
        {/* Discount badge + medicine */}
        <div className="flex items-start gap-3">
          {offer.discountPercent > 0 && (
            <div className="shrink-0 bg-mint text-white text-xs font-bold px-2.5 py-1.5 rounded-xl leading-tight text-center">
              <span className="text-lg font-extrabold leading-none">{offer.discountPercent}%</span>
              <br />OFF
            </div>
          )}
          <div className="min-w-0">
            {offer.medicineName && (
              <p className="text-sm font-semibold text-navy">{offer.medicineName}</p>
            )}
            <p className="text-sm text-muted mt-0.5 leading-snug">
              {offer.offerMessage || offer.message}
            </p>
          </div>
        </div>

        {/* Meta row: patient + expiry */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-muted">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            <span>For <span className="font-medium text-navy">{patientName}</span></span>
          </div>
          {daysLeft !== null && (
            <span className={`font-semibold px-2 py-0.5 rounded-full ${
              isExpired
                ? 'bg-red-light text-red'
                : daysLeft <= 2
                  ? 'bg-amber-light text-amber'
                  : 'bg-faint text-muted'
            }`}>
              {isExpired ? 'Expired' : `${daysLeft}d left`}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={() => onDismiss(offer._id || offer.id)}
            className="flex-1 border border-border bg-white text-navy text-sm font-semibold py-2.5 rounded-full hover:bg-faint transition-colors"
          >
            Dismiss
          </button>
          <button
            onClick={() => onAccept(offer._id || offer.id)}
            disabled={isExpired}
            className="flex-[2] bg-navy text-white text-sm font-semibold py-2.5 rounded-full hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExpired ? 'Expired' : 'Accept & Order'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Get user's current location
function useUserLocation() {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLoading(false);
      setLocation({ lat: 27.6866, lng: 85.3374 });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setLoading(false);
      },
      () => {
        setLocation({ lat: 27.6866, lng: 85.3374 });
        setLoading(false);
      }
    );
  }, []);

  return { location, loading };
}

// Search Box Component
function SearchBox({ onLocationSelect }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const searchAddress = async (searchQuery) => {
    if (!searchQuery.trim()) return [];

    setLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=5&addressdetails=1`,
        { headers: { 'User-Agent': 'MedSync-App/1.0' } }
      );
      return await response.json();
    } catch (error) {
      console.error('Geocoding error:', error);
      toast.error('Failed to search location');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    const data = await searchAddress(query);
    setResults(data);
    setShowResults(true);
  };

  const selectLocation = (result) => {
    onLocationSelect({
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      name: result.display_name
    });
    setQuery('');
    setResults([]);
    setShowResults(false);
    toast.success(`📍 Moved to ${result.display_name.split(',')[0]}`);
  };

  return (
    <div className="relative mb-4 z-20">
      <form onSubmit={handleSearch} className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for a location..."
          className="rounded-xl border border-border bg-faint px-4 py-3 text-sm focus:outline-none focus:border-mint w-full pl-10 pr-20"
        />
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7"/>
            <path d="M16 16L21 21"/>
          </svg>
        </div>
        <button type="submit" className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-mint text-white rounded-full px-3 py-1 text-sm font-semibold hover:opacity-90">
          {loading ? '...' : 'Go'}
        </button>
      </form>

      {showResults && results.length > 0 && (
        <div className="absolute z-30 w-full mt-1 bg-white rounded-xl border border-border max-h-60 overflow-y-auto">
          {results.map((result) => (
            <button
              key={result.place_id}
              onClick={() => selectLocation(result)}
              className="w-full text-left px-4 py-2 hover:bg-faint border-b border-border last:border-none"
            >
              <p className="text-sm text-navy">{result.display_name}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Main Pharmacy Page Component
export default function PharmacyPage() {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState('orders'); // 'orders', 'offers', or 'pharmacies'
  const [selectedPharmacy, setSelectedPharmacy] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [orderPharmacy, setOrderPharmacy] = useState(null);
  const [placedOrder, setPlacedOrder] = useState(null);
  const [searchLocation, setSearchLocation] = useState(null);
  const [filteredPharmacies, setFilteredPharmacies] = useState(MOCK_PHARMACIES);
  const [searchTerm, setSearchTerm] = useState('');
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [cancellingOrder, setCancellingOrder] = useState(null);
  const [ordersActiveTab, setOrdersActiveTab] = useState('active'); // 'active', 'history', 'all'
  const [offers, setOffers] = useState([]);
  const [loadingOffers, setLoadingOffers] = useState(false);
  const [offerPatients, setOfferPatients] = useState([]);

  const { location: userLocation, loading: locationLoading } = useUserLocation();
  const [mapCenter, setMapCenter] = useState({ lat: 27.6866, lng: 85.3374 });

  const currentUser = useAuthStore((s) => s.user);
  const userId = currentUser?._id || currentUser?.id;

  // Load orders
  const loadOrders = async () => {
    setLoadingOrders(true);
    try {
      const data = await getUserOrders(userId);
      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading orders:', error);
      setOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [userId]);

  const loadOffers = async () => {
    setLoadingOffers(true);
    try {
      const [notifs, pats] = await Promise.all([getNotifications(), getPatients()]);
      const active = (Array.isArray(notifs) ? notifs : []).filter((n) => !n.read && !n.orderPlaced);
      setOffers(active);
      setOfferPatients(Array.isArray(pats) ? pats : []);
    } catch {
      setOffers([]);
    } finally {
      setLoadingOffers(false);
    }
  };

  useEffect(() => {
    loadOffers();
  }, []);

  const handleAcceptOffer = (notifId) => {
    navigate(`/place-order?notifId=${notifId}`);
  };

  const handleDismissOffer = async (notifId) => {
    setOffers((prev) => prev.filter((o) => (o._id || o.id) !== notifId));
    try {
      await markNotificationAsRead(notifId);
    } catch {
      toast.error('Could not dismiss offer');
    }
  };

  const getOfferPatientName = (patientId) => {
    if (!patientId) return 'Patient';
    const id = typeof patientId === 'object' ? String(patientId._id || patientId) : String(patientId);
    const p = offerPatients.find((pt) => String(pt._id || pt.id) === id);
    return p ? p.name.split(' ')[0] : 'Patient';
  };

  useEffect(() => {
    if (activeView === 'offers') loadOffers();
  }, [activeView]);

  useEffect(() => {
    if (searchLocation) {
      setMapCenter(searchLocation);
    } else if (userLocation) {
      setMapCenter(userLocation);
    }
  }, [userLocation, searchLocation]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = MOCK_PHARMACIES.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.address.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredPharmacies(filtered);
    } else {
      setFilteredPharmacies(MOCK_PHARMACIES);
    }
  }, [searchTerm]);

  const handleSelectPharmacy = (pharmacy) => {
    setSelectedPharmacy(pharmacy);
    setMapCenter({ lat: pharmacy.lat, lng: pharmacy.lng });
  };

  const handleOrder = (pharmacy) => {
    setOrderPharmacy(pharmacy);
    setShowOrderModal(true);
  };

  const handleOrderSubmit = (orderData) => {
    setShowOrderModal(false);
    setPlacedOrder(orderData);
    setShowSuccessModal(true);
    loadOrders(); // Reload orders after placing
  };

  const handleViewOrderDetails = (order) => {
    setSelectedOrder(order);
  };

  const handleCancelOrder = async (orderId, reason) => {
    try {
      await cancelOrder(orderId, reason);
      toast.success('Order cancelled successfully');
      await loadOrders();
      setCancellingOrder(null);
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast.error('Failed to cancel order');
    }
  };

  const handleCancelClick = (order) => {
    setCancellingOrder(order);
  };

  // Filter orders based on active tab
  const getFilteredOrders = () => {
    if (ordersActiveTab === 'active') {
      return orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled');
    } else if (ordersActiveTab === 'history') {
      return orders.filter(o => o.status === 'delivered' || o.status === 'cancelled');
    }
    return orders;
  };

  const filteredOrders = getFilteredOrders();

  return (
    <div className="min-h-screen bg-bg pb-24">
      {/* Header */}
      <div className="bg-white border-b border-border sticky top-0 z-40">
        <div className="flex items-center gap-3 px-4 h-16">
          <button onClick={() => navigate(-1)} className="p-2 text-navy hover:bg-faint rounded-xl transition-colors">
            <Icons.ArrowLeft />
          </button>
          <h1 className="text-xl font-bold text-navy">Orders</h1>
        </div>

        {/* Main Tab Navigation */}
        <div className="flex border-b border-border px-4">
          <button
            onClick={() => setActiveView('orders')}
            className={`px-4 py-2.5 text-sm font-medium transition-colors ${
              activeView === 'orders'
                ? 'text-mint border-b-2 border-mint'
                : 'text-muted hover:text-navy'
            }`}
          >
            My Orders
          </button>
          <button
            onClick={() => setActiveView('offers')}
            className={`px-4 py-2.5 text-sm font-medium transition-colors flex items-center gap-1.5 ${
              activeView === 'offers'
                ? 'text-mint border-b-2 border-mint'
                : 'text-muted hover:text-navy'
            }`}
          >
            Offers
            {offers.length > 0 && (
              <span className="min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-mint text-white text-[10px] font-bold leading-none">
                {offers.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveView('pharmacies')}
            className={`px-4 py-2.5 text-sm font-medium transition-colors ${
              activeView === 'pharmacies'
                ? 'text-mint border-b-2 border-mint'
                : 'text-muted hover:text-navy'
            }`}
          >
            Nearby Pharmacy
          </button>
        </div>
      </div>

      {/* Pharmacies View */}
      {activeView === 'pharmacies' && (
        <div className="max-w-7xl mx-auto px-4 py-6">
          <SearchBox onLocationSelect={setSearchLocation} />

          <div className="mb-4">
            <input
              type="text"
              placeholder="Filter pharmacies by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="rounded-xl border border-border bg-faint px-4 py-3 text-sm focus:outline-none focus:border-mint w-full"
            />
          </div>

          <div className="mb-6 rounded-2xl border border-border overflow-hidden relative" style={{ height: '400px', zIndex: 1 }}>
            {locationLoading ? (
              <div className="w-full h-full flex items-center justify-center bg-faint">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mint"></div>
                <span className="ml-2 text-muted">Getting your location...</span>
              </div>
            ) : (
              <MapContainer
                center={mapCenter}
                zoom={14}
                style={{ height: '100%', width: '100%', zIndex: 1 }}
                scrollWheelZoom={true}
              >
                <MapCenterUpdater center={mapCenter} />
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {userLocation && (
                  <Marker position={[userLocation.lat, userLocation.lng]} icon={userLocationIcon}>
                    <Popup>Your Location</Popup>
                  </Marker>
                )}
                {filteredPharmacies.map((pharmacy) => (
                  <Marker
                    key={pharmacy.id}
                    position={[pharmacy.lat, pharmacy.lng]}
                    icon={selectedPharmacy?.id === pharmacy.id ? selectedPharmacyIcon : pharmacyIcon}
                    eventHandlers={{ click: () => handleSelectPharmacy(pharmacy) }}
                  >
                    <Popup>
                      <div className="p-2 min-w-[200px]">
                        <h3 className="font-semibold text-navy">{pharmacy.name}</h3>
                        <p className="text-xs text-muted mt-1">{pharmacy.address}</p>
                        <div className="flex gap-2 mt-3">
                          <button onClick={() => handleOrder(pharmacy)} className="flex-1 bg-mint text-white rounded-full px-3 py-1.5 text-xs font-semibold hover:opacity-90">Order Now</button>
                          <button onClick={() => window.open(`https://www.openstreetmap.org/directions?to=${pharmacy.lat},${pharmacy.lng}`)} className="flex-1 border border-border bg-white text-navy rounded-full px-3 py-1.5 text-xs font-semibold hover:bg-faint">Directions</button>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            )}
          </div>

          <div>
            <h2 className="font-semibold text-navy text-lg mb-4">
              Pharmacies Near You
              <span className="text-sm text-muted ml-2">({filteredPharmacies.length} found)</span>
            </h2>
            <div className="space-y-3">
              {filteredPharmacies.map((pharmacy) => (
                <PharmacyCard
                  key={pharmacy.id}
                  pharmacy={pharmacy}
                  onSelect={handleSelectPharmacy}
                  onOrder={handleOrder}
                  isSelected={selectedPharmacy?.id === pharmacy.id}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Offers View ──────────────────────────────────────────────────── */}
      {activeView === 'offers' && (
        <div className="max-w-lg mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-navy">Pharmacy Offers</h2>
              <p className="text-sm text-muted mt-0.5">Offers sent to you by linked pharmacists</p>
            </div>
            {!loadingOffers && offers.length > 0 && (
              <button
                onClick={async () => {
                  const ids = offers.map((o) => o._id || o.id);
                  setOffers([]);
                  try {
                    await Promise.all(ids.map((id) => markNotificationAsRead(id)));
                  } catch {
                    toast.error('Could not dismiss all offers');
                  }
                }}
                className="text-xs text-muted hover:text-red transition-colors font-medium"
              >
                Dismiss all
              </button>
            )}
          </div>

          {loadingOffers ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mint" />
            </div>
          ) : offers.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-border">
              <div className="w-16 h-16 bg-mint-light rounded-full flex items-center justify-center mx-auto mb-4">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00A878" strokeWidth="1.5">
                  <path d="M20 12V22H4V12"/>
                  <path d="M22 7H2v5h20V7z"/>
                  <path d="M12 22V7"/>
                  <path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z"/>
                  <path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/>
                </svg>
              </div>
              <p className="text-navy font-semibold mb-1">No offers yet</p>
              <p className="text-muted text-sm">Offers sent by your pharmacist will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {offers.map((offer) => (
                <OfferCard
                  key={offer._id || offer.id}
                  offer={offer}
                  patientName={getOfferPatientName(offer.patientId)}
                  onAccept={handleAcceptOffer}
                  onDismiss={handleDismissOffer}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Orders View with Tabs */}
      {activeView === 'orders' && (
        <div className="max-w-2xl mx-auto px-4 py-6">
          {/* Orders Sub-tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setOrdersActiveTab('active')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                ordersActiveTab === 'active'
                  ? 'bg-mint text-white'
                  : 'bg-faint text-muted hover:bg-border'
              }`}
            >
              Active Orders
            </button>
            <button
              onClick={() => setOrdersActiveTab('history')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                ordersActiveTab === 'history'
                  ? 'bg-mint text-white'
                  : 'bg-faint text-muted hover:bg-border'
              }`}
            >
              Order History
            </button>
            <button
              onClick={() => setOrdersActiveTab('all')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                ordersActiveTab === 'all'
                  ? 'bg-mint text-white'
                  : 'bg-faint text-muted hover:bg-border'
              }`}
            >
              All Orders
            </button>
          </div>

          {loadingOrders ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mint"></div>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-border">
              <div className="w-20 h-20 bg-faint rounded-full flex items-center justify-center mx-auto mb-4">
                <Icons.Package />
              </div>
              <h3 className="text-navy font-semibold mb-2">
                {ordersActiveTab === 'active' ? 'No active orders' : ordersActiveTab === 'history' ? 'No order history' : 'No orders yet'}
              </h3>
              <p className="text-muted text-sm mb-4">
                {ordersActiveTab === 'active' ? 'Your active orders will appear here' : 'Your order history will appear here'}
              </p>
              <button
                onClick={() => setActiveView('pharmacies')}
                className="bg-navy text-white rounded-full px-5 py-2.5 text-sm font-semibold hover:opacity-90"
              >
                Browse Pharmacies
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredOrders.map((order) => (
                <OrderCard
                  key={order.orderId}
                  order={order}
                  onViewDetails={handleViewOrderDetails}
                  onCancel={handleCancelClick}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {showOrderModal && orderPharmacy && (
        <OrderModal
          pharmacy={orderPharmacy}
          onClose={() => setShowOrderModal(false)}
          onSubmit={handleOrderSubmit}
        />
      )}

      {showSuccessModal && placedOrder && (
        <OrderSuccessModal
          order={placedOrder}
          onClose={() => setShowSuccessModal(false)}
        />
      )}

      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onCancel={handleCancelOrder}
        />
      )}

      {cancellingOrder && (
        <div className="fixed inset-0 bg-navy/30 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setCancellingOrder(null)}>
          <div className="bg-white rounded-2xl border border-border max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-navy mb-4">Cancel Order</h3>
            <p className="text-muted mb-4">Are you sure you want to cancel order <strong>{cancellingOrder.orderId}</strong>?</p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-navy mb-1">Reason for cancellation</label>
              <textarea
                value={cancellingOrder.cancelReason || ''}
                onChange={(e) => setCancellingOrder({ ...cancellingOrder, cancelReason: e.target.value })}
                placeholder="Please tell us why you're cancelling..."
                rows={3}
                className="rounded-xl border border-border bg-faint px-4 py-3 text-sm focus:outline-none focus:border-mint w-full"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setCancellingOrder(null)}
                className="flex-1 border border-border bg-white text-navy rounded-full px-5 py-2.5 text-sm font-semibold hover:bg-faint"
              >
                No, Keep Order
              </button>
              <button
                onClick={() => handleCancelOrder(cancellingOrder.orderId, cancellingOrder.cancelReason || 'User requested cancellation')}
                className="flex-1 border border-red bg-white text-red rounded-full px-5 py-2.5 text-sm font-semibold hover:bg-red-light"
              >
                Yes, Cancel Order
              </button>
            </div>
          </div>
        </div>
      )}
      <MobileBottomNav />
    </div>
  );
}
