import { useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import { createPatient, getPatients } from '../api/patientApi';
import { deleteMedicine, getMedicinesForPatient, restockMedicine, updateMedicine } from '../api/medicineApi';
import { getStockStatus, sortMedicinesByUrgency } from '../utils/stockUtils';
import { useAppStore } from '../store/appStore';
import { useAuthStore } from '../store/authStore';

// SVG Icons
const Icons = {
  Logo: () => (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="8" fill="#14B8A6"/>
      <path d="M16 8L20 12L16 16L12 12L16 8Z" fill="white"/>
      <path d="M10 14L14 18L10 22L6 18L10 14Z" fill="white" fillOpacity="0.8"/>
      <path d="M22 14L26 18L22 22L18 18L22 14Z" fill="white" fillOpacity="0.8"/>
      <circle cx="16" cy="18" r="2" fill="white"/>
    </svg>
  ),
  
  Home: ({ active = false }) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 9L12 3L21 9V20H3V9Z" stroke="currentColor" strokeWidth="1.5" fill={active ? "currentColor" : "none"}/>
      <path d="M9 20V12H15V20" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    </svg>
  ),
  
  Calendar: ({ active = false }) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" fill={active ? "currentColor" : "none"}/>
      <path d="M8 2V6M16 2V6M3 10H21" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="12" cy="15" r="1" fill="currentColor"/>
      <circle cx="16" cy="15" r="1" fill="currentColor"/>
      <circle cx="8" cy="15" r="1" fill="currentColor"/>
    </svg>
  ),
  
  Pharmacy: ({ active = false }) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2V22M5 12H19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M9 4H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M7 8H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M7 16H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M9 20H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  
  Profile: ({ active = false }) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" fill={active ? "currentColor" : "none"}/>
      <path d="M5 20V19C5 15.7 7.7 13 11 13H13C16.3 13 19 15.7 19 19V20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  
  QR: ({ active = false }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <rect x="14" y="14" width="3" height="3" rx="0.5" fill="currentColor"/>
      <rect x="18" y="18" width="3" height="3" rx="0.5" fill="currentColor"/>
    </svg>
  ),
  
  QRWhite: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="3" width="7" height="7" rx="1" stroke="white" strokeWidth="1.5" fill="none"/>
      <rect x="14" y="3" width="7" height="7" rx="1" stroke="white" strokeWidth="1.5" fill="none"/>
      <rect x="3" y="14" width="7" height="7" rx="1" stroke="white" strokeWidth="1.5" fill="none"/>
      <rect x="14" y="14" width="3" height="3" rx="0.5" fill="white"/>
      <rect x="18" y="18" width="3" height="3" rx="0.5" fill="white"/>
    </svg>
  ),
  
  Add: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  
  Plus: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  
  Restock: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 12L20 18C20 19.1 19.1 20 18 20L6 20C4.9 20 4 19.1 4 18L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M12 2L12 16M12 16L15 13M12 16L9 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  
  Edit: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17 3L21 7L7 21H3V17L17 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M15 5L19 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  
  Delete: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 7H20M10 11V16M14 11V16M5 7L6 19C6 20.1 6.9 21 8 21H16C17.1 21 18 20.1 18 19L19 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M9 7L10 3H14L15 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  
  Prescription: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 4H20V20H4V4Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M8 8H16M8 12H14M8 16H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  
  ChevronRight: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  
  Close: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  
  Notification: ({ hasAlert = false }) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M18 8C18 4.7 15.3 2 12 2C8.7 2 6 4.7 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M13.7 21C13.4 21.6 12.8 22 12 22C11.2 22 10.6 21.6 10.3 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      {hasAlert && <circle cx="18" cy="6" r="3" fill="#EF4444" stroke="white" strokeWidth="1.5"/>}
    </svg>
  ),
  
  Logout: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9 21H5C3.9 21 3 20.1 3 19V5C3 3.9 3.9 3 5 3H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M16 17L21 12L16 7M21 12H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  
  Settings: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M19.4 15.1L18.7 16.6C18.3 17.5 17.3 17.9 16.4 17.5L15.3 17C14.6 16.7 13.8 16.9 13.3 17.5L12.5 18.5C11.9 19.2 10.8 19.2 10.2 18.5L9.4 17.5C8.9 16.9 8.1 16.7 7.4 17L6.3 17.5C5.4 17.9 4.4 17.5 4 16.6L3.3 15.1C2.9 14.2 3.3 13.1 4.2 12.7L5.3 12.2C6 11.9 6.4 11.1 6.3 10.3L6.2 9.2C6.1 8.2 6.9 7.3 7.9 7.2L9 7.1C9.8 7 10.5 6.5 10.8 5.8L11.3 4.7C11.7 3.8 12.7 3.4 13.6 3.8L14.7 4.3C15.4 4.6 16.2 4.4 16.7 3.8L17.7 2.8C18.4 2 19.6 2.1 20.2 2.9L21.2 4.1C21.8 4.9 21.6 6.1 20.8 6.7L19.7 7.5C19 8 18.8 8.9 19.1 9.6L19.6 10.7C20 11.6 19.6 12.7 18.7 13.1L17.6 13.6C16.8 13.9 16.4 14.7 16.6 15.5L16.7 16.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  
  User: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M5 20V19C5 15.7 7.7 13 11 13H13C16.3 13 19 15.7 19 19V20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  
  Morning: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M12 2V4M22 12H20M4 12H2M12 20V22M19.1 4.9L17.7 6.3M6.3 17.7L4.9 19.1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  
  Afternoon: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 18C15.3 18 18 15.3 18 12C18 8.7 15.3 6 12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  ),
  
  Night: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M21 12.8C20.1 15.4 17.6 17.3 14.7 17.3C11 17.3 8 14.3 8 10.6C8 7.7 9.9 5.2 12.5 4.3C11.6 7.1 12.5 10.2 14.7 12.4C16.9 14.6 20 15.5 22.8 14.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
};

