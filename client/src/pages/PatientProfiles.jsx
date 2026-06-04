import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { getPatients, createPatient, deletePatient } from '../api/patientApi';
import { useAuthStore } from '../store/authStore';

export default function PatientProfiles() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: '',
    dateOfBirth: '',
    allergies: '',
    notes: '',
    pharmacyPin: '',
  });
  const [saving, setSaving] = useState(false);
  
  // Get authenticated user from store
  const authUser = useAuthStore((s) => s.user);
  const userId = authUser?._id || authUser?.id;
  
  // Debug log
  // console.log('Auth User in PatientProfiles:', authUser);
  // console.log('User ID:', userId);

  async function load() {
    setLoading(true);
    try {
      const data = await getPatients();
      setList(data);
    } catch {
      toast.error('Could not load profiles');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    
    // Check if user is logged in
    if (!userId) {
      toast.error('Please log in again');
      return;
    }
    
    if (!/^\d{4}$/.test(form.pharmacyPin)) {
      toast.error('Pharmacy PIN must be exactly 4 digits');
      return;
    }

    if (form.dateOfBirth) {
      const d = new Date(form.dateOfBirth);
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const ageYears = (today - d) / (365.25 * 24 * 60 * 60 * 1000);
      if (d > today) { toast.error('Date of birth cannot be in the future'); return; }
      if (ageYears > 120) { toast.error('Please enter a valid date of birth'); return; }
      if (ageYears < 6) { toast.error('Patient must be at least 6 years old'); return; }
    }

    setSaving(true);
    try {
      await createPatient({
        userId: userId,  // CRITICAL: Add the userId field
        name: form.name,
        dateOfBirth: form.dateOfBirth || undefined,
        allergies: form.allergies,
        notes: form.notes,
        pharmacyPin: form.pharmacyPin,
      });
      toast.success('Profile created');
      setForm({ name: '', dateOfBirth: '', allergies: '', notes: '', pharmacyPin: '' });
      load();
    } catch (err) {
      console.error('Error:', err.response?.data);
      toast.error(err.response?.data?.message || 'Could not create profile');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id, name) {
    if (!window.confirm(`Delete profile for ${name}? This removes all medicines.`)) return;
    try {
      await deletePatient(id);
      toast.success('Profile deleted');
      load();
    } catch {
      toast.error('Delete failed');
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="mb-2 text-2xl font-bold text-slate-900">Family profiles</h1>
        <p className="mb-8 text-slate-600">
          Add patients (e.g. yourself and relatives). Each gets a unique QR and pharmacy PIN.
        </p>

        <section className="mb-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Add patient</h2>
          <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium">Name *</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Date of birth</label>
              <input
                type="date"
                value={form.dateOfBirth}
                max={(() => { const d = new Date(); d.setFullYear(d.getFullYear() - 6); return d.toISOString().split('T')[0]; })()}
                min={(() => { const d = new Date(); d.setFullYear(d.getFullYear() - 120); return d.toISOString().split('T')[0]; })()}
                onChange={(e) => setForm((f) => ({ ...f, dateOfBirth: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">4-digit pharmacy PIN *</label>
              <input
                required
                inputMode="numeric"
                maxLength={4}
                placeholder="e.g. 1234"
                value={form.pharmacyPin}
                onChange={(e) => setForm((f) => ({ ...f, pharmacyPin: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium">Allergies</label>
              <textarea
                rows={2}
                value={form.allergies}
                onChange={(e) => setForm((f) => ({ ...f, allergies: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium">Notes</label>
              <textarea
                rows={2}
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </div>
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-teal-600 px-4 py-2 font-medium text-white hover:bg-teal-700 disabled:opacity-60"
              >
                {saving ? 'Saving…' : 'Create profile'}
              </button>
            </div>
          </form>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold">Your profiles</h2>
          {loading ? (
            <p className="text-slate-500">Loading…</p>
          ) : list.length === 0 ? (
            <p className="text-slate-600">No profiles yet. Add one above.</p>
          ) : (
            <ul className="space-y-3">
              {list.map((p) => (
                <li
                  key={p._id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white p-4"
                >
                  <div>
                    <p className="font-semibold text-slate-900">{p.name}</p>
                    <p className="text-sm text-slate-500">
                      {p.dateOfBirth
                        ? new Date(p.dateOfBirth).toLocaleDateString()
                        : 'DOB not set'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      to={`/dashboard?patient=${p._id}`}
                      className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
                    >
                      Open dashboard
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(p._id, p.name)}
                      className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}