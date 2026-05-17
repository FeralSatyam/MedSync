import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import { getPatients } from '../api/patientApi';
import { getMedicinesForPatient } from '../api/medicineApi';

// SVG Icons
const Icons = {
  Location: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <circle cx="12" cy="9" r="3" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    </svg>
  ),
  Phone: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M22 16.9v3c0 .6-.5 1.1-1.1 1.1-9.3 0-16.9-7.6-16.9-16.9 0-.6.5-1.1 1.1-1.1h3c.6 0 1.1.5 1.1 1.1 0 .9.1 1.8.4 2.6.1.4 0 .8-.3 1.1l-1.5 1.5c1.4 2.8 3.5 4.9 6.3 6.3l1.5-1.5c.3-.3.7-.4 1.1-.3.9.2 1.7.3 2.6.3.6 0 1.1.5 1.1 1.1z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    </svg>
  ),
  Clock: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    </svg>
  ),
  Star: ({ filled = false }) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2l3.1 6.3L22 9.3l-4.5 4.4 1.1 6.3L12 17.2l-6.6 3.5 1.1-6.3L2 9.3l6.9-1L12 2z" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  ),
  Cart: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="9" cy="20" r="1.5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <circle cx="18" cy="20" r="1.5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <path d="M3 4h3l2 12h12l2-8H7" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    </svg>
  ),
  Close: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  ArrowLeft: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Search: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <path d="M16 16L21 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  Navigation: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L12 22M12 2L5 8L12 2ZM12 2L19 8L12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
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
    image: "https://via.placeholder.com/80x80?text=Pharmacy",
    medicines: ["Paracetamol", "Amoxicillin", "Cetirizine", "Metformin", "Omeprazole"]
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
    image: "https://via.placeholder.com/80x80?text=Pharmacy",
    medicines: ["Paracetamol", "Ibuprofen", "Azithromycin", "Losartan", "Amlodipine"]
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
    image: "https://via.placeholder.com/80x80?text=Pharmacy",
    medicines: ["Paracetamol", "Ciprofloxacin", "Diclofenac", "Pantoprazole", "Gabapentin"]
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
    image: "https://via.placeholder.com/80x80?text=Pharmacy",
    medicines: ["Paracetamol", "Metformin", "Atorvastatin", "Omeprazole", "Cetirizine"]
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
    image: "https://via.placeholder.com/80x80?text=Pharmacy",
    medicines: ["Paracetamol", "Amoxicillin", "Doxycycline", "Losartan", "Amlodipine"]
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
        <img src={pharmacy.image} alt={pharmacy.name} className="w-16 h-16 rounded-lg object-cover" />
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

