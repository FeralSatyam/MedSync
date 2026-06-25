import { useEffect, useMemo, useState, useRef, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import MobileBottomNav from '../components/MobileBottomNav';

import { createPatient, getPatients, generatePatientOtp } from '../api/patientApi';
import { deleteMedicine, getMedicinesForPatient, restockMedicine, updateMedicine } from '../api/medicineApi';
import { getNotifications, markNotificationAsRead } from '../api/notificationApi';
import { getStockStatus, sortMedicinesByUrgency } from '../utils/stockUtils';
import { formatStock } from '../utils/medicineUnits';
import { useAppStore } from '../store/appStore';
import { useAuthStore } from '../store/authStore';
import { QRCodeCanvas } from 'qrcode.react';

// SVG Icons
const Icons = {
  Home: ({ active = false }) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 9L12 3L21 9V20H3V9Z" stroke="currentColor" strokeWidth="1.5" fill={active ? "currentColor" : "none"} />
      <path d="M9 20V12H15V20" stroke="currentColor" strokeWidth="1.5" fill="none" />
    </svg>
  ),

  AIHealth: ({ active = false }) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2c-3 0-5 2-5 5 0 1.5.5 2.5 1 3.5-1 1-2 2.5-2 4.5 0 3 2 5 5 5s5-2 5-5c0-2-1-3.5-2-4.5.5-1 1-2 1-3.5 0-3-2-5-5-5z" stroke="currentColor" strokeWidth="1.5" fill={active ? "currentColor" : "none"} />
      <path d="M12 7v10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M8 9l8 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M8 13l8-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),

  Pharmacy: ({ active = false }) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2V22M5 12H19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M9 4H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M7 8H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M7 16H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M9 20H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),

  Orders: ({ active = false }) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 2L3 6V20C3 21.1 3.9 22 5 22H19C20.1 22 21 21.1 21 20V6L18 2H6Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill={active ? "currentColor" : "none"} fillOpacity={active ? "0.1" : "0"} />
      <path d="M3 6H21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M16 10C16 12.2 14.2 14 12 14C9.8 14 8 12.2 8 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),

  Profile: ({ active = false }) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" fill={active ? "currentColor" : "none"} />
      <path d="M5 20V19C5 15.7 7.7 13 11 13H13C16.3 13 19 15.7 19 19V20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),

  QR: ({ active = false }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <rect x="14" y="14" width="3" height="3" rx="0.5" fill="currentColor" />
      <rect x="18" y="18" width="3" height="3" rx="0.5" fill="currentColor" />
    </svg>
  ),

  QRWhite: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="3" width="7" height="7" rx="1" stroke="white" strokeWidth="1.5" fill="none" />
      <rect x="14" y="3" width="7" height="7" rx="1" stroke="white" strokeWidth="1.5" fill="none" />
      <rect x="3" y="14" width="7" height="7" rx="1" stroke="white" strokeWidth="1.5" fill="none" />
      <rect x="14" y="14" width="3" height="3" rx="0.5" fill="white" />
      <rect x="18" y="18" width="3" height="3" rx="0.5" fill="white" />
    </svg>
  ),

  Add: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),

  Plus: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),

  Restock: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 12L20 18C20 19.1 19.1 20 18 20L6 20C4.9 20 4 19.1 4 18L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12 2L12 16M12 16L15 13M12 16L9 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),

  Edit: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17 3L21 7L7 21H3V17L17 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 5L19 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),

  Delete: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 7H20M10 11V16M14 11V16M5 7L6 19C6 20.1 6.9 21 8 21H16C17.1 21 18 20.1 18 19L19 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M9 7L10 3H14L15 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),

  Prescription: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 4H20V20H4V4Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M8 8H16M8 12H14M8 16H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),

  ChevronRight: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),

  Close: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),

  Notification: ({ hasAlert = false }) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M18 8C18 4.7 15.3 2 12 2C8.7 2 6 4.7 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M13.7 21C13.4 21.6 12.8 22 12 22C11.2 22 10.6 21.6 10.3 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      {hasAlert && <circle cx="18" cy="6" r="3" fill="#EF4444" stroke="white" strokeWidth="1.5" />}
    </svg>
  ),

  Logout: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9 21H5C3.9 21 3 20.1 3 19V5C3 3.9 3.9 3 5 3H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M16 17L21 12L16 7M21 12H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),

  User: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5 20V19C5 15.7 7.7 13 11 13H13C16.3 13 19 15.7 19 19V20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),

  Package: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 7l-8-4-8 4m16 0v10l-8 4-8-4V7m8-4v18" />
    </svg>
  ),
};

