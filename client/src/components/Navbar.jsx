import { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { getPatients } from '../api/patientApi';
import { getNotifications } from '../api/notificationApi';
import { getMedicinesForPatient } from '../api/medicineApi';
import { getStockStatus } from '../utils/stockUtils';

export default function Navbar({ hasAlerts = false }) {
  const rootUser = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const [alerts, setAlerts] = useState([]);
  const [dbNotifications, setDbNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [profilePic, setProfilePic] = useState(null);
  const notifRef = useRef(null);

  const rootUserId = rootUser?.id || rootUser?._id;

  useEffect(() => {
    if (!rootUserId) {
      setProfilePic(null);
      return;
    }
    const savedPic = localStorage.getItem(`medsync_pfp_${rootUserId}`);
    setProfilePic(savedPic || null);
  }, [rootUserId]);

  useEffect(() => {
    let cancelled = false;
    async function fetchAlerts() {
      try {
        const patients = await getPatients();
        let lowStockAlerts = [];
        for (const p of patients) {
          const meds = await getMedicinesForPatient(p._id || p.id);
          meds.forEach((m) => {
            const { status, daysLeft } = getStockStatus(m);
            if (status === 'red' || status === 'amber') {
              lowStockAlerts.push({ ...m, patientName: p.name, daysLeft, status });
            }
          });
        }
        if (!cancelled) setAlerts(lowStockAlerts);
        // also fetch in-app notifications from backend
        try {
          const notifs = await getNotifications();
          if (!cancelled) setDbNotifications(Array.isArray(notifs) ? notifs : []);
        } catch (e) {
          // ignore notification fetch errors
        }
      } catch {
        // ignore
      }
    }
    fetchAlerts();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hasUnreadDb = dbNotifications.some((n) => !n.read);
  const displayAlerts = hasAlerts || alerts.length > 0 || hasUnreadDb;

  const initials = useMemo(
    () =>
      (rootUser?.name || 'MS')
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join(''),
    [rootUser?.name]
  );

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
                {dbNotifications.length === 0 && alerts.length === 0 ? (
                  <div className="p-[16px] text-center text-[13px] text-muted">No new notifications.</div>
                ) : (
                  <>
                    {dbNotifications.map((n) => (
                      <div key={n._id} className="p-[12px] border-b border-border hover:bg-faint transition-colors cursor-default">
                        <div className="flex items-start justify-between mb-[4px]">
                          <div className="font-semibold text-navy text-[13px]">{n.title || n.offerTitle}</div>
                          <div className="flex items-center gap-2">
                            {!n.read ? (
                              <div className="text-[11px] font-bold px-[6px] py-[2px] rounded-full bg-[#ffedec] text-red">New</div>
                            ) : null}
                            <button
                              type="button"
                              onClick={() => navigate(`/place-order?notifId=${n._id}`)}
                              className="text-[12px] px-2 py-1 rounded bg-primary text-white"
                            >
                              Order
                            </button>
                          </div>
                        </div>
                        <div className="text-[12px] text-muted">{n.offerMessage || n.message}</div>
                      </div>
                    ))}

                    {alerts.map((a) => (
                      <div key={a._id} className="p-[12px] border-b border-border hover:bg-faint transition-colors cursor-default">
                        <div className="flex items-start justify-between mb-[4px]">
                          <div className="font-semibold text-navy text-[13px]">{a.name}</div>
                          <div
                            className={`text-[11px] font-bold px-[6px] py-[2px] rounded-full ${a.status === 'red' ? 'bg-[#ffedec] text-red' : 'bg-[#fff5e6] text-amber'}`}
                          >
                            {a.daysLeft} days left
                          </div>
                        </div>
                        <div className="text-[12px] text-muted">For {a.patientName}</div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => navigate('/profile')}
          className="flex items-center gap-[10px] rounded-[12px] border border-border bg-card px-[10px] py-[6px] cursor-pointer transition-colors hover:bg-faint"
          title="Account owner"
        >
          <div
            className="flex h-[32px] w-[32px] shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-mint font-display text-[11px] font-bold tracking-[0.5px] text-white"
            aria-label="Account owner avatar"
          >
            {profilePic ? (
              <img src={profilePic} alt="" className="h-full w-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <div className="hidden sm:block text-left min-w-0">
            <div className="text-[11px] text-muted leading-tight">Account</div>
            <div className="text-[13px] font-semibold text-navy font-body truncate max-w-[140px]">
              {rootUser?.name || 'User'}
            </div>
          </div>
        </button>

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
