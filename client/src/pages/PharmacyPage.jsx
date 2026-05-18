import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import toast from 'react-hot-toast';
import { getPatients } from '../api/patientApi';
import { getMedicinesForPatient } from '../api/medicineApi';

// Fix for default marker icons in Leaflet with Vite
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

// Component to center map on location
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

// Order Modal Component - Fixed z-index
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

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
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
      
      const existingOrders = JSON.parse(localStorage.getItem('medsync_orders') || '[]');
      existingOrders.push({ ...orderData, id: Date.now() });
      localStorage.setItem('medsync_orders', JSON.stringify(existingOrders));
      
      toast.success(`Order placed successfully to ${pharmacy.name}!`);
      onSubmit(orderData);
      setLoading(false);
      onClose();
    }, 1500);
  };

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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Upload Prescription (Optional)</label>
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => setPrescription(e.target.files?.[0])}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
            />
          </div>

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

// Get user's current location
function useUserLocation() {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      setLoading(false);
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
      (err) => {
        console.error('Geolocation error:', err);
        setError(err.message);
        setLoading(false);
        setLocation({ lat: 27.6866, lng: 85.3374 });
      }
    );
  }, []);

  return { location, loading, error };
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
        {
          headers: {
            'User-Agent': 'MedSync-App/1.0'
          }
        }
      );
      const data = await response.json();
      return data;
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
          onFocus={() => results.length > 0 && setShowResults(true)}
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
  const [selectedPharmacy, setSelectedPharmacy] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderPharmacy, setOrderPharmacy] = useState(null);
  const [searchLocation, setSearchLocation] = useState(null);
  const [filteredPharmacies, setFilteredPharmacies] = useState(MOCK_PHARMACIES);
  const [searchTerm, setSearchTerm] = useState('');
  
  const { location: userLocation, loading: locationLoading } = useUserLocation();
  const [mapCenter, setMapCenter] = useState({ lat: 27.6866, lng: 85.3374 });

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

  const handleOrderSubmit = () => {
    setShowOrderModal(false);
  };

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

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Search Box */}
        <SearchBox onLocationSelect={setSearchLocation} />

        {/* Search input for pharmacy names */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Filter pharmacies by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        {/* Map Section - with lower z-index */}
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
              zoomControl={true}
            >
              <MapCenterUpdater center={mapCenter} />
              
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              {userLocation && (
                <Marker 
                  position={[userLocation.lat, userLocation.lng]} 
                  icon={userLocationIcon}
                >
                  <Popup>
                    <div className="text-center">
                      <p className="font-semibold">Your Location</p>
                    </div>
                  </Popup>
                </Marker>
              )}
              
              {filteredPharmacies.map((pharmacy) => (
                <Marker
                  key={pharmacy.id}
                  position={[pharmacy.lat, pharmacy.lng]}
                  icon={selectedPharmacy?.id === pharmacy.id ? selectedPharmacyIcon : pharmacyIcon}
                  eventHandlers={{
                    click: () => handleSelectPharmacy(pharmacy),
                  }}
                >
                  <Popup>
                    <div className="p-2 min-w-[200px]">
                      <h3 className="font-semibold text-gray-800">{pharmacy.name}</h3>
                      <p className="text-xs text-gray-500 mt-1">{pharmacy.address}</p>
                      <p className="text-xs text-gray-500">⭐ {pharmacy.rating} ({pharmacy.reviews} reviews)</p>
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => handleOrder(pharmacy)}
                          className="flex-1 px-3 py-1.5 bg-teal-500 text-white rounded-lg text-xs font-medium hover:bg-teal-600"
                        >
                          Order Now
                        </button>
                        <button
                          onClick={() => window.open(`https://www.openstreetmap.org/directions?from=&to=${pharmacy.lat},${pharmacy.lng}`, '_blank')}
                          className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium hover:bg-gray-50"
                        >
                          Directions
                        </button>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          )}
        </div>

        {/* Pharmacies List */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-gray-800 text-lg">
              Pharmacies Near You
              <span className="text-sm text-gray-500 ml-2">({filteredPharmacies.length} found)</span>
            </h2>
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

      {/* Order Modal - High z-index */}
      {showOrderModal && orderPharmacy && (
        <OrderModal
          pharmacy={orderPharmacy}
          onClose={() => setShowOrderModal(false)}
          onSubmit={handleOrderSubmit}
        />
      )}
    </div>
  );
} 