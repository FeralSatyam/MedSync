import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import { useAuthStore } from '../store/authStore';
import { getPatients } from '../api/patientApi';
import { getMedicinesForPatient } from '../api/medicineApi';
import { updateMe, deleteMe } from '../api/authApi';

export default function ProfilePage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const login = useAuthStore((s) => s.login);
  const token = useAuthStore((s) => s.token);
  const [stats, setStats] = useState({ totalPatients: 0, totalMedicines: 0, activeAlerts: 0 });
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
        if (!cancelled) setStats({ totalPatients: patients.length, totalMedicines, activeAlerts });
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
        <div className="font-display text-[22px] font-bold text-navy">My Profile</div>
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
    </div>
  );
}

