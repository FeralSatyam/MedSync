import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';

import { useAppStore } from '../store/appStore';
import { createMedicine, getMedicinesForPatient, updateMedicine } from '../api/medicineApi';
import SimpleCamera from '../components/SimpleCamera';

// ── Config ────────────────────────────────────────────────────────────────────

const FORM_OPTIONS = [
  { value: 'tablets',   label: 'Tablets & Capsules',  emoji: '💊', desc: 'Pills, tablets, capsules' },
  { value: 'syrup',     label: 'Syrups & Solutions',  emoji: '🧴', desc: 'Liquid medicines, drops' },
  { value: 'cream',     label: 'Creams & Ointments',  emoji: '🫙', desc: 'Topical applications' },
  { value: 'inhaler',   label: 'Inhalers',             emoji: '💨', desc: 'MDI, dry powder inhalers' },
  { value: 'injection', label: 'Injections',           emoji: '💉', desc: 'Vials, ampoules, pens' },
  { value: 'powder',    label: 'Powder Form',          emoji: '⚗️', desc: 'Sachets, powder packs' },
];

const STRENGTH_CONFIG = {
  tablets:   { units: ['mg', 'mcg', 'g'],                                defaultUnit: 'mg',       label: 'Strength per tablet / capsule', placeholder: '500',  disabled: false },
  syrup:     { units: ['mg/ml', 'mg/5ml'],                               defaultUnit: 'mg/ml',    label: 'Concentration',                 placeholder: '25',   disabled: false },
  cream:     { units: [],                                                 defaultUnit: '',          label: 'Strength',                      placeholder: '',     disabled: true  },
  inhaler:   { units: ['mcg/puff'],                                       defaultUnit: 'mcg/puff', label: 'Dose per puff',                 placeholder: '200',  disabled: false },
  injection: { units: ['mg/ml', 'mcg/ml', 'IU/ml', 'g/ml', 'mg/dose'],  defaultUnit: 'mg/ml',    label: 'Concentration per dose',        placeholder: '10',   disabled: false },
  powder:    { units: ['mg', 'g'],                                        defaultUnit: 'mg',       label: 'Strength per serving',          placeholder: '200',  disabled: false },
};

const QUANTITY_CONFIG = {
  tablets:   { label: 'Number of Tablets / Capsules', step: '1',    units: null,               defaultUnit: 'tablets', placeholder: '30',  hint: 'Total count of individual units you currently have.' },
  syrup:     { label: 'Volume Available',             step: '0.1',  units: ['mL', 'L'],         defaultUnit: 'mL',      placeholder: '100', hint: 'Total liquid volume in the bottle.' },
  cream:     { label: 'Estimated Duration',           step: '1',    units: ['days', 'weeks'],   defaultUnit: 'days',    placeholder: '30',  hint: 'How long this tube or jar is expected to last.', isDuration: true },
  inhaler:   { label: 'Puffs Remaining',              step: '1',    units: null,               defaultUnit: 'puffs',   placeholder: '200', hint: 'Check the dose counter on your inhaler.' },
  injection: { label: 'Quantity Available',           step: '1',    units: ['vials', 'doses'],  defaultUnit: 'vials',   placeholder: '5',   hint: 'Number of vials or pre-filled syringes.' },
  powder:    { label: 'Quantity Available',           step: '0.01', units: ['g', 'mg'],         defaultUnit: 'g',       placeholder: '500', hint: 'Total amount of powder you have.' },
};

const ORDINALS = ['First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth'];
const DEFAULT_DOSE_TIMES = ['08:00', '14:00', '20:00', '06:00', '10:00', '16:00', '22:00', '12:00'];