// Professional Medicine Card for Mobile
function MobileMedicineCard({ medicine, onRestock, onEdit, onRemove, onViewRx }) {
  const { status } = getStockStatus(medicine);
  const dailyConsumption = medicine.frequencyPerDay * medicine.dosePerIntake;
  const daysRemaining = Math.floor(medicine.currentStock / dailyConsumption) || 0;
  const stockPercentage = Math.min(100, (medicine.currentStock / (medicine.refillThreshold * dailyConsumption)) * 100);

  const getStatusConfig = () => {
    switch (status) {
      case 'red': return { label: 'Low Stock', color: '#EF4444', bg: '#FEE2E2' };
      case 'amber': return { label: 'Refill Soon', color: '#F59E0B', bg: '#FEF3C7' };
      default: return { label: 'In Stock', color: '#10B981', bg: '#D1FAE5' };
    }
  };

  const getTimings = () => {
    const timings = [];
    if (medicine.frequencyPerDay >= 1) timings.push({ name: 'Morning', icon: Icons.Morning });
    if (medicine.frequencyPerDay >= 2) timings.push({ name: 'Afternoon', icon: Icons.Afternoon });
    if (medicine.frequencyPerDay >= 3) timings.push({ name: 'Night', icon: Icons.Night });
    return timings;
  };

  const statusConfig = getStatusConfig();
  const timings = getTimings();

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-800 text-base">{medicine.name}</h3>
          <p className="text-gray-400 text-xs mt-0.5">{medicine.strength}{medicine.unit}</p>
        </div>
        <div className={`px-2.5 py-1 rounded-full text-xs font-medium`} style={{ backgroundColor: statusConfig.bg, color: statusConfig.color }}>
          {statusConfig.label}
        </div>
      </div>

      <div className="mb-3">
        <div className="flex justify-between text-xs text-gray-500 mb-1.5">
          <span>Remaining: {medicine.currentStock} tablets</span>
          <span className="font-medium">{daysRemaining} days left</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-300" style={{ width: `${stockPercentage}%`, backgroundColor: statusConfig.color }} />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        <span className="text-xs text-gray-500 flex items-center gap-1">
          <span className="w-1 h-1 rounded-full bg-gray-300" />
          {medicine.frequencyPerDay}× daily
        </span>
        {timings.map((timing, idx) => (
          <span key={idx} className="text-xs px-2 py-0.5 bg-gray-50 text-gray-600 rounded-md flex items-center gap-1">
            <timing.icon />
            {timing.name}
          </span>
        ))}
      </div>

      <div className="flex gap-2 pt-2 border-t border-gray-100">
        <button onClick={() => onRestock(medicine)} className="flex-1 bg-teal-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-teal-600 transition-colors flex items-center justify-center gap-2">
          <Icons.Restock />
          Restock
        </button>
        {medicine.prescriptionImgUrl && (
          <button onClick={() => onViewRx(medicine)} className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors">
            <Icons.Prescription />
          </button>
        )}
        <button onClick={() => onEdit(medicine)} className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors">
          <Icons.Edit />
        </button>
        <button onClick={() => onRemove(medicine)} className="px-3 py-2 bg-gray-100 text-red-500 rounded-lg hover:bg-red-50 transition-colors">
          <Icons.Delete />
        </button>
      </div>
    </div>
  );
}

