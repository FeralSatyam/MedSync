import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getPharmacistData, dispense } from '../api/pharmacistApi';
import PrescriptionViewer from '../components/PrescriptionViewer';
import StockBadge from '../components/StockBadge';
import { getPharmacistStockStatus, getRefillQuantity } from '../utils/stockUtils';

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

  async function load() {
    setLoading(true);
    try {
      const res = await getPharmacistData(qrToken);
      setData(res);
      const init = {};
      (res.medicines || []).forEach((m) => {
        init[m._id] = '';
      });
      setQuantities(init);
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

  async function handleDispense(e) {
    e.preventDefault();
    const items = Object.entries(quantities)
      .map(([medicineId, v]) => ({
        medicineId,
        quantityAdded: Number(v) || 0,
      }))
      .filter((x) => x.quantityAdded > 0);

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
      const res = await dispense(qrToken, { pin, medicines: items });
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
        <p className="text-slate-600">Loading patient record…</p>
      </div>
    );
  }

  if (!data || !patient) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <p className="text-center text-slate-700">This QR code could not be loaded.</p>
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
              const status = m.stockStatus || getPharmacistStockStatus(m).status;
              const days = m.daysLeft ?? getPharmacistStockStatus(m).daysLeft;
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
