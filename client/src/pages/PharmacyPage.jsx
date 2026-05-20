import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import toast from 'react-hot-toast';
import { getPatients } from '../api/patientApi';
import { getMedicinesForPatient } from '../api/medicineApi';
import { createOrder, getUserOrders, cancelOrder } from '../api/orderApi';
import { useAuthStore } from '../store/authStore';
import QRCode from 'qrcode';

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
      className={`bg-white rounded-xl p-4 shadow-sm border transition-all cursor-pointer ${
        isSelected ? 'border-teal-500 ring-2 ring-teal-200' : 'border-gray-100 hover:shadow-md'
      }`}
      onClick={() => onSelect(pharmacy)}
    >
      <div className="flex gap-3">
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold text-gray-800">{pharmacy.name}</h3>
              <div className="flex items-center gap-1 mt-1">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Icons.Star key={i} filled={i < Math.floor(pharmacy.rating)} />
                  ))}
                </div>
                <span className="text-xs text-gray-500">({pharmacy.reviews})</span>
              </div>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onOrder(pharmacy); }}
              className="px-3 py-1.5 bg-teal-500 text-white rounded-lg text-xs font-medium hover:bg-teal-600 transition-colors flex items-center gap-1"
            >
              <Icons.Cart />
              Order
            </button>
          </div>
          <div className="mt-2 text-xs text-gray-500 space-y-1">
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