// Order Modal Component
function OrderModal({ pharmacy, onClose, onSubmit }) {
  const [selectedPatient, setSelectedPatient] = useState('');
  const [medicines, setMedicines] = useState([]);
  const [selectedMedicines, setSelectedMedicines] = useState({});
  const [patients, setPatients] = useState([]);
  const [prescription, setPrescription] = useState(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPatientsAndMedicines();
  }, []);

  const loadPatientsAndMedicines = async () => {
    try {
      const patientsData = await getPatients();
      setPatients(patientsData);
      
      if (patientsData.length > 0) {
        const meds = await getMedicinesForPatient(patientsData[0]._id);
        setMedicines(meds);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleMedicineToggle = (medicineId) => {
    setSelectedMedicines(prev => ({
      ...prev,
      [medicineId]: !prev[medicineId]
    }));
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

    setLoading(true);
    
    // Simulate order submission
    setTimeout(() => {
      const orderData = {
        pharmacyId: pharmacy.id,
        pharmacyName: pharmacy.name,
        patientId: selectedPatient,
        medicines: selectedMeds,
        prescription: prescription,
        notes: notes,
        orderDate: new Date().toISOString(),
        status: 'pending',
        estimatedDelivery: pharmacy.deliveryTime
      };
      
      // Store order in localStorage for demo
      const existingOrders = JSON.parse(localStorage.getItem('medsync_orders') || '[]');
      existingOrders.push({ ...orderData, id: Date.now() });
      localStorage.setItem('medsync_orders', JSON.stringify(existingOrders));
      
      toast.success(`Order placed successfully to ${pharmacy.name}!`);
      onSubmit(orderData);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">Order from {pharmacy.name}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <Icons.Close />
          </button>
        </div>
        
        <div className="p-4 space-y-4">
          {/* Patient Selection */}
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

          {/* Medicine Selection */}
          {selectedPatient && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Medicines *</label>
              <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-2">
                {medicines.map(med => (
                  <label key={med._id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedMedicines[med._id] || false}
                      onChange={() => handleMedicineToggle(med._id)}
                      className="w-4 h-4 text-teal-500 rounded focus:ring-teal-500"
                    />
                    <div>
                      <p className="font-medium text-gray-800">{med.name}</p>
                      <p className="text-xs text-gray-500">{med.strength}{med.unit} - Stock: {med.currentStock}</p>
                    </div>
                  </label>
                ))}
                {medicines.length === 0 && (
                  <p className="text-center text-gray-500 py-4">No medicines added for this patient</p>
                )}
              </div>
            </div>
          )}

          {/* Prescription Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Upload Prescription (Optional)</label>
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => setPrescription(e.target.files?.[0])}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
            />
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special instructions..."
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Order Summary */}
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm font-medium text-gray-700 mb-2">Order Summary</p>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Delivery Fee:</span>
                <span className="font-medium">{pharmacy.deliveryFee}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Estimated Delivery:</span>
                <span className="font-medium">{pharmacy.deliveryTime}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 border border-gray-200 rounded-lg py-2.5 text-gray-700 font-medium hover:bg-gray-50">
              Cancel
            </button>
            <button onClick={handleSubmit} disabled={loading} className="flex-1 bg-teal-500 text-white rounded-lg py-2.5 font-medium hover:bg-teal-600 disabled:opacity-50">
              {loading ? 'Placing Order...' : 'Place Order'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Directions Modal
function DirectionsModal({ pharmacy, userLocation, onClose }) {
  const [loading, setLoading] = useState(false);

  const handleOpenMaps = () => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${pharmacy.lat},${pharmacy.lng}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-md w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-800">Directions to {pharmacy.name}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <Icons.Close />
          </button>
        </div>
        <div className="p-4">
          <div className="mb-4 p-3 bg-teal-50 rounded-lg">
            <p className="text-sm text-gray-700">📍 {pharmacy.address}</p>
            <p className="text-xs text-gray-500 mt-1">Distance: {pharmacy.distance}</p>
            <p className="text-xs text-gray-500">Estimated time: {pharmacy.deliveryTime}</p>
          </div>
          
          <div className="text-center py-4">
            <Icons.Navigation />
            <p className="text-sm text-gray-600 mt-3">Open Google Maps for turn-by-turn directions</p>
            <button 
              onClick={handleOpenMaps}
              className="mt-4 px-4 py-2 bg-teal-500 text-white rounded-lg text-sm font-medium hover:bg-teal-600 transition-colors"
            >
              Open in Google Maps
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const mapContainerStyle = {
  width: '100%',
  height: '400px'
};

const defaultCenter = {
  lat: 27.6866,
  lng: 85.3374
};

export default function PharmacyPage() {
  const navigate = useNavigate();
  const [pharmacies, setPharmacies] = useState(MOCK_PHARMACIES);
  const [selectedPharmacy, setSelectedPharmacy] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderPharmacy, setOrderPharmacy] = useState(null);
  const [showDirections, setShowDirections] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [userLocation, setUserLocation] = useState(defaultCenter);
  const [map, setMap] = useState(null);
  const [filteredPharmacies, setFilteredPharmacies] = useState(MOCK_PHARMACIES);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          toast.error('Unable to get your location. Showing default location.');
        }
      );
    }
  }, []);

  // Filter pharmacies based on search
  useEffect(() => {
    if (searchTerm) {
      const filtered = pharmacies.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.address.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredPharmacies(filtered);
    } else {
      setFilteredPharmacies(pharmacies);
    }
  }, [searchTerm, pharmacies]);

  const handleSelectPharmacy = (pharmacy) => {
    setSelectedPharmacy(pharmacy);
    // Center map on selected pharmacy
    if (map) {
      map.panTo({ lat: pharmacy.lat, lng: pharmacy.lng });
      map.setZoom(15);
    }
  };

  const handleOrder = (pharmacy) => {
    setOrderPharmacy(pharmacy);
    setShowOrderModal(true);
  };

  const handleOrderSubmit = (orderData) => {
    setShowOrderModal(false);
    setTimeout(() => {
      toast.success('Order placed successfully! You can track it in your orders.');
    }, 500);
  };

  const handleDirections = (pharmacy) => {
    setSelectedPharmacy(pharmacy);
    setShowDirections(true);
  };

  // Don't load Google Maps until API key is provided
  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  
  if (!googleMapsApiKey) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-100 sticky top-0 z-40">
          <div className="flex items-center gap-3 px-4 h-16">
            <button onClick={() => navigate(-1)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <Icons.ArrowLeft />
            </button>
            <h1 className="text-xl font-bold text-gray-800">Nearby Pharmacies</h1>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
            <p className="text-yellow-800">Google Maps API key is required. Please add VITE_GOOGLE_MAPS_API_KEY to your .env file.</p>
            <p className="text-sm text-yellow-600 mt-2">For now, showing pharmacy list without map.</p>
          </div>
          
          {/* Show pharmacies list without map */}
          <div className="mt-6 space-y-3">
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
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="flex items-center gap-3 px-4 h-16">
          <button onClick={() => navigate(-1)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <Icons.ArrowLeft />
          </button>
          <h1 className="text-xl font-bold text-gray-800">Nearby Pharmacies</h1>
        </div>
      </div>

      {/* Search Bar */}
      <div className="sticky top-16 bg-white border-b border-gray-100 px-4 py-3 z-30">
        <div className="relative">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <Icons.Search />
          </div>
          <input
            type="text"
            placeholder="Search pharmacy by name or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Map Section */}
        <div className="mb-6 rounded-xl overflow-hidden shadow-sm border border-gray-200">
          <LoadScript googleMapsApiKey={googleMapsApiKey}>
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={userLocation}
              zoom={13}
              onLoad={setMap}
            >
              {/* User Location Marker */}
              <Marker
                position={userLocation}
                icon={{
                  path: 'M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7z',
                  fillColor: '#14B8A6',
                  fillOpacity: 1,
                  strokeColor: '#FFFFFF',
                  strokeWeight: 2,
                  scale: 1.5,
                  anchor: { x: 12, y: 12 }
                }}
              />
              
              {/* Pharmacy Markers */}
              {filteredPharmacies.map((pharmacy) => (
                <Marker
                  key={pharmacy.id}
                  position={{ lat: pharmacy.lat, lng: pharmacy.lng }}
                  onClick={() => handleSelectPharmacy(pharmacy)}
                  icon={{
                    path: 'M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7z',
                    fillColor: selectedPharmacy?.id === pharmacy.id ? '#EF4444' : '#3B82F6',
                    fillOpacity: 0.8,
                    strokeColor: '#FFFFFF',
                    strokeWeight: 2,
                    scale: 1.2,
                    anchor: { x: 12, y: 12 }
                  }}
                />
              ))}

              {selectedPharmacy && (
                <InfoWindow
                  position={{ lat: selectedPharmacy.lat, lng: selectedPharmacy.lng }}
                  onCloseClick={() => setSelectedPharmacy(null)}
                >
                  <div className="p-2 max-w-xs">
                    <h3 className="font-semibold text-gray-800">{selectedPharmacy.name}</h3>
                    <p className="text-xs text-gray-500 mt-1">{selectedPharmacy.address}</p>
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => handleOrder(selectedPharmacy)}
                        className="px-2 py-1 bg-teal-500 text-white rounded text-xs"
                      >
                        Order Now
                      </button>
                      <button
                        onClick={() => handleDirections(selectedPharmacy)}
                        className="px-2 py-1 border border-gray-300 rounded text-xs"
                      >
                        Directions
                      </button>
                    </div>
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>
          </LoadScript>
        </div>

        {/* Pharmacies List */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-gray-800 text-lg">
              Pharmacies Near You
              <span className="text-sm text-gray-500 ml-2">({filteredPharmacies.length} found)</span>
            </h2>
            <button className="text-sm text-teal-500 font-medium">Sort by distance</button>
          </div>

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

      {/* Order Modal */}
      {showOrderModal && orderPharmacy && (
        <OrderModal
          pharmacy={orderPharmacy}
          onClose={() => setShowOrderModal(false)}
          onSubmit={handleOrderSubmit}
        />
      )}

      {/* Directions Modal */}
      {showDirections && selectedPharmacy && (
        <DirectionsModal
          pharmacy={selectedPharmacy}
          userLocation={userLocation}
          onClose={() => setShowDirections(false)}
        />
      )}
    </div>
  );
}