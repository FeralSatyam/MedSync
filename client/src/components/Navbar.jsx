import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { getPatients } from '../api/patientApi';
import { getMedicinesForPatient } from '../api/medicineApi';
import { getStockStatus } from '../utils/stockUtils';

export default function Navbar({ hasAlerts = false }) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const [alerts, setAlerts] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchAlerts() {
      try {
        const patients = await getPatients();
        let lowStockAlerts = [];
        for (const p of patients) {
          const meds = await getMedicinesForPatient(p._id || p.id);
          meds.forEach(m => {
            const { status, daysLeft } = getStockStatus(m);
            if (status === 'red' || status === 'amber') {
              lowStockAlerts.push({ ...m, patientName: p.name, daysLeft, status });
            }
          });
        }
        if (!cancelled) setAlerts(lowStockAlerts);
      } catch (err) {
        // ignore
      }
    }
    fetchAlerts();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const displayAlerts = hasAlerts || alerts.length > 0;

  const initials = (user?.name || 'MS')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  function handleSignOut() {
    logout();
    localStorage.removeItem('medsync-auth');
    navigate('/login');
  }

  return (
    <header className="sticky top-0 z-[100] flex h-[64px] items-center justify-between border-b border-border bg-card px-[24px]">
      <div className="flex items-center gap-[12px]">
        <div className="flex h-[36px] w-[36px] items-center justify-center">
          <svg width="36" height="36" viewBox="0 0 100 100" fill="none" aria-hidden="true" className="text-[#0d816a]">
            <path d="M20 48 V30 C20 15 40 15 40 30 V48 H20 Z" fill="currentColor" />
            <path d="M20 48 V70 C20 85 40 85 40 70 V48" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
            <path d="M40 52 H47 L51 65 L58 35 L64 75 L69 52 H77" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="82" cy="52" r="4.5" fill="currentColor" />
          </svg>
        </div>
        <div className="font-display text-[18px] font-bold tracking-[-0.3px] text-[#0d816a]">MEDSYNC</div>
      </div>

      <div className="flex items-center gap-[12px]">
        {/* Notification bell */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            className="flex h-[38px] w-[38px] items-center justify-center rounded-[12px] border border-border bg-card cursor-pointer transition-colors hover:bg-faint"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
                stroke="#1a2540"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M13.73 21a2 2 0 0 1-3.46 0"
                stroke="#1a2540"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          {displayAlerts ? (
            <span
              aria-hidden="true"
              className="absolute top-[6px] right-[6px] h-[8px] w-[8px] rounded-full bg-red border-[2px] border-card"
            />
          ) : null}

          {showNotifications && (
            <div className="absolute right-0 mt-[10px] w-[300px] bg-card border border-border rounded-[16px] shadow-card overflow-hidden z-[1000]">
              <div className="px-[16px] py-[12px] border-b border-border bg-faint">
                <div className="text-[13px] font-bold text-navy">Notifications</div>
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                {alerts.length === 0 ? (
                  <div className="p-[16px] text-center text-[13px] text-muted">No new notifications.</div>
                ) : (
                  alerts.map(a => (
                    <div key={a._id} className="p-[12px] border-b border-border hover:bg-faint transition-colors cursor-default">
                      <div className="flex items-start justify-between mb-[4px]">
                        <div className="font-semibold text-navy text-[13px]">{a.name}</div>
                        <div className={`text-[11px] font-bold px-[6px] py-[2px] rounded-full ${a.status === 'red' ? 'bg-[#ffedec] text-red' : 'bg-[#fff5e6] text-amber'}`}>
                          {a.daysLeft} days left
                        </div>
                      </div>
                      <div className="text-[12px] text-muted">For {a.patientName}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User avatar */}
        <div
          className="flex h-[38px] w-[38px] items-center justify-center rounded-[12px] bg-mint font-display text-[12px] font-bold tracking-[0.5px] text-white"
          aria-label="User avatar"
        >
          {initials}
        </div>

        {/* User name */}
        <div className="hidden sm:block text-[13px] font-semibold text-navy font-body ml-1">
          {user?.name}
        </div>

        <button
          type="button"
          onClick={() => navigate('/profile')}
          className="hidden sm:block rounded-[12px] border border-border bg-transparent px-[14px] py-[8px] text-[12px] font-semibold text-muted cursor-pointer transition-all hover:bg-faint hover:text-navy hover:border-navy font-body"
        >
          Profile
        </button>

        {/* Sign out button */}
        <button
          type="button"
          onClick={handleSignOut}
          className="hidden sm:block rounded-[12px] border border-border bg-transparent px-[14px] py-[8px] text-[12px] font-semibold text-muted cursor-pointer transition-all hover:bg-red-light hover:text-red hover:border-red-light font-body"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
