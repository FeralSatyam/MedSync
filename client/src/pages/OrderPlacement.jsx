import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { getNotifications, markNotificationAsRead } from '../api/notificationApi';
import { createOrder } from '../api/orderApi';
import { getPatients } from '../api/patientApi';
import { getMedicinesForPatient } from '../api/medicineApi';
import toast from 'react-hot-toast';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const TOTAL_STEPS = 3;

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2" />
  </svg>
);

const ArrowLeftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M15 18L9 12L15 6" />
  </svg>
);

function StepIndicator({ step }) {
  const steps = ['Medicines', 'Delivery', 'Review'];
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {steps.map((label, idx) => {
        const num = idx + 1;
        const isCompleted = step > num;
        const isActive = step === num;
        return (
          <div key={num} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm transition-all
                  ${isCompleted ? 'bg-teal-500 text-white' : isActive ? 'bg-teal-600 text-white ring-4 ring-teal-100' : 'bg-gray-100 text-gray-400'}`}
              >
                {isCompleted ? <CheckIcon /> : num}
              </div>
              <span className={`text-[11px] mt-1 font-medium ${isActive ? 'text-teal-600' : isCompleted ? 'text-teal-500' : 'text-gray-400'}`}>
                {label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div className={`w-16 h-0.5 mx-1 mb-4 transition-all ${step > num ? 'bg-teal-500' : 'bg-gray-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function FieldLabel({ children, required }) {
  return (
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {children} {required && <span className="text-red-500">*</span>}
    </label>
  );
}

function Input({ className = '', ...props }) {
  return (
    <input
      className={`w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition placeholder-gray-400 ${className}`}
      {...props}
    />
  );
}

function Textarea({ className = '', ...props }) {
  return (
    <textarea
      className={`w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition placeholder-gray-400 resize-none ${className}`}
      {...props}
    />
  );
}

function Select({ className = '', children, ...props }) {
  return (
    <select
      className={`w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition bg-white ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

// Autocomplete combobox for medicine name input
function MedicineCombobox({ value, onChange, onSelect, suggestions, placeholder }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  const filtered = value
    ? suggestions.filter((m) => m.displayName.toLowerCase().includes(value.toLowerCase()))
    : suggestions;

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={wrapRef} className="relative">
      <input
        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition placeholder-gray-400"
        placeholder={placeholder}
        value={value}
        autoComplete="off"
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
      />
      {open && filtered.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 max-h-52 overflow-y-auto">
          {filtered.map((m, i) => (
            <button
              key={i}
              type="button"
              className="w-full text-left px-4 py-3 hover:bg-teal-50 active:bg-teal-100 text-sm border-b last:border-0 border-gray-50 flex items-center justify-between gap-3 transition-colors"
              onMouseDown={(e) => {
                e.preventDefault();
                onSelect(m);
                setOpen(false);
              }}
            >
              <div className="min-w-0">
                <p className="font-medium text-gray-800 truncate">{m.name}</p>
                {m.strength && <p className="text-xs text-gray-400">{m.strength} {m.unit}</p>}
              </div>
              <span className="shrink-0 text-[10px] font-semibold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">Your med</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Step 1 — Medicines & Prescription
function StepMedicines({ medicines, onUpdate, onAdd, onRemove, slipCount, onSlipCount, specialNotes, onSpecialNotes, patientMedicines }) {
  // Suggestions = profile medicines not already in the order list
  const usedNames = medicines.map((m) => m.name.toLowerCase());
  const suggestions = patientMedicines
    .filter((pm) => !usedNames.includes(pm.displayName.toLowerCase()))
    .map((pm) => pm);

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-1">Medicine Details</h3>
        <p className="text-sm text-gray-500">
          {patientMedicines.length > 0
            ? 'Your medicines have been pre-filled. Adjust quantities or remove what you don\'t need.'
            : 'List the medicines you need and how many of each.'}
        </p>
      </div>

      <div className="space-y-3">
        {medicines.map((m, idx) => (
          <div key={idx} className={`rounded-2xl p-4 border ${m.fromProfile ? 'bg-teal-50 border-teal-100' : 'bg-gray-50 border-gray-100'}`}>
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Medicine {idx + 1}</span>
                {m.fromProfile && (
                  <span className="text-[10px] font-semibold text-teal-600 bg-teal-100 px-2 py-0.5 rounded-full">From your profile</span>
                )}
              </div>
              <button
                onClick={() => onRemove(idx)}
                className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                type="button"
              >
                <TrashIcon />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <FieldLabel required>Medicine Name</FieldLabel>
                <MedicineCombobox
                  value={m.name}
                  placeholder="e.g. Paracetamol 500mg"
                  suggestions={[...suggestions, ...(m.fromProfile ? [] : patientMedicines.filter(pm => pm.displayName.toLowerCase() === m.name.toLowerCase()))]}
                  onChange={(val) => onUpdate(idx, 'name', val)}
                  onSelect={(pm) => onUpdate(idx, 'fill', pm)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel required>Quantity</FieldLabel>
                  <Input
                    type="number"
                    min={1}
                    placeholder="1"
                    value={m.quantity}
                    onChange={(e) => onUpdate(idx, 'quantity', e.target.value)}
                  />
                </div>
                <div>
                  <FieldLabel>Unit</FieldLabel>
                  <Select value={m.unit} onChange={(e) => onUpdate(idx, 'unit', e.target.value)}>
                    <option value="">Select unit</option>
                    <option value="tablets">Tablets</option>
                    <option value="capsules">Capsules</option>
                    <option value="strips">Strips</option>
                    <option value="bottles">Bottles</option>
                    <option value="vials">Vials</option>
                    <option value="sachets">Sachets</option>
                    <option value="pcs">Pcs</option>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onAdd}
        className="flex items-center gap-2 text-teal-600 text-sm font-semibold hover:bg-teal-50 px-4 py-2.5 rounded-xl border-2 border-dashed border-teal-200 w-full justify-center transition-colors"
      >
        <PlusIcon /> Add another medicine
      </button>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <FieldLabel>Number of Prescription Slips</FieldLabel>
          <Input
            type="number"
            min={0}
            placeholder="0"
            value={slipCount}
            onChange={(e) => onSlipCount(e.target.value)}
          />
          <p className="text-xs text-gray-400 mt-1">How many prescription papers you have</p>
        </div>
      </div>

      <div>
        <FieldLabel>Special Instructions / Notes</FieldLabel>
        <Textarea
          rows={3}
          placeholder="e.g. Please include leaflet, generic brand preferred..."
          value={specialNotes}
          onChange={(e) => onSpecialNotes(e.target.value)}
        />
      </div>
    </div>
  );
}

// Step 2 — Delivery & Contact
function StepDelivery({ patients, selectedPatientId, onSelectPatient, form, onField }) {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-1">Delivery & Contact</h3>
        <p className="text-sm text-gray-500">Tell us where to deliver and how to reach you.</p>
      </div>

      {patients.length > 0 && (
        <div>
          <FieldLabel required>Patient</FieldLabel>
          <Select value={selectedPatientId} onChange={(e) => onSelectPatient(e.target.value)}>
            {patients.map((p) => (
              <option key={p._id || p.id} value={p._id || p.id}>{p.name}</option>
            ))}
          </Select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <FieldLabel required>Full Name</FieldLabel>
          <Input
            placeholder="Recipient's full name"
            value={form.fullName}
            onChange={(e) => onField('fullName', e.target.value)}
          />
        </div>
        <div>
          <FieldLabel required>Phone Number</FieldLabel>
          <Input
            type="tel"
            placeholder="+977 98XXXXXXXX"
            value={form.phone}
            onChange={(e) => onField('phone', e.target.value)}
          />
        </div>
      </div>

      <div>
        <FieldLabel>Email Address <span className="text-gray-400 font-normal text-xs">(optional)</span></FieldLabel>
        <Input
          type="email"
          placeholder="yourname@email.com"
          value={form.email}
          onChange={(e) => onField('email', e.target.value)}
        />
      </div>

      <div>
        <FieldLabel required>Street Address / Area</FieldLabel>
        <Input
          placeholder="e.g. Baneshwor, Kathmandu"
          value={form.street}
          onChange={(e) => onField('street', e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <FieldLabel required>City</FieldLabel>
          <Input
            placeholder="e.g. Kathmandu"
            value={form.city}
            onChange={(e) => onField('city', e.target.value)}
          />
        </div>
        <div>
          <FieldLabel>District</FieldLabel>
          <Input
            placeholder="e.g. Bagmati"
            value={form.district}
            onChange={(e) => onField('district', e.target.value)}
          />
        </div>
      </div>

      <div>
        <FieldLabel>Landmark / Additional Info</FieldLabel>
        <Input
          placeholder="e.g. Near Pashupati Temple, blue gate"
          value={form.landmark}
          onChange={(e) => onField('landmark', e.target.value)}
        />
      </div>

      <div>
        <FieldLabel>Delivery Instructions</FieldLabel>
        <Textarea
          rows={2}
          placeholder="e.g. Call before arriving, leave at the gate..."
          value={form.deliveryInstructions}
          onChange={(e) => onField('deliveryInstructions', e.target.value)}
        />
      </div>

      <div className="bg-teal-50 border border-teal-100 rounded-xl p-3 flex gap-2 text-sm text-teal-700">
        <svg className="shrink-0 mt-0.5" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        Delivery fee and estimated time will be confirmed by the pharmacist before your order is finalised.
      </div>
    </div>
  );
}

// Step 3 — Review & Confirm
function StepReview({ medicines, slipCount, specialNotes, delivery, patients, selectedPatientId, pharmacyName }) {
  const patient = patients.find((p) => (p._id || p.id) === selectedPatientId);
  const fullAddress = [delivery.street, delivery.landmark, delivery.city, delivery.district].filter(Boolean).join(', ');

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-1">Review Your Order</h3>
        <p className="text-sm text-gray-500">Please check all details before submitting.</p>
      </div>

      {/* Pharmacy */}
      {pharmacyName && (
        <div className="bg-teal-50 rounded-xl p-4 border border-teal-100">
          <p className="text-xs font-semibold text-teal-600 uppercase tracking-wide mb-1">Pharmacy</p>
          <p className="font-semibold text-gray-800">{pharmacyName}</p>
        </div>
      )}

      {/* Medicines */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Medicines ({medicines.length} item{medicines.length !== 1 ? 's' : ''})</p>
        </div>
        <div className="divide-y divide-gray-50">
          {medicines.map((m, i) => (
            <div key={i} className="flex justify-between items-center px-4 py-3">
              <div>
                <p className="text-sm font-medium text-gray-800">{m.name || <span className="text-gray-400 italic">Unnamed</span>}</p>
                {m.unit && <p className="text-xs text-gray-400">{m.unit}</p>}
              </div>
              <span className="text-sm font-semibold text-gray-700">× {m.quantity}</span>
            </div>
          ))}
        </div>
        {(slipCount > 0 || specialNotes) && (
          <div className="px-4 py-3 border-t border-gray-100 space-y-1">
            {slipCount > 0 && <p className="text-xs text-gray-500">Prescription slips: <span className="font-medium text-gray-700">{slipCount}</span></p>}
            {specialNotes && <p className="text-xs text-gray-500">Notes: <span className="font-medium text-gray-700">{specialNotes}</span></p>}
          </div>
        )}
      </div>

      {/* Delivery */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Delivery Information</p>
        </div>
        <div className="px-4 py-3 space-y-2 text-sm">
          {patient && (
            <div className="flex justify-between">
              <span className="text-gray-500">Patient</span>
              <span className="font-medium text-gray-800">{patient.name}</span>
            </div>
          )}
          {delivery.fullName && (
            <div className="flex justify-between">
              <span className="text-gray-500">Recipient</span>
              <span className="font-medium text-gray-800">{delivery.fullName}</span>
            </div>
          )}
          {delivery.phone && (
            <div className="flex justify-between">
              <span className="text-gray-500">Phone</span>
              <span className="font-medium text-gray-800">{delivery.phone}</span>
            </div>
          )}
          {delivery.email && (
            <div className="flex justify-between">
              <span className="text-gray-500">Email</span>
              <span className="font-medium text-gray-800">{delivery.email}</span>
            </div>
          )}
          {fullAddress && (
            <div className="flex justify-between gap-4">
              <span className="text-gray-500 shrink-0">Address</span>
              <span className="font-medium text-gray-800 text-right">{fullAddress}</span>
            </div>
          )}
          {delivery.deliveryInstructions && (
            <div className="flex justify-between gap-4">
              <span className="text-gray-500 shrink-0">Instructions</span>
              <span className="font-medium text-gray-800 text-right">{delivery.deliveryInstructions}</span>
            </div>
          )}
        </div>
      </div>

      {/* Pricing note */}
      <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-sm text-amber-700 flex gap-2">
        <svg className="shrink-0 mt-0.5" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <span>The pharmacist will confirm the <strong>order price</strong> and <strong>delivery fee</strong> after reviewing your order. You'll verify before it's finalised.</span>
      </div>
    </div>
  );
}

export default function OrderPlacement() {
  const navigate = useNavigate();
  const query = useQuery();
  const notifId = query.get('notifId');
  const user = useAuthStore((s) => s.user) || {};

  const [step, setStep] = useState(1);
  const [notification, setNotification] = useState(null);
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [patientMedicines, setPatientMedicines] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  // Step 1
  const [medicines, setMedicines] = useState([{ name: '', quantity: 1, unit: '' }]);
  const [slipCount, setSlipCount] = useState('');
  const [specialNotes, setSpecialNotes] = useState('');

  // Step 2
  const [delivery, setDelivery] = useState({
    fullName: '',
    phone: '',
    email: '',
    street: '',
    city: '',
    district: '',
    landmark: '',
    deliveryInstructions: '',
  });

  useEffect(() => {
    (async () => {
      try {
        const pats = await getPatients();
        const arr = Array.isArray(pats) ? pats : [];
        setPatients(arr);
        if (arr.length > 0) setSelectedPatientId(arr[0]._id || arr[0].id);
      } catch {
        setPatients([]);
      }
    })();
  }, []);

  // Fetch patient's medicines and pre-populate the order list (skip when coming from a notification)
  useEffect(() => {
    if (!selectedPatientId || notifId) return;
    (async () => {
      try {
        const meds = await getMedicinesForPatient(selectedPatientId);
        const arr = Array.isArray(meds) ? meds.filter((m) => m.isActive !== false) : [];
        const shaped = arr.map((m) => ({
          displayName: `${m.name}${m.strength ? ` ${m.strength}${m.unit}` : ''}`,
          name: m.name,
          strength: m.strength || '',
          unit: m.unit || '',
          refillQty: m.refillThreshold || 30,
        }));
        setPatientMedicines(shaped);
        if (shaped.length > 0) {
          setMedicines(shaped.map((pm) => ({
            name: pm.displayName,
            quantity: pm.refillQty,
            unit: 'tablets',
            fromProfile: true,
          })));
        }
      } catch {
        setPatientMedicines([]);
      }
    })();
  }, [selectedPatientId, notifId]);

  useEffect(() => {
    if (!notifId) return;
    (async () => {
      try {
        const notifs = await getNotifications();
        const found = (notifs || []).find((n) => (n._id || n.id) === notifId);
        if (found) {
          setNotification(found);
          setMedicines([{ name: found.medicineName || found.offerTitle || '', quantity: 1, unit: '' }]);
          setDelivery((d) => ({ ...d, street: found.pharmacyAddress || '' }));
        }
      } catch {
        // ignore
      }
    })();
  }, [notifId]);

  const addMedicine = () => setMedicines((s) => [...s, { name: '', quantity: 1, unit: '', fromProfile: false }]);
  const updateMedicine = (idx, field, value) => {
    if (field === 'fill') {
      // value is a patientMedicine object — fill the whole row
      setMedicines((s) => s.map((m, i) => i === idx
        ? { ...m, name: value.displayName, quantity: value.refillQty, unit: 'tablets', fromProfile: true }
        : m
      ));
    } else {
      setMedicines((s) => s.map((m, i) => (i === idx ? { ...m, [field]: value, fromProfile: field === 'name' ? false : m.fromProfile } : m)));
    }
  };
  const removeMedicine = (idx) => setMedicines((s) => s.filter((_, i) => i !== idx));
  const updateDelivery = (field, value) => setDelivery((d) => ({ ...d, [field]: value }));

  const validateStep1 = () => {
    const hasName = medicines.every((m) => m.name.trim());
    const hasQty = medicines.every((m) => Number(m.quantity) >= 1);
    if (!hasName) { toast.error('Please enter a name for every medicine'); return false; }
    if (!hasQty) { toast.error('Quantity must be at least 1 for each medicine'); return false; }
    return true;
  };

  const validateStep2 = () => {
    if (!delivery.fullName.trim()) { toast.error('Please enter the recipient\'s full name'); return false; }
    if (!delivery.phone.trim()) { toast.error('Please enter a phone number'); return false; }
    if (!delivery.street.trim()) { toast.error('Please enter a delivery address'); return false; }
    if (!delivery.city.trim()) { toast.error('Please enter a city'); return false; }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setStep((s) => Math.min(TOTAL_STEPS, s + 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    setStep((s) => Math.max(1, s - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const userId = user._id || user.id || user;
      const patient = patients.find((p) => (p._id || p.id) === selectedPatientId) || {};
      const fullAddress = [delivery.street, delivery.landmark, delivery.city, delivery.district].filter(Boolean).join(', ');

      const orderData = {
        userId,
        patientId: patient._id || patient.id,
        patientName: patient.name || delivery.fullName || '',
        pharmacyId: 0,
        pharmacyName: notification?.pharmacyName || 'Partner Pharmacy',
        pharmacyAddress: notification?.pharmacyAddress || delivery.street || '',
        medicines: medicines.map((m) => ({
          id: `m-${Math.random().toString(36).slice(2, 9)}`,
          name: m.name,
          strength: '',
          unit: m.unit || '',
          quantity: Number(m.quantity) || 1,
          type: 'custom',
        })),
        notes: [specialNotes, delivery.deliveryInstructions].filter(Boolean).join(' | ') || '',
        deliveryFee: 'To be confirmed',
        estimatedDelivery: 'To be confirmed',
        totalItems: medicines.length,
        totalAmount: 'To be confirmed',
        status: 'pending',
        deliveryAddress: fullAddress,
        contactPhone: delivery.phone,
        contactEmail: delivery.email,
        slipCount: Number(slipCount) || 0,
      };

      await createOrder(orderData);
      // Mark the source notification as read so it disappears from all notification panels
      if (notifId) markNotificationAsRead(notifId).catch(() => {});
      setOrderSuccess(true);
      setTimeout(() => navigate('/'), 1500);
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'Failed to place order');
    } finally {
      setSubmitting(false);
    }
  };

  if (orderSuccess) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white">
        <style>{`
          @keyframes circle-scale-in {
            0%   { transform: scale(0); opacity: 0; }
            60%  { transform: scale(1.15); opacity: 1; }
            100% { transform: scale(1); opacity: 1; }
          }
          @keyframes tick-draw {
            0%   { stroke-dashoffset: 60; }
            100% { stroke-dashoffset: 0; }
          }
          @keyframes label-fade-up {
            0%   { opacity: 0; transform: translateY(10px); }
            100% { opacity: 1; transform: translateY(0); }
          }
          .success-circle {
            animation: circle-scale-in 0.45s cubic-bezier(0.22,1,0.36,1) forwards;
          }
          .success-tick {
            stroke-dasharray: 60;
            stroke-dashoffset: 60;
            animation: tick-draw 0.35s ease-out 0.4s forwards;
          }
          .success-label {
            opacity: 0;
            animation: label-fade-up 0.35s ease-out 0.65s forwards;
          }
        `}</style>

        <div className="success-circle w-28 h-28 rounded-full bg-teal-500 flex items-center justify-center shadow-xl shadow-teal-200">
          <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
            <polyline
              className="success-tick"
              points="14,28 24,40 42,18"
              stroke="white"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <p className="success-label mt-6 text-xl font-bold text-gray-800">Order Placed!</p>
        <p className="success-label mt-1 text-sm text-gray-400">Redirecting to dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="flex items-center gap-3 px-4 h-16 max-w-lg mx-auto">
          <button
            onClick={() => (step > 1 ? handleBack() : navigate(-1))}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeftIcon />
          </button>
          <h1 className="text-lg font-bold text-gray-800">Place Order</h1>
          {notification?.pharmacyName && (
            <span className="ml-auto text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full truncate max-w-[120px]">
              {notification.pharmacyName}
            </span>
          )}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-6">
        <StepIndicator step={step} />

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          {step === 1 && (
            <StepMedicines
              medicines={medicines}
              onUpdate={updateMedicine}
              onAdd={addMedicine}
              onRemove={removeMedicine}
              slipCount={slipCount}
              onSlipCount={setSlipCount}
              specialNotes={specialNotes}
              onSpecialNotes={setSpecialNotes}
              patientMedicines={patientMedicines}
            />
          )}
          {step === 2 && (
            <StepDelivery
              patients={patients}
              selectedPatientId={selectedPatientId}
              onSelectPatient={setSelectedPatientId}
              form={delivery}
              onField={updateDelivery}
            />
          )}
          {step === 3 && (
            <StepReview
              medicines={medicines}
              slipCount={slipCount}
              specialNotes={specialNotes}
              delivery={delivery}
              patients={patients}
              selectedPatientId={selectedPatientId}
              pharmacyName={notification?.pharmacyName}
            />
          )}
        </div>
      </div>

      {/* Bottom action bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 z-40">
        <div className="max-w-lg mx-auto flex gap-3">
          {step > 1 ? (
            <button
              onClick={handleBack}
              className="flex-1 border border-gray-200 text-gray-700 font-semibold py-3.5 rounded-2xl hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
          ) : (
            <button
              onClick={() => navigate(-1)}
              className="flex-1 border border-gray-200 text-gray-700 font-semibold py-3.5 rounded-2xl hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          )}

          {step < TOTAL_STEPS ? (
            <button
              onClick={handleNext}
              className="flex-[2] bg-teal-600 text-white font-semibold py-3.5 rounded-2xl hover:bg-teal-700 active:scale-95 transition-all"
            >
              Continue
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-[2] bg-teal-600 text-white font-semibold py-3.5 rounded-2xl hover:bg-teal-700 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Placing Order...
                </>
              ) : (
                'Confirm & Place Order'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