// Memoized Family Avatar Component
const FamilyAvatar = memo(function FamilyAvatar({ patient, isActive, hasAlert, onClick }) {
  const initials = useMemo(() => {
    return patient.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }, [patient.name]);

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 shrink-0 group p-2"
    >
      <div className="relative">
        {/* Fixed-size wrapper to maintain position */}
        <div className="w-14 h-14 flex items-center justify-center">
          <div
            className={`rounded-full transition-all duration-300 ease-in-out ${isActive
              ? 'ring-2 ring-mint ring-offset-2 w-14 h-14'
              : 'w-14 h-14 group-hover:w-[52px] group-hover:h-[52px] opacity-80 group-hover:opacity-100'
              }`}
          >
            <div
              className={`w-full h-full rounded-full flex items-center justify-center text-white font-semibold transition-all duration-300 ease-in-out ${isActive
                ? 'bg-gradient-to-br from-teal-500 to-teal-600'
                : 'bg-gradient-to-br from-teal-400 to-teal-500 group-hover:from-teal-500 group-hover:to-teal-600'
                }`}
            >
              <span className={`transition-all duration-300 ease-in-out ${isActive
                ? 'text-lg'
                : 'text-lg group-hover:text-[17px]'
                }`}>
                {initials}
              </span>
            </div>
          </div>
        </div>
        {hasAlert && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse" />
        )}
      </div>
      <span
        className={`text-sm font-medium transition-colors duration-300 ${isActive ? 'text-mint' : 'text-muted group-hover:text-navy'
          }`}
      >
        {patient.name.split(' ')[0]}
      </span>
    </button>
  );
});
// Memoized Mobile Medicine Card Component
const MobileMedicineCard = memo(function MobileMedicineCard({ medicine, onRestock, onEdit, onRemove, onViewRx }) {
  const { status } = getStockStatus(medicine);
  const dailyConsumption = medicine.frequencyPerDay * medicine.dosePerIntake;
  const daysRemaining = Math.floor(medicine.currentStock / dailyConsumption) || 0;
  const stockPercentage = Math.min(100, (medicine.currentStock / (medicine.refillThreshold * dailyConsumption)) * 100);

  const getStatusConfig = useCallback(() => {
    switch (status) {
      case 'red': return { label: 'Low Stock', color: '#EF4444', bg: '#FEE2E2' };
      case 'amber': return { label: 'Refill Soon', color: '#F59E0B', bg: '#FEF3C7' };
      default: return { label: 'In Stock', color: '#10B981', bg: '#D1FAE5' };
    }
  }, [status]);

  const getTimings = useCallback(() => {
    const timings = [];
    if (medicine.frequencyPerDay >= 1) timings.push('Morning');
    if (medicine.frequencyPerDay >= 2) timings.push('Afternoon');
    if (medicine.frequencyPerDay >= 3) timings.push('Night');
    return timings;
  }, [medicine.frequencyPerDay]);

  const statusConfig = getStatusConfig();
  const timings = getTimings();

  return (
    <div className="bg-white rounded-2xl border border-border p-5 transition-all duration-200">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-navy text-base">{medicine.name}</h3>
          <p className="text-muted text-xs mt-0.5">{medicine.strength}{medicine.unit}</p>
        </div>
        <div className="rounded-full text-xs font-semibold px-2.5 py-0.5" style={{ backgroundColor: statusConfig.bg, color: statusConfig.color }}>
          {statusConfig.label}
        </div>
      </div>
      <div className="mb-3">
        <div className="flex justify-between text-xs text-muted mb-1.5">
          <span>Remaining: {formatStock(medicine)}</span>
          <span className="font-medium">{daysRemaining} days left</span>
        </div>
        <div className="w-full bg-border rounded-full h-1.5 overflow-hidden">
          <div className="h-1.5 rounded-full transition-all duration-300" style={{ width: `${stockPercentage}%`, backgroundColor: statusConfig.color }} />
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mb-3">
        <span className="text-xs text-muted flex items-center gap-1">
          <span className="w-1 h-1 rounded-full bg-border" />
          {medicine.frequencyPerDay}× daily
        </span>
        {timings.map((time, idx) => (
          <span key={idx} className="text-xs px-2 py-0.5 bg-faint text-navy rounded-md">
            {time}
          </span>
        ))}
      </div>
      <div className="flex gap-2 pt-2 border-t border-border">
        <button onClick={() => onRestock(medicine)} className="flex-1 bg-mint text-white py-2 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
          Restock
        </button>
        {medicine.prescriptionImgUrl && (
          <button onClick={() => onViewRx(medicine)} className="px-3 py-2 bg-faint text-navy rounded-lg hover:bg-mint-light transition-colors">
            Rx
          </button>
        )}
        <button onClick={() => onEdit(medicine)} className="px-3 py-2 bg-faint text-navy rounded-lg hover:bg-mint-light transition-colors">
          Edit
        </button>
        <button onClick={() => onRemove(medicine)} className="px-3 py-2 bg-faint text-red-500 rounded-lg hover:bg-red-50 transition-colors">
          Delete
        </button>
      </div>
    </div>
  );
});

