import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';

import { useAppStore } from '../store/appStore';
import { createMedicine, getMedicinesForPatient, updateMedicine } from '../api/medicineApi';

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
});

export default function AddMedicinePage() {
  const navigate = useNavigate();
  const { medicineId } = useParams();
  const isEdit = Boolean(medicineId);
  const activePatientId = useAppStore((s) => s.activePatientId);

  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      unit: 'mg',
      frequencyPerDay: 2,
      dosePerIntake: 1,
      currentStock: 60,
      refillThreshold: 7,
      instructions: '',
      doctorName: '',
      hospitalName: '',
      prescriptionDate: '',
      prescriptionValid: '',
    },
  });

  useEffect(() => {
    if (!activePatientId) {
      toast.error('Select a patient first');
      navigate('/dashboard');
    }
  }, [activePatientId, navigate]);

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
      } catch {
        toast.error('Could not load medicine');
      }
    })();
  }, [isEdit, activePatientId, medicineId, setValue, navigate]);

  async function onSubmit(values) {
    if (!activePatientId) return;
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
    if (values.prescriptionDate) fd.append('prescriptionDate', values.prescriptionDate);
    if (values.prescriptionValid) fd.append('prescriptionValid', values.prescriptionValid);
    if (file) fd.append('prescriptionImage', file);

    try {
      if (isEdit && medicineId) {
        const payload = new FormData();
        payload.append('name', values.name);
        payload.append('strength', String(values.strengthNumber));
        payload.append('unit', values.unit);
        payload.append('frequencyPerDay', String(values.frequencyPerDay));
        payload.append('dosePerIntake', String(values.dosePerIntake));
        payload.append('currentStock', String(values.currentStock));
        payload.append('refillThreshold', String(values.refillThreshold));
        payload.append('instructions', values.instructions || '');
        payload.append('doctorName', values.doctorName || '');
        payload.append('hospitalName', values.hospitalName || '');
        if (values.prescriptionDate) payload.append('prescriptionDate', values.prescriptionDate);
        if (values.prescriptionValid) payload.append('prescriptionValid', values.prescriptionValid);
        if (file) payload.append('prescriptionImage', file);
        const updated = await updateMedicine(medicineId, payload);
        toast.success(`${updated.name} updated!`);
      } else {
        const created = await createMedicine(fd);
        toast.success(`${created.name} ${created.strength}${created.unit} added!`);
      }
      navigate('/dashboard');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Save failed');
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      {/* Header not using navbar spec here to keep file short */}
      <div className="flex flex-1 px-[28px] py-[26px] max-w-[680px] w-full mx-auto">
        <div className="w-full">
          <div className="mb-[24px]">
            <div className="font-display text-[22px] font-bold text-navy">{isEdit ? 'Edit Medicine' : 'Add New Medicine'}</div>
            <div className="text-[13px] text-muted mt-[3px] font-body">Fill in details from your doctor's prescription</div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="w-full">
            <div className="rounded-[16px] border border-border bg-card p-[22px] mb-[16px]">
              <div className="font-display text-[14px] font-bold text-navy mb-[16px] pb-[10px] border-b border-border">
                Medicine Details
              </div>

              <div className="grid grid-cols-2 gap-[14px]">
                <div className="col-span-2">
                  <label className="mb-[7px] block text-[12px] font-semibold tracking-[0.02em] text-navy">Medicine name *</label>
                  <input
                    {...register('name')}
                    className="w-full rounded-btn border-[1.5px] border-border bg-card px-[15px] py-[11px] text-[14px] text-navy outline-none transition-colors focus:border-mint"
                    placeholder="e.g. Metformin"
                  />
                  {errors.name ? <div className="mt-[7px] text-[12px] font-semibold text-red">{errors.name.message}</div> : null}
                </div>

                <div className="col-span-1">
                  <label className="mb-[7px] block text-[12px] font-semibold tracking-[0.02em] text-navy">Strength *</label>
                  <div className="flex gap-[10px]">
                    <input
                      type="number"
                      step="any"
                      {...register('strengthNumber')}
                      className="flex-1 rounded-btn border-[1.5px] border-border bg-card px-[15px] py-[11px] text-[14px] text-navy outline-none transition-colors focus:border-mint"
                    />
                    <select
                      {...register('unit')}
                      className="w-[72px] rounded-btn border-[1.5px] border-border bg-card px-[15px] py-[11px] text-[14px] text-navy outline-none transition-colors focus:border-mint"
                    >
                      <option value="mg">mg</option>
                      <option value="ml">ml</option>
                      <option value="IU">IU</option>
                      <option value="mcg">mcg</option>
                    </select>
                  </div>
                  {errors.strengthNumber ? (
                    <div className="mt-[7px] text-[12px] font-semibold text-red">{errors.strengthNumber.message}</div>
                  ) : null}
                </div>

                <div className="col-span-1">
                  <label className="mb-[7px] block text-[12px] font-semibold tracking-[0.02em] text-navy">Times per day *</label>
                  <input
                    type="number"
                    min={1}
                    max={8}
                    step="1"
                    {...register('frequencyPerDay')}
                    className="w-full rounded-btn border-[1.5px] border-border bg-card px-[15px] py-[11px] text-[14px] text-navy outline-none transition-colors focus:border-mint"
                    placeholder="2"
                  />
                  {errors.frequencyPerDay ? (
                    <div className="mt-[7px] text-[12px] font-semibold text-red">{errors.frequencyPerDay.message}</div>
                  ) : null}
                </div>

                <div className="col-span-1">
                  <label className="mb-[7px] block text-[12px] font-semibold tracking-[0.02em] text-navy">Tablets per dose *</label>
                  <input
                    type="number"
                    step="0.5"
                    min={0.5}
                    {...register('dosePerIntake')}
                    className="w-full rounded-btn border-[1.5px] border-border bg-card px-[15px] py-[11px] text-[14px] text-navy outline-none transition-colors focus:border-mint"
                    placeholder="1"
                  />
                  {errors.dosePerIntake ? (
                    <div className="mt-[7px] text-[12px] font-semibold text-red">{errors.dosePerIntake.message}</div>
                  ) : null}
                </div>

                <div className="col-span-1">
                  <label className="mb-[7px] block text-[12px] font-semibold tracking-[0.02em] text-navy">Current stock (tablets) *</label>
                  <input
                    type="number"
                    min={0}
                    {...register('currentStock')}
                    className="w-full rounded-btn border-[1.5px] border-border bg-card px-[15px] py-[11px] text-[14px] text-navy outline-none transition-colors focus:border-mint"
                    placeholder="60"
                  />
                  {errors.currentStock ? (
                    <div className="mt-[7px] text-[12px] font-semibold text-red">{errors.currentStock.message}</div>
                  ) : null}
                </div>

                <div className="col-span-1">
                  <label className="mb-[7px] block text-[12px] font-semibold tracking-[0.02em] text-navy">Alert threshold (days)</label>
                  <input
                    type="number"
                    min={1}
                    {...register('refillThreshold')}
                    className="w-full rounded-btn border-[1.5px] border-border bg-card px-[15px] py-[11px] text-[14px] text-navy outline-none transition-colors focus:border-mint"
                    placeholder="7"
                  />
                  {errors.refillThreshold ? (
                    <div className="mt-[7px] text-[12px] font-semibold text-red">{errors.refillThreshold.message}</div>
                  ) : null}
                </div>
              </div>

              <div className="mt-[16px]">
                <label className="mb-[7px] block text-[12px] font-semibold tracking-[0.02em] text-navy">Instructions</label>
                <input
                  {...register('instructions')}
                  className="w-full rounded-btn border-[1.5px] border-border bg-card px-[15px] py-[11px] text-[14px] text-navy outline-none transition-colors focus:border-mint"
                  placeholder="e.g. After meals"
                />
              </div>
            </div>

            <div className="rounded-[16px] border border-border bg-card p-[22px] mb-[16px]">
              <div className="font-display text-[14px] font-bold text-navy mb-[16px] pb-[10px] border-b border-border">
                Doctor & Prescription
              </div>

              <div className="grid grid-cols-2 gap-[14px]">
                <div>
                  <label className="mb-[7px] block text-[12px] font-semibold tracking-[0.02em] text-navy">Doctor's name</label>
                  <input
                    {...register('doctorName')}
                    className="w-full rounded-btn border-[1.5px] border-border bg-card px-[15px] py-[11px] text-[14px] text-navy outline-none transition-colors focus:border-mint"
                    placeholder="Dr. Rajesh Poudel"
                  />
                </div>
                <div>
                  <label className="mb-[7px] block text-[12px] font-semibold tracking-[0.02em] text-navy">Hospital / Clinic</label>
                  <input
                    {...register('hospitalName')}
                    className="w-full rounded-btn border-[1.5px] border-border bg-card px-[15px] py-[11px] text-[14px] text-navy outline-none transition-colors focus:border-mint"
                    placeholder="Norvic Hospital"
                  />
                </div>
                <div>
                  <label className="mb-[7px] block text-[12px] font-semibold tracking-[0.02em] text-navy">Prescription date</label>
                  <input
                    type="date"
                    {...register('prescriptionDate')}
                    className="w-full rounded-btn border-[1.5px] border-border bg-card px-[15px] py-[11px] text-[14px] text-navy outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="mb-[7px] block text-[12px] font-semibold tracking-[0.02em] text-navy">Valid until</label>
                  <input
                    type="date"
                    {...register('prescriptionValid')}
                    className="w-full rounded-btn border-[1.5px] border-border bg-card px-[15px] py-[11px] text-[14px] text-navy outline-none transition-colors"
                  />
                </div>
              </div>

              <div
                className="mt-[16px] border-[2px] border-dashed border-border rounded-[10px] p-[26px] text-center cursor-pointer transition-all hover:border-mint hover:bg-mint-light"
                onClick={() => document.getElementById('prescription-file')?.click()}
              >
                <input
                  id="prescription-file"
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0] || null;
                    setFile(f);
                    if (f && f.type.startsWith('image/')) {
                      setPreviewUrl(URL.createObjectURL(f));
                    } else {
                      setPreviewUrl('');
                    }
                  }}
                />

                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ color: '#9aa5bf', margin: '0 auto 9px', display: 'block' }}>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <polyline points="17 8 12 3 7 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <line x1="12" y1="3" x2="12" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>

                <div className="text-[13px] text-muted">Click to upload or drag & drop</div>
                <div className="text-[11px] text-faint mt-[2px]">JPG, PNG, PDF — max 5MB</div>

                {previewUrl ? (
                  <div className="mt-[12px] rounded-[10px] overflow-hidden border border-border">
                    <img src={previewUrl} alt="Preview" className="w-full max-h-[170px] object-contain bg-[#f0f0f0]" />
                    <div className="flex justify-between px-[12px] py-[7px] bg-[#f8f8f8]">
                      <div className="text-[11px] text-muted font-body">{file?.name}</div>
                      <button
                        type="button"
                        className="text-[11px] text-red font-body border-none bg-transparent cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFile(null);
                          setPreviewUrl('');
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="flex gap-[9px] justify-end">
              <button
                type="button"
                className="rounded-btn border-[1.5px] border-border bg-transparent px-[18px] py-[9px] text-[13px] font-body font-semibold text-navy cursor-pointer"
                onClick={() => navigate('/dashboard')}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-btn bg-mint text-white px-[18px] py-[9px] text-[13px] font-body font-semibold cursor-pointer active:scale-[0.98] flex items-center gap-[7px]"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Save Medicine
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

