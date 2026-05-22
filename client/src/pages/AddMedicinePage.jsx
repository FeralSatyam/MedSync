import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';

import { useAppStore } from '../store/appStore';
import { createMedicine, getMedicinesForPatient, updateMedicine } from '../api/medicineApi';
import SimpleCamera from '../components/SimpleCamera';

// Form validation schema
const schema = z.object({
  name: z.string().trim().min(1, 'Medicine name is required'),
  strengthNumber: z.coerce.number().min(0, 'Strength is required'),
  unit: z.enum(['mg', 'ml', 'IU', 'mcg']),
  frequencyPerDay: z.coerce.number().min(1, 'Must be at least 1').max(8, 'Must be at most 8'),
  dosePerIntake: z.coerce.number().min(0.5, 'Must be at least 0.5'),
  currentStock: z.coerce.number().min(0, 'Must be 0 or more'),
  refillThreshold: z.coerce.number().min(1, 'Must be at least 1').default(7),
  instructions: z.string().trim().optional().default(''),
  doctorName: z.string().trim().optional().default(''),
  hospitalName: z.string().trim().optional().default(''),
  prescriptionDate: z.string().optional(),
  prescriptionValid: z.string().optional(),
  firstDoseTime: z.string().optional(),
  remindersEnabled: z.boolean().default(true),
});