// Desktop Sidebar Navigation
function DesktopSidebar({ activeTab, onTabChange, onQRPress, navigate }) {
  const logout = useAuthStore((s) => s.logout);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef(null);
  const authUser = useAuthStore((s) => s.user);
  const rootUserName = authUser?.name || 'User';
  const userName = rootUserName.split(' ')[0] || 'User';

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const menuItems = [
    { id: 'home', label: 'Dashboard', icon: Icons.Home },
    { id: 'ai-health', label: 'Health', icon: Icons.AIHealth },
    { id: 'orders', label: 'Orders', icon: Icons.Orders },
    { id: 'qr', label: 'Pharmacy QR', icon: Icons.QR },
    { id: 'pharmacist-link', label: 'Link to Pharmacist', icon: Icons.Profile },
  ];

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:border-r lg:border-border lg:bg-white">
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-center h-16 px-4 border-b border-border">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="MedSync" className="w-8 h-8" />
            <span className="font-bold text-navy text-xl tracking-tight">MedSync</span>
          </div>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button key={item.id} onClick={() => {
                if (item.id === 'orders') {
                  navigate('/pharmacy');
                } else if (item.id === 'ai-health') {
                  navigate('/ai-health');
                } else if (item.id === 'qr') {
                  onQRPress();
                } else if (item.id === 'pharmacist-link') {
                  navigate('/pharmacist-link');
                } else {
                  onTabChange(item.id);
                }
              }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${isActive ? 'bg-mint-light text-mint border-l-[3px] border-mint' : 'text-muted hover:bg-faint'}`}>
                <Icon active={isActive} />
                <span className={`text-sm font-medium ${isActive ? 'text-mint' : 'text-navy'}`}>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border" ref={menuRef}>
          <div className="relative">
            <button onClick={() => setShowUserMenu(!showUserMenu)} className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-faint transition-colors">
              <div className="w-8 h-8 bg-mint-light rounded-full flex items-center justify-center text-mint font-semibold text-sm">
                {(rootUserName.charAt(0) || 'U').toUpperCase()}
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-medium text-navy truncate">{rootUserName}</p>
                <p className="text-xs text-muted">Account owner</p>
              </div>
              <svg className="w-4 h-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showUserMenu && (
              <div className="absolute bottom-full left-0 mb-2 w-full bg-white rounded-2xl border border-border overflow-hidden shadow-modal">
                <button onClick={() => navigate('/profile')} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-navy hover:bg-faint transition-colors">
                  <Icons.User />
                  My Profile
                </button>
                <hr className="my-1 border-border" />
                <button
                  onClick={() => {
                    const logout = useAuthStore.getState().logout;
                    if (logout) {
                      logout();
                      navigate('/login');
                    }
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Icons.Logout />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}

// Skeleton Loader
function SkeletonLoader() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-2xl border border-border p-5 animate-pulse">
          <div className="flex justify-between mb-3">
            <div>
              <div className="h-5 w-32 bg-gray-200 rounded mb-2" />
              <div className="h-3 w-20 bg-gray-200 rounded" />
            </div>
            <div className="h-6 w-16 bg-gray-200 rounded-full" />
          </div>
          <div className="space-y-2">
            <div className="h-3 w-full bg-gray-200 rounded" />
            <div className="h-1.5 w-full bg-gray-200 rounded" />
            <div className="h-3 w-24 bg-gray-200 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [loadingMedicines, setLoadingMedicines] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [showNotifications, setShowNotifications] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [dbNotifications, setDbNotifications] = useState([]);

  const notificationRef = useRef(null);
  const desktopNotificationRef = useRef(null);
  const activePatientId = useAppStore((s) => s.activePatientId);
  const setActivePatientId = useAppStore((s) => s.setActivePatientId);
  const refreshTrigger = useAppStore((s) => s.refreshTrigger);
  const authUser = useAuthStore((s) => s.user);
  const userId = authUser?._id || authUser?.id;

  const [profilePic, setProfilePic] = useState(null);
  useEffect(() => {
    if (authUser) {
      const savedPic = localStorage.getItem(`medsync_pfp_${authUser.id || authUser._id}`);
      if (savedPic) setProfilePic(savedPic);
    }
  }, [authUser]);

  const userInitials = useMemo(() => {
    return (authUser?.name || 'U')
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }, [authUser]);

  const rootAccountName = authUser?.name || 'User';

  const [patientAlertMap, setPatientAlertMap] = useState({});
  const [addProfileOpen, setAddProfileOpen] = useState(false);
  const [addProfileForm, setAddProfileForm] = useState({
    name: '',
    dateOfBirth: '',
    relation: 'self',
    allergies: '',
  });
  const [isAddingProfile, setIsAddingProfile] = useState(false);
  const [addProfileErrors, setAddProfileErrors] = useState({});
  const [restockTarget, setRestockTarget] = useState(null);
  const [restockQty, setRestockQty] = useState('');
  const [removeTarget, setRemoveTarget] = useState(null);
  const [lightboxUrl, setLightboxUrl] = useState(null);

  // QR Code & Dynamic OTP Modal State & Handlers
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrPatient, setQrPatient] = useState(null);
  const [qrOtp, setQrOtp] = useState('');
  const [qrSecondsLeft, setQrSecondsLeft] = useState(0);
  const [qrLoading, setQrLoading] = useState(false);
  const timerRef = useRef(null);

  const handleOpenQrModal = async (patientId) => {
    if (!patientId) {
      toast.error('No patient profile selected');
      return;
    }
    const p = patients.find(x => (x._id || x.id) === patientId);
    if (!p) return;
    setQrPatient(p);
    setQrModalOpen(true);
    setQrLoading(true);

    if (timerRef.current) clearInterval(timerRef.current);

    try {
      const res = await generatePatientOtp(patientId);
      setQrOtp(res.otp);

      const expiryTime = new Date(res.expiresAt).getTime();
      const calculateSecondsLeft = () => Math.max(0, Math.floor((expiryTime - Date.now()) / 1000));

      const initialSeconds = calculateSecondsLeft();
      setQrSecondsLeft(initialSeconds);

      timerRef.current = setInterval(() => {
        const left = calculateSecondsLeft();
        setQrSecondsLeft(left);
        if (left <= 0) {
          clearInterval(timerRef.current);
        }
      }, 1000);
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate verification OTP');
      setQrModalOpen(false);
    } finally {
      setQrLoading(false);
    }
  };

  const handleCloseQrModal = () => {
    setQrModalOpen(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const formatSecondsLeft = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Memoized handlers
  const handleTabChange = useCallback((tabId) => {
    if (tabId === 'profile') {
      navigate('/profile');
    } else if (tabId === 'pharmacy') {
      navigate('/pharmacy');
    } else if (tabId === 'ai-health') {
      navigate('/ai-health');
    } else {
      setActiveTab(tabId);
    }
  }, [navigate]);

  const handleAddMember = useCallback(() => {
    setAddProfileErrors({});
    setAddProfileForm({ name: '', dateOfBirth: '', relation: 'self', allergies: '' });
    setAddProfileOpen(true);
  }, []);

  const handleRestock = useCallback((med) => {
    setRestockTarget(med);
    const qty = Math.max(0, med.frequencyPerDay * med.dosePerIntake * 30);
    setRestockQty(String(Math.round(qty)));
  }, []);

  // Memoized values
  const fetchDbNotifications = useCallback(async () => {
    try {
      const data = await getNotifications();
      setDbNotifications(data || []);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  }, []);

  const handlePlaceOrderFromOffer = (notificationId) => {
    navigate(`/place-order?notifId=${notificationId}`);
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId);
      await fetchDbNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDbNotifications();
  }, [fetchDbNotifications, refreshTrigger]);

  const hasUnreadDbNotifs = useMemo(() => {
    return dbNotifications.some((n) => !n.read);
  }, [dbNotifications]);

  const hasAnyAlerts = useMemo(() => {
    const hasLowStock = Object.values(patientAlertMap).some(Boolean);
    return hasLowStock || hasUnreadDbNotifs;
  }, [patientAlertMap, hasUnreadDbNotifs]);

  const userName = useMemo(() => {
    if (!patients || !Array.isArray(patients) || patients.length === 0) return 'User';
    const currentPatient = patients.find((p) => (p._id || p.id) === activePatientId);
    return currentPatient?.name?.split(' ')[0] || 'User';
  }, [patients, activePatientId]);

  const activePatientName = useMemo(() => {
    if (!patients || !Array.isArray(patients) || patients.length === 0) return '';
    const currentPatient = patients.find((p) => (p._id || p.id) === activePatientId);
    return currentPatient?.name?.split(' ')[0] || '';
  }, [patients, activePatientId]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  // Refresh functions
  const refreshPatients = useCallback(async () => {
    try {
      const data = await getPatients();
      const patientsArray = Array.isArray(data) ? data : [];
      setPatients(patientsArray);

      const firstId = activePatientId || patientsArray[0]?._id || patientsArray[0]?.id;
      if (firstId && !activePatientId) setActivePatientId(firstId);

      // Trigger DB notifications fetch
      fetchDbNotifications();

      let lowStockAlerts = [];
      const alertPairs = await Promise.all(
        patientsArray.map(async (p) => {
          try {
            const meds = await getMedicinesForPatient(p._id || p.id);
            let hasAlert = false;
            (meds || []).forEach((m) => {
              const { status, daysLeft } = getStockStatus(m);
              if (status === 'red' || status === 'amber') {
                lowStockAlerts.push({ ...m, patientName: p.name, daysLeft, status });
                hasAlert = true;
              }
            });
            return [p._id || p.id, hasAlert];
          } catch {
            return [p._id || p.id, false];
          }
        })
      );
      setAlerts(lowStockAlerts);
      setPatientAlertMap(Object.fromEntries(alertPairs));
    } catch (error) {
      console.error('Error loading patients:', error);
      setPatients([]);
      toast.error('Could not load profiles');
    }
  }, [activePatientId, setActivePatientId, fetchDbNotifications]);

  const refreshMedicines = useCallback(async (pid) => {
    if (!pid) return;
    setLoadingMedicines(true);
    try {
      const meds = await getMedicinesForPatient(pid);
      const medsArray = Array.isArray(meds) ? meds : [];
      const enriched = medsArray.map((m) => {
        const { status, daysLeft } = getStockStatus(m);
        return { ...m, stockStatus: status, daysLeft };
      });
      const sorted = sortMedicinesByUrgency(enriched, (x) => getStockStatus(x));
      setMedicines(sorted);
    } catch {
      toast.error('Could not load medicines');
      setMedicines([]);
    } finally {
      setLoadingMedicines(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingPatients(true);
      try {
        await refreshPatients();
      } catch {
        toast.error('Could not load profiles');
      } finally {
        if (!cancelled) setLoadingPatients(false);
      }
    })();
    return () => { cancelled = true; };
  }, [refreshPatients]);

  useEffect(() => {
    if (activePatientId) {
      refreshMedicines(activePatientId);
    }
  }, [activePatientId, refreshMedicines, refreshTrigger]);

  // Handle tab navigation
  useEffect(() => {
    if (activeTab === 'profile') {
      navigate('/profile');
    } else if (activeTab === 'pharmacy') {
      navigate('/pharmacy');
    } else if (activeTab === 'ai-health') {
      navigate('/ai-health');
    }
  }, [activeTab, navigate]);

  // Close notification when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const clickedMobile = notificationRef.current && notificationRef.current.contains(event.target);
      const clickedDesktop = desktopNotificationRef.current && desktopNotificationRef.current.contains(event.target);
      if (!clickedMobile && !clickedDesktop) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (loadingPatients) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mint mx-auto mb-4" />
          <p className="text-muted">Loading your health data...</p>
        </div>
      </div>
    );
  }

  const NotificationDropdown = () => {
    const patientAlerts = alerts;
    const patientOffers = dbNotifications.filter((n) => !n.read && !n.orderPlaced);

    const getPatientName = (id) => {
      if (!id) return 'Patient';
      const pId = typeof id === 'object' ? id._id : id;
      const p = patients.find((pat) => (pat._id || pat.id) === pId);
      return p ? p.name.split(' ')[0] : 'Patient';
    };

    const totalCount = patientAlerts.length + patientOffers.length;

    return (
      <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl border border-border z-50 overflow-hidden text-left shadow-modal">
        <div className="p-4 border-b border-border flex justify-between items-center bg-faint">
          <h4 className="font-semibold text-navy text-sm">Notifications</h4>
          {totalCount > 0 && (
            <span className="text-[10px] px-2 py-0.5 bg-mint-light text-mint rounded-full font-bold uppercase tracking-wider shrink-0">
              {totalCount} New
            </span>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto divide-y divide-border">
          {/* Special Offers Section */}
          {patientOffers.length > 0 && (
            <div className="p-3 bg-mint-light/20">
              <div className="text-[10px] font-bold text-mint uppercase tracking-wider mb-2">Special Offers</div>
              <div className="space-y-2">
                {patientOffers.map((offer) => (
                  <div
                    key={offer._id}
                    className={`p-3 rounded-lg border bg-white transition-all ${
                      offer.read
                        ? 'border-border opacity-70'
                        : 'border-mint/20'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2 mb-1.5">
                      <span className="text-[9px] font-bold px-1.5 py-0.5 bg-mint-light text-mint rounded-full uppercase">
                        {offer.discountPercent}% OFF
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-semibold text-muted bg-faint px-1.5 py-0.5 rounded-full">
                          For {getPatientName(offer.patientId)}
                        </span>
                        {!offer.read && (
                          <button
                            onClick={() => handleMarkAsRead(offer._id)}
                            className="text-[9px] text-mint hover:text-navy font-medium"
                          >
                            Mark Read
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="font-bold text-navy text-xs leading-snug">{offer.title}</div>
                    <div className="text-muted text-[11px] mt-1 leading-normal">
                      {offer.message}
                    </div>

                    <div className="text-[10px] text-muted mt-2 bg-faint p-1.5 rounded flex justify-between items-center">
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="font-medium text-navy truncate">{offer.pharmacyName}</div>
                        <div className="text-[9px] text-muted">Exp: {offer.expiresAt ? new Date(offer.expiresAt).toLocaleDateString() : 'N/A'}</div>
                      </div>
                      <div className="shrink-0">
                        {offer.orderPlaced ? (
                          <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded text-[9px] block">
                            Ordered
                          </span>
                        ) : (
                          <button
                            onClick={() => handlePlaceOrderFromOffer(offer._id)}
                            className="bg-mint hover:opacity-90 text-white font-bold px-2 py-1 rounded-full text-[9px] transition-opacity"
                          >
                            Place Order
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Low Stock Alerts Section */}
          {patientAlerts.length > 0 && (
            <div className="p-3">
              <div className="text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-2">Stock Alerts</div>
              <div className="space-y-2">
                {patientAlerts.map((a) => (
                  <div key={a._id} className="p-2.5 rounded-lg border border-border hover:bg-faint transition-colors">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="font-semibold text-navy text-xs leading-snug">{a.name}</div>
                      <div
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                          a.status === 'red' ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-500'
                        }`}
                      >
                        {a.daysLeft} days left
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-muted">
                      <span>Stock: {formatStock(a)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {totalCount === 0 && (
            <div className="p-8 text-center text-muted text-sm">
              <span className="text-2xl mb-2 block">🎉</span>
              All good! No new notifications.
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-bg pb-20 lg:pb-0">
      {/* Desktop Sidebar */}
      <DesktopSidebar activeTab={activeTab} onTabChange={setActiveTab} onQRPress={() => handleOpenQrModal(activePatientId)} navigate={navigate} />

      {/* Main Content - with margin for desktop sidebar */}
      <div className="lg:pl-64">
        {/* Header for mobile */}
        <div className="lg:hidden bg-white border-b border-border sticky top-0 z-40">
          <div className="flex justify-between items-center px-4 h-16">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="MedSync" className="w-8 h-8" />
              <span className="font-bold text-navy text-xl tracking-tight">MedSync</span>
            </div>
            <div className="flex items-center gap-3">
              {/* Root account owner (registration account) */}
              <div className="flex flex-col items-center justify-center -mt-0.5">
                <button
                  onClick={() => navigate('/profile')}
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-bold text-xs overflow-hidden hover:scale-105 transition-all duration-200 active:scale-95 cursor-pointer"
                  title="Account owner"
                >
                  {profilePic ? (
                    <img src={profilePic} alt="Account" className="w-full h-full object-cover" />
                  ) : (
                    userInitials
                  )}
                </button>
                <span className="text-[9px] text-mint font-bold mt-0.5 max-w-[72px] truncate text-center">
                  {rootAccountName.split(' ')[0]}
                </span>
              </div>

              {/* Notification Bell */}
              <div className="relative" ref={notificationRef}>
                <button onClick={() => setShowNotifications(!showNotifications)} className="p-2 text-muted hover:text-navy hover:bg-faint rounded-lg transition-colors relative">
                  <Icons.Notification hasAlert={hasAnyAlerts} />
                </button>
                {showNotifications && <NotificationDropdown />}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6 lg:py-8">
          {/* Welcome Section */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-navy">{greeting}, {userName}!</h1>
              <p className="text-muted text-sm lg:text-base mt-1">Here's your medication summary for today</p>
            </div>

            {/* Desktop Notification Bell */}
            <div className="hidden lg:block relative" ref={desktopNotificationRef}>
              <button onClick={() => setShowNotifications(!showNotifications)} className="p-2 text-muted hover:text-navy hover:bg-faint rounded-lg transition-colors relative">
                <Icons.Notification hasAlert={hasAnyAlerts} />
              </button>
              {showNotifications && <NotificationDropdown />}
            </div>
          </div>

          {/* Family Profiles */}
          <div className="mb-10">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="font-semibold text-navy text-lg">Family Members</h2>
                <p className="text-xs text-muted mt-0.5">Switch between family profiles</p>
              </div>
              <button onClick={handleAddMember} className="flex items-center gap-1.5 text-mint text-sm font-medium hover:opacity-80 transition-opacity">
                <Icons.Add />
                Add Member
              </button>
            </div>

            <div className="flex gap-5 overflow-x-auto pb-3">
              {patients && Array.isArray(patients) && patients.map((p) => {
                const hasAlert = !!patientAlertMap[p._id || p.id];
                const active = (p._id || p.id) === activePatientId;
                return (
                  <FamilyAvatar
                    key={p._id || p.id}
                    patient={p}
                    isActive={active}
                    hasAlert={hasAlert}
                    onClick={() => setActivePatientId(p._id || p.id)}
                  />
                );
              })}
            </div>
          </div>

          {/* Medicines Section */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold text-navy text-lg">
                {activePatientName ? `${activePatientName}'s Medications` : 'My Medications'}
              </h2>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenQrModal(activePatientId)}
                  className="hidden lg:flex items-center gap-2 border border-border bg-white text-navy hover:bg-faint px-5 py-2.5 rounded-full text-sm font-semibold transition-colors cursor-pointer"
                >
                  <Icons.QR className="w-4 h-4 text-mint" />
                  Show Pharmacy QR
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/add-medicine')}
                  className="bg-navy text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity"
                >
                  + Add Medicine
                </button>
              </div>
            </div>

            {medicines.length === 0 && !loadingMedicines ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-border">
                <div className="w-16 h-16 bg-faint rounded-full flex items-center justify-center mx-auto mb-4">
                  <span>💊</span>
                </div>
                <p className="text-muted font-medium">No medications yet</p>
                <p className="text-sm text-muted mt-1">Add your first medicine to start tracking</p>
              </div>
            ) : loadingMedicines ? (
              <SkeletonLoader />
            ) : (
              <div className="space-y-3">
                {medicines.map((m) => (
                  <MobileMedicineCard
                    key={m._id}
                    medicine={m}
                    onRestock={handleRestock}
                    onViewRx={(med) => { if (med.prescriptionImgUrl) setLightboxUrl(med.prescriptionImgUrl); }}
                    onEdit={(med) => navigate(`/add-medicine/${med._id}`)}
                    onRemove={(med) => setRemoveTarget(med)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav showQR onQRPress={() => navigate('/qr')} />

      {/* Add Patient Profile Modal */}
      {addProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setAddProfileOpen(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-modal" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-navy">Add Family Member</h3>
              <button onClick={() => setAddProfileOpen(false)} className="text-muted hover:text-navy"><Icons.Close /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-navy mb-1">Full Name *</label>
                <input type="text" placeholder="Enter full name" value={addProfileForm.name} onChange={(e) => setAddProfileForm({ ...addProfileForm, name: e.target.value })} className="w-full rounded-xl border border-border bg-faint px-4 py-2.5 text-sm focus:outline-none focus:border-mint" />
                {addProfileErrors.name && <p className="text-xs text-red-500 mt-1">{addProfileErrors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-navy mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={addProfileForm.dateOfBirth}
                  max={new Date().toISOString().split('T')[0]}
                  min={(() => { const d = new Date(); d.setFullYear(d.getFullYear() - 120); return d.toISOString().split('T')[0]; })()}
                  onChange={(e) => setAddProfileForm({ ...addProfileForm, dateOfBirth: e.target.value })}
                  className="w-full rounded-xl border border-border bg-faint px-4 py-2.5 text-sm focus:outline-none focus:border-mint"
                />
                {addProfileErrors.dateOfBirth && <p className="text-xs text-red-500 mt-1">{addProfileErrors.dateOfBirth}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-navy mb-1">Relation *</label>
                <select value={addProfileForm.relation} onChange={(e) => setAddProfileForm({ ...addProfileForm, relation: e.target.value })} className="w-full rounded-xl border border-border bg-faint px-4 py-2.5 text-sm focus:outline-none focus:border-mint">
                  <option value="self">Self</option><option value="mother">Mother</option><option value="father">Father</option>
                  <option value="grandmother">Grandmother</option><option value="grandfather">Grandfather</option>
                  <option value="spouse">Spouse</option><option value="other">Other</option>
                </select>
                {addProfileErrors.relation && <p className="text-xs text-red-500 mt-1">{addProfileErrors.relation}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-navy mb-1">Allergies / Notes</label>
                <textarea value={addProfileForm.allergies} onChange={(e) => setAddProfileForm({ ...addProfileForm, allergies: e.target.value })} placeholder="e.g., Allergic to penicillin" className="w-full rounded-xl border border-border bg-faint px-4 py-2.5 text-sm focus:outline-none focus:border-mint" rows={3} />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setAddProfileOpen(false)} className="flex-1 border border-border bg-white text-navy rounded-full py-2.5 text-sm font-semibold hover:bg-faint transition-colors">Cancel</button>
                <button
                  disabled={isAddingProfile}
                  onClick={async () => {
                    const errors = {};
                    if (!addProfileForm.name.trim()) errors.name = 'Name is required';
                    if (!addProfileForm.relation) errors.relation = 'Relation is required';

                    if (addProfileForm.dateOfBirth) {
                      const d = new Date(addProfileForm.dateOfBirth);
                      const today = new Date(); today.setHours(0, 0, 0, 0);
                      const ageYears = (today - d) / (365.25 * 24 * 60 * 60 * 1000);
                      if (d > today) errors.dateOfBirth = 'Date of birth cannot be in the future';
                      else if (ageYears > 120) errors.dateOfBirth = 'Please enter a valid date of birth';
                    }

                    if (Object.keys(errors).length > 0) { setAddProfileErrors(errors); return; }
                    if (!userId) { toast.error('Please log in again'); return; }

                    setIsAddingProfile(true);
                    try {
                      await createPatient({
                        userId: userId,
                        name: addProfileForm.name.trim(),
                        dateOfBirth: addProfileForm.dateOfBirth || undefined,
                        relation: addProfileForm.relation,
                        allergies: addProfileForm.allergies || '',
                      });
                      toast.success('Profile added successfully');
                      setAddProfileOpen(false);
                      await refreshPatients();
                    } catch (err) {
                      console.error('Error:', err.response?.data);
                      toast.error(err?.response?.data?.message || 'Failed to add profile');
                    } finally {
                      setIsAddingProfile(false);
                    }
                  }}
                  className="flex-1 bg-mint text-white rounded-full py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
                >
                  {isAddingProfile ? 'Adding...' : 'Add Member'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Restock Modal */}
      {restockTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setRestockTarget(null)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-modal" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-navy">Restock Medicine</h3>
              <button onClick={() => setRestockTarget(null)} className="text-muted hover:text-navy"><Icons.Close /></button>
            </div>
            <div className="mb-4 p-3 bg-faint rounded-xl border border-border">
              <p className="font-medium text-navy">{restockTarget.name}</p>
              <p className="text-sm text-muted">Current stock: {formatStock(restockTarget)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Quantity Purchased</label>
              <input type="number" value={restockQty} onChange={(e) => setRestockQty(e.target.value)} placeholder="Enter quantity" className="w-full rounded-xl border border-border bg-faint px-4 py-2.5 text-sm focus:outline-none focus:border-mint" />
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setRestockTarget(null)} className="flex-1 border border-border bg-white text-navy rounded-full py-2.5 text-sm font-semibold hover:bg-faint transition-colors">Cancel</button>
              <button onClick={async () => {
                const qty = Number(restockQty);
                if (isNaN(qty) || qty <= 0) { toast.error('Please enter a valid quantity'); return; }
                try {
                  await restockMedicine(restockTarget._id, qty);
                  toast.success('Stock updated successfully');
                  setRestockTarget(null);
                  await refreshMedicines(activePatientId);
                  await refreshPatients();
                } catch { toast.error('Failed to update stock'); }
              }} className="flex-1 bg-mint text-white rounded-full py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity">Update Stock</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {removeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setRemoveTarget(null)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-modal" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-navy">Remove Medicine</h3>
              <button onClick={() => setRemoveTarget(null)} className="text-muted hover:text-navy"><Icons.Close /></button>
            </div>
            <p className="text-muted mb-2">Are you sure you want to remove <strong className="text-navy">{removeTarget.name}</strong>?</p>
            <p className="text-sm text-muted mb-5">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setRemoveTarget(null)} className="flex-1 border border-border bg-white text-navy rounded-full py-2.5 text-sm font-semibold hover:bg-faint transition-colors">Cancel</button>
              <button onClick={async () => {
                try {
                  await deleteMedicine(removeTarget._id);
                  toast.success('Medicine removed successfully');
                  setRemoveTarget(null);
                  await refreshMedicines(activePatientId);
                  await refreshPatients();
                } catch { toast.error('Failed to remove medicine'); }
              }} className="flex-1 bg-red-500 text-white rounded-full py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity">Remove</button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code & OTP Modal */}
      {qrModalOpen && qrPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md transition-all duration-300" onClick={handleCloseQrModal}>
          <div className="bg-white/95 backdrop-blur-xl border border-white/20 rounded-3xl max-w-md w-full shadow-2xl relative overflow-hidden transition-all transform scale-100 max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Background glowing circle for aesthetic depth */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex justify-between items-center mb-6 relative z-10 px-6 pt-6 shrink-0">
              <div>
                <h3 className="text-xl font-bold text-navy tracking-tight flex items-center gap-2">
                  <Icons.QR className="w-6 h-6 text-mint" />
                  Pharmacy QR & OTP
                </h3>
                <p className="text-xs text-muted mt-0.5">Share securely with your pharmacist</p>
              </div>
              <button onClick={handleCloseQrModal} className="p-2 text-muted hover:text-navy rounded-full hover:bg-faint transition-colors">
                <Icons.Close />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-6 pb-6 relative z-10">
            {qrLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mint mb-4" />
                <p className="text-sm text-muted">Generating secure OTP...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="bg-faint p-3 rounded-2xl border border-border mb-5 flex justify-center items-center">
                  <div className="p-2 bg-white rounded-xl">
                    <QRCodeCanvas
                      value={`${window.location.origin}/pharma/${qrPatient.qrToken}`}
                      size={160}
                      fgColor="#0f172a"
                      bgColor="#ffffff"
                      level="H"
                    />
                  </div>
                </div>

                <div className="text-center w-full mb-5">
                  <span className="text-xs font-semibold text-muted uppercase tracking-widest block mb-2">Patient Profile</span>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-mint-light text-mint font-semibold text-sm border border-mint/20">
                    <span className="w-2 h-2 rounded-full bg-mint animate-ping" />
                    {qrPatient.name}
                  </div>
                </div>

                {qrSecondsLeft > 0 ? (
                  <>
                    <div className="text-center w-full mb-4">
                      <span className="text-xs font-semibold text-muted uppercase tracking-widest block mb-2">Temporary Verification OTP</span>
                      <div className="flex gap-2 justify-center">
                        {qrOtp.split('').map((char, index) => (
                          <div
                            key={index}
                            className="w-10 h-12 bg-mint-light border-2 border-mint/20 rounded-xl flex items-center justify-center text-xl font-bold text-mint"
                            style={{ animationDelay: `${index * 50}ms` }}
                          >
                            {char}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 px-4 py-2 bg-faint rounded-2xl border border-border mb-4">
                      <svg className="w-4 h-4 text-mint animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm font-semibold font-mono text-mint">{formatSecondsLeft(qrSecondsLeft)}</span>
                      <span className="text-xs text-muted font-medium">remaining</span>
                    </div>
                  </>
                ) : (
                  <div className="w-full text-center py-4 px-6 bg-red-50/80 border border-red-100 rounded-2xl mb-5 animate-shake">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2 text-red-500">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <h4 className="font-bold text-red-800 text-sm">OTP Code Expired</h4>
                    <p className="text-xs text-red-500 mt-1">For your security, this OTP code has expired. Please regenerate a new one.</p>
                    <button
                      onClick={() => handleOpenQrModal(qrPatient._id || qrPatient.id)}
                      className="mt-4 px-4 py-2 bg-red-500 hover:opacity-90 text-white rounded-xl text-xs font-bold transition-opacity flex items-center gap-2 mx-auto cursor-pointer"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 4.75M9 9h1.586M9 9l1.586-1.586" />
                      </svg>
                      Regenerate OTP
                    </button>
                  </div>
                )}

                <div className="bg-mint-light border border-mint/20 rounded-2xl px-4 py-3 text-xs text-mint leading-relaxed text-center">
                  Let the pharmacist scan this QR code, then give them the 6-digit OTP code to verify and access your active medications safely.
                </div>
              </div>
            )}
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90" onClick={() => setLightboxUrl(null)}>
          <div className="max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <img src={lightboxUrl} alt="Prescription" className="w-full rounded-lg shadow-2xl" />
            <button onClick={() => setLightboxUrl(null)} className="absolute top-4 right-4 p-2 bg-white/20 rounded-full text-white hover:bg-white/30 transition-colors"><Icons.Close /></button>
          </div>
        </div>
      )}
    </div>
  );
}