const STEPS = [
  { number: 1, label: 'Basic Info',   pct: 25  },
  { number: 2, label: 'Quantity',     pct: 50  },
  { number: 3, label: 'Dose Times',   pct: 75  },
  { number: 4, label: 'Prescription', pct: 100 },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function AddMedicinePage() {
  const navigate = useNavigate();
  const { medicineId } = useParams();
  const isEdit = Boolean(medicineId);
  const activePatientId = useAppStore((s) => s.activePatientId);

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  // Step 1
  const [name, setName] = useState('');
  const [medicinePhoto, setMedicinePhoto] = useState(null);
  const [medicinePhotoPreview, setMedicinePhotoPreview] = useState('');
  const [medicineForm, setMedicineForm] = useState('tablets');
  const [strengthValue, setStrengthValue] = useState('');
  const [strengthUnit, setStrengthUnit] = useState('mg');

  // Step 2
  const [quantityValue, setQuantityValue] = useState('');
  const [quantityUnit, setQuantityUnit] = useState('tablets');
  const [alertThreshold, setAlertThreshold] = useState(7);
  const [timesPerDay, setTimesPerDay] = useState(1);

  // Step 3
  const [doseTimes, setDoseTimes] = useState(['08:00']);

  // Step 4
  const [doctorName, setDoctorName] = useState('');
  const [hospitalName, setHospitalName] = useState('');
  const [prescriptionDate, setPrescriptionDate] = useState('');
  const [prescriptionFile, setPrescriptionFile] = useState(null);
  const [prescriptionPreviewUrl, setPrescriptionPreviewUrl] = useState('');

  // Sync doseTimes array length with timesPerDay
  useEffect(() => {
    setDoseTimes((prev) => {
      const updated = [...prev];
      while (updated.length < timesPerDay) {
        updated.push(DEFAULT_DOSE_TIMES[updated.length] || '08:00');
      }
      return updated.slice(0, timesPerDay);
    });
  }, [timesPerDay]);

  // Guard: must have active patient
  useEffect(() => {
    if (!activePatientId) {
      toast.error('Select a patient first');
      navigate('/');
    }
  }, [activePatientId, navigate]);

  // Load data for edit mode
  useEffect(() => {
    if (!isEdit || !activePatientId) return;
    (async () => {
      try {
        const meds = await getMedicinesForPatient(activePatientId);
        const med = meds.find((m) => m._id === medicineId);
        if (!med) { toast.error('Medicine not found'); navigate('/'); return; }

        const form = med.medicineForm || 'tablets';
        setMedicineForm(form);
        setName(med.name || '');
        setStrengthValue(med.strength || '');
        setStrengthUnit(med.unit || STRENGTH_CONFIG[form].defaultUnit || 'mg');
        setQuantityValue(String(med.currentStock ?? ''));
        setQuantityUnit(med.stockUnit || QUANTITY_CONFIG[form].defaultUnit);
        setAlertThreshold(med.refillThreshold || 7);
        const freq = med.frequencyPerDay || 1;
        setTimesPerDay(freq);
        const times = Array.isArray(med.doseTimes) && med.doseTimes.length
          ? med.doseTimes
          : [med.firstDoseTime || '08:00'];
        setDoseTimes(times.slice(0, freq));
        setDoctorName(med.doctorName || '');
        setHospitalName(med.hospitalName || '');
        setPrescriptionDate(med.prescriptionDate ? String(med.prescriptionDate).slice(0, 10) : '');
        if (med.medicinePhotoUrl) setMedicinePhotoPreview(med.medicinePhotoUrl);
        if (med.prescriptionImgUrl) setPrescriptionPreviewUrl(med.prescriptionImgUrl);
      } catch {
        toast.error('Could not load medicine data');
      }
    })();
  }, [isEdit, activePatientId, medicineId, navigate]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleFormChange = (newForm) => {
    setMedicineForm(newForm);
    setStrengthValue('');
    setStrengthUnit(STRENGTH_CONFIG[newForm].defaultUnit);
    setQuantityValue('');
    setQuantityUnit(QUANTITY_CONFIG[newForm].defaultUnit);
  };

  const handleMedicinePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setMedicinePhoto(file);
      setMedicinePhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleCameraCapture = (capturedName) => {
    if (capturedName?.trim()) {
      setName(capturedName.trim());
      toast.success(`Medicine name: ${capturedName}`);
    } else {
      toast.error('No name captured');
    }
    setShowCamera(false);
  };

  // ── Validation & navigation ───────────────────────────────────────────────

  const validate = () => {
    if (step === 1) {
      if (!name.trim()) { toast.error('Medicine name is required'); return false; }
      if (!STRENGTH_CONFIG[medicineForm].disabled && !strengthValue) {
        toast.error('Please enter the strength'); return false;
      }
      return true;
    }
    if (step === 2) {
      if (!quantityValue) {
        toast.error(QUANTITY_CONFIG[medicineForm].isDuration
          ? 'Please enter the estimated duration'
          : 'Please enter the quantity');
        return false;
      }
      if (!alertThreshold || alertThreshold < 1) { toast.error('Alert threshold must be at least 1'); return false; }
      return true;
    }
    return true;
  };

  const nextStep = () => { if (validate()) setStep((s) => Math.min(s + 1, 4)); };
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!activePatientId || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const strCfg = STRENGTH_CONFIG[medicineForm];
      const isCreams = medicineForm === 'cream';

      const fd = new FormData();
      if (!isEdit) fd.append('patientId', activePatientId);

      // Step 1
      fd.append('name', name.trim());
      fd.append('medicineForm', medicineForm);
      fd.append('strength', strCfg.disabled ? '0' : strengthValue);
      fd.append('unit', strCfg.disabled ? 'N/A' : strengthUnit);

      // Step 2
      const stockDays = isCreams
        ? String(quantityUnit === 'weeks' ? Number(quantityValue) * 7 : Number(quantityValue))
        : quantityValue;
      fd.append('currentStock', stockDays);
      fd.append('stockUnit', quantityUnit);
      if (isCreams) fd.append('durationEstimate', `${quantityValue} ${quantityUnit}`);
      fd.append('refillThreshold', String(alertThreshold));
      fd.append('frequencyPerDay', String(timesPerDay));
      fd.append('dosePerIntake', '1');

      // Step 3
      fd.append('firstDoseTime', doseTimes[0] || '08:00');
      fd.append('doseTimes', JSON.stringify(doseTimes));
      fd.append('remindersEnabled', 'true');

      // Step 4
      fd.append('doctorName', doctorName);
      fd.append('hospitalName', hospitalName);
      if (prescriptionDate) fd.append('prescriptionDate', prescriptionDate);
      if (prescriptionFile) fd.append('prescriptionImage', prescriptionFile);
      if (medicinePhoto) fd.append('medicinePhoto', medicinePhoto);

      if (isEdit) {
        const res = await updateMedicine(medicineId, fd);
        toast.success(`${res.name} updated!`);
      } else {
        const res = await createMedicine(fd);
        toast.success(`${res.name} added!`);
      }
      navigate('/');
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Save failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Step renderers ────────────────────────────────────────────────────────

  const renderStepIndicator = () => {
    const current = STEPS[step - 1];
    return (
      <div className="mb-8">
        <div className="flex items-center gap-1 mb-5">
          {STEPS.map((s, i) => (
            <div key={s.number} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                step > s.number
                  ? 'bg-mint text-white rounded-full'
                  : step === s.number
                  ? 'bg-mint text-white ring-4 ring-mint/20 rounded-full'
                  : 'bg-faint text-muted rounded-full'
              }`}>
                {step > s.number ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : s.number}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-0.5 flex-1 w-8 mx-1 rounded-full transition-all ${step > s.number ? 'bg-mint' : 'bg-border'}`} />
              )}
            </div>
          ))}
        </div>
        <div className="w-full bg-faint rounded-full h-1.5 mb-3">
          <div
            className="bg-mint h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${current.pct}%` }}
          />
        </div>
        <div className="flex justify-between items-baseline">
          <h2 className="font-display text-xl font-bold text-navy">{current.label}</h2>
          <span className="text-xs text-muted">Step {step} of {STEPS.length}</span>
        </div>
      </div>
    );
  };

  // ── Step 1: Basic Info ────────────────────────────────────────────────────

  const renderStep1 = () => {
    const strCfg = STRENGTH_CONFIG[medicineForm];
    return (
      <div className="space-y-6">
        {/* Medicine Photo */}
        <div>
          <label className="mb-2 block text-xs font-semibold tracking-widest text-muted uppercase">Medicine Photo</label>
          <div
            className="border-2 border-dashed border-border rounded-2xl p-5 text-center cursor-pointer hover:border-mint hover:bg-mint-light transition-all"
            onClick={() => document.getElementById('med-photo-input')?.click()}
          >
            <input
              id="med-photo-input"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleMedicinePhotoUpload}
            />
            {medicinePhotoPreview ? (
              <div className="space-y-2">
                <img
                  src={medicinePhotoPreview}
                  alt="Medicine"
                  className="w-28 h-28 object-cover rounded-xl mx-auto border border-border"
                />
                <p className="text-xs text-muted">Tap to change photo</p>
              </div>
            ) : (
              <div className="py-2">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" className="mx-auto mb-2 text-muted">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="1.5" />
                  <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="1.5" />
                </svg>
                <p className="text-sm font-medium text-muted">Tap to add a photo</p>
                <p className="text-xs text-muted mt-0.5">Optional — helps with quick identification</p>
              </div>
            )}
          </div>
        </div>

        {/* Medicine Name */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold tracking-widest text-muted uppercase">
            Medicine Name <span className="text-red">*</span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Amoxicillin"
              className="flex-1 rounded-xl border border-border bg-faint px-4 py-3 text-sm text-navy focus:outline-none focus:border-mint transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowCamera(true)}
              className="bg-mint text-white px-4 rounded-xl hover:opacity-90 transition-opacity flex items-center gap-1.5 text-sm font-medium whitespace-nowrap"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              Scan
            </button>
          </div>
        </div>

        {/* Form of Medicine */}
        <div>
          <label className="mb-3 block text-xs font-semibold tracking-widests text-muted uppercase">
            Form of Medicine <span className="text-red">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            {FORM_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleFormChange(opt.value)}
                className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 text-left transition-all ${
                  medicineForm === opt.value
                    ? 'border-mint bg-mint-light'
                    : 'border-border bg-white hover:border-mint/30'
                }`}
              >
                <span className="text-2xl leading-none shrink-0">{opt.emoji}</span>
                <div className="min-w-0">
                  <p className={`text-xs font-semibold leading-snug ${medicineForm === opt.value ? 'text-mint' : 'text-navy'}`}>
                    {opt.label}
                  </p>
                  <p className="text-[10px] text-muted truncate mt-0.5">{opt.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Strength */}
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <label className="text-xs font-semibold tracking-widests text-muted uppercase">{strCfg.label}</label>
            {strCfg.disabled && (
              <span className="text-[10px] font-normal text-muted bg-faint px-2 py-0.5 rounded-full border border-border">
                Not applicable
              </span>
            )}
          </div>
          <div className={`flex gap-2 ${strCfg.disabled ? 'opacity-50 pointer-events-none' : ''}`}>
            <input
              type={strCfg.disabled ? 'text' : 'number'}
              step="any"
              value={strCfg.disabled ? '' : strengthValue}
              onChange={(e) => setStrengthValue(e.target.value)}
              disabled={strCfg.disabled}
              placeholder={strCfg.disabled ? 'Not applicable for creams' : strCfg.placeholder}
              className="flex-1 rounded-xl border border-border bg-faint px-4 py-3 text-sm text-navy focus:outline-none focus:border-mint transition-colors disabled:opacity-50 disabled:pointer-events-none"
            />
            {!strCfg.disabled && strCfg.units.length > 1 && (
              <select
                value={strengthUnit}
                onChange={(e) => setStrengthUnit(e.target.value)}
                className="rounded-xl border border-border bg-faint px-3 py-3 text-sm text-navy focus:outline-none focus:border-mint transition-colors"
              >
                {strCfg.units.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            )}
            {!strCfg.disabled && strCfg.units.length === 1 && (
              <div className="px-4 rounded-xl border border-border bg-faint text-sm font-semibold text-navy flex items-center whitespace-nowrap">
                {strCfg.units[0]}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ── Step 2: Quantity & Schedule ───────────────────────────────────────────

  const renderStep2 = () => {
    const qtyCfg = QUANTITY_CONFIG[medicineForm];
    return (
      <div className="space-y-6">
        {/* Quantity */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold tracking-widests text-muted uppercase">
            {qtyCfg.label} <span className="text-red">*</span>
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              step={qtyCfg.step}
              min="0"
              value={quantityValue}
              onChange={(e) => setQuantityValue(e.target.value)}
              placeholder={qtyCfg.placeholder}
              className="flex-1 rounded-xl border border-border bg-faint px-4 py-3 text-sm text-navy focus:outline-none focus:border-mint transition-colors"
            />
            {qtyCfg.units ? (
              <select
                value={quantityUnit}
                onChange={(e) => setQuantityUnit(e.target.value)}
                className="rounded-xl border border-border bg-faint px-3 py-3 text-sm text-navy focus:outline-none focus:border-mint transition-colors"
              >
                {qtyCfg.units.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            ) : (
              <div className="px-4 rounded-xl border border-border bg-faint text-sm font-semibold text-navy flex items-center whitespace-nowrap">
                {qtyCfg.defaultUnit}
              </div>
            )}
          </div>
          <p className="text-xs text-muted mt-1.5">{qtyCfg.hint}</p>
        </div>

        {/* Alert Threshold */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold tracking-widests text-muted uppercase">
            Alert Threshold <span className="text-red">*</span>
          </label>
          <div className="flex gap-2 items-center">
            <input
              type="number"
              min={1}
              value={alertThreshold}
              onChange={(e) => setAlertThreshold(Number(e.target.value))}
              className="flex-1 rounded-xl border border-border bg-faint px-4 py-3 text-sm text-navy focus:outline-none focus:border-mint transition-colors"
            />
            <div className="px-4 rounded-xl border border-border bg-faint text-sm font-semibold text-navy flex items-center whitespace-nowrap h-[46px]">
              days
            </div>
          </div>
          <p className="text-xs text-muted mt-1.5">
            {medicineForm === 'cream'
              ? 'Alert when fewer than this many days of the estimated duration remain.'
              : 'Get an alert when you have roughly this many days of supply left.'}
          </p>
        </div>

        {/* Times per Day */}
        <div>
          <label className="mb-4 block text-xs font-semibold tracking-widests text-muted uppercase">
            Number of Times per Day <span className="text-red">*</span>
          </label>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setTimesPerDay((t) => Math.max(t - 1, 1))}
              className="w-11 h-11 rounded-full bg-faint border border-border text-navy text-xl font-bold flex items-center justify-center hover:bg-border transition-colors"
            >
              −
            </button>
            <div className="flex-1 text-center py-3 rounded-2xl bg-white border border-border">
              <span className="text-3xl font-bold text-navy">{timesPerDay}</span>
              <p className="text-xs text-muted mt-0.5">
                {timesPerDay === 1 ? 'once daily' : timesPerDay === 2 ? 'twice daily' : `${timesPerDay} times daily`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setTimesPerDay((t) => Math.min(t + 1, 8))}
              className="w-11 h-11 rounded-full bg-faint border border-border text-navy text-xl font-bold flex items-center justify-center hover:bg-border transition-colors"
            >
              +
            </button>
          </div>
        </div>

        {/* Hint */}
        <div className="bg-mint-light rounded-2xl p-4 flex gap-3">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-mint shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
            <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <p className="text-xs text-mint font-medium leading-relaxed">
            You'll set the exact time for each dose in the next step.
            Total dose slots: <strong>{timesPerDay}</strong>.
          </p>
        </div>
      </div>
    );
  };

  // ── Step 3: Dose Times ────────────────────────────────────────────────────

  const renderStep3 = () => (
    <div className="space-y-4">
      <p className="text-sm text-muted leading-relaxed">
        Set the exact time for each of your{' '}
        <strong className="text-navy">{timesPerDay}</strong> daily{' '}
        {timesPerDay === 1 ? 'dose' : 'doses'}.
      </p>
      {doseTimes.map((time, i) => (
        <div key={i} className="bg-white rounded-2xl border border-border p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-full bg-mint-light flex items-center justify-center shrink-0">
              <span className="text-mint text-sm font-bold">{i + 1}</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-navy">{ORDINALS[i] || `Dose ${i + 1}`} Dose</p>
              <p className="text-xs text-muted">
                When do you take your {(ORDINALS[i] || `${i + 1}th`).toLowerCase()} dose?
              </p>
            </div>
          </div>
          <input
            type="time"
            value={time}
            onChange={(e) => {
              const updated = [...doseTimes];
              updated[i] = e.target.value;
              setDoseTimes(updated);
            }}
            className="w-full rounded-xl border border-border bg-faint px-4 py-3.5 text-xl font-bold text-navy text-center focus:outline-none focus:border-mint transition-colors"
          />
        </div>
      ))}
    </div>
  );

  // ── Step 4: Prescription ──────────────────────────────────────────────────

  const renderStep4 = () => (
    <div className="space-y-5">
      <p className="text-sm text-muted leading-relaxed">
        Prescription details are optional but help with refill tracking and orders.
      </p>

      <div>
        <label className="mb-1.5 block text-xs font-semibold tracking-widests text-muted uppercase">Doctor's Name</label>
        <input
          type="text"
          value={doctorName}
          onChange={(e) => setDoctorName(e.target.value)}
          placeholder="Dr. Anita Sharma"
          className="w-full rounded-xl border border-border bg-faint px-4 py-3 text-sm text-navy focus:outline-none focus:border-mint transition-colors"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold tracking-widests text-muted uppercase">Hospital / Clinic</label>
        <input
          type="text"
          value={hospitalName}
          onChange={(e) => setHospitalName(e.target.value)}
          placeholder="City General Hospital"
          className="w-full rounded-xl border border-border bg-faint px-4 py-3 text-sm text-navy focus:outline-none focus:border-mint transition-colors"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold tracking-widests text-muted uppercase">Prescription Date</label>
        <input
          type="date"
          value={prescriptionDate}
          onChange={(e) => setPrescriptionDate(e.target.value)}
          max={new Date().toISOString().split('T')[0]}
          className="w-full rounded-xl border border-border bg-faint px-4 py-3 text-sm text-navy focus:outline-none focus:border-mint transition-colors"
        />
        <p className="text-xs text-muted mt-1">Cannot be a future date.</p>
      </div>

      {/* Prescription Image */}
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <label className="text-xs font-semibold tracking-widests text-muted uppercase">Prescription Image</label>
          <span className="text-[10px] font-normal text-muted bg-faint px-2 py-0.5 rounded-full border border-border">
            Optional
          </span>
        </div>
        <div
          className="border-2 border-dashed border-border rounded-2xl p-5 text-center cursor-pointer hover:border-mint hover:bg-mint-light transition-all"
          onClick={() => document.getElementById('prescription-file')?.click()}
        >
          <input
            id="prescription-file"
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0] || null;
              setPrescriptionFile(f);
              setPrescriptionPreviewUrl(f && f.type.startsWith('image/') ? URL.createObjectURL(f) : '');
            }}
          />
          {prescriptionPreviewUrl ? (
            <div className="space-y-2">
              <img
                src={prescriptionPreviewUrl}
                alt="Prescription preview"
                className="max-h-36 mx-auto rounded-xl border border-border"
              />
              <button
                type="button"
                className="text-xs text-red"
                onClick={(e) => {
                  e.stopPropagation();
                  setPrescriptionFile(null);
                  setPrescriptionPreviewUrl('');
                }}
              >
                Remove
              </button>
            </div>
          ) : (
            <div>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="mx-auto mb-2 text-muted">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="1.5" />
                <polyline points="17 8 12 3 7 8" stroke="currentColor" strokeWidth="1.5" />
                <line x1="12" y1="3" x2="12" y2="15" stroke="currentColor" strokeWidth="1.5" />
              </svg>
              <p className="text-sm text-muted font-medium">Upload prescription</p>
              <p className="text-xs text-muted mt-0.5">JPG, PNG or PDF — max 5 MB</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-bg pb-24">
      {/* Sticky Header */}
      <div className="bg-white border-b border-border sticky top-0 z-30">
        <div className="flex items-center gap-3 px-4 h-16 max-w-lg mx-auto">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="p-2 rounded-xl text-muted hover:bg-faint transition-colors"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18L9 12L15 6"/>
            </svg>
          </button>
          <h1 className="text-lg font-bold text-navy">
            {isEdit ? 'Edit Medicine' : 'Add Medicine'}
          </h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 py-6">
        {renderStepIndicator()}

        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
      </div>

      {/* Fixed bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border px-5 py-4 flex gap-3 z-30">
        {step > 1 ? (
          <button
            type="button"
            onClick={prevStep}
            className="flex-1 border border-border bg-white text-navy rounded-full px-5 py-2.5 text-sm font-semibold hover:bg-faint"
          >
            ← Back
          </button>
        ) : (
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex-1 border border-border bg-white text-navy rounded-full px-5 py-2.5 text-sm font-semibold hover:bg-faint"
          >
            Cancel
          </button>
        )}

        {step < 4 ? (
          <button
            type="button"
            onClick={nextStep}
            className="flex-1 bg-mint text-white rounded-full px-5 py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Next →
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 bg-navy text-white rounded-full px-5 py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Saving…
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {isEdit ? 'Update Medicine' : 'Save Medicine'}
              </>
            )}
          </button>
        )}
      </div>

      {showCamera && (
        <SimpleCamera onCapture={handleCameraCapture} onClose={() => setShowCamera(false)} />
      )}
    </div>
  );
}
