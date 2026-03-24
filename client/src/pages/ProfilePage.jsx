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
  const [stats, setStats] = useState({ totalPatients: 0, totalMedicines: 0, activeAlerts: 0 });
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');

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
        <div className="bg-bg rounded-[10px] p-[14px] border border-border">
          <div className="font-display text-[26px] font-bold text-navy">{stats.totalPatients}</div>
          <div className="text-[11px] text-muted mt-[2px]">Total Patients</div>
        </div>
        <div className="bg-bg rounded-[10px] p-[14px] border border-border">
          <div className="font-display text-[26px] font-bold text-navy">{stats.totalMedicines}</div>
          <div className="text-[11px] text-muted mt-[2px]">Total Medicines</div>
        </div>
        <div className="bg-bg rounded-[10px] p-[14px] border border-border">
          <div
            className={`font-display text-[26px] font-bold mt-0 ${
              stats.activeAlerts > 0 ? 'text-red' : 'text-green'
            }`}
          >
            {stats.activeAlerts}
          </div>
          <div className="text-[11px] text-muted mt-[2px]">Active Alerts</div>
        </div>
      </div>

      <div className="mt-[20px] bg-card border border-border rounded-[16px] overflow-hidden">
        <div className="px-[18px] py-[15px] border-b border-border">
          <div className="text-[14px] font-semibold text-navy mb-[8px]">Manage Account</div>
          <div className="grid gap-[10px]">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-btn border-[1.5px] border-border bg-card px-[15px] py-[11px] text-[14px] text-navy outline-none"
              placeholder="Full name"
            />
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-btn border-[1.5px] border-border bg-card px-[15px] py-[11px] text-[14px] text-navy outline-none"
              placeholder="Email"
            />
            <button
              type="button"
              className="rounded-btn bg-navy text-white px-[18px] py-[9px] text-[13px] font-semibold cursor-pointer w-fit"
              onClick={async () => {
                try {
                  const res = await updateMe({ name, email });
                  login(res.user, useAuthStore.getState().token);
                  toast.success('Profile updated');
                } catch (err) {
                  toast.error(err?.response?.data?.message || 'Update failed');
                }
              }}
            >
              Save changes
            </button>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={handleSignOut}
        className="mt-[16px] w-full rounded-[10px] bg-[rgba(255,240,240,1)] border border-[rgba(255,204,204,1)] py-[14px] flex items-center justify-center gap-[8px] font-body text-[13px] font-bold text-red cursor-pointer"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="#e84040" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <polyline points="16 17 21 12 16 7" stroke="#e84040" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="21" y1="12" x2="9" y2="12" stroke="#e84040" strokeWidth="2" strokeLinecap="round" />
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
        className="mt-[10px] w-full rounded-[10px] bg-card border border-red px-[14px] py-[12px] text-[13px] font-bold text-red cursor-pointer"
      >
        Delete Account
      </button>
    </div>
  );
}