export default function AddMedicinePage() {
  const navigate = useNavigate();
  const { medicineId } = useParams();
  const isEdit = Boolean(medicineId);
  const activePatientId = useAppStore((s) => s.activePatientId);

  // UI state
  const [currentStep, setCurrentStep] = useState(1);
  const [prescriptionFile, setPrescriptionFile] = useState(null);
  const [prescriptionPreviewUrl, setPrescriptionPreviewUrl] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [medicinePhoto, setMedicinePhoto] = useState(null);
  const [medicinePhotoPreview, setMedicinePhotoPreview] = useState('');
  const [step3Ready, setStep3Ready] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      unit: 'mg',
      frequencyPerDay: 2,
      dosePerIntake: 1,
      currentStock: 50,
      refillThreshold: 7,
      instructions: '',
      doctorName: '',
      hospitalName: '',
      prescriptionDate: '',
      prescriptionValid: '',
      firstDoseTime: '08:00',
      remindersEnabled: true,
    },
  });

  // Watch values for live updates
  const frequencyPerDay = watch('frequencyPerDay');
  const firstDoseTime = watch('firstDoseTime');
  const remindersEnabled = watch('remindersEnabled');

  // Handle camera capture for medicine name
  const handleCameraCapture = (medicineName) => {
    if (medicineName && medicineName.trim()) {
      setValue('name', medicineName.trim());
      toast.success(`Medicine name set to: ${medicineName}`);
    } else {
      toast.error('No medicine name captured');
    }
    setShowCamera(false);
  };

  // Handle medicine photo upload
  const handleMedicinePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setMedicinePhoto(file);
      setMedicinePhotoPreview(URL.createObjectURL(file));
    }
  };

  // Navigate between steps
  const nextStep = () => {
    // Validate step 1 fields
    if (currentStep === 1) {
      const name = watch('name');
      const strength = watch('strengthNumber');
      if (!name || !strength) {
        toast.error('Please fill in Medicine Name and Strength');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(3);
    }
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  // Prevent accidental submit when transitioning to step 3 on mobile/slow clicks
  useEffect(() => {
    if (currentStep === 3) {
      setStep3Ready(false);
      const timer = setTimeout(() => {
        setStep3Ready(true);
      }, 400);
      return () => clearTimeout(timer);
    } else {
      setStep3Ready(false);
    }
  }, [currentStep]);

  // Redirect if no active patient
  useEffect(() => {
    if (!activePatientId) {
      toast.error('Select a patient first');
      navigate('/dashboard');
    }
  }, [activePatientId, navigate]);

  // Load medicine data for editing
  useEffect(() => {
    if (!isEdit || !activePatientId) return;
    (async () => {
      try {
        const meds = await getMedicinesForPatient(activePatientId);
        const med = meds.find((m) => m._id === medicineId);
        if (!med) {
          toast.error('Medicine not found');
          navigate('/dashboard');
          return;
        }
        setValue('name', med.name || '');
        setValue('strengthNumber', Number(med.strength || 0));
        setValue('unit', med.unit || 'mg');
        setValue('frequencyPerDay', Number(med.frequencyPerDay || 1));
        setValue('dosePerIntake', Number(med.dosePerIntake || 1));
        setValue('currentStock', Number(med.currentStock || 0));
        setValue('refillThreshold', Number(med.refillThreshold || 7));
        setValue('instructions', med.instructions || '');
        setValue('doctorName', med.doctorName || '');
        setValue('hospitalName', med.hospitalName || '');
        setValue('prescriptionDate', med.prescriptionDate ? String(med.prescriptionDate).slice(0, 10) : '');
        setValue('prescriptionValid', med.prescriptionValid ? String(med.prescriptionValid).slice(0, 10) : '');
        setValue('firstDoseTime', med.firstDoseTime || '08:00');
        setValue('remindersEnabled', med.remindersEnabled !== undefined ? med.remindersEnabled : true);
        if (med.medicinePhotoUrl) {
          setMedicinePhotoPreview(med.medicinePhotoUrl);
        }
        if (med.prescriptionImgUrl) {
          setPrescriptionPreviewUrl(med.prescriptionImgUrl);
        }
      } catch {
        toast.error('Could not load medicine');
      }
    })();
  }, [isEdit, activePatientId, medicineId, setValue, navigate]);

  // Form submission handler - FIXED: Only send fields that backend expects
  async function onSubmit(values) {
    if (!activePatientId) return;

    try {
      let response;

      if (isEdit && medicineId) {
        // For update - send as JSON or FormData based on whether files are present
        if (prescriptionFile || medicinePhoto) {
          const fd = new FormData();
          fd.append('name', values.name);
          fd.append('strength', String(values.strengthNumber));
          fd.append('unit', values.unit);
          fd.append('frequencyPerDay', String(values.frequencyPerDay));
          fd.append('dosePerIntake', String(values.dosePerIntake));
          fd.append('currentStock', String(values.currentStock));
          fd.append('refillThreshold', String(values.refillThreshold));
          fd.append('instructions', values.instructions || '');
          fd.append('doctorName', values.doctorName || '');
          fd.append('hospitalName', values.hospitalName || '');
          fd.append('firstDoseTime', values.firstDoseTime || '08:00');
          fd.append('remindersEnabled', String(values.remindersEnabled));
          if (values.prescriptionDate) fd.append('prescriptionDate', values.prescriptionDate);
          if (values.prescriptionValid) fd.append('prescriptionValid', values.prescriptionValid);
          if (prescriptionFile) fd.append('prescriptionImage', prescriptionFile);
          if (medicinePhoto) fd.append('medicinePhoto', medicinePhoto);
          response = await updateMedicine(medicineId, fd);
        } else {
          // Send as JSON if no files
          const payload = {
            name: values.name,
            strength: String(values.strengthNumber),
            unit: values.unit,
            frequencyPerDay: Number(values.frequencyPerDay),
            dosePerIntake: Number(values.dosePerIntake),
            currentStock: Number(values.currentStock),
            refillThreshold: Number(values.refillThreshold),
            instructions: values.instructions || '',
            doctorName: values.doctorName || '',
            hospitalName: values.hospitalName || '',
            prescriptionDate: values.prescriptionDate || null,
            prescriptionValid: values.prescriptionValid || null,
            firstDoseTime: values.firstDoseTime || '08:00',
            remindersEnabled: values.remindersEnabled,
          };
          response = await updateMedicine(medicineId, payload);
        }
        toast.success(`${response.name} updated!`);
      } else {
        // For create - use FormData
        const fd = new FormData();
        fd.append('patientId', activePatientId);
        fd.append('name', values.name);
        fd.append('strength', String(values.strengthNumber));
        fd.append('unit', values.unit);
        fd.append('frequencyPerDay', String(values.frequencyPerDay));
        fd.append('dosePerIntake', String(values.dosePerIntake));
        fd.append('currentStock', String(values.currentStock));
        fd.append('refillThreshold', String(values.refillThreshold));
        fd.append('instructions', values.instructions || '');
        fd.append('doctorName', values.doctorName || '');
        fd.append('hospitalName', values.hospitalName || '');
        fd.append('firstDoseTime', values.firstDoseTime || '08:00');
        fd.append('remindersEnabled', String(values.remindersEnabled));
        if (values.prescriptionDate) fd.append('prescriptionDate', values.prescriptionDate);
        if (values.prescriptionValid) fd.append('prescriptionValid', values.prescriptionValid);
        if (prescriptionFile) fd.append('prescriptionImage', prescriptionFile);
        if (medicinePhoto) fd.append('medicinePhoto', medicinePhoto);

        response = await createMedicine(fd);
        toast.success(`${response.name} ${response.strength}${response.unit} added!`);
      }
      navigate('/dashboard');
    } catch (err) {
      console.error('Save error:', err);
      const errorMessage = err?.response?.data?.message || err?.message || 'Save failed';
      toast.error(errorMessage);
    }
  }

  // Helper to render step indicator
  const renderStepIndicator = () => {
    const steps = [
      { number: 1, title: 'Basic Information', percent: 33 },
      { number: 2, title: 'Inventory Details', percent: 66 },
      { number: 3, title: 'Dosage & Schedule', percent: 100 },
    ];

    return (
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <div className="font-display text-sm font-semibold text-navy">
            STEP {currentStep} OF {steps.length}
          </div>
          <div className="text-xs text-muted">{steps[currentStep - 1].percent}% Complete</div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-mint h-2 rounded-full transition-all duration-300"
            style={{ width: `${steps[currentStep - 1].percent}%` }}
          ></div>
        </div>
        <div className="font-display text-lg font-bold text-navy mt-3">
          {steps[currentStep - 1].title}
        </div>
      </div>
    );
  };

  // Step 1: Basic Information
  const renderStep1 = () => (
    <div className="space-y-5">
      {/* Medicine Photo Section */}
      <div>
        <label className="mb-2 block text-xs font-semibold tracking-wide text-navy">Medicine Photo</label>
        <div
          className="border-2 border-dashed border-border rounded-2xl p-6 text-center cursor-pointer transition-all hover:border-mint hover:bg-mint-light"
          onClick={() => document.getElementById('medicine-photo-input')?.click()}
        >
          <input
            id="medicine-photo-input"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleMedicinePhotoUpload}
          />
          {medicinePhotoPreview ? (
            <div className="space-y-3">
              <img src={medicinePhotoPreview} alt="Medicine preview" className="w-32 h-32 object-cover rounded-lg mx-auto" />
              <div className="text-xs text-muted">Click to change photo</div>
            </div>
          ) : (
            <>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="mx-auto mb-2 text-muted">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="1.5" fill="none" />
                <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="1.5" fill="none" />
              </svg>
              <div className="text-sm text-muted">Add medicine photo</div>
              <div className="text-xs text-faint">Optional, but helps with identification</div>
            </>
          )}
        </div>
        <div className="text-xs text-muted mt-2 text-center">Safe storage in a cool, dry place is key to medication efficiency.</div>
      </div>

      {/* Medicine Name */}
      <div>
        <label className="mb-2 block text-xs font-semibold tracking-wide text-navy">
          Medicine Name <span className="text-red">*</span>
        </label>
        <div className="flex gap-2">
          <input
            {...register('name')}
            className="flex-1 rounded-xl border border-border bg-card px-4 py-3 text-sm text-navy outline-none transition-colors focus:border-mint"
            placeholder="e.g. Lisinopril"
          />
          <button
            type="button"
            onClick={() => setShowCamera(true)}
            className="bg-mint text-white px-4 py-2 rounded-xl hover:bg-mint-dark transition-colors flex items-center gap-2 whitespace-nowrap text-sm"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            Scan
          </button>
        </div>
        <div className="text-xs text-muted mt-1">The name printed on your prescription or package.</div>
        {errors.name && <div className="mt-1 text-xs font-semibold text-red">{errors.name.message}</div>}
      </div>

      {/* Strength */}
      <div>
        <label className="mb-2 block text-xs font-semibold tracking-wide text-navy">
          Strength <span className="text-red">*</span>
        </label>
        <div className="flex gap-2">
          <input
            type="number"
            step="any"
            {...register('strengthNumber')}
            className="flex-1 rounded-xl border border-border bg-card px-4 py-3 text-sm text-navy outline-none transition-colors focus:border-mint"
            placeholder="e.g. 10"
          />
          <select
            {...register('unit')}
            className="w-24 rounded-xl border border-border bg-card px-4 py-3 text-sm text-navy outline-none transition-colors focus:border-mint"
          >
            <option value="mg">mg</option>
            <option value="ml">ml</option>
            <option value="IU">IU</option>
            <option value="mcg">mcg</option>
          </select>
        </div>
        <div className="text-xs text-muted mt-1">Amount of active ingredient per dose.</div>
        {errors.strengthNumber && <div className="mt-1 text-xs font-semibold text-red">{errors.strengthNumber.message}</div>}
      </div>
    </div>
  );

  // Step 2: Inventory Details
  const renderStep2 = () => (
    <div className="space-y-5">
      <div>
        <label className="mb-2 block text-xs font-semibold tracking-wide text-navy">
          Total Tablets / Pills <span className="text-red">*</span>
        </label>
        <input
          type="number"
          min={0}
          {...register('currentStock')}
          className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-navy outline-none transition-colors focus:border-mint"
          placeholder="50"
        />
        <div className="text-xs text-muted mt-1">Enter the total count of individual units you have remaining.</div>
        {errors.currentStock && <div className="mt-1 text-xs font-semibold text-red">{errors.currentStock.message}</div>}
      </div>

      <div>
        <label className="mb-2 block text-xs font-semibold tracking-wide text-navy">
          Alert Threshold (days)
        </label>
        <input
          type="number"
          min={1}
          {...register('refillThreshold')}
          className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-navy outline-none transition-colors focus:border-mint"
          placeholder="7"
        />
        <div className="text-xs text-muted mt-1">Get notified when stock is low based on daily consumption.</div>
        {errors.refillThreshold && <div className="mt-1 text-xs font-semibold text-red">{errors.refillThreshold.message}</div>}
      </div>

      <div className="bg-mint-light rounded-xl p-4 border border-mint/20">
        <div className="flex items-start gap-3">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-mint shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
            <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <div>
            <div className="text-xs font-semibold text-navy">Why do we need this?</div>
            <div className="text-xs text-muted mt-1">Accurate inventory tracking helps us remind you when it's time to refill your prescription, ensuring you never miss a dose.</div>
          </div>
        </div>
      </div>
    </div>
  );

  // Step 3: Dosage & Schedule
  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <label className="mb-2 block text-xs font-semibold tracking-wide text-navy">
          Number of Doses per Day <span className="text-red">*</span>
        </label>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => {
              const current = watch('frequencyPerDay');
              if (current > 1) setValue('frequencyPerDay', current - 1);
            }}
            className="w-10 h-10 rounded-full bg-gray-100 text-navy text-xl font-semibold hover:bg-gray-200 transition-colors"
          >
            -
          </button>
          <span className="text-2xl font-bold text-navy w-8 text-center">{frequencyPerDay}</span>
          <button
            type="button"
            onClick={() => {
              const current = watch('frequencyPerDay');
              if (current < 8) setValue('frequencyPerDay', current + 1);
            }}
            className="w-10 h-10 rounded-full bg-gray-100 text-navy text-xl font-semibold hover:bg-gray-200 transition-colors"
          >
            +
          </button>
        </div>
        {errors.frequencyPerDay && <div className="mt-1 text-xs font-semibold text-red">{errors.frequencyPerDay.message}</div>}
      </div>

      <div>
        <label className="mb-2 block text-xs font-semibold tracking-wide text-navy">
          Tablets per Dose <span className="text-red">*</span>
        </label>
        <input
          type="number"
          step="0.5"
          min={0.5}
          {...register('dosePerIntake')}
          className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-navy outline-none transition-colors focus:border-mint"
          placeholder="1"
        />
        {errors.dosePerIntake && <div className="mt-1 text-xs font-semibold text-red">{errors.dosePerIntake.message}</div>}
      </div>

      <div>
        <label className="mb-2 block text-xs font-semibold tracking-wide text-navy">
          First Dose Time
        </label>
        <input
          type="time"
          {...register('firstDoseTime')}
          className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-navy outline-none transition-colors focus:border-mint"
        />
        <div className="text-xs text-muted mt-1">Tap to adjust medication time</div>
      </div>

      <div>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            {...register('remindersEnabled')}
            className="w-4 h-4 rounded border-border text-mint focus:ring-mint"
          />
          <span className="text-xs font-semibold text-navy">Push notifications</span>
        </label>
        {remindersEnabled && firstDoseTime && (
          <div className="mt-2 text-xs text-mint bg-mint-light p-2 rounded-lg inline-block">
            🔔 Alarm set for {firstDoseTime}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div>
        <label className="mb-2 block text-xs font-semibold tracking-wide text-navy">Instructions (Optional)</label>
        <textarea
          {...register('instructions')}
          rows={3}
          className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-navy outline-none transition-colors focus:border-mint resize-none"
          placeholder="e.g., Take after meals, avoid alcohol, etc."
        />
      </div>

      {/* Doctor & Prescription Section */}
      <div className="border-t border-border pt-4 mt-2">
        <div className="font-display text-sm font-bold text-navy mb-4">Prescription Details</div>
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-xs font-semibold tracking-wide text-navy">Doctor's Name</label>
            <input
              {...register('doctorName')}
              className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-navy outline-none transition-colors focus:border-mint"
              placeholder="Dr. Sarah Johnson"
            />
          </div>
          <div>
            <label className="mb-2 block text-xs font-semibold tracking-wide text-navy">Hospital / Clinic</label>
            <input
              {...register('hospitalName')}
              className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-navy outline-none transition-colors focus:border-mint"
              placeholder="City General Hospital"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-2 block text-xs font-semibold tracking-wide text-navy">Prescription Date</label>
              <input
                type="date"
                {...register('prescriptionDate')}
                className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-navy outline-none transition-colors"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold tracking-wide text-navy">Valid Until</label>
              <input
                type="date"
                {...register('prescriptionValid')}
                className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-navy outline-none transition-colors"
              />
            </div>
          </div>

          {/* Prescription Image Upload */}
          <div>
            <label className="mb-2 block text-xs font-semibold tracking-wide text-navy">Prescription Image (Optional)</label>
            <div
              className="border-2 border-dashed border-border rounded-xl p-4 text-center cursor-pointer transition-all hover:border-mint hover:bg-mint-light"
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
                  if (f && f.type.startsWith('image/')) {
                    setPrescriptionPreviewUrl(URL.createObjectURL(f));
                  } else {
                    setPrescriptionPreviewUrl('');
                  }
                }}
              />
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" className="mx-auto mb-2 text-muted">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="1.5" />
                <polyline points="17 8 12 3 7 8" stroke="currentColor" strokeWidth="1.5" />
                <line x1="12" y1="3" x2="12" y2="15" stroke="currentColor" strokeWidth="1.5" />
              </svg>
              <div className="text-xs text-muted">Click to upload or drag & drop</div>
              <div className="text-xs text-faint mt-1">JPG, PNG, PDF — max 5MB</div>
              {prescriptionPreviewUrl && (
                <div className="mt-3">
                  <img src={prescriptionPreviewUrl} alt="Preview" className="max-h-32 mx-auto rounded-lg" />
                  <button
                    type="button"
                    className="text-xs text-red mt-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPrescriptionFile(null);
                      setPrescriptionPreviewUrl('');
                    }}
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-5 py-6">
        {renderStepIndicator()}

        <form onSubmit={handleSubmit(onSubmit)}>
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}

          <div className="flex gap-3 justify-between mt-8">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={prevStep}
                className="rounded-xl border border-border bg-white px-5 py-2.5 text-sm font-semibold text-navy hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="rounded-xl border border-border bg-white px-5 py-2.5 text-sm font-semibold text-navy hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            )}

            {currentStep < 3 ? (
              <button
                key="next-button"
                type="button"
                onClick={nextStep}
                className="rounded-xl bg-mint text-white px-6 py-2.5 text-sm font-semibold hover:bg-mint-dark transition-colors"
              >
                Next →
              </button>
            ) : (
              <button
                key="submit-button"
                type="submit"
                disabled={isSubmitting || !step3Ready}
                className="rounded-xl bg-mint text-white px-6 py-2.5 text-sm font-semibold hover:bg-mint-dark transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {isEdit ? 'Update Medicine' : 'Save Medication'}
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Camera Modal */}
      {showCamera && (
        <SimpleCamera
          onCapture={handleCameraCapture}
          onClose={() => setShowCamera(false)}
        />
      )}
    </div>
  );
}