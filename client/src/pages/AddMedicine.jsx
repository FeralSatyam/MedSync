import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import { getPatient } from '../api/patientApi';
import { createMedicine, getMedicinesForPatient, updateMedicine } from '../api/medicineApi';

const schema = z.object({
  name: z.string().min(1, 'Required'),
  strength: z.string().min(1, 'Required'),
  strengthUnit: z.enum(['mg', 'ml', 'IU']),
  frequencyPerDay: z.coerce.number().min(0),
  dosePerIntake: z.coerce.number().min(0),
  currentStock: z.coerce.number().min(0),
  refillThreshold: z.coerce.number().min(1).default(7),
  doctorName: z.string().optional(),
  hospitalName: z.string().optional(),
  prescriptionIssuedDate: z.string().optional(),
  prescriptionValidUntil: z.string().optional(),
});

export default function AddMedicine() {
  const { patientId, medicineId } = useParams();
  const [searchParams] = useSearchParams();
  const editPatientId = searchParams.get('patientId');
  const navigate = useNavigate();
  const isEdit = Boolean(medicineId);
  const effectivePatientId = isEdit ? editPatientId : patientId;

  const [patient, setPatient] = useState(null);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      strengthUnit: 'mg',
      refillThreshold: 7,
      frequencyPerDay: 1,
      dosePerIntake: 1,
      currentStock: 30,
    },
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!effectivePatientId) {
        toast.error('Missing patient');
        navigate('/dashboard');
        return;
      }
      try {
        const p = await getPatient(effectivePatientId);
        if (!cancelled) setPatient(p);
        if (isEdit && medicineId) {
          const meds = await getMedicinesForPatient(effectivePatientId);
          const med = meds.find((m) => m._id === medicineId);
          if (!med) {
            toast.error('Medicine not found');
            navigate(`/dashboard?patient=${effectivePatientId}`);
            return;
          }
          const strengthMatch = /^([\d.]+)\s*(mg|ml|IU)$/i.exec(med.strength.trim());
          const num = strengthMatch ? strengthMatch[1] : med.strength;
          const unit = strengthMatch ? strengthMatch[2].toLowerCase() : 'mg';
          reset({
            name: med.name,
            strength: num,
            strengthUnit: unit === 'iu' ? 'IU' : unit,
            frequencyPerDay: med.frequencyPerDay,
            dosePerIntake: med.dosePerIntake,
            currentStock: med.currentStock,
            refillThreshold: med.refillThreshold,
            doctorName: med.doctorName || '',
            hospitalName: med.hospitalName || '',
            prescriptionIssuedDate: med.prescriptionIssuedDate
              ? med.prescriptionIssuedDate.slice(0, 10)
              : '',
            prescriptionValidUntil: med.prescriptionValidUntil
              ? med.prescriptionValidUntil.slice(0, 10)
              : '',
          });
        }
      } catch {
        toast.error('Could not load data');
        navigate('/dashboard');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [effectivePatientId, isEdit, medicineId, navigate, reset]);

  async function onSubmit(values) {
    const strength = `${values.strength}${values.strengthUnit}`;
    const payloadBase = {
      name: values.name,
      strength,
      frequencyPerDay: values.frequencyPerDay,
      dosePerIntake: values.dosePerIntake,
      currentStock: values.currentStock,
      refillThreshold: values.refillThreshold,
      doctorName: values.doctorName || '',
      hospitalName: values.hospitalName || '',
      prescriptionIssuedDate: values.prescriptionIssuedDate || undefined,
      prescriptionValidUntil: values.prescriptionValidUntil || undefined,
    };

    try {
      if (isEdit) {
        if (file) {
          const fd = new FormData();
          Object.entries(payloadBase).forEach(([k, v]) => {
            if (v !== undefined && v !== '') fd.append(k, String(v));
          });
          fd.append('prescription', file);
          await updateMedicine(medicineId, fd);
        } else {
          await updateMedicine(medicineId, payloadBase);
        }
        toast.success('Medicine updated');
      } else {
        const fd = new FormData();
        fd.append('patientId', effectivePatientId);
        Object.entries(payloadBase).forEach(([k, v]) => {
          if (v !== undefined && v !== '') fd.append(k, String(v));
        });
        if (file) fd.append('prescription', file);
        await createMedicine(fd);
        toast.success('Medicine added');
      }
      navigate(`/dashboard?patient=${effectivePatientId}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    }
  }

  if (loading || !patient) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <p className="p-8 text-center text-slate-600">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold text-slate-900">
          {isEdit ? 'Edit medicine' : 'Add medicine'} — {patient.name}
        </h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <label className="mb-1 block text-sm font-medium">Medicine name *</label>
            <input {...register('name')} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
            {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Strength *</label>
              <input {...register('strength')} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Unit</label>
              <select {...register('strengthUnit')} className="w-full rounded-lg border border-slate-300 px-3 py-2">
                <option value="mg">mg</option>
                <option value="ml">ml</option>
                <option value="IU">IU</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Frequency per day *</label>
              <input type="number" step="0.5" {...register('frequencyPerDay')} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Dose per intake *</label>
              <input type="number" step="0.5" {...register('dosePerIntake')} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Starting stock *</label>
              <input type="number" {...register('currentStock')} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Refill threshold (days)</label>
              <input type="number" {...register('refillThreshold')} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Prescription (JPG, PNG, PDF)</label>
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Doctor name</label>
            <input {...register('doctorName')} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Hospital</label>
            <input {...register('hospitalName')} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Issued date</label>
              <input type="date" {...register('prescriptionIssuedDate')} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Valid until</label>
              <input type="date" {...register('prescriptionValidUntil')} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-teal-600 px-4 py-2 font-medium text-white hover:bg-teal-700 disabled:opacity-60"
            >
              {isSubmitting ? 'Saving…' : isEdit ? 'Update' : 'Add medicine'}
            </button>
            <button
              type="button"
              onClick={() => navigate(`/dashboard?patient=${effectivePatientId}`)}
              className="rounded-lg border border-slate-300 px-4 py-2"
            >
              Cancel
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
