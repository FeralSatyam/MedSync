 import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getPharmacistData, dispense, verifyPharmacistOtp } from '../api/pharmacistApi';
import PrescriptionViewer from '../components/PrescriptionViewer';
import StockBadge from '../components/StockBadge';
import { getStockStatus, getRefillQuantity } from '../utils/stockUtils';

const border = {
  red: 'border-l-4 border-red-500',
  yellow: 'border-l-4 border-amber-500',
  green: 'border-l-4 border-green-500',
};

export default function PharmacistView() {
  
  const { qrToken } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [pin, setPin] = useState('');
  const [quantities, setQuantities] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const [otpInput, setOtpInput] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await getPharmacistData(qrToken);
      setData(res);
      if (res.medicines) {
        const init = {};
        res.medicines.forEach((m) => {
          init[m._id] = '';
        });
        setQuantities(init);
      }
    } catch {
      toast.error('Invalid QR or network error');
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [qrToken]);

  const patient = data?.patient;
  const medicines = data?.medicines || [];
  const scanTime = data?.scanTimestamp;

  const allergyText = useMemo(() => {
    if (!patient) return '';
    const parts = [patient.allergies, patient.notes].filter(Boolean);
    return parts.join(' · ');
  }, [patient]);

  async function handleOtpSubmit(e) {
    e.preventDefault();
    if (!/^\d{6}$/.test(otpInput)) {
      toast.error('Please enter a 6-digit OTP');
      return;
    }
    setVerifyingOtp(true);
    try {
      const res = await verifyPharmacistOtp(qrToken, otpInput);
      setData(res);
      const init = {};
      (res.medicines || []).forEach((m) => {
        init[m._id] = '';
      });
      setQuantities(init);
      toast.success('Patient prescription unlocked successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid or expired OTP code');
    } finally {
      setVerifyingOtp(false);
    }
  }

  async function handleDispense(e) {
    e.preventDefault();
    const items = Object.entries(quantities)
      .map(([medicineId, v]) => ({
        medicineId,
        quantity: Number(v) || 0,
      }))
      .filter((x) => x.quantity > 0);

    if (items.length === 0) {
      toast.error('Enter at least one quantity to add');
      return;
    }
    if (!/^\d{4}$/.test(pin)) {
      toast.error('Enter the 4-digit pharmacy PIN');
      return;
    }

    setSubmitting(true);
    try {
      const res = await dispense(qrToken, { pin, items });
      setData((prev) => ({ ...prev, medicines: res.medicines }));
      const init = {};
      res.medicines.forEach((m) => {
        init[m._id] = '';
      });
      setQuantities(init);
      setPin('');
      setModalOpen(false);
      toast.success('Stock updated for patient');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Dispense failed');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading patient record…</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center shadow-md">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-500 mx-auto mb-4">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-800">Invalid QR Code</h3>
          <p className="mt-2 text-sm text-slate-500">This QR code could not be loaded or is invalid.</p>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Aesthetic background mesh gradients */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />

        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl max-w-md w-full p-8 shadow-2xl relative z-10 text-center">
          <div className="w-16 h-16 bg-gradient-to-tr from-teal-500 to-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-teal-500/20">
            <svg className="w-8 h-8 text-white animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>

          <h2 className="text-2xl font-bold text-white tracking-tight mb-2">Prescription Portal</h2>
          <p className="text-sm text-slate-400 mb-6 font-medium">
            Enter the 6-digit OTP code displayed on the patient's screen to unlock medications.
          </p>

          {/* Patient Identification Card */}
          <div className="bg-white/5 border border-white/5 rounded-2xl p-4 mb-6 text-left">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Patient Profile</span>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold text-base">
                {data.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h4 className="font-bold text-white text-base">{data.name}</h4>
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <span className={`w-2 h-2 rounded-full ${data.expired ? 'bg-red-500' : 'bg-emerald-500'}`} />
                  {data.expired ? 'OTP Session Expired / Inactive' : 'OTP Session Active'}
                </div>
              </div>
            </div>
          </div>

          {data.expired ? (
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 mb-2 text-center animate-shake">
              <p className="text-sm text-red-400 font-semibold">Verification Code Expired</p>
              <p className="text-xs text-red-400/80 mt-1">
                The OTP has expired or has not been generated yet. Please ask the patient to press the <strong>Show Pharmacy QR</strong> button on their device.
              </p>
              <button
                onClick={load}
                className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 mx-auto cursor-pointer border border-white/10"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 4.75M9 9h1.586M9 9l1.586-1.586" />
                </svg>
                Retry / Check Status
              </button>
            </div>
          ) : (
            <form onSubmit={handleOtpSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 text-left">
                  Verification OTP
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="\d*"
                  maxLength={6}
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="w-full bg-white/10 border border-white/15 focus:border-teal-500 rounded-2xl px-4 py-3.5 text-center text-3xl font-bold tracking-[0.5em] text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all font-mono placeholder:text-white/10"
                  autoComplete="one-time-code"
                />
              </div>

              <button
                type="submit"
                disabled={verifyingOtp || otpInput.length < 6}
                className="w-full bg-teal-500 hover:bg-teal-600 text-white rounded-2xl py-3.5 font-bold text-sm transition-all shadow-lg shadow-teal-500/20 disabled:opacity-50 disabled:shadow-none cursor-pointer flex items-center justify-center gap-2"
              >
                {verifyingOtp ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Unlocking...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                    </svg>
                    Decrypt & Access Records
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl flex-wrap items-start justify-between gap-4 px-4 py-6">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">{patient.name}</h1>
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                Verified
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-600">
              DOB:{' '}
              {patient.dateOfBirth
                ? new Date(patient.dateOfBirth).toLocaleDateString()
                : 'Not provided'}
            </p>
            <p className="text-xs text-slate-500">
              Scan time: {scanTime ? new Date(scanTime).toLocaleString() : '—'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
          >
            Confirm dispensed
          </button>
        </div>
      </header>

      {allergyText && (
        <div className="mx-auto max-w-6xl px-4 pt-4">
          <div
            className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-amber-950"
            role="alert"
          >
            <p className="font-semibold">Allergies & notes</p>
            <p className="mt-1 text-sm whitespace-pre-wrap">{allergyText}</p>
          </div>
        </div>
      )}

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 text-lg font-semibold text-slate-900">Medicines (urgency order)</h2>
          <ul className="space-y-3">
            {medicines.map((m) => {
              const status = m.stockStatus || getStockStatus(m).status;
              const days = m.daysLeft ?? getStockStatus(m).daysLeft;
              const refillQty = m.refillQuantity ?? getRefillQuantity(m);
              return (
                <li
                  key={m._id}
                  className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm ${border[status] || border.green}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-slate-900">{m.name}</p>
                      <p className="text-sm text-slate-600">
                        {m.strength} · {m.frequencyPerDay}× daily · {m.dosePerIntake} per dose
                      </p>
                      <p className="mt-1 text-sm">
                        Tablets left: <strong>{m.currentStock}</strong> · Suggested refill qty (30 days):{' '}
                        <strong>{refillQty}</strong>
                      </p>
                    </div>
                    <StockBadge status={status} daysLeft={days} />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-slate-900">Prescriptions</h2>
          <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            {medicines.some((m) => m.prescriptionImageUrl) ? (
              medicines.map((m) =>
                m.prescriptionImageUrl ? (
                  <div key={m._id} className="border-b border-slate-100 pb-4 last:border-0">
                    <p className="mb-2 text-sm font-medium text-slate-800">{m.name}</p>
                    <PrescriptionViewer url={m.prescriptionImageUrl} alt={`Prescription ${m.name}`} />
                  </div>
                ) : null
              )
            ) : (
              <p className="text-sm text-slate-500">No prescription images uploaded.</p>
            )}
          </div>
        </section>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={handleDispense}
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
          >
            <h3 className="text-lg font-semibold">Confirm dispensed</h3>
            <p className="mt-1 text-sm text-slate-600">
              Enter the patient&apos;s 4-digit pharmacy PIN and quantities added to stock.
            </p>
            <div className="mt-4">
              <label className="mb-1 block text-sm font-medium">PIN</label>
              <input
                inputMode="numeric"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 tracking-widest"
                placeholder="••••"
                autoComplete="one-time-code"
              />
            </div>
            <div className="mt-4 space-y-3">
              {medicines.map((m) => (
                <div key={m._id} className="flex items-center justify-between gap-2">
                  <span className="text-sm text-slate-800">{m.name}</span>
                  <input
                    type="number"
                    min={0}
                    placeholder="Add qty"
                    value={quantities[m._id] ?? ''}
                    onChange={(e) =>
                      setQuantities((q) => ({ ...q, [m._id]: e.target.value }))
                    }
                    className="w-28 rounded-lg border border-slate-300 px-2 py-1 text-sm"
                  />
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                {submitting ? 'Saving…' : 'Submit'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
