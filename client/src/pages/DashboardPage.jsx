import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import Navbar from '../components/Navbar';
import MedCard from '../components/MedCard';
import { createPatient, getPatients } from '../api/patientApi';
import { deleteMedicine, getMedicinesForPatient, restockMedicine, updateMedicine } from '../api/medicineApi';
import { getStockStatus, sortMedicinesByUrgency } from '../utils/stockUtils';
import { useAppStore } from '../store/appStore';

function SkeletonCard() {
  return (
    <div className="animate-pulse flex flex-col overflow-hidden rounded-[20px] border border-border bg-card p-[16px]">
      <div className="flex items-start justify-between mb-[14px]">
        <div>
          <div className="h-[14px] w-[100px] rounded bg-border mb-[4px]" />
          <div className="h-[10px] w-[130px] rounded bg-border" />
        </div>
        <div className="h-[34px] w-[34px] rounded-[10px] bg-border shrink-0" />
      </div>
      <div className="h-[18px] w-[60px] rounded-full bg-border mb-[8px]" />
      <div className="flex justify-between mb-[4px]">
        <div className="h-[12px] w-[50px] rounded bg-border" />
        <div className="h-[12px] w-[20px] rounded bg-border" />
      </div>
      <div className="h-[6px] w-full rounded bg-border mb-[12px]" />
      <div className="h-[10px] w-[40px] rounded bg-border mb-[12px]" />
      <div className="h-[20px] w-full rounded bg-border mt-auto" />
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [loadingMedicines, setLoadingMedicines] = useState(false);

  const activePatientId = useAppStore((s) => s.activePatientId);
  const setActivePatientId = useAppStore((s) => s.setActivePatientId);

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

  async function refreshPatients() {
    const data = await getPatients();
    setPatients(data);

    const firstId = activePatientId || data[0]?._id || data[0]?.id;
    if (firstId && !activePatientId) setActivePatientId(firstId);

    const alertPairs = await Promise.all(
      data.map(async (p) => {
        try {
          const meds = await getMedicinesForPatient(p._id || p.id);
          const enriched = (meds || []).map((m) => {
            const { status, daysLeft } = getStockStatus(m);
            return { ...m, stockStatus: status, daysLeft };
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
  }

  async function refreshMedicines(pid) {
    if (!pid) return;
    setLoadingMedicines(true);
    try {
      const meds = await getMedicinesForPatient(pid);
      const enriched = (meds || []).map((m) => {
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
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!activePatientId) return;
    refreshMedicines(activePatientId);
  }, [activePatientId]);

  const hasAnyAlerts = useMemo(() => {
    return Object.values(patientAlertMap).some(Boolean);
  }, [patientAlertMap]);

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <Navbar hasAlerts={hasAnyAlerts} />

      <div className="dash-wrap flex-1 px-[24px] py-[22px] max-w-[1200px] w-full mx-auto">
        {/* Greeting */}
        <div className="mb-[24px]">
          <div className="font-body text-[12px] font-medium text-muted mb-[2px]">Good morning</div>
          <div className="font-display text-[20px] font-bold tracking-[-0.4px] text-navy">
            {patients.find((p) => (p._id || p.id) === activePatientId)?.name?.split(' ')[0] || 'User'}
          </div>
        </div>

        {/* Patient Profiles / Family */}
        <div className="mb-[28px]">
          <div className="font-alt text-[14px] font-semibold text-muted mb-[16px]">Family</div>
          <div className="flex gap-[20px] overflow-x-auto hide-scrollbar pb-[8px]">
            {patients.map((p) => {
              const hasAlert = !!patientAlertMap[p._id || p.id];
              const active = (p._id || p.id) === activePatientId;
              const initials = p.name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();

              return (
                <div key={p._id || p.id} className="flex flex-col items-center gap-[8px] shrink-0">
                  <button
                    type="button"
                    onClick={() => setActivePatientId(p._id || p.id)}
                    className={`relative flex items-center justify-center rounded-full p-[4px] bg-card drop-shadow-sm cursor-pointer transition-all ${
                      active ? 'border-2 border-mint' : 'border border-border opacity-80'
                    }`}
                    style={{ width: 56, height: 56 }}
                  >
                    <div className="flex items-center justify-center w-full h-full rounded-full bg-mint-light text-mint font-display font-bold text-[18px]">
                      {initials}
                    </div>
                    {hasAlert && (
                      <span className="absolute top-[0px] right-[0px] h-[14px] w-[14px] rounded-full bg-red border-[2.5px] border-card" />
                    )}
                  </button>
                  <div className={`font-alt text-[12px] ${active ? 'text-primary' : 'text-muted'}`}>
                    {p.name.split(' ')[0]}
                  </div>
                </div>
              );
            })}

            <div className="flex flex-col items-center gap-[8px] shrink-0">
              <button
                type="button"
                onClick={() => {
                  setAddProfileErrors({});
                  setAddProfileForm({ name: '', dateOfBirth: '', relation: 'self', allergies: '', pharmacyPin: '' });
                  setAddProfileOpen(true);
                }}
                className="flex items-center justify-center rounded-full border border-dashed border-[#cbd5e1] bg-card cursor-pointer transition-all hover:bg-faint"
                style={{ width: 56, height: 56 }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7c8fa6" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
              <div className="font-alt text-[12px] text-muted">Add</div>
            </div>
          </div>
        </div>

        {/* QR Strip */}
        <div
          className="mb-[28px] overflow-hidden rounded-[20px] bg-navy flex items-stretch shadow-qr"
          style={{ boxShadow: '0 4px 22px rgba(15,31,61,0.2)' }}
        >
          <div className="w-[5px] bg-mint flex-shrink-0" />
          <div className="flex flex-1 items-center justify-between gap-[16px] p-[18px_22px]">
            <div>
              <div className="mb-[4px] text-[10px] font-bold tracking-[0.12em] text-white/40 uppercase font-display">Pharmacy QR</div>
              <div className="mb-[2px] font-display text-[15px] font-bold text-white tracking-[-0.2px]">Show at pharmacy counter</div>
              <div className="text-[11px] text-[rgba(255,255,255,0.5)] font-body leading-[1.4]">
                Pharmacist scans to see your exact dosages & prescription.
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate('/qr')}
              className="flex shrink-0 items-center justify-center rounded-full bg-mint size-[44px] cursor-pointer hover:bg-mint-mid active:scale-[0.97] transition-all text-white shadow-sm"
              aria-label="Show QR Code"
            >
              <svg width="20" height="20" viewBox="0 0 21 21" fill="none" aria-hidden="true">
                <rect x="3" y="3" width="7" height="7" rx="1" fill="currentColor" />
                <rect x="14" y="3" width="7" height="7" rx="1" fill="currentColor" />
                <rect x="3" y="14" width="7" height="7" rx="1" fill="currentColor" />
                <rect x="14" y="14" width="3" height="3" fill="currentColor" />
                <rect x="18" y="18" width="3" height="3" fill="currentColor" />
              </svg>
            </button>
          </div>
        </div>

        {/* Medicine Section Header */}
        <div className="flex items-center justify-between mb-[14px]">
          <div className="font-display text-[15px] font-bold tracking-[-0.2px] text-navy">My Medicines</div>
          <div className="flex gap-[8px]">
            <button
              type="button"
              className="rounded-full bg-primary px-[14px] py-[6px] text-[11px] font-bold tracking-[0.2px] text-white hover:bg-navy-mid transition-all flex items-center gap-[6px] cursor-pointer"
              onClick={async () => {
                if (!activePatientId) return;
                try {
                  const meds = await getMedicinesForPatient(activePatientId);
                  // Reduce each medicine by one day usage and persist.
                  for (const m of meds) {
                    const daily = Number(m.frequencyPerDay) * Number(m.dosePerIntake);
                    const next = Math.max(0, Number(m.currentStock) - daily);
                    await updateMedicine(m._id, { currentStock: next });
                  }
                  toast.success('Day simulated');
                  await refreshMedicines(activePatientId);
                } catch {
                  toast.error('Simulate day failed');
                }
              }}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Simulate
            </button>

            <button
              type="button"
              className="rounded-full bg-primary px-[14px] py-[6px] text-[11px] font-bold tracking-[0.2px] text-white hover:bg-navy-mid transition-all flex items-center gap-[6px] cursor-pointer"
              onClick={() => navigate('/add-medicine')}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
              Add
            </button>
          </div>
        </div>

        {/* Medicine Grid */}
        {loadingPatients ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[14px]">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : medicines.length === 0 && !loadingMedicines ? (
          <div className="col-span-full text-center py-[56px] px-[20px] text-muted">
            <svg width="42" height="42" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="mx-auto mb-[13px] text-border">
              <path
                d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2v-4M9 21H5a2 2 0 0 1-2-2v-4m0 0h18"
                stroke="#e2e8f4"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="font-display text-[16px] font-bold text-navy mb-[6px]">No medicines added yet</div>
            <div className="text-[13px] text-muted">Click 'Add Medicine' to start tracking</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-[14px]">
            {loadingMedicines ? (
              <>
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </>
            ) : (
              medicines.map((m, idx) => (
                <MedCard
                  key={m._id}
                  medicine={m}
                  index={idx}
                  onRestock={(med) => {
                    setRestockTarget(med);
                    const qty = Math.max(0, med.frequencyPerDay * med.dosePerIntake * 30);
                    setRestockQty(String(Math.round(qty)));
                  }}
                  onViewRx={(med) => {
                    if (med.prescriptionImgUrl) setLightboxUrl(med.prescriptionImgUrl);
                  }}
                  onEdit={(med) => navigate(`/add-medicine/${med._id}`)}
                  onRemove={(med) => setRemoveTarget(med)}
                />
              ))
            )}
          </div>
        )}
      </div>

      {/* Add Patient Profile Modal */}
      {addProfileOpen ? (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center p-[20px] bg-[rgba(15,31,61,0.45)] backdrop-blur"
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setAddProfileOpen(false);
          }}
        >
          <div className="relative w-full max-w-[420px] rounded-[16px] bg-card p-[26px] shadow-modal">
            <div
              className="absolute top-[13px] right-[13px] flex h-[27px] w-[27px] items-center justify-center rounded-full bg-bg cursor-pointer"
              onClick={() => setAddProfileOpen(false)}
              role="button"
              aria-label="Close"
              style={{ color: '#6b7a99' }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" stroke="#6b7a99" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>

            <div className="font-display text-[18px] font-bold text-navy mb-[4px]">Add Patient Profile</div>
            <div className="text-[13px] text-muted mb-[18px] font-body">Add a family member or yourself</div>

            <div className="space-y-[14px]">
              <div>
                <label className="mb-[7px] block text-[12px] font-semibold tracking-[0.02em] text-navy">Full name *</label>
                <input
                  type="text"
                  value={addProfileForm.name}
                  onChange={(e) => setAddProfileForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full rounded-btn border-[1.5px] border-border bg-card px-[15px] py-[11px] text-[14px] text-navy outline-none transition-colors focus:border-mint"
                />
                {addProfileErrors.name ? <div className="mt-[7px] text-[12px] font-semibold text-red">{addProfileErrors.name}</div> : null}
              </div>

              <div className="grid grid-cols-2 gap-[12px]">
                <div>
                  <label className="mb-[7px] block text-[12px] font-semibold tracking-[0.02em] text-navy">DOB</label>
                  <input
                    type="date"
                    value={addProfileForm.dateOfBirth}
                    onChange={(e) => setAddProfileForm((f) => ({ ...f, dateOfBirth: e.target.value }))}
                    className="w-full rounded-btn border-[1.5px] border-border bg-card px-[15px] py-[11px] text-[14px] text-navy outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="mb-[7px] block text-[12px] font-semibold tracking-[0.02em] text-navy">Relation *</label>
                  <select
                    value={addProfileForm.relation}
                    onChange={(e) => setAddProfileForm((f) => ({ ...f, relation: e.target.value }))}
                    className="w-full rounded-btn border-[1.5px] border-border bg-card px-[15px] py-[11px] text-[14px] text-navy outline-none transition-colors"
                  >
                    <option value="self">self</option>
                    <option value="mother">mother</option>
                    <option value="father">father</option>
                    <option value="grandmother">grandmother</option>
                    <option value="grandfather">grandfather</option>
                    <option value="spouse">spouse</option>
                    <option value="other">other</option>
                  </select>
                  {addProfileErrors.relation ? (
                    <div className="mt-[7px] text-[12px] font-semibold text-red">{addProfileErrors.relation}</div>
                  ) : null}
                </div>
              </div>

              <div>
                <label className="mb-[7px] block text-[12px] font-semibold tracking-[0.02em] text-navy">Allergies / Notes</label>
                <textarea
                  value={addProfileForm.allergies}
                  onChange={(e) => setAddProfileForm((f) => ({ ...f, allergies: e.target.value }))}
                  placeholder="e.g. Allergic to Sulfa drugs"
                  className="w-full rounded-btn border-[1.5px] border-border bg-card px-[15px] py-[11px] text-[14px] text-navy outline-none transition-colors"
                  rows={3}
                />
              </div>

              <div>
                <label className="mb-[7px] block text-[12px] font-semibold tracking-[0.02em] text-navy">Pharmacy PIN: 4-digit *</label>
                <input
                  inputMode="numeric"
                  maxLength={4}
                  value={addProfileForm.pharmacyPin}
                  onChange={(e) => setAddProfileForm((f) => ({ ...f, pharmacyPin: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                  placeholder="e.g. 4782"
                  className="w-full rounded-btn border-[1.5px] border-border bg-card px-[15px] py-[11px] text-[14px] text-navy outline-none transition-colors"
                />
                <div className="mt-[5px] text-[11px] text-muted font-body">
                  This PIN is required when pharmacist confirms dispensing
                </div>
                {addProfileErrors.pharmacyPin ? (
                  <div className="mt-[7px] text-[12px] font-semibold text-red">{addProfileErrors.pharmacyPin}</div>
                ) : null}
              </div>

              <div className="flex gap-[8px] mt-[16px]">
                <button
                  type="button"
                  className="flex-1 rounded-btn border-[1.5px] border-border bg-card py-[9px] text-[13px] font-body font-semibold text-navy cursor-pointer"
                  onClick={() => setAddProfileOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="flex-1 rounded-btn bg-navy text-white border-none py-[12px] text-[14px] font-semibold cursor-pointer active:scale-[0.98]"
                  onClick={async () => {
                    const nextErrors = {};
                    if (!addProfileForm.name.trim()) nextErrors.name = 'Name is required';
                    if (!addProfileForm.relation) nextErrors.relation = 'Relation is required';
                    if (!/^\d{4}$/.test(addProfileForm.pharmacyPin)) nextErrors.pharmacyPin = 'PIN must be exactly 4 digits';

                    setAddProfileErrors(nextErrors);
                    if (Object.keys(nextErrors).length) return;

                    try {
                      await createPatient({
                        name: addProfileForm.name.trim(),
                        dateOfBirth: addProfileForm.dateOfBirth || undefined,
                        relation: addProfileForm.relation,
                        allergies: addProfileForm.allergies || '',
                        pharmacyPin: addProfileForm.pharmacyPin,
                      });
                      setAddProfileOpen(false);
                      toast.success('Profile added');
                      await refreshPatients();
                      if (!activePatientId && patients[0]?._id) {
                        // store will update via refreshPatients' firstId selection
                      }
                    } catch (err) {
                      toast.error(err?.response?.data?.message || 'Could not add profile');
                    }
                  }}
                >
                  Add Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Restock Modal */}
      {restockTarget ? (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center p-[20px] bg-[rgba(15,31,61,0.45)] backdrop-blur"
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setRestockTarget(null);
          }}
        >
          <div className="w-full max-w-[420px] rounded-[16px] bg-card p-[26px] relative shadow-modal">
            <div className="absolute top-[13px] right-[13px] flex h-[27px] w-[27px] items-center justify-center rounded-full bg-bg cursor-pointer" onClick={() => setRestockTarget(null)}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" stroke="#6b7a99" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <div className="font-display text-[18px] font-bold text-navy mb-[4px]">Restock Medicine</div>
            <div className="text-[13px] text-muted mb-[18px] font-body">Update stock count after purchasing</div>

            <div className="bg-bg rounded-[10px] px-[14px] py-[12px] mb-[16px] border border-border">
              <div className="font-display text-[15px] font-bold text-navy mb-[2px]">{restockTarget.name}</div>
              <div className="text-[12px] text-muted font-body">
                {restockTarget.frequencyPerDay}× daily · Currently: {restockTarget.currentStock} tablets
              </div>
            </div>

            <div>
              <label className="mb-[7px] block text-[12px] font-semibold text-navy">Quantity purchased (tablets)</label>
              <input
                type="number"
                min={0}
                value={restockQty}
                onChange={(e) => setRestockQty(e.target.value)}
                className="w-full rounded-btn border-[1.5px] border-border bg-card px-[15px] py-[11px] text-[14px] text-navy outline-none transition-colors"
              />
            </div>

            <div className="flex gap-[8px] mt-[16px]">
              <button
                type="button"
                className="flex-1 rounded-btn border-[1.5px] border-border bg-card py-[9px] text-[13px] font-body font-semibold text-navy cursor-pointer"
                onClick={() => setRestockTarget(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="flex-1 rounded-btn bg-mint text-white border-none py-[12px] text-[14px] font-semibold cursor-pointer active:scale-[0.98]"
                onClick={async () => {
                  const qty = Number(restockQty);
                  if (Number.isNaN(qty) || qty < 0) {
                    toast.error('Enter a valid quantity');
                    return;
                  }
                  try {
                    await restockMedicine(restockTarget._id, qty);
                    toast.success('Stock updated');
                    setRestockTarget(null);
                    await refreshMedicines(activePatientId);
                    await refreshPatients();
                  } catch (err) {
                    toast.error(err?.response?.data?.message || 'Restock failed');
                  }
                }}
              >
                Update Stock
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Delete Modal */}
      {removeTarget ? (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center p-[20px] bg-[rgba(15,31,61,0.45)] backdrop-blur"
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setRemoveTarget(null);
          }}
        >
          <div className="w-full max-w-[420px] rounded-[16px] bg-card p-[26px] relative shadow-modal">
            <div className="absolute top-[13px] right-[13px] flex h-[27px] w-[27px] items-center justify-center rounded-full bg-bg cursor-pointer" onClick={() => setRemoveTarget(null)}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" stroke="#6b7a99" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <div className="font-display text-[18px] font-bold text-navy mb-[4px]">Remove Medicine</div>
            <div className="text-[13px] text-muted mb-[18px] font-body">
              Remove <strong>{removeTarget.name}</strong> ? This cannot be undone.
            </div>
            <div className="flex gap-[8px] mt-[16px]">
              <button
                type="button"
                className="flex-1 rounded-btn border-[1.5px] border-border bg-card py-[9px] text-[13px] font-body font-semibold text-navy cursor-pointer"
                onClick={() => setRemoveTarget(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="flex-1 rounded-btn bg-red text-white border-none py-[12px] text-[14px] font-semibold cursor-pointer active:scale-[0.98]"
                onClick={async () => {
                  try {
                    await deleteMedicine(removeTarget._id);
                    toast.success('Medicine removed');
                    setRemoveTarget(null);
                    await refreshMedicines(activePatientId);
                    await refreshPatients();
                  } catch (err) {
                    toast.error(err?.response?.data?.message || 'Remove failed');
                  }
                }}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Lightbox */}
      {lightboxUrl ? (
        <div
          className="fixed inset-0 z-[300] flex flex-col items-center justify-center p-[20px] gap-[12px] bg-black/90"
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setLightboxUrl(null);
          }}
        >
          <img
            src={lightboxUrl}
            alt="Prescription"
            className="w-full max-w-[680px] rounded-card object-contain"
            style={{ borderRadius: 16 }}
          />
          <button
            type="button"
            className="px-[24px] py-[12px] rounded-[12px] bg-[rgba(255,255,255,0.15)] border-none cursor-pointer font-body text-[14px] font-bold text-white"
            onClick={() => setLightboxUrl(null)}
          >
            Close
          </button>
        </div>
      ) : null}
    </div>
  );
}

