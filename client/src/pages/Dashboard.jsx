import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import MedicineCard from '../components/MedicineCard';
import { getPatients } from '../api/patientApi';
import { getMedicinesForPatient, restockMedicine } from '../api/medicineApi';
import { getStockStatus, sortMedicinesByUrgency } from '../utils/stockUtils';

export default function Dashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [patients, setPatients] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [restockTarget, setRestockTarget] = useState(null);
  const [restockQty, setRestockQty] = useState('');

  const patientIdFromUrl = searchParams.get('patient');
  const selectedId = patientIdFromUrl || (patients[0]?._id ?? null);
  const selectedPatient = patients.find((p) => p._id === selectedId);

  async function loadPatients() {
    const data = await getPatients();
    setPatients(data);
    if (!patientIdFromUrl && data[0]?._id) {
      setSearchParams({ patient: data[0]._id }, { replace: true });
    }
  }

  async function loadMedicines(pid) {
    if (!pid) {
      setMedicines([]);
      return;
    }
    const data = await getMedicinesForPatient(pid);
    setMedicines(data);
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        await loadPatients();
      } catch {
        if (!cancelled) toast.error('Could not load profiles');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    (async () => {
      try {
        await loadMedicines(selectedId);
      } catch {
        if (!cancelled) toast.error('Could not load medicines');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const sorted = useMemo(() => sortMedicinesByUrgency(medicines, getStockStatus), [medicines]);

  const alerts = useMemo(() => {
    const out = [];
    for (const m of medicines) {
      const { status } = getStockStatus(m);
      if (status === 'red' || status === 'yellow') {
        out.push({ m, status });
      }
    }
    return out;
  }, [medicines]);

  useEffect(() => {
    if (alerts.length === 0) return;
    const key = alerts.map((a) => `${a.m._id}-${a.status}`).join(',');
    const seen = sessionStorage.getItem('medsync_alert_seen');
    if (seen !== key) {
      sessionStorage.setItem('medsync_alert_seen', key);
      toast(`Attention: ${alerts.length} medicine(s) need refill attention`, { icon: '⚠️' });
    }
  }, [alerts]);

  function selectPatient(id) {
    setSearchParams({ patient: id });
  }

  async function submitRestock() {
    const q = Number(restockQty);
    if (!restockTarget || Number.isNaN(q) || q < 0) {
      toast.error('Enter a valid quantity');
      return;
    }
    try {
      await restockMedicine(restockTarget._id, q);
      toast.success('Stock updated');
      setRestockTarget(null);
      setRestockQty('');
      await loadMedicines(selectedId);
    } catch {
      toast.error('Restock failed');
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Medicine dashboard</h1>
            <p className="text-slate-600">Select a family member and manage stock.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/patients"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-white"
            >
              Manage profiles
            </Link>
            {selectedId && (
              <>
                <Link
                  to={`/dashboard/add/${selectedId}`}
                  className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
                >
                  Add medicine
                </Link>
                <Link
                  to={`/dashboard/qr/${selectedId}`}
                  className="rounded-lg border border-teal-600 px-4 py-2 text-sm font-medium text-teal-700 hover:bg-teal-50"
                >
                  Show QR
                </Link>
              </>
            )}
          </div>
        </div>

        {loading ? (
          <p className="text-slate-500">Loading…</p>
        ) : patients.length === 0 ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
            <p className="font-medium">No patient profiles yet.</p>
            <Link to="/patients" className="mt-2 inline-block text-teal-800 underline">
              Create a profile
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-6 flex flex-wrap gap-2">
              {patients.map((p) => (
                <button
                  key={p._id}
                  type="button"
                  onClick={() => selectPatient(p._id)}
                  className={`rounded-full px-4 py-2 text-sm font-medium ${
                    p._id === selectedId
                      ? 'bg-teal-600 text-white'
                      : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>

            {alerts.length > 0 && (
              <div
                className="mb-6 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-amber-950"
                role="status"
              >
                <p className="font-semibold">In-app alerts</p>
                <ul className="mt-1 list-inside list-disc text-sm">
                  {alerts.map(({ m, status }) => (
                    <li key={m._id}>
                      <strong>{m.name}</strong> is {status === 'red' ? 'critical (red)' : 'running low (yellow)'}.
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {selectedPatient && (
              <section>
                <h2 className="mb-4 text-lg font-semibold text-slate-800">
                  Medicines for {selectedPatient.name}
                </h2>
                {sorted.length === 0 ? (
                  <p className="text-slate-600">No medicines yet. Add one to see stock status.</p>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {sorted.map((m) => (
                      <MedicineCard
                        key={m._id}
                        medicine={m}
                        patientId={selectedId}
                        onRestock={(med) => {
                          setRestockTarget(med);
                          setRestockQty('');
                        }}
                      />
                    ))}
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </main>

      {restockTarget && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold">Restock: {restockTarget.name}</h3>
            <p className="mt-1 text-sm text-slate-600">How many units did you add?</p>
            <input
              type="number"
              min={0}
              className="mt-4 w-full rounded-lg border border-slate-300 px-3 py-2"
              value={restockQty}
              onChange={(e) => setRestockQty(e.target.value)}
              placeholder="Quantity"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRestockTarget(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitRestock}
                className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