// Desktop Table Row Component
function DesktopMedicineRow({ medicine, onRestock, onEdit, onRemove, onViewRx }) {
  const { status } = getStockStatus(medicine);
  const dailyConsumption = medicine.frequencyPerDay * medicine.dosePerIntake;
  const daysRemaining = Math.floor(medicine.currentStock / dailyConsumption) || 0;
  const stockPercentage = Math.min(100, (medicine.currentStock / (medicine.refillThreshold * dailyConsumption)) * 100);

  const getStatusConfig = () => {
    switch (status) {
      case 'red': return { label: 'Low Stock', icon: '🔴', color: '#EF4444' };
      case 'amber': return { label: 'Refill Soon', icon: '🟡', color: '#F59E0B' };
      default: return { label: 'In Stock', icon: '🟢', color: '#10B981' };
    }
  };

  const getTimings = () => {
    const timings = [];
    if (medicine.frequencyPerDay >= 1) timings.push('Morning');
    if (medicine.frequencyPerDay >= 2) timings.push('Afternoon');
    if (medicine.frequencyPerDay >= 3) timings.push('Night');
    return timings.join(', ');
  };

  const statusConfig = getStatusConfig();

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
      <td className="py-4 px-3">
        <div>
          <div className="font-medium text-gray-800">{medicine.name}</div>
          <div className="text-xs text-gray-400 mt-0.5">{medicine.strength}{medicine.unit}</div>
        </div>
      </td>
      <td className="py-4 px-3 text-sm text-gray-600">{getTimings() || `${medicine.frequencyPerDay}× daily`}</td>
      <td className="py-4 px-3">
        <div className="flex items-center gap-1.5">
          <span style={{ color: statusConfig.color }}>{statusConfig.icon}</span>
          <span className="text-sm text-gray-700">{statusConfig.label}</span>
        </div>
      </td>
      <td className="py-4 px-3">
        <div className="min-w-[140px]">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>{medicine.currentStock} / {medicine.refillThreshold * dailyConsumption} tabs</span>
            <span className="font-medium">{daysRemaining} days</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-300" style={{ width: `${stockPercentage}%`, backgroundColor: statusConfig.color }} />
          </div>
        </div>
      </td>
      <td className="py-4 px-3">
        <div className="flex gap-2">
          <button onClick={() => onRestock(medicine)} className="px-3 py-1.5 bg-teal-500 text-white rounded-lg text-xs font-medium hover:bg-teal-600 transition-colors flex items-center gap-1.5">
            <Icons.Restock />
            Restock
          </button>
          {medicine.prescriptionImgUrl && (
            <button onClick={() => onViewRx(medicine)} className="p-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors">
              <Icons.Prescription />
            </button>
          )}
          <button onClick={() => onEdit(medicine)} className="p-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors">
            <Icons.Edit />
          </button>
          <button onClick={() => onRemove(medicine)} className="p-1.5 bg-gray-100 text-red-500 rounded-lg hover:bg-red-50 transition-colors">
            <Icons.Delete />
          </button>
        </div>
      </td>
    </tr>
  );
}