// Order Details Modal Component
function OrderDetailsModal({ order, onClose, onCancel }) {
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const orderUrl = `${window.location.origin}/order-tracking/${order.orderId}`;

  useEffect(() => {
    QRCode.toDataURL(orderUrl, { width: 200, margin: 1 }, (err, url) => {
      if (!err) {
        setQrCodeUrl(url);
      }
    });
  }, [orderUrl]);

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    preparing: 'bg-purple-100 text-purple-800',
    out_for_delivery: 'bg-orange-100 text-orange-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  const handleCancelConfirm = () => {
    if (!cancelReason.trim()) {
      toast.error('Please provide a reason for cancellation');
      return;
    }
    onCancel(order.orderId, cancelReason);
    setShowCancelConfirm(false);
    onClose();
  };

  const isCancellable = order.status !== 'delivered' && order.status !== 'cancelled';

  return (
    <>
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
        <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-xl" onClick={(e) => e.stopPropagation()}>
          <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800">Order Details</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <Icons.Close />
            </button>
          </div>
          
          <div className="p-4 space-y-4">
            {order.status === 'cancelled' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm font-medium text-red-800">Order Cancelled</p>
                <p className="text-xs text-red-600 mt-1">Reason: {order.cancelledReason || 'User requested cancellation'}</p>
              </div>
            )}

            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-sm font-medium text-gray-700 mb-2">Order QR Code</p>
              {qrCodeUrl && (
                <img src={qrCodeUrl} alt="Order QR Code" className="w-40 h-40 mx-auto mb-2" />
              )}
              <p className="text-xs text-gray-500">Scan to track your order</p>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Order Information</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Order ID:</span>
                  <span className="font-medium">{order.orderId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                    {order.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Pharmacy:</span>
                  <span className="font-medium">{order.pharmacyName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Patient:</span>
                  <span className="font-medium">{order.patientName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date:</span>
                  <span>{new Date(order.orderDate).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Medicines ({order.totalItems} items)</p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {order.medicines.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center py-2 border-b last:border-0">
                    <div>
                      <p className="font-medium text-gray-800">{item.name}</p>
                      <p className="text-xs text-gray-500">Quantity: {item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm font-medium text-gray-700 mb-2">Delivery Information</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Delivery Fee:</span>
                  <span className="font-medium">{order.deliveryFee}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Est. Delivery:</span>
                  <span>{order.estimatedDelivery}</span>
                </div>
              </div>
            </div>

            {order.notes && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Special Instructions</p>
                <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded-lg">{order.notes}</p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              {isCancellable && (
                <button
                  onClick={() => setShowCancelConfirm(true)}
                  className="flex-1 border border-red-300 text-red-600 rounded-lg py-2.5 font-medium hover:bg-red-50"
                >
                  Cancel Order
                </button>
              )}
              <button
                onClick={onClose}
                className="flex-1 bg-teal-500 text-white rounded-lg py-2.5 font-medium hover:bg-teal-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      {showCancelConfirm && (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-black/50" onClick={() => setShowCancelConfirm(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-gray-800 mb-4">Cancel Order</h3>
            <p className="text-gray-600 mb-4">Are you sure you want to cancel this order?</p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason for cancellation</label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Please tell us why you're cancelling..."
                rows={3}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 border border-gray-200 rounded-lg py-2.5 text-gray-700 font-medium hover:bg-gray-50"
              >
                No, Keep Order
              </button>
              <button
                onClick={handleCancelConfirm}
                className="flex-1 bg-red-500 text-white rounded-lg py-2.5 font-medium hover:bg-red-600"
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
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    preparing: 'bg-purple-100 text-purple-800',
    out_for_delivery: 'bg-orange-100 text-orange-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  const isCancelled = order.status === 'cancelled';
  const canCancel = !isCancelled && order.status !== 'delivered';

  return (
    <div className={`bg-white rounded-xl p-4 shadow-sm border ${isCancelled ? 'border-red-100 opacity-70' : 'border-gray-100 hover:shadow-md'} transition-shadow`}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <p className="text-xs text-gray-500">Order ID</p>
          <p className="font-semibold text-gray-800">{order.orderId}</p>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
          {order.status.replace('_', ' ')}
        </span>
      </div>
      
      <div className="mb-3">
        <p className="text-sm text-gray-600">{order.pharmacyName}</p>
        <p className="text-xs text-gray-400 mt-1">{new Date(order.orderDate).toLocaleDateString()}</p>
      </div>
      
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm font-medium text-gray-800">{order.totalItems} items</p>
          <p className="text-xs text-gray-500">{order.deliveryFee} delivery</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onViewDetails(order)}
            className="flex items-center gap-1 px-3 py-1.5 bg-teal-500 text-white rounded-lg text-xs font-medium hover:bg-teal-600"
          >
            <Icons.Eye />
            View Details
          </button>
          {canCancel && (
            <button
              onClick={() => onCancel(order)}
              className="flex items-center gap-1 px-3 py-1.5 border border-red-300 text-red-600 rounded-lg text-xs font-medium hover:bg-red-50"
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
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">Order Placed Successfully!</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <Icons.Close />
          </button>
        </div>
        
        <div className="p-6 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Order #{order.orderId}</h3>
          <p className="text-sm text-gray-500 mb-4">Your order has been placed successfully!</p>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Order QR Code</p>
            {qrCodeUrl && (
              <img src={qrCodeUrl} alt="Order QR Code" className="w-48 h-48 mx-auto mb-2" />
            )}
            <p className="text-xs text-gray-500">Scan to view order details</p>
          </div>
          
          <button
            onClick={onClose}
            className="w-full bg-teal-500 text-white py-2.5 rounded-lg font-medium hover:bg-teal-600"
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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl relative z-[10000]" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">Order from {pharmacy.name}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <Icons.Close />
          </button>
        </div>
        
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Patient *</label>
            <select
              value={selectedPatient}
              onChange={(e) => setSelectedPatient(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">Select a patient</option>
              {patients.map(p => (
                <option key={p._id} value={p._id}>{p.name}</option>
              ))}
            </select>
          </div>

          {selectedPatient && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Medicines *
                {loadingMedicines && <span className="ml-2 text-xs text-gray-400">Loading...</span>}
              </label>
              
              {loadingMedicines ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
                </div>
              ) : (
                <>
                  {medicines.length > 0 && (
                    <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2 mb-3">
                      <p className="text-xs font-semibold text-gray-500 px-2 pt-1">Prescribed Medicines</p>
                      {medicines.map(med => (
                        <div key={med._id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg">
                          <input
                            type="checkbox"
                            checked={selectedMedicines[med._id] || false}
                            onChange={() => handleMedicineToggle(med._id)}
                            className="w-4 h-4 text-teal-500 rounded focus:ring-teal-500"
                          />
                          <div className="flex-1">
                            <p className="font-medium text-gray-800">{med.name}</p>
                            <p className="text-xs text-gray-500">
                              {med.strength}{med.unit} - Stock: {med.currentStock}
                            </p>
                          </div>
                          {selectedMedicines[med._id] && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => updateQuantity(med._id, -1)}
                                className="p-1 text-gray-500 hover:text-teal-500"
                              >
                                <Icons.Minus />
                              </button>
                              <span className="w-8 text-center font-medium">{medicineQuantities[med._id] || 1}</span>
                              <button
                                onClick={() => updateQuantity(med._id, 1)}
                                className="p-1 text-gray-500 hover:text-teal-500"
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
                    <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-2 mb-3">
                      <p className="text-xs font-semibold text-gray-500 px-2 pt-1">Custom Medicines</p>
                      {customMedicines.map(med => (
                        <div key={med.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg">
                          <input
                            type="checkbox"
                            checked={selectedMedicines[med.id] || false}
                            onChange={() => handleMedicineToggle(med.id)}
                            className="w-4 h-4 text-teal-500 rounded focus:ring-teal-500"
                          />
                          <div className="flex-1">
                            <p className="font-medium text-gray-800">{med.name}</p>
                            <p className="text-xs text-gray-500">Custom added</p>
                          </div>
                          {selectedMedicines[med.id] && (
                            <>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => updateQuantity(med.id, -1)}
                                  className="p-1 text-gray-500 hover:text-teal-500"
                                >
                                  <Icons.Minus />
                                </button>
                                <span className="w-8 text-center font-medium">{medicineQuantities[med.id] || 1}</span>
                                <button
                                  onClick={() => updateQuantity(med.id, 1)}
                                  className="p-1 text-gray-500 hover:text-teal-500"
                                >
                                  <Icons.Plus />
                                </button>
                              </div>
                              <button
                                onClick={() => removeCustomMedicine(med.id)}
                                className="p-1 text-red-500 hover:text-red-700"
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
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    <button
                      onClick={addCustomMedicine}
                      className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <Icons.Plus />
                    </button>
                  </div>

                  {medicines.length === 0 && customMedicines.length === 0 && (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <p className="text-gray-500">No medicines added</p>
                      <button
                        onClick={() => navigate('/add-medicine')}
                        className="mt-2 text-sm text-teal-500 hover:underline"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Upload Prescription (Optional)</label>
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => setPrescription(e.target.files?.[0])}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
            />
            {prescription && (
              <p className="text-xs text-green-600 mt-1">✓ {prescription.name} selected</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special instructions for the pharmacy..."
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm font-medium text-gray-700 mb-2">Order Summary</p>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Items:</span>
                <span className="font-medium">{totalSelectedCount} items</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Delivery Fee:</span>
                <span className="font-medium">{pharmacy.deliveryFee}</span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="font-semibold">Total:</span>
                <span className="font-semibold text-teal-600">{calculateTotal()}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 border border-gray-200 rounded-lg py-2.5 text-gray-700 font-medium hover:bg-gray-50">
              Cancel
            </button>
            <button 
              onClick={handleSubmit} 
              disabled={loading || !selectedPatient || totalSelectedCount === 0} 
              className="flex-1 bg-teal-500 text-white rounded-lg py-2.5 font-medium hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Placing Order...' : 'Place Order'}
            </button>
          </div>
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
          className="w-full pl-10 pr-20 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7"/>
            <path d="M16 16L21 21"/>
          </svg>
        </div>
        <button type="submit" className="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1 bg-teal-500 text-white rounded-lg text-sm">
          {loading ? '...' : 'Go'}
        </button>
      </form>
      
      {showResults && results.length > 0 && (
        <div className="absolute z-30 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-60 overflow-y-auto">
          {results.map((result) => (
            <button
              key={result.place_id}
              onClick={() => selectLocation(result)}
              className="w-full text-left px-4 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-none"
            >
              <p className="text-sm text-gray-800">{result.display_name}</p>
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
  const [activeView, setActiveView] = useState('pharmacies'); // 'pharmacies' or 'orders'
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
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="flex items-center gap-3 px-4 h-16">
          <button onClick={() => navigate(-1)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <Icons.ArrowLeft />
          </button>
          <h1 className="text-xl font-bold text-gray-800">Pharmacy</h1>
        </div>
        
        {/* Main Tab Navigation */}
        <div className="flex border-b border-gray-100 px-4">
          <button
            onClick={() => setActiveView('pharmacies')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeView === 'pharmacies' 
                ? 'text-teal-600 border-b-2 border-teal-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Nearby Pharmacies
          </button>
          <button
            onClick={() => setActiveView('orders')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeView === 'orders' 
                ? 'text-teal-600 border-b-2 border-teal-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            My Orders
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
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="mb-6 rounded-xl overflow-hidden shadow-sm border border-gray-200 relative" style={{ height: '400px', zIndex: 1 }}>
            {locationLoading ? (
              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
                <span className="ml-2 text-gray-500">Getting your location...</span>
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
                        <h3 className="font-semibold text-gray-800">{pharmacy.name}</h3>
                        <p className="text-xs text-gray-500 mt-1">{pharmacy.address}</p>
                        <div className="flex gap-2 mt-3">
                          <button onClick={() => handleOrder(pharmacy)} className="flex-1 px-3 py-1.5 bg-teal-500 text-white rounded-lg text-xs">Order Now</button>
                          <button onClick={() => window.open(`https://www.openstreetmap.org/directions?to=${pharmacy.lat},${pharmacy.lng}`)} className="flex-1 px-3 py-1.5 border rounded-lg text-xs">Directions</button>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            )}
          </div>

          <div>
            <h2 className="font-semibold text-gray-800 text-lg mb-4">
              Pharmacies Near You
              <span className="text-sm text-gray-500 ml-2">({filteredPharmacies.length} found)</span>
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

      {/* Orders View with Tabs */}
      {activeView === 'orders' && (
        <div className="max-w-2xl mx-auto px-4 py-6">
          {/* Orders Sub-tabs */}
          <div className="flex gap-2 mb-6 border-b border-gray-200">
            <button
              onClick={() => setOrdersActiveTab('active')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                ordersActiveTab === 'active' 
                  ? 'text-teal-600 border-b-2 border-teal-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Active Orders
            </button>
            <button
              onClick={() => setOrdersActiveTab('history')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                ordersActiveTab === 'history' 
                  ? 'text-teal-600 border-b-2 border-teal-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Order History
            </button>
            <button
              onClick={() => setOrdersActiveTab('all')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                ordersActiveTab === 'all' 
                  ? 'text-teal-600 border-b-2 border-teal-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              All Orders
            </button>
          </div>

          {loadingOrders ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icons.Package />
              </div>
              <h3 className="text-gray-800 font-semibold mb-2">
                {ordersActiveTab === 'active' ? 'No active orders' : ordersActiveTab === 'history' ? 'No order history' : 'No orders yet'}
              </h3>
              <p className="text-gray-500 text-sm mb-4">
                {ordersActiveTab === 'active' ? 'Your active orders will appear here' : 'Your order history will appear here'}
              </p>
              <button
                onClick={() => setActiveView('pharmacies')}
                className="bg-teal-500 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-teal-600"
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
        <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-black/50" onClick={() => setCancellingOrder(null)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-gray-800 mb-4">Cancel Order</h3>
            <p className="text-gray-600 mb-4">Are you sure you want to cancel order <strong>{cancellingOrder.orderId}</strong>?</p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason for cancellation</label>
              <textarea
                value={cancellingOrder.cancelReason || ''}
                onChange={(e) => setCancellingOrder({ ...cancellingOrder, cancelReason: e.target.value })}
                placeholder="Please tell us why you're cancelling..."
                rows={3}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setCancellingOrder(null)}
                className="flex-1 border border-gray-200 rounded-lg py-2.5 text-gray-700 font-medium hover:bg-gray-50"
              >
                No, Keep Order
              </button>
              <button
                onClick={() => handleCancelOrder(cancellingOrder.orderId, cancellingOrder.cancelReason || 'User requested cancellation')}
                className="flex-1 bg-red-500 text-white rounded-lg py-2.5 font-medium hover:bg-red-600"
              >
                Yes, Cancel Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}