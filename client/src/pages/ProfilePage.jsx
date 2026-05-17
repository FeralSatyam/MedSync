import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import { useAuthStore } from '../store/authStore';
import { getPatients, updatePatient, deletePatient } from '../api/patientApi';
import { getMedicinesForPatient } from '../api/medicineApi';
import { updateMe, deleteMe } from '../api/authApi';

export default function ProfilePage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const login = useAuthStore((s) => s.login);
  const token = useAuthStore((s) => s.token);
  const [stats, setStats] = useState({ totalPatients: 0, totalMedicines: 0, activeAlerts: 0 });
  const [patients, setPatients] = useState([]);
  const [editPatientOpen, setEditPatientOpen] = useState(false);
  const [editPatientForm, setEditPatientForm] = useState(null);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const patients = await getPatients();
        const medicinesLists = await Promise.all(patients.map((p) => getMedicinesForPatient(p._id)));
        const totalMedicines = medicinesLists.reduce((sum, list) => sum + list.length, 0);
        // Active alerts: red/amber based on stockStatus if present.
        let activeAlerts = 0;
        medicinesLists.forEach((list) => {
          list.forEach((m) => {
            if (m.stockStatus === 'red' || m.stockStatus === 'amber') activeAlerts += 1;
          });
        });
        if (!cancelled) {
          setStats({ totalPatients: patients.length, totalMedicines, activeAlerts });
          setPatients(patients);
        }
      } catch {
        toast.error('Could not load profile stats');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function handleSignOut() {
    logout();
    localStorage.removeItem('medsync-auth');
    navigate('/login');
  }

  function startEdit() {
    setName(user?.name || '');
    setEmail(user?.email || '');
    setIsEditing(true);
  }

  function cancelEdit() {
    setName(user?.name || '');
    setEmail(user?.email || '');
    setIsEditing(false);
  }

  const handleDeletePatient = async (id) => {
    if (!window.confirm("Are you sure you want to delete this family profile?")) return;
    try {
      await deletePatient(id);
      setPatients(patients.filter(p => p._id !== id && p.id !== id));
      toast.success("Profile deleted");
    } catch (e) {
      toast.error("Could not delete profile");
    }
  };

  const handleEditPatient = async () => {
    if(!editPatientForm.name.trim()) return toast.error("Name is required");
    try {
      await updatePatient(editPatientForm._id || editPatientForm.id, {
         name: editPatientForm.name.trim(),
         relation: editPatientForm.relation
      });
      setPatients(patients.map(p => (p._id || p.id) === (editPatientForm._id || editPatientForm.id) ? {...p, ...editPatientForm} : p));
      setEditPatientOpen(false);
      toast.success("Profile updated");
    } catch (e) {
      toast.error("Could not update profile");
    }
  }

  async function saveProfile() {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedName) {
      toast.error('Name is required');
      return;
    }
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail);
    if (!emailOk) {
      toast.error('Enter a valid email');
      return;
    }

    setSaving(true);
    try {
      const res = await updateMe({ name: trimmedName, email: trimmedEmail });
      login(res.user, token);
      setIsEditing(false);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  }

  const initials = (user?.name || 'MS')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

  return (
    <div className="flex-1 px-[28px] py-[24px] max-w-[800px] w-full mx-auto bg-bg min-h-screen">
      <div className="flex items-center justify-between mb-[20px]">
        <div className="flex items-center gap-[12px]">
          <button onClick={() => navigate('/dashboard')} className="p-[8px] bg-card border border-border rounded-full hover:bg-faint cursor-pointer">
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
               <line x1="19" y1="12" x2="5" y2="12"></line>
               <polyline points="12 19 5 12 12 5"></polyline>
             </svg>
          </button>
          <div className="font-display text-[22px] font-bold text-navy">My Profile</div>
        </div>
      </div>

      <div className="flex flex-col items-center text-center">
        <div className="h-[68px] w-[68px] rounded-full bg-navy flex items-center justify-center font-display text-[20px] font-bold text-white">
          {initials}
        </div>
        <div className="font-display text-[20px] font-bold text-navy mt-[12px]">{user?.name || 'User'}</div>
        <div className="text-[13px] text-muted mt-[2px]">{user?.email || ''}</div>
      </div>

      <div className="mt-[16px] grid grid-cols-3 gap-[12px]">
        <div className="bg-card rounded-[20px] p-[16px] border border-border shadow-card">
          <div className="font-display text-[26px] font-bold text-navy tracking-[-0.5px]">{stats.totalPatients}</div>
          <div className="text-[12px] font-body font-semibold text-muted mt-[2px]">Total Patients</div>
        </div>
        <div className="bg-card rounded-[20px] p-[16px] border border-border shadow-card">
          <div className="font-display text-[26px] font-bold text-navy tracking-[-0.5px]">{stats.totalMedicines}</div>
          <div className="text-[12px] font-body font-semibold text-muted mt-[2px]">Total Medicines</div>
        </div>
        <div className="bg-card rounded-[20px] p-[16px] border border-border shadow-card">
          <div
            className={`font-display text-[26px] tracking-[-0.5px] font-bold mt-0 ${
              stats.activeAlerts > 0 ? 'text-red' : 'text-green'
            }`}
          >
            {stats.activeAlerts}
          </div>
          <div className="text-[12px] font-body font-semibold text-muted mt-[2px]">Active Alerts</div>
        </div>
      </div>

      <div className="mt-[20px] bg-card border border-border rounded-[20px] overflow-hidden shadow-card">
        <div className="px-[20px] py-[18px] border-b border-border">
          <div className="mb-[14px] flex items-center justify-between">
            <div className="text-[14px] font-semibold text-navy">Manage Account</div>
            {!isEditing ? (
              <button
                type="button"
                className="rounded-btn border border-border bg-transparent px-[12px] py-[6px] text-[12px] font-semibold text-navy"
                onClick={startEdit}
              >
                Edit Profile
              </button>
            ) : null}
          </div>
          <div className="grid gap-[10px]">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!isEditing}
              className="w-full rounded-btn border-[1.5px] border-border bg-card px-[15px] py-[11px] text-[14px] text-navy outline-none disabled:bg-[#f8f9fc] disabled:text-muted"
              placeholder="Full name"
            />
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={!isEditing}
              className="w-full rounded-btn border-[1.5px] border-border bg-card px-[15px] py-[11px] text-[14px] text-navy outline-none disabled:bg-[#f8f9fc] disabled:text-muted"
              placeholder="Email"
            />
            {isEditing ? (
              <div className="flex gap-[8px]">
                <button
                  type="button"
                  className="rounded-btn border border-border bg-transparent px-[18px] py-[9px] text-[13px] font-semibold cursor-pointer"
                  onClick={cancelEdit}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="rounded-btn bg-navy text-white px-[18px] py-[9px] text-[13px] font-semibold cursor-pointer w-fit disabled:opacity-60"
                  onClick={saveProfile}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Manage Family Profiles */}
      <div className="mt-[20px] bg-card border border-border rounded-[20px] overflow-hidden shadow-card">
        <div className="px-[20px] py-[18px] border-b border-border">
          <div className="mb-[14px] flex items-center justify-between">
            <div className="text-[14px] font-semibold text-navy">Manage Family Profiles</div>
          </div>
          <div className="grid gap-[10px]">
            {patients.map(p => (
              <div key={p._id || p.id} className="flex items-center justify-between p-[12px] border border-border rounded-btn bg-card">
                 <div>
                    <div className="font-semibold text-[14px] text-navy font-display">{p.name}</div>
                    <div className="text-[12px] text-muted font-body capitalize">{p.relation}</div>
                 </div>
                 <div className="flex gap-[12px]">
                   <button onClick={() => { setEditPatientForm({...p}); setEditPatientOpen(true); }} className="text-primary text-[12px] font-semibold hover:underline cursor-pointer font-body">Edit</button>
                   <button onClick={() => handleDeletePatient(p._id || p.id)} className="text-red text-[12px] font-semibold hover:underline cursor-pointer font-body">Delete</button>
                 </div>
              </div>
            ))}
            {patients.length === 0 && (
              <div className="text-[13px] text-muted text-center py-[10px]">No family profiles found.</div>
            )}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={handleSignOut}
        className="mt-[20px] w-full rounded-btn bg-[rgba(226,75,74,0.08)] border border-[rgba(226,75,74,0.2)] py-[14px] flex items-center justify-center gap-[8px] font-body text-[14px] font-bold text-red cursor-pointer transition-all hover:bg-[rgba(226,75,74,0.12)] active:scale-[0.98]"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <polyline points="16 17 21 12 16 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
        Sign Out
      </button>

      <button
        type="button"
        onClick={async () => {
          if (!window.confirm('Delete your account? This action cannot be undone.')) return;
          try {
            await deleteMe();
            logout();
            localStorage.removeItem('medsync-auth');
            navigate('/login');
          } catch (err) {
            toast.error(err?.response?.data?.message || 'Delete account failed');
          }
        }}
        className="mt-[12px] w-full rounded-btn bg-card border border-border px-[14px] py-[12px] text-[13px] font-body font-bold text-muted cursor-pointer transition-all hover:bg-faint active:scale-[0.98]"
      >
        Delete Account
      </button>

      {/* Edit Patient Modal */}
      {editPatientOpen && editPatientForm && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-[20px] bg-[rgba(15,31,61,0.45)] backdrop-blur">
          <div className="w-full max-w-[420px] rounded-[16px] bg-card p-[26px] relative shadow-modal">
            <div className="font-display text-[18px] font-bold text-navy mb-[16px]">Edit Family Profile</div>
            <div className="space-y-[14px]">
              <div>
                <label className="mb-[7px] block text-[12px] font-semibold tracking-[0.02em] text-navy">Name</label>
                <input value={editPatientForm.name} onChange={e => setEditPatientForm({...editPatientForm, name: e.target.value})} className="w-full rounded-btn border-[1.5px] border-border bg-card px-[15px] py-[11px] text-[14px] text-navy outline-none transition-colors" />
              </div>
              <div>
                <label className="mb-[7px] block text-[12px] font-semibold tracking-[0.02em] text-navy">Relation</label>
                <select value={editPatientForm.relation} onChange={e => setEditPatientForm({...editPatientForm, relation: e.target.value})} className="w-full rounded-btn border-[1.5px] border-border bg-card px-[15px] py-[11px] text-[14px] text-navy outline-none transition-colors">
                  <option value="self">self</option>
                  <option value="mother">mother</option>
                  <option value="father">father</option>
                  <option value="grandmother">grandmother</option>
                  <option value="grandfather">grandfather</option>
                  <option value="spouse">spouse</option>
                  <option value="child">child</option>
                  <option value="other">other</option>
                </select>
              </div>
              <div className="flex gap-[8px] mt-[16px]">
                <button type="button" onClick={() => setEditPatientOpen(false)} className="flex-1 rounded-btn border-[1.5px] border-border bg-card py-[9px] text-[13px] font-body font-semibold text-navy cursor-pointer">Cancel</button>
                <button type="button" onClick={handleEditPatient} className="flex-1 rounded-btn bg-navy text-white border-none py-[12px] text-[14px] font-semibold cursor-pointer active:scale-[0.98]">Save Changes</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