// Family Avatar Component
function FamilyAvatar({ patient, isActive, hasAlert, onClick }) {
  const initials = patient.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-2 shrink-0 group transition-all duration-200">
      <div className="relative">
        <div className={`w-14 h-14 rounded-full transition-all duration-200 ${isActive ? 'ring-4 ring-teal-500 ring-offset-2 shadow-lg scale-105' : 'opacity-80 group-hover:opacity-100 group-hover:scale-105'}`}>
          <div className={`w-full h-full rounded-full flex items-center justify-center text-white font-semibold text-lg shadow-sm transition-all duration-200 ${isActive ? 'bg-gradient-to-br from-teal-500 to-teal-600' : 'bg-gradient-to-br from-teal-400 to-teal-500'}`}>
            {initials}
          </div>
        </div>
        {hasAlert && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse" />}
      </div>
      <span className={`text-sm font-medium transition-all duration-200 ${isActive ? 'text-teal-600' : 'text-gray-500 group-hover:text-gray-700'}`}>
        {patient.name.split(' ')[0]}
      </span>
    </button>
  );
}

// Desktop Sidebar Navigation
function DesktopSidebar({ activeTab, onTabChange }) {
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef(null);
  const authUser = useAuthStore((s) => s.user);
  const userName = authUser?.name?.split(' ')[0] || 'User';

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  // Handle tab changes including profile and pharmacy navigation
  useEffect(() => {
    if (activeTab === 'profile') {
      navigate('/profile');
    } else if (activeTab === 'pharmacy') {
      navigate('/pharmacy');
    }
  }, [activeTab, navigate]);

  const menuItems = [
    { id: 'home', label: 'Dashboard', icon: Icons.Home },
    { id: 'schedule', label: 'Schedule', icon: Icons.Calendar },
    { id: 'pharmacy', label: 'Pharmacy', icon: Icons.Pharmacy },
  ];

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:border-r lg:border-gray-100 lg:bg-white">
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-center h-16 px-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Icons.Logo />
            <span className="font-bold text-gray-800 text-xl tracking-tight">MedSync</span>
          </div>
        </div>
        
        <nav className="flex-1 px-3 py-6 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button key={item.id} onClick={() => onTabChange(item.id)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${isActive ? 'bg-teal-50 text-teal-600' : 'text-gray-600 hover:bg-gray-50'}`}>
                <Icon active={isActive} />
                <span className={`text-sm font-medium ${isActive ? 'text-teal-600' : 'text-gray-700'}`}>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-100" ref={menuRef}>
          <div className="relative">
            <button onClick={() => setShowUserMenu(!showUserMenu)} className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center text-teal-600 font-semibold">{userName.charAt(0)}</div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-gray-700">{userName}</p>
                <p className="text-xs text-gray-400">View profile</p>
              </div>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {showUserMenu && (
              <div className="absolute bottom-full left-0 mb-2 w-full bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                <button onClick={() => navigate('/profile')} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                  <Icons.User />
                  My Profile
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                  <Icons.Settings />
                  Settings
                </button>
                <hr className="my-1" />
                <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
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

// Mobile Bottom Navigation with Floating QR Button
function MobileBottomNav({ activeTab, onTabChange, onQRPress }) {
  const tabs = [
    { id: 'home', label: 'Home', icon: Icons.Home },
    { id: 'schedule', label: 'Schedule', icon: Icons.Calendar },
    { id: 'qr', label: '', icon: Icons.QR, isQR: true, isSpecial: true },
    { id: 'pharmacy', label: 'Pharmacy', icon: Icons.Pharmacy },
    { id: 'profile', label: 'Profile', icon: Icons.Profile },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-2 pt-4 pb-3 shadow-lg z-40">
      <div className="flex justify-around items-center relative">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          if (tab.isSpecial) {
            return (
              <button
                key={tab.id}
                onClick={() => onQRPress()}
                className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-14 h-14 rounded-full bg-teal-500 shadow-lg flex items-center justify-center hover:bg-teal-600 transition-all duration-200 active:scale-95 border-4 border-white z-50"
              >
                <Icons.QRWhite />
              </button>
            );
          }
          
          return (
            <button key={tab.id} onClick={() => {
              if (tab.id === 'profile') {
                onTabChange('profile');
              } else {
                onTabChange(tab.id);
              }
            }} className={`flex flex-col items-center gap-1 py-2 px-3 rounded-xl transition-all ${isActive ? 'text-teal-500' : 'text-gray-500 hover:text-gray-700'}`}>
              <Icon active={isActive} />
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Skeleton Loader
function SkeletonLoader() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
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
  
  const notificationRef = useRef(null);

  const activePatientId = useAppStore((s) => s.activePatientId);
  const setActivePatientId = useAppStore((s) => s.setActivePatientId);
  const authUser = useAuthStore((s) => s.user);
  
  // Get userId from authUser (supports both _id and id)
  const userId = authUser?._id || authUser?.id;
  
  // Debug log
  console.log('Auth User in Dashboard:', authUser);
  console.log('User ID:', userId);

  const [patientAlertMap, setPatientAlertMap] = useState({});
  const [addProfileOpen, setAddProfileOpen] = useState(false);
  const [addProfileForm, setAddProfileForm] = useState({
    name: '',
    dateOfBirth: '',
    relation: 'self',
    allergies: '',
    pharmacyPin: '',
  });
  const [addProfileErrors, setAddProfileErrors] = useState({});
  const [restockTarget, setRestockTarget] = useState(null);
  const [restockQty, setRestockQty] = useState('');
  const [removeTarget, setRemoveTarget] = useState(null);
  const [lightboxUrl, setLightboxUrl] = useState(null);

  // Handle tab changes including profile navigation
  useEffect(() => {
    if (activeTab === 'profile') {
      navigate('/profile');
    }
  }, [activeTab, navigate]);

  // Close notification when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function refreshPatients() {
    try {
      const data = await getPatients();
      const patientsArray = Array.isArray(data) ? data : [];
      setPatients(patientsArray);

      const firstId = activePatientId || patientsArray[0]?._id || patientsArray[0]?.id;
      if (firstId && !activePatientId) setActivePatientId(firstId);

      const alertPairs = await Promise.all(
        patientsArray.map(async (p) => {
          try {
            const meds = await getMedicinesForPatient(p._id || p.id);
            const enriched = (meds || []).map((m) => {
              const { status } = getStockStatus(m);
              return { ...m, stockStatus: status };
            });
            const hasAlert = enriched.some((m) => m.stockStatus === 'red' || m.stockStatus === 'amber');
            return [p._id || p.id, hasAlert];
          } catch {
            return [p._id || p.id, false];
          }
        })
      );
      const map = Object.fromEntries(alertPairs);
      setPatientAlertMap(map);
    } catch (error) {
      console.error('Error loading patients:', error);
      setPatients([]);
      toast.error('Could not load profiles');
    }
  }

  async function refreshMedicines(pid) {
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
  }

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
  }, []);

  useEffect(() => {
    if (!activePatientId) return;
    refreshMedicines(activePatientId);
  }, [activePatientId]);

  const getCurrentPatientName = () => {
    if (!patients || !Array.isArray(patients) || patients.length === 0) return 'User';
    const currentPatient = patients.find((p) => (p._id || p.id) === activePatientId);
    return currentPatient?.name?.split(' ')[0] || 'User';
  };

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  })();
  
  const userName = getCurrentPatientName();

  if (loadingPatients) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4" />
          <p className="text-gray-500">Loading your health data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 lg:pb-0">
      {/* Desktop Sidebar */}
      <DesktopSidebar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Content - with margin for desktop sidebar */}
      <div className="lg:pl-64">
        {/* Header for mobile */}
        <div className="lg:hidden bg-white border-b border-gray-100 sticky top-0 z-40">
          <div className="flex justify-between items-center px-4 h-16">
            <div className="flex items-center gap-2">
              <Icons.Logo />
              <span className="font-bold text-gray-800 text-xl tracking-tight">MedSync</span>
            </div>
            <div className="relative" ref={notificationRef}>
              <button onClick={() => setShowNotifications(!showNotifications)} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors relative">
                <Icons.Notification hasAlert={Object.values(patientAlertMap).some(Boolean)} />
              </button>
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 z-50">
                  <div className="p-4 border-b border-gray-100">
                    <h4 className="font-semibold text-gray-800">Notifications</h4>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    <div className="p-4 text-center text-gray-500 text-sm">No new notifications</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6 lg:py-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">{greeting}, {userName}!</h1>
            <p className="text-gray-500 text-sm lg:text-base mt-1">Here's your medication summary for today</p>
          </div>

          {/* Family Profiles */}
          <div className="mb-10">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="font-semibold text-gray-800 text-lg">Family Members</h2>
                <p className="text-xs text-gray-400 mt-0.5">Switch between family profiles</p>
              </div>
              <button onClick={() => { setAddProfileErrors({}); setAddProfileForm({ name: '', dateOfBirth: '', relation: 'self', allergies: '', pharmacyPin: '' }); setAddProfileOpen(true); }} className="flex items-center gap-1.5 text-teal-500 text-sm font-medium hover:text-teal-600 transition-colors">
                <Icons.Add />
                Add Member
              </button>
            </div>
            
            <div className="flex gap-5 overflow-x-auto pb-3 lg:grid lg:grid-cols-6 lg:gap-4 lg:overflow-visible scrollbar-thin">
              {patients && Array.isArray(patients) && patients.map((p) => {
                const hasAlert = !!patientAlertMap[p._id || p.id];
                const active = (p._id || p.id) === activePatientId;
                return <FamilyAvatar key={p._id || p.id} patient={p} isActive={active} hasAlert={hasAlert} onClick={() => setActivePatientId(p._id || p.id)} />;
              })}
            </div>
          </div>

          {/* Medicines Section */}
          <div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-5">
              <div>
                <h2 className="font-semibold text-gray-800 text-lg">My Medications</h2>
                <p className="text-xs text-gray-400 mt-0.5">Track and manage your prescriptions</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => navigate('/add-medicine')} className="flex items-center gap-2 bg-teal-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-600 transition-colors">
                  <Icons.Plus />
                  Add Medicine
                </button>
              </div>
            </div>

            {/* Mobile View */}
            <div className="lg:hidden">
              {loadingMedicines ? (
                <SkeletonLoader />
              ) : medicines.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icons.Prescription />
                  </div>
                  <p className="text-gray-500 font-medium">No medications yet</p>
                  <p className="text-sm text-gray-400 mt-1">Add your first medicine to start tracking</p>
                  <button onClick={() => navigate('/add-medicine')} className="mt-4 text-teal-500 text-sm font-medium hover:text-teal-600 transition-colors">
                    + Add Medicine
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {medicines.map((m) => (
                    <MobileMedicineCard
                      key={m._id}
                      medicine={m}
                      onRestock={(med) => { setRestockTarget(med); const qty = Math.max(0, med.frequencyPerDay * med.dosePerIntake * 30); setRestockQty(String(Math.round(qty))); }}
                      onViewRx={(med) => { if (med.prescriptionImgUrl) setLightboxUrl(med.prescriptionImgUrl); }}
                      onEdit={(med) => navigate(`/add-medicine/${med._id}`)}
                      onRemove={(med) => setRemoveTarget(med)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Desktop View */}
            <div className="hidden lg:block">
              {loadingMedicines ? (
                <SkeletonLoader />
              ) : medicines.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icons.Prescription />
                  </div>
                  <p className="text-gray-500 font-medium">No medications added yet</p>
                  <p className="text-sm text-gray-400 mt-1">Start tracking your prescriptions</p>
                  <button onClick={() => navigate('/add-medicine')} className="mt-4 text-teal-500 text-sm font-medium hover:text-teal-600 transition-colors">
                    Add Your First Medicine
                  </button>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="text-left py-4 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Medicine</th>
                        <th className="text-left py-4 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Schedule</th>
                        <th className="text-left py-4 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="text-left py-4 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Stock</th>
                        <th className="text-left py-4 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {medicines.map((m) => (
                        <DesktopMedicineRow
                          key={m._id}
                          medicine={m}
                          onRestock={(med) => { setRestockTarget(med); const qty = Math.max(0, med.frequencyPerDay * med.dosePerIntake * 30); setRestockQty(String(Math.round(qty))); }}
                          onViewRx={(med) => { if (med.prescriptionImgUrl) setLightboxUrl(med.prescriptionImgUrl); }}
                          onEdit={(med) => navigate(`/add-medicine/${med._id}`)}
                          onRemove={(med) => setRemoveTarget(med)}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav activeTab={activeTab} onTabChange={setActiveTab} onQRPress={() => navigate('/qr')} />

      {/* Add Patient Profile Modal */}
      {addProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setAddProfileOpen(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">Add Family Member</h3>
              <button onClick={() => setAddProfileOpen(false)} className="text-gray-400 hover:text-gray-600"><Icons.Close /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input type="text" placeholder="Enter full name" value={addProfileForm.name} onChange={(e) => setAddProfileForm({...addProfileForm, name: e.target.value})} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500" />
                {addProfileErrors.name && <p className="text-xs text-red-500 mt-1">{addProfileErrors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                <input type="date" value={addProfileForm.dateOfBirth} onChange={(e) => setAddProfileForm({...addProfileForm, dateOfBirth: e.target.value})} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Relation *</label>
                <select value={addProfileForm.relation} onChange={(e) => setAddProfileForm({...addProfileForm, relation: e.target.value})} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500">
                  <option value="self">Self</option><option value="mother">Mother</option><option value="father">Father</option>
                  <option value="grandmother">Grandmother</option><option value="grandfather">Grandfather</option>
                  <option value="spouse">Spouse</option><option value="other">Other</option>
                </select>
                {addProfileErrors.relation && <p className="text-xs text-red-500 mt-1">{addProfileErrors.relation}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Allergies / Notes</label>
                <textarea value={addProfileForm.allergies} onChange={(e) => setAddProfileForm({...addProfileForm, allergies: e.target.value})} placeholder="e.g., Allergic to penicillin" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500" rows={3} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pharmacy PIN (4-digit) *</label>
                <input type="text" placeholder="Enter 4-digit PIN" maxLength={4} value={addProfileForm.pharmacyPin} onChange={(e) => setAddProfileForm({...addProfileForm, pharmacyPin: e.target.value.replace(/\D/g, '')})} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500" />
                <p className="text-xs text-gray-400 mt-1">This PIN will be hashed and used for pharmacy verification</p>
                {addProfileErrors.pharmacyPin && <p className="text-xs text-red-500 mt-1">{addProfileErrors.pharmacyPin}</p>}
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setAddProfileOpen(false)} className="flex-1 border border-gray-200 rounded-lg py-2.5 text-gray-700 font-medium hover:bg-gray-50">Cancel</button>
                <button onClick={async () => {
                  const errors = {};
                  if (!addProfileForm.name.trim()) errors.name = 'Name is required';
                  if (!addProfileForm.relation) errors.relation = 'Relation is required';
                  if (!/^\d{4}$/.test(addProfileForm.pharmacyPin)) errors.pharmacyPin = 'PIN must be exactly 4 digits';
                  
                  if (Object.keys(errors).length > 0) {
                    setAddProfileErrors(errors);
                    return;
                  }
                  
                  if (!userId) {
                    toast.error('Please log in again');
                    return;
                  }
                  
                  try {
                    await createPatient({
                      userId: userId,
                      name: addProfileForm.name.trim(),
                      dateOfBirth: addProfileForm.dateOfBirth || undefined,
                      relation: addProfileForm.relation,
                      allergies: addProfileForm.allergies || '',
                      pharmacyPin: addProfileForm.pharmacyPin,
                    });
                    toast.success('Profile added successfully');
                    setAddProfileOpen(false);
                    await refreshPatients();
                  } catch (err) {
                    console.error('Error:', err.response?.data);
                    toast.error(err?.response?.data?.message || 'Failed to add profile');
                  }
                }} className="flex-1 bg-teal-500 text-white rounded-lg py-2.5 font-medium hover:bg-teal-600">
                  Add Member
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Restock Modal */}
      {restockTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setRestockTarget(null)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">Restock Medicine</h3>
              <button onClick={() => setRestockTarget(null)} className="text-gray-400 hover:text-gray-600"><Icons.Close /></button>
            </div>
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="font-medium text-gray-800">{restockTarget.name}</p>
              <p className="text-sm text-gray-500">Current stock: {restockTarget.currentStock} tablets</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity Purchased</label>
              <input type="number" value={restockQty} onChange={(e) => setRestockQty(e.target.value)} placeholder="Enter quantity" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setRestockTarget(null)} className="flex-1 border border-gray-200 rounded-lg py-2.5 text-gray-700 font-medium hover:bg-gray-50">Cancel</button>
              <button onClick={async () => {
                const qty = Number(restockQty);
                if (isNaN(qty) || qty <= 0) { toast.error('Please enter a valid quantity'); return; }
                try {
                  await restockMedicine(restockTarget._id, qty);
                  toast.success('Stock updated successfully');
                  setRestockTarget(null);
                  await refreshMedicines(activePatientId);
                } catch { toast.error('Failed to update stock'); }
              }} className="flex-1 bg-teal-500 text-white rounded-lg py-2.5 font-medium hover:bg-teal-600">Update Stock</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {removeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setRemoveTarget(null)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">Remove Medicine</h3>
              <button onClick={() => setRemoveTarget(null)} className="text-gray-400 hover:text-gray-600"><Icons.Close /></button>
            </div>
            <p className="text-gray-600 mb-2">Are you sure you want to remove <strong className="text-gray-800">{removeTarget.name}</strong>?</p>
            <p className="text-sm text-gray-500 mb-5">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setRemoveTarget(null)} className="flex-1 border border-gray-200 rounded-lg py-2.5 text-gray-700 font-medium hover:bg-gray-50">Cancel</button>
              <button onClick={async () => {
                try {
                  await deleteMedicine(removeTarget._id);
                  toast.success('Medicine removed successfully');
                  setRemoveTarget(null);
                  await refreshMedicines(activePatientId);
                } catch { toast.error('Failed to remove medicine'); }
              }} className="flex-1 bg-red-500 text-white rounded-lg py-2.5 font-medium hover:bg-red-600">Remove</button>
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